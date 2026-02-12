export type CatalogPack = {
  id: string; // internal id (used for filenames + state keys)
  name: string;
  kind: "resourcepack" | "shaderpack";
  required?: boolean;
  source: { kind: "modrinth"; projectId: string };
};

/**
 * Recommended packs (downloaded from Modrinth), version-resolved per Minecraft version.
 *
 * Notes:
 * - Resource packs and shader packs on Modrinth typically DO NOT have loaders, so we do not pass a loader filter.
 * - Keep IDs stable once users have instances, because IDs are used for filenames + enable/disable state.
 *
 * To add a pack:
 * 1) Open the pack on Modrinth
 * 2) Copy its Project ID (not slug)
 * 3) Add it here
 */
export const PACK_CATALOG: CatalogPack[] = [
  // Example (replace projectId with the real one from Modrinth):
  { id: "fresh-animations", name: "Fresh Animations", kind: "resourcepack", source: { kind: "modrinth", projectId: "50dA9Sha" } },
  { id: "complementary", name: "Complementary Reimagined", kind: "shaderpack", source: { kind: "modrinth", projectId: "HVnmMxH1" } },
];
