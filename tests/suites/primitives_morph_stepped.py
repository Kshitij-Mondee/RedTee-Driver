"""Staging tests for the D-114 primitives built by prim_a: path morph (runtime/morph.js) and stepped time
(runtime/stepped.js). Plain functions named primitive_<name>_<claim>() that return a short summary on success and
raise AssertionError on failure. Self-contained: the runtime is evaluated in node with a minimal window shim (no
browser), except the lab tests, which render the real lab strips and skip when tests/browser_support.py finds no browser.

The module constants (RUNTIME, TOL, LAB_DIR) exist so a test can be pointed at a deliberately broken copy to prove it
fails; see the report for how each was broken.
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

ENGINE = Path(__file__).resolve().parents[2]
RUNTIME = ENGINE / "runtime"          # point at a broken copy to prove the node tests fail
PACKS = ENGINE / "packs" / "styles"
LAB_DIR = None                        # None = the real scenes_examples/lab; a temp dir to prove the lab test fails
TOL = 0.5                             # px: the end shapes must match their source geometry this closely

# ---------------------------------------------------------------- node harness
_SHIM = r"""
global.window = global; global.document = { createElementNS() { return {}; } };
const fs = require("fs"), path = require("path");
const RT = process.env.PRIM_RT;
const load = (f) => { eval(fs.readFileSync(path.join(RT, f), "utf8")); };
const calls = [];
function setup(packFile) {
  load("core.js"); load("style.js");
  Loom.style.pack = JSON.parse(fs.readFileSync(packFile, "utf8")); Loom.style.intensity = 1;
  Loom.tl = { fromTo(target, from, vars, t) { calls.push({ target, from, vars, t }); }, set() {} };
  load("motion.js"); load("stepped.js"); load("morph.js");
}
function node(name, parent) { return { name, parentNode: parent || null, tagName: "g", attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; } }; }
function element(name) { const outer = node(name + ".outer"), mover = node(name + ".mover", outer), life = node(name + ".life", mover), inner = node(name + ".inner", life); return { name, outer, mover, life, inner, w: 100, h: 100 }; }
"""


def _node(body: str, pack: str = "story-cartoon") -> dict:
    node = shutil.which("node")
    if not node:
        raise AssertionError("node is not installed")
    src = _SHIM + f"\nsetup({json.dumps(str(PACKS / (pack + '.json')))});\n" + body
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(src)
        fn = f.name
    try:
        r = subprocess.run([node, fn], capture_output=True, text=True, timeout=50, env=dict(os.environ, PRIM_RT=str(RUNTIME)))
    finally:
        os.unlink(fn)
    if r.returncode != 0:
        raise AssertionError(f"node harness failed: {r.stderr.strip()[-600:]}")
    return json.loads(r.stdout.strip().splitlines()[-1])


# ---------------------------------------------------------------- independent geometry (python, not the JS parser)
def _cubics(d: str):
    """parse the interpolator's own output form (absolute M, C, Z only) into subpaths of cubic segments"""
    subs, cur, pos = [], None, None
    for cmd, args in re.findall(r"([MCZ])([^MCZ]*)", d):
        n = [float(x) for x in args.split()] if args.strip() else []
        if cmd == "M":
            cur = []; subs.append(cur); pos = (n[0], n[1])
        elif cmd == "C":
            for i in range(0, len(n), 6):
                seg = (pos, (n[i], n[i + 1]), (n[i + 2], n[i + 3]), (n[i + 4], n[i + 5]))
                cur.append(seg); pos = seg[3]
    return subs


def _pts(sub, k=12):
    out = []
    for p0, c1, c2, p3 in sub:
        for j in range(k):
            t = j / k; u = 1 - t
            out.append((u ** 3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p3[0],
                        u ** 3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p3[1]))
    return out


def _seg_dist(p, a, b):
    ax, ay, bx, by = a[0], a[1], b[0], b[1]
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy or 1e-12
    t = max(0.0, min(1.0, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L))
    return math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy)


CX, CY, R = 300.0, 300.0, 200.0   # the circle the morph starts from (box 100,100,400,400)


