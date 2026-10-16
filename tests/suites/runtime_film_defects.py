"""Runtime film defects found on the five bench videos (2026-10-07) and fixed in runtime/world.js, motion.js, rig.js.

Each test builds a small lesson (inline scenes and one inline test template, so no library template is involved),
boots it with the REAL runtime through Loom.boot in headless Chrome, seeks the timeline and reads the DOM, the full
Loom.report and, where the claim is about pixels, the screenshot. Every test carries a positive control so a zero or
an always-true measurement cannot pass silently. Without a browser they skip, by name.

  five-beat film the post-mortem's minimum: one station away from the world origin, an element with no entrance, one
                 with exit "none", a scene that throws, a timeline arrow and two backplated templates; by pixels,
                 nothing shows outside its life, the live beat is never blurred, the spotlight lands on screen, and
                 seeks in shuffled order give identical frames
  self blur      a backplated template's own scene group is never blurred during its own beat
  ghost veil     a template that keeps words (a page, a card, anything a template built) gets the full 0.94 veil;
                 a keep name that resolves to nothing does not count as a held picture
  nested size    a nested station's local space is one full frame whatever w/h it declares
  frame layout   focus/zoom is dropped on template/blueprint/redtee/avatar beats (they lay out in the whole frame)
  fx moment      a spotlight rect on a station away from the world origin lands on screen
  element life   no element shows outside its beats (no entrance, exit "none", thrown scene, filled arrow head),
                 and a thrown scene with nothing drawn shows its own narration words
  held and el    ctx.held matches a name that differs only in case (with a warning); ctx.el takes an element as parent,
                 and a parent that is neither says which beat
  followers      parts declared as E.followers leave with their leader, once
  figure crop    a character whose head or side leaves the station warns figure_cropped

LOOM_TEST_RUNTIME=<dir> runs the same tests against another runtime folder (that is how each was shown to FAIL on the
runtime before the fix: docs/research/bench-fix/red_runs/).
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

_HARNESS = r"""
const { createRequire } = require("module");
const crypto = require("crypto");
const req = createRequire(%(engine)s + "/tools/node/x.js");
const puppeteer = req("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell",
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    const logs = [];
    p.on("pageerror", (e) => logs.push(String(e).slice(0, 300)));
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__loom_ready === true", { timeout: 60000 });
    const probe = %(probe)s, regions = %(regions)s, blurs = %(blurs)s, hashes = %(hashes)s, out = { samples: [], logs };
    // fraction of a region's pixels that differ between two screenshots (sum of RGB differences > 60)
    const diff = (a, b, R, thr) => p.evaluate(async (b64, b64b, R, thr) => {
      const load = async (x) => { const img = new Image(); img.src = "data:image/png;base64," + x; await img.decode();
        const c = document.createElement("canvas"); c.width = 1920; c.height = 1080; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g; };
      const g = await load(b64), g0 = await load(b64b), r = {};
      for (const [k, [x0, y0, x1, y1]] of Object.entries(R)) {
        const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data, d0 = g0.getImageData(x0, y0, x1 - x0, y1 - y0).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - d0[i]) + Math.abs(d[i + 1] - d0[i + 1]) + Math.abs(d[i + 2] - d0[i + 2]) > thr) n++;
        r[k] = +(n / (d.length / 4)).toFixed(3);
      }
      return r;
    }, a, b, R, thr == null ? 60 : thr);
    // two animation frames after every DOM change before a screenshot: an unsettled compositor frame made the same DOM
    // read 0 or 13120 px apart in the probe (2026-10-07)
    const settle = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    const _shot = p.screenshot.bind(p);
    p.screenshot = async (o) => { await settle(); return _shot(o); };
    for (const t of %(times)s) {
      const v = await p.evaluate(`(function () { Loom.tl.seek(${t}, false); return (${probe})(${t}); })()`);
      const s = { t, v };
      const shot = (regions || blurs || hashes) ? await p.screenshot({ encoding: "base64" }) : null;
      if (hashes) s.hash = crypto.createHash("md5").update(shot).digest("hex");
      if (regions) {
        // a box [x0, y0, x1, y1] is "painted" where this frame differs from the same frame with every scene group off;
        // {el, box} asks the sharper question: does THAT element contribute pixels there (the frame with only it off).
        // A template's backplate changes every pixel of the first kind, so beats with one use the second.
        const all = {}, per = {};
        for (const [k, v] of Object.entries(regions)) { if (Array.isArray(v)) all[k] = v; else per[k] = v; }
        s.px = {};
        if (Object.keys(all).length) {
          await p.evaluate(() => document.querySelectorAll(".lm-scene").forEach((g) => { g.__d = g.style.visibility; g.style.visibility = "hidden"; }));
          const base = await p.screenshot({ encoding: "base64" });
          await p.evaluate(() => document.querySelectorAll(".lm-scene").forEach((g) => { g.style.visibility = g.__d; }));
          Object.assign(s.px, await diff(shot, base, all, 60));
        }
        for (const [k, v] of Object.entries(per)) {
          await p.evaluate((n) => document.querySelectorAll(`.lm-el[data-name="${n}"]`).forEach((g) => { g.__d = g.style.visibility; g.style.visibility = "hidden"; }), v.el);
          const base = await p.screenshot({ encoding: "base64" });
          await p.evaluate((n) => document.querySelectorAll(`.lm-el[data-name="${n}"]`).forEach((g) => { g.style.visibility = g.__d || ""; }), v.el);
          // the same page at the same time renders the same pixels, so any change at all is the element's own
          Object.assign(s.px, await diff(shot, base, { [k]: v.box }, 6));
        }
      }
      if (blurs) {
        // a region is "blurred" where this frame differs from the same frame with every scene group's filter removed
        await p.evaluate(() => document.querySelectorAll(".lm-scene[filter]").forEach((g) => { g.__f = g.getAttribute("filter"); g.removeAttribute("filter"); }));
        const sharp = await p.screenshot({ encoding: "base64" });
        await p.evaluate(() => document.querySelectorAll(".lm-scene").forEach((g) => { if (g.__f) { g.setAttribute("filter", g.__f); g.__f = null; } }));
        s.blur = await diff(shot, sharp, blurs, 6);
      }
      out.samples.push(s);
    }
    out.report = await p.evaluate(() => { const R = Loom.report; return { errors: R.errors.map((e) => ({ code: e.code, beat: e.beat || null, msg: String(e.msg || "").slice(0, 200) })),
      warnings: R.warnings.map((e) => ({ code: e.code, beat: e.beat || null, msg: String(e.msg || "").slice(0, 200) })), texts: R.texts.map((x) => x.text),
      tweens: R.tweens.filter((x) => x.kind === "exit").map((x) => ({ name: x.name, beat: x.beat, t0: x.t0 })),
      elements: R.elements.map((e) => ({ beat: e.beat, name: e.name, exitT: e.exitT, lifeT: e.lifeT === undefined ? "absent" : e.lifeT })) }; });
    console.log(JSON.stringify(out));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""

# A test template that lays out in the whole frame like every library template: a panel and a line of words.
_TEMPLATE = r"""
Loom.template("t_words", { props: {}, build(ctx, p) {
  const B = ctx.box;
  const E = ctx.el("words_" + ctx.beat.id, { x: B.x + 200, y: B.y + 300, w: 1200, h: 200, kind: "card" });
  ctx.kit.rect(E.inner, 0, 0, 1200, 200, { fill: "surface", r: 12 });
  ctx.m.reveal(E, ctx.start + 0.1);
} });
"""


def _runtime() -> Path:
    return Path(os.environ.get("LOOM_TEST_RUNTIME") or (ENGINE / "runtime")).resolve()


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _beats(n: int, dur: float = 4.0, words: dict | None = None) -> list[dict]:
    out = []
    for i in range(n):
        s = dur * i
        bid = f"b{i + 1}"
        txt = (words or {}).get(bid, "")
        ph = [{"text": txt, "s": s + 0.6, "e": s + dur - 0.6, "words": [{"w": w, "s": s + 0.6, "e": s + 0.9} for w in txt.split()]}] if txt else []
        out.append({"id": bid, "section": "s", "start": s, "end": s + dur, "speech_start": s + 0.6, "speech_end": s + dur - 0.6,
                    "pause_after": 0, "phrases": ph})
    return out


