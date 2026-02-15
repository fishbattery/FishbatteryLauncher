import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import crypto from "node:crypto";
import { InstanceConfig, getInstanceDir } from "./instances";
import { downloadBuffer } from "./modrinth";
import { getDataRoot } from "./paths";

type LoaderWithBridge = "fabric" | "quilt" | "forge" | "neoforge";
type GitHubBridgeLoader = "fabric" | "quilt";

const BRIDGE_PREFIX = "fishbattery-cape-bridge-";
const BRIDGE_REPO_OWNER = process.env.CAPE_BRIDGE_REPO_OWNER || "fishbatteryapp";
const BRIDGE_REPO_NAME = process.env.CAPE_BRIDGE_REPO_NAME || "fishbattery-cape-bridge";
const BRIDGE_GITHUB_API = `https://api.github.com/repos/${BRIDGE_REPO_OWNER}/${BRIDGE_REPO_NAME}`;
const BRIDGE_UA = "FishbatteryLauncher cape-bridge resolver";

function isLoaderWithBridge(loader: InstanceConfig["loader"]): loader is LoaderWithBridge {
  return loader === "fabric" || loader === "quilt" || loader === "forge" || loader === "neoforge";
}

function isGitHubBridgeLoader(loader: LoaderWithBridge): loader is GitHubBridgeLoader {
  return loader === "fabric" || loader === "quilt";
}

function expectedBundledJarName(loader: LoaderWithBridge) {
  return `${BRIDGE_PREFIX}${loader}.jar`;
}

function resolveBridgeJarPath(loader: LoaderWithBridge): string | null {
  const file = expectedBundledJarName(loader);
  const candidates = [
    // Dev/source tree path
    path.join(process.cwd(), "launcher-cape-bridges", loader, file),
    // Packaged app resource path
    path.join(process.resourcesPath, "launcher-cape-bridges", loader, file)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) return candidate;
  }
  return null;
}

function cleanBridgeJars(modsDir: string) {
  if (!fs.existsSync(modsDir)) return;
  for (const entry of fs.readdirSync(modsDir)) {
    if (!entry.startsWith(BRIDGE_PREFIX) || !entry.endsWith(".jar")) continue;
    try {
      fs.rmSync(path.join(modsDir, entry), { force: true });
    } catch {
      // best effort cleanup
    }
  }
}

function listInstalledBridgeJars(modsDir: string): string[] {
  if (!fs.existsSync(modsDir)) return [];
  return fs
    .readdirSync(modsDir)
    .filter((entry) => entry.startsWith(BRIDGE_PREFIX) && entry.endsWith(".jar"))
    .map((entry) => path.join(modsDir, entry));
}

function isTargetedBridgeJarForInstance(filePath: string, mcVersion: string, loader: GitHubBridgeLoader): boolean {
  const name = path.basename(filePath).toLowerCase();
  const expectedSuffix = `-${String(mcVersion).toLowerCase()}-${loader}.jar`;
  return name.startsWith(BRIDGE_PREFIX) && name.endsWith(expectedSuffix);
}

function pickCompatibleInstalledBridgeJar(
  files: string[],
  mcVersion: string,
  loader: GitHubBridgeLoader
): string | null {
  for (const file of files) {
    if (isTargetedBridgeJarForInstance(file, mcVersion, loader)) return file;
  }
  return null;
}

function sha1File(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).size) return null;
    const bytes = fs.readFileSync(filePath);
    return crypto.createHash("sha1").update(bytes).digest("hex");
  } catch {
    return null;
  }
}

type GithubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string;
  draft: boolean;
  assets: GithubReleaseAsset[];
};

async function fetchGithubJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BRIDGE_UA,
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) throw new Error(`GitHub release request failed (${res.status})`);
  return (await res.json()) as T;
}

function getTagModVersion(tag: string, mcVersion: string, loader: GitHubBridgeLoader): string | null {
  const suffix = `-${loader}`;
  if (!tag.startsWith("v") || !tag.endsWith(suffix)) return null;
  const middle = tag.slice(1, tag.length - suffix.length).trim();
  if (!middle) return null;

  // New layout: v<modVersion>-<loader>
  // Legacy layout: v<mcVersion>-<modVersion>-<loader>
  const legacyPrefix = `${mcVersion}-`;
  if (middle.startsWith(legacyPrefix)) {
    const legacyModVersion = middle.slice(legacyPrefix.length).trim();
    return legacyModVersion || null;
  }
  return middle;
}

function chooseBridgeAsset(
  release: GithubRelease,
  mcVersion: string,
  loader: GitHubBridgeLoader
): GithubReleaseAsset | null {
  const suffix = `-${mcVersion}-${loader}.jar`;
  const preferred =
    release.assets.find(
      (a) => a?.name?.startsWith(BRIDGE_PREFIX) && a.name.toLowerCase().endsWith(suffix.toLowerCase())
    ) ?? null;
  if (preferred) return preferred;
  return null;
}

