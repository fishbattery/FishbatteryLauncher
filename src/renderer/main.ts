// FishbatteryLauncher
// Copyright (C) 2026 Gudmundur Magnus Johannsson
// Licensed under GPL v3
//
// Renderer overview:
// - Main UI controller for the launcher window.
// - Wires DOM events, renders views (Library/Capes/Settings), and calls backend IPC via `window.api`.
// - To trace behavior, start from element refs at top, then follow `.onclick` handlers and render/update functions.

import "./index.css";
import { CATALOG } from "../main/modrinthCatalog";
import { PACK_CATALOG } from "../main/modrinthPackCatalog";
import * as skinview3d from "skinview3d";

// Small DOM helper (keeps your current style)
const $ = (id: string) => document.getElementById(id) as HTMLElement;

// --- Core UI refs (IDs must match index.html) ---
const logsEl = $("logs") as HTMLPreElement;
const statusText = $("statusText");
const winBtnMin = $("winBtnMin") as HTMLButtonElement;
const winBtnMax = $("winBtnMax") as HTMLButtonElement;
const winBtnClose = $("winBtnClose") as HTMLButtonElement;
const windowTopbar = $("windowTopbar");
const windowTopbarPill = $("windowTopbarPill");

const instancesGrid = $("instancesGrid") as HTMLDivElement;
const searchInstances = $("searchInstances") as HTMLInputElement;

const navLibrary = $("navLibrary");
const navCapes = $("navCapes");
const navSettings = $("navSettings");
const sidebarSponsored = $("sidebarSponsored");
const sidebarSponsoredTitle = $("sidebarSponsoredTitle");
const sidebarSponsoredBody = $("sidebarSponsoredBody");
const sidebarSponsoredMediaText = $("sidebarSponsoredMediaText");
const sidebarSponsoredCta = $("sidebarSponsoredCta") as HTMLButtonElement;
const sidebarSponsoredUpgrade = $("sidebarSponsoredUpgrade") as HTMLButtonElement;
const sidebarDiscordBtn = $("sidebarDiscordBtn") as HTMLButtonElement;

const viewLibrary = $("viewLibrary");
const viewCapes = $("viewCapes");
const viewSettings = $("viewSettings");
const capesPanelRoot = $("capesPanelRoot");

const accountBtn = $("accountBtn");
const accountDropdown = $("accountDropdown");
const accountItems = $("accountItems");
const accountAdd = $("accountAdd");

const accountName = $("accountName");
const accountSub = $("accountSub");
const accountAvatarImg = $("accountAvatarImg") as HTMLImageElement;

const btnCreate = $("btnCreate");
const btnImport = $("btnImport");
const btnJoinPreferred = $("btnJoinPreferred");
const btnPlayActive = $("btnPlayActive");
const btnStopActive = $("btnStopActive");
const btnClearLogs = $("btnClearLogs");
const btnAnalyzeLogs = $("btnAnalyzeLogs");
const btnApplyDiagnosisFix = $("btnApplyDiagnosisFix") as HTMLButtonElement;
const btnToggleDiagnosisDetails = $("btnToggleDiagnosisDetails") as HTMLButtonElement;
const btnToggleDebugLogs = $("btnToggleDebugLogs") as HTMLButtonElement;
const btnCopyDiagnosisReport = $("btnCopyDiagnosisReport") as HTMLButtonElement;
const launchDiagnosis = $("launchDiagnosis");
const launchDiagnosisDetails = $("launchDiagnosisDetails");

// Settings nav + panels
const settingsTabGeneral = $("settingsTabGeneral");
const settingsTabTheme = $("settingsTabTheme");
const settingsTabInstall = $("settingsTabInstall");
const settingsTabWindow = $("settingsTabWindow");
const settingsTabJava = $("settingsTabJava");
const settingsTabHooks = $("settingsTabHooks");
const settingsTabProfile = $("settingsTabProfile");

const settingsPanelGeneral = $("settingsPanelGeneral");
const settingsPanelTheme = $("settingsPanelTheme");
const settingsPanelInstall = $("settingsPanelInstall");
const settingsPanelWindow = $("settingsPanelWindow");
const settingsPanelJava = $("settingsPanelJava");
const settingsPanelHooks = $("settingsPanelHooks");
const settingsPanelProfile = $("settingsPanelProfile");

// Modal
const modalBackdrop = $("modalBackdrop");
const modalTitle = $("modalTitle");
const modalClose = $("modalClose");
const modalCancel = $("modalCancel");
const modalCreate = $("modalCreate");

const newName = $("newName") as HTMLInputElement;
const newVersion = $("newVersion") as HTMLSelectElement;
const newMem = $("newMem") as HTMLInputElement;

const modalTabGeneral = $("modalTabGeneral");
const modalTabMods = $("modalTabMods");
const modalTabPacks = $("modalTabPacks");
const modalPanelGeneral = $("modalPanelGeneral");
const modalPanelMods = $("modalPanelMods");
const modalPanelPacks = $("modalPanelPacks");

const modalUpdateMods = $("modalUpdateMods");
const modalUpdatePacks = $("modalUpdatePacks");
const modalModsHint = $("modalModsHint");
const modalCompatGuidance = $("modalCompatGuidance");
const modalModsList = $("modalModsList");
const recommendedPacksList = $("recommendedPacksList");

const modalUploadLocalMod = $("modalUploadLocalMod");
const modalOpenInstanceFolder = $("modalOpenInstanceFolder");
const modalLocalModsList = $("modalLocalModsList");

const btnUploadResourcepack = $("btnUploadResourcepack");
const btnUploadShaderpack = $("btnUploadShaderpack");
const btnOpenInstanceFolder2 = $("btnOpenInstanceFolder2");
const btnOpenInstanceFolder3 = $("btnOpenInstanceFolder3");
const resourcepacksList = $("resourcepacksList");
const shaderpacksList = $("shaderpacksList");

const instanceAccount = $("instanceAccount") as HTMLSelectElement;
const instanceSyncEnabled = $("instanceSyncEnabled");
const instancePreset = $("instancePreset") as HTMLSelectElement;
const optProfile = $("optProfile") as HTMLSelectElement;
const btnOptimizeInstance = $("btnOptimizeInstance");
const btnRestoreOptimization = $("btnRestoreOptimization");
const btnRunBenchmark = $("btnRunBenchmark");
const serverNameInput = $("serverNameInput") as HTMLInputElement;
const serverAddressInput = $("serverAddressInput") as HTMLInputElement;
const btnSaveServerEntry = $("btnSaveServerEntry");
const serverList = $("serverList");
const btnExportServerProfile = $("btnExportServerProfile");
const btnImportServerProfile = $("btnImportServerProfile");
const createSourceCustom = $("createSourceCustom");
const createSourceImport = $("createSourceImport");
const createSourceModrinth = $("createSourceModrinth");
const createSourceCurseForge = $("createSourceCurseForge");
const createSourceTechnic = $("createSourceTechnic");
const createSourceATLauncher = $("createSourceATLauncher");
const createSourceFTB = $("createSourceFTB");
const createSourceHint = $("createSourceHint");
const createProviderImport = $("createProviderImport");
const createProviderMarketplace = $("createProviderMarketplace");
const createProviderMarketplaceTitle = $("createProviderMarketplaceTitle");
const createProviderMarketplaceHelp = $("createProviderMarketplaceHelp");
const createModrinthPanel = $("createModrinthPanel");
const createCurseForgePanel = $("createCurseForgePanel");
const providerArchiveActions = $("providerArchiveActions");
const providerArchiveHelp = $("providerArchiveHelp");
const providerSearchInput = $("providerSearchInput") as HTMLInputElement;
const btnProviderSearch = $("btnProviderSearch");
const providerResultsLabel = $("providerResultsLabel");
const providerSearchResults = $("providerSearchResults");
const btnProviderImportArchive = $("btnProviderImportArchive");
const modrinthSearchInput = $("modrinthSearchInput") as HTMLInputElement;
const btnModrinthSearch = $("btnModrinthSearch");
const modrinthResultsLabel = $("modrinthResultsLabel");
const modrinthSearchResults = $("modrinthSearchResults");
const btnPickInstanceIcon = $("btnPickInstanceIcon");
const btnClearInstanceIcon = $("btnClearInstanceIcon");
const btnResetInstanceIconTransform = $("btnResetInstanceIconTransform");
const instanceIconHint = $("instanceIconHint");
const instanceIconPreviewWrap = $("instanceIconPreviewWrap");
const instanceIconPreviewFrame = $("instanceIconPreviewFrame");
const instanceIconPreviewStatus = $("instanceIconPreviewStatus");
const instanceIconPreviewImage = $("instanceIconPreviewImage") as HTMLImageElement;
const instanceIconTransformControls = $("instanceIconTransformControls");
const instanceIconScale = $("instanceIconScale") as HTMLInputElement;
const instanceIconScaleValue = $("instanceIconScaleValue");
const instanceIconOffsetX = $("instanceIconOffsetX") as HTMLInputElement;
const instanceIconOffsetXValue = $("instanceIconOffsetXValue");
const instanceIconOffsetY = $("instanceIconOffsetY") as HTMLInputElement;
const instanceIconOffsetYValue = $("instanceIconOffsetYValue");
const btnCreateImportNow = $("btnCreateImportNow");
const createCustomFields = $("createCustomFields");
const createFilterReleases = $("createFilterReleases");
const createFilterSnapshots = $("createFilterSnapshots");
const createLoaderType = $("createLoaderType") as HTMLSelectElement;
const createLoaderVersion = $("createLoaderVersion") as HTMLInputElement;
const createLoaderHint = $("createLoaderHint");

let state: any = {
  versions: [],
  accounts: null,
  launcherAccount: null,
  launcherSubscription: null,
  instances: null
};

let busy = false;
let modalMode: "create" | "edit" = "create";
let editInstanceId: string | null = null;
let editServerId: string | null = null;
let launchLogBuffer: string[] = [];
let latestDiagnosis: any = null;
let diagnosisDetailsOpen = false;
let debugLogsVisible = false;
let capesSkinViewer: any = null;
let capesSkinControls: any = null;

type UpdaterUiState = {
  status: "idle" | "checking" | "update-available" | "up-to-date" | "downloading" | "downloaded" | "error";
  currentVersion: string;
  latestVersion?: string;
  progressPercent?: number;
  message?: string;
  updatedAt: number;
};

type CloudSyncUiState = {
  lastSyncedAt: number | null;
  lastStatus: "idle" | "up-to-date" | "pushed" | "pulled" | "conflict" | "error";
  lastError: string | null;
  lastRemoteRevision: number | null;
};

let updaterState: UpdaterUiState = {
  status: "idle",
  currentVersion: "unknown",
  message: "Updates not checked yet.",
  updatedAt: Date.now()
};
let cloudSyncState: CloudSyncUiState = {
  lastSyncedAt: null,
  lastStatus: "idle",
  lastError: null,
  lastRemoteRevision: null
};
let cloudSyncIntervalId: number | null = null;
let runningStatusPollId: number | null = null;
let profileRenderToken = 0;
let preflightState: any = null;
let hasAutoCheckedUpdates = false;
let promptedUpdateVersion: string | null = null;
let promptedInstallVersion: string | null = null;
let accountAvatarWarmupInFlight = false;
let createSource: "custom" | "import" | "modrinth" | "curseforge" | "technic" | "atlauncher" | "ftb" = "custom";
let createIncludeReleases = true;
let createIncludeSnapshots = false;
let selectedModrinthPack: {
  projectId: string;
  title: string;
  latestVersionId: string | null;
  iconUrl: string | null;
} | null = null;
let selectedProviderPack: { id: string; name: string; iconUrl?: string | null } | null = null;
let selectedCreateIconPath: string | null = null;
let clearExistingIconOnSave = false;
let selectedIconScalePct = 100;
let selectedIconOffsetXPct = 0;
let selectedIconOffsetYPct = 0;
let iconPreviewDragging = false;
let iconPreviewDragStartX = 0;
let iconPreviewDragStartY = 0;
let iconPreviewDragOriginX = 0;
let iconPreviewDragOriginY = 0;
let iconPreviewNaturalW = 0;
let iconPreviewNaturalH = 0;
let iconPreviewDragMaxShiftX = 0;
let iconPreviewDragMaxShiftY = 0;
let modalInstanceSyncEnabled = true;
let sponsoredIndex = 0;
let sponsoredBanners: Array<{
  title: string;
  body: string;
  cta: string;
  media: string;
  link: string;
}> = [
  {
    title: "Sponsored: Modpack Hosting",
    body: "Deploy modded servers quickly with one-click backups and version pinning.",
    cta: "See hosting tips",
    media: "Hosting",
    link: "https://fishbatteryapp.github.io/fishbattery-web/download.html"
  },
  {
    title: "Sponsored: Resource Pack Studio",
    body: "Build and preview texture packs with a streamlined desktop workflow.",
    cta: "View workflow",
    media: "Studio",
    link: "https://fishbatteryapp.github.io/fishbattery-web/"
  },
  {
    title: "Sponsored: Community Worlds",
    body: "Discover curated adventure maps tested for current launcher presets.",
    cta: "Browse highlights",
    media: "Worlds",
    link: "https://fishbatteryapp.github.io/fishbattery-web/download.html"
  }
];
let sponsoredCurrentLink = sponsoredBanners[0].link;

type SponsoredFeedAd = {
  id?: string;
  active?: boolean;
  placements?: string[];
  title?: string;
  body?: string;
  cta?: string;
  media?: string;
  link?: string;
};

const SPONSORED_FEED_URLS = ["https://fishbatteryapp.github.io/fishbattery-web/assets/ads.json"];
const DISCORD_INVITE_URL = "https://discord.gg/yT5zRsRXsf";

function getSelectedIconTransformPayload() {
  return {
    scale: Math.max(0.2, Math.min(5, selectedIconScalePct / 100)),
    offsetXPct: Math.max(-100, Math.min(100, selectedIconOffsetXPct)),
    offsetYPct: Math.max(-100, Math.min(100, selectedIconOffsetYPct))
  };
}

function renderIconTransformUi() {
  instanceIconScale.value = String(selectedIconScalePct);
  instanceIconScaleValue.textContent = `${selectedIconScalePct}%`;
  instanceIconOffsetX.value = String(selectedIconOffsetXPct);
  instanceIconOffsetXValue.textContent = `${selectedIconOffsetXPct}%`;
  instanceIconOffsetY.value = String(selectedIconOffsetYPct);
  instanceIconOffsetYValue.textContent = `${selectedIconOffsetYPct}%`;
  renderIconPreviewTransform();
}

function resetSelectedIconTransform() {
  selectedIconScalePct = 100;
  selectedIconOffsetXPct = 0;
  selectedIconOffsetYPct = 0;
  renderIconTransformUi();
}

