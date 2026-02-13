// FishbatteryLauncher
// Copyright (C) 2026 Gudmundur Magnus Johannsson
// Licensed under GPL v3

import "./index.css";
import { CATALOG } from "../main/modrinthCatalog";
import { PACK_CATALOG } from "../main/modrinthPackCatalog";

// Small DOM helper (keeps your current style)
const $ = (id: string) => document.getElementById(id) as HTMLElement;

// --- Core UI refs (IDs must match index.html) ---
const logsEl = $("logs") as HTMLPreElement;
const statusText = $("statusText");

const instancesGrid = $("instancesGrid") as HTMLDivElement;
const searchInstances = $("searchInstances") as HTMLInputElement;

const navLibrary = $("navLibrary");
const navSettings = $("navSettings");

const viewLibrary = $("viewLibrary");
const viewSettings = $("viewSettings");

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
const btnCopyDiagnosisReport = $("btnCopyDiagnosisReport") as HTMLButtonElement;
const launchDiagnosis = $("launchDiagnosis");
const launchDiagnosisDetails = $("launchDiagnosisDetails");

// Settings nav + panels
const settingsTabGeneral = $("settingsTabGeneral");
const settingsTabInstall = $("settingsTabInstall");
const settingsTabWindow = $("settingsTabWindow");
const settingsTabJava = $("settingsTabJava");
const settingsTabHooks = $("settingsTabHooks");

const settingsPanelGeneral = $("settingsPanelGeneral");
const settingsPanelInstall = $("settingsPanelInstall");
const settingsPanelWindow = $("settingsPanelWindow");
const settingsPanelJava = $("settingsPanelJava");
const settingsPanelHooks = $("settingsPanelHooks");

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
  instances: null
};

let busy = false;
let modalMode: "create" | "edit" = "create";
let editInstanceId: string | null = null;
let editServerId: string | null = null;
let launchLogBuffer: string[] = [];
let latestDiagnosis: any = null;
let diagnosisDetailsOpen = false;

type UpdaterUiState = {
  status: "idle" | "checking" | "update-available" | "up-to-date" | "downloading" | "downloaded" | "error";
  currentVersion: string;
  latestVersion?: string;
  progressPercent?: number;
  message?: string;
  updatedAt: number;
};

let updaterState: UpdaterUiState = {
  status: "idle",
  currentVersion: "unknown",
  message: "Updates not checked yet.",
  updatedAt: Date.now()
};
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

type AppSettings = {
  theme: "ocean" | "dark" | "oled";
  blur: boolean; // maps to :root[data-glass="1"]
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
};

const SETTINGS_KEY = "fishbattery.settings";

const defaultSettings: AppSettings = {
  theme: "ocean",
  blur: true,
  updateChannel: "stable",
  showSnapshots: false,
  autoUpdateMods: true,
  defaultMemoryMb: 4096,
  fullscreen: false,
  winW: 854,
  winH: 480,
  jvmArgs: "",
  preLaunch: "",
  postExit: ""
};

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
    return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}) };
  } catch {
    return { ...defaultSettings };
  }
}

function setSettings(patch: Partial<AppSettings>) {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applySettingsToDom(next);
}

function applySettingsToDom(s: AppSettings) {
  // Your CSS expects these
  document.documentElement.dataset.theme = s.theme;
  document.documentElement.dataset.glass = s.blur ? "1" : "0";
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
}

function setStatus(text: string) {
  statusText.textContent = text || "";
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
  try {
    await fn();
  } finally {
    busy = false;
  }
}

