# IceTools

All-in-one Windows optimizer desktop app.

**Architecture**: Electron shell + React/DaisyUI renderer (Vite). All actual Windows
system actions (registry, services, processes, power, network) run in the Electron
main process via `child_process` (PowerShell / native CLIs) and are exposed to the
renderer through a `contextBridge` IPC API (`window.api.*`, see `electron/preload.cjs`).
The renderer never touches Node/OS APIs directly.

## Features

- **Dashboard** - live CPU/RAM/GPU/disk usage
- **Process Monitor** - list processes (with app icons), end task, change priority
- **Memory Cleaner** - safe working-set trim, close selected background apps
- **Startup Manager** - enable/disable Run-key and Startup-folder entries (reversible)
- **Services** - start/stop/restart, change startup type
- **Disk & Junk Cleanup** - scan/clean temp, Windows Update cache, prefetch, thumbnail cache, browser cache, Recycle Bin
- **Power & Network** - power plan switching (incl. Ultimate Performance), adapter enable/disable, DNS flush, Winsock/TCP-IP reset, a few reversible perf registry tweaks
- **Extra Tools** - CTT Windows Utility launcher, yt-dlp video/audio downloader with download history
- Auto-update via GitHub Releases

## Requirements

- Windows 10/11
- Node.js 18+

## Develop

```
npm install
npm run dev
```

This starts the Vite dev server and launches Electron pointed at it, with DevTools open.

Many actions (HKLM startup entries, services, adapters, some registry tweaks) require
admin rights. Run your terminal as Administrator for full functionality in dev mode.

## Build an installer

```
npm run build
```

Produces an NSIS installer in `../IceTools-release` (a sibling folder, one level
above the project - intentionally *outside* this folder; see below). The packaged
app requests admin elevation automatically (`requestedExecutionLevel:
requireAdministrator` in `package.json`'s `build.win` config).

**Why the output lives outside the project folder**: on this machine, if the
project is open in Cursor while a build runs, Cursor's own file watcher/indexer
grabs an open handle on the freshly-written `app.asar` almost immediately, which
made electron-builder's next attempt to clear and rewrite it fail with
`process cannot access the file` - confirmed directly via Windows' Restart
Manager API, not antivirus. Neither `.vscode/settings.json` excludes nor
`.cursorignore` stopped it. Pointing `build.directories.output` at a folder
outside the workspace (`../IceTools-release`) avoids the problem structurally:
Cursor has nothing to lock if the files were never part of its workspace.

## Auto-update

The app checks `RNC-Tech/IceTools`'s GitHub Releases on startup (packaged builds
only - there's nothing to check against when running from source). When an update
is found, a prompt appears in the sidebar to download it, then to restart and install.

To publish a new version:

1. Bump `version` in `package.json`.
2. Generate a GitHub [personal access token](https://github.com/settings/tokens) with
   `repo` scope (classic) or `contents: write` (fine-grained), scoped to this repo.
3. Set it as an environment variable and publish:
   ```powershell
   $env:GH_TOKEN = "<your token>"
   npm run release
   ```
   This builds, packages, and uploads the installer + update metadata directly to a
   new GitHub Release. Existing installs will pick it up automatically.

## Project layout

```
electron/
  main.cjs         # BrowserWindow + IPC handler registration
  preload.cjs       # contextBridge API surface (window.api)
  lib/              # one module per feature area, all OS calls live here
src/
  App.jsx, components/, pages/   # React + DaisyUI renderer
```
