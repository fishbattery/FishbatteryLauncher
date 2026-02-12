import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { getDataRoot } from "./paths";
import { ensureVanillaInstalled, getVanillaVersionJarPath } from "./vanillaInstall";

type FabricLoaderEntry = { loader: { version: string } };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function rmDirSafe(p: string) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {}
}

function libKey(lib: any): string {
  if (typeof lib?.name === "string") return lib.name;
  const p = lib?.downloads?.artifact?.path;
  if (typeof p === "string") return p;
  return JSON.stringify(lib);
}

function mergeLibraries(vanillaLibs: any[], fabricLibs: any[]) {
  const map = new Map<string, any>();
  for (const l of vanillaLibs ?? []) map.set(libKey(l), l);
  for (const l of fabricLibs ?? []) map.set(libKey(l), l);
  return Array.from(map.values());
}

function parseMavenName(name: string): {
  group: string;
  artifact: string;
  version: string;
  classifier?: string;
  ext: string;
} {
  // group:artifact:version
  // group:artifact:version:classifier
  // group:artifact:version@ext
  // group:artifact:version:classifier@ext
  const [gav, extPart] = name.split("@");
  const ext = extPart?.trim() ? extPart.trim() : "jar";

  const parts = gav.split(":");
  if (parts.length < 3) throw new Error(`Invalid maven name: ${name}`);
  const [group, artifact, version] = parts;
  const classifier = parts.length >= 4 ? parts[3] : undefined;
  return { group, artifact, version, classifier, ext };
}

function mavenJarPath(spec: {
  group: string;
  artifact: string;
  version: string;
  classifier?: string;
  ext: string;
}) {
  const groupPath = spec.group.replace(/\./g, "/");
  const base = `${groupPath}/${spec.artifact}/${spec.version}`;
  const file = spec.classifier
    ? `${spec.artifact}-${spec.version}-${spec.classifier}.${spec.ext}`
    : `${spec.artifact}-${spec.version}.${spec.ext}`;
  return `${base}/${file}`;
}

function chooseRepoBase(lib: any): string {
  const u = typeof lib?.url === "string" ? lib.url : "";
  if (u) return u.endsWith("/") ? u : `${u}/`;

  const name = String(lib?.name ?? "");
  if (name.startsWith("net.fabricmc:") || name.startsWith("net.fabricmc.intermediary:")) {
    return "https://maven.fabricmc.net/";
  }
  if (name.startsWith("com.mojang:") || name.startsWith("net.minecraft:")) {
    return "https://libraries.minecraft.net/";
  }
  return "https://repo1.maven.org/maven2/";
}

function normalizeLibraryDownloads(lib: any): any {
  // If downloads already present, keep it.
  if (lib?.downloads?.artifact?.path && lib?.downloads?.artifact?.url) return lib;

  if (typeof lib?.name !== "string") return lib;

  let parsed: ReturnType<typeof parseMavenName>;
  try {
    parsed = parseMavenName(lib.name);
  } catch {
    return lib;
  }

  const relPath = mavenJarPath(parsed);
  const base = chooseRepoBase(lib);
  const url = `${base}${relPath}`;

  lib.downloads = lib.downloads ?? {};
  lib.downloads.artifact = lib.downloads.artifact ?? {};
  lib.downloads.artifact.path = relPath;
  lib.downloads.artifact.url = url;

  return lib;
}

async function downloadIfMissing(url: string, outPath: string) {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) return;
  const buf = await downloadToBuffer(url);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, buf);
}

function fixFabricMcEmuSpacing(profile: any) {
  // Some bad merges / templates end up with "-DFabricMcEmu= net.minecraft.client.main.Main "
  // Normalize it if present.
  const jvm = profile?.arguments?.jvm;
  if (!Array.isArray(jvm)) return;

  profile.arguments.jvm = jvm.map((a: any) => {
    if (typeof a !== "string") return a;
    if (a.startsWith("-DFabricMcEmu=")) {
      // strip spaces around value
      const [, vRaw] = a.split("=", 2);
      const v = (vRaw ?? "").trim();
      return `-DFabricMcEmu=${v}`;
    }
    return a;
  });
}

function mustExist(p: string, label: string) {
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    throw new Error(`Fabric install incomplete: missing ${label} at ${p}`);
  }
}

