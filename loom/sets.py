"""The set library (D-152): drawn places from Claude Design, filed by world and scene, chosen only on an exact or a
perfect match.

    assets/sets/<world>/<scene>/<set_style>.svg            the set (far, mid, near on a 2400 x 1350 canvas)
    assets/sets/<world>/<scene>/<set_style>.json           its card: anchors and slots in FRAME coordinates, setups,
                                                           description, who approved it and from which intake batch
    assets/sets/<world>/<scene>/<set_style>__<variant>.*   a variant (set_up, after, evening ...)
    assets/sets/INDEX.md                                   generated: every set, by world

    py -m loom sets                          the list
    py -m loom sets add <batch> --by NAME    promote an intake batch (assets/incoming/<batch>) that passed the intake
    py -m loom sets find "<text>" --style S  what a storyboard's words would load in lesson style S, and why
    py -m loom sets check                    every card agrees with its svg; INDEX.md is current

Selection is deliberately strict (Kshitij, 2026-10-10: "only the exact match or perfect description match loads
them"). A storyboard scene asks with `"set": "office/meeting_room"` (exact id, optionally "/<variant>") or with
`"set": {"want": "<words>"}`. Words match only when they contain a whole scene name or alias from
packs/worlds/<world>.json (consecutive words, e.g. "meeting room", "conference room"); when that name belongs to
scenes in more than one world, the words must also name the world. Exactly one scene must qualify, and it must exist
in the lesson's own set style (the style pack's set style, packs/set_styles.json): a set is never borrowed from
another style (D-122), never the nearest guess. Anything else is refused with the reason and the candidates.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, write_json

ROOT = ENGINE_ROOT / "assets" / "sets"
INDEX = ROOT / "INDEX.md"
WORLDS = ENGINE_ROOT / "packs" / "worlds"
OFFSET = (240, 135)                # the visible 1920 x 1080 frame inside the 2400 x 1350 canvas


# ------------------------------------------------------------------ the library
def cards() -> list[dict]:
    out = []
    for f in sorted(ROOT.glob("*/*/*.json")):
        c = read_json(f)
        try:
            c["_card"] = f.relative_to(ENGINE_ROOT).as_posix()
        except ValueError:          # a library outside the engine (a test's temp folder)
            c["_card"] = f.as_posix()
        out.append(c)
    return out


def set_id(world: str, scene: str, variant: str = "main") -> str:
    return f"{world}/{scene}" + ("" if variant in (None, "", "main") else f"/{variant}")


def svg_of(card: dict) -> str:
    return (ENGINE_ROOT / card["file"]).read_text(encoding="utf-8")


def _read_points(svg: str) -> tuple[dict, dict, list]:
    """anchors and slots in FRAME coordinates (the canvas minus the 240, 135 offset) and the setup names"""
    anchors, slots = {}, {}
    for m in re.finditer(r'<circle\b[^>]*\bid="anchor_([\w-]+)"[^>]*>', svg):
        tag = m.group(0)
        cx, cy = re.search(r'\bcx="([-\d.]+)"', tag), re.search(r'\bcy="([-\d.]+)"', tag)
        if cx and cy:
            anchors[m.group(1)] = [round(float(cx.group(1)) - OFFSET[0], 1), round(float(cy.group(1)) - OFFSET[1], 1)]
    for m in re.finditer(r'<rect\b[^>]*\bid="slot_([\w-]+)"[^>]*>', svg):
        tag = m.group(0)
        v = {k: re.search(rf'\b{k}="([-\d.]+)"', tag) for k in ("x", "y", "width", "height")}
        if all(v.values()):
            slots[m.group(1)] = {"x": round(float(v["x"].group(1)) - OFFSET[0], 1), "y": round(float(v["y"].group(1)) - OFFSET[1], 1),
                                 "w": float(v["width"].group(1)), "h": float(v["height"].group(1))}
    setups = sorted(set(re.findall(r'\bid="setup_([\w-]+)"', svg)))
    return anchors, slots, setups


def add(batch: str, by: str, src_root: Path | None = None, only: list[str] | None = None) -> list[str]:
    """promote every set in an intake batch that passed the intake (assets/incoming/<batch>/INTAKE.md) to the library;
    `only` (scene ids) promotes just those, so a set held at review stays out of a batch whose others are approved"""
    if not (by or "").strip():
        raise LoomError("sets add needs --by: the person who approved these sets")
    base = (src_root or ENGINE_ROOT / "assets" / "incoming") / batch
    intake = base / "INTAKE.md"
    if not intake.exists():
        raise LoomError(f"{base}: no INTAKE.md (run py tools/asset_intake.py first)")
    text = intake.read_text(encoding="utf-8")
    man = read_json(base / "manifest.json", {}) or {}
    added = []
    for e in man.get("assets") or []:
        if e.get("kind") != "set":
            continue
        if only and e.get("scene") not in only:
            continue
        rel = str(e["file"]).removesuffix(".svg")
        if f"**PASS** `{rel}`" not in text:
            raise LoomError(f"{rel}: not a PASS in {intake.name}; only sets that passed the intake enter the library")
        world, scene, sid = e.get("world"), e.get("scene"), e.get("set_style")
        variant = e.get("variant") or "main"
        if not (world and scene and sid):
            raise LoomError(f"{rel}: the manifest entry needs world, scene and set_style")
        if not (WORLDS / f"{world}.json").exists():
            raise LoomError(f"{rel}: no world '{world}' in packs/worlds")
        if scene not in [s["id"] for s in read_json(WORLDS / f"{world}.json")["scenes"]]:
            raise LoomError(f"{rel}: world '{world}' has no scene '{scene}'")
        stem = sid if variant == "main" else f"{sid}__{variant}"
        dest = ROOT / world / scene
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(base / f"{rel}.svg", dest / f"{stem}.svg")
        svg = (dest / f"{stem}.svg").read_text(encoding="utf-8")
        anchors, slots, setups = _read_points(svg)
        card = {"id": set_id(world, scene, variant), "world": world, "scene": scene, "set_style": sid, "variant": variant,
                "file": f"assets/sets/{world}/{scene}/{stem}.svg", "canvas": [2400, 1350], "frame_offset": list(OFFSET),
                "anchors": anchors, "slots": slots, "setups": setups or ["day"],
                "description": e.get("description", ""), "approved_by": by.strip(), "source_batch": batch}
        write_json(dest / f"{stem}.json", card)
        added.append(card["id"] + f" [{sid}]")
        info(f"sets: {card['id']} [{sid}] -> {card['file']}")
    if only and len(added) != len(only):
        raise LoomError(f"{batch}: --only named {sorted(only)} but {len(added)} matched; check the scene ids")
    if not added:
        raise LoomError(f"{batch}: no set in its manifest (a zero is not a result)")
    write_index()
    return added


def index_text() -> str:
    L = ["# Set library", "", "GENERATED by `py -m loom sets add` / `py -m loom sets check --write`. Do not edit.", "",
         "Drawn places from Claude Design, filed as `assets/sets/<world>/<scene>/<set_style>.svg` with a card beside each.",
         "A storyboard loads one only by its exact id or by words that contain the scene's whole name or alias",
         "(loom/sets.py). Styles are never mixed (D-122): a lesson uses its own set style or no set.", ""]
    by = {}
    for c in cards():
        by.setdefault(c["world"], []).append(c)
    if not by:
        L.append("(no sets yet)")
    for wld in sorted(by):
        L += [f"## {wld}", "", "| id | set style | variant | setups | anchors | slots | approved by |", "|---|---|---|---|---|---|---|"]
        for c in sorted(by[wld], key=lambda c: (c["scene"], c["set_style"], c["variant"])):
            L.append(f"| `{c['id']}` | {c['set_style']} | {c['variant']} | {', '.join(c['setups'])} | {', '.join(sorted(c['anchors']))} | "
                     f"{', '.join(sorted(c['slots']))} | {c['approved_by']} |")
        L.append("")
    return "\n".join(L) + "\n"


def write_index():
    ROOT.mkdir(parents=True, exist_ok=True)
    INDEX.write_text(index_text(), encoding="utf-8")


def check() -> list[str]:
    E = []
    for c in cards():
        p = ENGINE_ROOT / c["file"]
        if not p.exists():
            E.append(f"{c['_card']}: its svg {c['file']} is missing"); continue
        a, s, _ = _read_points(p.read_text(encoding="utf-8"))
        if a != c["anchors"] or s != c["slots"]:
            E.append(f"{c['_card']}: anchors or slots differ from its svg (re-add it)")
        if "floor_y" not in c["anchors"]:
            E.append(f"{c['_card']}: no anchor_floor_y")
    if (INDEX.exists() or cards()) and (not INDEX.exists() or INDEX.read_text(encoding="utf-8") != index_text()):
        E.append("assets/sets/INDEX.md is out of date: py -m loom sets check --write")
    return E


# ------------------------------------------------------------------ strict selection
def _norm(t: str) -> str:
    t = str(t).lower().replace("'", "").replace("’", "")
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return f" {t.strip()} "


def _has(text_n: str, phrase: str) -> bool:
    p = _norm(phrase).strip()
    return bool(p) and (f" {p} " in text_n or f" {p}s " in text_n)


def _worlds() -> dict:
    return {f.stem: read_json(f) for f in sorted(WORLDS.glob("*.json"))}


def set_style_for(lesson_style: str) -> str | None:
    """the set style a lesson style draws its sets in (packs/set_styles.json: each set style lists its style packs)"""
    from . import set_styles as SS
    for sid, st in SS.data()["styles"].items():
        if lesson_style in (st.get("packs") or []) or lesson_style == sid:
            return sid
    return None


def resolve(want, lesson_style: str) -> dict:
    """{ok, id, card, reason, candidates}. ok only for an exact id or a perfect description match that exists in the
    lesson's own set style. Never a nearest guess."""
    sid = set_style_for(lesson_style)
    if not sid:
        return {"ok": False, "reason": f"lesson style '{lesson_style}' has no set style (packs/set_styles.json lists none for it)", "candidates": []}
    lib = cards()
    worlds = _worlds()
    words = want.get("want") if isinstance(want, dict) else want
    if isinstance(want, dict) and want.get("world") and want.get("scene"):
        words = set_id(want["world"], want["scene"], want.get("variant") or "main")
    words = str(words or "").strip()
    if not words:
        return {"ok": False, "reason": "no set asked for", "candidates": []}

    def pick(world, scene, variant):
        hit = [c for c in lib if c["world"] == world and c["scene"] == scene and c["variant"] == variant]
        mine = [c for c in hit if c["set_style"] == sid]
        if mine:
            return {"ok": True, "id": mine[0]["id"], "card": mine[0], "reason": "", "candidates": [mine[0]["id"]]}
        if hit:
            return {"ok": False, "reason": f"{set_id(world, scene, variant)} exists only in {sorted({c['set_style'] for c in hit})}, "
                    f"not in this lesson's set style '{sid}'; sets are never borrowed across styles", "candidates": [f"{c['id']} [{c['set_style']}]" for c in hit]}
        return {"ok": False, "reason": f"{set_id(world, scene, variant)} is not in the set library yet (draw it in '{sid}' first)", "candidates": []}

    # 1) exact id: world/scene[/variant]
    m = re.fullmatch(r"([a-z0-9_]+)/([a-z0-9_]+)(?:/([a-z0-9_]+))?", words)
    if m:
        w_, s_, v_ = m.group(1), m.group(2), m.group(3) or "main"
        if w_ not in worlds or s_ not in [s["id"] for s in worlds[w_]["scenes"]]:
            return {"ok": False, "reason": f"'{words}' is not a world/scene id in packs/worlds", "candidates": []}
        return pick(w_, s_, v_)
    # 2) a perfect description match: a whole scene name or alias, and the world when the name is not unique
    text_n = _norm(words)
    found, said = [], {}
    for wid, w in worlds.items():
        for s in w["scenes"]:
            names = [s["id"].replace("_", " ")] + list(s.get("aliases") or [])
            hit = [_norm(n).strip() for n in names if _has(text_n, n)]
            if hit:
                found.append((wid, s["id"]))
                said[(wid, s["id"])] = hit
    # the more specific name wins: "market street" names that scene, not the one called "street" inside it; "machine
    # close" is not "machine" (2026-10-15: 28 of 465 scene names matched a second scene through a shorter name)
    def _inside(a, b):
        return a != b and f" {a} " in f" {b} "
    found = [k for k in found if not any(all(any(_inside(a, b) for b in said[o]) for a in said[k])
                                         for o in found if o != k)]
    if not found:
        return {"ok": False, "reason": f"no scene name or alias appears whole in '{words}' (say e.g. 'meeting room')", "candidates": []}
    def world_names(w):
        wd = worlds[w]
        parts = [p.strip() for p in re.split(r",| and ", wd.get("name", "")) if p.strip()]
        return [w.replace("_", " ")] + list(wd.get("aliases") or []) + parts
    # a world word inside the scene's own name is part of that name, not a world named: "office exterior" is a city
    # scene, "training room" an office one, "1950s office" a history one
    text_w = text_n
    for k in found:
        for n in sorted(said[k], key=len, reverse=True):
            text_w = text_w.replace(f" {n} ", " ").replace(f" {n}s ", " ")
    named_worlds = {w for w in worlds if any(_has(text_w, n) for n in world_names(w))}
    if named_worlds and not ({w for w, _ in found} & named_worlds):
        return {"ok": False, "reason": f"'{words}' names the world {sorted(named_worlds)} but the scene it names belongs to "
                f"{sorted({w for w, _ in found})}; describe a scene of that world", "candidates": [set_id(w, s) for w, s in found]}
    if named_worlds:
        found = [(w, s) for w, s in found if w in named_worlds] or found
    if len({w for w, _ in found}) > 1:
        named = [(w, s) for w, s in found if any(_has(text_w, n) for n in world_names(w))]
        if len(named) >= 1:
            found = named
        else:
            return {"ok": False, "reason": f"'{words}' names scenes in several worlds; say which world",
                    "candidates": [set_id(w, s) for w, s in found]}
    if len(found) > 1:
        return {"ok": False, "reason": f"'{words}' matches more than one scene; ask for one", "candidates": [set_id(w, s) for w, s in found]}
    w_, s_ = found[0]
    variant = "main"
    for c in lib:
        if c["world"] == w_ and c["scene"] == s_ and c["variant"] != "main" and _has(text_n, c["variant"].replace("_", " ")):
            variant = c["variant"]
    return pick(w_, s_, variant)


