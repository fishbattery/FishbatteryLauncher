import fetch from "node-fetch";

export async function resolveLatestFabricLoaderVersion(mcVersion: string): Promise<string> {
  const url = `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(mcVersion)}`;
  const res = await fetch(url, { headers: { "User-Agent": "FishbatteryLauncher/1.0 (local)" } });
  if (!res.ok) throw new Error(`Fabric meta failed: ${res.status}`);

  const list = (await res.json()) as Array<{ loader: { version: string; stable: boolean } }>;
  if (!list.length) throw new Error(`No Fabric loaders found for ${mcVersion}`);

  // Prefer stable first, else just take newest
  const stable = list.find((x) => x.loader?.stable);
  return (stable ?? list[0]).loader.version;
}
