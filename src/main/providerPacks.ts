import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createInstance, getInstanceDir, listInstances, type InstanceConfig } from "./instances";
import { pickLoaderVersion, prepareLoaderInstall, type LoaderKind } from "./loaderSupport";

// External pack sources we currently expose in search/import UI.
export type ExternalProvider = "curseforge" | "technic" | "atlauncher" | "ftb";

export type ProviderPack = {
  id: string;
  provider: ExternalProvider;
  name: string;
  description: string;
  mcVersion: string;
  loader: string;
  iconUrl?: string | null;
  tags?: string[];
};

export type ProviderPackInstallResult = {
  instance: InstanceConfig;
  notes: string[];
};

const FALLBACK_CATALOG: ProviderPack[] = [
  {
    id: "cf-rlcraft",
    provider: "curseforge",
    name: "RLCraft",
    description: "Hardcore survival RPG experience with many mods and progression.",
    mcVersion: "1.12.2",
    loader: "Forge",
    tags: ["survival", "rpg", "hardcore"]
  },
  {
    id: "cf-atm9",
    provider: "curseforge",
    name: "All the Mods 9",
    description: "Large kitchen-sink modpack with tech, magic, and exploration.",
    mcVersion: "1.20.1",
    loader: "NeoForge",
    tags: ["kitchen sink", "tech", "magic"]
  },
  {
    id: "cf-skyfactory4",
    provider: "curseforge",
    name: "SkyFactory 4",
    description: "Skyblock progression with automation and unique resource systems.",
    mcVersion: "1.12.2",
    loader: "Forge",
    tags: ["skyblock", "automation"]
  },
  {
    id: "technic-tekkit2",
    provider: "technic",
    name: "Tekkit 2",
    description: "Classic-style tech progression and automation on the Technic platform.",
    mcVersion: "1.12.2",
    loader: "Forge",
    tags: ["tech", "automation", "classic"]
  },
  {
    id: "technic-hexxit2",
    provider: "technic",
    name: "Hexxit II",
    description: "Adventure and exploration-focused pack with dungeons and loot.",
    mcVersion: "1.12.2",
    loader: "Forge",
    tags: ["adventure", "exploration"]
  },
  {
    id: "technic-blightfall",
    provider: "technic",
    name: "Blightfall",
    description: "Quest-driven survival challenge on a contaminated alien world.",
    mcVersion: "1.7.10",
    loader: "Forge",
    tags: ["quest", "survival"]
  }
];

