// Generates the extension's PNG icons (no image dependencies): a marigold
// "front line" ridge on an ocean-blue tile, matching the dashboard favicon.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const out = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../extension/icons");
fs.mkdirSync(out, { recursive: true });

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// Same shape as web/public/favicon.svg, in a 32-unit space.
const ridge = [[6, 22], [11, 9], [16, 17], [20, 12], [26, 22]];
function inside(px, py) {
  if (py > 22) return false;
  for (let i = 0; i < ridge.length - 1; i++) {
    const [x0, y0] = ridge[i];
    const [x1, y1] = ridge[i + 1];
    if (px >= x0 && px <= x1) {
      const yLine = y0 + ((px - x0) / (x1 - x0)) * (y1 - y0);
      return py >= yLine;
    }
  }
  return false;
}

for (const size of [16, 48, 128]) {
  const buf = png(size, (x, y, s) => {
    const u = (x / s) * 32;
    const v = (y / s) * 32;
    const r = 6;
    const dx = Math.max(r - u, 0, u - (32 - r));
    const dy = Math.max(r - v, 0, v - (32 - r));
    if (dx * dx + dy * dy > r * r) return [0, 0, 0, 0];
    if (Math.abs(v - 22) < 0.8 && u >= 6 && u <= 26) return [233, 226, 207, 255];
    if (inside(u, v)) return [245, 184, 61, 255];
    return [14, 27, 44, 255];
  });
  fs.writeFileSync(path.join(out, `icon${size}.png`), buf);
}
console.log("icons written to", out);
