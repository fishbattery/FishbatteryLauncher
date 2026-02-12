import fs from "node:fs";
import path from "node:path";

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

async function downloadToFile(url: string, outFile: string) {
  ensureDir(path.dirname(outFile));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed download ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
}

export async function ensureVanillaVersionInstalled(instanceRoot: string, versionId: string) {
  const vDir = path.join(instanceRoot, "versions", versionId);
  const jsonPath = path.join(vDir, `${versionId}.json`);
  const jarPath = path.join(vDir, `${versionId}.jar`);
  ensureDir(vDir);

  if (fs.existsSync(jsonPath) && fs.existsSync(jarPath)) return;

  const manifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
  const manifest = await fetchJson<any>(manifestUrl);
  const entry = (manifest.versions as any[]).find((v) => v.id === versionId);
  if (!entry?.url) throw new Error(`Could not find version ${versionId} in Mojang manifest`);
  const details = await fetchJson<any>(entry.url);

  fs.writeFileSync(jsonPath, JSON.stringify(details, null, 2), "utf-8");

  const clientUrl = details?.downloads?.client?.url;
  if (!clientUrl) throw new Error(`No downloads.client.url for ${versionId}`);
  await downloadToFile(clientUrl, jarPath);
}
