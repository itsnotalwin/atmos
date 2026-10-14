// Generates ATMOS PWA icons as PNG with no external dependencies.
// Motif: a half sun resting on a horizon, cut by three fine atmospheric bars.
// Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const PAPER = [0xfa, 0xfa, 0xf8];
const INK = [0x05, 0x05, 0x05];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Returns a coverage-sampled pixel function for the motif in unit space.
 * `scale` shrinks the artwork toward the center (used for maskable safe zone).
 */
function motif(scale) {
  const horizon = 0.58;
  const cx = 0.5, cy = horizon, r = 0.26;
  const bars = [
    { y: 0.68, half: 0.30 },
    { y: 0.76, half: 0.22 },
    { y: 0.84, half: 0.14 },
  ];
  const barH = 0.022;
  const inside = (u, v) => {
    // Map to artwork space: centered at 0.5 with scale factor.
    const x = (u - 0.5) / scale + 0.5;
    const y = (v - 0.5) / scale + 0.5;
    const dx = x - cx, dy = y - cy;
    if (y <= horizon && dx * dx + dy * dy <= r * r) return true;
    for (const b of bars) {
      if (Math.abs(y - b.y) <= barH / 2 && Math.abs(x - 0.5) <= b.half / 2 + 0.0) return true;
    }
    return false;
  };
  return (x, y, size) => {
    const N = 3; let hits = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (inside((x + (i + 0.5) / N) / size, (y + (j + 0.5) / N) / size)) hits++;
    }
    const t = hits / (N * N);
    return [0, 1, 2].map((k) => Math.round(PAPER[k] * (1 - t) + INK[k] * t));
  };
}

function render(size, scale, filename) {
  const fn = motif(scale);
  writeFileSync(join(outDir, filename), png(size, (x, y) => fn(x, y, size)));
  console.log('wrote', filename, size);
}

render(192, 1, 'icon-192.png');
render(512, 1, 'icon-512.png');
render(512, 0.72, 'icon-maskable-512.png');
render(180, 1, 'apple-touch-icon.png');
