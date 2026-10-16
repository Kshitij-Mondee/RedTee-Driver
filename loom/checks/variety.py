"""Variety ledger and AI-tells lint (docs/styles/DISTINCTNESS_PLAN.md, step 1).

Ten lessons in a row must not look like the same ten components. This module MEASURES that, before anything is
fixed, so every later change can be shown to move the numbers:

- `profile(project_dir)` describes one lesson. It reads:
  - the storyboard (kinds, templates, blueprints, rigs, joins);
  - the bespoke scene sources (glow, kit and motion builder calls, `@form` and `@design` tags, pointer
    pills, hero-size icons, places against wallpaper grounds);
  - `qa/probe.json` when a check has run (the real entrance verbs, templates included).
- `signature(profile)` is the set of things a viewer would recognise as "that again": templates, blueprints,
  forms, designs, glow builders, rigs, label treatments. Generic primitives (rect, text, line) are left out,
  because using them is not a look.
- `ledger(profiles)` compares each lesson with the ones before it. For every pair it gives the signature
  overlap (Jaccard), and it lists the signatures that recur in most of the recent lessons.
- `tells(profile)` gives the AI-tells metrics from the critique of stress-signal. Each is a SHARE or a
  per-beat rate, so lessons of different lengths compare:
  - `pointer_pill_share`: labels that are pills with a pointer line, out of all labels;
  - `hero_icon_rate`: stock icons drawn at 60 px or more (standing in for objects), per bespoke beat;
  - `pop_settle_share`: entrances that are pop or settle, out of all entrances;
  - `wallpaper_share`: bespoke beats on a generic ground with no place builder, out of bespoke beats;
  - `template_share`: beats that are catalog templates (the slide risk), out of all beats.
  - `labels_over_objects_share` (D-90, B1): bespoke beats whose picture is words (pills, text, cards, icons)
    with no object, place, art, data, geo or depth builder drawing the subject itself, out of bespoke beats;
  - `one_world_share` (B2): share of bespoke beats set in the most-used world (the storyboard's `world`, else
    the place or set the scene builds, else the bare ground). One world for the whole lesson reads as one slide
    deck;
  - `lines_per_s` (B12, report only, higher is denser): non-blank, non-comment scene lines per second of
    bespoke beats. The reference films measure 7.5 to 7.8; stress-signal 2.7.

Essentials are keyed by TREATMENT, not by presence (D-80, Kshitij 2026-10-01): a lesson will always need labels,
speech and thought bubbles, panels, icons and tick marks, and using them again is not repetition. Drawing them in the
SAME FORM again is. So every essential enters the signature as `essential:<axis>@<treatment>`:
  - the treatment comes from the lesson's design seed (D-81, `plan/design_seed.json` + storyboard overrides), from an
    explicit `as:` in a `Loom.treat` call, or, best, from the probe's `treatments` (what the runtime really drew);
  - a lesson with no seed draws every essential in its classic form, so its essentials are `@classic`;
  - bespoke `@form` tags that name an essential (speech_bubble, verdict_stamp, outcome_tick...) and kit pills, icons
    and marks are folded into the same keys.
Two lessons that both have speech bubbles share nothing unless both bubbles have the same treatment.
`classic_share` reports the share of essentials still drawn in the classic form (report only until a baseline has it).

Baseline and ratchet (Rule 0 addendum, item 5): `baseline` records each metric's worst value over the existing
lessons. A new lesson WARNS above the baseline median and FAILS only above the baseline worst, so the library is
never failed for its present state and cleanup tightens it (`--baseline` rewrites it, on purpose only).
A ledger with fewer than two lessons, or a lesson with no scenes, is not a result (exit 2).
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

from ..util import ENGINE_ROOT, read_json

BASELINE = ENGINE_ROOT / "loom" / "checks" / "variety_baseline.json"
ENTRANCES = {"pop", "settle", "reveal", "drop", "stamp", "draw", "unmask", "iris", "grow", "converge", "type", "typewriter", "travel", "wipe"}
PLACES = ("scenery", "coral", "fan(", "kelp", "rock(", "depth(", "iso(", "desk", "room", "street", "stage", "crowd", "swarm", "ticket")
METRICS = ["pointer_pill_share", "hero_icon_rate", "pop_settle_share", "wallpaper_share", "template_share", "classic_share",
           "one_radius_share", "still_share", "labels_over_objects_share", "one_world_share"]
REPORT_ONLY = ["lines_per_s"]   # denser is better: reported in the ledger, never a ratchet
# builders that draw a THING (the subject itself), as opposed to words about it (D-90, B1)
OBJECT_SRC = re.compile(r"\b(?:Loom\.obj|Loom\.art|Loom\.place|Loom\.data|Loom\.geo|Loom\.cam|Loom\.array|obj|art|place|data|geo)\.\w+\("
                        r"|ctx\.(?:iso|depth|scenery|crowd|character|lottie|use)\(|\bglow\.(?:planet|orb|blob|body|organ|cell|vessel|world)\w*\("
                        r"|\b(?:kit|k|K)\.(?:path|polygon|disc|sketch|lineShape)\(")
LABEL_SRC = re.compile(r"\bpill\(|\b(?:kit|k|K)\.(?:text|card|icon)\(|\b(?:T|treat|Loom\.treat)\.(?:label|panel|badge)\(")
WORLD_SRC = re.compile(r"(?:Loom\.)?(?:place|scenery)\.(\w+)\(|ctx\.(scenery|depth|iso)\(\s*\"?([\w.-]*)")
CAMERA_SRC = re.compile(r"\b(?:cam|Loom\.cam|C)\.(?:push|pan|pull)\(|kind:\s*\"camera\"|ctx\.depth\(")
# the essentials (D-80): bespoke forms and kit calls that ARE one of the treat axes, keyed by treatment instead
ESSENTIAL_FORMS = {
    "speech_bubble": "bubble", "thought_bubble": "bubble", "chat_bubble": "bubble",
    "icon_label_card": "icon", "person_disc": "icon", "press_button": "icon",
    "verdict_stamp": "label", "label_pinned_to_part": "label", "owner_chip": "label", "summary_tag": "label", "tilted_note": "label",
    "outcome_tick": "mark", "strike_out_stroke": "mark",
    "metric_panel": "panel", "mini_screen_card": "panel", "whiteboard_panel": "panel",
}
ESSENTIAL_KIT = {"pill": "label", "icon": "icon", "mark": "mark"}
TREAT_AXIS = {"label": "label", "bubble": "bubble", "panel": "panel", "badge": "icon", "mark": "mark"}
DEFAULTS = {"label": "pill", "bubble": "round", "panel": "card", "icon": "disc", "mark": "disc"}


def _sources(pdir: Path):
    out = {}
    for f in sorted((pdir / "scenes").glob("*.js")):
        out[f.stem] = f.read_text(encoding="utf-8", errors="replace")
    return out


def profile(pdir: Path) -> dict:
    pdir = Path(pdir)
    proj = read_json(pdir / "project.json", {})
    sb = read_json(pdir / "plan" / "storyboard.json", {})
    scenes = sb.get("scenes") or []
    src = _sources(pdir)
    probe0 = read_json(pdir / "qa" / "probe.json", {})
    probe_treat = probe0.get("treatments") or []
    P = {"id": pdir.name, "dir": str(pdir), "created": proj.get("created", ""), "style": sb.get("style") or (proj.get("request") or {}).get("style"),
         "beats": len(scenes), "kinds": Counter(s.get("kind") for s in scenes), "signature": set(), "calls": Counter(),
         "labels": 0, "pointer_pills": 0, "hero_icons": 0, "bespoke": 0, "wallpaper": 0, "entrances": Counter(),
         "entrance_source": "none", "culprits": {m: [] for m in METRICS}, "radii": Counter(), "radius_source": "none",
         "still": 0, "camera_source": "none", "label_beats": 0, "worlds": Counter(), "lines": 0, "bespoke_s": 0.0}
    tim = {b.get("id"): b for b in (read_json(pdir / "audio" / "timings.json", {}).get("beats") or [])}
    world_of = {s.get("beat"): (s.get("world") or (s.get("design") or {}).get("world")) for s in scenes}
    sig = P["signature"]
    try:
        from ..seed import seed_of
        seed = seed_of(pdir)
    except Exception:
        seed = None
    P["seed"] = seed
    P["essentials"] = Counter()   # (axis, treatment) -> uses

    def essential(axis, treatment=None, n=1):
        tr = treatment or (seed or {}).get(axis) or DEFAULTS.get(axis)
        if tr == DEFAULTS.get(axis):
            tr = "classic"
        P["essentials"][(axis, tr)] += n
        sig.add(f"essential:{axis}@{tr}")
    if seed:
        for ax in ("shape", "texture", "entrance"):
            if seed.get(ax):
                sig.add(f"seed:{ax}={seed[ax]}")
    for s in scenes:
        if s.get("kind") == "template" and s.get("template"):
            sig.add("template:" + s["template"])
        if s.get("kind") == "blueprint" and s.get("blueprint"):
            sig.add("blueprint:" + s["blueprint"])
        if s.get("kind") in ("manim", "skia", "three", "page", "avatar"):
            sig.add("kind:" + s["kind"])
    for c in (sb.get("story") or {}).get("cast") or []:
        if c.get("rig"):
            sig.add("rig:" + c["rig"])
    for beat, code in src.items():
        P["bespoke"] += 1
        # B12: scene density (lines that draw or time something, not comments or blanks)
        P["lines"] += sum(1 for ln in code.splitlines() if ln.strip() and not ln.strip().startswith(("//", "/*", "*")))
        tb = tim.get(beat)
        if tb and tb.get("end") is not None and tb.get("start") is not None:
            P["bespoke_s"] += float(tb["end"]) - float(tb["start"])
        # B1: a picture made of words only (no builder that draws a thing)
        if LABEL_SRC.search(code) and not OBJECT_SRC.search(code):
            P["label_beats"] += 1
            P["culprits"]["labels_over_objects_share"].append(beat)
        # B2: the world this beat is set in
        w = world_of.get(beat)
        if not w:
            m = WORLD_SRC.search(code)
            if m:
                w = m.group(1) or (m.group(2) + (":" + m.group(3) if m.group(3) else ""))
            else:   # a set named by the props it builds (desk, kelp, crowd ...), else the bare ground
                w = next((pl.rstrip("(") for pl in PLACES if pl in code), "ground")
        P["worlds"][w] += 1
        P.setdefault("beat_world", {})[beat] = w
        for m in re.finditer(r"@form\s+([a-z0-9_]+)", code):
            if m.group(1) in ESSENTIAL_FORMS:   # bespoke code does not follow the seed: counted as the classic look
                essential(ESSENTIAL_FORMS[m.group(1)], "classic")
            else:
                sig.add("form:" + m.group(1))
        for m in re.finditer(r"@design\s+([a-z0-9_]+)", code):
            d = m.group(1)
            sig.add("design:" + d.removesuffix("_continued"))
        for m in re.finditer(r"\b(?:G|glow|Loom\.glow)\.(\w+)\(", code):
            P["calls"]["glow." + m.group(1)] += 1
            if m.group(1) not in ("token", "smooth", "blobPath"):
                sig.add("glow:" + m.group(1))
        for m in re.finditer(r"\b(?:kit|k|K)\.(\w+)\(", code):
            P["calls"]["kit." + m.group(1)] += 1
            if m.group(1) in ESSENTIAL_KIT:
                essential(ESSENTIAL_KIT[m.group(1)], "classic")   # kit pills, icons and marks have one form
            elif m.group(1) in ("peep", "kicker", "arrow"):
                sig.add("kit:" + m.group(1))
        if not probe_treat:
            for m in re.finditer(r"\b(?:T|treat|Loom\.treat)\.(label|bubble|panel|badge|mark)\((.*?)\);", code, re.S):
                a = re.search(r'\bas:\s*"(\w+)"', m.group(2))
                essential(TREAT_AXIS[m.group(1)], a.group(1) if a else None)
        for m in re.finditer(r'ctx\.character\(\s*"[^"]*"\s*,\s*"(\w+)"', code):
            sig.add("rig:" + m.group(1))
        for m in re.finditer(r'ctx\.(scenery|depth|iso|crowd|narrationCard|use|lottie)\(\s*"?([\w.-]*)', code):
            sig.add(f"ctx:{m.group(1)}" + (f":{m.group(2)}" if m.group(1) in ("scenery", "use") else ""))
        # labels: pills and kit.text, and how many pills carry a pointer line
        pills = re.findall(r"\bpill\((.*?)\);", code, re.S)
        if any("point:" in p for p in pills):
            P["culprits"]["pointer_pill_share"].append(beat)
        P["labels"] += len(pills) + len(re.findall(r"\b(?:kit|k)\.text\(", code))
        P["pointer_pills"] += sum(1 for p in pills if "point:" in p)
        if any("point:" in p for p in pills):
            essential("label", "classic" if not seed or (seed or {}).get("label", "pill") == "pill" else seed["label"])
        for m in re.finditer(r"\b(?:kit|k)\.icon\((.*?)\);", code, re.S):
            sz = re.search(r"size:\s*([\d.]+)", m.group(1))
            if sz and float(sz.group(1)) >= 60:
                P["hero_icons"] += 1
                if beat not in P["culprits"]["hero_icon_rate"]:
                    P["culprits"]["hero_icon_rate"].append(beat)
        if re.search(r"\bground\(", code) and not any(p in code for p in PLACES) and "place." not in code:
            P["wallpaper"] += 1
            P["culprits"]["wallpaper_share"].append(beat)
        for m in re.finditer(r"\b(?:kit|k|K)\.(?:rect|card)\((.*?)\);", code, re.S):   # source fallback for the radius tell
            r = re.search(r"\br:\s*([\w.]+)", m.group(1))
            P["src_radii"] = P.get("src_radii") or Counter()
            P["src_radii"][r.group(1) if r else "default"] += 1
        P.setdefault("cam_src", {})[beat] = bool(CAMERA_SRC.search(code))
    # the radius tell: from the probe when it recorded radii, else from the source
    if probe0.get("radii"):
        P["radii"], P["radius_source"] = Counter(probe0["radii"]), "probe"
    elif P.get("src_radii"):
        P["radii"], P["radius_source"] = P["src_radii"], "source"
    # still beats: bespoke beats with no camera move (probe camera tweens, else the source)
    cam_beats = {t.get("beat") for t in (probe0.get("tweens") or []) if t.get("kind") == "camera"}
    if probe0.get("tweens"):
        P["camera_source"] = "probe"
        stills = [b for b in src if b not in cam_beats]
    else:
        P["camera_source"] = "source" if src else "none"
        stills = [b for b, has in (P.get("cam_src") or {}).items() if not has]
    # the world camera counts too: a camera/zoom/travel join into the beat, or a push/pull inside it (shot.move)
    joins = {s.get("beat") for s in scenes if (s.get("join_in") or {}).get("type") in ("camera", "zoom", "travel")
             or (s.get("shot") or {}).get("move") in ("push", "pull")}
    stills = [b for b in stills if b not in joins]
    P["still"] = len(stills)
    P["culprits"]["still_share"] = stills
    if P["worlds"]:
        top = P["worlds"].most_common(1)[0][0]
        P["culprits"]["one_world_share"] = [b for b, w in P["beat_world"].items() if w == top][:8] if P["worlds"][top] > 1 else []
    for t in probe_treat:   # what the runtime really drew beats any reading of the source
        essential(t.get("axis"), t.get("as"))
    if seed and seed.get("label") and seed["label"] != "pill":
        P["pointer_pills"] = 0   # glow pills follow the seed: none of them is drawn as a pointer pill
    probe = probe0
    tw = [t.get("kind") for t in (probe.get("tweens") or [])]
    ent = Counter(k for k in tw if k in ENTRANCES)
    if ent:
        P["entrances"], P["entrance_source"] = ent, "probe"
    else:   # no check yet: count the motion calls in the scene sources
        for code in src.values():
            for m in re.finditer(r"\b(?:m|ctx\.m|Loom\.motion)\.(\w+)\(", code):
                if m.group(1) in ENTRANCES:
                    P["entrances"][m.group(1)] += 1
        P["entrance_source"] = "source" if P["entrances"] else "none"
    for v, n in P["entrances"].most_common(3):
        sig.add("verb:" + v)
    return P


def tells(P: dict) -> dict:
    ent = sum(P["entrances"].values())
    div = lambda a, b: round(a / b, 3) if b else None
    return {
        "pointer_pill_share": div(P["pointer_pills"], P["labels"]),
        "hero_icon_rate": div(P["hero_icons"], P["bespoke"]),
        "pop_settle_share": div(P["entrances"]["pop"] + P["entrances"]["settle"], ent),
        "wallpaper_share": div(P["wallpaper"], P["bespoke"]),
        "template_share": div(P["kinds"].get("template", 0), P["beats"]),
        "classic_share": div(sum(n for (a, tr), n in P["essentials"].items() if tr == "classic"), sum(P["essentials"].values())),
        "one_radius_share": div(max(P["radii"].values()), sum(P["radii"].values())) if P["radii"] else None,
        "still_share": div(P["still"], P["bespoke"]),
        "labels_over_objects_share": div(P.get("label_beats", 0), P["bespoke"]),
        "one_world_share": div(max(P["worlds"].values()), P["bespoke"]) if P.get("worlds") else None,
        "lines_per_s": round(P["lines"] / P["bespoke_s"], 2) if P.get("bespoke_s") else None,
    }


def jaccard(a: set, b: set) -> float:
    return round(len(a & b) / len(a | b), 3) if (a or b) else 0.0


def lessons(root: Path | None = None, include_demo: bool = False) -> list[Path]:
    root = root or ENGINE_ROOT / "projects"
    out = []
    for d in sorted(root.iterdir()):
        if not d.is_dir() or (d.name.startswith((".", "_")) and not include_demo):
            continue
        if (d / "plan" / "storyboard.json").exists():
            out.append(d)
    return sorted(out, key=lambda d: (read_json(d / "project.json", {}).get("created", ""), d.name))


def ledger(profiles: list[dict], last: int = 5) -> dict:
    rows = []
    for i, P in enumerate(profiles):
        prev = profiles[max(0, i - last):i]
        overlaps = {Q["id"]: jaccard(P["signature"], Q["signature"]) for Q in prev}
        shared = sorted(set().union(*[P["signature"] & Q["signature"] for Q in prev])) if prev else []
        rows.append({"id": P["id"], "style": P["style"], "signature_size": len(P["signature"]),
                     "max_overlap": max(overlaps.values()) if overlaps else None, "overlaps": overlaps,
                     "shared_with_recent": shared, "tells": tells(P), "entrance_source": P["entrance_source"]})
    window = profiles[-last:]
    freq = Counter(s for P in window for s in P["signature"])
    recurring = sorted([(s, n) for s, n in freq.items() if n >= max(2, (len(window) + 1) // 2)], key=lambda x: (-x[1], x[0]))
    return {"lessons": rows, "recurring": recurring, "window": [P["id"] for P in window]}


def baseline_from(profiles: list[dict]) -> dict:
    B = {}
    for m in METRICS:
        vals = sorted(v for v in (tells(P)[m] for P in profiles) if v is not None)
        if vals:
            B[m] = {"worst": vals[-1], "median": vals[len(vals) // 2], "n": len(vals)}
    return {"metrics": B, "lessons": [P["id"] for P in profiles]}


def judge(P: dict, base: dict) -> tuple[list[str], list[str]]:
    """(errors, warnings) for one lesson against the baseline ratchet."""
    E, W = [], []
    T = tells(P)
    for m, v in T.items():
        if m in REPORT_ONLY:
            continue
        b = (base.get("metrics") or {}).get(m)
        if v is None or not b:
            continue
        who = P.get("culprits", {}).get(m) or []
        tail = f" (beats: {', '.join(who[:8])})" if who else ""
        if v > b["worst"] + 1e-9:
            E.append(f"{m} = {v} is worse than the worst baseline lesson ({b['worst']}): it grew{tail}")
        elif v > b["median"] + 1e-9:
            W.append(f"{m} = {v} is above the baseline median ({b['median']}){tail}")
    # the seed (D-81, D-82): a lesson outside the baseline should have one, and should keep its camera habit
    if P["id"] not in (base.get("lessons") or []):
        seedfile = read_json(Path(P.get("dir", "")) / "plan" / "design_seed.json", {}) if P.get("dir") else {}
        if not P.get("seed") and not seedfile.get("cleared"):
            W.append(f"no design seed: its essentials draw the classic forms every lesson shares (py -m loom seed {P['id']})")
        hab = (P.get("seed") or {}).get("camera")
        if hab in ("push", "pan") and P["bespoke"] and P["still"] / P["bespoke"] > 0.6:
            W.append(f"the seed's camera habit is '{hab}' but {P['still']} of {P['bespoke']} bespoke beats have no camera move")
    return E, W


def report(rep: dict) -> str:
    L = [f"variety ledger over {len(rep['lessons'])} lesson(s) (window: {', '.join(rep['window'])})", ""]
    cols = METRICS + REPORT_ONLY
    L.append("| lesson | style | signature | max overlap with recent | " + " | ".join(cols) + " |")
    L.append("|---|---|---|---|" + "---|" * len(cols))
    for r in rep["lessons"]:
        t = r["tells"]
        L.append(f"| {r['id']} | {r['style']} | {r['signature_size']} | {r['max_overlap'] if r['max_overlap'] is not None else '-'} | "
                 + " | ".join("-" if t.get(m) is None else str(t[m]) for m in cols) + " |")
    if rep["recurring"]:
        L += ["", "recurring in the window (what a viewer would notice again): " + ", ".join(f"{s} x{n}" for s, n in rep["recurring"][:30])]
    return "\n".join(L)


def main(project_id: str | None = None, last: int = 5, write_baseline: bool = False, include_demo: bool = False) -> int:
    dirs = lessons(include_demo=include_demo)
    profs = [profile(d) for d in dirs]
    profs = [P for P in profs if P["beats"]]
    if len(profs) < 2:
        print(f"variety: {len(profs)} lesson(s) with a storyboard; a ledger needs at least two (a zero is not a result)")
        return 2
    rep = ledger(profs, last)
    print(report(rep))
    out = ENGINE_ROOT / "cache" / "variety"
    out.mkdir(parents=True, exist_ok=True)
    (out / "ledger.json").write_text(json.dumps(rep, indent=1, default=list))
    if write_baseline:
        B = baseline_from(profs)
        BASELINE.write_text(json.dumps(B, indent=1))
        print(f"\nbaseline written from {len(profs)} lessons -> {BASELINE.relative_to(ENGINE_ROOT)}")
        return 0
    base = read_json(BASELINE, {})
    if not base:
        print("\nno baseline yet: run with --baseline once to record the present state")
        return 0
    code = 0
    targets = [P for P in profs if P["id"] == project_id] if project_id else [P for P in profs if P["id"] not in base.get("lessons", [])]
    if project_id and not targets:
        print(f"\nno lesson {project_id} with a storyboard"); return 2
    for P in targets:
        E, W = judge(P, base)
        r = next(x for x in rep["lessons"] if x["id"] == P["id"])
        if r["max_overlap"] is not None and r["max_overlap"] >= 0.5:
            W.append(f"shares {r['max_overlap']:.0%} of its signature with a recent lesson")
        print(f"\n{P['id']}: {len(E)} error(s), {len(W)} warning(s)")
        for e in E:
            print("  [error]", e)
        for w in W:
            print("  [warn]", w)
        code = code or (1 if E else 0)
    return code
