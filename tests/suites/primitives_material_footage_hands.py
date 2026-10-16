"""Staging tests for the D-114 primitives built by prim_c: material joins, the footage layer, the hands kit.

Each test is a plain function `primitive_<name>_<claim>()` that returns a short summary on success and raises
AssertionError on failure. Browser tests return "skipped (no browser here)" when tests/browser_support.py finds no browser.

    python3 tests/suites/primitives_material_footage_hands.py                  # run every test here
    python3 tests/suites/primitives_material_footage_hands.py --make-hands     # (re)write assets/hands/placeholder/*.svg
    python3 tests/suites/primitives_material_footage_hands.py --sync-hands     # copy the placeholder set into runtime/hands.js
    python3 tests/suites/primitives_material_footage_hands.py --sync-footage   # embed media/synthetic_bars.webm into lab_footage.js

`embed_hands()` below is the reference implementation of the asset intake that compose and the lab need for
Loom.assets.hands (docs/primitives/hands.md, "Wiring").
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
RT = ROOT / "runtime"
HANDS = ROOT / "assets" / "hands"
MATERIAL_KINDS = ["torn", "page", "scroll", "motif", "handoff", "fill"]
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from loom.hands_assets import embed as embed_hands, check_family as check_hand_family  # noqa: E402  (production intake, D-114)
HAND_POSES = ["point", "hold", "pinch", "place", "open", "tap", "grab", "thumbs", "count1", "count2", "count3", "count4", "count5"]


# ------------------------------------------------------------------ helpers
def _node(script: str, timeout: int = 60) -> str:
    node = shutil.which("node")
    if not node:
        raise AssertionError("node is not installed")
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(script)
        path = f.name
    try:
        r = subprocess.run([node, path], capture_output=True, text=True, timeout=timeout)
    finally:
        os.unlink(path)
    if r.returncode != 0:
        raise AssertionError(f"node failed: {r.stderr[-1500:]}")
    return r.stdout


def _runtime_shim(files: list[str], material_src: str | None = None) -> str:
    """a node prelude that loads runtime files into a window-less shim (no document: pure functions only)"""
    src = []
    for f in files:
        txt = material_src if (f == "material.js" and material_src is not None) else (RT / f).read_text(encoding="utf-8")
        src.append(txt)
    return ("globalThis.window = globalThis;\n" + "\n".join(src) +
            "\nconst pack = JSON.parse(process.env.PACK); Loom.style.pack = pack;\n")


def _covers(points: list[tuple[str, float, dict]], style: str = "story-cartoon", material_src: str | None = None) -> list[dict]:
    """evaluate Loom.world.coverAt in node for (kind, p, def) triples"""
    pack = (ROOT / "packs" / "styles" / f"{style}.json").read_text(encoding="utf-8")
    js = _runtime_shim(["core.js", "style.js", "material.js", "world.js"], material_src) + (
        f"const pts = {json.dumps(points)};\n"
        "const out = pts.map(([k, p, d]) => { const C = Loom.world.coverAt(k, p, d, pack.palette); return { kind: k, p, d: C.d, fill: C.fill, opacity: C.opacity, layers: (C.layers || []).length }; });\n"
        "console.log(JSON.stringify({ out, errors: Loom.report.errors }));\n")
    env = dict(os.environ, PACK=pack)
    node = shutil.which("node")
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(js)
        path = f.name
    try:
        r = subprocess.run([node, path], capture_output=True, text=True, timeout=60, env=env)
    finally:
        os.unlink(path)
    if r.returncode != 0:
        raise AssertionError(f"node failed: {r.stderr[-1500:]}")
    res = json.loads(r.stdout)
    if res["errors"]:
        raise AssertionError(f"runtime errors: {res['errors'][:3]}")
    return res["out"]


def _coverage(d: str, opacity: float) -> float:
    """fraction of the 1920x1080 frame a cover paints (rasterised independently by cairosvg, even-odd, black)"""
    import cairosvg
    from PIL import Image
    import io
    if not d or opacity <= 0:
        return 0.0
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="192" height="108" viewBox="0 0 1920 1080">'
           f'<rect width="1920" height="1080" fill="#fff"/><path d="{d}" fill="#000" fill-rule="evenodd" opacity="{min(1, opacity):.3f}"/></svg>')
    png = cairosvg.svg2png(bytestring=svg.encode())
    import numpy as np
    im = np.asarray(Image.open(io.BytesIO(png)).convert("L"))
    return float((im < 128).mean())


DEFS = {"torn": {"dir": "right", "seed": 7}, "page": {"corner": "br"}, "scroll": {"dir": "down"},
        "motif": {"shape": "heart", "from": [560, 520], "at": [1340, 540]}, "handoff": {"to": "accent2", "from": [300, 300]},
        "fill": {"box": [300, 330, 520, 380]}}


def _no_cairo() -> str | None:
    """the cover coverage is rasterised by cairosvg, which needs the cairo library; Windows has none by default: a
    named skip, not a failure (B6, 2026-10-08)"""
    try:
        import cairosvg  # noqa: F401
        return None
    except OSError as e:
        return f"skipped: no cairo library here ({str(e).splitlines()[0][:80]}); install it to run the material coverage tests"
    except ImportError:
        return "skipped: cairosvg is not installed"


# ------------------------------------------------------------------ material joins
def primitive_material_covered_mid_clear_ends(material_src: str | None = None):
    """every material kind covers the whole frame from p = 0.42 to 0.58 and is clear at p = 0 and 1
    (the fill join starts as its own shape, so at p = 0 it may paint only inside def.box)"""
    if _no_cairo():
        return _no_cairo()
    pts = [(k, p, DEFS[k]) for k in MATERIAL_KINDS for p in (0.0, 0.42, 0.46, 0.5, 0.54, 0.58, 1.0)]
    bad = []
    for c in _covers(pts, material_src=material_src):
        cov = _coverage(c["d"], c["opacity"])
        if 0.42 <= c["p"] <= 0.58 and cov < 0.999:
            bad.append(f"{c['kind']} p={c['p']} covers {cov:.3f}")
        if c["p"] in (0.0, 1.0):
            limit = (520 * 380) / (1920 * 1080) + 0.01 if (c["kind"] == "fill" and c["p"] == 0.0) else 0.0
            if cov > limit:
                bad.append(f"{c['kind']} p={c['p']} still paints {cov:.3f}")
    assert not bad, "; ".join(bad)
    return f"{len(MATERIAL_KINDS)} kinds x 7 progress values: covered 0.42..0.58, clear at the ends"


def primitive_material_moves_between():
    """a cover is not a static box: between the ends and the middle it paints part of the frame (a pop would not)"""
    if _no_cairo():
        return _no_cairo()
    pts = [(k, p, DEFS[k]) for k in MATERIAL_KINDS for p in (0.2, 0.8)]
    flat = []
    for c in _covers(pts):
        cov = _coverage(c["d"], c["opacity"])
        if c["kind"] in ("handoff", "fill") and c["p"] == 0.8:
            cov = c["opacity"]   # these two fade off the new shot: partial opacity is the motion
        if not (0.02 < cov < 0.98):
            flat.append(f"{c['kind']} p={c['p']} {cov:.3f}")
    assert not flat, "no motion at: " + "; ".join(flat)
    return "every kind is part way at p = 0.2 and 0.8"


def primitive_material_torn_seeded():
    """the torn edge is a pure function of the seed: same seed same edge, another seed another edge"""
    a = _covers([("torn", 0.3, {"seed": 3}), ("torn", 0.3, {"seed": 3}), ("torn", 0.3, {"seed": 4})])
    assert a[0]["d"] == a[1]["d"], "same seed drew two different edges"
    assert a[0]["d"] != a[2]["d"], "different seeds drew the same edge"
    return "seed 3 twice identical, seed 4 differs"


def primitive_material_tables_agree():
    """compose.JOIN_DUR / SCREEN_JOINS, the schema enum and Loom.material.DUR name the same kinds and durations"""
    from loom import compose
    js = _node(_runtime_shim(["core.js", "material.js"]).replace("const pack = JSON.parse(process.env.PACK); Loom.style.pack = pack;", "")
               + "console.log(JSON.stringify(Loom.material.DUR));")
    dur = json.loads(js)
    assert sorted(dur) == sorted(MATERIAL_KINDS), f"runtime kinds {sorted(dur)}"
    for k, v in dur.items():
        assert compose.JOIN_DUR.get(k) == v, f"compose JOIN_DUR[{k}] = {compose.JOIN_DUR.get(k)} but runtime says {v}"
        assert k in compose.SCREEN_JOINS, f"{k} missing from compose.SCREEN_JOINS"
    sch = json.loads((ROOT / "loom/schemas/storyboard.schema.json").read_text(encoding="utf-8"))
    enum = sch["properties"]["scenes"]["items"]["properties"]["join_in"]["properties"]["type"]["enum"]
    assert set(MATERIAL_KINDS) <= set(enum), f"schema enum lacks {set(MATERIAL_KINDS) - set(enum)}"
    return f"{len(dur)} kinds agree across runtime, compose and schema"


def primitive_material_schema_accepts_and_rejects():
    """the storyboard schema accepts join_in.type for each new kind and still rejects an unknown kind"""
    import jsonschema
    sch = json.loads((ROOT / "loom/schemas/storyboard.schema.json").read_text(encoding="utf-8"))
    sub = sch["properties"]["scenes"]["items"]["properties"]["join_in"]
    for k in MATERIAL_KINDS:
        try:
            jsonschema.validate({"type": k, **({"at": [100, 200]} if k == "motif" else {})}, sub)
        except jsonschema.ValidationError as e:
            raise AssertionError(f"schema rejects join kind '{k}': {e.message}")
    try:
        jsonschema.validate({"type": "crumple"}, sub)
    except jsonschema.ValidationError:
        pass
    else:
        raise AssertionError("schema accepted the unknown join kind 'crumple'")
    return f"accepts {', '.join(MATERIAL_KINDS)}; rejects crumple"


def primitive_material_storyboard_gate():
    """a storyboard using every new join passes the storyboard gate's schema check (loom.validate)"""
    from loom.validate import validate
    sb = {"style": "story-cartoon", "world": {"stations": [{"id": "s1"}]},
          "scenes": [{"beat": f"b{i}", "station": "s1", "kind": "template", "join_in": {"type": k}} for i, k in enumerate(["cut"] + MATERIAL_KINDS)]}
    errs = validate(sb, "storyboard")
    jerr = [e for e in errs if "join_in" in e]
    assert not jerr, f"schema rejected the new joins: {jerr[:3]}"
    bad = json.loads(json.dumps(sb))
    bad["scenes"][1]["join_in"]["type"] = "crumple"
    assert any("join_in" in e or "crumple" in e for e in validate(bad, "storyboard")), "an unknown join kind passed loom.validate"
    return "loom.validate accepts the six kinds and rejects crumple"


