# Fishbattery Launcher

Fishbattery Launcher is a modern, underwater-themed Minecraft launcher focused on performance, customization, and cross-device consistency.

It is built for players who want more control than the default launcher, without unnecessary complexity.

## Features

### Core Experience
- Sign in with your Microsoft Minecraft account (multi-account support)
- Launch vanilla Minecraft, including snapshots
- Install and launch Fabric profiles
- Fast and minimal interface inspired by modern developer tools


### Instance-Based System
- Fully isolated instances:
  - Mods
  - Saves
  - Configs
  - Resource packs
- No conflicts between setups
- Easy switching between different playstyles


### Mod Management (Modrinth Integration)
- Built-in Modrinth catalog
- Install mods directly inside the launcher
- Automatic compatibility filtering by Minecraft version
- Simplified mod setup without manual file management


### Customization
- 15+ built-in themes (including premium themes)
- Custom background support
- Adjustable:
  - Accent color
  - Corner radius
  - Border thickness
  - Background transparency
- Clean and fully customizable interface


### Cloud Sync
- Syncs your launcher setup across devices:
  - Instances
  - Settings
  - Preferences
- Log in and your setup is restored automatically


### Capes System
- Built-in cape system with:
  - Free capes
  - Premium capes
  - Custom capes (via cloud)
- Capes sync across devices


### Performance Focus
- Optimized for lightweight Fabric-based setups
- Faster startup compared to the official launcher
- Designed for smooth performance


### Logs and Debugging
- Built-in launch logs
- Easier troubleshooting for crashes and mod issues


## Quick Start

### Requirements
- Node.js 18+ (Node.js 20+ recommended)
- A legitimate Minecraft Java Edition account

### Run locally
```
npm install
npm run dev
```


## Build

```
npm run dist
```

Output files are generated in the `release/` folder.


## Data Location

Launcher data is stored in Electron's `userData` directory:

- Windows: `%APPDATA%/fishbattery`
- macOS: `~/Library/Application Support/fishbattery`
- Linux: `~/.config/fishbattery`


## Customizing the Mod Catalog

Edit:
```
src/main/modrinthCatalog.ts
```

Use Modrinth project IDs (not slugs).


## Philosophy

Fishbattery is built around three core ideas:

- Simplicity — no unnecessary clutter  
- Control — full ownership of your setup  
- Consistency — the same experience on every device  


## Tech Stack

- Electron
- TypeScript
- minecraft-launcher-core
- msmc (Microsoft authentication)
- Modrinth API


## Contributing

Issues and pull requests are welcome.

If you find a bug:
- Include steps to reproduce
- Attach relevant logs


## License

Fishbattery Launcher  
Copyright (C) 2026 Fishbattery

Licensed under the GNU General Public License v3.0.
