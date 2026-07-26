const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const https = require("node:https");
const { spawn } = require("node:child_process");
const { app, shell } = require("electron");

const YTDLP_RELEASE_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
const MAX_REDIRECTS = 5;
const HISTORY_LIMIT = 50;

function binDir() {
  return path.join(app.getPath("userData"), "bin");
}

function binaryPath() {
  return path.join(binDir(), "yt-dlp.exe");
}

function historyPath() {
  return path.join(app.getPath("userData"), "download-history.json");
}

async function readHistory() {
  try {
    const raw = await fsp.readFile(historyPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendHistory(entry) {
  const history = await readHistory();
  history.unshift(entry);
  await fsp.writeFile(historyPath(), JSON.stringify(history.slice(0, HISTORY_LIMIT), null, 2));
}

async function getHistory() {
  return readHistory();
}

async function openHistoryItem(filePath) {
  if (!filePath) throw new Error("No file path");
  try {
    await fsp.access(filePath, fs.constants.F_OK);
  } catch {
    throw new Error("File no longer exists at that location");
  }
  shell.showItemInFolder(filePath);
  return { success: true };
}

async function isInstalled() {
  try {
    await fsp.access(binaryPath(), fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function followRedirects(url, redirectsLeft) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            reject(new Error("Too many redirects while downloading yt-dlp"));
            return;
          }
          resolve(followRedirects(res.headers.location, redirectsLeft - 1));
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }
        resolve(res);
      })
      .on("error", reject);
  });
}

async function install() {
  await fsp.mkdir(binDir(), { recursive: true });
  const tempPath = `${binaryPath()}.download`;
  const response = await followRedirects(YTDLP_RELEASE_URL, MAX_REDIRECTS);

  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(tempPath);
    response.pipe(fileStream);
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
    response.on("error", reject);
  });

  await fsp.rename(tempPath, binaryPath());
  return { success: true };
}

const PROGRESS_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/;

function isValidUrl(url) {
  return /^https?:\/\//i.test(url || "");
}

// Lists formats yt-dlp can see for a URL (--dump-json, no download) so the UI
// can offer a real quality picker instead of just "video"/"audio". Only
// pre-muxed formats (both audio+video, or audio-only) are useful here since
// this app has no ffmpeg dependency to merge separate video+audio streams.
function listFormats(url) {
  return new Promise((resolve, reject) => {
    if (!isValidUrl(url)) {
      reject(new Error("Enter a valid http(s) URL"));
      return;
    }

    const child = spawn(binaryPath(), ["--dump-json", "--no-playlist", "--skip-download", url], { windowsHide: true });
    let stdout = "";
    let stderrOutput = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });
    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderrOutput.trim().split(/\r?\n/).pop() || `yt-dlp exited with code ${code}`));
        return;
      }
      try {
        const info = JSON.parse(stdout.trim().split(/\r?\n/)[0]);
        const formats = (info.formats || [])
          .filter((f) => f.format_id && f.acodec && f.acodec !== "none")
          .map((f) => ({
            formatId: f.format_id,
            ext: f.ext,
            resolution: f.height ? `${f.height}p` : f.resolution || null,
            hasVideo: Boolean(f.vcodec && f.vcodec !== "none"),
            abr: f.abr ? Math.round(f.abr) : null,
            filesizeBytes: f.filesize || f.filesize_approx || null,
          }));
        resolve({ title: info.title || "", formats });
      } catch {
        reject(new Error("Could not parse format list for this URL"));
      }
    });
  });
}

function buildArgs(url, mode, formatId, outputTemplate) {
  // "b/best" and "ba/bestaudio" pick pre-muxed single-file formats, which
  // avoids needing ffmpeg on PATH to merge separate video/audio streams or
  // re-encode - trades some quality/format flexibility for working out of
  // the box with no extra dependencies. An explicit formatId (from
  // listFormats) overrides this default with the user's chosen quality.
  // `--print after_move:filepath` emits the final on-disk path (post any
  // rename/merge) as a plain unbracketed line, which is how we know exactly
  // what file to record in download history afterward.
  const formatArgs = formatId ? ["-f", formatId] : mode === "audio" ? ["-f", "ba/bestaudio"] : ["-f", "b/best"];
  return [...formatArgs, "-o", outputTemplate, "--no-playlist", "--print", "after_move:filepath", url];
}

function download({ url, mode = "video", formatId, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (!isValidUrl(url)) {
      reject(new Error("Enter a valid http(s) URL"));
      return;
    }

    const outputTemplate = path.join(app.getPath("downloads"), "%(title)s.%(ext)s");
    const args = buildArgs(url, mode, formatId, outputTemplate);
    const child = spawn(binaryPath(), args, { windowsHide: true });

    let stdoutAll = "";
    let lastLine = "";
    let stderrOutput = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdoutAll += text;
      lastLine = text.trim().split(/\r?\n/).pop() || lastLine;
      const match = PROGRESS_RE.exec(text);
      if (match && onProgress) onProgress({ percent: Number(match[1]), line: lastLine });
    });

    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });

    child.on("error", (err) => reject(err));

    child.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(stderrOutput.trim().split(/\r?\n/).pop() || `yt-dlp exited with code ${code}`));
        return;
      }

      const lines = stdoutAll
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const filePath = [...lines].reverse().find((l) => !l.startsWith("[")) || null;
      const title = filePath ? path.basename(filePath, path.extname(filePath)) : url;

      if (filePath) {
        try {
          await appendHistory({ title, filePath, mode, url, downloadedAt: new Date().toISOString() });
        } catch {
          // history is a convenience list, not critical - ignore write failures
        }
      }

      resolve({ success: true, filePath, title });
    });
  });
}

module.exports = { isInstalled, install, download, listFormats, getHistory, openHistoryItem };
