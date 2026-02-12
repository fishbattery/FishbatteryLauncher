export type CatalogMod = {
  id: string;      // internal id
  name: string;
  required?: boolean;
  source: { kind: "modrinth"; projectId: string };
};

/**
 * Edit this list.
 * Project IDs are Modrinth project IDs (not slugs).
 * You can find them on Modrinth project pages or via the Modrinth API.
 */
export const CATALOG: CatalogMod[] = [
  { id: "fabric-api", name: "Fabric API", required: true, source: { kind: "modrinth", projectId: "P7dR8mSH" } },
  { id: "sodium", name: "Sodium", source: { kind: "modrinth", projectId: "AANobbMI" } },
  { id: "lithium", name: "Lithium", source: { kind: "modrinth", projectId: "gvQqBUqZ" } },
  { id: "mod-menu", name: "Mod Menu", source: { kind: "modrinth", projectId: "mOgUt4GM" } },
  { id: "iris", name: "Iris Shaders", source: { kind: "modrinth", projectId: "YL57xq9U" } },
  { id: "emf", name: "Entity Model Features", required: true, source: { kind: "modrinth", projectId: "4I1XuqiY" } },
  { id: "etf", name: "Entity Texture Features", required: true, source: { kind: "modrinth", projectId: "BVzZfTc1" } }
];
