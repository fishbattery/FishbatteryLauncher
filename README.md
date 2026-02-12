# Fishbattery Launcher

Fishbattery Launcher is an underwater-themed Minecraft launcher focused on a simple setup, isolated game instances, and curated Fabric mods.

## What it does
- Sign in with your Microsoft Minecraft account (supports multiple accounts)
- Browse and launch vanilla versions, including snapshots
- Install and launch Fabric profiles
- Use a curated Modrinth mod catalog
- Automatically resolve mod compatibility for your selected Minecraft version
- Keep each profile isolated with its own game files (mods, saves, assets, etc.)
- View launch logs directly from the launcher

## Quick start
### Requirements
- Node.js 18+ (Node.js 20+ recommended)
- A legitimate Minecraft Java Edition account

### Run locally
```bash
npm install
npm run dev
```

## Build a distributable
```bash
npm run dist
```

Output files are generated in the `release/` folder.

## Data location
Launcher data is stored in Electron's `userData` directory:
- Windows: `%APPDATA%/your-launcher`
- macOS: `~/Library/Application Support/your-launcher`
- Linux: `~/.config/your-launcher`

## Customize the mod list
Edit:
- `src/main/modrinthCatalog.ts`

Use Modrinth project IDs (not slugs).

## Troubleshooting
- Login issues: confirm your Microsoft account owns Minecraft Java Edition.
- Launch failures: verify internet connection and check the launcher logs.
- Mod availability: some mods only support specific Minecraft versions.

## Contributing
Issues and pull requests are welcome.
If you find a bug, include steps to reproduce and the relevant logs.

## Tech stack
- Electron
- TypeScript
- `minecraft-launcher-core`
- `msmc`
- Modrinth API


## License

###FishbatteryLauncher  
Copyright (C) 2026 Gudmundur Magnus Johannsson  

Licensed under the GNU General Public License v3.0.

