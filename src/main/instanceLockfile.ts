import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getInstanceDir, listInstances, updateInstance } from "./instances";
import { CATALOG } from "./modrinthCatalog";
import { PACK_CATALOG } from "./modrinthPackCatalog";
import { type ModsState, type ResolvedMod, loadModsState, saveModsState } from "./mods";
import { type PacksState, type ResolvedPack, loadPacksState, savePacksState } from "./packs";
import { getModCacheDir, getPackCacheDir } from "./paths";
import { downloadBuffer } from "./modrinth";
import { readJsonFile, writeJsonFile } from "./store";

// Normalized lockfile artifact entry shared by both mods and packs.
export type LockfileArtifactEntry = {
  id: string;
  category: "mod" | "pack";
  packKind?: "resourcepack" | "shaderpack";
  enabled: boolean;
  required: boolean;
  status: "ok" | "unavailable" | "error";
  source: {
    kind: "modrinth";
    projectId: string;
  };
  mcVersion: string;
  loader?: "fabric";
  versionName?: string;
  upstreamFileName?: string;
  fileName?: string;
  downloadUrl?: string;
  sha1?: string;
  sha512?: string;
};

export type InstanceLockfile = {
  schemaVersion: 1;
  generatedAt: string;
  instance: {
    id: string;
    name: string;
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
  artifacts: LockfileArtifactEntry[];
  notes: string[];
};

export type LockfileDriftIssue = {
  id: string;
  category: "mod" | "pack";
  severity: "warning" | "critical";
  message: string;
};

export type LockfileDriftReport = {
  clean: boolean;
  checkedAt: string;
  lockfilePresent: boolean;
  expectedArtifacts: number;
  stateExpectedArtifacts: number;
  issues: LockfileDriftIssue[];
};

export type ApplyLockfileResult = {
  appliedMods: number;
  appliedPacks: number;
  issues: string[];
  drift: LockfileDriftReport;
};

// Canonical location for per-instance lockfile snapshots.
function lockfilePath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "instance.lock.json");
}

function sha1OfBuffer(buf: Buffer) {
  const h = crypto.createHash("sha1");
  h.update(buf);
  return h.digest("hex");
}

// Hash-on-read helper used by drift verification against files on disk.
function sha1OfFile(filePath: string) {
  const h = crypto.createHash("sha1");
  const data = fs.readFileSync(filePath);
  h.update(data);
  return h.digest("hex");
}

