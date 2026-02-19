import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { app } from "electron/main";
import { listInstances } from "./instances";
import { getDataRoot, getInstancesRoot, getUserDataRoot } from "./paths";
import { getUpdateChannel } from "./updater";
import { readJsonFile, writeJsonFile } from "./store";

// Health-check severity levels consumed by renderer status summaries.
export type PreflightSeverity = "ok" | "warning" | "critical";

export type PreflightCheck = {
  id: string;
  title: string;
  severity: PreflightSeverity;
  detail: string;
  remediation?: string;
};

export type PreflightResult = {
  ranAt: number;
  summary: "healthy" | "warnings" | "critical";
  checks: PreflightCheck[];
  platform: string;
  appVersion: string;
};

// Last preflight snapshot location.
function preflightPath() {
  return path.join(getDataRoot(), "preflight-health.json");
}

// Helper to keep check creation uniform and readable.
function addCheck(
  checks: PreflightCheck[],
  id: string,
  title: string,
  severity: PreflightSeverity,
  detail: string,
  remediation?: string
) {
  checks.push({ id, title, severity, detail, remediation });
}

// Write-probe that validates directory creation and write/delete permissions.
function checkWritablePath(checks: PreflightCheck[], id: string, title: string, dirPath: string) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const probe = path.join(dirPath, `.preflight-write-${Date.now()}.tmp`);
    fs.writeFileSync(probe, "ok", "utf8");
    fs.rmSync(probe, { force: true });
    addCheck(checks, id, title, "ok", `Writable: ${dirPath}`);
  } catch (err: any) {
    addCheck(
      checks,
      id,
      title,
      "critical",
      `Path is not writable: ${dirPath} (${String(err?.message ?? err)})`,
      "Check folder permissions and disk protection software."
    );
  }
}

// Validate bundled/system Java availability and baseline version compatibility.
function detectJavaRuntime(checks: PreflightCheck[]) {
  const candidates =
    process.platform === "win32"
      ? [
          path.join(process.resourcesPath, "runtime", "java21", "bin", "javaw.exe"),
          path.join(process.resourcesPath, "runtime", "java21", "bin", "java.exe"),
          path.join(process.cwd(), "runtime", "java21", "bin", "javaw.exe"),
          path.join(process.cwd(), "runtime", "java21", "bin", "java.exe")
        ]
      : [
          path.join(process.resourcesPath, "runtime", "java21", "bin", "java"),
          path.join(process.cwd(), "runtime", "java21", "bin", "java")
        ];

  const bundled = candidates.find((p) => fs.existsSync(p));
  const javaCmd = bundled || "java";
  const probe = spawnSync(javaCmd, ["-version"], { encoding: "utf8", timeout: 8000 });
  if (probe.status === 0) {
    const out = [probe.stdout, probe.stderr].filter(Boolean).join("\n");
    const major = out.match(/version\s+"(\d+)(?:\.\d+)?/);
    const majorNum = major ? Number(major[1]) : null;
    if (majorNum !== null && majorNum < 17) {
      addCheck(
        checks,
        "java-runtime",
        "Java Runtime",
        "critical",
        `Java ${majorNum} detected. Java 17+ required.`,
        "Use launcher bundled Java 21 or install a newer Java runtime."
      );
      return;
    }
    addCheck(
      checks,
      "java-runtime",
      "Java Runtime",
      "ok",
      bundled ? `Bundled runtime available (${path.basename(javaCmd)}).` : "System Java runtime available."
    );
    return;
  }

  addCheck(
    checks,
    "java-runtime",
    "Java Runtime",
    "critical",
    "No usable Java runtime found.",
    "Reinstall launcher runtime or install Java 21."
  );
}

// Sanity-check serialized instance metadata and active instance pointer integrity.
function validateInstancesMetadata(checks: PreflightCheck[]) {
  const db = listInstances();
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const inst of db.instances || []) {
    if (!inst?.id) issues.push("Instance missing id.");
    if (inst?.id && ids.has(inst.id)) issues.push(`Duplicate instance id: ${inst.id}`);
    if (inst?.id) ids.add(inst.id);

    if (!inst?.name) issues.push(`Instance ${inst?.id ?? "unknown"} missing name.`);
    if (!inst?.mcVersion) issues.push(`Instance ${inst?.id ?? "unknown"} missing mcVersion.`);
    if (!["fabric", "vanilla", "quilt", "forge", "neoforge"].includes(String(inst?.loader ?? ""))) {
      issues.push(`Instance ${inst?.id ?? "unknown"} has invalid loader.`);
    }
    if (!Number.isFinite(Number(inst?.memoryMb)) || Number(inst?.memoryMb) < 512) {
      issues.push(`Instance ${inst?.id ?? "unknown"} has invalid memoryMb.`);
    }
  }

  if (db.activeInstanceId && !ids.has(db.activeInstanceId)) {
    issues.push("activeInstanceId points to a missing instance.");
  }

  if (!issues.length) {
    addCheck(checks, "instance-metadata", "Instance Metadata", "ok", "Instance metadata integrity looks healthy.");
    return;
  }

  addCheck(
    checks,
    "instance-metadata",
    "Instance Metadata",
    "warning",
    issues.slice(0, 5).join(" "),
    "Open instance list and remove/recreate invalid entries if needed."
  );
}

// Guardrail that ensures updater channel remains within supported set.
function validateUpdaterConfig(checks: PreflightCheck[]) {
  const channel = getUpdateChannel();
  if (channel !== "stable" && channel !== "beta") {
    addCheck(
      checks,
      "updater-config",
      "Updater Channel",
      "critical",
      `Invalid updater channel: ${String(channel)}`,
      "Reset update channel in settings."
    );
    return;
  }

  if (channel === "beta") {
    addCheck(
      checks,
      "updater-config",
      "Updater Channel",
      "warning",
      "Beta channel is enabled.",
      "Use Stable channel for normal users."
    );
    return;
  }

  addCheck(checks, "updater-config", "Updater Channel", "ok", "Stable channel selected.");
}

export function runPreflightChecks(): PreflightResult {
  const checks: PreflightCheck[] = [];

  // Filesystem + runtime + config checks cover common startup/launch failures.
  checkWritablePath(checks, "write-userdata", "UserData Write Access", getUserDataRoot());
  checkWritablePath(checks, "write-data", "Data Root Write Access", getDataRoot());
  checkWritablePath(checks, "write-instances", "Instances Write Access", getInstancesRoot());
  detectJavaRuntime(checks);
  validateInstancesMetadata(checks);
  validateUpdaterConfig(checks);

  const summary: PreflightResult["summary"] = checks.some((c) => c.severity === "critical")
    ? "critical"
    : checks.some((c) => c.severity === "warning")
      ? "warnings"
      : "healthy";

  const result: PreflightResult = {
    ranAt: Date.now(),
    summary,
    checks,
    platform: `${process.platform} ${os.release()}`,
    appVersion: app.getVersion()
  };

  writeJsonFile(preflightPath(), result);
  return result;
}

export function getLastPreflightChecks(): PreflightResult | null {
  // Return cached result so renderer can display status before new checks run.
  return readJsonFile(preflightPath(), null as any);
}