function pathToFileUrl(p: string) {
  const normalized = String(p || "").replace(/\\/g, "/");
  if (!normalized) return "";
  const withSlash = /^[a-zA-Z]:\//.test(normalized) ? `/${normalized}` : normalized;
  const escaped = withSlash.replace(/#/g, "%23").replace(/\?/g, "%3F");
  return encodeURI(`file://${escaped}`);
}

function setIconPreviewSource(filePath: string | null) {
  void setIconPreviewSourceAsync(filePath);
}

async function setIconPreviewSourceAsync(filePath: string | null) {
  if (!filePath) {
    instanceIconPreviewWrap.style.display = "none";
    instanceIconTransformControls.style.display = "none";
    instanceIconPreviewImage.removeAttribute("src");
    instanceIconPreviewStatus.textContent = "Drag image to reposition. Scroll to zoom.";
    iconPreviewNaturalW = 0;
    iconPreviewNaturalH = 0;
    return;
  }
  instanceIconPreviewWrap.style.display = "";
  instanceIconTransformControls.style.display = "";
  instanceIconPreviewStatus.textContent = "Loading preview...";
  instanceIconPreviewImage.onload = () => {
    iconPreviewNaturalW = Number(instanceIconPreviewImage.naturalWidth || 0);
    iconPreviewNaturalH = Number(instanceIconPreviewImage.naturalHeight || 0);
    instanceIconPreviewStatus.textContent = "Drag image to reposition. Scroll to zoom.";
    instanceIconTransformControls.style.display = "";
    renderIconPreviewTransform();
  };
  instanceIconPreviewImage.onerror = () => {
    instanceIconPreviewStatus.textContent = "Could not load preview for this file.";
    instanceIconTransformControls.style.display = "none";
    instanceIconPreviewImage.removeAttribute("src");
    iconPreviewNaturalW = 0;
    iconPreviewNaturalH = 0;
  };
  try {
    const previewDataUrl = await window.api.instancesPreviewIconDataUrl(filePath);
    instanceIconPreviewImage.src = previewDataUrl || pathToFileUrl(filePath);
  } catch {
    instanceIconPreviewImage.src = pathToFileUrl(filePath);
  }
  renderIconPreviewTransform();
}

function getIconPreviewLayout() {
  const frame = instanceIconPreviewFrame as HTMLElement;
  const frameW = Math.max(1, frame.clientWidth || 240);
  const frameH = Math.max(1, frame.clientHeight || 240);
  const srcW = Math.max(1, iconPreviewNaturalW || 1);
  const srcH = Math.max(1, iconPreviewNaturalH || 1);
  const scale = Math.max(0.2, Math.min(5, selectedIconScalePct / 100));
  const coverScale = Math.max(frameW / srcW, frameH / srcH) * scale;
  const displayW = srcW * coverScale;
  const displayH = srcH * coverScale;
  const maxShiftX = Math.max(0, (displayW - frameW) / 2);
  const maxShiftY = Math.max(0, (displayH - frameH) / 2);
  const shiftX = (selectedIconOffsetXPct / 100) * maxShiftX;
  const shiftY = (selectedIconOffsetYPct / 100) * maxShiftY;
  const left = (frameW - displayW) / 2 + shiftX;
  const top = (frameH - displayH) / 2 + shiftY;
  return { left, top, width: displayW, height: displayH, maxShiftX, maxShiftY };
}

function renderIconPreviewTransform() {
  if (!selectedCreateIconPath || !iconPreviewNaturalW || !iconPreviewNaturalH) return;
  const layout = getIconPreviewLayout();
  instanceIconPreviewImage.style.left = `${layout.left}px`;
  instanceIconPreviewImage.style.top = `${layout.top}px`;
  instanceIconPreviewImage.style.width = `${layout.width}px`;
  instanceIconPreviewImage.style.height = `${layout.height}px`;
}

// ---------------- Settings ----------------
type LoaderKind = "vanilla" | "fabric" | "quilt" | "forge" | "neoforge";
type InstancePresetId = "none" | "max-fps" | "shader-friendly" | "distant-horizons-worldgen" | "pvp";
type InstancePresetVariant = {
  memoryMb: number;
  enableMods: string[];
  enablePacks: string[];
};

type InstancePreset = {
  id: Exclude<InstancePresetId, "none">;
  name: string;
  description: string;
  variants: Partial<Record<LoaderKind, InstancePresetVariant>>;
};

type ThemeId =
  | "ocean"
  | "dark"
  | "oled"
  | "system-default"
  | "windows-xp"
  | "end-dimension"
  | "nether-core"
  | "ice-frost"
  | "prism-style"
  | "creeper-mode"
  | "retro-2000s"
  | "rgb-gamer"
  | "glass-modern-w11"
  | "console-mode"
  | "dynamic-accent"
  | "time-of-day"
  | "biome-plains"
  | "biome-desert"
  | "biome-jungle"
  | "biome-snow"
  | "biome-cherry-grove"
  | "developer-mode"
  | "minimal-bw";

const THEME_OPTIONS: Array<{ value: ThemeId; label: string }> = [
  { value: "ocean", label: "Ocean" },
  { value: "dark", label: "Dark" },
  { value: "oled", label: "OLED" },
  { value: "system-default", label: "System Default" },
  { value: "windows-xp", label: "Windows XP" },
  { value: "end-dimension", label: "End Dimension" },
  { value: "nether-core", label: "Nether Core" },
  { value: "ice-frost", label: "Ice / Frost" },
  { value: "prism-style", label: "Prism Style (Minimal Flat)" },
  { value: "creeper-mode", label: "Creeper Mode" },
  { value: "retro-2000s", label: "Retro 2000s" },
  { value: "rgb-gamer", label: "RGB Gamer" },
  { value: "glass-modern-w11", label: "Glass (Modern Windows 11)" },
  { value: "console-mode", label: "Console Mode" },
  { value: "dynamic-accent", label: "Dynamic Accent Theme" },
  { value: "time-of-day", label: "Time-of-Day Theme" },
  { value: "biome-plains", label: "Biome: Plains" },
  { value: "biome-desert", label: "Biome: Desert" },
  { value: "biome-jungle", label: "Biome: Jungle" },
  { value: "biome-snow", label: "Biome: Snow" },
  { value: "biome-cherry-grove", label: "Biome: Cherry Grove" },
  { value: "developer-mode", label: "Developer Mode" },
  { value: "minimal-bw", label: "Minimal B&W" }
];

const THEME_BEHAVIOR_TEXT: Record<ThemeId, string> = {
  ocean: "Calm blue/teal look with soft depth and smooth contrast.",
  dark: "Neutral charcoal UI optimized for readability during long sessions.",
  oled: "True-black high-contrast UI tuned for OLED displays.",
  "system-default": "Follows your OS dark/light appearance and adapts accent behavior.",
  "windows-xp": "Retro glossy XP-style chrome with classic blue desktop feel.",
  "end-dimension": "Deep violet atmosphere with soft glow accents.",
  "nether-core": "Dark red/orange high-energy style inspired by the Nether.",
  "ice-frost": "Cool frosted blues with crisp contrast and calm visuals.",
  "prism-style": "Minimal flat surfaces with a clean productivity-first layout.",
  "creeper-mode": "Matte dark base with bright creeper-green accents.",
  "retro-2000s": "Early-2000s glossy UI vibe with modern spacing.",
  "rgb-gamer": "Dark base with subtle animated neon color energy.",
  "glass-modern-w11": "Modern acrylic-style translucent panels and layered depth.",
  "console-mode": "Larger controls and spacing for dashboard-like usability.",
  "dynamic-accent": "User-driven accent, radius and border customization.",
  "time-of-day": "Auto-switches style through morning/day/evening/night.",
  "biome-plains": "Soft green natural palette inspired by plains biomes.",
  "biome-desert": "Warm sandy palette with subdued earth tones.",
  "biome-jungle": "Dense green contrast with humid jungle mood.",
  "biome-snow": "Cold pale palette inspired by snowy biomes.",
  "biome-cherry-grove": "Gentle pink/cherry tones with soft contrast.",
  "developer-mode": "Terminal-inspired mono style with utilitarian emphasis.",
  "minimal-bw": "Monochrome grayscale style focused on structure and clarity."
};

const THEME_DEFAULT_ACCENT: Record<Exclude<ThemeId, "system-default" | "time-of-day">, string> = {
  ocean: "#3ddc84",
  dark: "#57d2ff",
  oled: "#6ef3b2",
  "windows-xp": "#2f7fde",
  "end-dimension": "#b983ff",
  "nether-core": "#ff6b4d",
  "ice-frost": "#87d6ff",
  "prism-style": "#5ea3ff",
  "creeper-mode": "#62e566",
  "retro-2000s": "#7ac3ff",
  "rgb-gamer": "#5b8bff",
  "glass-modern-w11": "#C5E4F2",
  "console-mode": "#6bd5ff",
  "dynamic-accent": "#3ddc84",
  "biome-plains": "#8bd16f",
  "biome-desert": "#e6be72",
  "biome-jungle": "#4fd184",
  "biome-snow": "#98d5ff",
  "biome-cherry-grove": "#f49cd0",
  "developer-mode": "#8ad4ff",
  "minimal-bw": "#d9d9d9"
};

const PREMIUM_THEMES = new Set<ThemeId>([
  "windows-xp",
  "end-dimension",
  "nether-core",
  "ice-frost",
  "retro-2000s",
  "rgb-gamer",
  "glass-modern-w11",
  "console-mode",
  "dynamic-accent",
  "biome-jungle",
  "biome-snow",
  "biome-cherry-grove",
  "developer-mode"
]);

function getLauncherTier(): "free" | "premium" | "founder" {
  const fromStatus = state.launcherSubscription?.tier;
  if (fromStatus === "premium" || fromStatus === "founder") return fromStatus;
  const fromAccount = String(state.launcherAccount?.activeAccount?.subscriptionTier || "").toLowerCase();
  if (fromAccount === "premium" || fromAccount === "founder") return fromAccount;
  return "free";
}

function hasPremium(): boolean {
  const tier = getLauncherTier();
  return tier === "premium" || tier === "founder";
}

function localCapeTierLabel(tier: "free" | "premium" | "founder") {
  if (tier === "founder") return "Founder";
  if (tier === "premium") return "Premium";
  return "Free";
}

async function openUpgradeFlow() {
  const opened = await window.api.launcherAccountOpenUpgradePage();
  if (!opened) {
    alert("Upgrade page could not be opened. Check FISHBATTERY_UPGRADE_URL or BILLING_UPGRADE_URL.");
  }
}

type AppSettings = {
  theme: ThemeId;
  blur: boolean; // maps to :root[data-glass="1"]
  accentColor: string;
  surfaceAlpha: number;
  cornerRadius: number;
  borderThickness: number;
  pixelFont: boolean;
  customBackgroundDataUrl: string;
  updateChannel: "stable" | "beta";
  showSnapshots: boolean;
  autoUpdateMods: boolean;
  defaultMemoryMb: number;
  fullscreen: boolean;
  winW: number;
  winH: number;
  jvmArgs: string;
  preLaunch: string;
  postExit: string;
  settingsUpdatedAt: number;
  cloudSyncEnabled: boolean;
  cloudSyncAuto: boolean;
  cloudSyncConflictPolicy: "ask" | "newer-wins" | "prefer-local" | "prefer-cloud";
};

const SETTINGS_KEY = "fishbattery.settings";

const defaultSettings: AppSettings = {
  theme: "ocean",
  blur: true,
  accentColor: "#3ddc84",
  surfaceAlpha: 88,
  cornerRadius: 12,
  borderThickness: 1,
  pixelFont: false,
  customBackgroundDataUrl: "",
  updateChannel: "stable",
  showSnapshots: false,
  autoUpdateMods: true,
  defaultMemoryMb: 4096,
  fullscreen: false,
  winW: 854,
  winH: 480,
  jvmArgs: "",
  preLaunch: "",
  postExit: "",
  settingsUpdatedAt: Date.now(),
  cloudSyncEnabled: true,
  cloudSyncAuto: true,
  cloudSyncConflictPolicy: "ask"
};

const THEME_ID_SET = new Set<ThemeId>(THEME_OPTIONS.map((o) => o.value));

const INSTANCE_PRESETS: Record<Exclude<InstancePresetId, "none">, InstancePreset> = {
  "max-fps": {
    id: "max-fps",
    name: "Max FPS",
    description: "Prioritizes frame rate and frametime stability with low-overhead visual defaults.",
    variants: {
      fabric: {
        memoryMb: 4096,
        enableMods: [
          "sodium",
          "lithium",
          "ferrite-core",
          "indium",
          "immediatelyfast",
          "entityculling",
          "modernfix",
          "noisium",
          "c2me",
          "starlight",
          "sodium-extra",
          "reeses-sodium-options",
          "dynamic-fps",
          "fabric-api"
        ],
        enablePacks: ["fast-better-grass", "better-leaves"]
      },
      vanilla: { memoryMb: 4096, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      quilt: { memoryMb: 4096, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      forge: { memoryMb: 6144, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      neoforge: { memoryMb: 6144, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] }
    }
  },
  "shader-friendly": {
    id: "shader-friendly",
    name: "Shader Friendly",
    description: "Keeps shader compatibility/performance balance and enables a curated shader stack.",
    variants: {
      fabric: {
        memoryMb: 6144,
        enableMods: [
          "sodium",
          "lithium",
          "ferrite-core",
          "indium",
          "immediatelyfast",
          "entityculling",
          "iris",
          "sodium-extra",
          "reeses-sodium-options",
          "dynamic-fps",
          "fabric-api"
        ],
        enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
      },
      vanilla: {
        memoryMb: 6144,
        enableMods: [],
        enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
      },
      quilt: {
        memoryMb: 6144,
        enableMods: [],
        enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
      },
      forge: {
        memoryMb: 7168,
        enableMods: [],
        enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
      },
      neoforge: {
        memoryMb: 7168,
        enableMods: [],
        enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
      }
    }
  },
  "distant-horizons-worldgen": {
    id: "distant-horizons-worldgen",
    name: "Distant Horizons Worldgen Mode",
    description: "Optimized for long-distance terrain generation and traversal-heavy worlds.",
    variants: {
      fabric: {
        memoryMb: 8192,
        enableMods: [
          "sodium",
          "lithium",
          "ferrite-core",
          "indium",
          "immediatelyfast",
          "entityculling",
          "modernfix",
          "noisium",
          "c2me",
          "starlight",
          "sodium-extra",
          "reeses-sodium-options",
          "distanthorizons",
          "fabric-api"
        ],
        enablePacks: ["fast-better-grass", "better-leaves"]
      },
      vanilla: { memoryMb: 7168, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      quilt: { memoryMb: 7168, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      forge: { memoryMb: 8192, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] },
      neoforge: { memoryMb: 8192, enableMods: [], enablePacks: ["fast-better-grass", "better-leaves"] }
    }
  },
  pvp: {
    id: "pvp",
    name: "PvP Ready",
    description: "Low-latency visual clarity profile for competitive play without cheat-style modifications.",
    variants: {
      fabric: {
        memoryMb: 4096,
        enableMods: [
          "sodium",
          "lithium",
          "ferrite-core",
          "immediatelyfast",
          "entityculling",
          "dynamic-fps",
          "pvp-essentials-refined",
          "mod-menu",
          "fabric-api"
        ],
        enablePacks: ["xalis-enchanted-books", "f8thful"]
      },
      vanilla: { memoryMb: 4096, enableMods: [], enablePacks: ["xalis-enchanted-books", "f8thful"] },
      quilt: { memoryMb: 4096, enableMods: [], enablePacks: ["xalis-enchanted-books", "f8thful"] },
      forge: { memoryMb: 5120, enableMods: [], enablePacks: ["xalis-enchanted-books", "f8thful"] },
      neoforge: { memoryMb: 5120, enableMods: [], enablePacks: ["xalis-enchanted-books", "f8thful"] }
    }
  }
};

const MOD_ALTERNATIVES: Record<string, string[]> = {
  sodium: ["Try the Shader Friendly path (Iris + Sodium).", "Use Max FPS preset for a known-good baseline."],
  iris: ["Use Max FPS preset when shaders are not required.", "Try Complementary Unbound/Photon after refreshing packs."],
  c2me: ["Use Noisium + Starlight as fallback worldgen optimization.", "Use Distant Horizons preset without C2ME."],
  distanthorizons: ["Use Max FPS preset for stable vanilla-distance rendering.", "Try C2ME + Noisium workflow for worldgen speed."]
};

function getSettings(): AppSettings {
  try {
    const raw = { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}) };
    const theme = THEME_ID_SET.has(raw.theme as ThemeId) ? (raw.theme as ThemeId) : defaultSettings.theme;
    const accentColor =
      typeof raw.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
        ? raw.accentColor
        : defaultSettings.accentColor;
    const surfaceAlpha = Math.max(
      70,
      Math.min(98, Number.isFinite(Number(raw.surfaceAlpha)) ? Number(raw.surfaceAlpha) : defaultSettings.surfaceAlpha)
    );
    const customBackgroundDataUrl =
      typeof raw.customBackgroundDataUrl === "string" && /^data:image\//.test(raw.customBackgroundDataUrl)
        ? raw.customBackgroundDataUrl
        : "";
    const cornerRadius = Math.max(
      8,
      Math.min(22, Number.isFinite(Number(raw.cornerRadius)) ? Number(raw.cornerRadius) : defaultSettings.cornerRadius)
    );
    const borderThickness = Math.max(
      1,
      Math.min(3, Number.isFinite(Number(raw.borderThickness)) ? Number(raw.borderThickness) : defaultSettings.borderThickness)
    );
    const pixelFont = !!raw.pixelFont;
    const settingsUpdatedAt = Math.max(
      0,
      Number.isFinite(Number(raw.settingsUpdatedAt)) ? Number(raw.settingsUpdatedAt) : defaultSettings.settingsUpdatedAt
    );
    const cloudSyncEnabled = raw.cloudSyncEnabled !== false;
    const cloudSyncAuto = raw.cloudSyncAuto !== false;
    const cloudSyncConflictPolicy =
      raw.cloudSyncConflictPolicy === "newer-wins" ||
      raw.cloudSyncConflictPolicy === "prefer-local" ||
      raw.cloudSyncConflictPolicy === "prefer-cloud"
        ? raw.cloudSyncConflictPolicy
        : "ask";
    return {
      ...raw,
      theme,
      accentColor,
      surfaceAlpha,
      customBackgroundDataUrl,
      cornerRadius,
      borderThickness,
      pixelFont,
      settingsUpdatedAt,
      cloudSyncEnabled,
      cloudSyncAuto,
      cloudSyncConflictPolicy
    };
  } catch {
    return { ...defaultSettings };
  }
}

function setSettings(patch: Partial<AppSettings>, opts?: { touchUpdatedAt?: boolean }) {
  const next = { ...getSettings(), ...patch };
  if (opts?.touchUpdatedAt !== false && !Object.prototype.hasOwnProperty.call(patch, "settingsUpdatedAt")) {
    next.settingsUpdatedAt = Date.now();
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (err: any) {
    alert(`Could not save setting: ${String(err?.message ?? err)}`);
    return;
  }
  applySettingsToDom(next);
}

function hexToRgbTriplet(hex: string) {
  const m = String(hex || "").trim().match(/^#?([a-fA-F0-9]{6})$/);
  if (!m) return "61,220,132";
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function getSystemAccentColor() {
  if (navigator.platform.toLowerCase().includes("win")) return "#4cc2ff";
  if (navigator.platform.toLowerCase().includes("mac")) return "#5ac8fa";
  return "#50d1b8";
}

function cssColorToHex(input: string): string | null {
  const raw = String(input || "").trim();
  const hex6 = raw.match(/^#([0-9a-fA-F]{6})$/);
  if (hex6) return `#${hex6[1].toLowerCase()}`;
  const hex3 = raw.match(/^#([0-9a-fA-F]{3})$/);
  if (hex3) {
    const h = hex3[1];
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }

  const rgb = raw.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);
  if (!rgb) return null;
  const nums = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((n) => Math.max(0, Math.min(255, n)));
  return `#${nums.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function idealSymbolColor(bgHex: string): string {
  const m = String(bgHex || "").trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!m) return "#d9ebfb";
  const hex = m[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#101820" : "#d9ebfb";
}

function resolveEffectiveTheme(theme: ThemeId): Exclude<ThemeId, "system-default" | "time-of-day"> {
  if (theme === "system-default") {
    const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "dark" : "ice-frost";
  }
  if (theme === "time-of-day") {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return "oled";
    if (hour >= 5 && hour < 12) return "ice-frost";
    if (hour >= 12 && hour < 18) return "prism-style";
    if (hour >= 18 && hour < 22) return "dark";
    return "oled";
  }
  return theme;
}

function defaultAccentForTheme(theme: ThemeId): string {
  if (theme === "system-default") return getSystemAccentColor();
  const effective = resolveEffectiveTheme(theme);
  return THEME_DEFAULT_ACCENT[effective] || "#3ddc84";
}

function applySettingsToDom(s: AppSettings) {
  const effectiveTheme = resolveEffectiveTheme(s.theme);

  document.documentElement.dataset.theme = effectiveTheme;
  document.documentElement.dataset.themeSource = s.theme;
  document.documentElement.dataset.font = s.pixelFont ? "pixel" : "default";
  document.documentElement.dataset.glass = s.blur ? "1" : "0";
  document.documentElement.style.setProperty("--r12", `${Math.max(8, Math.min(22, s.cornerRadius || 12))}px`);
  document.documentElement.style.setProperty("--r16", `${Math.max(12, Math.min(28, (s.cornerRadius || 12) + 4))}px`);
  document.documentElement.style.setProperty("--stroke-w", `${Math.max(1, Math.min(3, s.borderThickness || 1))}px`);
  const alpha = Math.max(70, Math.min(98, Number(s.surfaceAlpha || 88)));
  document.documentElement.style.setProperty("--surface-alpha", String(alpha / 100));
  const accent =
    s.theme === "system-default" && (!s.accentColor || s.accentColor === defaultSettings.accentColor)
      ? getSystemAccentColor()
      : s.theme === "glass-modern-w11" && (!s.accentColor || s.accentColor === defaultSettings.accentColor)
        ? "#C5E4F2"
        : s.accentColor || "#3ddc84";
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-rgb", hexToRgbTriplet(accent));

  if (s.customBackgroundDataUrl) {
    document.body.style.backgroundImage = `linear-gradient(rgba(7, 12, 18, .68), rgba(7, 12, 18, .68)), url("${s.customBackgroundDataUrl}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundAttachment = "";
  }
}

// ---------------- Utilities ----------------
function appendLog(line: string) {
  const s = logsEl.textContent || "";
  logsEl.textContent = s + (s ? "\n" : "") + line;
  logsEl.scrollTop = logsEl.scrollHeight;
  launchLogBuffer.push(line);
  if (launchLogBuffer.length > 500) {
    launchLogBuffer = launchLogBuffer.slice(launchLogBuffer.length - 500);
  }
  const status = summarizeLogForStatus(line);
  if (status) setStatus(status);
}

function setStatus(text: string) {
  statusText.textContent = text || "";
}

function summarizeLogForStatus(line: string) {
  const raw = String(line || "").trim();
  if (!raw) return "";
  if (/^\s*at\s+\S+/.test(raw)) return "";
  const cleaned = raw.replace(/^\[[^\]]+\]\s*/, "").trim();
  if (!cleaned) return "";
  if (cleaned.length > 180) return "";
  return cleaned;
}

function renderDebugLogsVisibility() {
  logsEl.style.display = debugLogsVisible ? "" : "none";
  btnToggleDebugLogs.textContent = debugLogsVisible ? "Hide Debug Logs" : "Show Debug Logs";
}

function findDiagnosisEvidence(diag: any, lines: string[]) {
  const recent = (lines || []).slice(-200);
  const patterns: Record<string, string[]> = {
    "missing-fabric-loader": ["fabric", "no such file", "install incomplete"],
    "duplicate-mods": ["duplicate", "duplicatemodsfoundexception"],
    "wrong-java-version": ["unsupportedclassversionerror", "class file version", "requires java"],
    "mod-mismatch": ["modresolutionexception", "depends on", "requires minecraft", "incompatible"]
  };
  const want = patterns[String(diag?.code || "")] || [];
  if (!want.length) return null;

  for (const line of recent.reverse()) {
    const lower = String(line || "").toLowerCase();
    if (want.some((p) => lower.includes(p))) return line;
  }
  return null;
}

function redactSensitive(text: string) {
  return String(text || "")
    .replace(/\bgho_[A-Za-z0-9_]+\b/g, "gho_[REDACTED]")
    .replace(/\bghp_[A-Za-z0-9_]+\b/g, "ghp_[REDACTED]")
    .replace(/\baccess[_-]?token[\"'=: ]+[A-Za-z0-9._-]+/gi, "access_token=[REDACTED]")
    .replace(/\bbearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}

function renderLaunchDiagnosis(diag: any | null) {
  latestDiagnosis = diag;
  if (!diag) {
    launchDiagnosis.style.display = "none";
    launchDiagnosis.textContent = "";
    launchDiagnosisDetails.style.display = "none";
    launchDiagnosisDetails.textContent = "";
    btnApplyDiagnosisFix.disabled = true;
    return;
  }

  const lines = [
    `Diagnosis: ${diag.summary}`,
    ...(diag.details ?? []).map((x: string) => `- ${x}`),
    ...(diag.recommendedActions ?? []).map((x: string) => `Action: ${x}`)
  ];
  launchDiagnosis.textContent = lines.join("\n");
  launchDiagnosis.style.display = "";
  btnApplyDiagnosisFix.disabled = !diag.canAutoFix || !diag.fixAction || diag.fixAction === "none";

  const evidence = findDiagnosisEvidence(diag, launchLogBuffer);
  const detailLines = [
    `Code: ${diag.code}`,
    `Severity: ${diag.severity}`,
    `Auto fix: ${diag.canAutoFix ? diag.fixAction : "none"}`,
    evidence ? `Evidence: ${evidence}` : "Evidence: no direct signature line captured"
  ];
  launchDiagnosisDetails.textContent = detailLines.join("\n");
  launchDiagnosisDetails.style.display = diagnosisDetailsOpen ? "" : "none";
  btnToggleDiagnosisDetails.textContent = diagnosisDetailsOpen ? "Hide details" : "Details";
}

async function runLaunchDiagnosis(instanceId: string | null) {
  if (!instanceId) return null;
  const diag = await window.api.launchDiagnose(instanceId, launchLogBuffer);
  renderLaunchDiagnosis(diag);
  appendLog(`[diagnostics] ${diag.summary}`);
  return diag;
}

function describeRollbackReason(reason: string) {
  if (reason === "instance-preset") return "instance preset apply";
  if (reason === "mods-refresh") return "mods refresh";
  if (reason === "packs-refresh") return "packs refresh";
  return "manual change";
}

async function maybeOfferRollback(instanceId: string, diag: any | null) {
  if (!diag || diag.severity !== "critical") return;
  const latest = await window.api.rollbackGetLatest(instanceId);
  if (!latest) return;

  const stamp = new Date(Number(latest.createdAt || Date.now())).toLocaleString();
  const reason = describeRollbackReason(String(latest.reason || ""));
  const yes = confirm(
    `A critical launch issue was detected.\n\nRollback to last-known-good snapshot from ${stamp} (${reason})?`
  );
  if (!yes) return;

  await window.api.rollbackRestoreLatest(instanceId);
  state.instances = await window.api.instancesList();
  await renderInstances();
  appendLog(`[rollback] Restored snapshot from ${stamp} (${reason}).`);
}

async function guarded(fn: () => Promise<void>) {
  if (busy) return;
  busy = true;
  void renderSponsoredBannerState();
  try {
    await fn();
  } finally {
    busy = false;
    void renderSponsoredBannerState();
  }
}

function hasAdsFreeSubscription(): boolean {
  if (hasPremium()) return true;
  return !!state.launcherSubscription?.features?.adsFree;
}

async function shouldHideSponsoredBanner() {
  if (hasAdsFreeSubscription()) return true;
  if (busy) return true;
  if (latestDiagnosis?.severity === "critical") return true;
  const active = state.instances?.activeInstanceId ?? null;
  if (!active) return false;
  try {
    return !!(await window.api.launchIsRunning(active));
  } catch {
    return false;
  }
}

async function loadSponsoredBannersFromFeed() {
  const fallback = sponsoredBanners;
  for (const url of SPONSORED_FEED_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store"
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      const ads: SponsoredFeedAd[] = Array.isArray(json?.ads) ? json.ads : [];
      const launcherAds = ads.filter((ad) => {
        if (ad?.active === false) return false;
        if (!Array.isArray(ad?.placements)) return false;
        return ad.placements.includes("launcher-sidebar");
      });
      const mapped = launcherAds
        .map((ad) => ({
          title: String(ad.title || "").trim(),
          body: String(ad.body || "").trim(),
          cta: String(ad.cta || "Learn more").trim(),
          media: String(ad.media || "Sponsor").trim(),
          link: String(ad.link || "").trim()
        }))
        .filter((ad) => ad.title && ad.body && ad.link && /^https?:\/\//i.test(ad.link));
      if (mapped.length) {
        sponsoredBanners = mapped;
        if (!mapped.some((x) => x.link === sponsoredCurrentLink)) {
          sponsoredCurrentLink = mapped[0].link;
        }
        return;
      }
    } catch {
      // continue to fallback
    }
  }
  sponsoredBanners = fallback;
}

async function renderSponsoredBannerState() {
  if (!sidebarSponsored) return;
  const hide = await shouldHideSponsoredBanner();
  sidebarSponsored.style.display = hide ? "none" : "";
  if (hide) return;

  const entry = sponsoredBanners[sponsoredIndex % sponsoredBanners.length];
  sponsoredIndex += 1;
  sidebarSponsoredTitle.textContent = entry.title;
  sidebarSponsoredBody.textContent = entry.body;
  sidebarSponsoredMediaText.textContent = entry.media;
  sidebarSponsoredCta.textContent = entry.cta;
  sponsoredCurrentLink = entry.link;
}

function setView(which: "library" | "capes" | "settings") {
  viewLibrary.style.display = which === "library" ? "" : "none";
  viewCapes.style.display = which === "capes" ? "" : "none";
  viewSettings.style.display = which === "settings" ? "" : "none";
  navLibrary.classList.toggle("active", which === "library");
  navCapes.classList.toggle("active", which === "capes");
  navSettings.classList.toggle("active", which === "settings");
  if (which !== "capes") {
    disposeCapesCharacterPreview();
  }
  if (which === "capes") {
    void renderCapesView();
  }
}

async function renderCapesView(forceRefresh = false) {
  capesPanelRoot.innerHTML = "";
  const accounts = state.accounts?.accounts ?? [];
  const activeId = state.accounts?.activeId ?? null;
  const activeMc = accounts.find((a: any) => a.id === activeId) ?? accounts[0] ?? null;
  const activeMcId = String(activeMc?.id || "");
  const localCapeCatalog = await window.api.capesListLocal();
  let selectedLocalCapeId = "";
  if (activeMcId) {
    try {
      const sel = await window.api.capesGetLocalSelection(activeMcId);
      selectedLocalCapeId = String(sel?.capeId || "");
    } catch {
      selectedLocalCapeId = "";
    }
  }

  const shell = document.createElement("div");
  shell.className = "capeChooser";
  capesPanelRoot.appendChild(shell);

  const strip = document.createElement("div");
  strip.className = "capeStripLabel";
  strip.textContent = "Choose your cape";
  shell.appendChild(strip);

  const section = document.createElement("div");
  section.className = "capeSection";
  shell.appendChild(section);

  const heading = document.createElement("div");
  heading.className = "capeSectionHeading";
  heading.textContent = "Owned capes";
  section.appendChild(heading);

  const sub = document.createElement("div");
  sub.className = "capeSectionSub";
  sub.textContent = activeMc
    ? `Official Minecraft capes for ${getAccountLabel(activeMc)}.`
    : "Add and select a Minecraft account to manage official capes.";
  section.appendChild(sub);

  if (activeMc) {
    const actions = document.createElement("div");
    actions.className = "row";
    actions.style.justifyContent = "flex-end";
    actions.style.marginTop = "8px";
    const btnRefresh = document.createElement("button");
    btnRefresh.className = "btn";
    btnRefresh.textContent = "Refresh";
    btnRefresh.onclick = () => guarded(async () => renderCapesView(true));
    actions.appendChild(btnRefresh);
    section.appendChild(actions);
  }

  if (!activeMc) {
    const note = document.createElement("div");
    note.className = "setHelp";
    note.style.marginTop = "12px";
    note.textContent = "Official capes are unavailable until a Minecraft account is selected.";
    section.appendChild(note);
  }

  let capeState:
    | {
        accountId: string;
        username: string;
        skinUrl: string | null;
        skinDataUrl: string | null;
        activeCapeId: string | null;
        capes: Array<{
          id: string;
          name: string;
          url: string;
          previewDataUrl: string | null;
          state: string;
          active: boolean;
        }>;
      }
    | null = null;
  if (activeMcId) {
    try {
      capeState = await window.api.capesListOfficial(activeMcId, forceRefresh);
    } catch (err: any) {
      const row = document.createElement("div");
      row.className = "setRow";
      row.style.marginTop = "12px";
      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      const title = document.createElement("div");
      title.className = "setLabel";
      title.textContent = "Could not load official capes";
      const help = document.createElement("div");
      help.className = "setHelp";
      help.textContent = String(err?.message || err || "Unknown error");
      left.appendChild(title);
      left.appendChild(help);
      row.appendChild(left);
      capesPanelRoot.appendChild(row);
    }
  }

  // Current player preview (skin + cape), similar to Minecraft launcher.
  const activeLocalCape = (localCapeCatalog?.items || []).find((x: any) => x.id === selectedLocalCapeId) ?? null;
  const activeOfficialCape =
    capeState?.activeCapeId && capeState?.capes?.length
      ? capeState.capes.find((x) => x.id === capeState?.activeCapeId) ?? null
      : null;
  const mannequinCapeSource =
    (activeLocalCape?.previewDataUrl || null) ??
    (activeOfficialCape?.previewDataUrl || activeOfficialCape?.url || null);
  const mannequinSkinSource = capeState?.skinDataUrl || capeState?.skinUrl || null;
  const mannequinLabel = activeLocalCape
    ? `${activeLocalCape.name} (Launcher ${localCapeTierLabel(activeLocalCape.tier)})`
    : activeOfficialCape
      ? `${activeOfficialCape.name} (Official)`
      : "No Cape";

  const previewRow = document.createElement("div");
  previewRow.className = "capeMannequinRow";
  const stage = document.createElement("div");
  stage.className = "capeMannequinStage";
  const mannequinHost = document.createElement("div");
  mannequinHost.className = "capeMannequinHost";
  stage.appendChild(mannequinHost);
  previewRow.appendChild(stage);

  const meta = document.createElement("div");
  meta.className = "capeMannequinMeta";
  const metaTitle = document.createElement("div");
  metaTitle.className = "capeMannequinTitle";
  metaTitle.textContent = "Current";
  const metaText = document.createElement("div");
  metaText.className = "capeMannequinText";
  metaText.textContent = mannequinLabel;
  meta.appendChild(metaTitle);
  meta.appendChild(metaText);
  const metaHelp = document.createElement("div");
  metaHelp.className = "capeMannequinHelp";
  metaHelp.textContent = "Drag to rotate";
  meta.appendChild(metaHelp);
  previewRow.appendChild(meta);
  shell.appendChild(previewRow);
  await renderInteractiveCharacterPreview(mannequinHost, mannequinSkinSource, mannequinCapeSource);

  const buildTile = (cfg: {
    label: string;
    imageUrl: string | null;
    active: boolean;
    onSelect: () => void;
    subLabel?: string;
  }) => {
    const tile = document.createElement("button");
    tile.className = `capeTile${cfg.active ? " active" : ""}`;
    tile.type = "button";
    tile.onclick = () => guarded(async () => cfg.onSelect());

    const preview = document.createElement("div");
    preview.className = "capeTilePreview";
    if (cfg.imageUrl) {
      const img = document.createElement("img");
      img.className = "capeTileImg";
      img.onerror = () => {
        img.remove();
        const ghost = document.createElement("div");
        ghost.className = "capeTileGhost";
        preview.appendChild(ghost);
      };
      void setCapePreviewImage(img, cfg.imageUrl);
      img.alt = `${cfg.label} cape`;
      preview.appendChild(img);
    } else {
      const ghost = document.createElement("div");
      ghost.className = "capeTileGhost";
      preview.appendChild(ghost);
    }

    const footer = document.createElement("div");
    footer.className = "capeTileFooter";
    const dot = document.createElement("span");
    dot.className = `capeTileDot${cfg.active ? " on" : ""}`;
    const text = document.createElement("span");
    text.className = "capeTileLabel";
    text.textContent = cfg.label;
    footer.appendChild(dot);
    footer.appendChild(text);
    if (cfg.subLabel) {
      const subText = document.createElement("small");
      subText.className = "capeTileSub";
      subText.textContent = cfg.subLabel;
      footer.appendChild(subText);
    }

    tile.appendChild(preview);
    tile.appendChild(footer);
    return tile;
  };

  if (capeState) {
    const grid = document.createElement("div");
    grid.className = "capeGrid";
    section.appendChild(grid);

    grid.appendChild(
      buildTile({
        label: "No Cape",
        imageUrl: null,
        active: !capeState.activeCapeId,
        onSelect: async () => {
          await window.api.capesSetOfficialActive(activeMcId, null);
          await renderCapesView(true);
        }
      })
    );

    for (const item of capeState.capes) {
      grid.appendChild(
        buildTile({
          label: item.name,
          imageUrl: item.previewDataUrl || null,
          active: !!item.active,
          onSelect: async () => {
            await window.api.capesSetOfficialActive(activeMcId, item.id);
            await renderCapesView(true);
          }
        })
      );
    }
  }

  const localSection = document.createElement("div");
  localSection.className = "capeSection";
  localSection.style.marginTop = "14px";
  shell.appendChild(localSection);

  const localHeading = document.createElement("div");
  localHeading.className = "capeSectionHeading";
  localHeading.textContent = "Fishbattery capes";
  localSection.appendChild(localHeading);

  const localSub = document.createElement("div");
  localSub.className = "capeSectionSub";
  localSub.textContent = "Launcher cape catalog from your Fishbattery cloud account.";
  localSection.appendChild(localSub);

  const localGrid = document.createElement("div");
  localGrid.className = "capeGrid";
  localSection.appendChild(localGrid);

  const sortedLocalItems = [...(localCapeCatalog?.items || [])].sort((a, b) => {
    const rank = (tier: "free" | "premium" | "founder") => (tier === "free" ? 0 : tier === "premium" ? 1 : 2);
    const tierOrder = rank(a.tier) - rank(b.tier);
    if (tierOrder !== 0) return tierOrder;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  if (!sortedLocalItems.length) {
    const localEmpty = document.createElement("div");
    localEmpty.className = "setHelp";
    localEmpty.style.marginTop = "12px";
    localEmpty.textContent = "No launcher capes are available for your account right now.";
    localSection.appendChild(localEmpty);
  } else {
    localGrid.appendChild(
      buildTile({
        label: "No Fishbattery Cape",
        imageUrl: null,
        active: !selectedLocalCapeId,
        onSelect: async () => {
          if (activeMcId) await window.api.capesSetLocalSelection(activeMcId, null);
          setStatus("Launcher cape selection cleared.");
          await renderCapesView(false);
        }
      })
    );
    for (const localItem of sortedLocalItems) {
      localGrid.appendChild(
        buildTile({
          label: localItem.name,
          imageUrl: localItem.previewDataUrl || null,
          active: selectedLocalCapeId === localItem.id,
          subLabel: localCapeTierLabel(localItem.tier),
          onSelect: async () => {
            if (activeMcId) await window.api.capesSetLocalSelection(activeMcId, localItem.id);
            setStatus(`Selected launcher ${localItem.tier} cape: ${localItem.name}`);
            await renderCapesView(false);
          }
        })
      );
    }
  }
}

const capePreviewCache = new Map<string, string | null>();

async function buildCapePanelPreviewDataUrl(sourceUrl: string): Promise<string | null> {
  const src = String(sourceUrl || "").trim();
  if (!src) return null;
  if (capePreviewCache.has(src)) return capePreviewCache.get(src) ?? null;

  const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  if (!loaded) {
    capePreviewCache.set(src, null);
    return null;
  }

  const w = Number(loaded.naturalWidth || 0);
  const h = Number(loaded.naturalHeight || 0);
  if (w <= 0 || h <= 0) {
    capePreviewCache.set(src, null);
    return null;
  }

  // Minecraft cape back panel in the classic cape atlas (the visible outside on player back):
  // 64x32 logical texture: x=1..10, y=1..16 (10x16)
  // Many cape textures are exact scale multiples of this.
  const scale = Math.max(1, Math.floor(w / 64));
  const sx = 1 * scale;
  const sy = 1 * scale;
  const sw = 10 * scale;
  const sh = 16 * scale;

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = w;
  sourceCanvas.height = h;
  const sctx = sourceCanvas.getContext("2d");
  if (!sctx) {
    capePreviewCache.set(src, null);
    return null;
  }
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(loaded, 0, 0);

  if (sx + sw > w || sy + sh > h) {
    capePreviewCache.set(src, null);
    return null;
  }

  let patch: Uint8ClampedArray;
  try {
    patch = sctx.getImageData(sx, sy, sw, sh).data;
  } catch {
    capePreviewCache.set(src, null);
    return null;
  }
  let hasPixels = false;
  for (let i = 3; i < patch.length; i += 4) {
    if (patch[i] > 8) {
      hasPixels = true;
      break;
    }
  }
  if (!hasPixels) {
    capePreviewCache.set(src, null);
    return null;
  }

  const outW = 80;
  const outH = 128;
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d");
  if (!octx) {
    capePreviewCache.set(src, null);
    return null;
  }
  octx.imageSmoothingEnabled = false;
  octx.clearRect(0, 0, outW, outH);

  // Keep cape proportions and center in tile.
  const drawH = outH;
  const drawW = Math.round((sw / sh) * drawH);
  const dx = Math.round((outW - drawW) / 2);
  octx.drawImage(sourceCanvas, sx, sy, sw, sh, dx, 0, drawW, drawH);

  const preview = out.toDataURL("image/png");
  capePreviewCache.set(src, preview);
  return preview;
}

async function setCapePreviewImage(imgEl: HTMLImageElement, sourceUrl: string) {
  try {
    const preview = await buildCapePanelPreviewDataUrl(sourceUrl);
    imgEl.src = preview || sourceUrl;
  } catch {
    imgEl.src = sourceUrl;
  }
}

function disposeCapesCharacterPreview() {
  try {
    capesSkinControls?.dispose?.();
  } catch {}
  capesSkinControls = null;
  try {
    capesSkinViewer?.dispose?.();
  } catch {}
  capesSkinViewer = null;
}

async function renderInteractiveCharacterPreview(
  hostEl: HTMLElement,
  skinSourceUrl: string | null,
  capeSourceUrl: string | null
) {
  disposeCapesCharacterPreview();
  hostEl.innerHTML = "";

  const skinSrc = String(skinSourceUrl || "").trim();
  if (!skinSrc) {
    const empty = document.createElement("div");
    empty.className = "capeMannequinEmpty";
    empty.textContent = "No skin";
    hostEl.appendChild(empty);
    return;
  }

  const capeSrc = String(capeSourceUrl || "").trim();
  const canvas = document.createElement("canvas");
  canvas.className = "capeMannequinCanvas";
  hostEl.appendChild(canvas);

  const width = Math.max(180, hostEl.clientWidth || 180);
  const height = Math.max(220, hostEl.clientHeight || 220);
  const viewer = new (skinview3d as any).SkinViewer({
    canvas,
    width,
    height
  });
  capesSkinViewer = viewer;

  try {
    await viewer.loadSkin(skinSrc);
    if (capeSrc) {
      try {
        await viewer.loadCape(capeSrc);
        if (viewer.playerObject?.cape) viewer.playerObject.cape.visible = true;
      } catch (err) {
        console.warn("Cape preview load failed, continuing without cape", err);
        if (viewer.playerObject?.cape) viewer.playerObject.cape.visible = false;
      }
    } else if (viewer.playerObject?.cape) {
      viewer.playerObject.cape.visible = false;
    }

    viewer.background = null;
    viewer.fov = 42;
    viewer.zoom = 0.58;
    viewer.playerObject.rotation.y = Math.PI;
    viewer.camera.position.set(26, 0, 48);

    const controls = viewer.controls;
    capesSkinControls = controls;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.9;
    controls.target.set(0, 0, 0);
    controls.update();
  } catch (err) {
    console.error("Character preview failed", err);
    disposeCapesCharacterPreview();
    hostEl.innerHTML = "";
    const fail = document.createElement("div");
    fail.className = "capeMannequinEmpty";
    fail.textContent = "Preview unavailable";
    hostEl.appendChild(fail);
  }
}

function openModal() {
  modalBackdrop.classList.add("open");
  setModalTab("general");
}

function closeModal() {
  modalBackdrop.classList.remove("open");
}

function setModalTab(which: "general" | "mods" | "packs") {
  const canShowInstanceTabs = modalMode === "edit" && !!editInstanceId;
  const showMods = which === "mods" && canShowInstanceTabs;
  const showPacks = which === "packs" && canShowInstanceTabs;

  modalTabGeneral.classList.toggle("active", !showMods && !showPacks);
  modalTabMods.classList.toggle("active", showMods);
  modalTabPacks.classList.toggle("active", showPacks);

  modalPanelGeneral.style.display = showMods || showPacks ? "none" : "";
  modalPanelMods.style.display = showMods ? "" : "none";
  modalPanelPacks.style.display = showPacks ? "" : "none";

  modalTabMods.toggleAttribute("disabled", !canShowInstanceTabs);
  modalTabPacks.toggleAttribute("disabled", !canShowInstanceTabs);
}

modalTabGeneral.onclick = () => setModalTab("general");
modalTabMods.onclick = async () => {
  setModalTab("mods");
  await renderInstanceMods(editInstanceId);
  await renderLocalContent(editInstanceId);
};
modalTabPacks.onclick = async () => {
  setModalTab("packs");
  await renderRecommendedPacks(editInstanceId);
  await renderLocalContent(editInstanceId);
};

function formatBytes(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const rounded = i === 0 ? `${Math.round(v)}` : `${v.toFixed(1)}`;
  return `${rounded} ${units[i]}`;
}

function formatPlaytime(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(Number(ms || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}

function formatPresetLabel(presetId: string | null | undefined) {
  const id = String(presetId || "none");
  if (id === "none") return "None";
  const preset = (INSTANCE_PRESETS as Record<string, InstancePreset>)[id];
  return preset?.name || id;
}

function renderProfileImage(summary: Awaited<ReturnType<typeof window.api.profileGetSummary>>, tierLabel: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#07131b");
  gradient.addColorStop(1, "#0d2434");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.fillStyle = "#e8f6ff";
  ctx.font = "bold 46px 'Segoe UI', sans-serif";
  ctx.fillText("Fishbattery Profile Showcase", 70, 120);

  ctx.fillStyle = "#9fc2d8";
  ctx.font = "24px 'Segoe UI', sans-serif";
  ctx.fillText(`Tier: ${tierLabel}`, 70, 165);
  ctx.fillText(`Generated: ${new Date(summary.generatedAt).toLocaleString()}`, 70, 200);

  const cards = [
    `Playtime: ${formatPlaytime(summary.totals.totalPlaytimeMs)}`,
    `Installed mods: ${summary.totals.installedMods}`,
    `Instances: ${summary.totals.instances}`,
    `Active preset: ${formatPresetLabel(summary.activeInstance?.presetId)}`,
    summary.bestBenchmark
      ? `Best benchmark: ${summary.bestBenchmark.avgFps} FPS (${summary.bestBenchmark.instanceName})`
      : "Best benchmark: none",
    `Hardware (public): ${summary.hardwarePublic.cpuCores} cores, ${summary.hardwarePublic.ram} RAM`
  ];

  ctx.font = "bold 28px 'Segoe UI', sans-serif";
  let y = 270;
  for (const line of cards) {
    ctx.fillStyle = "#dff5ff";
    ctx.fillText(line, 80, y);
    y += 56;
  }

  return canvas;
}

function encodePublicProfilePayload(payload: unknown) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// ---------------- Simple display names (catalog id__filename) ----------------
function getPrettyName(kind: "mods" | "resourcepacks" | "shaderpacks", fileName: string) {
  const clean = fileName.replace(/\.disabled$/, "");
  const parts = clean.split("__");

  if (parts.length > 1) {
    const id = parts[0];

    if (kind === "mods") {
      const found = CATALOG.find((m) => m.id === id);
      if (found) return found.name;
    } else {
      const found = PACK_CATALOG.find((p) => p.id === id);
      if (found) return found.name;
    }
  }

  // fallback: nicer filename
  return clean
    .replace(/\.jar$/, "")
    .replace(/\.zip$/, "")
    .replace(/_/g, " ");
}

// ---------------- Local file list (enable/disable + remove) ----------------
function renderFileList(
  el: HTMLElement,
  kind: "mods" | "resourcepacks" | "shaderpacks",
  items: Array<{ name: string; size: number }>,
  onRemove: (name: string) => void,
  onToggleEnabled?: (name: string, enable: boolean) => void
) {
  el.innerHTML = "";

  if (!items?.length) {
    el.innerHTML = '<div class="muted" style="font-size:12px">Nothing installed.</div>';
    return;
  }

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "setRow";
    row.style.marginBottom = "10px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const nameEl = document.createElement("div");
    nameEl.className = "setLabel";
    nameEl.textContent = getPrettyName(kind, it.name);

    const sub = document.createElement("div");
    sub.className = "setHelp";
    sub.textContent = formatBytes(it.size) + (it.name.endsWith(".disabled") ? " | Disabled" : "");

    left.appendChild(nameEl);
    left.appendChild(sub);

    const right = document.createElement("div");
    right.className = "row";
    right.style.justifyContent = "flex-end";
    right.style.gap = "8px";

    const isDisabled = it.name.endsWith(".disabled");

    if (onToggleEnabled) {
      const toggle = document.createElement("button");
      toggle.className = "btn";
      toggle.textContent = isDisabled ? "Enable" : "Disable";
      toggle.onclick = () => onToggleEnabled(it.name, isDisabled);
      right.appendChild(toggle);
    }

    const remove = document.createElement("button");
    remove.className = "btn";
    remove.textContent = "Remove";
    remove.onclick = () => onRemove(it.name);
    right.appendChild(remove);

    row.appendChild(left);
    row.appendChild(right);
    el.appendChild(row);
  }
}

// ---------------- Settings UI ----------------
function clearPanel(el: HTMLElement) {
  el.innerHTML = "";
}

function makeH3(text: string) {
  const h = document.createElement("h3");
  h.textContent = text;
  return h;
}

function makeRow(label: string, help?: string) {
  const row = document.createElement("div");
  row.className = "setRow";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.flexDirection = "column";

  const l = document.createElement("div");
  l.className = "setLabel";
  l.textContent = label;

  left.appendChild(l);

  if (help) {
    const h = document.createElement("div");
    h.className = "setHelp";
    h.textContent = help;
    left.appendChild(h);
  }

  row.appendChild(left);
  return { row, left };
}

function makeSwitch(checked: boolean, onChange: (v: boolean) => void) {
  const wrap = document.createElement("label");
  wrap.className = "switch";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;

  const slider = document.createElement("span");
  slider.className = "slider";
  slider.tabIndex = 0;
  slider.setAttribute("role", "switch");
  slider.setAttribute("aria-checked", checked ? "true" : "false");

  input.onchange = () => {
    slider.setAttribute("aria-checked", input.checked ? "true" : "false");
    onChange(input.checked);
  };
  slider.onclick = (e) => {
    e.preventDefault();
    input.click();
  };
  slider.onkeydown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      input.click();
    }
  };

  wrap.appendChild(input);
  wrap.appendChild(slider);
  return wrap;
}

function makeSelect(options: Array<{ value: string; label: string }>, value: string, onChange: (v: string) => void) {
  const sel = document.createElement("select");
  sel.className = "setControl";
  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  sel.value = value;
  sel.onchange = () => onChange(sel.value);
  return sel;
}

function makeInput(value: string, placeholder: string, onChange: (v: string) => void) {
  const inp = document.createElement("input");
  inp.className = "setControl";
  inp.value = value;
  inp.placeholder = placeholder;
  inp.oninput = () => onChange(inp.value);
  return inp;
}

function makeTextarea(value: string, placeholder: string, onChange: (v: string) => void) {
  const ta = document.createElement("textarea");
  ta.className = "setControl";
  ta.style.minHeight = "92px";
  ta.value = value;
  ta.placeholder = placeholder;
  ta.oninput = () => onChange(ta.value);
  return ta;
}

async function pickImageAsDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/png,image/jpeg,image/webp,image/gif";
    inp.onchange = () => {
      const file = inp.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        alert("Image is too large. Please choose one smaller than 4 MB.");
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}

function updaterStatusText(s: UpdaterUiState) {
  const msg = s.message?.trim();
  if (msg) return msg;

  if (s.status === "idle") return "Updates not checked yet.";
  if (s.status === "checking") return "Checking for updates...";
  if (s.status === "update-available") return `Update available: v${s.latestVersion ?? "unknown"}`;
  if (s.status === "up-to-date") return "You are up to date.";
  if (s.status === "downloading") return `Downloading update... ${Number(s.progressPercent ?? 0).toFixed(1)}%`;
  if (s.status === "downloaded") return `Update downloaded: v${s.latestVersion ?? "unknown"}`;
  return "Updater error.";
}

function preflightSummaryText(p: any) {
  if (!p) return "No preflight run yet.";
  if (p.summary === "healthy") return "Preflight healthy.";
  if (p.summary === "warnings") return "Preflight completed with warnings.";
  return "Preflight detected critical issues.";
}

function cloudSyncStatusText(state: CloudSyncUiState) {
  if (!state) return "Cloud sync has not run yet.";
  if (state.lastStatus === "up-to-date") return "Cloud sync is up to date.";
  if (state.lastStatus === "pushed") return "Local changes were pushed to cloud.";
  if (state.lastStatus === "pulled") return "Cloud changes were applied locally.";
  if (state.lastStatus === "conflict") return "Cloud conflict detected. Resolve manually.";
  if (state.lastStatus === "error") return state.lastError || "Cloud sync failed.";
  return "Cloud sync is idle.";
}

function applyRemoteSyncedSettings(patch: Record<string, unknown> | null | undefined) {
  if (!patch || typeof patch !== "object") return;
  setSettings(patch as Partial<AppSettings>, { touchUpdatedAt: false });
  ensureCloudSyncTimer();
}

async function runCloudSync(manual: boolean, forcedPolicy?: "prefer-local" | "prefer-cloud") {
  const s = getSettings();
  if (!s.cloudSyncEnabled) return;
  if (!state.launcherAccount?.activeAccountId) return;

  const policy = forcedPolicy || s.cloudSyncConflictPolicy || "ask";
  const result = await window.api.cloudSyncSyncNow({
    settings: getSettings() as unknown as Record<string, unknown>,
    policy,
    resolveConflict: !!forcedPolicy
  });

  cloudSyncState = {
    lastSyncedAt: result.lastSyncedAt ?? cloudSyncState.lastSyncedAt,
    lastStatus:
      result.status === "pushed" || result.status === "pulled" || result.status === "up-to-date"
        ? result.status
        : result.status === "conflict"
          ? "conflict"
          : "error",
    lastError: result.status === "error" ? result.message : result.status === "conflict" ? result.message : null,
    lastRemoteRevision: result.lastRemoteRevision ?? cloudSyncState.lastRemoteRevision
  };

  if (result.status === "pulled" && result.settingsPatch) {
    applyRemoteSyncedSettings(result.settingsPatch);
    state.instances = await window.api.instancesList();
    await renderInstances();
  }

  if (result.status === "conflict" && manual && policy === "ask") {
    const useCloud = confirm(
      "Cloud sync conflict detected.\n\nOK = use cloud state\nCancel = keep local state\n\nYou can change this behavior in:\nSettings > Install > Conflict policy"
    );
    await runCloudSync(true, useCloud ? "prefer-cloud" : "prefer-local");
    return;
  }

  if (manual) {
    const stamp = cloudSyncState.lastSyncedAt
      ? new Date(cloudSyncState.lastSyncedAt).toLocaleString()
      : "never";
    alert(`Cloud sync: ${result.message}\nLast sync: ${stamp}`);
  }
}

function ensureCloudSyncTimer() {
  if (cloudSyncIntervalId != null) {
    window.clearInterval(cloudSyncIntervalId);
    cloudSyncIntervalId = null;
  }
  const s = getSettings();
  if (!s.cloudSyncEnabled || !s.cloudSyncAuto) return;
  cloudSyncIntervalId = window.setInterval(() => {
    void guarded(async () => {
      await runCloudSync(false);
      renderSettingsPanels();
    });
  }, 5 * 60 * 1000);
}

function ensureRunningStatusPoll() {
  if (runningStatusPollId != null) return;
  runningStatusPollId = window.setInterval(() => {
    void guarded(async () => {
      if (!state.instances?.instances?.length) {
        updateTopbarRunningPill(0);
        return;
      }
      await renderInstances();
    });
  }, 3000);
}

function allInstancePresetIds(): InstancePresetId[] {
  return ["none", ...Object.keys(INSTANCE_PRESETS)] as InstancePresetId[];
}

function availablePresetIdsForLoader(loader: LoaderKind): InstancePresetId[] {
  const ids: InstancePresetId[] = ["none"];
  for (const id of Object.keys(INSTANCE_PRESETS) as Array<Exclude<InstancePresetId, "none">>) {
    if (INSTANCE_PRESETS[id].variants?.[loader]) ids.push(id);
  }
  return ids;
}

function fillInstancePresetDropdown(selectedId: string | null, loader: LoaderKind = "fabric") {
  instancePreset.innerHTML = "";

  const none = document.createElement("option");
  none.value = "none";
  none.textContent = "None (Custom)";
  instancePreset.appendChild(none);

  for (const id of Object.keys(INSTANCE_PRESETS) as Array<Exclude<InstancePresetId, "none">>) {
    if (!INSTANCE_PRESETS[id].variants?.[loader]) continue;
    const p = INSTANCE_PRESETS[id];
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = p.name;
    instancePreset.appendChild(opt);
  }

  const safe = availablePresetIdsForLoader(loader).includes((selectedId ?? "none") as InstancePresetId)
    ? (selectedId ?? "none")
    : "none";
  instancePreset.value = safe;
}

async function applyInstancePreset(instanceId: string, mcVersion: string, loader: LoaderKind, presetId: InstancePresetId) {
  if (presetId === "none") return;
  const preset = INSTANCE_PRESETS[presetId];
  if (!preset) return;
  const variant = preset.variants?.[loader];
  if (!variant) {
    appendLog(`[preset] "${preset.name}" is not available for loader ${loader}.`);
    return;
  }

  setStatus(`Applying instance preset "${preset.name}"...`);

  try {
    appendLog(`[preset] Selecting "${preset.name}" for instance ${instanceId}.`);
    try {
      await window.api.rollbackCreateSnapshot(
        instanceId,
        "instance-preset",
        `Before applying preset ${preset.name}`
      );
    } catch (err: any) {
      appendLog(`[rollback] Snapshot skipped: ${String(err?.message ?? err)}`);
    }

    if (loader === "fabric") {
      for (const mod of CATALOG) {
        const shouldEnable = mod.id === "fabric-api" || !!mod.required || variant.enableMods.includes(mod.id);
        try {
          await window.api.modsSetEnabled(instanceId, mod.id, shouldEnable);
        } catch (err: any) {
          appendLog(`[preset] Failed toggling mod ${mod.id}: ${String(err?.message ?? err)}`);
        }
      }
    }

    for (const pack of PACK_CATALOG) {
      const shouldEnable = !!pack.required || variant.enablePacks.includes(pack.id);
      try {
        await window.api.packsSetEnabled(instanceId, pack.id, shouldEnable);
      } catch (err: any) {
        appendLog(`[preset] Failed toggling pack ${pack.id}: ${String(err?.message ?? err)}`);
      }
    }

    await window.api.instancesUpdate(instanceId, { memoryMb: variant.memoryMb, instancePreset: presetId });

    // Resolve and install only enabled entries.
    if (loader === "fabric") {
      await window.api.modsRefresh(instanceId, mcVersion);
    }
    await window.api.packsRefresh(instanceId, mcVersion);

    const afterMods = loader === "fabric" ? await window.api.modsList(instanceId) : { mods: [] as any[] };
    const afterPacks = await window.api.packsList(instanceId);

    for (const mod of afterMods?.mods ?? []) {
      const shouldEnable = mod.id === "fabric-api" || !!mod.required || variant.enableMods.includes(mod.id);
      if (shouldEnable && mod.status !== "ok") {
        appendLog(`[preset] Mod unavailable for ${mcVersion}: ${mod.name ?? mod.id} (${mod.status})`);
      }
    }
    for (const pack of afterPacks?.items ?? []) {
      const shouldEnable = !!pack.required || variant.enablePacks.includes(pack.id);
      if (shouldEnable && pack.status !== "ok") {
        appendLog(`[preset] Pack unavailable for ${mcVersion}: ${pack.name ?? pack.id} (${pack.status})`);
      }
    }

    appendLog(`[preset] Applied instance preset "${preset.name}" to ${mcVersion}.`);
  } finally {
    setStatus("");
  }
}

async function optimizeActiveModalInstance() {
  const id = editInstanceId;
  if (!id) {
    alert("Select an instance first.");
    return;
  }
  const profile = (optProfile.value || "balanced") as "conservative" | "balanced" | "aggressive";
  const preview = await window.api.optimizerPreview(profile);
  const yes = confirm(
    [
      `Optimize instance with profile "${profile}"?`,
      "",
      `Hardware: ${preview.hardware.cpuModel} (${preview.hardware.cpuCores} cores)`,
      `RAM: ${preview.hardware.totalRamMb} MB`,
      preview.hardware.gpuModel ? `GPU: ${preview.hardware.gpuModel}` : "GPU: unknown",
      "",
      `Will set memory: ${preview.memoryMb} MB`,
      `GC: ${preview.gc}`,
      `Will enable mods: ${preview.modsToEnable.join(", ")}`
    ].join("\n")
  );
  if (!yes) return;

  await window.api.optimizerApply(id, profile);
  state.instances = await window.api.instancesList();
  await renderInstances();
  appendLog(`[optimizer] Applied ${profile} optimization.`);
}

async function restoreActiveModalOptimization() {
  const id = editInstanceId;
  if (!id) {
    alert("Select an instance first.");
    return;
  }
  const yes = confirm("Restore optimizer defaults for this instance?");
  if (!yes) return;
  await window.api.optimizerRestore(id);
  state.instances = await window.api.instancesList();
  await renderInstances();
  appendLog("[optimizer] Restored optimization defaults.");
}

async function runActiveModalBenchmark() {
  const id = editInstanceId;
  if (!id) {
    alert("Select an instance first.");
    return;
  }
  const profile = (optProfile.value || "balanced") as "conservative" | "balanced" | "aggressive";
  const run = await window.api.benchmarkRun(id, profile);
  const all = await window.api.benchmarkList(id);
  const prev = all[1] ?? null;
  const compare = prev
    ? `\nCompared to previous: avgFPS ${run.avgFps - prev.avgFps >= 0 ? "+" : ""}${run.avgFps - prev.avgFps}`
    : "";
  alert(
    `Benchmark complete (${run.profile})\n` +
      `Avg FPS: ${run.avgFps}\n` +
      `1% Low FPS: ${run.low1Fps}\n` +
      `Max Memory: ${run.maxMemoryMb} MB\n` +
      `Duration: ${run.durationMs} ms${compare}`
  );
  appendLog(`[benchmark] ${run.avgFps} avg / ${run.low1Fps} low1 / ${run.maxMemoryMb}MB max`);
}

function renderSettingsPanels() {
  const s = getSettings();
  const premium = hasPremium();

  if (!premium && PREMIUM_THEMES.has(s.theme)) {
    setSettings({ theme: defaultSettings.theme });
  }

  // General
  clearPanel(settingsPanelGeneral);
  settingsPanelGeneral.appendChild(makeH3("General"));

  {
    const { row } = makeRow("Show snapshots", "Include snapshot versions in the version dropdown.");
    const sw = makeSwitch(s.showSnapshots, (v) =>
      guarded(async () => {
        setSettings({ showSnapshots: v });
        await refreshAll();
      })
    );
    row.appendChild(sw);
    settingsPanelGeneral.appendChild(row);
  }

  {
    const { row } = makeRow("Auto update mods", "When enabled, you can choose to refresh mods after version changes.");
    const sw = makeSwitch(s.autoUpdateMods, (v) => setSettings({ autoUpdateMods: v }));
    row.appendChild(sw);
    settingsPanelGeneral.appendChild(row);
  }

  {
    const { row } = makeRow("Default memory (MB)", "Used when creating new instances.");
    const inp = makeInput(String(s.defaultMemoryMb), "4096", (v) => {
      const n = Math.max(256, Math.min(65536, Number(v || 0)));
      if (!Number.isFinite(n)) return;
      setSettings({ defaultMemoryMb: n });
    });
    (inp as any).type = "number";
    (inp as any).step = "256";
    row.appendChild(inp);
    settingsPanelGeneral.appendChild(row);
  }

  // Theme
  clearPanel(settingsPanelTheme);
  settingsPanelTheme.appendChild(makeH3("Theme"));

  {
    const { row } = makeRow("Base style", "Changes the overall look.");
    const sel = document.createElement("select");
    sel.className = "setControl";

    const freeGroup = document.createElement("optgroup");
    freeGroup.label = "Free themes";
    const premiumGroup = document.createElement("optgroup");
    premiumGroup.label = "Premium themes";

    for (const option of THEME_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      if (PREMIUM_THEMES.has(option.value)) {
        premiumGroup.appendChild(opt);
      } else {
        freeGroup.appendChild(opt);
      }
    }

    sel.appendChild(freeGroup);
    sel.appendChild(premiumGroup);
    sel.value = s.theme;
    sel.onchange = async () => {
      const next = sel.value as AppSettings["theme"];
      if (!premium && PREMIUM_THEMES.has(next)) {
        const label = THEME_OPTIONS.find((x) => x.value === next)?.label || "This theme";
        const goUpgrade = confirm(`${label} is a Premium theme.\n\nOpen upgrade page now?`);
        if (goUpgrade) await openUpgradeFlow();
        sel.value = s.theme;
        return;
      }
      setSettings({ theme: next, accentColor: defaultAccentForTheme(next) });
      renderSettingsPanels();
    };
    row.appendChild(sel);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Theme behavior", THEME_BEHAVIOR_TEXT[s.theme]);
    settingsPanelTheme.appendChild(row);
  }

  if (!premium) {
    const { row } = makeRow(
      "Premium themes",
      "Theme list is split into Free and Premium groups. Upgrade in the account menu to unlock Premium themes."
    );
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Accent color", "Applies to interactive accents and highlights.");
    const inp = document.createElement("input");
    inp.type = "color";
    inp.className = "setControl";
    inp.style.width = "140px";
    inp.value = /^#[0-9a-fA-F]{6}$/.test(s.accentColor) ? s.accentColor : "#3ddc84";
    inp.oninput = () => setSettings({ accentColor: inp.value });
    row.appendChild(inp);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Corner radius", "Adjusts overall roundness.");
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.justifyContent = "flex-end";
    wrap.style.minWidth = "280px";

    const range = document.createElement("input");
    range.type = "range";
    range.min = "8";
    range.max = "22";
    range.step = "1";
    range.value = String(s.cornerRadius ?? 12);
    range.style.width = "220px";

    const value = document.createElement("span");
    value.className = "muted";
    value.style.fontSize = "12px";
    value.style.minWidth = "48px";
    value.textContent = `${range.value}px`;

    range.oninput = () => {
      const n = Math.max(8, Math.min(22, Number(range.value || 12)));
      value.textContent = `${n}px`;
      setSettings({ cornerRadius: n });
    };

    wrap.appendChild(range);
    wrap.appendChild(value);
    row.appendChild(wrap);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Border thickness", "Controls border weight.");
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.justifyContent = "flex-end";
    wrap.style.minWidth = "280px";

    const range = document.createElement("input");
    range.type = "range";
    range.min = "1";
    range.max = "3";
    range.step = "1";
    range.value = String(s.borderThickness ?? 1);
    range.style.width = "220px";

    const value = document.createElement("span");
    value.className = "muted";
    value.style.fontSize = "12px";
    value.style.minWidth = "48px";
    value.textContent = `${range.value}px`;

    range.oninput = () => {
      const n = Math.max(1, Math.min(3, Number(range.value || 1)));
      value.textContent = `${n}px`;
      setSettings({ borderThickness: n });
    };

    wrap.appendChild(range);
    wrap.appendChild(value);
    row.appendChild(wrap);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Pixel font", "Optional retro pixel-style UI font.");
    const sw = makeSwitch(s.pixelFont, (v) => setSettings({ pixelFont: v }));
    row.appendChild(sw);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Panel transparency", "Controls panel opacity without reducing readability.");
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.justifyContent = "flex-end";
    wrap.style.minWidth = "280px";

    const range = document.createElement("input");
    range.type = "range";
    range.min = "70";
    range.max = "98";
    range.step = "1";
    range.value = String(s.surfaceAlpha ?? 88);
    range.style.width = "220px";

    const value = document.createElement("span");
    value.className = "muted";
    value.style.fontSize = "12px";
    value.style.minWidth = "48px";
    value.textContent = `${range.value}%`;

    range.oninput = () => {
      const n = Math.max(70, Math.min(98, Number(range.value || 88)));
      value.textContent = `${n}%`;
      setSettings({ surfaceAlpha: n });
    };

    wrap.appendChild(range);
    wrap.appendChild(value);
    row.appendChild(wrap);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Background blur", "Enable or disable blur on cards and dialogs.");
    const sw = makeSwitch(s.blur, (v) => setSettings({ blur: v }));
    row.appendChild(sw);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Custom background", "Use your own background image behind the launcher.");
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.justifyContent = "flex-end";

    const pick = document.createElement("button");
    pick.className = "btn";
    pick.textContent = s.customBackgroundDataUrl ? "Replace image" : "Choose image";
    pick.onclick = () =>
      guarded(async () => {
        const dataUrl = await pickImageAsDataUrl();
        if (!dataUrl) return;
        setSettings({ customBackgroundDataUrl: dataUrl });
      });

    const clear = document.createElement("button");
    clear.className = "btn";
    clear.textContent = "Clear";
    clear.disabled = !s.customBackgroundDataUrl;
    clear.onclick = () => setSettings({ customBackgroundDataUrl: "" });

    wrap.appendChild(pick);
    wrap.appendChild(clear);
    row.appendChild(wrap);
    settingsPanelTheme.appendChild(row);
  }

  {
    const { row } = makeRow("Reset theme", "Restore theme settings to defaults.");
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Reset to defaults";
    btn.onclick = () =>
      setSettings({
        theme: defaultSettings.theme,
        blur: defaultSettings.blur,
        accentColor: defaultSettings.accentColor,
        surfaceAlpha: defaultSettings.surfaceAlpha,
        cornerRadius: defaultSettings.cornerRadius,
        borderThickness: defaultSettings.borderThickness,
        pixelFont: defaultSettings.pixelFont,
        customBackgroundDataUrl: defaultSettings.customBackgroundDataUrl
      });
    row.appendChild(btn);
    settingsPanelTheme.appendChild(row);
  }

  // Install (updater)
  clearPanel(settingsPanelInstall);
  settingsPanelInstall.appendChild(makeH3("Install"));
  {
    const { row: channelRow } = makeRow(
      "Update channel",
      "Stable is recommended. Beta only for testers and pre-release updates."
    );
    const channelSelect = makeSelect(
      [
        { value: "stable", label: "Stable (Recommended)" },
        { value: "beta", label: "Beta (Pre-release)" }
      ],
      s.updateChannel,
      (v) =>
        guarded(async () => {
          const channel = v === "beta" ? "beta" : "stable";
          setSettings({ updateChannel: channel });
          await window.api.updaterSetChannel(channel);
          renderSettingsPanels();
        })
    );
    channelRow.appendChild(channelSelect);
    settingsPanelInstall.appendChild(channelRow);

    const { row: syncEnableRow } = makeRow(
      "Cloud sync",
      "Sync instance metadata, mod lists, packs, JVM options, presets, and theme to your Fishbattery account."
    );
    const syncEnableWrap = document.createElement("div");
    syncEnableWrap.className = "row";
    syncEnableWrap.style.justifyContent = "flex-end";
    syncEnableWrap.style.gap = "8px";
    const syncEnableLabel = document.createElement("span");
    syncEnableLabel.className = "muted";
    syncEnableLabel.style.fontSize = "12px";
    syncEnableLabel.textContent = s.cloudSyncEnabled ? "Enabled" : "Disabled";
    const syncEnableSwitch = makeSwitch(s.cloudSyncEnabled, (v) => {
      setSettings({ cloudSyncEnabled: v });
      ensureCloudSyncTimer();
      renderSettingsPanels();
    });
    syncEnableWrap.appendChild(syncEnableLabel);
    syncEnableWrap.appendChild(syncEnableSwitch);
    syncEnableRow.appendChild(syncEnableWrap);
    settingsPanelInstall.appendChild(syncEnableRow);

    const { row: syncAutoRow } = makeRow(
      "Background sync",
      "Automatically sync every 5 minutes while the launcher is open."
    );
    const syncAutoWrap = document.createElement("div");
    syncAutoWrap.className = "row";
    syncAutoWrap.style.justifyContent = "flex-end";
    syncAutoWrap.style.gap = "8px";
    const syncAutoLabel = document.createElement("span");
    syncAutoLabel.className = "muted";
    syncAutoLabel.style.fontSize = "12px";
    syncAutoLabel.textContent = s.cloudSyncAuto ? "On" : "Off";
    const syncAutoSwitch = makeSwitch(s.cloudSyncAuto, (v) => {
      setSettings({ cloudSyncAuto: v });
      ensureCloudSyncTimer();
      renderSettingsPanels();
    });
    syncAutoWrap.appendChild(syncAutoLabel);
    syncAutoWrap.appendChild(syncAutoSwitch);
    syncAutoRow.appendChild(syncAutoWrap);
    settingsPanelInstall.appendChild(syncAutoRow);

    const { row: policyRow } = makeRow(
      "Conflict policy",
      "Ask lets you choose local/cloud. Newer wins compares latest edit timestamps."
    );
    policyRow.style.flexDirection = "column";
    policyRow.style.alignItems = "stretch";
    const policySelect = makeSelect(
      [
        { value: "ask", label: "Ask every time" },
        { value: "newer-wins", label: "Newer wins" },
        { value: "prefer-local", label: "Always prefer local" },
        { value: "prefer-cloud", label: "Always prefer cloud" }
      ],
      s.cloudSyncConflictPolicy,
      (v) => {
        setSettings({
          cloudSyncConflictPolicy:
            v === "newer-wins" || v === "prefer-local" || v === "prefer-cloud" ? v : "ask"
        });
      }
    );
    policyRow.appendChild(policySelect);
    const policyHint = document.createElement("div");
    policyHint.className = "setHelp";
    policyHint.style.marginTop = "6px";
    policyHint.textContent =
      "When a conflict popup appears, you can change this default here: Settings > Install > Conflict policy.";
    policyRow.appendChild(policyHint);
    if (!state.launcherAccount?.activeAccountId) {
      const signInHint = document.createElement("div");
      signInHint.className = "setHelp";
      signInHint.style.marginTop = "6px";
      signInHint.textContent = "Sign in to your Fishbattery account from the top-right account menu to enable cloud sync.";
      policyRow.appendChild(signInHint);
    }
    settingsPanelInstall.appendChild(policyRow);

    const v = document.createElement("div");
    v.className = "muted";
    v.style.fontSize = "13px";
    v.style.marginBottom = "10px";
    v.textContent = `Current version: v${updaterState.currentVersion}`;
    settingsPanelInstall.appendChild(v);

    const status = document.createElement("div");
    status.className = "muted";
    status.style.fontSize = "13px";
    status.style.marginBottom = "12px";
    status.style.whiteSpace = "pre-line";
    status.textContent = `${updaterStatusText(updaterState)}\n${cloudSyncStatusText(cloudSyncState)}`;
    settingsPanelInstall.appendChild(status);

    const syncMeta = document.createElement("div");
    syncMeta.className = "muted";
    syncMeta.style.fontSize = "12px";
    syncMeta.style.marginBottom = "10px";
    const lastSyncText = cloudSyncState.lastSyncedAt
      ? new Date(cloudSyncState.lastSyncedAt).toLocaleString()
      : "never";
    syncMeta.textContent = `Last synced: ${lastSyncText}`;
    settingsPanelInstall.appendChild(syncMeta);

    const syncPriorityMeta = document.createElement("div");
    syncPriorityMeta.className = "muted";
    syncPriorityMeta.style.fontSize = "12px";
    syncPriorityMeta.style.marginBottom = "10px";
    syncPriorityMeta.textContent = hasPremium()
      ? "Cloud sync priority: Premium"
      : "Cloud sync priority: Standard (Premium includes priority syncing)";
    settingsPanelInstall.appendChild(syncPriorityMeta);

    const actions = document.createElement("div");
    actions.className = "row";
    actions.style.justifyContent = "flex-start";
    actions.style.gap = "8px";

    const btnCheck = document.createElement("button");
    btnCheck.className = "btn";
    btnCheck.textContent = "Check for updates";
    btnCheck.disabled = updaterState.status === "checking" || updaterState.status === "downloading";
    btnCheck.onclick = () =>
      guarded(async () => {
        await window.api.updaterSetChannel(s.updateChannel);
        await window.api.updaterCheck();
      });

    const btnDownload = document.createElement("button");
    btnDownload.className = "btn";
    btnDownload.textContent =
      updaterState.status === "downloading" ? "Downloading..." : "Download update";
    btnDownload.disabled = updaterState.status !== "update-available";
    btnDownload.onclick = () =>
      guarded(async () => {
        await window.api.updaterDownload();
      });

    const btnInstall = document.createElement("button");
    btnInstall.className = "btn btnPrimary";
    btnInstall.textContent = "Restart and install";
    btnInstall.disabled = updaterState.status !== "downloaded";
    btnInstall.onclick = () => {
      void window.api.updaterInstall();
    };

    actions.appendChild(btnCheck);
    actions.appendChild(btnDownload);
    actions.appendChild(btnInstall);
    const btnSyncNow = document.createElement("button");
    btnSyncNow.className = "btn";
    btnSyncNow.textContent = "Sync now";
    btnSyncNow.disabled = !s.cloudSyncEnabled || !state.launcherAccount?.activeAccountId;
    btnSyncNow.onclick = () =>
      guarded(async () => {
        await runCloudSync(true);
        renderSettingsPanels();
      });
    actions.appendChild(btnSyncNow);
    settingsPanelInstall.appendChild(actions);

    const preflightCard = document.createElement("div");
    preflightCard.className = "setRow";
    preflightCard.style.marginTop = "10px";

    const preLeft = document.createElement("div");
    preLeft.style.display = "flex";
    preLeft.style.flexDirection = "column";

    const preTitle = document.createElement("div");
    preTitle.className = "setLabel";
    preTitle.textContent = "Startup health check";

    const preSub = document.createElement("div");
    preSub.className = "setHelp";
    preSub.textContent = preflightSummaryText(preflightState);

    const preMeta = document.createElement("div");
    preMeta.className = "setHelp";
    preMeta.textContent = preflightState?.ranAt
      ? `Last run: ${new Date(preflightState.ranAt).toLocaleString()}`
      : "Runs on first launch and can be executed on demand.";

    preLeft.appendChild(preTitle);
    preLeft.appendChild(preSub);
    preLeft.appendChild(preMeta);

    const preActions = document.createElement("div");
    preActions.className = "row";
    preActions.style.justifyContent = "flex-end";

    const btnRunPreflight = document.createElement("button");
    btnRunPreflight.className = "btn";
    btnRunPreflight.textContent = "Run health check";
    btnRunPreflight.onclick = () =>
      guarded(async () => {
        preflightState = await window.api.preflightRun();
        appendLog(`[preflight] ${preflightSummaryText(preflightState)}`);
        renderSettingsPanels();
      });

    preActions.appendChild(btnRunPreflight);
    preflightCard.appendChild(preLeft);
    preflightCard.appendChild(preActions);
    settingsPanelInstall.appendChild(preflightCard);

    if (preflightState?.checks?.length) {
      for (const c of preflightState.checks) {
        if (c.severity === "ok") continue;
        const row = document.createElement("div");
        row.className = "setRow";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.flexDirection = "column";

        const t = document.createElement("div");
        t.className = "setLabel";
        t.textContent = `${c.title} (${c.severity})`;

        const d = document.createElement("div");
        d.className = "setHelp";
        d.textContent = c.detail;

        left.appendChild(t);
        left.appendChild(d);
        if (c.remediation) {
          const r = document.createElement("div");
          r.className = "setHelp";
          r.textContent = `Suggested fix: ${c.remediation}`;
          left.appendChild(r);
        }

        row.appendChild(left);
        settingsPanelInstall.appendChild(row);
      }
    }

    const diagWrap = document.createElement("div");
    diagWrap.className = "row";
    diagWrap.style.justifyContent = "flex-start";
    diagWrap.style.gap = "8px";
    diagWrap.style.marginTop = "10px";

    const btnDiagnostics = document.createElement("button");
    btnDiagnostics.className = "btn";
    btnDiagnostics.textContent = "Export diagnostics";
    btnDiagnostics.onclick = () =>
      guarded(async () => {
        const res = await window.api.diagnosticsExport();
        if (!res.ok || res.canceled) return;
        appendLog(`[diagnostics] Exported: ${res.path}`);
        alert(`Diagnostics exported:\n${res.path}`);
      });

    diagWrap.appendChild(btnDiagnostics);
    settingsPanelInstall.appendChild(diagWrap);

    const activeInstanceId = state.instances?.activeInstanceId ?? null;
    const activeInstance = (state.instances?.instances ?? []).find((x: any) => x.id === activeInstanceId) ?? null;

    const lockWrap = document.createElement("div");
    lockWrap.className = "row";
    lockWrap.style.justifyContent = "flex-start";
    lockWrap.style.gap = "8px";
    lockWrap.style.marginTop = "8px";

    const btnGenLock = document.createElement("button");
    btnGenLock.className = "btn";
    btnGenLock.textContent = "Refresh lockfile";
    btnGenLock.disabled = !activeInstance;
    btnGenLock.onclick = () =>
      guarded(async () => {
        const latest = await window.api.instancesList();
        state.instances = latest;
        const latestActiveId = latest?.activeInstanceId ?? null;
        const latestActive = (latest?.instances ?? []).find((x: any) => x.id === latestActiveId) ?? null;
        if (!latestActive) {
          alert("No active instance selected.");
          renderSettingsPanels();
          return;
        }
        const res = await window.api.lockfileGenerate(latestActive.id);
        appendLog(`[lockfile] Generated for ${latestActive.name}: ${res.artifacts} artifacts @ ${res.generatedAt}`);
      });

    const btnCheckLock = document.createElement("button");
    btnCheckLock.className = "btn";
    btnCheckLock.textContent = "Check lock drift";
    btnCheckLock.disabled = !activeInstance;
    btnCheckLock.onclick = () =>
      guarded(async () => {
        const latest = await window.api.instancesList();
        state.instances = latest;
        const latestActiveId = latest?.activeInstanceId ?? null;
        const latestActive = (latest?.instances ?? []).find((x: any) => x.id === latestActiveId) ?? null;
        if (!latestActive) {
          alert("No active instance selected.");
          renderSettingsPanels();
          return;
        }
        const drift = await window.api.lockfileDrift(latestActive.id);
        if (drift.clean) {
          appendLog("[lockfile] Drift check: clean.");
          alert("Lockfile drift check: clean.");
          return;
        }
        const summary = drift.issues.map((x) => `${x.id}: ${x.message}`).join("\n");
        appendLog(`[lockfile] Drift check found ${drift.issues.length} issue(s).`);
        alert(`Lockfile drift detected (${drift.issues.length}):\n${summary}`);
      });

    lockWrap.appendChild(btnGenLock);
    lockWrap.appendChild(btnCheckLock);
    settingsPanelInstall.appendChild(lockWrap);
  }

  // Window
  clearPanel(settingsPanelWindow);
  settingsPanelWindow.appendChild(makeH3("Window"));
  {
    const { row } = makeRow("Fullscreen", "Start launcher in fullscreen mode (if you implement it on the main process).");
    const sw = makeSwitch(s.fullscreen, (v) => setSettings({ fullscreen: v }));
    row.appendChild(sw);
    settingsPanelWindow.appendChild(row);
  }
  {
    const { row } = makeRow("Window size (WxH)", "Stored locally; apply in main process if desired.");
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.justifyContent = "flex-end";

    const w = makeInput(String(s.winW), "854", (v) => {
      const n = Math.max(480, Math.min(3840, Number(v || 0)));
      if (!Number.isFinite(n)) return;
      setSettings({ winW: n });
    });
    (w as any).type = "number";

    const h = makeInput(String(s.winH), "480", (v) => {
      const n = Math.max(360, Math.min(2160, Number(v || 0)));
      if (!Number.isFinite(n)) return;
      setSettings({ winH: n });
    });
    (h as any).type = "number";

    w.style.width = "120px";
    h.style.width = "120px";

    wrap.appendChild(w);
    wrap.appendChild(h);
    row.appendChild(wrap);
    settingsPanelWindow.appendChild(row);
  }

  // Java
  clearPanel(settingsPanelJava);
  settingsPanelJava.appendChild(makeH3("Java"));
  {
    const { row } = makeRow("JVM arguments", "Example: -XX:+UseG1GC -XX:MaxGCPauseMillis=50");
    const ta = makeTextarea(s.jvmArgs, "-XX:+UseG1GC", (v) => setSettings({ jvmArgs: v }));
    row.appendChild(ta);
    settingsPanelJava.appendChild(row);
  }

  // Hooks
  clearPanel(settingsPanelHooks);
  settingsPanelHooks.appendChild(makeH3("Hooks"));
  {
    const { row } = makeRow("Pre-launch", "Command to run before launching Minecraft.");
    const ta = makeTextarea(s.preLaunch, "echo prelaunch", (v) => setSettings({ preLaunch: v }));
    row.appendChild(ta);
    settingsPanelHooks.appendChild(row);
  }
  {
    const { row } = makeRow("Post-exit", "Command to run after Minecraft exits.");
    const ta = makeTextarea(s.postExit, "echo postexit", (v) => setSettings({ postExit: v }));
    row.appendChild(ta);
    settingsPanelHooks.appendChild(row);
  }

  // Profile
  clearPanel(settingsPanelProfile);
  settingsPanelProfile.appendChild(makeH3("Profile Showcase"));
  const loading = document.createElement("div");
  loading.className = "setHelp";
  loading.textContent = "Loading profile summary...";
  settingsPanelProfile.appendChild(loading);
}

async function renderProfileSettingsPanel() {
  const token = ++profileRenderToken;
  clearPanel(settingsPanelProfile);
  settingsPanelProfile.appendChild(makeH3("Profile Showcase"));

  const loading = document.createElement("div");
  loading.className = "setHelp";
  loading.textContent = "Collecting aggregated stats...";
  settingsPanelProfile.appendChild(loading);

  try {
    const [summary, visibility] = await Promise.all([window.api.profileGetSummary(), window.api.profileGetVisibility()]);
    if (token !== profileRenderToken) return;

    clearPanel(settingsPanelProfile);
    settingsPanelProfile.appendChild(makeH3("Profile Showcase"));

    const tierLabel = getLauncherTier();
    const cards = document.createElement("div");
    cards.className = "grid";

    const cardData = [
      { title: "Total playtime", value: formatPlaytime(summary.totals.totalPlaytimeMs) },
      { title: "Installed mods", value: String(summary.totals.installedMods) },
      { title: "Active preset", value: formatPresetLabel(summary.activeInstance?.presetId) },
      { title: "Subscription", value: tierLabel },
      {
        title: "Hardware",
        value: `${summary.hardware.cpuCores} cores / ${summary.hardwarePublic.ram} RAM / GPU ${summary.hardwarePublic.gpu}`
      },
      {
        title: "Benchmark",
        value: summary.bestBenchmark
          ? `${summary.bestBenchmark.avgFps} FPS best (${summary.bestBenchmark.instanceName})`
          : "No benchmark runs yet"
      }
    ];

    for (const item of cardData) {
      const card = document.createElement("div");
      card.className = "setRow";
      card.style.marginBottom = "0";
      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      const t = document.createElement("div");
      t.className = "setLabel";
      t.textContent = item.title;
      const v = document.createElement("div");
      v.className = "setHelp";
      v.style.fontSize = "13px";
      v.style.color = "var(--text)";
      v.textContent = item.value;
      left.appendChild(t);
      left.appendChild(v);
      card.appendChild(left);
      cards.appendChild(card);
    }

    settingsPanelProfile.appendChild(cards);

    const hardwareLocal = document.createElement("div");
    hardwareLocal.className = "setHelp";
    hardwareLocal.style.marginTop = "10px";
    hardwareLocal.textContent =
      `Local hardware detail: ${summary.hardware.cpuModel}` +
      `${summary.hardware.gpuModel ? ` | ${summary.hardware.gpuModel}` : " | GPU unknown"}`;
    settingsPanelProfile.appendChild(hardwareLocal);

    const visibilityRow = makeRow(
      "Public profile",
      "When enabled, share uses a public profile link and only public-safe hardware details."
    );
    const visibilityWrap = document.createElement("div");
    visibilityWrap.className = "row";
    visibilityWrap.style.justifyContent = "flex-end";
    visibilityWrap.style.gap = "8px";
    const visibilityLabel = document.createElement("span");
    visibilityLabel.className = "muted";
    visibilityLabel.style.fontSize = "12px";
    visibilityLabel.textContent = visibility.publicEnabled ? "Public" : "Private";
    const visibilitySwitch = makeSwitch(visibility.publicEnabled, (next) => {
      void guarded(async () => {
        await window.api.profileSetVisibility(next);
        await renderProfileSettingsPanel();
      });
    });
    visibilityWrap.appendChild(visibilityLabel);
    visibilityWrap.appendChild(visibilitySwitch);
    visibilityRow.row.appendChild(visibilityWrap);
    settingsPanelProfile.appendChild(visibilityRow.row);

    const shareRow = document.createElement("div");
    shareRow.className = "row";
    shareRow.style.justifyContent = "flex-start";
    shareRow.style.gap = "8px";
    shareRow.style.marginTop = "10px";

    const btnShare = document.createElement("button");
    btnShare.className = "btn btnPrimary";
    btnShare.textContent = "Share Profile";
    btnShare.onclick = async () => {
      const publicPayload = {
        generatedAt: summary.generatedAt,
        player: {
          displayName: String(
            state.launcherAccount?.activeAccount?.displayName ||
              accountName.textContent ||
              "Fishbattery Player"
          ),
          tier: tierLabel
        },
        totals: {
          playtime: formatPlaytime(summary.totals.totalPlaytimeMs),
          installedMods: summary.totals.installedMods,
          instances: summary.totals.instances,
          sessions: summary.totals.sessions
        },
        activePreset: formatPresetLabel(summary.activeInstance?.presetId),
        hardware: summary.hardwarePublic,
        benchmark: summary.bestBenchmark
          ? {
              avgFps: summary.bestBenchmark.avgFps,
              low1Fps: summary.bestBenchmark.low1Fps,
              profile: summary.bestBenchmark.profile,
              instanceName: summary.bestBenchmark.instanceName
            }
          : null,
        setups: summary.setups.slice(0, 8).map((setup) => ({
          name: setup.name,
          version: setup.mcVersion,
          loader: setup.loader,
          installedMods: setup.installedMods,
          playtime: formatPlaytime(setup.playtimeMs),
          preset: formatPresetLabel(setup.presetId),
          benchmarkFps: setup.latestBenchmark?.avgFps ?? null
        }))
      };
      const encoded = encodePublicProfilePayload(publicPayload);
      const profileUrl = `https://fishbatteryapp.github.io/fishbattery-web/profile.html?p=${encodeURIComponent(
        encoded
      )}`;
      const publicSnippet =
        `Fishbattery profile: ${formatPlaytime(summary.totals.totalPlaytimeMs)} playtime, ` +
        `${summary.totals.installedMods} installed mods, ` +
        `${summary.bestBenchmark ? `${summary.bestBenchmark.avgFps} FPS best` : "no benchmark yet"}, ` +
        `${summary.hardwarePublic.cpuCores} cores / ${summary.hardwarePublic.ram} RAM.`;
      const payload = visibility.publicEnabled && profileUrl ? `${publicSnippet}\n${profileUrl}` : publicSnippet;
      try {
        await navigator.clipboard.writeText(payload);
        appendLog("[profile] Copied share payload to clipboard.");
        alert(visibility.publicEnabled && profileUrl ? "Profile link copied." : "Profile summary copied.");
      } catch (err: any) {
        alert(`Could not copy profile share payload: ${String(err?.message ?? err)}`);
      }
    };

    const btnExport = document.createElement("button");
    btnExport.className = "btn";
    btnExport.textContent = "Export Image";
    btnExport.onclick = () => {
      const canvas = renderProfileImage(summary, tierLabel);
      if (!canvas) {
        alert("Could not render profile image.");
        return;
      }
      const href = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = href;
      a.download = "fishbattery-profile-summary.png";
      a.click();
      appendLog("[profile] Exported profile summary image.");
    };

    const btnDiscord = document.createElement("button");
    btnDiscord.className = "btn";
    btnDiscord.textContent = "Join Discord";
    btnDiscord.onclick = () => {
      void guarded(async () => {
        const ok = await window.api.externalOpen(DISCORD_INVITE_URL);
        if (!ok) {
          setStatus("Could not open Discord invite right now.");
          return;
        }
        appendLog(`[community] Opened Discord invite: ${DISCORD_INVITE_URL}`);
      });
    };

    shareRow.appendChild(btnShare);
    shareRow.appendChild(btnExport);
    shareRow.appendChild(btnDiscord);
    settingsPanelProfile.appendChild(shareRow);

    const setupsTitle = document.createElement("div");
    setupsTitle.className = "setLabel";
    setupsTitle.style.marginTop = "12px";
    setupsTitle.textContent = "Installed mod setups";
    settingsPanelProfile.appendChild(setupsTitle);

    const setupsHelp = document.createElement("div");
    setupsHelp.className = "setHelp";
    setupsHelp.textContent = "Per-instance setup summary (mods, preset, playtime, latest benchmark).";
    settingsPanelProfile.appendChild(setupsHelp);

    const setupRows = summary.setups.slice(0, 12);
    if (!setupRows.length) {
      const empty = document.createElement("div");
      empty.className = "setHelp";
      empty.style.marginTop = "8px";
      empty.textContent = "No instances created yet.";
      settingsPanelProfile.appendChild(empty);
    } else {
      for (const setup of setupRows) {
        const row = document.createElement("div");
        row.className = "setRow";
        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.flexDirection = "column";
        const label = document.createElement("div");
        label.className = "setLabel";
        label.textContent = `${setup.name} (${setup.mcVersion} ${setup.loader})`;
        const meta = document.createElement("div");
        meta.className = "setHelp";
        meta.textContent =
          `${setup.installedMods} mods | ${formatPresetLabel(setup.presetId)} | ` +
          `${formatPlaytime(setup.playtimeMs)} playtime` +
          (setup.latestBenchmark ? ` | ${setup.latestBenchmark.avgFps} FPS` : " | no benchmark");
        left.appendChild(label);
        left.appendChild(meta);
        row.appendChild(left);
        settingsPanelProfile.appendChild(row);
      }
    }
  } catch (err: any) {
    if (token !== profileRenderToken) return;
    clearPanel(settingsPanelProfile);
    settingsPanelProfile.appendChild(makeH3("Profile Showcase"));
    const failed = document.createElement("div");
    failed.className = "setHelp";
    failed.textContent = `Profile summary failed to load: ${String(err?.message ?? err)}`;
    settingsPanelProfile.appendChild(failed);
  }
}

function setSettingsTab(tab: "general" | "theme" | "install" | "window" | "java" | "hooks" | "profile") {
  const btns: Record<string, HTMLElement> = {
    general: settingsTabGeneral,
    theme: settingsTabTheme,
    install: settingsTabInstall,
    window: settingsTabWindow,
    java: settingsTabJava,
    hooks: settingsTabHooks,
    profile: settingsTabProfile
  };

  const panels: Record<string, HTMLElement> = {
    general: settingsPanelGeneral,
    theme: settingsPanelTheme,
    install: settingsPanelInstall,
    window: settingsPanelWindow,
    java: settingsPanelJava,
    hooks: settingsPanelHooks,
    profile: settingsPanelProfile
  };

  for (const k of Object.keys(btns)) btns[k].classList.toggle("active", k === tab);
  for (const k of Object.keys(panels)) panels[k].style.display = k === tab ? "" : "none";

  renderSettingsPanels();
  if (tab === "profile") {
    void renderProfileSettingsPanel();
  }
}

settingsTabGeneral.onclick = () => setSettingsTab("general");
settingsTabTheme.onclick = () => setSettingsTab("theme");
settingsTabInstall.onclick = () => setSettingsTab("install");
settingsTabWindow.onclick = () => setSettingsTab("window");
settingsTabJava.onclick = () => setSettingsTab("java");
settingsTabHooks.onclick = () => setSettingsTab("hooks");
settingsTabProfile.onclick = () => setSettingsTab("profile");

async function renderServerEntries(instanceId: string | null) {
  serverList.innerHTML = "";
  editServerId = null;
  serverNameInput.value = "";
  serverAddressInput.value = "";

  if (!instanceId || modalMode !== "edit") {
    serverList.innerHTML = '<div class="muted" style="font-size:12px">Create/save instance first to manage servers.</div>';
    return;
  }

  const data = await window.api.serversList(instanceId);
  const entries = data?.servers ?? [];

  if (!entries.length) {
    serverList.innerHTML = '<div class="muted" style="font-size:12px">No servers saved yet.</div>';
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "setRow";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const title = document.createElement("div");
    title.className = "setLabel";
    title.textContent = entry.name + (data.preferredServerId === entry.id ? " (preferred)" : "");

    const sub = document.createElement("div");
    sub.className = "setHelp";
    sub.textContent = `${entry.address}${entry.notes ? ` - ${entry.notes}` : ""}`;

    left.appendChild(title);
    left.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "row";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const btnPrefer = document.createElement("button");
    btnPrefer.className = "btn";
    btnPrefer.textContent = data.preferredServerId === entry.id ? "Preferred" : "Set preferred";
    btnPrefer.onclick = async () => {
      await window.api.serversSetPreferred(instanceId, entry.id);
      await renderServerEntries(instanceId);
    };

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn";
    btnEdit.textContent = "Edit";
    btnEdit.onclick = () => {
      editServerId = entry.id;
      serverNameInput.value = entry.name;
      serverAddressInput.value = entry.address;
    };

    const btnRemove = document.createElement("button");
    btnRemove.className = "btn btnDanger";
    btnRemove.textContent = "Remove";
    btnRemove.onclick = async () => {
      await window.api.serversRemove(instanceId, entry.id);
      await renderServerEntries(instanceId);
    };

    actions.appendChild(btnPrefer);
    actions.appendChild(btnEdit);
    actions.appendChild(btnRemove);

    row.appendChild(left);
    row.appendChild(actions);
    serverList.appendChild(row);
  }
}

async function ensureFabricApiForFabricInstance(instanceId: string, mcVersion: string, loader: LoaderKind) {
  if (loader !== "fabric") return;
  const hasFabricApi = CATALOG.some((m) => m.id === "fabric-api");
  if (!hasFabricApi) return;
  try {
    await window.api.modsSetEnabled(instanceId, "fabric-api", true);
    await window.api.modsRefresh(instanceId, mcVersion);
    appendLog(`[mods] Ensured Fabric API is installed for Fabric instance ${instanceId}.`);
  } catch (err: any) {
    appendLog(`[mods] Failed ensuring Fabric API: ${String(err?.message ?? err)}`);
  }
}

async function findPreferredServerTarget() {
  const instances = state.instances?.instances ?? [];
  if (!instances.length) return null;

  const activeId = state.instances?.activeInstanceId ?? null;
  const activeInst = instances.find((x: any) => x.id === activeId) ?? null;
  if (activeInst) {
    const s = await window.api.serversList(activeInst.id);
    const preferred = (s?.servers ?? []).find((x: any) => x.id === s.preferredServerId) ?? null;
    if (preferred) return { instance: activeInst, server: preferred };
  }

  for (const inst of instances) {
    const s = await window.api.serversList(inst.id);
    const preferred = (s?.servers ?? []).find((x: any) => x.id === s.preferredServerId) ?? null;
    if (preferred) return { instance: inst, server: preferred };
  }

  return null;
}

async function launchForInstance(inst: any, serverAddress?: string) {
  const accounts = state.accounts?.accounts ?? [];
  const accountId = inst.accountId || state.accounts?.activeId || (accounts[0]?.id ?? null);
  if (!accountId) {
    appendLog("[ui] No account selected.");
    return;
  }

  const s = getSettings();
  const validation = await window.api.modsValidate(inst.id);
  const allIssues = validation.issues || [];
  const blockingIssues = allIssues.filter(isBlockingValidationIssue);
  const advisoryIssues = allIssues.filter((issue) => !isBlockingValidationIssue(issue));
  if (blockingIssues.length) {
    const detail = blockingIssues
      .slice(0, 8)
      .map((x) => `- ${x.title}`)
      .join("\n");
    const launchAnyway = confirm(
      `Critical mod conflicts detected:\n${detail}\n\nUse "Update Mods" or fix duplicates first.\nLaunch anyway?`
    );
    if (!launchAnyway) return;
  } else if ((validation.issues || []).length) {
    appendLog("[validation] Advisory issues detected. Open Mods tab for details.");
  }

  appendLog(
    serverAddress
      ? `[server] Launching ${inst.name} for ${serverAddress}...`
      : `[ui] Launching ${inst.name}...`
  );
  renderLaunchDiagnosis(null);
  const launchRes = await window.api.launch(inst.id, accountId, {
    jvmArgs: inst.jvmArgsOverride || s.jvmArgs,
    preLaunch: s.preLaunch,
    postExit: s.postExit,
    serverAddress
  });
  if (!launchRes?.ok) {
    const diag = await runLaunchDiagnosis(inst.id);
    await maybeOfferRollback(inst.id, diag);
  }
}

// ---------------- Local content (mods/resourcepacks/shaderpacks uploads) ----------------
async function renderLocalContent(instanceId: string | null) {
  const can = modalMode === "edit" && !!instanceId;
  if (!can) {
    if (modalLocalModsList) modalLocalModsList.innerHTML = '<div class="muted" style="font-size:12px">Select an instance first.</div>';
    if (resourcepacksList) resourcepacksList.innerHTML = '<div class="muted" style="font-size:12px">Select an instance first.</div>';
    if (shaderpacksList) shaderpacksList.innerHTML = '<div class="muted" style="font-size:12px">Select an instance first.</div>';
    return;
  }

  const [mods, rps, sps] = await Promise.all([
    window.api.contentList(instanceId, "mods"),
    window.api.contentList(instanceId, "resourcepacks"),
    window.api.contentList(instanceId, "shaderpacks")
  ]);

  const removeFn = async (kind: "resourcepacks" | "shaderpacks", name: string) => {
    await window.api.contentRemove(instanceId, kind, name);
    await renderLocalContent(instanceId);
  };

  renderFileList(
    modalLocalModsList,
    "mods",
    mods,
    async (name) => {
      await window.api.contentRemove(instanceId, "mods", name);
      await renderLocalContent(instanceId);
    },
    async (name, shouldEnable) => {
      await window.api.contentToggleEnabled(instanceId, "mods", name, shouldEnable);
      await renderLocalContent(instanceId);
      await renderInstanceMods(instanceId);
    }
  );

  renderFileList(
    resourcepacksList,
    "resourcepacks",
    rps,
    async (name) => removeFn("resourcepacks", name),
    async (name, shouldEnable) => {
      await window.api.contentToggleEnabled(instanceId, "resourcepacks", name, shouldEnable);
      await renderLocalContent(instanceId);
    }
  );

  renderFileList(
    shaderpacksList,
    "shaderpacks",
    sps,
    async (name) => removeFn("shaderpacks", name),
    async (name, shouldEnable) => {
      await window.api.contentToggleEnabled(instanceId, "shaderpacks", name, shouldEnable);
      await renderLocalContent(instanceId);
    }
  );
}

async function pickAndAdd(kind: "mods" | "resourcepacks" | "shaderpacks") {
  if (!editInstanceId) return;
  const files = await window.api.contentPickFiles(kind);
  if (!files?.length) return;

  const res = await window.api.contentAdd(editInstanceId, kind, files);
  const failed = (res ?? []).filter((x: any) => !x.ok);
  if (failed.length) {
    appendLog(`[content] Some files failed: ${failed.map((f: any) => `${f.name}: ${f.error}`).join(" | ")}`);
  }

  await renderLocalContent(editInstanceId);
  if (kind === "mods") {
    const v = await window.api.modsValidate(editInstanceId);
    appendLog(`[validation] After add: ${v.summary} (${v.issues.length} issues)`);
  }
}

// ---------------- Recommended packs (catalog toggles) ----------------
async function renderRecommendedPacks(instanceId: string | null) {
  recommendedPacksList.innerHTML = "";

  if (!instanceId) {
    recommendedPacksList.innerHTML = '<div class="muted" style="font-size:12px">Select an instance first.</div>';
    return;
  }

  const res = await window.api.packsList(instanceId);
  const packs = res?.items ?? [];

  if (!packs.length) {
    recommendedPacksList.innerHTML = '<div class="muted" style="font-size:12px">No recommended packs configured.</div>';
    return;
  }

  for (const p of packs) {
    const row = document.createElement("div");
    row.className = "setRow";
    row.style.marginBottom = "10px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const name = document.createElement("div");
    name.className = "setLabel";
    name.textContent = `${p.name}${p.required ? " (required)" : ""}`;

    const statusBits = [`${p.kind}`, `status: ${p.status}`];
    if (p.versionName) statusBits.push(`version: ${p.versionName}`);
    if (p.error) statusBits.push(`error: ${p.error}`);
    if (!p.enabled) statusBits.push("disabled");

    const sub = document.createElement("div");
    sub.className = "setHelp";
    sub.textContent = statusBits.join(" | ");

    left.appendChild(name);
    left.appendChild(sub);

    const toggle = document.createElement("button");
    toggle.className = "btn";
    toggle.textContent = p.required ? "Required" : p.enabled ? "Disable" : "Enable";
    toggle.disabled = !!p.required;
    toggle.onclick = () =>
      guarded(async () => {
        await window.api.packsSetEnabled(instanceId, p.id, !p.enabled);
        await renderRecommendedPacks(instanceId);
        await renderLocalContent(instanceId);
      });

    row.appendChild(left);
    row.appendChild(toggle);
    recommendedPacksList.appendChild(row);
  }
}

function getModCompatibilityReason(mod: any, mcVersion: string) {
  if (mod?.status === "ok") return null;
  if (mod?.status === "unavailable") {
    return `No compatible Fabric build for Minecraft ${mcVersion} on Modrinth.`;
  }
  const err = String(mod?.resolved?.error ?? "").trim();
  if (err) return err;
  return `Compatibility check failed for Minecraft ${mcVersion}.`;
}

function validationIssueSuggestions(issue: any) {
  const code = String(issue?.code || "");
  const mods = Array.isArray(issue?.modIds) ? issue.modIds : [];
  if (code === "duplicate-mod-id") {
    return ["Use \"Fix duplicates\" to remove older duplicate jars."];
  }
  if (code === "missing-dependency") {
    const dep = mods[1];
    return [
      dep ? `Install/resolve dependency: ${dep}.` : "Resolve missing dependencies with mod refresh.",
      "Click \"Refresh mods\" to pull compatible dependency versions."
    ];
  }
  if (code === "incompatible-minecraft") {
    return [
      "Switch to a compatible Minecraft version or refresh to compatible builds.",
      "Try an instance preset combo known for this version."
    ];
  }
  if (code === "known-conflict") {
    return [
      "Disable one side of the conflict pair.",
      "Use suggested preset combo to avoid conflicting stacks."
    ];
  }
  if (code === "loader-mismatch") {
    return ["Remove non-Fabric jars from the mods folder."];
  }
  return [];
}

function isBlockingValidationIssue(issue: any) {
  const code = String(issue?.code || "");
  const severity = String(issue?.severity || "");
  if (severity !== "critical") return false;
  if (code === "duplicate-mod-id" || code === "missing-dependency") return false;
  return true;
}

function buildModUpdateSummary(plan: any) {
  const lines: string[] = [];
  lines.push(`Smart update analysis (${new Date(plan?.checkedAt || Date.now()).toLocaleString()})`);
  lines.push(
    `Updates: ${plan?.updates?.length || 0}  [Safe: ${plan?.counts?.safe || 0}, Caution: ${plan?.counts?.caution || 0}, Breaking: ${plan?.counts?.breaking || 0}]`
  );
  if (plan?.blocked?.length) lines.push(`Blocked: ${plan.blocked.length}`);
  lines.push("");
  for (const u of (plan?.updates || []).slice(0, 12)) {
    const sev = String(u?.severity || "safe").toUpperCase();
    lines.push(`[${sev}] ${u?.id}: ${u?.fromVersion || "none"} -> ${u?.toVersion || "unknown"}`);
    if (u?.reason) lines.push(`  reason: ${u.reason}`);
    if (u?.dependencyAdded?.length) lines.push(`  deps+: ${u.dependencyAdded.join(", ")}`);
    if (u?.dependencyRemoved?.length) lines.push(`  deps-: ${u.dependencyRemoved.join(", ")}`);
    if (u?.changelog) lines.push(`  changelog: ${String(u.changelog).slice(0, 180)}`);
  }
  if ((plan?.updates?.length || 0) > 12) lines.push(`...and ${plan.updates.length - 12} more`);
  if (plan?.blocked?.length) {
    lines.push("");
    lines.push("Blocked mods:");
    for (const b of plan.blocked.slice(0, 8)) lines.push(`- ${b.id}: ${b.reason}`);
  }
  return lines.join("\n");
}

async function renderCompatibilityGuidance(instanceId: string | null) {
  modalCompatGuidance.innerHTML = "";
  if (!instanceId) return;

  const inst = (state.instances?.instances ?? []).find((x: any) => x.id === instanceId) ?? null;
  if (!inst) return;
  const isFabricLoader = String(inst.loader || "") === "fabric";

  const res = await window.api.modsList(instanceId);
  const mods = res?.mods ?? [];
  const byId = new Map<string, any>(mods.map((m: any) => [m.id, m]));

  const heading = document.createElement("div");
  heading.className = "muted";
  heading.style.fontSize = "12px";
  heading.style.marginBottom = "8px";
  heading.textContent = `Compatibility assistant (${inst.loader}, ${inst.mcVersion})`;
  modalCompatGuidance.appendChild(heading);

  if (!isFabricLoader) {
    const note = document.createElement("div");
    note.className = "setHelp";
    note.style.marginBottom = "8px";
    note.textContent = "Detailed mod validation is currently Fabric-focused. Presets still apply memory and pack profile.";
    modalCompatGuidance.appendChild(note);
  }

  const validation = isFabricLoader
    ? await window.api.modsValidate(instanceId)
    : { summary: "no-issues", issues: [] as any[] };
  const allIssues = validation.issues || [];
  const blockingIssues = allIssues.filter(isBlockingValidationIssue);
  const advisoryIssues = allIssues.filter((issue) => !isBlockingValidationIssue(issue));
  const hasBlockingIssues = blockingIssues.length > 0;
  const valCard = document.createElement("div");
  valCard.className = "setRow";
  valCard.style.marginBottom = "8px";

  const valLeft = document.createElement("div");
  valLeft.style.display = "flex";
  valLeft.style.flexDirection = "column";

  const valTitle = document.createElement("div");
  valTitle.className = "setLabel";
  valTitle.textContent =
    hasBlockingIssues
      ? "Validation: blocking conflicts"
      : allIssues.length === 0
      ? "Validation: no issues"
      : "Validation: advisory notes";

  const valSub = document.createElement("div");
  valSub.className = "setHelp";
  if (hasBlockingIssues) {
    valSub.textContent = blockingIssues.slice(0, 3).map((x) => x.title).join(" • ");
  } else if (advisoryIssues.length) {
    valSub.textContent = `${advisoryIssues.length} non-blocking advisory note(s). Minecraft can still launch normally.`;
  } else {
    valSub.textContent = "All clear.";
  }
  valLeft.appendChild(valTitle);
  valLeft.appendChild(valSub);

  const valActions = document.createElement("div");
  valActions.className = "row";
  valActions.style.justifyContent = "flex-end";
  valActions.style.gap = "8px";

  const btnRecheck = document.createElement("button");
  btnRecheck.className = "btn";
  btnRecheck.textContent = "Re-check";
  btnRecheck.onclick = () =>
    guarded(async () => {
      await renderCompatibilityGuidance(instanceId);
    });
  valActions.appendChild(btnRecheck);

  if (isFabricLoader) {
    const btnFixDup = document.createElement("button");
    btnFixDup.className = "btn";
    btnFixDup.textContent = "Fix duplicates";
    btnFixDup.onclick = () =>
      guarded(async () => {
        const res = await window.api.modsFixDuplicates(instanceId);
        appendLog(`[validation] Removed duplicate jars: ${res.removed.join(", ") || "none"}`);
        await renderCompatibilityGuidance(instanceId);
        await renderInstanceMods(instanceId);
        await renderLocalContent(instanceId);
      });
    valActions.appendChild(btnFixDup);
  }

  valCard.appendChild(valLeft);
  valCard.appendChild(valActions);
  modalCompatGuidance.appendChild(valCard);

  const issuesToRender = hasBlockingIssues ? blockingIssues : [];
  if (issuesToRender.length) {
    for (const issue of issuesToRender) {
      const row = document.createElement("div");
      row.className = "setRow";
      row.style.marginBottom = "8px";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";

      const title = document.createElement("div");
      title.className = "setLabel";
      title.textContent = `${issue.severity === "critical" ? "Critical" : "Warning"}: ${issue.title}`;

      const detail = document.createElement("div");
      detail.className = "setHelp";
      detail.textContent = issue.detail || "";

      left.appendChild(title);
      left.appendChild(detail);

      if (Array.isArray(issue.modIds) && issue.modIds.length) {
        const rel = document.createElement("div");
        rel.className = "setHelp";
        rel.textContent =
          issue.code === "missing-dependency" && issue.modIds.length >= 2
            ? `Dependency path: ${issue.modIds[0]} -> ${issue.modIds[1]}`
            : issue.code === "known-conflict" && issue.modIds.length >= 2
              ? `Conflict path: ${issue.modIds[0]} x ${issue.modIds[1]}`
              : `Affected mods: ${issue.modIds.join(", ")}`;
        left.appendChild(rel);
      }

      const suggestions = validationIssueSuggestions(issue);
      if (suggestions.length) {
        const sug = document.createElement("div");
        sug.className = "setHelp";
        sug.textContent = `Suggested: ${suggestions.join(" ")}`;
        left.appendChild(sug);
      }

      if (Array.isArray(issue.modIds) && issue.modIds.length) {
        const alt = MOD_ALTERNATIVES[issue.modIds[0]];
        if (alt?.length) {
          const altLine = document.createElement("div");
          altLine.className = "setHelp";
          altLine.textContent = `Alternatives: ${alt.join(" | ")}`;
          left.appendChild(altLine);
        }
      }

      const right = document.createElement("div");
      right.className = "row";
      right.style.justifyContent = "flex-end";
      right.style.gap = "8px";

      if (issue.code === "duplicate-mod-id") {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Fix duplicates";
        btn.onclick = () =>
          guarded(async () => {
            const r = await window.api.modsFixDuplicates(instanceId);
            appendLog(`[validation] Removed duplicate jars: ${r.removed.join(", ") || "none"}`);
            await renderCompatibilityGuidance(instanceId);
            await renderInstanceMods(instanceId);
            await renderLocalContent(instanceId);
          });
        right.appendChild(btn);
      } else if (
        isFabricLoader &&
        (issue.code === "missing-dependency" ||
          issue.code === "incompatible-minecraft" ||
          issue.code === "loader-mismatch")
      ) {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Refresh mods";
        btn.onclick = () =>
          guarded(async () => {
            await window.api.modsRefresh(instanceId, inst.mcVersion);
            await renderCompatibilityGuidance(instanceId);
            await renderInstanceMods(instanceId);
            await renderLocalContent(instanceId);
          });
        right.appendChild(btn);
      }

      row.appendChild(left);
      row.appendChild(right);
      modalCompatGuidance.appendChild(row);
    }
  }

  for (const id of Object.keys(INSTANCE_PRESETS) as Array<Exclude<InstancePresetId, "none">>) {
    const preset = INSTANCE_PRESETS[id];
    const variant = preset.variants?.[inst.loader as LoaderKind];
    if (!variant) continue;
    const needed = isFabricLoader ? variant.enableMods.filter((m) => byId.has(m)) : [];
    const missing = isFabricLoader ? needed.filter((m) => byId.get(m)?.status !== "ok") : [];

    const card = document.createElement("div");
    card.className = "setRow";
    card.style.marginBottom = "8px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const title = document.createElement("div");
    title.className = "setLabel";
    title.textContent = `${preset.name} combo`;

    const sub = document.createElement("div");
    sub.className = "setHelp";
    sub.textContent =
      !isFabricLoader
        ? "Ready for this loader profile."
        : missing.length === 0
        ? "Ready for this version."
        : `Missing compatibility: ${missing.join(", ")}`;

    left.appendChild(title);
    left.appendChild(sub);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Apply combo";
    btn.onclick = () =>
      guarded(async () => {
        await applyInstancePreset(instanceId, inst.mcVersion, inst.loader as LoaderKind, id);
        await renderCompatibilityGuidance(instanceId);
        await renderInstanceMods(instanceId);
        await renderLocalContent(instanceId);
      });

    card.appendChild(left);
    card.appendChild(btn);
    modalCompatGuidance.appendChild(card);
  }
}

// ---------------- Mods list (catalog toggles) ----------------
async function renderInstanceMods(instanceId: string | null) {
  modalModsList.innerHTML = "";
  modalCompatGuidance.innerHTML = "";

  if (!instanceId) {
    modalModsHint.textContent = "Select an instance first.";
    return;
  }

  const inst = (state.instances?.instances ?? []).find((x: any) => x.id === instanceId) ?? null;
  const mcVersion = inst?.mcVersion ?? "unknown";
  modalModsHint.textContent = `Mods for this instance (${mcVersion}):`;
  await renderCompatibilityGuidance(instanceId);
  const res = await window.api.modsList(instanceId);

  const mods = res?.mods ?? [];
  for (const m of mods) {
    const row = document.createElement("div");
    row.className = "setRow";
    row.style.marginBottom = "10px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const name = document.createElement("div");
    name.className = "setLabel";
    name.textContent = m.name ?? m.id ?? "Mod";

    const sub = document.createElement("div");
    sub.className = "setHelp";
    const bits = [];
    bits.push(`status: ${m.status}`);
    if (!m.enabled) bits.push("disabled");
    const reason = getModCompatibilityReason(m, mcVersion);
    if (reason) bits.push(reason);
    const alts = MOD_ALTERNATIVES[m.id];
    if (reason && alts?.length) bits.push(`Try: ${alts.join(" | ")}`);
    sub.textContent = bits.join(" | ");

    left.appendChild(name);
    left.appendChild(sub);

    const toggle = document.createElement("button");
    toggle.className = "btn";
    toggle.textContent = m.enabled ? "Disable" : "Enable";
    toggle.onclick = () =>
      guarded(async () => {
        await window.api.modsSetEnabled(instanceId, m.id, !m.enabled);
        await renderInstanceMods(instanceId);
        await renderLocalContent(instanceId);
      });

    row.appendChild(left);
    row.appendChild(toggle);

    modalModsList.append(row);
  }
}

// ---------------- Accounts ----------------
function getAccountLabel(a: any) {
  return a?.name ?? a?.username ?? a?.profileName ?? a?.id ?? "Account";
}

function getLauncherDisplayName(a: any) {
  return a?.displayName ?? a?.email ?? a?.id ?? "Launcher account";
}

async function runLauncherAccountAction(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err: unknown) {
    const message =
      (err && typeof err === "object" && "message" in err && String((err as { message?: unknown }).message)) ||
      "Launcher account request failed.";
    alert(message);
  }
}

async function refreshLauncherSubscription() {
  if (!state.launcherAccount?.activeAccountId) {
    state.launcherSubscription = null;
    return;
  }
  try {
    state.launcherSubscription = await window.api.launcherAccountGetSubscriptionStatus();
  } catch {
    state.launcherSubscription = null;
  }
}

type LauncherAuthFormResult =
  | {
      action: "credentials";
      mode: "login" | "register";
      email: string;
      password: string;
      displayName?: string;
    }
  | {
      action: "google";
    }
  | null;

type LauncherProfileFormResult = {
  displayName: string;
  avatarUrl: string | null;
} | null;

async function openLauncherTwoFactorDialog(): Promise<string | null> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(5, 12, 22, 0.72)";
    backdrop.style.display = "grid";
    backdrop.style.placeItems = "center";
    backdrop.style.zIndex = "100000";

    const panel = document.createElement("div");
    panel.style.width = "min(420px, calc(100vw - 24px))";
    panel.style.padding = "14px";
    panel.style.borderRadius = "14px";
    panel.style.border = "1px solid var(--line)";
    panel.style.background = "var(--panel)";
    panel.style.boxShadow = "0 16px 50px rgba(0,0,0,.45)";

    const title = document.createElement("h3");
    title.textContent = "Authenticator code required";
    title.style.margin = "0 0 8px";

    const hint = document.createElement("p");
    hint.className = "muted";
    hint.style.margin = "0 0 10px";
    hint.textContent = "Enter the 6-digit code from your authenticator app.";

    const field = document.createElement("label");
    field.style.display = "grid";
    field.style.gap = "6px";
    field.style.marginBottom = "10px";
    const fieldLabel = document.createElement("span");
    fieldLabel.className = "muted";
    fieldLabel.style.fontSize = "12px";
    fieldLabel.textContent = "Code";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "input";
    input.inputMode = "numeric";
    input.maxLength = 6;
    input.placeholder = "123456";
    field.append(fieldLabel, input);

    const status = document.createElement("p");
    status.className = "muted";
    status.style.margin = "6px 0 0";
    status.style.fontSize = "13px";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn";
    cancelBtn.textContent = "Cancel";
    const verifyBtn = document.createElement("button");
    verifyBtn.className = "btn ok";
    verifyBtn.textContent = "Verify code";
    actions.append(cancelBtn, verifyBtn);

    panel.append(title, hint, field, actions, status);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    const cleanup = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onEsc);
    };
    const finish = (value: string | null) => {
      cleanup();
      resolve(value);
    };
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") finish(null);
    };
    document.addEventListener("keydown", onEsc);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) finish(null);
    });
    cancelBtn.onclick = () => finish(null);

    const submit = () => {
      const code = input.value.replace(/\s+/g, "");
      if (!/^\d{6}$/.test(code)) {
        status.textContent = "Enter a valid 6-digit code.";
        return;
      }
      finish(code);
    };
    verifyBtn.onclick = submit;
    input.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      submit();
    });
    input.focus();
  });
}