# ------------------------------------------------------------------ hands kit
def _svg_attr(s: str, name: str):
    m = re.search(rf'\b{name}="([^"]*)"', s.split(">", 1)[0])
    return m.group(1) if m else None


def _placeholder_svg(pose: str) -> str:
    """deliberately abstract: a mitten or a rounded block for the palm, capsules for fingers, a dashed outline, a cross
    at the anchor and a PLACEHOLDER label. Nothing here is a drawn hand (D-102)."""
    line = 'class="hand-line" fill="none" stroke-width="6" stroke-dasharray="14 9"'
    cap = lambda x, y, w, h, a=0, cx=200, cy=320: f'<rect class="hand-skin" x="{x}" y="{y}" width="{w}" height="{h}" rx="{w / 2}" transform="rotate({a} {cx} {cy})"/>'
    rot = lambda px, py, a, cx=200, cy=320: (cx + (px - cx) * math.cos(math.radians(a)) - (py - cy) * math.sin(math.radians(a)),
                                            cy + (px - cx) * math.sin(math.radians(a)) + (py - cy) * math.cos(math.radians(a)))
    fist = '<rect class="hand-skin" x="120" y="300" width="160" height="220" rx="70"/>'
    mitten = '<rect class="hand-skin" x="110" y="200" width="180" height="320" rx="86"/><ellipse class="hand-skin" cx="102" cy="390" rx="36" ry="78" transform="rotate(-24 102 390)"/>'
    parts, anchor = [], (200, 360)
    if pose == "open":
        parts, anchor = [mitten], (200, 360)
    elif pose == "point":
        parts, anchor = [cap(180, 40, 40, 300), fist], (200, 52)
    elif pose == "tap":
        parts, anchor = [cap(180, 90, 40, 250, -12), fist], rot(200, 102, -12)
    elif pose == "pinch":
        parts = [cap(200, 140, 36, 200, 14, 218, 320), cap(150, 170, 36, 230, 28, 168, 390), fist]
        anchor = (238, 152)
    elif pose in ("hold", "place"):
        parts = [mitten, f'<circle {line} cx="200" cy="130" r="64"/>' if pose == "hold" else f'<rect {line} x="140" y="70" width="120" height="110" rx="10"/>']
        anchor = (200, 130 if pose == "hold" else 125)
    elif pose == "grab":
        parts, anchor = [fist, '<rect class="hand-skin" x="120" y="250" width="160" height="80" rx="40"/>'], (200, 400)
    elif pose == "thumbs":
        parts, anchor = [cap(104, 160, 44, 230, -8, 126, 380), fist], (200, 410)
    elif pose.startswith("count"):
        n = int(pose[-1])
        angles = {1: [0], 2: [-10, 10], 3: [-16, 0, 16], 4: [-21, -7, 7, 21], 5: [-26, -13, 0, 13, 40]}[n]
        parts = [cap(182, 90, 36, 240, a) for a in angles] + [fist]
        anchor = (200, 410)
    ax, ay = round(anchor[0], 1), round(anchor[1], 1)
    cross = f'<path class="hand-line" fill="none" stroke-width="4" d="M{ax - 16} {ay}H{ax + 16}M{ax} {ay - 16}V{ay + 16}"/>'
    body = "\n  ".join([
        '<rect class="hand-sleeve" x="125" y="500" width="150" height="140" rx="12"/>',
        '<rect class="hand-sleeve-shade" x="125" y="500" width="150" height="22" rx="8"/>',
        *parts,
        f'<rect {line} x="110" y="190" width="180" height="440" rx="40"/>',
        '<text class="hand-label" x="200" y="455" font-family="sans-serif" font-size="27" font-weight="700" text-anchor="middle">PLACEHOLDER</text>',
        f'<text class="hand-label" x="200" y="488" font-family="sans-serif" font-size="24" text-anchor="middle">{pose}</text>',
        cross])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640" data-hand-pose="{pose}" data-anchor="{ax} {ay}" '
            f'data-wrist="200 640" data-wrist-width="150" data-licence="CC0-1.0" data-author="Loom placeholder (generated by '
            f'tests/suites/primitives_material_footage_hands.py --make-hands)" data-placeholder="true">\n  {body}\n</svg>\n')


def make_hands():
    d = HANDS / "placeholder"
    d.mkdir(parents=True, exist_ok=True)
    for p in HAND_POSES:
        (d / f"{p}.svg").write_text(_placeholder_svg(p), encoding="utf-8", newline="\n")
    print(f"wrote {len(HAND_POSES)} placeholder poses to {d}")


def _placeholder_js(assets: dict) -> str:
    data = {k.split("/", 1)[1]: v for k, v in assets.items()}
    return "  const PLACEHOLDER = " + json.dumps(data, ensure_ascii=True, sort_keys=True) + ";\n"


def sync_hands():
    assets, errs = embed_hands(["placeholder"])
    assert not errs, errs
    f = RT / "hands.js"
    s = f.read_text(encoding="utf-8")
    new = re.sub(r"(/\* @placeholder-begin \*/\n)[\s\S]*?(  /\* @placeholder-end \*/)", lambda m: m.group(1) + _placeholder_js(assets) + m.group(2), s)
    f.write_text(new, encoding="utf-8", newline="\n")
    print(f"synced {len(assets)} placeholder poses into runtime/hands.js")


def primitive_hands_contract():
    """every family in assets/hands (the placeholder at least) meets the asset contract"""
    fams = sorted(p.name for p in HANDS.iterdir() if p.is_dir())
    assert "placeholder" in fams, "no assets/hands/placeholder"
    errs = [e for f in fams for e in check_hand_family(f)]
    assert not errs, "; ".join(errs[:6])
    return f"{len(fams)} famil{'y' if len(fams) == 1 else 'ies'} ({', '.join(fams)}) x {len(HAND_POSES)} poses meet the contract"


def primitive_hands_runtime_in_sync():
    """the placeholder copy inside runtime/hands.js equals assets/hands/placeholder (so the fallback is the real set)"""
    assets, errs = embed_hands(["placeholder"])
    assert not errs, errs
    s = (RT / "hands.js").read_text(encoding="utf-8")
    m = re.search(r"/\* @placeholder-begin \*/\n([\s\S]*?)  /\* @placeholder-end \*/", s)
    assert m, "no placeholder block in runtime/hands.js"
    assert m.group(1) == _placeholder_js(assets), "runtime/hands.js placeholder copy differs from assets/hands/placeholder (run --sync-hands)"
    return "runtime copy matches the asset files"


def _lab(scene: str, style: str, times: list[float], frames=True):
    if not browser():
        return None
    from loom.lab import strip
    tmp = Path(tempfile.mkdtemp(prefix="primc_"))
    r = strip(scene, style, times, out_dir=tmp, frames_dir=tmp / "f" if frames else None)
    r["tmp"] = tmp
    return r


def primitive_hands_placeholder_warns():
    """a lab render with the placeholder family raises hands_placeholder (and nothing worse)"""
    r = _lab("lab_hands", "story-cartoon", [2.0], frames=False)
    if r is None:
        return "skipped (no browser here)"
    try:
        assert any(w.startswith("hands_placeholder") for w in r["warnings"]), f"no hands_placeholder warning: {r['warnings'][:4]}"
        assert not r["errors"], f"errors: {r['errors'][:3]}"
    finally:
        shutil.rmtree(r["tmp"], ignore_errors=True)
    return "hands_placeholder raised, no errors"


