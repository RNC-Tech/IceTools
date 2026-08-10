const https = require("node:https");

const OWNER = "RNC-Tech";
const REPO = "IceTools";
const MAX_RELEASES = 10;

const LOCAL_RELEASES = [
  {
    version: "1.2.0",
    name: "IceTools v1.2.0 - Major Feature Release & Enhancements",
    notes: `• Official App Icon: Added high-resolution custom IceTools logo icon for Windows Taskbar, BrowserWindow frame, and System Tray.
• Sub-Zero Memory & Junk Cleaner: Combined RAM optimization and temporary junk files cleanup into a single 1-click action.
• Embedded Network Speed Tester: Dedicated Fast.com and Speedtest.net modal launcher windows with full performance testing and zero CSP blocking.
• Elevated Admin Relaunch: Smooth UAC elevation prompt and app restart when triggering Administrator mode.
• System Tray Widget Improvements: Added top close button, Fast.com launcher option, and official IceTools logo.
• Sage Media Downloader: Media thumbnail previews, file location opener, and item deletion controls.
• UI & Theme Refinements: Purged legacy green elements in Windows Defender & Firewall profiles with Electric Sapphire styling.`,
    publishedAt: "2026-08-10T00:00:00.000Z",
    prerelease: false,
  },
  {
    version: "1.0.0",
    name: "IceTools v1.0.0 - Initial Release",
    notes: `• Core hardware load telemetry (CPU, RAM, GPU, Disk).
• Startup Apps & Windows Services Manager.
• Power Plan profile manager with Ultimate Performance unlocker.
• Privacy & Telemetry hardening tweaks.`,
    publishedAt: "2026-08-01T00:00:00.000Z",
    prerelease: false,
  },
];

function fetchJson(reqPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: "api.github.com",
        path: reqPath,
        method: "GET",
        headers: { "User-Agent": "IceTools-App", Accept: "application/vnd.github+json" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`GitHub API returned ${res.statusCode}`));
          }
        });
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.setTimeout(10_000, () => req.destroy(new Error("Request timed out")));
    req.end();
  });
}

async function getChangelog() {
  try {
    const releases = await fetchJson(`/repos/${OWNER}/${REPO}/releases?per_page=${MAX_RELEASES}`);
    if (!Array.isArray(releases) || releases.length === 0) return LOCAL_RELEASES;
    return releases
      .filter((r) => !r.draft)
      .map((r) => ({
        version: r.tag_name,
        name: r.name || r.tag_name,
        notes: r.body || null,
        publishedAt: r.published_at,
        prerelease: Boolean(r.prerelease),
      }));
  } catch {
    return LOCAL_RELEASES;
  }
}

module.exports = { getChangelog };
