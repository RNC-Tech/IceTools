const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow } = require("electron");

function wrapPngInIco(pngBuffer) {
  const header = Buffer.alloc(6 + 16);
  // ICO Header
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type (1 = ICO)
  header.writeUInt16LE(1, 4); // Number of images

  // Icon Directory Entry
  header.writeUInt8(0, 6); // Width 256 (0 means 256)
  header.writeUInt8(0, 7); // Height 256 (0 means 256)
  header.writeUInt8(0, 8); // Color count
  header.writeUInt8(0, 9); // Reserved
  header.writeUInt16LE(1, 10); // Color planes
  header.writeUInt16LE(32, 12); // Bits per pixel
  header.writeUInt32LE(pngBuffer.length, 14); // Image size in bytes
  header.writeUInt32LE(22, 18); // Offset of image data (6 + 16 = 22)

  return Buffer.concat([header, pngBuffer]);
}

app.whenReady().then(async () => {
  try {
    const publicDir = path.join(__dirname, "..", "public");
    const svgPath = path.join(publicDir, "icetools.svg");
    const pngPath = path.join(publicDir, "icon.png");
    const icoPath = path.join(publicDir, "icon.ico");

    const win = new BrowserWindow({
      width: 256,
      height: 256,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const svgContent = fs.readFileSync(svgPath, "utf8");

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; background:transparent; display:flex; align-items:center; justify-content:center; width:256px; height:256px;">
        <div id="svg-container" style="width:240px; height:240px;">${svgContent}</div>
        <canvas id="canvas" width="256" height="256" style="display:none;"></canvas>
      </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pngDataUrl = await win.webContents.executeJavaScript(`
      new Promise((resolve) => {
        const svg = document.querySelector('svg');
        svg.setAttribute('width', '256');
        svg.setAttribute('height', '256');
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const imageSrc = b64Start + svg64;

        const img = new Image();
        img.onload = () => {
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, 256, 256);
          ctx.drawImage(img, 0, 0, 256, 256);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageSrc;
      });
    `);

    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, "");
    const pngBuffer = Buffer.from(base64Data, "base64");
    const icoBuffer = wrapPngInIco(pngBuffer);

    fs.writeFileSync(pngPath, pngBuffer);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log("SUCCESS! Generated valid icon.png (", pngBuffer.length, "bytes) and valid icon.ico (", icoBuffer.length, "bytes)");
  } catch (err) {
    console.error("Failed to generate icon PNG/ICO:", err);
  } finally {
    app.quit();
  }
});
