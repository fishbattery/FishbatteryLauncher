// FishbatteryLauncher
// Copyright (C) 2026 Gudmundur Magnus Johannsson
// Licensed under GPL v3

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron/renderer";

// Preload overview:
// - Exposes a typed `window.api` surface for renderer code.
// - Every function here should map to an IPC handler in `src/main/ipc.ts` (or related main-process modules).
// - Keep this surface explicit to avoid exposing unrestricted Node/Electron APIs to renderer context.

contextBridge.exposeInMainWorld("api", {
  versionsList: () => ipcRenderer.invoke("versions:list"),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowToggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
  windowIsMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  windowDragRestore: (cursorX: number, cursorY: number, anchorRatio: number) =>
    ipcRenderer.invoke("window:dragRestore", { cursorX, cursorY, anchorRatio }),
  windowDragMove: (cursorX: number, cursorY: number, anchorRatio: number) =>
    ipcRenderer.invoke("window:dragMove", { cursorX, cursorY, anchorRatio }),
  windowDragEnd: (cursorY: number) => ipcRenderer.invoke("window:dragEnd", { cursorY }),
  windowToggleFullscreen: () => ipcRenderer.invoke("window:toggleFullscreen"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  externalOpen: (url: string) => ipcRenderer.invoke("external:open", url),
  capesListOfficial: (accountId: string, forceRefresh?: boolean) =>
    ipcRenderer.invoke("capes:listOfficial", accountId, forceRefresh),
  capesSetOfficialActive: (accountId: string, capeId: string | null) =>
    ipcRenderer.invoke("capes:setOfficialActive", accountId, capeId),
  capesListLocal: () => ipcRenderer.invoke("capes:listLocal"),
  capesGetLocalSelection: (accountId: string) => ipcRenderer.invoke("capes:getLocalSelection", accountId),
  capesSetLocalSelection: (accountId: string, capeId: string | null) =>
    ipcRenderer.invoke("capes:setLocalSelection", accountId, capeId),
  windowSetTitleBarTheme: (color: string, symbolColor: string) =>
    ipcRenderer.invoke("window:setTitleBarTheme", { color, symbolColor }),

  accountsList: () => ipcRenderer.invoke("accounts:list"),
  accountsGetAvatar: (id: string, refresh?: boolean) => ipcRenderer.invoke("accounts:getAvatar", id, refresh),
  accountsAdd: () => ipcRenderer.invoke("accounts:add"),
  accountsSetActive: (id: string | null) => ipcRenderer.invoke("accounts:setActive", id),
  accountsRemove: (id: string) => ipcRenderer.invoke("accounts:remove", id),
  launcherAccountGetState: () => ipcRenderer.invoke("launcherAccount:getState"),
  launcherAccountRegister: (email: string, password: string, displayName?: string) =>
    ipcRenderer.invoke("launcherAccount:register", email, password, displayName),
  launcherAccountLogin: (email: string, password: string) =>
    ipcRenderer.invoke("launcherAccount:login", email, password),
  launcherAccountLogin2fa: (challengeToken: string, code: string) =>
    ipcRenderer.invoke("launcherAccount:login2fa", challengeToken, code),
  launcherAccountGoogleLogin: () => ipcRenderer.invoke("launcherAccount:googleLogin"),
  launcherAccountSwitch: (accountId: string) => ipcRenderer.invoke("launcherAccount:switch", accountId),
  launcherAccountLogout: () => ipcRenderer.invoke("launcherAccount:logout"),
  launcherAccountGetSubscriptionStatus: () => ipcRenderer.invoke("launcherAccount:getSubscriptionStatus"),
  launcherAccountCheckout: (plan: "monthly" | "yearly") => ipcRenderer.invoke("launcherAccount:checkout", plan),
  launcherAccountBillingPortal: () => ipcRenderer.invoke("launcherAccount:billingPortal"),
  launcherAccountOpenUpgradePage: () => ipcRenderer.invoke("launcherAccount:openUpgradePage"),
  launcherAccountUpdateProfile: (patch: { displayName?: string; avatarUrl?: string | null }) =>
    ipcRenderer.invoke("launcherAccount:updateProfile", patch),
  cloudSyncGetState: () => ipcRenderer.invoke("cloudSync:getState"),
  cloudSyncSyncNow: (payload: {
    settings: Record<string, unknown>;
    policy?: "ask" | "newer-wins" | "prefer-local" | "prefer-cloud";
    resolveConflict?: boolean;
  }) => ipcRenderer.invoke("cloudSync:syncNow", payload),
  profileGetSummary: () => ipcRenderer.invoke("profile:getSummary"),
  profileGetVisibility: () => ipcRenderer.invoke("profile:getVisibility"),
  profileSetVisibility: (publicEnabled: boolean) => ipcRenderer.invoke("profile:setVisibility", publicEnabled),

  instancesList: () => ipcRenderer.invoke("instances:list"),
  instancesCreate: (cfg: any) => ipcRenderer.invoke("instances:create", cfg),
  instancesSetActive: (id: string | null) => ipcRenderer.invoke("instances:setActive", id),
  instancesUpdate: (id: string, patch: any) => ipcRenderer.invoke("instances:update", id, patch),
  instancesRemove: (id: string) => ipcRenderer.invoke("instances:remove", id),
  instancesDuplicate: (id: string) => ipcRenderer.invoke("instances:duplicate", id),
  instancesPickIcon: () => ipcRenderer.invoke("instances:pickIcon"),
  instancesPreviewIconDataUrl: (filePath: string) => ipcRenderer.invoke("instances:previewIconDataUrl", filePath),
  instancesSetIconFromFile: (
    id: string,
    filePath: string,
    transform?: { scale?: number; offsetXPct?: number; offsetYPct?: number }
  ) => ipcRenderer.invoke("instances:setIconFromFile", id, filePath, transform),
  instancesSetIconFromUrl: (id: string, url: string) => ipcRenderer.invoke("instances:setIconFromUrl", id, url),
  instancesSetIconFallback: (id: string, label: string, theme?: "green" | "blue") =>
    ipcRenderer.invoke("instances:setIconFallback", id, label, theme),
  instancesGetIcon: (id: string) => ipcRenderer.invoke("instances:getIcon", id),
  instancesClearIcon: (id: string) => ipcRenderer.invoke("instances:clearIcon", id),
  instancesOpenFolder: (id: string) => ipcRenderer.invoke("instances:openFolder", id),
  instancesExport: (id: string) => ipcRenderer.invoke("instances:export", id),
  instancesImport: () => ipcRenderer.invoke("instances:import"),
  modrinthPacksSearch: (query: string, limit?: number) => ipcRenderer.invoke("modrinthPacks:search", query, limit),
  modrinthPacksInstall: (payload: any) => ipcRenderer.invoke("modrinthPacks:install", payload),
  providerPacksSearch: (provider: string, query: string, limit?: number) =>
    ipcRenderer.invoke("providerPacks:search", provider, query, limit),
  providerPacksInstall: (
    provider: "atlauncher" | "ftb",
    packId: string,
    defaults?: { name?: string; accountId?: string | null; memoryMb?: number }
  ) => ipcRenderer.invoke("providerPacks:install", provider, packId, defaults),
  packArchiveImport: (payload: any) => ipcRenderer.invoke("packArchive:import", payload),
  lockfileGenerate: (instanceId: string) => ipcRenderer.invoke("lockfile:generate", instanceId),
  lockfileDrift: (instanceId: string) => ipcRenderer.invoke("lockfile:drift", instanceId),
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
  modsPlanRefresh: (instanceId: string, mcVersion?: string) =>
    ipcRenderer.invoke("mods:planRefresh", instanceId, mcVersion),
  modsRefreshSelected: (instanceId: string, mcVersion: string, selectedIds: string[]) =>
    ipcRenderer.invoke("mods:refreshSelected", instanceId, mcVersion, selectedIds),
  modsSyncBridge: (instanceId: string, mcVersion?: string) =>
    ipcRenderer.invoke("mods:syncBridge", instanceId, mcVersion),
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
  loaderPickVersion: (loader: "vanilla" | "fabric" | "quilt" | "forge" | "neoforge", mcVersion: string) =>
    ipcRenderer.invoke("loader:pickVersion", loader, mcVersion),
  loaderInstall: (
    instanceId: string,
    mcVersion: string,
    loader: "vanilla" | "fabric" | "quilt" | "forge" | "neoforge",
    loaderVersion?: string
  ) => ipcRenderer.invoke("loader:install", instanceId, mcVersion, loader, loaderVersion),
  vanillaInstall: (mcVersion: string) => ipcRenderer.invoke("vanilla:install", mcVersion),

  // IDs only
  launch: (
    instanceId: string,
    accountId: string,
    runtimePrefs?: { jvmArgs?: string; preLaunch?: string; postExit?: string; serverAddress?: string }
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
