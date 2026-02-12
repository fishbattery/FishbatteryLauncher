import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { getInstanceDir } from "./instances";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function iconPath(instanceId: string) {
  return path.join(getInstanceDir(instanceId), "instance-icon.png");
}

function normalizeExt(name: string) {
  const ext = path.extname(String(name || "")).toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : ".png";
}

export function clearInstanceIcon(instanceId: string) {
  const p = iconPath(instanceId);
  if (fs.existsSync(p)) {
    try { fs.rmSync(p); } catch {}
  }
}

export function setInstanceIconFromFile(instanceId: string, sourcePath: string) {
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("Icon file not found");
  const ext = normalizeExt(sourcePath);
  if (!ALLOWED_EXT.has(ext)) throw new Error("Unsupported icon format");

  const out = iconPath(instanceId);
  ensureDir(path.dirname(out));
  fs.copyFileSync(sourcePath, out);
  return out;
}

export async function setInstanceIconFromUrl(instanceId: string, url: string) {
  const u = String(url || "").trim();
  if (!u) throw new Error("Icon URL missing");

  const res = await fetch(u, { headers: { "User-Agent": "FishbatteryLauncher/0.2.1" } });
  if (!res.ok) throw new Error(`Failed to download icon (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("Icon download returned empty response");

  const out = iconPath(instanceId);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, buf);
  return out;
}

export function setInstanceIconFallback(instanceId: string, label: string, theme: "green" | "blue" = "green") {
  const text = String(label || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("") || "FB";

  const colors =
    theme === "blue"
      ? { a: "#12406b", b: "#1d6db8", c: "#d9f0ff" }
      : { a: "#124e3a", b: "#1d8d67", c: "#e6fff5" };

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.a}"/>
      <stop offset="100%" stop-color="${colors.b}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="38" fill="url(#g)"/>
  <text x="128" y="148" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="88" font-weight="700" fill="${colors.c}">${text}</text>
</svg>`;

  const out = iconPath(instanceId);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, Buffer.from(svg, "utf8"));
  return out;
}

export function getInstanceIconDataUrl(instanceId: string): string | null {
  const p = iconPath(instanceId);
  if (!fs.existsSync(p)) return null;
  try {
    const buf = fs.readFileSync(p);
    if (!buf.length) return null;
    const ext = path.extname(p).toLowerCase();
    const mime =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".bmp"
              ? "image/bmp"
              : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