# ------------------------------------------------------------------ footage
LAB_CLIP = ROOT / "scenes_examples" / "lab" / "media" / "synthetic_bars.webm"


def _clip_js() -> str:
    import base64
    return 'var LAB_FOOTAGE_CLIP = "data:video/webm;base64,' + base64.b64encode(LAB_CLIP.read_bytes()).decode() + '";\n'


def sync_footage():
    f = ROOT / "scenes_examples" / "lab" / "lab_footage.js"
    s = f.read_text(encoding="utf-8")
    f.write_text(re.sub(r"(/\* @clip-begin \*/\n)[\s\S]*?(/\* @clip-end \*/)", lambda m: m.group(1) + _clip_js() + m.group(2), s), encoding="utf-8", newline="\n")
    print(f"embedded {LAB_CLIP.stat().st_size} bytes of {LAB_CLIP.name} into {f.name}")


def primitive_footage_clip_small_and_in_sync():
    """the synthetic clip is small (under 1 MB), VP9 WebM, and the lab scene carries exactly its bytes"""
    assert LAB_CLIP.exists(), f"missing {LAB_CLIP}"
    n = LAB_CLIP.stat().st_size
    assert 0 < n < 1_000_000, f"clip is {n} bytes"
    assert LAB_CLIP.read_bytes()[:4] == b"\x1a\x45\xdf\xa3", "not a WebM/Matroska file"
    s = (ROOT / "scenes_examples" / "lab" / "lab_footage.js").read_text(encoding="utf-8")
    m = re.search(r"/\* @clip-begin \*/\n([\s\S]*?)/\* @clip-end \*/", s)
    assert m and m.group(1) == _clip_js(), "lab_footage.js clip differs from media/synthetic_bars.webm (run --sync-footage)"
    return f"{n} bytes, in sync"