def _star_vertices():
    out = []
    for i in range(10):
        a = -math.pi / 2 + 2 * math.pi * i / 10
        s = 1 if i % 2 == 0 else 0.5
        out.append((CX + math.cos(a) * R * s, CY + math.sin(a) * R * s))
    return out


# ---------------------------------------------------------------- morph
def primitive_morph_exact_ends():
    out = _node("""
      const M = Loom.morph, box = {x: 100, y: 100, w: 400, h: 400};
      const A = M.shape("circle", box), B = M.shape("star", box, {n: 5, inner: 0.5});
      const f = M.interpolator(A, B, 48), g = M.interpolator(A, B, 48);
      console.log(JSON.stringify({ p0: f(0), p1: f(1), mid: f(0.37), again: f(0.37), other: g(0.37) }));
    """)
    assert out["mid"] == out["again"] == out["other"], "the same progress gave different strings"
    s0, s1 = _cubics(out["p0"]), _cubics(out["p1"])
    assert len(s0) == 1 and len(s1) == 1 and len(s0[0]) >= 48, f"expected one subpath of >= 48 segments, got {[len(s) for s in s0]}"
    worst0 = max(abs(math.hypot(x - CX, y - CY) - R) for x, y in _pts(s0[0]))
    assert worst0 <= TOL, f"p=0 leaves the circle by {worst0:.3f} px"
    V = _star_vertices()
    edges = list(zip(V, V[1:] + V[:1]))
    worst1 = max(min(_seg_dist(p, a, b) for a, b in edges) for p in _pts(s1[0]))
    assert worst1 <= TOL, f"p=1 leaves the star outline by {worst1:.3f} px"
    nodes = [seg[0] for seg in s1[0]]
    miss = max(min(math.hypot(v[0] - n[0], v[1] - n[1]) for n in nodes) for v in V)
    assert miss <= TOL, f"a star corner is cut by {miss:.3f} px (corners must stay corners)"
    mid_circle = max(abs(math.hypot(x - CX, y - CY) - R) for x, y in _pts(_cubics(out["mid"])[0]))
    assert mid_circle > 5, "the mid-morph shape equals the circle: nothing was interpolated"
    return f"circle->star: p0 within {worst0:.3f} px, p1 within {worst1:.3f} px, corners within {miss:.3f} px, deterministic"


def primitive_morph_subpaths_and_misuse():
    out = _node("""
      const M = Loom.morph;
      const two = M.shape("circle", {x: 0, y: 0, w: 100, h: 100}) + M.shape("circle", {x: 300, y: 0, w: 100, h: 100});
      const bar = M.shape("rect", {x: 0, y: 20, w: 400, h: 60}, {r: 30});
      const f = M.interpolator(two, bar, 32);
      const ring = M.shape("polygon", {x: 0, y: 0, w: 300, h: 300}) + M.reverse(M.shape("circle", {x: 100, y: 100, w: 100, h: 100}));
      const g = M.interpolator(bar, ring, 32);
      const pathEl = { tagName: "path", attrs: { d: "M0 0 L10 10" }, getAttribute(k) { return this.attrs[k]; }, setAttribute(k, v) { this.attrs[k] = v; } };
      const end = M.to(pathEl, "M 0 0 Q oops", 1.0, {});
      M.to({ tagName: "g", querySelector() { return null; } }, "M0 0L1 1", 2.0, {});
      console.log(JSON.stringify({ f0: f(0), f5: f(0.5), f1: f(1), g0: g(0), g1: g(1), end, errors: Loom.report.errors.map((e) => e.code) }));
    """)
    n = lambda d: len(_cubics(d))
    assert (n(out["f0"]), n(out["f5"]), n(out["f1"])) == (2, 2, 1), f"two discs -> one bar subpaths {n(out['f0'])}, {n(out['f5'])}, {n(out['f1'])} (want 2, 2, 1)"
    assert (n(out["g0"]), n(out["g1"])) == (1, 2), f"bar -> ring subpaths {n(out['g0'])}, {n(out['g1'])} (want 1, 2: the hole grows)"
    # the hole must wind opposite to the outer ring at p = 1, or nonzero fill would fill it in
    def area(sub):
        p = _pts(sub, 6)
        return sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p))) / 2
    a_out, a_hole = [area(s) for s in _cubics(out["g1"])]
    assert a_out * a_hole < 0, f"the hole winds the same way as the ring (areas {a_out:.0f}, {a_hole:.0f}): it would fill in"
    assert out["errors"].count("morph_bad_path") == 2, f"misuse not reported: errors {out['errors']}"
    assert out["end"] == 1.0, "a refused morph must return its start time"
    return "two discs merge (2->2->1 subpaths), a hole grows with opposite winding, 2 misuses reported as morph_bad_path"


# ---------------------------------------------------------------- stepped
def primitive_stepped_ease_holds():
    out = _node("""
      const e = Loom.stepped.ease("move", 1.0, 6);   // 6 steps of 1/6
      const v = [0.01, 0.1, 0.16, 0.17, 0.3, 0.5, 0.51, 0.999, 1].map(e);
      console.log(JSON.stringify({ v, n: e.steps, smooth: [0.01, 0.1].map(Loom.ease.move), short: Loom.stepped.ease("enter", 0.05, 6).steps }));
    """)
    v = out["v"]
    assert out["n"] == 6, f"steps {out['n']} (want round(1.0 * 6) = 6)"
    assert v[0] == v[1] == v[2] == 0, f"inside the first step the value must hold at 0: {v[:3]}"
    assert v[3] > v[2], "no jump across the 1/6 boundary"
    assert v[5] == v[6], f"inside one step (0.5, 0.51) the value moved: {v[5]} vs {v[6]}"
    assert v[8] == 1, "progress 1 must reach the end"
    assert out["smooth"][0] != out["smooth"][1], "control: the smooth ease does move inside a step"
    assert out["short"] == 1, "a tween shorter than one step still gets one step"
    return f"6 Hz over 1 s: holds inside steps, jumps at 1/6, reaches 1; values {[round(x, 3) for x in v]}"


_GATE_BODY = """
  const E = element("card"), F = element("plain");
  const hz = Loom.stepped.on(E, { hz: 6, force: %s });
  Loom.motion.settle(E, 0.2); Loom.motion.settle(F, 0.2);
  const eE = calls[calls.length - 2].vars.ease, eF = calls[calls.length - 1].vars.ease;
  // a drive inside wrap() steps too (travel writes the mover from a drive)
  Loom.stepped.wrap(() => Loom.motion.travel(F, 1.0, { x: 100, dur: 1.0 }), { hz: 8, force: %s });
  const tw = Loom.report.tweens.slice(-1)[0];
  console.log(JSON.stringify({ hz, stepsE: eE.steps || 0, stepsF: eF.steps || 0, travelStepped: tw.stepped || 0,
    warnings: Loom.report.warnings.map((w) => w.code) }));
"""


def primitive_stepped_switch_and_pack_gate():
    cart = _node(_GATE_BODY % ("false", "false"), pack="story-cartoon")
    corp = _node(_GATE_BODY % ("false", "false"), pack="corporate-clean")
    forced = _node(_GATE_BODY % ("true", "true"), pack="corporate-clean")
    assert cart["hz"] == 6 and cart["stepsE"] >= 2, f"illustrated pack: m.settle on a stepped element was not stepped ({cart})"
    assert cart["stepsF"] == 0, "an element that was never switched on was stepped"
    assert cart["travelStepped"] == 8, f"a drive inside wrap() was not stepped ({cart['travelStepped']})"
    assert corp["hz"] == 0 and corp["stepsE"] == 0 and corp["travelStepped"] == 0, f"editorial pack stepped without force: {corp}"
    assert "stepped_off_for_pack" in corp["warnings"], "the pack refusal was silent"
    assert forced["hz"] == 6 and forced["stepsE"] >= 2 and forced["travelStepped"] == 8, f"force did not opt in: {forced}"
    return (f"story-cartoon: settle stepped in {cart['stepsE']} steps, unswitched element smooth, wrap() drive at 8 Hz; "
            "corporate-clean: smooth + warning; force: stepped")


