import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { listAllVersions } from "./versions";
import {
  addMicrosoftAccountInteractive,
  listAccounts,
  removeAccount,
  setActiveAccount
} from "./accounts";
import {
  createInstance,
  listInstances,
  removeInstance,
  setActiveInstance,
  updateInstance,
  duplicateInstance,
  getInstanceDir
} from "./instances";
import { listMods, refreshModsForInstance, setModEnabled } from "./mods";
import { listPacks, refreshPacksForInstance, setPackEnabled } from "./packs";
import { pickFabricLoader } from "./fabric";
import { installFabricVersion } from "./fabricInstall";
import { installVanillaVersion } from "./vanillaInstall";
import { launchInstance, isInstanceRunning, stopInstance } from "./launch";
import type { LaunchRuntimePrefs } from "./launch";
import { registerContentIpc } from "./content";
import { exportDiagnosticsZip } from "./diagnostics";
import { exportInstanceToZip, importInstanceFromZip } from "./instanceTransfer";
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateChannel,
  getUpdaterState,
  quitAndInstallUpdate,
  setUpdateChannel
} from "./updater";

export function registerIpc() {
  // ---------- Instances ----------
  ipcMain.handle("instances:list", async () => listInstances());

  ipcMain.handle("instances:create", async (_e, cfg) => {
    if (!cfg) throw new Error("instances:create: cfg missing");
    return createInstance(cfg);
  });

  ipcMain.handle("instances:update", async (_e, id: string, patch: any) => {
    if (!id) throw new Error("instances:update: id missing");
    if (!patch) patch = {};
    return updateInstance(id, patch);
  });

  ipcMain.handle("instances:remove", async (_e, id: string) => {
    if (!id) throw new Error("instances:remove: id missing");
    return removeInstance(id);
  });

  ipcMain.handle("instances:setActive", async (_e, id: string | null) => {
    return setActiveInstance(id ?? null);
  });

  ipcMain.handle("instances:duplicate", async (_e, id: string) => {
    if (!id) throw new Error("instances:duplicate: id missing");
    return duplicateInstance(id);
  });

  ipcMain.handle("instances:openFolder", async (_e, id: string) => {
    if (!id) throw new Error("instances:openFolder: id missing");
    return shell.openPath(getInstanceDir(id));
  });

  ipcMain.handle("instances:export", async (e, id: string) => {
    if (!id) throw new Error("instances:export: id missing");
    const db = listInstances();
    const inst = db.instances.find((x) => x.id === id);
    if (!inst) throw new Error("instances:export: instance not found");

    const owner = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const defaultPath = path.join(
      app.getPath("downloads"),
      `${String(inst.name || "instance").replace(/[<>:\"/\\|?*\x00-\x1F]/g, "_")}.zip`
    );

    const picked = await dialog.showSaveDialog(owner, {
      title: "Export Instance",
      defaultPath,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    });
    if (picked.canceled || !picked.filePath) return { ok: false as const, canceled: true as const };

    const out = exportInstanceToZip(id, picked.filePath);
    return { ok: true as const, canceled: false as const, path: out };
  });

  ipcMain.handle("instances:import", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const picked = await dialog.showOpenDialog(owner, {
      title: "Import Instance",
      properties: ["openFile"],
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    });

    if (picked.canceled || !picked.filePaths?.length) {
      return { ok: false as const, canceled: true as const };
    }

    const imported = importInstanceFromZip(picked.filePaths[0]);
    return { ok: true as const, canceled: false as const, instance: imported };
  });

  // ---------- Accounts ----------
  ipcMain.handle("accounts:list", async () => listAccounts());
  ipcMain.handle("accounts:add", async () => addMicrosoftAccountInteractive());

  ipcMain.handle("accounts:remove", async (_e, id: string) => {
    if (!id) throw new Error("accounts:remove: id missing");
    return removeAccount(id);
  });

  ipcMain.handle("accounts:setActive", async (_e, id: string | null) => {
    return setActiveAccount(id ?? null);
  });

  // ---------- Versions ----------
  ipcMain.handle("versions:list", async () => listAllVersions());

  // ---------- Fabric ----------
  ipcMain.handle("fabric:pickLoader", async (_e, mcVersion: string) => {
    if (!mcVersion) throw new Error("fabric:pickLoader: mcVersion missing");
    return pickFabricLoader(mcVersion);
  });

  ipcMain.handle(
    "fabric:install",
    async (_e, instanceId: string, mcVersion: string, loaderVersion: string) => {
      if (!instanceId) throw new Error("fabric:install: instanceId missing");
      if (!mcVersion) throw new Error("fabric:install: mcVersion missing");
      if (!loaderVersion) throw new Error("fabric:install: loaderVersion missing");
      return installFabricVersion(instanceId, mcVersion, loaderVersion);
    }
  );

  // ---------- Mods ----------
  ipcMain.handle("mods:list", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("mods:list: instanceId missing");
    return listMods(instanceId);
  });

  ipcMain.handle("mods:refresh", async (_e, instanceId: string, mcVersion?: string) => {
    if (!instanceId) throw new Error("mods:refresh: instanceId missing");

    let version = mcVersion;
    let loader: "fabric" | "vanilla" | undefined = "fabric";

    if (!version) {
      const db = listInstances();
      const inst = db.instances.find((x: any) => x.id === instanceId);
      version = inst?.mcVersion;
      loader = inst?.loader;
    }

    if (!version) throw new Error("mods:refresh: mcVersion missing");
    if (loader !== "fabric") throw new Error(`mods:refresh: unsupported loader ${loader}`);

    return refreshModsForInstance({
      instanceId,
      mcVersion: version,
      loader: "fabric"
    });
  });

  ipcMain.handle("mods:setEnabled", async (_e, instanceId: string, modId: string, enabled: boolean) => {
    if (!instanceId) throw new Error("mods:setEnabled: instanceId missing");
    if (!modId) throw new Error("mods:setEnabled: modId missing");
    return setModEnabled(instanceId, modId, enabled);
  });

  // ---------- Packs (recommended resourcepacks/shaderpacks) ----------
  ipcMain.handle("packs:list", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("packs:list: instanceId missing");
    return listPacks(instanceId);
  });

  ipcMain.handle("packs:refresh", async (_e, instanceId: string, mcVersion?: string) => {
    if (!instanceId) throw new Error("packs:refresh: instanceId missing");

    let version = mcVersion;
    if (!version) {
      const db = listInstances();
      const inst = db.instances.find((x: any) => x.id === instanceId);
      version = inst?.mcVersion;
    }
    if (!version) throw new Error("packs:refresh: mcVersion missing");

    return refreshPacksForInstance({ instanceId, mcVersion: version });
  });

  ipcMain.handle("packs:setEnabled", async (_e, instanceId: string, packId: string, enabled: boolean) => {
    if (!instanceId) throw new Error("packs:setEnabled: instanceId missing");
    if (!packId) throw new Error("packs:setEnabled: packId missing");
    return setPackEnabled(instanceId, packId, enabled);
  });

  // ---------- Vanilla ----------
  ipcMain.handle("vanilla:install", async (_e, mcVersion: string) => {
    if (!mcVersion) throw new Error("vanilla:install: mcVersion missing");
    await installVanillaVersion(mcVersion);
    return true;
  });

  // ---------- Launch ----------
  ipcMain.handle(
    "launch",
    async (e, instanceId: string, accountId: string, runtimePrefs?: LaunchRuntimePrefs) => {
    try {
      if (!instanceId) throw new Error("launch: instanceId missing");
      if (!accountId) throw new Error("launch: accountId missing");

      await launchInstance(instanceId, {
        accountId,
        runtimePrefs,
        onLog: (line: string) => e.sender.send("launch:log", line)
      });

      return { ok: true };
    } catch (err: any) {
      const message = String(err?.message ?? err);
      e.sender.send("launch:log", `[ipc] Launch failed: ${message}`);
      return { ok: false, error: message };
    }
    }
  );

  ipcMain.handle("launch:isRunning", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("launch:isRunning: instanceId missing");
    return isInstanceRunning(instanceId);
  });

  ipcMain.handle("launch:stop", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("launch:stop: instanceId missing");
    return stopInstance(instanceId);
  });

  // ---------- Updater ----------
  ipcMain.handle("updater:getState", async () => getUpdaterState());
  ipcMain.handle("updater:getChannel", async () => getUpdateChannel());
  ipcMain.handle("updater:setChannel", async (_e, channel: "stable" | "beta") => {
    return setUpdateChannel(channel);
  });
  ipcMain.handle("updater:check", async () => checkForUpdates());
  ipcMain.handle("updater:download", async () => downloadUpdate());
  ipcMain.handle("updater:install", async () => quitAndInstallUpdate());

  // ---------- Diagnostics ----------
  ipcMain.handle("diagnostics:export", async (e) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultPath = path.join(app.getPath("downloads"), `fishbattery-diagnostics-${stamp}.zip`);
    const owner = BrowserWindow.fromWebContents(e.sender) ?? undefined;

    const picked = await dialog.showSaveDialog(owner, {
      title: "Export Diagnostics",
      defaultPath,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    });

    if (picked.canceled || !picked.filePath) {
      return { ok: false, canceled: true as const };
    }

    const outPath = exportDiagnosticsZip(picked.filePath);
    return { ok: true, canceled: false as const, path: outPath };
  });

  // ---------- Local Content (manual uploads) ----------
  registerContentIpc();
}
