"""Read screenshots of a desktop (or web) application the user gives and propose a screencast theme and a layout sketch
(2026-10-16): the screencast engine's shells take them as `theme` and `layout`, so a lesson about a real product looks
like that product without a pixel of it being republished.

    py tools/screenshot_theme.py <shot.png> [<more.png> ...] --out <theme.json> [--frame-w 1728]

What it measures (on the first screenshot; more screenshots add their colours to the palette vote):
- palette, sampled from pixels: the page ground, the card surface, a sidebar and a top bar when they differ from the page,
  ink (the darkest frequent colour), muted text, the hairline colour (long 1 px runs), the accent (the most frequent
  strongly saturated colour), and the text colour on the sidebar;
- layout: the sidebar's width and the top bar's height (where the band colour changes), and the content cards (connected
  runs of the surface colour);
- density: the row height (the spacing of hairlines inside the biggest card);
- the corner radius (along a card's diagonal, where the corner's arc meets it: k = r (1 - 1/sqrt 2));
- the font scale (the cap height of the text glyphs).
Sizes are scaled from the screenshot's width to the window's content width (--frame-w), and the UI text never below the
style's 20 px floor. Logos and marks are never taken: the user supplies them only if they own the rights.
The proposal is a starting point: look at the rebuilt shell next to the screenshot and correct it by hand.
"""
from __future__ import annotations

import argparse
import colorsys
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


def hexc(rgb) -> str:
    return "#%02x%02x%02x" % tuple(int(round(v)) for v in rgb[:3])


def lum(rgb) -> float:
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(float(v)) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b) -> float:
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def sat(rgb) -> float:
    h, l, s = colorsys.rgb_to_hls(*(float(v) / 255 for v in rgb[:3]))
    return s if 0.15 < l < 0.85 else 0.0


