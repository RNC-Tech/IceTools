const path = require("node:path");
const fs = require("node:fs");
const { nativeImage } = require("electron");

function buildTrayIcon(size = 32) {
  try {
    const pngPath = path.join(__dirname, "..", "assets", "icon.png");
    if (fs.existsSync(pngPath)) {
      const img = nativeImage.createFromPath(pngPath);
      if (!img.isEmpty()) return img.resize({ width: size, height: size });
    }
  } catch {
    // fallback
  }

  try {
    const fallbackPng = path.join(__dirname, "..", "..", "public", "icon.png");
    if (fs.existsSync(fallbackPng)) {
      const img = nativeImage.createFromPath(fallbackPng);
      if (!img.isEmpty()) return img.resize({ width: size, height: size });
    }
  } catch {
    // fallback
  }

  const buffer = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = center - 1;
  const armWidth = size <= 16 ? 1 : 1.6;
  const diagWidth = armWidth * 1.4;
  const [r, g, b] = [0x3b, 0x82, 0xf6];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      const onArm =
        Math.abs(dx) <= armWidth ||
        Math.abs(dy) <= armWidth ||
        Math.abs(dx - dy) <= diagWidth ||
        Math.abs(dx + dy) <= diagWidth;

      if (!onArm) continue;

      const idx = (y * size + x) * 4;
      buffer[idx] = b;
      buffer[idx + 1] = g;
      buffer[idx + 2] = r;
      buffer[idx + 3] = 255;
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

module.exports = { buildTrayIcon };