def primitive_footage_seek_deterministic():
    """the footage layer shows the frame of the clip for t: two renders of the same times are pixel-identical, and two
    different times differ (the clip is moving, so a stuck video would fail)"""
    if not browser():
        return "skipped (no browser here)"
    import numpy as np
    from PIL import Image
    times = [0.8, 2.2]
    a = _lab("lab_footage", "story-cartoon", times)
    b = _lab("lab_footage", "story-cartoon", list(reversed(times)))   # another seek order
    try:
        assert not a["errors"] and not b["errors"], f"errors: {a['errors'][:2]} {b['errors'][:2]}"
        fa = sorted((a["tmp"] / "f").glob("*.png")); fb = sorted((b["tmp"] / "f").glob("*.png"))
        A = [np.asarray(Image.open(x).convert("RGB")).astype(int) for x in fa]
        B = [np.asarray(Image.open(x).convert("RGB")).astype(int) for x in fb]
        same = [float(np.abs(x - y).mean()) for x, y in zip(A, B)]
        assert max(same) < 0.5, f"same time, different pixels (mean abs diff {same})"
        # the clip region (lab_footage places it at x 160..1120, y 150..690)
        diff = float(np.abs(A[0][150:690, 160:1120] - A[1][150:690, 160:1120]).mean())
        assert diff > 2.0, f"the clip did not change between {times} (mean abs diff {diff:.2f}): the video is not seeking"
        # the RIGHT frame: the ungraded clip (trim [1, 3] at 1 s, cover-fit 560x185 at 1200, 505) at t = 2.2 must match
        # the frame ffmpeg decodes at clip time 2.2 (frames at 12 fps: 2.1667), below its label
        ref = Path(tempfile.mkdtemp(prefix="primc_ref_")) / "ref.png"
        # the frame on screen at clip time 2.2 is the last one that starts at or before it: n = floor(2.2 * 12) = 26
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(LAB_CLIP), "-vf", "select=eq(n\\,26)", "-frames:v", "1", str(ref)], check=True)
        r = np.asarray(Image.open(ref).convert("RGB").resize((560, 315))).astype(int)[65 + 100:65 + 185]
        got = A[1][505 + 100:690, 1200:1760]
        err = float(np.abs(got - r).mean())
        shutil.rmtree(ref.parent, ignore_errors=True)
        assert err < 6.0, f"the frame shown at t = 2.2 is not the clip's frame at 2.2 (mean abs diff {err:.1f} against ffmpeg)"
    finally:
        shutil.rmtree(a["tmp"], ignore_errors=True); shutil.rmtree(b["tmp"], ignore_errors=True)
    return f"same-time diff {max(same):.2f}, between-times diff {diff:.1f}, against ffmpeg's frame {err:.1f}"


TESTS = [primitive_material_covered_mid_clear_ends, primitive_material_moves_between, primitive_material_torn_seeded,
         primitive_material_tables_agree, primitive_material_schema_accepts_and_rejects, primitive_material_storyboard_gate,
         primitive_hands_contract, primitive_hands_runtime_in_sync, primitive_hands_placeholder_warns,
         primitive_footage_clip_small_and_in_sync, primitive_footage_seek_deterministic]


if __name__ == "__main__":
    if "--make-hands" in sys.argv:
        make_hands(); sys.exit(0)
    if "--sync-footage" in sys.argv:
        sync_footage(); sys.exit(0)
    if "--sync-hands" in sys.argv:
        sync_hands(); sys.exit(0)
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    fails = 0
    for t in TESTS:
        if only and not any(o in t.__name__ for o in only):
            continue
        try:
            print(f"[PASS] {t.__name__}: {t()}")
        except AssertionError as e:
            fails += 1
            print(f"[FAIL] {t.__name__}: {e}")
    sys.exit(1 if fails else 0)
