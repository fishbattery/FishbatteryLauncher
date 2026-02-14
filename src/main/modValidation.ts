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
  provides: string[];
  source: "top" | "nested";
};

const PROVIDED_DEPENDENCIES = new Set([
  "minecraft",
  "fabricloader",
  "fabric",
  "java",
  // Provided transitively by Fabric Loader in modern packs.
  "mixinextras"
]);

function normalizeModId(id: string) {
  return String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, "");
}

const KNOWN_CONFLICTS: Array<{ a: string; b: string; reason: string }> = [
  { a: "sodium", b: "embeddium", reason: "Do not install both render engines together." },
  { a: "iris", b: "oculus", reason: "Iris and Oculus target different ecosystems and conflict." },
  { a: "starlight", b: "phosphor", reason: "Both modify lighting pipeline and can conflict." }
];

function readFabricModJson(filePath: string): ModMeta {
  const base: ModMeta = { file: filePath, id: null, version: null, depends: {}, provides: [], source: "top" };
  try {
    const zip = new AdmZip(filePath);
    const e = zip.getEntry("fabric.mod.json");
    if (!e) return base;
    const raw = zip.readAsText(e);
    const parsed = JSON.parse(raw) as any;
    const provides = Array.isArray(parsed?.provides)
      ? parsed.provides.filter((x: any) => typeof x === "string")
      : [];
    return {
      file: filePath,
      id: typeof parsed?.id === "string" ? parsed.id : null,
      version: typeof parsed?.version === "string" ? parsed.version : null,
      depends: typeof parsed?.depends === "object" && parsed?.depends ? parsed.depends : {},
      provides,
      source: "top"
    };
  } catch {
    return base;
  }
}

function parseFabricModJson(raw: string, fileLabel: string, source: "top" | "nested"): ModMeta {
  const base: ModMeta = { file: fileLabel, id: null, version: null, depends: {}, provides: [], source };
  try {
    const parsed = JSON.parse(raw) as any;
    const provides = Array.isArray(parsed?.provides)
      ? parsed.provides.filter((x: any) => typeof x === "string")
      : [];
    return {
      file: fileLabel,
      id: typeof parsed?.id === "string" ? parsed.id : null,
      version: typeof parsed?.version === "string" ? parsed.version : null,
      depends: typeof parsed?.depends === "object" && parsed?.depends ? parsed.depends : {},
      provides,
      source
    };
  } catch {
    return base;
  }
}

function readAllFabricModJsons(filePath: string): ModMeta[] {
  const out: ModMeta[] = [];
  try {
    const zip = new AdmZip(filePath);
    const top = zip.getEntry("fabric.mod.json");
    if (top) out.push(parseFabricModJson(zip.readAsText(top), filePath, "top"));

    for (const ent of zip.getEntries()) {
      if (ent.isDirectory) continue;
      if (!ent.entryName.toLowerCase().endsWith(".jar")) continue;
      try {
        const nested = new AdmZip(ent.getData());
        const nestedMod = nested.getEntry("fabric.mod.json");
        if (!nestedMod) continue;
        out.push(parseFabricModJson(nested.readAsText(nestedMod), `${filePath}#${ent.entryName}`, "nested"));
      } catch {
        // ignore unreadable nested jars
      }
    }
  } catch {
    // ignore broken jars
  }
  return out.length ? out : [{ file: filePath, id: null, version: null, depends: {}, provides: [], source: "top" }];
}

function parseNumericVersion(v: string): number[] | null {
  const clean = String(v || "").trim();
  if (!clean) return null;
  const m = clean.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1] || 0), Number(m[2] || 0), Number(m[3] || 0)];
}

