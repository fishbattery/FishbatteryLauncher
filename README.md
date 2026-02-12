# Your Launcher (baseline)

Electron + TypeScript Minecraft launcher scaffold:
- Isolated instances per profile
- Microsoft account login (multi-account) via msmc
- Version selector for all Mojang versions including snapshots
- Fabric profile install via Fabric Meta
- Pre-chosen mod catalog sourced from Modrinth
- Mods auto-resolve per selected Minecraft version, show Unavailable if none
- Launch + logs via minecraft-launcher-core

## Requirements
- Node.js 18+ (recommended 20+)
- A legit Minecraft Java Edition account

## Run
```bash
npm install
npm run dev
```

## Where data is stored
Electron userData folder:
- Windows: %APPDATA%/your-launcher
- macOS: ~/Library/Application Support/your-launcher
- Linux: ~/.config/your-launcher

Each instance has its own isolated game dir (versions, libraries, assets, mods, saves, etc).

## Edit the mod list
`src/main/modrinthCatalog.ts`

Project IDs are Modrinth project IDs (not slugs).