async function openLauncherAuthDialog(mode: "login" | "register"): Promise<LauncherAuthFormResult> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(5, 12, 22, 0.72)";
    backdrop.style.display = "grid";
    backdrop.style.placeItems = "center";
    backdrop.style.zIndex = "99999";

    const panel = document.createElement("div");
    panel.style.width = "min(520px, calc(100vw - 24px))";
    panel.style.padding = "14px";
    panel.style.borderRadius = "14px";
    panel.style.border = "1px solid var(--line)";
    panel.style.background = "var(--panel)";
    panel.style.boxShadow = "0 16px 50px rgba(0,0,0,.45)";

    const kicker = document.createElement("p");
    kicker.textContent = "FISHBATTERY ACCOUNT";
    kicker.style.margin = "0 0 4px";
    kicker.style.fontSize = "12px";
    kicker.style.letterSpacing = "1px";
    kicker.style.color = "var(--accent)";

    const title = document.createElement("h3");
    title.style.margin = "0 0 10px";

    const makeInput = (labelText: string, type = "text", placeholder = "") => {
      const wrap = document.createElement("label");
      wrap.style.display = "grid";
      wrap.style.gap = "6px";
      wrap.style.marginBottom = "10px";
      const label = document.createElement("span");
      label.textContent = labelText;
      label.style.fontSize = "12px";
      label.className = "muted";
      const input = document.createElement("input");
      input.type = type;
      input.placeholder = placeholder;
      input.className = "input";
      wrap.append(label, input);
      return { wrap, input };
    };

    const modeRow = document.createElement("div");
    modeRow.style.display = "flex";
    modeRow.style.gap = "8px";
    modeRow.style.margin = "0 0 12px";

    const loginModeBtn = document.createElement("button");
    loginModeBtn.type = "button";
    loginModeBtn.className = "btn";
    loginModeBtn.textContent = "Sign in";

    const registerModeBtn = document.createElement("button");
    registerModeBtn.type = "button";
    registerModeBtn.className = "btn";
    registerModeBtn.textContent = "Create account";
    modeRow.append(loginModeBtn, registerModeBtn);

    const providerTitle = document.createElement("h4");
    providerTitle.textContent = "Continue with";
    providerTitle.style.margin = "0 0 8px";
    providerTitle.style.fontSize = "22px";

    const providerGrid = document.createElement("div");
    providerGrid.style.display = "grid";
    providerGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    providerGrid.style.gap = "8px";
    providerGrid.style.marginBottom = "10px";

    const makeProviderBtn = (label: string, enabled = false) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = label;
      btn.style.width = "100%";
      if (!enabled) {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
      }
      return btn;
    };

    providerGrid.append(
      makeProviderBtn("Discord"),
      makeProviderBtn("GitHub"),
      makeProviderBtn("Microsoft"),
      makeProviderBtn("Google", true),
      makeProviderBtn("Steam"),
      makeProviderBtn("GitLab")
    );

    const passwordSubtitle = document.createElement("h4");
    passwordSubtitle.style.margin = "0 0 8px";
    passwordSubtitle.style.fontSize = "22px";

    const emailField = makeInput("Email", "email", "you@example.com");
    const displayNameField = makeInput("Username (unique)", "text", "Choose a unique username");
    displayNameField.input.maxLength = 32;
    const passwordField = makeInput("Password", "password", "Password");
    const confirmPasswordField = makeInput("Confirm password", "password", "Confirm password");

    const statusText = document.createElement("p");
    statusText.className = "muted";
    statusText.style.margin = "6px 0 0";
    statusText.style.fontSize = "13px";

    panel.appendChild(kicker);
    panel.appendChild(title);
    panel.appendChild(modeRow);
    panel.appendChild(providerTitle);
    panel.appendChild(providerGrid);
    panel.appendChild(passwordSubtitle);
    panel.appendChild(emailField.wrap);
    panel.appendChild(displayNameField.wrap);
    panel.appendChild(passwordField.wrap);
    panel.appendChild(confirmPasswordField.wrap);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "space-between";
    actions.style.alignItems = "center";
    actions.style.gap = "8px";
    actions.style.marginTop = "4px";

    const leftActions = document.createElement("div");
    leftActions.style.display = "flex";
    leftActions.style.gap = "8px";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn";
    cancelBtn.textContent = "Back";

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn ok";
    submitBtn.textContent = "Sign in";

    leftActions.append(cancelBtn, submitBtn);
    actions.append(leftActions);
    panel.appendChild(actions);
    panel.appendChild(statusText);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    let currentMode: "login" | "register" = mode;

    const cleanup = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onEsc);
    };

    const finish = (value: LauncherAuthFormResult) => {
      cleanup();
      resolve(value);
    };

    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") finish(null);
    };
    document.addEventListener("keydown", onEsc);

    const setStatus = (text: string) => {
      statusText.textContent = text;
    };

    const setMode = (nextMode: "login" | "register") => {
      currentMode = nextMode;
      const isRegister = currentMode === "register";
      title.textContent = isRegister ? "Create account" : "Sign in";
      passwordSubtitle.textContent = isRegister ? "Or create an account yourself" : "Or use a password";
      submitBtn.textContent = isRegister ? "Create account" : "Sign in";
      loginModeBtn.className = isRegister ? "btn" : "btn ok";
      registerModeBtn.className = isRegister ? "btn ok" : "btn";
      displayNameField.wrap.style.display = isRegister ? "grid" : "none";
      confirmPasswordField.wrap.style.display = isRegister ? "grid" : "none";
      setStatus(isRegister ? "Create your account to get started." : "Sign in with your account.");
    };

    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) finish(null);
    });

    loginModeBtn.onclick = () => setMode("login");
    registerModeBtn.onclick = () => setMode("register");

    const googleBtn = Array.from(providerGrid.querySelectorAll("button")).find((b) => b.textContent === "Google");
    if (googleBtn) {
      googleBtn.onclick = () => finish({ action: "google" });
    }

    cancelBtn.onclick = () => finish(null);
    const submitAuth = () => {
      const email = emailField.input.value.trim();
      const password = passwordField.input.value;
      const displayName = displayNameField.input.value.trim();
      if (!email || !password) {
        setStatus("Please enter your email and password.");
        return;
      }
      if (currentMode === "register" && !displayName) {
        setStatus("Please choose a unique username.");
        return;
      }
      if (currentMode === "register" && password !== confirmPasswordField.input.value) {
        setStatus("Passwords do not match.");
        return;
      }
      finish(
        currentMode === "register"
          ? { action: "credentials", mode: "register", email, password, displayName }
          : { action: "credentials", mode: "login", email, password }
      );
    };
    submitBtn.onclick = submitAuth;

    passwordField.input.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      if (currentMode !== "login") return;
      ev.preventDefault();
      submitAuth();
    });
    confirmPasswordField.input.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      if (currentMode !== "register") return;
      ev.preventDefault();
      submitAuth();
    });

    setMode(mode);
    if (mode === "register") {
      displayNameField.input.focus();
    } else {
      emailField.input.focus();
    };
  });
}

