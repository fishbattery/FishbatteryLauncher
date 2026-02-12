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

let initialized = false;
let mainWindow: BrowserWindow | null = null;

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

export function initUpdater(win: BrowserWindow) {
  mainWindow = win;

  if (initialized) {
    emitState();
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  const channel = (process.env.UPDATE_CHANNEL || "stable").toLowerCase();
  autoUpdater.allowPrerelease = channel !== "stable";
  if (channel !== "stable") {
    autoUpdater.channel = channel;
  }

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