// Ensure mod output folder exists before lockfile application.
function ensureModsDir(instanceId: string) {
  const dir = path.join(getInstanceDir(instanceId), "mods");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Resource/shader packs are split into different Minecraft folders.
function ensurePackDir(instanceId: string, kind: "resourcepack" | "shaderpack") {
  const folder = kind === "resourcepack" ? "resourcepacks" : "shaderpacks";
  const dir = path.join(getInstanceDir(instanceId), folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Keep derived filenames filesystem-safe and deterministic.
function sanitizeName(name: string) {
  return String(name || "").replace(/[^a-zA-Z0-9._-]+/g, "_");
}

// Preserve id-prefixed naming so we can identify managed files later.
function lockfileModFileName(id: string, upstream: string) {
  return `${id}__${sanitizeName(upstream)}`;
}

function lockfilePackFileName(id: string, upstream: string) {
  return `${id}__${sanitizeName(upstream)}`;
}

// Runtime validation guard for imported/loaded lockfiles.
function validateLockfile(input: any): InstanceLockfile {
  if (!input || typeof input !== "object") throw new Error("Invalid lockfile: expected object");
  if (input.schemaVersion !== 1) throw new Error("Invalid lockfile: unsupported schemaVersion");
  if (!input.instance || typeof input.instance !== "object") throw new Error("Invalid lockfile: missing instance");
  if (!Array.isArray(input.artifacts)) throw new Error("Invalid lockfile: artifacts must be an array");
  if (!Array.isArray(input.notes)) input.notes = [];
  return input as InstanceLockfile;
}

// Default resolved state materialization for a successfully applied mod entry.
function defaultModResolved(entry: LockfileArtifactEntry, fileName: string): ResolvedMod {
  return {
    catalogId: entry.id,
    enabled: entry.enabled,
    status: "ok",
    mcVersion: entry.mcVersion,
    loader: "fabric",
    versionName: entry.versionName,
    upstreamFileName: entry.upstreamFileName,
    fileName,
    downloadUrl: entry.downloadUrl,
    sha1: entry.sha1,
    sha512: entry.sha512,
    lastCheckedAt: Date.now()
  };
}

// Default resolved state materialization for a successfully applied pack entry.
function defaultPackResolved(entry: LockfileArtifactEntry, fileName: string): ResolvedPack {
  return {
    catalogId: entry.id,
    kind: entry.packKind || "resourcepack",
    enabled: entry.enabled,
    status: "ok",
    mcVersion: entry.mcVersion,
    versionName: entry.versionName,
    upstreamFileName: entry.upstreamFileName,
    fileName,
    downloadUrl: entry.downloadUrl,
    sha1: entry.sha1,
    sha512: entry.sha512,
    lastCheckedAt: Date.now()
  };
}

function getCatalogModProjectId(id: string) {
  return CATALOG.find((m) => m.id === id)?.source?.projectId;
}

function getCatalogPack(id: string) {
  return PACK_CATALOG.find((p) => p.id === id);
}

export function getInstanceLockfilePath(instanceId: string) {
  return lockfilePath(instanceId);
}

export function readInstanceLockfile(instanceId: string): InstanceLockfile | null {
  const p = lockfilePath(instanceId);
  if (!fs.existsSync(p)) return null;
  const raw = readJsonFile<any>(p, null);
  if (!raw) return null;
  return validateLockfile(raw);
}

export function generateInstanceLockfile(instanceId: string, opts?: { write?: boolean }): InstanceLockfile {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const modsState = loadModsState(instanceId);
  const packsState = loadPacksState(instanceId);

  const artifacts: LockfileArtifactEntry[] = [];
  const notes: string[] = [];

  // Capture current mod catalog state (enabled flags + resolved artifact metadata).
  for (const mod of CATALOG) {
    const resolved = modsState.resolved?.[mod.id];
    const enabled = mod.required ? true : !!modsState.enabled[mod.id];
    const entry: LockfileArtifactEntry = {
      id: mod.id,
      category: "mod",
      enabled,
      required: !!mod.required,
      status: resolved?.status ?? "unavailable",
      source: { kind: "modrinth", projectId: mod.source.projectId },
      mcVersion: resolved?.mcVersion ?? inst.mcVersion,
      loader: "fabric",
      versionName: resolved?.versionName,
      upstreamFileName: resolved?.upstreamFileName,
      fileName: resolved?.fileName,
      downloadUrl: resolved?.downloadUrl,
      sha1: resolved?.sha1,
      sha512: resolved?.sha512
    };
    artifacts.push(entry);

    // Surface non-resolved enabled entries so exports immediately communicate risk.
    if (enabled && entry.status !== "ok") {
      notes.push(`Mod ${mod.id} is enabled but not resolved (${entry.status}).`);
    }
  }

  // Capture current pack catalog state with the same shape used by apply().
  for (const pack of PACK_CATALOG) {
    const resolved = packsState.resolved?.[pack.id];
    const enabled = pack.required ? true : !!packsState.enabled[pack.id];
    const entry: LockfileArtifactEntry = {
      id: pack.id,
      category: "pack",
      packKind: pack.kind,
      enabled,
      required: !!pack.required,
      status: resolved?.status ?? "unavailable",
      source: { kind: "modrinth", projectId: pack.source.projectId },
      mcVersion: resolved?.mcVersion ?? inst.mcVersion,
      versionName: resolved?.versionName,
      upstreamFileName: resolved?.upstreamFileName,
      fileName: resolved?.fileName,
      downloadUrl: resolved?.downloadUrl,
      sha1: resolved?.sha1,
      sha512: resolved?.sha512
    };
    artifacts.push(entry);

    if (enabled && entry.status !== "ok") {
      notes.push(`Pack ${pack.id} is enabled but not resolved (${entry.status}).`);
    }
  }

  const lockfile: InstanceLockfile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    instance: {
      id: inst.id,
      name: inst.name,
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
    artifacts,
    notes
  };

  if (opts?.write !== false) {
    // Persist by default to keep instance folder and exported snapshots aligned.
    writeJsonFile(lockfilePath(instanceId), lockfile);
  }

  return lockfile;
}

export async function applyInstanceLockfile(instanceId: string, lockfileInput: InstanceLockfile): Promise<ApplyLockfileResult> {
  const lockfile = validateLockfile(lockfileInput);

  // Lockfile owns instance runtime config; apply it first so follow-up resolution is coherent.
  updateInstance(instanceId, {
    mcVersion: lockfile.instance.mcVersion,
    loader: lockfile.instance.loader,
    fabricLoaderVersion: lockfile.instance.fabricLoaderVersion,
    quiltLoaderVersion: lockfile.instance.quiltLoaderVersion,
    forgeVersion: lockfile.instance.forgeVersion,
    neoforgeVersion: lockfile.instance.neoforgeVersion,
    memoryMb: Number(lockfile.instance.memoryMb || 4096),
    jvmArgsOverride: lockfile.instance.jvmArgsOverride ?? null,
    instancePreset: lockfile.instance.instancePreset ?? null
  });

  const modsState: ModsState = loadModsState(instanceId);
  const packsState: PacksState = loadPacksState(instanceId);
  const issues: string[] = [];

  const modsDir = ensureModsDir(instanceId);
  const packsResourceDir = ensurePackDir(instanceId, "resourcepack");
  const packsShaderDir = ensurePackDir(instanceId, "shaderpack");
  const modCacheDir = getModCacheDir();
  const packCacheDir = getPackCacheDir();
  fs.mkdirSync(modCacheDir, { recursive: true });
  fs.mkdirSync(packCacheDir, { recursive: true });

  const modEntries = lockfile.artifacts.filter((x) => x.category === "mod");
  const packEntries = lockfile.artifacts.filter((x) => x.category === "pack");

  // Reset managed mod artifacts before rehydrating from lockfile state.
  for (const f of fs.readdirSync(modsDir)) {
    const full = path.join(modsDir, f);
    if (!fs.statSync(full).isFile()) continue;
    if (f.endsWith(".jar") || f.endsWith(".jar.disabled")) {
      try { fs.rmSync(full); } catch {}
    }
  }

  for (const entry of modEntries) {
    const projectId = getCatalogModProjectId(entry.id);
    if (!projectId) continue;

    modsState.enabled[entry.id] = entry.required ? true : !!entry.enabled;

    // Preserve disabled/unavailable states without attempting download/copy.
    if (!entry.enabled || entry.status !== "ok") {
      modsState.resolved[entry.id] = {
        catalogId: entry.id,
        enabled: false,
        status: entry.status,
        mcVersion: lockfile.instance.mcVersion,
        loader: "fabric",
        error: entry.status === "ok" ? undefined : `Locked status: ${entry.status}`,
        lastCheckedAt: Date.now()
      };
      continue;
    }

    if (!entry.downloadUrl || !entry.upstreamFileName) {
      issues.push(`Mod ${entry.id} missing downloadUrl/upstreamFileName in lockfile.`);
      continue;
    }

    const cacheName = entry.sha1 ? `${entry.id}-${entry.sha1}.jar` : `${entry.id}-${sanitizeName(entry.upstreamFileName)}.jar`;
    const cachePath = path.join(modCacheDir, cacheName);

    try {
      // Download only on cache miss; this keeps repeated imports fast and reproducible.
      if (!fs.existsSync(cachePath)) {
        const buf = await downloadBuffer(entry.downloadUrl);
        // Verify lockfile hash before trusting downloaded content.
        if (entry.sha1) {
          const got = sha1OfBuffer(buf);
          if (got.toLowerCase() !== entry.sha1.toLowerCase()) {
            throw new Error(`SHA1 mismatch for ${entry.id} (expected ${entry.sha1}, got ${got})`);
          }
        }
        fs.writeFileSync(cachePath, buf);
      }

      const targetName = entry.fileName || lockfileModFileName(entry.id, entry.upstreamFileName);
      const targetPath = path.join(modsDir, sanitizeName(targetName));
      fs.copyFileSync(cachePath, targetPath);
      modsState.resolved[entry.id] = defaultModResolved(entry, path.basename(targetPath));
    } catch (err: any) {
      // Keep applying remaining entries even when one fails.
      issues.push(`Mod ${entry.id}: ${String(err?.message ?? err)}`);
      modsState.resolved[entry.id] = {
        catalogId: entry.id,
        enabled: false,
        status: "error",
        mcVersion: lockfile.instance.mcVersion,
        loader: "fabric",
        error: String(err?.message ?? err),
        lastCheckedAt: Date.now()
      };
    }
  }

  for (const entry of packEntries) {
    const catalogPack = getCatalogPack(entry.id);
    if (!catalogPack) continue;

    packsState.enabled[entry.id] = entry.required ? true : !!entry.enabled;

    const dir = (entry.packKind || catalogPack.kind) === "shaderpack" ? packsShaderDir : packsResourceDir;

    // Remove prior managed pack files for this catalog id before installing target artifact.
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (!fs.statSync(full).isFile()) continue;
      if (f.startsWith(entry.id + "__") && (f.endsWith(".zip") || f.endsWith(".zip.disabled"))) {
        try { fs.rmSync(full); } catch {}
      }
    }

    if (!entry.enabled || entry.status !== "ok") {
      packsState.resolved[entry.id] = {
        catalogId: entry.id,
        kind: catalogPack.kind,
        enabled: false,
        status: entry.status,
        mcVersion: lockfile.instance.mcVersion,
        error: entry.status === "ok" ? undefined : `Locked status: ${entry.status}`,
        lastCheckedAt: Date.now()
      };
      continue;
    }

    if (!entry.downloadUrl || !entry.upstreamFileName) {
      issues.push(`Pack ${entry.id} missing downloadUrl/upstreamFileName in lockfile.`);
      continue;
    }

    const cacheName = entry.sha1 ? `${entry.id}-${entry.sha1}.zip` : `${entry.id}-${sanitizeName(entry.upstreamFileName)}.zip`;
    const cachePath = path.join(packCacheDir, cacheName);

    try {
      if (!fs.existsSync(cachePath)) {
        const buf = await downloadBuffer(entry.downloadUrl);
        if (entry.sha1) {
          const got = sha1OfBuffer(buf);
          if (got.toLowerCase() !== entry.sha1.toLowerCase()) {
            throw new Error(`SHA1 mismatch for ${entry.id} (expected ${entry.sha1}, got ${got})`);
          }
        }
        fs.writeFileSync(cachePath, buf);
      }

      const targetName = entry.fileName || lockfilePackFileName(entry.id, entry.upstreamFileName);
      const targetPath = path.join(dir, sanitizeName(targetName));
      fs.copyFileSync(cachePath, targetPath);
      packsState.resolved[entry.id] = defaultPackResolved(entry, path.basename(targetPath));
    } catch (err: any) {
      issues.push(`Pack ${entry.id}: ${String(err?.message ?? err)}`);
      packsState.resolved[entry.id] = {
        catalogId: entry.id,
        kind: catalogPack.kind,
        enabled: false,
        status: "error",
        mcVersion: lockfile.instance.mcVersion,
        error: String(err?.message ?? err),
        lastCheckedAt: Date.now()
      };
    }
  }

  saveModsState(instanceId, modsState);
  savePacksState(instanceId, packsState);
  // Store the normalized lockfile that was actually applied.
  writeJsonFile(lockfilePath(instanceId), lockfile);

  // Drift report is computed immediately so callers can react to partial/broken applies.
  const drift = checkInstanceLockfileDrift(instanceId, lockfile);

  return {
    appliedMods: modEntries.filter((x) => x.enabled && x.status === "ok").length,
    appliedPacks: packEntries.filter((x) => x.enabled && x.status === "ok").length,
    issues,
    drift
  };
}

export function checkInstanceLockfileDrift(instanceId: string, lockfileInput?: InstanceLockfile): LockfileDriftReport {
  const lockfile = lockfileInput ? validateLockfile(lockfileInput) : readInstanceLockfile(instanceId);
  const modsState = loadModsState(instanceId);
  const packsState = loadPacksState(instanceId);
  const stateExpectedArtifacts =
    Object.values(modsState.resolved || {}).filter((x) => x?.enabled && x?.status === "ok").length +
    Object.values(packsState.resolved || {}).filter((x) => x?.enabled && x?.status === "ok").length;

  if (!lockfile) {
    const issues: LockfileDriftIssue[] = [];
    // Missing lockfile is only actionable when state indicates managed artifacts should exist.
    if (stateExpectedArtifacts > 0) {
      issues.push({
        id: "lockfile",
        category: "mod",
        severity: "critical",
        message: "Missing instance.lock.json for this instance"
      });
    }
    return {
      clean: issues.length === 0,
      checkedAt: new Date().toISOString(),
      lockfilePresent: false,
      expectedArtifacts: 0,
      stateExpectedArtifacts,
      issues
    };
  }

  const issues: LockfileDriftIssue[] = [];
  const modsDir = ensureModsDir(instanceId);
  const packsResourceDir = ensurePackDir(instanceId, "resourcepack");
  const packsShaderDir = ensurePackDir(instanceId, "shaderpack");
  const expectedArtifacts = lockfile.artifacts.filter((x) => x.enabled && x.status === "ok").length;

  if (expectedArtifacts === 0 && stateExpectedArtifacts > 0) {
    issues.push({
      id: "lockfile",
      category: "mod",
      severity: "warning",
      message: "Lockfile has no enabled resolved artifacts. Refresh lockfile after mods/packs refresh."
    });
  }

  for (const entry of lockfile.artifacts) {
    if (!entry.enabled || entry.status !== "ok") continue;

    const baseDir =
      entry.category === "mod"
        ? modsDir
        : (entry.packKind || "resourcepack") === "shaderpack"
          ? packsShaderDir
          : packsResourceDir;

    const expectedName = entry.fileName;
    // Fallback to id-prefix discovery for older lockfiles with missing/renamed fileName.
    const candidateName =
      expectedName && fs.existsSync(path.join(baseDir, expectedName))
        ? expectedName
        : fs.readdirSync(baseDir).find((f) => f.startsWith(entry.id + "__"));

    if (!candidateName) {
      issues.push({
        id: entry.id,
        category: entry.category,
        severity: "critical",
        message: "Missing artifact on disk"
      });
      continue;
    }

    if (entry.sha1) {
      const full = path.join(baseDir, candidateName);
      try {
        const got = sha1OfFile(full);
        if (got.toLowerCase() !== entry.sha1.toLowerCase()) {
          issues.push({
            id: entry.id,
            category: entry.category,
            severity: "critical",
            message: `Hash mismatch (expected ${entry.sha1}, got ${got})`
          });
        }
      } catch (err: any) {
        issues.push({
          id: entry.id,
          category: entry.category,
          severity: "warning",
          message: `Unable to hash file: ${String(err?.message ?? err)}`
        });
      }
    }
  }

  return {
    clean: issues.length === 0,
    checkedAt: new Date().toISOString(),
    lockfilePresent: true,
    expectedArtifacts,
    stateExpectedArtifacts,
    issues
  };
}
