import fs from "node:fs";
import path from "node:path";

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile<T>(filePath: string, data: T) {
  // Ensure parent directory exists (prevents ENOENT when first writing).
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
