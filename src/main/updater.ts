import { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

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

let state: UpdaterState = {
  status: "idle",
  currentVersion: autoUpdater.currentVersion.version,
  message: "Updates not checked yet.",
  updatedAt: Date.now()
};

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

function normalizeChannel(value: string | null | undefined): UpdateChannel {
  const v = String(value ?? "").toLowerCase();
  return v === "beta" ? "beta" : "stable";
}

function applyUpdateChannel(channel: UpdateChannel) {
  updateChannel = channel;
  autoUpdater.allowPrerelease = channel === "beta";
  autoUpdater.channel = channel;
}

export function initUpdater(win: BrowserWindow) {
  mainWindow = win;

  if (initialized) {
    emitState();
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  applyUpdateChannel(normalizeChannel(process.env.UPDATE_CHANNEL));

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
  await autoUpdater.checkForUpdates();
  return true;
}

export async function downloadUpdate() {
  await autoUpdater.downloadUpdate();
  return true;
}

export function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall();
  return true;
}
