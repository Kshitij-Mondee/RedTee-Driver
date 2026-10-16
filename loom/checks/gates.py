"""Accept gates: the semantic checks that run when a stage's artifact is handed in.

Each gate returns (errors, warnings). Errors block the stage; warnings are shown and recorded.
Rules come from the L&D skills' rubrics; each is written so that it can FAIL (tests prove it).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from ..util import ENGINE_ROOT, read_json
from ..validate import validate
from . import story as SB
from .text import DASHES, numbers, overlap_ratio, words

FORBIDDEN_GOAL = re.compile(r"\b(understand|understands|appreciates?|knows? about|is aware of|be aware of|become familiar)\b", re.I)
BLOOM = {
    "remember": ["state", "list", "name", "recall", "identify", "recognise", "recognize", "define"],
    "understand": ["explain", "summarise", "summarize", "classify", "compare", "give an example", "describe", "interpret", "illustrate", "paraphrase", "predict"],
    "apply": ["compute", "use", "run", "solve", "carry out", "follow", "apply", "schedule", "implement", "execute", "demonstrate", "calculate", "build"],
    "analyze": ["distinguish", "decompose", "attribute", "contrast", "diagnose", "analyse", "analyze", "differentiate", "spot", "detect", "break down"],
    "evaluate": ["judge", "justify", "critique", "choose", "defend", "assess", "evaluate", "decide", "prioritise", "prioritize"],
    "create": ["design", "construct", "compose", "plan", "create", "draft", "write", "devise"],
}
LEVEL = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
NO_LENGTH = re.compile(r"\b(no (?:target|requested|request(?:ed)?|specified|given) (?:length|duration|runtime)|(?:length|duration|runtime) (?:was|is) not (?:given|supplied|specified|requested|stated)|supplied no (?:target )?(?:length|duration))\b", re.I)
GENERIC_WHAT = re.compile(r"^(introduces?|covers?|explains?|talks about|discusses?|overview of|summary of) (the )?(topic|subject|basics|concept)s?\b", re.I)


def _schema(obj, name):
    return validate(obj, name)


def _catalog_ids() -> set[str]:
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json", {"templates": {}, "blueprints": {}})
    return set(cat.get("templates", {})) | set(cat.get("blueprints", {}))


# ------------------------------------------------------------------ brief
def check_brief(project):
    b = read_json(project.path("plan/brief.json"))
    E = _schema(b, "brief"); W = []
    if E:
        return E, W
    size = len(json.dumps(b))
    if size > 12000:
        E.append(f"brief is {size} chars (~{size // 4} tokens); the cap is ~2400 tokens. Compile harder.")
    elif size > 7000:
        W.append(f"brief is ~{size // 4} tokens; aim for ~1200")
    if not (3 <= len(b["must_cover"]) <= 8):
        E.append(f"must_cover holds {len(b['must_cover'])} entries; it must hold 3-8")
    topic = project.mode == "topic"
    for i, m in enumerate(b["must_cover"]):
        if not (m.get("source_anchor") or m.get("from_user") or (topic and m.get("from_knowledge"))):
            E.append(f"must_cover[{i}] ('{m['what'][:40]}') has no source_anchor / from_user" + (" / from_knowledge" if topic else "") + ": the brief never adds a fact")
    for i, seg in enumerate(b["arc_plan"]):
        if GENERIC_WHAT.search(seg["what"].strip()):
            E.append(f"arc_plan[{i}].what is generic ('{seg['what'][:50]}'): say concretely what THIS segment does")
        if seg.get("no_material") and not seg.get("needs"):
            E.append(f"arc_plan[{i}] sets no_material without 'needs'")
    ids = _catalog_ids()
    blob = json.dumps(b).lower()
    for t in ids:
        if t.lower() in blob:
            E.append(f"brief names a template/blueprint ('{t}'): visual direction is kinds in plain words")
    # the kind of video (D-191): a known one, the request's when it names one; an explainer's arc has no check
    from ..genre import PROFILES as _KINDS
    bg = str(b.get("genre") or "").strip().lower()
    rq = str((project.request or {}).get("genre") or "auto").strip().lower()
    if bg not in _KINDS:
        E.append(f"brief.genre '{b.get('genre')}' is not a kind of video the engine plans for ({', '.join(sorted(_KINDS))})")
    elif rq in _KINDS and bg != rq:
        E.append(f"brief.genre '{bg}' but the request names '{rq}': the person's choice stands")
    elif _KINDS[bg]["recall"] == "none":
        roles = [str(seg.get("role") or "") for seg in b["arc_plan"]]
        if any(r in ("check", "practice", "your turn", "quiz") for r in roles):
            E.append(f"the arc of a {bg} has a check or practice role ({', '.join(roles)}): an explainer asks the viewer nothing")
    return E, W


# ------------------------------------------------------------------ knowledge
def check_knowledge(project):
    k = read_json(project.path("plan/knowledge.json"))
    E = _schema(k, "knowledge"); W = []
    if E:
        return E, W
    seen = set()
    for f in k["facts"]:
        if f["id"] in seen:
            E.append(f"duplicate fact id {f['id']}")
        seen.add(f["id"])
        for n in f.get("numbers", []):
            if str(n).replace(",", "") not in "".join(numbers(f["statement"])) and str(n) not in f["statement"]:
                E.append(f"{f['id']}: number '{n}' is listed but not in the statement")
        for n in numbers(f["statement"]):
            if n not in [str(x).replace(",", "") for x in f.get("numbers", [])]:
                E.append(f"{f['id']}: the statement contains '{n}' but numbers[] does not list it")
        if f["confidence"] == "contested" and not f.get("caveat"):
            E.append(f"{f['id']}: a contested fact needs a caveat the script must carry")
        if DASHES.search(f["statement"]):
            E.append(f"{f['id']}: em/en dash in statement")
    if k["review"]["status"] != "approved":
        W.append("knowledge sheet is a DRAFT: a human must approve it (py -m loom approve <id> knowledge) before the script uses it")
    return E, W


# ------------------------------------------------------------------ pedagogy
def _verb_level(goal: str) -> str | None:
    g = goal.lower().replace("the viewer can ", "", 1).strip()
    for lvl in reversed(LEVEL):
        for v in BLOOM[lvl]:
            if g.startswith(v + " ") or g == v:
                return lvl
    return None


def check_pedagogy(project):
    p = read_json(project.path("plan/teaching_plan.json"))
    E = _schema(p, "teaching_plan"); W = []
    if E:
        return E, W
    secs = p["arc"]["sections"]
    ids = [s["id"] for s in secs]
    for s in secs:
        if FORBIDDEN_GOAL.search(s["goal"]):
            E.append(f"{s['id']}: goal uses a forbidden verb ('{s['goal']}')")
        lv = _verb_level(s["goal"])
        if lv is None:
            W.append(f"{s['id']}: goal verb not in the Bloom table ('{s['goal'][:60]}'); check it matches '{s['bloom']}'")
        elif lv != s["bloom"]:
            E.append(f"{s['id']}: goal verb reads as '{lv}' but bloom says '{s['bloom']}'")
    lv = [LEVEL.index(s["bloom"]) for s in secs]
    for i in range(1, len(lv)):
        if abs(lv[i] - lv[i - 1]) > 1 and not any("BLOOM" in str(f) for f in p.get("flags", [])):
            E.append(f"bloom jumps more than one level between {ids[i - 1]} and {ids[i]}")
    if p["audience"]["level"] in ("student", "practitioner", "expert") and max(lv) < LEVEL.index("apply") and not any("BLOOM-CAP" in str(f) for f in p.get("flags", [])):
        E.append("the peak section must reach at least 'apply' for this audience (or flag BLOOM-CAP with a reason)")
    en = [s["energy"] for s in secs]
    for i in range(1, len(en)):
        if en[i] == "peak" and en[i - 1] == "peak":
            E.append(f"two peak sections back to back ({ids[i - 1]}, {ids[i]})")
    if en[-1] == "peak":
        E.append("the last section is 'peak'; endings settle")
    dur = float(p["pacing"]["target_duration_s"])
    # the requested length is the requester's, not the planner's: agents planned 600 s and 270 s for a 2-minute
    # request, and the script gate measured against the plan, so nothing caught it (bench 2026-10-06, L-236)
    req_s = float(project.request.get("length_min") or 0) * 60
    if req_s and not (0.75 * req_s <= dur <= 1.3 * req_s):
        E.append(f"pacing.target_duration_s is {dur:.0f}s but the request asks for about {req_s:.0f}s (allowed {0.75 * req_s:.0f} to {1.3 * req_s:.0f}); plan to the requested length")
    # the plan carries the request's length: two bench plans said "the requester supplied no target length" for a
    # 2-minute request (pacing.duration_basis), because the planner's message never named it (bench 2026-10-06)
    fe = []
    if req_s:
        rq = (p["pacing"] or {}).get("requested_s")
        if rq is None:
            # the plan must STATE the request's length (two bench plans for a 2-minute request said none was given)
            fe.append(f"pacing.requested_s is missing: the request asks for {req_s / 60:g} minutes; set pacing.requested_s to "
                      f"{req_s:.0f} and plan to it")
        elif abs(float(rq) - req_s) > 1:
            fe.append(f"pacing.requested_s is {float(rq):.0f}s but the request asks for {req_s:.0f}s: carry the request's length as it is")
        if NO_LENGTH.search(json.dumps(p, ensure_ascii=False)):
            fe.append(f"the plan says no length was requested ('{NO_LENGTH.search(json.dumps(p, ensure_ascii=False)).group(0)}'), but the "
                     f"request asks for {req_s / 60:g} minutes ({req_s:.0f}s): set pacing.requested_s to {req_s:.0f} and plan to it")
    fe, fw = _ratchet(project, "pedagogy", fe)
    E += fe; W += fw
    if dur > 180 and "rest" not in en:
        E.append("a video over 3 minutes needs at least one 'rest' section")
    wpm = float(p["pacing"]["words_per_minute"])
    if not 130 <= wpm <= 160:
        E.append(f"words_per_minute {wpm} outside 130-160")
    stops = [r for r in p["pacing"]["recall_moments"] if r.get("kind") in ("quiz", "pause_predict")]
    cap = 1 if dur <= 360 else 2 if dur <= 600 else 3 if dur <= 900 else 5 if dur <= 1500 else 6
    if len(stops) > cap:
        E.append(f"{len(stops)} stopping checks for {dur:.0f}s; the budget is {cap}")
    # the kind of video decides the recall moments (D-191): a teaching film needs one, an explainer has none
    from ..genre import plan_errors as _kind_plan, gagne_required as _kind_gagne
    E += _kind_plan(project, p)
    for r in p["pacing"]["recall_moments"]:
        if r.get("after_section") not in ids:
            E.append(f"recall moment tied to unknown section {r.get('after_section')}")
        if r.get("kind") == "quiz" and not (r.get("answer") and r.get("tempting_wrong")):
            E.append("a quiz needs 'answer' and 'tempting_wrong' (why the tempting option is wrong)")
    for m in p["misconceptions"]:
        if m["refuted_in"] not in ids:
            E.append(f"misconception '{m['belief'][:40]}' refuted_in unknown section {m['refuted_in']}")
    carriers = [s["carrier"] for s in secs]
    for i in range(2, len(carriers)):
        if carriers[i] == carriers[i - 1] == carriers[i - 2]:
            E.append(f"three consecutive sections share the carrier '{carriers[i]}'")
    fa = p["framework_audit"]
    for key in _kind_gagne(project):
        if not (fa.get("gagne") or {}).get(key):
            E.append(f"framework_audit.gagne.{key} is missing (mandatory event)")
    path = [x.strip() for x in re.split(r"->|→|,", fa.get("bloom_path", "")) if x.strip()]
    path = [re.sub(r"\s*\(.*\)$", "", x) for x in path]
    if path and path != [s["bloom"] for s in secs]:
        E.append(f"bloom_path '{fa.get('bloom_path')}' does not match the sections' levels {[s['bloom'] for s in secs]}")
    if len(p["arc"]["hook"]["sketch"].split()) > 45:
        E.append("hook is longer than 45 words")
    return E, W


# ------------------------------------------------------------------ persona
def check_persona(project):
    p = read_json(project.path("plan/persona.json"))
    E = _schema(p, "persona"); W = []
    if E:
        return E, W
    for m in p["signature_moves"]:
        if len(m.get("when", "")) < 8:
            E.append(f"move '{m.get('name')}' has no usable 'when'")
    for a in p["anti_examples"]:
        if len(a.get("why", "")) < 6:
            E.append("every anti_example needs a 'why'")
    blob = json.dumps(p)
    if DASHES.search(blob):
        W.append("persona contains em/en dashes; scripts may not")
    return E, W


# ------------------------------------------------------------------ script
def _fact_numbers(project) -> set[str]:
    nums = set()
    if project.mode == "topic":
        k = read_json(project.path("plan/knowledge.json"), {"facts": []})
        for f in k["facts"]:
            nums |= {str(n).replace(",", "") for n in f.get("numbers", [])}
            nums |= set(numbers(f["statement"]))
    else:
        ch = read_json(project.path("source/chunks.json"), {"chunks": []})
        for c in ch["chunks"]:
            nums |= set(numbers(c["text"]))
    return nums


def check_script(project):
    s = read_json(project.path("plan/script.json"))
    E = _schema(s, "script"); W = []
    if E:
        return E, W
    plan = read_json(project.path("plan/teaching_plan.json"), {})
    secs = {x["id"] for x in s["sections"]}
    ids = [b["id"] for b in s["beats"]]
    if len(ids) != len(set(ids)):
        E.append("duplicate beat ids")
    facts = {}
    if project.mode == "topic":
        facts = {f["id"]: f for f in read_json(project.path("plan/knowledge.json"), {"facts": []})["facts"]}
        k = read_json(project.path("plan/knowledge.json"), {"review": {"status": "draft"}})
        if k["review"]["status"] != "approved":
            E.append("the knowledge sheet is not approved yet: py -m loom approve <id> knowledge")
    fact_nums = _fact_numbers(project)
    allowed_small = {str(i) for i in range(0, 11)}
    total_words = 0
    framed_before = False
    for b in s["beats"]:
        # an invented character framed once ("Say this is Maya") stays framed for the rest of the lesson
        if b.get("hypothetical") and re.search(r"\b(say|imagine|suppose|picture)\b", " ".join(b["narration"]), re.I):
            framed_before_next = True
        else:
            framed_before_next = framed_before
        if b["section"] not in secs:
            E.append(f"{b['id']}: unknown section {b['section']}")
        text = " ".join(b["narration"])
        total_words += len(words(text))
        for ph in b["narration"]:
            n = len(words(ph))
            if n > 14:
                E.append(f"{b['id']}: phrase of {n} words ('{ph[:40]}...'): split it; phrases are TTS units and reveal anchors (<=14, aim <=9)")
            elif n > 10:
                W.append(f"{b['id']}: phrase of {n} words; <=9 keeps word timing tight")
        for field in [text] + b.get("on_screen", []) + [b.get("visual_intent", "")]:
            if DASHES.search(field):
                E.append(f"{b['id']}: em/en dash ('{field[:40]}'): use a comma, full stop or ASCII hyphen")
        for os_ in b.get("on_screen", []):
            if len(words(os_)) > 12:
                E.append(f"{b['id']}: on-screen text '{os_[:40]}...' is {len(words(os_))} words: screens carry anchors, not sentences")
            elif len(words(os_)) >= 8 and (b.get("recall") or {}).get("kind") not in ("quiz", "pause_predict"):
                # labels of <= 7 words that the narration also says are GOOD (reveal anchors);
                # quiz questions must be readable during the pause. Longer transcription is the defect.
                for ph in b["narration"]:
                    if overlap_ratio(os_, ph) > 0.85 and len(words(ph)) >= 6:
                        E.append(f"{b['id']}: on-screen text transcribes the narration ('{os_[:40]}'): the redundancy principle")
        # grounding: every number said or shown must trace to the source / approved facts
        for n in numbers(text + " " + " ".join(b.get("on_screen", []))):
            if n in fact_nums or n in allowed_small or b.get("hypothetical"):
                continue
            E.append(f"{b['id']}: the number '{n}' is not in the source/knowledge sheet (ground it, or mark the beat hypothetical and frame it as 'say', 'imagine')")
        for g in b["grounding"]:
            if g.get("fact") and facts and g["fact"] not in facts:
                E.append(f"{b['id']}: grounding cites unknown fact {g['fact']}")
            if not (g.get("fact") or g.get("source_anchor") or g.get("hypothetical")):
                E.append(f"{b['id']}: grounding entry '{g['claim'][:40]}' cites nothing (fact, source_anchor or hypothetical)")
        framed = re.search(r"\b(say|imagine|suppose|picture|let's say|for example, say)\b", text, re.I)
        if b.get("hypothetical") and not framed and not framed_before:
            W.append(f"{b['id']}: hypothetical beat but the narration never frames it ('say', 'imagine')")
        if b["change_over_time"] and b["animate_score"] < 0.4:
            W.append(f"{b['id']}: change_over_time is true but animate_score is {b['animate_score']}")
        framed_before = framed_before_next
        r = b.get("recall")
        if r and r.get("kind") in ("quiz", "pause_predict") and float(b.get("pause_after_s") or 0) < 2:
            E.append(f"{b['id']}: a {r['kind']} needs a real silent pause (pause_after_s >= 2)")
    target = float((plan.get("pacing") or {}).get("target_duration_s") or project.request.get("length_min", 4) * 60)
    est = script_seconds(s)
    req_min = float(project.request.get("length_min") or 0)
    req_s = req_min * 60
    if est > target * 1.35 or est < target * 0.6:
        E.append(f"script runs ~{est:.0f}s against a {target:.0f}s plan (x{est / target:.2f}); re-cut it")
    elif est > target * 1.15 or est < target * 0.8:
        W.append(f"script runs ~{est:.0f}s against a {target:.0f}s plan")
    # the request bounds the script with the SAME tolerance as the plan (1.3x; was 1.5x, and lessons asked for 2 minutes
    # ran 5 to 11: bench 2026-10-06)
    fe = []
    if req_s and est > req_s * LENGTH_TOL:
        fe.append(f"script runs ~{est:.0f}s but the request asks for about {req_s:.0f}s (at most {req_s * LENGTH_TOL:.0f}s); "
                 f"cut about {(est - req_s) / est * total_words:.0f} words or whole beats to the requested length")
    cap = beat_cap(req_min)
    if cap and len(s["beats"]) > cap:
        fe.append(f"{len(s['beats'])} beats for a {req_min:g}-minute request; at most {cap} (about 8 beats a minute, +25 %): "
                  "merge or cut beats")
    fe, fw = _ratchet(project, "script", fe)
    E += fe; W += fw
    # the kind of video decides recall, quiz beats and questions put to the viewer (D-191)
    from ..genre import script_errors as _kind_script
    E += _kind_script(project, s)
    return E, W


# ------------------------------------------------------------------ the film-check ratchet
FILM_BASELINE = Path(__file__).with_name("film_baseline.json")


_RECORDING: dict | None = None


def record_baseline(projects: list) -> dict:
    """Write film_baseline.json for these finished lessons: the film-check errors each has today, per gate. Only for
    lessons made before the checks existed; never for a lesson being made now (that would hide its defects)."""
    global _RECORDING
    out = {}
    for p in projects:
        _RECORDING = {}
        try:
            for g in ("pedagogy", "script", "storyboard", "scenes"):
                GATES[g](p)
            check_narration(p)
            from .text_audit import vocab_check
            vocab_check(p)
            rec = {g: sorted(set(v)) for g, v in _RECORDING.items() if v}
        finally:
            _RECORDING = None
        if rec:
            out[p.id] = rec
    import datetime
    from ..util import write_json
    write_json(FILM_BASELINE, {"_note": "Recorded by loom.checks.gates.record_baseline: film-check errors finished lessons already had "
                                        "when the checks were added (2026-10-07). Each is a warning for that lesson only; a new error, "
                                        "or any error in another lesson, still fails. Shrinks as lessons are fixed; never add a lesson "
                                        "that is being made.", "recorded": datetime.date.today().isoformat(), "projects": out})
    return out


def _ratchet(project, gate: str, errs: list[str]) -> tuple[list[str], list[str]]:
    """The film checks of 2026-10-07 are a ratchet before they are a gate (CLAUDE.md rule 12, RedTee Rule 0 addendum
    5): an error a finished lesson already had when they were added is recorded in film_baseline.json and reported
    as a warning for THAT lesson; anything else, including any new lesson, is an error. Fixing a lesson shrinks its
    baseline (re-record with story.record_baseline); nothing grows it silently."""
    if _RECORDING is not None:
        _RECORDING.setdefault(gate, []).extend(errs)
        return errs, []
    try:
        base = set(((read_json(FILM_BASELINE, {}) or {}).get("projects") or {}).get(project.id, {}).get(gate) or [])
    except Exception:  # noqa: BLE001  (a project without an id has no baseline)
        base = set()
    if not base:
        return errs, []
    return ([e for e in errs if e not in base],
            [f"baseline (known when the film checks were added, 2026-10-07; fix it when this lesson is next touched): {e}" for e in errs if e in base])


# ------------------------------------------------------------------ length (calibrated on narrated lessons)
LENGTH_TOL = 1.3          # the request's length, for the plan, the script and the narration alike
# est = 1.08 x words / wpm x 60 + 1.0 s per beat + the script's own pauses. Fitted on the five bench lessons of
# 2026-10-06 (least squares: 1.076, 1.04 s) against audio/timings.json: they now read -2 % to +4 % of the narrated
# length, where words / wpm x 60 + 0.8 s per beat read 6 to 14 % short (the TTS speaks slower than wpm_target and
# every beat has a lead-in and tail). The ten other narrated lessons read -8 % to +16 % (was -17 % to +3 %).
EST_WORD_FACTOR, EST_BEAT_S = 1.08, 1.0


def script_seconds(script: dict) -> float:
    """The narrated length a script will have, in seconds (see EST_WORD_FACTOR)."""
    wpm = float(script.get("wpm_target") or 150)
    n = sum(len(words(" ".join(b.get("narration") or []))) for b in script.get("beats") or [])
    pauses = sum(float(b.get("pause_after_s") or 0) for b in script.get("beats") or [])
    return EST_WORD_FACTOR * n / wpm * 60 + EST_BEAT_S * len(script.get("beats") or []) + pauses


def beat_cap(length_min: float) -> int:
    """At most about 8 beats a minute, with 25 % room: 20 beats for a 2-minute lesson."""
    import math
    return math.ceil(8 * float(length_min) * 1.25) if length_min else 0


def check_narration(project):
    """After the narrate stage: the narrated length against the request (1.3x). The script's estimate is a forecast;
    this is the measurement. Errors go back to the script's author (a re-cut), never to TTS settings."""
    tm = read_json(project.path("audio/timings.json"), {}) or {}
    E, W = [], []
    req_s = float(project.request.get("length_min") or 0) * 60
    dur = float(tm.get("duration") or 0)
    if req_s and dur > req_s * LENGTH_TOL:
        E.append(f"narration runs {dur:.0f}s but the request asks for about {req_s:.0f}s (at most {req_s * LENGTH_TOL:.0f}s): "
                 f"the script must lose about {(dur - req_s) / dur * 100:.0f} % of its words")
    elif req_s and dur and dur < req_s * 0.6:
        W.append(f"narration runs {dur:.0f}s for a {req_s:.0f}s request")
    E, fw = _ratchet(project, "narration", E)
    return E, W + fw


