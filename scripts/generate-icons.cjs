const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  table[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowStride = width * 4 + 1;
  const raw = Buffer.alloc(rowStride * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowStride] = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * rowStride + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[idx] = Math.max(0, Math.min(255, Math.round(r)));
      raw[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      raw[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      raw[idx + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  const idat = chunk('IDAT', zlib.deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

function moIconPixel(x, y, width, height, isMaskable = false) {
  // Normalize coords to [-1, 1]
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background: Deep dark space gradient
  let bgR = 15, bgG = 23, bgB = 42, bgA = 255;
  if (!isMaskable && dist > 0.98) {
    // Transparent outside rounded icon boundary
    return [0, 0, 0, 0];
  }

  // Mo sphere center & radius
  const moRadius = isMaskable ? 0.65 : 0.75;
  const moDist = Math.sqrt(nx * nx + ny * ny);

  if (moDist <= moRadius) {
    // Mo's warm glowing body
    const shade = (moDist / moRadius);
    // Radial light from top-left
    const lightDist = Math.sqrt((nx + 0.25) * (nx + 0.25) + (ny + 0.25) * (ny + 0.25));
    const highlight = Math.max(0, 1 - lightDist / 0.8);

    let r = 251 * (1 - shade * 0.3) + highlight * 40;
    let g = 191 * (1 - shade * 0.4) + highlight * 50;
    let b = 36 * (1 - shade * 0.5) + highlight * 60;

    // Left eye (nx ~ -0.2, ny ~ -0.05)
    const dLeftEye = Math.sqrt((nx + 0.22) * (nx + 0.22) + (ny + 0.05) * (ny + 0.05));
    if (dLeftEye < 0.1) {
      // pupil
      const dLeftPupil = Math.sqrt((nx + 0.2) * (nx + 0.2) + (ny + 0.04) * (ny + 0.04));
      if (dLeftPupil < 0.035) return [255, 255, 255, 255]; // sparkle
      return [15, 23, 42, 255];
    }

    // Right eye (nx ~ +0.22, ny ~ -0.05)
    const dRightEye = Math.sqrt((nx - 0.22) * (nx - 0.22) + (ny + 0.05) * (ny + 0.05));
    if (dRightEye < 0.1) {
      const dRightPupil = Math.sqrt((nx - 0.24) * (nx - 0.24) + (ny + 0.04) * (ny + 0.04));
      if (dRightPupil < 0.035) return [255, 255, 255, 255];
      return [15, 23, 42, 255];
    }

    // Smile (arc around y = 0.18)
    const smileRadius = 0.22;
    const smileDist = Math.sqrt(nx * nx + (ny - 0.08) * (ny - 0.08));
    if (Math.abs(smileDist - smileRadius) < 0.035 && ny > 0.12 && Math.abs(nx) < 0.18) {
      return [120, 53, 15, 255];
    }

    // Rosy cheeks
    const dLeftCheek = Math.sqrt((nx + 0.32) * (nx + 0.32) + (ny - 0.14) * (ny - 0.14));
    const dRightCheek = Math.sqrt((nx - 0.32) * (nx - 0.32) + (ny - 0.14) * (ny - 0.14));
    if (dLeftCheek < 0.08 || dRightCheek < 0.08) {
      r = r * 0.7 + 244 * 0.3;
      g = g * 0.7 + 63 * 0.3;
      b = b * 0.7 + 94 * 0.3;
    }

    return [r, g, b, 255];
  }

  // Aura glow around Mo
  if (moDist < moRadius + 0.15) {
    const glow = 1 - (moDist - moRadius) / 0.15;
    return [
      bgR + 245 * glow * 0.4,
      bgG + 158 * glow * 0.3,
      bgB + 11 * glow * 0.1,
      255
    ];
  }

  return [bgR, bgG, bgB, bgA];
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => moIconPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => moIconPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => moIconPixel(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => moIconPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), createPng(32, 32, (x, y, w, h) => moIconPixel(x, y, w, h, false)));

console.log('Successfully generated all PWA icons!');
