"""Storyboard checks from the five-bench post-mortem (2026-10-07): film defects every older gate passed.

Each function returns errors (and some warnings) for the storyboard gate (`gates.check_storyboard`), or for the
scenes gate where it reads scene files. They are written so that each can FAIL (tests/suites/pipeline_film_defects.py)
and each was run against the five bench storyboards and the finished lessons before it became an error.

- framing: a nested station's own w/h, and shot.focus/zoom on a beat the runtime lays out in the whole frame;
- keep: names no earlier element can provide (the runtime's `held_missing`), keeps across stations, and keeping a
  template's container without its contents (an empty husk);
- variety: one template id used too often, A-B-A-B ping-pong, a hybrid template with no motion layer;
- avatar props against the presenter's props spec; placeholder and meta text in props;
- cast continuity: one named person, one look (story.cast), across template props and scene files.
"""
from __future__ import annotations

import json
import math
import re
from functools import lru_cache
from pathlib import Path

from ..util import ENGINE_ROOT, read_json

W_, H_ = 1920, 1080
FRAME_LAYOUT = ("template", "blueprint", "redtee", "avatar")      # kinds the runtime lays out in the whole frame


# ------------------------------------------------------------------ the API path writes these kinds
def api_path_kind_errors(sb: dict) -> list[str]:
    """On the API path a beat whose kind no agent writes would be an empty beat: refuse it at the storyboard, with the
    kinds that are written (WS5, 2026-10-07: the card offered manim, skia and three while nothing wrote them)."""
    try:
        from ..agents.conductor import CLIP_WORKERS
    except Exception:   # noqa: BLE001
        CLIP_WORKERS = ()
    ok = ("template", "blueprint", "redtee", "avatar", "bespoke") + tuple(CLIP_WORKERS)
    return [f"{sc.get('beat')}: kind '{sc.get('kind')}' has no writer on the API path (written here: {', '.join(ok)}); choose one of "
            "those, or make this lesson in Cowork" for sc in sb.get("scenes") or [] if sc.get("kind") not in ok]


# ------------------------------------------------------------------ framing
def framing_errors(sb: dict) -> list[str]:
    E = []
    for s in (sb.get("world") or {}).get("stations") or []:
        if s.get("parent") and ((s.get("w") or W_) != W_ or (s.get("h") or H_) != H_):
            E.append(f"station {s['id']}: a nested station's own space is always one frame (1920x1080); its size inside "
                     f"'{s['parent']}' is rect.w/h. Drop w/h ({s.get('w')}x{s.get('h')}): the runtime ignores them "
                     "(station_size_ignored) and a layout written for them lands somewhere else")
    for sc in sb.get("scenes") or []:
        if sc.get("kind") not in FRAME_LAYOUT:
            continue
        shot = sc.get("shot") or {}
        z = shot.get("zoom")
        bad = (["focus " + json.dumps(shot["focus"])] if shot.get("focus") else []) + ([f"zoom {z}"] if z not in (None, 1, 1.0) else [])
        if bad:
            what = sc.get("template") or sc.get("blueprint") or sc["kind"]
            E.append(f"{sc['beat']}: shot {' and '.join(bad)} on a {sc['kind']} beat ({what}): a {sc['kind']} lays out in the "
                     "whole 1920x1080 frame and the runtime ignores focus and zoom on it (shot_framing_ignored). Drop "
                     "shot.focus/zoom here; to frame part of a picture, make the beat bespoke and draw inside the frame")
    return E


# ------------------------------------------------------------------ element names (what a beat can hand on to `keep`)
_REG = re.compile(r'Loom\.(template|blueprint)\(\s*"([^"]+)"')


def _arg0(src: str, i: int) -> str:
    """The first argument of a call whose '(' ends at i."""
    depth, j, q = 0, i, None
    while j < len(src):
        c = src[j]
        if q:
            if c == "\\":
                j += 2
                continue
            if c == q:
                q = None
        elif c in "\"'`":
            q = c
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            if depth == 0:
                return src[i:j]
            depth -= 1
        elif c == "," and depth == 0:
            return src[i:j]
        j += 1
    return src[i:j]


