"""Library wrappers of 2026-10-08 (docs/research/2026-10-08-motion-libraries.md): Loom.physics (Matter.js, baked),
Loom.brush (p5.brush standalone, painted once), Loom.orb (thinking-orbs engine, a pure function of t), and the rule
that a library is loaded only when a scene uses it. The browser tests load the REAL lab page in headless Chrome and
skip without a browser (tests/browser_support.py); each has a control that shows it can fail."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

_NODE = r"""
const { createRequire } = require("module");
const req = createRequire(%(engine)s + "/tools/node/x.js");
const puppeteer = req("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    const logs = [];
    p.on("pageerror", (e) => logs.push(String(e).slice(0, 300)));
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(`(function () {
      const probe = %(probe)s;
      const times = %(times)s;
      const samples = times.map((t) => { Loom.tl.seek(t, false); return { t, v: probe(t) }; });
      const R = Loom.report;
      return { samples, report: { errors: R.errors, warnings: R.warnings, physics: R.physics || [], brush: R.brush || [] } };
    })()`);
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _probe(scene: str, style: str, probe_js: str, times: list[float]) -> dict:
    from loom import lab
    tmp, _meta, _st, _t = lab.page(scene, style, times=[0.0])
    try:
        js = _NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                      "probe": probe_js, "times": json.dumps(times)}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE), env=dict(os.environ))
        assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


_PHYS = r"""function (t) {
  const out = {};
  document.querySelectorAll("g.lm-el[data-name]").forEach((e) => {
    const n = e.getAttribute("data-name") || "";
    if (!/^(req_|task_|one_more)/.test(n)) return;
    const inner = e.querySelector("g.lm-in > g");
    out[n] = inner ? inner.getAttribute("transform") : null;
  });
  return out;
}"""


def primitive_physics_is_frame_exact_in_any_seek_order():
    """lab_physics: the bodies' poses at a time are the same whether the timeline got there forwards, backwards or by
    jumping; the bodies really move (control: poses at 0.3 s and 6.5 s differ for most bodies); the queue settles."""
    if not _browser():
        return "skipped (no browser here)"
    fwd = [0.3, 1.0, 2.0, 3.0, 4.0, 5.0, 6.5]
    mixed = [6.5, 2.0, 5.0, 0.3, 4.0, 1.0, 3.0]
    a = _probe("lab_physics", "corporate-clean", _PHYS, fwd)
    b = _probe("lab_physics", "corporate-clean", _PHYS, mixed)
    assert not a["report"]["errors"], a["report"]["errors"][:3]
    A = {s["t"]: s["v"] for s in a["samples"]}
    B = {s["t"]: s["v"] for s in b["samples"]}
    names = sorted(A[6.5])
    assert len(names) >= 15, f"the probe found only {names} (blind?)"
    for t in fwd:
        assert A[t] == B[t], f"t={t}: poses differ by seek order"
    moved = [n for n in names if A[0.3].get(n) != A[6.5].get(n)]
    assert len(moved) >= len(names) * 0.8, f"only {len(moved)} of {len(names)} bodies moved"
    q = {p["name"]: p for p in a["report"]["physics"]}
    assert q["queue"]["settled"] is True and q["queue"]["bodies"] == 12, q
    return f"{len(names)} bodies, identical in two seek orders; {len(moved)} moved; queue settled"


_BRUSH = r"""function (t) {
  const out = { imgs: [], clips: [] };
  const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 7) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  document.querySelectorAll("image").forEach((im) => {
    const href = im.getAttribute("href") || "";
    if (!href.startsWith("data:image/png")) return;
    out.imgs.push(h(href));
    const cp = im.getAttribute("clip-path");
    if (cp) { const r = document.getElementById(cp.match(/#([^)]+)/)[1]).firstElementChild; out.clips.push(+r.getAttribute("width")); }
    else out.clips.push(null);
  });
  return out;
}"""


def primitive_brush_paints_the_same_marks_and_reveals_them_in_order():
    """lab_brush: two loads of the page paint byte-identical layers (same seed, same pixels); the layers differ from
    each other (control: the probe is not reading one blank image eight times); a wipe layer is closed before its
    time and open after it."""
    if not _browser():
        return "skipped (no browser here)"
    a = _probe("lab_brush", "editorial-paper", _BRUSH, [0.1, 0.5, 2.0, 5.9])
    b = _probe("lab_brush", "editorial-paper", _BRUSH, [5.9])
    assert not a["report"]["errors"], a["report"]["errors"][:3]
    imgs = a["samples"][-1]["v"]["imgs"]
    assert len(imgs) == 8, f"expected 8 painted layers, found {len(imgs)}"
    assert imgs == b["samples"][-1]["v"]["imgs"], "two loads painted different pixels"
    assert len(set(imgs)) == len(imgs), "two layers are the same image (blank?)"
    first =[s["v"]["clips"][0] for s in a["samples"]]
    assert first[0] == 0 and first[-1] > 1500, f"the first layer's wipe: {first}"
    return f"8 layers, identical across loads, all different; wipe closed at 0.1 s, open at 5.9 s"


