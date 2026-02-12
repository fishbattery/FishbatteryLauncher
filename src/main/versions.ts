import fetch from "node-fetch";
import { z } from "zod";

const ManifestSchema = z.object({
  latest: z.object({
    release: z.string(),
    snapshot: z.string()
  }),
  versions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["release", "snapshot", "old_beta", "old_alpha"]),
      url: z.string(),
      time: z.string(),
      releaseTime: z.string()
    })
  )
});

export type MojangVersion = z.infer<typeof ManifestSchema>["versions"][number];

const MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

export async function fetchVersionManifest() {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const json = await res.json();
  return ManifestSchema.parse(json);
}

export async function listAllVersions() {
  const manifest = await fetchVersionManifest();
  return {
    latest: manifest.latest,
    versions: manifest.versions
  };
}
