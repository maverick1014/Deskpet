#!/usr/bin/env python3
"""Render a Deskpet pixel-art grid to a scaled PNG so it can be *looked at*.

This is the visual self-check for the pixel-art skill: after authoring/editing a
sprite grid, render it, open the PNG, and reason about whether the silhouette
actually reads as intended before wiring it into the code.

Usage:
    python3 render_grid.py SPEC.json OUT.png
    echo '<spec json>' | python3 render_grid.py - OUT.png

SPEC json:
    {
      "grid": ["..DDDD..", "..DLLED.", ...],   # required: rows of palette letters
      "palette": {"D": "#222a55", ...},          # optional: overrides/extends default
      "scale": 18                                 # optional: px per cell (default 18)
    }

Pure stdlib (zlib + struct) — no Pillow needed. Transparent cells ('.') render as
a checkerboard so "nothing" is visibly distinct from white. A 1px gap between
cells draws a faint grid so individual pixels are countable.
"""
import sys, json, zlib, struct

# Deskpet penguin palette (mirrors pal() in src/renderer/App.jsx). Scenes/games
# pass their own palette via the spec to override these.
DEFAULT_PAL = {
    '.': None,            # transparent
    'D': '#222a55',       # body navy
    'L': '#ffffff',       # white belly
    'O': '#ff9d3d',       # beak / feet orange
    'S': '#ff4d6d',       # ribbon / scarf
    'R': '#ff4d6d',       # ribbon (egg)
    'E': '#1a1f3d',       # eye
    'C': '#ff9bbb',       # cheek pink
    'T': '#5bc8ff',       # tear / accent blue
    'G': '#9c8a63',       # grime
    'K': '#fde7c4',       # egg shell
}

GAP = (40, 46, 70)       # faint grid line between cells
CHECK_A = (220, 224, 232) # transparent checkerboard light
CHECK_B = (198, 204, 216) # transparent checkerboard dark


def hex_rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def png_bytes(width, height, rgb):
    """rgb: flat bytearray of length width*height*3 -> PNG bytes (RGB, 8-bit)."""
    raw = bytearray()
    stride = width * 3
    for y in range(height):
        raw.append(0)                       # filter type 0 per scanline
        raw += rgb[y * stride:(y + 1) * stride]

    def chunk(typ, data):
        c = typ + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)   # color type 2 = RGB
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


def render(spec, out_path):
    grid = spec['grid']
    pal = dict(DEFAULT_PAL)
    pal.update({k: v for k, v in (spec.get('palette') or {}).items()})
    scale = int(spec.get('scale', 18))
    rows = len(grid)
    cols = max((len(r) for r in grid), default=0)

    # sanity: warn on ragged rows / unknown letters (logic check)
    warnings = []
    widths = {len(r) for r in grid}
    if len(widths) > 1:
        warnings.append(f"ragged grid: row widths = {sorted(widths)} (rows should be equal length)")
    used = set(ch for r in grid for ch in r)
    unknown = sorted(c for c in used if c not in pal)
    if unknown:
        warnings.append(f"undefined palette letters: {unknown}")

    W, H = cols * scale, rows * scale
    img = bytearray(W * H * 3)

    def put(px, py, rgb):
        i = (py * W + px) * 3
        img[i], img[i + 1], img[i + 2] = rgb

    for gy in range(rows):
        row = grid[gy]
        for gx in range(cols):
            ch = row[gx] if gx < len(row) else '.'
            col = pal.get(ch)
            for dy in range(scale):
                for dx in range(scale):
                    px, py = gx * scale + dx, gy * scale + dy
                    if dx == 0 or dy == 0:            # 1px faint grid gap
                        put(px, py, GAP)
                        continue
                    if col is None:                   # transparent -> checkerboard
                        c = CHECK_A if ((px // 6 + py // 6) % 2 == 0) else CHECK_B
                        put(px, py, c)
                    else:
                        put(px, py, hex_rgb(col))

    with open(out_path, 'wb') as f:
        f.write(png_bytes(W, H, img))
    print(f"rendered {cols}x{rows} grid -> {out_path} ({W}x{H}px, scale {scale})")
    for w in warnings:
        print("WARNING:", w)
    if not warnings:
        print("logic check: OK (rectangular grid, all letters defined)")


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    text = sys.stdin.read() if src == '-' else open(src, encoding='utf-8').read()
    render(json.loads(text), out)


if __name__ == '__main__':
    main()
