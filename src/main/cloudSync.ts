import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadModsState, saveModsState, type ModsState } from "./mods";
import { loadPacksState, savePacksState, type PacksState } from "./packs";
import {
  getInstanceDir,
  getModsStatePath,
  listInstances,
  replaceInstancesFromSync,
  type InstanceConfig
} from "./instances";
import { getCloudSyncStatePath } from "./paths";
import { readJsonFile, writeJsonFile } from "./store";
import { requestLauncherAccountAuthed } from "./launcherAccount";

// Cloud sync orchestration overview:
// - Captures local launcher snapshot (settings + synced instances + mods/packs state).
// - Compares local/remote revisions and timestamps.
// - Applies conflict policy and pushes/pulls merged results.
// - Persists local sync metadata (`lastSyncedAt`, status, revision, snapshot hash).

type SyncConflictPolicy = "ask" | "newer-wins" | "prefer-local" | "prefer-cloud";

type CloudSyncSnapshot = {
  settings: Record<string, unknown>;
  activeInstanceId: string | null;
  instances: InstanceConfig[];
  modsStateByInstance: Record<string, ModsState>;
  packsStateByInstance: Record<string, PacksState>;
  settingsUpdatedAt: number;
  instancesUpdatedAt: number;
  capturedAt: number;
};

type CloudSyncRemote = {
  revision: number;
  updatedAt: number;
  payload: CloudSyncSnapshot;
};

type CloudSyncState = {
  lastSyncedAt: number | null;
  lastStatus: "idle" | "up-to-date" | "pushed" | "pulled" | "conflict" | "error";
  lastError: string | null;
  lastRemoteRevision: number | null;
  lastSnapshotHash: string | null;
};

type SyncNowInput = {
  settings: Record<string, unknown>;
  policy?: SyncConflictPolicy;
  resolveConflict?: boolean;
};

export type SyncNowResult = {
  ok: boolean;
  status: "up-to-date" | "pushed" | "pulled" | "conflict" | "error" | "skipped";
  message: string;
  lastSyncedAt: number | null;
  lastRemoteRevision: number | null;
  settingsPatch?: Record<string, unknown> | null;
  conflict?: {
    localSettingsUpdatedAt: number;
    localInstancesUpdatedAt: number;
    remoteSettingsUpdatedAt: number;
    remoteInstancesUpdatedAt: number;
  };
};

const DEFAULT_STATE: CloudSyncState = {
  lastSyncedAt: null,
  lastStatus: "idle",
  lastError: null,
  lastRemoteRevision: null,
  lastSnapshotHash: null
};

const PATH_SYNC_STATE = String(process.env.FISHBATTERY_ACCOUNT_SYNC_STATE_PATH || "/v1/sync/state").startsWith("/")
  ? String(process.env.FISHBATTERY_ACCOUNT_SYNC_STATE_PATH || "/v1/sync/state")
  : `/${String(process.env.FISHBATTERY_ACCOUNT_SYNC_STATE_PATH || "/v1/sync/state")}`;

function readLocalSyncState(): CloudSyncState {
  const state = readJsonFile<CloudSyncState>(getCloudSyncStatePath(), DEFAULT_STATE);
  return {
    lastSyncedAt: Number.isFinite(Number(state?.lastSyncedAt)) ? Number(state.lastSyncedAt) : null,
    lastStatus:
      state?.lastStatus === "up-to-date" ||
      state?.lastStatus === "pushed" ||
      state?.lastStatus === "pulled" ||
      state?.lastStatus === "conflict" ||
      state?.lastStatus === "error"
        ? state.lastStatus
        : "idle",
    lastError: state?.lastError ? String(state.lastError) : null,
    lastRemoteRevision: Number.isFinite(Number(state?.lastRemoteRevision)) ? Number(state.lastRemoteRevision) : null,
    lastSnapshotHash: state?.lastSnapshotHash ? String(state.lastSnapshotHash) : null
  };
}

