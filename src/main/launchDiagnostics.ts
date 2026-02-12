import { fixDuplicateMods } from "./modValidation";
import { installFabricVersion } from "./fabricInstall";
import { listInstances } from "./instances";
import { refreshModsForInstance } from "./mods";

export type LaunchDiagnosisCode =
  | "missing-fabric-loader"
  | "wrong-java-version"
  | "mod-mismatch"
  | "duplicate-mods"
  | "unknown";

export type LaunchFixAction =
  | "install-fabric-loader"
  | "refresh-mods"
  | "fix-duplicate-mods"
  | "none";

export type LaunchDiagnosis = {
  code: LaunchDiagnosisCode;
  severity: "warning" | "critical";
  summary: string;
  details: string[];
  recommendedActions: string[];
  fixAction: LaunchFixAction;
  canAutoFix: boolean;
};

function tail(lines: string[], max = 180) {
  if (!Array.isArray(lines)) return [];
  return lines.slice(Math.max(0, lines.length - max));
}

function hasAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(n));
}

export function diagnoseLaunchLogs(lines: string[]): LaunchDiagnosis {
  const recent = tail(lines);
  const full = recent.join("\n").toLowerCase();

  if (
    hasAny(full, [
      "fabric install incomplete",
      "no such file or directory",
      "fabric-loader",
      "failed to find fabric",
      "missing fabric"
    ])
  ) {
    return {
      code: "missing-fabric-loader",
      severity: "critical",
      summary: "Fabric loader files are missing or incomplete.",
      details: ["Launcher could not find required Fabric runtime files for this instance."],
      recommendedActions: [
        "Run the automatic fix to reinstall Fabric for this Minecraft version.",
        "Then retry launch."
      ],
      fixAction: "install-fabric-loader",
      canAutoFix: true
    };
  }

  if (
    hasAny(full, [
      "duplicate mods",
      "duplicate mod",
      "duplicate id",
      "duplicatemodsfoundexception"
    ])
  ) {
    return {
      code: "duplicate-mods",
      severity: "critical",
      summary: "Duplicate mod jars were detected.",
      details: ["Two or more files expose the same mod id and Fabric refuses to start."],
      recommendedActions: [
        "Run automatic duplicate cleanup.",
        "Review local mod files and keep one version of each mod."
      ],
      fixAction: "fix-duplicate-mods",
      canAutoFix: true
    };
  }

  if (
    hasAny(full, [
      "unsupportedclassversionerror",
      "class file version",
      "java runtime only recognizes class file versions up to",
      "requires java"
    ])
  ) {
    return {
      code: "wrong-java-version",
      severity: "critical",
      summary: "Installed Java version is not compatible with this instance.",
      details: ["Minecraft/Fabric requested a newer Java runtime than the one currently used."],
      recommendedActions: [
        "Use bundled Java 21 (default in Fishbattery releases).",
        "If needed, reinstall launcher runtime or remove incompatible custom JVM setup."
      ],
      fixAction: "none",
      canAutoFix: false
    };
  }

  if (
    hasAny(full, [
      "incompatible",
      "depends on",
      "requires minecraft",
      "could not resolve mod",
      "modresolutionexception"
    ])
  ) {
    return {
      code: "mod-mismatch",
      severity: "critical",
      summary: "One or more mods are incompatible with this Minecraft version/loader.",
      details: ["At least one enabled mod cannot be resolved for the current version stack."],
      recommendedActions: [
        "Run automatic mod refresh to pull compatible versions.",
        "Disable or replace remaining incompatible mods if needed."
      ],
      fixAction: "refresh-mods",
      canAutoFix: true
    };
  }

  return {
    code: "unknown",
    severity: "warning",
    summary: "No known failure signature detected.",
    details: ["Keep raw logs for manual debugging. Use Diagnostics export if you need support."],
    recommendedActions: ["Review recent logs and try re-running with updated mods."],
    fixAction: "none",
    canAutoFix: false
  };
}

export async function applyLaunchDiagnosisFix(instanceId: string, action: LaunchFixAction) {
  if (!instanceId) throw new Error("Instance id is required");

  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  if (action === "none") {
    return { ok: true, action, message: "No automatic fix available." };
  }

  if (action === "fix-duplicate-mods") {
    const result = fixDuplicateMods(instanceId);
    return {
      ok: true,
      action,
      removed: result.removed,
      message: result.removed.length
        ? `Removed duplicate jars: ${result.removed.join(", ")}`
        : "No duplicate jars found."
    };
  }

  if (action === "install-fabric-loader") {
    if (inst.loader !== "fabric") {
      throw new Error("Fabric reinstall is only valid for Fabric instances");
    }
    if (!inst.fabricLoaderVersion) {
      throw new Error("Instance has no Fabric loader version configured");
    }

    await installFabricVersion(instanceId, inst.mcVersion, inst.fabricLoaderVersion);
    return {
      ok: true,
      action,
      message: `Reinstalled Fabric loader ${inst.fabricLoaderVersion} for ${inst.mcVersion}.`
    };
  }

  if (action === "refresh-mods") {
    if (inst.loader !== "fabric") {
      throw new Error("Mod refresh is currently implemented for Fabric instances only");
    }

    await refreshModsForInstance({
      instanceId,
      mcVersion: inst.mcVersion,
      loader: "fabric"
    });

    return {
      ok: true,
      action,
      message: `Refreshed mods for ${inst.mcVersion}.`
    };
  }

  return { ok: false, action, message: "Unknown fix action." };
}
