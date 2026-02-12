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
  { id: "fabric-api", name: "Fabric API", source: { kind: "modrinth", projectId: "P7dR8mSH" } },
  { id: "sodium", name: "Sodium", source: { kind: "modrinth", projectId: "AANobbMI" } },
  { id: "lithium", name: "Lithium", source: { kind: "modrinth", projectId: "gvQqBUqZ" } },
  { id: "ferrite-core", name: "FerriteCore", source: { kind: "modrinth", projectId: "uXXizFIs" } },
  { id: "indium", name: "Indium", source: { kind: "modrinth", projectId: "Orvt0mRa" } },
  { id: "immediatelyfast", name: "ImmediatelyFast", source: { kind: "modrinth", projectId: "5ZwdcRci" } },
  { id: "entityculling", name: "EntityCulling", source: { kind: "modrinth", projectId: "NNAgCjsB" } },
  { id: "modernfix", name: "ModernFix", source: { kind: "modrinth", projectId: "nmDcB62a" } },
  { id: "noisium", name: "Noisium", source: { kind: "modrinth", projectId: "KuNKN7d2" } },
  { id: "c2me", name: "C2ME", source: { kind: "modrinth", projectId: "VSNURh3q" } },
  { id: "starlight", name: "Starlight", source: { kind: "modrinth", projectId: "H8CaAYZC" } },
  { id: "sodium-extra", name: "Sodium Extra", source: { kind: "modrinth", projectId: "PtjYWJkn" } },
  { id: "reeses-sodium-options", name: "Reese's Sodium Options", source: { kind: "modrinth", projectId: "Bh37bMuy" } },
  { id: "dynamic-fps", name: "Dynamic FPS", source: { kind: "modrinth", projectId: "LQ3K71Q1" } },
  { id: "distanthorizons", name: "Distant Horizons", source: { kind: "modrinth", projectId: "uCdwusMi" } },
  { id: "mod-menu", name: "Mod Menu", required: true, source: { kind: "modrinth", projectId: "mOgUt4GM" } },
  { id: "iris", name: "Iris Shaders", source: { kind: "modrinth", projectId: "YL57xq9U" } },
  { id: "emf", name: "Entity Model Features", source: { kind: "modrinth", projectId: "4I1XuqiY" } },
  { id: "etf", name: "Entity Texture Features", source: { kind: "modrinth", projectId: "BVzZfTc1" } }
];
