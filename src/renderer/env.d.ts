export {};

declare global {
  interface Window {
    api: {
      versionsList: () => Promise<any>;

      accountsList: () => Promise<any>;
      accountsAdd: () => Promise<any>;
      accountsSetActive: (id: string | null) => Promise<any>;
      accountsRemove: (id: string) => Promise<any>;

      instancesList: () => Promise<any>;
      instancesCreate: (cfg: any) => Promise<any>;
      instancesSetActive: (id: string | null) => Promise<any>;
      instancesUpdate: (id: string, patch: any) => Promise<any>;
      instancesRemove: (id: string) => Promise<any>;
      instancesDuplicate: (id: string) => Promise<any>;
      instancesOpenFolder: (id: string) => Promise<string>;
      instancesExport: (id: string) => Promise<
        | { ok: true; canceled: false; path: string }
        | { ok: false; canceled: true }
      >;
      instancesImport: () => Promise<
        | {
            ok: true;
            canceled: false;
            instance: any;
            lockfileApplied: boolean;
            lockfileResult: {
              appliedMods: number;
              appliedPacks: number;
              issues: string[];
              drift: {
                clean: boolean;
                checkedAt: string;
                issues: Array<{
                  id: string;
                  category: "mod" | "pack";
                  severity: "warning" | "critical";
                  message: string;
                }>;
              };
            } | null;
          }
        | { ok: false; canceled: true }
      >;
      modrinthPacksSearch: (
        query: string,
        limit?: number
      ) => Promise<{
        hits: Array<{
          projectId: string;
          title: string;
          description: string;
          iconUrl: string | null;
          latestVersionId: string | null;
        }>;
      }>;
      modrinthPacksInstall: (payload: {
        projectId: string;
        versionId?: string;
        nameOverride?: string;
        accountId?: string | null;
        memoryMb?: number;
      }) => Promise<{ instance: any; version: { id: string; name: string; versionNumber: string } }>;
      packArchiveImport: (payload: {
        provider: "auto" | "curseforge" | "technic" | "atlauncher" | "ftb";
        defaults?: {
          name?: string;
          mcVersion?: string;
          accountId?: string | null;
          memoryMb?: number;
        };
      }) => Promise<
        | {
            ok: true;
            canceled: false;
            result: {
              instance: any;
              detectedFormat: "modrinth" | "curseforge" | "generic";
              notes: string[];
            };
          }
        | { ok: false; canceled: true }
      >;
      lockfileGenerate: (instanceId: string) => Promise<{
        generatedAt: string;
        artifacts: number;
        notes: string[];
      }>;
      lockfileDrift: (instanceId: string) => Promise<{
        clean: boolean;
        checkedAt: string;
        issues: Array<{
          id: string;
          category: "mod" | "pack";
          severity: "warning" | "critical";
          message: string;
        }>;
      }>;
      serversList: (instanceId: string) => Promise<{
        preferredServerId: string | null;
        servers: Array<{
          id: string;
          name: string;
          address: string;
          notes?: string;
          linkedProfile?: string | null;
          createdAt: number;
          updatedAt: number;
        }>;
      }>;
      serversUpsert: (
        instanceId: string,
        entry: { id?: string; name: string; address: string; notes?: string }
      ) => Promise<any>;
      serversRemove: (instanceId: string, serverId: string) => Promise<any>;
      serversSetPreferred: (instanceId: string, serverId: string | null) => Promise<any>;
      serversExportProfile: (instanceId: string, serverId: string) => Promise<
        | { ok: true; canceled: false; path: string }
        | { ok: false; canceled: true }
      >;
      serversImportProfile: (instanceId: string) => Promise<
        | { ok: true; canceled: false; result: any }
        | { ok: false; canceled: true }
      >;

      modsList: (instanceId: string) => Promise<any>;
      modsSetEnabled: (instanceId: string, modId: string, enabled: boolean) => Promise<any>;
      modsRefresh: (instanceId: string, mcVersion?: string) => Promise<any>;
      modsValidate: (instanceId: string) => Promise<{
        summary: "no-issues" | "warnings" | "critical";
        issues: Array<{
          code: string;
          severity: "warning" | "critical" | "ok";
          title: string;
          detail: string;
          modIds?: string[];
        }>;
      }>;
      modsFixDuplicates: (instanceId: string) => Promise<{ removed: string[] }>;

      // Recommended packs (Modrinth)
      packsList: (instanceId: string) => Promise<{
        items: Array<{
          id: string;
          name: string;
          kind: "resourcepack" | "shaderpack";
          required: boolean;
          enabled: boolean;
          status: "ok" | "unavailable" | "error";
          versionName: string | null;
          error: string | null;
        }>;
      }>;
      packsRefresh: (instanceId: string, mcVersion?: string) => Promise<any>;
      packsSetEnabled: (instanceId: string, packId: string, enabled: boolean) => Promise<any>;

      // Local uploads
      contentPickFiles: (kind: "mods" | "resourcepacks" | "shaderpacks") => Promise<string[]>;
      contentAdd: (
        instanceId: string,
        kind: "mods" | "resourcepacks" | "shaderpacks",
        filePaths: string[]
      ) => Promise<any>;
      contentList: (
        instanceId: string,
        kind: "mods" | "resourcepacks" | "shaderpacks"
      ) => Promise<Array<{ name: string; size: number; modifiedMs: number }>>;
      contentRemove: (
        instanceId: string,
        kind: "mods" | "resourcepacks" | "shaderpacks",
        name: string
      ) => Promise<any>;
      contentToggleEnabled: (
        instanceId: string,
        kind: "mods" | "resourcepacks" | "shaderpacks",
        name: string,
        enabled: boolean
      ) => Promise<{ ok: boolean; name: string }>;


      fabricPickLoader: (mcVersion: string) => Promise<string>;
      fabricInstall: (instanceId: string, mcVersion: string, loaderVersion: string) => Promise<any>;
      vanillaInstall: (mcVersion: string) => Promise<any>;

      // ✅ IDs only
      launch: (
        instanceId: string,
        accountId: string,
        runtimePrefs?: { jvmArgs?: string; preLaunch?: string; postExit?: string; serverAddress?: string }
      ) => Promise<any>;
      launchIsRunning: (instanceId: string) => Promise<boolean>;
      launchStop: (instanceId: string) => Promise<boolean>;
      launchDiagnose: (instanceId: string, lines: string[]) => Promise<{
        code: "missing-fabric-loader" | "wrong-java-version" | "mod-mismatch" | "duplicate-mods" | "unknown";
        severity: "warning" | "critical";
        summary: string;
        details: string[];
        recommendedActions: string[];
        fixAction: "install-fabric-loader" | "refresh-mods" | "fix-duplicate-mods" | "none";
        canAutoFix: boolean;
      }>;
      launchApplyFix: (
        instanceId: string,
        action: "install-fabric-loader" | "refresh-mods" | "fix-duplicate-mods" | "none"
      ) => Promise<{ ok: boolean; message: string; removed?: string[] }>;
      rollbackCreateSnapshot: (
        instanceId: string,
        reason: "instance-preset" | "mods-refresh" | "packs-refresh" | "manual",
        note?: string
      ) => Promise<any>;
      rollbackGetLatest: (instanceId: string) => Promise<{
        id: string;
        createdAt: number;
        reason: string;
        note?: string;
      } | null>;
      rollbackRestoreLatest: (instanceId: string) => Promise<any>;
      updaterGetState: () => Promise<{
        status: "idle" | "checking" | "update-available" | "up-to-date" | "downloading" | "downloaded" | "error";
        currentVersion: string;
        latestVersion?: string;
        progressPercent?: number;
        message?: string;
        updatedAt: number;
      }>;
      updaterGetChannel: () => Promise<"stable" | "beta">;
      updaterSetChannel: (channel: "stable" | "beta") => Promise<"stable" | "beta">;
      updaterCheck: () => Promise<boolean>;
      updaterDownload: () => Promise<boolean>;
      updaterInstall: () => Promise<boolean>;
      diagnosticsExport: () => Promise<
        | { ok: true; canceled: false; path: string }
        | { ok: false; canceled: true }
      >;
      preflightRun: () => Promise<{
        ranAt: number;
        summary: "healthy" | "warnings" | "critical";
        checks: Array<{
          id: string;
          title: string;
          severity: "ok" | "warning" | "critical";
          detail: string;
          remediation?: string;
        }>;
        platform: string;
        appVersion: string;
      }>;
      preflightGetLast: () => Promise<{
        ranAt: number;
        summary: "healthy" | "warnings" | "critical";
        checks: Array<{
          id: string;
          title: string;
          severity: "ok" | "warning" | "critical";
          detail: string;
          remediation?: string;
        }>;
        platform: string;
        appVersion: string;
      } | null>;
      optimizerPreview: (
        profile: "conservative" | "balanced" | "aggressive"
      ) => Promise<{
        profile: string;
        hardware: { totalRamMb: number; cpuCores: number; cpuModel: string; gpuModel: string | null };
        memoryMb: number;
        jvmArgs: string;
        gc: "G1GC" | "ZGC";
        modsToEnable: string[];
      }>;
      optimizerApply: (
        instanceId: string,
        profile: "conservative" | "balanced" | "aggressive"
      ) => Promise<any>;
      optimizerRestore: (instanceId: string) => Promise<boolean>;
      benchmarkRun: (
        instanceId: string,
        profile?: "conservative" | "balanced" | "aggressive"
      ) => Promise<{
        id: string;
        createdAt: string;
        profile: string;
        avgFps: number;
        low1Fps: number;
        maxMemoryMb: number;
        durationMs: number;
        note: string;
      }>;
      benchmarkList: (instanceId: string) => Promise<
        Array<{
          id: string;
          createdAt: string;
          profile: string;
          avgFps: number;
          low1Fps: number;
          maxMemoryMb: number;
          durationMs: number;
          note: string;
        }>
      >;

      onLaunchLog: (cb: (line: string) => void) => void;
      onUpdaterEvent: (cb: (evt: any) => void) => void;
    };
  }
}