function cmpVersion(a: number[], b: number[]) {
  for (let i = 0; i < 3; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function checkSimplePredicate(token: string, mc: number[]): boolean | null {
  const t = token.trim();
  if (!t) return null;
  if (t === "*" || t.toLowerCase() === "x") return true;

  const opMatch = t.match(/^(>=|<=|>|<|=|\^|~)\s*(.+)$/);
  const op = opMatch?.[1] ?? "=";
  const rhsRaw = opMatch?.[2] ?? t;
  const rhs = parseNumericVersion(rhsRaw);
  if (!rhs) return null;

  const c = cmpVersion(mc, rhs);
  if (op === ">=") return c >= 0;
  if (op === "<=") return c <= 0;
  if (op === ">") return c > 0;
  if (op === "<") return c < 0;
  if (op === "=") return c === 0;
  if (op === "^") return mc[0] === rhs[0] && c >= 0;
  if (op === "~") return mc[0] === rhs[0] && mc[1] === rhs[1] && c >= 0;
  return null;
}

function checkBracketRange(constraint: string, mc: number[]): boolean | null {
  const m = constraint.trim().match(/^([\[\(])\s*([^,]*)\s*,\s*([^,\]\)]*)\s*([\]\)])$/);
  if (!m) return null;
  const lowerInc = m[1] === "[";
  const upperInc = m[4] === "]";
  const lower = parseNumericVersion(m[2]);
  const upper = parseNumericVersion(m[3]);
  if (!lower && !upper) return null;

  if (lower) {
    const cl = cmpVersion(mc, lower);
    if (lowerInc ? cl < 0 : cl <= 0) return false;
  }
  if (upper) {
    const cu = cmpVersion(mc, upper);
    if (upperInc ? cu > 0 : cu >= 0) return false;
  }
  return true;
}

function simpleConstraintMatch(constraint: string, mcVersion: string) {
  const raw = String(constraint || "").trim();
  if (!raw || raw === "*" || raw.includes("*")) return true;
  if (raw.includes(mcVersion)) return true;

  const mc = parseNumericVersion(mcVersion);
  if (!mc) return true;

  const bracket = checkBracketRange(raw, mc);
  if (bracket !== null) return bracket;

  const alternatives = raw.split("||").map((x) => x.trim()).filter(Boolean);
  if (!alternatives.length) return true;

  for (const alt of alternatives) {
    const tokens = alt
      .replace(/,/g, " ")
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!tokens.length) continue;

    let allOk = true;
    for (const token of tokens) {
      const ok = checkSimplePredicate(token, mc);
      if (ok === null) continue;
      if (!ok) {
        allOk = false;
        break;
      }
    }
    if (allOk) return true;
  }

  // Unknown syntax should not create false criticals.
  return true;
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

  const metas = files.flatMap(readAllFabricModJsons);
  const issues: ValidationIssue[] = [];

  // Real physical mod ids from jar metadata (used for duplicate detection).
  const byPrimaryId = new Map<string, ModMeta[]>();
  // Available ids including aliases/provides (used for dependency resolution).
  const availableIds = new Set<string>();
  const availableNormalized = new Set<string>();
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
    if (m.source === "top") {
      byPrimaryId.set(m.id, [...(byPrimaryId.get(m.id) || []), m]);
    }
    availableIds.add(m.id);
    availableNormalized.add(normalizeModId(m.id));
    for (const alias of m.provides || []) {
      availableIds.add(alias);
      availableNormalized.add(normalizeModId(alias));
    }
  }

  for (const [id, list] of byPrimaryId.entries()) {
    if (list.length > 1) {
      issues.push({
        code: "duplicate-mod-id",
        severity: "warning",
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
      const depNorm = normalizeModId(depId);
      if (PROVIDED_DEPENDENCIES.has(depId) || PROVIDED_DEPENDENCIES.has(depNorm)) continue;
      if (!availableIds.has(depId) && !availableNormalized.has(depNorm)) {
        const likelyBundledOrTransitive = m.source === "nested";
        issues.push({
          code: "missing-dependency",
          severity: likelyBundledOrTransitive ? "warning" : "critical",
          title: `Missing dependency for ${m.id}`,
          detail: likelyBundledOrTransitive
            ? `${m.id} requires ${depId}${depConstraint ? ` (${depConstraint})` : ""}. This may be provided transitively by jar-in-jar dependencies.`
            : `${m.id} requires ${depId}${depConstraint ? ` (${depConstraint})` : ""}.`,
          files: [path.basename(m.file)],
          modIds: [m.id, depId]
        });
      }
    }
  }

  const installedIds = new Set(Array.from(byPrimaryId.keys()));
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

  // Collapse duplicate issue rows that can happen when multiple jars surface the same dependency miss.
  const uniq = new Map<string, ValidationIssue>();
  for (const issue of issues) {
    const key = `${issue.code}|${issue.title}|${issue.detail}`;
    if (!uniq.has(key)) uniq.set(key, issue);
  }
  const dedupedIssues = Array.from(uniq.values());

  const summary: ValidationResult["summary"] =
    dedupedIssues.some((x) => x.severity === "critical")
      ? "critical"
      : dedupedIssues.length
        ? "warnings"
        : "no-issues";

  return { summary, issues: dedupedIssues };
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