async function openLauncherProfileDialog(current: {
  displayName?: string | null;
  avatarUrl?: string | null;
}): Promise<LauncherProfileFormResult> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(5, 12, 22, 0.72)";
    backdrop.style.display = "grid";
    backdrop.style.placeItems = "center";
    backdrop.style.zIndex = "99999";

    const panel = document.createElement("div");
    panel.style.width = "min(500px, calc(100vw - 24px))";
    panel.style.padding = "14px";
    panel.style.borderRadius = "14px";
    panel.style.border = "1px solid var(--line)";
    panel.style.background = "var(--panel)";
    panel.style.boxShadow = "0 16px 50px rgba(0,0,0,.45)";

    const title = document.createElement("h3");
    title.textContent = "Launcher account settings";
    title.style.margin = "0 0 10px";

    const makeInput = (labelText: string, type = "text", placeholder = "") => {
      const wrap = document.createElement("label");
      wrap.style.display = "grid";
      wrap.style.gap = "6px";
      wrap.style.marginBottom = "10px";
      const label = document.createElement("span");
      label.textContent = labelText;
      label.style.fontSize = "12px";
      label.className = "muted";
      const input = document.createElement("input");
      input.type = type;
      input.placeholder = placeholder;
      input.className = "input";
      wrap.append(label, input);
      return { wrap, input };
    };

    const displayNameField = makeInput("Username (unique)", "text", "Your unique username");
    const avatarField = makeInput("Profile picture", "text", "");
    displayNameField.input.value = String(current.displayName || "").trim();
    avatarField.input.readOnly = true;
    avatarField.input.placeholder = "No file selected";
    avatarField.input.value = "";

    let avatarValue: string | null = String(current.avatarUrl || "").trim() || null;
    const filePicker = document.createElement("input");
    filePicker.type = "file";
    filePicker.accept = "image/png,image/jpeg,image/webp,image/gif,image/bmp";
    filePicker.style.display = "none";

    const previewWrap = document.createElement("div");
    previewWrap.style.width = "76px";
    previewWrap.style.height = "76px";
    previewWrap.style.borderRadius = "12px";
    previewWrap.style.border = "1px solid var(--line)";
    previewWrap.style.overflow = "hidden";
    previewWrap.style.background = "var(--panel2)";
    previewWrap.style.display = "grid";
    previewWrap.style.placeItems = "center";
    previewWrap.style.marginBottom = "8px";

    const previewImg = document.createElement("img");
    previewImg.style.width = "100%";
    previewImg.style.height = "100%";
    previewImg.style.objectFit = "cover";
    previewImg.style.display = avatarValue ? "" : "none";
    if (avatarValue) previewImg.src = avatarValue;

    const previewFallback = document.createElement("span");
    previewFallback.className = "muted";
    previewFallback.style.fontSize = "11px";
    previewFallback.textContent = "No picture";
    previewFallback.style.display = avatarValue ? "none" : "";

    previewWrap.append(previewImg, previewFallback);

    const hint = document.createElement("div");
    hint.className = "muted";
    hint.style.fontSize = "12px";
    hint.style.marginBottom = "8px";
    hint.textContent = "Upload an image (PNG, JPG, WEBP, GIF, BMP).";

    panel.append(title, displayNameField.wrap, avatarField.wrap, previewWrap, hint, filePicker);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";
    actions.style.marginTop = "4px";

    const clearAvatarBtn = document.createElement("button");
    clearAvatarBtn.className = "btn";
    clearAvatarBtn.textContent = "Clear picture";

    const pickAvatarBtn = document.createElement("button");
    pickAvatarBtn.className = "btn";
    pickAvatarBtn.textContent = "Upload picture";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn";
    cancelBtn.textContent = "Cancel";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn ok";
    saveBtn.textContent = "Save";

    actions.append(pickAvatarBtn, clearAvatarBtn, cancelBtn, saveBtn);
    panel.appendChild(actions);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    const cleanup = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onEsc);
    };
    const finish = (value: LauncherProfileFormResult) => {
      cleanup();
      resolve(value);
    };
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") finish(null);
    };
    document.addEventListener("keydown", onEsc);

    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) finish(null);
    });

    const renderAvatarState = () => {
      if (avatarValue) {
        previewImg.src = avatarValue;
        previewImg.style.display = "";
        previewFallback.style.display = "none";
        avatarField.input.value = "Image selected";
      } else {
        previewImg.src = "";
        previewImg.style.display = "none";
        previewFallback.style.display = "";
        avatarField.input.value = "";
      }
    };

    pickAvatarBtn.onclick = () => filePicker.click();
    filePicker.onchange = () => {
      const file = filePicker.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => alert("Could not read image file.");
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result.startsWith("data:image/")) {
          alert("Unsupported image format.");
          return;
        }
        avatarValue = result;
        renderAvatarState();
      };
      reader.readAsDataURL(file);
    };
    clearAvatarBtn.onclick = () => {
      avatarValue = null;
      filePicker.value = "";
      renderAvatarState();
    };
    cancelBtn.onclick = () => finish(null);
    saveBtn.onclick = () => {
      const displayName = displayNameField.input.value.trim();
      if (!displayName) {
        alert("Unique username is required.");
        return;
      }
      finish({ displayName, avatarUrl: avatarValue });
    };

    renderAvatarState();
    displayNameField.input.focus();
  });
}

