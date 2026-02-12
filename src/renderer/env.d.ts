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
        | { ok: true; canceled: false; instance: any }
        | { ok: false; canceled: true }
      >;

      modsList: (instanceId: string) => Promise<any>;
      modsSetEnabled: (instanceId: string, modId: string, enabled: boolean) => Promise<any>;
      modsRefresh: (instanceId: string, mcVersion?: string) => Promise<any>;

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

      // ✅ IDs only
      launch: (
        instanceId: string,
        accountId: string,
        runtimePrefs?: { jvmArgs?: string; preLaunch?: string; postExit?: string }
      ) => Promise<any>;
      launchIsRunning: (instanceId: string) => Promise<boolean>;
      launchStop: (instanceId: string) => Promise<boolean>;
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

      onLaunchLog: (cb: (line: string) => void) => void;
      onUpdaterEvent: (cb: (evt: any) => void) => void;
    };
  }
}
