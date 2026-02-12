import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { CATALOG, CatalogMod } from "./modrinthCatalog";
import { getInstanceDir, getModsStatePath } from "./instances";
import { readJsonFile, writeJsonFile } from "./store";
import { getModCacheDir } from "./paths";
import { downloadBuffer, resolveLatestModrinth } from "./modrinth";

export type ModsState = {
  enabled: Record<string, boolean>;
  resolved: Record<string, ResolvedMod>;
};

export type ResolvedMod = {
  catalogId: string;
  enabled: boolean;
  status: "ok" | "unavailable" | "error";
  mcVersion: string;
  loader: "fabric";
  versionName?: string;
  upstreamFileName?: string; // upstream file name from Modrinth
  fileName?: string; // file name we placed in /mods (prefixed, may include .disabled)
  downloadUrl?: string;
  sha1?: string;
  sha512?: string;
  error?: string;
  lastCheckedAt?: number;
};

function defaultState(): ModsState {
  const enabled: Record<string, boolean> = {};
  for (const m of CATALOG) enabled[m.id] = !!m.required;
  return { enabled, resolved: {} };
}

export function loadModsState(instanceId: string): ModsState {
  const p = getModsStatePath(instanceId);
  return readJsonFile(p, defaultState());
}

export function saveModsState(instanceId: string, state: ModsState) {
  const p = getModsStatePath(instanceId);
  writeJsonFile(p, state);
}

function sha1Of(buf: Buffer) {
  const h = crypto.createHash("sha1");
  h.update(buf);
  return h.digest("hex");
}