def _name_rx(expr: str) -> str:
    """A JS name expression as a regex: literals stay, anything computed becomes \\w+."""
    expr = expr.strip()
    if re.fullmatch(r'"[^"]*"|\'[^\']*\'', expr):
        return re.escape(expr[1:-1])
    m = re.fullmatch(r'[^?]+\?\s*"([\w\-]+)"\s*:\s*"([\w\-]+)"', expr)
    if m:
        return f"(?:{re.escape(m.group(1))}|{re.escape(m.group(2))})"
    if expr.startswith("`") and expr.endswith("`"):
        body, out, k = expr[1:-1], "", 0
        for mm in re.finditer(r"\$\{([^}]*)\}", body):
            out += re.escape(body[k:mm.start()])
            m2 = re.fullmatch(r'[^?]+\?\s*"([\w\-]+)"\s*:\s*"([\w\-]+)"', mm.group(1).strip())
            out += f"(?:{m2.group(1)}|{m2.group(2)})" if m2 else r"\w+"
            k = mm.end()
        return out + re.escape(body[k:])
    out = ""
    for p in re.split(r"\s*\+\s*", expr):
        out += re.escape(p[1:-1]) if re.fullmatch(r'"[^"]*"|\'[^\']*\'', p) else r"\w+"
    return re.sub(r"(\\w\+)+", r"\\w+", out)


def _els(block: str) -> list[tuple[str, str | None]]:
    out = []
    for m in re.finditer(r"ctx\.el\(", block):
        k = re.search(r'kind:\s*"(\w+)"', block[m.end():m.end() + 300])
        out.append((_name_rx(_arg0(block, m.end())), k.group(1) if k else None))
    if "H.header(" in block:
        out += [("kicker", "text"), ("title", "text")]
    return out


@lru_cache(maxsize=1)
def template_elements() -> dict:
    """{template or blueprint id: [(name regex, element kind)]}, read from the runtime's own source (the single
    truth; a catalogue list would drift). The presenter (kind avatar) is read from runtime/overlay.js."""
    res = {}
    for f in sorted((ENGINE_ROOT / "runtime/templates").glob("*.js")) + sorted((ENGINE_ROOT / "runtime/blueprints").glob("*.js")):
        src = f.read_text(encoding="utf-8")
        starts = [(m.start(), m.group(2)) for m in _REG.finditer(src)]
        for n, (s, tid) in enumerate(starts):
            e = starts[n + 1][0] if n + 1 < len(starts) else len(src)
            res[tid] = _els(src[s:e])
    ov = ENGINE_ROOT / "runtime/overlay.js"
    if ov.exists():
        src = ov.read_text(encoding="utf-8")
        i, j = src.find("Loom.presenter = {"), src.find("Loom.media = {")
        if i >= 0:
            res["avatar"] = _els(src[i:j if j > i else len(src)])
    return res


CONTAINER_KINDS = ("document", "panel")


def _scene_file(project, sc) -> Path | None:
    if project is None:
        return None
    f = project.path(f"scenes/{sc.get('scene') or sc['beat']}.js")
    return f if f.exists() else None


def _file_names(src: str) -> list[str]:
    """Every name a scene file could give an element. Scenes create elements through many helpers (ctx.el,
    ctx.character, Loom.place.*(ctx, name), Loom.obj.draw(ctx, name), ctx.use(.., {name}), ctx.held), so this is
    deliberately generous: any string literal in the code, and a literal ending in _ or - as a prefix. A first
    version read only ctx.el and friends and reported 20 held elements missing in finished lessons whose probe had
    none (2026-10-07): an instrument error, not a defect."""
    code = re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", "", src)
    out = set()
    for a, b in re.findall(r'"([^"\n]{1,60})"|\'([^\'\n]{1,60})\'', code):
        lit = a or b
        if re.fullmatch(r"[\w\-]+", lit):
            out.add(re.escape(lit) + (r"\w+" if lit.endswith(("_", "-")) else ""))
    for pre in re.findall(r"`([\w\-]+)\$\{", code):
        out.add(re.escape(pre) + r"\w+")
    return sorted(out)


