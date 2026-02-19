import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { readFileSync } from "node:fs";
import { listAllVersions } from "./versions";
import {
  addMicrosoftAccountInteractive,
  getAccountAvatarDataUrl,
  getOfficialMinecraftCapes,
  getOfficialMinecraftCapesWithOptions,
  listAccounts,
  removeAccount,
  setOfficialMinecraftCape,
  setActiveAccount
} from "./accounts";
import { getSelectedLocalCapeId, listLocalCapes, setSelectedLocalCapeId } from "./capes";
import {
  openLauncherBillingPortal,
  openLauncherCheckout,
  hasLauncherFounderAccess,
  hasLauncherPremiumAccess,
  getLauncherSubscriptionStatus,
  getLauncherAccountState,
  loginLauncherAccountWithGoogleDesktop,
  loginLauncherAccount,
  loginLauncherAccountWithTwoFactor,
  openLauncherUpgradePage,
  logoutLauncherAccount,
  registerLauncherAccount,
  updateLauncherAccountProfile,
  switchLauncherAccount
} from "./launcherAccount";
import { getCloudSyncState, syncCloudNow } from "./cloudSync";
import {
  createInstance,
  listInstances,
  removeInstance,
  setActiveInstance,
  updateInstance,
  duplicateInstance,
  getInstanceDir
} from "./instances";
import { listMods, planModRefreshForInstance, refreshModsForInstance, setModEnabled } from "./mods";
import { listPacks, refreshPacksForInstance, setPackEnabled } from "./packs";
import { pickFabricLoader } from "./fabric";
import { installFabricVersion } from "./fabricInstall";
import { installVanillaVersion } from "./vanillaInstall";
import { pickLoaderVersion, prepareLoaderInstall, type LoaderKind } from "./loaderSupport";
import { launchInstance, isInstanceRunning, stopInstance } from "./launch";
import type { LaunchRuntimePrefs } from "./launch";
import { registerContentIpc } from "./content";
import { exportDiagnosticsZip } from "./diagnostics";
import { getLastPreflightChecks, runPreflightChecks } from "./preflight";
import { exportInstanceToZip, importInstanceFromZip } from "./instanceTransfer";
import { checkInstanceLockfileDrift, generateInstanceLockfile } from "./instanceLockfile";
import { installModrinthModpack, searchModrinthModpacks } from "./modrinthPacks";
import { importPackArchive, type ProviderHint } from "./packArchiveImport";
import { installProviderPackFromSearch, searchProviderPacks, type ExternalProvider } from "./providerPacks";
import {
  clearInstanceIcon,
  getInstanceIconDataUrl,
  setInstanceIconFallback,
  setInstanceIconFromFile,
  setInstanceIconFromUrl
} from "./instanceIcons";
import { buildOptimizerPreview, applyOptimizer, restoreOptimizerDefaults } from "./optimizer";
import { listBenchmarks, runBenchmark } from "./benchmark";
import { fixDuplicateMods, validateInstanceMods } from "./modValidation";
import { installBridgeToMods } from "./bridgeInstaller";
import {
  createRollbackSnapshot,
  getLatestRollbackSnapshot,
  restoreLatestRollbackSnapshot
} from "./rollback";
import { applyLaunchDiagnosisFix, diagnoseLaunchLogs, type LaunchFixAction } from "./launchDiagnostics";
import {
  exportServerProfile,
  importServerProfile,
  listInstanceServers,
  removeInstanceServer,
  setPreferredInstanceServer,
  upsertInstanceServer
} from "./servers";
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateChannel,
  getUpdaterState,
  quitAndInstallUpdate,
  setUpdateChannel
} from "./updater";
import { getProfileSummary, getProfileVisibility, setProfileVisibility } from "./profileShowcase";

// IPC layer overview:
// - Registers every renderer-accessible operation via `ipcMain.handle(...)`.
// - Delegates business logic to focused modules in `src/main/*`.
// - Keeps renderer thin: UI triggers IPC, IPC calls service module, returns serializable payload.

