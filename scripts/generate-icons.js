/**
 * Generates icon-192.png and icon-512.png for the Dream Queen PWA.
 * Run: node scripts/generate-icons.js
 * No npm dependencies — uses built-in zlib.
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(size) {
  // Dream Queen icon: hot pink (#FF69B4) background with a white crown
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth 8, colour type 2 (RGB)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build raw pixel data
  // Background: hot pink #FF69B4 = (255, 105, 180)
  // Crown: white pixels in a simple crown shape
  const bg = [255, 105, 180];
  const crown = [255, 255, 255];
  const dark = [180, 50, 120]; // darker pink for outline

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte: None
    const ny = y / size; // 0..1
    for (let x = 0; x < size; x++) {
      const nx = x / size; // 0..1

      // Draw a simple crown shape in the centre
      const cx = nx - 0.5; // -0.5..0.5
      const cy = ny - 0.5; // -0.5..0.5

      // Crown base: a rectangle in the lower-centre of the icon
      const inBase = Math.abs(cx) < 0.28 && cy > 0.05 && cy < 0.22;

      // Crown peaks: three triangles
      // Left peak
      const leftPeak = cx < -0.02 && cx > -0.24 && cy > -0.22 && cy < 0.08 &&
        (cy - 0.08) < (cx + 0.24) * 1.4 && (cy - 0.08) < -(cx + 0.02) * 1.4;
      // Centre peak (tallest)
      const midPeak = Math.abs(cx) < 0.14 && cy > -0.30 && cy < 0.08 &&
        (cy - 0.08) < (0.14 - Math.abs(cx)) * 2.2;
      // Right peak
      const rightPeak = cx > 0.02 && cx < 0.24 && cy > -0.22 && cy < 0.08 &&
        (cy - 0.08) < -(cx - 0.24) * 1.4 && (cy - 0.08) < (cx - 0.02) * 1.4;

      // Gem dots on peaks
      const leftGem = Math.hypot(cx + 0.13, cy + 0.10) < 0.04;
      const midGem = Math.hypot(cx, cy + 0.18) < 0.045;
      const rightGem = Math.hypot(cx - 0.13, cy + 0.10) < 0.04;

      let pixel;
      if (midGem || leftGem || rightGem) {
        pixel = [255, 215, 0]; // gold gems
      } else if (inBase || leftPeak || midPeak || rightPeak) {
        pixel = crown;
      } else {
        pixel = bg;
      }

      row.push(...pixel);
    }
    rows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(assetsDir, 'icon-192.png'), createPNG(192));
console.log('✓ assets/icon-192.png');

fs.writeFileSync(path.join(assetsDir, 'icon-512.png'), createPNG(512));
console.log('✓ assets/icon-512.png');