function setView(which: "library" | "settings") {
  viewLibrary.style.display = which === "library" ? "" : "none";
  viewSettings.style.display = which === "settings" ? "" : "none";
  navLibrary.classList.toggle("active", which === "library");
  navSettings.classList.toggle("active", which === "settings");
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
    sub.textContent = formatBytes(it.size) + (it.name.endsWith(".disabled") ? " • Disabled" : "");

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

  input.onchange = () => onChange(input.checked);

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

  // General
  clearPanel(settingsPanelGeneral);
  settingsPanelGeneral.appendChild(makeH3("General"));

  {
    const { row } = makeRow("Theme", "Changes the overall look (CSS themes).");
    const sel = makeSelect(
      [
        { value: "ocean", label: "Ocean" },
        { value: "dark", label: "Dark" },
        { value: "oled", label: "OLED" }
      ],
      s.theme,
      (v) => setSettings({ theme: v as AppSettings["theme"] })
    );
    row.appendChild(sel);
    settingsPanelGeneral.appendChild(row);
  }

  {
    const { row } = makeRow("Glass blur", "Enable/disable blur on panels (performance vs style).");
    const sw = makeSwitch(s.blur, (v) => setSettings({ blur: v }));
    row.appendChild(sw);
    settingsPanelGeneral.appendChild(row);
  }

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
    status.textContent = updaterStatusText(updaterState);
    settingsPanelInstall.appendChild(status);

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
    const { row } = makeRow("Window size (W×H)", "Stored locally; apply in main process if desired.");
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
}

function setSettingsTab(tab: "general" | "install" | "window" | "java" | "hooks") {
  const btns: Record<string, HTMLElement> = {
    general: settingsTabGeneral,
    install: settingsTabInstall,
    window: settingsTabWindow,
    java: settingsTabJava,
    hooks: settingsTabHooks
  };

  const panels: Record<string, HTMLElement> = {
    general: settingsPanelGeneral,
    install: settingsPanelInstall,
    window: settingsPanelWindow,
    java: settingsPanelJava,
    hooks: settingsPanelHooks
  };

  for (const k of Object.keys(btns)) btns[k].classList.toggle("active", k === tab);
  for (const k of Object.keys(panels)) panels[k].style.display = k === tab ? "" : "none";

  renderSettingsPanels();
}

