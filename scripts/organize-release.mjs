import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "release");

const versionPattern = /(\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?)/;
const knownSuffixes = [
  ".exe.blockmap",
  ".tar.gz",
  ".blockmap",
  ".appimage",
  ".dmg",
  ".zip",
  ".deb",
  ".rpm",
  ".exe",
  ".yml",
  ".yaml"
];

const entries = readdirSync(releaseDir, { withFileTypes: true });
const versionedEntries = [];

function stripKnownSuffixes(name) {
  let out = name;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of knownSuffixes) {
      if (out.toLowerCase().endsWith(suffix)) {
        out = out.slice(0, -suffix.length);
        changed = true;
      }
    }
  }
  return out;
}

function extractVersion(name) {
  const cleaned = stripKnownSuffixes(name.replace(/^v/i, ""));
  const match = cleaned.match(versionPattern);
  return match ? match[1] : null;
}

function moveIntoVersion(name, version) {
  const fromPath = path.join(releaseDir, name);
  const toDir = path.join(releaseDir, `v${version}`);
  const toPath = path.join(toDir, name);
  mkdirSync(toDir, { recursive: true });
  renameSync(fromPath, toPath);
  console.log(`moved: ${name} -> release/v${version}/`);
}

function moveDirContentsIntoVersion(dirName, version) {
  const fromDir = path.join(releaseDir, dirName);
  const toDir = path.join(releaseDir, `v${version}`);
  mkdirSync(toDir, { recursive: true });
  const children = readdirSync(fromDir, { withFileTypes: true });
  for (const child of children) {
    renameSync(path.join(fromDir, child.name), path.join(toDir, child.name));
  }
  rmSync(fromDir, { recursive: true, force: true });
  console.log(`normalized folder: ${dirName} -> release/v${version}/`);
}

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  if (!/^v/i.test(entry.name)) continue;
  if (!entry.name.toLowerCase().includes(".exe")) continue;
  const extracted = extractVersion(entry.name);
  if (!extracted) continue;
  moveDirContentsIntoVersion(entry.name, extracted);
}

for (const entry of entries) {
  if (/^v\d/.test(entry.name)) continue;
  const extracted = extractVersion(entry.name);
  if (!extracted) continue;
  const parsed = semver.valid(extracted) || semver.valid(semver.coerce(extracted));
  if (!parsed) continue;
  versionedEntries.push({ name: entry.name, version: extracted });
}

const latestKnownVersion = versionedEntries
  .map((v) => v.version)
  .sort(semver.rcompare)[0];

for (const item of versionedEntries) {
  moveIntoVersion(item.name, item.version);
}

if (latestKnownVersion) {
  const leftovers = readdirSync(releaseDir, { withFileTypes: true }).filter(
    (entry) =>
      !/^v\d/.test(entry.name) &&
      (entry.name === "latest.yml" ||
        entry.name === "builder-debug.yml" ||
        entry.name === "builder-effective-config.yaml" ||
        entry.name === "win-unpacked")
  );

  for (const entry of leftovers) {
    moveIntoVersion(entry.name, latestKnownVersion);
  }
}
