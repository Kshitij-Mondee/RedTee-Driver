"""The defect router (parity plan, 2026-10-06): every problem found after an agent finished goes back to the agent
that made it, instead of ending the run.

Sources: the check stage (the runtime probe's structured errors, the HyperFrames sampling pass, the film checks,
compose), the picture critic, and findings agents report about someone else's work (`report_finding` with a
`fix_route`). Owners:
- `storyboard`: anything in a template, blueprint or avatar beat that its props, keeps or joins decide (text that
  does not fit, a held element that is not there, a missing icon, an empty frame, a cut word, an anchor);
- `kit`: anything raised while a lesson kit part draws (the runtime names the part), and what scene workers report
  with `fix_route: "kit"`: the kit's author fixes scenes/_kit.js once for every beat that uses the part (R-35, L-326);
- `scene`: anything inside a bespoke beat (the worker who wrote that file);
- `script`: narration problems other agents report;
- `engine`: faults no model can fix with valid inputs (a template's own padding or contrast, a template that
  throws, sample text). They are reported for a person and never sent to a model.
Unlocated problems (no beat) go to `engine` too, with the reason, so nothing is dropped silently.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from ..util import read_json

OWNERS = ("script", "storyboard", "kit", "scene", "engine")
# the template's own geometry or colours, or the sample-text audit: valid props cannot fix these. A blurred beat
# (the backplate blur left on) and pixels from another beat (a leftover, a seam) are the runtime's compositing, not
# any author's file (checks of 2026-10-07)
ENGINE_CODES = {"tight_inset", "sample_text", "contrast_aa_failure", "unknown_template", "unknown_blueprint", "unknown_scene_kind",
                "blurred_beat", "foreign_pixels", "element_records",
                # a caption cue held too briefly (2026-10-15, D-170): compose times the cues from the narration, so no
                # scene, kit or storyboard author can change it
                "caption_hold"}
# drawn by whoever wrote the beat: the engine's in a template, the scene author's in a bespoke beat (L-336)
OWN_GEOMETRY_CODES = {"tight_inset", "contrast_aa_failure"}
# what the storyboard decides even on a bespoke beat: the camera framing (shot.focus/zoom on a frame-layout beat, a
# nested station's own w/h) and the presenter's props. Never sent to a scene author, who cannot change them.
STORYBOARD_CODES = {"shot_framing_ignored", "station_size_ignored", "avatar_props_unknown"}
# a figure cut by the frame or an element off the frame: the storyboard's framing for template beats, the scene's
# own layout for bespoke ones (the default kind rule below does exactly that)
FRAMING_CODES = {"rows.off", "element_off_frame", "figure_cropped", "words_cut"}
KNOWN_CODES = ENGINE_CODES | {"shot_framing_ignored", "station_size_ignored", "avatar_props_unknown"} | FRAMING_CODES | {"scene_threw", "tween_threw"}
# the scene's own code threw: always its author's (a template that throws is the engine's)
THROW_CODES = {"scene_threw", "tween_threw"}
# a beat that removed, at load, what an earlier beat drew in an element it holds (runtime/world.js auditHeld, L-372)
HELD_EDIT_CODES = {"held_content_removed"}
TEMPLATE_KINDS = ("template", "blueprint", "redtee", "avatar")
BEAT_RE = re.compile(r"\b(b\d{2,3})\b")


def _kinds(project) -> dict:
    sb = read_json(project.path("plan/storyboard.json"), {"scenes": []})
    return {s["beat"]: s for s in sb.get("scenes") or [] if s.get("beat")}


def _kit_parts(project) -> set:
    """The parts scenes/_kit.js defines (`Loom.lesson.<id> =` or `Loom.lesson["<id>"] =`); empty without a kit."""
    f = project.path("scenes/_kit.js")
    if not f.exists():
        return set()
    src = f.read_text(encoding="utf-8", errors="replace")
    return set(re.findall(r"Loom\.lesson\.([A-Za-z_]\w*)\s*=", src)) | set(re.findall(r"Loom\.lesson\[\s*[\"'](\w+)[\"']\s*\]\s*=", src))


BEAT_ALL_RE = re.compile(r"\b(b\d{2,3})\b")


def _kit_words(project) -> set:
    """The lower-case words of the kit's own string literals (scenes/_kit.js): text a kit part writes on screen."""
    f = project.path("scenes/_kit.js")
    if not f.exists():
        return set()
    from ..checks.text_audit import js_strings
    out = set()
    for text, _ in js_strings(f.read_text(encoding="utf-8", errors="replace")):
        out |= {w.lower() for w in re.findall(r"[A-Za-z0-9][A-Za-z0-9'.-]*", text)}
    return out


