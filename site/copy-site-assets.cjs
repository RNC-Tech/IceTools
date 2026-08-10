const path = require("node:path");
const fs = require("node:fs");

const srcPublic = path.join(__dirname, "..", "public");
const dstPublic = path.join(__dirname, "public");

if (!fs.existsSync(dstPublic)) {
  fs.mkdirSync(dstPublic, { recursive: true });
}

["icetools.svg", "icon.png", "icon.ico"].forEach((file) => {
  const src = path.join(srcPublic, file);
  const dst = path.join(dstPublic, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${file} to site/public/`);
  }
});
