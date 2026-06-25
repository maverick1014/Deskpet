// Generates the Deskpet app icon from the in-app penguin sprite.
//
// Dependency-free: renders the exact pixel-art penguin (same grid + palette the
// renderer uses) onto a rounded "squircle" gradient background, with supersampled
// anti-aliasing, and encodes the result straight to PNG + ICO using Node's zlib.
//
//   node scripts/make-icon.js
//     -> build/icon.png   (1024x1024, master; electron-builder uses for Linux)
//     -> build/icon.ico   (multi-size, PNG-embedded; Windows)
//   The macOS .icns is produced from icon.png by scripts (iconutil), see npm "icon".
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- the penguin (mirrors App.jsx `idle` grid + palette) -------------------
const GRID = [
  '......DDDD......', '....DDDDDDDD....', '...DDDDDDDDDD...', '..DDDDDDDDDDDD..',
  '..DDLLLLLLLLDD..', '..DLLLLLLLLLLD..', '..DLLELLLLELLD..', '..DLCLLOOLLCLD..',
  '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...SSSSSSSSSS...', '..DDLLLLLLLLDD..',
  '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...DDLLLLLLDD...', '....OO....OO....',
];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PAL = {
  D: hex('#222a55'), L: hex('#ffffff'), O: hex('#ff9d3d'),
  S: hex('#ff4d6d'), E: hex('#1a1f3d'), C: hex('#ff9bbb'),
};
const GW = GRID[0].length, GH = GRID.length;

// background gradient + accents
const TOP = hex('#93d4ff'), BOT = hex('#3e9be0'), SHADOW = hex('#16203f');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Color of a single sample point (sx,sy) in [0,S). Returns [r,g,b,a] straight-alpha.
function sample(sx, sy, S) {
  const margin = 0.039 * S, rad = 0.20 * S;
  const x0 = margin, y0 = margin, x1 = S - margin, y1 = S - margin;
  // rounded-rect SDF: distance to the rect shrunk by `rad` must be <= rad
  const cx = clamp(sx, x0 + rad, x1 - rad), cy = clamp(sy, y0 + rad, y1 - rad);
  const dx = sx - cx, dy = sy - cy;
  if (sx < x0 || sx > x1 || sy < y0 || sy > y1 || dx * dx + dy * dy > rad * rad) return [0, 0, 0, 0];

  // vertical gradient
  const t = clamp((sy - y0) / (y1 - y0), 0, 1);
  let r = lerp(TOP[0], BOT[0], t), g = lerp(TOP[1], BOT[1], t), b = lerp(TOP[2], BOT[2], t);
  // soft top-left sheen
  const sheen = clamp(1 - (sx + sy) / (S * 1.7), 0, 1) * 0.18;
  r = lerp(r, 255, sheen); g = lerp(g, 255, sheen); b = lerp(b, 255, sheen);

  // soft contact shadow under the feet
  const scx = 0.5 * S, scy = 0.80 * S, srx = 0.24 * S, sry = 0.055 * S;
  const ed = ((sx - scx) / srx) ** 2 + ((sy - scy) / sry) ** 2;
  if (ed < 1) {
    const k = (1 - ed) * 0.32;
    r = lerp(r, SHADOW[0], k); g = lerp(g, SHADOW[1], k); b = lerp(b, SHADOW[2], k);
  }

  // the penguin
  const cell = (0.62 * S) / GW, penX0 = (S - GW * cell) / 2, penY0 = penX0 - 0.02 * S;
  const gx = Math.floor((sx - penX0) / cell), gy = Math.floor((sy - penY0) / cell);
  if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) {
    const c = PAL[GRID[gy][gx]];
    if (c) return [c[0], c[1], c[2], 1];
  }
  return [r, g, b, 1];
}

// Render an SxS RGBA buffer with SSxSS supersampling.
function render(S, SS = 4) {
  const buf = Buffer.alloc(S * S * 4);
  const n = SS * SS;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
        const [r, g, b, a] = sample(x + (i + 0.5) / SS, y + (j + 0.5) / SS, S);
        R += r * a; G += g * a; B += b * a; A += a; // premultiplied accumulation
      }
      const o = (y * S + x) * 4, a = A / n;
      buf[o] = A ? Math.round(R / A) : 0;
      buf[o + 1] = A ? Math.round(G / A) : 0;
      buf[o + 2] = A ? Math.round(B / A) : 0;
      buf[o + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

// ---- PNG encoder -----------------------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
})();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, S) {
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) { raw[y * (S * 4 + 1)] = 0; rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
// ---- ICO encoder (PNG-embedded entries; Vista+ / electron-builder OK) ------
function encodeICO(sizes) {
  const imgs = sizes.map((S) => encodePNG(render(S), S));
  const header = Buffer.alloc(6); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + sizes.length * 16;
  const dir = Buffer.concat(sizes.map((S, i) => {
    const e = Buffer.alloc(16);
    e[0] = S >= 256 ? 0 : S; e[1] = S >= 256 ? 0 : S; e[6] = 1; e[7] = 32;
    e.writeUInt32LE(imgs[i].length, 8); e.writeUInt32LE(offset, 12); offset += imgs[i].length;
    return e;
  }));
  return Buffer.concat([header, dir, ...imgs]);
}

// ---- write -----------------------------------------------------------------
const out = path.join(__dirname, '..', 'build');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon.png'), encodePNG(render(1024), 1024));
fs.writeFileSync(path.join(out, 'icon.ico'), encodeICO([256, 128, 64, 48, 32, 16]));
console.log('[icon] wrote build/icon.png (1024) and build/icon.ico');