def storyboard_errors(sb: dict, lesson_style: str) -> list[str]:
    E = []
    for s in sb.get("scenes") or []:
        if s.get("set"):
            r = resolve(s["set"], lesson_style)
            if not r["ok"]:
                E.append(f"{s.get('beat')}: set {json.dumps(s['set'])} not loaded: {r['reason']}"
                         + (f" (candidates: {', '.join(r['candidates'])})" if r["candidates"] else ""))
    return E


def embed(sb: dict, sources: list[str], lesson_style: str) -> tuple[dict, list[str]]:
    """the sets a build carries: each storyboard scene's set, and literal ids in scene code
    (Loom.place.set(ctx, "name", "office/meeting_room")). {id: {svg, card}} and errors."""
    out, E = {}, []
    asks = [s["set"] for s in sb.get("scenes") or [] if s.get("set")]
    for src in sources:
        asks += re.findall(r'Loom\.place\.set\(\s*ctx\s*,\s*"[^"]*"\s*,\s*"([a-z0-9_]+/[a-z0-9_]+(?:/[a-z0-9_]+)?)"', src)
    for a in asks:
        r = resolve(a, lesson_style)
        if not r["ok"]:
            E.append(f"set {json.dumps(a)}: {r['reason']}")
            continue
        c = {k: v for k, v in r["card"].items() if not k.startswith("_")}
        out[r["id"]] = {"svg": svg_of(r["card"]), "card": c}
    return out, E