function fallbackAvatarDataUrl(label: string) {
  const txt =
    String(label || "?")
      .trim()
      .slice(0, 1)
      .toUpperCase() || "?";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#124e3a"/><stop offset="100%" stop-color="#1d8d67"/></linearGradient></defs>` +
    `<rect width="96" height="96" rx="18" fill="url(#g)"/>` +
    `<text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial" font-size="46" font-weight="700" fill="#e6fff5">${txt}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function renderAccounts() {
  const launcherState = state.launcherAccount;
  const launcherSubscription = state.launcherSubscription;
  const launcherActive = launcherState?.activeAccount ?? null;
  const accounts = state.accounts?.accounts ?? [];
  const activeId = state.accounts?.activeId ?? null;
  const avatarById = new Map<string, string | null>();

  accountItems.innerHTML = "";

  await Promise.all(
    accounts.map(async (a: any) => {
      try {
        const cached = await window.api.accountsGetAvatar(a.id, false);
        avatarById.set(a.id, cached || fallbackAvatarDataUrl(getAccountLabel(a)));
      } catch {
        avatarById.set(a.id, fallbackAvatarDataUrl(getAccountLabel(a)));
      }
    })
  );

  const activeMc = accounts.find((a: any) => a.id === activeId) ?? accounts[0] ?? null;
  if (activeMc) {
    accountName.textContent = getAccountLabel(activeMc);
    accountSub.textContent = activeMc?.type ?? activeMc?.provider ?? "Microsoft";
    accountAvatarImg.classList.remove("loaded");
    accountAvatarImg.onload = () => accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = avatarById.get(activeMc.id) || fallbackAvatarDataUrl(getAccountLabel(activeMc));
  } else {
    accountName.textContent = "No Minecraft account";
    accountSub.textContent = "Add an account";
    accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = fallbackAvatarDataUrl("?");
  }
  accountAvatarImg.onerror = () => {
    accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = fallbackAvatarDataUrl(accountName.textContent || "?");
  };

  const mcHeader = document.createElement("div");
  mcHeader.className = "dropdownHeader";
  mcHeader.textContent = "Minecraft accounts";
  accountItems.appendChild(mcHeader);

  for (const a of accounts) {
    const item = document.createElement("div");
    item.className = "dropdownItem";
    if (a.id === activeId) item.classList.add("active");
    item.tabIndex = 0;

    const left = document.createElement("div");
    left.className = "left";

    const av = document.createElement("span");
    av.className = "avatar";
    const img = document.createElement("img");
    img.classList.remove("loaded");
    img.onload = () => img.classList.add("loaded");
    img.src = avatarById.get(a.id) || fallbackAvatarDataUrl(getAccountLabel(a));
    img.onerror = () => {
      img.classList.add("loaded");
      img.src = fallbackAvatarDataUrl(getAccountLabel(a));
    };
    av.appendChild(img);

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.flexDirection = "column";
    meta.style.lineHeight = "1.1";

    const title = document.createElement("strong");
    title.style.fontSize = "13px";
    title.textContent = getAccountLabel(a) + (a.id === activeId ? " (active)" : "");

    const sub = document.createElement("small");
    sub.className = "muted";
    sub.style.fontSize = "11px";
    sub.textContent = a?.type ?? a?.provider ?? "Microsoft";

    meta.appendChild(title);
    meta.appendChild(sub);

    left.appendChild(av);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "right";

    const btnRemoveAccount = document.createElement("button");
    btnRemoveAccount.className = "accountTrashBtn";
    btnRemoveAccount.title = "Remove account";
    btnRemoveAccount.setAttribute("aria-label", "Remove account");
    btnRemoveAccount.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"/>' +
      '<path fill="currentColor" d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"/>' +
      "</svg>";
    btnRemoveAccount.onclick = (e) => {
      e.stopPropagation();
      void guarded(async () => {
        const ok = confirm(`Remove account "${getAccountLabel(a)}"?`);
        if (!ok) return;
        await window.api.accountsRemove(a.id);
        state.accounts = await window.api.accountsList();
        await renderAccounts();
      });
    };
    right.appendChild(btnRemoveAccount);

    item.appendChild(left);
    item.appendChild(right);

    const selectAccount = async () => {
      await window.api.accountsSetActive(a.id);
      state.accounts = await window.api.accountsList();
      await renderAccounts();
      accountDropdown.classList.remove("open");
    };

    item.onclick = async () => {
      await selectAccount();
    };
    item.onkeydown = async (ev: KeyboardEvent) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      await selectAccount();
    };

    accountItems.appendChild(item);
  }

  accountAdd.textContent = "+ Add Minecraft account";

  const popSep = document.createElement("div");
  popSep.className = "popSep";
  accountItems.appendChild(popSep);

  const launcherHeader = document.createElement("div");
  launcherHeader.className = "dropdownHeader";
  launcherHeader.textContent = "Fishbattery account";
  accountItems.appendChild(launcherHeader);

  const launcherActionRow = document.createElement("div");
  launcherActionRow.style.padding = "10px 12px";
  launcherActionRow.style.display = "flex";
  launcherActionRow.style.gap = "8px";
  launcherActionRow.style.flexWrap = "wrap";
  const launcherPlanTier = getLauncherTier();
  const launcherPlanLabel =
    launcherPlanTier === "founder" ? "Founder" : launcherPlanTier === "premium" ? "Premium" : "Free";

  const btnLauncherSignIn = document.createElement("button");
  btnLauncherSignIn.className = "btn";
  btnLauncherSignIn.textContent = "Sign in";
  const openLauncherAuthFlow = (initialMode: "login" | "register") => {
    void runLauncherAccountAction(async () => {
      const values = await openLauncherAuthDialog(initialMode);
      if (!values) return;
      if (values.action === "google") {
        alert("A browser window will open for Google sign-in. Complete it, then return to the launcher.");
        state.launcherAccount = await window.api.launcherAccountGoogleLogin();
      } else if (values.mode === "register") {
        state.launcherAccount = await window.api.launcherAccountRegister(values.email, values.password, values.displayName);
      } else {
        const loginResult = await window.api.launcherAccountLogin(values.email, values.password);
        if (loginResult?.requiresTwoFactor) {
          const code = await openLauncherTwoFactorDialog();
          if (!code) return;
          state.launcherAccount = await window.api.launcherAccountLogin2fa(loginResult.challengeToken, code);
        } else {
          state.launcherAccount = loginResult.state;
        }
      }
      await refreshLauncherSubscription();
      await renderAccounts();
      accountDropdown.classList.remove("open");
    });
  };
  btnLauncherSignIn.onclick = () => openLauncherAuthFlow("login");

  const btnLauncherRegister = document.createElement("button");
  btnLauncherRegister.className = "btn";
  btnLauncherRegister.textContent = "Create account";
  btnLauncherRegister.onclick = () => openLauncherAuthFlow("register");

  const btnLauncherLogout = document.createElement("button");
  btnLauncherLogout.className = "btn";
  btnLauncherLogout.textContent = "Sign out";
  btnLauncherLogout.onclick = () => {
    void runLauncherAccountAction(async () => {
      state.launcherAccount = await window.api.launcherAccountLogout();
      state.launcherSubscription = null;
      await renderAccounts();
      accountDropdown.classList.remove("open");
    });
  };

  const btnLauncherSettings = document.createElement("button");
  btnLauncherSettings.className = "btn";
  btnLauncherSettings.textContent = "Account settings";
  btnLauncherSettings.onclick = () => {
    void runLauncherAccountAction(async () => {
      const values = await openLauncherProfileDialog({
        displayName: launcherState?.activeAccount?.displayName,
        avatarUrl: launcherState?.activeAccount?.avatarUrl ?? null
      });
      if (!values) return;
      state.launcherAccount = await window.api.launcherAccountUpdateProfile({
        displayName: values.displayName,
        avatarUrl: values.avatarUrl
      });
      await refreshLauncherSubscription();
      await renderAccounts();
      accountDropdown.classList.remove("open");
    });
  };

  const btnUpgradePremium = document.createElement("button");
  btnUpgradePremium.className = "btn";
  btnUpgradePremium.textContent = "Upgrade to Premium";
  btnUpgradePremium.onclick = () => {
    void runLauncherAccountAction(async () => {
      await openUpgradeFlow();
    });
  };

  if (launcherState?.configured === false) {
    const warn = document.createElement("div");
    warn.style.padding = "2px 12px 10px";
    warn.className = "muted";
    warn.style.fontSize = "12px";
    warn.textContent = "Launcher sign-in unavailable.";
    accountItems.appendChild(warn);
  } else if (!launcherActive) {
    launcherActionRow.appendChild(btnLauncherSignIn);
    launcherActionRow.appendChild(btnLauncherRegister);
    accountItems.appendChild(launcherActionRow);
  } else {
    launcherActionRow.appendChild(btnLauncherSettings);
    launcherActionRow.appendChild(btnLauncherLogout);
    accountItems.appendChild(launcherActionRow);

    const launcherAccounts = Array.isArray(launcherState?.accounts) ? launcherState.accounts : [launcherActive];
    for (const a of launcherAccounts) {
      const item = document.createElement("div");
      item.className = "dropdownItem";
      if (a.id === launcherState?.activeAccountId) item.classList.add("active");
      item.tabIndex = 0;

      const left = document.createElement("div");
      left.className = "left";

      const av = document.createElement("span");
      av.className = "avatar";
      const img = document.createElement("img");
      img.classList.add("loaded");
      img.src = a.avatarUrl || fallbackAvatarDataUrl(getLauncherDisplayName(a));
      img.onerror = () => {
        img.classList.add("loaded");
        img.src = fallbackAvatarDataUrl(getLauncherDisplayName(a));
      };
      av.appendChild(img);

      const meta = document.createElement("div");
      meta.style.display = "flex";
      meta.style.flexDirection = "column";
      meta.style.lineHeight = "1.1";

      const title = document.createElement("strong");
      title.style.fontSize = "13px";
      title.textContent = getLauncherDisplayName(a) + (a.id === launcherState?.activeAccountId ? " (active)" : "");

      const sub = document.createElement("small");
      sub.className = "muted";
      sub.style.fontSize = "11px";
      const tier = String(a.subscriptionTier || launcherPlanTier || "free").toLowerCase();
      const tierLabel = tier === "founder" ? "Founder" : tier === "premium" ? "Premium" : "Free";
      sub.textContent = `Fishbattery - ${tierLabel}`;

      meta.appendChild(title);
      meta.appendChild(sub);
      left.appendChild(av);
      left.appendChild(meta);
      item.appendChild(left);

      item.onclick = () => {
        void runLauncherAccountAction(async () => {
          state.launcherAccount = await window.api.launcherAccountSwitch(a.id);
          await refreshLauncherSubscription();
          await renderAccounts();
          accountDropdown.classList.remove("open");
        });
      };

      accountItems.appendChild(item);
    }
    launcherActionRow.appendChild(btnUpgradePremium);
    accountItems.appendChild(launcherActionRow);

    const planHint = document.createElement("div");
    planHint.style.padding = "0 12px 10px";
    planHint.className = "muted";
    planHint.style.fontSize = "12px";
    const priorityLabel = launcherSubscription?.features?.cloudSyncPriority ? "Priority" : "Standard";
    planHint.textContent = `Plan: ${launcherPlanLabel} - Cloud sync: ${priorityLabel}`;
    accountItems.appendChild(planHint);
  }

  if (accounts.length && !accountAvatarWarmupInFlight) {
    accountAvatarWarmupInFlight = true;
    void (async () => {
      let updated = false;
      for (const a of accounts) {
        try {
          const cached = await window.api.accountsGetAvatar(a.id, false);
          if (cached) continue;
          const fresh = await window.api.accountsGetAvatar(a.id, true);
          if (fresh) updated = true;
        } catch {
          // keep fallback
        }
      }
      accountAvatarWarmupInFlight = false;
      if (updated) await renderAccounts();
    })();
  }
  void renderSponsoredBannerState();
  ensureCloudSyncTimer();
}
// ---------------- Instances (card layout) ----------------
function filteredInstances() {
  const q = (searchInstances.value || "").trim().toLowerCase();
  const items = state.instances?.instances ?? [];
  if (!q) return items;
  return items.filter((i: any) => {
    const name = (i.name || "").toLowerCase();
    const v = (i.mcVersion || "").toLowerCase();
    return name.includes(q) || v.includes(q);
  });
}

type RunningSnapshot = {
  count: number;
  byId: Map<string, boolean>;
};

function updateTopbarRunningPill(runningCount: number) {
  if (!windowTopbarPill) return;
  if (runningCount <= 0) {
    windowTopbarPill.textContent = "No instances running";
    return;
  }
  windowTopbarPill.textContent = runningCount === 1 ? "1 instance running" : `${runningCount} instances running`;
}

async function getRunningSnapshot(instances: any[]): Promise<RunningSnapshot> {
  const byId = new Map<string, boolean>();
  if (!instances.length) return { count: 0, byId };

  const checks = await Promise.all(
    instances.map(async (inst) => {
      const id = String(inst?.id || "").trim();
      if (!id) return { id, running: false };
      try {
        return { id, running: !!(await window.api.launchIsRunning(id)) };
      } catch {
        return { id, running: false };
      }
    })
  );

  let count = 0;
  for (const check of checks) {
    if (!check.id) continue;
    byId.set(check.id, check.running);
    if (check.running) count += 1;
  }
  return { count, byId };
}

async function renderInstances() {
  const items = filteredInstances();
  const active = state.instances?.activeInstanceId ?? null;
  const allInstances = state.instances?.instances ?? [];
  const runningSnapshot = await getRunningSnapshot(allInstances);
  updateTopbarRunningPill(runningSnapshot.count);
  instancesGrid.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "emptyInstances";
    empty.innerHTML = `
      <strong>No instances yet</strong>
      <p>Create your first instance or import a modpack to get started.</p>
      <div class="emptyInstancesActions">
        <button id="emptyCreateInstance" class="btn btnPrimary" type="button">Create Instance</button>
        <button id="emptyImportInstance" class="btn" type="button">Import Modpack</button>
      </div>
    `;
    instancesGrid.appendChild(empty);
    const emptyCreateInstance = empty.querySelector("#emptyCreateInstance") as HTMLButtonElement | null;
    const emptyImportInstance = empty.querySelector("#emptyImportInstance") as HTMLButtonElement | null;
    if (emptyCreateInstance) emptyCreateInstance.onclick = () => btnCreate.click();
    if (emptyImportInstance) emptyImportInstance.onclick = () => btnImport.click();
    return;
  }

  const icons = new Map<string, string | null>();
  await Promise.all(
    items.map(async (i: any) => {
      try {
        icons.set(i.id, await window.api.instancesGetIcon(i.id));
      } catch {
        icons.set(i.id, null);
      }
    })
  );

  for (const i of items) {
    const card = document.createElement("div");
    card.className = "card";
    if (i.id === active) {
      card.style.boxShadow = "0 0 0 2px rgba(61,220,132,.18)";
    }

    const inner = document.createElement("div");
    inner.className = "cardInner";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const iconData = icons.get(i.id) || null;
    if (iconData) {
      const icon = document.createElement("img");
      icon.src = iconData;
      icon.alt = `${i.name ?? "Instance"} icon`;
      icon.style.width = "100%";
      icon.style.height = "100%";
      icon.style.objectFit = "cover";
      icon.style.borderRadius = "14px";
      thumb.appendChild(icon);
    }

    const meta = document.createElement("div");
    meta.className = "cardMeta";

    const title = document.createElement("strong");
    title.textContent = i.name ?? "Instance";

    const badges = document.createElement("div");
    badges.className = "badges";

    const b1 = document.createElement("div");
    b1.className = "badge";
    b1.textContent = `${i.loader ?? "fabric"}`;

    const b2 = document.createElement("div");
    b2.className = "badge";
    b2.textContent = `${i.mcVersion ?? ""}`;

    badges.appendChild(b1);
    badges.appendChild(b2);

    const subtext = document.createElement("small");
    subtext.className = "instanceSubtext";
    subtext.textContent = `${i.loader ?? "fabric"} | Minecraft ${i.mcVersion ?? "unknown"}`;

    meta.appendChild(title);
    meta.appendChild(subtext);
    meta.appendChild(badges);

    const actions = document.createElement("div");
    actions.className = "cardActions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "iconBtn instanceEditBtn";
    btnEdit.type = "button";
    btnEdit.title = "Edit instance";
    btnEdit.setAttribute("aria-label", `Edit ${i.name ?? "instance"}`);
    btnEdit.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19.14 12.94a7.9 7.9 0 0 0 .06-.94c0-.32-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.85a.5.5 0 0 0 .12.63l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.51.4 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.63zM12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4z" fill="currentColor"/></svg>';
    btnEdit.onclick = async () => {
      modalMode = "edit";
      editInstanceId = i.id;
      modalTitle.textContent = "Edit instance";
      createIncludeReleases = true;
      createIncludeSnapshots = true;
      renderCreateFilterButtons();
      fillCreateVersionOptions();
      newName.value = i.name ?? "";
      newMem.value = String(i.memoryMb ?? 4096);
      newVersion.value = i.mcVersion ?? "";
      createLoaderType.value = i.loader ?? "fabric";
      createLoaderVersion.value =
        i.loader === "fabric"
          ? i.fabricLoaderVersion ?? ""
          : i.loader === "quilt"
            ? i.quiltLoaderVersion ?? ""
            : i.loader === "forge"
              ? i.forgeVersion ?? ""
              : i.loader === "neoforge"
                ? i.neoforgeVersion ?? ""
                : "";
      updateCreateLoaderUi();
      setCreateSource("custom");
      createSourceCustom.toggleAttribute("disabled", true);
      createSourceImport.toggleAttribute("disabled", true);
      createSourceModrinth.toggleAttribute("disabled", true);
      createSourceCurseForge.toggleAttribute("disabled", true);
      createSourceTechnic.toggleAttribute("disabled", true);
      createSourceATLauncher.toggleAttribute("disabled", true);
      createSourceFTB.toggleAttribute("disabled", true);
      modalInstanceSyncEnabled = i.syncEnabled !== false;
      renderModalInstanceSyncToggle();
      selectedCreateIconPath = null;
      clearExistingIconOnSave = false;
      instanceIconHint.textContent = "Keep existing icon unless you pick a new one.";
      setIconPreviewSource(null);
      resetSelectedIconTransform();
      fillInstancePresetDropdown(i.instancePreset ?? "none", (i.loader ?? "fabric") as LoaderKind);
      await fillInstanceAccountDropdown(i.accountId ?? null);
      await renderServerEntries(i.id);
      openModal();
    };

    const btnPlay = document.createElement("button");
    btnPlay.className = "btn btnPrimary";
    const isRunning = !!runningSnapshot.byId.get(String(i.id || ""));
    btnPlay.textContent = isRunning ? "Running" : "Play";
    btnPlay.disabled = isRunning;
    btnPlay.onclick = async () => {
      if (state.instances?.activeInstanceId !== i.id) {
        await window.api.instancesSetActive(i.id);
        state.instances = await window.api.instancesList();
        await renderInstances();
      }
      await launchForInstance(i);
    };

    const btnUse = document.createElement("button");
    btnUse.className = "btn";
    btnUse.textContent = i.id === active ? "Active" : "Set Active";
    btnUse.onclick = async () => {
      await window.api.instancesSetActive(i.id);
      state.instances = await window.api.instancesList();
      await renderInstances();
    };

    // Delete button
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn btnDanger";
    btnDelete.textContent = "Delete";
    btnDelete.onclick = async () => {
      const ok = confirm(`Delete "${i.name ?? "Instance"}"? This will remove the entire instance folder.`);
      if (!ok) return;
      await window.api.instancesRemove(i.id);
      state.instances = await window.api.instancesList();
      await renderInstances();
    };

    const btnExport = document.createElement("button");
    btnExport.className = "btn";
    btnExport.textContent = "Export";
    btnExport.onclick = async () => {
      const res = await window.api.instancesExport(i.id);
      if (!res.ok || res.canceled) return;
      appendLog(`[instance] Exported "${i.name}" -> ${res.path}`);
      alert(`Instance exported:\n${res.path}`);
    };

    const btnJoin = document.createElement("button");
    btnJoin.className = "btn";
    btnJoin.textContent = "Join Server";
    btnJoin.onclick = async () => {
      const s = await window.api.serversList(i.id);
      const preferred = (s?.servers ?? []).find((x: any) => x.id === s.preferredServerId) ?? null;
      if (!preferred) {
        alert("No preferred server set for this instance.");
        return;
      }
      if (state.instances?.activeInstanceId !== i.id) {
        await window.api.instancesSetActive(i.id);
        state.instances = await window.api.instancesList();
        await renderInstances();
      }
      await launchForInstance(i, String(preferred.address || "").trim());
    };

    actions.appendChild(btnPlay);
    actions.appendChild(btnUse);
    actions.appendChild(btnJoin);
    actions.appendChild(btnExport);
    actions.appendChild(btnDelete);

    card.appendChild(btnEdit);
    inner.appendChild(thumb);
    inner.appendChild(meta);
    inner.appendChild(actions);

    card.appendChild(inner);
    instancesGrid.appendChild(card);
  }
}

async function fillInstanceAccountDropdown(selectedId: string | null) {
  const accounts = state.accounts?.accounts ?? [];
  instanceAccount.innerHTML = "";

  const optAuto = document.createElement("option");
  optAuto.value = "";
  optAuto.textContent = "Use active account";
  instanceAccount.appendChild(optAuto);

  for (const a of accounts) {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = getAccountLabel(a);
    instanceAccount.appendChild(opt);
  }

  instanceAccount.value = selectedId ?? "";
}

function fillCreateVersionOptions() {
  const includeReleases = createIncludeReleases;
  const includeSnapshots = createIncludeSnapshots;
  const current = newVersion.value;

  newVersion.innerHTML = "";
  const versions = (state.versions ?? []).filter((v: any) => {
    if (v?.type === "release") return includeReleases;
    return includeSnapshots;
  });

  for (const v of versions) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = `${v.id}${v.type === "release" ? "" : ` (${v.type})`}`;
    newVersion.appendChild(opt);
  }

  if (current && versions.some((v: any) => v.id === current)) {
    newVersion.value = current;
  }
}

function renderCreateFilterButtons() {
  createFilterReleases.classList.toggle("active", createIncludeReleases);
  createFilterSnapshots.classList.toggle("active", createIncludeSnapshots);
}

function updateCreateLoaderUi() {
  const loader = String(createLoaderType.value || "fabric");
  if (loader === "fabric" || loader === "quilt" || loader === "forge" || loader === "neoforge") {
    createLoaderVersion.disabled = false;
    createLoaderVersion.placeholder = "Auto (recommended)";
    createLoaderHint.textContent = `Auto-picked for ${loader} from official metadata.`;
    return;
  }

  createLoaderVersion.value = "";
  createLoaderVersion.disabled = true;
  if (loader === "vanilla") {
    createLoaderHint.textContent = "Vanilla instances do not require a loader version.";
    return;
  }
  createLoaderHint.textContent = "Select a supported loader.";
}

function renderModalInstanceSyncToggle() {
  instanceSyncEnabled.classList.toggle("active", modalInstanceSyncEnabled);
  instanceSyncEnabled.textContent = modalInstanceSyncEnabled ? "Enabled" : "Disabled";
}

function setCreateSource(next: "custom" | "import" | "modrinth" | "curseforge" | "technic" | "atlauncher" | "ftb") {
  createSource = next;
  const isCustom = next === "custom";
  const isImport = next === "import";
  const isMarket = next === "modrinth" || next === "curseforge" || next === "technic" || next === "atlauncher" || next === "ftb";

  createSourceCustom.classList.toggle("btnPrimary", next === "custom");
  createSourceImport.classList.toggle("btnPrimary", next === "import");
  createSourceModrinth.classList.toggle("btnPrimary", next === "modrinth");
  createSourceCurseForge.classList.toggle("btnPrimary", next === "curseforge");
  createSourceTechnic.classList.toggle("btnPrimary", next === "technic");
  createSourceATLauncher.classList.toggle("btnPrimary", next === "atlauncher");
  createSourceFTB.classList.toggle("btnPrimary", next === "ftb");

  createSourceCustom.classList.toggle("btn", true);
  createSourceImport.classList.toggle("btn", true);
  createSourceModrinth.classList.toggle("btn", true);
  createSourceCurseForge.classList.toggle("btn", true);
  createSourceTechnic.classList.toggle("btn", true);
  createSourceATLauncher.classList.toggle("btn", true);
  createSourceFTB.classList.toggle("btn", true);

  createCustomFields.style.display = isCustom ? "" : "none";
  createProviderImport.style.display = isImport ? "" : "none";
  createProviderMarketplace.style.display = isMarket ? "" : "none";
  const isArchiveProvider = next === "curseforge" || next === "technic";
  createModrinthPanel.style.display = next === "modrinth" ? "" : "none";
  createCurseForgePanel.style.display = next === "modrinth" ? "none" : "";
  if (modalMode === "edit") modalCreate.textContent = "Save";
  else modalCreate.textContent = isCustom ? "Create" : isImport ? "Import" : "Install";

  if (isCustom) {
    createSourceHint.textContent = "Build a custom instance with manual version + loader selection.";
    return;
  }
  if (isImport) {
    createSourceHint.textContent = "Import an existing instance/pack archive.";
    return;
  }
  createProviderMarketplaceTitle.textContent =
    next === "modrinth"
      ? "Modrinth modpack browser"
      : next === "curseforge"
        ? "CurseForge pack browser"
        : next === "technic"
          ? "Technic pack browser"
          : next === "atlauncher"
            ? "ATLauncher pack browser"
            : "FTB pack browser";
  createProviderMarketplaceHelp.textContent =
    next === "modrinth"
      ? "Browse and install Modrinth modpacks into a new isolated instance."
      : isArchiveProvider
        ? "Search and import provider pack archives into a new isolated instance."
        : "Search and install directly from provider catalog.";
  createSourceHint.textContent =
    next === "modrinth"
      ? "Search Modrinth and install directly to a new instance."
      : isArchiveProvider
        ? "Select a provider archive (.zip/.mrpack) and import it into a new instance."
        : "Search and install directly from provider catalog.";
  if (isArchiveProvider) {
    providerArchiveHelp.textContent = `Import ${next.toUpperCase()} archive and create a new instance.`;
  }
  providerArchiveActions.style.display = isArchiveProvider ? "" : "none";
  if (next === "atlauncher" || next === "ftb" || isArchiveProvider) {
    void guarded(async () => {
      await runProviderSearch();
    });
  }
  if (next === "modrinth" && !modrinthSearchResults.innerHTML) {
    void guarded(async () => {
      await runModrinthSearch();
    });
  }
}

function fallbackPackIconDataUrl(label: string, theme: "blue" | "green" = "blue") {
  const text = String(label || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("") || "?";
  const colors =
    theme === "green"
      ? { a: "#0e3f2d", b: "#1d7d58", c: "#86efac" }
      : { a: "#102a43", b: "#1f4f7a", c: "#bfdbfe" };
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${colors.a}"/><stop offset="100%" stop-color="${colors.b}"/></linearGradient></defs>` +
    `<rect width="96" height="96" rx="18" fill="url(#g)"/>` +
    `<text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial" font-size="32" font-weight="700" fill="${colors.c}">${text}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function runModrinthSearch() {
  const q = String(modrinthSearchInput.value || "").trim();
  const isPopular = !q;
  modrinthResultsLabel.textContent = isPopular ? "Popular modpacks" : `Search results for "${q}"`;
  modrinthSearchResults.innerHTML = '<div class="muted" style="font-size:12px">Searching...</div>';
  const data = await window.api.modrinthPacksSearch(q, 24);
  const hits = data?.hits ?? [];
  if (!hits.length) {
    modrinthSearchResults.innerHTML = '<div class="muted" style="font-size:12px">No packs found.</div>';
    return;
  }

  modrinthSearchResults.innerHTML = "";
  for (const h of hits) {
    const row = document.createElement("div");
    row.className = "modrinthResult";

    const img = document.createElement("img");
    const fallback = fallbackPackIconDataUrl(h.title, "blue");
    img.src = h.iconUrl || fallback;
    img.onerror = () => {
      if (img.src !== fallback) img.src = fallback;
    };
    row.appendChild(img);

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.flex = "1";

    const title = document.createElement("div");
    title.className = "setLabel";
    title.textContent = h.title;
    left.appendChild(title);

    const desc = document.createElement("div");
    desc.className = "setHelp";
    desc.textContent = h.description || "No description.";
    left.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "setHelp";
    const mc = h.mcVersion || "unknown MC";
    const loader = h.loader || "unknown loader";
    meta.textContent = `MC ${mc} | ${loader}`;
    left.appendChild(meta);

    row.appendChild(left);

    const btn = document.createElement("button");
    btn.className = "btn";
    const selected = selectedModrinthPack?.projectId === h.projectId;
    btn.textContent = selected ? "Active" : "Choose";
    btn.onclick = () => {
      selectedModrinthPack = {
        projectId: h.projectId,
        title: h.title,
        latestVersionId: h.latestVersionId,
        iconUrl: h.iconUrl
      };
      void runModrinthSearch();
    };
    row.appendChild(btn);

    modrinthSearchResults.appendChild(row);
  }
}

async function runProviderSearch() {
  const provider =
    createSource === "curseforge" || createSource === "technic" || createSource === "atlauncher" || createSource === "ftb"
      ? createSource
      : "curseforge";
  const q = String(providerSearchInput.value || "").trim();
  const isPopular = !q;
  providerResultsLabel.textContent = isPopular ? "Popular packs" : `Search results for "${q}"`;
  providerSearchResults.innerHTML = '<div class="muted" style="font-size:12px">Searching...</div>';

  const data = await window.api.providerPacksSearch(provider, q, 24);
  const hits = data?.hits ?? [];
  if (!hits.length) {
    providerSearchResults.innerHTML = '<div class="muted" style="font-size:12px">No packs found.</div>';
    return;
  }

  providerSearchResults.innerHTML = "";
  for (const h of hits) {
    const row = document.createElement("div");
    row.className = "modrinthResult";

    const img = document.createElement("img");
    const fallback = fallbackPackIconDataUrl(h.name, "blue");
    img.src = h.iconUrl || fallback;
    img.onerror = () => {
      if (img.src !== fallback) img.src = fallback;
    };
    row.appendChild(img);

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.flex = "1";

    const title = document.createElement("div");
    title.className = "setLabel";
    title.textContent = h.name;
    left.appendChild(title);

    const desc = document.createElement("div");
    desc.className = "setHelp";
    desc.textContent = h.description || "No description.";
    left.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "setHelp";
    meta.textContent = `MC ${h.mcVersion} | ${h.loader}`;
    left.appendChild(meta);

    if (Array.isArray(h.tags) && h.tags.length) {
      const tags = document.createElement("div");
      tags.className = "setHelp";
      tags.textContent = `Tags: ${h.tags.slice(0, 4).join(" | ")}`;
      left.appendChild(tags);
    }

    row.appendChild(left);

    const btn = document.createElement("button");
    btn.className = "btn";
    const selected = selectedProviderPack?.id === h.id;
    btn.textContent = selected ? "Active" : "Choose";
    btn.onclick = () => {
      selectedProviderPack = { id: h.id, name: h.name, iconUrl: h.iconUrl || null };
      void runProviderSearch();
    };
    row.appendChild(btn);

    providerSearchResults.appendChild(row);
  }
}

// ---------------- Data refresh ----------------
async function refreshAll() {
  setStatus("Loading...");

  const manifest = await window.api.versionsList();
  state.versions = manifest?.versions ?? [];

  const s = getSettings();
  await window.api.updaterSetChannel(s.updateChannel);
  state.accounts = await window.api.accountsList();
  try {
    state.launcherAccount = await window.api.launcherAccountGetState();
  } catch (err: any) {
    state.launcherAccount = {
      configured: false,
      signedIn: false,
      activeAccountId: null,
      activeAccount: null,
      accounts: [],
      updatedAt: null,
      error: String(err?.message ?? err ?? "Failed to load launcher account state")
    };
  }
  await refreshLauncherSubscription();
  try {
    const remoteSyncState = await window.api.cloudSyncGetState();
    cloudSyncState = {
      lastSyncedAt: remoteSyncState?.lastSyncedAt ?? null,
      lastStatus: remoteSyncState?.lastStatus ?? "idle",
      lastError: remoteSyncState?.lastError ?? null,
      lastRemoteRevision: remoteSyncState?.lastRemoteRevision ?? null
    };
  } catch {
    cloudSyncState = {
      lastSyncedAt: null,
      lastStatus: "error",
      lastError: "Could not load cloud sync state.",
      lastRemoteRevision: null
    };
  }
  state.instances = await window.api.instancesList();
  updaterState = await window.api.updaterGetState();
  preflightState = await window.api.preflightGetLast();

  await renderAccounts();
  await renderInstances();
  await loadSponsoredBannersFromFeed();
  await renderSponsoredBannerState();
  ensureCloudSyncTimer();
  setStatus("");

  if (!preflightState) {
    try {
      preflightState = await window.api.preflightRun();
      appendLog(`[preflight] ${preflightSummaryText(preflightState)}`);
    } catch (err: any) {
      appendLog(`[preflight] Failed: ${String(err?.message ?? err)}`);
    }
  }

  if (!hasAutoCheckedUpdates) {
    hasAutoCheckedUpdates = true;
    try {
      await window.api.updaterCheck();
    } catch {
      // Keep startup silent if update check fails.
    }
  }

  if (getSettings().cloudSyncEnabled && state.launcherAccount?.activeAccountId) {
    void guarded(async () => {
      try {
        await runCloudSync(false);
        renderSettingsPanels();
      } catch (err: any) {
        appendLog(`[cloud-sync] ${String(err?.message ?? err)}`);
      }
    });
  }

  const syncTitleBar = () => {
    const computed = getComputedStyle(document.documentElement);
    const bgRaw = computed.getPropertyValue("--bg");
    const bgHex = cssColorToHex(bgRaw) || "#071525";
    const symbols = idealSymbolColor(bgHex);
    void window.api.windowSetTitleBarTheme(bgHex, symbols);
  };

  syncTitleBar();
  // Re-sync after style recalculation so native caption area always matches active theme.
  requestAnimationFrame(syncTitleBar);
}

sidebarSponsoredCta.onclick = () => {
  const target = String(sponsoredCurrentLink || "").trim();
  if (!target) return;
  void guarded(async () => {
    const ok = await window.api.externalOpen(target);
    if (!ok) {
      setStatus("Could not open sponsor link right now.");
      return;
    }
    appendLog(`[sponsored] Opened: ${target}`);
  });
};

sidebarSponsoredUpgrade.onclick = () => {
  const upgradeUrl = "https://fishbatteryapp.github.io/fishbattery-web/upgrade.html";
  void guarded(async () => {
    const ok = await window.api.externalOpen(upgradeUrl);
    if (!ok) {
      setStatus("Could not open upgrade page right now.");
      return;
    }
    appendLog(`[sponsored] Opened upgrade page: ${upgradeUrl}`);
  });
};

sidebarDiscordBtn.onclick = () => {
  void guarded(async () => {
    const ok = await window.api.externalOpen(DISCORD_INVITE_URL);
    if (!ok) {
      setStatus("Could not open Discord invite right now.");
      return;
    }
    appendLog(`[community] Opened Discord invite: ${DISCORD_INVITE_URL}`);
  });
};

// ---------------- Event wiring ----------------
navLibrary.onclick = () => setView("library");
navCapes.onclick = () => setView("capes");
navSettings.onclick = () => setView("settings");

accountBtn.onclick = () => accountDropdown.classList.toggle("open");
accountAdd.onclick = () =>
  guarded(async () => {
    await window.api.accountsAdd();
    state.accounts = await window.api.accountsList();
    await renderAccounts();
  });

searchInstances.oninput = () => renderInstances();
createFilterReleases.onclick = () => {
  createIncludeReleases = !createIncludeReleases;
  if (!createIncludeReleases && !createIncludeSnapshots) createIncludeSnapshots = true;
  renderCreateFilterButtons();
  fillCreateVersionOptions();
};
createFilterSnapshots.onclick = () => {
  createIncludeSnapshots = !createIncludeSnapshots;
  if (!createIncludeReleases && !createIncludeSnapshots) createIncludeReleases = true;
  renderCreateFilterButtons();
  fillCreateVersionOptions();
};
createLoaderType.onchange = () => {
  updateCreateLoaderUi();
  fillInstancePresetDropdown(instancePreset.value || "none", (createLoaderType.value || "fabric") as LoaderKind);
};
instanceSyncEnabled.onclick = () => {
  modalInstanceSyncEnabled = !modalInstanceSyncEnabled;
  renderModalInstanceSyncToggle();
};
createSourceCustom.onclick = () => setCreateSource("custom");
createSourceImport.onclick = () => setCreateSource("import");
createSourceModrinth.onclick = () => setCreateSource("modrinth");
createSourceCurseForge.onclick = () => setCreateSource("curseforge");
createSourceTechnic.onclick = () => setCreateSource("technic");
createSourceATLauncher.onclick = () => setCreateSource("atlauncher");
createSourceFTB.onclick = () => setCreateSource("ftb");
btnModrinthSearch.onclick = () =>
  guarded(async () => {
    await runModrinthSearch();
  });
modrinthSearchInput.onkeydown = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  void guarded(async () => runModrinthSearch());
};
btnProviderSearch.onclick = () =>
  guarded(async () => {
    await runProviderSearch();
  });
providerSearchInput.onkeydown = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  void guarded(async () => runProviderSearch());
};
btnCreateImportNow.onclick = () =>
  guarded(async () => {
    const res = await window.api.instancesImport();
    if (!res.ok || res.canceled) return;
    if (res.instance?.id && res.instance?.mcVersion && res.instance?.loader) {
      await ensureFabricApiForFabricInstance(res.instance.id, res.instance.mcVersion, res.instance.loader as LoaderKind);
    }
    if (selectedCreateIconPath && res.instance?.id) {
      try {
        await window.api.instancesSetIconFromFile(res.instance.id, selectedCreateIconPath, getSelectedIconTransformPayload());
      } catch (err: any) {
        appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
      }
    }
    state.instances = await window.api.instancesList();
    await renderInstances();
    appendLog(`[instance] Imported "${res.instance?.name ?? "instance"}"`);
    closeModal();
  });
btnProviderImportArchive.onclick = () =>
  guarded(async () => {
    const provider =
      createSource === "curseforge" || createSource === "technic" || createSource === "atlauncher" || createSource === "ftb"
        ? createSource
        : "auto";
    const res = await window.api.packArchiveImport({
      provider,
      defaults: {
        name: newName.value?.trim() || undefined,
        mcVersion: newVersion.value || undefined,
        accountId: instanceAccount.value || null,
        memoryMb: Number(newMem.value || 6144)
      }
    });
    if (!res.ok || res.canceled) return;
    if (res.result?.instance?.id) {
      if (selectedCreateIconPath) {
        try {
          await window.api.instancesSetIconFromFile(
            res.result.instance.id,
            selectedCreateIconPath,
            getSelectedIconTransformPayload()
          );
        } catch (err: any) {
          appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
        }
      } else if (selectedProviderPack?.iconUrl) {
        try {
          await window.api.instancesSetIconFromUrl(res.result.instance.id, selectedProviderPack.iconUrl);
        } catch {
          await window.api.instancesSetIconFallback(res.result.instance.id, selectedProviderPack.name || "Pack", "blue");
        }
      } else {
        await window.api.instancesSetIconFallback(
          res.result.instance.id,
          selectedProviderPack?.name || res.result.instance?.name || "Pack",
          "blue"
        );
      }
    }
    state.instances = await window.api.instancesList();
    await renderInstances();
    appendLog(
      `[pack-import] ${provider} -> ${res.result.detectedFormat}: "${res.result.instance?.name}" (${(res.result.notes || []).join(" | ")})`
    );
    closeModal();
  });
btnPickInstanceIcon.onclick = () =>
  guarded(async () => {
    const picked = await window.api.instancesPickIcon();
    if (!picked) return;
    selectedCreateIconPath = picked;
    clearExistingIconOnSave = false;
    instanceIconHint.textContent = `Selected: ${picked.split(/[/\\\\]/).pop() || picked}`;
    setIconPreviewSource(selectedCreateIconPath);
  });
btnClearInstanceIcon.onclick = () => {
  selectedCreateIconPath = null;
  clearExistingIconOnSave = true;
  instanceIconHint.textContent = "Icon will be cleared on save.";
  setIconPreviewSource(null);
};
btnResetInstanceIconTransform.onclick = () => {
  resetSelectedIconTransform();
};
instanceIconScale.oninput = () => {
  selectedIconScalePct = Number(instanceIconScale.value || 100);
  renderIconTransformUi();
};
instanceIconOffsetX.oninput = () => {
  selectedIconOffsetXPct = Number(instanceIconOffsetX.value || 0);
  renderIconTransformUi();
};
instanceIconOffsetY.oninput = () => {
  selectedIconOffsetYPct = Number(instanceIconOffsetY.value || 0);
  renderIconTransformUi();
};
instanceIconPreviewFrame.onmousedown = (ev: MouseEvent) => {
  if (!selectedCreateIconPath || ev.button !== 0) return;
  iconPreviewDragging = true;
  iconPreviewDragStartX = ev.clientX;
  iconPreviewDragStartY = ev.clientY;
  iconPreviewDragOriginX = selectedIconOffsetXPct;
  iconPreviewDragOriginY = selectedIconOffsetYPct;
  const layout = getIconPreviewLayout();
  iconPreviewDragMaxShiftX = layout.maxShiftX;
  iconPreviewDragMaxShiftY = layout.maxShiftY;
  (instanceIconPreviewFrame as HTMLElement).style.cursor = "grabbing";
  ev.preventDefault();
};
window.addEventListener("mousemove", (ev) => {
  if (!iconPreviewDragging) return;
  const dx = ev.clientX - iconPreviewDragStartX;
  const dy = ev.clientY - iconPreviewDragStartY;
  const nextX =
    iconPreviewDragMaxShiftX > 0
      ? iconPreviewDragOriginX + (dx / iconPreviewDragMaxShiftX) * 100
      : iconPreviewDragOriginX;
  const nextY =
    iconPreviewDragMaxShiftY > 0
      ? iconPreviewDragOriginY + (dy / iconPreviewDragMaxShiftY) * 100
      : iconPreviewDragOriginY;
  selectedIconOffsetXPct = Math.max(-100, Math.min(100, Math.round(nextX)));
  selectedIconOffsetYPct = Math.max(-100, Math.min(100, Math.round(nextY)));
  renderIconTransformUi();
});
window.addEventListener("mouseup", () => {
  if (!iconPreviewDragging) return;
  iconPreviewDragging = false;
  (instanceIconPreviewFrame as HTMLElement).style.cursor = "grab";
});
instanceIconPreviewFrame.onwheel = (ev: WheelEvent) => {
  if (!selectedCreateIconPath) return;
  ev.preventDefault();
  const delta = ev.deltaY < 0 ? 4 : -4;
  selectedIconScalePct = Math.max(50, Math.min(250, selectedIconScalePct + delta));
  renderIconTransformUi();
};

btnCreate.onclick = async () => {
  modalMode = "create";
  editInstanceId = null;
  editServerId = null;
  modalTitle.textContent = "Create an instance";
  newName.value = "";
  newMem.value = String(getSettings().defaultMemoryMb ?? 4096);
  fillInstancePresetDropdown("none", "fabric");
  createIncludeReleases = true;
  createIncludeSnapshots = false;
  renderCreateFilterButtons();
  fillCreateVersionOptions();
  createLoaderType.value = "fabric";
  createLoaderVersion.value = "";
  updateCreateLoaderUi();
  setCreateSource("custom");
  selectedModrinthPack = null;
  selectedProviderPack = null;
  modalInstanceSyncEnabled = true;
  renderModalInstanceSyncToggle();
  selectedCreateIconPath = null;
  clearExistingIconOnSave = false;
  resetSelectedIconTransform();
  instanceIconHint.textContent = "No custom icon selected.";
  setIconPreviewSource(null);
  modrinthSearchInput.value = "";
  modrinthSearchResults.innerHTML = "";
  providerSearchInput.value = "";
  providerSearchResults.innerHTML = "";
  createSourceCustom.removeAttribute("disabled");
  createSourceImport.removeAttribute("disabled");
  createSourceModrinth.removeAttribute("disabled");
  createSourceCurseForge.removeAttribute("disabled");
  createSourceTechnic.removeAttribute("disabled");
  createSourceATLauncher.removeAttribute("disabled");
  createSourceFTB.removeAttribute("disabled");

  await fillInstanceAccountDropdown(null);
  await renderServerEntries(null);
  openModal();
};

btnImport.onclick = () =>
  guarded(async () => {
    const res = await window.api.instancesImport();
    if (!res.ok || res.canceled) return;
    state.instances = await window.api.instancesList();
    await renderInstances();
    appendLog(`[instance] Imported "${res.instance?.name ?? "instance"}"`);
    if (res.lockfileApplied) {
      appendLog(
        `[lockfile] Applied during import: ${res.lockfileResult?.appliedMods ?? 0} mods, ${res.lockfileResult?.appliedPacks ?? 0} packs.`
      );
      if (res.lockfileResult?.issues?.length) {
        appendLog(`[lockfile] Apply issues: ${res.lockfileResult.issues.join(" | ")}`);
      }
      if (res.lockfileResult?.drift && !res.lockfileResult.drift.clean) {
        appendLog(`[lockfile] Drift after import: ${res.lockfileResult.drift.issues.map((x) => `${x.id}: ${x.message}`).join(" | ")}`);
      }
    }
  });

modalClose.onclick = closeModal;
modalCancel.onclick = closeModal;

modalCreate.onclick = () =>
  guarded(async () => {
    if (modalMode === "create") {
      if (createSource === "import") {
        const res = await window.api.instancesImport();
        if (!res.ok || res.canceled) return;
        if (res.instance?.id && res.instance?.mcVersion && res.instance?.loader) {
          await ensureFabricApiForFabricInstance(res.instance.id, res.instance.mcVersion, res.instance.loader as LoaderKind);
        }
        if (selectedCreateIconPath && res.instance?.id) {
          try {
            await window.api.instancesSetIconFromFile(
              res.instance.id,
              selectedCreateIconPath,
              getSelectedIconTransformPayload()
            );
          } catch (err: any) {
            appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
          }
        }
        state.instances = await window.api.instancesList();
        await renderInstances();
        appendLog(`[instance] Imported "${res.instance?.name ?? "instance"}"`);
        closeModal();
        return;
      }

      if (
        createSource === "modrinth" ||
        createSource === "curseforge" ||
        createSource === "technic" ||
        createSource === "atlauncher" ||
        createSource === "ftb"
      ) {
        if (createSource !== "modrinth") {
          if (createSource === "atlauncher" || createSource === "ftb") {
            if (!selectedProviderPack?.id) {
              alert("Select a pack from search results first.");
              return;
            }
            setStatus(`Installing ${selectedProviderPack.name}...`);
            const installed = await window.api.providerPacksInstall(createSource, selectedProviderPack.id, {
              name: newName.value?.trim() || undefined,
              accountId: instanceAccount.value || null,
              memoryMb: Number(newMem.value || 6144)
            });
            if (installed?.instance?.id && installed.instance?.mcVersion && installed.instance?.loader) {
              await ensureFabricApiForFabricInstance(
                installed.instance.id,
                installed.instance.mcVersion,
                installed.instance.loader as LoaderKind
              );
            }
            if (installed?.instance?.id) {
              if (selectedCreateIconPath) {
                try {
                  await window.api.instancesSetIconFromFile(
                    installed.instance.id,
                    selectedCreateIconPath,
                    getSelectedIconTransformPayload()
                  );
                } catch (err: any) {
                  appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
                }
              } else if (selectedProviderPack?.iconUrl) {
                try {
                  await window.api.instancesSetIconFromUrl(installed.instance.id, selectedProviderPack.iconUrl);
                } catch {
                  await window.api.instancesSetIconFallback(installed.instance.id, selectedProviderPack.name || "Pack", "blue");
                }
              } else {
                await window.api.instancesSetIconFallback(installed.instance.id, selectedProviderPack.name || "Pack", "blue");
              }
            }
            setStatus("");
            state.instances = await window.api.instancesList();
            await renderInstances();
            appendLog(`[provider] Installed ${createSource} pack "${installed.instance?.name}" (${(installed.notes || []).join(" | ")})`);
            closeModal();
            return;
          } else {
            const res = await window.api.packArchiveImport({
              provider: createSource,
              defaults: {
                name: newName.value?.trim() || undefined,
                mcVersion: newVersion.value || undefined,
                accountId: instanceAccount.value || null,
                memoryMb: Number(newMem.value || 6144)
              }
            });
            if (!res.ok || res.canceled) return;
            if (res.result?.instance?.id && res.result.instance?.mcVersion && res.result.instance?.loader) {
              await ensureFabricApiForFabricInstance(
                res.result.instance.id,
                res.result.instance.mcVersion,
                res.result.instance.loader as LoaderKind
              );
            }
            if (selectedCreateIconPath && res.result?.instance?.id) {
              try {
                await window.api.instancesSetIconFromFile(
                  res.result.instance.id,
                  selectedCreateIconPath,
                  getSelectedIconTransformPayload()
                );
              } catch (err: any) {
                appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
              }
            } else if (selectedProviderPack?.iconUrl && res.result?.instance?.id) {
              try {
                await window.api.instancesSetIconFromUrl(res.result.instance.id, selectedProviderPack.iconUrl);
              } catch {
                await window.api.instancesSetIconFallback(res.result.instance.id, selectedProviderPack.name || "Pack", "blue");
              }
            } else if (res.result?.instance?.id) {
              await window.api.instancesSetIconFallback(res.result.instance.id, res.result.instance?.name || "Pack", "blue");
            }
            setStatus("");
            state.instances = await window.api.instancesList();
            await renderInstances();
            appendLog(
              `[pack-import] ${createSource} -> ${res.result.detectedFormat}: "${res.result.instance?.name}" (${(res.result.notes || []).join(" | ")})`
            );
            closeModal();
            return;
          }
        }
        if (!selectedModrinthPack) {
          alert("Select a Modrinth pack first.");
          return;
        }
        setStatus(`Installing ${selectedModrinthPack.title}...`);
        const res = await window.api.modrinthPacksInstall({
          projectId: selectedModrinthPack.projectId,
          versionId: selectedModrinthPack.latestVersionId || undefined,
          nameOverride: newName.value?.trim() || selectedModrinthPack.title,
          accountId: instanceAccount.value || null,
          memoryMb: Number(newMem.value || 6144)
        });
        if (res.instance?.id && res.instance?.mcVersion && res.instance?.loader) {
          await ensureFabricApiForFabricInstance(res.instance.id, res.instance.mcVersion, res.instance.loader as LoaderKind);
        }
        if (res.instance?.id) {
          if (selectedCreateIconPath) {
            try {
              await window.api.instancesSetIconFromFile(
                res.instance.id,
                selectedCreateIconPath,
                getSelectedIconTransformPayload()
              );
            } catch (err: any) {
              appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
            }
          } else if (selectedModrinthPack.iconUrl) {
            try {
              await window.api.instancesSetIconFromUrl(res.instance.id, selectedModrinthPack.iconUrl);
            } catch (err: any) {
              appendLog(`[icon] Failed downloading pack icon: ${String(err?.message ?? err)}`);
              await window.api.instancesSetIconFallback(res.instance.id, selectedModrinthPack.title, "blue");
            }
          } else {
            await window.api.instancesSetIconFallback(res.instance.id, selectedModrinthPack.title, "blue");
          }
        }
        setStatus("");
        state.instances = await window.api.instancesList();
        await renderInstances();
        appendLog(
          `[modrinth] Installed "${selectedModrinthPack.title}" as "${res.instance?.name}" (${res.version?.versionNumber ?? "latest"}).`
        );
        closeModal();
        return;
      }

      const id = crypto.randomUUID();
      const mcVersion = newVersion.value;
      const loader = String(createLoaderType.value || "fabric");
      const selectedPreset = (instancePreset.value || "none") as InstancePresetId;

      if (!mcVersion) {
        alert("Select a Minecraft version first.");
        return;
      }
      if (!["vanilla", "fabric", "quilt", "forge", "neoforge"].includes(loader)) {
        alert(`Unsupported loader: ${loader}`);
        return;
      }

      const cfg = {
        id,
        name: newName.value?.trim() || "New Instance",
        mcVersion,
        loader: loader as "vanilla" | "fabric" | "quilt" | "forge" | "neoforge",
        fabricLoaderVersion: undefined as string | undefined,
        quiltLoaderVersion: undefined as string | undefined,
        forgeVersion: undefined as string | undefined,
        neoforgeVersion: undefined as string | undefined,
        memoryMb: Number(newMem.value || 4096),
        accountId: instanceAccount.value || null,
        instancePreset: selectedPreset,
        syncEnabled: modalInstanceSyncEnabled
      };

      if (loader !== "vanilla") {
        setStatus(`Resolving ${loader} loader...`);
        const resolved = (createLoaderVersion.value || "").trim() || (await window.api.loaderPickVersion(loader as any, mcVersion)) || "";
        if (loader === "fabric") cfg.fabricLoaderVersion = resolved;
        if (loader === "quilt") cfg.quiltLoaderVersion = resolved;
        if (loader === "forge") cfg.forgeVersion = resolved;
        if (loader === "neoforge") cfg.neoforgeVersion = resolved;
      }

      setStatus("Creating instance...");
      await window.api.instancesCreate(cfg);

      if (selectedCreateIconPath) {
        try {
          await window.api.instancesSetIconFromFile(id, selectedCreateIconPath, getSelectedIconTransformPayload());
        } catch (err: any) {
          appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
        }
      } else {
        await window.api.instancesSetIconFallback(id, cfg.name || "Instance", "green");
      }

      setStatus(`Preparing ${loader}...`);
      await window.api.loaderInstall(
        id,
        mcVersion,
        loader as any,
        loader === "fabric"
          ? cfg.fabricLoaderVersion
          : loader === "quilt"
            ? cfg.quiltLoaderVersion
            : loader === "forge"
              ? cfg.forgeVersion
              : loader === "neoforge"
                ? cfg.neoforgeVersion
                : undefined
      );
      await ensureFabricApiForFabricInstance(id, mcVersion, loader as LoaderKind);

      if (selectedPreset !== "none") {
        await applyInstancePreset(id, mcVersion, loader as LoaderKind, selectedPreset);
      }

      setStatus("");
      state.instances = await window.api.instancesList();
      await renderInstances();
      closeModal();
      return;
    }

    if (modalMode === "edit" && editInstanceId) {
      const selectedPreset = (instancePreset.value || "none") as InstancePresetId;
      const inst = (state.instances?.instances ?? []).find((x: any) => x.id === editInstanceId) ?? null;
      const nextLoaderRaw = String(createLoaderType.value || inst?.loader || "fabric");
      if (!["vanilla", "fabric", "quilt", "forge", "neoforge"].includes(nextLoaderRaw)) {
        alert(`Unsupported loader: ${nextLoaderRaw}`);
        return;
      }
      const nextLoader = nextLoaderRaw as "vanilla" | "fabric" | "quilt" | "forge" | "neoforge";
      const nextVersion = newVersion.value || inst?.mcVersion;
      if (!nextVersion) {
        alert("Select a Minecraft version first.");
        return;
      }

      let nextFabricLoaderVersion: string | undefined = undefined;
      let nextQuiltLoaderVersion: string | undefined = undefined;
      let nextForgeVersion: string | undefined = undefined;
      let nextNeoForgeVersion: string | undefined = undefined;
      if (nextLoader !== "vanilla") {
        const resolved = (createLoaderVersion.value || "").trim() || (await window.api.loaderPickVersion(nextLoader as any, nextVersion)) || "";
        if (nextLoader === "fabric") nextFabricLoaderVersion = resolved;
        if (nextLoader === "quilt") nextQuiltLoaderVersion = resolved;
        if (nextLoader === "forge") nextForgeVersion = resolved;
        if (nextLoader === "neoforge") nextNeoForgeVersion = resolved;
      }

      await window.api.instancesUpdate(editInstanceId, {
        name: newName.value?.trim() || "Instance",
        mcVersion: nextVersion,
        loader: nextLoader,
        fabricLoaderVersion: nextFabricLoaderVersion,
        quiltLoaderVersion: nextQuiltLoaderVersion,
        forgeVersion: nextForgeVersion,
        neoforgeVersion: nextNeoForgeVersion,
        memoryMb: Number(newMem.value || 4096),
        accountId: instanceAccount.value || null,
        instancePreset: selectedPreset,
        syncEnabled: modalInstanceSyncEnabled
      });

      if (selectedCreateIconPath) {
        try {
          await window.api.instancesSetIconFromFile(
            editInstanceId,
            selectedCreateIconPath,
            getSelectedIconTransformPayload()
          );
        } catch (err: any) {
          appendLog(`[icon] Failed applying selected icon: ${String(err?.message ?? err)}`);
        }
      } else if (clearExistingIconOnSave) {
        await window.api.instancesClearIcon(editInstanceId);
      }

      setStatus(`Preparing ${nextLoader}...`);
      await window.api.loaderInstall(
        editInstanceId,
        nextVersion,
        nextLoader as any,
        nextLoader === "fabric"
          ? nextFabricLoaderVersion
          : nextLoader === "quilt"
            ? nextQuiltLoaderVersion
            : nextLoader === "forge"
              ? nextForgeVersion
              : nextLoader === "neoforge"
                ? nextNeoForgeVersion
                : undefined
      );
      await ensureFabricApiForFabricInstance(editInstanceId, nextVersion, nextLoader as LoaderKind);

      if (inst && selectedPreset !== "none") {
        await applyInstancePreset(editInstanceId, nextVersion, nextLoader as LoaderKind, selectedPreset);
      }
      setStatus("");
      state.instances = await window.api.instancesList();
      await renderInstances();
      closeModal();
    }
  });

btnPlayActive.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    if (!active) return;

    const inst = (state.instances?.instances ?? []).find((x: any) => x.id === active) ?? null;
    if (!inst) return;
    await launchForInstance(inst);
  });

btnJoinPreferred.onclick = () =>
  guarded(async () => {
    const target = await findPreferredServerTarget();
    if (!target) {
      alert("No preferred server configured on any instance yet.");
      return;
    }

    if (state.instances?.activeInstanceId !== target.instance.id) {
      await window.api.instancesSetActive(target.instance.id);
      state.instances = await window.api.instancesList();
      await renderInstances();
    }

    await launchForInstance(target.instance, String(target.server.address || "").trim());
  });

btnStopActive.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    if (!active) return;
    await window.api.launchStop(active);
  });

btnClearLogs.onclick = () => {
  logsEl.textContent = "";
  launchLogBuffer = [];
  renderLaunchDiagnosis(null);
  setStatus("");
};
btnToggleDebugLogs.onclick = () => {
  debugLogsVisible = !debugLogsVisible;
  renderDebugLogsVisibility();
};
btnAnalyzeLogs.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    await runLaunchDiagnosis(active);
  });

btnApplyDiagnosisFix.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    if (!active || !latestDiagnosis?.fixAction || latestDiagnosis.fixAction === "none") return;
    const result = await window.api.launchApplyFix(active, latestDiagnosis.fixAction);
    appendLog(`[diagnostics] ${result.message}`);
    await runLaunchDiagnosis(active);
  });

btnToggleDiagnosisDetails.onclick = () => {
  diagnosisDetailsOpen = !diagnosisDetailsOpen;
  if (!latestDiagnosis) {
    launchDiagnosisDetails.style.display = "none";
    return;
  }
  renderLaunchDiagnosis(latestDiagnosis);
};

btnCopyDiagnosisReport.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    const diag = latestDiagnosis;
    const lines = launchLogBuffer.slice(-120);
    const report = [
      "# Fishbattery Diagnostic Report",
      `Generated: ${new Date().toISOString()}`,
      `Instance: ${String(active || "none")}`,
      `Diagnosis code: ${String(diag?.code || "none")}`,
      `Severity: ${String(diag?.severity || "unknown")}`,
      `Summary: ${String(diag?.summary || "No diagnosis available")}`,
      `Fix action: ${String(diag?.fixAction || "none")}`,
      "",
      "## Details",
      ...((diag?.details || []).map((x: string) => `- ${x}`) || []),
      "",
      "## Recommended Actions",
      ...((diag?.recommendedActions || []).map((x: string) => `- ${x}`) || []),
      "",
      "## Recent Logs",
      "```text",
      ...lines,
      "```"
    ].join("\n");

    const safe = redactSensitive(report);
    try {
      await navigator.clipboard.writeText(safe);
      appendLog("[diagnostics] Copied redacted diagnostic report to clipboard.");
    } catch (err: any) {
      appendLog(`[diagnostics] Copy failed: ${String(err?.message ?? err)}`);
    }
  });

