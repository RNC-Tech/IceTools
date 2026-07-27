const { nativeImage } = require("electron");

// Builds the tray glyph in-memory as a raw BGRA buffer instead of bundling an
// .ico/.png asset - a simple snowflake/asterisk clipped to a circle, in the
// brand's Acc. Sage tone (#7FA3A0), which reads reasonably on both the
// default dark and light Windows taskbars.
function buildTrayIcon(size = 32) {
  const buffer = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = center - 1;
  const armWidth = size <= 16 ? 1 : 1.6;
  const diagWidth = armWidth * 1.4;
  const [r, g, b] = [0x7f, 0xa3, 0xa0];

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