# ---------------------------------------------------------------- browser: the labs
def _strip(scene, style, times, frames=None):
    sys.path.insert(0, str(ENGINE))
    from loom import lab
    old = lab.LAB
    if LAB_DIR:
        lab.LAB = Path(LAB_DIR)
    out = tempfile.mkdtemp(prefix="prim_a_")
    try:
        return lab.strip(scene, style, times, out_dir=out, frames_dir=frames)
    finally:
        lab.LAB = old
        shutil.rmtree(out, ignore_errors=True)


def primitive_morph_lab_renders_clean():
    if not browser():
        return "skipped (no browser here)"
    got = []
    for scene, style in (("lab_morph", "story-cartoon"), ("lab_morph", "corporate-clean")):
        r = _strip(scene, style, [0.75, 2.05, 3.95, 5.6])
        assert not r["errors"], f"{scene} [{style}] errors: {r['errors'][:4]}"
        bad = [w for w in r["warnings"] if w.startswith("morph")]
        assert not bad, f"{scene} [{style}] morph warnings: {bad}"
        got.append(style)
    # seek order must not matter: the same mid-morph times seeked forwards and backwards give identical pixels
    from PIL import Image, ImageChops
    fa, fb = Path(tempfile.mkdtemp(prefix="prim_a_fa_")), Path(tempfile.mkdtemp(prefix="prim_a_fb_"))
    _strip("lab_morph", "story-cartoon", [0.75, 2.05, 3.95], frames=fa)
    _strip("lab_morph", "story-cartoon", [3.95, 2.05, 0.75], frames=fb)
    A, B = sorted(fa.glob("*.png")), sorted(fb.glob("*.png"))
    assert len(A) == len(B) == 3, f"frames {len(A)}, {len(B)}"
    for a, b in zip(A, B):
        assert ImageChops.difference(Image.open(a).convert("RGB"), Image.open(b).convert("RGB")).getbbox() is None, f"{a.name} differs when seeked in another order"
    shutil.rmtree(fa, ignore_errors=True); shutil.rmtree(fb, ignore_errors=True)
    return f"lab_morph renders with 0 errors and 0 morph warnings in {', '.join(got)}; mid-morph frames identical in either seek order"


def primitive_stepped_lab_holds_in_frames():
    """the real frames: inside one step the stepped card and the boil are pixel-identical while the smooth card moves"""
    if not browser():
        return "skipped (no browser here)"
    from PIL import Image, ImageChops
    fr = Path(tempfile.mkdtemp(prefix="prim_a_fr_"))
    # travel runs 0.8 -> 2.0 at 6 Hz (7 steps of 0.1714 s): 1.0 and 1.12 share a step, 1.2 is the next one.
    # boil runs 0 -> 3 at 8 Hz: 1.0 and 1.12 share step 8, 1.2 is step 9.
    r = _strip("lab_stepped", "story-cartoon", [1.0, 1.12, 1.2], frames=fr)
    assert not r["errors"], f"lab_stepped errors: {r['errors'][:4]}"
    ims = [Image.open(p).convert("RGB") for p in sorted(fr.glob("*.png"))]
    assert len(ims) == 3, f"expected 3 frames, got {len(ims)}"
    boxes = {"smooth": (140, 140, 1400, 300), "stepped": (140, 345, 1400, 510), "boil": (1380, 120, 1780, 520)}
    same = lambda a, b, k: ImageChops.difference(ims[a].crop(boxes[k]), ims[b].crop(boxes[k])).getbbox() is None
    assert not same(0, 1, "smooth"), "control failed: the smooth card did not move between 1.0 and 1.12"
    assert same(0, 1, "stepped"), "the stepped card moved inside one step"
    assert not same(1, 2, "stepped"), "the stepped card did not jump at the step boundary"
    assert same(0, 1, "boil"), "the boil changed inside one step"
    assert not same(1, 2, "boil"), "the boil did not redraw at the step boundary"
    shutil.rmtree(fr, ignore_errors=True)
    return "frames 1.0/1.12/1.2: smooth card moves, stepped card and boil hold inside a step and change across it"


if __name__ == "__main__":
    fails = 0
    for name, fn in list(globals().items()):
        if name.startswith("primitive_") and callable(fn):
            try:
                print(f"PASS {name}: {fn()}")
            except AssertionError as e:
                fails += 1
                print(f"FAIL {name}: {e}")
    sys.exit(1 if fails else 0)