btnOptimizeInstance.onclick = () => guarded(async () => optimizeActiveModalInstance());
btnRestoreOptimization.onclick = () => guarded(async () => restoreActiveModalOptimization());
btnRunBenchmark.onclick = () => guarded(async () => runActiveModalBenchmark());
btnSaveServerEntry.onclick = () =>
  guarded(async () => {
    if (!editInstanceId || modalMode !== "edit") {
      alert("Save the instance first, then add servers.");
      return;
    }

    const name = serverNameInput.value.trim();
    const address = serverAddressInput.value.trim();
    if (!name || !address) {
      alert("Server name and address are required.");
      return;
    }

    await window.api.serversUpsert(editInstanceId, {
      id: editServerId ?? undefined,
      name,
      address
    });

    editServerId = null;
    serverNameInput.value = "";
    serverAddressInput.value = "";
    await renderServerEntries(editInstanceId);
  });

btnExportServerProfile.onclick = () =>
  guarded(async () => {
    if (!editInstanceId || modalMode !== "edit") {
      alert("Open an existing instance first.");
      return;
    }
    const data = await window.api.serversList(editInstanceId);
    const selected = data.servers.find((x: any) => x.id === data.preferredServerId) ?? data.servers[0];
    if (!selected) {
      alert("Add at least one server first.");
      return;
    }

    const res = await window.api.serversExportProfile(editInstanceId, selected.id);
    if (!res.ok || res.canceled) return;
    appendLog(`[server-profile] Exported ${selected.name}: ${res.path}`);
  });

