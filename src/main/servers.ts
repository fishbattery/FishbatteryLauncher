import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { getInstanceDir, listInstances, updateInstance } from "./instances";
import { loadModsState, saveModsState } from "./mods";
import { loadPacksState, savePacksState } from "./packs";
import { applyInstanceLockfile, generateInstanceLockfile, type InstanceLockfile } from "./instanceLockfile";
import { readJsonFile, writeJsonFile } from "./store";

// Per-instance saved multiplayer server entries.
export type InstanceServerEntry = {
  id: string;
  name: string;
  address: string;
  notes?: string;
  linkedProfile?: string | null;
  createdAt: number;
  updatedAt: number;
};

type ServersState = {
  preferredServerId: string | null;
  servers: InstanceServerEntry[];
};

type ServerProfileManifest = {
  schemaVersion: 1;
  exportedAt: string;
  server: {
    name: string;
    address: string;
    notes?: string;
  };
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
  enabledMods: string[];
  enabledPacks: string[];
};

// Each instance stores its own server list to keep configs isolated.
function serversPath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "servers.json");
}

function defaultServersState(): ServersState {
  return { preferredServerId: null, servers: [] };
}

function loadServersState(instanceId: string): ServersState {
  return readJsonFile(serversPath(instanceId), defaultServersState());
}

function saveServersState(instanceId: string, state: ServersState) {
  writeJsonFile(serversPath(instanceId), state);
}

function normalizeServerInput(input: Partial<InstanceServerEntry>) {
  const name = String(input.name ?? "").trim();
  const address = String(input.address ?? "").trim();
  const notes = String(input.notes ?? "").trim();

  if (!name) throw new Error("Server name is required");
  if (!address) throw new Error("Server address is required");

  return {
    name,
    address,
    notes: notes || undefined
  };
}

// Basic zip-slip protection for imported profile archives.
function sanitizeArchivePath(rel: string) {
  if (!rel) return false;
  if (path.isAbsolute(rel)) return false;
  const norm = path.normalize(rel);
  return !norm.startsWith("..") && !norm.includes(`..${path.sep}`);
}

// Recursively copy a directory into a zip preserving relative structure.
function addDirToZip(zip: AdmZip, diskDir: string, zipPrefix: string) {
  if (!fs.existsSync(diskDir) || !fs.statSync(diskDir).isDirectory()) return;

  const stack = [diskDir];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      const rel = path.relative(diskDir, full).replace(/\\/g, "/");
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!ent.isFile()) continue;
      const dirRel = path.dirname(rel);
      const zipDir = dirRel === "." ? zipPrefix : `${zipPrefix}/${dirRel}`;
      zip.addLocalFile(full, zipDir.replace(/\\/g, "/"), path.basename(rel));
    }
  }
}

export function listInstanceServers(instanceId: string) {
  return loadServersState(instanceId);
}

