"""Review a Claude Design character delivery from its own files (docs/assets/reviews/, Prompt R in ASSET_WISHLIST).

    py tools/rig_review.py <batch dir> [--engine <dir>] [--out cache/review/<batch>]

Runs after `py tools/asset_intake.py <zip> --batch <name>`. It:
1. assembles every pose the delivery's own pose data defines, from the DELIVERED part files, in the manifest's
   draw order (tools/node/rig_review.mjs), and makes a contact sheet (poses.jpg);
2. runs the joint test: the right arm raised 0..170 degrees, then the elbow bent 0..150 (joints.jpg);
3. builds the expression faces (hair, head, face variant) and measures how far apart each pair is at a 120 px
   face (expressions.jpg, expression_distance.json). The distance says two drawings look alike; whether an
   expression is RIGHT is a person's call;
4. sheets the turnaround views and the hand variants (turnaround.jpg, hands.jpg).
Nothing here imports the character; it is the evidence a review is written from.
"""
from __future__ import annotations

import argparse
import itertools
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def strip(svg: str) -> str:
    return re.sub(r"<metadata>[\s\S]*?</metadata>", "", svg)


def part_svg(batch: Path, rel: str) -> tuple[str, list[float]] | None:
    f = batch / (rel + ".svg")
    if not f.exists():
        return None
    s = strip(f.read_text(encoding="utf-8"))
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).replace(",", " ").split()]
    return s, vb


