"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  versionsList: () => electron.ipcRenderer.invoke("versions:list"),
  accountsList: () => electron.ipcRenderer.invoke("accounts:list"),
  accountsAdd: () => electron.ipcRenderer.invoke("accounts:add"),
  accountsSetActive: (id) => electron.ipcRenderer.invoke("accounts:setActive", id),
  accountsRemove: (id) => electron.ipcRenderer.invoke("accounts:remove", id),
  instancesList: () => electron.ipcRenderer.invoke("instances:list"),
  instancesCreate: (cfg) => electron.ipcRenderer.invoke("instances:create", cfg),
  instancesSetActive: (id) => electron.ipcRenderer.invoke("instances:setActive", id),
  instancesUpdate: (id, patch) => electron.ipcRenderer.invoke("instances:update", id, patch),
  instancesRemove: (id) => electron.ipcRenderer.invoke("instances:remove", id),
  instancesDuplicate: (id) => electron.ipcRenderer.invoke("instances:duplicate", id),
  instancesOpenFolder: (id) => electron.ipcRenderer.invoke("instances:openFolder", id),
  modsList: (instanceId) => electron.ipcRenderer.invoke("mods:list", instanceId),
  modsSetEnabled: (instanceId, modId, enabled) => electron.ipcRenderer.invoke("mods:setEnabled", instanceId, modId, enabled),
  modsRefresh: (instanceId, mcVersion) => electron.ipcRenderer.invoke("mods:refresh", instanceId, mcVersion),
  // ---------- Recommended Packs (Modrinth) ----------
  packsList: (instanceId) => electron.ipcRenderer.invoke("packs:list", instanceId),
  packsRefresh: (instanceId, mcVersion) => electron.ipcRenderer.invoke("packs:refresh", instanceId, mcVersion),
  packsSetEnabled: (instanceId, packId, enabled) => electron.ipcRenderer.invoke("packs:setEnabled", instanceId, packId, enabled),
  // ---------- Local Content Uploads ----------
  contentPickFiles: (kind) => electron.ipcRenderer.invoke("content:pickFiles", kind),
  contentAdd: (instanceId, kind, filePaths) => electron.ipcRenderer.invoke("content:add", { instanceId, kind, filePaths }),
  contentList: (instanceId, kind) => electron.ipcRenderer.invoke("content:list", { instanceId, kind }),
  contentRemove: (instanceId, kind, name) => electron.ipcRenderer.invoke("content:remove", { instanceId, kind, name }),
  contentToggleEnabled: (instanceId, kind, name, enabled) => electron.ipcRenderer.invoke("content:toggleEnabled", { instanceId, kind, name, enabled }),
  fabricPickLoader: (mcVersion) => electron.ipcRenderer.invoke("fabric:pickLoader", mcVersion),
  fabricInstall: (instanceId, mcVersion, loaderVersion) => electron.ipcRenderer.invoke("fabric:install", instanceId, mcVersion, loaderVersion),
  // ✅ IDs only
  launch: (instanceId, accountId) => electron.ipcRenderer.invoke("launch", instanceId, accountId),
  launchIsRunning: (instanceId) => electron.ipcRenderer.invoke("launch:isRunning", instanceId),
  launchStop: (instanceId) => electron.ipcRenderer.invoke("launch:stop", instanceId),
  onLaunchLog: (cb) => {
    electron.ipcRenderer.removeAllListeners("launch:log");
    electron.ipcRenderer.on("launch:log", (_e, line) => cb(line));
  }
});
