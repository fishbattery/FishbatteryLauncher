// src/main/vanillaInstall.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fetch from "node-fetch";
import { getDataRoot } from "./paths";

type ManifestVersion = { id: string; url: string; type: string };
type VersionManifest = { latest: any; versions: ManifestVersion[] };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function sha1(buf: Buffer) {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

function fileExists(p: string) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function getVanillaVersionDir(mcVersion: string) {
  const dataRoot = getDataRoot();
  return path.join(dataRoot, "versions", mcVersion);
}

export function getVanillaVersionJsonPath(mcVersion: string) {
  return path.join(getVanillaVersionDir(mcVersion), `${mcVersion}.json`);
}

export function getVanillaVersionJarPath(mcVersion: string) {
  return path.join(getVanillaVersionDir(mcVersion), `${mcVersion}.jar`);
}

async function downloadAssetObjectsFromIndex(assetIndexPath: string) {
  // asset index format:
  // { virtual?: boolean, map_to_resources?: boolean, objects: { "minecraft/sounds.json": { hash, size }, ... } }
  const raw = fs.readFileSync(assetIndexPath, "utf-8");
  const idx = JSON.parse(raw);
  const objects = idx?.objects ?? {};

  const dataRoot = getDataRoot();
  const objectsDir = path.join(dataRoot, "assets", "objects");
  ensureDir(objectsDir);

  const entries = Object.entries<any>(objects).filter(([, o]) => typeof o?.hash === "string");
  if (entries.length === 0) return;

  const concurrency = 16;
  let i = 0;

  async function workerObjects() {
    while (true) {
      const cur = i++;
      if (cur >= entries.length) return;

      const [, obj] = entries[cur];
      const hash: string = obj.hash;
      const sub = hash.slice(0, 2);
      const outPath = path.join(objectsDir, sub, hash);

      if (fileExists(outPath) && fs.statSync(outPath).size > 0) continue;

      const url = `https://resources.download.minecraft.net/${sub}/${hash}`;
      const buf = await downloadToBuffer(url);

      const h = sha1(buf);
      if (h !== hash) {
        throw new Error(`Asset sha1 mismatch: expected=${hash} got=${h}`);
      }

      ensureDir(path.dirname(outPath));
      fs.writeFileSync(outPath, buf);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, () => workerObjects());
  await Promise.all(workers);

  // ✅ Some versions require a "virtual" assets tree (otherwise you get tons of "Missing sound for event" warnings).
  if (idx?.virtual) {
    await buildVirtualAssetsTree(entries, objectsDir, path.join(dataRoot, "assets", "virtual", "legacy"));
  }

  // Older behavior: map_to_resources -> copy to assets/resources (rarely needed, but harmless)
  if (idx?.map_to_resources) {
    await buildVirtualAssetsTree(entries, objectsDir, path.join(dataRoot, "assets", "resources"));
  }
}

async function buildVirtualAssetsTree(
  entries: Array<[string, any]>,
  objectsDir: string,
  outRoot: string
) {
  ensureDir(outRoot);

  const concurrency = 16;
  let i = 0;

  async function workerVirtual() {
    while (true) {
      const cur = i++;
      if (cur >= entries.length) return;

      const [key, obj] = entries[cur];
      const hash: string = obj.hash;
      const sub = hash.slice(0, 2);
      const src = path.join(objectsDir, sub, hash);
      const dst = path.join(outRoot, key.replace(/\\/g, "/"));

      ensureDir(path.dirname(dst));

      if (fileExists(dst) && fs.statSync(dst).size > 0) continue;
      if (!fileExists(src) || fs.statSync(src).size === 0) continue;

      // Prefer hardlink where possible; otherwise copy.
      try {
        fs.linkSync(src, dst);
      } catch {
        fs.copyFileSync(src, dst);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, () => workerVirtual());
  await Promise.all(workers);
}

/**
 * Installs the vanilla version JSON + client jar + asset index + asset objects.
 * Returns the parsed version JSON object.
 */
export async function installVanillaVersion(
  mcVersion: string,
  opts: { downloadClientJar?: boolean; downloadAssetIndex?: boolean; downloadAssetObjects?: boolean } = {}
): Promise<any> {
  const downloadClientJar = opts.downloadClientJar ?? true;
  const downloadAssetIndex = opts.downloadAssetIndex ?? true;
  const downloadAssetObjects = opts.downloadAssetObjects ?? true;

  const dataRoot = getDataRoot();
  ensureDir(path.join(dataRoot, "versions"));
  ensureDir(path.join(dataRoot, "assets", "indexes"));
  ensureDir(path.join(dataRoot, "assets", "objects"));

  const manifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
  const manifest = await fetchJson<VersionManifest>(manifestUrl);

  const entry = manifest.versions.find((v) => v.id === mcVersion);
  if (!entry) throw new Error(`Unknown Minecraft version: ${mcVersion}`);

  const versionJson = await fetchJson<any>(entry.url);

  const vDir = getVanillaVersionDir(mcVersion);
  const vJsonPath = getVanillaVersionJsonPath(mcVersion);
  ensureDir(vDir);
  fs.writeFileSync(vJsonPath, JSON.stringify(versionJson, null, 2), "utf-8");

  if (downloadClientJar) {
    const client = versionJson?.downloads?.client;
    if (client?.url) {
      const jarPath = getVanillaVersionJarPath(mcVersion);
      if (!fileExists(jarPath) || fs.statSync(jarPath).size === 0) {
        const buf = await downloadToBuffer(client.url);

        if (client.sha1) {
          const h = sha1(buf);
          if (h !== client.sha1) {
            throw new Error(`Client jar sha1 mismatch for ${mcVersion}. expected=${client.sha1} got=${h}`);
          }
        }

        fs.writeFileSync(jarPath, buf);
      }
    }
  }

  let assetIndexPath: string | null = null;
  if (downloadAssetIndex) {
    const ai = versionJson?.assetIndex;
    if (ai?.id && ai?.url) {
      const assetsIndexesDir = path.join(dataRoot, "assets", "indexes");
      ensureDir(assetsIndexesDir);

      assetIndexPath = path.join(assetsIndexesDir, `${ai.id}.json`);
      if (!fileExists(assetIndexPath) || fs.statSync(assetIndexPath).size === 0) {
        const buf = await downloadToBuffer(ai.url);

        if (ai.sha1) {
          const h = sha1(buf);
          if (h !== ai.sha1) {
            throw new Error(`Asset index sha1 mismatch for ${mcVersion}. expected=${ai.sha1} got=${h}`);
          }
        }

        fs.writeFileSync(assetIndexPath, buf);
      }
    }
  }

  if (downloadAssetObjects && assetIndexPath && fileExists(assetIndexPath)) {
    await downloadAssetObjectsFromIndex(assetIndexPath);
  }

  return versionJson;
}

export async function ensureVanillaInstalled(mcVersion: string): Promise<string> {
  const jsonPath = getVanillaVersionJsonPath(mcVersion);
  const jarPath = getVanillaVersionJarPath(mcVersion);

  const needInstall = !fileExists(jsonPath) || !fileExists(jarPath) || fs.statSync(jarPath).size === 0;
  if (needInstall) {
    await installVanillaVersion(mcVersion, {
      downloadClientJar: true,
      downloadAssetIndex: true,
      downloadAssetObjects: true
    });
  } else {
    await installVanillaVersion(mcVersion, {
      downloadClientJar: false,
      downloadAssetIndex: true,
      downloadAssetObjects: true
    });
  }

  if (!fileExists(jsonPath)) {
    throw new Error(`Vanilla install finished but version json still missing: ${jsonPath}`);
  }
  return jsonPath;
}