function writeLocalSyncState(state: CloudSyncState): void {
  writeJsonFile(getCloudSyncStatePath(), state);
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fileMtimeMs(p: string): number {
  try {
    if (!fs.existsSync(p)) return 0;
    return Number(fs.statSync(p).mtimeMs || 0);
  } catch {
    return 0;
  }
}

function pickSyncedInstances(instances: InstanceConfig[]): InstanceConfig[] {
  return (instances || [])
    .filter((inst) => inst?.syncEnabled !== false)
    .map((inst) => ({ ...inst, syncEnabled: true }));
}

function hashSnapshot(snapshot: CloudSyncSnapshot): string {
  const str = JSON.stringify(snapshot);
  return crypto.createHash("sha256").update(str).digest("hex");
}

function sanitizeSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = [
    "theme",
    "blur",
    "accentColor",
    "surfaceAlpha",
    "cornerRadius",
    "borderThickness",
    "pixelFont",
    "updateChannel",
    "showSnapshots",
    "autoUpdateMods",
    "defaultMemoryMb",
    "jvmArgs",
    "settingsUpdatedAt",
    "cloudSyncEnabled",
    "cloudSyncAuto",
    "cloudSyncConflictPolicy"
  ];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(settings || {}, key)) {
      out[key] = settings[key];
    }
  }
  return out;
}

function collectLocalSnapshot(settings: Record<string, unknown>): CloudSyncSnapshot {
  const db = listInstances();
  const syncedInstances = pickSyncedInstances(db.instances || []);
  const modsStateByInstance: Record<string, ModsState> = {};
  const packsStateByInstance: Record<string, PacksState> = {};

  let instancesUpdatedAt = numberOr(db.updatedAt, 0);
  for (const inst of syncedInstances) {
    const modsPath = getModsStatePath(inst.id);
    const packsPath = path.join(getInstanceDir(inst.id), "packs-state.json");
    instancesUpdatedAt = Math.max(instancesUpdatedAt, fileMtimeMs(modsPath), fileMtimeMs(packsPath));
    modsStateByInstance[inst.id] = loadModsState(inst.id);
    packsStateByInstance[inst.id] = loadPacksState(inst.id);
  }

  const settingsPatch = sanitizeSettings(settings || {});
  const settingsUpdatedAt = numberOr(settingsPatch.settingsUpdatedAt, Date.now());

  return {
    settings: settingsPatch,
    activeInstanceId: db.activeInstanceId ?? null,
    instances: syncedInstances,
    modsStateByInstance,
    packsStateByInstance,
    settingsUpdatedAt,
    instancesUpdatedAt,
    capturedAt: Date.now()
  };
}

async function fetchRemoteSyncState(): Promise<CloudSyncRemote> {
  const payload = (await requestLauncherAccountAuthed(PATH_SYNC_STATE, {
    method: "GET"
  })) as unknown as any;
  const remotePayload = (payload?.payload || {}) as Partial<CloudSyncSnapshot>;
  return {
    revision: numberOr(payload?.revision, 0),
    updatedAt: numberOr(payload?.updatedAt, 0),
    payload: {
      settings: (remotePayload.settings || {}) as Record<string, unknown>,
      activeInstanceId:
        remotePayload.activeInstanceId == null ? null : String(remotePayload.activeInstanceId),
      instances: Array.isArray(remotePayload.instances) ? (remotePayload.instances as InstanceConfig[]) : [],
      modsStateByInstance:
        typeof remotePayload.modsStateByInstance === "object" && remotePayload.modsStateByInstance
          ? (remotePayload.modsStateByInstance as Record<string, ModsState>)
          : {},
      packsStateByInstance:
        typeof remotePayload.packsStateByInstance === "object" && remotePayload.packsStateByInstance
          ? (remotePayload.packsStateByInstance as Record<string, PacksState>)
          : {},
      settingsUpdatedAt: numberOr(remotePayload.settingsUpdatedAt, 0),
      instancesUpdatedAt: numberOr(remotePayload.instancesUpdatedAt, 0),
      capturedAt: numberOr(remotePayload.capturedAt, 0)
    }
  };
}

