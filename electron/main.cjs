const { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen } = require("electron");
const path = require("node:path");

const isDev = process.env.NODE_ENV === "development";

// electron-updater's underlying HTTP requests can emit low-level network
// errors (DNS failure, connection reset, no internet) that bypass both the
// checkForUpdates() promise rejection and the autoUpdater "error" event -
// left unhandled, Node's default EventEmitter behavior turns those into an
// uncaught exception that crashes the whole app. A flaky network check
// should never take down the app, so log and swallow instead.
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const system = require("./lib/system.cjs");
const memory = require("./lib/memory.cjs");
const startup = require("./lib/startup.cjs");
const services = require("./lib/services.cjs");
const cleanup = require("./lib/cleanup.cjs");
const power = require("./lib/power.cjs");
const network = require("./lib/network.cjs");
const tweaks = require("./lib/tweaks.cjs");
const externalTools = require("./lib/externalTools.cjs");
const ytdlp = require("./lib/ytdlp.cjs");
const updater = require("./lib/updater.cjs");
const { isAdmin, relaunchAsAdmin } = require("./lib/elevate.cjs");
const { buildTrayIcon } = require("./lib/trayIcon.cjs");
const settingsStore = require("./lib/settings.cjs");
const uninstaller = require("./lib/uninstaller.cjs");
const speedtest = require("./lib/speedtest.cjs");
const security = require("./lib/security.cjs");
const changelog = require("./lib/changelog.cjs");

