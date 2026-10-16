"""Reuse or build, per style (D-163, Kshitij 2026-10-12: "If a scene for the asked style exists, then reuse otherwise
build it. SIMPLE."; docs/strategy/2026-10-12-reuse-or-build.md).

    assets/kept/<style>/parts/<name>/{card.json, code.js, still.jpg}   a kit part (a place, a set, a device, a prop)
    assets/kept/<style>/beats/<name>/{card.json, code.js, still.jpg}   a whole bespoke beat

One rule for every lesson in every pipeline (Shuttle, Relay, by hand): the storyboard sees the kept pieces of the lesson's
own style (never another style, D-122) and, where one fits, writes `"reuse": "<id>"` on a kit part or a bespoke scene;
where none fits it builds. When the film is approved (`loom approve <id> final`, or Relay finishing its render with the
check passed) the engine keeps every part and beat the lesson built, so the next lesson in that style can reuse it.

- A reused PART is loaded as is: compose puts its code before the lesson kit under the part's id; nobody writes it.
- A reused BEAT is the scene author's starting code: it keeps the drawing and changes the words, timings and what the new
  lesson needs.
- An isolated lesson (`loom new --isolated`, a comparison) neither sees nor feeds the library, as with the design seed (L-324).

    py -m loom kept [list] [--style S]       what is kept
    py -m loom kept keep <lesson> [--force]  keep a lesson's parts and beats now (--force: also an isolated or unapproved one)
    py -m loom kept remove <id>              take one out
"""
from __future__ import annotations

import re
import shutil
import subprocess
from datetime import date
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, which, write_json

ROOT = ENGINE_ROOT / "assets" / "kept"
KINDS = ("part", "beat")
LIST_MAX = 60                       # lines of the library a storyboard brief carries
PART_ID = "__KEPT_PART__"
BEAT_ID = "__KEPT_BEAT__"


# ------------------------------------------------------------------ the library
def _dir(kid: str) -> Path:
    style, kind, name = kid.split("/")
    return ROOT / style / (kind + "s") / name


def cards(style: str | None = None, kind: str | None = None) -> list[dict]:
    out = []
    for f in sorted(ROOT.glob("*/*/*/card.json")):
        c = read_json(f, {}) or {}
        if c.get("id") and (style is None or c.get("style") == style) and (kind is None or c.get("kind") == kind):
            out.append(c)
    return out


def card(kid: str) -> dict | None:
    if not isinstance(kid, str) or kid.count("/") != 2:
        return None
    f = _dir(kid) / "card.json"
    return read_json(f, None) if f.exists() else None


def code(kid: str) -> str:
    return (_dir(kid) / "code.js").read_text(encoding="utf-8")


def isolated(project) -> bool:
    return bool((getattr(project, "cfg", None) or {}).get("isolated"))


def lesson_style(project, sb: dict | None = None) -> str | None:
    sb = sb if sb is not None else (read_json(project.path("plan/storyboard.json"), {}) or {})
    return sb.get("style") or project.request.get("style")


def listing(project, sb: dict | None = None) -> str:
    """The text a storyboard writer reads: the kept parts and beats of the lesson's style, one line each, and the rule.
    "" for an isolated lesson; a short line when the style has nothing kept yet."""
    if isolated(project):
        return ""
    style = lesson_style(project, sb)
    cs = cards(style)
    head = (f"THE STYLE'S LIBRARY ({style}): reuse or build. These parts and beats were built by earlier {style} lessons. "
            "For each kit part and each bespoke scene: where a kept piece shows the same thing, reuse it with `\"reuse\": \"<id>\"` "
            "(a part is loaded as is under your part id; a beat becomes its author's starting code, changing the words and "
            "timings to this lesson); where none fits, build it, and the engine keeps it when the film is approved. Fit is "
            "your judgement: when a kept piece answers to the same thing and you build anyway, say why in the scene's or "
            "part's `what` or `design.why_motion` in a few words.")
    if not cs:
        return head + "\nNothing is kept for this style yet: build everything."
    lines = []
    # parts first, then beats, the most reused first; at most LIST_MAX lines so a growing library never bloats every
    # storyboard brief (the gps-position briefs were 93 % repeated text, docs/research/2026-10-12-scene-author-cost.md)
    ranked = sorted(cs, key=lambda c: (c["kind"] != "part", -len(c.get("uses") or []), c["id"]))
    more = max(0, len(ranked) - LIST_MAX)
    for c in ranked[:LIST_MAX]:
        extra = []
        if c.get("needs"):
            extra.append("needs parts " + ", ".join(c["needs"]))
        if c.get("takes_held"):
            extra.append("takes from the beat before " + ", ".join(c["takes_held"][:6]))
        if c["kind"] == "part" and c.get("states"):
            extra.append("states " + ", ".join(c["states"][:8]))
        lines.append(f"- {c['id']} ({c['kind']}): {c.get('what', '')[:220]}"
                     + (f" [{'; '.join(extra)}]" if extra else "")
                     + f" (from {c.get('from', {}).get('lesson')}, used {len(c.get('uses') or [])} time(s) since)")
    if more:
        lines.append(f"(and {more} more, used less: not listed)")
    return head + "\n" + "\n".join(lines)


