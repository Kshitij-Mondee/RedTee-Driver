"""Each style's essence: what it is for, how it explains, its own techniques and what it must not borrow (D-192).

Kshitij (2026-10-16): "every video style is not just a different STYLE, but also should have different visualization
techniques and different foundations for explaining or teaching different stuff. They all can't just keep reusing the
same assets. For styles like whiteboard, engineering other simple ones it's fine. But for way different styles like
hologram, isometric, screencast, cinematic and kurz, these have very different styles and ways of showing things ...
we will also be recommending users what style to use after the user interview ... the storyboarding should also
understand what style is being used and boost the entire thing in its own way."

`packs/essence/<style>.json`, one per style pack:
  tier        "distinct" (its own vocabulary; borrowing the shared templates dilutes it) or "simple" (shared vocabulary fine)
  essence     one or two sentences: what the style IS
  explains_by the style's foundations for explaining (how this style makes an idea understood)
  techniques  its own ways of showing, each with when and how (real engine calls)
  vocabulary  its signature visual elements; avoid: what it must not borrow
  fits        topics and a 0..1 fit per kind of video (loom/genre.py), for the recommender
  mix         its native treatment mix (null: the classic mix)
It reaches the planners (Relay's script, outline, storyboard and critic tasks; Shuttle's P4, P5 and P10; get_style_pack's
`essence`, first) for every style, engine or not; the direction cards (D-189) stay the engine styles' extra detail. A
request's `mix: "auto"` (the default now) takes the style's native mix; "classic" and "cinema" stay the person's to pick.
`recommend` ranks the styles for an interview's answers by fit, never by one style being better than another (D-122).
"""
from __future__ import annotations

import re

from .util import ENGINE_ROOT, read_json

DIR = ENGINE_ROOT / "packs" / "essence"


def load(style_id: str | None) -> dict | None:
    if not style_id:
        return None
    f = DIR / f"{style_id}.json"
    return read_json(f, None) if f.exists() else None


def styles() -> list[str]:
    return sorted(p.stem for p in DIR.glob("*.json")) if DIR.exists() else []


def native_mix(style_id: str | None) -> dict | None:
    e = load(style_id)
    return dict(e["mix"]) if e and e.get("mix") else None


STAGE_LINES = {
    "script": "Write every visual_intent in this style's own way of showing (its techniques below), never as a generic slide.",
    "outline": "Plan the film in this style's way of explaining: pick, per section, the technique that carries it, and say why.",
    "storyboard": "Stage every beat with this style's own techniques and vocabulary; reach for a shared template only where "
                  "the style is 'simple', or where no technique of the style fits (say which).",
    "critic": "Judge whether each beat looks and explains like this style, or like a generic slide in its colours.",
}


def block(project, stage: str) -> str:
    """The style's essence as a prompt block for a stage ('' when the style has none)."""
    sid = (getattr(project, "request", None) or {}).get("style")
    e = load(sid)
    if not e:
        return ""
    out = [f"STYLE ESSENCE ({sid}, {e.get('tier')}): {e['essence']}"]
    if stage in STAGE_LINES:
        out.append(STAGE_LINES[stage])
    out.append("How this style explains: " + " ".join(e.get("explains_by") or []))
    tech = e.get("techniques") or []
    if tech:
        out.append("Its own techniques: " + "; ".join(f"{t['name']} ({t['use']}: {t['how']})" for t in tech) + ".")
    if e.get("vocabulary"):
        out.append("Its vocabulary: " + ", ".join(e["vocabulary"]) + ".")
    if e.get("avoid"):
        out.append("Never in this style: " + ", ".join(e["avoid"]) + ".")
    if e.get("screen_words"):
        out.append(f"Words on screen: labels, readings and counts, at most about {e['screen_words']} in a beat besides its title; "
                   "the narration says the rest.")
    if e.get("tier") == "distinct":
        out.append("This is a distinct style: what makes it worth choosing is its own way of showing. A beat that could be any "
                   "style's slide in these colours is a beat lost.")
    return "\n".join(out)


# ---------------------------------------------------------------- the recommender (after the interview)
def _words(s: str) -> set[str]:
    return set(re.findall(r"[a-z][a-z0-9-]+", (s or "").lower()))


