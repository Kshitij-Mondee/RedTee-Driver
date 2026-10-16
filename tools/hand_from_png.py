"""A raster writing hand for the whiteboard engine (D-179): Kshitij's PNG of a hand holding a marker, made ready for
assets/engines/whiteboard/hand/ (2026-10-15: "I want to use this as the hand with marker").

    py tools/hand_from_png.py <hand.png> [--out assets/engines/whiteboard/hand] [--nib-box x0,y0,x1,y1] [--label-box x0,y0,x1,y1]

What it does, so the engine can use one picture for every ink:
- the nib (the coloured tip, found inside --nib-box) is cut out of the picture and redrawn as a vector polygon with
  class="pen": the engine colours it with the ink being written (ink, accent, muted ...);
- lettering on the marker's label (coloured pixels inside --label-box) is painted over with the label's own light
  colour: assets carry no text (Prompt R; the sample-text audit cannot read words inside a picture);
- the picture is halved (about 490 x 570, plenty for a hand about 300 px tall on screen) and embedded in write.svg as
  a data URI with data-anchor (the nib's tip), data-scale and data-rotate for the engine.
It writes write.svg only; the engine uses it for the lifted and resting poses too. The art is not run through
tools/asset_intake.py (an embedded picture is outside that contract, which is for vector art); this tool is its check.
"""
from __future__ import annotations

import argparse
import base64
import io
import sys
from pathlib import Path

from PIL import Image


def hull(points):
    pts = sorted(set(points))
    if len(pts) < 3:
        return pts
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])  # noqa: E731
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0:
            hi.pop()
        hi.append(p)
    return lo[:-1] + hi[:-1]


def box(s):
    return [int(v) for v in s.split(",")]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("png"); ap.add_argument("--out", default="assets/engines/whiteboard/hand")
    ap.add_argument("--nib-box", default="0,160,48,232"); ap.add_argument("--label-box", default="150,80,360,175")
    ap.add_argument("--half", type=float, default=0.5)
    # the hand's size on screen (data-scale): 0.62 looked small and the arm long and stretched near the top of the frame
    # (Kshitij, 2026-10-15: "the hand can be scaled and made a bit bigger")
    ap.add_argument("--scale", type=float, default=0.85)
    a = ap.parse_args()
    im = Image.open(a.png).convert("RGBA")
    if im.getpixel((0, 0))[3] != 0:
        sys.exit("hand_from_png: the picture needs a transparent background")
    px = im.load()
    W, H = im.size
    reddish = lambda p: p[3] > 0 and p[0] > 170 and p[1] < 125 and p[2] < 115  # noqa: E731
    # the nib
    x0, y0, x1, y1 = box(a.nib_box)
    nib = [(x, y) for y in range(y0, min(H, y1)) for x in range(x0, min(W, x1)) if reddish(px[x, y])]
    if len(nib) < 40:
        sys.exit(f"hand_from_png: no nib found in {a.nib_box} ({len(nib)} coloured pixels)")
    for x, y in nib:
        px[x, y] = (0, 0, 0, 0)
    poly = hull(nib)
    tip = min(nib, key=lambda p: (p[0], abs(p[1] - sum(q[1] for q in nib) / len(nib))))
    # lettering on the label
    lx0, ly0, lx1, ly1 = box(a.label_box)
    light = [px[x, y] for y in range(ly0, ly1) for x in range(lx0, lx1) if px[x, y][3] > 0 and min(px[x, y][:3]) > 195]
    if light:
        fill = tuple(sorted(c[i] for c in light)[len(light) // 2] for i in range(3)) + (255,)
        n = 0
        for y in range(ly0, ly1):
            for x in range(lx0, lx1):
                if reddish(px[x, y]) or (px[x, y][3] > 0 and px[x, y][0] > 150 and px[x, y][1] < 160 and px[x, y][0] - px[x, y][2] > 60):
                    px[x, y] = fill; n += 1
        print(f"label: {n} lettering pixels painted over with {fill[:3]}")
    # the sleeve continues past the picture's edge along the arm, so a hand never floats (assets/hands/README.md: the
    # wrist edge is continued by the runtime); its colour and direction are read from the sleeve itself
    rows = [y for y in range(H - 1, H // 2, -1) if any(px[x, y][3] > 200 for x in range(W))]
    yb = rows[0] if rows else H - 1
    def span(y):
        xs = [x for x in range(W) if px[x, y][3] > 200]
        return (min(xs), max(xs)) if xs else None
    ya = max(H // 2, yb - 350)
    sb, sa = span(yb), span(ya)
    ext, arm = "", ""
    if sb and sa:
        cb, ca = ((sb[0] + sb[1]) / 2, yb), ((sa[0] + sa[1]) / 2, ya)
        dx, dy = cb[0] - ca[0], cb[1] - ca[1]; L = (dx * dx + dy * dy) ** 0.5 or 1; dx, dy = dx / L, dy / L
        cols = [px[x, yb - 4][:3] for x in range(sb[0] + 4, sb[1] - 4) if px[x, yb - 4][3] > 250]
        col = tuple(sorted(c[i] for c in cols)[len(cols) // 2] for i in range(3)) if cols else (200, 80, 50)
        # long enough to leave any frame (12000 source px is about 3700 screen px); the engine turns the hand so this axis
        # always leaves through the frame's bottom edge (data-arm)
        far = 12000
        quad = [(sb[0] + 2, yb - 2), (sb[1] - 2, yb - 2), (sb[1] - 2 + dx * far, yb + dy * far), (sb[0] + 2 + dx * far, yb + dy * far)]
        ext = (f'<polygon points="{" ".join(f"{x * a.half:.1f},{y * a.half:.1f}" for x, y in quad)}" '
               f'fill="#{col[0]:02x}{col[1]:02x}{col[2]:02x}"/>')
        arm = f' data-arm="{cb[0] * a.half:.1f},{(yb - 2) * a.half:.1f},{dx:.4f},{dy:.4f},{(sb[1] - sb[0] - 4) * a.half:.1f}"'
        print(f"sleeve: continued from y {yb} along ({dx:.2f}, {dy:.2f}) in #{col[0]:02x}{col[1]:02x}{col[2]:02x}")
    k = a.half
    small = im.resize((round(W * k), round(H * k)), Image.LANCZOS)
    buf = io.BytesIO(); small.save(buf, "PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    sw, sh = small.size
    pts = " ".join(f"{x * k:.1f},{y * k:.1f}" for x, y in poly)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {sw} {sh}" data-anchor="{tip[0] * k:.1f},{tip[1] * k:.1f}" '
           f'data-scale="{a.scale:g}" data-rotate="0"{arm} id="hand_write">'
           f'{ext}<image width="{sw}" height="{sh}" href="data:image/png;base64,{b64}"/>'
           f'<polygon class="pen" points="{pts}" fill="#1E2430"/></svg>')
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    (out / "write.svg").write_text(svg, encoding="utf-8")
    (out / "LICENSE.txt").write_text(
        "The whiteboard writing hand: a picture supplied by Kshitij on 2026-10-15 for Loom's whiteboard engine (D-179),\n"
        f"prepared by tools/hand_from_png.py from {Path(a.png).name} (nib redrawn as a vector, label lettering removed).\n"
        "Its origin and licence are Kshitij's to state here before any client use.\n", encoding="utf-8")
    print(f"wrote {out / 'write.svg'} ({len(svg) // 1024} KB, {sw}x{sh}, nib tip at {tip[0] * k:.1f},{tip[1] * k:.1f}, nib {len(poly)} points)")


if __name__ == "__main__":
    main()