# ------------------------------------------------------------------ the storyboard: reuse ids
def storyboard_errors(sb: dict, style: str) -> list[str]:
    """A `reuse` names a kept piece of the right kind in the lesson's own style."""
    E = []
    for p in ((sb.get("kit") or {}).get("parts")) or []:
        r = p.get("reuse")
        if r is None:
            continue
        c = card(r)
        if not c:
            E.append(f"kit part '{p.get('id')}': reuse '{r}' is not in the library (py -m loom kept list --style {style})")
        elif c["kind"] != "part":
            E.append(f"kit part '{p.get('id')}': reuse '{r}' is a {c['kind']}, not a part")
        elif c["style"] != style:
            E.append(f"kit part '{p.get('id')}': reuse '{r}' is kept for {c['style']}, this lesson is {style} (never across styles, D-122)")
    for s in sb.get("scenes") or []:
        r = s.get("reuse")
        if r is None:
            continue
        c = card(r)
        if s.get("kind") != "bespoke":
            E.append(f"{s.get('beat')}: reuse is for a bespoke scene (this one is {s.get('kind')})")
        elif not c:
            E.append(f"{s.get('beat')}: reuse '{r}' is not in the library (py -m loom kept list --style {style})")
        elif c["kind"] != "beat":
            E.append(f"{s.get('beat')}: reuse '{r}' is a {c['kind']}, not a beat")
        elif c["style"] != style:
            E.append(f"{s.get('beat')}: reuse '{r}' is kept for {c['style']}, this lesson is {style} (never across styles, D-122)")
    return E


def reused_parts(sb: dict) -> list[dict]:
    return [p for p in ((sb.get("kit") or {}).get("parts")) or [] if p.get("reuse")]


def parts_js(project, sb: dict | None = None) -> tuple[str, list[str]]:
    """(the code of the lesson's reused kit parts, errors): each kept part under the lesson's own part id; loaded before
    the lesson kit (compose, the kit preview)."""
    sb = sb if sb is not None else (read_json(project.path("plan/storyboard.json"), {}) or {})
    out, E = [], []
    for p in reused_parts(sb):
        c = card(p["reuse"])
        if not c or c.get("kind") != "part":
            E.append(f"kit part '{p.get('id')}': reuse '{p['reuse']}' is not a kept part")
            continue
        out.append(f"// kit part {p['id']}: reused from {c['id']} (from {c.get('from', {}).get('lesson')})\n"
                   + code(c["id"]).replace(PART_ID, p["id"]))
    return ("Loom.lesson = Loom.lesson || {};\n" + "\n".join(out) + "\n") if out else "", E


def beat_start(sc: dict) -> str:
    """The scene author's starting code for a reused beat ("" when the scene reuses nothing)."""
    c = card(sc.get("reuse")) if sc.get("reuse") else None
    if not c or c.get("kind") != "beat":
        return ""
    src = code(c["id"]).replace(BEAT_ID, sc["beat"])
    return (f"REUSE: this beat starts from the kept beat {c['id']} (built for {c.get('from', {}).get('lesson')} "
            f"{c.get('from', {}).get('beat')}: {c.get('what', '')[:300]}). Its code below is your starting point: keep "
            "its drawing, layout and motion; change the words, the cue anchors and timings (to THIS beat's phrases), the "
            "element names the storyboard and the next beat need, and anything this lesson's spec asks for. Send it whole "
            "as `source` on your first lab_snapshot (with your changes), then edits."
            + (f" It composes the kit parts {c['needs']}: use this lesson's parts of the same kind, or draw what is missing."
               if c.get("needs") else "")
            + f"\nTHE KEPT BEAT'S NARRATION: {c.get('narration', '')[:600]}\nSTARTING CODE:\n{src}")


# ------------------------------------------------------------------ keeping what a lesson built
def _blocks(src: str) -> dict:
    """{part id: (start, end)} character spans of each `Loom.lesson.<id> = ...;` statement in a kit."""
    out = {}
    for m in re.finditer(r"Loom\.lesson(?:\.([A-Za-z_]\w*)|\[\s*[\"'](\w+)[\"']\s*\])\s*=(?!=)", src):
        pid = m.group(1) or m.group(2)
        i, depth, q = m.end(), 0, None
        while i < len(src):
            ch = src[i]
            if q:
                if ch == "\\":
                    i += 2
                    continue
                if ch == q:
                    q = None
            elif ch in "\"'`":
                q = ch
            elif ch == "/" and src[i:i + 2] == "//":
                j = src.find("\n", i)
                i = len(src) if j < 0 else j
                continue
            elif ch == "/" and src[i:i + 2] == "/*":
                j = src.find("*/", i + 2)
                i = len(src) if j < 0 else j + 2
                continue
            elif ch in "({[":
                depth += 1
            elif ch in ")}]":
                depth -= 1
            elif ch == ";" and depth == 0:
                break
            i += 1
        start = src.rfind("\n", 0, m.start()) + 1
        out[pid] = (start, i + 1)
    return out


def part_code(kit_src: str, pid: str) -> tuple[str, list[str]]:
    """(kept code for one kit part, the other parts it calls): the kit with every other part's statement taken out except
    the ones it calls (kept under their own ids, `||` so a lesson's own wins), and its own renamed to PART_ID."""
    B = _blocks(kit_src)
    if pid not in B:
        raise LoomError(f"part '{pid}' is not defined in the kit")
    need, todo = [], [pid]
    while todo:
        x = todo.pop()
        a, b = B[x]
        for y in re.findall(r"Loom\.lesson\.([A-Za-z_]\w*)\s*\(", kit_src[a:b]):
            if y in B and y != pid and y not in need:
                need.append(y)
                todo.append(y)
    keep = {pid, *need}
    out, last = [], 0
    for x, (a, b) in sorted(B.items(), key=lambda kv: kv[1][0]):
        out.append(kit_src[last:a])
        if x in keep:
            stmt = kit_src[a:b]
            if x == pid:
                stmt = re.sub(r"Loom\.lesson(?:\.%s|\[\s*[\"']%s[\"']\s*\])\s*=" % (x, x), f'Loom.lesson["{PART_ID}"] =', stmt, count=1)
            else:
                stmt = re.sub(r"(Loom\.lesson(?:\.%s|\[\s*[\"']%s[\"']\s*\]))\s*=" % (x, x), r"\1 = \1 ||", stmt, count=1)
            out.append(stmt)
        last = b
    out.append(kit_src[last:])
    body = "".join(out)
    body = re.sub(r"^\s*Loom\.lesson\s*=\s*Loom\.lesson\s*\|\|\s*\{\}\s*;\s*\n", "", body, count=1)
    return body.strip() + "\n", need


def _node_ok(js: str) -> bool:
    node = which("node")
    if not node:
        return True
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(js)
    try:
        return subprocess.run([node, "--check", f.name], capture_output=True, text=True).returncode == 0
    finally:
        Path(f.name).unlink(missing_ok=True)


def _still(project, t: float, dst: Path) -> None:
    """A frame of the lesson's film at t seconds, when the film and ffmpeg are there."""
    film = project.path(f"renders/{project.id}.mp4")
    ff = which("ffmpeg")
    if film.exists() and ff:
        subprocess.run([ff, "-v", "error", "-y", "-ss", f"{max(0.0, t):.2f}", "-i", str(film), "-frames:v", "1", "-vf", "scale=640:-1",
                        str(dst)], capture_output=True)


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")[:40] or "piece"


def _name(style: str, kind: str, base: str, lesson: str) -> str:
    """A name in the style's library: the base, or base_<lesson> when another lesson holds it (one lesson keeps its own)."""
    c = card(f"{style}/{kind}/{base}")
    if c is None or c.get("from", {}).get("lesson") == lesson:
        return base
    return f"{base}_{_slug(lesson)}"[:60]


def _count_use(kid: str, lesson: str) -> None:
    c = card(kid)
    if c and lesson not in (c.get("uses") or []):
        c["uses"] = (c.get("uses") or []) + [lesson]
        write_json(_dir(kid) / "card.json", c)