settingsTabGeneral.onclick = () => setSettingsTab("general");
settingsTabInstall.onclick = () => setSettingsTab("install");
settingsTabWindow.onclick = () => setSettingsTab("window");
settingsTabJava.onclick = () => setSettingsTab("java");
settingsTabHooks.onclick = () => setSettingsTab("hooks");

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
  if (validation.summary === "critical") {
    const detail = validation.issues
      .slice(0, 8)
      .map((x) => `- ${x.title}`)
      .join("\n");
    const launchAnyway = confirm(
      `Critical mod conflicts detected:\n${detail}\n\nUse "Update Mods" or fix duplicates first.\nLaunch anyway?`
    );
    if (!launchAnyway) return;
  } else if (validation.summary === "warnings") {
    appendLog("[validation] Warnings detected. Open Mods tab for details.");
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
    sub.textContent = statusBits.join(" • ");

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
  const valCard = document.createElement("div");
  valCard.className = "setRow";
  valCard.style.marginBottom = "8px";

  const valLeft = document.createElement("div");
  valLeft.style.display = "flex";
  valLeft.style.flexDirection = "column";

  const valTitle = document.createElement("div");
  valTitle.className = "setLabel";
  valTitle.textContent =
    validation.summary === "no-issues"
      ? "Validation: no issues"
      : validation.summary === "warnings"
        ? "Validation: warnings"
        : "Validation: critical conflicts";

  const valSub = document.createElement("div");
  valSub.className = "setHelp";
  valSub.textContent = validation.issues.slice(0, 3).map((x) => x.title).join(" • ") || "All clear.";
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

  if ((validation.issues ?? []).length) {
    for (const issue of validation.issues) {
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
    sub.textContent = bits.join(" • ");

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

  if (!accounts.length) {
    accountName.textContent = "Not signed in";
    accountSub.textContent = "Add an account";
    accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = fallbackAvatarDataUrl("?");
  } else {
    const active = accounts.find((a: any) => a.id === activeId) ?? accounts[0];
    accountName.textContent = getAccountLabel(active);
    accountSub.textContent = active?.type ?? active?.provider ?? "Microsoft";
    accountAvatarImg.classList.remove("loaded");
    accountAvatarImg.onload = () => accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = avatarById.get(active.id) || fallbackAvatarDataUrl(getAccountLabel(active));
  }
  accountAvatarImg.onerror = () => {
    accountAvatarImg.classList.add("loaded");
    accountAvatarImg.src = fallbackAvatarDataUrl(accountName.textContent || "?");
  };

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

async function renderInstances() {
  const items = filteredInstances();
  const active = state.instances?.activeInstanceId ?? null;
  instancesGrid.innerHTML = "";
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

    meta.appendChild(title);
    meta.appendChild(badges);

    const actions = document.createElement("div");
    actions.className = "cardActions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn";
    btnEdit.textContent = "Edit";
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

    const btnUse = document.createElement("button");
    btnUse.className = "btn btnPrimary";
    btnUse.textContent = i.id === active ? "Selected" : "Select";
    btnUse.onclick = async () => {
      await window.api.instancesSetActive(i.id);
      state.instances = await window.api.instancesList();
      await renderInstances();
    };

    // ✅ Delete button
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
    btnJoin.textContent = "Join";
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

    actions.appendChild(btnEdit);
    actions.appendChild(btnJoin);
    actions.appendChild(btnExport);
    actions.appendChild(btnDelete);
    actions.appendChild(btnUse);

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
    meta.textContent = `MC ${mc} • ${loader}`;
    left.appendChild(meta);

    row.appendChild(left);

    const btn = document.createElement("button");
    btn.className = "btn";
    const selected = selectedModrinthPack?.projectId === h.projectId;
    btn.textContent = selected ? "Selected" : "Select";
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
    meta.textContent = `MC ${h.mcVersion} • ${h.loader}`;
    left.appendChild(meta);

    if (Array.isArray(h.tags) && h.tags.length) {
      const tags = document.createElement("div");
      tags.className = "setHelp";
      tags.textContent = `Tags: ${h.tags.slice(0, 4).join(" • ")}`;
      left.appendChild(tags);
    }

    row.appendChild(left);

    const btn = document.createElement("button");
    btn.className = "btn";
    const selected = selectedProviderPack?.id === h.id;
    btn.textContent = selected ? "Selected" : "Select";
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
  setStatus("Loading…");

  const manifest = await window.api.versionsList();
  state.versions = manifest?.versions ?? [];

  const s = getSettings();
  await window.api.updaterSetChannel(s.updateChannel);
  state.accounts = await window.api.accountsList();
  state.instances = await window.api.instancesList();
  updaterState = await window.api.updaterGetState();
  preflightState = await window.api.preflightGetLast();

  await renderAccounts();
  await renderInstances();
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
}

// ---------------- Event wiring ----------------
navLibrary.onclick = () => setView("library");
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
        instancePreset: selectedPreset
      };

      if (loader !== "vanilla") {
        setStatus(`Resolving ${loader} loader…`);
        const resolved = (createLoaderVersion.value || "").trim() || (await window.api.loaderPickVersion(loader as any, mcVersion)) || "";
        if (loader === "fabric") cfg.fabricLoaderVersion = resolved;
        if (loader === "quilt") cfg.quiltLoaderVersion = resolved;
        if (loader === "forge") cfg.forgeVersion = resolved;
        if (loader === "neoforge") cfg.neoforgeVersion = resolved;
      }

      setStatus("Creating instance…");
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

      setStatus(`Preparing ${loader}…`);
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
        instancePreset: selectedPreset
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

      setStatus(`Preparing ${nextLoader}…`);
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
    setStatus("Analyzing mod updates...");
    const plan = await window.api.modsPlanRefresh(inst.id, inst.mcVersion);
    if (!plan?.updates?.length) {
      setStatus("");
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
    setStatus("Resolving packs…");
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

// Initial
applySettingsToDom(getSettings());
setSettingsTab("general");
renderIconTransformUi();
setIconPreviewSource(null);
refreshAll();
