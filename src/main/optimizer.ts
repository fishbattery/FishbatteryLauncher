import os from "node:os";
import { spawnSync } from "node:child_process";
import { setModEnabled, refreshModsForInstance } from "./mods";
import { listInstances, updateInstance } from "./instances";

export type OptimizerProfile = "conservative" | "balanced" | "aggressive";

export type HardwareSummary = {
  totalRamMb: number;
  cpuCores: number;
  cpuModel: string;
  gpuModel: string | null;
};

export type OptimizerPreview = {
  profile: OptimizerProfile;
  hardware: HardwareSummary;
  memoryMb: number;
  jvmArgs: string;
  gc: "G1GC" | "ZGC";
  modsToEnable: string[];
};

const PERF_MOD_IDS = ["sodium", "lithium", "ferrite-core", "modernfix", "c2me"];

function detectGpuModel(): string | null {
  if (process.platform !== "win32") return null;
  try {
    const out = spawnSync("wmic", ["path", "win32_VideoController", "get", "name"], {
      windowsHide: true,
      encoding: "utf8"
    });
    const raw = String(out.stdout || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const names = raw.filter((x) => x.toLowerCase() !== "name");
    return names[0] || null;
  } catch {
    return null;
  }
}

export function detectHardwareSummary(): HardwareSummary {
  const cpus = os.cpus() || [];
  return {
    totalRamMb: Math.floor(os.totalmem() / (1024 * 1024)),
    cpuCores: cpus.length || 1,
    cpuModel: cpus[0]?.model || "Unknown CPU",
    gpuModel: detectGpuModel()
  };
}

function calcRecommendedMemoryMb(totalRamMb: number, profile: OptimizerProfile): number {
  const reserveMb = 2048;
  const cap = Math.max(2048, totalRamMb - reserveMb);
  const raw =
    profile === "conservative"
      ? Math.floor(totalRamMb * 0.25)
      : profile === "balanced"
        ? Math.floor(totalRamMb * 0.33)
        : Math.floor(totalRamMb * 0.5);
  const rounded = Math.max(2048, Math.min(cap, Math.floor(raw / 256) * 256));
  return rounded;
}

function jvmArgsForProfile(profile: OptimizerProfile): { gc: "G1GC" | "ZGC"; args: string } {
  if (profile === "aggressive") {
    return {
      gc: "ZGC",
      args: "-XX:+UnlockExperimentalVMOptions -XX:+UseZGC -XX:+ZGenerational -XX:+AlwaysPreTouch -XX:+DisableExplicitGC"
    };
  }
  return {
    gc: "G1GC",
    args:
      profile === "conservative"
        ? "-XX:+UseG1GC -XX:MaxGCPauseMillis=75 -XX:+ParallelRefProcEnabled"
        : "-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:+ParallelRefProcEnabled -XX:+UnlockExperimentalVMOptions"
  };
}

export function buildOptimizerPreview(profile: OptimizerProfile): OptimizerPreview {
  const hardware = detectHardwareSummary();
  const memoryMb = calcRecommendedMemoryMb(hardware.totalRamMb, profile);
  const jvm = jvmArgsForProfile(profile);
  const modsToEnable = profile === "conservative" ? PERF_MOD_IDS.filter((x) => x !== "c2me") : PERF_MOD_IDS;
  return {
    profile,
    hardware,
    memoryMb,
    jvmArgs: jvm.args,
    gc: jvm.gc,
    modsToEnable
  };
}

export async function applyOptimizer(instanceId: string, profile: OptimizerProfile) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const preview = buildOptimizerPreview(profile);
  const backup = {
    memoryMb: Number(inst.memoryMb || 4096),
    jvmArgsOverride: inst.jvmArgsOverride ?? null
  };

  updateInstance(instanceId, {
    memoryMb: preview.memoryMb,
    jvmArgsOverride: preview.jvmArgs,
    optimizerBackup: backup
  } as any);

  for (const modId of PERF_MOD_IDS) {
    const shouldEnable = preview.modsToEnable.includes(modId);
    await setModEnabled(instanceId, modId, shouldEnable);
  }
  await refreshModsForInstance({ instanceId, mcVersion: inst.mcVersion, loader: "fabric" });

  return preview;
}

export function restoreOptimizerDefaults(instanceId: string) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const backup = (inst as any).optimizerBackup;
  if (!backup) throw new Error("No optimizer backup found for this instance");

  updateInstance(instanceId, {
    memoryMb: Number(backup.memoryMb || 4096),
    jvmArgsOverride: backup.jvmArgsOverride ?? null,
    optimizerBackup: null
  } as any);

  return true;
}
