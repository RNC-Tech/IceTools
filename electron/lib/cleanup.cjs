const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { runPowerShell } = require("./exec.cjs");

const LOCAL_APP_DATA = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const WINDOWS_DIR = process.env.WINDIR || "C:\\Windows";

function categoryDefs() {
  return [
    {
      id: "userTemp",
      label: "User Temp Files",
      description: os.tmpdir(),
      kind: "dirContents",
      dirs: [os.tmpdir()],
    },
    {
      id: "windowsTemp",
      label: "Windows Temp Files",
      description: path.join(WINDOWS_DIR, "Temp"),
      kind: "dirContents",
      dirs: [path.join(WINDOWS_DIR, "Temp")],
    },
    {
      id: "windowsUpdateCache",
      label: "Windows Update Cache",
      description: path.join(WINDOWS_DIR, "SoftwareDistribution", "Download"),
      kind: "dirContents",
      dirs: [path.join(WINDOWS_DIR, "SoftwareDistribution", "Download")],
    },
    {
      id: "prefetch",
      label: "Prefetch Data",
      description: path.join(WINDOWS_DIR, "Prefetch"),
      kind: "dirContents",
      dirs: [path.join(WINDOWS_DIR, "Prefetch")],
    },
    {
      id: "thumbnailCache",
      label: "Thumbnail Cache",
      description: path.join(LOCAL_APP_DATA, "Microsoft", "Windows", "Explorer"),
      kind: "filePattern",
      dirs: [path.join(LOCAL_APP_DATA, "Microsoft", "Windows", "Explorer")],
      pattern: /^thumbcache_.*\.db$/i,
    },
    {
      id: "browserCache",
      label: "Browser Caches (Chrome / Edge)",
      description: "Chrome & Edge Cache folders",
      kind: "dirContents",
      dirs: [
        path.join(LOCAL_APP_DATA, "Google", "Chrome", "User Data", "Default", "Cache"),
        path.join(LOCAL_APP_DATA, "Microsoft", "Edge", "User Data", "Default", "Cache"),
      ],
    },
    {
      id: "recycleBin",
      label: "Recycle Bin",
      description: "Empties the Recycle Bin",
      kind: "recycleBin",
    },
  ];
}

async function dirSize(dirPath) {
  let total = 0;
  let count = 0;
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return { total, count };
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        const sub = await dirSize(full);
        total += sub.total;
        count += sub.count;
      } else {
        const stat = await fs.stat(full);
        total += stat.size;
        count += 1;
      }
    } catch {
      // inaccessible/locked file, skip
    }
  }
  return { total, count };
}

async function matchedFilesSize(dirPath, pattern) {
  let total = 0;
  let count = 0;
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return { total, count };
  }
  for (const entry of entries) {
    if (entry.isFile() && pattern.test(entry.name)) {
      try {
        const stat = await fs.stat(path.join(dirPath, entry.name));
        total += stat.size;
        count += 1;
      } catch {
        // skip
      }
    }
  }
  return { total, count };
}

// Lightweight companion to scan() for callers (e.g. the Memory Cleaner page)
// that only need the "temporary files" total, not every junk category.
async function getTempFilesSize() {
  const dirs = [os.tmpdir(), path.join(WINDOWS_DIR, "Temp")];
  let total = 0;
  for (const dir of dirs) {
    const { total: t } = await dirSize(dir);
    total += t;
  }
  return { sizeBytes: total };
}

async function scan() {
  const results = [];
  for (const cat of categoryDefs()) {
    if (cat.kind === "recycleBin") {
      results.push({ id: cat.id, label: cat.label, description: cat.description, sizeBytes: null, fileCount: null });
      continue;
    }
    let total = 0;
    let count = 0;
    for (const dir of cat.dirs) {
      const { total: t, count: c } =
        cat.kind === "filePattern" ? await matchedFilesSize(dir, cat.pattern) : await dirSize(dir);
      total += t;
      count += c;
    }
    results.push({ id: cat.id, label: cat.label, description: cat.description, sizeBytes: total, fileCount: count });
  }
  return results;
}

async function clearDirContents(dirPath) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    try {
      await fs.rm(full, { recursive: true, force: true });
    } catch {
      // locked/in-use file, skip and continue
    }
  }
}

async function clearMatchedFiles(dirPath, pattern) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isFile() && pattern.test(entry.name)) {
      try {
        await fs.rm(path.join(dirPath, entry.name), { force: true });
      } catch {
        // locked, skip
      }
    }
  }
}

async function clean(categoryIds) {
  const defs = categoryDefs().filter((c) => categoryIds.includes(c.id));
  const outcomes = [];
  for (const cat of defs) {
    try {
      if (cat.kind === "recycleBin") {
        await runPowerShell("Clear-RecycleBin -Force -ErrorAction SilentlyContinue");
      } else if (cat.kind === "filePattern") {
        for (const dir of cat.dirs) await clearMatchedFiles(dir, cat.pattern);
      } else {
        for (const dir of cat.dirs) await clearDirContents(dir);
      }
      outcomes.push({ id: cat.id, success: true });
    } catch (err) {
      outcomes.push({ id: cat.id, success: false, error: err.message });
    }
  }
  return outcomes;
}

module.exports = { scan, clean, getTempFilesSize };