export function registerIpc() {
  ipcMain.handle("window:minimize", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    owner.minimize();
    return true;
  });

  ipcMain.handle("window:toggleMaximize", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    if (owner.isMaximized()) owner.unmaximize();
    else owner.maximize();
    return owner.isMaximized();
  });

  ipcMain.handle("window:isMaximized", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    return owner.isMaximized();
  });

  ipcMain.handle(
    "window:dragRestore",
    async (e, payload: { cursorX: number; cursorY: number; anchorRatio: number }) => {
      const owner = BrowserWindow.fromWebContents(e.sender);
      if (!owner) return false;
      if (!owner.isMaximized()) return false;

      const anchorRatio = Math.max(0.05, Math.min(0.95, Number(payload?.anchorRatio || 0.5)));
      const cursorX = Math.round(Number(payload?.cursorX || 0));
      const cursorY = Math.round(Number(payload?.cursorY || 0));

      owner.unmaximize();
      const bounds = owner.getBounds();
      const nextX = Math.round(cursorX - bounds.width * anchorRatio);
      const nextY = Math.round(cursorY - 10);
      owner.setPosition(nextX, nextY);
      return true;
    }
  );

  ipcMain.handle(
    "window:dragMove",
    async (e, payload: { cursorX: number; cursorY: number; anchorRatio: number }) => {
      const owner = BrowserWindow.fromWebContents(e.sender);
      if (!owner) return false;
      if (owner.isMaximized()) return false;

      const anchorRatio = Math.max(0.05, Math.min(0.95, Number(payload?.anchorRatio || 0.5)));
      const cursorX = Math.round(Number(payload?.cursorX || 0));
      const cursorY = Math.round(Number(payload?.cursorY || 0));
      const bounds = owner.getBounds();
      const nextX = Math.round(cursorX - bounds.width * anchorRatio);
      const nextY = Math.round(cursorY - 10);
      owner.setPosition(nextX, nextY);
      return true;
    }
  );

  ipcMain.handle(
    "window:dragEnd",
    async (e, payload: { cursorY: number }) => {
      const owner = BrowserWindow.fromWebContents(e.sender);
      if (!owner) return false;
      const cursorY = Math.round(Number(payload?.cursorY || 0));
      // Emulate native "drag to top edge to maximize" for our custom drag path.
      if (cursorY <= 2) {
        owner.maximize();
        return true;
      }
      return owner.isMaximized();
    }
  );

  ipcMain.handle("window:toggleFullscreen", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    owner.setFullScreen(!owner.isFullScreen());
    return owner.isFullScreen();
  });

  ipcMain.handle("window:close", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    owner.close();
    return true;
  });

  ipcMain.handle("external:open", async (_e, url: string) => {
    const target = String(url || "").trim();
    if (!/^https?:\/\//i.test(target)) return false;
    const err = await shell.openExternal(target);
    return !err;
  });

  ipcMain.handle("capes:listOfficial", async (_e, accountId: string, forceRefresh?: boolean) => {
    if (!accountId) throw new Error("capes:listOfficial: accountId missing");
    if (forceRefresh) return getOfficialMinecraftCapesWithOptions(accountId, { forceRefresh: true });
    return getOfficialMinecraftCapes(accountId);
  });
  ipcMain.handle("capes:setOfficialActive", async (_e, accountId: string, capeId: string | null) => {
    if (!accountId) throw new Error("capes:setOfficialActive: accountId missing");
    return setOfficialMinecraftCape(accountId, capeId ?? null);
  });
  ipcMain.handle("capes:listLocal", async () => {
    const catalog = await listLocalCapes();
    const founder = await hasLauncherFounderAccess();
    if (founder) return catalog;
    return {
      ...catalog,
      items: catalog.items.filter((x) => x.tier !== "founder")
    };
  });
  ipcMain.handle("capes:getLocalSelection", async (_e, accountId: string) => {
    if (!accountId) throw new Error("capes:getLocalSelection: accountId missing");
    const selectedId = await getSelectedLocalCapeId(accountId);
    if (!selectedId) return { accountId, capeId: null };

    const catalog = await listLocalCapes();
    const selected = catalog.items.find((x) => x.id === selectedId) ?? null;
    if (!selected) {
      await setSelectedLocalCapeId(accountId, null);
      return { accountId, capeId: null };
    }

    if (selected.tier === "founder" && !(await hasLauncherFounderAccess())) {
      await setSelectedLocalCapeId(accountId, null);
      return { accountId, capeId: null };
    }
    if (selected.tier === "premium" && !(await hasLauncherPremiumAccess())) {
      await setSelectedLocalCapeId(accountId, null);
      return { accountId, capeId: null };
    }

    return { accountId, capeId: selectedId };
  });
  ipcMain.handle("capes:setLocalSelection", async (_e, accountId: string, capeId: string | null) => {
    if (!accountId) throw new Error("capes:setLocalSelection: accountId missing");
    const normalizedCapeId = capeId ? String(capeId) : null;
    if (normalizedCapeId) {
      const catalog = await listLocalCapes();
      const selected = catalog.items.find((x) => x.id === normalizedCapeId) ?? null;
      if (!selected) throw new Error("capes:setLocalSelection: cape not found");
      if (selected.tier === "founder" && !(await hasLauncherFounderAccess())) {
        throw new Error("Founder cape is available only to founder accounts.");
      }
      if (selected.tier === "premium" && !(await hasLauncherPremiumAccess())) {
        throw new Error("Launcher Premium is required to use premium capes.");
      }
    }
    return await setSelectedLocalCapeId(accountId, normalizedCapeId);
  });

  ipcMain.handle("window:setTitleBarTheme", async (e, payload: { color?: string; symbolColor?: string }) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner) return false;
    if (process.platform === "darwin") return false;

    const color = String(payload?.color || "").trim();
    const symbolColor = String(payload?.symbolColor || "").trim();
    const hexRe = /^#([0-9a-fA-F]{6})$/;
    if (!hexRe.test(color) || !hexRe.test(symbolColor)) return false;

    try {
      owner.setBackgroundColor(color);
      owner.setTitleBarOverlay({
        color,
        symbolColor,
        height: 34
      });
      return true;
    } catch {
      return false;
    }
  });

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

    const owner = BrowserWindow.fromWebContents(e.sender);
    const defaultPath = path.join(
      app.getPath("downloads"),
      `${String(inst.name || "instance").replace(/[<>:\"/\\|?*\x00-\x1F]/g, "_")}.zip`
    );

    const saveOpts = {
      title: "Export Instance",
      defaultPath,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    };
    const picked = owner
      ? await dialog.showSaveDialog(owner, saveOpts)
      : await dialog.showSaveDialog(saveOpts);
    if (picked.canceled || !picked.filePath) return { ok: false as const, canceled: true as const };

    const out = exportInstanceToZip(id, picked.filePath);
    return { ok: true as const, canceled: false as const, path: out };
  });

  ipcMain.handle("instances:import", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    const openOpts = {
      title: "Import Instance",
      properties: ["openFile"] as ("openFile")[],
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    };
    const picked = owner
      ? await dialog.showOpenDialog(owner, openOpts)
      : await dialog.showOpenDialog(openOpts);

    if (picked.canceled || !picked.filePaths?.length) {
      return { ok: false as const, canceled: true as const };
    }

    const imported = await importInstanceFromZip(picked.filePaths[0]);
    return { ok: true as const, canceled: false as const, ...imported };
  });

  ipcMain.handle("instances:pickIcon", async (e) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    const openOpts = {
      title: "Choose Instance Icon",
      properties: ["openFile"] as ("openFile")[],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] }]
    };
    const picked = owner ? await dialog.showOpenDialog(owner, openOpts) : await dialog.showOpenDialog(openOpts);
    if (picked.canceled || !picked.filePaths?.length) return null;
    return picked.filePaths[0];
  });

  ipcMain.handle("instances:previewIconDataUrl", async (_e, filePath: string) => {
    if (!filePath) throw new Error("instances:previewIconDataUrl: filePath missing");
    const ext = path.extname(String(filePath)).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp"
    };
    const mime = mimeMap[ext] || "application/octet-stream";
    const bytes = readFileSync(String(filePath));
    return `data:${mime};base64,${bytes.toString("base64")}`;
  });

  ipcMain.handle(
    "instances:setIconFromFile",
    async (
      _e,
      instanceId: string,
      filePath: string,
      transform?: { scale?: number; offsetXPct?: number; offsetYPct?: number }
    ) => {
    if (!instanceId) throw new Error("instances:setIconFromFile: instanceId missing");
    if (!filePath) throw new Error("instances:setIconFromFile: filePath missing");
      return setInstanceIconFromFile(instanceId, filePath, transform);
    }
  );

  ipcMain.handle("instances:setIconFromUrl", async (_e, instanceId: string, url: string) => {
    if (!instanceId) throw new Error("instances:setIconFromUrl: instanceId missing");
    if (!url) throw new Error("instances:setIconFromUrl: url missing");
    return setInstanceIconFromUrl(instanceId, url);
  });

  ipcMain.handle("instances:setIconFallback", async (_e, instanceId: string, label: string, theme?: "green" | "blue") => {
    if (!instanceId) throw new Error("instances:setIconFallback: instanceId missing");
    return setInstanceIconFallback(instanceId, label || "FB", theme || "green");
  });

  ipcMain.handle("instances:getIcon", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("instances:getIcon: instanceId missing");
    return getInstanceIconDataUrl(instanceId);
  });

  ipcMain.handle("instances:clearIcon", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("instances:clearIcon: instanceId missing");
    clearInstanceIcon(instanceId);
    return true;
  });

  ipcMain.handle("modrinthPacks:search", async (_e, query: string, limit?: number) => {
    return searchModrinthModpacks(String(query ?? ""), Number(limit ?? 24));
  });

  ipcMain.handle("modrinthPacks:install", async (_e, payload: any) => {
    if (!payload?.projectId) throw new Error("modrinthPacks:install: projectId missing");
    return installModrinthModpack({
      projectId: String(payload.projectId),
      versionId: payload.versionId ? String(payload.versionId) : undefined,
      nameOverride: payload.nameOverride ? String(payload.nameOverride) : undefined,
      accountId: payload.accountId ?? null,
      memoryMb: Number(payload.memoryMb || 6144)
    });
  });

  ipcMain.handle("packArchive:import", async (e, payload: any) => {
    const provider = String(payload?.provider || "auto") as ProviderHint;
    const defaults = payload?.defaults || {};
    const owner = BrowserWindow.fromWebContents(e.sender);
    const openOpts = {
      title: "Import Pack Archive",
      properties: ["openFile"] as ("openFile")[],
      filters: [
        { name: "Pack archives", extensions: ["zip", "mrpack"] },
        { name: "All files", extensions: ["*"] }
      ]
    };
    const picked = owner ? await dialog.showOpenDialog(owner, openOpts) : await dialog.showOpenDialog(openOpts);
    if (picked.canceled || !picked.filePaths?.length) {
      return { ok: false as const, canceled: true as const };
    }

    const result = await importPackArchive({
      providerHint: provider,
      zipPath: picked.filePaths[0],
      defaults: {
        name: defaults?.name ? String(defaults.name) : undefined,
        mcVersion: defaults?.mcVersion ? String(defaults.mcVersion) : undefined,
        accountId: defaults?.accountId ?? null,
        memoryMb: Number(defaults?.memoryMb || 6144)
      }
    });

    return { ok: true as const, canceled: false as const, result };
  });

  ipcMain.handle("providerPacks:search", async (_e, provider: string, query: string, limit?: number) => {
    const p = String(provider || "").trim().toLowerCase() as ExternalProvider;
    if (!["curseforge", "technic", "atlauncher", "ftb"].includes(p)) {
      throw new Error("providerPacks:search: invalid provider");
    }
    return searchProviderPacks(p, String(query ?? ""), Number(limit ?? 24));
  });

  ipcMain.handle(
    "providerPacks:install",
    async (
      _e,
      provider: string,
      packId: string,
      defaults?: { name?: string; accountId?: string | null; memoryMb?: number }
    ) => {
      const p = String(provider || "").trim().toLowerCase() as ExternalProvider;
      if (!["atlauncher", "ftb"].includes(p)) {
        throw new Error(`providerPacks:install: unsupported provider ${provider}`);
      }
      if (!packId) throw new Error("providerPacks:install: packId missing");
      return installProviderPackFromSearch({
        provider: p,
        packId: String(packId),
        defaults: {
          name: defaults?.name ? String(defaults.name) : undefined,
          accountId: defaults?.accountId ?? null,
          memoryMb: Number(defaults?.memoryMb || 6144)
        }
      });
    }
  );

  ipcMain.handle("lockfile:generate", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("lockfile:generate: instanceId missing");
    const lockfile = generateInstanceLockfile(instanceId, { write: true });
    return {
      generatedAt: lockfile.generatedAt,
      artifacts: lockfile.artifacts.length,
      notes: lockfile.notes
    };
  });

  ipcMain.handle("lockfile:drift", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("lockfile:drift: instanceId missing");
    return checkInstanceLockfileDrift(instanceId);
  });

  // ---------- Per-instance servers / server profiles ----------
  ipcMain.handle("servers:list", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("servers:list: instanceId missing");
    return listInstanceServers(instanceId);
  });

  ipcMain.handle("servers:upsert", async (_e, instanceId: string, entry: any) => {
    if (!instanceId) throw new Error("servers:upsert: instanceId missing");
    if (!entry) throw new Error("servers:upsert: entry missing");
    return upsertInstanceServer(instanceId, entry);
  });

  ipcMain.handle("servers:remove", async (_e, instanceId: string, serverId: string) => {
    if (!instanceId) throw new Error("servers:remove: instanceId missing");
    if (!serverId) throw new Error("servers:remove: serverId missing");
    return removeInstanceServer(instanceId, serverId);
  });

  ipcMain.handle("servers:setPreferred", async (_e, instanceId: string, serverId: string | null) => {
    if (!instanceId) throw new Error("servers:setPreferred: instanceId missing");
    return setPreferredInstanceServer(instanceId, serverId ?? null);
  });

  ipcMain.handle("servers:exportProfile", async (e, instanceId: string, serverId: string) => {
    if (!instanceId) throw new Error("servers:exportProfile: instanceId missing");
    if (!serverId) throw new Error("servers:exportProfile: serverId missing");

    const owner = BrowserWindow.fromWebContents(e.sender);
    const defaultPath = path.join(app.getPath("downloads"), `fishbattery-server-profile-${serverId}.zip`);
    const saveOpts = {
      title: "Export Server Profile",
      defaultPath,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    };
    const picked = owner
      ? await dialog.showSaveDialog(owner, saveOpts)
      : await dialog.showSaveDialog(saveOpts);
    if (picked.canceled || !picked.filePath) return { ok: false as const, canceled: true as const };

    const out = exportServerProfile(instanceId, serverId, picked.filePath);
    return { ok: true as const, canceled: false as const, path: out };
  });

  ipcMain.handle("servers:importProfile", async (e, instanceId: string) => {
    if (!instanceId) throw new Error("servers:importProfile: instanceId missing");

    const owner = BrowserWindow.fromWebContents(e.sender);
    const openOpts = {
      title: "Import Server Profile",
      properties: ["openFile"] as ("openFile")[],
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    };
    const picked = owner
      ? await dialog.showOpenDialog(owner, openOpts)
      : await dialog.showOpenDialog(openOpts);

    if (picked.canceled || !picked.filePaths?.length) {
      return { ok: false as const, canceled: true as const };
    }

    const result = await importServerProfile(instanceId, picked.filePaths[0]);
    const mcVersion = result?.applied?.mcVersion;
    const loader = result?.applied?.loader;
    if (mcVersion) {
      if (loader === "fabric") {
        await refreshModsForInstance({
          instanceId,
          mcVersion,
          loader: "fabric"
        });
      }
      await refreshPacksForInstance({ instanceId, mcVersion });
    }
    return { ok: true as const, canceled: false as const, result };
  });

  // ---------- Accounts ----------
  ipcMain.handle("accounts:list", async () => listAccounts());
  ipcMain.handle("accounts:getAvatar", async (_e, id: string, refresh?: boolean) => {
    if (!id) throw new Error("accounts:getAvatar: id missing");
    return getAccountAvatarDataUrl(id, !!refresh);
  });
  ipcMain.handle("accounts:add", async () => addMicrosoftAccountInteractive());

  ipcMain.handle("accounts:remove", async (_e, id: string) => {
    if (!id) throw new Error("accounts:remove: id missing");
    return removeAccount(id);
  });

  ipcMain.handle("accounts:setActive", async (_e, id: string | null) => {
    return setActiveAccount(id ?? null);
  });

  // ---------- Launcher account (Fishbattery identity) ----------
  ipcMain.handle("launcherAccount:getState", async () => getLauncherAccountState());
  ipcMain.handle("launcherAccount:register", async (_e, email: string, password: string, displayName?: string) =>
    registerLauncherAccount(email, password, displayName)
  );
  ipcMain.handle("launcherAccount:login", async (_e, email: string, password: string) =>
    loginLauncherAccount(email, password)
  );
  ipcMain.handle("launcherAccount:login2fa", async (_e, challengeToken: string, code: string) =>
    loginLauncherAccountWithTwoFactor(challengeToken, code)
  );
  ipcMain.handle("launcherAccount:googleLogin", async () => loginLauncherAccountWithGoogleDesktop());
  ipcMain.handle("launcherAccount:switch", async (_e, accountId: string) => switchLauncherAccount(accountId));
  ipcMain.handle("launcherAccount:logout", async () => logoutLauncherAccount());
  ipcMain.handle("launcherAccount:getSubscriptionStatus", async () => getLauncherSubscriptionStatus());
  ipcMain.handle("launcherAccount:checkout", async (_e, plan: "monthly" | "yearly") =>
    openLauncherCheckout(plan === "yearly" ? "yearly" : "monthly")
  );
  ipcMain.handle("launcherAccount:billingPortal", async () => openLauncherBillingPortal());
  ipcMain.handle("launcherAccount:openUpgradePage", async () => openLauncherUpgradePage());
  ipcMain.handle(
    "launcherAccount:updateProfile",
    async (_e, patch: { displayName?: string; avatarUrl?: string | null }) => updateLauncherAccountProfile(patch)
  );
  ipcMain.handle("cloudSync:getState", async () => getCloudSyncState());
  ipcMain.handle(
    "cloudSync:syncNow",
    async (
      _e,
      payload: {
        settings: Record<string, unknown>;
        policy?: "ask" | "newer-wins" | "prefer-local" | "prefer-cloud";
        resolveConflict?: boolean;
      }
    ) => syncCloudNow(payload)
  );
  ipcMain.handle("profile:getSummary", async () => getProfileSummary());
  ipcMain.handle("profile:getVisibility", async () => getProfileVisibility());
  ipcMain.handle("profile:setVisibility", async (_e, publicEnabled: boolean) =>
    setProfileVisibility(!!publicEnabled)
  );

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

  // ---------- Generic loaders ----------
  ipcMain.handle("loader:pickVersion", async (_e, loader: LoaderKind, mcVersion: string) => {
    if (!loader) throw new Error("loader:pickVersion: loader missing");
    if (!mcVersion) throw new Error("loader:pickVersion: mcVersion missing");
    return pickLoaderVersion(loader, mcVersion);
  });

  ipcMain.handle(
    "loader:install",
    async (_e, instanceId: string, mcVersion: string, loader: LoaderKind, loaderVersion?: string) => {
      if (!instanceId) throw new Error("loader:install: instanceId missing");
      if (!mcVersion) throw new Error("loader:install: mcVersion missing");
      if (!loader) throw new Error("loader:install: loader missing");
      return prepareLoaderInstall({ instanceId, mcVersion, loader, loaderVersion });
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
    let loader: "fabric" | "vanilla" | "quilt" | "forge" | "neoforge" | undefined = "fabric";

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

  ipcMain.handle("mods:planRefresh", async (_e, instanceId: string, mcVersion?: string) => {
    if (!instanceId) throw new Error("mods:planRefresh: instanceId missing");
    const db = listInstances();
    const inst = db.instances.find((x) => x.id === instanceId);
    const version = String(mcVersion || inst?.mcVersion || "").trim();
    const loader = String(inst?.loader || "fabric").trim().toLowerCase();
    if (!version) throw new Error("mods:planRefresh: mcVersion missing");
    if (loader !== "fabric") throw new Error(`mods:planRefresh: unsupported loader ${loader}`);
    return planModRefreshForInstance({
      instanceId,
      mcVersion: version,
      loader: "fabric"
    });
  });

  ipcMain.handle("mods:refreshSelected", async (_e, instanceId: string, mcVersion?: string, selectedIds?: string[]) => {
    if (!instanceId) throw new Error("mods:refreshSelected: instanceId missing");
    const db = listInstances();
    const inst = db.instances.find((x) => x.id === instanceId);
    const version = String(mcVersion || inst?.mcVersion || "").trim();
    const loader = String(inst?.loader || "fabric").trim().toLowerCase();
    if (!version) throw new Error("mods:refreshSelected: mcVersion missing");
    if (loader !== "fabric") throw new Error(`mods:refreshSelected: unsupported loader ${loader}`);
    const targets = Array.isArray(selectedIds)
      ? selectedIds.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    if (!targets.length) throw new Error("mods:refreshSelected: selectedIds missing");
    return refreshModsForInstance({
      instanceId,
      mcVersion: version,
      loader: "fabric",
      targetCatalogIds: targets
    });
  });

  ipcMain.handle("mods:setEnabled", async (_e, instanceId: string, modId: string, enabled: boolean) => {
    if (!instanceId) throw new Error("mods:setEnabled: instanceId missing");
    if (!modId) throw new Error("mods:setEnabled: modId missing");
    return setModEnabled(instanceId, modId, enabled);
  });
  ipcMain.handle("mods:validate", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("mods:validate: instanceId missing");
    return validateInstanceMods(instanceId);
  });
  ipcMain.handle("mods:fixDuplicates", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("mods:fixDuplicates: instanceId missing");
    return fixDuplicateMods(instanceId);
  });
  ipcMain.handle("mods:syncBridge", async (_e, instanceId: string, mcVersion?: string) => {
    if (!instanceId) throw new Error("mods:syncBridge: instanceId missing");
    const db = listInstances();
    const inst = db.instances.find((x: any) => x.id === instanceId);
    const version = String(mcVersion || inst?.mcVersion || "").trim();
    const loader = String(inst?.loader || "fabric").trim().toLowerCase();
    if (!version) throw new Error("mods:syncBridge: mcVersion missing");
    if (loader !== "fabric" && loader !== "quilt") {
      return { installed: false, skipped: true, reason: `unsupported loader ${loader}` };
    }
    const modsDir = path.join(getInstanceDir(instanceId), "mods");
    return installBridgeToMods(modsDir, version, loader);
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
  ipcMain.handle("launch:diagnose", async (_e, instanceId: string, lines: string[]) => {
    if (!instanceId) throw new Error("launch:diagnose: instanceId missing");
    return diagnoseLaunchLogs(lines ?? []);
  });
  ipcMain.handle("launch:applyFix", async (_e, instanceId: string, action: LaunchFixAction) => {
    if (!instanceId) throw new Error("launch:applyFix: instanceId missing");
    return applyLaunchDiagnosisFix(instanceId, action || "none");
  });

  // ---------- Rollback ----------
  ipcMain.handle("rollback:createSnapshot", async (_e, instanceId: string, reason: string, note?: string) => {
    if (!instanceId) throw new Error("rollback:createSnapshot: instanceId missing");
    return createRollbackSnapshot(
      instanceId,
      (reason as "instance-preset" | "mods-refresh" | "packs-refresh" | "manual") || "manual",
      note
    );
  });
  ipcMain.handle("rollback:getLatest", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("rollback:getLatest: instanceId missing");
    return getLatestRollbackSnapshot(instanceId);
  });
  ipcMain.handle("rollback:restoreLatest", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("rollback:restoreLatest: instanceId missing");
    return restoreLatestRollbackSnapshot(instanceId);
  });

  // ---------- Optimizer ----------
  ipcMain.handle("optimizer:preview", async (_e, profile: "conservative" | "balanced" | "aggressive") => {
    return buildOptimizerPreview(profile || "balanced");
  });
  ipcMain.handle("optimizer:apply", async (_e, instanceId: string, profile: "conservative" | "balanced" | "aggressive") => {
    if (!instanceId) throw new Error("optimizer:apply: instanceId missing");
    return applyOptimizer(instanceId, profile || "balanced");
  });
  ipcMain.handle("optimizer:restore", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("optimizer:restore: instanceId missing");
    return restoreOptimizerDefaults(instanceId);
  });

  // ---------- Benchmark ----------
  ipcMain.handle("benchmark:run", async (_e, instanceId: string, profile?: string) => {
    if (!instanceId) throw new Error("benchmark:run: instanceId missing");
    return runBenchmark(instanceId, profile || "balanced");
  });
  ipcMain.handle("benchmark:list", async (_e, instanceId: string) => {
    if (!instanceId) throw new Error("benchmark:list: instanceId missing");
    return listBenchmarks(instanceId);
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
    const owner = BrowserWindow.fromWebContents(e.sender);

    const saveOpts = {
      title: "Export Diagnostics",
      defaultPath,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    };
    const picked = owner
      ? await dialog.showSaveDialog(owner, saveOpts)
      : await dialog.showSaveDialog(saveOpts);

    if (picked.canceled || !picked.filePath) {
      return { ok: false, canceled: true as const };
    }

    const outPath = exportDiagnosticsZip(picked.filePath);
    return { ok: true, canceled: false as const, path: outPath };
  });
  ipcMain.handle("preflight:run", async () => runPreflightChecks());
  ipcMain.handle("preflight:getLast", async () => getLastPreflightChecks());

  // ---------- Local Content (manual uploads) ----------
  registerContentIpc();
}
