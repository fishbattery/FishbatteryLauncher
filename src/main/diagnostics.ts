import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { app } from "electron/main";
import { getAccountsPath, getDataRoot, getInstancesRoot, getUserDataRoot } from "./paths";

type JsonValue = Record<string, any> | any[] | string | number | boolean | null;

function safeReadJson(filePath: string): JsonValue | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function sanitizeAccounts(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const accounts = Array.isArray(raw.accounts) ? raw.accounts : [];
  return {
    activeId: raw.activeId ?? null,
    accounts: accounts.map((a: any) => ({
      id: a?.id ?? null,
      username: a?.username ?? null,
      addedAt: a?.addedAt ?? null
    }))
  };
}

function addFileIfExists(zip: AdmZip, diskPath: string, zipPath: string, maxBytes = 1024 * 1024) {
  if (!fs.existsSync(diskPath)) return;
  const st = fs.statSync(diskPath);
  if (!st.isFile()) return;

  if (st.size <= maxBytes) {
    zip.addLocalFile(diskPath, path.dirname(zipPath).replace(/\\/g, "/"), path.basename(zipPath));
    return;
  }

  // Keep only the tail of large files to keep diagnostics zip compact.
  const fd = fs.openSync(diskPath, "r");
  try {
    const size = st.size;
    const readSize = maxBytes;
    const start = Math.max(0, size - readSize);
    const buf = Buffer.alloc(readSize);
    const bytesRead = fs.readSync(fd, buf, 0, readSize, start);
    zip.addFile(zipPath.replace(/\\/g, "/"), buf.subarray(0, bytesRead));
  } finally {
    fs.closeSync(fd);
  }
}

function addRecentInstanceFiles(zip: AdmZip, instanceId: string, instanceDir: string) {
  const root = path.join("instances", instanceId);

  addFileIfExists(zip, path.join(instanceDir, "mods-state.json"), path.join(root, "mods-state.json"));
  addFileIfExists(zip, path.join(instanceDir, "packs-state.json"), path.join(root, "packs-state.json"));

  const logsDir = path.join(instanceDir, "logs");
  if (fs.existsSync(logsDir) && fs.statSync(logsDir).isDirectory()) {
    const recentLogs = fs
      .readdirSync(logsDir)
      .map((name) => ({ name, full: path.join(logsDir, name) }))
      .filter((x) => {
        try {
          return fs.statSync(x.full).isFile();
        } catch {
          return false;
        }
      })
      .sort((a, b) => fs.statSync(b.full).mtimeMs - fs.statSync(a.full).mtimeMs)
      .slice(0, 5);

    for (const f of recentLogs) {
      addFileIfExists(zip, f.full, path.join(root, "logs", f.name), 512 * 1024);
    }
  }
}

export function exportDiagnosticsZip(outputZipPath: string): string {
  const zip = new AdmZip();

  const stamp = new Date().toISOString();
  const userDataRoot = getUserDataRoot();
  const dataRoot = getDataRoot();
  const instancesRoot = getInstancesRoot();

  const diagnosticsMeta = {
    createdAt: stamp,
    appVersion: app.getVersion(),
    appName: app.getName(),
    platform: process.platform,
    arch: process.arch,
    os: {
      type: os.type(),
      release: os.release(),
      version: os.version()
    },
    node: process.version,
    userDataRoot,
    dataRoot,
    instancesRoot
  };

  zip.addFile("meta/system.json", Buffer.from(JSON.stringify(diagnosticsMeta, null, 2), "utf8"));

  const accounts = sanitizeAccounts(safeReadJson(getAccountsPath()));
  if (accounts) {
    zip.addFile("meta/accounts-redacted.json", Buffer.from(JSON.stringify(accounts, null, 2), "utf8"));
  }

  const instancesDbPath = path.join(instancesRoot, "_instances.json");
  const instancesDb = safeReadJson(instancesDbPath);
  if (instancesDb) {
    zip.addFile("meta/instances.json", Buffer.from(JSON.stringify(instancesDb, null, 2), "utf8"));
  }

  addFileIfExists(zip, instancesDbPath, "raw/_instances.json");
  addFileIfExists(zip, path.join(dataRoot, "preflight-health.json"), "meta/preflight-health.json");

  const instanceIds =
    Array.isArray((instancesDb as any)?.instances)
      ? (instancesDb as any).instances.map((i: any) => String(i?.id ?? "")).filter(Boolean)
      : [];

  for (const id of instanceIds) {
    const dir = path.join(instancesRoot, id);
    if (!fs.existsSync(dir)) continue;
    addRecentInstanceFiles(zip, id, dir);
  }

  fs.mkdirSync(path.dirname(outputZipPath), { recursive: true });
  zip.writeZip(outputZipPath);
  return outputZipPath;
}
