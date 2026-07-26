# IceTools

All-in-one Windows optimizer desktop app.

**Architecture**: Electron shell + React/DaisyUI renderer (Vite). All actual Windows
system actions (registry, services, processes, power, network) run in the Electron
main process via `child_process` (PowerShell / native CLIs) and are exposed to the
renderer through a `contextBridge` IPC API (`window.api.*`, see `electron/preload.cjs`).
The renderer never touches Node/OS APIs directly.

## Features

- **Dashboard** - live CPU/RAM/disk usage
- **Process Monitor** - list processes, end task, change priority
- **Startup Manager** - enable/disable Run-key and Startup-folder entries (reversible)
- **Services** - start/stop/restart, change startup type
- **Disk & Junk Cleanup** - scan/clean temp, Windows Update cache, prefetch, thumbnail cache, browser cache, Recycle Bin
- **Power & Network** - power plan switching (incl. Ultimate Performance), adapter enable/disable, DNS flush, Winsock/TCP-IP reset, a few reversible perf registry tweaks

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

Produces an NSIS installer in `release/`. The packaged app requests admin elevation
automatically (`requestedExecutionLevel: requireAdministrator` in `package.json`'s
`build.win` config).

## Project layout

```
electron/
  main.cjs         # BrowserWindow + IPC handler registration
  preload.cjs       # contextBridge API surface (window.api)
  lib/              # one module per feature area, all OS calls live here
src/
  App.jsx, components/, pages/   # React + DaisyUI renderer
```
