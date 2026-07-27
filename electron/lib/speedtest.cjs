const https = require("node:https");
const crypto = require("node:crypto");

// Cloudflare publishes these endpoints specifically for client-side speed
// tests (the same ones speed.cloudflare.com's own widget uses) - no API key,
// no account, just plain HTTPS GET/POST against a CDN edge.
const HOST = "speed.cloudflare.com";
const DOWNLOAD_BYTES = 25_000_000;
const UPLOAD_BYTES = 5_000_000;
const REQUEST_TIMEOUT_MS = 20_000;

function timedDownload(reqPath) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    let bytes = 0;
    const req = https.request({ host: HOST, path: reqPath, method: "GET" }, (res) => {
      res.on("data", (chunk) => {
        bytes += chunk.length;
      });
      res.on("end", () => {
        resolve({ ms: Number(process.hrtime.bigint() - start) / 1e6, bytes });
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error("Request timed out")));
    req.end();
  });
}

// Timed from the first byte of the request body being written to the
// "finish" event (fully flushed) - independent of however long the (tiny)
// server response takes to come back afterward.
function timedUpload(reqPath, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: HOST,
        path: reqPath,
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "Content-Length": body.length },
      },
      (res) => {
        res.on("data", () => {});
        res.on("error", () => {});
      }
    );
    req.on("error", reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error("Request timed out")));
    const start = process.hrtime.bigint();
    req.end(body, () => {
      resolve({ ms: Number(process.hrtime.bigint() - start) / 1e6, bytes: body.length });
    });
  });
}

function toMbps(bytes, ms) {
  const seconds = ms / 1000;
  return seconds > 0 ? Math.round(((bytes * 8) / seconds / 1e6) * 10) / 10 : 0;
}

async function runSpeedTest() {
  const ping = await timedDownload("/__down?bytes=0");
  const download = await timedDownload(`/__down?bytes=${DOWNLOAD_BYTES}`);
  const upload = await timedUpload("/__up", crypto.randomBytes(UPLOAD_BYTES));

  return {
    pingMs: Math.round(ping.ms),
    downloadMbps: toMbps(download.bytes, download.ms),
    uploadMbps: toMbps(upload.bytes, upload.ms),
  };
}

module.exports = { runSpeedTest };
