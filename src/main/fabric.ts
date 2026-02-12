import fetch from "node-fetch";
import semver from "semver";

export type FabricLoaderEntry = { version: string; stable: boolean };

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Fabric meta error: ${res.status} ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Fabric meta returned non-JSON: ${text.slice(0, 200)}`);
  }
}

export async function fetchFabricLoadersForMcVersion(mcVersion: string): Promise<FabricLoaderEntry[]> {
  const url = `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(mcVersion)}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) throw new Error(`Fabric meta returned unexpected JSON shape for ${mcVersion}`);

  const out: FabricLoaderEntry[] = [];
  for (const x of data) {
    if (x?.loader?.version) out.push({ version: String(x.loader.version), stable: !!x.loader.stable });
    else if (x?.version) out.push({ version: String(x.version), stable: !!x.stable });
  }
  if (!out.length) throw new Error(`No Fabric loader versions available for Minecraft ${mcVersion}`);
  return out;
}

export async function pickFabricLoader(mcVersion: string, preferStable = true): Promise<string> {
  const loaders = await fetchFabricLoadersForMcVersion(mcVersion);
  const filtered = preferStable ? loaders.filter((l) => l.stable) : loaders;

  const sorted = filtered.slice().sort((a, b) => semver.rcompare(a.version, b.version));
  if (sorted.length) return sorted[0].version;

  const anySorted = loaders.slice().sort((a, b) => semver.rcompare(a.version, b.version));
  return anySorted[0].version;
}