function ensureModsDir(instanceId: string) {
  const dir = path.join(getInstanceDir(instanceId), "mods");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanOldFilesForCatalogId(modsDir: string, catalogId: string) {
  // conservative cleanup: remove files that start with "<catalogId>__" (our naming convention)
  if (!fs.existsSync(modsDir)) return;
  for (const f of fs.readdirSync(modsDir)) {
    if (f.startsWith(catalogId + "__") && (f.endsWith(".jar") || f.endsWith(".jar.disabled"))) {
      try { fs.rmSync(path.join(modsDir, f)); } catch {}
    }
  }
}

function cleanAutoDependencyFiles(modsDir: string) {
  if (!fs.existsSync(modsDir)) return;
  for (const f of fs.readdirSync(modsDir)) {
    if (f.startsWith("dep__") && f.endsWith(".jar")) {
      try { fs.rmSync(path.join(modsDir, f)); } catch {}
    }
  }
}

function readFabricModIdFromJar(filePath: string): string | null {
  try {
    const zip = new AdmZip(filePath);
    const e = zip.getEntry("fabric.mod.json");
    if (!e) return null;
    const parsed = JSON.parse(zip.readAsText(e)) as any;
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

function collectInstalledModIds(modsDir: string): Set<string> {
  const out = new Set<string>();
  if (!fs.existsSync(modsDir)) return out;
  for (const f of fs.readdirSync(modsDir)) {
    if (!f.endsWith(".jar")) continue;
    const id = readFabricModIdFromJar(path.join(modsDir, f));
    if (id) out.add(id);
  }
  return out;
}

function targetFileName(catalogId: string, upstreamFileName: string, enabled: boolean) {
  // Keep upstream filename for readability, but prefix with our id so we can clean reliably.
  const safe = upstreamFileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const base = `${catalogId}__${safe}`;
  return enabled ? base : base + ".disabled";
}

export async function setModEnabled(instanceId: string, modId: string, enabled: boolean) {
  const state = loadModsState(instanceId);
  const mod = CATALOG.find((m) => m.id === modId);
  if (!mod) throw new Error("Unknown mod");
  if (mod.required) enabled = true;

  state.enabled[modId] = enabled;
  saveModsState(instanceId, state);

  // Apply immediately if we already resolved a file for this mod.
  // (Previously, toggles only changed JSON and you had to hit "Update Mods" to see any effect.)
  try {
    const res = state.resolved?.[modId];
    if (!res || res.status !== "ok") return;

    const modsDir = ensureModsDir(instanceId);
    if (!enabled) {
      cleanOldFilesForCatalogId(modsDir, modId);
      return;
    }

    // Determine upstream filename for clean naming.
    const upstream =
      res.upstreamFileName ??
      (res.fileName
        ? res.fileName
            .replace(new RegExp(`^${modId}__`), "")
            .replace(/\.disabled$/, "")
        : null);

    if (!upstream) return;

    // If we have the cached jar, copy it. Otherwise, fall back to renaming the current file if present.
    const cacheDir = getModCacheDir();
    fs.mkdirSync(cacheDir, { recursive: true });
    const cacheName = res.sha1 ? `${modId}-${res.sha1}.jar` : null;
    const cachedPath = cacheName ? path.join(cacheDir, cacheName) : null;

    cleanOldFilesForCatalogId(modsDir, modId);

    const target = path.join(modsDir, targetFileName(modId, upstream, true));

    if (cachedPath && fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 0) {
      fs.copyFileSync(cachedPath, target);
      return;
    }

    // Try to locate an existing file for this mod in /mods (maybe from a previous refresh).
    const candidates = fs.existsSync(modsDir) ? fs.readdirSync(modsDir) : [];
    const any = candidates.find((f) => f.startsWith(modId + "__") && (f.endsWith(".jar") || f.endsWith(".jar.disabled")));
    if (any) {
      fs.renameSync(path.join(modsDir, any), target);
      return;
    }
  } catch {
    // If anything goes wrong, the user can still hit "Update Mods".
  }
}

export function listMods(instanceId: string) {
  const state = loadModsState(instanceId);
  return CATALOG.map((m) => {
    const res = state.resolved[m.id];
    const enabled = m.required ? true : !!state.enabled[m.id];
    const status = res?.status ?? "unavailable";
    return {
      id: m.id,
      name: m.name,
      required: !!m.required,
      enabled,
      status,
      resolved: res ?? null
    };
  });
}

export async function refreshModsForInstance(opts: { instanceId: string; mcVersion: string; loader: "fabric"; }) {
  const instanceId = opts.instanceId;
  const state = loadModsState(instanceId);
  const modsDir = ensureModsDir(instanceId);
  const cacheDir = getModCacheDir();
  fs.mkdirSync(cacheDir, { recursive: true });

  const resolved: Record<string, ResolvedMod> = {};
  const dependencyQueue: string[] = [];

  for (const mod of CATALOG) {
    const shouldEnable = mod.required ? true : !!state.enabled[mod.id];
    if (!shouldEnable) {
      resolved[mod.id] = {
        catalogId: mod.id,
        enabled: false,
        status: "unavailable",
        mcVersion: opts.mcVersion,
        loader: "fabric",
        lastCheckedAt: Date.now()
      };
      cleanOldFilesForCatalogId(modsDir, mod.id);
      continue;
    }

    try {
      const r = await resolveLatestModrinth({
        projectId: mod.source.projectId,
        mcVersion: opts.mcVersion,
        loader: "fabric"
      });

      if (!r) {
        resolved[mod.id] = {
          catalogId: mod.id,
          enabled: false,
          status: "unavailable",
          mcVersion: opts.mcVersion,
          loader: "fabric",
          lastCheckedAt: Date.now()
        };
        // ensure no active file
        cleanOldFilesForCatalogId(modsDir, mod.id);
        continue;
      }

      const fileKey = r.sha1 ?? "";
      const cacheName = fileKey ? `${mod.id}-${fileKey}.jar` : `${mod.id}-${r.fileName}`;
      const cachedPath = path.join(cacheDir, cacheName);

      if (!fs.existsSync(cachedPath)) {
        const buf = await downloadBuffer(r.url);
        if (r.sha1) {
          const got = sha1Of(buf);
          if (got !== r.sha1) throw new Error(`SHA1 mismatch for ${mod.id}`);
        }
        fs.writeFileSync(cachedPath, buf);
      }

      // clean older versions for this mod installed by us
      cleanOldFilesForCatalogId(modsDir, mod.id);

      const target = path.join(modsDir, targetFileName(mod.id, r.fileName, true));
      fs.copyFileSync(cachedPath, target);

      resolved[mod.id] = {
        catalogId: mod.id,
        enabled: shouldEnable,
        status: "ok",
        mcVersion: opts.mcVersion,
        loader: "fabric",
        versionName: r.versionName,
        upstreamFileName: r.fileName,
        fileName: path.basename(target),
        downloadUrl: r.url,
        sha1: r.sha1,
        sha512: r.sha512,
        lastCheckedAt: Date.now()
      };

      for (const depProjectId of r.requiredProjectIds || []) {
        dependencyQueue.push(depProjectId);
      }
    } catch (e: any) {
      resolved[mod.id] = {
        catalogId: mod.id,
        enabled: false,
        status: "error",
        mcVersion: opts.mcVersion,
        loader: "fabric",
        error: String(e?.message ?? e),
        lastCheckedAt: Date.now()
      };
      cleanOldFilesForCatalogId(modsDir, mod.id);
    }
  }

  // Auto-install required dependencies declared by resolved mods on Modrinth.
  cleanAutoDependencyFiles(modsDir);
  const installedIds = collectInstalledModIds(modsDir);
  const visitedProjects = new Set<string>();

  while (dependencyQueue.length) {
    const depProjectId = String(dependencyQueue.shift() || "").trim();
    if (!depProjectId || visitedProjects.has(depProjectId)) continue;
    visitedProjects.add(depProjectId);

    try {
      const depResolved = await resolveLatestModrinth({
        projectId: depProjectId,
        mcVersion: opts.mcVersion,
        loader: "fabric"
      });
      if (!depResolved) continue;

      const cacheName = depResolved.sha1
        ? `dep-${depProjectId}-${depResolved.sha1}.jar`
        : `dep-${depProjectId}-${depResolved.fileName}`;
      const cachedPath = path.join(cacheDir, cacheName);

      if (!fs.existsSync(cachedPath)) {
        const buf = await downloadBuffer(depResolved.url);
        if (depResolved.sha1) {
          const got = sha1Of(buf);
          if (got !== depResolved.sha1) throw new Error(`SHA1 mismatch for dependency ${depProjectId}`);
        }
        fs.writeFileSync(cachedPath, buf);
      }

      const depModId = readFabricModIdFromJar(cachedPath) ?? depProjectId;
      if (!installedIds.has(depModId)) {
        const safeUpstream = depResolved.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const depTarget = path.join(modsDir, `dep__${depModId}__${safeUpstream}`);
        fs.copyFileSync(cachedPath, depTarget);
        installedIds.add(depModId);
      }

      for (const transitive of depResolved.requiredProjectIds || []) {
        if (!visitedProjects.has(transitive)) dependencyQueue.push(transitive);
      }
    } catch {
      // best effort: dependency metadata can be incomplete for some projects
    }
  }

  state.resolved = resolved;
  saveModsState(instanceId, state);

  return listMods(instanceId);
}