function wrap(fn) {
  return async (_event, ...args) => {
    try {
      const result = await fn(...args);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  };
}

// Fixed allowlist, not an arbitrary-URL-open primitive - keeps this handler
// from becoming a way for renderer-side code to make the app open anything.
const ALLOWED_EXTERNAL_URLS = new Set(["https://github.com/yt-dlp/yt-dlp"]);

function registerIpc() {
  ipcMain.handle("app:isAdmin", wrap(() => isAdmin()));
  ipcMain.handle("app:getVersion", wrap(() => app.getVersion()));
  ipcMain.handle("app:relaunchAsAdmin", wrap(() => relaunchAsAdmin()));
  ipcMain.handle(
    "app:openExternal",
    wrap((url) => {
      if (!ALLOWED_EXTERNAL_URLS.has(url)) throw new Error("URL not allowed");
      return shell.openExternal(url);
    })
  );
  ipcMain.handle("app:showMainWindow", wrap(() => showMainWindow()));
  ipcMain.handle(
    "widget:hide",
    wrap(() => {
      if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.hide();
      return { success: true };
    })
  );

  ipcMain.handle("changelog:get", wrap(() => changelog.getChangelog()));

  ipcMain.handle("security:getDefenderStatus", wrap(() => security.getDefenderStatus()));
  ipcMain.handle("security:getFirewallStatus", wrap(() => security.getFirewallStatus()));
  ipcMain.handle("security:openWindowsSecurity", wrap(() => security.openWindowsSecurity()));

  ipcMain.handle("uninstaller:listApps", wrap(() => uninstaller.listInstalledApps()));
  ipcMain.handle("uninstaller:uninstallApp", wrap((keyPath) => uninstaller.uninstallApp(keyPath)));
  ipcMain.handle("uninstaller:scanLeftovers", wrap((apps) => uninstaller.scanLeftovers(apps)));
  ipcMain.handle("uninstaller:deleteLeftovers", wrap((items) => uninstaller.deleteLeftovers(items)));

  ipcMain.handle("settings:get", wrap(() => settingsStore.load()));
  ipcMain.handle(
    "settings:set",
    wrap((partial) => {
      const updated = settingsStore.save(partial);
      if (typeof partial.runAtStartup === "boolean") {
        app.setLoginItemSettings({ openAtLogin: updated.runAtStartup });
      }
      return updated;
    })
  );

  ipcMain.handle("system:getStats", wrap(() => system.getStats()));
  ipcMain.handle("system:getLiveStats", wrap(() => system.getLiveStats()));
  ipcMain.handle("system:getGpuStats", wrap(() => system.getGpuStats()));
  ipcMain.handle("system:getProcesses", wrap(() => system.getProcesses()));
  ipcMain.handle("system:getProcessCount", wrap(() => system.getProcessCount()));
  ipcMain.handle("system:killProcess", wrap((pid) => system.killProcess(pid)));
  ipcMain.handle("system:optimizeDisk", wrap((mount) => system.optimizeDisk(mount)));
  ipcMain.handle("system:setPriority", wrap((pid, priority) => system.setPriority(pid, priority)));

  ipcMain.handle("memory:listBackgroundApps", wrap(() => memory.listBackgroundApps()));
  ipcMain.handle("memory:cleanMemory", wrap((pids) => memory.cleanMemory(pids)));

  ipcMain.handle("startup:list", wrap(() => startup.list()));
  ipcMain.handle("startup:toggle", wrap((item) => startup.toggle(item)));

  ipcMain.handle("services:list", wrap(() => services.list()));
  ipcMain.handle("services:setStatus", wrap((name, action) => services.setStatus(name, action)));
  ipcMain.handle("services:setStartType", wrap((name, startType) => services.setStartType(name, startType)));

  ipcMain.handle("cleanup:scan", wrap(() => cleanup.scan()));
  ipcMain.handle("cleanup:getTempFilesSize", wrap(() => cleanup.getTempFilesSize()));
  ipcMain.handle("cleanup:clean", wrap((categoryIds) => cleanup.clean(categoryIds)));

  ipcMain.handle("power:listPlans", wrap(() => power.listPlans()));
  ipcMain.handle("power:getBatteryInfo", wrap(() => power.getBatteryInfo()));
  ipcMain.handle("power:getShowBatteryPercentage", wrap(() => power.getShowBatteryPercentage()));
  ipcMain.handle("power:setShowBatteryPercentage", wrap((enabled) => power.setShowBatteryPercentage(enabled)));
  ipcMain.handle("power:setActivePlan", wrap((guid) => power.setActivePlan(guid)));
  ipcMain.handle("power:enableUltimatePerformance", wrap(() => power.enableUltimatePerformance()));

  ipcMain.handle("network:listAdapters", wrap(() => network.listAdapters()));
  ipcMain.handle("network:setAdapterEnabled", wrap((name, enabled) => network.setAdapterEnabled(name, enabled)));
  ipcMain.handle("network:flushDns", wrap(() => network.flushDns()));
  ipcMain.handle("network:resetWinsock", wrap(() => network.resetWinsock()));
  ipcMain.handle("network:getDnsServers", wrap((name) => network.getDnsServers(name)));
  ipcMain.handle("network:setDnsServers", wrap((name, servers) => network.setDnsServers(name, servers)));
  ipcMain.handle("network:resetTcpIp", wrap(() => network.resetTcpIp()));
  ipcMain.handle("network:getWifiSignal", wrap(() => network.getWifiSignal()));
  ipcMain.handle("network:runSpeedTest", wrap(() => speedtest.runSpeedTest()));

  ipcMain.handle("tweaks:list", wrap(() => tweaks.list()));
  ipcMain.handle("tweaks:apply", wrap((id, enabled) => tweaks.apply(id, enabled)));

  ipcMain.handle("tools:runCttWinUtil", wrap(() => externalTools.runCttWinUtil()));
  ipcMain.handle("tools:runMassGraveActivation", wrap(() => externalTools.runMassGraveActivation()));
  ipcMain.handle("tools:openDownloaderWindow", wrap(() => openDownloaderWindow()));

  ipcMain.handle("ytdlp:isInstalled", wrap(() => ytdlp.isInstalled()));
  ipcMain.handle("ytdlp:install", wrap(() => ytdlp.install()));
  ipcMain.handle("ytdlp:listFormats", wrap((url) => ytdlp.listFormats(url)));
  ipcMain.handle("ytdlp:getHistory", wrap(() => ytdlp.getHistory()));
  ipcMain.handle("ytdlp:openHistoryItem", wrap((filePath) => ytdlp.openHistoryItem(filePath)));
  ipcMain.handle("ytdlp:download", async (event, payload) => {
    try {
      const result = await ytdlp.download({
        ...payload,
        onProgress: (data) => event.sender.send("ytdlp:progress", data),
      });
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle("updater:check", wrap(() => updater.checkForUpdates(app)));
  ipcMain.handle("updater:download", wrap(() => updater.downloadUpdate(app)));
  ipcMain.handle("updater:install", wrap(() => updater.quitAndInstall(app)));
}

function loadRoute(win, routeName) {
  if (isDev) {
    win.loadURL(`http://127.0.0.1:5173/?window=${routeName}`);
    // Skip auto-opening devtools for the widget: it's a frameless flyout
    // that hides itself on blur, and the detached devtools window stealing
    // focus the instant it opens would immediately trigger that same hide.
    if (routeName !== "widget") win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), { query: { window: routeName } });
  }
}

let mainWindow = null;
function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#ECEBE6",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  loadRoute(win, "main");
  updater.initUpdater(app, win);
  mainWindow = win;
  win.on("closed", () => {
    mainWindow = null;
  });
  win.on("close", (event) => {
    if (isQuitting) return;
    if (settingsStore.load().closeToTray) {
      event.preventDefault();
      win.hide();
    } else {
      // Not closing to tray: let this window close normally, but also
      // explicitly quit - once the widget has been opened once, its hidden
      // (not closed) window would otherwise silently block the default
      // window-all-closed quit, leaving the app running invisibly.
      app.quit();
    }
  });
  win.on("minimize", (event) => {
    if (settingsStore.load().minimizeToTray) {
      event.preventDefault();
      win.hide();
    }
  });
  return win;
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
  return { success: true };
}

// Singleton - reuses/focuses the existing Downloader window instead of
// spawning duplicates if the user clicks "Open Downloader" again.
let downloaderWindow = null;
function openDownloaderWindow() {
  if (downloaderWindow && !downloaderWindow.isDestroyed()) {
    downloaderWindow.focus();
    return { success: true };
  }

  downloaderWindow = new BrowserWindow({
    width: 620,
    height: 680,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: "#ECEBE6",
    autoHideMenuBar: true,
    title: "IceTools - Downloader",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  loadRoute(downloaderWindow, "downloader");
  downloaderWindow.on("closed", () => {
    downloaderWindow = null;
  });
  return { success: true };
}

const WIDGET_WIDTH = 480;
const WIDGET_HEIGHT = 560;

// Anchors the widget above the tray icon, clamped to the work area of the
// display the tray sits on (excludes the taskbar) so it never renders
// off-screen or overlapping the taskbar itself.
function getWidgetPosition() {
  const trayBounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const workArea = display.workArea;

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - WIDGET_WIDTH / 2);
  x = Math.max(workArea.x + 8, Math.min(x, workArea.x + workArea.width - WIDGET_WIDTH - 8));
  const y = Math.round(workArea.y + workArea.height - WIDGET_HEIGHT - 8);
  return { x, y };
}

// Singleton, hidden rather than closed on blur/toggle - recreating a
// frameless BrowserWindow on every tray click would make the flyout feel
// laggy compared to native tray popups.
let widgetWindow = null;
function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) return widgetWindow;

  widgetWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    backgroundColor: "#ECEBE6",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  loadRoute(widgetWindow, "widget");
  widgetWindow.on("blur", () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.hide();
  });
  widgetWindow.on("closed", () => {
    widgetWindow = null;
  });
  return widgetWindow;
}

