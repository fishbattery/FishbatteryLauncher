// src/main/paths.ts
import path from "node:path";
import { app } from "electron";

export const CANONICAL_FOLDER = "fishbattery-launcher";

// app.getPath("userData") is already set in main.ts via app.setPath("userData", ...)
export function getUserDataRoot(): string {
  return app.getPath("userData");
}

// Your app-internal data (assets/libraries/cache/state)
export function getDataRoot(): string {
  return path.join(getUserDataRoot(), "data");
}

// Where *instances* live (each instance has its own mods/config/logs/etc)
export function getInstancesRoot(): string {
  return path.join(getUserDataRoot(), "instances");
}

export function getAssetsRoot(): string {
  return path.join(getDataRoot(), "assets");
}

export function getLibrariesRoot(): string {
  return path.join(getDataRoot(), "libraries");
}

// (Legacy/compat) Some older code referenced a constant.
// Prefer getInstancesRoot() everywhere.
export const INSTANCES_ROOT = path.join(app.getPath("appData"), CANONICAL_FOLDER, "instances");

export function getVersionsRoot(): string {
  return path.join(getDataRoot(), "versions");
}

export function getRuntimeRoot(): string {
  return path.join(getDataRoot(), "runtime");
}

// Used by mods.ts for downloads/caching (NOT the actual instance mods folder)
export function getModCacheDir(): string {
  return path.join(getDataRoot(), "modcache");
}

// Used by packs.ts for downloads/caching (NOT the actual instance resourcepacks/shaderpacks folder)
export function getPackCacheDir(): string {
  return path.join(getDataRoot(), "packcache");
}

export function getAccountsPath(): string {
  return path.join(getDataRoot(), "accounts.json");
}
