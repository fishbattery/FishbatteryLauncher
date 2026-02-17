import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getInstancesRoot } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";


export type InstanceConfig = {
  id: string;
  name: string;
  accountId?: string | null; // which account to launch with (default: active account)
  syncEnabled?: boolean;
  mcVersion: string;        // e.g. "1.21.4" or "25w06a"
  loader: "vanilla" | "fabric" | "quilt" | "forge" | "neoforge";
  instancePreset?: string | null;
  jvmArgsOverride?: string | null;
  optimizerBackup?: { memoryMb: number; jvmArgsOverride?: string | null } | null;
  fabricLoaderVersion?: string;
  quiltLoaderVersion?: string;
  forgeVersion?: string;
  neoforgeVersion?: string;
  memoryMb: number;         // e.g. 4096
  createdAt: number;
};

type InstancesDb = {
  activeInstanceId: string | null;
  instances: InstanceConfig[];
  updatedAt?: number;
};

const DB_PATH = () => path.join(getInstancesRoot(), "_instances.json");

function loadDb(): InstancesDb {
  const db = readJsonFile(DB_PATH(), { activeInstanceId: null, instances: [], updatedAt: Date.now() });
  if (!Number.isFinite(Number(db.updatedAt))) db.updatedAt = Date.now();
  if (!Array.isArray(db.instances)) db.instances = [];
  db.instances = db.instances.map((inst) => ({
    ...inst,
    syncEnabled: inst?.syncEnabled !== false
  }));
  return db;
}

function saveDb(db: InstancesDb) {
  writeJsonFile(DB_PATH(), db);
}

export function listInstances() {
  return loadDb();
}

export function replaceInstancesFromSync(payload: {
  activeInstanceId: string | null;
  instances: InstanceConfig[];
  updatedAt?: number;
}) {
  const next: InstancesDb = {
    activeInstanceId: payload?.activeInstanceId ?? null,
    instances: Array.isArray(payload?.instances)
      ? payload.instances.map((inst) => ({ ...inst, syncEnabled: inst?.syncEnabled !== false }))
      : [],
    updatedAt: Number.isFinite(Number(payload?.updatedAt)) ? Number(payload?.updatedAt) : Date.now()
  };
  saveDb(next);
  return next;
}

export function getInstanceDir(instanceId: string): string {
  if (!instanceId) throw new Error("getInstanceDir: instanceId missing");
  return path.join(getInstancesRoot(), instanceId);
}

export function getModsStatePath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "mods-state.json");
}

export function createInstance(cfg: Omit<InstanceConfig, "createdAt">) {
  const db = loadDb();
  const full: InstanceConfig = {
    ...cfg,
    createdAt: Date.now(),
    syncEnabled: cfg?.syncEnabled !== false
  };
  db.instances.unshift(full);
  db.activeInstanceId = full.id;
  db.updatedAt = Date.now();
  saveDb(db);
  getInstanceDir(full.id);
  // Ensure instance directory structure and attempt to pre-install bridge mod.
  try {
    const instDir = getInstanceDir(full.id);
    const modsDir = path.join(instDir, "mods");
    fs.mkdirSync(modsDir, { recursive: true });
    // Attempt to install bridge for this instance (best-effort, no logging available here).
    // Import dynamically to avoid circular imports at module load time.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const installer = require("./bridgeInstaller") as typeof import("./bridgeInstaller");
      void installer.installBridgeToMods(modsDir, full.mcVersion, full.loader).catch((err) => {
        try {
          // Log installer error to main process console for diagnostics
          // eslint-disable-next-line no-console
          console.error("[bridgeInstaller] Pre-install failed for instance %s: %O", full.id, err);
        } catch {}
      });
    } catch (e) {
      try { console.error("[bridgeInstaller] Failed to require installer: %O", e); } catch {}
    }
  } catch {}

  return full;
}

export function setActiveInstance(id: string | null) {
  const db = loadDb();
  db.activeInstanceId = id;
  db.updatedAt = Date.now();
  saveDb(db);
}

export function updateInstance(id: string, patch: Partial<InstanceConfig>) {
  if (!id) throw new Error("updateInstance: id is missing");
  const db = loadDb();
  const idx = db.instances.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Instance not found");
  db.instances[idx] = {
    ...db.instances[idx],
    ...patch,
    syncEnabled:
      Object.prototype.hasOwnProperty.call(patch || {}, "syncEnabled")
        ? patch.syncEnabled !== false
        : db.instances[idx].syncEnabled !== false
  };
  db.updatedAt = Date.now();
  saveDb(db);
  return db.instances[idx];
}

export function removeInstance(id: string) {
  if (!id) throw new Error("removeInstance: id is missing");
  const instanceDir = getInstanceDir(id);
  const instancesRoot = path.resolve(getInstancesRoot());
  const resolvedInstanceDir = path.resolve(instanceDir);

  const db = loadDb();
  db.instances = db.instances.filter((i) => i.id !== id);
  if (db.activeInstanceId === id) db.activeInstanceId = db.instances[0]?.id ?? null;
  db.updatedAt = Date.now();
  saveDb(db);

  // Remove the instance directory from disk as part of delete.
  // Safety guard ensures we only delete inside the instances root.
  if (resolvedInstanceDir.startsWith(instancesRoot + path.sep) && fs.existsSync(resolvedInstanceDir)) {
    fs.rmSync(resolvedInstanceDir, { recursive: true, force: true });
  }
}

function copyDirRecursive(src: string, dst: string) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, ent.name);
    const to = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDirRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

export function duplicateInstance(id: string) {
  if (!id) throw new Error("duplicateInstance: id is missing");
  const db = loadDb();
  const inst = db.instances.find((x) => x.id === id);
  if (!inst) throw new Error("Instance not found");

  const newId = crypto.randomUUID();
  const copy: InstanceConfig = {
    ...inst,
    id: newId,
    name: `${inst.name} (Copy)`,
    createdAt: Date.now()
  };

  const srcDir = getInstanceDir(id);
  const dstDir = getInstanceDir(newId);
  copyDirRecursive(srcDir, dstDir);

  db.instances.unshift(copy);
  db.activeInstanceId = newId;
  db.updatedAt = Date.now();
  saveDb(db);

  return copy;
}
