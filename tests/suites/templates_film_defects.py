"""Template film defects found by frame review of the five 2026-10-06 bench lessons (fix_tpl, 2026-10-07).

Each test is `primitive_tpl_<claim>()` (the suite loader collects the `primitive_` prefix). They build the REAL lab
page (loom.lab.page: the runtime a lesson uses) in headless Chrome, add the blueprints, and inside one harness scene
build EVERY catalog template and blueprint from a sample below with its own synthetic beat and cue map (anchors are
deliberately spoken late: the first one 3 s after speech starts). The harness records each element's reveal time,
every ctx.cue call, every tick or cross drawn, and the report's errors and warnings. Without a
browser (tests/browser_support.py) they skip (a skip is named, never a pass).

Defects (the investigator's numbers, `fix_tpl` report):
 1. blank beat starts: compare.two, document.page, process.flow, timeline and the hero blueprints waited for a
    late anchor (up to 7.7 s of an empty or title-only frame). Invariant: first reveal <= the lead time + 0.35 s.
 2. document.page lines were siblings of the page, so joins exited them after it (floating lines): followers now.
 3. no empty-slot state, so storyboards wrote "Blank strip": `empty: true` items.
 4. compare.two `tone: neg` drew a red X (a verdict) for a colour choice: `verdict` and `valence` split.
 5. avatar beats drew a disc and ignored unknown props: a card, and unknown keys are an error.
 6. the active caption word was ~2:1 on the dark pill in light packs: the runtime falls back to a light colour.
 7. a myth listed under "facts" read as a fact: `stance: myth|fact` tags a compare.two side or a document.page and
    strikes a myth's header.
 8. one person, several looks: a template person that names a cast member (cast: "Priya", or a name that is one) is
    drawn as story.cast says, on whichever side, in whichever template.
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
SCENE = "lab__tmp_tpl_film_defects"
LEAD_TOL = 0.35   # the investigator's invariant: first reveal <= max(start + 0.15, speech_start + lead_s) + 0.35

# ------------------------------------------------------------------ samples: one or more per catalog entry
# Anchors are plain words; the harness gives them times in order of appearance, the first 3 s after speech starts.
S = {
    "title.card": [{"kicker": "Module two", "title": "Feedback that lands", "say_title": "feedback that lands",
                    "subtitle": "Three moves for a hard talk", "say_subtitle": "three moves"}],
    "definition": [{"term": "Spacing", "say_term": "spacing", "definition": "Reviewing across several days, not in one sitting.",
                    "say_definition": "several days"}],
    "list.steps": [{"items": [{"text": "Name the behaviour", "say": "name"}, {"text": "Say the impact", "say": "impact"},
                              {"text": "Ask a question", "say": "ask"}]},
                   {"title": "Three moves", "say_title": "three moves",
                    "items": [{"text": "Name the behaviour", "say": "name"}, {"text": "Say the impact", "say": "impact"}]}],
    "compare.two": [{"left": {"header": "Vague", "say": "vague", "items": [{"text": "Good job", "say": "good job"}]},
                     "right": {"header": "Specific", "say": "specific", "items": [{"text": "The chart saved an hour", "say": "saved"}]}},
                    {"title": "Two ways to say it", "say_title": "two ways",
                     "left": {"header": "Vague", "say": "vague"}, "right": {"header": "Specific", "say": "specific"}}],
    "process.flow": [{"steps": [{"label": "Notice", "say": "notice"}, {"label": "Report", "say": "report"}, {"label": "Delete", "say": "delete"}]},
                     {"title": "The report path", "say_title": "report path",
                      "steps": [{"label": "Notice", "say": "notice"}, {"label": "Report", "say": "report"}]}],
    "stat.hero": [{"value": 70, "suffix": "%", "say": "seventy percent", "caption": "forgotten within a day", "say_caption": "forgotten"}],
    "document.page": [{"title": "Handover notes", "say_title": "handover notes",
                       "lines": [{"text": "Client wants Friday", "say": "friday"}, {"text": "Budget is fixed", "say": "budget"}]},
                      {"title": "Handover notes", "say_title": "handover notes", "mode": "appear",
                       "lines": [{"text": "Client wants Friday", "say": "friday"}, {"text": "Budget is fixed", "say": "budget"}]}],
    "calendar.plan": [{"title": "Your week", "say_title": "your week", "days": [{"label": "Mon"}, {"label": "Wed"}, {"label": "Fri"}],
                       "entries": [{"day": 0, "label": "Review", "say": "monday"}, {"day": 2, "label": "Recall", "say": "friday"}]}],
    "quiz.question": [{"question": "Which line is specific?", "say_question": "which line",
                       "options": [{"text": "Good job"}, {"text": "The chart saved an hour"}]}],
    "quiz.answer": [{"question": "Which line is specific?", "options": [{"text": "Good job"}, {"text": "The chart saved an hour"}],
                     "answer": 1, "say_answer": "the chart", "explanation": "It names what happened and why it mattered.",
                     "say_explanation": "names what happened"}],
    "chart.bars": [{"series": [{"cat": "Day one", "value": 60, "say": "day one"}, {"cat": "Day seven", "value": 20, "say": "day seven"}]}],
    "scenario.dialogue": [{"left": {"member": "woman", "name": "Ana"}, "right": {"member": "man", "name": "Raj"},
                           "lines": [{"who": "left", "text": "Got a minute?", "say": "minute"}, {"who": "right", "text": "Sure", "say": "sure"}]}],
    "recap": [{"items": [{"label": "Name it", "say": "name it"}, {"label": "Impact", "say": "impact"}, {"label": "Ask", "say": "ask"}]}],
    "icon.grid": [{"items": [{"icon": "mail", "label": "Email", "say": "email"}, {"icon": "phone", "label": "Call", "say": "call"},
                             {"icon": "message-circle", "label": "Chat", "say": "chat"}]}],
    "cycle": [{"nodes": [{"label": "Plan", "say": "plan"}, {"label": "Do", "say": "do"}, {"label": "Check", "say": "check"}]}],
    "timeline": [{"events": [{"when": "Day 1", "label": "Learn it", "say": "learn"}, {"when": "Day 3", "label": "Recall it", "say": "recall"}]},
                 {"title": "The schedule", "say_title": "schedule",
                  "events": [{"when": "Day 1", "label": "Learn it", "say": "learn"}, {"when": "Day 3", "label": "Recall it", "say": "recall"}]}],
    "quote": [{"quote": "Feedback is a gift when it is specific.", "say": "feedback is a gift", "attribution": "A team lead", "say_attribution": "team lead"}],
    "hero.meter": [{"label": "Memory", "stops": [{"value": 30, "say": "thirty"}, {"value": 80, "say": "eighty"}]}],
    "hero.character_moment": [{"member": "woman", "items": [{"icon": "brain", "say": "idea"}, {"icon": "calendar", "say": "date"}]}],
    "hero.journey": [{"waypoints": [{"label": "Day 1", "say": "first day"}, {"label": "Day 3", "say": "third day"}, {"label": "Day 7", "say": "seventh"}]}],
    "hero.hub": [{"hub": {"label": "You", "say": "you"}, "satellites": [{"label": "Team", "say": "team"}, {"label": "Client", "say": "client"},
                                                                       {"label": "Boss", "say": "boss"}]},
                 {"title": "Who you serve", "say_title": "who you serve", "hub": {"label": "You", "say": "you"},
                  "satellites": [{"label": "Team", "say": "team"}, {"label": "Client", "say": "client"}]}],
    "hero.portal": [{"rect": [560, 260, 800, 480], "label": "Inside the inbox", "say_label": "inside"}],
}

# targeted cases for defects 2 to 5 (their names say what they test)
EXTRA = [
    ("empty_doc", "template", "document.page", {"title": "Reply", "say_title": "reply", "mode": "appear",
                                                "lines": [{"text": "Thanks for the draft", "say": "thanks"}, {"empty": True}, {"empty": True}]}),
    ("empty_cmp", "template", "compare.two", {"left": {"header": "Request", "say": "request", "items": [{"text": "Send by Friday", "say": "friday"}]},
                                              "right": {"header": "Reply", "say": "reply", "items": [{"empty": True}]}}),
    ("tone_neg", "template", "compare.two", {"left": {"header": "Rushed", "say": "rushed", "tone": "neg"},
                                             "right": {"header": "Paced", "say": "paced", "tone": "pos"}}),
    ("valence_only", "template", "compare.two", {"left": {"header": "Rushed", "say": "rushed", "valence": "neg"},
                                                 "right": {"header": "Paced", "say": "paced", "valence": "pos"}}),
    ("verdicts", "template", "compare.two", {"left": {"header": "Myth", "say": "myth", "verdict": "wrong", "valence": "pos"},
                                             "right": {"header": "Fact", "say": "fact", "verdict": "right"}}),
    ("avatar_plain", "avatar", None, {"title": "Feedback that lands", "kicker": "Welcome"}),
    ("avatar_card", "avatar", None, {"title": "The one rule", "kicker": "To keep",
                                     "card": {"lines": [{"text": "Name the behaviour", "say": "name"}, {"text": "Say the impact", "say": "impact"}]}}),
    ("avatar_rule", "avatar", None, {"title": "The one rule", "card": {"rule": "Frame the action, then solve together", "say": "frame"}}),
    ("avatar_unknown", "avatar", None, {"layout": "presenter_with_case", "case_labels": ["Jordan"], "rule": "x"}),
    # defect 7: stance
    ("stance_cmp", "template", "compare.two", {"left": {"header": "Feedback is criticism", "say": "criticism", "stance": "myth"},
                                               "right": {"header": "Feedback is information", "say": "information", "stance": "fact"}}),
    ("stance_doc", "template", "document.page", {"title": "Common belief", "say_title": "common belief", "stance": "myth",
                                                 "lines": [{"text": "People hate feedback", "say": "hate"}, {"text": "So keep it vague", "say": "vague"}]}),
    # defect 8: one person, one look (CAST below is the storyboard's story.cast)
    ("cast_dialogue", "template", "scenario.dialogue", {"left": {"cast": "Priya"}, "right": {"member": "man", "name": "Dev"},
                                                        "lines": [{"who": "left", "text": "Got a minute?", "say": "minute"}]}),
    ("cast_swapped", "template", "scenario.dialogue", {"left": {"member": "man", "name": "Raj"}, "right": {"cast": "Priya", "member": "girl"},
                                                       "lines": [{"who": "right", "text": "Sure", "say": "sure"}]}),
    ("cast_page", "template", "document.page", {"title": "Handover notes", "say_title": "handover", "person": {"cast": "Priya"},
                                                "lines": [{"text": "Client wants Friday", "say": "friday"}, {"text": "Budget is fixed", "say": "budget"}]}),
    ("cast_moment", "blueprint", "hero.character_moment", {"cast": "Dev", "items": [{"icon": "brain", "say": "idea"}]}),
    ("cast_unknown", "template", "document.page", {"title": "Notes", "person": {"cast": "Nobody"},
                                                   "lines": [{"text": "One", "say": "one"}, {"text": "Two", "say": "two"}]}),
    # a side whose item is spoken BEFORE its header (openai fork b20, b36: the item floated with no panel)
    ("item_first", "template", "compare.two", {"left": {"header": "Information access", "say": "information", "items": [{"text": "Available at handover", "say": "available"}]},
                                               "right": {"items": [{"text": "Could you flag it", "say": "flag it"}], "header": "Obstacle", "say": "obstacle"}}),
    # a RedTee blueprint placed by the bridge (runtime/templates/_redtee.js): its first reveal group is its structure
    ("redtee_lead", "redtee", None, {"name": "redtee", "order_cues": ["the frame", "the detail"],
                                     "svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><g class="reveal" style="--i:0"><rect x="10" y="10" width="380" height="180" fill="#888"/></g><g class="pop" style="--i:1"><circle cx="200" cy="100" r="40" fill="#444"/></g></svg>'}),
]

CAST = [{"name": "Priya", "member": "woman", "skin": 3, "cloth": "accent3"}, {"name": "Dev", "member": "man", "skin": 1, "cloth": "accent2"}]

_ANCHOR = lambda k: k == "say" or k.startswith("say_") or k.endswith("_say") or k.endswith("_cue")


def _anchors(o, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and _ANCHOR(k):
                if v not in out:
                    out.append(v)
            elif k == "order_cues" and isinstance(v, list):     # a RedTee blueprint's anchors, one per reveal group
                out += [a for a in v if isinstance(a, str) and a not in out]
            else:
                _anchors(v, out)
    elif isinstance(o, list):
        for v in o:
            _anchors(v, out)
    return out


def _cases() -> list[dict]:
    cases, k = [], 0
    rows = [(f"{tid}#{i}", "blueprint" if tid.startswith("hero.") else "template", tid, p) for tid, ps in S.items() for i, p in enumerate(ps)]
    for cid, kind, tid, props in rows + EXTRA:
        start = 20.0 * k + 1.0
        ss, se = start + 0.4, start + 14.0
        cues = {a: round(ss + 3.0 + 1.3 * i, 3) for i, a in enumerate(_anchors(props, []))}
        cases.append({"id": cid, "kind": kind, "tpl": tid, "props": props, "start": start, "end": start + 16.0, "ss": ss, "se": se,
                      "cues": cues, "pause": 3.0})
        k += 1
    return cases


# the harness scene: builds every case into its own group, with a ctx like world.js makes (cue = time - 0.08)
_SCENE_JS = r"""
Loom.scene("%(name)s", { build(labCtx) {
  const M = %(cases)s, out = [];
  window.LOOM_MANIFEST = window.LOOM_MANIFEST || { presenter: {} };
  const marks = [], peeps = [];
  const mk0 = Loom.kit.mark, pp0 = Loom.kit.peep;
  Loom.kit.mark = function (p, kind) { marks.push(kind); return mk0.apply(this, arguments); };
  Loom.kit.peep = function (p, member, emo, o) { peeps.push({ member, cloth: (o || {}).cloth || null, skin: (o || {}).skin == null ? null : (o || {}).skin }); return pp0.apply(this, arguments); };
  Loom.manifest = Loom.manifest || {}; Loom.manifest.cast = %(cast)s;
  for (const c of M) {
    const g = Loom.svg("g", { "data-case": c.id }, labCtx.g);
    const beat = { id: c.id, start: c.start, end: c.end, speech_start: c.ss, speech_end: c.se, phrases: [], pause_after: c.pause };
    const calls = {};
    const ctx = { beat, def: {}, props: c.props, g, box: Object.assign({}, Loom.kit.SAFE), kit: Loom.kit, m: Loom.motion, ui: Loom.ui,
      style: Loom.style, c: (t) => Loom.style.c(t), start: c.start, end: c.end, speechStart: c.ss, speechEnd: c.se,
      cue(a, lead) { const k = String(a); calls[k] = (calls[k] || 0) + 1; if (!(k in c.cues)) { Loom.error("cue_unresolved", c.id + ": " + k); return c.ss; } return c.cues[k] - (lead == null ? 0.08 : lead); },
      has(a) { return String(a) in c.cues; }, at(f) { return c.ss + f * (c.se - c.ss); },
      el(name, o) { return Loom.kit.element((o && o.parent) || g, name, o); },
      group() { return Loom.svg("g", { class: "lm-block" }, g); }, shift(grp, dx, dy) { grp.setAttribute("transform", `translate(${dx} ${dy})`); } };
    ctx.use = (ref, p, o) => Loom.useComponent(ctx, ref, p, o);
    ctx.character = (name, rig, o) => Loom.rig.place(ctx, name, rig, o);
    const rec = { els: [], register(E) { E.order = this.els.length; this.els.push(E); } };
    Loom.ctxScene = rec; Loom.ctxBeat = beat;
    const e0 = Loom.report.errors.length, w0 = Loom.report.warnings.length, m0 = marks.length, p0 = peeps.length, tw0 = Loom.report.tweens.length;
    let threw = null;
    try {
      if (c.kind === "avatar") Loom.presenter.scene(ctx, c.props);
      else if (c.kind === "redtee") Loom.redtee.scene(ctx, c.props);
      else { const T = c.kind === "template" ? Loom.templates[c.tpl] : Loom.blueprints[c.tpl];   /* "Loom.templates[" makes lab.page load the templates */ T.build(ctx, Object.assign({}, T.defaults || {}, JSON.parse(JSON.stringify(c.props)))); }
    } catch (e) { threw = String(e && e.stack || e).slice(0, 400); }
    Loom.ctxScene = null; Loom.ctxBeat = null;
    const texts = (E) => Array.from(E.inner.querySelectorAll("text")).map((t) => { const sp = t.querySelectorAll("tspan"); return sp.length ? Array.from(sp).map((x) => x.textContent).join(" ") : t.textContent; }).filter((s) => s.trim());
    const struck = Array.from(g.querySelectorAll("text")).filter((t) => (t.getAttribute("text-decoration") || "").includes("line-through")).map((t) => t.textContent);
    out.push({ id: c.id, kind: c.kind, tpl: c.tpl, start: c.start, ss: c.ss, cues: c.cues, threw, calls, marks: marks.slice(m0), peeps: peeps.slice(p0), struck,
      errors: Loom.report.errors.slice(e0).map((e) => e.code + ": " + String(e.msg).slice(0, 160)),
      warnings: Loom.report.warnings.slice(w0).map((e) => e.code),
      hl: Loom.report.tweens.slice(tw0).filter((w) => w.kind === "highlight").map((w) => w.t0),
      els: rec.els.map((E) => ({ name: E.name, t: E.revealT, kind: E.kind, x: E.x, y: E.y, w: E.w, h: E.h, exit: E.exit,
        followers: (E.followers || []).map((F) => F.name), texts: texts(E), dashed: E.inner.querySelectorAll("[stroke-dasharray]").length })) });
  }
  Loom.kit.mark = mk0; Loom.kit.peep = pp0;
  const pace = (Loom.style.pack && Loom.style.pack.pace) || {};
  // defect 6: the caption colours each pack would use (the pure function), and the live captions in this page
  const packs = %(packs)s, cap = {};
  for (const [id, pk] of Object.entries(packs)) cap[id] = Loom.captions.colours ? Loom.captions.colours(pk) : null;
  let live = null;
  try {
    if (!Loom.world.overlay) Loom.world.overlay = Loom.html("div", { style: "position:absolute;left:0;top:0;width:1920px;height:1080px" }, document.getElementById("root"));
    const w0 = Loom.report.warnings.length;
    const cap0 = Loom.style.pack.captions;
    Loom.style.pack.captions = Object.assign({}, cap0, { active: "accent2" });   // a low-contrast active colour on purpose
    Loom.captions.build({ captions: { enabled: true, groups: [{ t0: 0.5, t1: 3.0, words: [{ w: "Name", s: 0.5, e: 0.9 }, { w: "it", s: 1.0, e: 1.3 }] }] } });
    Loom.style.pack.captions = cap0;
    for (const f of Loom.world.clocks) f(0.7);
    const spans = Array.from(document.querySelectorAll("#lm-captions span"));
    live = { active: spans[0] && getComputedStyle(spans[0]).color, rest: spans[1] && getComputedStyle(spans[1]).color,
             bg: spans[0] && getComputedStyle(spans[0].parentNode).backgroundColor, field: Loom.style.c("field"),
             warnings: Loom.report.warnings.slice(w0).map((e) => e.code) };
  } catch (e) { live = { threw: String(e && e.stack || e).slice(0, 300) }; }
  window.__tpl = { out, lead: pace.lead_s == null ? 0.6 : pace.lead_s, cap, live };
} });
"""

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
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(() => Object.assign({}, window.__tpl || { missing: true }, { reportErrors: Loom.report.errors.length }));
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""

_CACHE: dict = {}


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _packs() -> dict:
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((ENGINE / "packs" / "styles").glob("*.json"))}


def _run(style: str = "story-cartoon") -> dict:
    """one page, every case; cached per style for the whole test run"""
    if style in _CACHE:
        return _CACHE[style]
    from loom import lab
    f = LAB_DIR / f"{SCENE}.js"
    f.write_text(f'// @lab {{"title": "t", "styles": ["{style}"], "dur": {20.0 * len(_cases()) + 2}, "times": [0.5]}}\n'
                 + _SCENE_JS % {"name": SCENE, "cases": json.dumps(_cases()), "packs": json.dumps(_packs()), "cast": json.dumps(CAST)}, encoding="utf-8")
    try:
        tmp, _m, _s, _t = lab.page(SCENE, style, times=[0.5])
    finally:
        f.unlink(missing_ok=True)
    try:
        # the lab page carries the templates only; add the blueprints and the RedTee bridge before the scene script
        html = (tmp / "lab.html").read_text(encoding="utf-8")
        extra = sorted((ENGINE / "runtime" / "blueprints").glob("*.js")) + [ENGINE / "runtime" / "templates" / "_redtee.js"]
        tags = ""
        for i, s in enumerate(extra):
            shutil.copy2(s, tmp / "rt" / f"bp{i:02d}_{s.name}")
            tags += f'<script src="rt/bp{i:02d}_{s.name}"></script>'
        mark = f'<script src="rt/'
        last = html.rfind(mark, 0, html.find("window.__LAB="))
        html = html[:last] + tags + html[last:]
        (tmp / "lab.html").write_text(html, encoding="utf-8")
        js = _NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/"))}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=240, cwd=str(ENGINE),
                           env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=_browser() or ""))
        assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
        res = json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    assert not res.get("missing"), f"the harness scene did not run: {res.get('logs')}"
    assert not res.get("logs"), res["logs"]
    _CACHE[style] = res
    return res


def _case(res, cid):
    c = next((x for x in res["out"] if x["id"] == cid), None)
    assert c is not None, f"case {cid} missing from the harness output"
    return c


def _lead_at(c, lead):
    return max(c["start"] + 0.15, c["ss"] + lead)


# ------------------------------------------------------------------ 1. blank beat starts
def primitive_tpl_every_template_shows_its_structure_by_the_lead():
    """every catalog template and blueprint, built from a sample whose first anchor is spoken 3 s after speech starts,
    has its first element on screen by max(start + 0.15, speech_start + lead_s) + 0.35 s; every catalog entry has a
    sample (a template without one is a hole in the gate, not a pass) and none throws or errors"""
    if not _browser():
        return "skipped (no browser here)"
    cat = json.loads((ENGINE / "runtime" / "catalog.json").read_text(encoding="utf-8"))
    ids = set(cat["templates"]) | set(cat["blueprints"])
    assert ids, "empty catalog: the check measured nothing"
    missing = sorted(ids - set(S))
    assert not missing, f"catalog entries without a sample here: {missing}"
    res = _run()
    lead = res["lead"]
    late, bad, n = [], [], 0
    for c in res["out"]:
        if "#" not in c["id"]:
            continue
        n += 1
        if c["threw"] or c["errors"]:
            bad.append(f"{c['id']}: {c['threw'] or c['errors'][:2]}")
            continue
        ts = [e["t"] for e in c["els"] if e["t"] is not None]
        first = min(ts) if ts else float("inf")
        if first > _lead_at(c, lead) + LEAD_TOL:
            late.append(f"{c['id']} first reveal +{first - c['start']:.2f}s (limit +{_lead_at(c, lead) + LEAD_TOL - c['start']:.2f}s)")
    assert n >= len(ids), f"only {n} sample builds ran for {len(ids)} catalog entries"
    rt = _case(res, "redtee_lead")
    rts = [e["t"] for e in rt["els"] if e["t"] is not None]
    assert rts and not rt["errors"], (rt["errors"], rt["threw"])
    if min(rts) > _lead_at(rt, lead) + LEAD_TOL:
        late.append(f"redtee_lead first reveal +{min(rts) - rt['start']:.2f}s")
    assert not bad, bad
    assert not late, late
    return f"{n} builds of {len(ids)} catalog entries: first reveal within the lead"


def primitive_tpl_compare_and_page_structure_leads_and_words_still_land():
    """compare.two WITH a title shows its first panel within 0.75 s of the lead (it held 4 s of title alone);
    document.page shows the page by the lead in both modes; when the structure leads, its words are still marked
    ON their cue (a highlight sweep at the cue, not at the early reveal)"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    lead = res["lead"]
    c = _case(res, "compare.two#1")
    L = _lead_at(c, lead)
    panels = {e["name"]: e["t"] for e in c["els"] if e["name"].endswith("_panel")}
    assert set(panels) == {"left_panel", "right_panel"}, panels
    assert min(panels.values()) <= L + 0.75, f"first panel at +{min(panels.values()) - c['start']:.2f}s, lead +{L - c['start']:.2f}s"
    # M.highlight sweeps from (t - 0.06), t = the cue time (spoken time - 0.08)
    assert any(abs(t - (c["cues"]["vague"] - 0.14)) < 0.011 for t in c["hl"]), f"left header not marked on its word: {c['hl']}"
    for cid in ("document.page#0", "document.page#1"):
        d = _case(res, cid)
        page = next(e for e in d["els"] if e["name"] == "page")
        assert page["t"] <= _lead_at(d, lead) + LEAD_TOL, f"{cid}: page at +{page['t'] - d['start']:.2f}s"
        assert any(abs(t - (d["cues"]["handover notes"] - 0.14)) < 0.011 for t in d["hl"]), f"{cid}: title not marked on its word {d['hl']}"
    return "panels and page lead; words marked on their cues"


def primitive_tpl_each_anchor_is_cued_once_per_build():
    """a template asks for each anchor's time once: ctx.cue logs every call in Loom.report.cues, so a template that
    asked twice double-logged (the rc1 compare.two prototype did; calendar.plan and hero.character_moment did)"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    twice = [f"{c['id']}: {k} x{v}" for c in res["out"] for k, v in c["calls"].items() if v > 1]
    asked = sum(len(c["calls"]) for c in res["out"])
    assert asked > 20, f"only {asked} anchors were asked for: the check measured nothing"
    assert not twice, twice
    return f"{asked} anchors, each cued once"


# ------------------------------------------------------------------ 2. followers
def primitive_tpl_document_lines_are_followers_of_the_page():
    """document.page lines (and their highlight bars) leave WITH the page: the page declares them as followers, so
    M.exit takes them on the page's exit time instead of the join's 0.05 s build-order stagger"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    for cid in ("document.page#0", "document.page#1", "empty_doc"):
        d = _case(res, cid)
        page = next(e for e in d["els"] if e["name"] == "page")
        lines = [e["name"] for e in d["els"] if e["name"].startswith("line_")]
        assert lines, f"{cid}: no lines drawn"
        assert sorted(page["followers"]) == sorted(lines), f"{cid}: followers {page['followers']} != lines {lines}"
    return "page.followers = every line"


# ------------------------------------------------------------------ 3. empty slots
def primitive_tpl_empty_slots_draw_a_slot_and_no_words():
    """`empty: true` on a document.page line or a compare.two item draws a blank slot (a dashed rule) and no words, so a
    storyboard never has to write 'Blank strip'; both schemas declare it in the catalog"""
    if not _browser():
        return "skipped (no browser here)"
    cat = json.loads((ENGINE / "runtime" / "catalog.json").read_text(encoding="utf-8"))["templates"]
    assert cat["document.page"]["props"]["lines"]["of"].get("empty", {}).get("type") == "bool", "document.page lines: no `empty` in the catalog"
    assert cat["compare.two"]["props"]["left"]["of"]["items"]["of"].get("empty", {}).get("type") == "bool", "compare.two items: no `empty` in the catalog"
    res = _run()
    d = _case(res, "empty_doc")
    assert not d["errors"] and not d["threw"], (d["errors"], d["threw"])
    ls = {e["name"]: e for e in d["els"] if e["name"].startswith("line_")}
    assert len(ls) == 3, list(ls)
    assert ls["line_1"]["texts"] == ["Thanks for the draft"], ls["line_1"]["texts"]
    for k in ("line_2", "line_3"):
        assert ls[k]["texts"] == [] and ls[k]["dashed"] >= 1, (k, ls[k]["texts"], ls[k]["dashed"])
    c = _case(res, "empty_cmp")
    assert not c["errors"] and not c["threw"], (c["errors"], c["threw"])
    it = next(e for e in c["els"] if e["name"] == "right_item_1")
    assert it["texts"] == [] and it["dashed"] >= 1, (it["texts"], it["dashed"])
    return "empty lines and items: a dashed slot, zero words"


# ------------------------------------------------------------------ 4. polarity
def primitive_tpl_compare_valence_is_colour_and_verdict_is_the_mark():
    """compare.two: `valence` colours a side and draws no mark; `verdict: right|wrong` draws the tick or cross; the
    deprecated `tone` maps to valence (no mark) and warns. A red X on a 'bad thing' side read as 'wrong answer'"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    t = _case(res, "tone_neg")
    assert t["marks"] == [], f"tone drew marks {t['marks']}: a colour choice became a verdict"
    assert "compare_tone_deprecated" in t["warnings"], t["warnings"]
    v = _case(res, "valence_only")
    assert v["marks"] == [] and not v["errors"], (v["marks"], v["errors"])
    r = _case(res, "verdicts")
    assert r["marks"] == ["no", "yes"], f"verdict marks {r['marks']}"
    return "valence: no mark; verdict: wrong -> no, right -> yes; tone deprecated"


# ------------------------------------------------------------------ 5. avatar
def primitive_tpl_avatar_card_fills_the_frame_and_unknown_keys_are_errors():
    """an avatar with a `card` draws it on the empty side (lines or a rule) with a smaller disc; keys the presenter does
    not read (layout, case_labels, labels, rule at the top level) are the avatar_props_unknown error, not silence"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    pl, cd, ru, un = (_case(res, k) for k in ("avatar_plain", "avatar_card", "avatar_rule", "avatar_unknown"))
    for c in (pl, cd, ru):
        assert not c["errors"] and not c["threw"], (c["id"], c["errors"], c["threw"])
    disc = lambda c: next(e for e in c["els"] if e["name"] == "presenter_frame")["w"]
    card = next((e for e in cd["els"] if e["name"] == "presenter_card"), None)
    assert card is not None, [e["name"] for e in cd["els"]]
    words = [w for e in cd["els"] if e["name"].startswith("presenter_card") for w in e["texts"]]
    assert words == ["Name the behaviour", "Say the impact"], words
    assert disc(cd) < disc(pl), f"disc {disc(cd)} with a card, {disc(pl)} without"
    frame = next(e for e in cd["els"] if e["name"] == "presenter_frame")
    assert card["x"] >= frame["x"] + frame["w"] or card["x"] + card["w"] <= frame["x"], "the card overlaps the disc"
    assert card["w"] * card["h"] >= 0.25 * 1728 * 846, f"the card fills only {card['w']}x{card['h']}"
    rw = [w for e in ru["els"] if e["name"].startswith("presenter_card") for w in e["texts"]]
    assert rw == ["Frame the action, then solve together"], rw
    assert any(e.startswith("avatar_props_unknown") and "case_labels" in e and "layout" in e for e in un["errors"]), un["errors"]
    return "card drawn beside a smaller disc; unknown keys reported"


# ------------------------------------------------------------------ 6. caption contrast
def _rgb(s):
    s = s.strip()
    if s.startswith("#"):
        h = s[1:]
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)), 1.0
    nums = [float(x) for x in s[s.index("(") + 1:s.index(")")].replace("/", ",").split(",") if x.strip()]
    return tuple(nums[:3]), (nums[3] if len(nums) > 3 else 1.0)


def _lum(rgb):
    ch = [c / 255 for c in rgb]
    ch = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in ch]
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]


def _ratio(a, b):
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def _pill(pack):
    cap = pack.get("captions") or {}
    bg, al = _rgb(cap.get("bg") or "rgba(0,0,0,.7)")
    fld, _ = _rgb(pack["palette"]["field"])
    return tuple(al * b + (1 - al) * f for b, f in zip(bg, fld))


def primitive_tpl_caption_active_word_reads_on_the_pill_in_every_pack():
    """the active caption word reaches 4.5:1 against the pill composited over the field in EVERY pack (computed here
    in Python, independently of the runtime's maths); a pack whose own active colour already reads keeps it (since the
    RC20 pack fix that is every pack: the style lint holds them there); a pack that falls back warns once, shown live
    by forcing story-cartoon's old active colour (accent2, 2.03:1) onto its pill: the captions paint the fallback"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    packs = _packs()
    assert len(packs) >= 10 and res["cap"], "no packs measured"
    rows, low = [], []
    for pid, pk in packs.items():
        got = res["cap"].get(pid)
        assert got and got.get("active"), f"{pid}: Loom.captions.colours gave {got}"
        own = pk["palette"].get((pk.get("captions") or {}).get("active") or "accent2")
        pill = _pill(pk)
        r_own, r_got = _ratio(_rgb(own)[0], pill), _ratio(_rgb(got["active"])[0], pill)
        rows.append(f"{pid} {r_own:.2f}->{r_got:.2f}")
        if r_got < 4.5:
            low.append(f"{pid} {r_got:.2f}")
        if r_own >= 4.5:
            assert got["active"].lower() == own.lower(), f"{pid}: a readable active colour was replaced"
        else:
            assert got["fallback"], f"{pid}: below 4.5 ({r_own:.2f}) but no fallback flagged"
    assert not low, low
    live = res["live"]
    assert not live.get("threw"), live
    assert "caption_active_contrast" in live["warnings"], live
    a = tuple(float(x) for x in live["active"][live["active"].index("(") + 1:-1].split(",")[:3])
    assert _ratio(a, _pill(packs["story-cartoon"])) >= 4.5, live
    old = dict(packs["story-cartoon"], captions=dict(packs["story-cartoon"]["captions"], active="accent2"))
    assert _ratio(_rgb(old["palette"]["accent2"])[0], _pill(old)) < 4.5, "control: the forced colour must be below the bar"
    return "; ".join(rows)


# ------------------------------------------------------------------ 7. stance
def primitive_tpl_stance_tags_a_myth_and_strikes_it():
    """compare.two sides and document.page take `stance`: a myth gets a MYTH tag and its header (or title) struck
    through, a fact a FACT tag and no strike; both tags are declared chrome (the sample-text audit allows them)"""
    if not _browser():
        return "skipped (no browser here)"
    cat = json.loads((ENGINE / "runtime" / "catalog.json").read_text(encoding="utf-8"))["templates"]
    for tid in ("compare.two", "document.page"):
        assert {"Myth", "Fact"} <= set(cat[tid].get("chrome") or []), f"{tid}: the stance tags are not declared chrome"
    assert cat["compare.two"]["props"]["left"]["of"].get("stance", {}).get("choices") == ["myth", "fact", "none"], "compare.two sides: no stance"
    assert cat["document.page"]["props"].get("stance", {}).get("choices") == ["myth", "fact", "none"], "document.page: no stance"
    res = _run()
    c = _case(res, "stance_cmp")
    assert not c["errors"] and not c["threw"], (c["errors"], c["threw"])
    words = [w for e in c["els"] for w in e["texts"]]
    assert "MYTH" in words and "FACT" in words, words
    assert c["struck"] == ["Feedback is criticism"], f"only the myth's header is struck: {c['struck']}"
    d = _case(res, "stance_doc")
    assert not d["errors"] and not d["threw"], (d["errors"], d["threw"])
    assert "MYTH" in [w for e in d["els"] for w in e["texts"]] and d["struck"] == ["Common belief"], (d["els"], d["struck"])
    plain = _case(res, "compare.two#0")
    assert plain["struck"] == [] and not any(w in ("MYTH", "FACT") for e in plain["els"] for w in e["texts"]), "control: no stance, no tag"
    return "myth: tag and strike; fact: tag only; no stance: neither"


# ------------------------------------------------------------------ 8. one person, one look
def primitive_tpl_a_cast_member_has_one_look_in_every_template():
    """a person prop that names a cast member (cast: "Priya", or name: "Dev" when Dev is in story.cast) is drawn as
    story.cast fixes it, whichever side it stands on (scenario.dialogue coloured people by side) and in whichever
    template (document.page, hero.character_moment); a person outside the cast keeps the template's defaults; an unknown
    cast name is an error"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    look = lambda q: (q["member"], q["cloth"], q["skin"])   # noqa: E731
    priya = ("woman", "accent3", 3)
    dev = ("man", "accent2", 1)
    d = _case(res, "cast_dialogue")
    assert not d["errors"], d["errors"]
    assert d["peeps"] and look(d["peeps"][0]) == priya, f"left (cast) {d['peeps']}"
    assert look(d["peeps"][-1]) == dev, f"right (named Dev, a cast member) {d['peeps']}"
    sw = _case(res, "cast_swapped")
    assert look(sw["peeps"][-1]) == priya, f"Priya on the RIGHT keeps her look (was skin 2, accent4 by side): {sw['peeps']}"
    # the left side's default: the pack's person_cloth for slot 0 when it sets one (WS6, D-128), else the template's accent
    from loom.compose import load_style
    pc = (load_style("story-cartoon").get("roles") or {}).get("person_cloth")
    left = (pc[0] if isinstance(pc, list) else pc) if pc else "accent"
    assert look(sw["peeps"][0]) == ("man", left, 0), f"control: Raj (no cast entry) keeps the left side's defaults ({left}): {sw['peeps']}"
    assert "cast_overrides_props" in sw["warnings"], "the props' member girl differs from the cast: say so"
    pg = _case(res, "cast_page")
    assert look(pg["peeps"][0]) == priya and not pg["errors"], (pg["peeps"], pg["errors"])
    mo = _case(res, "cast_moment")
    assert mo["peeps"] and all(look(x) == dev for x in mo["peeps"]), mo["peeps"]
    un = _case(res, "cast_unknown")
    assert any(e.startswith("cast_unknown") for e in un["errors"]), un["errors"]
    return "Priya and Dev: one look each across sides and templates; the non-cast control keeps its defaults"


def primitive_tpl_a_compare_panel_is_never_after_its_own_items():
    """compare.two: a side's panel (box and header) is on screen no later than its first item, even when the item is
    spoken before the header; the header's words are still marked ON their word. In the openai fork's render, b20 and
    b36 showed an item floating with no panel and no header for 2 to 6 s (2026-10-07)"""
    if not _browser():
        return "skipped (no browser here)"
    res = _run()
    c = _case(res, "item_first")
    t = {e["name"]: e["t"] for e in c["els"]}
    assert t["right_item_1"] < c["cues"]["obstacle"], "control: the case must speak the item before its header"
    assert t["right_panel"] <= t["right_item_1"] + 0.001, f"right panel at {t['right_panel']:.2f}s after its item at {t['right_item_1']:.2f}s"
    assert any(abs(h - (c["cues"]["obstacle"] - 0.14)) < 0.011 for h in c["hl"]), f"the header is not marked on its word: {c['hl']}"
    return f"panel at {t['right_panel']:.2f}s, item {t['right_item_1']:.2f}s, header word {c['cues']['obstacle']:.2f}s"