def _beat_at(manifest: dict, t: float) -> str | None:
    for b in manifest.get("beats") or []:
        if b.get("start", 0) <= t < b.get("end", 0):
            return b["id"]
    return None


def _beat_contains(manifest: dict, beat: str, t: float) -> bool:
    """Is t inside the beat's own window (its start to its end, plus the join out of it)?"""
    b = next((x for x in manifest.get("beats") or [] if x.get("id") == beat), None)
    return bool(b) and b.get("start", 0) <= t < b.get("end", 0) + 0.5


def owner_of(code: str, beat: str | None, scenes: dict, msg: str = "") -> str:
    # a bespoke scene draws its own cards and colours: its tight inset or its contrast failure is its author's, not the
    # engine's (ENGINE_CODES means a TEMPLATE's own geometry; feedback-relay-v2's b10 label at 5.1 px went to "a person")
    if code in OWN_GEOMETRY_CODES and beat in scenes and scenes[beat].get("kind") == "bespoke":
        return "scene"
    if code in ENGINE_CODES:
        return "engine"
    if code in ("station_size_ignored",) and not beat:
        return "storyboard"         # a station, not a beat: the storyboard declared its size
    if not beat or beat not in scenes:
        return "engine"
    sc = scenes[beat]
    kind = sc.get("kind")
    if code in STORYBOARD_CODES:
        return "storyboard"
    if code in THROW_CODES:
        return "scene" if kind == "bespoke" else "engine"
    if code in HELD_EDIT_CODES:
        # the beat that edited a held element at load wrote that in its own file (L-372)
        return "scene" if kind == "bespoke" else "engine"
    if code in ("held_missing", "held_needs_same_station"):
        # the storyboard decides what is kept across a join (`keep`); a bespoke scene that asks for an element by
        # itself made the mistake in its own file
        m = re.search(r'"([^"]+)"', msg)
        if kind == "bespoke" and not (m and m.group(1) in (sc.get("keep") or [])):
            return "scene"
        return "storyboard"
    if code in FRAMING_CODES and kind == "bespoke":
        # a crop the beat's own shot makes (focus or zoom over content laid out for the whole frame, RC11) is the
        # storyboard's; one in the scene's own layout is the scene's
        sh = sc.get("shot") or {}
        return "storyboard" if (sh.get("focus") or (sh.get("zoom") not in (None, 1, 1.0))) else "scene"
    if kind == "bespoke":
        return "scene"
    if kind in TEMPLATE_KINDS:
        return "engine" if code == "scene_threw" else "storyboard"
    if kind == "three" and (sc.get("three") or {}).get("preset"):
        # a preset beat (D-140) is params on a ready scene: its device, screen, words, times and mood are the
        # storyboard's (patch_storyboard, or py -m loom device); a throw inside the preset itself is the engine's
        return "engine" if code in THROW_CODES else "storyboard"
    return "engine"        # manim, skia, three, media: authored outside the API path


# a check line's code, from what it says (film errors start with their beat: "b05: blurred_beat: ...", so the first word
# is no code; before 2026-10-07 every one of them fell to "check" and nobody owned it)
_CHECK_CODES = (("blurred_beat", "blurred_beat"), ("foreign pixels", "foreign_pixels"), ("words cut by the frame edge", "words_cut"),
                ("lesson_vocabulary", "lesson_vocabulary"), ("empty frame", "empty_frame"), ("element records", "element_records"),
                ("caption_hold:", "caption_hold"), ("caption hold: 0 caption cues", "caption_hold"))


def check_code(s: str) -> str:
    lead = re.match(r"([a-z][\w.]*)\s*[:@ ]", s)
    if lead and lead.group(1) in KNOWN_CODES:
        return lead.group(1)
    if s.startswith("compose:"):
        return "compose"
    if ": off frame at" in s:
        return "figure_cropped" if re.search(r"character '[^']*' cropped", s) else "element_off_frame"
    for needle, code in _CHECK_CODES:
        if needle in s:
            return code
    return "check"


def collect(project) -> list[dict]:
    """Every error of the last check, as {code, beat, detail}; the probe's own records first (they carry the beat)."""
    out = []
    pr = read_json(project.path("qa/probe.json"), {}) or {}
    for e in pr.get("errors") or []:
        msg = str(e.get("msg") or "")
        beat = e.get("beat") or (BEAT_RE.match(msg).group(1) if BEAT_RE.match(msg) else None)
        out.append({"code": e.get("code") or "runtime", "beat": beat, "detail": msg[:300], "source": "probe", "part": e.get("part")})
    rep = read_json(project.path("qa/report.json"), {}) or {}
    man = read_json(project.path("build/manifest.json"), {}) or {}
    for line in rep.get("errors") or []:
        s = str(line)
        if s.startswith("runtime "):
            continue                     # already taken from the probe, with its beat
        # "hf ..." from HyperFrames' check, "lc ..." from Loom's own layout and contrast audits (qa.lc_lines)
        m = re.match(r"(hf|lc) (\w+) (\w+) @ ([\d.]+): (.*)", s)
        if m:
            bm = BEAT_RE.match(m.group(5)) if m.group(1) == "lc" else None
            named, at = (bm.group(1) if bm else None), _beat_at(man, float(m.group(4)))
            detail = f"at {m.group(4)} s: {m.group(5)[:240]}"
            # an lc line names the beat that DREW the element; when the defect happens in a later beat that holds it, that
            # beat set its state or drew over it and only it can fix it (https-private-relay run 2c: seven errors on the
            # board's pieces at 48 and 77 s went to b01 until it ran out of rounds, 2026-10-12; the L-418 class)
            order = [x.get("id") for x in man.get("beats") or []]
            if (named and at and at != named and named in order and at in order and order.index(at) > order.index(named)
                    and not _beat_contains(man, named, float(m.group(4)))):
                detail += f" (an element {named} drew and {at} holds: {at} changes its state or draws over it)"
                named = at
            out.append({"code": m.group(3), "beat": named or at, "detail": detail, "source": m.group(1)})
            continue
        if s.startswith("sample_text:"):
            out.append({"code": "sample_text", "beat": (BEAT_RE.search(s) or [None, None])[1], "detail": s[13:300], "source": "check"})
            continue
        code = check_code(s)
        bm = BEAT_RE.search(s)
        out.append({"code": code, "beat": bm.group(1) if bm else None, "detail": s[:300], "source": "check"})
    return out


def route(project, critic: list | None = None, reported: list | None = None) -> dict:
    """Group defects by owner, then by beat; repeats of the same problem are counted, not listed again (one scene
    sampled 80 times is one defect)."""
    scenes = _kinds(project)
    groups: dict = {o: {} for o in OWNERS}

    def add(owner, beat, code, detail, source):
        key = beat or "-"
        bucket = groups[owner].setdefault(key, {})
        k = (code, detail[:90])
        if k in bucket:
            bucket[k]["count"] += 1
        else:
            bucket[k] = {"beat": beat, "code": code, "detail": detail, "source": source, "count": 1}

    kit_parts = _kit_parts(project)
    kit_words = _kit_words(project)
    kit_said: set = set()
    for d in collect(project):
        if d.get("part") and d["part"] in kit_parts:
            # raised while a kit part drew: the kit's, whatever the code (a template's tight inset is the engine's, a
            # kit's own card is not). A helper a scene hung on Loom.lesson itself is that scene's (L-346)
            add("kit", d["beat"], d["code"], f"part {d['part']}: {d['detail']}", d["source"])
            continue
        if d["code"] == "lesson_vocabulary" and kit_words:
            # invented words the kit's own code writes (https-private-relay: "alex", "oak7", "Signed in" on 7 beats whose
            # fixers cannot change the kit): the kit's, once, not every beat's that shows the part (L-417)
            words = [w.strip(" '\"").lower() for w in (re.search(r"\[([^\]]*)\]", d["detail"]) or [None, ""])[1].split(",") if w.strip(" '\"")]
            if words and all(w in kit_words for w in words):
                key = tuple(sorted(words))
                if key not in kit_said:
                    kit_said.add(key)
                    add("kit", d["beat"], d["code"], f"the kit's own text (seen first in {d['beat']}): {d['detail']}", d["source"])
                continue
        if d["code"] in ("line_into_object", "line_through_text"):
            # a line of one beat into an element of another (https-private-relay: b12's path into b11's lingering packet,
            # sent to b12 twice): each bespoke beat named owns its half, the line or the element that lingers (L-418)
            named = list(dict.fromkeys(BEAT_ALL_RE.findall(d["detail"]))) or [d["beat"]]
            owners = [b for b in named if (scenes.get(b) or {}).get("kind") == "bespoke"]
            if len(owners) > 1:
                for b in owners:
                    add("scene", b, d["code"], d["detail"] + f" [{b} owns one of the two: its line, or its element still on screen]", d["source"])
                continue
        if d["code"] == "foreign_pixels":
            # pixels of another beat on screen: the beat that drew them left an element up (or brought one in early); when the
            # measure names it, that beat's author fixes it. "beats not separable" stays the engine's, for a person (L-421)
            m = re.search(r"\(from ([^;]+);", d["detail"])
            src = [b for b in BEAT_ALL_RE.findall(m.group(1)) if (scenes.get(b) or {}).get("kind") == "bespoke"] if m else []
            if src:
                for b in dict.fromkeys(src):
                    add("scene", b, d["code"], d["detail"] + f" [its pixels are {b}'s: an element of {b} outlived {b} or came in early]",
                        d["source"])
                continue
        add(owner_of(d["code"], d["beat"], scenes, d["detail"]), d["beat"], d["code"], d["detail"], d["source"])
    for f in critic or []:
        # every finding goes to its owner, minors too (D-143, Kshitij 2026-10-08: "fix every single issue"; D-119 sent
        # blocker and major only, and R-35's three minors stayed on screen)
        b = f.get("beat")
        kind = (scenes.get(b) or {}).get("kind")
        o = "scene" if kind == "bespoke" else "storyboard" if kind in TEMPLATE_KINDS else "engine"
        sev = f.get("severity") or "major"
        add(o, b, "critic", f"[{sev}] {f.get('problem')} (suggested fix: {f.get('fix')})", "critic")
    for f in reported or []:
        o = {"storyboard": "storyboard", "scene": "scene", "script": "script", "kit": "kit"}.get(f.get("fix_route"))
        if not o:
            continue
        add(o, f.get("beat"), "reported", f"{f.get('what')} (reported by {f.get('by')})", "agent")
    return {o: {b: list(v.values()) for b, v in g.items()} for o, g in groups.items()}