# ------------------------------------------------------------------ storyboard
def check_storyboard(project):
    sb = read_json(project.path("plan/storyboard.json"))
    E = _schema(sb, "storyboard"); W = []
    if E:
        return E, W
    script = read_json(project.path("plan/script.json"))
    alloc = read_json(project.path("plan/allocation.json"), {"beats": {}})
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json", {"templates": {}, "blueprints": {}})
    styles = {p.stem for p in (ENGINE_ROOT / "packs/styles").glob("*.json")}
    if sb["style"] not in styles:
        E.append(f"unknown style '{sb['style']}' (have: {', '.join(sorted(styles))})")
    from ..toolbox import scene_errors as _tool_errors      # D-137: a scene's `tools` names toolbox tools only
    E += _tool_errors(sb)
    from ..sets import storyboard_errors as _set_errors     # D-152: a scene's `set` loads only on an exact or perfect match
    E += _set_errors(sb, sb["style"])
    from ..kept import storyboard_errors as _kept_errors    # D-163: a `reuse` names a kept piece of the lesson's own style
    E += _kept_errors(sb, sb["style"])
    if sb.get("brand"):
        from ..brand import load_brand, validate as _vb
        try:
            _b = load_brand(sb["brand"])
            E += [f"brand '{sb['brand']}': {m}" for m in _vb(_b)]
            # the merged look must still be readable: brand colours are contrast-checked IN this style
            from ..brand import apply_brand
            from .style_lint import lint_style
            if sb["style"] in styles:
                E += [f"brand '{sb['brand']}' on style '{sb['style']}': {m} (fix it in the Studio: it suggests a shade)"
                      for m in lint_style(apply_brand(read_json(ENGINE_ROOT / "packs/styles" / f"{sb['style']}.json"), _b))]
        except Exception as e:
            E.append(str(e))
    st = {s["id"]: s for s in sb["world"]["stations"]}
    for s in sb["world"]["stations"]:
        if s.get("parent") and s["parent"] not in st:
            E.append(f"station {s['id']}: unknown parent {s['parent']}")
        if s.get("parent") and not s.get("rect"):
            E.append(f"station {s['id']}: a nested station needs rect {{x,y,w,h}} in its parent's coords")
    beats = [b["id"] for b in script["beats"]]
    by = {}
    for sc in sb["scenes"]:
        if sc["beat"] in by:
            E.append(f"two scenes for beat {sc['beat']}")
        by[sc["beat"]] = sc
    for b in beats:
        if b not in by:
            E.append(f"no scene for beat {b}")
    prev = None
    joins = []
    kinds_seq = []
    upgrades = []
    last_quiz = None                             # (beat, option texts) of the last quiz.question
    ceiling = (project.request or {}).get("mix_as") == "ceiling"   # set by `loom agents run`: the mix caps templates
    fe = []                                      # errors of the 2026-10-07 film checks (ratcheted, see _ratchet)
    for b in beats:
        sc = by.get(b)
        if not sc:
            continue
        if sc["station"] not in st:
            E.append(f"{b}: unknown station {sc['station']}")
        want = (alloc.get("beats", {}).get(b) or {}).get("treatment")
        k = sc["kind"]
        fam = "avatar" if k == "avatar" else "template" if k in ("template", "redtee") else "motion"
        if want == "hybrid":
            if k not in ("template", "blueprint", "bespoke", "manim", "skia", "three", "page"):
                E.append(f"{b}: allocation says hybrid; use a template with a motion layer, a blueprint or bespoke scene")
        elif want == "template" and fam == "motion" and (ceiling or str(sc.get("upgrade_reason") or "").strip()):
            # the script writer's score sets the allocation, and two models scored every beat static (L-240): the
            # storyboard may draw a template beat when it says why, within a cap. In an agents run the mix is a
            # CEILING for templates, not a quota (WS5, 2026-10-07): any template beat may be drawn
            upgrades.append(b)
        elif want and fam != want:
            E.append(f"{b}: allocation says '{want}' but the scene kind is '{k}'"
                     + (" (to draw a template beat, set `upgrade_reason`: why this beat needs a drawn scene)" if want == "template" and fam == "motion" else ""))
        if k == "template":
            T = cat["templates"].get(sc.get("template"))
            if not T:
                E.append(f"{b}: unknown template '{sc.get('template')}'")
            elif T.get("candidate"):
                E.append(f"{b}: template '{sc.get('template')}' is a library candidate that has not passed its selection test yet")
            else:
                E += [f"{b}: {m}" for m in _props_errors(T.get("props", {}), _resolve_cast(sb, sc.get("props") or {}))]
                # a quiz is two beats: the answer brings the question's options back (its doc: "the options return"),
                # so they must be the same words; feedback-relay-v2's b14 showed other options than b13 asked (L-338)
                qp = sc.get("props") or {}
                if sc.get("template") == "quiz.question":
                    last_quiz = (b, [_opt_words(o) for o in qp.get("options") or [] if isinstance(o, dict)])
                elif sc.get("template") == "quiz.answer" and last_quiz:
                    mine_opts = [_opt_words(o) for o in qp.get("options") or [] if isinstance(o, dict)]
                    if mine_opts != last_quiz[1]:
                        E.append(f"{b}: quiz.answer options must be the question's ({last_quiz[0]}) word for word, in its order: "
                                 f"{last_quiz[1]} (here {mine_opts})")
        if k == "blueprint":
            B = cat["blueprints"].get(sc.get("blueprint"))
            if not B:
                E.append(f"{b}: unknown blueprint '{sc.get('blueprint')}'")
            elif B.get("candidate"):
                E.append(f"{b}: blueprint '{sc.get('blueprint')}' is a library candidate that has not passed its selection test yet")
            else:
                E += [f"{b}: {m}" for m in _props_errors(B.get("props", {}), _resolve_cast(sb, sc.get("props") or {}))]
        if k == "avatar":
            fe += SB.avatar_errors(sc, _props_errors)
        fe += SB.placeholder_errors(sc)
        if k == "redtee":
            try:
                from ..redtee_bridge import manifest, missing_content_params
                if sc.get("blueprint") not in manifest():
                    E.append(f"{b}: unknown RedTee blueprint '{sc.get('blueprint')}' (see runtime/redtee_catalog.md)")
                else:
                    for mp in missing_content_params(sc["blueprint"], sc.get("props") or {}):
                        E.append(f"{b}: RedTee param '{mp}' must be supplied: its default is SAMPLE content that must never reach a lesson")
            except Exception as ex:
                E.append(f"{b}: RedTee bridge unavailable ({ex})")
        if k == "bespoke" and not (sc.get("design") or {}).get("beat_sheet"):
            E.append(f"{b}: a bespoke scene needs design.beat_sheet (the choreography the scene author builds)")
        if k == "manim" and not (sc.get("manim") or {}):
            E.append(f"{b}: a manim scene needs a 'manim' spec")
        if k in ("skia", "three") and not (sc.get(k) or {}).get("file") and not (k == "three" and (sc.get(k) or {}).get("preset")):
            E.append(f"{b}: a {k} scene needs a '{k}' spec with its file" + (" or a preset" if k == "three" else ""))
        if k == "page":   # D-176: a page clip names its file (or uses scenes/<beat>_page.js) and only approved libraries
            from ..page_bridge import spec_errors as _page_spec
            E += [f"{b}: {e}" for e in _page_spec(sc)]
        if k == "three" and (sc.get(k) or {}).get("preset"):
            from ..three_bridge import presets as _presets, preset_errors as _perr
            if sc["three"]["preset"] not in _presets():
                E.append(f"{b}: three.preset '{sc['three']['preset']}' does not exist (have: {', '.join(_presets())})")
            else:
                E += [f"{b}: {e}" for e in _perr(sc)]
        j = (sc.get("join_in") or {}).get("type")
        if prev and j == "continue" and by[prev]["station"] != sc["station"]:
            E.append(f"{b}: join 'continue' needs the same station as the previous beat")
        if prev and j == "zoom":
            child = st.get(sc["station"], {})
            if child.get("parent") != by[prev]["station"]:
                E.append(f"{b}: join 'zoom' needs this station nested (parent) in the previous beat's station")
        if prev and j == "travel" and not (sc.get("join_in") or {}).get("via"):
            E.append(f"{b}: join 'travel' needs 'via' (the motif that travels)")
        ji = sc.get("join_in") or {}
        if prev and j == "cut" and ji.get("meaning") not in (None, "shock", "chapter"):
            W.append(f"{b}: a hard cut means 'shock' or a chapter boundary (D-112); for '{ji.get('meaning')}' use the join that carries it (CINEMA_PLAN B7)")
        if prev and j in ("iris",) and ji.get("at") and not (isinstance(ji["at"], list) and len(ji["at"]) == 2):
            E.append(f"{b}: join 'iris' needs 'at' as [x, y] in screen pixels")
        if prev:
            joins.append(j or "default")
        kinds_seq.append(sc.get("template") or sc.get("blueprint") or k)
        prev = b
    if upgrades and ceiling:
        W.append(f"{len(upgrades)} template beat(s) drawn instead (the mix is a ceiling for templates in this run): {', '.join(upgrades[:12])}")
    elif upgrades:
        cap = max(1, int(len(beats) * 0.25))
        if len(upgrades) > cap:
            E.append(f"{len(upgrades)} template beats upgraded to drawn scenes ({', '.join(upgrades[:12])}); at most {cap} (25 % of beats)")
        else:
            W.append(f"{len(upgrades)} template beat(s) drawn instead, with a reason: {', '.join(upgrades)}")
    if joins:
        top = max(set(joins), key=joins.count)
        if len(joins) >= 6 and joins.count(top) / len(joins) > 0.8:
            W.append(f"{joins.count(top)}/{len(joins)} joins are '{top}': vary the joins (continue/travel/zoom/canvas/iris/wipe/dip/fade, or material joins torn/page/scroll/motif/handoff/fill)")
    for i in range(2, len(kinds_seq)):
        if kinds_seq[i] == kinds_seq[i - 1] == kinds_seq[i - 2]:
            W.append(f"three consecutive beats use '{kinds_seq[i]}' ({beats[i - 2]}..{beats[i]})")
    from ..story import story_warnings          # visual storytelling: notes, never rules (D-62, D-64, D-67)
    brief = read_json(project.path("plan/brief.json"), {}) or {}
    from ..genre import of as _kind_of   # the kind as the engine reads it ("auto" too, D-191)
    genre = brief.get("genre") or _kind_of(project)
    W += story_warnings(sb, beats, genre=genre, look=brief.get("look"))
    from ..options import validate as _alts        # options: each alternative must be a real treatment (D-70)
    E += _alts(sb)
    # film defects every gate above passed (five-bench post-mortem, 2026-10-07): framing the runtime ignores, keeps
    # nothing can provide, one template for a whole lesson, a hybrid with no motion, avatar props nobody draws,
    # placeholder text, one person with two looks
    fe += SB.framing_errors(sb)
    ke, kw = SB.keep_checks(project, sb, beats)
    fe += ke; W += kw
    W += SB.carry_warnings(project, sb, beats)      # a new section carries little (D-182)
    from ..direction import storyboard_warnings as _direction_warnings
    W += _direction_warnings(project, sb)           # the style's strong calls planned for (D-189, L-474): notes, never rules
    from ..essence import storyboard_warnings as _essence_warnings
    W += _essence_warnings(project, sb)             # a distinct style kept to its own vocabulary (D-192): a note, never a rule
    ve, vw = SB.variety_checks(sb, beats, alloc)
    fe += ve; W += vw
    we, ww = SB.world_checks(sb, beats)            # one world (R-46)
    fe += we; W += ww
    fe += SB.cast_errors(project, sb)
    fe, fw = _ratchet(project, "storyboard", fe)
    E += fe; W += fw
    de, dw = _plan_checks(sb, beats)
    E += de; W += dw
    return E, W