// Shared HTTP helper with explicit launcher UA for provider API compatibility.
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "FishbatteryLauncher/0.2.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": "FishbatteryLauncher/0.2.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function sanitizeName(name: string) {
  return String(name || "Imported Pack").replace(/[<>:\"/\\|?*\x00-\x1F]/g, "_").trim() || "Imported Pack";
}

function uniqueName(base: string) {
  const existing = new Set((listInstances().instances || []).map((x) => String(x.name || "").toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;
  let i = 2;
  while (existing.has(`${base} (${i})`.toLowerCase())) i++;
  return `${base} (${i})`;
}

// Reject absolute/parent-escape paths when writing provider files locally.
function safeRelative(rel: string) {
  if (!rel) return false;
  if (path.isAbsolute(rel)) return false;
  const norm = path.normalize(rel);
  return !norm.startsWith("..") && !norm.includes(`..${path.sep}`);
}

// Normalize provider-specific loader labels into our internal enum.
function loaderFromText(loader: string): LoaderKind {
  const l = String(loader || "").toLowerCase();
  if (l.includes("fabric")) return "fabric";
  if (l.includes("quilt")) return "quilt";
  if (l.includes("neo")) return "neoforge";
  if (l.includes("forge")) return "forge";
  return "vanilla";
}

function filterByQuery(items: ProviderPack[], query: string) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((x) => {
    const hay = `${x.name} ${x.description} ${(x.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

async function searchATLauncher(query: string, limit: number): Promise<ProviderPack[]> {
  type SimpleResp = { data?: Array<{ name: string; safeName: string; type?: string }> };
  type PackResp = { data?: { description?: string; versions?: Array<{ minecraft?: string; version?: string }> } };

  const simple = await fetchJson<SimpleResp>("https://api.atlauncher.com/v1/packs/simple");
  const entries = (simple.data || []).slice(0, 120);
  const q = String(query || "").trim().toLowerCase();
  const filtered = q
    ? entries.filter((x) => `${x.name} ${x.safeName}`.toLowerCase().includes(q))
    : entries.slice(0, 24);

  const out: ProviderPack[] = [];
  // Resolve details per hit so we can expose mc version/loader in the UI list.
  for (const e of filtered.slice(0, Math.max(1, Math.min(40, limit)))) {
    let mc = "unknown";
    let loader = "varies";
    let description = "ATLauncher pack";
    try {
      const detail = await fetchJson<PackResp>(`https://api.atlauncher.com/v1/pack/${encodeURIComponent(e.safeName)}`);
      description = String(detail?.data?.description || description).replace(/<[^>]+>/g, " ").trim();
      const first = (detail?.data?.versions || [])[0] || null;
      if (first?.minecraft) mc = String(first.minecraft);
      const v = String(first?.version || "").toLowerCase();
      if (v.includes("forge")) loader = "Forge";
      else if (v.includes("fabric")) loader = "Fabric";
      else if (v.includes("neo")) loader = "NeoForge";
    } catch {
      // keep defaults
    }

    out.push({
      id: `atl-${e.safeName}`,
      provider: "atlauncher",
      name: e.name,
      description,
      mcVersion: mc,
      loader,
      tags: ["atlauncher"]
    });
  }
  return out.slice(0, limit);
}

async function searchFTB(query: string, limit: number): Promise<ProviderPack[]> {
  type ListResp = { packs?: number[] };
  type DetailResp = {
    id: number;
    name?: string;
    synopsis?: string;
    art?: Array<{ url?: string; type?: string }>;
    versions?: Array<{
      targets?: Array<{ name?: string; type?: string; version?: string }>;
    }>;
  };

  // "featured" gives quality/popular ordering for empty queries.
  const sourceUrl = String(query || "").trim()
    ? "https://api.modpacks.ch/public/modpack/all"
    : "https://api.modpacks.ch/public/modpack/featured/30";

  const list = await fetchJson<ListResp>(sourceUrl);
  const ids = (list.packs || []).slice(0, 80);
  const q = String(query || "").trim().toLowerCase();

  const details: ProviderPack[] = [];
  // Pull per-pack details and stop once we have enough hits.
  for (const id of ids) {
    try {
      const d = await fetchJson<DetailResp>(`https://api.modpacks.ch/public/modpack/${id}`);
      const name = String(d.name || `FTB Pack ${id}`);
      const desc = String(d.synopsis || "FTB pack");
      if (q && !`${name} ${desc}`.toLowerCase().includes(q)) continue;

      const firstVersion = (d.versions || [])[0] || null;
      const targets = firstVersion?.targets || [];
      const game = targets.find((t) => t.type === "game" || t.name === "minecraft");
      const modloader = targets.find((t) => t.type === "modloader");
      const icon = (d.art || []).find((a) => a.type === "square")?.url || null;

      details.push({
        id: `ftb-${d.id}`,
        provider: "ftb",
        name,
        description: desc,
        mcVersion: String(game?.version || "unknown"),
        loader: String(modloader?.name || "varies"),
        iconUrl: icon,
        tags: ["ftb"]
      });

      if (details.length >= limit) break;
    } catch {
      // ignore single-pack failures
    }
  }

  return details.slice(0, limit);
}

export async function searchProviderPacks(provider: ExternalProvider, query: string, limit = 24) {
  const capped = Math.max(1, Math.min(60, limit));

  if (provider === "atlauncher") {
    try {
      const hits = await searchATLauncher(query, capped);
      if (hits.length) return { hits };
    } catch {
      // fallback below
    }
  }

  if (provider === "ftb") {
    try {
      const hits = await searchFTB(query, capped);
      if (hits.length) return { hits };
    } catch {
      // fallback below
    }
  }

  // For providers without stable public APIs, return curated fallback entries.
  const fallback = filterByQuery(
    FALLBACK_CATALOG.filter((x) => x.provider === provider),
    query
  ).slice(0, capped);
  return { hits: fallback };
}

export async function installProviderPackFromSearch(opts: {
  provider: ExternalProvider;
  packId: string;
  defaults?: {
    name?: string;
    accountId?: string | null;
    memoryMb?: number;
  };
}): Promise<ProviderPackInstallResult> {
  if (opts.provider === "ftb") {
    const idMatch = String(opts.packId || "").match(/^ftb-(\d+)/i);
    if (!idMatch) throw new Error("Invalid FTB pack id");
    const packId = Number(idMatch[1]);

    type DetailResp = {
      id: number;
      name?: string;
      versions?: Array<{
        id: number;
        targets?: Array<{ name?: string; type?: string; version?: string }>;
      }>;
    };
    type VersionResp = {
      id: number;
      targets?: Array<{ name?: string; type?: string; version?: string }>;
      files?: Array<{
        path?: string;
        name?: string;
        url?: string;
        clientonly?: boolean;
        serveronly?: boolean;
        optional?: boolean;
      }>;
    };

    const detail = await fetchJson<DetailResp>(`https://api.modpacks.ch/public/modpack/${packId}`);
    const version = (detail.versions || [])[0];
    if (!version?.id) throw new Error("No installable FTB version found");

    const v = await fetchJson<VersionResp>(`https://api.modpacks.ch/public/modpack/${packId}/${version.id}`);
    const targets = v.targets || version.targets || [];
    const game = targets.find((t) => t.type === "game" || t.name === "minecraft");
    const modloader = targets.find((t) => t.type === "modloader");
    const mcVersion = String(game?.version || "latest");
    const loader = loaderFromText(String(modloader?.name || "vanilla"));
    const loaderVersion = loader === "vanilla" ? undefined : await pickLoaderVersion(loader, mcVersion);

    const instanceId = crypto.randomUUID();
    const instanceName = uniqueName(sanitizeName(opts.defaults?.name || detail.name || `FTB ${packId}`));
    const cfg: Omit<InstanceConfig, "createdAt"> = {
      id: instanceId,
      name: instanceName,
      accountId: opts.defaults?.accountId ?? null,
      mcVersion,
      loader,
      fabricLoaderVersion: loader === "fabric" ? loaderVersion : undefined,
      quiltLoaderVersion: loader === "quilt" ? loaderVersion : undefined,
      forgeVersion: loader === "forge" ? loaderVersion : undefined,
      neoforgeVersion: loader === "neoforge" ? loaderVersion : undefined,
      memoryMb: Number(opts.defaults?.memoryMb || 6144),
      instancePreset: "none",
      jvmArgsOverride: null,
      optimizerBackup: null
    };

    const created = createInstance(cfg);
    await prepareLoaderInstall({ instanceId, mcVersion, loader, loaderVersion });

    const files = Array.isArray(v.files) ? v.files : [];
    const instanceDir = getInstanceDir(instanceId);
    // Download required client files directly into the instance structure.
    for (const f of files) {
      if (!f?.url || !f?.name) continue;
      if (f.serveronly) continue;
      if (f.optional) continue;
      const relBase = String(f.path || "").replace(/^\.\//, "");
      const rel = relBase ? `${relBase}/${f.name}` : String(f.name);
      if (!safeRelative(rel)) continue;
      const outPath = path.join(instanceDir, rel);
      ensureDir(path.dirname(outPath));
      const buf = await downloadBuffer(f.url);
      fs.writeFileSync(outPath, buf);
    }

    return {
      instance: created,
      notes: [`Installed FTB pack ${detail.name || packId}`, `Version ${version.id}`]
    };
  }

  if (opts.provider === "atlauncher") {
    const match = String(opts.packId || "").match(/^atl-(.+)$/i);
    if (!match) throw new Error("Invalid ATLauncher pack id");
    const safeName = match[1];

    type VResp = { data?: { version?: string; minecraftVersion?: string } };
    const latest = await fetchJson<VResp>(`https://api.atlauncher.com/v1/pack/${encodeURIComponent(safeName)}/latest`);
    const mcVersion = String(latest?.data?.minecraftVersion || "latest");
    const instanceId = crypto.randomUUID();
    const instanceName = uniqueName(sanitizeName(opts.defaults?.name || safeName));
    const created = createInstance({
      id: instanceId,
      name: instanceName,
      accountId: opts.defaults?.accountId ?? null,
      mcVersion,
      loader: "vanilla",
      memoryMb: Number(opts.defaults?.memoryMb || 6144),
      instancePreset: "none",
      jvmArgsOverride: null,
      optimizerBackup: null
    });
    await prepareLoaderInstall({ instanceId, mcVersion, loader: "vanilla" });
    // ATLauncher API currently provides metadata flow here, not direct file manifests.
    return {
      instance: created,
      notes: [
        "Created instance from ATLauncher pack metadata.",
        "Direct ATLauncher file sync is not available from current public API."
      ]
    };
  }

  throw new Error(`Direct install from search is not supported for provider ${opts.provider}`);
}
