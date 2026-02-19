import fs from "node:fs";
import path from "node:path";
import { listBenchmarks } from "./benchmark";
import { getInstanceDir, listInstances } from "./instances";
import { detectHardwareSummary } from "./optimizer";
import { getDataRoot } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";

// Local profile stats aggregated for optional public showcase output.
type PlaytimeState = {
  totalMs: number;
  sessions: number;
  lastPlayedAt: number | null;
  perInstanceMs: Record<string, number>;
};

type ProfileVisibilityState = {
  publicEnabled: boolean;
  updatedAt: number;
};

const PLAYTIME_PATH = () => path.join(getDataRoot(), "profile-playtime.json");
const VISIBILITY_PATH = () => path.join(getDataRoot(), "profile-visibility.json");

function defaultPlaytimeState(): PlaytimeState {
  return {
    totalMs: 0,
    sessions: 0,
    lastPlayedAt: null,
    perInstanceMs: {}
  };
}

function defaultVisibilityState(): ProfileVisibilityState {
  return {
    publicEnabled: false,
    updatedAt: Date.now()
  };
}

function readPlaytimeState(): PlaytimeState {
  const raw = readJsonFile<PlaytimeState>(PLAYTIME_PATH(), defaultPlaytimeState());
  return {
    // Clamp and sanitize persisted values to keep summary generation resilient.
    totalMs: Math.max(0, Number(raw?.totalMs || 0)),
    sessions: Math.max(0, Number(raw?.sessions || 0)),
    lastPlayedAt: Number.isFinite(Number(raw?.lastPlayedAt)) ? Number(raw.lastPlayedAt) : null,
    perInstanceMs: raw?.perInstanceMs && typeof raw.perInstanceMs === "object" ? raw.perInstanceMs : {}
  };
}

function readVisibilityState(): ProfileVisibilityState {
  const raw = readJsonFile<ProfileVisibilityState>(VISIBILITY_PATH(), defaultVisibilityState());
  return {
    publicEnabled: !!raw?.publicEnabled,
    updatedAt: Number.isFinite(Number(raw?.updatedAt)) ? Number(raw.updatedAt) : Date.now()
  };
}

function modCountForInstance(instanceId: string) {
  try {
    const modsDir = path.join(getInstanceDir(instanceId), "mods");
    if (!fs.existsSync(modsDir)) return 0;
    return fs
      .readdirSync(modsDir)
      .filter((name) => name.toLowerCase().endsWith(".jar"))
      .length;
  } catch {
    return 0;
  }
}

function toPublicRamLabel(totalRamMb: number) {
  const gb = Math.max(1, Math.round(totalRamMb / 1024));
  return `${gb} GB`;
}

export function recordPlaySession(instanceId: string, durationMs: number) {
  const normalizedDuration = Math.max(0, Math.round(Number(durationMs || 0)));
  // Ignore tiny/empty durations so accidental pings do not inflate metrics.
  if (!instanceId || normalizedDuration < 1000) return;

  const state = readPlaytimeState();
  state.totalMs += normalizedDuration;
  state.sessions += 1;
  state.lastPlayedAt = Date.now();
  state.perInstanceMs[instanceId] = Math.max(0, Number(state.perInstanceMs[instanceId] || 0)) + normalizedDuration;
  writeJsonFile(PLAYTIME_PATH(), state);
}

export function getProfileVisibility() {
  return readVisibilityState();
}

export function setProfileVisibility(publicEnabled: boolean) {
  const next: ProfileVisibilityState = {
    publicEnabled: !!publicEnabled,
    updatedAt: Date.now()
  };
  writeJsonFile(VISIBILITY_PATH(), next);
  return next;
}

export function getProfileSummary() {
  const db = listInstances();
  const instances = Array.isArray(db?.instances) ? db.instances : [];
  const activeInstanceId = db?.activeInstanceId ?? null;
  const activeInstance = instances.find((x) => x.id === activeInstanceId) ?? null;
  const hw = detectHardwareSummary();
  const playtime = readPlaytimeState();
  const visibility = readVisibilityState();

  const setups = instances.map((inst) => {
    const runs = listBenchmarks(inst.id);
    const latest = runs[0] ?? null;
    return {
      instanceId: inst.id,
      name: String(inst.name || inst.id),
      mcVersion: String(inst.mcVersion || "unknown"),
      loader: String(inst.loader || "unknown"),
      presetId: inst.instancePreset ?? "none",
      installedMods: modCountForInstance(inst.id),
      playtimeMs: Math.max(0, Number(playtime.perInstanceMs?.[inst.id] || 0)),
      latestBenchmark: latest
        ? {
            createdAt: latest.createdAt,
            profile: latest.profile,
            avgFps: Number(latest.avgFps || 0),
            low1Fps: Number(latest.low1Fps || 0),
            maxMemoryMb: Number(latest.maxMemoryMb || 0)
          }
        : null
    };
  });

  const allRuns = setups
    .flatMap((x) => (x.latestBenchmark ? [{ ...x.latestBenchmark, instanceName: x.name }] : []))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const latestBenchmark = allRuns[0] ?? null;
  const bestBenchmark = allRuns.slice().sort((a, b) => b.avgFps - a.avgFps)[0] ?? null;

  // Include both full and privacy-safe hardware representations.
  return {
    generatedAt: new Date().toISOString(),
    activeInstanceId,
    activeInstance: activeInstance
      ? {
          id: activeInstance.id,
          name: activeInstance.name,
          mcVersion: activeInstance.mcVersion,
          loader: activeInstance.loader,
          presetId: activeInstance.instancePreset ?? "none"
        }
      : null,
    totals: {
      instances: setups.length,
      installedMods: setups.reduce((sum, x) => sum + Number(x.installedMods || 0), 0),
      totalPlaytimeMs: Math.max(0, Number(playtime.totalMs || 0)),
      sessions: Math.max(0, Number(playtime.sessions || 0)),
      lastPlayedAt: playtime.lastPlayedAt
    },
    hardware: {
      cpuModel: hw.cpuModel,
      cpuCores: hw.cpuCores,
      totalRamMb: hw.totalRamMb,
      gpuModel: hw.gpuModel
    },
    hardwarePublic: {
      cpuCores: hw.cpuCores,
      ram: toPublicRamLabel(hw.totalRamMb),
      gpu: hw.gpuModel ? "Detected" : "Unknown"
    },
    latestBenchmark,
    bestBenchmark,
    setups,
    visibility
  };
}