async function resolveGithubBridgeRelease(
  mcVersion: string,
  loader: GitHubBridgeLoader,
  onLog?: (line: string) => void
): Promise<{ releaseTag: string; modVersion: string; asset: GithubReleaseAsset } | null> {
  const releases = await fetchGithubJson<GithubRelease[]>(`${BRIDGE_GITHUB_API}/releases?per_page=100`);
  for (const release of releases || []) {
    if (!release || release.draft) continue;
    const modVersion = getTagModVersion(String(release.tag_name || ""), mcVersion, loader);
    if (!modVersion) continue;
    const asset = chooseBridgeAsset(release, mcVersion, loader);
    if (!asset) continue;
    onLog?.(`[capes] Resolved bridge release ${release.tag_name} (${loader}, mc ${mcVersion}).`);
    return { releaseTag: release.tag_name, modVersion, asset };
  }
  return null;
}

function sanitizePathPart(value: string) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function getBridgeCachePath(tag: string, assetName: string) {
  const cacheDir = path.join(getDataRoot(), "bridge-cache", sanitizePathPart(tag));
  return {
    cacheDir,
    cacheFile: path.join(cacheDir, sanitizePathPart(assetName))
  };
}

async function resolveGithubBridgeJarPath(
  instance: InstanceConfig,
  onLog?: (line: string) => void
): Promise<string | null> {
  if (!isLoaderWithBridge(instance.loader) || !isGitHubBridgeLoader(instance.loader)) return null;
  const resolved = await resolveGithubBridgeRelease(instance.mcVersion, instance.loader, onLog);
  if (!resolved) {
    onLog?.(`[capes] No GitHub bridge release found for mc=${instance.mcVersion} loader=${instance.loader}.`);
    return null;
  }

  const { cacheDir, cacheFile } = getBridgeCachePath(resolved.releaseTag, resolved.asset.name);
  if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 0) {
    onLog?.(`[capes] Using cached bridge jar: ${path.basename(cacheFile)}`);
    return cacheFile;
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  const bytes = await downloadBuffer(resolved.asset.browser_download_url);
  fs.writeFileSync(cacheFile, bytes);
  onLog?.(`[capes] Downloaded bridge jar from ${resolved.releaseTag}: ${path.basename(cacheFile)}`);
  return cacheFile;
}

export function syncCapeBridgeMod(instance: InstanceConfig, onLog?: (line: string) => void) {
  const modsDir = path.join(getInstanceDir(instance.id), "mods");
  fs.mkdirSync(modsDir, { recursive: true });
  cleanBridgeJars(modsDir);

  if (!isLoaderWithBridge(instance.loader)) {
    onLog?.("[capes] Vanilla instance: skipping launcher cape bridge mod");
    return;
  }

  const source = resolveBridgeJarPath(instance.loader);
  if (!source) {
    onLog?.(
      `[capes] Cape bridge jar missing for ${instance.loader}. Expected ${expectedBundledJarName(instance.loader)} under launcher-cape-bridges/${instance.loader}/`
    );
    return;
  }

  const target = path.join(modsDir, expectedBundledJarName(instance.loader));
  fs.copyFileSync(source, target);
  onLog?.(`[capes] Injected launcher cape bridge mod: ${path.basename(target)}`);
}

export async function syncCapeBridgeModWithGithub(instance: InstanceConfig, onLog?: (line: string) => void) {
  const modsDir = path.join(getInstanceDir(instance.id), "mods");
  fs.mkdirSync(modsDir, { recursive: true });

  if (!isLoaderWithBridge(instance.loader)) {
    cleanBridgeJars(modsDir);
    onLog?.("[capes] Vanilla instance: skipping launcher cape bridge mod");
    return;
  }

  let source: string | null = null;
  const githubCapable = isGitHubBridgeLoader(instance.loader);
  if (githubCapable) {
    try {
      source = await resolveGithubBridgeJarPath(instance, onLog);
    } catch (err: any) {
      onLog?.(`[capes] GitHub bridge resolve failed: ${String(err?.message ?? err)}`);
    }
    // For Fabric/Quilt, avoid falling back to a generic bundled jar that may target another MC version.
    if (!source) {
      const existing = listInstalledBridgeJars(modsDir);
      const compatible = pickCompatibleInstalledBridgeJar(existing, instance.mcVersion, instance.loader);
      if (compatible) {
        onLog?.(`[capes] Keeping existing compatible bridge jar: ${path.basename(compatible)}`);
        return;
      }
      if (existing.length) {
        cleanBridgeJars(modsDir);
        onLog?.("[capes] Removed incompatible bridge jar(s) for this instance version.");
      }
      onLog?.(
        `[capes] Skipping bridge injection for ${instance.loader} ${instance.mcVersion}: no matching GitHub bridge release found.`
      );
      return;
    }
  } else {
    source = resolveBridgeJarPath(instance.loader);
    if (source) onLog?.("[capes] Using bundled cape bridge jar from launcher resources.");
  }

  if (!source) {
    const existing = listInstalledBridgeJars(modsDir);
    const compatible =
      instance.loader === "fabric" || instance.loader === "quilt"
        ? pickCompatibleInstalledBridgeJar(existing, instance.mcVersion, instance.loader)
        : existing[0] || null;
    if (compatible) {
      onLog?.(`[capes] Keeping existing bridge jar: ${path.basename(compatible)}`);
      return;
    }
    if (existing.length) cleanBridgeJars(modsDir);
    onLog?.(
      `[capes] Cape bridge jar missing for ${instance.loader}. No GitHub release and no bundled fallback ${expectedBundledJarName(instance.loader)}`
    );
    return;
  }

  cleanBridgeJars(modsDir);
  const target = path.join(modsDir, path.basename(source));
  fs.copyFileSync(source, target);
  onLog?.(`[capes] Injected launcher cape bridge mod: ${path.basename(target)}`);
}

