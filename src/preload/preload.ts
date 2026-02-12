// FishbatteryLauncher
// Copyright (C) 2026 Gudmundur Magnus Johannsson
// Licensed under GPL v3

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron/renderer";

contextBridge.exposeInMainWorld("api", {
  versionsList: () => ipcRenderer.invoke("versions:list"),

  accountsList: () => ipcRenderer.invoke("accounts:list"),
  accountsAdd: () => ipcRenderer.invoke("accounts:add"),
  accountsSetActive: (id: string | null) => ipcRenderer.invoke("accounts:setActive", id),
  accountsRemove: (id: string) => ipcRenderer.invoke("accounts:remove", id),

  instancesList: () => ipcRenderer.invoke("instances:list"),
  instancesCreate: (cfg: any) => ipcRenderer.invoke("instances:create", cfg),
  instancesSetActive: (id: string | null) => ipcRenderer.invoke("instances:setActive", id),
  instancesUpdate: (id: string, patch: any) => ipcRenderer.invoke("instances:update", id, patch),
  instancesRemove: (id: string) => ipcRenderer.invoke("instances:remove", id),
  instancesDuplicate: (id: string) => ipcRenderer.invoke("instances:duplicate", id),
  instancesOpenFolder: (id: string) => ipcRenderer.invoke("instances:openFolder", id),
  instancesExport: (id: string) => ipcRenderer.invoke("instances:export", id),
  instancesImport: () => ipcRenderer.invoke("instances:import"),
  serversList: (instanceId: string) => ipcRenderer.invoke("servers:list", instanceId),
  serversUpsert: (instanceId: string, entry: any) => ipcRenderer.invoke("servers:upsert", instanceId, entry),
  serversRemove: (instanceId: string, serverId: string) =>
    ipcRenderer.invoke("servers:remove", instanceId, serverId),
  serversSetPreferred: (instanceId: string, serverId: string | null) =>
    ipcRenderer.invoke("servers:setPreferred", instanceId, serverId),
  serversExportProfile: (instanceId: string, serverId: string) =>
    ipcRenderer.invoke("servers:exportProfile", instanceId, serverId),
  serversImportProfile: (instanceId: string) => ipcRenderer.invoke("servers:importProfile", instanceId),

  modsList: (instanceId: string) => ipcRenderer.invoke("mods:list", instanceId),
  modsSetEnabled: (instanceId: string, modId: string, enabled: boolean) =>
    ipcRenderer.invoke("mods:setEnabled", instanceId, modId, enabled),
  modsRefresh: (instanceId: string, mcVersion?: string) =>
    ipcRenderer.invoke("mods:refresh", instanceId, mcVersion),
  modsValidate: (instanceId: string) => ipcRenderer.invoke("mods:validate", instanceId),
  modsFixDuplicates: (instanceId: string) => ipcRenderer.invoke("mods:fixDuplicates", instanceId),

  // ---------- Recommended Packs (Modrinth) ----------
  packsList: (instanceId: string) => ipcRenderer.invoke("packs:list", instanceId),
  packsRefresh: (instanceId: string, mcVersion?: string) =>
    ipcRenderer.invoke("packs:refresh", instanceId, mcVersion),
  packsSetEnabled: (instanceId: string, packId: string, enabled: boolean) =>
    ipcRenderer.invoke("packs:setEnabled", instanceId, packId, enabled),

  // ---------- Local Content Uploads ----------
  contentPickFiles: (kind: "mods" | "resourcepacks" | "shaderpacks") =>
    ipcRenderer.invoke("content:pickFiles", kind),
  contentAdd: (instanceId: string, kind: "mods" | "resourcepacks" | "shaderpacks", filePaths: string[]) =>
    ipcRenderer.invoke("content:add", { instanceId, kind, filePaths }),
  contentList: (instanceId: string, kind: "mods" | "resourcepacks" | "shaderpacks") =>
    ipcRenderer.invoke("content:list", { instanceId, kind }),
  contentRemove: (instanceId: string, kind: "mods" | "resourcepacks" | "shaderpacks", name: string) =>
    ipcRenderer.invoke("content:remove", { instanceId, kind, name }),
  contentToggleEnabled: (
    instanceId: string,
    kind: "mods" | "resourcepacks" | "shaderpacks",
    name: string,
    enabled: boolean
  ) => ipcRenderer.invoke("content:toggleEnabled", { instanceId, kind, name, enabled }),


  fabricPickLoader: (mcVersion: string) => ipcRenderer.invoke("fabric:pickLoader", mcVersion),
  fabricInstall: (instanceId: string, mcVersion: string, loaderVersion: string) =>
    ipcRenderer.invoke("fabric:install", instanceId, mcVersion, loaderVersion),

  // ✅ IDs only
  launch: (
    instanceId: string,
    accountId: string,
    runtimePrefs?: { jvmArgs?: string; preLaunch?: string; postExit?: string }
  ) => ipcRenderer.invoke("launch", instanceId, accountId, runtimePrefs),
  launchIsRunning: (instanceId: string) => ipcRenderer.invoke("launch:isRunning", instanceId),
  launchStop: (instanceId: string) => ipcRenderer.invoke("launch:stop", instanceId),
  launchDiagnose: (instanceId: string, lines: string[]) =>
    ipcRenderer.invoke("launch:diagnose", instanceId, lines),
  launchApplyFix: (
    instanceId: string,
    action: "install-fabric-loader" | "refresh-mods" | "fix-duplicate-mods" | "none"
  ) => ipcRenderer.invoke("launch:applyFix", instanceId, action),
  rollbackCreateSnapshot: (
    instanceId: string,
    reason: "instance-preset" | "mods-refresh" | "packs-refresh" | "manual",
    note?: string
  ) => ipcRenderer.invoke("rollback:createSnapshot", instanceId, reason, note),
  rollbackGetLatest: (instanceId: string) => ipcRenderer.invoke("rollback:getLatest", instanceId),
  rollbackRestoreLatest: (instanceId: string) => ipcRenderer.invoke("rollback:restoreLatest", instanceId),

  optimizerPreview: (profile: "conservative" | "balanced" | "aggressive") =>
    ipcRenderer.invoke("optimizer:preview", profile),
  optimizerApply: (instanceId: string, profile: "conservative" | "balanced" | "aggressive") =>
    ipcRenderer.invoke("optimizer:apply", instanceId, profile),
  optimizerRestore: (instanceId: string) => ipcRenderer.invoke("optimizer:restore", instanceId),

  benchmarkRun: (instanceId: string, profile?: "conservative" | "balanced" | "aggressive") =>
    ipcRenderer.invoke("benchmark:run", instanceId, profile),
  benchmarkList: (instanceId: string) => ipcRenderer.invoke("benchmark:list", instanceId),

  updaterGetState: () => ipcRenderer.invoke("updater:getState"),
  updaterGetChannel: () => ipcRenderer.invoke("updater:getChannel"),
  updaterSetChannel: (channel: "stable" | "beta") => ipcRenderer.invoke("updater:setChannel", channel),
  updaterCheck: () => ipcRenderer.invoke("updater:check"),
  updaterDownload: () => ipcRenderer.invoke("updater:download"),
  updaterInstall: () => ipcRenderer.invoke("updater:install"),
  diagnosticsExport: () => ipcRenderer.invoke("diagnostics:export"),
  preflightRun: () => ipcRenderer.invoke("preflight:run"),
  preflightGetLast: () => ipcRenderer.invoke("preflight:getLast"),

  onLaunchLog: (cb: (line: string) => void) => {
    ipcRenderer.removeAllListeners("launch:log");
    ipcRenderer.on("launch:log", (_e: IpcRendererEvent, line: string) => cb(line));
  },

  onUpdaterEvent: (cb: (evt: any) => void) => {
    ipcRenderer.removeAllListeners("updater:event");
    ipcRenderer.on("updater:event", (_e: IpcRendererEvent, evt: any) => cb(evt));
  }
});