def recommend(topic: str, kind: str | None = None, notes: str = "", n: int = 3) -> list[dict]:
    """Styles ranked by how well they fit this topic and kind of video: the topic's signals and fit topics, and the
    style's fit for the kind. Each with its reasons. A fit, never a ranking of styles against each other."""
    text = f"{topic} {notes}".lower()
    W = _words(text)
    if not kind:
        from .genre import infer
        kind = infer(topic, notes)[0]
    rows = []
    for sid in styles():
        e = load(sid) or {}
        sig = [s for s in e.get("signals") or [] if (s in text if " " in s else s in W)]
        topics = [t for t in (e.get("fits") or {}).get("topics") or [] if _words(t) & W - {"and", "the", "a", "of", "for"}]
        kfit = float(((e.get("fits") or {}).get("kinds") or {}).get(kind, 0.3))
        score = round(0.5 * kfit + 0.12 * min(4, len(sig)) + 0.1 * min(2, len(topics)), 3)
        why = [f"fits {'an' if kind[:1] in 'aeiou' else 'a'} {kind} ({kfit:.0%})"]
        if sig:
            why.append("the topic speaks its language (" + ", ".join(sig[:4]) + ")")
        if topics:
            why.append("made for " + "; ".join(topics[:2]))
        rows.append({"style": sid, "score": score, "tier": e.get("tier"), "essence": e.get("essence"), "why": why})
    rows.sort(key=lambda r: (-r["score"], r["style"]))
    return rows[:n]


TEMPLATE_SHARE = 0.3   # a distinct style whose storyboard puts more than this share of its beats on shared templates


def storyboard_warnings(project, sb: dict) -> list[str]:
    """A distinct style borrowing the shared vocabulary: `style_borrowed` when more than TEMPLATE_SHARE of the beats are
    catalog templates, blueprints or components restyled. A note for the planner and the critic, never an error."""
    e = load(sb.get("style") or (getattr(project, "request", None) or {}).get("style"))
    scenes = [s for s in sb.get("scenes") or [] if s.get("beat")]
    if not e or e.get("tier") != "distinct":
        return []
    W = []
    # a style that explains by showing keeps its words to labels (Kshitij, 2026-10-17: hologram and isometric "will be
    # mostly used to explain concepts and give examples ... No need to make them text heavy at all"): `screen_words` is
    # the most words a beat's template puts on screen besides its title (anchors and keys are not words on screen)
    budget = e.get("screen_words")
    if budget:
        def words(v, key=""):
            if isinstance(v, str):
                return 0 if key.startswith("say") or key in ("title", "kicker", "icon", "member", "who", "valence", "verdict", "stance", "mode", "kind", "setting", "marker", "tone", "cast", "align", "side", "variant", "emotion") else len(v.split())
            if isinstance(v, dict):
                return sum(words(x, k) for k, x in v.items())
            if isinstance(v, list):
                return sum(words(x, key) for x in v)
            return 0
        heavy = [(s["beat"], words(s.get("props") or {})) for s in scenes if s.get("kind") == "template"]
        heavy = [(b, n) for b, n in heavy if n > budget]
        if heavy:
            W.append(f"text_heavy: {', '.join(f'{b} ({n} words)' for b, n in heavy)} put more than {budget} words on screen besides "
                     f"the title. {e['id']} explains by showing a concept working and one example; its words are labels and "
                     f"readings: say the rest, and show it (packs/essence/{e['id']}.json)")
    if len(scenes) < 6:
        return W
    shared = [s["beat"] for s in scenes if s.get("kind") in ("template", "blueprint")]
    share = len(shared) / len(scenes)
    if share <= TEMPLATE_SHARE:
        return W
    names = ", ".join(t["name"] for t in (e.get("techniques") or [])[:4])
    return W + [f"style_borrowed: {len(shared)} of {len(scenes)} beats ({share:.0%}) are shared templates restyled in {e['id']}, a "
            f"distinct style whose worth is its own way of showing ({names}). Stage them with its techniques "
            f"(packs/essence/{e['id']}.json), or say in the beat why a template is the better picture"]


def scene_warnings(project, storyboard: dict) -> list[str]:
    """`scene_off_style`: a bespoke beat of a distinct style whose code calls none of the style's own techniques (its
    essence's `calls`): drawn from the shared kit alone, it could be any style's beat in these colours (Kshitij: "they all
    can't just keep reusing the same assets"). A note for the critic, never an error."""
    sid = (getattr(project, "request", None) or {}).get("style")
    e = load(sid)
    calls = (e or {}).get("calls") or []
    if not e or e.get("tier") != "distinct" or not calls:
        return []
    off = []
    kit = project.path("scenes/_kit.js")
    kit_code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", kit.read_text(encoding="utf-8")) if kit.exists() else ""
    kit_on_style = any(c in kit_code for c in calls)
    for s in storyboard.get("scenes") or []:
        if s.get("kind") != "bespoke":
            continue
        f = project.path(f"scenes/{s.get('scene') or s.get('beat')}.js")
        if not f.exists():
            continue
        code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", f.read_text(encoding="utf-8"))
        # a beat that drives the lesson kit, when the kit is built with the style's own calls, is on style
        if not any(c in code for c in calls) and not (kit_on_style and "Loom.lesson." in code):
            off.append(s.get("beat"))
    if not off:
        return []
    return [f"scene_off_style: {', '.join(off)} use none of {sid}'s own techniques ({', '.join(calls)}): drawn from the shared "
            f"kit alone, a beat could be any style's in these colours. Stage it with the style's way of showing "
            f"(packs/essence/{sid}.json)"]