def provided(project, sc) -> list[str] | None:
    """Name patterns an element of this scene may carry (None: cannot be known from here)."""
    k = sc.get("kind")
    if k in ("template", "blueprint", "avatar"):
        els = template_elements().get(sc.get("template") or sc.get("blueprint") or ("avatar" if k == "avatar" else ""))
        if els is None:
            return None
        # a template on a station whose previous beat drew a picture gets the runtime's backplate (world.js)
        return [n for n, _ in els] + (["template_backplate"] if k == "template" else [])
    if k == "bespoke":
        f = _scene_file(project, sc)
        if f:
            return _file_names(f.read_text(encoding="utf-8")) or None
        d = sc.get("design") or {}
        names = [str(e.get("name")) for e in d.get("elements") or [] if isinstance(e, dict) and e.get("name")]
        names += [str(r.get("element")) for r in d.get("beat_sheet") or [] if isinstance(r, dict) and r.get("element")]
        return [re.escape(n) for n in names] or None
    return None                                            # manim, media, redtee, skia, three: not known here


def _show(p: str) -> str:
    """A name regex as a reader sees it: right_item_N, left_panel|right_panel."""
    p = p.replace("\\w+", "N")
    p = re.sub(r"\(\?:([^)]*)\)", lambda m: m.group(1), p)
    return p.replace("\\", "")


def _has(pats: list[str], name: str) -> bool:
    return any(re.fullmatch(p, name) for p in pats)


def carry_warnings(project, sb: dict, beats: list[str]) -> list[str]:
    """A style whose pack sets board.carry (whiteboard, D-182): a scene that opens a new section keeping more than
    max_kept elements is warned at plan time. Kshitij, 2026-10-15: "You can carry text and designs over from previous
    frames/sections but not too many so there is enough place for new text and explanation. The rest gets wiped off at
    the end of the section." The render's check measures it (board_carry: share of the frame and words); this is the
    planner's early sight of it (film A opened its third section keeping 18 elements)."""
    from ..compose import load_style
    try:
        rule = ((load_style(sb.get("style")) or {}).get("board") or {}).get("carry") or {}
    except Exception:  # noqa: BLE001  (an unknown style is the gate's own error)
        return []
    mx = rule.get("max_kept")
    if not mx:
        return []
    script = read_json(project.path("plan/script.json"), {"beats": []})
    sec = {b["id"]: b.get("section") for b in script.get("beats") or []}
    by = {s["beat"]: s for s in sb.get("scenes") or [] if s.get("beat")}
    W = []
    for prev, b in zip(beats, beats[1:]):
        if sec.get(b) is None or sec.get(b) == sec.get(prev):
            continue
        keep = (by.get(b) or {}).get("keep") or []
        if len(keep) > mx:
            W.append(f"{b}: opens section {sec[b]} keeping {len(keep)} elements (at most {mx}): carry only what this section "
                     f"builds on and let the rest leave at the end of its section, so the new explanation has room (board.carry; "
                     f"the check measures it as board_carry)")
    return W


def keep_checks(project, sb: dict, beats: list[str]) -> tuple[list[str], list[str]]:
    """`keep` names elements of the PREVIOUS beat on the SAME station (runtime world.js ctx.held): an element that beat
    drew, or one it kept itself. Errors only where the previous beat's names are knowable."""
    E, W = [], []
    by = {s["beat"]: s for s in sb.get("scenes") or [] if s.get("beat")}
    order = [by[b] for b in beats if b in by]
    have: list[str] | None = None                   # what the previous scene can hand on (None: unknown)
    prev = None
    for sc in order:
        keep = [k for k in sc.get("keep") or [] if isinstance(k, str)]
        valid = []
        if keep:
            if prev is None:
                E.append(f"{sc['beat']}: keep {keep} on the first beat: there is no earlier beat to keep anything from")
            elif prev.get("station") != sc.get("station"):
                E.append(f"{sc['beat']}: keep {keep} but the previous beat {prev['beat']} is on station '{prev.get('station')}', not "
                         f"'{sc.get('station')}': kept elements stay where they are, so keep needs the same station (held_needs_same_station)")
            elif have is not None:
                miss = [k for k in keep if not _has(have, k)]
                valid = [k for k in keep if k not in miss]
                if miss:
                    src = prev.get("template") or prev.get("blueprint") or prev.get("kind")
                    how = ("its template draws only these elements: " + ", ".join(sorted({_show(p) for p in have}))
                           if prev.get("kind") in FRAME_LAYOUT else "its design.elements, beat_sheet or scene file name no such element")
                    E.append(f"{sc['beat']}: keep names {miss} but the previous beat {prev['beat']} ({src}) cannot provide them: {how}. "
                             "A kept name must be an element that beat really drew (or kept); a template's design.elements are "
                             "not drawn. Drop them from keep (held_missing)")
            else:
                valid = keep
            # a container kept without what it contains is an empty husk (a document.page `page` without its lines)
            if prev is not None and prev.get("kind") in FRAME_LAYOUT:
                els = template_elements().get(prev.get("template") or prev.get("blueprint") or "avatar") or []
                conts = [n for n, kd in els if kd in CONTAINER_KINDS]
                parts = [n for n, kd in els if kd not in CONTAINER_KINDS]
                for k in keep:
                    if _has(conts, k) and not any(_has(parts, x) for x in keep if x != k):
                        W.append(f"{sc['beat']}: keep '{k}' holds the container of {prev['beat']}'s "
                                 f"{prev.get('template') or prev.get('blueprint')} without its contents (they are separate "
                                 "elements and leave), so an empty husk stays on screen. Keep its contents too, or keep nothing")
        own = provided(project, sc)
        have = None if own is None else own + [re.escape(k) for k in valid]
        prev = sc
    return E, W


# ------------------------------------------------------------------ variety
def variety_checks(sb: dict, beats: list[str], alloc: dict | None = None) -> tuple[list[str], list[str]]:
    E, W = [], []
    by = {s["beat"]: s for s in sb.get("scenes") or [] if s.get("beat")}
    order = [by[b] for b in beats if b in by]
    n = len(order)
    cap = max(2, math.ceil(0.15 * n))
    uses: dict = {}
    for sc in order:
        tid = sc.get("template") if sc.get("kind") == "template" else sc.get("blueprint") if sc.get("kind") == "blueprint" else None
        if tid:
            uses.setdefault(tid, []).append(sc["beat"])
    for tid, bs in uses.items():
        if len(bs) > cap:
            E.append(f"template '{tid}' is used {len(bs)} times in {n} beats ({', '.join(bs[:10])}{'...' if len(bs) > 10 else ''}); "
                     f"at most {cap} (max(2, 15 % of beats)). A lesson that is one template repeated reads as a deck: draw some "
                     "of these beats, or use another template that fits the job")
    seq = [(sc.get("template") or sc.get("blueprint")) if sc.get("kind") in ("template", "blueprint") else None for sc in order]
    i = 3
    while i < len(seq):
        a, b = seq[i - 3], seq[i - 2]
        if a and b and a != b and seq[i - 1] == a and seq[i] == b:
            W.append(f"ping-pong {order[i - 3]['beat']}..{order[i]['beat']}: '{a}' and '{b}' alternate (A-B-A-B); the eye "
                     "reads it as flipping between two slides. Break it with a drawn beat or a held layout that changes")
            i += 4
            continue
        i += 1
    for sc in order:
        want = ((alloc or {}).get("beats", {}).get(sc["beat"]) or {}).get("treatment")
        if want == "hybrid" and sc.get("kind") in ("template", "redtee"):
            mv = (sc.get("shot") or {}).get("move")
            cont = ((sc.get("join_in") or {}).get("type") == "continue" and sc.get("keep"))
            if mv not in ("push", "pull") and not cont:
                E.append(f"{sc['beat']}: allocation says hybrid but this is a plain template: give it its motion layer (shot.move "
                         "push or pull, or a `continue` join that keeps and builds on the previous picture), or make it a "
                         "blueprint or bespoke scene")
    return E, W


# templates and blueprints that draw their own person or place (the rest are structure: a term, a list, a quiz)
PEOPLE_TEMPLATES = ("scenario.dialogue", "hero.character_moment", "hero.journey")