def _lesson(scenes_js: str, scenes: list[dict], stations: list[dict], n: int, dur: float = 4.0, words: dict | None = None,
            style: "str | dict" = "corporate-clean", templates: bool = False, engine: str | None = None) -> Path:
    """Write a lesson page into a temp dir (the real runtime in compose order, the style's fonts) and return it.
    templates=True adds the catalog templates (runtime/templates/*.js), as compose does for a lesson that uses them;
    engine="screencast" adds that style engine (runtime/engines/<name>.js) after the runtime, as compose does."""
    from loom.compose import RUNTIME_ORDER, load_style
    from loom.util import read_json
    rt = _runtime()
    nm = ENGINE / "node_modules"
    stl = style if isinstance(style, dict) else load_style(style)   # a pack dict: a modified pack (tests/suites/style_system.py)
    tmp = Path(tempfile.mkdtemp(prefix="lm_rtfd_"))
    (tmp / "fonts").mkdir(); (tmp / "rt").mkdir()
    for face in stl["fonts"].get("faces", []):
        f = Path(face["path"]) if face.get("path") else nm / face["pkg"] / "files" / face["file"]
        shutil.copy2(f, tmp / "fonts" / face["file"])
    # rough.js for a sketch pack, as compose and the lab page do (without it every sketch shape is a rough_missing error)
    rough = [nm / "roughjs/bundled/rough.js"] if (stl.get("shape") or {}).get("shading") == "sketch" else []
    order = [rt / x for x in RUNTIME_ORDER]
    if engine:
        order.append(rt / "engines" / f"{engine}.js")
    scripts = [nm / "gsap/dist/gsap.min.js"] + rough + order + sorted((rt / "rigs").glob("*.js"))
    if templates:
        scripts += [rt / "templates" / "_helpers.js"] + sorted(q for q in (rt / "templates").glob("*.js") if not q.name.startswith("_"))
    tags = []
    for i, s in enumerate(scripts):
        shutil.copy2(s, tmp / "rt" / f"{i:02d}_{s.name}")
        tags.append(f'<script src="rt/{i:02d}_{s.name}"></script>')
    beats = _beats(n, dur, words)
    for i, d in enumerate(scenes):
        d.setdefault("beat", f"b{i + 1}")
        d.setdefault("station", "s")
        d.setdefault("join_in", {"type": "cut" if i == 0 else "continue"})
    man = {"lesson": "rtfd", "duration": n * dur, "fps": 30, "style": stl, "fontBase": "fonts",
           "assets": {"icons": read_json(ENGINE / "assets/icons/lucide.json")["icons"], "peeps": read_json(ENGINE / "assets/peeps/peeps.json")["peeps"]},
           "beats": beats, "cues": {}, "world": {"stations": stations}, "scenes": scenes,
           "captions": {"enabled": False, "groups": []}, "brand": None, "sections": [], "chrome": {}, "presenter": None}
    html = ("<!doctype html><html><head><meta charset='utf-8'><style>*{margin:0;padding:0}html,body{width:1920px;height:1080px;overflow:hidden}"
            "#lm-root{position:relative;width:1920px;height:1080px;overflow:hidden}</style></head><body>"
            f"<div id='lm-root' data-composition-id='main' data-duration='{n * dur}' data-width='1920' data-height='1080'></div>"
            + "".join(tags) + f"<script>{_TEMPLATE}\n{scenes_js}</script><script>window.LOOM_MANIFEST = {json.dumps(man)};</script>"
            "<script>Loom.boot(window.LOOM_MANIFEST);</script></body></html>")
    (tmp / "index.html").write_text(html, encoding="utf-8")
    return tmp


def _run(page_dir: Path, probe_js: str, times: list[float], regions: dict | None = None, blurs: dict | None = None,
         hashes: bool = False) -> dict:
    try:
        js = _HARNESS % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(page_dir / "index.html").replace("\\", "/")),
                         "probe": probe_js, "times": json.dumps(times), "regions": json.dumps(regions), "blurs": json.dumps(blurs),
                         "hashes": json.dumps(bool(hashes))}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=240, cwd=str(ENGINE),
                           env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=_browser() or ""))
        assert r.returncode == 0, f"harness failed: {r.stderr[-900:]}"
        out = json.loads(r.stdout.strip().splitlines()[-1])
        assert not out["logs"], f"page errors: {out['logs']}"
        return out
    finally:
        shutil.rmtree(page_dir, ignore_errors=True)


_ONE = [{"id": "s", "x": 0, "y": 0, "w": 1920, "h": 1080}]
_SKIP = "skipped: no Chrome here (set HYPERFRAMES_BROWSER_PATH, or let HyperFrames install its browser)"

# the effective blur of each beat's scene group: its own filter's stdDeviation (0 without a filter)
_BLUR = r"""function () {
  const out = {};
  for (const g of document.querySelectorAll(".lm-scene")) {
    const f = g.getAttribute("filter"); let sd = 0;
    if (f) { const id = f.match(/#([^)]+)/)[1]; const n = document.getElementById(id).querySelector("feGaussianBlur"); sd = parseFloat(n.getAttribute("stdDeviation")) || 0; }
    out[g.getAttribute("data-beat")] = +sd.toFixed(2);
  }
  return out;
}"""

_PICTURE = 'Loom.scene("%s", { build(ctx) { const A = ctx.el("%s", { x: 300, y: 200, w: 600, h: 400, kind: "%s" }); ctx.kit.rect(A.inner, 0, 0, 600, 400, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.1); } });\n'


# ------------------------------------------------------------------ the post-mortem's minimum, by pixels
_FIVE = r"""
Loom.scene("b1", { build(ctx) {
  const P = ctx.el("P", { x: 100, y: 120, w: 300, h: 200, kind: "scenery" });                 // no entrance at all
  ctx.kit.rect(P.inner, 0, 0, 300, 200, { fill: "accent", r: 8 });
  const N = ctx.el("N", { x: 500, y: 120, w: 300, h: 200, kind: "card", exit: "none" });      // exit none, not kept
  ctx.kit.rect(N.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(N, ctx.start + 0.3);
} });
Loom.scene("b3", { build(ctx) { const missing = null; return missing.drawn; } });               // throws, draws nothing
Loom.scene("b5", { build(ctx) {
  const R = ctx.el("R", { x: 1300, y: 120, w: 300, h: 200, kind: "scenery" });                // no entrance, a LATER beat
  ctx.kit.rect(R.inner, 0, 0, 300, 200, { fill: "accent", r: 8 });
  const D = ctx.el("D", { x: 0, y: 0, w: 1, h: 1, kind: "structure" });                       // a timeline arrow
  ctx.kit.arrow(D.inner, 200, 800, 1700, 800, { stroke: "ink", sw: 6, head: 60 }); ctx.m.draw(D, ctx.start + 1.0, { dur: 0.8 });
} });
"""
_FIVE_REGIONS = {"P": {"el": "P", "box": [100, 120, 400, 320]}, "N": {"el": "N", "box": [500, 120, 800, 320]},
                 "R": {"el": "R", "box": [1300, 120, 1600, 320]}, "head": {"el": "D", "box": [1640, 770, 1700, 830]},
                 "fallback": {"el": "scene_error_fallback", "box": [96, 344, 1824, 644]},
                 "card2": {"el": "words_b2", "box": [296, 384, 1496, 584]}, "card4": {"el": "words_b4", "box": [296, 384, 1496, 584]}}
_FIVE_BLURS = {"card": [280, 370, 1510, 600], "P": [90, 110, 410, 330]}


def primitive_runtime_five_beat_film_invariants():
    """the post-mortem's minimum on ONE station at world x 4000: b1 a picture with an element that has no entrance (P,
    kept by b2) and one with exit "none" (N, not kept); b2 a backplated template; b3 a scene that throws having drawn
    nothing; b4 a second backplated template with a spotlight; b5 a timeline arrow and a no-entrance element. By pixels
    (each region against the same frame with every scene group hidden): nothing shows outside its life; the live
    template is never blurred (against the same frame with every filter removed) while the picture it keeps is; the
    spotlight rect is on screen; shuffled seeks give byte-identical frames"""
    if not _browser():
        return _SKIP
    st = [{"id": "s", "x": 4000, "y": 0, "w": 1920, "h": 1080}]
    scenes = [{"kind": "bespoke"}, {"kind": "template", "template": "t_words", "keep": ["P"]}, {"kind": "bespoke"},
              {"kind": "template", "template": "t_words", "fx": [{"kind": "spotlight", "rect": [100, 100, 400, 300], "dur": 1.0}]},
              {"kind": "bespoke"}]
    words = {"b3": "Fallback words from the narration"}
    fwd = [2.0, 6.0, 10.0, 14.0, 16.5, 18.5]
    shuf = [14.0, 18.5, 2.0, 16.5, 6.0, 10.0]
    probe = r"""function () { return (Loom.manifest.fx_moments || []).map((m) => m.rect.map((x) => +x.toFixed(1))); }"""
    a = _run(_lesson(_FIVE, scenes, st, 5, words=words), probe, fwd, _FIVE_REGIONS, _FIVE_BLURS, hashes=True)
    b = _run(_lesson(_FIVE, scenes, st, 5, words=words), probe, shuf, None, None, hashes=True)
    F = {s["t"]: s["px"] for s in a["samples"]}
    BL = {s["t"]: s["blur"] for s in a["samples"]}
    HA = {s["t"]: s["hash"] for s in a["samples"]}
    HB = {s["t"]: s["hash"] for s in b["samples"]}
    on = lambda v: v > 0.5          # noqa: E731  the region is painted
    off = lambda v: v < 0.01        # noqa: E731  the region equals the frame with every scene group off
    rects = a["samples"][0]["v"]
    errs = {(e["code"], e["beat"]) for e in a["report"]["errors"]}
    checks = [
        ("control: P (b1) shows in b1", on(F[2.0]["P"])),
        ("control: N (b1) shows in b1", on(F[2.0]["N"])),
        ("control: b2's card shows in b2", on(F[6.0]["card2"])),
        ("control: b4's card shows in b4", on(F[14.0]["card4"])),
        ("STUCK: b2's card gone in b3 to b5", all(off(F[t]["card2"]) for t in (10.0, 14.0, 18.5))),
        ("PRESHOWN: b4's card absent before b4", all(off(F[t]["card4"]) for t in (2.0, 6.0, 10.0))),
        ("control: R (b5) shows in b5", on(F[18.5]["R"])),
        ("control: the arrow head shows after its draw", F[18.5]["head"] > 0.05),
        ("KEEP: P, held by b2, still shows in b2", F[6.0]["P"] > 0.2),
        ("STUCK: P (not held after b2) gone in b3, b4, b5", all(off(F[t]["P"]) for t in (10.0, 14.0, 18.5))),
        ("STUCK: N (exit none, not kept) gone from b2 on", all(off(F[t]["N"]) for t in (6.0, 10.0, 14.0, 18.5))),
        ("PRESHOWN: R (no entrance, b5) absent in b1 to b4", all(off(F[t]["R"]) for t in (2.0, 6.0, 10.0, 14.0))),
        ("R shows from its own beat's start, before its stroke-drawn neighbour", on(F[16.5]["R"])),
        ("PRESHOWN: the filled arrow head absent before its draw", all(off(F[t]["head"]) for t in (2.0, 6.0, 10.0, 14.0, 16.5))),
        ("THROWN: b3 drew nothing, so its narration words show", F[10.0]["fallback"] > 0.02),
        ("THROWN: the fallback is gone before and after b3", all(off(F[t]["fallback"]) for t in (2.0, 6.0, 14.0, 18.5))),
        ("THROWN: scene_threw stays an error for b3", ("scene_threw", "b3") in errs),
        ("BLUR: b2's own card is sharp in b2", BL[6.0]["card"] < 0.01),
        ("BLUR: b4's own card is sharp in b4", BL[14.0]["card"] < 0.01),
        ("BLUR control: the picture b2 keeps (P) IS blurred under its backplate", BL[6.0]["P"] > 0.01),
        ("FX: the spotlight on a station at world x 4000 is where it was asked, on screen", rects == [[100.0, 100.0, 400.0, 300.0]]),
        ("REPORT: every element carries its life window", all(isinstance(e["lifeT"], list) for e in a["report"]["elements"])),
        ("DETERMINISM: shuffled seeks give byte-identical frames", all(HA[t] == HB[t] for t in fwd)),
        ("DETERMINISM control: different beats give different frames", len({HA[t] for t in fwd}) >= 4),
    ]
    bad = [n for n, ok in checks if not ok]
    assert not bad, f"{bad}; regions {json.dumps(F)}; blur {json.dumps(BL)}; fx {rects}"
    return f"{len(checks)} pixel claims hold on 5 beats at world x 4000"


def primitive_runtime_backplate_blur_never_on_own_beat():
    """self blur: a backplated template's own group is never blurred during its own beat (it used to carry the
    station's shared filter, attached statically by a LATER backplated beat); the picture under it is blurred"""
    if not _browser():
        return _SKIP
    js = _PICTURE % ("b1", "A", "scenery") + _PICTURE % ("b3", "C", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "template", "template": "t_words"}, {"kind": "bespoke"}, {"kind": "template", "template": "t_words"}]
    mids = [2.0, 6.0, 10.0, 14.0]
    fw = _run(_lesson(js, scenes, _ONE, 4), _BLUR, mids)
    sh = _run(_lesson(js, scenes, _ONE, 4), _BLUR, list(reversed(mids)))
    F = {s["t"]: s["v"] for s in fw["samples"]}
    S = {s["t"]: s["v"] for s in sh["samples"]}
    bad = []
    for t, own in ((6.0, "b2"), (14.0, "b4")):
        if F[t].get(own, 0) > 0.5:
            bad.append(f"{own} blurs ITSELF at its own midpoint t={t}: stdDeviation {F[t][own]}")
    # controls: the picture under each backplate IS blurred, and a bare picture beat is sharp
    assert F[6.0].get("b1", 0) >= 8, f"control: b1 should be blurred under b2's backplate, got {F[6.0]}"
    assert F[14.0].get("b3", 0) >= 8, f"control: b3 should be blurred under b4's backplate, got {F[14.0]}"
    assert F[10.0].get("b3", 0) == 0, f"b3 (a picture beat) must be sharp in its own beat, got {F[10.0]}"
    assert F[10.0].get("b1", 0) == 0, f"b1 must be unblurred again once b3 takes the station, got {F[10.0]}"
    assert not bad, "; ".join(bad)
    assert F == S, f"seek order changed the blur: forward {F} vs reversed {S}"
    return f"own groups sharp at b2/b4 midpoints; pictures under them at {F[6.0]['b1']}/{F[14.0]['b3']} px"


def primitive_runtime_backplate_veil_full_over_kept_words():
    """ghost veil: keep of a WORD element (or anything a template built) gets the 0.94 veil, a kept picture keeps
    0.82, and a keep name that resolves to nothing is not a held picture (no backplate after a template)"""
    if not _browser():
        return _SKIP
    js = _PICTURE % ("b1", "words", "text") + _PICTURE % ("b3", "hill", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "template", "template": "t_words", "keep": ["words"]},
              {"kind": "bespoke"}, {"kind": "template", "template": "t_words", "keep": ["hill"]},
              {"kind": "template", "template": "t_words", "props": {"backplate": False}},
              {"kind": "template", "template": "t_words", "keep": ["no_such_element"]}]
    probe = r"""function () { const o = {};
      for (const g of document.querySelectorAll(".lm-scene")) { const r = g.querySelector('.lm-el[data-name="template_backplate"] rect');
        o[g.getAttribute("data-beat")] = r ? +r.getAttribute("opacity") : null; } return o; }"""
    out = _run(_lesson(js, scenes, _ONE, 6), probe, [1.0])
    v = out["samples"][0]["v"]
    assert v.get("b4") == 0.82, f"control: a kept PICTURE keeps the lighter 0.82 veil, got {v}"
    assert v.get("b2") == 0.94, f"kept words under a 0.82 veil print through the template at 18%: b2 veil {v.get('b2')}"
    assert v.get("b6") is None, f"a keep that resolved to nothing made b6 a backplate over a template: {v}"
    assert any(e["code"] == "held_missing" and e["beat"] == "b6" for e in out["report"]["errors"]), "the misspelt keep must still be an error"
    return f"veils {v}"


