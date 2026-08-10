const { autoUpdater } = require("electron-updater");
const https = require("node:https");

function isSupported(app) {
  return app.isPackaged;
}

function normalizeReleaseNotes(notes) {
  if (!notes) return null;
  if (typeof notes === "string") return notes;
  if (Array.isArray(notes)) {
    return notes.map((n) => (typeof n === "string" ? n : n.note || "")).join("\n\n") || null;
  }
  return null;
}

function initUpdater(app, win) {
  if (!isSupported(app)) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  const send = (payload) => {
    if (win && !win.isDestroyed()) win.webContents.send("updater:event", payload);
  };

  autoUpdater.on("checking-for-update", () => send({ type: "checking" }));
  autoUpdater.on("update-available", (info) =>
    send({ type: "available", version: info.version, releaseNotes: normalizeReleaseNotes(info.releaseNotes) })
  );
  autoUpdater.on("update-not-available", () => send({ type: "up-to-date" }));
  autoUpdater.on("download-progress", (progress) => send({ type: "progress", percent: Math.round(progress.percent) }));
  autoUpdater.on("update-downloaded", () => send({ type: "downloaded" }));
  autoUpdater.on("error", (err) => {
    // Treat 404/no-release errors gracefully as up-to-date
    if (err && (err.message?.includes("404") || err.message?.includes("Cannot find"))) {
      send({ type: "up-to-date" });
    } else {
      send({ type: "error", message: err.message || "Update check failed" });
    }
  });
}

function fetchLatestGitHubRelease(repo = "RNC-Tech/IceTools") {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: `/repos/${repo}/releases/latest`,
      headers: { "User-Agent": "IceTools-App" },
    };

    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse release info"));
          }
        } else if (res.statusCode === 404) {
          resolve(null); // No releases published yet
        } else {
          reject(new Error(`GitHub API HTTP ${res.statusCode}`));
        }
      });
    }).on("error", reject);
  });
}

async function checkForUpdates(app, win) {
  if (app.isPackaged) {
    try {
      if (win && !win.isDestroyed()) win.webContents.send("updater:event", { type: "checking" });
      await autoUpdater.checkForUpdates();
    } catch (err) {
      if (win && !win.isDestroyed()) {
        win.webContents.send("updater:event", { type: "up-to-date" });
      }
    }
    return { success: true };
  }

  // Dev/Unpackaged mode fallback check via GitHub API
  if (win && !win.isDestroyed()) win.webContents.send("updater:event", { type: "checking" });

  try {
    const latest = await fetchLatestGitHubRelease();
    if (!latest) {
      if (win && !win.isDestroyed()) win.webContents.send("updater:event", { type: "up-to-date" });
      return { success: true, message: "No releases found on GitHub yet." };
    }

    const currentVersion = app.getVersion().replace(/^v/, "");
    const latestVersion = (latest.tag_name || "").replace(/^v/, "");

    if (latestVersion && latestVersion !== currentVersion) {
      if (win && !win.isDestroyed()) {
        win.webContents.send("updater:event", {
          type: "available",
          version: latestVersion,
          releaseNotes: latest.body || "A new update is available on GitHub Releases.",
          url: latest.html_url,
        });
      }
    } else {
      if (win && !win.isDestroyed()) win.webContents.send("updater:event", { type: "up-to-date" });
    }
    return { success: true };
  } catch (err) {
    if (win && !win.isDestroyed()) win.webContents.send("updater:event", { type: "up-to-date" });
    return { success: true };
  }
}

async function downloadUpdate(app) {
  if (!isSupported(app)) return { success: false, reason: "not-packaged" };
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function quitAndInstall(app) {
  if (!isSupported(app)) return { success: false, reason: "not-packaged" };
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall };
