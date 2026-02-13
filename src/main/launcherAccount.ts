import { safeStorage, shell } from "electron";
import fs from "node:fs";
import fetch from "node-fetch";
import http from "node:http";
import path from "node:path";
import { getLauncherAccountsPath, getLauncherSessionPath } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";

type LauncherAccount = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  subscriptionTier?: string | null;
};

type LauncherAccountDb = {
  activeAccountId: string | null;
  accounts: LauncherAccount[];
  updatedAt: number;
};

type LauncherSession = {
  accessToken: string;
  refreshToken?: string;
  accountId?: string | null;
  updatedAt: number;
};

export type LauncherAccountState = {
  configured: boolean;
  signedIn: boolean;
  activeAccountId: string | null;
  activeAccount: LauncherAccount | null;
  accounts: LauncherAccount[];
  updatedAt: number | null;
  error: string | null;
};

type AuthResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  account?: unknown;
  user?: unknown;
  accounts?: unknown;
  activeAccountId?: string;
};

type GoogleDesktopStartResponse = {
  authUrl: string;
  state: string;
  expiresIn: number;
};

let memorySessionFallback: LauncherSession | null = null;

function getApiBase(): string | null {
  const raw = String(
    process.env.FISHBATTERY_ACCOUNT_API ||
      process.env.FISHBATTERY_ACCOUNT_API_URL ||
      "https://fishbattery-auth-api-production.up.railway.app"
  ).trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

function getApiPath(envKey: string, fallback: string): string {
  const raw = String(process.env[envKey] || "").trim();
  if (!raw) return fallback;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

const PATH_REGISTER = getApiPath("FISHBATTERY_ACCOUNT_REGISTER_PATH", "/v1/auth/register");
const PATH_LOGIN = getApiPath("FISHBATTERY_ACCOUNT_LOGIN_PATH", "/v1/auth/login");
const PATH_LOGOUT = getApiPath("FISHBATTERY_ACCOUNT_LOGOUT_PATH", "/v1/auth/logout");
const PATH_SESSION = getApiPath("FISHBATTERY_ACCOUNT_SESSION_PATH", "/v1/auth/session");
const PATH_SWITCH = getApiPath("FISHBATTERY_ACCOUNT_SWITCH_PATH", "/v1/auth/switch");
const PATH_GOOGLE_DESKTOP_START = getApiPath(
  "FISHBATTERY_ACCOUNT_GOOGLE_DESKTOP_START_PATH",
  "/v1/auth/google/desktop/start"
);
const PATH_GOOGLE_DESKTOP_COMPLETE = getApiPath(
  "FISHBATTERY_ACCOUNT_GOOGLE_DESKTOP_COMPLETE_PATH",
  "/v1/auth/google/desktop/complete"
);

function readDb(): LauncherAccountDb {
  return readJsonFile<LauncherAccountDb>(getLauncherAccountsPath(), {
    activeAccountId: null,
    accounts: [],
    updatedAt: Date.now()
  });
}

function writeDb(db: LauncherAccountDb): void {
  writeJsonFile(getLauncherAccountsPath(), db);
}

function normalizeAccount(raw: unknown): LauncherAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const id = String(src.id ?? src.accountId ?? src.userId ?? "").trim();
  const email = String(src.email ?? "").trim();
  const displayName = String(src.displayName ?? src.username ?? src.name ?? email ?? "").trim();
  if (!id || !email || !displayName) return null;
  const avatarUrl = src.avatarUrl == null ? null : String(src.avatarUrl);
  const subscriptionTier = src.subscriptionTier == null ? null : String(src.subscriptionTier);
  return { id, email, displayName, avatarUrl, subscriptionTier };
}

function normalizeAccounts(rawAccounts: unknown, rawSingle?: unknown): LauncherAccount[] {
  const list = Array.isArray(rawAccounts) ? rawAccounts : [];
  const fromList = list.map((entry) => normalizeAccount(entry)).filter((x): x is LauncherAccount => !!x);
  const single = normalizeAccount(rawSingle);
  const merged = single ? [single, ...fromList] : fromList;
  const dedup = new Map<string, LauncherAccount>();
  for (const item of merged) dedup.set(item.id, item);
  return Array.from(dedup.values());
}

function saveSession(session: LauncherSession | null): void {
  const sessionPath = getLauncherSessionPath();
  if (!session) {
    memorySessionFallback = null;
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { force: true });
    return;
  }

  memorySessionFallback = session;
  const payload = Buffer.from(JSON.stringify(session), "utf8");
  if (!safeStorage.isEncryptionAvailable()) return;

  const encrypted = safeStorage.encryptString(payload.toString("utf8"));
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  fs.writeFileSync(sessionPath, encrypted);
}