def primitive_runtime_nested_station_is_one_frame():
    """nested size: a nested station declared w 960 h 540 still has a 1920x1080 local space (templates lay out in
    kit.SAFE of a full frame) and says station_size_ignored; its safe box lands inside the frame"""
    if not _browser():
        return _SKIP
    st = [{"id": "s", "x": 0, "y": 0, "w": 1920, "h": 1080},
          {"id": "c", "parent": "s", "w": 960, "h": 540, "rect": {"x": 480, "y": 270, "w": 960, "h": 540}}]
    js = _PICTURE % ("b1", "A", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "template", "template": "t_words", "station": "c", "join_in": {"type": "zoom"}}]
    probe = r"""function (t) { const W = Loom.world, st = W.stations.c, c = W.cameraAt(t), SF = Loom.kit.SAFE;
      const wr = W.toWorld("c", SF); const sx = 960 + (wr.x - c.cx) * c.s, sy = 540 + (wr.y - c.cy) * c.s, sw = wr.w * c.s, sh = wr.h * c.s;
      const ix = Math.max(0, Math.min(1920, sx + sw) - Math.max(0, sx)), iy = Math.max(0, Math.min(1080, sy + sh) - Math.max(0, sy));
      return { w: st.w, h: st.h, ws: st.ws, inside: +((ix * iy) / (sw * sh)).toFixed(3) }; }"""
    out = _run(_lesson(js, scenes, st, 2), probe, [6.0])
    v = out["samples"][0]["v"]
    assert abs(v["ws"] - 0.5) < 1e-6 and v["w"] == 1920 and v["h"] == 1080, f"nested local space should be 1920x1080 at scale 0.5: {v}"
    assert v["inside"] > 0.99, f"the nested template's safe box is only {v['inside']:.0%} in frame"
    assert any(w["code"] == "station_size_ignored" for w in out["report"]["warnings"]), "no station_size_ignored warning"
    return f"nested station {v}"


def primitive_runtime_frame_layout_beats_ignore_focus():
    """frame layout: shot.focus on a template beat is dropped (it cropped its own layout) and warns
    shot_framing_ignored; the same focus on a bespoke beat is still honoured (control)"""
    if not _browser():
        return _SKIP
    js = _PICTURE % ("b2", "A", "scenery")
    scenes = [{"kind": "template", "template": "t_words", "shot": {"focus": [0, 0, 960, 540]}},
              {"kind": "bespoke", "shot": {"focus": [0, 0, 960, 540]}}]
    probe = r"""function (t) { const c = Loom.world.cameraAt(t); return { s: +c.s.toFixed(3), cx: +c.cx.toFixed(1), cy: +c.cy.toFixed(1) }; }"""
    out = _run(_lesson(js, scenes, _ONE, 2), probe, [2.0, 6.0])
    a, b = out["samples"][0]["v"], out["samples"][1]["v"]
    assert b["s"] == 2.0, f"control: a bespoke focus must still frame the focus (scale 2), got {b}"
    assert a == {"s": 1.0, "cx": 960.0, "cy": 540.0}, f"the template beat is cropped by its focus: camera {a}"
    assert any(w["code"] == "shot_framing_ignored" and w["beat"] == "b1" for w in out["report"]["warnings"]), "no shot_framing_ignored warning"
    return f"template camera {a}, bespoke camera {b}"


def primitive_runtime_fx_moment_rect_follows_camera():
    """fx moment: a spotlight on a station at world x 4000 lands on screen (it was converted with the identity
    camera at build time, before the camera keys existed, and dimmed the whole frame with its hole off screen)"""
    if not _browser():
        return _SKIP
    st = [{"id": "s", "x": 0, "y": 0, "w": 1920, "h": 1080}, {"id": "far", "x": 4000, "y": 0, "w": 1920, "h": 1080}]
    js = _PICTURE % ("b1", "A", "scenery") + _PICTURE % ("b2", "B", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "station": "far", "join_in": {"type": "camera"},
                                     "fx": [{"kind": "spotlight", "rect": [100, 100, 400, 300], "dur": 1.0}]},
              {"kind": "bespoke", "station": "s", "join_in": {"type": "camera"}, "fx": [{"kind": "light", "rect": [100, 100, 400, 300], "dur": 1.0}]}]
    js += _PICTURE % ("b3", "C", "scenery")
    probe = r"""function () { return (Loom.manifest.fx_moments || []).map((m) => m.rect.map((x) => +x.toFixed(1))); }"""
    out = _run(_lesson(js, scenes, st, 3), probe, [5.0])
    rects = out["samples"][0]["v"]
    assert len(rects) == 2, f"expected two moments, got {rects}"
    assert rects[1] == [100.0, 100.0, 400.0, 300.0], f"control: the moment on the origin station is where it was asked: {rects[1]}"
    assert rects[0] == [100.0, 100.0, 400.0, 300.0], f"the spotlight on the far station is off screen: {rects[0]}"
    return f"moment rects {rects}"


_LIFE_SCENES = r"""
Loom.scene("b1", { build(ctx) { const A = ctx.el("A", { x: 100, y: 120, w: 300, h: 200, kind: "card" });
  ctx.kit.rect(A.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.3); } });
Loom.scene("b2", { build(ctx) { const B = ctx.el("B", { x: 500, y: 120, w: 300, h: 200, kind: "scenery" });
  ctx.kit.rect(B.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); } });
Loom.scene("b3", { build(ctx) { const C = ctx.el("C", { x: 900, y: 120, w: 300, h: 200, kind: "card", exit: "none" });
  ctx.kit.rect(C.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(C, ctx.start + 0.3); } });
Loom.scene("b4", { build(ctx) { const D = ctx.el("D", { x: 0, y: 0, w: 1, h: 1, kind: "structure" });
  ctx.kit.arrow(D.inner, 200, 700, 1700, 700, { stroke: "ink", sw: 6, head: 60 }); ctx.m.draw(D, ctx.start + 1.0, { dur: 0.8 }); } });
Loom.scene("b5", { build(ctx) { const E = ctx.el("E", { x: 1300, y: 120, w: 300, h: 200, kind: "card" });
  ctx.kit.rect(E.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); const held = null; ctx.m.reveal(E, held.x); } });
Loom.scene("b6", { build(ctx) { const nothing = null; return nothing.drawn; } });
"""
_LIFE_REGIONS = {"A": [100, 120, 400, 320], "B": [500, 120, 800, 320], "C": [900, 120, 1200, 320], "E": [1300, 120, 1600, 320],
                 "D_head": [1640, 670, 1700, 730], "fallback": [300, 470, 1620, 700]}


