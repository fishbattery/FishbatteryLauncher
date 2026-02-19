import { BrowserWindow, app } from "electron";
import { autoUpdater } from "electron-updater";
import fetch from "node-fetch";

// Renderer-facing updater lifecycle states.
export type UpdaterStatus =
  | "idle"
  | "checking"
  | "update-available"
  | "up-to-date"
  | "downloading"
  | "downloaded"
  | "error";

export type UpdaterState = {
  status: UpdaterStatus;
  currentVersion: string;
  latestVersion?: string;
  progressPercent?: number;
  message?: string;
  updatedAt: number;
};

export type UpdateChannel = "stable" | "beta";

let initialized = false;
let mainWindow: BrowserWindow | null = null;
let updateChannel: UpdateChannel = "stable";

// In-memory source of truth for updater status used by IPC broadcasts.
let state: UpdaterState = {
  status: "idle",
  currentVersion: autoUpdater.currentVersion.version,
  message: "Updates not checked yet.",
  updatedAt: Date.now()
};

type ReleaseAsset = { name: string; browser_download_url: string };
type GithubRelease = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
  html_url?: string;
};

const UPDATE_REPO_OWNER = process.env.UPDATE_REPO_OWNER || "fishbatteryapp";
const UPDATE_REPO_NAME = process.env.UPDATE_REPO_NAME || "FishbatteryLauncher";
const UPDATE_UA = `FishbatteryLauncher/${app.getVersion()} updater`;

// Push current state snapshot to renderer listeners.
function emitState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("updater:event", state);
}

function setState(patch: Partial<UpdaterState>) {
  state = {
    ...state,
    ...patch,
    currentVersion: autoUpdater.currentVersion.version,
    updatedAt: Date.now()
  };
  emitState();
}

// Normalize env/input channel values to the supported enum.
function normalizeChannel(value: string | null | undefined): UpdateChannel {
  const v = String(value ?? "").toLowerCase();
  return v === "beta" ? "beta" : "stable";
}

function applyUpdateChannel(channel: UpdateChannel) {
  updateChannel = channel;
  autoUpdater.allowPrerelease = channel === "beta";
  autoUpdater.channel = channel;
}

// Small helper used for GitHub API calls with consistent headers/errors.
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UPDATE_UA,
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) {
    throw new Error(`Release metadata request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function hasExpectedAssets(assets: ReleaseAsset[]) {
  const names = new Set((assets || []).map((x) => String(x?.name || "").toLowerCase()));
  const hasLatestYml = names.has("latest.yml");
  const hasBlockMap = Array.from(names).some((n) => n.endsWith(".exe.blockmap"));
  const hasInstaller = Array.from(names).some((n) => /^fishbattery-launcher-.*\.exe$/i.test(n));
  return { hasLatestYml, hasInstaller, hasBlockMap };
}

// Resolve the release feed entry for the chosen channel.
async function resolveReleaseForChannel(channel: UpdateChannel): Promise<GithubRelease> {
  const base = `https://api.github.com/repos/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;
  if (channel === "stable") {
    return fetchJson<GithubRelease>(`${base}/releases/latest`);
  }

  const all = await fetchJson<GithubRelease[]>(`${base}/releases?per_page=20`);
  const beta = (all || []).find((r) => !r.draft && r.prerelease);
  if (!beta) {
    throw new Error("No beta pre-release found for selected channel");
  }
  return beta;
}

// Preflight release assets before invoking electron-updater to avoid silent failures.
async function validateChannelArtifacts(channel: UpdateChannel) {
  const release = await resolveReleaseForChannel(channel);
  const assets = hasExpectedAssets(release.assets || []);
  if (!assets.hasLatestYml || !assets.hasInstaller || !assets.hasBlockMap) {
    const missing = [
      !assets.hasLatestYml ? "latest.yml" : null,
      !assets.hasInstaller ? "installer .exe" : null,
      !assets.hasBlockMap ? "installer blockmap" : null
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Release artifact mismatch for ${channel} channel (tag ${release.tag_name}). Missing: ${missing}.`
    );
  }

  return {
    tag: release.tag_name,
    url: release.html_url || "",
    prerelease: !!release.prerelease
  };
}

export function initUpdater(win: BrowserWindow) {
  mainWindow = win;

  if (initialized) {
    emitState();
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Respect selected channel at startup (stable by default).
  applyUpdateChannel(normalizeChannel(process.env.UPDATE_CHANNEL));

  // Map electron-updater events into our renderer-consumable state model.
  autoUpdater.on("checking-for-update", () => {
    setState({ status: "checking", message: "Checking for updates...", progressPercent: undefined });
  });

  autoUpdater.on("update-available", (info) => {
    setState({
      status: "update-available",
      latestVersion: info.version,
      message: `Update available: v${info.version}`,
      progressPercent: 0
    });
  });

  autoUpdater.on("update-not-available", () => {
    setState({
      status: "up-to-date",
      latestVersion: autoUpdater.currentVersion.version,
      message: "You are up to date.",
      progressPercent: undefined
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    setState({
      status: "downloading",
      progressPercent: progress.percent,
      message: `Downloading update... ${progress.percent.toFixed(1)}%`
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setState({
      status: "downloaded",
      latestVersion: info.version,
      progressPercent: 100,
      message: `Update v${info.version} downloaded. Restart to install.`
    });
  });

  autoUpdater.on("error", (err) => {
    const message = String(err?.message ?? err ?? "Unknown updater error");
    setState({ status: "error", message, progressPercent: undefined });
  });

  initialized = true;
}

export function getUpdaterState(): UpdaterState {
  return state;
}

export function getUpdateChannel(): UpdateChannel {
  return updateChannel;
}

export function setUpdateChannel(channel: UpdateChannel) {
  applyUpdateChannel(channel);
  setState({
    message: `Update channel set to ${channel}.`,
    progressPercent: undefined
  });
  return updateChannel;
}

export async function checkForUpdates() {
  // Dev builds do not have update metadata/signatures; avoid false error noise.
  if (!app.isPackaged) {
    setState({
      status: "idle",
      message: "Update checks are disabled in development builds.",
      progressPercent: undefined
    });
    return false;
  }
  try {
    // Validate artifacts first so UI can show actionable errors.
    const checked = await validateChannelArtifacts(updateChannel);
    setState({
      status: "checking",
      message: `Checking ${updateChannel} channel (tag ${checked.tag})...`,
      progressPercent: undefined
    });
  } catch (err: any) {
    setState({
      status: "error",
      message: String(err?.message ?? err),
      progressPercent: undefined
    });
    return false;
  }
  await autoUpdater.checkForUpdates();
  return true;
}

export async function downloadUpdate() {
  // Dev builds intentionally skip real updater downloads.
  if (!app.isPackaged) {
    setState({
      status: "idle",
      message: "Update downloads are disabled in development builds.",
      progressPercent: undefined
    });
    return false;
  }
  try {
    // Keep download path guarded by the same artifact checks.
    await validateChannelArtifacts(updateChannel);
  } catch (err: any) {
    setState({
      status: "error",
      message: String(err?.message ?? err),
      progressPercent: undefined
    });
    return false;
  }
  await autoUpdater.downloadUpdate();
  return true;
}

export function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall();
  return true;
}
