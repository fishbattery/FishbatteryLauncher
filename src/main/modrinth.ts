import fetch from "node-fetch";

export type ModrinthVersion = {
  id: string;
  version_number: string;
  date_published: string;
  game_versions: string[];
  loaders: string[]; // may be empty for packs
  files: Array<{
    url: string;
    filename: string;
    hashes: { sha1?: string; sha512?: string };
    primary: boolean;
  }>;
};

export type ResolveLatestModrinthOpts = {
  projectId: string;
  mcVersion: string;
  /**
   * Mods: pass "fabric"
   * Resourcepacks/Shaderpacks: omit loader
   *
   * Why: packs often have no loader on Modrinth, so filtering by loaders would return 0 results.
   */
  loader?: "fabric";
};

export type ResolvedModrinthFile = {
  versionName: string;
  fileName: string;
  url: string;
  sha1?: string;
  sha512?: string;
} | null;

const UA = "YourLauncher/0.2.0 (local)";

export async function resolveLatestModrinth(
  opts: ResolveLatestModrinthOpts
): Promise<ResolvedModrinthFile> {
  const params = new URLSearchParams();

  // Always filter by the exact MC version (same behavior as your mods resolver)
  params.set("game_versions", JSON.stringify([opts.mcVersion]));

  // Only add loaders filter if caller provided it (mods).
  // For packs you should omit it.
  if (opts.loader) {
    params.set("loaders", JSON.stringify([opts.loader]));
  }

  const url = `https://api.modrinth.com/v2/project/${opts.projectId}/version?${params.toString()}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Modrinth resolve failed: ${res.status}`);

  const versions = (await res.json()) as ModrinthVersion[];
  if (!versions.length) return null;

  // Newest first
  versions.sort((a, b) => b.date_published.localeCompare(a.date_published));
  const chosen = versions[0];

  // Prefer primary file
  const primary = chosen.files.find((f) => f.primary) ?? chosen.files[0];
  if (!primary) return null;

  return {
    versionName: chosen.version_number,
    fileName: primary.filename,
    url: primary.url,
    sha1: primary.hashes.sha1,
    sha512: primary.hashes.sha512
  };
}

export async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
