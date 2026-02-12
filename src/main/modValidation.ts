import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { getInstanceDir, listInstances } from "./instances";

type ValidationSeverity = "ok" | "warning" | "critical";

export type ValidationIssue = {
  code:
    | "duplicate-mod-id"
    | "missing-dependency"
    | "incompatible-minecraft"
    | "loader-mismatch"
    | "known-conflict"
    | "experimental-mod";
  severity: ValidationSeverity;
  title: string;
  detail: string;
  files?: string[];
  modIds?: string[];
};

export type ValidationResult = {
  summary: "no-issues" | "warnings" | "critical";
  issues: ValidationIssue[];
};

type ModMeta = {
  file: string;
  id: string | null;
  version: string | null;
  depends: Record<string, string>;
};

const KNOWN_CONFLICTS: Array<{ a: string; b: string; reason: string }> = [
  { a: "sodium", b: "embeddium", reason: "Do not install both render engines together." },
  { a: "iris", b: "oculus", reason: "Iris and Oculus target different ecosystems and conflict." },
  { a: "starlight", b: "phosphor", reason: "Both modify lighting pipeline and can conflict." }
];

function readFabricModJson(filePath: string): ModMeta {
  const base: ModMeta = { file: filePath, id: null, version: null, depends: {} };
  try {
    const zip = new AdmZip(filePath);
    const e = zip.getEntry("fabric.mod.json");
    if (!e) return base;
    const raw = zip.readAsText(e);
    const parsed = JSON.parse(raw) as any;
    return {
      file: filePath,
      id: typeof parsed?.id === "string" ? parsed.id : null,
      version: typeof parsed?.version === "string" ? parsed.version : null,
      depends: typeof parsed?.depends === "object" && parsed?.depends ? parsed.depends : {}
    };
  } catch {
    return base;
  }
}

function simpleConstraintMatch(constraint: string, mcVersion: string) {
  if (!constraint || constraint === "*" || constraint.includes("*")) return true;
  if (constraint.includes(mcVersion)) return true;
  const normalized = constraint.replace(/[\[\]()]/g, "");
  return normalized.split(",").some((x) => x.trim() === mcVersion);
}

export function validateInstanceMods(instanceId: string): ValidationResult {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const modsDir = path.join(getInstanceDir(instanceId), "mods");
  if (!fs.existsSync(modsDir)) return { summary: "no-issues", issues: [] };

  const files = fs
    .readdirSync(modsDir)
    .filter((f) => f.endsWith(".jar"))
    .map((f) => path.join(modsDir, f));

  const metas = files.map(readFabricModJson);
  const issues: ValidationIssue[] = [];

  const byId = new Map<string, ModMeta[]>();
  for (const m of metas) {
    if (!m.id) {
      issues.push({
        code: "loader-mismatch",
        severity: "warning",
        title: "Non-Fabric or malformed mod",
        detail: `${path.basename(m.file)} has no fabric.mod.json and may be incompatible.`,
        files: [path.basename(m.file)]
      });
      continue;
    }
    byId.set(m.id, [...(byId.get(m.id) || []), m]);
  }

  for (const [id, list] of byId.entries()) {
    if (list.length > 1) {
      issues.push({
        code: "duplicate-mod-id",
        severity: "critical",
        title: `Duplicate mod detected: ${id}`,
        detail: `Multiple jars provide mod id "${id}". Keep one version only.`,
        files: list.map((x) => path.basename(x.file)),
        modIds: [id]
      });
    }
  }

  for (const m of metas) {
    if (!m.id) continue;
    const deps = m.depends || {};
    for (const [depId, depConstraint] of Object.entries(deps)) {
      if (depId === "minecraft") {
        if (!simpleConstraintMatch(String(depConstraint), inst.mcVersion)) {
          issues.push({
            code: "incompatible-minecraft",
            severity: "critical",
            title: `${m.id} does not support ${inst.mcVersion}`,
            detail: `${m.id} requires minecraft ${depConstraint}.`,
            files: [path.basename(m.file)],
            modIds: [m.id]
          });
        }
        continue;
      }
      if (depId === "fabricloader" || depId === "fabric") continue;
      if (!byId.has(depId)) {
        issues.push({
          code: "missing-dependency",
          severity: "critical",
          title: `Missing dependency for ${m.id}`,
          detail: `${m.id} requires ${depId}${depConstraint ? ` (${depConstraint})` : ""}.`,
          files: [path.basename(m.file)],
          modIds: [m.id, depId]
        });
      }
    }
  }

  const installedIds = new Set(Array.from(byId.keys()));
  for (const c of KNOWN_CONFLICTS) {
    if (installedIds.has(c.a) && installedIds.has(c.b)) {
      issues.push({
        code: "known-conflict",
        severity: "critical",
        title: `Known conflict: ${c.a} + ${c.b}`,
        detail: c.reason,
        modIds: [c.a, c.b]
      });
    }
  }

  if (installedIds.has("c2me")) {
    issues.push({
      code: "experimental-mod",
      severity: "warning",
      title: "Experimental performance mod enabled",
      detail: "C2ME can be unstable on some versions. Use with caution.",
      modIds: ["c2me"]
    });
  }

  const summary: ValidationResult["summary"] =
    issues.some((x) => x.severity === "critical")
      ? "critical"
      : issues.length
        ? "warnings"
        : "no-issues";

  return { summary, issues };
}

export function fixDuplicateMods(instanceId: string) {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const modsDir = path.join(getInstanceDir(instanceId), "mods");
  if (!fs.existsSync(modsDir)) return { removed: [] as string[] };

  const files = fs
    .readdirSync(modsDir)
    .filter((f) => f.endsWith(".jar"))
    .map((f) => path.join(modsDir, f));
  const metas = files.map(readFabricModJson).filter((m) => !!m.id) as Array<ModMeta & { id: string }>;

  const grouped = new Map<string, Array<ModMeta & { id: string }>>();
  for (const m of metas) grouped.set(m.id, [...(grouped.get(m.id) || []), m]);

  const removed: string[] = [];
  for (const [, list] of grouped.entries()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => fs.statSync(b.file).mtimeMs - fs.statSync(a.file).mtimeMs);
    for (const loser of list.slice(1)) {
      try {
        fs.rmSync(loser.file);
        removed.push(path.basename(loser.file));
      } catch {
        // ignore
      }
    }
  }

  return { removed };
}
