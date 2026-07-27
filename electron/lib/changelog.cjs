const https = require("node:https");

const OWNER = "RNC-Tech";
const REPO = "IceTools";
const MAX_RELEASES = 10;

function fetchJson(reqPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: "api.github.com",
        path: reqPath,
        method: "GET",
        // GitHub's API rejects requests with no User-Agent header.
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

// Always-visible version history for the About page, distinct from the
// single-version "what's new" blurb shown only while an update is pending -
// this lets someone browse past releases even when already up to date.
async function getChangelog() {
  try {
    const releases = await fetchJson(`/repos/${OWNER}/${REPO}/releases?per_page=${MAX_RELEASES}`);
    if (!Array.isArray(releases)) return [];
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
    return [];
  }
}

module.exports = { getChangelog };