def _plan_checks(sb: dict, beats: list) -> tuple[list, list]:
    """D-112 (TED-Ed study, 96 films): a lesson is planned as a few devices reused, one value script, and one accent
    per beat on the thing the narration names. Missing plans are warnings (old lessons stay valid); a plan that
    points at beats that do not exist is an error."""
    E, W = [], []
    known = set(beats)
    devs = sb.get("devices") or []
    if not devs:
        W.append("no device set: declare 3 to 5 devices reused across beats plus one join material (storyboard.devices, D-112)")
    elif not 3 <= len(devs) <= 6:
        W.append(f"{len(devs)} devices: TED-Ed films are built from about 3 to 5 devices reused, not one per beat (D-112)")
    for d in devs:
        bad = [x for x in d.get("beats") or [] if x not in known]
        if bad:
            E.append(f"device '{d.get('id')}' lists unknown beats {bad}")
    vs = sb.get("value_script") or []
    if not vs:
        W.append("no value script: declare the lesson's value band and where it breaks for meaning (storyboard.value_script, D-112)")
    for v in vs:
        if v.get("from") not in known:
            E.append(f"value_script entry from '{v.get('from')}' is not a beat")
    order = [v.get("from") for v in vs if v.get("from") in known]
    if order != sorted(order, key=beats.index):
        E.append("value_script entries must follow beat order")
    scenes = sb.get("scenes") or []
    missing = [s["beat"] for s in scenes if not s.get("accent_on")]
    if scenes and len(missing) > len(scenes) / 2:
        W.append(f"{len(missing)}/{len(scenes)} scenes have no accent_on: name the element the one accent goes on (D-112)")
    return E, W


def _resolve_cast(sb: dict, props: dict) -> dict:
    """A person prop may name a cast member (`cast: "Priya"`) instead of repeating the look: validate it with the cast's
    member, name and cloth filled in (the runtime resolves the same reference when it draws)."""
    cast = SB.cast_of(sb)
    if not cast or "cast" not in json.dumps(props):
        return props
    out = json.loads(json.dumps(props))
    for d in [out] + [v for v in out.values() if isinstance(v, dict)]:
        ref = d.get("cast") if isinstance(d, dict) else None
        c = cast.get(str(ref).lower().split()[0]) if ref else None
        if c:
            d.setdefault("member", c.get("member"))
            d.setdefault("name", c.get("name"))
            if c.get("cloth"):
                d.setdefault("cloth", c.get("cloth"))
            d.pop("cast", None)
    return out


# an option's own letter prefix: "A:", "B.", "C)", "(D)", "A -", "Option A:" (the quiz templates draw A to D, L-337)
OPTION_LETTER = re.compile(r"\s*(?:option\s+)?\(?[A-Da-d]\s*(?:[:.)]|\)\s*[:.]?|\s-)\s", re.I)


def _opt_words(o: dict) -> str:
    """An option's words as a reader sees them: spacing does not make two options differ."""
    return " ".join(str(o.get("text", "")).split())


def _props_errors(schema: dict, props: dict, path: str = "props", root: dict | None = None) -> list[str]:
    errs = []
    if isinstance(props, dict) and props.get("empty") is True:
        return errs                     # a deliberately empty slot ({"empty": true}): no text is required in it
    root = props if root is None else root
    for k, spec in schema.items():
        v = props.get(k)
        if spec.get("required") and (v is None or v == "" or v == []):
            errs.append(f"{path}.{k} is required")
            continue
        if v is None:
            continue
        t = spec.get("type")
        for dep in ([spec["requires"]] if isinstance(spec.get("requires"), str) else spec.get("requires") or []):
            if props.get(dep) is None:
                errs.append(f"{path}.{k} is ignored unless {path}.{dep} is also set")
        if t in ("str", "anchor") and not isinstance(v, str):
            errs.append(f"{path}.{k} must be a string")
        if t == "str" and isinstance(v, str) and spec.get("max_words") and len(v.split()) > spec["max_words"]:
            errs.append(f"{path}.{k} has {len(v.split())} words (max {spec['max_words']})")
        if t in ("str", "anchor") and isinstance(v, str) and DASHES.search(v):
            errs.append(f"{path}.{k} contains an em/en dash")
        if t == "enum" and v not in spec.get("choices", []):
            errs.append(f"{path}.{k} = {v!r} not in {spec.get('choices')}")
        if t == "number" and not isinstance(v, (int, float)):
            errs.append(f"{path}.{k} must be a number")
        if t == "int" and (not isinstance(v, int) or isinstance(v, bool)):
            errs.append(f"{path}.{k} must be a whole number")
        elif t == "int" and spec.get("index_of"):
            # an index into a list prop counts from 0: storyboards wrote quiz answers counting from 1 in three lessons
            # (2026-10-08: no option marked, "Why not B?" on screen while the narration said B, L-321)
            of = root.get(spec["index_of"]) if isinstance(root, dict) else None
            if isinstance(of, list) and not 0 <= v < len(of):
                errs.append(f"{path}.{k} = {v} is not one of props.{spec['index_of']}: it counts from 0, so its "
                            f"{len(of)} item(s) are 0 to {len(of) - 1}")
            for other in spec.get("not") or []:
                if props.get(other) is not None and props.get(other) == v:
                    errs.append(f"{path}.{k} = {v} is the same item as {path}.{other}")
        if t == "list":
            if not isinstance(v, list):
                errs.append(f"{path}.{k} must be a list"); continue
            if spec.get("min") and len(v) < spec["min"]:
                errs.append(f"{path}.{k} needs >= {spec['min']} items")
            if spec.get("max") and len(v) > spec["max"]:
                errs.append(f"{path}.{k} allows <= {spec['max']} items (cognitive budget)")
            for i, it in enumerate(v):
                if isinstance(it, dict) and spec.get("of"):
                    errs += _props_errors(spec["of"], it, f"{path}.{k}[{i}]", root)
                # the quiz templates draw each option's letter themselves: "A: Be more organised" showed "A  A: Be more
                # organised" on screen (feedback-relay-v2 b13, L-337)
                if k == "options" and isinstance(it, dict) and isinstance(it.get("text"), str) and OPTION_LETTER.match(it["text"]):
                    errs.append(f"{path}.{k}[{i}].text starts with a letter (\"{it['text'][:12]}\"): the template draws A to D "
                                "itself, so write the option's words only")
        if t == "obj" and isinstance(v, dict) and spec.get("of"):
            errs += _props_errors(spec["of"], v, f"{path}.{k}", root)
    return errs


# ------------------------------------------------------------------ scenes
BANNED_JS = [(re.compile(r"\bMath\.random\b"), "Math.random (use Loom.rng(seed))"), (re.compile(r"\bDate\.now\b|new Date\b"), "wall-clock time"),
             (re.compile(r"\bsetTimeout\b|\bsetInterval\b|requestAnimationFrame"), "timers/rAF (use tweens at cue times)"),
             (re.compile(r"\bfetch\(|XMLHttpRequest"), "network access"), (re.compile(r"repeat\s*:\s*-1"), "infinite repeat")]
HEX = re.compile(r"""["'`]#[0-9a-fA-F]{3,8}["'`]""")


def check_scenes(project):
    sb = read_json(project.path("plan/storyboard.json"))
    E, W = [], []
    fe = []
    vocab = None
    for sc in sb["scenes"]:
        if sc["kind"] == "bespoke":
            name = sc.get("scene") or sc["beat"]
            f = project.path(f"scenes/{name}.js")
            if not f.exists():
                E.append(f"{sc['beat']}: scenes/{name}.js is missing"); continue
            src = f.read_text(encoding="utf-8")
            code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", src)
            if f'Loom.scene("{name}"' not in src and f"Loom.scene('{name}'" not in src:
                E.append(f"{name}.js must register Loom.scene(\"{name}\", {{ build(ctx, props) {{ ... }} }})")
            for rx, why in BANNED_JS:
                if rx.search(code):
                    E.append(f"{name}.js: {why} breaks determinism")
            if HEX.search(code):
                E.append(f"{name}.js: literal hex colour; use style tokens (ctx.c('accent'))")
            if "ctx.cue(" not in code and ".cue(" not in code:
                E.append(f"{name}.js never calls ctx.cue(): reveals must land on spoken words")
            # compose resolves cue anchors by reading string LITERALS out of the scene source; a cue passed
            # through a variable (ctx.cue(c.cue)) is invisible to it and fails only at render time
            dyn = re.findall(r"\bctx\.(?:cue|has)\(\s*(?![\"'`\s])([^)]{1,40})\)", code)
            if dyn:
                E.append(f"{name}.js: ctx.cue() needs a string literal so compose can resolve it; got cue({dyn[0].strip()})")
            from ..library import scene_forms
            tags, uses, bad = scene_forms(src)
            for b in bad:
                E.append(f"{name}.js: malformed form tag `{b}`; use `// @form snake_id: one-line idea`")
            known = set((read_json(ENGINE_ROOT / "runtime/catalog.json", {}) or {}).get("components", {}))
            for u in sorted(uses - known):
                E.append(f"{name}.js: ctx.use(\"{u}\") but no such component (see the Components section of runtime/catalog.md)")
            if not tags and not uses:
                W.append(f"{name}.js: no `// @form id: idea` tags; tag the small elements you build so the library can count them")
            if re.search(r"\bduration\s*:\s*\d", code):
                W.append(f"{name}.js: a literal duration; prefer style durations (ctx.style.dur('enter'))")
            he_, hw_ = _held_errors(project, sb, sc, code)
            fe += [f"{name}.js: {m}" for m in he_]
            W += [f"{name}.js: {m}" for m in hw_]
            if vocab is None:
                from .text_audit import lesson_vocabulary
                vocab = lesson_vocabulary(project)
            from .text_audit import scene_literal_leaks
            fe += [f"{name}.js: writes words the lesson never uses {lk['words']}: \"{lk['text'][:70]}\". Every word on screen comes "
                   "from this beat's narration, the storyboard or the knowledge sheet; a fallback never invents a detail"
                   for lk in scene_literal_leaks(src, vocab)]
        if sc["kind"] == "skia":
            from .manim_colours import check_file as _colours
            f = project.path((sc.get("skia") or {}).get("file") or f"scenes/{sc['beat']}_skia.py")
            if not f.exists():
                E.append(f"{sc['beat']}: {f.name} missing (the skia.file of this scene)")
            else:
                E += [f"{sc['beat']}: {e}" for e in _colours(f, dialect="skia")]
        if sc["kind"] == "page":
            from ..page_bridge import scene_file as _page_file, lint_scene as _page_lint
            f = _page_file(project, sc)
            if not f.exists():
                E.append(f"{sc['beat']}: {f.name} missing (the page.file of this scene)")
            else:
                E += [f"{sc['beat']}: {e}" for e in _page_lint(f.read_text(encoding="utf-8"), f.name)]
        if sc["kind"] == "three":
            from ..three_bridge import scene_file as _three_file
            f = _three_file(project, sc)
            if not f.exists():
                E.append(f"{sc['beat']}: {f.name} missing (the three.file of this scene)")
            else:
                code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", f.read_text(encoding="utf-8"))
                for rx, why in BANNED_JS:
                    if rx.search(code):
                        E.append(f"{f.name}: {why} breaks determinism")
                if HEX.search(code) or re.search(r"\b0x[0-9a-fA-F]{6}\b", code):
                    E.append(f"{f.name}: literal colour; use ctx.c('token') so style and brand apply")
        if sc["kind"] == "manim":
            from ..manim_bridge import scene_source
            from .manim_colours import check_file as _manim_colours
            f = scene_source(project, sc)
            if not f.exists():
                E.append(f"{sc['beat']}: {f.name} missing (scenes/{sc['beat']}.py, or give manim.blueprint)")
            else:
                # a fixed colour ignores the style and the brand, and escapes the clip store's read record (D-40)
                E += [f"{sc['beat']}: {e}" for e in _manim_colours(f)]
    fe += _scene_cast_errors(project, sb)
    # the lesson kit (2026-10-08): the parts the storyboard declares exist and are deterministic and token-only
    from .kit import kit_errors
    KE, KW = kit_errors(project)
    E += KE
    W += KW
    fe, fw = _ratchet(project, "scenes", fe)
    return E + fe, W + fw


def _held_errors(project, sb: dict, sc: dict, code: str) -> tuple[list[str], list[str]]:
    """ctx.held("x") in a scene file: the previous beat, on the same station, must be able to provide x (where its
    names are knowable: a template's own elements, a scene file, or a bespoke design's element list). Returns (errors,
    warnings): a name that differs only in case is a warning, as at runtime (held_name_case)."""
    names = re.findall(r"""ctx\.held\(\s*["']([\w\-]+)["']\s*\)""", code)
    if not names:
        return [], []
    script = read_json(project.path("plan/script.json"), {"beats": []})
    order = [b["id"] for b in script.get("beats") or []]
    by = {s["beat"]: s for s in sb.get("scenes") or []}
    i = order.index(sc["beat"]) if sc["beat"] in order else -1
    prev = by.get(order[i - 1]) if i > 0 else None
    if prev is None:
        return [f"ctx.held({names[0]!r}) on the first beat: nothing came before it"], []
    if prev.get("station") != sc.get("station"):
        return [f"ctx.held({names[0]!r}) but the previous beat {prev['beat']} is on station '{prev.get('station')}' (held_needs_same_station)"], []
    have = SB.provided(project, prev)
    if have is None:
        return [], []
    have = have + [re.escape(k) for k in prev.get("keep") or []]
    miss = [n for n in names if not SB._has(have, n)]
    case = [n for n in miss if any(re.fullmatch(h, n, re.I) for h in have)]
    miss = [n for n in miss if n not in case]
    E = [f"ctx.held({miss}) but the previous beat {prev['beat']} draws no element of that name (held_missing): take only "
         "what it really drew, or draw it yourself; never invent a fallback with new facts"] if miss else []
    drawn = sorted({re.sub(r"\\(.)", r"\1", h) for h in have for n in case if re.fullmatch(h, n, re.I)})
    W = [f"ctx.held({case}): the previous beat {prev['beat']} draws {drawn} (the names differ only in case; the runtime takes "
         "them, held_name_case): use the same name"] if case else []
    return E, W


def _scene_cast_errors(project, sb: dict) -> list[str]:
    """One person, one look, across the scene files (each message names the file, so its worker sees it)."""
    return SB.cast_errors(project, sb, scope="scenes")


GATES = {"brief": check_brief, "knowledge": check_knowledge, "pedagogy": check_pedagogy, "persona": check_persona,
         "script": check_script, "storyboard": check_storyboard, "scenes": check_scenes}
