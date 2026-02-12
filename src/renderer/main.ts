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

// ---------------- Settings ----------------
type InstancePresetId = "none" | "max-fps" | "shader-friendly" | "distant-horizons-worldgen";

type InstancePreset = {
  id: Exclude<InstancePresetId, "none">;
  name: string;
  description: string;
  memoryMb: number;
  enableMods: string[];
  enablePacks: string[];
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
      "dynamic-fps"
    ],
    enablePacks: ["fast-better-grass", "better-leaves"]
  },
  "shader-friendly": {
    id: "shader-friendly",
    name: "Shader Friendly",
    description: "Keeps shader compatibility/performance balance and enables a curated shader stack.",
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
      "dynamic-fps"
    ],
    enablePacks: ["complementary-reimagined", "dramatic-skys", "xalis-enchanted-books", "fresh-animations"]
  },
  "distant-horizons-worldgen": {
    id: "distant-horizons-worldgen",
    name: "Distant Horizons Worldgen Mode",
    description: "Optimized for long-distance terrain generation and traversal-heavy worlds.",
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
      "distanthorizons"
    ],
    enablePacks: ["fast-better-grass", "better-leaves"]
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

function fillInstancePresetDropdown(selectedId: string | null) {
  instancePreset.innerHTML = "";

  const none = document.createElement("option");
  none.value = "none";
  none.textContent = "None (Custom)";
  instancePreset.appendChild(none);

  for (const id of Object.keys(INSTANCE_PRESETS) as Array<Exclude<InstancePresetId, "none">>) {
    const p = INSTANCE_PRESETS[id];
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = p.name;
    instancePreset.appendChild(opt);
  }

  const safe = allInstancePresetIds().includes((selectedId ?? "none") as InstancePresetId)
    ? (selectedId ?? "none")
    : "none";
  instancePreset.value = safe;
}