async function pushRemoteSyncState(
  snapshot: CloudSyncSnapshot,
  baseRevision: number | null
): Promise<CloudSyncRemote> {
  const payload = (await requestLauncherAccountAuthed(PATH_SYNC_STATE, {
    method: "PUT",
    body: {
      baseRevision,
      payload: snapshot
    }
  })) as unknown as any;
  return {
    revision: numberOr(payload?.revision, 0),
    updatedAt: numberOr(payload?.updatedAt, Date.now()),
    payload: {
      settings: (payload?.payload?.settings || {}) as Record<string, unknown>,
      activeInstanceId: payload?.payload?.activeInstanceId ?? null,
      instances: Array.isArray(payload?.payload?.instances) ? payload.payload.instances : [],
      modsStateByInstance:
        payload?.payload?.modsStateByInstance && typeof payload.payload.modsStateByInstance === "object"
          ? payload.payload.modsStateByInstance
          : {},
      packsStateByInstance:
        payload?.payload?.packsStateByInstance && typeof payload.payload.packsStateByInstance === "object"
          ? payload.payload.packsStateByInstance
          : {},
      settingsUpdatedAt: numberOr(payload?.payload?.settingsUpdatedAt, 0),
      instancesUpdatedAt: numberOr(payload?.payload?.instancesUpdatedAt, 0),
      capturedAt: numberOr(payload?.payload?.capturedAt, 0)
    }
  };
}

function applyRemoteSnapshot(snapshot: CloudSyncSnapshot): { settingsPatch: Record<string, unknown> } {
  const localDb = listInstances();
  const localUnsynced = (localDb.instances || []).filter((inst) => inst?.syncEnabled === false);
  const cloudInstances = pickSyncedInstances(Array.isArray(snapshot.instances) ? snapshot.instances : []);
  const mergedInstances = [...localUnsynced, ...cloudInstances];
  const mergedActive = mergedInstances.some((x) => x.id === snapshot.activeInstanceId)
    ? snapshot.activeInstanceId
    : localUnsynced.some((x) => x.id === localDb.activeInstanceId)
      ? localDb.activeInstanceId
      : mergedInstances[0]?.id ?? null;

  replaceInstancesFromSync({
    activeInstanceId: mergedActive,
    instances: mergedInstances,
    updatedAt: numberOr(snapshot.instancesUpdatedAt, Date.now())
  });

  for (const inst of cloudInstances) {
    if (snapshot.modsStateByInstance?.[inst.id]) saveModsState(inst.id, snapshot.modsStateByInstance[inst.id]);
    if (snapshot.packsStateByInstance?.[inst.id]) savePacksState(inst.id, snapshot.packsStateByInstance[inst.id]);
  }

  return {
    settingsPatch: sanitizeSettings(snapshot.settings || {})
  };
}

function chooseConflictPolicy(
  policy: SyncConflictPolicy,
  local: CloudSyncSnapshot,
  remote: CloudSyncSnapshot
): "local" | "remote" | "conflict" {
  if (policy === "prefer-local") return "local";
  if (policy === "prefer-cloud") return "remote";
  if (policy === "newer-wins") {
    const localEdge = Math.max(local.settingsUpdatedAt || 0, local.instancesUpdatedAt || 0);
    const remoteEdge = Math.max(remote.settingsUpdatedAt || 0, remote.instancesUpdatedAt || 0);
    return localEdge >= remoteEdge ? "local" : "remote";
  }
  return "conflict";
}

export function getCloudSyncState() {
  return readLocalSyncState();
}

