import { getAccountsPath } from "./paths";
import { getDataRoot } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";
import { Auth } from "msmc";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { nativeImage } from "electron";

export type StoredAccount = {
  id: string; // UUID
  username: string;

  // Full object returned by msmc's mc.mclc()
  mclcAuth: any;

  // (Optional) stored for debugging/legacy; not used for launch anymore
  accessToken?: string;

  addedAt: number;
};

type AccountsDb = {
  activeId: string | null;
  accounts: StoredAccount[];
};

function loadDb(): AccountsDb {
  return readJsonFile(getAccountsPath(), { activeId: null, accounts: [] });
}

function saveDb(db: AccountsDb) {
  writeJsonFile(getAccountsPath(), db);
}

export function listAccounts() {
  return loadDb();
}

export function setActiveAccount(id: string | null) {
  const db = loadDb();
  db.activeId = id;
  saveDb(db);
  return db;
}

export function getAccountById(id: string | null | undefined): StoredAccount | null {
  if (!id) return null;
  const db = loadDb();
  return db.accounts.find((a) => a.id === id) ?? null;
}

export function getActiveAccount(): StoredAccount | null {
  const db = loadDb();
  return db.accounts.find((a) => a.id === db.activeId) ?? null;
}

function pickMsmcFrameworkOrder(): Array<"raw" | "electron"> {
  // Microsoft sometimes blocks embedded/embedded-like auth.
  // In that case, MSMC's "raw" flow (system browser) is much more reliable.
  //
  // Allow override for debugging:
  //   set MSMC_FRAMEWORK=electron  (or raw)
  const override = (process.env.MSMC_FRAMEWORK || "").toLowerCase();
  if (override === "electron") return ["electron", "raw"];
  if (override === "raw") return ["raw", "electron"];

  // Default: try raw first, then electron.
  return ["raw", "electron"];
}

function asHelpfulAuthError(err: unknown, framework: string) {
  const msg = String((err as any)?.message ?? err ?? "Unknown error");
  // Common Microsoft embedded/webview block message (the screenshot you sent).
  if (/different device|authentication method|error\s*400/i.test(msg)) {
    return (
      `Microsoft sign-in was blocked in the ${framework} flow.\n` +
      `Fix: use the system-browser login flow (MSMC "raw").\n\n` +
      `Details: ${msg}`
    );
  }
  return `Microsoft sign-in failed in the ${framework} flow: ${msg}`;
}

/**
 * Microsoft login via MSMC.
 *
 * IMPORTANT:
 * - We REQUIRE a real Minecraft Java profile.
 * - We prefer MSMC "raw" because Microsoft can block embedded logins (error 400).
 */
export async function addMicrosoftAccountInteractive(): Promise<StoredAccount> {
  const authManager = new Auth("select_account");

  let lastErr: unknown = null;
  for (const framework of pickMsmcFrameworkOrder()) {
    try {
      const xboxManager: any = await authManager.launch(framework);
      const mc: any = await xboxManager.getMinecraft();

      // MUST have a real MC profile
      const uuid = mc?.profile?.id ?? mc?.profile?.uuid ?? null;
      const name = mc?.profile?.name ?? null;

      if (!uuid || !name) {
        throw new Error(
          "Microsoft login succeeded, but no Minecraft profile was returned.\n" +
            "This usually means the account does not own Minecraft Java or the profile fetch failed."
        );
      }

      const mclcAuth = typeof mc.mclc === "function" ? mc.mclc() : mc.mclc;
      if (!mclcAuth || typeof mclcAuth !== "object") {
        throw new Error("MSMC did not return MCLC auth (mc.mclc()).");
      }

      // Hard requirement: meta.xuid must exist for proper MSA online (Realms, etc.)
      const xuid = mclcAuth?.meta?.xuid ?? null;
      if (!xuid) {
        throw new Error("MSMC mclc auth missing meta.xuid. Re-login.");
      }

      const account: StoredAccount = {
        id: uuid,
        username: name,
        mclcAuth,
        accessToken: mclcAuth.access_token ?? mclcAuth.accessToken,
        addedAt: Date.now()
      };

      const db = loadDb();
      db.accounts = db.accounts.filter((a) => a.id !== account.id);
      db.accounts.unshift(account);
      db.activeId = account.id;
      saveDb(db);

      return account;
    } catch (e) {
      lastErr = e;
      // If electron is blocked, raw is usually the fix; keep looping.
    }
  }

  throw new Error(asHelpfulAuthError(lastErr, "raw/electron"));
}

export function removeAccount(id: string) {
  const db = loadDb();
  db.accounts = db.accounts.filter((a) => a.id !== id);
  if (db.activeId === id) db.activeId = db.accounts[0]?.id ?? null;
  saveDb(db);
}

function avatarCacheDir() {
  return path.join(getDataRoot(), "account-avatars");
}

function avatarPathFor(id: string) {
  return path.join(avatarCacheDir(), `${String(id || "").replace(/[^a-zA-Z0-9-]/g, "")}.png`);
}

function readAvatarDataUrl(p: string): string | null {
  try {
    if (!fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    if (!buf.length) return null;
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchAvatarToCache(uuid: string, username: string, outPath: string) {
  const compact = String(uuid || "").replace(/-/g, "");
  if (!compact) throw new Error("Account UUID missing");
  const safeName = String(username || "").trim();
  const urls = [
    `https://crafatar.com/avatars/${encodeURIComponent(compact)}?size=128&overlay`,
    `https://mc-heads.net/avatar/${encodeURIComponent(compact)}/128`,
    safeName ? `https://mc-heads.net/avatar/${encodeURIComponent(safeName)}/128` : ""
  ].filter(Boolean);

  let lastErr: string | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "FishbatteryLauncher/0.2.1" } });
      if (!res.ok) {
        lastErr = `${url} -> ${res.status}`;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length) {
        lastErr = `${url} -> empty`;
        continue;
      }
      const img = nativeImage.createFromBuffer(buf);
      if (img.isEmpty()) {
        lastErr = `${url} -> decode failed`;
        continue;
      }
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, img.resize({ width: 128, height: 128, quality: "best" }).toPNG());
      return;
    } catch (e: any) {
      lastErr = `${url} -> ${String(e?.message ?? e)}`;
    }
  }

  throw new Error(`Avatar fetch failed (${lastErr || "unknown"})`);
}

export async function getAccountAvatarDataUrl(id: string, refresh = false): Promise<string | null> {
  const account = getAccountById(id);
  if (!account?.id) return null;
  const p = avatarPathFor(account.id);

  const cached = readAvatarDataUrl(p);
  if (!refresh) return cached;

  try {
    await fetchAvatarToCache(account.id, account.username, p);
  } catch {
    // best effort: fall back to cached value when API is unavailable
  }

  return readAvatarDataUrl(p) || cached;
}
