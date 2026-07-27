const fs = require("node:fs/promises");
const path = require("node:path");
const { runPowerShell, runPowerShellJson } = require("./exec.cjs");
const { getIconsForPaths, extractExePath } = require("./icons.cjs");

// Matches exactly the shape of a Windows "Uninstall" registry subkey path,
// in either HKLM or HKCU, 32-bit or 64-bit view - the only kind of registry
// path this module will ever read from or delete, since it's what
// listInstalledApps() itself enumerates. Nothing here ever accepts an
// arbitrary registry path from the renderer.
const UNINSTALL_KEY_RE = /^HK(LM|CU):\\SOFTWARE\\(WOW6432Node\\)?Microsoft\\Windows\\CurrentVersion\\Uninstall\\[^\\]+$/i;

const UNINSTALL_LIST_SCRIPT = `
$paths = @(
  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -and -not $_.SystemComponent -and -not $_.ParentKeyName } |
  Select-Object DisplayName, Publisher, DisplayVersion, InstallLocation, UninstallString, QuietUninstallString, EstimatedSize, DisplayIcon,
    @{N='KeyPath'; E={
      ($_.PSPath -replace '^Microsoft\\.PowerShell\\.Core\\\\Registry::HKEY_LOCAL_MACHINE','HKLM:') -replace '^Microsoft\\.PowerShell\\.Core\\\\Registry::HKEY_CURRENT_USER','HKCU:'
    }} |
  ConvertTo-Json -Depth 3
`;

// DisplayIcon is typically "C:\Path\app.exe,0" (unquoted) or
// "\"C:\Path\app.exe\",0" (quoted) - strip the icon-resource index suffix
// and any surrounding quotes so app.getFileIcon gets a bare file path.
function parseDisplayIcon(raw) {
  if (!raw) return null;
  let value = raw.trim();
  if (value.startsWith('"')) {
    const end = value.indexOf('"', 1);
    if (end > 0) return value.slice(1, end) || null;
  }
  return value.replace(/,-?\d+$/, "").trim() || null;
}

async function listInstalledApps() {
  const raw = await runPowerShellJson(UNINSTALL_LIST_SCRIPT);
  const seen = new Set();
  const apps = [];
  for (const a of raw) {
    if (!a.KeyPath || seen.has(a.KeyPath)) continue;
    seen.add(a.KeyPath);
    const iconPath = parseDisplayIcon(a.DisplayIcon) || extractExePath(a.UninstallString);
    apps.push({
      keyPath: a.KeyPath,
      displayName: a.DisplayName,
      publisher: a.Publisher || null,
      version: a.DisplayVersion || null,
      installLocation: a.InstallLocation || null,
      sizeBytes: typeof a.EstimatedSize === "number" ? a.EstimatedSize * 1024 : null, // EstimatedSize is in KB
      iconPath,
    });
  }
  apps.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const icons = await getIconsForPaths(apps.map((a) => a.iconPath));
  return apps.map(({ iconPath, ...app }) => ({ ...app, icon: icons.get(iconPath) || null }));
}

// Uninstallers vary wildly in how long they take and whether they show their
// own UI (many don't support a silent flag we could safely guess), so this
// gets a much longer timeout than other PowerShell calls and doesn't try to
// hide the window - if an uninstaller needs the user to click through it,
// they need to see it.
const UNINSTALL_TIMEOUT_MS = 10 * 60 * 1000;

async function uninstallApp(keyPath) {
  if (!UNINSTALL_KEY_RE.test(keyPath)) throw new Error("Refusing to act on an unexpected registry path");

  const script = `
$app = Get-ItemProperty -LiteralPath $env:ICE_KEYPATH -ErrorAction Stop
$cmd = if ($app.QuietUninstallString) { $app.QuietUninstallString } else { $app.UninstallString }
if (-not $cmd) { throw "No uninstall command found for this application" }
Start-Process -FilePath cmd.exe -ArgumentList '/c', $cmd -Wait
`;
  await runPowerShell(script, { env: { ICE_KEYPATH: keyPath }, timeout: UNINSTALL_TIMEOUT_MS });
  return { success: true };
}

async function keyStillExists(keyPath) {
  const out = await runPowerShell("if (Test-Path -LiteralPath $env:ICE_KEYPATH) { 'yes' } else { 'no' }", {
    env: { ICE_KEYPATH: keyPath },
  });
  return out.trim() === "yes";
}

async function folderExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function sanitizeForPath(name) {
  return (name || "").replace(/[\\/:*?"<>|]/g, "").trim();
}

// Deliberately narrow: only the app's own install folder and any
// AppData/LocalAppData folder literally named after it. A broader sweep
// (e.g. searching the registry by publisher name) risks false-positive
// matches against unrelated software, so it's left out - this only ever
// flags things, never deletes anything itself.
async function scanLeftovers(apps) {
  const results = [];
  for (const app of apps) {
    if (UNINSTALL_KEY_RE.test(app.keyPath) && (await keyStillExists(app.keyPath))) {
      results.push({
        type: "registry",
        path: app.keyPath,
        appName: app.displayName,
        description: "Leftover uninstall registry entry",
      });
    }

    const safeName = sanitizeForPath(app.displayName);
    const candidates = new Set();
    if (app.installLocation) candidates.add(app.installLocation);
    if (safeName && process.env.APPDATA) candidates.add(path.join(process.env.APPDATA, safeName));
    if (safeName && process.env.LOCALAPPDATA) candidates.add(path.join(process.env.LOCALAPPDATA, safeName));

    for (const dir of candidates) {
      if (await folderExists(dir)) {
        results.push({ type: "folder", path: dir, appName: app.displayName, description: "Leftover folder" });
      }
    }
  }
  return results;
}

const PROTECTED_FOLDERS = new Set(
  [process.env.WINDIR, process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.SystemDrive]
    .filter(Boolean)
    .map((p) => path.resolve(p).toLowerCase())
);

function isSafeFolderToDelete(dirPath) {
  const normalized = path.resolve(dirPath).toLowerCase();
  if (/^[a-z]:\\?$/.test(normalized)) return false; // drive root
  if (PROTECTED_FOLDERS.has(normalized)) return false;
  return true;
}

// Only ever called with items the renderer got back from scanLeftovers() and
// the user explicitly checked off - never an arbitrary path typed in.
async function deleteLeftovers(items) {
  const outcomes = [];
  for (const item of items) {
    try {
      if (item.type === "registry") {
        if (!UNINSTALL_KEY_RE.test(item.path)) throw new Error("Refusing to delete an unexpected registry path");
        await runPowerShell("Remove-Item -LiteralPath $env:ICE_PATH -Recurse -Force -ErrorAction Stop", {
          env: { ICE_PATH: item.path },
        });
      } else if (item.type === "folder") {
        if (!isSafeFolderToDelete(item.path)) throw new Error("Refusing to delete a protected system folder");
        await fs.rm(item.path, { recursive: true, force: true });
      } else {
        throw new Error(`Unknown leftover type: ${item.type}`);
      }
      outcomes.push({ path: item.path, success: true });
    } catch (err) {
      outcomes.push({ path: item.path, success: false, error: err.message });
    }
  }
  return outcomes;
}

module.exports = { listInstalledApps, uninstallApp, scanLeftovers, deleteLeftovers };
