import { dialog, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getInstanceDir } from "./instances";

type ContentKind = "mods" | "resourcepacks" | "shaderpacks";

function kindFolder(kind: ContentKind) {
  if (kind === "mods") return "mods";
  if (kind === "resourcepacks") return "resourcepacks";
  return "shaderpacks";
}

function ensureDir(instanceId: string, kind: ContentKind) {
  const dir = path.join(getInstanceDir(instanceId), kindFolder(kind));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function isAllowedFile(kind: ContentKind, filePath: string) {
  const lower = filePath.toLowerCase();
  if (kind === "mods") return lower.endsWith(".jar") || lower.endsWith(".jar.disabled");
  // packs are zip
  return lower.endsWith(".zip") || lower.endsWith(".zip.disabled");
}

function safeBasename(p: string) {
  return path.basename(p).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function listFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((name) => {
      const p = path.join(dir, name);
      let st: fs.Stats;
      try {
        st = fs.statSync(p);
      } catch {
        return null;
      }
      if (!st.isFile()) return null;
      return { name, size: st.size, modifiedMs: st.mtimeMs };
    })
    .filter(Boolean) as Array<{ name: string; size: number; modifiedMs: number }>;
}

export function registerContentIpc() {
  ipcMain.handle("content:pickFiles", async (_e, kind: ContentKind) => {
    const filters =
      kind === "mods"
        ? [{ name: "Mods", extensions: ["jar"] }]
        : [{ name: "Packs", extensions: ["zip"] }];

    const res = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters
    });

    if (res.canceled) return [];
    return res.filePaths ?? [];
  });

  ipcMain.handle(
    "content:add",
    async (_e, args: { instanceId: string; kind: ContentKind; filePaths: string[] }) => {
      const { instanceId, kind, filePaths } = args || ({} as any);
      if (!instanceId) throw new Error("content:add: instanceId missing");
      if (!kind) throw new Error("content:add: kind missing");
      if (!Array.isArray(filePaths)) throw new Error("content:add: filePaths missing");

      const dir = ensureDir(instanceId, kind);

      const results: Array<{ name: string; ok: boolean; error?: string }> = [];

      for (const fp of filePaths) {
        const name = safeBasename(fp);

        try {
          if (!isAllowedFile(kind, fp)) throw new Error("Invalid file type");
          const dest = path.join(dir, name);
          fs.copyFileSync(fp, dest);
          results.push({ name, ok: true });
        } catch (err: any) {
          results.push({ name, ok: false, error: String(err?.message ?? err) });
        }
      }

      return results;
    }
  );

  ipcMain.handle(
    "content:list",
    async (_e, args: { instanceId: string; kind: ContentKind }) => {
      const { instanceId, kind } = args || ({} as any);
      if (!instanceId) throw new Error("content:list: instanceId missing");
      if (!kind) throw new Error("content:list: kind missing");
      const dir = ensureDir(instanceId, kind);
      return listFiles(dir);
    }
  );

  ipcMain.handle(
    "content:remove",
    async (_e, args: { instanceId: string; kind: ContentKind; name: string }) => {
      const { instanceId, kind, name } = args || ({} as any);
      if (!instanceId) throw new Error("content:remove: instanceId missing");
      if (!kind) throw new Error("content:remove: kind missing");
      if (!name) throw new Error("content:remove: name missing");

      const dir = ensureDir(instanceId, kind);
      const p = path.join(dir, path.basename(name));
      if (!fs.existsSync(p)) return false;
      fs.rmSync(p);
      return true;
    }
  );

  // ✅ NEW: toggle enable/disable by renaming (.disabled suffix)
  ipcMain.handle(
    "content:toggleEnabled",
    async (_e, args: { instanceId: string; kind: ContentKind; name: string; enabled: boolean }) => {
      const { instanceId, kind, name, enabled } = args || ({} as any);
      if (!instanceId) throw new Error("content:toggleEnabled: instanceId missing");
      if (!kind) throw new Error("content:toggleEnabled: kind missing");
      if (!name) throw new Error("content:toggleEnabled: name missing");

      const dir = ensureDir(instanceId, kind);

      const base = path.basename(name);
      const from = path.join(dir, base);

      if (!fs.existsSync(from)) throw new Error("File not found");

      const isDisabled = base.endsWith(".disabled");
      const targetName = enabled
        ? isDisabled
          ? base.replace(/\.disabled$/, "")
          : base
        : isDisabled
          ? base
          : base + ".disabled";

      const to = path.join(dir, targetName);

      if (from === to) return { ok: true, name: targetName };

      fs.renameSync(from, to);
      return { ok: true, name: targetName };
    }
  );
}