def world_checks(sb: dict, beats: list[str]) -> tuple[list[str], list[str]]:
    """One world (R-46). A template or blueprint that draws its own people and room, on a station the lesson's bespoke
    beats draw, puts a second version of that room and its people into the story: feedback-relay-v2's meeting room
    changed look at b02 (scenario.dialogue between b01 and b17) and its replay at b06 (hero.character_moment before
    b07 to b11). The fix keeps both ways (rule 11): draw the beat in the station, or give it its own station as a
    deliberate cut-away. (A count of stations was tried as a note and dropped: mfa-story, one of the best lessons, uses
    12 stations for 21 beats, so the count does not measure a broken world.)"""
    E, W = [], []
    by = {s["beat"]: s for s in sb.get("scenes") or [] if s.get("beat")}
    order = [by[b] for b in beats if b in by]
    drawn: dict = {}
    for sc in order:
        if sc.get("kind") == "bespoke" and sc.get("station"):
            drawn.setdefault(sc["station"], []).append(sc["beat"])
    for sc in order:
        tid = sc.get("template") or sc.get("blueprint")
        st = sc.get("station")
        if sc.get("kind") in ("template", "blueprint") and tid in PEOPLE_TEMPLATES and st in drawn:
            E.append(f"{sc['beat']}: {sc['kind']} '{tid}' draws its own people and room on station '{st}', which the bespoke beats "
                     f"{', '.join(drawn[st][:6])} draw: the story's world would change look for one beat (one_world). Draw this beat "
                     "in the station (bespoke, composing the lesson kit), or put it on its own station as a deliberate cut-away")
    return E, W


# ------------------------------------------------------------------ avatar props
@lru_cache(maxsize=1)
def avatar_spec() -> tuple[dict | None, frozenset]:
    """(props spec from the catalogue if it has one, allowed keys). The keys fall back to what the presenter code
    reads (`props.<key>` in runtime/overlay.js), so a key the code ignores is always caught."""
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json", {}) or {}
    ent = cat.get("avatar") or (cat.get("templates") or {}).get("avatar") or (cat.get("kinds") or {}).get("avatar")
    spec = (ent or {}).get("props") if isinstance(ent, dict) else None
    keys = set(spec or {})
    ov = ENGINE_ROOT / "runtime/overlay.js"
    if ov.exists():
        src = ov.read_text(encoding="utf-8")
        i, j = src.find("Loom.presenter = {"), src.find("Loom.media = {")
        if i >= 0:
            body = re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", "", src[i:j if j > i else len(src)])
            keys |= set(re.findall(r"\bprops\.(\w+)", body))
    return spec, frozenset(keys)


def avatar_errors(sc: dict, props_errors) -> list[str]:
    spec, keys = avatar_spec()
    props = sc.get("props") or {}
    E = []
    unk = sorted(k for k in props if k not in keys and k != "cast")
    if unk and keys:
        E.append(f"{sc['beat']}: avatar props {unk} are not presenter props (avatar_props_unknown; it reads: "
                 f"{', '.join(sorted(keys))}). The presenter never draws them: put that content in a template beat")
    if spec:
        E += [f"{sc['beat']}: {m}" for m in props_errors(spec, props)]
    return E


# ------------------------------------------------------------------ placeholder and meta text
META = re.compile(r"\b(blank|empty|placeholder|left empty|kept private|tbd|to be decided|lorem|ipsum|sample)\b", re.I)


