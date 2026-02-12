import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { createInstance, getInstanceDir, InstanceConfig, listInstances } from "./instances";

type ExportManifest = {
  schemaVersion: 1;
  exportedAt: string;
  sourceInstanceId: string;
  instance: {
    name: string;
    mcVersion: string;
    loader: "vanilla" | "fabric";
    memoryMb: number;
    fabricLoaderVersion?: string;
  };
};

function sanitizeFileName(name: string) {
  return String(name || "instance").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
}

function withUniqueImportedName(baseName: string): string {
  const db = listInstances();
  const existing = new Set((db.instances ?? []).map((i) => String(i?.name ?? "").toLowerCase()));
  if (!existing.has(baseName.toLowerCase())) return baseName;

  let n = 1;
  while (true) {
    const candidate = `${baseName} (Imported ${n})`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
    n++;
  }
}

function isSafeRelative(rel: string) {
  if (!rel) return false;
  if (path.isAbsolute(rel)) return false;
  const norm = path.normalize(rel);
  return !norm.startsWith("..") && !norm.includes(`..${path.sep}`);
}

export function exportInstanceToZip(instanceId: string, outZipPath: string) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const instanceDir = getInstanceDir(instanceId);
  if (!fs.existsSync(instanceDir)) throw new Error("Instance directory not found");

  const manifest: ExportManifest = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sourceInstanceId: instanceId,
    instance: {
      name: inst.name,
      mcVersion: inst.mcVersion,
      loader: inst.loader,
      memoryMb: inst.memoryMb,
      fabricLoaderVersion: inst.fabricLoaderVersion
    }
  };

  const zip = new AdmZip();
  zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));
  zip.addLocalFolder(instanceDir, "instance");

  fs.mkdirSync(path.dirname(outZipPath), { recursive: true });
  zip.writeZip(outZipPath);
  return outZipPath;
}

function parseManifest(zip: AdmZip): ExportManifest {
  const entry = zip.getEntry("manifest.json");
  if (!entry) throw new Error("Import failed: missing manifest.json");
  let parsed: any;
  try {
    parsed = JSON.parse(zip.readAsText(entry));
  } catch {
    throw new Error("Import failed: manifest.json is not valid JSON");
  }

  if (parsed?.schemaVersion !== 1) throw new Error("Import failed: unsupported manifest schema");
  if (!parsed?.instance?.name) throw new Error("Import failed: manifest missing instance name");
  if (!parsed?.instance?.mcVersion) throw new Error("Import failed: manifest missing mcVersion");
  if (!["vanilla", "fabric"].includes(parsed?.instance?.loader)) {
    throw new Error("Import failed: manifest has invalid loader");
  }

  return parsed as ExportManifest;
}

export function importInstanceFromZip(zipPath: string): InstanceConfig {
  if (!fs.existsSync(zipPath)) throw new Error("Import failed: zip file not found");

  const zip = new AdmZip(zipPath);
  const manifest = parseManifest(zip);

  const prefix = "instance/";
  const hasInstanceFiles = zip.getEntries().some((e) => !e.isDirectory && e.entryName.startsWith(prefix));
  if (!hasInstanceFiles) throw new Error("Import failed: archive has no instance files");

  const importedName = withUniqueImportedName(sanitizeFileName(manifest.instance.name));
  const newId = crypto.randomUUID();

  const created = createInstance({
    id: newId,
    name: importedName,
    mcVersion: manifest.instance.mcVersion,
    loader: manifest.instance.loader,
    memoryMb: Number(manifest.instance.memoryMb || 4096),
    fabricLoaderVersion: manifest.instance.fabricLoaderVersion,
    accountId: null
  });

  const instanceDir = getInstanceDir(newId);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    if (!entry.entryName.startsWith(prefix)) continue;

    const rel = entry.entryName.slice(prefix.length);
    if (!isSafeRelative(rel)) continue;

    const outPath = path.join(instanceDir, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, entry.getData());
  }

  return created;
}