def primitive_runtime_element_life_pixels():
    """element life (pixels): an element with no entrance does not show before its beat, an unkept exit "none" leaves,
    a filled arrow head drawn with m.draw stays hidden until its stroke arrives, a thrown scene's element shows only
    in its own beat, and a scene that threw before drawing shows its own narration words; any seek order agrees"""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"} for _ in range(6)]
    words = {"b6": "Fallback words from the narration"}
    fwd = [2.0, 6.0, 10.0, 12.5, 14.0, 18.0, 22.0]
    shuf = [14.0, 22.0, 18.0, 12.5, 2.0, 10.0, 6.0]
    probe = "function () { return 0; }"
    a = _run(_lesson(_LIFE_SCENES, scenes, _ONE, 6, words=words), probe, fwd, _LIFE_REGIONS)
    b = _run(_lesson(_LIFE_SCENES, scenes, _ONE, 6, words=words), probe, shuf, _LIFE_REGIONS)
    F = {s["t"]: s["px"] for s in a["samples"]}
    S = {s["t"]: s["px"] for s in b["samples"]}
    on = lambda v: v > 0.5          # noqa: E731  the region is painted
    off = lambda v: v < 0.01        # noqa: E731  the region equals the frame with every scene group off
    checks = [
        ("control: A shows in b1", on(F[2.0]["A"])),
        ("control: B shows in b2", on(F[6.0]["B"])),
        ("control: C shows in b3", on(F[10.0]["C"])),
        ("control: D's head shows after its draw", F[14.0]["D_head"] > 0.05),
        ("PRESHOWN: B (no entrance, b2) absent during b1", off(F[2.0]["B"])),
        ("PRESHOWN: E (b5, scene threw) absent during b1", off(F[2.0]["E"])),
        ("PRESHOWN: D's filled arrow head absent during b1", off(F[2.0]["D_head"])),
        ("PRESHOWN: D's head absent at 12.5 s, before its draw starts at 13.0 s", off(F[12.5]["D_head"])),
        ("STUCK: C (exit none, not kept) gone during b4", off(F[14.0]["C"])),
        ("STUCK: B gone during b4", off(F[14.0]["B"])),
        ("THROWN: E still shows in its own beat b5 (gated, not deleted)", on(F[18.0]["E"])),
        ("THROWN: b6 drew nothing, so its narration words show", F[22.0]["fallback"] > 0.02),
        ("THROWN: scene_threw stays an error for b5 and b6", {e["beat"] for e in a["report"]["errors"] if e["code"] == "scene_threw"} == {"b5", "b6"}),
        ("THROWN: the fallback card carries the narration", any("Fallback words" in x for x in a["report"]["texts"])),
        ("REPORT: elements carry their life window", all(isinstance(e["lifeT"], list) for e in a["report"]["elements"])),
        ("DETERMINISM: shuffled seek order gives the same pixels", all(F[t] == S[t] for t in F)),
    ]
    bad = [n for n, ok in checks if not ok]
    assert not bad, f"{bad}; regions {json.dumps(F)}"
    return f"{len(checks)} pixel claims hold"


_HELD = r"""
Loom.scene("b1", { build(ctx) { const A = ctx.el("priya", { x: 100, y: 120, w: 300, h: 200, kind: "character" });
  ctx.kit.rect(A.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.3); } });
Loom.scene("b2", { build(ctx) {
  const P = ctx.held("Priya");                                         // the name differs only in case
  const tag = ctx.el("tag", { x: 20, y: 20, w: 100, h: 40, kind: "label", parent: P });   // an element passed whole
  ctx.kit.rect(tag.inner, 0, 0, 100, 40, { fill: "accent2", r: 4 }); ctx.m.reveal(tag, ctx.start + 0.3);
} });
Loom.scene("b3", { build(ctx) {
  ctx.held("Priya");                                                   // a second hop: b2 holds it, under the name "priya"
  ctx.el("bad", { x: 0, y: 0, w: 10, h: 10, parent: { not: "an element" } }); } });
"""


def primitive_runtime_held_name_case_and_el_parent():
    """held and el: ctx.held("Priya") takes the element b1 drew as "priya" (a warning, not held_missing), and again a beat
    later; ctx.el takes
    an element passed whole as its parent (it threw "appendChild is not a function" with no beat); a parent that is
    neither an element nor a group throws a message that names the beat"""
    if not _browser():
        return _SKIP
    out = _run(_lesson(_HELD, [{"kind": "bespoke"}, {"kind": "bespoke"}, {"kind": "bespoke"}], _ONE, 3, words={"b3": "Bad parent beat"}),
               r"""function () { const t = document.querySelector('.lm-el[data-name="tag"]');
                   return { tagInPriya: !!(t && t.closest('.lm-el[data-name="priya"]')) }; }""", [6.0])
    R = out["report"]
    errs = {(e["code"], e["beat"]) for e in R["errors"]}
    warns = {(w["code"], w["beat"]) for w in R["warnings"]}
    assert ("held_name_case", "b2") in warns, f"no held_name_case warning: {warns}"
    assert ("held_missing", "b2") not in errs, f"a case-only difference is not a missing element: {errs}"
    # the claude fork's b03 held "Dev" from b02, which held "dev" from b01: the element sits twice in b02's pool (drawn
    # list and claimed list), and the case match counted two and refused it (2026-10-07)
    assert ("held_missing", "b3") not in errs, f"a held element passed on a second time was lost: {R['errors']}"
    assert ("scene_threw", "b2") not in errs, f"ctx.el with an element as parent threw: {R['errors']}"
    assert out["samples"][0]["v"]["tagInPriya"], "the tag was not drawn inside the held element"
    bad = [e for e in R["errors"] if e["code"] == "scene_threw" and e["beat"] == "b3"]
    assert bad and "b3" in bad[0]["msg"] and "parent" in bad[0]["msg"], f"control: a non-element parent must throw naming the beat: {R['errors']}"
    return "held matched case-insensitively with a warning, over two hops; element parent accepted; bad parent names b3"


_FOLLOW = r"""
Loom.scene("b1", { build(ctx) {
  const P = ctx.el("page", { x: 300, y: 150, w: 900, h: 700, kind: "card" });
  ctx.kit.rect(P.inner, 0, 0, 900, 700, { fill: "surface", r: 8 });
  const L1 = ctx.el("line1", { x: 360, y: 260, w: 700, h: 40, kind: "text" }); ctx.kit.rect(L1.inner, 0, 0, 700, 40, { fill: "accent" });
  const L2 = ctx.el("line2", { x: 360, y: 340, w: 700, h: 40, kind: "text" }); ctx.kit.rect(L2.inner, 0, 0, 700, 40, { fill: "accent" });
  P.followers = [L1, L2];
  ctx.m.reveal(P, ctx.start + 0.1); ctx.m.reveal(L1, ctx.start + 0.3); ctx.m.reveal(L2, ctx.start + 0.4);
} });
Loom.scene("b2", { build(ctx) { const A = ctx.el("A", { x: 300, y: 200, w: 600, h: 400, kind: "scenery" }); ctx.kit.rect(A.inner, 0, 0, 600, 400, { fill: "accent" }); ctx.m.reveal(A, ctx.start + 0.1); } });
"""


def primitive_runtime_followers_exit_with_leader():
    """followers: parts declared as E.followers (a page's lines and highlight bars) leave at the page's exit time
    with ONE exit each; the join pass used to exit them a second time on their own stagger slot"""
    if not _browser():
        return _SKIP
    out = _run(_lesson(_FOLLOW, [{"kind": "bespoke"}, {"kind": "bespoke"}], _ONE, 2), "function () { return 0; }", [1.0])
    ex = [x for x in out["report"]["tweens"] if x["beat"] == "b1"]
    by = {}
    for x in ex:
        by.setdefault(x["name"], []).append(x["t0"])
    assert by.get("page"), f"control: the page must have an exit, got {by}"
    bad = [f"{n}: {len(by.get(n, []))} exits at {by.get(n)}" for n in ("line1", "line2") if by.get(n) != by["page"]]
    assert not bad, f"page exits at {by['page']}; " + "; ".join(bad)
    return f"page and both lines exit at {by['page']}"


_FIG = r"""
Loom.scene("b1", { build(ctx) { const id = Object.keys(Loom.rig.defs)[0];
  const H = ctx.character("high", id, { x: 600, y: 300, scale: 1 }); ctx.m.reveal(H, ctx.start + 0.1);
  const S = ctx.character("side", id, { x: 10, y: 1000, scale: 1 }); ctx.m.reveal(S, ctx.start + 0.1);
  const G = ctx.character("grounded", id, { x: 1300, y: 1000, scale: 1 }); ctx.m.reveal(G, ctx.start + 0.1);
  // exempt: a figure inside a clipped portrait (cut on purpose) and a grey extra bleeding past the edge (a crowd)
  const P = ctx.el("portrait", { x: 900, y: 0, w: 200, h: 200, kind: "card" });
  const defs = Loom.svg("defs", {}, P.inner), cid = Loom.uid("pclip");
  Loom.svg("circle", { cx: 100, cy: 100, r: 90 }, Loom.svg("clipPath", { id: cid }, defs));
  const hold = Loom.svg("g", { "clip-path": `url(#${cid})` }, P.inner);
  const Q = ctx.character("portrait_rig", id, { x: 100, y: 260, scale: 0.6, parent: hold }); ctx.m.reveal(P, ctx.start + 0.1);
  if (Loom.rig.defs.extra) { const X = ctx.character("crowd_edge", "extra", { x: 1900, y: 1000, scale: 1 }); ctx.m.reveal(X, ctx.start + 0.1); }
} });
"""


def primitive_runtime_figure_cropped_warns():
    """figure crop: a character whose head is above the station top, and one whose side leaves the station, warn
    figure_cropped; one standing on the floor inside the frame does not (control); figures are still recorded for the
    scale check"""
    if not _browser():
        return _SKIP
    out = _run(_lesson(_FIG, [{"kind": "bespoke"}], _ONE, 1),
               "function () { return { rigs: Object.keys(Loom.rig.defs).length, figures: (Loom.report.figures || []).length }; }", [1.0])
    v = out["samples"][0]["v"]
    assert v["rigs"] > 0, "control: no rig is defined, nothing was placed"
    assert v["figures"] >= 4, f"the scale check's figure records are gone: {v}"
    ws = [w for w in out["report"]["warnings"] if w["code"] == "figure_cropped"]
    named = sorted(m for w in ws for m in ("high", "side", "grounded", "portrait_rig", "crowd_edge") if f'"{m}"' in w["msg"])
    assert named == ["high", "side"], f"expected figure_cropped for high and side only (not the clipped portrait, the extra or the grounded one), got {[w['msg'] for w in ws]}"
    return f"figure_cropped on the high and the side figure only; {v['figures']} figures recorded"


def primitive_runtime_thrown_scene_card_sits_in_the_frame():
    """a thrown scene's fallback card (its own narration) is drawn inside the frame even when the beat has a shot.focus:
    laid out across the station's safe area it was cropped by the beat's own zoom (openai-balanced fork b02, 2026-10-07:
    29 % outside the frame, its words cut); a beat without a focus keeps the card where it was (control)"""
    if not _browser():
        return _SKIP
    js = 'Loom.scene("b1", { build(ctx) { const gone = null; return gone.x; } });\nLoom.scene("b2", { build(ctx) { const gone = null; return gone.x; } });\n'
    words = {"b1": "Imagine that information was available to your colleague but you booked a review without it",
             "b2": "Then you discovered the gap and moved the review to a later day"}
    probe = ('function () { const out = []; for (const e of document.querySelectorAll(\'[data-name="scene_error_fallback"]\')) {'
             ' const r = e.getBoundingClientRect(); if (r.width > 0 && getComputedStyle(e).display !== "none") out.push([r.left, r.top, r.right, r.bottom].map(Math.round)); }'
             ' return out; }')
    out = _run(_lesson(js, [{"kind": "bespoke", "shot": {"focus": [480, 280, 1100, 640]}}, {"kind": "bespoke", "join_in": {"type": "cut"}}],
                       _ONE, 2, words=words), probe, [2.5, 6.5])
    a, b = out["samples"][0]["v"], out["samples"][1]["v"]
    assert len(a) == 1 and len(b) == 1, (a, b)
    inside = lambda r: r[0] >= -1 and r[1] >= -1 and r[2] <= 1921 and r[3] <= 1081   # noqa: E731
    assert inside(a[0]), f"the focused beat's fallback card leaves the frame: {a[0]}"
    assert inside(b[0]), f"control: the unfocused beat's card: {b[0]}"
    return f"focused beat card at {a[0]}; unfocused at {b[0]}"


_TRAVEL = r"""
Loom.scene("b1", { build(ctx) {
  const crowd = ctx.crowd("extras", { x: 300, y: 1000, w: 900, count: 3, rows: 1, scale: 0.5 });   // an ARRAY of people
  ctx.m.travel(crowd.E || crowd, ctx.start + 1.0, { x: -1300, y: 1000 });                          // as claude b01 did
  ctx.m.travel(null, ctx.start + 1.0, { x: 0, y: 0 });
  const A = ctx.el("after", { x: 1300, y: 200, w: 300, h: 200, kind: "card" });                     // still built
  ctx.kit.rect(A.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.3);
} });
"""


def primitive_runtime_travel_names_a_wrong_target_at_build():
    """m.travel given what is not an element (the array ctx.crowd returns, or null) is a `motion_target` error at build
    that names the beat and the cause, and the rest of the scene still builds; it used to throw inside a frame callback
    ("Cannot read properties of undefined (reading 'setAttribute')", tween_threw, the callback switched off) (claude
    fork b01, 2026-10-07)"""
    if not _browser():
        return _SKIP
    out = _run(_lesson(_TRAVEL, [{"kind": "bespoke"}], _ONE, 1),
               "function () { return !!document.querySelector('.lm-el[data-name=\"after\"]'); }", [3.0])
    R = out["report"]
    codes = [(e["code"], e["beat"]) for e in R["errors"]]
    assert ("tween_threw", "b1") not in codes and ("scene_threw", "b1") not in codes, f"a wrong travel target still throws: {R['errors']}"
    mt = [e for e in R["errors"] if e["code"] == "motion_target"]
    assert len(mt) == 2 and all("b1" in e["msg"] for e in mt) and any("array" in e["msg"] for e in mt), mt
    assert out["samples"][0]["v"], "the scene stopped building at the bad travel"
    return "; ".join(e["msg"][:90] for e in mt)


_UNDER = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("note", { x: 300, y: 380, w: 900, h: 200, kind: "card" });
  ctx.kit.text(A.inner, "Who owns each step", { role: "title", x: 0, y: 0, w: 900, h: 200 }); ctx.m.reveal(A, ctx.start + 0.3);
} });
"""


def primitive_runtime_words_under_a_backplate_are_marked_as_layering():
    """the words of a beat covered by a later template's backplate (veiled 0.94 and blurred) carry
    data-layout-allow-overlap while they are covered, so the HyperFrames layout audit does not report the template's
    words "overlapping" a page it cannot read (quick-question-cost b05 over b04's kept page: 3 new content_overlap
    errors once the page's lines stayed with it, 2026-10-07); in their own beat they carry no mark (control: a real
    overlap there is still reported)"""
    if not _browser():
        return _SKIP
    probe = ("function () { const g = document.querySelector('.lm-scene[data-beat=\"b1\"]');"
             " const t = g ? Array.from(g.querySelectorAll('text, tspan')) : [];"
             " return { texts: t.length, marked: t.filter((e) => e.hasAttribute('data-layout-allow-overlap')).length }; }")
    out = _run(_lesson(_UNDER, [{"kind": "bespoke"}, {"kind": "template", "template": "t_words", "keep": ["note"]}], _ONE, 2), probe, [2.0, 6.0, 2.5])
    own, covered, again = (s["v"] for s in out["samples"])
    assert own["texts"] > 0 and own["marked"] == 0, f"control: b1's words in their own beat must not be waived: {own}"
    assert covered["texts"] > 0 and covered["marked"] == covered["texts"], f"b1's words under b2's backplate are not marked: {covered}"
    assert again == own, f"seeking back into b1 must clear the mark (a pure function of t): {again}"
    return f"own beat {own}; under the backplate {covered}"


def primitive_runtime_a_kept_template_part_is_veiled_under_the_next_template():
    """a template that keeps something a template drew gets the backplate (the kept part veiled 0.94 and blurred),
    also when that template was itself backplated: openai fork b10 kept b08's dark page card through b09 and drew its
    compare panels on the bare card (b10, b11, b12, b49, 2026-10-08); a template that keeps nothing after a template
    still gets no backplate (control)"""
    if not _browser():
        return _SKIP
    js = _PICTURE % ("b1", "hill", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "template", "template": "t_words"},
              {"kind": "template", "template": "t_words", "keep": ["words_b2"]},
              {"kind": "template", "template": "t_words"}]
    probe = r"""function () { const o = {};
      for (const g of document.querySelectorAll(".lm-scene")) { const r = g.querySelector('.lm-el[data-name="template_backplate"] rect');
        o[g.getAttribute("data-beat")] = r ? +r.getAttribute("opacity") : null; } return o; }"""
    out = _run(_lesson(js, scenes, _ONE, 4), probe, [1.0])
    v = out["samples"][0]["v"]
    assert v.get("b2") is not None, f"control: a template over a picture is backplated: {v}"
    assert v.get("b3") == 0.94, f"the kept card of a backplated template is unveiled under b3: {v}"
    assert v.get("b4") is None, f"control: a template that keeps nothing after a template gets no backplate: {v}"
    return f"veils {v}"


_JOIN = r"""
Loom.scene("b1", { build(ctx) { const A = ctx.el("A", { x: 300, y: 300, w: 600, h: 300, kind: "card" });
  ctx.kit.rect(A.inner, 0, 0, 600, 300, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.1); } });
Loom.scene("b2", { build(ctx) { const B = ctx.el("B", { x: 1000, y: 300, w: 600, h: 300, kind: "card" });
  ctx.kit.rect(B.inner, 0, 0, 600, 300, { fill: "accent2", r: 8 }); ctx.m.reveal(B, ctx.speechStart + 0.6); } });
Loom.scene("b3", { build(ctx) { const C = ctx.el("C", { x: 300, y: 300, w: 600, h: 300, kind: "card" });
  ctx.kit.rect(C.inner, 0, 0, 600, 300, { fill: "accent", r: 8 }); ctx.m.reveal(C, ctx.speechStart + 0.6); } });
"""
_VIS = r"""function () { const vis = (n) => { const e = document.querySelector('.lm-el[data-name="' + n + '"]'); if (!e) return 0;
    let o = 1; for (const x of [e, e.querySelector('.lm-mv'), e.querySelector('.lm-life'), e.querySelector('.lm-in')]) { if (!x) continue;
      const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return +o.toFixed(2); };
  return { A: vis("A"), B: vis("B"), C: vis("C") }; }"""


def primitive_runtime_a_continue_join_never_leaves_a_speaking_frame_empty():
    """on a continue join the outgoing beat's elements leave as the incoming beat's first element arrives (a short
    crossfade), so the frame is never empty while the voice speaks: the openai fork showed 3.4 % of its speaking time
    as blank frames between template beats (2026-10-08). A cut is still a clean break, made when the new picture starts
    (D-190: a cut at the boundary to a beat that draws nothing for 0.6 s was an empty frame while the voice spoke, which
    Kshitij named the worst of the 2026-10-16 films): the old element holds to the cut and is gone on it"""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "join_in": {"type": "continue"}}, {"kind": "bespoke", "join_in": {"type": "cut"}}]
    # b2 speaks from 4.6 s; its first element arrives at 5.2 s. b3 (a cut) speaks from 8.6 s, arrives at 9.2 s
    out = _run(_lesson(_JOIN, scenes, _ONE, 3), _VIS, [4.7, 4.9, 5.1, 5.6, 8.7, 9.6])
    S_ = {s["t"]: s["v"] for s in out["samples"]}
    blank = [t for t in (4.7, 4.9, 5.1, 5.6) if S_[t]["A"] + S_[t]["B"] < 0.3]
    assert not blank, f"speaking frames left empty on the continue join at {blank}: {S_}"
    assert S_[5.6]["A"] == 0 and S_[5.6]["B"] > 0.9, f"the outgoing element must be gone once the new one is in: {S_[5.6]}"
    assert S_[8.7]["B"] > 0.9, f"a cut waits for the new picture (b2's element holds until 9.2 s): {S_[8.7]}"
    assert S_[9.6]["B"] == 0, f"control: the cut is a clean break once made (b2's element gone): {S_[9.6]}"
    return f"continue join frames {[(t, S_[t]) for t in (4.7, 5.1, 5.6)]}"


_JOIN_HELD = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("A", { x: 100, y: 300, w: 500, h: 300, kind: "card" }); ctx.kit.rect(A.inner, 0, 0, 500, 300, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.1);
  const C = ctx.el("C", { x: 700, y: 300, w: 500, h: 300, kind: "card" }); ctx.kit.rect(C.inner, 0, 0, 500, 300, { fill: "accent3", r: 8 }); ctx.m.reveal(C, ctx.start + 0.1); } });
Loom.scene("b2", { build(ctx) { ctx.held("A"); const B = ctx.el("B", { x: 1300, y: 300, w: 500, h: 300, kind: "card" });
  ctx.kit.rect(B.inner, 0, 0, 500, 300, { fill: "accent2", r: 8 }); ctx.m.reveal(B, ctx.speechStart + 1.6); } });
"""


def primitive_runtime_a_continue_join_that_holds_something_does_not_wait():
    """the B2 wait is for a frame that would be empty: when the incoming beat HOLDS an element (here A), the frame is
    never empty, so the outgoing beat's other elements (C) leave at the join as before instead of waiting for the new
    beat's first own element (the claude fork's b01 crowd and chair stayed up to 4 s into b02, post-style proof)"""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "join_in": {"type": "continue"}}]
    # b2 starts at 4.0 s and speaks from 4.6 s; its own B arrives at 6.2 s
    out = _run(_lesson(_JOIN_HELD, scenes, _ONE, 2), _VIS, [4.5, 5.0, 6.6])
    S_ = {s["t"]: s["v"] for s in out["samples"]}
    assert S_[4.5]["A"] > 0.9 and S_[5.0]["A"] > 0.9, f"A is held: {S_}"
    assert S_[5.0]["C"] < 0.05, f"C must have left at the join, not wait for B (6.2 s): {S_}"
    assert S_[6.6]["B"] > 0.9, S_
    return f"held A stays, C gone by 5.0 s, B in at 6.6 s: {S_}"


_COVER_KINDS = ["iris", "wipe", "dip", "fade", "torn", "page", "scroll", "motif", "handoff", "fill"]


def _cover_js(n):
    js = ""
    for k in range(1, n + 1):
        # each beat draws X<k>: a card with words and NO entrance (it shows from its life window's start)
        js += ('Loom.scene("b%d", { build(ctx) { const X = ctx.el("X%d", { x: 360, y: 300, w: 1200, h: 400, kind: "card" });'
               ' ctx.kit.rect(X.inner, 0, 0, 1200, 400, { fill: "accent", r: 8 }); ctx.kit.text(X.inner, "beat %d", { role: "title", x: 40, y: 40, w: 1100, h: 300 }); } });\n') % (k, k, k)
    return js


def primitive_runtime_every_cover_join_hides_the_incoming_beat_until_its_middle():
    """every join kind with a screen cover (iris, wipe, dip, fade and the material joins) keeps the incoming beat's
    elements switched off until the cover's middle and draws the cover above the world, so no incoming element paints
    over a closing cover (B3 of the style-system prompt, 2026-10-08). Run on the pre-session runtime, an incoming
    element with no entrance showed from t = 0"""
    if not _browser():
        return _SKIP
    n = len(_COVER_KINDS) + 1
    scenes = [{"kind": "bespoke"}] + [{"kind": "bespoke", "join_in": dict({"type": k}, **({"shape": "circle"} if k in ("motif", "fill") else {}),
                                                                          **({"to": "surface"} if k == "handoff" else {}))} for k in _COVER_KINDS]
    times = []
    for k in range(2, n + 1):
        s = 4.0 * (k - 1)
        times += [round(s - 0.12, 2), round(s + 0.2, 2)]
    probe = (r"""function () { const vis = (nm) => { const e = document.querySelector('.lm-el[data-name="' + nm + '"]'); if (!e) return -1;
        for (const x of [e, e.querySelector('.lm-mv'), e.querySelector('.lm-life'), e.querySelector('.lm-in')]) { if (!x) continue;
          const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return 0; } return 1; };
      const cv = document.getElementById('lm-join-cover'), cam = document.getElementById('lm-cam');
      const above = !!(cv && cam && (cam.compareDocumentPosition(cv) & Node.DOCUMENT_POSITION_FOLLOWING));
      const o = { above, cover: cv ? getComputedStyle(cv).visibility : 'none', joins: Loom.report.joins || [] };
      for (let k = 1; k <= %d; k++) o['X' + k] = vis('X' + k); return o; }""" % n)
    out = _run(_lesson(_cover_js(n), scenes, _ONE, n), probe, times)
    joins = {j["beat"]: j for j in out["samples"][0]["v"]["joins"]}
    bad, checked = [], 0
    for idx, kind in enumerate(_COVER_KINDS):
        b = f"b{idx + 2}"
        j = joins.get(b)
        if not j:
            bad.append(f"{kind}: no cover was planned for {b}")
            continue
        mid = (j["t0"] + j["t1"]) / 2
        for smp in out["samples"]:
            t, v = smp["t"], smp["v"]
            if j["t0"] < t < mid - 0.02:
                checked += 1
                if v[f"X{idx + 2}"] != 0 or not v["above"]:
                    bad.append(f"{kind}: at {t}s (cover {j['t0']:.2f}..{mid:.2f}) X{idx + 2} visible={v[f'X{idx + 2}']} cover above world={v['above']}")
            elif mid + 0.05 < t < j["t1"] + 1:
                checked += 1
                if v[f"X{idx + 2}"] != 1:
                    bad.append(f"{kind}: at {t}s after the middle X{idx + 2} is not shown")
    assert checked >= len(_COVER_KINDS), f"too few samples fell in the cover windows ({checked}): the measure saw nothing"
    assert not bad, bad
    return f"{len(_COVER_KINDS)} cover kinds, {checked} samples: incoming hidden before the middle, cover above the world"


