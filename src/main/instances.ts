import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getInstancesRoot } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";


export type InstanceConfig = {
  id: string;
  name: string;
  accountId?: string | null; // which account to launch with (default: active account)
  mcVersion: string;        // e.g. "1.21.4" or "25w06a"
  loader: "vanilla" | "fabric";
  fabricLoaderVersion?: string;
  memoryMb: number;         // e.g. 4096
  createdAt: number;
};

type InstancesDb = {
  activeInstanceId: string | null;
  instances: InstanceConfig[];
};

const DB_PATH = () => path.join(getInstancesRoot(), "_instances.json");

function loadDb(): InstancesDb {
  return readJsonFile(DB_PATH(), { activeInstanceId: null, instances: [] });
}

function saveDb(db: InstancesDb) {
  writeJsonFile(DB_PATH(), db);
}

export function listInstances() {
  return loadDb();
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
  const full: InstanceConfig = { ...cfg, createdAt: Date.now() };
  db.instances.unshift(full);
  db.activeInstanceId = full.id;
  saveDb(db);
  getInstanceDir(full.id);
  return full;
}

export function setActiveInstance(id: string | null) {
  const db = loadDb();
  db.activeInstanceId = id;
  saveDb(db);
}

export function updateInstance(id: string, patch: Partial<InstanceConfig>) {
  if (!id) throw new Error("updateInstance: id is missing");
  const db = loadDb();
  const idx = db.instances.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Instance not found");
  db.instances[idx] = { ...db.instances[idx], ...patch };
  saveDb(db);
  return db.instances[idx];
}

export function removeInstance(id: string) {
  if (!id) throw new Error("removeInstance: id is missing");
  const db = loadDb();
  db.instances = db.instances.filter((i) => i.id !== id);
  if (db.activeInstanceId === id) db.activeInstanceId = db.instances[0]?.id ?? null;
  saveDb(db);
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
  saveDb(db);

  return copy;
}
