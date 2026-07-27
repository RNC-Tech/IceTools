const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

const DEFAULTS = {
  runAtStartup: false,
  closeToTray: false,
  minimizeToTray: false,
  autoCheckUpdates: true,
};

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

// Cached in-memory after first read - this file is small, read at startup
// and on every settings-page load, and written only when the user flips a
// toggle, so a full read/parse per call isn't worth avoiding, but the cache
// keeps repeated `load()` calls (e.g. every close/minimize event) cheap.
let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(settingsPath(), "utf-8");
    cache = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function save(partial) {
  cache = { ...load(), ...partial };
  fs.writeFileSync(settingsPath(), JSON.stringify(cache, null, 2), "utf-8");
  return cache;
}

module.exports = { load, save, DEFAULTS };
