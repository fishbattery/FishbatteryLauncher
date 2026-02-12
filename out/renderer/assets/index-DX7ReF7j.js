const $ = (id) => document.getElementById(id);
const logsEl = $("logs");
const statusText = $("statusText");
const instancesGrid = $("instancesGrid");
const searchInstances = $("searchInstances");
const navLibrary = $("navLibrary");
const navMods = $("navMods");
const navSettings = $("navSettings");
const viewLibrary = $("viewLibrary");
const viewMods = $("viewMods");
const viewSettings = $("viewSettings");
const accountBtn = $("accountBtn");
const accountDropdown = $("accountDropdown");
const accountItems = $("accountItems");
const accountAdd = $("accountAdd");
const accountName = $("accountName");
const accountSub = $("accountSub");
const accountAvatar = $("accountAvatar");
const btnCreate = $("btnCreate");
const btnPlayActive = $("btnPlayActive");
const btnStopActive = $("btnStopActive");
const btnClearLogs = $("btnClearLogs");
const btnUpdateMods = $("btnUpdateMods");
const modsHint = $("modsHint");
const modsList = $("modsList");
const modalBackdrop = $("modalBackdrop");
const modalTitle = $("modalTitle");
const modalClose = $("modalClose");
const modalCancel = $("modalCancel");
const modalCreate = $("modalCreate");
const newName = $("newName");
const newVersion = $("newVersion");
const newMem = $("newMem");
let state = {
  versions: [],
  accounts: null,
  instances: null
};
let busy = false;
let modalMode = "create";
let editInstanceId = null;
const SETTINGS_KEY = "fishbattery.settings";
const defaultSettings = {
  theme: "ocean",
  blur: true,
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
let settings = loadSettings();
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function applyTheme() {
  document.documentElement.setAttribute("data-theme", settings.theme);
  document.documentElement.setAttribute("data-glass", settings.blur ? "1" : "0");
}
let instancePopover = null;
let popoverOpenForId = null;
let popoverAnchor = null;
function ensurePopover() {
  if (instancePopover) return instancePopover;
  const pop = document.createElement("div");
  pop.id = "instancePopover";
  pop.className = "popover";
  pop.setAttribute("role", "menu");
  pop.setAttribute("aria-hidden", "true");
  document.body.appendChild(pop);
  instancePopover = pop;
  return pop;
}
function closeInstancePopover() {
  if (!instancePopover) return;
  instancePopover.classList.remove("open");
  instancePopover.setAttribute("aria-hidden", "true");
  instancePopover.innerHTML = "";
  popoverOpenForId = null;
  popoverAnchor = null;
}
function positionPopover(anchor) {
  const pop = ensurePopover();
  const r = anchor.getBoundingClientRect();
  const w = 240;
  const padding = 10;
  let x = r.right - w;
  let y = r.bottom + 8;
  x = Math.max(padding, Math.min(x, window.innerWidth - w - padding));
  y = Math.max(padding, Math.min(y, window.innerHeight - 10 - padding));
  pop.style.left = `${Math.round(x)}px`;
  pop.style.top = `${Math.round(y)}px`;
  pop.style.width = `${w}px`;
}
function popSep() {
  const d = document.createElement("div");
  d.className = "popSep";
  return d;
}
function popItem(label, sub, icon, onClick, danger = false) {
  const row = document.createElement("div");
  row.className = `popItem ${danger ? "popDanger" : ""}`;
  row.tabIndex = 0;
  const left = document.createElement("div");
  left.className = "popLeft";
  const ic = document.createElement("div");
  ic.className = "popIcon";
  ic.textContent = icon;
  const text = document.createElement("div");
  text.className = "popText";
  text.innerHTML = `<strong>${label}</strong><small>${sub}</small>`;
  left.append(ic, text);
  row.append(left);
  const run = async () => {
    closeInstancePopover();
    await guarded(async () => {
      await onClick();
    });
  };
  row.addEventListener("click", (e) => {
    e.stopPropagation();
    run();
  });
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      run();
    }
  });
  return row;
}
function openInstancePopover(inst, anchor) {
  const pop = ensurePopover();
  if (pop.classList.contains("open") && popoverOpenForId === inst.id) {
    closeInstancePopover();
    return;
  }
  popoverOpenForId = inst.id;
  popoverAnchor = anchor;
  pop.innerHTML = "";
  pop.append(
    popItem("Play", "Launch this instance", "▶", async () => {
      await window.api.instancesSetActive(inst.id);
      await refreshAll();
      await launchActive();
    }),
    popItem("Edit", "Change name, version, memory", "✎", async () => {
      openEditModal(inst);
    }),
    popItem("Duplicate", "Copy worlds, configs, mods", "⧉", async () => {
      await window.api.instancesDuplicate(inst.id);
      await refreshAll();
    }),
    popItem("Open folder", "Show instance files", "📁", async () => {
      await window.api.instancesOpenFolder(inst.id);
    }),
    popSep(),
    popItem(
      "Delete",
      "Permanently remove instance",
      "🗑",
      async () => {
        const yes = confirm(
          `Delete instance "${inst.name}"?

This deletes worlds, configs, mods, everything.`
        );
        if (!yes) return;
        await window.api.instancesRemove(inst.id);
        await refreshAll();
      },
      true
    )
  );
  positionPopover(anchor);
  pop.classList.add("open");
  pop.setAttribute("aria-hidden", "false");
}
function setStatus(t) {
  statusText.textContent = t || "";
}
function setBusy(v) {
  busy = v;
  btnCreate.disabled = v;
  btnPlayActive.disabled = v;
  btnUpdateMods.disabled = v;
  modalCreate.disabled = v;
  newName.disabled = v;
  newVersion.disabled = v;
  newMem.disabled = v;
}
async function guarded(fn) {
  if (busy) return;
  setBusy(true);
  try {
    await fn();
  } finally {
    setBusy(false);
  }
}
function setView(which) {
  viewLibrary.style.display = which === "library" ? "" : "none";
  viewMods.style.display = which === "mods" ? "" : "none";
  viewSettings.style.display = which === "settings" ? "" : "none";
  navLibrary.classList.toggle("active", which === "library");
  navMods.classList.toggle("active", which === "mods");
  navSettings.classList.toggle("active", which === "settings");
}
function openModal() {
  modalBackdrop.classList.add("open");
}
function closeModal() {
  modalBackdrop.classList.remove("open");
}
function getActiveAccount() {
  const id = state.accounts?.activeId;
  return (state.accounts?.accounts ?? []).find((a) => a.id === id) ?? null;
}
function getActiveInstance() {
  const id = state.instances?.activeInstanceId;
  return (state.instances?.instances ?? []).find((i) => i.id === id) ?? null;
}
function renderAccountHeader() {
  const a = getActiveAccount();
  if (!a) {
    accountName.textContent = "No account";
    accountSub.textContent = "Sign in to play";
    accountAvatar.textContent = "?";
    return;
  }
  accountName.textContent = a.username;
  accountSub.textContent = "Minecraft account";
  accountAvatar.textContent = a.username?.[0]?.toUpperCase?.() ?? "M";
}
function setDropdownOpen(open) {
  accountDropdown.classList.toggle("open", open);
}
function renderAccountDropdown() {
  accountItems.innerHTML = "";
  const accounts = state.accounts?.accounts ?? [];
  for (const a of accounts) {
    const row = document.createElement("div");
    row.className = "dropdownItem";
    row.onclick = async () => {
      await window.api.accountsSetActive(a.id);
      await refreshAll();
      setDropdownOpen(false);
    };
    const left = document.createElement("div");
    left.className = "left";
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = a.username?.[0]?.toUpperCase?.() ?? "M";
    const meta = document.createElement("div");
    meta.innerHTML = `<div>${a.username}</div><small class="muted">${a.id.slice(0, 8)}${state.accounts?.activeId === a.id ? " • Selected" : ""}</small>`;
    left.append(av, meta);
    const right = document.createElement("div");
    right.className = "right";
    const del = document.createElement("button");
    del.className = "iconBtn danger";
    del.textContent = "🗑";
    del.onclick = async (e) => {
      e.stopPropagation();
      await window.api.accountsRemove(a.id);
      await refreshAll();
    };
    right.append(del);
    row.append(left, right);
    accountItems.append(row);
  }
}
function matchesInstance(inst, q) {
  if (!q) return true;
  const s = q.toLowerCase().trim();
  return (inst.name ?? "").toLowerCase().includes(s) || (inst.mcVersion ?? "").toLowerCase().includes(s);
}
function renderModalVersions() {
  newVersion.innerHTML = "";
  const base = settings.showSnapshots ? state.versions : state.versions.filter((v) => v.type !== "snapshot");
  const list = base.slice(0, 500);
  for (const v of list) {
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = `${v.id} [${v.type}]`;
    newVersion.append(o);
  }
  const latest = state.versions.find((v) => v.type === "release");
  if (latest) newVersion.value = latest.id;
}
function openCreateModal() {
  modalMode = "create";
  editInstanceId = null;
  modalTitle.textContent = "Create an instance";
  newName.value = "";
  renderModalVersions();
  newMem.value = String(settings.defaultMemoryMb ?? 4096);
  openModal();
}
function openEditModal(inst) {
  modalMode = "edit";
  editInstanceId = inst.id;
  modalTitle.textContent = "Edit instance";
  renderModalVersions();
  newName.value = inst.name ?? "";
  newMem.value = String(inst.memoryMb ?? 4096);
  newVersion.value = inst.mcVersion;
  openModal();
}
async function refreshRunningState() {
  const inst = getActiveInstance();
  if (!inst) {
    btnStopActive.style.display = "none";
    return;
  }
  const running = await window.api.launchIsRunning(inst.id);
  btnStopActive.style.display = running ? "" : "none";
}
function renderInstances() {
  instancesGrid.innerHTML = "";
  const instances = state.instances?.instances ?? [];
  const q = searchInstances.value ?? "";
  const filtered = instances.filter((i) => matchesInstance(i, q));
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = instances.length ? "No matches." : "No instances yet. Click Create.";
    instancesGrid.append(empty);
    return;
  }
  for (const inst of filtered) {
    const card = document.createElement("div");
    card.className = "card";
    const inner = document.createElement("div");
    inner.className = "cardInner";
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const meta = document.createElement("div");
    meta.className = "cardMeta";
    const title = document.createElement("strong");
    title.textContent = inst.name;
    const badges = document.createElement("div");
    badges.className = "badges";
    const b1 = document.createElement("span");
    b1.className = "badge";
    b1.textContent = `MC ${inst.mcVersion}`;
    const b2 = document.createElement("span");
    b2.className = "badge";
    b2.textContent = `Fabric ${inst.fabricLoaderVersion ?? "not installed"}`;
    const b3 = document.createElement("span");
    b3.className = "badge";
    b3.textContent = `${inst.memoryMb} MB`;
    badges.append(b1, b2, b3);
    meta.append(title, badges);
    const actions = document.createElement("div");
    actions.className = "cardActions";
    const play = document.createElement("button");
    play.className = "btn btnPrimary";
    play.textContent = "Play";
    play.onclick = async (e) => {
      e.stopPropagation();
      await window.api.instancesSetActive(inst.id);
      await refreshAll();
      await guarded(launchActive);
    };
    const more = document.createElement("button");
    more.className = "iconBtn";
    more.textContent = "⋯";
    more.onclick = (e) => {
      e.stopPropagation();
      openInstancePopover(inst, more);
    };
    actions.append(play, more);
    inner.append(thumb, meta, actions);
    card.append(inner);
    card.onclick = async () => {
      await window.api.instancesSetActive(inst.id);
      await refreshAll();
    };
    instancesGrid.append(card);
  }
}
async function renderModsView() {
  const inst = getActiveInstance();
  modsList.innerHTML = "";
  if (!inst) {
    modsHint.textContent = "Select an instance first.";
    return;
  }
  modsHint.textContent = `Instance: ${inst.name} (${inst.mcVersion})`;
  const mods = await window.api.modsList(inst.id);
  for (const m of mods) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "10px";
    row.style.border = "1px solid var(--border)";
    row.style.borderRadius = "12px";
    row.style.marginBottom = "8px";
    row.style.background = "rgba(255,255,255,.02)";
    const left = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = m.name;
    const sub = document.createElement("div");
    sub.className = "muted";
    sub.style.fontSize = "12px";
    if (m.status === "ok") sub.textContent = `OK. ${m.resolved?.versionName ?? ""}`;
    else if (m.status === "unavailable") sub.textContent = `Unavailable for ${inst.mcVersion} (Fabric)`;
    else sub.textContent = `Error: ${m.resolved?.error ?? "unknown"}`;
    left.append(title, sub);
    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "10px";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = !!m.enabled;
    toggle.disabled = !!m.required || m.status === "unavailable" || busy;
    toggle.onchange = async () => {
      await window.api.modsSetEnabled(inst.id, m.id, toggle.checked);
      await renderModsView();
    };
    right.append(toggle);
    row.append(left, right);
    modsList.append(row);
  }
}
async function refreshAll() {
  setStatus("Loading…");
  const manifest = await window.api.versionsList();
  state.versions = manifest.versions;
  state.accounts = await window.api.accountsList();
  state.instances = await window.api.instancesList();
  renderAccountHeader();
  renderAccountDropdown();
  renderModalVersions();
  renderInstances();
  await renderModsView();
  await refreshRunningState();
  setStatus("");
}
async function createInstanceFlow() {
  const acc = getActiveAccount();
  if (!acc) {
    alert("Add an account first.");
    return;
  }
  const id = crypto.randomUUID();
  const version = newVersion.value;
  if (!version) {
    alert("Pick a Minecraft version first.");
    return;
  }
  const loader = await window.api.fabricPickLoader(version);
  const name = newName.value?.trim() || `Fabric ${version}`;
  const mem = Number(newMem.value || 4096);
  setStatus("Creating instance…");
  await window.api.instancesCreate({
    id,
    name,
    mcVersion: version,
    loader: "fabric",
    fabricLoaderVersion: loader,
    memoryMb: mem
  });
  setStatus("Installing Fabric…");
  await window.api.fabricInstall(id, version, loader);
  if (settings.autoUpdateMods) {
    setStatus("Resolving mods…");
    await window.api.modsRefresh(id, version);
  }
  closeModal();
  await refreshAll();
  setStatus("");
}
async function editInstanceFlow() {
  const id = editInstanceId;
  if (!id) return;
  setStatus("Saving…");
  await window.api.instancesUpdate(id, {
    name: newName.value.trim(),
    mcVersion: newVersion.value,
    memoryMb: Number(newMem.value || 4096)
  });
  const inst = (await window.api.instancesList()).instances.find((x) => x.id === id);
  if (inst?.loader === "fabric") {
    await window.api.fabricInstall(id, newVersion.value, inst.fabricLoaderVersion);
    if (settings.autoUpdateMods) {
      await window.api.modsRefresh(id, newVersion.value);
    }
  }
  closeModal();
  await refreshAll();
  setStatus("");
}
async function submitModal() {
  if (modalMode === "create") return createInstanceFlow();
  return editInstanceFlow();
}
async function launchActive() {
  const inst = getActiveInstance();
  const acc = getActiveAccount();
  if (!inst || !acc) {
    alert("Select an account and an instance.");
    return;
  }
  logsEl.textContent = "";
  setStatus("Launching…");
  try {
    await window.api.launch(inst.id, acc.id);
  } finally {
    setStatus("");
    await refreshRunningState();
  }
}
window.api.onLaunchLog(async (line) => {
  logsEl.textContent += line + "\n";
  logsEl.scrollTop = logsEl.scrollHeight;
  if (line.includes("Launching with arguments")) {
    await refreshRunningState();
  }
});
document.addEventListener("click", (e) => {
  if (!instancePopover || !instancePopover.classList.contains("open")) return;
  const t = e.target;
  if (!t.closest("#instancePopover")) closeInstancePopover();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeInstancePopover();
});
window.addEventListener("resize", () => {
  if (instancePopover?.classList.contains("open") && popoverAnchor) {
    positionPopover(popoverAnchor);
  }
});
accountBtn.onclick = () => setDropdownOpen(!accountDropdown.classList.contains("open"));
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t.closest(".account")) setDropdownOpen(false);
});
accountAdd.onclick = () => guarded(async () => {
  setStatus("Signing in…");
  await window.api.accountsAdd();
  await refreshAll();
  setDropdownOpen(false);
  setStatus("");
});
navLibrary.onclick = () => setView("library");
navMods.onclick = async () => {
  setView("mods");
  await renderModsView();
};
navSettings.onclick = () => setView("settings");
function setSettingsPanel(which) {
  const ids = ["General", "Install", "Window", "Java", "Hooks"];
  for (const k of ids) {
    document.getElementById(`setPanel${k}`).style.display = k.toLowerCase() === which ? "" : "none";
    document.getElementById(`setNav${k}`).classList.toggle(
      "active",
      k.toLowerCase() === which
    );
  }
}
function wireSettings() {
  $("setNavGeneral").onclick = () => setSettingsPanel("general");
  $("setNavInstall").onclick = () => setSettingsPanel("install");
  $("setNavWindow").onclick = () => setSettingsPanel("window");
  $("setNavJava").onclick = () => setSettingsPanel("java");
  $("setNavHooks").onclick = () => setSettingsPanel("hooks");
  const setTheme = $("setTheme");
  const setBlur = $("setBlur");
  const setShowSnapshots = $("setShowSnapshots");
  const setAutoUpdateMods = $("setAutoUpdateMods");
  const setFullscreen = $("setFullscreen");
  const setWinW = $("setWinW");
  const setWinH = $("setWinH");
  const setDefaultMem = $("setDefaultMem");
  const setJvmArgs = $("setJvmArgs");
  const setPreLaunch = $("setPreLaunch");
  const setPostExit = $("setPostExit");
  setTheme.value = settings.theme;
  setBlur.checked = settings.blur;
  setShowSnapshots.checked = settings.showSnapshots;
  setAutoUpdateMods.checked = settings.autoUpdateMods;
  setFullscreen.checked = settings.fullscreen;
  setWinW.value = String(settings.winW);
  setWinH.value = String(settings.winH);
  setDefaultMem.value = String(settings.defaultMemoryMb);
  setJvmArgs.value = settings.jvmArgs;
  setPreLaunch.value = settings.preLaunch;
  setPostExit.value = settings.postExit;
  setTheme.onchange = async () => {
    settings.theme = setTheme.value;
    saveSettings();
    applyTheme();
  };
  setBlur.onchange = () => {
    settings.blur = setBlur.checked;
    saveSettings();
    applyTheme();
  };
  setShowSnapshots.onchange = async () => {
    settings.showSnapshots = setShowSnapshots.checked;
    saveSettings();
    renderModalVersions();
  };
  setAutoUpdateMods.onchange = () => {
    settings.autoUpdateMods = setAutoUpdateMods.checked;
    saveSettings();
  };
  setFullscreen.onchange = () => {
    settings.fullscreen = setFullscreen.checked;
    saveSettings();
  };
  setWinW.onchange = () => {
    settings.winW = Math.max(640, Number(setWinW.value || 854));
    saveSettings();
  };
  setWinH.onchange = () => {
    settings.winH = Math.max(360, Number(setWinH.value || 480));
    saveSettings();
  };
  setDefaultMem.onchange = () => {
    settings.defaultMemoryMb = Math.max(1024, Number(setDefaultMem.value || 4096));
    saveSettings();
  };
  setJvmArgs.onchange = () => {
    settings.jvmArgs = setJvmArgs.value || "";
    saveSettings();
  };
  setPreLaunch.onchange = () => {
    settings.preLaunch = setPreLaunch.value || "";
    saveSettings();
  };
  setPostExit.onchange = () => {
    settings.postExit = setPostExit.value || "";
    saveSettings();
  };
}
btnCreate.onclick = () => openCreateModal();
btnPlayActive.onclick = () => guarded(launchActive);
btnStopActive.onclick = () => guarded(async () => {
  const inst = getActiveInstance();
  if (!inst) return;
  await window.api.launchStop(inst.id);
  await refreshRunningState();
});
btnUpdateMods.onclick = () => guarded(async () => {
  const inst = getActiveInstance();
  if (!inst) return;
  setStatus("Resolving mods…");
  await window.api.modsRefresh(inst.id, inst.mcVersion);
  await renderModsView();
  setStatus("");
});
btnClearLogs.onclick = () => {
  logsEl.textContent = "";
};
modalClose.onclick = () => closeModal();
modalCancel.onclick = () => closeModal();
modalBackdrop.onclick = (e) => {
  if (e.target === modalBackdrop) closeModal();
};
modalCreate.onclick = () => guarded(submitModal);
searchInstances.oninput = () => renderInstances();
applyTheme();
wireSettings();
setSettingsPanel("general");
refreshAll();
