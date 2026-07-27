const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");

const isDev = process.env.NODE_ENV === "development";

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
const ALLOWED_EXTERNAL_URLS = new Set(["https://github.com/yt-dlp/yt-dlp", "https://github.com/RNC-Tech/IceTools"]);

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

  ipcMain.handle("system:getStats", wrap(() => system.getStats()));
  ipcMain.handle("system:getLiveStats", wrap(() => system.getLiveStats()));
  ipcMain.handle("system:getGpuStats", wrap(() => system.getGpuStats()));
  ipcMain.handle("system:getProcesses", wrap(() => system.getProcesses()));
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

  ipcMain.handle("tweaks:list", wrap(() => tweaks.list()));
  ipcMain.handle("tweaks:apply", wrap((id, enabled) => tweaks.apply(id, enabled)));

  ipcMain.handle("tools:runCttWinUtil", wrap(() => externalTools.runCttWinUtil()));
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
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), { query: { window: routeName } });
  }
}

function createWindow() {
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
  return win;
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
    width: 480,
    height: 560,
    minWidth: 420,
    minHeight: 480,
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

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  // Give the window a few seconds to finish loading before the first check,
  // rather than racing update IPC events against the renderer mounting.
  setTimeout(() => updater.checkForUpdates(app).catch(() => {}), 5000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