def stack(batch: Path, rels: list[str], view: str, size: tuple[int, int]) -> str:
    """parts placed where they are drawn in the shared 1000 x 2000 frame (no posing)"""
    body = []
    for r in rels:
        p = part_svg(batch, r)
        if p:
            body.append(f'<g transform="translate({p[1][0]} {p[1][1]})">{p[0]}</g>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{size[0]}" height="{size[1]}"><rect x="-500" y="-500" width="3000" height="3000" fill="#F4F1EA"/>{"".join(body)}</svg>'


def raster(svg_text: str, out_png: Path, w: int, h: int):
    import cairosvg
    cairosvg.svg2png(bytestring=svg_text.encode("utf-8"), write_to=str(out_png), output_width=w, output_height=h)


def sheet(items: list[tuple[str, Path]], out: Path, cell=(240, 480), cols=8, title=""):
    from PIL import Image, ImageDraw
    rows = (len(items) + cols - 1) // cols
    W, H = cell
    im = Image.new("RGB", (cols * (W + 6) + 6, rows * (H + 26) + 30), (30, 30, 30))
    d = ImageDraw.Draw(im)
    d.text((8, 8), title, fill=(255, 220, 90))
    for i, (cap, png) in enumerate(items):
        x, y = 6 + (i % cols) * (W + 6), 30 + (i // cols) * (H + 26)
        # keep the drawing's aspect (a stretched cell misjudges a hand or a joint): fit, then centre
        src = Image.open(png).convert("RGB"); k = min(W / src.width, H / src.height)
        fit = src.resize((max(1, int(src.width * k)), max(1, int(src.height * k))))
        im.paste(fit, (x + (W - fit.width) // 2, y + (H - fit.height) // 2))
        d.text((x + 2, y + H + 6), cap[:38], fill=(225, 225, 225))
    im.save(out, quality=88)
    return out


def page_builds(page: Path, batch: Path, out: Path, zooms: list[str] | None = None) -> dict:
    """The second delivery shape (Maya v3, 2026-10-02): no engine scripts; the review page carries its builds as
    data. <script id="loom-builds"> maps a build id to [[asset, transform], ...], and each <svg data-build="bN">
    on the page draws that build (viewBox, optional data-onion). Each build is rebuilt here from the DELIVERED
    part files (not the page's copies), with the delivery's transforms verbatim, and captioned with the page's
    own label. Figures baked into the page (<svg data-pose>) nest the parts the same way; their (transform, asset)
    pairs are read out and rebuilt from the delivered files too, and any part they hold that could not be read is
    counted (baked_parts_unread), never dropped silently."""
    s = page.read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="loom-builds">([\s\S]*?)</script>', s)
    if not m:
        return {"error": f"no loom-builds data in {page.name}"}
    B = json.loads(m.group(1))
    body = s[s.index("<body"):]
    # figures baked into the page (<svg data-pose>) nest the part svgs, each in <g transform>: read them as builds
    # too (balanced, since they contain svgs), so they are ALSO rebuilt from the delivered files
    baked, unread = [], {}
    while True:
        t = re.search(r'<svg[^>]*data-pose="([^"]+)"[^>]*>', body)
        if not t:
            break
        depth, i = 0, t.start()
        for q in re.finditer(r"<svg\b|</svg>", body[t.start():]):
            depth += 1 if q.group(0) == "<svg" else -1
            if depth == 0:
                i = t.start() + q.end(); break
        whole = body[t.start():i]
        pairs = re.findall(r'<g transform="([^"]+)">\s*<svg[^>]*data-asset="([^"]+)"', whole)
        vb = re.search(r'viewBox="([^"]+)"', t.group(0))
        k = "pose:" + t.group(1)
        B[k] = [[a, tf] for tf, a in pairs]
        n_in = len(re.findall(r"data-asset=", whole))
        if n_in != len(pairs):  # a part nested some other way would be silently dropped: say so
            unread[k] = n_in - len(pairs)
        baked.append(k)
        body = body[:t.start()] + f'<svg data-build="{k}" viewBox="{vb.group(1) if vb else "0 0 1000 2000"}"></svg>' + body[i:]
    body = re.sub(r'<svg[^>]*data-asset="[^"]*"[\s\S]*?</svg>', "", body)  # the parts library
    body = re.sub(r"<script[\s\S]*?</script>", "", body)
    tags = {}
    for t in re.finditer(r'<svg[^>]*data-build="([^"]+)"[^>]*>', body):
        vb = re.search(r'viewBox="([^"]+)"', t.group(0)); onion = "data-onion" in t.group(0)
        tags[t.group(1)] = (vb.group(1) if vb else "0 0 1000 2000", onion)
    marked = re.sub(r'<svg[^>]*data-build="([^"]+)"[^>]*>[\s\S]*?</svg>', lambda q: f" [[{q.group(1)}]] ", body)
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", marked))
    cap, sec, order = {}, {}, []
    cur = ""
    for piece in re.split(r"(\[\[[^\]]+\]\])", text):
        if piece.startswith("[["):
            k = piece[2:-2]; order.append(k); sec[k] = cur; cap[k] = ""
        else:
            hs = re.findall(r"(?<![\d/] )(\d+ · [A-Z][A-Z0-9][A-Z0-9 /·]{2,})", piece)  # the last section heading in the gap
            h = hs[-1] if hs else None
            if order and not cap[order[-1]]:
                cap[order[-1]] = re.sub(r"\s*\d+ · [A-Z][A-Z0-9][A-Z0-9 /·]{2,}.*$", "", piece.strip())[:60]
            if h:
                cur = h.strip()
    files = {}
    def part(a):
        if a not in files:
            f = batch / (a + ".svg")
            files[a] = strip(f.read_text(encoding="utf-8")) if f.exists() else None
        return files[a]
    (out / "builds").mkdir(parents=True, exist_ok=True)
    missing, groups = {}, {}
    for k in order:
        vb, onion = tags.get(k, ("0 0 1000 2000", False))
        g = []
        for a, tf in B.get(k, []):
            p = part(a)
            if p is None:
                missing[a] = missing.get(a, 0) + 1; continue
            op = ' opacity="0.42"' if onion else ""
            g.append(f'<g transform="{tf}"{op}>{p}</g>')
        v = [float(x) for x in vb.split()]
        w, h = (300, int(300 * v[3] / v[2])) if v[2] >= v[3] * 0.5 else (int(600 * v[2] / v[3]), 600)
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}"><rect x="{v[0]}" y="{v[1]}" width="{v[2]}" height="{v[3]}" fill="#F4F1EA"/>{"".join(g)}</svg>'
        png = out / "builds" / f"{k.replace(':', '_')}.png"; raster(svg, png, w, h)
        label = f"{k[5:]} (page figure)" if k.startswith("pose:") else f"{k} {cap[k]}"
        groups.setdefault(sec[k] or "builds", []).append((label, png, (w, h)))
    sheets = []
    for i, (name, items) in enumerate(groups.items()):
        W = max(it[2][0] for it in items); H = max(it[2][1] for it in items)
        k = min(1.0, 300 / H) if H > 300 else 1.0
        cell = (max(120, int(W * k)), max(120, int(H * k)))
        f = out / f"builds_{i:02d}.jpg"
        sheet([(c, p) for c, p, _ in items], f, cell, max(1, min(8, 1800 // (cell[0] + 6))), f"{batch.name}: {name} (rebuilt from the delivered part files)")
        sheets.append(f.name)
    for z in zooms or []:  # close-ups: "<build>@x,y,w,h" in grid coordinates, rastered at 900 px wide
        k, box = z.split("@"); x, y, w, h = [float(v) for v in box.split(",")]
        g = "".join(f'<g transform="{tf}">{part(a)}</g>' for a, tf in B.get(k, []) if part(a))
        H = int(900 * h / w)
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="900" height="{H}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#F4F1EA"/>{g}</svg>'
        raster(svg, out / f"zoom_{k.replace(':', '_')}_{int(x)}_{int(y)}.png", 900, H)
    return {"builds": len(B), "rebuilt": sum(len(v) for v in groups.values()), "baked_figures": len(baked), "baked_parts_unread": unread, "missing_parts": missing, "sheets": sheets}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch"); ap.add_argument("--engine"); ap.add_argument("--out")
    ap.add_argument("--zoom", action="append", help='a close-up of a page build: "b60@250,600,300,300" (grid coordinates); repeatable')
    ap.add_argument("--page", help="the delivery's review page (index.html) with loom-builds data; default <batch>/_page/index.html")
    a = ap.parse_args(argv)
    batch = Path(a.batch).resolve()
    man = json.loads((batch / "manifest.json").read_text())
    assets = man["assets"]
    if not assets:
        print("no assets in the manifest (a zero is not a result)"); return 2
    out = Path(a.out or ROOT / "cache" / "review" / batch.name); out.mkdir(parents=True, exist_ok=True)
    engine = Path(a.engine or batch / "_engine")
    rep = {"batch": batch.name}
    # 1-2. poses and joints from the delivery's own pose data
    if (engine / "maya_story.js").exists():
        r = subprocess.run([shutil.which("node") or "node", str(ROOT / "tools/node/rig_review.mjs"), str(engine), str(batch), str(out / "svg")], capture_output=True, text=True, timeout=300)
        print(r.stdout.strip() or r.stderr[-800:])
        rr = json.loads((out / "svg" / "report.json").read_text())
        items = []
        for p in rr["poses"]:
            if p.get("error"):
                continue
            png = out / "svg" / (Path(p["file"]).stem + ".png")
            raster(Path(p["file"]).read_text(), png, 300, 600)
            items.append((f"{p['view']} {p['name']}", png))
        sheet(items, out / "poses.jpg", (240, 480), 8, f"{batch.name}: every pose in the delivery's pose data, built from the delivered files")
        jitems = []
        for j in rr["joints"]:
            png = out / "svg" / (Path(j["file"]).stem + ".png")
            raster(Path(j["file"]).read_text(), png, 520, 760)
            jitems.append((f"arm {j['up']} / elbow {j['fore']}", png))
        sheet(jitems, out / "joints.jpg", (260, 380), 8, "joint test: right arm 0..170, then elbow 60..150 (delivered parts, delivered pivots)")
        rep.update({"poses": len(items), "missing_parts": rr["missing"], "joints": len(jitems)})
    else:
        page = Path(a.page) if a.page else batch / "_page" / "index.html"
        if page.exists():
            pb = page_builds(page, batch, out, a.zoom)
            print(json.dumps(pb, indent=1))
            rep.update({"page_builds": pb, "poses": None, "joints": None})
        else:
            print(f"no pose engine in {engine} and no review page at {page}: poses and joints skipped (say so in the review)")
            rep.update({"poses": None, "joints": None})
    # 3. expressions at a 120 px face
    faces = sorted(x["variant"] for x in assets if x.get("part") == "face" and x.get("view") == "front" and x.get("variant"))
    from PIL import Image
    import numpy as np
    crops, fitems = {}, []
    for v in faces:
        svg = stack(batch, ["maya/hair_back", "maya/neck", "maya/head", f"maya/face_{v}"], "300 230 400 400", (400, 400))
        png = out / f"face_{v}.png"; raster(svg, png, 400, 400)
        fitems.append((v, png))
        # the FACE region only (brows to chin, cheek to cheek: frame x 380..620, y 395..600), so the shared hair,
        # head outline and background do not dilute the difference; then the size of a 120 px face
        crops[v] = np.asarray(Image.open(png).convert("L").crop((80, 165, 320, 370)).resize((120, 103)), dtype=float)
    if fitems:
        sheet(fitems, out / "expressions.jpg", (200, 200), 6, "the twelve expressions (hair, head, face variant), each to be told apart at a 120 px face")
        dist = {f"{x} / {y}": round(float(np.abs(crops[x] - crops[y]).mean()), 1) for x, y in itertools.combinations(faces, 2)}
        closest = sorted(dist.items(), key=lambda kv: kv[1])[:8]
        yard = dist.get("laugh / neutral")
        (out / "expression_distance.json").write_text(json.dumps({"closest": closest, "yardstick_laugh_neutral": yard, "all": dist}, indent=1))
        rep["expressions"] = len(faces); rep["closest_pairs"] = closest; rep["yardstick_laugh_neutral"] = yard
    # 4. turnaround and hands
    turn = [x["file"][:-4] for x in assets if x.get("part") == "turnaround"]
    titems = []
    for t in turn:
        png = out / (Path(t).name + ".png"); raster(stack(batch, [t], "0 0 1000 2000", (500, 1000)), png, 300, 600); titems.append((Path(t).name, png))
    if titems:
        sheet(titems, out / "turnaround.jpg", (240, 480), 4, "turnaround views as delivered")
    hands = sorted(x["file"][:-4] for x in assets if x.get("part") in ("hand_r", "hand_l") and x.get("view") == "front")
    hitems = []
    for hpath in hands:
        p = part_svg(batch, hpath)
        if not p:
            continue
        x, y, w, h = p[1]; s = max(w, h) + 20
        png = out / (Path(hpath).name + ".png")
        raster(stack(batch, [hpath], f"{x - (s - w) / 2} {y - (s - h) / 2} {s} {s}", (200, 200)), png, 160, 160)
        hitems.append((Path(hpath).name.replace("hand_", ""), png))
    if hitems:
        sheet(hitems, out / "hands.jpg", (140, 140), 10, "hand variants as delivered")
    rep["hands"] = len(hitems); rep["turnaround"] = len(titems)
    (out / "review.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
