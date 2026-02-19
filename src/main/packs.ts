import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PACK_CATALOG, CatalogPack } from "./modrinthPackCatalog";
import { getInstanceDir } from "./instances";
import { readJsonFile, writeJsonFile } from "./store";
import { getPackCacheDir } from "./paths";
import { downloadBuffer, resolveLatestModrinth } from "./modrinth";

// Packs service overview:
// - Manages resourcepack/shaderpack catalog state per instance (`packs-state.json`).
// - Resolves latest compatible files from Modrinth.
// - Installs files into instance `resourcepacks` / `shaderpacks` folders.
// - Supports immediate enable/disable and refresh synchronization.

export type PacksState = {
  enabled: Record<string, boolean>;
  resolved: Record<string, ResolvedPack>;
};

export type ResolvedPack = {
  catalogId: string;
  kind: "resourcepack" | "shaderpack";
  enabled: boolean;
  status: "ok" | "unavailable" | "error";
  mcVersion: string;
  versionName?: string;
  upstreamFileName?: string;
  fileName?: string;
  downloadUrl?: string;
  sha1?: string;
  sha512?: string;
  error?: string;
  lastCheckedAt?: number;
};

function getPacksStatePath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "packs-state.json");
}

function defaultState(): PacksState {
  const enabled: Record<string, boolean> = {};
  for (const p of PACK_CATALOG) enabled[p.id] = !!p.required;
  return { enabled, resolved: {} };
}

export function loadPacksState(instanceId: string): PacksState {
  return readJsonFile(getPacksStatePath(instanceId), defaultState());
}

export function savePacksState(instanceId: string, state: PacksState) {
  writeJsonFile(getPacksStatePath(instanceId), state);
}

function sha1Of(buf: Buffer) {
  const h = crypto.createHash("sha1");
  h.update(buf);
  return h.digest("hex");
}

function ensurePackDir(instanceId: string, kind: "resourcepack" | "shaderpack") {
  const folder = kind === "resourcepack" ? "resourcepacks" : "shaderpacks";
  const dir = path.join(getInstanceDir(instanceId), folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanOldFilesForCatalogId(dir: string, catalogId: string) {
  // remove files we previously placed for this catalogId
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(catalogId + "__") && (f.endsWith(".zip") || f.endsWith(".zip.disabled"))) {
      try { fs.rmSync(path.join(dir, f)); } catch {}
    }
  }
}

function targetFileName(catalogId: string, upstreamFileName: string, enabled: boolean) {
  const safe = upstreamFileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const base = `${catalogId}__${safe}`;
  return enabled ? base : base + ".disabled";
}

export async function setPackEnabled(instanceId: string, packId: string, enabled: boolean) {
  const state = loadPacksState(instanceId);
  const pack = PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) throw new Error("Unknown pack");
  if (pack.required) enabled = true;

  state.enabled[packId] = enabled;
  savePacksState(instanceId, state);

  // Apply immediately if already resolved.
  const res = state.resolved?.[packId];
  if (!res || res.status !== "ok") return;

  const dir = ensurePackDir(instanceId, pack.kind);
  if (!enabled) {
    cleanOldFilesForCatalogId(dir, packId);
    return;
  }

  const upstream =
    res.upstreamFileName ??
    (res.fileName
      ? res.fileName
          .replace(new RegExp(`^${packId}__`), "")
          .replace(/\.disabled$/, "")
      : null);

  if (!upstream) return;

  const cacheDir = getPackCacheDir();
  fs.mkdirSync(cacheDir, { recursive: true });
  const cacheName = res.sha1 ? `${packId}-${res.sha1}.zip` : null;
  const cachedPath = cacheName ? path.join(cacheDir, cacheName) : null;

  cleanOldFilesForCatalogId(dir, packId);
  const target = path.join(dir, targetFileName(packId, upstream, true));

  if (cachedPath && fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 0) {
    fs.copyFileSync(cachedPath, target);
    return;
  }

  // Fallback: rename any existing file we previously installed
  const candidates = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const any = candidates.find((f) => f.startsWith(packId + "__"));
  if (any) {
    try {
      fs.renameSync(path.join(dir, any), target);
    } catch {
      // ignore
    }
  }
}

export function listPacks(instanceId: string) {
  const state = loadPacksState(instanceId);

  // Ensure keys exist for new catalog entries
  for (const p of PACK_CATALOG) {
    if (state.enabled[p.id] === undefined) state.enabled[p.id] = !!p.required;
  }
  savePacksState(instanceId, state);

  const items = PACK_CATALOG.map((p) => {
    const resolved = state.resolved?.[p.id];
    return {
      id: p.id,
      name: p.name,
      kind: p.kind,
      required: !!p.required,
      enabled: !!state.enabled[p.id],
      status: resolved?.status ?? "unavailable",
      versionName: resolved?.versionName ?? null,
      error: resolved?.error ?? null
    };
  });

  return { items };
}

export async function refreshPacksForInstance(opts: {
  instanceId: string;
  mcVersion: string;
}) {
  const { instanceId, mcVersion } = opts;

  const state = loadPacksState(instanceId);

  // Ensure enabled keys exist
  for (const p of PACK_CATALOG) {
    if (state.enabled[p.id] === undefined) state.enabled[p.id] = !!p.required;
  }

  const cacheDir = getPackCacheDir();
  fs.mkdirSync(cacheDir, { recursive: true });

  for (const pack of PACK_CATALOG) {
    const enabled = !!state.enabled[pack.id] || !!pack.required;
    const dir = ensurePackDir(instanceId, pack.kind);

    const base: ResolvedPack = {
      catalogId: pack.id,
      kind: pack.kind,
      enabled,
      status: "unavailable",
      mcVersion,
      lastCheckedAt: Date.now()
    };

    if (!enabled) {
      cleanOldFilesForCatalogId(dir, pack.id);
      state.resolved[pack.id] = { ...base, status: "unavailable" };
      continue;
    }

    try {
      const resolved = await resolveLatestModrinth({
        projectId: pack.source.projectId,
        mcVersion
        // IMPORTANT: no loader for packs
      });

      if (!resolved) {
        state.resolved[pack.id] = { ...base, status: "unavailable" };
        continue;
      }

      // Download into cache (verify sha1 if present)
      const buf = await downloadBuffer(resolved.url);

      if (resolved.sha1) {
        const got = sha1Of(buf);
        if (got.toLowerCase() !== resolved.sha1.toLowerCase()) {
          throw new Error(`SHA1 mismatch (expected ${resolved.sha1}, got ${got})`);
        }
      }

      const cacheName = resolved.sha1 ? `${pack.id}-${resolved.sha1}.zip` : `${pack.id}-${Date.now()}.zip`;
      const cachedPath = path.join(cacheDir, cacheName);
      fs.writeFileSync(cachedPath, buf);

      cleanOldFilesForCatalogId(dir, pack.id);

      const placedName = targetFileName(pack.id, resolved.fileName, true);
      const placedPath = path.join(dir, placedName);
      fs.copyFileSync(cachedPath, placedPath);

      state.resolved[pack.id] = {
        ...base,
        status: "ok",
        versionName: resolved.versionName,
        upstreamFileName: resolved.fileName,
        fileName: placedName,
        downloadUrl: resolved.url,
        sha1: resolved.sha1,
        sha512: resolved.sha512
      };
    } catch (err: any) {
      state.resolved[pack.id] = {
        ...base,
        status: "error",
        error: String(err?.message ?? err)
      };
    }
  }

  savePacksState(instanceId, state);
  return listPacks(instanceId);
}
