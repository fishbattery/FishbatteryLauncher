import fs from "node:fs";
import path from "node:path";
import { getInstanceDir, listInstances } from "./instances";
import { detectHardwareSummary } from "./optimizer";

export type BenchmarkRun = {
  id: string;
  createdAt: string;
  profile: string;
  avgFps: number;
  low1Fps: number;
  maxMemoryMb: number;
  durationMs: number;
  note: string;
};

function getBenchmarkPath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "benchmark-results.json");
}

function readRuns(instanceId: string): BenchmarkRun[] {
  const p = getBenchmarkPath(instanceId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as BenchmarkRun[];
  } catch {
    return [];
  }
}

function writeRuns(instanceId: string, runs: BenchmarkRun[]) {
  const p = getBenchmarkPath(instanceId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(runs, null, 2), "utf8");
}

export function listBenchmarks(instanceId: string) {
  return readRuns(instanceId);
}

export function runBenchmark(instanceId: string, profile = "balanced"): BenchmarkRun {
  const db = listInstances();
  const inst = db.instances.find((x) => x.id === instanceId);
  if (!inst) throw new Error("Instance not found");

  const hw = detectHardwareSummary();
  const start = Date.now();
  const rss0 = process.memoryUsage().rss;

  // Initial synthetic benchmark pass: deterministic scoring from instance + hardware.
  // This avoids mutating worlds and gives comparable baselines before full live FPS integration.
  const ramFactor = Math.min(1.4, Math.max(0.7, inst.memoryMb / 4096));
  const coreFactor = Math.min(1.5, Math.max(0.8, hw.cpuCores / 8));
  const base = 90 * ramFactor * coreFactor;
  const profileFactor = profile === "aggressive" ? 1.1 : profile === "conservative" ? 0.9 : 1;
  const avgFps = Math.round(base * profileFactor);
  const low1Fps = Math.round(avgFps * 0.72);
  const maxMemoryMb = Math.round(Math.max(rss0, process.memoryUsage().rss) / (1024 * 1024));
  const durationMs = Date.now() - start;

  const run: BenchmarkRun = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    profile,
    avgFps,
    low1Fps,
    maxMemoryMb,
    durationMs,
    note: "Synthetic baseline benchmark (non-world-mutating)."
  };

  const runs = readRuns(instanceId);
  runs.unshift(run);
  writeRuns(instanceId, runs.slice(0, 50));
  return run;
}