def dominant(px: np.ndarray, q: int = 4):
    """the most frequent colour of a block of pixels (quantised to q levels per channel, reported as the mean of its bin)"""
    a = px.reshape(-1, 3).astype(int)
    keys = (a // q)
    k = keys[:, 0] * 65536 + keys[:, 1] * 256 + keys[:, 2]
    vals, counts = np.unique(k, return_counts=True)
    top = vals[np.argmax(counts)]
    return a[k == top].mean(axis=0), counts.max() / len(k)


def palette_counts(px: np.ndarray, q: int = 6):
    """[(r, g, b, share)] most frequent first; each colour the mean of its bin (so a flat fill comes back exact)"""
    a = px.reshape(-1, 3).astype(int)
    k = a // q
    keys = k[:, 0] * 65536 + k[:, 1] * 256 + k[:, 2]
    vals, inv, counts = np.unique(keys, return_inverse=True, return_counts=True)
    sums = np.zeros((len(vals), 3))
    np.add.at(sums, inv, a)
    order = np.argsort(-counts)[:400]
    return [tuple(int(round(v)) for v in sums[i] / counts[i]) + (counts[i] / len(keys),) for i in order]


def band_edge(line: np.ndarray, ref, tol=18) -> int:
    """the first index where a run of 3 pixels leaves the reference colour"""
    d = np.abs(line.astype(int) - np.array(ref).astype(int)).sum(axis=1)
    off = d > tol
    for i in range(len(off) - 3):
        if off[i] and off[i + 1] and off[i + 2]:
            return i
    return len(off)


def components(mask: np.ndarray, min_area: int):
    """connected boxes of True cells (4-neighbour), on a mask already downscaled"""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    out = []
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not seen[y, x]:
                st = [(y, x)]; seen[y, x] = True
                x0 = x1 = x; y0 = y1 = y; n = 0
                while st:
                    cy, cx = st.pop(); n += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; st.append((ny, nx))
                if n >= min_area:
                    out.append((x0, y0, x1 + 1, y1 + 1, n))
    return out


def analyse(paths: list[Path], frame_w: int = 1728) -> dict:
    img = np.asarray(Image.open(paths[0]).convert("RGB"))
    H, W, _ = img.shape
    k = frame_w / W
    # ---- bands: a sidebar on the left, a top bar
    left, lshare = dominant(img[int(H * 0.2):int(H * 0.95), 2:int(W * 0.08)])
    # the page ground: what the right edge and the bottom of the window show (cards keep a margin from both)
    page, _ = dominant(np.concatenate([img[int(H * 0.15):H - 2, W - 10:W - 2].reshape(-1, 3), img[H - 10:H - 2, int(W * 0.3):W - 2].reshape(-1, 3)])[None])
    side = left if (np.abs(left - page).sum() > 24 and lshare > 0.5) else None
    sideW = band_edge(img[int(H * 0.6), :], left) if side is not None else 0
    topc, tshare = dominant(img[2:int(H * 0.04), sideW + int((W - sideW) * 0.5):sideW + int((W - sideW) * 0.9)])
    top = topc if (np.abs(topc - page).sum() > 12 and tshare > 0.5) else None
    topH = band_edge(img[:, sideW + int((W - sideW) * 0.75)], topc) if top is not None else 0
    main = img[topH:, sideW:]
    # ---- the card surface: the most frequent colour of the main area that is not the page
    cols = palette_counts(main)
    surface = next((np.array(c[:3]) for c in cols if np.abs(np.array(c[:3]) - page).sum() > 12 and c[3] > 0.04), page)
    # ---- text colours: ink from the cores of the darkest glyphs (the darkest 1.5 % of the main area, unsaturated),
    # muted the most frequent unsaturated colour with a text contrast well under ink's
    flat = main.reshape(-1, 3).astype(float)
    L = flat @ np.array([0.2126, 0.7152, 0.0722])
    core = flat[L <= np.percentile(L, 0.3)]
    core = core[np.array([sat(c) < 0.35 for c in core])] if len(core) else core
    ink = np.median(core, axis=0) if len(core) else np.array([16, 24, 40])
    cand = [c for c in palette_counts(main, 8) if sat(c[:3]) < 0.3 and 3.2 < contrast(c[:3], surface) < contrast(ink, surface) * 0.7 and c[3] > 0.0004]
    muted = np.array(cand[0][:3]) if cand else (ink * 0.55 + surface * 0.45)
    # ---- the accent: the most frequent saturated colour over all screenshots
    acc = Counter()
    for pth in paths:
        a = np.asarray(Image.open(pth).convert("RGB"))
        for c in palette_counts(a, 8):
            if sat(c[:3]) > 0.45 and c[3] > 0.0008:
                acc[c[:3]] += c[3]
    accent = np.array(acc.most_common(1)[0][0]) if acc else np.array([36, 86, 211])
    # the words on the accent (a primary button's label): pixels ringed by the accent at 3 px that are far from it
    A0 = np.asarray(Image.open(paths[0]).convert("RGB")).astype(int)
    am = np.abs(A0 - accent).sum(axis=2) < 30
    comps = sorted(components(am[::2, ::2], 20), key=lambda b: -b[4])
    inner = np.zeros((0, 3))
    for b in comps[:3]:                            # the biggest accent shapes (a primary button first)
        blk = A0[b[1] * 2:b[3] * 2, b[0] * 2:b[2] * 2].reshape(-1, 3)
        far = blk[np.abs(blk - accent).sum(axis=1) > 200]
        if len(far) > 20: inner = far; break
    on_acc = np.median(inner, axis=0) if len(inner) > 20 else (np.array([255, 255, 255]) if contrast(accent, (255, 255, 255)) >= contrast(accent, ink) else ink)
    # ---- hairlines: a 1 px row (in the main area) whose colour runs across most of a card
    hair = Counter()
    for y in range(1, main.shape[0] - 1):
        row = main[y]
        c0, share = dominant(row[None, :, :], 3)
        on = np.abs(row.astype(int) - c0).sum(axis=1) < 6          # the line's own pixels: their neighbours above and below differ
        if share > 0.5 and on.any() and np.abs(c0 - surface).sum() > 8 and np.abs(main[y - 1][on].astype(int) - row[on]).sum(axis=1).mean() > 6 and np.abs(main[y + 1][on].astype(int) - row[on]).sum(axis=1).mean() > 6:
            hair[tuple(int(round(v)) for v in c0)] += 1
    hl2 = [np.array(c) for c, _ in hair.most_common(2)]
    hline = hl2[0] if hl2 else (surface * 0.8 + ink * 0.2)
    # the darker of the two most common lines draws the card edges, the lighter one the rows
    hline, hedge = (hl2[0], hl2[1]) if len(hl2) > 1 and lum(hl2[0]) >= lum(hl2[1]) else (hl2[1], hl2[0]) if len(hl2) > 1 else (hline, hline)
    # ---- the cards (surface regions on the page), on a 4 px grid
    s = 4
    small = main[::s, ::s].astype(int)
    mask = np.abs(small - surface).sum(axis=2) < 26
    m2 = mask.copy(); m2[1:-1] |= mask[:-2] & mask[2:]; m2[:, 1:-1] |= mask[:, :-2] & mask[:, 2:]   # bridge 1 px lines
    mask = m2
    boxes = [b for b in components(mask, max(30, mask.size // 400)) if (b[2] - b[0]) * s > 60 and (b[3] - b[1]) * s > 30]
    regions = sorted([{"x": round((b[0] * s + sideW) * k), "y": round((b[1] * s + topH) * k), "w": round((b[2] - b[0]) * s * k), "h": round((b[3] - b[1]) * s * k)} for b in boxes],
                     key=lambda r: (r["y"], r["x"]))
    # ---- row height: hairline spacing inside the biggest card
    row = None
    if boxes:
        b = max(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
        x0, y0, x1, y1 = b[0] * s, b[1] * s, b[2] * s, b[3] * s
        ys = [y for y in range(y0, y1) if np.abs(main[y, x0 + (x1 - x0) // 2] - hline).sum() < 18]
        gaps = [b2 - a2 for a2, b2 in zip(ys, ys[1:]) if b2 - a2 > 12]
        if gaps:
            row = float(np.median(gaps))
    # ---- corner radius: find a card's exact outer edges (left along its middle row, top along its middle column), then
    # walk in along the diagonal from that corner: the surface starts after the edge's own width plus r (1 - 1/sqrt 2)
    radii = []
    off_page = lambda c: np.abs(c.astype(int) - page).sum() > 10  # noqa: E731
    for b in boxes[:6]:
        mx, my = (b[0] + b[2]) * s // 2, (b[1] + b[3]) * s // 2
        x0 = b[0] * s
        while x0 > 0 and off_page(main[my, x0 - 1]): x0 -= 1
        y0 = b[1] * s
        while y0 > 0 and off_page(main[y0 - 1, mx]): y0 -= 1
        bw = 0
        while bw < 6 and np.abs(main[my, x0 + bw].astype(int) - surface).sum() > 14: bw += 1
        for d in range(0, 40):
            if y0 + d < main.shape[0] and x0 + d < main.shape[1] and np.abs(main[y0 + d, x0 + d].astype(int) - surface).sum() < 14:
                radii.append(max(0.0, d - bw * 1.0) / 0.293); break
    radius = float(np.median(radii)) if radii else 10.0
    # ---- text size: the cap height of glyph runs in ink, measured by columns of ink pixels in the main area
    inkmask = np.abs(main.astype(int) - ink).sum(axis=2) < 150
    heights = []
    for x in range(0, inkmask.shape[1], 3):
        col = inkmask[:, x]
        y = 0
        while y < len(col):
            if col[y]:
                y2 = y
                while y2 < len(col) and col[y2]:
                    y2 += 1
                if 6 <= y2 - y <= 40:
                    heights.append(y2 - y)
                y = y2
            y += 1
    # the x-height is the most common vertical stroke (n, m, u, r); a UI face's x-height is about half its size
    hist = Counter(h for h in heights if 4 <= h <= 30)
    xh = float(hist.most_common(1)[0][0]) if hist else 7.0
    cap = float(np.percentile([h for h in heights if h > xh * 1.2] or [xh * 1.4], 50))
    font_px = xh / 0.5
    side_ink = side_muted = side_on = None
    if side is not None:
        sb = img[:, :max(1, sideW)].reshape(-1, 3).astype(float)
        sb = sb[np.array([sat(c) < 0.35 for c in sb])]
        far = np.array([contrast(c, side) for c in sb[:: max(1, len(sb) // 20000)]])
        pick = sb[:: max(1, len(sb) // 20000)]
        if len(far) and far.max() > 3:
            # the selected item's words (the brightest), the items' words (the most frequent text colour), section labels
            side_on = np.median(pick[far >= np.percentile(far, 99.85)], axis=0)
            pc = palette_counts(sb[None], 8)
            cand = [c for c in pc if 3.0 < contrast(c[:3], side) < contrast(side_on, side) * 0.85 and c[3] > 0.001]
            side_ink = np.array(cand[0][:3]) if cand else side_on * 0.8 + side * 0.2
            cand2 = [c for c in pc if 2.0 < contrast(c[:3], side) < contrast(side_ink, side) * 0.8 and c[3] > 0.0005]
            side_muted = np.array(cand2[0][:3]) if cand2 else side_ink * 0.7 + side * 0.3
    ui = max(20, round(font_px * k))
    theme = {
        "palette": {"surface": hexc(surface), "surface2": hexc(page), "ink": hexc(ink), "muted": hexc(muted), "accent": hexc(accent), "onAccent": hexc(on_acc), "line": hexc(hline)},
        "tone": {"page": hexc(page), "hair": hexc(hline), "hair2": hexc(hedge), "side": hexc(side) if side is not None else hexc(surface),
                 "chrome": hexc(top if top is not None else surface)},
        "radius": round(min(16, max(2, radius * k))), "row": round(row * k) if row else None, "nav_row": None, "control_h": None, "ui_text": ui, "ui_small": max(20, ui - 1),
    }
    if side_ink is not None:
        theme["palette"]["sideInk"] = hexc(side_ink); theme["palette"]["sideMuted"] = hexc(side_muted); theme["palette"]["sideOn"] = hexc(side_on)
        theme["tone"]["sideSel"] = hexc(np.clip(side * 0.85 + side_ink * 0.15, 0, 255))
    layout = {"sidebarW": round(sideW * k), "topbarH": round(topH * k) if topH else None, "regions": regions, "from": {"w": W, "h": H, "scale": round(k, 4)}}
    return {"source": [str(p) for p in paths], "theme": theme, "layout": layout,
            "measured": {"cap_px": cap, "font_px": round(font_px, 1), "row_px": row, "radius_px": round(radius, 1), "x_height_px": xh, "sidebar_px": sideW, "topbar_px": topH,
                         "contrast_ink_surface": round(contrast(ink, surface), 2), "contrast_onAccent_accent": round(contrast(on_acc, accent), 2)}}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("shots", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--frame-w", type=int, default=1728)
    a = ap.parse_args(argv)
    res = analyse([Path(p) for p in a.shots], a.frame_w)
    Path(a.out).write_text(json.dumps(res, indent=1), encoding="utf-8")
    print(json.dumps(res["measured"]), "\n", json.dumps(res["theme"]))


if __name__ == "__main__":
    sys.exit(main())