btnImportServerProfile.onclick = () =>
  guarded(async () => {
    if (!editInstanceId || modalMode !== "edit") {
      alert("Open an existing instance first.");
      return;
    }
    const res = await window.api.serversImportProfile(editInstanceId);
    if (!res.ok || res.canceled) return;
    state.instances = await window.api.instancesList();
    await renderInstances();
    await renderServerEntries(editInstanceId);
    appendLog(`[server-profile] Imported profile for ${res.result?.server?.name ?? "server"}.`);
    if (res.result?.lockfile) {
      appendLog(
        `[lockfile] Applied from server profile: ${res.result.lockfile.appliedMods} mods, ${res.result.lockfile.appliedPacks} packs.`
      );
      if (res.result.lockfile.issues?.length) {
        appendLog(`[lockfile] Server profile lock issues: ${res.result.lockfile.issues.join(" | ")}`);
      }
    }
  });

modalUpdateMods.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    const inst = (state.instances?.instances ?? []).find((x: any) => x.id === editInstanceId) ?? null;
    if (!inst) return;
    let bridgeUpdated = false;
    try {
      const bridgeRes = await window.api.modsSyncBridge(inst.id, inst.mcVersion);
      bridgeUpdated = !!bridgeRes?.installed;
      if (bridgeUpdated) {
        appendLog(`[mods] Updated cape bridge to latest (${bridgeRes.assetName ?? "bridge asset"}).`);
      }
    } catch (err: any) {
      appendLog(`[mods] Cape bridge sync skipped: ${String(err?.message ?? err)}`);
    }
    setStatus("Analyzing mod updates...");
    const plan = await window.api.modsPlanRefresh(inst.id, inst.mcVersion);
    if (!plan?.updates?.length) {
      setStatus("");
      if (bridgeUpdated) {
        appendLog("[mods] Smart update: bridge updated; no catalog mod updates found.");
        await renderInstanceMods(inst.id);
        const v = await window.api.modsValidate(inst.id);
        renderCompatibilityState(v);
        alert("Cape bridge updated to latest. No other mod updates available.");
        return;
      }
      appendLog("[mods] Smart update: no compatible updates found.");
      if (plan?.blocked?.length) {
        alert(`No applicable updates.\nBlocked mods: ${plan.blocked.map((x: any) => x.id).join(", ")}`);
      } else {
        alert("No mod updates available.");
      }
      return;
    }

    const summary = buildModUpdateSummary(plan);
    const choiceRaw = prompt(
      `${summary}\n\nChoose action:\n- all\n- individual\n- skip`,
      "all"
    );
    const choice = String(choiceRaw || "skip").trim().toLowerCase();
    if (choice === "skip") {
      setStatus("");
      appendLog("[mods] Smart update skipped by user.");
      return;
    }

    let selectedIds: string[] = [];
    if (choice === "individual") {
      const suggested = plan.updates.map((u: any) => u.id).slice(0, 5).join(",");
      const rawIds = prompt("Enter mod IDs to update (comma-separated).", suggested);
      selectedIds = String(rawIds || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const valid = new Set(plan.updates.map((u: any) => String(u.id)));
      selectedIds = selectedIds.filter((x) => valid.has(x));
      if (!selectedIds.length) {
        setStatus("");
        alert("No valid mod IDs selected.");
        return;
      }
    }

    setStatus("Applying mod updates...");
    try {
      await window.api.rollbackCreateSnapshot(inst.id, "mods-refresh", "Before manual mods refresh");
    } catch (err: any) {
      appendLog(`[rollback] Snapshot skipped: ${String(err?.message ?? err)}`);
    }
    try {
      if (choice === "individual") {
        await window.api.modsRefreshSelected(inst.id, inst.mcVersion, selectedIds);
        appendLog(`[mods] Updated selected mods: ${selectedIds.join(", ")}`);
      } else {
        await window.api.modsRefresh(inst.id, inst.mcVersion);
        appendLog("[mods] Updated all eligible mods.");
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const doRollback = confirm(`Mod update failed:\n${msg}\n\nRestore latest snapshot now?`);
      if (doRollback) {
        await window.api.rollbackRestoreLatest(inst.id);
        appendLog("[rollback] Restored latest snapshot after update failure.");
      }
      throw err;
    }
    await renderInstanceMods(inst.id);
    await renderLocalContent(inst.id);
    const v = await window.api.modsValidate(inst.id);
    appendLog(`[validation] After refresh: ${v.summary} (${v.issues.length} issues)`);
    if (v.summary === "critical") {
      const dup = v.issues.filter((x: any) => x.code === "duplicate-mod-id").length;
      if (dup > 0) {
        const fix = confirm(`Detected ${dup} duplicate mod conflict(s). Auto-fix duplicates now?`);
        if (fix) {
          const r = await window.api.modsFixDuplicates(inst.id);
          appendLog(`[validation] Removed duplicates: ${r.removed.join(", ") || "none"}`);
        }
      }
    }
    setStatus("");
  });