def count(routed: dict, owner: str) -> int:
    return sum(len(v) for v in routed.get(owner, {}).values())


def fix_message(owner: str, items: list[dict], source: str) -> str:
    lines = [f"- {d['beat'] or '(no beat)'} [{d['code']}{' x' + str(d['count']) if d['count'] > 1 else ''}]: {d['detail']}" for d in items]
    head = f"FIX REQUEST from the {source}. Your accepted work has these defects. Change ONLY what they name; keep everything else as it is."
    how = {
        "storyboard": ("How: text that does not fit or is cut: first look for a framing cause, then the words. Framing causes: "
                       "shot.focus or zoom on a template, blueprint or avatar beat (they lay out in the whole frame: drop "
                       "focus/zoom), a nested station that declares its own w/h (drop them; rect sets its size), or held "
                       "elements still on screen under a new focus (keep less, or frame the whole station). Otherwise: shorter "
                       "words, or a template with room for them. A held element "
                       "that is not there: drop it from `keep`, or keep one the previous scene really has. A missing icon: an icon "
                       "the style bundles, or none. An empty frame while the voice speaks: give the beat something the words are "
                       "about. Use get_beat to read a scene, then call `patch_storyboard` with only the changed scenes (each "
                       "complete). Do not resubmit the whole storyboard."),
        "scene": ("How: fix your file for these problems, look at it with lab_snapshot(source, times) and read the runtime "
                  "errors it returns, then call `submit_scene` with the complete file. Words cut or an element off the "
                  "frame: keep your layout inside ctx.box (a held element keeps the place an earlier beat gave it). A "
                  "thrown scene: read the error; a held element that is missing is drawn from THIS beat's narration, never "
                  "with an invented detail. Words the lesson never uses (lesson_vocabulary): use the narration's words."),
        "script": ("How: fix the named beats, keeping every fact on the knowledge sheet, then call `patch_script` with only "
                   "the changed beats (each complete)."),
        "kit": ("How: each line names the kit part that raised it (`part <id>`) and a beat that drew it. Fix scenes/_kit.js "
                "so the part draws cleanly in every beat that composes it: colours are style tokens or \"none\", text sits "
                "inside its card with room, nothing reveals itself. Keep every part's name, its opts and the handle it returns, "
                "so the beats keep working unchanged. Then call `submit_kit` with the complete file and its API note."),
    }[owner]
    return "\n".join([head, "", *lines, "", how])


def new_reports(project, mark: Path) -> list[dict]:
    """Findings agents reported since the last routing (fix_route storyboard, scene, script or kit), read once."""
    f = project.path("logs/findings.jsonl")
    if not f.exists():
        return []
    lines = f.read_text(encoding="utf-8").splitlines()
    seen = int((read_json(mark, {}) or {}).get("lines", 0)) if mark.exists() else 0
    out = []
    for line in lines[seen:]:
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        if d.get("fix_route") in ("storyboard", "scene", "script", "kit") and d.get("by") != d.get("fix_route"):
            out.append(d)
    mark.parent.mkdir(parents=True, exist_ok=True)
    mark.write_text(json.dumps({"lines": len(lines)}), encoding="utf-8")
    return out
