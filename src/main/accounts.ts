import { getAccountsPath } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";
import { Auth } from "msmc";

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
