const path = require("node:path");
const fs = require("node:fs");

const publicDir = path.join(__dirname, "..", "public");
const assetsDir = path.join(__dirname, "assets");

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

["icetools.svg", "icon.png", "icon.ico"].forEach((filename) => {
  const src = path.join(publicDir, filename);
  const dst = path.join(assetsDir, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${filename} to electron/assets/`);
  }
});