function loadSession(): LauncherSession | null {
  const sessionPath = getLauncherSessionPath();
  if (fs.existsSync(sessionPath) && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = fs.readFileSync(sessionPath);
      const decrypted = safeStorage.decryptString(encrypted);
      const parsed = JSON.parse(decrypted) as LauncherSession;
      if (!parsed?.accessToken) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return memorySessionFallback;
}

async function requestAuth(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
    accessToken?: string;
  }
): Promise<AuthResponse> {
  const base = getApiBase();
  if (!base) throw new Error("Launcher account API is not configured.");
  const headers: Record<string, string> = {
    "User-Agent": "FishbatteryLauncher/0.2.0",
    Accept: "application/json"
  };
  if (init.body) headers["Content-Type"] = "application/json";
  if (init.accessToken) headers.Authorization = `Bearer ${init.accessToken}`;

  const res = await fetch(`${base}${path}`, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      (payload && typeof payload === "object" && "message" in payload && String((payload as any).message)) ||
      `Account API returned ${res.status}`;
    throw new Error(msg);
  }
  if (!payload || typeof payload !== "object") return {};
  return payload as AuthResponse;
}

function stateFromDb(db: LauncherAccountDb, error: string | null = null): LauncherAccountState {
  const active =
    db.accounts.find((entry) => entry.id === db.activeAccountId) ??
    (db.accounts.length ? db.accounts[0] : null);
  return {
    configured: !!getApiBase(),
    signedIn: !!active,
    activeAccountId: active?.id ?? null,
    activeAccount: active,
    accounts: db.accounts,
    updatedAt: db.updatedAt || null,
    error
  };
}

function applyAuthResponse(payload: AuthResponse, fallbackAccountId?: string | null): LauncherAccountState {
  const token = String(payload.accessToken || payload.token || "").trim();
  if (!token) throw new Error("Account API did not return an access token.");

  const accounts = normalizeAccounts(payload.accounts, payload.account ?? payload.user);
  const activeAccountId =
    String(payload.activeAccountId || fallbackAccountId || (accounts[0]?.id ?? "")).trim() || null;

  const db: LauncherAccountDb = {
    activeAccountId,
    accounts,
    updatedAt: Date.now()
  };
  writeDb(db);
  saveSession({
    accessToken: token,
    refreshToken: payload.refreshToken ? String(payload.refreshToken) : undefined,
    accountId: activeAccountId,
    updatedAt: Date.now()
  });
  return stateFromDb(db);
}

export async function registerLauncherAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<LauncherAccountState> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  const normalizedDisplayName = String(displayName || "").trim();
  if (!normalizedEmail || !normalizedPassword || !normalizedDisplayName) {
    throw new Error("Email, password, and display name are required.");
  }

  const response = await requestAuth(PATH_REGISTER, {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      displayName: normalizedDisplayName
    }
  });
  return applyAuthResponse(response);
}

export async function loginLauncherAccount(email: string, password: string): Promise<LauncherAccountState> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) throw new Error("Email and password are required.");

  const response = await requestAuth(PATH_LOGIN, {
    method: "POST",
    body: { email: normalizedEmail, password: normalizedPassword }
  });
  return applyAuthResponse(response);
}

export async function switchLauncherAccount(accountId: string): Promise<LauncherAccountState> {
  const normalized = String(accountId || "").trim();
  if (!normalized) throw new Error("Account ID is required.");

  const session = loadSession();
  if (!session?.accessToken) throw new Error("Not signed in.");

  const response = await requestAuth(PATH_SWITCH, {
    method: "POST",
    body: { accountId: normalized },
    accessToken: session.accessToken
  });
  return applyAuthResponse(response, normalized);
}

export async function logoutLauncherAccount(): Promise<LauncherAccountState> {
  const session = loadSession();
  if (session?.accessToken && getApiBase()) {
    try {
      await requestAuth(PATH_LOGOUT, { method: "POST", accessToken: session.accessToken });
    } catch {
      // Ignore logout API failures and clear local state anyway.
    }
  }
  saveSession(null);
  const db: LauncherAccountDb = { activeAccountId: null, accounts: [], updatedAt: Date.now() };
  writeDb(db);
  return stateFromDb(db);
}

