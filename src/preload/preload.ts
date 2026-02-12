import { contextBridge, ipcRenderer } from "electron";

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

  modsList: (instanceId: string) => ipcRenderer.invoke("mods:list", instanceId),
  modsSetEnabled: (instanceId: string, modId: string, enabled: boolean) =>
    ipcRenderer.invoke("mods:setEnabled", instanceId, modId, enabled),
  modsRefresh: (instanceId: string, mcVersion?: string) =>
    ipcRenderer.invoke("mods:refresh", instanceId, mcVersion),

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
  launch: (instanceId: string, accountId: string) => ipcRenderer.invoke("launch", instanceId, accountId),
  launchIsRunning: (instanceId: string) => ipcRenderer.invoke("launch:isRunning", instanceId),
  launchStop: (instanceId: string) => ipcRenderer.invoke("launch:stop", instanceId),

  updaterGetState: () => ipcRenderer.invoke("updater:getState"),
  updaterGetChannel: () => ipcRenderer.invoke("updater:getChannel"),
  updaterSetChannel: (channel: "stable" | "beta") => ipcRenderer.invoke("updater:setChannel", channel),
  updaterCheck: () => ipcRenderer.invoke("updater:check"),
  updaterDownload: () => ipcRenderer.invoke("updater:download"),
  updaterInstall: () => ipcRenderer.invoke("updater:install"),

  onLaunchLog: (cb: (line: string) => void) => {
    ipcRenderer.removeAllListeners("launch:log");
    ipcRenderer.on("launch:log", (_e, line) => cb(line));
  },

  onUpdaterEvent: (cb: (evt: any) => void) => {
    ipcRenderer.removeAllListeners("updater:event");
    ipcRenderer.on("updater:event", (_e, evt) => cb(evt));
  }
});
