const { app } = require("electron");

// Icons rarely if ever change for a given exe path during a session, and
// app.getFileIcon has real per-call overhead - cache by path (including
// negative results) so repeated polls of the same process/service list are
// effectively free after the first resolution.
const iconCache = new Map(); // path -> dataUrl string | null

async function getIconDataUrl(exePath) {
  if (!exePath) return null;
  if (iconCache.has(exePath)) return iconCache.get(exePath);
  try {
    const icon = await app.getFileIcon(exePath, { size: "small" });
    const dataUrl = icon.toDataURL();
    iconCache.set(exePath, dataUrl);
    return dataUrl;
  } catch {
    iconCache.set(exePath, null);
    return null;
  }
}

/** Resolves icons for many paths at once, deduplicated, as a path -> dataUrl|null map. */
async function getIconsForPaths(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const entries = await Promise.all(uniquePaths.map(async (p) => [p, await getIconDataUrl(p)]));
  return new Map(entries);
}

// Strips a quoted-or-bare leading executable path out of a full command line,
// e.g. '"C:\Program Files\App\app.exe" --flag' or 'C:\Windows\svchost.exe -k netsvcs'.
function extractExePath(commandLine) {
  if (!commandLine) return null;
  const trimmed = commandLine.trim();
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1);
    if (end > 0) return trimmed.slice(1, end);
  }
  const exeMatch = trimmed.match(/^(.*?\.exe)\b/i);
  if (exeMatch) return exeMatch[1];
  return trimmed.split(" ")[0] || null;
}

module.exports = { getIconDataUrl, getIconsForPaths, extractExePath };