export async function syncCloudNow(input: SyncNowInput): Promise<SyncNowResult> {
  const meta = readLocalSyncState();
  try {
    const localSnapshot = collectLocalSnapshot(input?.settings || {});
    const localHash = hashSnapshot(localSnapshot);
    const remote = await fetchRemoteSyncState();
    const remoteHash = hashSnapshot(remote.payload);

    if (remoteHash === localHash) {
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "up-to-date",
        lastError: null,
        lastRemoteRevision: remote.revision,
        lastSnapshotHash: localHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "up-to-date",
        message: "Cloud sync is up to date.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision
      };
    }

    const remoteChangedSinceLastSync =
      meta.lastRemoteRevision != null && remote.revision !== meta.lastRemoteRevision;
    const localChangedSinceLastSync =
      meta.lastSnapshotHash != null ? meta.lastSnapshotHash !== localHash : true;

    const resolvingConflict = input?.resolveConflict === true;

    // If we are explicitly resolving a conflict, obey the selected policy immediately.
    if (resolvingConflict && (input?.policy === "prefer-cloud" || input?.policy === "prefer-local")) {
      if (input.policy === "prefer-cloud") {
        const applied = applyRemoteSnapshot(remote.payload);
        const next: CloudSyncState = {
          ...meta,
          lastSyncedAt: Date.now(),
          lastStatus: "pulled",
          lastError: null,
          lastRemoteRevision: remote.revision,
          lastSnapshotHash: remoteHash
        };
        writeLocalSyncState(next);
        return {
          ok: true,
          status: "pulled",
          message: "Conflict resolved using cloud state.",
          lastSyncedAt: next.lastSyncedAt,
          lastRemoteRevision: next.lastRemoteRevision,
          settingsPatch: applied.settingsPatch
        };
      }
      const pushed = await pushRemoteSyncState(localSnapshot, remote.revision);
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "pushed",
        lastError: null,
        lastRemoteRevision: pushed.revision,
        lastSnapshotHash: localHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "pushed",
        message: "Conflict resolved using local state.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision
      };
    }

    // Remote changed, local unchanged -> pull.
    if (remoteChangedSinceLastSync && !localChangedSinceLastSync) {
      const applied = applyRemoteSnapshot(remote.payload);
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "pulled",
        lastError: null,
        lastRemoteRevision: remote.revision,
        lastSnapshotHash: remoteHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "pulled",
        message: "Pulled latest cloud state.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision,
        settingsPatch: applied.settingsPatch
      };
    }

    // Local changed, remote unchanged -> push.
    if (!remoteChangedSinceLastSync && localChangedSinceLastSync) {
      const pushed = await pushRemoteSyncState(localSnapshot, remote.revision);
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "pushed",
        lastError: null,
        lastRemoteRevision: pushed.revision,
        lastSnapshotHash: localHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "pushed",
        message: "Pushed local state to cloud.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision
      };
    }

    const chosen = chooseConflictPolicy(input?.policy || "ask", localSnapshot, remote.payload);
    if (chosen === "local") {
      const pushed = await pushRemoteSyncState(localSnapshot, remote.revision);
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "pushed",
        lastError: null,
        lastRemoteRevision: pushed.revision,
        lastSnapshotHash: localHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "pushed",
        message: "Conflict resolved using local state.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision
      };
    }
    if (chosen === "remote") {
      const applied = applyRemoteSnapshot(remote.payload);
      const next: CloudSyncState = {
        ...meta,
        lastSyncedAt: Date.now(),
        lastStatus: "pulled",
        lastError: null,
        lastRemoteRevision: remote.revision,
        lastSnapshotHash: remoteHash
      };
      writeLocalSyncState(next);
      return {
        ok: true,
        status: "pulled",
        message: "Conflict resolved using cloud state.",
        lastSyncedAt: next.lastSyncedAt,
        lastRemoteRevision: next.lastRemoteRevision,
        settingsPatch: applied.settingsPatch
      };
    }

    const conflictNext: CloudSyncState = {
      ...meta,
      lastStatus: "conflict",
      lastError: "Sync conflict detected. Choose local or cloud state.",
      lastRemoteRevision: remote.revision
    };
    writeLocalSyncState(conflictNext);
    return {
      ok: false,
      status: "conflict",
      message: "Sync conflict detected.",
      lastSyncedAt: meta.lastSyncedAt,
      lastRemoteRevision: remote.revision,
      conflict: {
        localSettingsUpdatedAt: numberOr(localSnapshot.settingsUpdatedAt, 0),
        localInstancesUpdatedAt: numberOr(localSnapshot.instancesUpdatedAt, 0),
        remoteSettingsUpdatedAt: numberOr(remote.payload.settingsUpdatedAt, 0),
        remoteInstancesUpdatedAt: numberOr(remote.payload.instancesUpdatedAt, 0)
      }
    };
  } catch (err: unknown) {
    const msg = String((err as Error)?.message || err || "Sync failed");
    const next: CloudSyncState = {
      ...meta,
      lastStatus: "error",
      lastError: msg
    };
    writeLocalSyncState(next);
    return {
      ok: false,
      status: "error",
      message: msg,
      lastSyncedAt: next.lastSyncedAt,
      lastRemoteRevision: next.lastRemoteRevision
    };
  }
}