function toggleWidget() {
  const win = createWidgetWindow();
  if (win.isVisible()) {
    win.hide();
    return;
  }
  const { x, y } = getWidgetPosition();
  win.setPosition(x, y);
  win.show();
  win.focus();
}

let tray = null;
function createTray() {
  tray = new Tray(buildTrayIcon());
  tray.setToolTip("IceTools");
  tray.on("click", toggleWidget);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open IceTools", click: showMainWindow },
      { type: "separator" },
      { label: "Quit IceTools", click: () => app.quit() },
    ])
  );
}

app.whenReady().then(() => {
  registerIpc();
  app.setLoginItemSettings({ openAtLogin: settingsStore.load().runAtStartup });
  createWindow();
  createTray();

  // Give the window a few seconds to finish loading before the first check,
  // rather than racing update IPC events against the renderer mounting.
  if (settingsStore.load().autoCheckUpdates) {
    setTimeout(() => updater.checkForUpdates(app).catch(() => {}), 5000);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Mirrors mainWindow's own "close" handler (which explicitly quits when
// closeToTray is off), so this is mostly a fallback for edge cases where no
// main window ever existed - the explicit app.quit() in that handler is what
// makes quitting deterministic regardless of whether the widget's hidden
// (not closed) window would otherwise keep Electron from seeing "all
// windows closed".
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

let isQuitting = false;
app.on("before-quit", () => {
  isQuitting = true;
  if (tray) tray.destroy();
  if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.destroy();
});
