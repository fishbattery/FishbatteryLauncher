import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import { createInstance, getInstanceDir, listInstances, type InstanceConfig } from "./instances";
import { installFabricVersion } from "./fabricInstall";
import { installVanillaVersion } from "./vanillaInstall";
import { pickFabricLoader } from "./fabric";

type ModrinthSearchHit = {
  project_id: string;
  title: string;
  description?: string;
  icon_url?: string | null;
  latest_version?: string;
};

type ModrinthSearchResponse = {
  hits: ModrinthSearchHit[];
};

type ModrinthVersionFile = {
  url: string;
  filename: string;
  primary?: boolean;
  hashes?: Record<string, string>;
};

type ModrinthVersion = {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  dependencies?: Array<{ dependency_type: string; project_id?: string; version_id?: string }>;
  files: ModrinthVersionFile[];
};

type MrpackIndex = {
  formatVersion: number;
  game: string;
  versionId: string;
  files: Array<{
    path: string;
    hashes?: Record<string, string>;
    downloads: string[];
  }>;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function sha1(buf: Buffer) {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

function sha512(buf: Buffer) {
  return crypto.createHash("sha512").update(buf).digest("hex");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "FishbatteryLauncher/0.2.1"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "FishbatteryLauncher/0.2.1"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function sanitizeName(name: string) {
  return String(name || "New Instance").replace(/[<>:\"/\\|?*\x00-\x1F]/g, "_").trim() || "New Instance";
}

function uniqueName(base: string) {
  const existing = new Set((listInstances().instances || []).map((x) => String(x.name || "").toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;
  let i = 2;
  while (existing.has(`${base} (${i})`.toLowerCase())) i++;
  return `${base} (${i})`;
}

function safeRelative(rel: string) {
  if (!rel) return false;
  if (path.isAbsolute(rel)) return false;
  const norm = path.normalize(rel);
  return !norm.startsWith("..") && !norm.includes(`..${path.sep}`);
}

function readTextEntry(zip: AdmZip, name: string) {
  const entry = zip.getEntry(name);
  if (!entry) return null;
  return zip.readAsText(entry);
}

function pickLoaderAndVersion(v: ModrinthVersion) {
  const depMap = new Map<string, string>();
  for (const d of v.dependencies || []) {
    if (d.dependency_type !== "required") continue;
    if (d.project_id && d.version_id) depMap.set(d.project_id, d.version_id);
  }

  // common project IDs for loader deps in Modrinth metadata
  const fabricLoaderProject = "P7dR8mSH";
  const minecraftVersion = v.game_versions?.[0] || "latest";
  if (v.loaders?.includes("fabric") || depMap.has(fabricLoaderProject)) {
    return { loader: "fabric" as const, mcVersion: minecraftVersion };
  }
  return { loader: "vanilla" as const, mcVersion: minecraftVersion };
}

async function resolveVersion(projectId: string, versionId?: string): Promise<ModrinthVersion> {
  if (versionId) {
    return fetchJson<ModrinthVersion>(`https://api.modrinth.com/v2/version/${encodeURIComponent(versionId)}`);
  }

  const versions = await fetchJson<ModrinthVersion[]>(
    `https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`
  );
  if (!versions.length) throw new Error("No versions available for this modpack");

  const sorted = versions
    .filter((x) => Array.isArray(x.files) && x.files.length > 0)
    .sort((a, b) => String(b.version_number).localeCompare(String(a.version_number)));
  if (!sorted.length) throw new Error("No installable version files found");
  return sorted[0];
}

export async function searchModrinthModpacks(query: string, limit = 24) {
  const q = String(query || "").trim();
  const facets = encodeURIComponent('[["project_type:modpack"]]');
  const index = q ? "relevance" : "downloads";
  const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&limit=${Math.max(1, Math.min(50, limit))}&index=${index}&facets=${facets}`;
  const data = await fetchJson<ModrinthSearchResponse>(url);
  return {
    hits: (data.hits || []).map((h) => ({
      projectId: h.project_id,
      title: h.title,
      description: h.description || "",
      iconUrl: h.icon_url || null,
      latestVersionId: h.latest_version || null
    }))
  };
}

export async function installModrinthModpack(opts: {
  projectId: string;
  versionId?: string;
  nameOverride?: string;
  accountId?: string | null;
  memoryMb?: number;
}) {
  const projectId = String(opts.projectId || "").trim();
  if (!projectId) throw new Error("projectId missing");

  const version = await resolveVersion(projectId, opts.versionId);
  const file = version.files.find((f) => f.primary) || version.files[0];
  if (!file?.url) throw new Error("No downloadable modpack file found");

  const loaderMeta = pickLoaderAndVersion(version);
  const instanceId = crypto.randomUUID();
  const instanceName = uniqueName(sanitizeName(opts.nameOverride || version.name || `Modpack ${projectId}`));

  const cfg: Omit<InstanceConfig, "createdAt"> = {
    id: instanceId,
    name: instanceName,
    accountId: opts.accountId ?? null,
    mcVersion: loaderMeta.mcVersion,
    loader: loaderMeta.loader,
    fabricLoaderVersion: undefined,
    memoryMb: Number(opts.memoryMb || 6144),
    instancePreset: "none",
    jvmArgsOverride: null,
    optimizerBackup: null
  };

  if (loaderMeta.loader === "fabric") {
    cfg.fabricLoaderVersion = await pickFabricLoader(loaderMeta.mcVersion, true);
  }

  const created = createInstance(cfg);
  const instanceDir = getInstanceDir(instanceId);
  ensureDir(instanceDir);

  if (created.loader === "fabric") {
    if (!created.fabricLoaderVersion) throw new Error("Unable to resolve Fabric loader for modpack");
    await installFabricVersion(instanceId, created.mcVersion, created.fabricLoaderVersion);
  } else {
    await installVanillaVersion(created.mcVersion);
  }

  const packBuf = await downloadBuffer(file.url);
  if (file.hashes?.sha1) {
    const got = sha1(packBuf);
    if (got.toLowerCase() !== String(file.hashes.sha1).toLowerCase()) {
      throw new Error(`Modpack download hash mismatch (sha1). expected=${file.hashes.sha1} got=${got}`);
    }
  }

  const zip = new AdmZip(packBuf);
  const rawIndex = readTextEntry(zip, "modrinth.index.json");
  if (!rawIndex) throw new Error("Invalid .mrpack: missing modrinth.index.json");

  let index: MrpackIndex;
  try {
    index = JSON.parse(rawIndex) as MrpackIndex;
  } catch {
    throw new Error("Invalid .mrpack: modrinth.index.json parse failed");
  }

  if (!Array.isArray(index.files)) throw new Error("Invalid .mrpack: index files missing");

  for (const f of index.files) {
    if (!f?.path || !safeRelative(f.path)) continue;
    const dl = (f.downloads || [])[0];
    if (!dl) continue;

    const buf = await downloadBuffer(dl);
    if (f.hashes?.sha1) {
      const got = sha1(buf);
      if (got.toLowerCase() !== String(f.hashes.sha1).toLowerCase()) {
        throw new Error(`File hash mismatch for ${f.path}`);
      }
    } else if (f.hashes?.sha512) {
      const got = sha512(buf);
      if (got.toLowerCase() !== String(f.hashes.sha512).toLowerCase()) {
        throw new Error(`File hash mismatch for ${f.path}`);
      }
    }

    const out = path.join(instanceDir, f.path);
    ensureDir(path.dirname(out));
    fs.writeFileSync(out, buf);
  }

  // Apply overrides/client-overrides payload into instance root.
  for (const ent of zip.getEntries()) {
    if (ent.isDirectory) continue;
    const name = ent.entryName.replace(/\\/g, "/");
    const prefix = name.startsWith("overrides/") ? "overrides/" : name.startsWith("client-overrides/") ? "client-overrides/" : "";
    if (!prefix) continue;
    const rel = name.slice(prefix.length);
    if (!safeRelative(rel)) continue;

    const out = path.join(instanceDir, rel);
    ensureDir(path.dirname(out));
    fs.writeFileSync(out, ent.getData());
  }

  return {
    instance: created,
    version: {
      id: version.id,
      name: version.name,
      versionNumber: version.version_number
    }
  };
}