async function applyInstancePreset(instanceId: string, mcVersion: string, presetId: InstancePresetId) {
  if (presetId === "none") return;
  const preset = INSTANCE_PRESETS[presetId];
  if (!preset) return;

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

    for (const mod of CATALOG) {
      const shouldEnable = !!mod.required || preset.enableMods.includes(mod.id);
      try {
        await window.api.modsSetEnabled(instanceId, mod.id, shouldEnable);
      } catch (err: any) {
        appendLog(`[preset] Failed toggling mod ${mod.id}: ${String(err?.message ?? err)}`);
      }
    }

    for (const pack of PACK_CATALOG) {
      const shouldEnable = !!pack.required || preset.enablePacks.includes(pack.id);
      try {
        await window.api.packsSetEnabled(instanceId, pack.id, shouldEnable);
      } catch (err: any) {
        appendLog(`[preset] Failed toggling pack ${pack.id}: ${String(err?.message ?? err)}`);
      }
    }

    await window.api.instancesUpdate(instanceId, { memoryMb: preset.memoryMb, instancePreset: presetId });

    // Resolve and install only enabled entries.
    await window.api.modsRefresh(instanceId, mcVersion);
    await window.api.packsRefresh(instanceId, mcVersion);

    const afterMods = await window.api.modsList(instanceId);
    const afterPacks = await window.api.packsList(instanceId);

    for (const mod of afterMods?.mods ?? []) {
      const shouldEnable = !!mod.required || preset.enableMods.includes(mod.id);
      if (shouldEnable && mod.status !== "ok") {
        appendLog(`[preset] Mod unavailable for ${mcVersion}: ${mod.name ?? mod.id} (${mod.status})`);
      }
    }
    for (const pack of afterPacks?.items ?? []) {
      const shouldEnable = !!pack.required || preset.enablePacks.includes(pack.id);
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

async function renderCompatibilityGuidance(instanceId: string | null) {
  modalCompatGuidance.innerHTML = "";
  if (!instanceId) return;

  const inst = (state.instances?.instances ?? []).find((x: any) => x.id === instanceId) ?? null;
  if (!inst) return;

  const res = await window.api.modsList(instanceId);
  const mods = res?.mods ?? [];
  const byId = new Map<string, any>(mods.map((m: any) => [m.id, m]));

  const heading = document.createElement("div");
  heading.className = "muted";
  heading.style.fontSize = "12px";
  heading.style.marginBottom = "8px";
  heading.textContent = `Compatibility assistant (${inst.loader}, ${inst.mcVersion})`;
  modalCompatGuidance.appendChild(heading);

  const validation = await window.api.modsValidate(instanceId);
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
        issue.code === "missing-dependency" ||
        issue.code === "incompatible-minecraft" ||
        issue.code === "loader-mismatch"
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
    const needed = preset.enableMods.filter((m) => byId.has(m));
    const missing = needed.filter((m) => byId.get(m)?.status !== "ok");

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
      missing.length === 0
        ? "Ready for this version."
        : `Missing compatibility: ${missing.join(", ")}`;

    left.appendChild(title);
    left.appendChild(sub);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Apply combo";
    btn.onclick = () =>
      guarded(async () => {
        await applyInstancePreset(instanceId, inst.mcVersion, id);
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

async function renderAccounts() {
  const accounts = state.accounts?.accounts ?? [];
  const activeId = state.accounts?.activeAccountId ?? null;

  accountItems.innerHTML = "";

  if (!accounts.length) {
    accountName.textContent = "Not signed in";
    accountSub.textContent = "Add an account";
    accountAvatarImg.src = "";
  } else {
    const active = accounts.find((a: any) => a.id === activeId) ?? accounts[0];
    accountName.textContent = getAccountLabel(active);
    accountSub.textContent = active?.type ?? active?.provider ?? "Microsoft";
    accountAvatarImg.src = active?.avatarUrl ?? "";
  }

  for (const a of accounts) {
    const item = document.createElement("div");
    item.className = "dropdownItem";

    const left = document.createElement("div");
    left.className = "left";

    const av = document.createElement("span");
    av.className = "avatar";
    const img = document.createElement("img");
    img.src = a?.avatarUrl ?? "";
    av.appendChild(img);

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.flexDirection = "column";
    meta.style.lineHeight = "1.1";

    const title = document.createElement("strong");
    title.style.fontSize = "13px";
    title.textContent = getAccountLabel(a) + (a.id === activeId ? " ✓" : "");

    const sub = document.createElement("small");
    sub.className = "muted";
    sub.style.fontSize = "11px";
    sub.textContent = a?.type ?? a?.provider ?? "Microsoft";

    meta.appendChild(title);
    meta.appendChild(sub);

    left.appendChild(av);
    left.appendChild(meta);

    item.appendChild(left);

    item.onclick = async () => {
      await window.api.accountsSetActive(a.id);
      state.accounts = await window.api.accountsList();
      await renderAccounts();
      accountDropdown.classList.remove("open");
    };

    accountItems.appendChild(item);
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
      newName.value = i.name ?? "";
      newMem.value = String(i.memoryMb ?? 4096);
      newVersion.value = i.mcVersion ?? "";
      fillInstancePresetDropdown(i.instancePreset ?? "none");
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

    actions.appendChild(btnEdit);
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

btnCreate.onclick = async () => {
  modalMode = "create";
  editInstanceId = null;
  editServerId = null;
  modalTitle.textContent = "Create an instance";
  newName.value = "";
  newMem.value = String(getSettings().defaultMemoryMb ?? 4096);
  fillInstancePresetDropdown("none");

  newVersion.innerHTML = "";
  const s = getSettings();
  const versions = (state.versions ?? []).filter((v: any) => (s.showSnapshots ? true : v.type === "release"));

  for (const v of versions) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.id;
    newVersion.appendChild(opt);
  }

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
  });

modalClose.onclick = closeModal;
modalCancel.onclick = closeModal;

modalCreate.onclick = () =>
  guarded(async () => {
    if (modalMode === "create") {
      const id = crypto.randomUUID();
      const mcVersion = newVersion.value;
      const selectedPreset = (instancePreset.value || "none") as InstancePresetId;

      // ✅ Resolve Fabric loader version up-front (so instance config is complete)
      setStatus("Resolving Fabric loader…");
      const fabricLoaderVersion = await window.api.fabricPickLoader(mcVersion);

      const cfg = {
        id,
        name: newName.value?.trim() || "New Instance",
        mcVersion,
        loader: "fabric",
        fabricLoaderVersion,
        memoryMb: Number(newMem.value || 4096),
        accountId: instanceAccount.value || null,
        instancePreset: selectedPreset
      };

      setStatus("Creating instance…");
      await window.api.instancesCreate(cfg);

      // ✅ Install Fabric immediately so first launch works
      setStatus("Installing Fabric…");
      await window.api.fabricInstall(id, mcVersion, fabricLoaderVersion);

      if (selectedPreset !== "none") {
        await applyInstancePreset(id, mcVersion, selectedPreset);
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
      await window.api.instancesUpdate(editInstanceId, {
        name: newName.value?.trim() || "Instance",
        memoryMb: Number(newMem.value || 4096),
        accountId: instanceAccount.value || null,
        instancePreset: selectedPreset
      });
      if (inst && selectedPreset !== "none") {
        await applyInstancePreset(editInstanceId, inst.mcVersion, selectedPreset);
      }
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

    const accounts = state.accounts?.accounts ?? [];
    const accountId = inst.accountId || state.accounts?.activeAccountId || (accounts[0]?.id ?? null);
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
    appendLog(`[ui] Launching ${inst.name}...`);
    renderLaunchDiagnosis(null);
    const launchRes = await window.api.launch(inst.id, accountId, {
      jvmArgs: inst.jvmArgsOverride || s.jvmArgs,
      preLaunch: s.preLaunch,
      postExit: s.postExit
    });
    if (!launchRes?.ok) {
      const diag = await runLaunchDiagnosis(inst.id);
      await maybeOfferRollback(inst.id, diag);
    }
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
  });

modalUpdateMods.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    const inst = (state.instances?.instances ?? []).find((x: any) => x.id === editInstanceId) ?? null;
    if (!inst) return;
    setStatus("Resolving mods…");
    try {
      await window.api.rollbackCreateSnapshot(inst.id, "mods-refresh", "Before manual mods refresh");
    } catch (err: any) {
      appendLog(`[rollback] Snapshot skipped: ${String(err?.message ?? err)}`);
    }
    await window.api.modsRefresh(inst.id, inst.mcVersion);
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
refreshAll();
