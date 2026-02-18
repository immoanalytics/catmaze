#!/usr/bin/env node
/**
 * Generate PWA icon PNGs using pure-JS bitmap writing (no native dependencies).
 * Outputs 192x192 and 512x512 PNGs with the pixel cat.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICON_DIR = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(ICON_DIR)) fs.mkdirSync(ICON_DIR, { recursive: true });

/* ---- minimal PNG encoder ---- */
function createPNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA, length = width*height*4
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, buf.length - 4);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT (filtered rows)
  const rowLen = width * 4 + 1;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0; // no filter
    pixels.copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", iend),
  ]);
}

/* CRC32 */
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return c ^ -1;
}

/* ---- pixel drawing ---- */
function hexToRGBA(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r, g, b, 255];
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const s = size / 16; // unit

  function fill(x, y, w, h, col) {
    const [r,g,b,a] = hexToRGBA(col);
    const x0 = Math.round(x), y0 = Math.round(y);
    const x1 = Math.round(x+w), y1 = Math.round(y+h);
    for (let py = y0; py < y1 && py < size; py++) {
      for (let px = x0; px < x1 && px < size; px++) {
        if (px < 0 || py < 0) continue;
        const i = (py * size + px) * 4;
        pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
      }
    }
  }

  function px(cx, cy, col) { fill(cx*s, cy*s, s, s, col); }

  // background
  fill(0, 0, size, size, "#1a1a2e");

  // rounded-ish inner bg
  fill(s, s, size - 2*s, size - 2*s, "#2a2a4e");

  const body = "#f5a623", ear = "#e08e1b";

  // body
  for (let r = 5; r < 13; r++) for (let c = 4; c < 12; c++) px(c, r, body);
  // ears
  px(4,3,ear); px(5,3,ear); px(4,4,ear); px(5,4,body);
  px(10,3,ear); px(11,3,ear); px(11,4,ear); px(10,4,body);
  // head
  for (let c = 5; c < 11; c++) px(c, 4, body);
  // eyes
  px(6,6,"#2d2d2d"); px(9,6,"#2d2d2d");
  // nose
  px(7,8,"#ff6b8a"); px(8,8,"#ff6b8a");
  // whiskers
  px(3,7,"#ffffff"); px(2,7,"#ffffff"); px(12,7,"#ffffff"); px(13,7,"#ffffff");
  px(3,9,"#ffffff"); px(12,9,"#ffffff");
  // feet
  px(5,13,"#ffffff"); px(6,13,"#ffffff"); px(9,13,"#ffffff"); px(10,13,"#ffffff");
  // tail
  px(12,10,body); px(13,9,body); px(14,8,body);

  return createPNG(size, size, pixels);
}

/* ---- generate ---- */
[192, 512].forEach(size => {
  const png = drawIcon(size);
  const out = path.join(ICON_DIR, `icon-${size}.png`);
  fs.writeFileSync(out, png);
  console.log(`Created ${out} (${png.length} bytes)`);
});
