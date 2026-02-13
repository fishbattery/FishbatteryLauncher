import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { nativeImage } from "electron";
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

export type InstanceIconTransform = {
  scale?: number;
  offsetXPct?: number;
  offsetYPct?: number;
};

export function clearInstanceIcon(instanceId: string) {
  const p = iconPath(instanceId);
  if (fs.existsSync(p)) {
    try { fs.rmSync(p); } catch {}
  }
}

export function setInstanceIconFromFile(instanceId: string, sourcePath: string, transform?: InstanceIconTransform) {
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("Icon file not found");
  const ext = normalizeExt(sourcePath);
  if (!ALLOWED_EXT.has(ext)) throw new Error("Unsupported icon format");

  const img = nativeImage.createFromPath(sourcePath);
  if (img.isEmpty()) throw new Error("Could not decode icon image");
  const sourceSize = img.getSize();
  const srcW = Math.max(1, Number(sourceSize.width || 1));
  const srcH = Math.max(1, Number(sourceSize.height || 1));
  const target = 256;

  const scale = Math.min(5, Math.max(0.2, Number(transform?.scale ?? 1)));
  const offsetXPct = Math.min(100, Math.max(-100, Number(transform?.offsetXPct ?? 0)));
  const offsetYPct = Math.min(100, Math.max(-100, Number(transform?.offsetYPct ?? 0)));

  const coverScale = Math.max(target / srcW, target / srcH) * scale;
  const cropW = Math.max(1, Math.min(srcW, Math.round(target / coverScale)));
  const cropH = Math.max(1, Math.min(srcH, Math.round(target / coverScale)));

  const maxShiftX = Math.max(0, (srcW - cropW) / 2);
  const maxShiftY = Math.max(0, (srcH - cropH) / 2);
  const shiftX = (offsetXPct / 100) * maxShiftX;
  const shiftY = (offsetYPct / 100) * maxShiftY;
  const cropX = Math.max(0, Math.min(srcW - cropW, Math.round(srcW / 2 - cropW / 2 + shiftX)));
  const cropY = Math.max(0, Math.min(srcH - cropH, Math.round(srcH / 2 - cropH / 2 + shiftY)));

  const cropped = img.crop({ x: cropX, y: cropY, width: cropW, height: cropH });
  const resized = cropped.resize({ width: target, height: target, quality: "best" });

  const out = iconPath(instanceId);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, resized.toPNG());
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

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const rendered = nativeImage.createFromDataURL(svgDataUrl);
  if (rendered.isEmpty()) throw new Error("Could not render fallback icon");
  const png = rendered.resize({ width: 256, height: 256, quality: "best" }).toPNG();
  const out = iconPath(instanceId);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, png);
  return out;
}

export function getInstanceIconDataUrl(instanceId: string): string | null {
  const p = iconPath(instanceId);
  if (!fs.existsSync(p)) return null;
  try {
    const buf = fs.readFileSync(p);
    if (!buf.length) return null;
    const textHead = buf.subarray(0, Math.min(buf.length, 256)).toString("utf8").trimStart();
    const looksLikeSvg = textHead.startsWith("<svg") || textHead.startsWith("<?xml");
    if (looksLikeSvg) {
      return `data:image/svg+xml;base64,${buf.toString("base64")}`;
    }
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