def _lesson_words(pdir: Path) -> str:
    """what a lesson says and shows in words: narration, on-screen text, visual intents, storyboard designs"""
    out = []
    sc = read_json(pdir / "plan" / "script.json", {}) or {}
    for b in sc.get("beats") or []:
        for k in ("narration", "on_screen", "visual_intent"):
            v = b.get(k)
            out.append(v if isinstance(v, str) else json.dumps(v) if v else "")
    sb = read_json(pdir / "plan" / "storyboard.json", {}) or {}
    for x in sb.get("scenes") or []:
        for k in ("rationale", "design"):
            v = x.get(k)
            out.append(v if isinstance(v, str) else json.dumps(v) if v else "")
    return _norm(" ".join(out))


# words the engine itself uses in scripts and storyboards (a "station" is a stage of the world map, a "surface" a colour
# token, "scaffold" a reveal), so a scene named only by one of them cannot be evidenced from a lesson's words
ENGINE_WORDS = {"station", "surface", "scaffold", "orbit", "stage"}


def demand() -> list[dict]:
    """evidence for which places lessons actually happen in (D-153): for every world scene, the lessons whose words name
    it (its id words or an alias), from the lessons in projects/. Word evidence, not proof: a lesson can mention a place
    it never shows, and a common word (station) can mean something else."""
    from .project import projects_root
    lessons = {p.name: _lesson_words(p) for p in sorted(projects_root().glob("*")) if (p / "plan" / "script.json").exists()}
    rows = []
    for wid, w in _worlds().items():
        for s in w["scenes"]:
            names = [n for n in [s["id"].replace("_", " ")] + list(s.get("aliases") or []) if n not in ENGINE_WORDS]
            hit = [pid for pid, t in lessons.items() if any(_has(t, n) for n in names)]
            rows.append({"id": set_id(wid, s["id"]), "lessons": len(hit), "of": len(lessons), "reuse": s.get("reuse"), "examples": hit[:4]})
    return sorted(rows, key=lambda r: (-r["lessons"], r["id"]))


def cli(args) -> int:
    act = args.action or "list"
    if act == "list":
        print(index_text()); return 0
    if act == "add":
        only = [x.strip() for x in (getattr(args, "only", None) or "").split(",") if x.strip()] or None
        for a in add(args.target, args.by or "", only=only):
            print("added", a)
        return 0
    if act == "demand":
        rows = demand()
        print(f"places named in the words of {rows[0]['of'] if rows else 0} lessons (word evidence, not proof):")
        for r in rows:
            if r["lessons"]:
                print(f"  {r['lessons']:3d}  {r['id']:<34} {('reuse ' + r['reuse']) if r['reuse'] else '':<14} {', '.join(r['examples'])}")
        print(f"  {sum(1 for r in rows if not r['lessons'])} scenes named by no lesson")
        return 0
    if act == "find":
        r = resolve(args.target, args.style or "")
        print(json.dumps({k: v for k, v in r.items() if k != "card"}, indent=1)); return 0 if r["ok"] else 1
    if act == "check":
        if args.write:
            write_index()
        E = check()
        for e in E:
            print("  ERROR:", e)
        print(f"sets: {len(cards())} in the library, {len(E)} problems")
        return 1 if E else 0
    raise LoomError(f"sets: unknown action {act}")