export async function getLauncherAccountState(): Promise<LauncherAccountState> {
  const base = getApiBase();
  if (!base) {
    return {
      configured: false,
      signedIn: false,
      activeAccountId: null,
      activeAccount: null,
      accounts: [],
      updatedAt: null,
      error: "Launcher account API is not configured."
    };
  }

  const session = loadSession();
  if (!session?.accessToken) return stateFromDb(readDb());

  try {
    const response = await requestAuth(PATH_SESSION, {
      method: "GET",
      accessToken: session.accessToken
    });
    return applyAuthResponse(response, session.accountId ?? null);
  } catch (err: unknown) {
    saveSession(null);
    const db: LauncherAccountDb = { activeAccountId: null, accounts: [], updatedAt: Date.now() };
    writeDb(db);
    return stateFromDb(db, String((err as Error)?.message || err));
  }
}

export async function loginLauncherAccountWithGoogleDesktop(): Promise<LauncherAccountState> {
  const callbackPath = "/";
  const callbackResult = await new Promise<{
    code?: string;
    state?: string;
    error?: string;
    redirectUri: string;
  }>((resolve, reject) => {
    let settled = false;
    let timeout: NodeJS.Timeout | null = null;
    const finishResolve = (value: { code?: string; state?: string; error?: string; redirectUri: string }) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve(value);
    };
    const finishReject = (err: Error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      reject(err);
    };
    const server = http.createServer((req, res) => {
        const reqUrl = req.url || "/";
        const host = req.headers.host || "";
        const parsed = new URL(reqUrl, `http://${host}`);
        if (parsed.pathname === "/favicon.ico") {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (parsed.pathname !== callbackPath) {
          res.statusCode = 404;
          res.end("Not found");
        return;
      }
      const code = parsed.searchParams.get("code") || undefined;
      const state = parsed.searchParams.get("state") || undefined;
      const error = parsed.searchParams.get("error") || undefined;
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<h3>Google sign-in complete.</h3><p>You can close this tab and return to Fishbattery Launcher.</p>");
      const address = server.address();
      server.close();
      if (!address || typeof address === "string") {
        finishReject(new Error("Could not determine callback server address."));
        return;
      }
      finishResolve({
        code,
        state,
        error,
        redirectUri: `http://127.0.0.1:${address.port}${callbackPath}`
      });
    });

    server.on("error", (err) => finishReject(err as Error));

    server.listen(0, "127.0.0.1", async () => {
      try {
        const address = server.address();
        if (!address || typeof address === "string") {
          server.close();
          finishReject(new Error("Could not start callback server."));
          return;
        }
        const redirectUri = `http://127.0.0.1:${address.port}${callbackPath}`;
        const started = await requestAuth(PATH_GOOGLE_DESKTOP_START, {
          method: "POST",
          body: { redirectUri }
        });
        const authUrl = String((started as any).authUrl || "").trim();
        const state = String((started as any).state || "").trim();
        const expiresIn = Number((started as any).expiresIn || 300);
        if (!authUrl || !state) {
          server.close();
          finishReject(new Error("Google auth start failed."));
          return;
        }

        const opened = await shell.openExternal(authUrl);
        if (opened) {
          server.close();
          finishReject(new Error(`Failed to open browser: ${opened}`));
          return;
        }

        timeout = setTimeout(() => {
          try {
            server.close();
          } catch {
            // ignore
          }
          finishReject(new Error("Google sign-in timed out. Please try again."));
        }, Math.max(60, expiresIn) * 1000);
      } catch (err) {
        server.close();
        finishReject(err as Error);
      }
    });
  });

  if (callbackResult.error) {
    throw new Error(`Google sign-in failed: ${callbackResult.error}`);
  }
  if (!callbackResult.code || !callbackResult.state) {
    throw new Error("Google sign-in did not return an authorization code.");
  }

  const completed = await requestAuth(PATH_GOOGLE_DESKTOP_COMPLETE, {
    method: "POST",
    body: {
      code: callbackResult.code,
      state: callbackResult.state,
      redirectUri: callbackResult.redirectUri
    }
  });
  return applyAuthResponse(completed);
}
