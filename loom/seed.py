"""Design seed (D-81; docs/styles/DISTINCTNESS_PLAN.md step 3): the lesson's OWN treatment of the essentials.

    py -m loom seed <id>                       # choose (or re-choose) and write plan/design_seed.json
    py -m loom seed <id> --show                # print the choice, the reasons and the alternatives, write nothing
    py -m loom seed <id> --set label=flag --set bubble=chat     # the person's choice wins, axis by axis
    py -m loom seed <id> --clear               # opt out: the lesson draws the classic treatments again

Why: ten lessons in a row must not look like the same ten components (Kshitij, 2026-10-01). The essentials stay
(D-80): a lesson still needs labels, speech bubbles, panels, icons and tick marks. What changes is their FORM. The
seed names one option per axis (shape language, label, bubble, panel, icon, mark, texture, entrance family, camera
habit); `runtime/treat.js` draws each essential in that option, and the glow pill follows it too.

How the engine chooses, axis by axis (deterministic; no model call):
1. the subject's MATERIAL: keywords from the topic, brief and storyboard metaphor pick one of the materials in
   `packs/seeds/treatments.json` (body, money, rules, tech, people, operations, nature, learning); its preferences
   score first 3, second 2, third 1;
2. AWAY from the recent lessons: an option the previous lesson used loses 4, one used in the 4 before that loses
   1.5 each. A lesson with no seed counts as the classic treatments, because that is what it drew;
3. the style pack's shading can rule an option out (`style_avoid`, e.g. no glass pane in a sketch style);
4. ties break on a hash of the lesson id, so the same lesson always gets the same seed.
The person decides (D-70): `--show` lists the alternatives per axis, `--set` overrides any axis, and a storyboard
may carry `design_seed: {axis: option}` overrides too (compose merges them over the file).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, read_json

VOCAB = ENGINE_ROOT / "packs" / "seeds" / "treatments.json"
AXES = ["shape", "label", "bubble", "panel", "icon", "mark", "texture", "entrance", "camera"]
SEED_FILE = Path("plan") / "design_seed.json"


def vocabulary() -> dict:
    V = read_json(VOCAB, {})
    if not V.get("axes"):
        raise LoomError(f"no seed vocabulary at {VOCAB}")
    return V


def validate(seed: dict, V: dict | None = None) -> list[str]:
    V = V or vocabulary()
    errs = []
    for k, v in (seed or {}).items():
        if k not in V["axes"]:
            errs.append(f"unknown seed axis {k!r} (have: {', '.join(AXES)})")
        elif v not in V["axes"][k]:
            errs.append(f"unknown {k} treatment {v!r} (have: {', '.join(V['axes'][k])})")
    return errs


def _h(s: str) -> int:
    h = 2166136261
    for ch in s.encode("utf-8"):
        h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return h


def subject_text(pdir: Path) -> str:
    pdir = Path(pdir)
    proj = read_json(pdir / "project.json", {})
    brief = read_json(pdir / "plan" / "brief.json", {})
    sb = read_json(pdir / "plan" / "storyboard.json", {})
    story = sb.get("story") or {}
    parts = [proj.get("topic") or "", brief.get("title") or "", brief.get("through_line") or "", brief.get("outcome") or "",
             json.dumps(brief.get("visual_direction") or ""), story.get("metaphor") or "", story.get("setting") or "",
             json.dumps(sb.get("concept") or "")]
    return " ".join(str(p) for p in parts)


def material_of(text: str, V: dict) -> tuple[dict | None, dict]:
    words = re.findall(r"[a-z]+", text.lower())
    scores = {}
    for M in V["materials"]:
        scores[M["id"]] = sum(1 for w in words if any(w == k or (len(k) > 3 and w.startswith(k)) for k in M["keywords"]))
    best = max(V["materials"], key=lambda M: (scores[M["id"]], -V["materials"].index(M)))
    return (best if scores[best["id"]] > 0 else None), scores


def seed_of(pdir: Path) -> dict | None:
    """The seed a lesson draws with: plan/design_seed.json merged with the storyboard's design_seed overrides."""
    pdir = Path(pdir)
    f = read_json(pdir / SEED_FILE, {}).get("seed")
    sb = read_json(pdir / "plan" / "storyboard.json", {}).get("design_seed")
    if not f and not sb:
        return None
    out = dict(f or {})
    out.update(sb or {})
    return out


