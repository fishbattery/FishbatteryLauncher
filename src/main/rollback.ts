import path from "node:path";
import crypto from "node:crypto";
import { getInstanceDir, listInstances, updateInstance } from "./instances";
import { readJsonFile, writeJsonFile } from "./store";
import { loadModsState, refreshModsForInstance, saveModsState } from "./mods";
import { loadPacksState, refreshPacksForInstance, savePacksState } from "./packs";

// Snapshot triggers used for rollback history labeling.
type RollbackReason = "instance-preset" | "mods-refresh" | "packs-refresh" | "manual";

type RollbackSnapshot = {
  id: string;
  createdAt: number;
  reason: RollbackReason;
  note?: string;
  instance: {
    mcVersion: string;
    loader: "vanilla" | "fabric" | "quilt" | "forge" | "neoforge";
    fabricLoaderVersion?: string;
    quiltLoaderVersion?: string;
    forgeVersion?: string;
    neoforgeVersion?: string;
    memoryMb: number;
    jvmArgsOverride?: string | null;
    instancePreset?: string | null;
  };
  modsEnabled: Record<string, boolean>;
  packsEnabled: Record<string, boolean>;
};

type RollbackDb = {
  snapshots: RollbackSnapshot[];
};

const MAX_SNAPSHOTS = 8;

// Keep rollback storage per instance to avoid cross-instance state leakage.
function getRollbackPath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "rollback-snapshots.json");
}

function loadRollbackDb(instanceId: string): RollbackDb {
  return readJsonFile(getRollbackPath(instanceId), { snapshots: [] });
}

function saveRollbackDb(instanceId: string, db: RollbackDb) {
  writeJsonFile(getRollbackPath(instanceId), db);
}

export function createRollbackSnapshot(instanceId: string, reason: RollbackReason, note?: string) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const mods = loadModsState(instanceId);
  const packs = loadPacksState(instanceId);

  const snap: RollbackSnapshot = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    reason,
    note: String(note || "").trim() || undefined,
    instance: {
      mcVersion: inst.mcVersion,
      loader: inst.loader,
      fabricLoaderVersion: inst.fabricLoaderVersion,
      quiltLoaderVersion: inst.quiltLoaderVersion,
      forgeVersion: inst.forgeVersion,
      neoforgeVersion: inst.neoforgeVersion,
      memoryMb: inst.memoryMb,
      jvmArgsOverride: inst.jvmArgsOverride ?? null,
      instancePreset: inst.instancePreset ?? null
    },
    modsEnabled: { ...(mods.enabled || {}) },
    packsEnabled: { ...(packs.enabled || {}) }
  };

  // Latest snapshot first; cap file growth with a fixed history window.
  const rollback = loadRollbackDb(instanceId);
  rollback.snapshots.unshift(snap);
  rollback.snapshots = rollback.snapshots.slice(0, MAX_SNAPSHOTS);
  saveRollbackDb(instanceId, rollback);
  return snap;
}

export function getLatestRollbackSnapshot(instanceId: string) {
  const rollback = loadRollbackDb(instanceId);
  return rollback.snapshots[0] ?? null;
}

export async function restoreLatestRollbackSnapshot(instanceId: string) {
  const latest = getLatestRollbackSnapshot(instanceId);
  if (!latest) throw new Error("No rollback snapshot found");

  updateInstance(instanceId, {
    mcVersion: latest.instance.mcVersion,
    loader: latest.instance.loader,
    fabricLoaderVersion: latest.instance.fabricLoaderVersion,
    quiltLoaderVersion: latest.instance.quiltLoaderVersion,
    forgeVersion: latest.instance.forgeVersion,
    neoforgeVersion: latest.instance.neoforgeVersion,
    memoryMb: latest.instance.memoryMb,
    jvmArgsOverride: latest.instance.jvmArgsOverride ?? null,
    instancePreset: latest.instance.instancePreset ?? null
  });

  const mods = loadModsState(instanceId);
  // Restore enabled flags exactly as they were at snapshot time.
  mods.enabled = { ...(latest.modsEnabled || {}) };
  saveModsState(instanceId, mods);

  const packs = loadPacksState(instanceId);
  packs.enabled = { ...(latest.packsEnabled || {}) };
  savePacksState(instanceId, packs);

  // Refresh catalogs so restored toggles are reconciled with current metadata.
  if (latest.instance.loader === "fabric") {
    await refreshModsForInstance({
      instanceId,
      mcVersion: latest.instance.mcVersion,
      loader: "fabric"
    });
  }
  await refreshPacksForInstance({
    instanceId,
    mcVersion: latest.instance.mcVersion
  });

  return latest;
}
