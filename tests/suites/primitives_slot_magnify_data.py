"""Staging tests for the D-114 primitives built by prim_b: Loom.slot (runtime/slot.js), Loom.magnify
(runtime/magnify.js) and the data-as-objects builders appended to runtime/data.js (stamp, pile, flood).

Each test is a plain function `primitive_<name>_<claim>()` that returns a short summary or raises AssertionError.
They load the REAL lab page (loom.lab.page: the runtime a lesson uses) in headless Chrome through a small
puppeteer-core harness, seek the timeline and read the DOM and the full Loom.report (the lab's report.json drops
report.slots and report.data, so it cannot be used for these). Without a browser (tests/browser_support.py) they skip.
Every test carries its own negative control, so a zero or an always-true measurement cannot pass silently.
"""
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
LAB_DIR = ENGINE / "scenes_examples" / "lab"

_NODE = r"""
const { createRequire } = require("module");
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
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 60000 });
    const res = await p.evaluate(`(function () {
      const probe = %(probe)s;
      const times = %(times)s;
      const samples = times.map((t) => { Loom.tl.seek(t, false); return { t, v: probe(t) }; });
      const R = Loom.report;
      return { samples, report: { errors: R.errors, warnings: R.warnings, slots: R.slots || [], data: R.data || [],
               magnify: R.magnify || [], texts: R.texts.map((x) => x.text) } };
    })()`);
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _probe(scene: str, style: str, probe_js: str, times: list[float]) -> dict:
    """Build the lab page for `scene` in `style`, seek to each time in order, run probe_js(t) there."""
    from loom import lab
    tmp, _meta, _st, _t = lab.page(scene, style, times=[0.0])
    try:
        js = _NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                      "probe": probe_js, "times": json.dumps(times)}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=150, cwd=str(ENGINE), env=dict(os.environ))
        assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _tmp_scene(name: str, body: str, dur: float = 8.0) -> Path:
    f = LAB_DIR / f"{name}.js"
    f.write_text(f'// @lab {{"title": "t", "styles": ["corporate-clean"], "dur": {dur}, "times": [1.0]}}\n'
                 f'Loom.scene("{name}", {{ build(ctx) {{\n{body}\n}} }});\n', encoding="utf-8")
    return f


# which slot contents are VISIBLE at the seek time: opacity along the chain, the scale a flip or stamp collapses,
# and the width of any wipe clip (relabel); returns {slotName: [content indices]}
_SLOT_VIS = r"""function (t) {
  const out = {};
  document.querySelectorAll("g.lm-slot-item").forEach((cg) => {
    const ig = cg.firstElementChild, name = cg.getAttribute("data-slot");
    let a = 1;
    for (let n = ig; n && n.tagName !== "svg"; n = n.parentNode) { const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden") a = 0; a *= parseFloat(cs.opacity || "1"); }
    const m = ig.getCTM(), m0 = cg.parentNode.getCTM();
    const sx = Math.hypot(m.a, m.b) / Math.hypot(m0.a, m0.b), sy = Math.hypot(m.c, m.d) / Math.hypot(m0.c, m0.d);
    let cw = Infinity;
    for (const n of [cg, ig]) { const cp = n.getAttribute("clip-path"); if (cp) { const r = document.getElementById(cp.match(/#([^)]+)/)[1]).firstElementChild; cw = Math.min(cw, +r.getAttribute("width")); } }
    if (a > 0.02 && sx > 0.02 && sy > 0.02 && cw > 0.5) (out[name] = out[name] || []).push(+cg.getAttribute("data-slot-i"));
  });
  return out;
}"""


def primitive_slot_never_shows_two_contents_at_once():
    """lab_slot sampled every 0.04 s in both a pack with overshoot (story-cartoon) and one without: no slot ever has
    two contents visible, every content of every slot is seen at some time (so the probe is not blind), and the
    report intervals agree (each content's entrance starts after the previous one's exit has ended)."""
    if not _browser():
        return "skipped (no browser here)"
    times = [round(0.04 * i, 2) for i in range(int(13.0 / 0.04) + 1)]
    seen_total = 0
    for style in ("story-cartoon", "corporate-clean"):
        res = _probe("lab_slot", style, _SLOT_VIS, times)
        assert not res["report"]["errors"], res["report"]["errors"][:3]
        slots = {s["name"]: s for s in res["report"]["slots"]}
        assert set(slots) == {"doc_state", "count_badge", "held_object"}, list(slots)
        seen = {k: set() for k in slots}
        doubles = []
        for s in res["samples"]:
            for name, idx in s["v"].items():
                seen[name].update(idx)
                if len(idx) > 1:
                    doubles.append((s["t"], name, idx))
        assert not doubles, f"{style}: two contents at once: {doubles[:5]}"
        for name, rec in slots.items():
            n = len(rec["contents"])
            assert n >= 4 and seen[name] == set(range(n)), f"{style}: {name} showed {sorted(seen[name])} of {n} (the probe is blind?)"
            c = rec["contents"]
            for a, b in zip(c, c[1:]):
                assert a["t_out1"] is not None and b["t_in0"] >= a["t_out1"] - 1e-6, f"{style}: {name} {a} / {b}"
            seen_total += n
    return f"no double exposure over {len(times)} seeks x 2 packs; all {seen_total} contents seen; intervals ordered"


def primitive_slot_warns_too_fast_and_only_then():
    """A slot whose contents are each readable for about 0.3 s warns slot_too_fast for each one cut short; a control slot with
    1.6 s gaps on the same page does not warn at all."""
    if not _browser():
        return "skipped (no browser here)"
    f = _tmp_scene("lab__tmp_primb_fast", """
    const fast = Loom.slot(ctx, "fast", { x: 100, y: 100, w: 600, h: 200, role: "title" });
    ["One", "Two", "Three", "Four"].forEach((s, i) => fast.show({ text: s }, 0.5 + i * 1.1));   // each readable ~0.3 s
    const slow = Loom.slot(ctx, "slow", { x: 100, y: 500, w: 600, h: 200, role: "title" });
    ["One", "Two", "Three", "Four"].forEach((s, i) => slow.show({ text: s }, 0.5 + i * 1.6));
    """)
    try:
        res = _probe(f.stem, "corporate-clean", "function (t) { return null; }", [7.9])
    finally:
        f.unlink()
    w = [x for x in res["report"]["warnings"] if x.get("code") == "slot_too_fast"]
    fast = [x for x in w if x.get("slot") == "fast"]
    slow = [x for x in w if x.get("slot") == "slow"]
    assert len(fast) == 3, f"expected 3 contents cut short in the fast slot, got {len(fast)}: {fast}"
    assert all(0.2 < x["shown"] < 0.45 and x["floor"] == 0.8 for x in fast), fast
    assert not [x for x in res["report"]["warnings"] if x.get("code") == "slot_overlap"], "the fast run should be short holds, not interrupted entrances"
    assert not slow, f"the control slot warned: {slow}"
    return f"fast slot: {len(fast)} slot_too_fast (shown {', '.join(str(x['shown']) for x in fast)} s); control slot: none"


def primitive_slot_is_deterministic_in_any_seek_order():
    """The same times seeked forward and in a scrambled order give the same visible contents and accent colours."""
    if not _browser():
        return "skipped (no browser here)"
    fwd = [round(0.5 + 0.37 * i, 2) for i in range(32)]
    scr = sorted(fwd, key=lambda t: (int(t * 100) * 7919) % 101)
    probe = r"""function (t) { const v = (%s)(t); const acc = Array.from(document.querySelectorAll("g.lm-slot-frame rect")).map((r) => r.getAttribute("fill")); return JSON.stringify([v, acc]); }""" % _SLOT_VIS
    a = {s["t"]: s["v"] for s in _probe("lab_slot", "corporate-clean", probe, fwd)["samples"]}
    b = {s["t"]: s["v"] for s in _probe("lab_slot", "corporate-clean", probe, scr)["samples"]}
    diff = [t for t in fwd if a[t] != b[t]]
    assert scr != fwd and not diff, f"seek order changed the picture at {diff[:5]}"
    assert len({a[t] for t in fwd}) > 5, "every sample looked the same: the probe sees nothing"
    return f"{len(fwd)} times, forward and scrambled: identical ({len({a[t] for t in fwd})} distinct states)"


def primitive_stamp_lights_exactly_round_n_times_share():
    """stamp draws exactly round(n * share) stamped units (DOM count and report), all fully on at the end and none
    before t; a share that is not a whole number of units warns stamp_rounded; unitGrid on the same page still
    records what it always did."""
    if not _browser():
        return "skipped (no browser here)"
    cases = [(100, 0.37, 10), (40, 0.25, 8), (30, 0.5, 6), (12, 0.3, 4)]   # the last is 3.6 units: rounded, warns
    body = "\n".join(f'Loom.data.stamp(ctx, "s{i}", {{ x: {80 + i * 440}, y: 100, w: 400, h: 400, n: {n}, cols: {c}, share: {sh}, unit: "dot", t: 1.0 }});'
                     for i, (n, sh, c) in enumerate(cases))
    body += '\nLoom.data.unitGrid(ctx, "ug", { x: 80, y: 600, w: 400, h: 200, n: 20, cols: 10, lit: 7, unit: "dot", t: 0.5 });'
    f = _tmp_scene("lab__tmp_primb_stamp", body)
    probe = r"""function (t) { const o = {}; document.querySelectorAll("g.lm-el[data-name^='s']").forEach((el) => {
      const st = Array.from(el.querySelectorAll("[data-loom-stamp]")); o[el.getAttribute("data-name")] = [st.length, st.filter((g) => parseFloat(getComputedStyle(g).opacity) > 0.98).length]; }); return o; }"""
    try:
        res = _probe(f.stem, "corporate-clean", probe, [0.9, 7.9])
    finally:
        f.unlink()
    assert not res["report"]["errors"], res["report"]["errors"][:3]
    before, after = res["samples"][0]["v"], res["samples"][1]["v"]
    recs = {d["name"]: d for d in res["report"]["data"]}
    for i, (n, sh, c) in enumerate(cases):
        k = round(n * sh)
        assert after[f"s{i}"] == [k, k], f"s{i}: {after[f's{i}']} != {k} stamped and on"
        assert before[f"s{i}"][1] == 0, f"s{i} stamped before t: {before[f's{i}']}"
        assert recs[f"s{i}"]["builder"] == "stamp" and recs[f"s{i}"]["values"]["stamped"] == k and recs[f"s{i}"]["values"]["n"] == n
    rounded = [w for w in res["report"]["warnings"] if w.get("code") == "stamp_rounded"]
    assert [w["name"] for w in rounded] == ["s3"], rounded
    assert recs["ug"]["builder"] == "unitGrid" and recs["ug"]["values"] == {"n": 20, "lit": 7, "unit": "dot"}, recs["ug"]
    return "stamped " + ", ".join(f"{round(n * sh)}/{n}" for n, sh, _ in cases) + "; none before t; 3.6 units warned stamp_rounded; unitGrid unchanged"


def primitive_data_objects_record_their_values():
    """lab_data_objects: stamp, pile and flood each record their values in Loom.report.data, the DOM agrees with
    them (stamped and flooded glyph counts), the pile's counter ends on the recorded text and rises with the pile,
    and the flood's positions are seeded (the same in two packs)."""
    if not _browser():
        return "skipped (no browser here)"
    probe = r"""function (t) {
      const q = (s) => document.querySelectorAll(s);
      const pile = document.querySelector("g.lm-el[data-name='total']");
      const txt = pile.querySelector("text"), tg = txt.parentNode;
      const pos = Array.from(q("[data-loom-flood]")).map((g) => g.parentNode.getAttribute("transform")).join("|");
      return { stamped: q("[data-loom-stamp]").length, flood: q("[data-loom-flood]").length, piled: pile.querySelectorAll("[data-loom-pile]").length,
               counter: txt.textContent.trim(), counterY: tg.getAttribute("transform"), pos };
    }"""
    out = {}
    for style in ("story-cartoon", "engineering"):
        res = _probe("lab_data_objects", style, probe, [1.0, 2.0, 5.9])
        assert not res["report"]["errors"], res["report"]["errors"][:3]
        recs = {d["builder"]: d for d in res["report"]["data"] if d["builder"] in ("stamp", "pile", "flood")}
        assert set(recs) == {"stamp", "pile", "flood"}, [d["builder"] for d in res["report"]["data"]]
        s, p, fl = recs["stamp"]["values"], recs["pile"]["values"], recs["flood"]["values"]
        assert (s["n"], s["share"], s["stamped"]) == (100, 0.37, 37), s
        assert (p["count"], p["to"], p["text"]) == (36, 1200, "$1,200"), p
        assert fl["filled"] == round(fl["capacity"] * fl["share"]) and fl["capacity"] == 100 and fl["filled"] == 60, fl
        early, mid, end = (x["v"] for x in res["samples"])
        assert end["stamped"] == 37 and end["flood"] == 60 and end["piled"] == 36, end
        assert end["counter"] == "$1,200" and early["counter"] != "$1,200", (early["counter"], end["counter"])
        ys = [float(x["counterY"].split()[-1].rstrip(")")) for x in (early, mid, end)]
        assert ys[0] > ys[1] > ys[2], f"the counter does not rise with the pile: {ys}"
        out[style] = end["pos"]
    assert out["story-cartoon"] == out["engineering"] and out["engineering"], "flood positions differ between packs (not seeded)"
    return "stamp 37/100, pile 36 units to $1,200 with the counter rising, flood 60/100 seeded identically in 2 packs"


def primitive_magnify_lens_is_a_live_uncounted_copy():
    """lab_magnify: the lens holds a <use> of the machine marked data-loom-copy, scaled by the recorded zoom;
    the copy adds no entries to Loom.report.texts (only the scene's own two labels are there); the lens is closed
    before t and after its exit, open in between; the cutaway records its window and opens and closes."""
    if not _browser():
        return "skipped (no browser here)"
    probe = r"""function (t) {
      const use = document.querySelector("use[data-loom-copy='1']");
      const ref = use && document.getElementById((use.getAttribute("href") || "").slice(1));
      const iris = document.querySelector(".lm-lens").getAttribute("clip-path").match(/#([^)]+)/)[1];
      const r = +document.getElementById(iris).firstElementChild.getAttribute("r");
      const z = use ? use.parentNode.getAttribute("transform") : "";
      const cut = document.querySelector("g.lm-el[data-name='tank_inside'] clipPath > *").getAttribute("transform") || "";
      return { copies: document.querySelectorAll("use[data-loom-copy]").length, ref: ref ? ref.getAttribute("data-name") : null, r, z, cut };
    }"""
    res = _probe("lab_magnify", "flat-cosmos", probe, [1.0, 4.5, 8.9])
    assert not res["report"]["errors"], res["report"]["errors"][:3]
    pre, mid, post = (x["v"] for x in res["samples"])
    lens = [m for m in res["report"]["magnify"] if m["kind"] == "lens"][0]
    cut = [m for m in res["report"]["magnify"] if m["kind"] == "cutaway"][0]
    assert mid["copies"] == 1 and mid["ref"] == "machine", mid
    assert f"scale({lens['zoom']}" in mid["z"] or abs(float(mid["z"].split("scale(")[1].split(")")[0]) - lens["zoom"]) < 1e-3, (mid["z"], lens)
    assert pre["r"] == 0 and mid["r"] > lens["at"]["r"] and post["r"] == 0, (pre["r"], mid["r"], post["r"])
    assert sorted(res["report"]["texts"]) == ["MACHINE", "TANK, CUT AWAY"], res["report"]["texts"]
    sc = lambda s: float(s.split("scale(")[1].split(")")[0]) if "scale(" in s else None
    assert sc(pre["cut"]) in (None, 0.0001) and abs(sc(mid["cut"]) - 1) < 1e-3 and sc(post["cut"]) <= 0.001, (pre["cut"], mid["cut"], post["cut"])
    assert cut["out"] == 7.6 and lens["out"] == 6.0, (lens, cut)
    return f"one <use> copy of the machine at zoom {lens['zoom']}, report.texts holds only the 2 labels, lens and cutaway closed/open/closed"


# does any part of an undrawn stroke fall on the path? pattern [dash, gap] read from the live DOM, offset as rendered
_UNDRAWN = r"""function (t) {
  const out = [];
  document.querySelectorAll("g.lm-el[data-name^='probe_'] path").forEach((p) => {
    const L = p.getTotalLength();
    const da = (p.getAttribute("stroke-dasharray") || "").split(/[ ,]+/).map(Number);
    const off = parseFloat(getComputedStyle(p).strokeDashoffset || "0");
    const hits = (d, g, o) => { const P = d + g; for (let i = 0; i <= 400; i++) { const s = (L * i) / 400; const q = (((s + o) % P) + P) % P; if (q <= d) return true; } return false; };
    out.push({ name: p.closest("g.lm-el").getAttribute("data-name"), L, da, off,
               lit: hits(da[0], da[1], off),
               // negative control: the old "L L" pattern at the same whole-px offsets GSAP produces
               old_ceil: hits(L, L, Math.ceil(L)), old_floor: hits(L, L, Math.floor(L)) });
  });
  return out;
}"""


def primitive_draw_undrawn_stroke_paints_nothing():
    """m.draw before its time: no dash of a round-capped stroke may sit on the path (L-225, the stray dots on
    mfa-explained were the ends of undrawn leader lines). Negative control: the old "L L" pattern at the whole-px
    offsets GSAP rounds to is lit for the same paths, so the predicate can fail."""
    if not _browser():
        return "skipped (no browser here)"
    f = _tmp_scene("lab_tmp_undrawn", """
    const { kit, m } = ctx;
    [["probe_a", "M 100.3 200 Q 400.7 40.2 777.9 668.1"], ["probe_b", "M 846.1 335.5 L 962.1 316.9"], ["probe_c", "M 874.9 600 Q 826.5 708 778 668"]].forEach(([n, d], i) => {
      const E = ctx.el(n, { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
      const p = kit.path(E.inner, d, { stroke: "accent", sw: [3, 4, 6][i] });
      m.draw(p, 4.0, { dur: 0.6 });
    });""")
    try:
        res = _probe("lab_tmp_undrawn", "corporate-clean", _UNDRAWN, [1.0, 6.0])
    finally:
        f.unlink(missing_ok=True)
    pre, post = (x["v"] for x in res["samples"])
    assert len(pre) == 3, pre
    assert not any(p["lit"] for p in pre), [p for p in pre if p["lit"]]
    assert all(p["old_ceil"] or p["old_floor"] for p in pre), "negative control did not light: the predicate is blind"
    assert all(p["lit"] for p in post), "drawn paths must be lit after the draw"
    return "3 undrawn round-cap paths paint nothing; the old pattern lights all 3; all 3 lit after the draw"


def primitive_magnify_exit_before_landing_is_clamped():
    """An exit scheduled before the lens lands used to be overwritten by the entrance, leaving the lens open for the
    rest of the lesson (L-226). Now it warns magnify_exit_early and the lens is closed later. Control: an exit after
    landing gives no warning and closes on time."""
    if not _browser():
        return "skipped (no browser here)"
    f = _tmp_scene("lab_tmp_lens_early", """
    const { kit } = ctx;
    const M = ctx.el("machine", { x: 100, y: 200, w: 300, h: 300, kind: "object", exit: "recede" });
    kit.rect(M.inner, 0, 0, 300, 300, { fill: "accent", r: 8 });
    Loom.magnify(ctx, "early", { source: M, focus: { x: 250, y: 350, r: 40 }, at: { x: 1100, y: 330, r: 200 }, t: 1.0, out: 1.2 });
    Loom.magnify(ctx, "ontime", { source: M, focus: { x: 200, y: 300, r: 40 }, at: { x: 1500, y: 750, r: 160 }, t: 1.0, out: 4.0 });""")
    probe = r"""function (t) {
      const o = {};
      document.querySelectorAll(".lm-lens").forEach((L) => { const n = L.closest("g.lm-el").getAttribute("data-name");
        o[n] = +document.getElementById(L.getAttribute("clip-path").match(/#([^)]+)/)[1]).firstElementChild.getAttribute("r"); });
      return o;
    }"""
    try:
        res = _probe("lab_tmp_lens_early", "corporate-clean", probe, [2.9, 7.9])
    finally:
        f.unlink(missing_ok=True)
    mid, end = (x["v"] for x in res["samples"])
    warns = [w for w in res["report"]["warnings"] if "magnify_exit_early" in json.dumps(w)]
    assert len(warns) == 1 and "early" in json.dumps(warns[0]), res["report"]["warnings"]
    assert mid["early"] > 0 and mid["ontime"] > 0, mid
    assert end["early"] == 0 and end["ontime"] == 0, end
    return "early exit warned once and the lens closes; the on-time lens closes without a warning"


if __name__ == "__main__":
    fails = 0
    for name, fn in list(globals().items()):
        if name.startswith("primitive_") and callable(fn):
            try:
                print(f"[PASS] {name}: {fn()}")
            except Exception as e:   # noqa: BLE001
                fails += 1
                print(f"[FAIL] {name}: {type(e).__name__}: {str(e)[:600]}")
    sys.exit(1 if fails else 0)


def primitive_a_throwing_frame_callback_cannot_stop_a_render():
    """A scene whose drive throws on every frame (bench claude-balanced b01: a travel on an element with no mover)
    stopped a 14,230-frame render at frame 5,400 (2026-10-07). Now the error is reported once as `tween_threw` and
    that callback is switched off: no page error, and a healthy drive on the same timeline still moves. Negative
    control: the same callback outside the guard throws."""
    if not _browser():
        return "skipped (no browser here)"
    f = _tmp_scene("lab_tmp_throw", """
    const ok = ctx.el("ok", { x: 100, y: 100, w: 200, h: 100, kind: "card" });
    Loom.drive((e) => ok.inner.setAttribute("data-e", e.toFixed(3)), 1.0, 2.0, "linear", { name: "ok" });
    const broken = {};
    Loom.drive((e) => broken.mover.setAttribute("transform", "x"), 1.0, 2.0, "linear", { name: "broken" });
    window.__raw = () => { try { broken.mover.setAttribute("x", "1"); return false; } catch (e) { return true; } };""")
    try:
        res = _probe("lab_tmp_throw", "corporate-clean", """(t) => ({ e: document.querySelector('[data-e]') ? document.querySelector('[data-e]').getAttribute('data-e') : null, raw: window.__raw() })""", [0.5, 2.0, 3.5])
    finally:
        f.unlink(missing_ok=True)
    assert not res.get("logs"), res.get("logs")
    thr = [e for e in res["report"]["errors"] if e["code"] == "tween_threw"]
    assert len(thr) == 1, res["report"]["errors"][:4]
    assert res["samples"][2]["v"]["e"] == "1.000", res["samples"]
    assert all(s["v"]["raw"] for s in res["samples"]), "negative control: the bare callback must throw"
    return "one tween_threw reported, no page error, the healthy drive still reaches 1.000; the bare callback throws"