export type CapeBridgeUpdateCheck = {
  supported: boolean;
  loader: InstanceConfig["loader"];
  minecraft: string;
  installedJar: string | null;
  latestJar: string | null;
  releaseTag: string | null;
  updateAvailable: boolean;
  reason: string;
};

export async function checkCapeBridgeUpdateForInstance(
  instance: InstanceConfig,
  onLog?: (line: string) => void
): Promise<CapeBridgeUpdateCheck> {
  const modsDir = path.join(getInstanceDir(instance.id), "mods");
  fs.mkdirSync(modsDir, { recursive: true });
  const installed = listInstalledBridgeJars(modsDir);
  const installedJar = installed.length ? path.basename(installed[0]) : null;

  if (!isLoaderWithBridge(instance.loader) || !isGitHubBridgeLoader(instance.loader)) {
    return {
      supported: false,
      loader: instance.loader,
      minecraft: instance.mcVersion,
      installedJar,
      latestJar: null,
      releaseTag: null,
      updateAvailable: false,
      reason: "Cape bridge updates are not used for this loader."
    };
  }

  const resolved = await resolveGithubBridgeRelease(instance.mcVersion, instance.loader, onLog);
  if (!resolved) {
    return {
      supported: true,
      loader: instance.loader,
      minecraft: instance.mcVersion,
      installedJar,
      latestJar: null,
      releaseTag: null,
      updateAvailable: false,
      reason: "No GitHub bridge release found for this loader/version."
    };
  }

  const { cacheFile } = getBridgeCachePath(resolved.releaseTag, resolved.asset.name);
  if (!fs.existsSync(cacheFile) || !fs.statSync(cacheFile).size) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      const bytes = await downloadBuffer(resolved.asset.browser_download_url);
      fs.writeFileSync(cacheFile, bytes);
    } catch (err: any) {
      return {
        supported: true,
        loader: instance.loader,
        minecraft: instance.mcVersion,
        installedJar,
        latestJar: path.basename(cacheFile),
        releaseTag: resolved.releaseTag,
        updateAvailable: false,
        reason: `Could not fetch latest bridge asset: ${String(err?.message ?? err)}`
      };
    }
  }

  const latestHash = sha1File(cacheFile);
  const installedHash = installed.length ? sha1File(installed[0]) : null;
  const updateAvailable = !installedHash || !latestHash || installedHash !== latestHash;

  return {
    supported: true,
    loader: instance.loader,
    minecraft: instance.mcVersion,
    installedJar,
    latestJar: path.basename(cacheFile),
    releaseTag: resolved.releaseTag,
    updateAvailable,
    reason: updateAvailable ? "A newer cape bridge release is available." : "Cape bridge is up to date."
  };
}

export async function applyCapeBridgeUpdateForInstance(instance: InstanceConfig, onLog?: (line: string) => void) {
  const check = await checkCapeBridgeUpdateForInstance(instance, onLog);
  if (!check.supported) return { ...check, updated: false };
  if (!check.updateAvailable) return { ...check, updated: false };

  if (!isLoaderWithBridge(instance.loader) || !isGitHubBridgeLoader(instance.loader)) {
    return { ...check, updated: false };
  }

  const resolved = await resolveGithubBridgeRelease(instance.mcVersion, instance.loader, onLog);
  if (!resolved) return { ...check, updated: false, reason: "Latest release could not be resolved." };
  const { cacheFile } = getBridgeCachePath(resolved.releaseTag, resolved.asset.name);
  if (!fs.existsSync(cacheFile) || !fs.statSync(cacheFile).size) {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    const bytes = await downloadBuffer(resolved.asset.browser_download_url);
    fs.writeFileSync(cacheFile, bytes);
  }

  const modsDir = path.join(getInstanceDir(instance.id), "mods");
  fs.mkdirSync(modsDir, { recursive: true });
  cleanBridgeJars(modsDir);
  const target = path.join(modsDir, path.basename(cacheFile));
  fs.copyFileSync(cacheFile, target);
  onLog?.(`[capes] Updated cape bridge to ${resolved.releaseTag}: ${path.basename(target)}`);
  return { ...check, updated: true, installedJar: path.basename(target), latestJar: path.basename(target) };
}
