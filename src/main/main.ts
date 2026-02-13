import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerIpc } from "./ipc";
import { CANONICAL_FOLDER } from "./paths";
import { initUpdater } from "./updater";

const userDataSuffix = String(process.env.FISHBATTERY_USERDATA_SUFFIX || "").trim();
const userDataFolder = userDataSuffix ? `${CANONICAL_FOLDER}-${userDataSuffix}` : CANONICAL_FOLDER;
app.setPath("userData", path.join(app.getPath("appData"), userDataFolder));
const localAppDataRoot = process.env.LOCALAPPDATA || app.getPath("appData");
app.setPath("sessionData", path.join(localAppDataRoot, userDataFolder, "session"));

const allowMultiInstance =
  String(process.env.FISHBATTERY_ALLOW_MULTI_INSTANCE || "").trim() === "1";
if (!allowMultiInstance) {
  const singleInstanceLock = app.requestSingleInstanceLock();
  if (!singleInstanceLock) {
    app.quit();
  }
}

let win: BrowserWindow | null = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true
    }
  });

  const devUrl =
    process.env.VITE_DEV_SERVER_URL ||
    process.env.ELECTRON_RENDERER_URL ||
    "http://localhost:5173/";

  if (
    process.env.NODE_ENV === "development" ||
    process.env.VITE_DEV_SERVER_URL ||
    process.env.ELECTRON_RENDERER_URL
  ) {
    await win.loadURL(devUrl);
    return;
  }

  await win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(async () => {
  // IPC handlers (accounts, versions, mods, packs, local uploads, launch)
  registerIpc();
  await createWindow();
  if (win) initUpdater(win);
});

app.on("second-instance", () => {
  if (allowMultiInstance) return;
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
