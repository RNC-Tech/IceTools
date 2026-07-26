const { autoUpdater } = require("electron-updater");

// electron-updater only makes sense in a packaged, installed (NSIS) build -
// there's no update artifact to compare against when running from source via
// `npm run dev`, and it would just log noisy errors trying.
function isSupported(app) {
  return app.isPackaged;
}

function initUpdater(app, win) {
  if (!isSupported(app)) return;

  autoUpdater.autoDownload = false; // ask before pulling down a potentially large installer
  autoUpdater.autoInstallOnAppQuit = false;

  const send = (payload) => {
    if (!win.isDestroyed()) win.webContents.send("updater:event", payload);
  };

  autoUpdater.on("checking-for-update", () => send({ type: "checking" }));
  autoUpdater.on("update-available", (info) => send({ type: "available", version: info.version }));
  autoUpdater.on("update-not-available", () => send({ type: "not-available" }));
  autoUpdater.on("download-progress", (progress) => send({ type: "progress", percent: Math.round(progress.percent) }));
  autoUpdater.on("update-downloaded", () => send({ type: "downloaded" }));
  autoUpdater.on("error", (err) => send({ type: "error", message: err.message }));
}

async function checkForUpdates(app) {
  if (!isSupported(app)) return { success: false, reason: "not-packaged" };
  await autoUpdater.checkForUpdates();
  return { success: true };
}

async function downloadUpdate(app) {
  if (!isSupported(app)) return { success: false, reason: "not-packaged" };
  await autoUpdater.downloadUpdate();
  return { success: true };
}

function quitAndInstall(app) {
  if (!isSupported(app)) return { success: false, reason: "not-packaged" };
  autoUpdater.quitAndInstall();
  return { success: true };
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall };
