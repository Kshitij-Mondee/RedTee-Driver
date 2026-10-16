"""Brush and orb recipes (D-139; docs/research/2026-10-08-topic-asset-needs.md sections 11 and 12): Loom.brush.redFlags,
markup, sketchSystem, wash (runtime/recipes_brush.js), the orb's own states unsure, checking and paused
(runtime/orbs.js) and Loom.orb.toolLoop, retrieval, unsure, approval (runtime/recipes_orb.js). The browser tests load
the REAL lab pages (scenes_examples/lab/recipe_*.js) in headless Chrome and skip without a browser (tests/browser_support.py);
each has a control that shows it can fail. Run: --only primitive_recipe_brush,primitive_recipe_orb"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

LAB = ENGINE / "scenes_examples" / "lab"

# one page load; probe(t) is evaluated after each seek, in the order given (so the order is the test's to choose)
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
      const H = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
      const probe = %(probe)s;
      const times = %(times)s;
      const samples = times.map((t) => { Loom.tl.seek(t, false); return { t, v: probe(t, H) }; });
      const R = Loom.report;
      return { samples, report: { errors: R.errors, warnings: R.warnings } };
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
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=120, cwd=str(ENGINE), env=dict(os.environ))
        assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
        out = json.loads(r.stdout.strip().splitlines()[-1])
        assert not out["report"]["errors"], f"{scene} [{style}]: {out['report']['errors'][:3]}"
        assert not out.get("logs"), f"{scene} [{style}] page errors: {out['logs'][:3]}"
        return out
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _prefix_in_time_order(marks: list[dict]) -> bool:
    """revealed marks (reveal > 0) form a prefix of the marks sorted by their time, and a later mark is never further
    along than an earlier one"""
    seq = [m["reveal"] for m in sorted(marks, key=lambda m: m["at"])]
    return all(seq[i] >= seq[i + 1] or seq[i] == 1.0 for i in range(len(seq) - 1)) and all(
        not (seq[i] == 0 and seq[i + 1] > 0) for i in range(len(seq) - 1))


# ------------------------------------------------------------------ brush recipes

_BRUSH_MARKS = r"""function (t, H) {
  const out = { marks: [], neg: Loom.style.c("neg") };
  document.querySelectorAll("image[data-mark]").forEach((im) => {
    out.marks.push({ h: H(im.getAttribute("href") || ""), kind: im.getAttribute("data-mark"), at: +im.getAttribute("data-at"),
      reveal: +im.getAttribute("data-reveal"), colour: im.getAttribute("data-colour") });
  });
  if (t === 0.05) {
    // control for the seed: the same flags baked again under a different seed paint different rings
    const host = Loom.svg("g", {}, document.querySelector("svg"));
    const mk = (id) => ({ beat: { id: "probe" }, start: 0, end: 6, c: (k) => Loom.style.c(k), el: (n, o) => Loom.kit.element(host, n, o) });
    const flags = [{ rect: { x: 400, y: 300, w: 300, h: 40 }, at: 0.5 }];
    const a = Loom.brush.redFlags(mk(), "probe_a", { seed: 11, hatch: false, flags });
    const b = Loom.brush.redFlags(mk(), "probe_b", { seed: 12, hatch: false, flags });
    const c = Loom.brush.redFlags(mk(), "probe_c", { seed: 11, hatch: false, flags });
    const href = (E) => H(E.E.inner.querySelector("image").getAttribute("href"));
    out.seed = { a: href(a), b: href(b), c: href(c) };
    host.remove();
  }
  return out;
}"""


def primitive_recipe_brush_redflags_paint_the_same_marks_and_reveal_in_the_given_order():
    """recipe_brush_redflags: two loads paint byte-identical layers (one seed, the same pixels); the four rings reveal in
    the order given (at every sampled time the revealed rings are a prefix of the given order) and are closed before
    the first time and fully open after the last; every ring is coloured with the pack's neg token. Controls: the
    layers differ from each other (not one blank image), the same flag baked under another seed paints a different
    ring while the same seed repeats it, and the order check rejects a hand-made out-of-order sample."""
    if not _browser():
        return "skipped (no browser here)"
    times = [0.05, 0.3, 1.0, 1.9, 2.9, 3.9, 5.9]
    a = _probe("recipe_brush_redflags", "whiteboard", _BRUSH_MARKS, times)
    b = _probe("recipe_brush_redflags", "whiteboard", _BRUSH_MARKS, [5.9])
    last = a["samples"][-1]["v"]
    rings = [m for m in last["marks"] if m["kind"] == "ring"]
    assert len(rings) == 4, f"expected 4 rings, found {len(rings)} (blind probe?)"
    assert len(last["marks"]) == 9, f"4 rings, 4 hatches and a wash expected, found {len(last['marks'])}"
    assert [m["h"] for m in last["marks"]] == [m["h"] for m in b["samples"][-1]["v"]["marks"]], "two loads painted different pixels"
    assert len({m["h"] for m in last["marks"]}) == len(last["marks"]), "two layers are the same image (blank?)"
    assert [m["at"] for m in rings] == sorted(m["at"] for m in rings), "rings are not in the given order"
    assert all(m["colour"].lower() == last["neg"].lower() for m in rings), f"ring colours {[m['colour'] for m in rings]} are not neg {last['neg']}"
    for s in a["samples"]:
        rr = [m for m in s["v"]["marks"] if m["kind"] == "ring"]
        assert _prefix_in_time_order(rr), f"t={s['t']}: rings revealed out of order: {[(m['at'], m['reveal']) for m in rr]}"
    first, end = a["samples"][1]["v"]["marks"], last["marks"]
    assert all(m["reveal"] == 0 for m in first), "a mark is open before its time"
    assert all(m["reveal"] == 1 for m in end), "a mark is not fully open at the end"
    mid = [m["reveal"] for m in a["samples"][3]["v"]["marks"] if m["kind"] == "ring"]
    assert mid[0] == 1 and mid[-1] == 0, f"at 1.9 s the first ring should be drawn and the last not: {mid}"
    sd = a["samples"][0]["v"]["seed"]
    assert sd["a"] == sd["c"] and sd["a"] != sd["b"], f"seed control: {sd}"
    assert not _prefix_in_time_order([{"at": 1, "reveal": 0.0}, {"at": 2, "reveal": 1.0}]), "the order check accepts a later mark drawn first"
    return f"9 layers identical across loads, all different; rings open in order 0.6/1.6/2.6/3.6; seed matters; colour = neg"


_RECIPE_TEXT = r"""function (t, H) {
  const out = {};
  for (const n of %(names)s) {
    const el = document.querySelector('g.lm-el[data-name="' + n + '"]');
    out[n] = el ? { texts: el.querySelectorAll("text").length, images: el.querySelectorAll("image").length } : null;
  }
  out.__all_texts = document.querySelectorAll("text").length;
  return out;
}"""


def primitive_recipe_brush_marks_only_never_words():
    """Every brush recipe paints marks only: in each lab scene the recipe's element holds painted layers and no SVG
    text, while the scene around it does hold text (control: the probe can see text). And no brush recipe calls a text
    primitive in its source (control: the orb recipes, which do draw their inputs' words, are found by the same scan)."""
    src = (ENGINE / "runtime" / "recipes_brush.js").read_text(encoding="utf-8")
    pat = re.compile(r"\b(K\(\)|kit|Loom\.kit)\.(text|kicker)\(")
    assert not pat.search(src), "recipes_brush.js draws text"
    assert pat.search((ENGINE / "runtime" / "recipes_orb.js").read_text(encoding="utf-8")), "the text scan is blind"
    if not _browser():
        return "source clean; browser part skipped (no browser here)"
    cases = [("recipe_brush_redflags", "flags"), ("recipe_brush_markup", "review"), ("recipe_brush_sketchsystem", "rag_sketch"), ("recipe_brush_wash", "stress")]
    seen = []
    for scene, name in cases:
        r = _probe(scene, "editorial-paper", _RECIPE_TEXT % {"names": json.dumps([name])}, [5.9])
        v = r["samples"][0]["v"]
        assert v[name], f"{scene}: no element {name}"
        assert v[name]["images"] >= 1 and v[name]["texts"] == 0, f"{scene}.{name}: {v[name]}"
        assert v["__all_texts"] > 0, f"{scene}: the probe sees no text at all (blind?)"
        seen.append(f"{name} {v[name]['images']} layers")
    return "no text in any recipe element; " + ", ".join(seen)


# ------------------------------------------------------------------ orb states

_ORB_STATES = r"""function (t, H) {
  const out = {};
  for (const st of ["unsure", "checking", "paused"]) {
    const c = document.querySelector('g.lm-el[data-name="orb_' + st + '"] canvas');
    out[st] = c ? H(c.toDataURL("image/png")) : null;
  }
  return out;
}"""


def primitive_recipe_orb_new_states_are_pure_functions_of_t():
    """recipe_orb_states: three orbs compose, then switch at 1.0 s to unsure, checking and paused. Each orb's canvas at a
    time is the same whatever order the timeline was seeked in; after the switch the three states paint different
    orbs; unsure and checking keep moving while paused holds still (and differs from its composing self, it
    contracted). Control: before the switch the three orbs are the same composing orb, so equal hashes are possible
    and the differences come from the states."""
    if not _browser():
        return "skipped (no browser here)"
    fwd = [0.5, 1.8, 3.0, 4.5, 5.8]
    mixed = [5.8, 1.8, 4.5, 0.5, 3.0]
    a = _probe("recipe_orb_states", "corporate-clean", _ORB_STATES, fwd)
    b = _probe("recipe_orb_states", "corporate-clean", _ORB_STATES, mixed)
    A = {s["t"]: s["v"] for s in a["samples"]}
    B = {s["t"]: s["v"] for s in b["samples"]}
    assert all(A[t][k] for t in fwd for k in A[t]), "an orb canvas is missing"
    for t in fwd:
        assert A[t] == B[t], f"t={t}: the orbs differ by seek order: {A[t]} vs {B[t]}"
    pre = A[0.5]
    assert pre["unsure"] == pre["checking"] == pre["paused"], f"control: before the switch the orbs should match: {pre}"
    for t in (1.8, 3.0, 4.5, 5.8):
        assert len(set(A[t].values())) == 3, f"t={t}: two of the new states paint the same orb: {A[t]}"
    assert A[3.0]["unsure"] != A[4.5]["unsure"] and A[3.0]["checking"] != A[4.5]["checking"], "unsure or checking stood still"
    assert A[3.0]["paused"] == A[4.5]["paused"] == A[5.8]["paused"], "paused did not hold still"
    assert A[3.0]["paused"] != pre["paused"], "paused did not change from composing"
    return "identical in two seek orders; three different states after the switch; paused holds, the others move"


# ------------------------------------------------------------------ orb recipes

_TOOL = r"""function (t, H) {
  const lit = [], caps = [];
  for (let i = 0; i < 3; i++) {
    const el = document.querySelector('g.lm-el[data-name="agent_tool_' + i + '"]');
    const ring = el && el.querySelector("rect[stroke-width='5']");
    lit.push(ring ? +(+ring.getAttribute("opacity")).toFixed(2) : null);
  }
  const cap = document.querySelector('g.lm-el[data-name="agent_caption"]');
  if (cap) cap.querySelectorAll(".lm-in > g").forEach((g) => caps.push({ op: +(+g.getAttribute("opacity")).toFixed(2), text: g.textContent }));
  const c = document.querySelector('g.lm-el[data-name="agent"] canvas');
  return { lit, caps, orb: c ? H(c.toDataURL("image/png")) : null };
}"""


def primitive_recipe_orb_toolloop_lights_the_named_tool_on_its_step():
    """recipe_orb_toolloop: the card a step names lights (and only it), steps without a tool light none, the caption
    shown is the step's own, and all of it is the same in any seek order. Control: before the first tool step no
    card is lit, so the probe reads a ring that can be off."""
    if not _browser():
        return "skipped (no browser here)"
    fwd = [0.6, 1.8, 3.0, 4.1, 5.3]
    a = _probe("recipe_orb_toolloop", "corporate-clean", _TOOL, fwd)
    b = _probe("recipe_orb_toolloop", "corporate-clean", _TOOL, list(reversed(fwd)))
    A = {s["t"]: s["v"] for s in a["samples"]}
    B = {s["t"]: s["v"] for s in b["samples"]}
    for t in fwd:
        assert A[t] == B[t], f"t={t}: differs by seek order"
    assert A[0.6]["lit"] == [0, 0, 0], f"control: nothing should be lit while planning: {A[0.6]['lit']}"
    want = {1.8: [0, 1, 0], 3.0: [1, 0, 0], 4.1: [0, 0, 0], 5.3: [0, 0, 1]}
    for t, w in want.items():
        assert A[t]["lit"] == w, f"t={t}: lit {A[t]['lit']}, expected {w}"
    shown = {t: [c["text"] for c in A[t]["caps"] if c["op"] == 1] for t in fwd}
    assert shown[1.8] == ["Checks the calendar"] and shown[5.3] == ["Sends the invite"], f"captions: {shown}"
    assert len({A[t]["orb"] for t in fwd}) == len(fwd), "the orb did not change across the steps"
    return "the named card lights on its step, captions follow, same in reversed seek order"


_WORDS = r"""function (t, H) {
  const out = [];
  for (const n of %(names)s) document.querySelectorAll('g.lm-el[data-name^="' + n + '"] text').forEach((x) => {
    // a wrapped line is one tspan per line: join them as the words read
    const sp = Array.from(x.querySelectorAll("tspan")), s = (sp.length ? sp.map((y) => y.textContent).join(" ") : x.textContent || "").split(" ").filter(Boolean).join(" ").trim();   // no regex escapes: this runs inside a template literal
    if (s) out.push(s);
  });
  return out;
}"""


def _source_words(scene: str) -> str:
    return re.sub(r"\s+", " ", (LAB / f"{scene}.js").read_text(encoding="utf-8"))


def primitive_recipe_orb_every_word_is_an_input():
    """recipe_orb_retrieval, recipe_orb_unsure, recipe_orb_approval: every word the recipe puts on screen (chat lines,
    chunk texts and sources, the citation, the flag, the draft, the button label, captions, avatar initials) is in the
    lab scene's own source, i.e. was passed in. Controls: the probe finds words (non-empty), and a word the recipes
    could plausibly invent ("Approved", "Source") is not in any of these sources, so the check would catch it."""
    if not _browser():
        return "skipped (no browser here)"
    cases = [("recipe_orb_retrieval", "rag", 6.9), ("recipe_orb_unsure", "assistant", 7.4), ("recipe_orb_approval", "assistant", 7.9)]
    total = 0
    for scene, prefix, t in cases:
        src = _source_words(scene)
        assert "Approved" not in src and "Source:" not in src, f"control broken: {scene} contains a word the check must catch"
        r = _probe(scene, "corporate-clean", _WORDS % {"names": json.dumps([prefix])}, [t])
        words = r["samples"][0]["v"]
        assert len(words) >= 5, f"{scene}: the probe found only {words} (blind?)"
        invented = [w for w in words if w not in src]
        assert not invented, f"{scene}: words not passed in: {invented}"
        total += len(words)
    return f"{total} on-screen strings across 3 recipes, every one an input"


_RAG = r"""function (t, H) {
  const chunk = (i) => { const g = document.querySelector('g.lm-el[data-name="rag_chunk_' + i + '"] .lm-in > g'); return g ? +(+g.getAttribute("opacity")).toFixed(2) : null; };
  const chip = document.querySelector('g.lm-el[data-name="rag_chat"] [data-part="citation"]');
  const ans = document.querySelector('g.lm-el[data-name="rag_chat"] [data-part="msg_1"] text');
  return { chunks: [0, 1, 2].map(chunk), chip: chip ? +(+getComputedStyle(chip).opacity).toFixed(2) : null, answer: ans ? ans.textContent : null };
}"""


def primitive_recipe_orb_retrieval_chunks_then_answer_then_citation():
    """recipe_orb_retrieval: chunk cards arrive one by one after the search starts, the answer types in only while the
    orb composes, and the citation chip appears only once the answer is complete. Control: at 0.8 s (listening) no
    chunk, no answer text and no chip are visible."""
    if not _browser():
        return "skipped (no browser here)"
    a = _probe("recipe_orb_retrieval", "corporate-clean", _RAG, [0.8, 2.0, 3.0, 4.2, 6.8])
    S = {s["t"]: s["v"] for s in a["samples"]}
    assert S[0.8]["chunks"] == [0, 0, 0] and S[0.8]["chip"] == 0 and not (S[0.8]["answer"] or "").strip(), f"control: {S[0.8]}"
    assert S[2.0]["chunks"] == [1, 0, 0], f"chunks not arriving in order: {S[2.0]['chunks']}"
    assert S[3.0]["chunks"] == [1, 1, 1] and S[3.0]["chip"] == 0, f"at 3.0 s: {S[3.0]}"
    part = S[4.2]["answer"] or ""
    assert 0 < len(part) < len(S[6.8]["answer"]) and S[4.2]["chip"] == 0, f"mid-answer: {S[4.2]}"
    assert S[6.8]["chip"] == 1 and S[6.8]["answer"].startswith("You can carry over"), f"end: {S[6.8]}"
    return "chunks in order, answer typed while composing, chip after the answer"