def _strings(o, path):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, dict):
        if o.get("empty") is True:
            return                                   # a deliberately empty slot: nothing is drawn
        for k, v in o.items():
            yield from _strings(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from _strings(v, f"{path}[{i}]")


def placeholder_errors(sc: dict) -> list[str]:
    if sc.get("kind") not in FRAME_LAYOUT:
        return []
    E = []
    for path, t in _strings(sc.get("props") or {}, "props"):
        key = path.rsplit(".", 1)[-1].split("[")[0]
        if key.startswith("say") or key.endswith(("_say", "_cue")) or key in ("member", "side", "kind", "mode", "tone", "icon",
                                                                              "cloth", "accent", "emotion", "who", "cast"):
            continue
        s = t.strip()
        if s and not re.search(r"[A-Za-z0-9]", s):
            E.append(f"{sc['beat']}: {path} = {t!r} has no words: a slot that is meant to look empty is an item "
                     "{\"empty\": true} (compare.two items, document.page lines), never punctuation on screen")
        elif META.search(s):
            E.append(f"{sc['beat']}: {path} = {t!r} describes the slot instead of filling it ('{META.search(s).group(0)}' is "
                     "a note to the author, and the template prints it). Write the real words, or use an item "
                     "{\"empty\": true} for a deliberately empty slot")
    return E


# ------------------------------------------------------------------ cast continuity
GENERIC = {"ghost", "left", "right", "figure", "fig", "bust", "char", "character", "person", "people", "seated", "standing",
           "small", "big", "the", "cast", "rig", "peep", "desk", "mini", "icon", "avatar", "name", "label", "presenter",
           "speaker", "listener", "head", "body", "silhouette", "group", "crowd", "extra", "extras", "shadow", "old", "new"}
# the look each template gives a person by default (runtime/templates/more.js, documents.js, blueprints/heroes.js)
TEMPLATE_LOOK = {("scenario.dialogue", "left"): (0, "accent"), ("scenario.dialogue", "right"): (2, "accent4"),
                 ("document.page", "person"): (0, "accent"), ("hero.character_moment", ""): (0, "accent"),
                 ("hero.journey", "traveller"): (0, "accent")}


PEEP_MEMBERS = ("woman", "man", "girl", "boy", "elder_woman", "elder_man")


def _ident(name: str | None, cast_names: dict) -> str | None:
    if not name:
        return None
    toks = [t for t in re.split(r"[_\s\-]+", str(name).lower()) if t]
    for t in toks:
        if t in cast_names:
            return cast_names[t]
    rest = [t for t in toks if t not in GENERIC and not t.isdigit()]
    return rest[0] if rest else None


def cast_of(sb: dict) -> dict:
    """{lowercase first name: cast entry}"""
    out = {}
    for c in ((sb.get("story") or {}).get("cast") or []):
        if isinstance(c, dict) and c.get("name"):
            out[re.split(r"[_\s\-]+", str(c["name"]).lower())[0]] = c
    return out


def _int(v) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _cast_look(c: dict):
    """A cast entry's look; skin and cloth stay None when the entry does not fix them. A designed rig may leave them
    out (its design is its look); every draw of that person must then agree with the person's other draws (see
    cast_errors). A peep member must fix them (the missing field is its own error)."""
    sk = None if c.get("skin") is None else _int(c.get("skin"))
    if c.get("rig") in PEEP_MEMBERS:             # a peep member written as a rig (its own error): compare it as the peep
        return ("peep", c["rig"], sk, c.get("cloth"))
    if c.get("rig"):
        return ("rig", c["rig"], sk, c.get("cloth") or c.get("top"))
    if c.get("member"):
        return ("peep", c["member"], sk, c.get("cloth"))
    return None


def appearances_storyboard(sb: dict) -> list[dict]:
    """People in template and blueprint props: {beat, where, name, look, cast_ref}."""
    cast = cast_of(sb)
    out = []
    for sc in sb.get("scenes") or []:
        if sc.get("kind") not in ("template", "blueprint"):
            continue
        tid = sc.get("template") or sc.get("blueprint")
        pr = sc.get("props") or {}
        slots = [("", pr)] + [(k, pr[k]) for k in ("person", "left", "right", "traveller") if isinstance(pr.get(k), dict)]
        for k, d in slots:
            if not isinstance(d, dict) or not (d.get("member") or d.get("cast")):
                continue
            ref = d.get("cast")
            first = lambda v: re.split(r"[_\s\-]+", str(v).lower())[0]   # noqa: E731
            # the runtime (templates/_helpers.js H.person) draws a person whose cast or NAME is a cast member exactly as
            # story.cast says, whatever the props' member or cloth; the gate judges what will be drawn
            c = cast.get(first(ref)) if ref else (cast.get(first(d.get("name"))) if d.get("name") else None)
            if c:
                look = _cast_look(c)
            else:
                skin0, cloth0 = TEMPLATE_LOOK.get((tid, k), (0, None))
                look = ("peep", d.get("member"), _int(d.get("skin") if d.get("skin") is not None else skin0), d.get("cloth") or cloth0)
            out.append({"beat": sc["beat"], "where": f"{tid} props{('.' + k) if k else ''}", "name": d.get("name") or ref,
                        "look": look, "cast_ref": ref, "cast_ok": (not ref) or bool(c)})
    return out


def _opts(code: str, i: int) -> str:
    """The text of a call's argument list starting at index i (just after '(')."""
    depth, j = 0, i
    while j < len(code):
        if code[j] in "([{":
            depth += 1
        elif code[j] in ")]}":
            if depth == 0:
                return code[i:j]
            depth -= 1
        j += 1
    return code[i:j]


def appearances_scene(src: str, beat: str, file: str) -> list[dict]:
    """People a scene file draws: ctx.character(name, rig, {skin, top}) and kit.peep(<el>.inner, member, emotion,
    {cloth, skin}) whose element carries the person's name. (The rc4 regex prototype read cloth and skin as None: a
    lazy `[^)]*?` before an optional group matches nothing; the options are read from the whole argument list here.)"""
    code = re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", "", src)
    out = []
    for m in re.finditer(r"ctx\.character\(", code):
        args = _opts(code, m.end())
        mm = re.match(r'\s*["\']([^"\']+)["\']\s*,\s*["\']([^"\']+)["\']', args)
        if not mm:
            continue
        sk = re.search(r"\bskin\s*:\s*(\d+)", args)
        top = re.search(r"\btop\s*:\s*[\"'](\w+)[\"']", args)
        out.append({"beat": beat, "where": f"{file} ctx.character", "name": mm.group(1),
                    "look": ("rig", mm.group(2), int(sk.group(1)) if sk else 0, top.group(1) if top else None)})
    els = {v: n for v, n in re.findall(r'(?:const|let|var)\s+(\w+)\s*=\s*ctx\.el\(\s*["\']([^"\']+)["\']', code)}
    hosts = re.findall(r"kit\.peep\(\s*(\w+)", code)
    for m in re.finditer(r"kit\.peep\(", code):
        args = _opts(code, m.end())
        mm = re.match(r'\s*(\w+)(?:\.inner)?\s*,\s*["\'](\w+)["\']', args)
        if not mm:
            continue
        cl = re.search(r"\bcloth\s*:\s*[\"'](\w+)[\"']", args)
        sk = re.search(r"\bskin\s*:\s*(\d+)", args)
        group = hosts.count(mm.group(1)) > 1 and len({x for x in re.findall(r"kit\.peep\(\s*" + mm.group(1) + r"(?:\.inner)?\s*,\s*[\"'](\w+)", code)}) > 1
        # one element holding two different people is a group (a crowd, a viewfinder): its name is not a person's
        out.append({"beat": beat, "where": f"{file} kit.peep", "name": None if group else els.get(mm.group(1)),
                    "look": ("peep", mm.group(2), int(sk.group(1)) if sk else 0, cl.group(1) if cl else None)})
    return out


def _people_in_design(sc: dict) -> bool:
    for e in (sc.get("design") or {}).get("elements") or []:
        if isinstance(e, dict) and re.search(r"\b(character|figure|person|people|peep|rig)\b",
                                            " ".join(str(e.get(k) or "") for k in ("kind", "role", "type"))):
            return True
    return False


def _same(a, b) -> bool:
    """Two looks agree: same renderer and id; skin and clothes compared only when both are known."""
    return a[:2] == b[:2] and all(x is None or y is None or x == y for x, y in zip(a[2:], b[2:]))


def _fmt(look) -> str:
    sk = "not fixed" if look[2] is None else look[2]
    return f"{look[0]} '{look[1]}', skin {sk}, {'top' if look[0] == 'rig' else 'cloth'} {look[3] or 'default'}"


def cast_errors(project, sb: dict, scope: str = "all") -> list[str]:
    """story.cast is required when people appear; each cast name has one fixed look (rig or member, skin, cloth); every
    appearance of a name matches it; without a cast, one name never gets two looks. scope 'all' reads the storyboard
    props and the scene files that exist; 'scenes' only the scene files (the scenes gate)."""
    E = []
    cast = cast_of(sb)
    names = {k: str(c.get("name")) for k, c in cast.items()}
    apps = [] if scope == "scenes" else appearances_storyboard(sb)
    for sc in sb.get("scenes") or []:
        if sc.get("kind") == "bespoke":
            f = _scene_file(project, sc)
            if f:
                apps += appearances_scene(f.read_text(encoding="utf-8"), sc["beat"], f.name)
    people = bool(apps) or any(_people_in_design(sc) for sc in sb.get("scenes") or [])
    if scope == "all":
        if people and not cast:
            who = sorted({a["name"] for a in apps if a.get("name")})
            E.append("people appear in this lesson" + (f" ({', '.join(who[:6])})" if who else "") + " but story.cast is empty: "
                     "list each person once with a fixed look {name, rig or member, skin, cloth}, and draw them by that look "
                     "in every beat (template person props may say cast: \"<name>\")")
        drawn = {_ident(a.get("name"), names) for a in apps} | {str(a.get("cast_ref")) for a in apps if a.get("cast_ref")}
        for k, c in cast.items():
            if not (c.get("rig") or c.get("member") or c.get("skin") is not None or c.get("cloth")) and c.get("name") not in drawn:
                continue    # a story role nobody draws as a person ('the report', an unseen 'someone else'): no look to fix
            # a designed rig carries its own look; a peep member's skin and cloth must be fixed here
            miss = [x for x, ok in (("rig or member", c.get("rig") or c.get("member")),
                                    ("skin", c.get("skin") is not None or (c.get("rig") and c.get("rig") not in PEEP_MEMBERS)),
                                    ("cloth", c.get("cloth") or (c.get("rig") and c.get("rig") not in PEEP_MEMBERS))) if not ok]
            if miss:
                E.append(f"story.cast '{c.get('name')}' has no {', '.join(miss)}: each person's look is fixed once, here")
            if c.get("rig") in PEEP_MEMBERS:
                E.append(f"story.cast '{c.get('name')}': rig '{c['rig']}' is a peep member, not a rig: write member: \"{c['rig']}\" "
                         "(templates draw peep members; rigs are drawn by ctx.character)")
    seen: dict = {}
    for a in apps:
        if a.get("cast_ok") is False:
            E.append(f"{a['beat']}: {a['where']} says cast: \"{a['cast_ref']}\" but story.cast has no such name")
            continue
        who = _ident(a.get("name"), names)
        if not who or a.get("look") is None:
            continue    # no look to compare: a template person drawn from a cast entry that fixes none (its own error above)
        c = cast.get(who.lower().split()[0])
        if c:
            want = _cast_look(c)
            if want and not _same(a["look"], want):
                E.append(f"{a['beat']}: {a['where']} draws {c['name']} as {_fmt(a['look'])}, but story.cast fixes {_fmt(want)}"
                         + (f" (use cast: \"{c['name']}\" on the template's person)" if " props" in a["where"] else ""))
                continue
            # what the cast leaves to the rig's design must still be one look across the lesson: each draw agrees with
            # the person's first draw (phishing-report draws Jo as ava, skin 1, accent3 in every beat: one look)
            key = "cast:" + c["name"]
            first = seen.get(key)
            if first is None:
                seen[key] = a
            elif not _same(a["look"], first["look"]):
                E.append(f"{a['beat']}: {a['where']} draws {c['name']} as {_fmt(a['look'])}, but {first['beat']} ({first['where']}) "
                         f"drew them as {_fmt(first['look'])}: one person, one look (fix the skin and clothes in story.cast)")
            continue
        first = seen.get(who)
        if first is None:
            seen[who] = a
        elif not _same(a["look"], first["look"]):
            E.append(f"{a['beat']}: {a['where']} draws '{who}' as {_fmt(a['look'])}, but {first['beat']} ({first['where']}) "
                     f"drew them as {_fmt(first['look'])}: one person, one look (put them in story.cast)")
    return E