def recent_seeds(pdir: Path, n: int = 5) -> list[tuple[str, dict]]:
    """The seeds of the lessons made before this one (oldest first). No seed = the classic defaults. An isolated
    lesson (`loom new --isolated`: a comparison run) reads none, and none reads it (R-35's seed read the other film of
    its comparison, L-324)."""
    from .checks.variety import lessons
    V = vocabulary()
    pdir = Path(pdir).resolve()
    mine = read_json(pdir / "project.json", {}) or {}
    if mine.get("isolated"):
        return []
    me = mine.get("created", "")
    out = []
    for d in lessons(pdir.parent):
        if d.resolve() == pdir or (read_json(d / "project.json", {}) or {}).get("isolated"):
            continue
        if me and read_json(d / "project.json", {}).get("created", "") > me:
            continue
        out.append((d.name, dict(V["defaults"], **(seed_of(d) or {}))))
    return out[-n:]


def choose(pdir: Path, overrides: dict | None = None, recent: list[tuple[str, dict]] | None = None, text: str | None = None,
           shading: str | None = None) -> dict:
    pdir = Path(pdir)
    V = vocabulary()
    overrides = overrides or {}
    bad = validate(overrides, V)
    if bad:
        raise LoomError("; ".join(bad))
    recent = recent_seeds(pdir) if recent is None else recent
    text = subject_text(pdir) if text is None else text
    if shading is None:
        style_id = (read_json(pdir / "plan" / "storyboard.json", {}).get("style")
                    or (read_json(pdir / "project.json", {}).get("request") or {}).get("style") or "flat-cosmos")
        shading = (read_json(ENGINE_ROOT / "packs" / "styles" / f"{style_id}.json", {}).get("shape") or {}).get("shading", "")
    M, mscores = material_of(text, V)
    prefers = (M or {}).get("prefers", {})
    avoid = (V.get("style_avoid") or {}).get(shading or "", {})
    seed, reasons, alts = {}, {}, {}
    lid = pdir.name
    for axis in AXES:
        opts = [o for o in V["axes"][axis] if o not in avoid.get(axis, [])]
        pref = prefers.get(axis, [])

        def score(o):
            s = {0: 3.0, 1: 2.0, 2: 1.0}.get(pref.index(o), 0.0) if o in pref else 0.0
            for i, (_, rs) in enumerate(reversed(recent)):
                if rs.get(axis) == o:
                    s -= 4.0 if i == 0 else 1.5
            return s

        ranked = sorted(opts, key=lambda o: (-score(o), _h(f"{lid}:{axis}:{o}")))
        pick = overrides.get(axis) or ranked[0]
        seed[axis] = pick
        used = [rid for rid, rs in recent if rs.get(axis) == pick]
        if axis in overrides:
            reasons[axis] = "chosen by the person"
        else:
            why = []
            if pick in pref:
                why.append(f"the {M['id']} material prefers it")
            why.append(f"used by {', '.join(used)}" if used else f"not used in the last {len(recent)} lesson(s)")
            reasons[axis] = "; ".join(why)
        alts[axis] = [{"as": o, "score": score(o), "means": V["axes"][axis][o]} for o in ranked if o != pick][:3]
    return {"version": 1, "seed": seed, "material": (M or {}).get("id", "general"), "reads_as": (M or {}).get("reads_as", "no material matched: variety only"),
            "material_scores": {k: v for k, v in mscores.items() if v}, "reasons": reasons, "alternatives": alts,
            "recent": [rid for rid, _ in recent], "overrides": overrides, "shading": shading,
            "chosen_by": "person" if overrides and set(overrides) == set(AXES) else ("engine + person" if overrides else "engine")}


