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
const btnPlayActive = $("btnPlayActive");
const btnStopActive = $("btnStopActive");
const btnClearLogs = $("btnClearLogs");

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

let state: any = {
  versions: [],
  accounts: null,
  instances: null
};

let busy = false;
let modalMode: "create" | "edit" = "create";
let editInstanceId: string | null = null;

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
let hasAutoCheckedUpdates = false;
let promptedUpdateVersion: string | null = null;
let promptedInstallVersion: string | null = null;

// ---------------- Settings ----------------
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
}

function setStatus(text: string) {
  statusText.textContent = text || "";
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
}

// ---------------- Mods list (catalog toggles) ----------------
async function renderInstanceMods(instanceId: string | null) {
  modalModsList.innerHTML = "";

  if (!instanceId) {
    modalModsHint.textContent = "Select an instance first.";
    return;
  }

  modalModsHint.textContent = "Mods for this instance:";
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
    name.textContent = m.title ?? m.id ?? "Mod";

    const sub = document.createElement("div");
    sub.className = "setHelp";
    sub.textContent = `${m.version ?? ""} ${m.enabled ? "" : "(disabled)"}`.trim();

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
      await fillInstanceAccountDropdown(i.accountId ?? null);
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

    actions.appendChild(btnEdit);
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

  await renderAccounts();
  await renderInstances();
  setStatus("");

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
  modalTitle.textContent = "Create an instance";
  newName.value = "";
  newMem.value = String(getSettings().defaultMemoryMb ?? 4096);

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
  openModal();
};

modalClose.onclick = closeModal;
modalCancel.onclick = closeModal;

modalCreate.onclick = () =>
  guarded(async () => {
    if (modalMode === "create") {
      const id = crypto.randomUUID();
      const mcVersion = newVersion.value;

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
        accountId: instanceAccount.value || null
      };

      setStatus("Creating instance…");
      await window.api.instancesCreate(cfg);

      // ✅ Install Fabric immediately so first launch works
      setStatus("Installing Fabric…");
      await window.api.fabricInstall(id, mcVersion, fabricLoaderVersion);

      setStatus("");
      state.instances = await window.api.instancesList();
      await renderInstances();
      closeModal();
      return;
    }

    if (modalMode === "edit" && editInstanceId) {
      await window.api.instancesUpdate(editInstanceId, {
        name: newName.value?.trim() || "Instance",
        memoryMb: Number(newMem.value || 4096),
        accountId: instanceAccount.value || null
      });
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
    appendLog(`[ui] Launching ${inst.name}…`);
    await window.api.launch(inst.id, accountId, {
      jvmArgs: s.jvmArgs,
      preLaunch: s.preLaunch,
      postExit: s.postExit
    });
  });

btnStopActive.onclick = () =>
  guarded(async () => {
    const active = state.instances?.activeInstanceId ?? null;
    if (!active) return;
    await window.api.launchStop(active);
  });

btnClearLogs.onclick = () => (logsEl.textContent = "");

modalUpdateMods.onclick = () =>
  guarded(async () => {
    if (!editInstanceId) return;
    const inst = (state.instances?.instances ?? []).find((x: any) => x.id === editInstanceId) ?? null;
    if (!inst) return;
    setStatus("Resolving mods…");
    await window.api.modsRefresh(inst.id, inst.mcVersion);
    await renderInstanceMods(inst.id);
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

window.api.onLaunchLog((line) => appendLog(line));
window.api.onUpdaterEvent((evt) => {
  updaterState = evt;
  if (settingsTabInstall.classList.contains("active")) {
    renderSettingsPanels();
  }
  if (evt?.message) appendLog(`[updater] ${evt.message}`);

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