# lab_brush's watercolour layer (layer 2) baked again and again in one page, between other kinds of layer, with one seed;
# a full-string hash, since the defect was 9 pixels at the wash's edge (L-304). Then the same fill with the next seed.
_BRUSH_FILLS = r"""function (t) {
  const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  const fill = (b) => { b.fill("#c0504d", 120); b.fillBleed(0.12); b.noStroke(); b.rect(610, 190, 420, 240); };
  const pen = (b) => { b.set("pen", "#2f6f9f", 1.6); b.line(700, 450, 1040, 450); };
  const hatch = (b) => { b.set("charcoal", "#2f6f9f", 1); b.noFill(); b.hatch(9, 0.7); b.circle(1380, 530, 80); b.noHatch(); };
  const bake = (draw, seed) => h(Loom.brush.bake(1640, 640, seed, 4.5, draw));
  const S = (21 + 2 * 7919) >>> 0, fills = [];
  for (const before of [null, pen, null, hatch, null, pen, null, null]) { if (before) bake(before, S + 1); fills.push(bake(fill, S)); }
  return { fills, other_seed: bake(fill, S + 1) };
}"""


def primitive_brush_a_fill_bakes_the_same_pixels_every_time():
    """L-304: a watercolour fill baked 8 times in one page with one seed, after a fill, a pen line or a charcoal hatch,
    paints byte-identical pixels every time (it drew 2 to 7 different images per page when the fill shader's edge blur
    took derivatives after a non-uniform return). Control: the same fill with the next seed paints a different image,
    so the probe is not comparing blank canvases."""
    if not _browser():
        return "skipped (no browser here)"
    r = _probe("lab_brush", "editorial-paper", _BRUSH_FILLS, [0.5])
    assert not r["report"]["errors"], r["report"]["errors"][:3]
    v = r["samples"][0]["v"]
    fills = v["fills"]
    assert len(set(fills)) == 1, f"one seed painted {len(set(fills))} different fills in 8 bakes: {fills}"
    assert v["other_seed"] != fills[0], "the next seed painted the same fill (blank or unseeded probe?)"
    return "8 bakes of one fill after other layers, byte-identical; the next seed differs"


_ORB = r"""function (t) {
  const c = document.querySelector("foreignObject canvas");
  if (!c) return null;
  const s = c.toDataURL("image/png");
  let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 5) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return { h: x >>> 0, n: s.length };
}"""


def primitive_orb_is_a_pure_function_of_time():
    """lab_orb: the orb's canvas at 1.0 s is the same after seeking to 4.5 s and back; 1.0 s and 4.5 s differ (control:
    the probe reads a canvas that changes); no runtime errors through the state switches."""
    if not _browser():
        return "skipped (no browser here)"
    r = _probe("lab_orb", "corporate-clean", _ORB, [1.0, 4.5, 1.0, 2.9])
    assert not r["report"]["errors"], r["report"]["errors"][:3]
    v = [s["v"] for s in r["samples"]]
    assert all(v), "no orb canvas found"
    assert v[0]["h"] == v[2]["h"], "the same time painted different orbs"
    assert v[0]["h"] != v[1]["h"] and v[1]["h"] != v[3]["h"], "the orb did not change over time"
    return "same frame after a backward seek; frames differ across time and states"


def pipeline_libraries_load_only_when_a_scene_uses_them():
    """compose and the lab add a library only when a scene's code calls its wrapper; each library file exists after
    npm install and node tools/vendor_js.mjs. Control: a scene that calls none of them gets none."""
    from loom.compose import vendor_scripts, VENDOR
    assert vendor_scripts("Loom.scene('x', {build(ctx){ctx.kit.rect()}})") == []
    got = [n for n, _ in vendor_scripts("Loom.physics.world(ctx,'a',{}); Loom.brush.paint(ctx,'b',{}); Loom.orb(ctx,'c',{})")]
    assert got == ["matter.min.js", "p5brush.js", "thinking_orbs_engine.js"], got
    missing = [rel for _p, _n, rel in VENDOR if not (ENGINE / rel).exists()]
    assert not missing, f"missing library files (npm install; node tools/vendor_js.mjs): {missing}"
    from loom import lab
    tmp, *_ = lab.page("lab_physics", "corporate-clean", times=[0.5])
    try:
        html = (tmp / "lab.html").read_text(encoding="utf-8")
        assert "matter.min.js" in html and "thinking_orbs_engine.js" not in html, "the lab page loads the wrong libraries"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    tmp, *_ = lab.page("lab_data", "corporate-clean", times=[0.5])
    try:
        assert "matter.min.js" not in (tmp / "lab.html").read_text(encoding="utf-8")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "none for a plain scene; the three when called; files present; the lab page matches"
