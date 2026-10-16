"""Approximate lab-scene frames WITHOUT a browser (a design aid; the Chrome render stays the truth).

    py tools/lab_preview.py <lab scene> [--style <id>] [--at 0.5,2,4] [--out <dir>] [--seed axis=opt,... | @lesson]
    py tools/lab_preview.py <lab scene> --style <id> --seeds [--at 2.8,6.6,10.6]   # one row per seed in the scene's @lab meta

Builds the same lab page `py -m loom lab` builds (loom/lab.py page()), runs it in Node against a small DOM shim
with a stand-in timeline (tools/node/svg_preview.mjs), and rasterises each frame with cairosvg into a strip at
<out>/<scene>__<style>__PREVIEW.jpg (default out: cache/preview/, gitignored).

Why it exists: the Cowork sandbox cannot download a browser (its network allowlist blocks Google's and
Playwright's hosts, L-135), and waiting on a PC render for every adjustment is slow. What it gets wrong, on purpose
written on every strip: text widths are estimated, blur and glow filters are skipped, the WebGL fx layer is not
drawn, and fonts are the woff2 faces converted to TTF only if fontTools is available (else a fallback face).
Calibrate it against a real strip before trusting it for a new kind of scene (see the test in tests/run_tests.py).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def install_fonts(style: dict) -> int:
    """Convert the pack's woff2 faces to TTF in ~/.local/share/fonts so cairosvg finds the families by name."""
    try:
        from fontTools.ttLib import TTFont
    except Exception:
        return 0
    dest = Path.home() / ".local" / "share" / "fonts" / "loom"
    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for face in style["fonts"].get("faces", []):
        src = ROOT / "node_modules" / face["pkg"] / "files" / face["file"] if not face.get("path") else Path(face["path"])
        out = dest / (Path(face["file"]).stem + ".ttf")
        fam, wt = face.get("family"), int(face.get("weight") or 400)

        def named_right(path):   # the converted face must register under the pack's family name (2026-10-16: the Space
            try:                 # Grotesk woff2 named itself "Space Grotesk Light", so cairosvg drew DejaVu instead)
                return TTFont(str(path))["name"].getDebugName(1) == fam
            except Exception:
                return False
        if out.exists() and (not fam or named_right(out)):
            n += 1; continue
        if src.exists():
            try:
                f = TTFont(str(src)); f.flavor = None
                if fam:
                    sub = "Bold" if wt >= 600 else "Regular"
                    for nid, val in ((1, fam), (2, sub), (4, f"{fam} {wt}"), (16, fam), (17, str(wt))):
                        f["name"].setName(val, nid, 3, 1, 0x409)
                        f["name"].setName(val, nid, 1, 0, 0)
                    if "OS/2" in f:
                        f["OS/2"].usWeightClass = wt
                f.save(str(out)); n += 1
            except Exception:
                pass
    if n and shutil.which("fc-cache"):
        subprocess.run(["fc-cache", "-f", str(dest)], capture_output=True)
    return n