modalUpdatePacks.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    const inst = (state.instances?.instances ?? []).find((x: any) => x.id === editInstanceId) ?? null;
    if (!inst) return;
    setStatus("Resolving packs...");
    try {
      await window.api.rollbackCreateSnapshot(inst.id, "packs-refresh", "Before manual packs refresh");
    } catch (err: any) {
      appendLog(`[rollback] Snapshot skipped: ${String(err?.message ?? err)}`);
    }
    await window.api.packsRefresh(inst.id, inst.mcVersion);
    await renderRecommendedPacks(inst.id);
    await renderLocalContent(inst.id);
    setStatus("");
  });

modalUploadLocalMod.onclick = () => guarded(async () => pickAndAdd("mods"));

modalOpenInstanceFolder.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    await window.api.instancesOpenFolder(editInstanceId);
  });

btnUploadResourcepack.onclick = () => guarded(async () => pickAndAdd("resourcepacks"));
btnUploadShaderpack.onclick = () => guarded(async () => pickAndAdd("shaderpacks"));

btnOpenInstanceFolder2.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    await window.api.instancesOpenFolder(editInstanceId);
  });

btnOpenInstanceFolder3.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    await window.api.instancesOpenFolder(editInstanceId);
  });

window.api.onLaunchLog((line) => {
  appendLog(line);
  const active = state.instances?.activeInstanceId ?? null;
  const lower = String(line || "").toLowerCase();
  if (
    active &&
    (lower.includes("launch failed") ||
      lower.includes("modresolutionexception") ||
      lower.includes("duplicate") ||
      lower.includes("unsupportedclassversionerror"))
  ) {
    void runLaunchDiagnosis(active);
  }
});
window.api.onUpdaterEvent((evt) => {
  updaterState = evt;
  if (settingsTabInstall.classList.contains("active")) {
    renderSettingsPanels();
  }
  const msg = String(evt?.message ?? "");
  const isDevNoopMsg =
    msg === "Update checks are disabled in development builds." ||
    msg === "Update downloads are disabled in development builds.";
  if (msg && !isDevNoopMsg) appendLog(`[updater] ${msg}`);

  if (evt?.status === "update-available") {
    const v = String(evt.latestVersion ?? "");
    if (v && promptedUpdateVersion !== v) {
      promptedUpdateVersion = v;
      const yes = confirm(`Update v${v} is available. Download now?`);
      if (yes) {
        void window.api.updaterDownload();
      }
    }
  }

  if (evt?.status === "downloaded") {
    const v = String(evt.latestVersion ?? "");
    if (v && promptedInstallVersion !== v) {
      promptedInstallVersion = v;
      const yes = confirm(`Update v${v} downloaded. Restart now to install?`);
      if (yes) {
        void window.api.updaterInstall();
      }
    }
  }
});

// Close account dropdown when clicking outside
document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (!t) return;
  if (!accountDropdown.classList.contains("open")) return;
  if (accountDropdown.contains(t)) return;
  if (accountBtn.contains(t)) return;
  accountDropdown.classList.remove("open");
});

winBtnMin.onclick = () => {
  void window.api.windowMinimize();
};

let topbarDragActive = false;
let topbarDragPointerId: number | null = null;
let topbarDragAnchorRatio = 0.5;
let topbarDragNeedsRestore = false;
let topbarDragMoveQueued: { cursorX: number; cursorY: number } | null = null;
let topbarDragMoveInFlight = false;

function queueTopbarDragMove(cursorX: number, cursorY: number) {
  topbarDragMoveQueued = { cursorX, cursorY };
  if (topbarDragMoveInFlight) return;
  topbarDragMoveInFlight = true;

  void (async () => {
    while (topbarDragMoveQueued && topbarDragActive) {
      const next = topbarDragMoveQueued;
      topbarDragMoveQueued = null;
      if (!next) break;

      if (topbarDragNeedsRestore) {
        const restored = await window.api.windowDragRestore(next.cursorX, next.cursorY, topbarDragAnchorRatio);
        if (restored) {
          topbarDragNeedsRestore = false;
          await syncWindowMaxButtonState();
          continue;
        }
      }

      await window.api.windowDragMove(next.cursorX, next.cursorY, topbarDragAnchorRatio);
    }
    topbarDragMoveInFlight = false;
  })();
}

async function stopTopbarDrag(cursorY?: number) {
  if (!topbarDragActive) return;
  topbarDragActive = false;
  topbarDragMoveQueued = null;

  if (cursorY != null) {
    await window.api.windowDragEnd(cursorY);
  }
  await syncWindowMaxButtonState();
}

async function syncWindowMaxButtonState() {
  const maximized = await window.api.windowIsMaximized();
  winBtnMax.classList.toggle("is-maximized", !!maximized);
}

winBtnMax.onclick = async () => {
  await window.api.windowToggleMaximize();
  await syncWindowMaxButtonState();
};

winBtnClose.onclick = () => {
  void window.api.windowClose();
};

windowTopbar.addEventListener("dblclick", (ev) => {
  const t = ev.target as HTMLElement | null;
  if (t?.closest(".windowTopbarBtn")) return;
  void (async () => {
    await window.api.windowToggleMaximize();
    await syncWindowMaxButtonState();
  })();
});

windowTopbar.addEventListener("pointerdown", (ev) => {
  if (ev.button !== 0) return;
  const t = ev.target as HTMLElement | null;
  if (t?.closest(".windowTopbarBtn")) return;

  const rect = windowTopbar.getBoundingClientRect();
  if (rect.width <= 0) return;

  topbarDragActive = true;
  topbarDragPointerId = ev.pointerId;
  topbarDragNeedsRestore = winBtnMax.classList.contains("is-maximized");
  topbarDragAnchorRatio = Math.max(0.05, Math.min(0.95, (ev.clientX - rect.left) / rect.width));
  topbarDragMoveQueued = null;
  if (windowTopbar.setPointerCapture) {
    windowTopbar.setPointerCapture(ev.pointerId);
  }
  ev.preventDefault();
});

windowTopbar.addEventListener("pointermove", (ev) => {
  if (!topbarDragActive) return;
  if (topbarDragPointerId != null && ev.pointerId !== topbarDragPointerId) return;
  queueTopbarDragMove(ev.clientX, ev.clientY);
});

windowTopbar.addEventListener("pointerup", (ev) => {
  if (!topbarDragActive) return;
  if (topbarDragPointerId != null && ev.pointerId !== topbarDragPointerId) return;
  if (windowTopbar.releasePointerCapture && topbarDragPointerId != null) {
    try {
      windowTopbar.releasePointerCapture(topbarDragPointerId);
    } catch {
      // no-op
    }
  }
  topbarDragPointerId = null;
  void stopTopbarDrag(ev.clientY);
});

windowTopbar.addEventListener("pointercancel", () => {
  if (!topbarDragActive) return;
  topbarDragPointerId = null;
  void stopTopbarDrag();
});

window.addEventListener("blur", () => {
  if (!topbarDragActive) return;
  topbarDragPointerId = null;
  void stopTopbarDrag();
});

window.addEventListener("resize", () => {
  void syncWindowMaxButtonState();
});
window.addEventListener("focus", () => {
  void syncWindowMaxButtonState();
});
void syncWindowMaxButtonState();

// Initial
applySettingsToDom(getSettings());
setSettingsTab("general");
renderModalInstanceSyncToggle();
renderIconTransformUi();
setIconPreviewSource(null);
renderDebugLogsVisibility();
refreshAll();
ensureRunningStatusPoll();

if (window.matchMedia) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const rerenderThemeFromSystem = () => {
    const s = getSettings();
    if (s.theme === "system-default" || s.theme === "time-of-day") {
      applySettingsToDom(s);
    }
  };
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", rerenderThemeFromSystem);
  } else if (typeof media.addListener === "function") {
    media.addListener(rerenderThemeFromSystem);
  }
}