export async function installFabric(mcVersion: string, loaderVersion: string) {
  const dataRoot = getDataRoot();
  const versionsDir = path.join(dataRoot, "versions");
  const librariesDir = path.join(dataRoot, "libraries");
  ensureDir(versionsDir);
  ensureDir(librariesDir);

  const metaBase = "https://meta.fabricmc.net/v2";

  // Validate loader exists for this MC version
  const loaders = await fetchJson<FabricLoaderEntry[]>(
    `${metaBase}/versions/loader/${encodeURIComponent(mcVersion)}`
  );
  if (!loaders.some((l) => l.loader.version === loaderVersion)) {
    throw new Error(`Fabric loader ${loaderVersion} not available for Minecraft ${mcVersion}`);
  }

  // Ensure vanilla exists (json + jar + asset index)
  const vanillaJsonPath = await ensureVanillaInstalled(mcVersion);
  const vanilla = JSON.parse(fs.readFileSync(vanillaJsonPath, "utf-8"));

  const fabricId = `fabric-loader-${loaderVersion}-${mcVersion}`;
  const fabricDir = path.join(versionsDir, fabricId);
  const outJson = path.join(fabricDir, `${fabricId}.json`);
  const outJar = path.join(fabricDir, `${fabricId}.jar`);

  rmDirSafe(fabricDir);
  ensureDir(fabricDir);

  // Fabric profile json
  const profileUrl = `${metaBase}/versions/loader/${encodeURIComponent(
    mcVersion
  )}/${encodeURIComponent(loaderVersion)}/profile/json`;
  const profile = await fetchJson<any>(profileUrl);

  // Merge libs so your launcher doesn't depend on inheritsFrom semantics
  const vanillaLibs = Array.isArray(vanilla.libraries) ? vanilla.libraries : [];
  const fabricLibs = Array.isArray(profile.libraries) ? profile.libraries : [];

  profile.libraries = mergeLibraries(vanillaLibs, fabricLibs).map((lib: any) =>
    normalizeLibraryDownloads(lib)
  );

  // Fix any bad FabricMcEmu arg formatting if it exists
  fixFabricMcEmuSpacing(profile);

  const finalProfile: any = {
    ...profile,
    id: fabricId,
    inheritsFrom: mcVersion,
    jar: mcVersion,
    type: "release",
  };

  // Critical vanilla fields (assets, downloads)
  if (!finalProfile.assetIndex && vanilla.assetIndex) finalProfile.assetIndex = vanilla.assetIndex;
  if (!finalProfile.assets && vanilla.assets) finalProfile.assets = vanilla.assets;

  if (!finalProfile.downloads && vanilla.downloads) finalProfile.downloads = vanilla.downloads;
  if (!finalProfile.downloads?.client && vanilla.downloads?.client) {
    finalProfile.downloads = finalProfile.downloads ?? {};
    finalProfile.downloads.client = vanilla.downloads.client;
  }

  fs.writeFileSync(outJson, JSON.stringify(finalProfile, null, 2), "utf-8");

  // Version jar: copy vanilla jar (this is normal for Fabric profile versions)
  const vanillaJarPath = getVanillaVersionJarPath(mcVersion);
  mustExist(vanillaJarPath, `vanilla ${mcVersion} client jar`);
  fs.copyFileSync(vanillaJarPath, outJar);

  // Download ALL libraries; do NOT swallow errors (otherwise you "install" Fabric without Fabric)
  for (const lib of finalProfile.libraries ?? []) {
    const artifact = lib?.downloads?.artifact;
    if (artifact?.path && artifact?.url) {
      const out = path.join(librariesDir, artifact.path);
      await downloadIfMissing(artifact.url, out);
    }

    // natives classifiers
    if (lib?.downloads?.classifiers) {
      for (const classifier of Object.values<any>(lib.downloads.classifiers)) {
        if (!classifier?.path || !classifier?.url) continue;
        const out = path.join(librariesDir, classifier.path);
        await downloadIfMissing(classifier.url, out);
      }
    }
  }

  // Verify Fabric core artifacts exist (the stuff that makes it “real Fabric”)
  const fabricLoaderLib = path.join(
    librariesDir,
    `net/fabricmc/fabric-loader/${loaderVersion}/fabric-loader-${loaderVersion}.jar`
  );
  const intermediaryLib = path.join(
    librariesDir,
    `net/fabricmc/intermediary/${mcVersion}/intermediary-${mcVersion}.jar`
  );

  mustExist(fabricLoaderLib, `fabric-loader ${loaderVersion}`);
  mustExist(intermediaryLib, `intermediary ${mcVersion}`);

  return true;
}

export async function installFabricVersion(_instanceId: string, mcVersion: string, loaderVersion: string) {
  return installFabric(mcVersion, loaderVersion);
}