def describe(D: dict) -> str:
    V = vocabulary()
    L = [f"design seed: material {D['material']} ({D['reads_as']})", f"recent lessons: {', '.join(D['recent']) or 'none'}", ""]
    for axis in AXES:
        v = D["seed"][axis]
        L.append(f"  {axis:9s} {v:14s} {V['axes'][axis][v]}")
        L.append(f"  {'':9s} {'':14s} why: {D['reasons'][axis]}")
        if D["alternatives"].get(axis):
            L.append(f"  {'':9s} {'':14s} or: " + ", ".join(a["as"] for a in D["alternatives"][axis]))
    L.append("")
    L.append("change any axis: py -m loom seed <id> --set <axis>=<option>   (the person chooses; D-70)")
    return "\n".join(L)


def parse_seed(arg: str | None) -> dict | None:
    """`axis=option,axis=option`, or `@<lesson id>` for that lesson's seed. None/empty -> None."""
    if not arg:
        return None
    if arg.startswith("@"):
        s = seed_of(ENGINE_ROOT / "projects" / arg[1:])
        if not s:
            raise LoomError(f"lesson {arg[1:]} has no design seed")
        return dict(s, name=arg[1:])
    out = {}
    for part in arg.split(","):
        if "=" not in part:
            raise LoomError(f"seed takes axis=option pairs, got {part!r}")
        k, v = part.split("=", 1)
        out[k.strip()] = v.strip()
    bad = validate({k: v for k, v in out.items() if k != "name"})
    if bad:
        raise LoomError("; ".join(bad))
    return out


def ensure_default(pdir: Path) -> dict | None:
    """D-82: a NEW lesson (no storyboard yet, no seed file) gets the engine's seed before its storyboard is planned,
    so ten lessons in a row do not default to the same classic forms. The person changes it with --set, or opts
    out with --clear (which leaves a marker, so this never re-creates it). Existing lessons are never touched."""
    pdir = Path(pdir)
    f = pdir / SEED_FILE
    if f.exists() or (pdir / "plan" / "storyboard.json").exists():
        return None
    D = choose(pdir)
    D["chosen_by"] = "engine (default for a new lesson, D-82)"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(D, indent=1), encoding="utf-8")
    from . import ledger as L
    L.seed_decision(pdir, D, {"kind": "code", "who": "loom/seed.py"})
    return D


def main(project_id: str, sets: list[str] | None = None, show: bool = False, clear: bool = False) -> int:
    pdir = ENGINE_ROOT / "projects" / project_id
    if not (pdir / "project.json").exists():
        print(f"no project {project_id}")
        return 2
    f = pdir / SEED_FILE
    if clear:   # a marker, not a deletion: `go` must not give the lesson a default seed again (D-82)
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps({"version": 1, "seed": None, "cleared": True, "chosen_by": "person"}, indent=1), encoding="utf-8")
        from . import ledger as L
        L.log(pdir, "override", node="seed", decision="design_seed", choice="cleared", by={"kind": "human"})
        print(f"{project_id}: seed cleared; the lesson draws the classic treatments")
        return 0
    prev = read_json(f, {})
    over = dict(prev.get("overrides") or {}) if not prev.get("cleared") else {}
    for s in sets or []:
        if "=" not in s:
            print(f"--set takes axis=option, got {s!r}")
            return 2
        k, v = s.split("=", 1)
        over[k.strip()] = v.strip()
    try:
        D = choose(pdir, over)
    except LoomError as e:
        print(f"seed: {e}")
        return 2
    print(describe(D))
    if not show:
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(D, indent=1), encoding="utf-8")
        from . import ledger as L
        L.seed_decision(pdir, D, {"kind": "human" if sets else "code", "who": "loom seed --set" if sets else "loom/seed.py"})
        print(f"\nwritten: {f.relative_to(ENGINE_ROOT)} (compose passes it to the runtime as style.seed)")
    return 0