def keep(project, force: bool = False) -> dict:
    """Keep every kit part and bespoke beat this lesson built (a reused one only counts a use). {kept, used, skipped}."""
    res = {"kept": [], "used": [], "skipped": []}
    if isolated(project) and not force:
        res["skipped"].append("an isolated lesson feeds no library (L-324)")
        return res
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    style = lesson_style(project, sb)
    if not style:
        res["skipped"].append("no style")
        return res
    lesson, today = project.id, date.today().isoformat()
    tm = {b["id"]: b for b in (read_json(project.path("audio/timings.json"), {}) or {}).get("beats") or []}
    script = {b.get("id"): " ".join(b.get("narration") or []) for b in (read_json(project.path("plan/script.json"), {}) or {}).get("beats") or []}
    mid = lambda b: (tm[b]["speech_start"] + tm[b]["speech_end"]) / 2 if b in tm else 0.0
    # parts
    kit_f = project.path("scenes/_kit.js")
    kit_src = kit_f.read_text(encoding="utf-8") if kit_f.exists() else ""
    for p in ((sb.get("kit") or {}).get("parts")) or []:
        if p.get("reuse"):
            _count_use(p["reuse"], lesson)
            res["used"].append(p["reuse"])
            continue
        try:
            js, need = part_code(kit_src, p["id"])
        except LoomError as e:
            res["skipped"].append(f"part {p['id']}: {e}")
            continue
        if not _node_ok("Loom.lesson = {};\n" + js):
            res["skipped"].append(f"part {p['id']}: its code does not stand alone (node --check)")
            continue
        name = _name(style, "part", _slug(p["id"]), lesson)
        kid = f"{style}/part/{name}"
        d = _dir(kid)
        d.mkdir(parents=True, exist_ok=True)
        (d / "code.js").write_text(js, encoding="utf-8")
        first = (p.get("beats") or [None])[0]
        _still(project, mid(first), d / "still.jpg")
        write_json(d / "card.json", {"id": kid, "kind": "part", "style": style, "name": name, "what": p.get("what", ""),
                                     "states": p.get("states") or [], "size": p.get("size"), "needs": need,
                                     "from": {"lesson": lesson, "part": p["id"], "date": today}, "uses": []})
        res["kept"].append(kid)
    # beats
    for s in sb.get("scenes") or []:
        if s.get("kind") != "bespoke":
            continue
        b = s["beat"]
        if s.get("reuse"):
            _count_use(s["reuse"], lesson)
            res["used"].append(s["reuse"])
            continue
        f = project.path(f"scenes/{s.get('scene') or b}.js")
        if not f.exists():
            res["skipped"].append(f"beat {b}: no scene file")
            continue
        src = f.read_text(encoding="utf-8")
        tag = re.match(r"\s*//\s*@design\s+([a-z0-9_.-]+)\s*:\s*(.*)", src)
        base = _slug(tag.group(1)) if tag else _slug(s.get("subject") or b)
        name = _name(style, "beat", base, lesson)
        if card(f"{style}/beat/{name}") and card(f"{style}/beat/{name}").get("from", {}).get("beat") not in (None, b):
            name = f"{name}_{_slug(b)}"     # two beats of one lesson with one design tag
        kid = f"{style}/beat/{name}"
        d = _dir(kid)
        d.mkdir(parents=True, exist_ok=True)
        code_js = re.sub(r"(Loom\.scene\(\s*[\"'])%s([\"'])" % re.escape(b), r"\g<1>%s\2" % BEAT_ID, src)
        (d / "code.js").write_text(code_js, encoding="utf-8")
        _still(project, mid(b), d / "still.jpg")
        what = (s.get("subject") or "") + ((": " + (s.get("design") or {}).get("treatment", "")) if (s.get("design") or {}).get("treatment") else "")
        if tag and tag.group(2):
            what = tag.group(2).strip() + " | " + what
        write_json(d / "card.json", {"id": kid, "kind": "beat", "style": style, "name": name, "what": what.strip(),
                                     "narration": script.get(b, ""), "station": s.get("station"),
                                     "needs": sorted(set(re.findall(r"Loom\.lesson\.([A-Za-z_]\w*)", src))),
                                     "takes_held": [k for k in s.get("keep") or [] if isinstance(k, str)],
                                     "duration": round(tm[b]["end"] - tm[b]["start"], 2) if b in tm else None,
                                     "from": {"lesson": lesson, "beat": b, "date": today}, "uses": []})
        res["kept"].append(kid)
    from . import ledger as L
    L.log(project, "kept", node="library", decision="keep", choice=f"{len(res['kept'])} kept, {len(res['used'])} reused",
          by={"kind": "engine", "who": "loom.kept"}, data=res)
    info(f"kept for {style}: {len(res['kept'])} new, {len(res['used'])} reuse(s) counted" + (f"; skipped {res['skipped']}" if res["skipped"] else ""))
    return res


def remove(kid: str) -> None:
    d = _dir(kid)
    if not (d / "card.json").exists():
        raise LoomError(f"'{kid}' is not kept")
    shutil.rmtree(d)
    info(f"removed {kid}")


def cli(args) -> int:
    act = args.action or "list"
    if act == "list":
        cs = cards(args.style)
        for c in cs:
            print(f"{c['id']:60s} {c['kind']:5s} from {c.get('from', {}).get('lesson')}, used {len(c.get('uses') or [])}: {c.get('what', '')[:80]}")
        print(f"{len(cs)} kept" + (f" for {args.style}" if args.style else ""))
        return 0
    if act == "keep":
        from .project import Project
        if not args.target:
            raise LoomError("kept keep <lesson>")
        keep(Project.open(args.target), force=args.force)
        return 0
    if act == "remove":
        if not args.target:
            raise LoomError("kept remove <id>")
        remove(args.target)
        return 0
    raise LoomError("kept: list | keep <lesson> | remove <id>")