export function upsertInstanceServer(instanceId: string, input: Partial<InstanceServerEntry>) {
  const state = loadServersState(instanceId);
  const now = Date.now();
  const normalized = normalizeServerInput(input);

  if (input.id) {
    // Update path for an existing entry.
    const idx = state.servers.findIndex((x) => x.id === input.id);
    if (idx === -1) throw new Error("Server entry not found");

    state.servers[idx] = {
      ...state.servers[idx],
      ...normalized,
      updatedAt: now
    };
    saveServersState(instanceId, state);
    return state.servers[idx];
  }

  // Create path for a new entry.
  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${now}-${Math.random().toString(16).slice(2)}`;

  const created: InstanceServerEntry = {
    id,
    ...normalized,
    linkedProfile: null,
    createdAt: now,
    updatedAt: now
  };

  state.servers.unshift(created);
  if (!state.preferredServerId) state.preferredServerId = created.id;
  saveServersState(instanceId, state);
  return created;
}

export function removeInstanceServer(instanceId: string, serverId: string) {
  const state = loadServersState(instanceId);
  state.servers = state.servers.filter((x) => x.id !== serverId);
  if (state.preferredServerId === serverId) {
    state.preferredServerId = state.servers[0]?.id ?? null;
  }
  saveServersState(instanceId, state);
  return state;
}

export function setPreferredInstanceServer(instanceId: string, serverId: string | null) {
  const state = loadServersState(instanceId);
  if (serverId && !state.servers.some((x) => x.id === serverId)) {
    throw new Error("Server entry not found");
  }
  state.preferredServerId = serverId;
  saveServersState(instanceId, state);
  return state;
}

export function exportServerProfile(instanceId: string, serverId: string, outZipPath: string) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const servers = loadServersState(instanceId);
  const server = servers.servers.find((x) => x.id === serverId);
  if (!server) throw new Error("Server entry not found");

  const modsState = loadModsState(instanceId);
  const packsState = loadPacksState(instanceId);

  const manifest: ServerProfileManifest = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    server: {
      name: server.name,
      address: server.address,
      notes: server.notes
    },
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
    enabledMods: Object.entries(modsState.enabled)
      .filter(([, enabled]) => !!enabled)
      .map(([id]) => id),
    enabledPacks: Object.entries(packsState.enabled)
      .filter(([, enabled]) => !!enabled)
      .map(([id]) => id)
  };

  const zip = new AdmZip();
  // Manifest + lockfile make imports reproducible across machines.
  zip.addFile("server-profile.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));
  const lockfile = generateInstanceLockfile(instanceId, { write: true });
  zip.addFile("instance.lock.json", Buffer.from(JSON.stringify(lockfile, null, 2), "utf8"));

  const cfgDir = path.join(getInstanceDir(instanceId), "config");
  // Include config folder to preserve server-specific tweaks.
  addDirToZip(zip, cfgDir, "config");

  fs.mkdirSync(path.dirname(outZipPath), { recursive: true });
  zip.writeZip(outZipPath);
  return outZipPath;
}

function parseServerProfile(zip: AdmZip): ServerProfileManifest {
  const entry = zip.getEntry("server-profile.json");
  if (!entry) throw new Error("Import failed: missing server-profile.json");

  let parsed: any;
  try {
    parsed = JSON.parse(zip.readAsText(entry));
  } catch {
    throw new Error("Import failed: server-profile.json is invalid JSON");
  }

  if (parsed?.schemaVersion !== 1) throw new Error("Import failed: unsupported profile schema");
  if (!parsed?.server?.name || !parsed?.server?.address) {
    throw new Error("Import failed: profile is missing server data");
  }
  if (!parsed?.instance?.mcVersion || !parsed?.instance?.loader) {
    throw new Error("Import failed: profile is missing instance requirements");
  }

  return parsed as ServerProfileManifest;
}

function readOptionalLockfileFromZip(zip: AdmZip): InstanceLockfile | null {
  const entry = zip.getEntry("instance.lock.json");
  if (!entry) return null;
  try {
    return JSON.parse(zip.readAsText(entry)) as InstanceLockfile;
  } catch {
    return null;
  }
}

export async function importServerProfile(instanceId: string, zipPath: string) {
  if (!fs.existsSync(zipPath)) throw new Error("Import failed: zip file not found");

  const zip = new AdmZip(zipPath);
  const manifest = parseServerProfile(zip);
  const lockfile = readOptionalLockfileFromZip(zip);

  updateInstance(instanceId, {
    mcVersion: manifest.instance.mcVersion,
    loader: manifest.instance.loader,
    fabricLoaderVersion: manifest.instance.fabricLoaderVersion,
    quiltLoaderVersion: manifest.instance.quiltLoaderVersion,
    forgeVersion: manifest.instance.forgeVersion,
    neoforgeVersion: manifest.instance.neoforgeVersion,
    memoryMb: Number(manifest.instance.memoryMb || 4096),
    jvmArgsOverride: manifest.instance.jvmArgsOverride ?? null,
    instancePreset: manifest.instance.instancePreset ?? null
  });

  const modsState = loadModsState(instanceId);
  const packsState = loadPacksState(instanceId);

  // Mirror import selection onto the local enabled map.
  const enabledModsSet = new Set(manifest.enabledMods || []);
  for (const key of Object.keys(modsState.enabled)) {
    modsState.enabled[key] = enabledModsSet.has(key);
  }
  for (const key of enabledModsSet) {
    if (!(key in modsState.enabled)) modsState.enabled[key] = true;
  }
  saveModsState(instanceId, modsState);

  const enabledPacksSet = new Set(manifest.enabledPacks || []);
  for (const key of Object.keys(packsState.enabled)) {
    packsState.enabled[key] = enabledPacksSet.has(key);
  }
  for (const key of enabledPacksSet) {
    if (!(key in packsState.enabled)) packsState.enabled[key] = true;
  }
  savePacksState(instanceId, packsState);

  const server = upsertInstanceServer(instanceId, {
    name: manifest.server.name,
    address: manifest.server.address,
    notes: manifest.server.notes
  });
  setPreferredInstanceServer(instanceId, server.id);

  const instanceDir = getInstanceDir(instanceId);
  const cfgRoot = path.join(instanceDir, "config");

  // Restore bundled config files, skipping unsafe/invalid entries.
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    if (!entry.entryName.startsWith("config/")) continue;

    const rel = entry.entryName.slice("config/".length);
    if (!sanitizeArchivePath(rel)) continue;

    const outPath = path.join(cfgRoot, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, entry.getData());
  }

  const out: any = {
    server,
    applied: {
      mcVersion: manifest.instance.mcVersion,
      loader: manifest.instance.loader,
      fabricLoaderVersion: manifest.instance.fabricLoaderVersion ?? null,
      quiltLoaderVersion: manifest.instance.quiltLoaderVersion ?? null,
      forgeVersion: manifest.instance.forgeVersion ?? null,
      neoforgeVersion: manifest.instance.neoforgeVersion ?? null,
      enabledMods: manifest.enabledMods.length,
      enabledPacks: manifest.enabledPacks.length
    }
  };

  if (lockfile) {
    // If present, apply lockfile last so dependency resolution reflects imported content.
    out.lockfile = await applyInstanceLockfile(instanceId, lockfile);
  }

  return out;
}