_HELD_JS = r"""
Loom.scene("b1", { build(ctx) {
  for (const [nm, x] of [["Card", 200], ["Priya", 900]]) {
    const A = ctx.el(nm, { x, y: 300, w: 500, h: 300, kind: "card" });
    ctx.kit.rect(A.inner, 0, 0, 500, 300, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.2); }
} });
Loom.scene("b2", { build(ctx) { ctx.held("Card"); } });
Loom.scene("b3", { build(ctx) { ctx.held("Card"); } });
"""


def primitive_runtime_held_elements_record_their_holders():
    """each element's record names the beats that held it (heldBy): b2's ctx.held("Card") and b3's again, and b2's
    storyboard keep "priya" for the element drawn as "Priya" (one case-insensitive match). The film audit reads it:
    without it, a scene's own ctx.held read as "lingering" (B5, 2026-10-08)"""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "keep": ["priya"]}, {"kind": "bespoke"}]
    probe = r"""function () { const o = {}; for (const e of Loom.report.elements) if (e.beat === 'b1') o[e.name] = e.heldBy === undefined ? 'no record' : e.heldBy; return o; }"""
    out = _run(_lesson(_HELD_JS, scenes, _ONE, 3), probe, [1.0])
    v = out["samples"][0]["v"]
    assert v == {"Card": ["b2", "b3"], "Priya": ["b2"]}, v
    return f"heldBy {v}"


def primitive_runtime_the_last_scene_leaves_with_the_frame():
    """R-48: in the final scene every element receded on its own from duration - 0.9, so feedback-relay-v3's room and
    people were gone while its cards still floated on bare paper and the last label drifted out alone. Now the final
    scene holds and the camera's outro fade takes the whole frame out together. Half a second before the end each
    element is at its full size and its own opacity is 1, while the camera is already fading. Control: the camera fade
    itself runs (its opacity is below 1)."""
    if not _browser():
        return _SKIP
    js = (_PICTURE % ("b2", "A", "scenery")).replace("x: 300, y: 200", "x: 200, y: 200") + \
         'Loom.scene("b1", { build(ctx) { const B = ctx.el("B", { x: 200, y: 200, w: 300, h: 200, kind: "card" }); ctx.kit.rect(B.inner, 0, 0, 300, 200, { fill: "accent", r: 8 }); ctx.m.reveal(B, ctx.start + 0.1); } });\n'
    js = js.replace('Loom.scene("b2", { build(ctx) {', 'Loom.scene("b2", { build(ctx) { const C = ctx.el("C", { x: 1100, y: 600, w: 300, h: 120, kind: "card" }); ctx.kit.rect(C.inner, 0, 0, 300, 120, { fill: "ink", r: 8 }); ctx.m.reveal(C, ctx.start + 0.2);')
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "join_in": {"type": "cut"}}]
    probe = r"""function (t) {
      const cam = document.getElementById("lm-cam"), out = { cam: +getComputedStyle(cam).opacity };
      for (const n of ["A", "C"]) {
        const el = document.querySelector(`.lm-el[data-name="${n}"]`);
        let o = 1; for (let x = el; x && x !== cam; x = x.parentElement) o *= +getComputedStyle(x).opacity;
        out[n] = { o: +o.toFixed(3), w: Math.round(el.getBoundingClientRect().width) };
      }
      return out; }"""
    out = _run(_lesson(js, scenes, _ONE, 2), probe, [7.0, 7.5])
    early, late = out["samples"][0]["v"], out["samples"][1]["v"]
    assert late["cam"] < 1.0, f"control: the outro fade should be running at 7.5 s: {late}"
    for n in ("A", "C"):
        assert late[n]["o"] == 1.0 and abs(late[n]["w"] - early[n]["w"]) <= 1, f"{n} left on its own before the frame did: {early[n]} -> {late[n]}"
    return f"at 7.5 s (end 8.0) the camera is at {late['cam']}, A and C whole: {late['A']}, {late['C']}"


def primitive_runtime_joins_never_hold_a_blank_frame():
    """R-51 (feedback-relay-v3, L-407): a dip or fade held the frame fully covered from 0.42 to 0.58 of the join, 0.3 to
    0.5 s of bare paper or black; and a template after a cut put its first element on screen only at the lead time
    (speech start + 0.6 s), so a cut landed on bare paper for about 0.9 s. Now a dip or fade is fully covered only at the
    middle (where the camera jumps; the frames either side are already 99 % covered) and a template after a cut or a cover
    shows its first element as the frame appears. Controls: the middle is still fully covered; after a camera join and
    without a join the lead time stands."""
    if not _browser():
        return _SKIP
    js = _PICTURE % ("b1", "A", "scenery")
    probe = r"""function () {
      const W = Loom.world, H = Loom.th, pace = (Loom.style.pack && Loom.style.pack.pace) || {};
      const op = (k, p) => +W.coverAt(k, p, {}, { field: "#ffffff" }).opacity.toFixed(4);
      const ctx = (j, jw) => ({ start: 10, speechStart: 10.3, def: j ? { join_in: { type: j }, join_window: jw } : {} });
      return { dip: [0.40, 0.45, 0.48, 0.5, 0.52, 0.6].map((p) => op("dip", p)), fade: [0.45, 0.5].map((p) => op("fade", p)),
               lead_s: pace.lead_s == null ? 0.6 : pace.lead_s,
               cut: H.leadAt(ctx("cut", [10, 10])), dip_lead: H.leadAt(ctx("dip", [9.5, 10.5])),
               camera: H.leadAt(ctx("camera", [9.5, 10.45])), none: H.leadAt(ctx(null)) }; }"""
    out = _run(_lesson(js, [{"kind": "bespoke"}], _ONE, 1, templates=True), probe, [1.0])
    v = out["samples"][0]["v"]
    lead = round(10.3 + v["lead_s"], 3)
    assert v["dip"][3] == 1.0 and v["fade"][1] == 1.0, f"control: the middle must stay fully covered: {v}"
    assert v["dip"][2] < 0.97 and v["dip"][4] < 0.97 and v["fade"][0] < 0.97, f"a dip or fade still holds a covered frame off the middle: {v}"
    assert abs(v["cut"] - 10.1) < 1e-6 and abs(v["dip_lead"] - 10.1) < 1e-6, f"after a cut or a cover the first element must be there at once: {v}"
    assert abs(v["camera"] - lead) < 1e-6 and abs(v["none"] - lead) < 1e-6, f"control: a camera join and no join keep the lead time {lead}: {v}"
    return f"dip opacity at 0.40/0.45/0.48/0.50: {v['dip'][:4]}; first element after a cut {v['cut']} s (lead time {lead} s)"