def preview(scene: str, style: str | None = None, times: list[float] | None = None, out: Path | None = None, seed: dict | None = None) -> dict:
    from loom import lab
    from loom.compose import load_style
    from PIL import Image, ImageDraw
    import cairosvg
    tag = lab.seed_tag(seed)
    tmp, meta, st, times = lab.page(scene, style, times, seed={k: v for k, v in (seed or {}).items() if k != "name"} or None)
    install_fonts(load_style(st))
    frames = tmp / "preview"
    r = subprocess.run([shutil.which("node") or "node", str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(frames)],
                       capture_output=True, text=True, timeout=600)
    rep_f = frames / "report.json"
    if r.returncode != 0 or not rep_f.exists():
        raise SystemExit(f"preview failed: {r.stderr[-1500:]}")
    rep = json.loads(rep_f.read_text())
    out = Path(out or ROOT / "cache" / "preview")
    out.mkdir(parents=True, exist_ok=True)
    W_, H_ = 640, 360
    shots = rep["shots"]
    cols = min(4, max(1, len(shots))); rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (W_ + 6) + 6, rows * (H_ + 30) + 64), (17, 17, 17)); d = ImageDraw.Draw(sheet)
    d.text((10, 10), f"{meta.get('title', scene)}   [{st}]" + (f"   seed: {tag}" if tag else ""), fill=(255, 220, 90))
    d.text((10, 30), "PREVIEW (no browser): text widths estimated, no blur/glow filters, no WebGL fx. Not the render.", fill=(255, 120, 120))
    for i, s in enumerate(shots):
        png = Path(s["file"]).with_suffix(".png")
        cairosvg.svg2png(url=s["file"], write_to=str(png), output_width=1920, output_height=1080)
        x, y = 6 + (i % cols) * (W_ + 6), 64 + (i // cols) * (H_ + 30)
        sheet.paste(Image.open(png).convert("RGB").resize((W_, H_)), (x, y + 24))
        d.text((x + 4, y + 4), f"t = {s['t']:.2f}s", fill=(220, 220, 220))
        shutil.copy2(png, out / f"{scene}__{st}{'__' + tag if tag else ''}__{s['t']:05.2f}.png")
    f = out / f"{scene}__{st}{'__' + tag if tag else ''}__PREVIEW.jpg"
    sheet.save(f, quality=88)
    shutil.rmtree(tmp, ignore_errors=True)
    errs = [f"{e.get('code')}: {e.get('msg')}" for e in rep.get("errors") or []]
    print(f"preview: {scene} [{st}] {len(shots)} frames -> {f}")
    for e in errs[:20]:
        print("  runtime:", e)
    for n in rep.get("preview_errors", [])[:20]:
        print("  preview:", n)
    return {"sheet": str(f), "errors": errs, "notes": rep.get("preview_errors", []), "frames": len(shots), "seed": tag or None,
            "pngs": [str(out / f"{scene}__{st}{'__' + tag if tag else ''}__{s['t']:05.2f}.png") for s in shots], "times": [s["t"] for s in shots],
            "treatments": rep.get("treatments", []), "data": rep.get("data", []), "geo": rep.get("geo", []), "arrays": rep.get("arrays", [])}


def seeds_sheet(scene: str, style: str | None, times: list[float] | None, out: Path | None = None) -> dict:
    """The same lab scene once per seed in its @lab meta, one row each: the proof that a seed changes the FORM."""
    from loom import lab
    from PIL import Image, ImageDraw
    meta = lab._meta((lab.LAB / f"{scene}.js").read_text(encoding="utf-8"))
    seeds = meta.get("seeds") or []
    if not seeds:
        raise SystemExit(f"{scene} lists no seeds in its @lab meta")
    rows = [preview(scene, style, times, out, sd) for sd in seeds]
    W_, H_ = 560, 315
    n = max(len(r["pngs"]) for r in rows)
    sheet = Image.new("RGB", (150 + n * (W_ + 6) + 6, len(rows) * (H_ + 8) + 40), (17, 17, 17)); d = ImageDraw.Draw(sheet)
    d.text((10, 10), f"{scene} [{style}]: one row per design seed, same scene. PREVIEW (no browser), not the render.", fill=(255, 220, 90))
    for i, r in enumerate(rows):
        y = 40 + i * (H_ + 8)
        d.text((10, y + H_ // 2 - 6), r["seed"] or "-", fill=(230, 230, 230))
        for j, (png, t) in enumerate(zip(r["pngs"], r["times"])):
            x = 150 + j * (W_ + 6)
            sheet.paste(Image.open(png).convert("RGB").resize((W_, H_)), (x, y))
            if i == 0:
                d.text((x + 4, 26), f"t = {t:.2f}s", fill=(200, 200, 200))
    outd = Path(out or ROOT / "cache" / "preview"); outd.mkdir(parents=True, exist_ok=True)
    f = outd / f"{scene}__{style}__SEEDS.jpg"
    sheet.save(f, quality=86)
    print(f"seeds sheet: {len(rows)} seeds -> {f}")
    return {"sheet": str(f), "rows": rows}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("scene"); ap.add_argument("--style"); ap.add_argument("--at"); ap.add_argument("--out")
    ap.add_argument("--seed", help="axis=option,... or @<lesson id> (D-81)")
    ap.add_argument("--seeds", action="store_true", help="every seed in the scene's @lab meta, one row each")
    a = ap.parse_args(argv)
    times = [float(x) for x in a.at.split(",")] if a.at else None
    if a.seeds:
        r = seeds_sheet(a.scene, a.style, times, Path(a.out) if a.out else None)
        return 0 if all(x["frames"] for x in r["rows"]) else 2
    from loom.seed import parse_seed
    r = preview(a.scene, a.style, times, Path(a.out) if a.out else None, parse_seed(a.seed))
    return 0 if r["frames"] else 2


if __name__ == "__main__":
    sys.exit(main())
