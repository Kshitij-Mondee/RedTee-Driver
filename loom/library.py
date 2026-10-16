"""The element library: count the small forms scenes build, and promote the ones worth reusing.

A FORM is a small element idea a bespoke scene builds (a condition card, a strike-and-replace, a
room of heads turning). Scene authors tag them in the code:

    // @form condition_card: an icon card naming one contributing condition

Every lesson feeds the library (`loom library harvest`, also run by `loom go` after render):
  1. COUNT  - each scene that builds a form (a tag, or ctx.use of its component) is one use. Elements
              merely held from an earlier scene are not tagged there, so they do not count.
  2. ASSESS - at `promote_after` uses (default 3) the form becomes a candidate, and a plan-tier model
              judges it: is the idea topic-independent, did it vary across uses, can we name concrete
              future lessons that need it? Only a confident "promote" goes on. "defer" and "reject" are
              recorded with a revisit threshold, so a weak form is not re-assessed on every lesson.
  3. PROMOTE - a build-tier model writes runtime/components/<form>.js (idea + outline fixed; params,
              slots and returned parts adjustable) with fixtures, and it must pass `library accept`:
              content params have no defaults, no banned JS, the fixtures render in EVERY style pack
              with zero runtime errors. Existing scenes are never rewritten (no regeneration needed).

Promotion is automatic (no human gate) but never blind: the count opens the door, the assessment
decides, the gates prove. Generated files: library/forms.json, library/FORMS.md, library/scenes/,
library/tasks/, library/sheets/. Decisions live in library/decisions.json (written by `accept`).
"""
from __future__ import annotations

import json
import re
import shutil
import tempfile
from pathlib import Path

import contextlib
import os
import time

from .util import ENGINE_ROOT, LoomError, info, read_json, run, sha, which, write_json

LIB = ENGINE_ROOT / "library"
COMP = ENGINE_ROOT / "runtime" / "components"
FORM_TAG = re.compile(r"(?://|#)\s*@form\s+([a-z][a-z0-9_]{2,40})\s*:\s*(.+?)\s*$", re.M)
BAD_TAG = re.compile(r"(?://|#)\s*@form\b(?!\s+[a-z][a-z0-9_]{2,40}\s*:\s*\S)", re.M)
DESIGN_TAG = re.compile(r"(?://|#)\s*@design\s+([a-z][a-z0-9_]{2,40})\s*:\s*(.+?)\s*$", re.M)
BAD_DESIGN = re.compile(r"(?://|#)\s*@design\b(?!\s+[a-z][a-z0-9_]{2,40}\s*:\s*\S)", re.M)
USE = re.compile(r"""\bctx\.use\(\s*["']([a-z][a-z0-9_]{2,40})(?:@\d+)?["']""")
DECISIONS = ("promote", "defer", "reject", "merge")
STYLE_PACKS = ENGINE_ROOT / "packs" / "styles"


_LOCK_DEPTH = [0]


@contextlib.contextmanager
def _locked(timeout: float = 120.0, stale: float = 600.0):
    """Exclusive lock around library/decisions.json and the generated tables, so parallel agents can each run
    `library accept` (L-38). Re-entrant within one process. A lock older than `stale` seconds is treated as
    abandoned (a killed process) and broken."""
    if _LOCK_DEPTH[0]:
        _LOCK_DEPTH[0] += 1
        try:
            yield
        finally:
            _LOCK_DEPTH[0] -= 1
        return
    LIB.mkdir(parents=True, exist_ok=True)
    lock = LIB / ".decisions.lock"
    t0 = time.time()
    while True:
        try:
            fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, f"{os.getpid()} {time.time():.0f}".encode()); os.close(fd)
            break
        except FileExistsError:
            try:
                if time.time() - lock.stat().st_mtime > stale:
                    lock.unlink(); continue
            except FileNotFoundError:
                continue
            if time.time() - t0 > timeout:
                raise LoomError(f"library is locked by another accept ({lock}); retry, or delete the lock if no accept is running")
            time.sleep(0.2)
    _LOCK_DEPTH[0] = 1
    try:
        yield
    finally:
        _LOCK_DEPTH[0] = 0
        with contextlib.suppress(FileNotFoundError):
            lock.unlink()


def promote_after() -> int:
    return int((read_json(ENGINE_ROOT / "loom.config.json", {}) or {}).get("library", {}).get("promote_after", 3))


def _projects():
    from .project import projects_root
    root = projects_root()
    for d in sorted(root.iterdir()) if root.exists() else []:
        if d.is_dir() and not d.name.startswith((".", "_")) and (d / "project.json").exists() and (d / "scenes").exists():
            if (read_json(d / "project.json", {}) or {}).get("library", True) is False:
                continue  # test/smoke projects opt out: they would inflate the counts
            yield d


def scene_forms(src: str) -> tuple[dict[str, str], set[str], list[str]]:
    """(tagged forms {id: idea}, component uses {id}, malformed-tag lines)."""
    tags = {}
    for m in FORM_TAG.finditer(src):
        tags.setdefault(m.group(1), m.group(2))
    uses = set(USE.findall(re.sub(r"//.*|/\*[\s\S]*?\*/|^\s*#.*$", "", src, flags=re.M)))  # commented-out uses do not count
    bad = [src[m.start():src.find("\n", m.start())].strip() for m in BAD_TAG.finditer(src)]
    return tags, uses, bad


def _components() -> dict:
    return (read_json(ENGINE_ROOT / "runtime/catalog.json", {}) or {}).get("components", {}) or {}


def _tokens(fid: str) -> set[str]:
    return {t for t in fid.split("_") if len(t) > 2}


def template_promote_after() -> int:
    return int((read_json(ENGINE_ROOT / "loom.config.json", {}) or {}).get("library", {}).get("template_promote_after", 2))


def scene_designs(src: str) -> tuple[dict[str, str], list[str]]:
    """(tagged whole-beat designs {id: idea}, malformed-tag lines). One design per scene is expected."""
    tags = {}
    for m in DESIGN_TAG.finditer(src):
        tags.setdefault(m.group(1), m.group(2))
    bad = [src[m.start():src.find("\n", m.start())].strip() for m in BAD_DESIGN.finditer(src)]
    return tags, bad


_LIT = re.compile(r"""(?<![\\\w])(["'])([A-Za-z][A-Za-z '.,?!-]{2,80})\1""")


def _signature(src: str, line: int | None = None, span: int = 0) -> frozenset:
    """The on-screen CONTENT a scene carries: its plain-words string literals (2+ words, no code characters).
    Heuristic, used only to spot one element re-drawn with the same words in several scenes of ONE lesson."""
    return frozenset(m.group(2).strip().lower() for m in _LIT.finditer(src) if len(m.group(2).split()) >= 2)


def _distinct(uses: list[dict]) -> int:
    """Count uses, collapsing same-lesson uses that carry the same content (2+ identical content strings) (L-32)."""
    kept: list[dict] = []
    for u in uses:
        sig = u.get("_sig") or frozenset()
        dup = next((k for k in kept if k["project"] == u["project"] and len(sig & (k.get("_sig") or frozenset())) >= 2), None)
        if dup:
            u["same_as"] = f"{dup['project']}/{dup['scene']}"
        else:
            kept.append(u)
    return len(kept)


def _status(count, lessons, N, d, built, promoted):
    rv = (d or {}).get("revisit_when") or {}
    if promoted:
        return "promoted"
    if count < N and not (d or {}).get("decision") == "promote":
        return "counting"
    if (d or {}).get("decision") == "promote":
        return "built" if built else "approved"
    if (d or {}).get("decision") in ("defer", "reject") and count < rv.get("uses", 10 ** 6) and lessons < rv.get("lessons", 10 ** 6):
        return "deferred" if d["decision"] == "defer" else "rejected"
    if (d or {}).get("decision") == "merge":
        return "merged"
    return "candidate"


def _catalog() -> dict:
    return read_json(ENGINE_ROOT / "runtime/catalog.json", {}) or {}


def design_template(did: str) -> tuple[str | None, str | None, dict | None]:
    """(kind, id, entry) of the template/blueprint promoted from design `did`, if one is registered."""
    cat = _catalog()
    for kind in ("templates", "blueprints"):
        for tid, e in (cat.get(kind) or {}).items():
            if e.get("promoted_from_design") == did:
                return kind[:-1], tid, e
    return None, None, None


def harvest(write: bool = True) -> dict:
    """Scan every project's scenes; count element forms and whole-beat designs; set their statuses."""
    N, ND = promote_after(), template_promote_after()
    decisions = read_json(LIB / "decisions.json", {}) or {}
    aliases = {k: v["merge_into"] for k, v in decisions.items() if v.get("decision") == "merge" and v.get("merge_into") and not k.startswith("design:")}
    daliases = {k[7:]: v["merge_into"] for k, v in decisions.items() if v.get("decision") == "merge" and v.get("merge_into") and k.startswith("design:")}
    comps = _components()
    forms: dict[str, dict] = {}
    designs: dict[str, dict] = {}
    copies = []
    for pdir in _projects():
        pcfg = read_json(pdir / "project.json", {})
        style = (read_json(pdir / "plan/storyboard.json", {}) or {}).get("style") or pcfg.get("request", {}).get("style")
        for f in sorted(list((pdir / "scenes").glob("*.js")) + list((pdir / "scenes").glob("*.py"))):
            src = f.read_text(encoding="utf-8")
            lines = src.splitlines()
            tags, uses, _ = scene_forms(src)
            dtags, _ = scene_designs(src)
            copies.append((f, pdir.name))
            rel = f"library/scenes/{pdir.name}/{f.name}"
            seen = set()
            for fid, idea in list(tags.items()) + [(u, None) for u in uses]:
                fid = aliases.get(fid, fid)
                if fid in seen:
                    continue
                seen.add(fid)
                F = forms.setdefault(fid, {"ideas": [], "uses": []})
                if idea and idea not in F["ideas"]:
                    F["ideas"].append(idea)
                line = next((i + 1 for i, l in enumerate(lines) if f"@form {fid}" in l or f'use("{fid}' in l), None)
                F["uses"].append({"project": pdir.name, "scene": f.stem, "file": rel, "line": line, "style": style,
                                  "via": "tag" if fid in tags else "component", "_sig": _signature(src, line)})
            for did, idea in dtags.items():
                if did.endswith("_continued"):
                    continue  # an extension of the previous scene's held picture, not a new use
                did = daliases.get(did, did)
                D = designs.setdefault(did, {"ideas": [], "uses": []})
                if idea not in D["ideas"]:
                    D["ideas"].append(idea)
                line = next((i + 1 for i, l in enumerate(lines) if f"@design {did}" in l), None)
                D["uses"].append({"project": pdir.name, "scene": f.stem, "file": rel, "line": line, "style": style, "_sig": _signature(src, line, 400)})
    for fid, F in forms.items():
        F["raw_count"] = len(F["uses"])
        F["count"] = _distinct(F["uses"])
        F["lessons"] = len({u["project"] for u in F["uses"]})
        F["component"] = f"{fid}@{comps[fid]['version']}" if fid in comps else None
        d = decisions.get(fid)
        F["status"] = _status(F["count"], F["lessons"], N, d, bool(F["component"]), bool(F["component"]))
        F["decision"] = d or None
    for did, D in designs.items():
        D["raw_count"] = len(D["uses"])
        D["count"] = _distinct(D["uses"])
        D["lessons"] = len({u["project"] for u in D["uses"]})
        kind, tid, _ = design_template(did)
        d = decisions.get(f"design:{did}")
        D["template"] = f"{kind}:{tid}" if tid else None
        D["status"] = _status(D["count"], D["lessons"], ND, d, bool(tid), bool(tid) and (d or {}).get("status") == "promoted")
        D["decision"] = d or None
    for T in (forms, designs):
        for F in T.values():
            for u in F["uses"]:
                u.pop("_sig", None)
    dupes = []
    for pool in (forms, designs):
        ids = sorted(pool)
        for i, a in enumerate(ids):
            for b in ids[i + 1:]:
                ta, tb = _tokens(a), _tokens(b)
                if ta and tb and len(ta & tb) / len(ta | tb) >= 0.5:
                    dupes.append([a, b])
    table = {"generated_by": "loom library harvest (do not hand-edit)", "promote_after": N, "template_promote_after": ND,
             "forms": forms, "designs": designs, "possible_duplicates": dupes}
    if write:
        with _locked():
            _write_table(table, copies)
    return table


def _write_table(table, copies):
    if True:
        LIB.mkdir(exist_ok=True)
        sc = LIB / "scenes"
        if sc.exists():
            shutil.rmtree(sc)
        for f, pid in copies:
            (sc / pid).mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, sc / pid / f.name)
        write_json(LIB / "forms.json", table)
        (LIB / "FORMS.md").write_text(_forms_md(table), encoding="utf-8")
    return table


def _forms_md(t: dict) -> str:
    order = {"promoted": 0, "built": 1, "approved": 2, "candidate": 3, "deferred": 4, "rejected": 5, "merged": 6, "counting": 7}
    md = ["# Loom element library (generated by `loom library harvest` - do not hand-edit)", "",
          "Scene authors: REUSE an existing id when your element or design has the same idea, so uses add up.",
          "`uses` collapses same-lesson re-draws of the same content (raw tag count in brackets).", "",
          f"## Element forms (components; assessed at {t['promote_after']} uses)", "",
          "| form | uses | lessons | status | idea |", "|---|---|---|---|---|"]
    for fid, F in sorted(t["forms"].items(), key=lambda kv: (order.get(kv[1]["status"], 9), -kv[1]["count"], kv[0])):
        idea = (F["ideas"] or ["(component use only)"])[0].replace("|", "/")
        md.append(f"| `{fid}` | {F['count']} [{F['raw_count']}] | {F['lessons']} | {F['status']}{' ' + F['component'] if F['component'] else ''} | {idea} |")
    md += ["", f"## Beat designs (templates; assessed at {t['template_promote_after']} uses)", "",
           "| design | uses | lessons | status | idea |", "|---|---|---|---|---|"]
    for did, D in sorted(t.get("designs", {}).items(), key=lambda kv: (order.get(kv[1]["status"], 9), -kv[1]["count"], kv[0])):
        md.append(f"| `{did}` | {D['count']} [{D['raw_count']}] | {D['lessons']} | {D['status']}{' ' + D['template'] if D['template'] else ''} | {D['ideas'][0].replace('|', '/')} |")
    if not t.get("designs"):
        md.append("| (none tagged yet) | | | | |")
    if t["possible_duplicates"]:
        md += ["", "Possible duplicates (same idea, different names?): " + "; ".join(f"`{a}` / `{b}`" for a, b in t["possible_duplicates"])]
    dec = [(k, v["decision"]) for k, v in t["forms"].items() if v.get("decision")] + \
          [(f"design:{k}", v["decision"]) for k, v in t.get("designs", {}).items() if v.get("decision")]
    if dec:
        md += ["", "## Decisions", ""]
        for k, d in sorted(dec):
            md.append(f"- `{k}`: **{d['decision']}** ({d.get('confidence', '?')} confidence, at {d.get('at_uses', '?')} uses). {d.get('reason', '')}")
    return "\n".join(md) + "\n"


# ------------------------------------------------------------------ tasks
def _models():
    from .project import DEFAULT_MODELS
    return DEFAULT_MODELS


def _uses_block(F) -> list[str]:
    out = []
    for u in F["uses"]:
        out.append(f"- `{ENGINE_ROOT / u['file']}` (project `{u['project']}`, scene `{u['scene']}`, line {u['line']}, style `{u['style']}`)")
    return out


def write_tasks(table: dict | None = None) -> list[Path]:
    table = table or harvest()
    out = []
    (LIB / "tasks").mkdir(parents=True, exist_ok=True)
    for fid, F in sorted(table["forms"].items()):
        if F["status"] == "candidate":
            out.append(_assess_task(fid, F, table))
        elif F["status"] == "approved":
            out.append(_promote_task(fid, F))
    for did, D in sorted((table.get("designs") or {}).items()):
        if D["status"] == "candidate":
            out.append(_assess_design_task(did, D, table))
        elif D["status"] == "approved":
            out.append(_promote_design_task(did, D))
        elif D["status"] == "built":
            out.append(_selection_task(did))
    return out


def _assess_task(fid, F, table) -> Path:
    m = _models()
    dup = [d for d in table["possible_duplicates"] if fid in d]
    comps = sorted(_components())
    lines = [f"# Loom library - assess the form `{fid}` for reuse", "",
             f"**Recommended model:** Opus (planning / judgment) - `{m.get('plan', '')}`", "",
             f"`{fid}` has been built {F['count']} times in {F['lessons']} lesson(s). The count only opens the door: YOU decide",
             "whether it is worth a reusable component. Be strict. A component nobody reuses is library bloat that",
             "every future scene author has to read past; a component that bakes in one lesson's content leaks",
             "that content into other lessons.", "",
             "## Read these uses (the whole scene, then the tagged part)", ""] + _uses_block(F) + [
             "", "Tagged ideas: " + "; ".join(f'"{i}"' for i in F["ideas"]), "",
             f"Existing components: {', '.join(comps) or 'none'}. Current forms table: `{LIB / 'FORMS.md'}`.",
             *(["", f"Possible duplicate names: {dup}. If they are the same idea, decide `merge` into one id."] if dup else []), "",
             "## Decide", "",
             "Promote ONLY if every one of these holds (otherwise defer or reject):",
             "1. **Topic-independent idea.** Stated without this lesson's nouns it still makes sense (\"an icon card naming one",
             "   contributing condition\" yes; \"the checkout-failed cart\" no).",
             "2. **It varied across uses** (different words, counts, layouts) and one param set covers the variation. Three copies",
             "   of the same held element are ONE use, not three.",
             "3. **Concrete future demand:** name at least 3 different lesson topics or genres (not variations of this one) and",
             "   what the element would show in each.",
             "4. **Small.** It is an element or a part of a scene (a card, a mark, a connector, a character bit), not a whole",
             "   scene or beat layout. If the only reusable thing is the whole scene, reject: scenes stay bespoke.",
             "5. **Worth it:** reusing it saves real work or fixes a recurring defect, compared with writing it inline.", "",
             "Confidence must be `high` to promote. `medium` means defer with a revisit threshold.", "",
             "## Output", "",
             f"Write exactly ONE file: `{LIB / 'assessments' / (fid + '.json')}`:", "",
             "```json",
             json.dumps({"form": fid, "decision": "promote | defer | reject | merge", "confidence": "high | medium | low",
                         "topic_independent": True, "idea": "one sentence, no lesson nouns",
                         "outline": ["the fixed parts, in order"],
                         "variation_seen": ["what differed between the uses"],
                         "future_uses": [{"topic": "a different lesson", "shows": "what the element would show"}],
                         "params_sketch": {"content": ["label"], "adjustable": ["w", "icon", "accent"]},
                         "slots_sketch": ["parts a caller may redraw"],
                         "reason": "why, in two sentences", "merge_into": None,
                         "revisit_when": {"uses": F["count"] + 3, "lessons": F["lessons"] + 2}}, indent=1),
             "```", "",
             "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", f"py -m loom library check {fid}    # validates your file",
             f"py -m loom library accept {fid}   # records the decision (and, on promote, writes the promotion task)", "```", ""]
    p = LIB / "tasks" / f"assess-{fid}.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


def _promote_task(fid, F) -> Path:
    m = _models()
    a = read_json(LIB / "assessments" / f"{fid}.json", {})
    lines = [f"# Loom library - promote `{fid}` to a component", "",
             f"**Recommended model:** Sonnet (building) - `{m.get('build', '')}`", "",
             "The assessment below approved this form. Turn it into ONE reusable component: the IDEA and the rough",
             "OUTLINE are fixed; everything a future scene might want to change is a param, a slot, or a returned part.",
             "Do NOT rewrite any existing scene: they keep working as they are.", "",
             "## Read first", "",
             f"- `{ENGINE_ROOT / 'docs/COMPONENTS.md'}` (the component contract, with a worked example)",
             f"- `{ENGINE_ROOT / 'runtime/components.js'}` (the registry: params, slots, variants, versions)",
             f"- `{ENGINE_ROOT / 'docs/SCENE_API.md'}` and `{ENGINE_ROOT / 'runtime/kit.js'}` (the primitives you build with)",
             f"- `{ENGINE_ROOT / 'skills/lnd/lnd-visual-design/SKILL.md'}` (type floors, contrast, one idea per element)", "",
             "## The uses it is promoted from", ""] + _uses_block(F) + [
             "", "## The assessment", "", "```json", json.dumps(a, indent=1, ensure_ascii=False), "```", "",
             "## Output (exactly these two files)", "",
             f"1. `{COMP / (fid + '.js')}`: `Loom.component(\"{fid}\", {{ version: 1, idea, outline, params, slots, parts, promoted_from, example, build(ctx, g, p, slots) {{ ... return parts; }} }})`.",
             "   - Every on-screen word or number is a param with `content: true` and NO default.",
             "   - Geometry, tokens, emphasis and timing anchors are params WITH defaults drawn from the uses.",
             "   - `promoted_from`: the use list above as `\"project/scene\"` strings.",
             "   - Colours only from style tokens; text only through `kit.text` (floors are enforced); deterministic.",
             "   - It must read in every style pack (flat, crescent, paper, sketch): no knockout text on a dark fill.",
             f"2. `{COMP / 'fixtures' / (fid + '.json')}`: `{{\"cases\": [{{\"label\": \"...\", \"params\": {{...}}, \"opts\": {{\"x\": 700, \"y\": 400}}, \"cues\": {{}}}}]}}`",
             "   with at least 3 cases whose CONTENT differs (take them from the uses, plus one from a future use in the assessment)", "",
             "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", f"py -m loom library accept {fid}", "```",
             f"It renders every fixture in every style pack to `{LIB / 'sheets' / (fid + '.jpg')}`: LOOK at that image before you claim it works.", ""]
    p = LIB / "tasks" / f"promote-{fid}.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


# ------------------------------------------------------------------ gates
def check_assessment(fid: str) -> list[str]:
    p = LIB / "assessments" / f"{fid}.json"
    if not p.exists():
        return [f"missing {p}"]
    a = read_json(p)
    E = []
    if a.get("form") != fid:
        E.append(f"form must be \"{fid}\"")
    d = a.get("decision")
    if d not in DECISIONS:
        E.append(f"decision must be one of {DECISIONS}")
    if a.get("confidence") not in ("high", "medium", "low"):
        E.append("confidence must be high|medium|low")
    if not (a.get("reason") or "").strip():
        E.append("reason is required")
    if d == "promote":
        if a.get("confidence") != "high":
            E.append("promote requires confidence high (medium means defer with a revisit threshold)")
        if a.get("topic_independent") is not True:
            E.append("promote requires topic_independent: true")
        fu = a.get("future_uses") or []
        topics = {(u.get("topic") or "").strip().lower() for u in fu if isinstance(u, dict) and u.get("shows")}
        if len(topics) < 3:
            E.append(f"promote requires >= 3 future_uses with distinct topics and what each shows (got {len(topics)})")
        if len(a.get("variation_seen") or []) < 1:
            E.append("promote requires variation_seen: what differed between the uses (identical copies are one use)")
        if not a.get("outline") or not a.get("idea"):
            E.append("promote requires idea and outline")
        if not (a.get("params_sketch") or {}).get("content"):
            E.append("params_sketch.content must list the on-screen words/numbers (they become required params)")
    if d in ("defer", "reject"):
        rv = a.get("revisit_when") or {}
        if not isinstance(rv.get("uses"), int) and not isinstance(rv.get("lessons"), int):
            E.append("defer/reject require revisit_when.uses or revisit_when.lessons (an integer threshold)")
    if d == "merge":
        t = read_json(LIB / "forms.json", {"forms": {}})["forms"]
        if not a.get("merge_into") or a.get("merge_into") == fid:
            E.append("merge requires merge_into: another form id")
        elif a["merge_into"] not in t and a["merge_into"] not in _components():
            E.append(f"merge_into '{a['merge_into']}' is not a known form")
    return E


BANNED = [(re.compile(r"\bMath\.random\b"), "Math.random"), (re.compile(r"\bDate\.now\b|new Date\b"), "wall-clock time"),
          (re.compile(r"\bsetTimeout\b|\bsetInterval\b|requestAnimationFrame"), "timers/rAF"),
          (re.compile(r"\bfetch\(|XMLHttpRequest"), "network"), (re.compile(r"""["'`]#[0-9a-fA-F]{3,8}["'`]"""), "literal hex colour")]


def check_component(fid: str, sheet: bool = True) -> tuple[list[str], dict]:
    from .catalog import build_catalog
    E, info_ = [], {}
    f = COMP / f"{fid}.js"
    fx = COMP / "fixtures" / f"{fid}.json"
    if not f.exists():
        return [f"missing {f}"], info_
    src = f.read_text(encoding="utf-8")
    code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", src)
    if f'Loom.component("{fid}"' not in src and f"Loom.component('{fid}'" not in src:
        E.append(f"{f.name} must register Loom.component(\"{fid}\", {{...}})")
    for rx, why in BANNED:
        if rx.search(code):
            E.append(f"{f.name}: {why} is not allowed in a component")
    r = run([which("node"), "--check", str(f)], check=False)
    if r.returncode != 0:
        E.append(f"{f.name}: syntax error: {(r.stderr or '').strip().splitlines()[-1:]}")
        return E, info_
    try:
        cat = build_catalog()
    except (LoomError, RuntimeError) as e:
        return E + [f"catalog failed (content defaults? bad param types?): {str(e)[-400:]}"], info_
    c = (cat.get("components") or {}).get(fid)
    if not c:
        return E + [f"catalog does not list component {fid}"], info_
    uses = {f"{u['project']}/{u['scene']}" for u in (read_json(LIB / "forms.json", {"forms": {}})["forms"].get(fid) or {}).get("uses", [])}
    pf = set(c.get("promoted_from") or [])
    # a commissioned component (2026-10-16: the asset hand-off sheet, docs/assets/HANDOFF_TEMPLATE_LIBRARY.md) names the
    # request it was made for instead of the lesson uses it was promoted from; every other gate below still applies
    commissioned = str(c.get("commissioned_by") or "").strip()
    if commissioned and not uses:
        pass
    elif len(pf & uses) < min(3, len(uses)):
        E.append(f"promoted_from must list the uses it came from as project/scene (known uses: {sorted(uses)})")
    content = [k for k, s in c["params"].items() if s.get("content")]
    if not content:
        E.append("no param is marked content: true; the words on screen must come from the caller")
    fixtures = read_json(fx)
    if not fixtures or len(fixtures.get("cases", [])) < 3:
        E.append(f"{fx} needs >= 3 cases")
        return E, info_
    sig = {json.dumps({k: cs.get("params", {}).get(k) for k in content}, sort_keys=True) for cs in fixtures["cases"]}
    if len(sig) < 3:
        E.append("fixture cases must differ in their CONTENT params (3 distinct), to prove the component is general")
    # a component made for some styles only (D-193) is rendered and judged in those, and they must be real packs
    own = c.get("styles") or None
    if own:
        known = {p.stem for p in STYLE_PACKS.glob("*.json")}
        bad = [x for x in own if x not in known]
        if bad:
            E.append(f"styles names packs that do not exist: {bad}")
    if sheet and not E:
        rep = render_sheet(fid, styles=own)
        info_ = rep
        for st, r in rep["styles"].items():
            for e in r["errors"]:
                E.append(f"[{st}] runtime {e.get('code')}: {e.get('msg')}")
            for e in r["console"]:
                E.append(f"[{st}] {e}")
            for lk in r.get("leaks", []):
                E.append(f"[{st}] sample text: case {lk['case']} drew words no param supplied {lk['words']}: \"{lk['text'][:60]}\"")
            if r["cases"] != len(fixtures["cases"]):
                E.append(f"[{st}] rendered {r['cases']} of {len(fixtures['cases'])} cases")
    return E, info_


# ------------------------------------------------------------------ sheet
_SHEET_JS = r"""
(function () {
  const Loom = window.Loom, M = window.__SHEET;
  Loom.assets = M.assets;
  Loom.style.install(M.style, "fonts");
  const root = document.getElementById("root");
  const cases = [], caseTexts = (window.__case_texts = []);
  (async function () {
    await Loom.style.ready();
    Loom.tl = gsap.timeline({ paused: true });
    M.cases.forEach((cs, i) => {
      // visibility (not display:none) so getBBox works while building: the measured text checks need it
      const svg = Loom.svg("svg", { width: 1920, height: 1080, viewBox: "0 0 1920 1080", style: "position:absolute;left:0;top:0;visibility:hidden" }, root);
      const g = Loom.svg("g", {}, svg);
      const beat = { id: "sheet" + i, start: 0, end: M.dur, speech_start: 0.3, speech_end: M.dur - 0.6, phrases: [] };
      let next = 0.6; const cues = Object.assign({}, cs.cues || {});
      const ctx = { beat, def: {}, props: {}, g, box: Object.assign({}, Loom.kit.SAFE), kit: Loom.kit, m: Loom.motion, style: Loom.style,
        c: (t) => Loom.style.c(t), start: 0, end: M.dur, speechStart: 0.3, speechEnd: M.dur - 0.6,
        cue(a) { const k = String(a); if (!(k in cues)) { cues[k] = next; next += 0.7; } return cues[k]; }, has() { return true; },
        at(f) { return 0.3 + f * (M.dur - 0.9); }, el(name, o) { return Loom.kit.element((o && o.parent) || g, name, o); },
        held() { return null; }, phrase() { return { text: "", words: [] }; }, word() { return { w: "", s: 0, e: 0 }; },
        motif(name, o) { return Loom.kit.element(g, name, o); },
        group() { return Loom.svg("g", { class: "lm-block" }, g); }, shift(grp, dx, dy) { grp.setAttribute("transform", `translate(${dx} ${dy})`); } };
      ctx.use = (ref, p, o) => Loom.useComponent(ctx, ref, p, o);
      Loom.ctxBeat = beat;
      Loom.text_label = Loom.svg("text", { x: 40, y: 1050, "font-size": 26, fill: Loom.style.c("muted"), "font-family": "sans-serif" }, svg, `${M.id}: ${cs.label || "case " + i}  [${M.style.id}]`);
      ctx.def = { kind: M.kind, props: cs.params || {} }; ctx.props = cs.params || {};
      const nText = Loom.report.texts.length;
      try {
        if (M.kind === "component") ctx.use(M.id, cs.params, Object.assign({ x: 600, y: 360 }, cs.opts || {}));
        else {
          const T = (M.kind === "template" ? Loom.templates : Loom.blueprints)[M.id];
          if (!T) Loom.error("sheet_unknown", `${M.kind} ${M.id} is not registered`);
          else T.build(ctx, Object.assign({}, T.defaults || {}, cs.params || {}));
        }
      }
      catch (e) { Loom.error("component_threw", `${cs.label || i}: ${e && e.message}`); }
      Loom.ctxBeat = null;
      caseTexts.push(Loom.report.texts.slice(nText).map((t) => t.text));
      cases.push([svg, g]);
    });
    if (M.logo) {  // the brand layer, as the runtime places it
      const lg = M.logo, h = lg.height, w = Math.round(h * (lg.aspect || 3));   // same placement as runtime/overlay.js
      const pos = { "top-right": `right:96px;top:${Math.round((84 - h) / 2)}px`, "top-left": `left:96px;top:${Math.round((84 - h) / 2)}px`, "bottom-right": `right:64px;bottom:28px`, "bottom-left": `left:64px;bottom:28px` }[lg.placement];
      const plate = lg.plate ? "background:#FFFFFF;padding:5px 9px;border-radius:8px;box-sizing:content-box;" : "";
      Loom.html("img", { src: lg.src, style: `position:absolute;${pos};height:${lg.plate ? h - 10 : h}px;width:${lg.plate ? Math.round((h - 10) * (lg.aspect || 3)) : w}px;${plate}z-index:5` }, root);
    }
    Loom.tl.set({}, {}, M.dur);
    window.__cases = cases.length; window.__times = M.times;
    window.__show = (i, t) => {
      cases.forEach(([s], k) => { s.style.visibility = k === i ? "visible" : "hidden"; });
      Loom.tl.seek(t, false);
      const b = cases[i][1].getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height };
    };
    window.__sheet_ready = true;
  })();
})();
"""


def _crop(im, bb):
    """Frame the component (its box + margin) at 16:9, so the sheet shows the element, not the empty stage."""
    if bb and bb.get("w", 0) > 4 and bb.get("h", 0) > 4:
        cx, cy = bb["x"] + bb["w"] / 2, bb["y"] + bb["h"] / 2
        w = max(bb["w"] + 160, (bb["h"] + 160) * 16 / 9, 480)
        h = w * 9 / 16
        x0, y0 = max(0, min(1920 - w, cx - w / 2)), max(0, min(1080 - h, cy - h / 2))
        im = im.crop((int(x0), int(y0), int(x0 + min(w, 1920)), int(y0 + min(h, 1080))))
    return im.resize((480, 270))


def render_sheet(fid: str, styles: list[str] | None = None, dur: float = 6.0, kind: str = "component",
                 cases: list[dict] | None = None, sheet_name: str | None = None, brand: dict | None = None,
                 out_dir: Path | None = None) -> dict:
    """Render every fixture case of a component (or a template/blueprint) in every style pack, audit the
    text each case drew against its params (sample-text detector), and write library/sheets/<name>.jpg."""
    from .checks.text_audit import leaks_for
    from PIL import Image, ImageDraw
    from .compose import RUNTIME_ORDER
    from .render import hf_env
    fixtures = {"cases": cases} if cases is not None else read_json(COMP / "fixtures" / f"{fid}.json")
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json", {}) or {}
    entry = ((cat.get("templates") or {}).get(fid) or (cat.get("blueprints") or {}).get(fid)) if kind != "component" else (cat.get("components") or {}).get(fid)
    styles = styles or sorted(p.stem for p in STYLE_PACKS.glob("*.json"))
    lucide = read_json(ENGINE_ROOT / "assets/icons/lucide.json")["icons"]
    peeps = read_json(ENGINE_ROOT / "assets/peeps/peeps.json")["peeps"]
    nm = ENGINE_ROOT / "node_modules"
    times = [round(dur * 0.4, 2), round(dur - 0.1, 2)]
    out = {"styles": {}, "sheet": None}
    rows = []
    for st in styles:
        from .brand import apply_brand, logo_payload
        style = apply_brand(read_json(STYLE_PACKS / f"{st}.json"), brand)
        tmp = Path(tempfile.mkdtemp(prefix=f"lmsheet_{fid}_"))
        (tmp / "fonts").mkdir(); (tmp / "rt").mkdir()
        for face in style["fonts"].get("faces", []):
            shutil.copy2(Path(face["path"]) if face.get("path") else nm / face["pkg"] / "files" / face["file"], tmp / "fonts" / face["file"])
        scripts = [nm / "gsap/dist/gsap.min.js"] + ([nm / "roughjs/bundled/rough.js"] if style["shape"].get("shading") == "sketch" else [])
        scripts += [ENGINE_ROOT / "runtime" / f for f in RUNTIME_ORDER if f != "boot.js"]
        scripts += [ENGINE_ROOT / "runtime/templates/_helpers.js"]  # Loom.th + pickTokenOn, as in a composed build
        if kind != "component":
            for sub in ("templates", "blueprints"):
                scripts += sorted((p for p in (ENGINE_ROOT / "runtime" / sub).glob("*.js") if p.name != "_helpers.js"),
                                  key=lambda p: (not p.name.startswith("_"), p.name))
        scripts += sorted((COMP).glob("*.js"))
        tags = []
        for i, s in enumerate(scripts):
            shutil.copy2(s, tmp / "rt" / f"{i:02d}_{s.name}")
            tags.append(f'<script src="rt/{i:02d}_{s.name}"></script>')
        M = {"id": fid, "kind": kind, "style": style, "logo": logo_payload(brand, style) if brand else None, "cases": fixtures["cases"], "dur": dur, "times": times,
             "assets": {"icons": lucide, "peeps": peeps}}
        html = ("<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden}"
                "#root{position:relative;width:1920px;height:1080px}</style></head><body><div id='root'></div>"
                + "".join(tags) + f"<script>window.__SHEET={json.dumps(M)};</script><script>{_SHEET_JS}</script></body></html>")
        (tmp / "sheet.html").write_text(html, encoding="utf-8")
        run([which("node"), str(ENGINE_ROOT / "tools/node/component_sheet.mjs"), str(tmp / "sheet.html"), str(tmp / "out")], env=hf_env(), timeout=300)
        rep = read_json(tmp / "out" / "report.json", {"errors": [{"code": "sheet_failed", "msg": "no report"}], "console": [], "shots": [], "cases": 0})
        leaks = []
        for i, txts in enumerate(rep.get("case_texts") or []):
            for lk in leaks_for([{"text": t} for t in txts], fixtures["cases"][i].get("params") or {}, entry):
                leaks.append({"case": fixtures["cases"][i].get("label") or i, **lk})
        out["styles"][st] = {"errors": rep["errors"], "warnings": rep.get("warnings", []), "console": rep["console"], "cases": rep["cases"], "leaks": leaks}
        # components are cropped to the element; templates are whole frames (layout and brand logo matter)
        row = [(_crop(Image.open(s["file"]).convert("RGB"), s.get("bbox")) if kind == "component" else Image.open(s["file"]).convert("RGB").resize((480, 270)))
               for s in rep["shots"] if s["t"] == times[-1]]
        rows.append((st, row))
        shutil.rmtree(tmp, ignore_errors=True)
    if rows:
        cols = max(len(r) for _, r in rows) or 1
        sh = Image.new("RGB", (cols * 484 + 4, len(rows) * 300 + 4), (17, 17, 17))
        d = ImageDraw.Draw(sh)
        for ri, (st, row) in enumerate(rows):
            d.text((8, ri * 300 + 6), st, fill=(240, 200, 90))
            for ci, im in enumerate(row):
                sh.paste(im, (4 + ci * 484, ri * 300 + 26))
        od = out_dir or (LIB / "sheets")
        od.mkdir(parents=True, exist_ok=True)
        p = od / f"{sheet_name or fid}.jpg"
        sh.save(p, quality=86)
        out["sheet"] = str(p)
    return out


# ------------------------------------------------------------------ beat designs -> templates
TPL = ENGINE_ROOT / "runtime" / "templates"
JOBS = ["hook", "orient", "define", "distinguish", "sequence", "relate", "quantify", "demonstrate", "check",
        "consolidate", "transition", "payoff", "scenario", "refute", "practice"]


def _assess_design_task(did, D, table) -> Path:
    m = _models()
    cat = _catalog()
    existing = ", ".join(sorted(list(cat.get("templates", {})) + list(cat.get("blueprints", {}))))
    lines = [f"# Loom library - assess the beat design `{did}` for promotion to a TEMPLATE", "",
             f"**Recommended model:** Opus (planning / judgment) - `{m.get('plan', '')}`", "",
             f"`{did}` has been built as a bespoke scene {D['count']} time(s) in {D['lessons']} lesson(s) "
             f"(raw tags: {D['raw_count']}). The count only opens the door: YOU decide whether it becomes a",
             "storyboard-selectable template. Be strict. The requester wants templates only for designs that will",
             "really be reused. A template nobody picks is catalogue noise every storyboard author has to read, and",
             "a template that bakes in one lesson's words leaks them into other lessons.", "",
             "## Read these uses (whole scene files)", ""] + _uses_block(D) + [
             "", "Tagged ideas: " + "; ".join(f'"{i}"' for i in D["ideas"]), "",
             f"Existing templates and blueprints (read `{ENGINE_ROOT / 'runtime/catalog.md'}`): {existing}.",
             f"Existing components and forms: `{LIB / 'FORMS.md'}`.", "",
             "## Decide", "",
             "Promote ONLY if every one of these holds (otherwise defer, reject or merge):",
             "1. **Topic-independent design.** Said without this lesson's nouns it still describes a beat (\"several",
             "   conditions converge on one failure\" yes; \"the checkout outage map\" no).",
             "2. **A real repeat, not a continuation.** Two scenes that extend the same held picture are one use.",
             "3. **Not already covered** by an existing template or blueprint (name the closest and why it falls short).",
             "4. **Selectable:** name the script `job`(s) it serves and the content shape a storyboard author would",
             "   recognise (\"3-5 causes and one effect\").",
             "5. **Concrete future demand:** at least 3 different lesson topics, each with what the beat would show.",
             "6. **Better as a template than as components.** If only its parts recur, say so and reject: the element",
             "   library handles parts.",
             "Confidence must be `high` to promote.", "",
             "## The selection test you must also write (promote only)", "",
             "`selection_test` is a blind test storyboard: 3 `targets` (beats from 3 DIFFERENT future topics that this",
             "template should serve) and 2 `decoys` (beats that look related but a different existing template or a",
             "bespoke scene should serve). Each is `{\"id\": \"t1\", \"job\": <script job>, \"narration\": \"what the",
             "narrator says, 20-45 words\", \"visual_intent\": \"one line\"}`. No em or en dashes. After the template is",
             "built, a separate storyboard model sees only these 5 beats and the catalogue, and must pick it for at",
             "least 2 targets and for no decoy.", "",
             "## Output", "", f"Write exactly ONE file: `{LIB / 'assessments' / ('design-' + did + '.json')}`:", "",
             "```json",
             json.dumps({"form": f"design:{did}", "decision": "promote | defer | reject | merge", "confidence": "high | medium | low",
                         "topic_independent": True, "idea": "one sentence, no lesson nouns", "outline": ["the fixed parts, in build order"],
                         "variation_seen": ["what differed between the uses"],
                         "closest_existing": {"id": "an existing template", "falls_short": "why"},
                         "jobs": ["relate"], "content_shape": "e.g. 3-5 causes and one effect",
                         "future_uses": [{"topic": "a different lesson", "shows": "what the beat would show"}],
                         "params_sketch": {"content": ["effect", "causes[].label"], "adjustable": ["layout", "accent"]},
                         "selection_test": {"targets": [{"id": "t1", "job": "relate", "narration": "...", "visual_intent": "..."}],
                                            "decoys": [{"id": "d1", "job": "sequence", "narration": "...", "visual_intent": "..."}]},
                         "reason": "why, in two sentences", "merge_into": None,
                         "revisit_when": {"uses": D["count"] + 2, "lessons": D["lessons"] + 2}}, indent=1),
             "```", "", "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```",
             f"py -m loom library check design:{did}", f"py -m loom library accept design:{did}", "```", ""]
    p = LIB / "tasks" / f"assess-design-{did}.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


def check_design_assessment(did: str) -> list[str]:
    p = LIB / "assessments" / f"design-{did}.json"
    if not p.exists():
        return [f"missing {p}"]
    a = read_json(p)
    E = []
    if a.get("form") != f"design:{did}":
        E.append(f"form must be \"design:{did}\"")
    if a.get("decision") not in DECISIONS:
        E.append(f"decision must be one of {DECISIONS}")
    if a.get("confidence") not in ("high", "medium", "low"):
        E.append("confidence must be high|medium|low")
    if not (a.get("reason") or "").strip():
        E.append("reason is required")
    if a.get("decision") == "promote":
        if a.get("confidence") != "high":
            E.append("promote requires confidence high")
        if a.get("topic_independent") is not True:
            E.append("promote requires topic_independent: true")
        topics = {(u.get("topic") or "").strip().lower() for u in a.get("future_uses") or [] if isinstance(u, dict) and u.get("shows")}
        if len(topics) < 3:
            E.append(f"promote requires >= 3 future_uses with distinct topics (got {len(topics)})")
        if not a.get("variation_seen"):
            E.append("promote requires variation_seen")
        ce = a.get("closest_existing") or {}
        if not ce.get("id") or not ce.get("falls_short"):
            E.append("promote requires closest_existing {id, falls_short}: why no existing template serves it")
        if not a.get("jobs") or any(j not in JOBS for j in a.get("jobs")):
            E.append(f"jobs must be script jobs from {JOBS}")
        if not a.get("content_shape"):
            E.append("promote requires content_shape (what a storyboard author will recognise)")
        st = a.get("selection_test") or {}
        tg, dc = st.get("targets") or [], st.get("decoys") or []
        if len(tg) < 3 or len(dc) < 2:
            E.append("selection_test needs 3 targets and 2 decoys")
        ids = [b.get("id") for b in tg + dc]
        if len(set(ids)) != len(ids) or None in ids:
            E.append("selection_test beats need unique ids")
        for b in tg + dc:
            if b.get("job") not in JOBS:
                E.append(f"selection_test {b.get('id')}: job must be a script job")
            n = len(re.findall(r"[A-Za-z']+", b.get("narration") or ""))
            if not (15 <= n <= 60):
                E.append(f"selection_test {b.get('id')}: narration should be 20-45 words (got {n})")
            if re.search("[–—―]", json.dumps(b, ensure_ascii=False)):
                E.append(f"selection_test {b.get('id')}: em/en dash")
    if a.get("decision") in ("defer", "reject"):
        rv = a.get("revisit_when") or {}
        if not isinstance(rv.get("uses"), int) and not isinstance(rv.get("lessons"), int):
            E.append("defer/reject require revisit_when.uses or .lessons")
    if a.get("decision") == "merge" and not a.get("merge_into"):
        E.append("merge requires merge_into")
    return E


def _promote_design_task(did, D) -> Path:
    m = _models()
    a = read_json(LIB / "assessments" / f"design-{did}.json", {})
    lines = [f"# Loom library - promote the beat design `{did}` to a template", "",
             f"**Recommended model:** Sonnet (building) - `{m.get('build', '')}`", "",
             f"Use the **loom-template-author** skill: `{ENGINE_ROOT / 'skills/loom/loom-template-author/SKILL.md'}`. Read it first,",
             f"then `{ENGINE_ROOT / 'docs/STORYBOARD_GUIDE.md'}`, `{ENGINE_ROOT / 'docs/SCENE_API.md'}` and two existing templates in",
             f"`{TPL}` to match their structure. Do NOT rewrite any existing scene.", "",
             "## The bespoke scenes it is promoted from", ""] + _uses_block(D) + [
             "", "## The assessment", "", "```json", json.dumps(a, indent=1, ensure_ascii=False), "```", "",
             "## Output (exactly these two files)", "",
             f"1. `{TPL / (did + '.js')}` registering ONE `Loom.template(\"<family>.<name>\", {{...}})` (or `Loom.blueprint` for a",
             "   motion-hero beat) with `doc` (when to use it, in the storyboard author's words), `job` (from the assessment),",
             f"   `register`, `motion_is`, `props`, `example` (valid props), and `promoted_from_design: \"{did}\"`.",
             "   - **All on-screen text comes in through props.** No sample words in the code. A str prop may have a default",
             "     only if it is structural chrome and marked `chrome: true`; template-owned words go in `chrome: [...]`.",
             "     The sample-text audit renders your fixtures and fails on any drawn word no prop supplied.",
             "   - Reveals anchored to `say_*` props; deterministic; tokens only; reads in every style pack.",
             f"2. `{TPL / 'fixtures' / (did + '.json')}`: `{{\"cases\": [{{\"label\": \"...\", \"params\": {{...props}}}}]}}`, 3+ cases whose",
             "   CONTENT differs: the uses above generalised, plus one future topic from the assessment. The gate also adds",
             "   an automatic case with every text prop at its max_words: size the cards for the longest legal content.", "",
             "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", f"py -m loom library accept design:{did}", "```",
             f"It renders every case in every style pack to `{LIB / 'sheets' / ('design-' + did + '.jpg')}` (LOOK at it) and then",
             "writes the blind selection task. The design is promoted only when the selection test passes.", ""]
    p = LIB / "tasks" / f"promote-design-{did}.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


def _str_defaults(spec: dict, path: str = "") -> list[str]:
    out = []
    for k, s in (spec or {}).items():
        if s.get("type") == "str" and isinstance(s.get("default"), str) and s["default"].strip() and not s.get("chrome"):
            out.append(path + k)
        if s.get("of"):
            out += _str_defaults(s["of"], path + k + ".")
    return out


# long-but-ordinary words (9-11 letters, the upper end of real on-screen labels). Deliberately not the longest
# words in English: an all-14-letter label failed every sane card in the proof run, which would make this
# gate fail good templates (a checker must not fail the library for doing the right thing).
_LONG = ["important", "customers", "reviewing", "dashboard", "deploying", "different", "procedure", "incidents"]


def _stress_case(spec: dict, base: dict) -> dict | None:
    """The longest content the schema allows (L-43): every str prop with max_words filled to that limit with
    long real words. The proof run found a template whose fixtures all fit while a 6-word label, legal under
    its own schema, overflowed at a style's type floor."""
    import copy
    out = copy.deepcopy(base)
    hit = [False]

    def fill(sp, obj):
        for k, s in (sp or {}).items():
            if s.get("type") == "str" and s.get("max_words") and k in obj:
                obj[k] = " ".join(_LONG[i % len(_LONG)] for i in range(int(s["max_words"])))
                hit[0] = True
            if s.get("of") and isinstance(obj.get(k), list):
                for it in obj[k]:
                    if isinstance(it, dict):
                        fill(s["of"], it)
            elif s.get("of") and isinstance(obj.get(k), dict):
                fill(s["of"], obj[k])
    fill(spec, out)
    return out if hit[0] else None


def check_template(did: str, sheet: bool = True) -> tuple[list[str], dict]:
    from .catalog import build_catalog
    from .checks.gates import _props_errors
    E, rep = [], {}
    f = TPL / f"{did}.js"
    fx = TPL / "fixtures" / f"{did}.json"
    if not f.exists():
        return [f"missing {f}"], rep
    src = f.read_text(encoding="utf-8")
    code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", src)
    for rx, why in BANNED:
        if rx.search(code):
            E.append(f"{f.name}: {why} is not allowed in a template")
    r = run([which("node"), "--check", str(f)], check=False)
    if r.returncode != 0:
        return E + [f"{f.name}: syntax error"], rep
    try:
        build_catalog()
    except (LoomError, RuntimeError) as e:
        return E + [f"catalog failed: {str(e)[-300:]}"], rep
    kind, tid, e = design_template(did)
    if not tid:
        return E + [f"no template or blueprint declares promoted_from_design: \"{did}\""], rep
    if not (e.get("doc") or "").strip() or not e.get("job"):
        E.append(f"{tid}: needs doc and job (that is how storyboard authors find it)")
    bad_jobs = [j for j in e.get("job") or [] if j not in JOBS]
    if bad_jobs:
        E.append(f"{tid}: unknown jobs {bad_jobs}")
    for k in _str_defaults(e.get("props") or {}):
        E.append(f"{tid}: prop `{k}` has a text default: on-screen words come from props (mark structural words chrome: true)")
    ex = e.get("example")
    if not ex:
        E.append(f"{tid}: needs an example (valid props)")
    elif _props_errors(e.get("props") or {}, ex):
        E.append(f"{tid}: example fails its own props schema: {_props_errors(e.get('props') or {}, ex)[:3]}")
    fixtures = read_json(fx) if fx.exists() else None
    if not fixtures or len(fixtures.get("cases", [])) < 3:
        return E + [f"{fx} needs >= 3 cases"], rep
    for cs in fixtures["cases"]:
        pe = _props_errors(e.get("props") or {}, cs.get("params") or {})
        if pe:
            E.append(f"fixture {cs.get('label')}: {pe[:3]}")
    stress = _stress_case(e.get("props") or {}, ex or fixtures["cases"][0].get("params") or {})
    if stress:
        fixtures["cases"].append({"label": "auto: every text prop at its max_words (type-floor stress)", "params": stress})
    content = {json.dumps(sorted(_strs(cs.get("params") or {}))) for cs in fixtures["cases"]}
    if len(content) < 3:
        E.append("fixture cases must differ in their words (3 distinct)")
    if sheet and not E:
        rep = render_sheet(tid, kind=kind, cases=fixtures["cases"], sheet_name=f"design-{did}")
        for st, rr in rep["styles"].items():
            E += [f"[{st}] runtime {x.get('code')}: {x.get('msg')}" for x in rr["errors"]]
            E += [f"[{st}] {x}" for x in rr["console"]]
            E += [f"[{st}] sample text: case {lk['case']} drew {lk['words']}: \"{lk['text'][:60]}\"" for lk in rr.get("leaks", [])]
    return E, rep


def _strs(o):
    if isinstance(o, str):
        return [o]
    if isinstance(o, dict):
        return [s for v in o.values() for s in _strs(v)]
    if isinstance(o, list):
        return [s for v in o for s in _strs(v)]
    return []


def _selection_task(did) -> Path:
    """A BLIND pick: a storyboard-tier model sees 5 test beats and the catalogue (the candidate listed like any
    other template) and chooses how to stage each. It is never told which template is new."""
    from .catalog import catalog_markdown
    m = _models()
    a = read_json(LIB / "assessments" / f"design-{did}.json")
    st = a["selection_test"]
    beats = sorted(st["targets"] + st["decoys"], key=lambda b: sha(did, b["id"]))   # deterministic shuffle
    blind = [{"beat": f"s{i + 1}", "job": b["job"], "narration": b["narration"], "visual_intent": b["visual_intent"]} for i, b in enumerate(beats)]
    key = {f"s{i + 1}": b["id"] for i, b in enumerate(beats)}
    write_json(LIB / "selection" / f"{did}.key.json", {"generated_by": "loom library (do not show to the picker)", "key": key})
    cat_md = LIB / "selection" / f"{did}.catalog.md"
    cat_md.write_text(catalog_markdown(include_candidates=True), encoding="utf-8")
    lines = ["# Loom storyboard check - stage five beats", "",
             f"**Recommended model:** Opus (storyboard tier) - `{m.get('plan', '')}`", "",
             f"You are the storyboard author. Read `{ENGINE_ROOT / 'docs/STORYBOARD_GUIDE.md'}` and the catalogue `{cat_md}`.",
             "For each beat below, choose how to stage it exactly as you would in a real storyboard: a template, a",
             "blueprint, or `bespoke` if nothing in the catalogue fits well. Fill the props from the narration (anchors must",
             "be words the narration says). Do not choose a template just to use it.", "",
             "## Beats", "", "```json", json.dumps(blind, indent=1, ensure_ascii=False), "```", "",
             "## Output", "", f"Write `{LIB / 'selection' / (did + '.json')}`:", "",
             "```json", json.dumps({"scenes": [{"beat": "s1", "kind": "template | blueprint | bespoke", "template": "id (or blueprint: id)",
                                                "props": {}, "why": "one line"}]}, indent=1), "```", ""]
    p = LIB / "tasks" / f"select-{did}.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


def check_selection(did: str, sheet: bool = True) -> list[str]:
    """The engine really picks it: >= 2 of 3 targets, 0 of 2 decoys, and the picked props validate and render clean."""
    from .checks.gates import _props_errors
    sel = read_json(LIB / "selection" / f"{did}.json") if (LIB / "selection" / f"{did}.json").exists() else None
    key = (read_json(LIB / "selection" / f"{did}.key.json", {}) or {}).get("key", {})
    if not sel or not key:
        return [f"missing selection result or key for {did}"]
    kind, tid, e = design_template(did)
    a = read_json(LIB / "assessments" / f"design-{did}.json")
    targets = {b["id"] for b in a["selection_test"]["targets"]}
    narr = {b["id"]: b["narration"] for b in a["selection_test"]["targets"] + a["selection_test"]["decoys"]}
    picked = {sc["beat"]: sc for sc in sel.get("scenes", []) if (sc.get("template") or sc.get("blueprint")) == tid}
    hit = [s for s in picked if key.get(s) in targets]
    wrong = [s for s in picked if key.get(s) not in targets]
    E = []
    if len(hit) < 2:
        E.append(f"the picker chose `{tid}` for {len(hit)} of 3 target beats (needs >= 2): it is not selectable as written (improve doc/job)")
    if wrong:
        E.append(f"the picker chose `{tid}` for decoy beat(s) {wrong}: its doc over-claims")
    cases = []
    for s in hit:
        props = picked[s].get("props") or {}
        pe = _props_errors(e.get("props") or {}, props)
        if pe:
            E.append(f"picked props for {s} fail the schema: {pe[:3]}")
        spoken = narr[key[s]].lower()
        for k, v in props.items():
            if (k == "say" or k.startswith("say_") or k.endswith("_say") or k.endswith("_cue")) and isinstance(v, str) and v.lower() not in spoken:
                E.append(f"picked props for {s}: anchor {k}=\"{v}\" is not in the narration")
        cases.append({"label": f"picked {s}", "params": props})
    if sheet and cases and not E:
        rep = render_sheet(tid, styles=["flat-cosmos", "whiteboard"], kind=kind, cases=cases, sheet_name=f"select-{did}")
        for st, rr in rep["styles"].items():
            E += [f"[{st}] picked props: runtime {x.get('code')}: {x.get('msg')}" for x in rr["errors"]]
            E += [f"[{st}] picked props: sample text {lk['words']}" for lk in rr.get("leaks", [])]
    return E


def _tpl_hash(did: str) -> str:
    from .util import file_sha
    f, fx = TPL / f"{did}.js", TPL / "fixtures" / f"{did}.json"
    return file_sha(f) + (file_sha(fx) if fx.exists() else "")


def accept_design(did: str) -> list[str]:
    t = harvest()
    D = (t.get("designs") or {}).get(did)
    if not D:
        return [f"unknown design {did} (tag it `// @design {did}: idea` and harvest)"]
    with _locked():
        decisions = read_json(LIB / "decisions.json", {}) or {}
        key = f"design:{did}"
        d = decisions.get(key)
        if D["status"] in ("candidate", "deferred", "rejected"):
            E = check_design_assessment(did)
            if E:
                return E
            a = read_json(LIB / "assessments" / f"design-{did}.json")
            decisions[key] = {"decision": a["decision"], "confidence": a["confidence"], "at_uses": D["count"], "at_lessons": D["lessons"],
                              "reason": a["reason"], "revisit_when": a.get("revisit_when"), "merge_into": a.get("merge_into"),
                              "assessment": f"library/assessments/design-{did}.json", "status": "approved" if a["decision"] == "promote" else a["decision"]}
            write_json(LIB / "decisions.json", decisions)
            harvest()   # refresh forms.json / FORMS.md so the new status shows immediately
            info(f"assessment design:{did}: {a['decision']} ({a['confidence']})")
            if a["decision"] == "promote":
                info(f"next (auto): {_promote_design_task(did, D)}")
            return []
        if D["status"] in ("approved", "built") and d and d.get("status") in ("approved", "built"):
            if d.get("status") == "approved":
                E, rep = check_template(did)
                if E:
                    return E
                d["status"] = "built"; d["sheet"] = rep.get("sheet"); d["built_hash"] = _tpl_hash(did)
                write_json(LIB / "decisions.json", decisions)
                info(f"template for design:{did} built; sheet {rep.get('sheet')}; next (auto): {_selection_task(did)}")
                return []
            if d.get("built_hash") != _tpl_hash(did):
                # the template changed after it was built: re-prove it in every style before judging the pick
                E, rep = check_template(did)
                if E:
                    return E
                d["built_hash"] = _tpl_hash(did); d["sheet"] = rep.get("sheet")
                write_json(LIB / "decisions.json", decisions)
            E = check_selection(did)
            if E:
                d.setdefault("selection_failures", []).append(E[:3])
                write_json(LIB / "decisions.json", decisions)
                return E
            kind, tid, _ = design_template(did)
            d["status"] = "promoted"; d["template"] = f"{kind}:{tid}"
            write_json(LIB / "decisions.json", decisions)
        else:
            return [f"design:{did} is {D['status']} ({D['count']} uses); nothing to accept yet"]
    from .catalog import build_catalog
    build_catalog()
    harvest()
    info(f"design:{did} promoted: {tid} is now in runtime/catalog.md for every storyboard")
    return []


# ------------------------------------------------------------------ accept
def accept(fid: str) -> list[str]:
    """Accept whichever library artifact is due: `design:<id>` for a beat design, else an element form
    (its assessment, or its component). Safe to run from parallel agents: decisions are written under a lock."""
    if fid.startswith("design:"):
        return accept_design(fid[7:])
    with _locked():
        t = harvest()
        F = t["forms"].get(fid)
        comp_file = COMP / f"{fid}.js"
        decisions = read_json(LIB / "decisions.json", {}) or {}
        if (F and F["status"] == "approved") or (comp_file.exists() and (decisions.get(fid) or {}).get("decision") == "promote"):
            E, rep = check_component(fid)
            if not E:
                decisions[fid]["component"] = f"{fid}@{(_components().get(fid) or {}).get('version', 1)}"
                decisions[fid]["status"] = "promoted"
                write_json(LIB / "decisions.json", decisions)
                harvest()
                info(f"component {fid}: accepted; sheet {rep.get('sheet')}")
            return E
        if not F and comp_file.exists():
            # a commissioned component (the asset hand-off, docs/assets/HANDOFF_TEMPLATE_LIBRARY.md) has no lesson uses to
            # be harvested from: check_component already accepts it by its `commissioned_by`, and accept had no route to it,
            # so every item of the first batch failed "unknown form" (batch-01, 2026-10-16)
            from .catalog import build_catalog
            c = ((build_catalog().get("components") or {}).get(fid)) or {}
            by = str(c.get("commissioned_by") or "").strip()
            if by:
                E, rep = check_component(fid)
                if not E:
                    decisions[fid] = {"decision": "promote", "status": "promoted", "commissioned_by": by,
                                      "component": f"{fid}@{(_components().get(fid) or {}).get('version', 1)}",
                                      "reason": f"commissioned ({by}); no lesson uses yet"}
                    write_json(LIB / "decisions.json", decisions)
                    harvest()
                    info(f"component {fid} (commissioned): accepted; sheet {rep.get('sheet')}")
                return E
        if not F:
            return [f"unknown form {fid} (run `py -m loom library harvest` first; a commissioned component needs "
                    f"`commissioned_by` in its Loom.component spec)"]
        if F["status"] not in ("candidate", "deferred", "rejected"):
            return [f"{fid} is {F['status']} ({F['count']} uses); nothing to accept yet"]
        E = check_assessment(fid)
        if not E:
            a = read_json(LIB / "assessments" / f"{fid}.json")
            decisions[fid] = {"decision": a["decision"], "confidence": a["confidence"], "at_uses": F["count"], "at_lessons": F["lessons"],
                              "reason": a["reason"], "revisit_when": a.get("revisit_when"), "merge_into": a.get("merge_into"),
                              "assessment": f"library/assessments/{fid}.json"}
            write_json(LIB / "decisions.json", decisions)
            t = harvest()
            info(f"assessment {fid}: {a['decision']} ({a['confidence']})")
            if a["decision"] == "promote":
                info(f"next (auto): promotion task {_promote_task(fid, t['forms'][fid])}")
        return E


def _code_only(src: str) -> str:
    """The code with every comment and blank line removed: tagging must not change this."""
    s = re.sub(r"/\*[\s\S]*?\*/", "", src)
    s = re.sub(r"(?m)^\s*(//|#).*$", "", s)
    return "\n".join(l.rstrip() for l in s.splitlines() if l.strip())


def backfill_task(kind: str = "form", extra: list[str] | None = None) -> Path | None:
    """Write a task to tag existing, untagged scenes (comments only), and pin their code.
    kind "form": element @form tags; kind "design": one whole-beat @design tag per scene (plus `extra` fixes)."""
    todo, pins = [], {}
    for pdir in _projects():
        for f in sorted(list((pdir / "scenes").glob("*.js")) + list((pdir / "scenes").glob("*.py"))):
            src = f.read_text(encoding="utf-8")
            tags, uses, _ = scene_forms(src)
            dtags, _ = scene_designs(src)
            if (kind == "form" and not tags and not uses) or (kind == "design" and not dtags):
                todo.append(f)
                pins[str(f)] = _code_only(src)
    if not todo:
        return None
    (LIB / "tasks").mkdir(parents=True, exist_ok=True)
    write_json(LIB / "tasks" / "backfill_pins.json", {"generated_by": "loom library backfill", "code": pins})
    if kind == "design":
        lines = ["# Loom library - tag the beat DESIGN of existing scenes (COMMENTS ONLY)", "",
                 f"**Recommended model:** Sonnet (building) - `{_models().get('build', '')}`", "",
                 "Add ONE `// @design snake_id: one-line idea` line (`# @design ...` in .py) at the top of each scene below,",
                 "naming the design of the WHOLE beat, so repeats can become templates. You may ONLY add or edit comment",
                 "lines. Any change to the code itself fails the gate.", "",
                 f"Read `{ENGINE_ROOT / 'docs/COMPONENTS.md'}` and `{ENGINE_ROOT / 'runtime/catalog.md'}` (existing templates) first.", "",
                 "## Rules", "",
                 "- The idea describes the beat's visual argument without this lesson's nouns ('several conditions converge",
                 "  on one failure', not 'the checkout outage'). Name the id after it (`cause_convergence`).",
                 "- A scene that only EXTENDS the previous scene's held picture (same diagram, next step) is not a new use:",
                 "  tag it `// @design <id>_continued: ...` (the library ignores `_continued` designs when counting).",
                 "  A NEW instance of the same design, drawn afresh with different content, gets the plain id.",
                 "- Read ALL scenes before naming anything; one idea, one id, across lessons. No near-synonyms.",
                 "- If the design is already an existing template in the catalogue, still tag it, and say so in your report.", ""]
        lines += (["## Also fix these element tags (split merged ideas; comments only)", ""] + [f"- {x}" for x in extra] + [""]) if extra else []
        lines += ["## Scenes", ""] + [f"- `{f}`" for f in todo] + [
                  "", "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", "py -m loom library verify-backfill", "py -m loom library status", "```",
                  "Report the design vocabulary (id: idea), the id per scene, and every element tag you changed.", ""]
        p = LIB / "tasks" / "backfill-designs.md"
        p.write_text("\n".join(lines), encoding="utf-8")
        return p
    lines = ["# Loom library - tag the forms in existing scenes (COMMENTS ONLY)", "",
             f"**Recommended model:** Sonnet (building) - `{_models().get('build', '')}`", "",
             "These scenes were written before the element library existed. Add `@form` tags so their small elements",
             "are counted. You may ONLY add comment lines. Any change to the code itself fails the gate.", "",
             f"Read `{ENGINE_ROOT / 'docs/COMPONENTS.md'}` (sections 'How a form becomes a component') first.", "",
             "## Rules", "",
             "- Above each small element the scene BUILDS itself, add `// @form snake_id: one-line idea` (`# @form ...` in .py).",
             "- Tag elements, not scenes: a card, a mark, a connector, a character bit, a gauge. Not the whole layout.",
             "- The idea must make sense without this lesson's nouns ('an icon card naming one contributing condition',",
             "  not 'the staging card'). Name the id after the idea (`condition_card`, not `staging_card`).",
             "- Use ONE id for one idea across ALL scenes below; read them all before naming anything, then keep a",
             "  shared vocabulary so real repeats add up. Do not invent near-synonyms.",
             "- Do NOT tag elements the scene only holds from the previous scene (`ctx.held(...)`).",
             "- Do not tag trivial primitives on their own (a single line, a plain rect).",
             "- Be honest: if a scene builds nothing reusable, leave one tag for its main element or none.", "",
             "## Scenes", ""] + [f"- `{f}`" for f in todo] + [
             "", "## Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", "py -m loom library verify-backfill", "py -m loom library status", "```",
             "Then report the vocabulary you used (id: idea) and, per scene, which ids you tagged.", ""]
    p = LIB / "tasks" / "backfill-tags.md"
    p.write_text("\n".join(lines), encoding="utf-8")
    return p


def verify_backfill() -> list[str]:
    pins = (read_json(LIB / "tasks" / "backfill_pins.json", {}) or {}).get("code", {})
    if not pins:
        return ["no backfill pins (run `py -m loom library backfill` first)"]
    E = []
    for f, code in pins.items():
        src = Path(f).read_text(encoding="utf-8")
        if _code_only(src) != code:
            E.append(f"{f}: the CODE changed (only comment lines may be added)")
        _, _, bad = scene_forms(src)
        E += [f"{f}: malformed tag {b}" for b in bad]
    return E


def pending_tasks() -> list[Path]:
    """Harvest, then write the assess/promote tasks that are due. Called by `loom go` after render."""
    return write_tasks(harvest())


def _task_plan(tp: Path):
    """(accept id, model tier, output files, fence languages) for a library task file."""
    st = tp.stem
    if st.startswith("assess-design-"):
        d = st[len("assess-design-"):]
        return f"design:{d}", "plan", [LIB / "assessments" / f"design-{d}.json"], ["json"]
    if st.startswith("promote-design-"):
        d = st[len("promote-design-"):]
        return f"design:{d}", "build", [TPL / f"{d}.js", TPL / "fixtures" / f"{d}.json"], ["js", "json"]
    if st.startswith("select-"):
        d = st[len("select-"):]
        return f"design:{d}", "plan", [LIB / "selection" / f"{d}.json"], ["json"]
    if st.startswith("assess-"):
        f = st[len("assess-"):]
        return f, "plan", [LIB / "assessments" / f"{f}.json"], ["json"]
    f = st[len("promote-"):]
    return f, "build", [COMP / f"{f}.js", COMP / "fixtures" / f"{f}.json"], ["js", "json"]


def run_api(tasks: list[Path], depth: int = 0) -> None:
    """API mode: run due library tasks through the Anthropic API, with the library gates as repair feedback.
    Each accepted step writes the next task (assess -> promote -> select); those are run in turn."""
    from .agent.api import _call
    models = _models()
    for tp in tasks:
        aid, tier, targets, langs = _task_plan(tp)
        model = models.get(tier)
        text = tp.read_text(encoding="utf-8")
        ask = "Return each output file in its own fenced block, in this order: " + ", ".join(f"`{p.name}` (```{l})" for p, l in zip(targets, langs)) + "."
        messages = [{"role": "user", "content": [{"type": "text", "text": text + "\n\n" + ask}]}]
        for rnd in range(3):
            info(f"[api] library {tp.stem}: {model} (round {rnd + 1})")
            res = _call(model, [{"type": "text", "text": "You maintain the Loom library. Follow the task exactly."}], messages)
            reply = "".join(b.get("text", "") for b in res.get("content", []) if b.get("type") == "text")
            blocks = re.findall(r"```[a-zA-Z]*\n([\s\S]*?)```", reply)
            if len(blocks) < len(targets):
                errs = [f"expected {len(targets)} fenced blocks, got {len(blocks)}"]
            else:
                for p, b in zip(targets, blocks):
                    p.parent.mkdir(parents=True, exist_ok=True)
                    p.write_text(b.strip() + "\n", encoding="utf-8")
                errs = accept(aid)
            if not errs:
                break
            messages += [{"role": "assistant", "content": reply},
                         {"role": "user", "content": "The library gate failed:\n- " + "\n- ".join(errs[:30]) + "\nReturn ALL files again, corrected."}]
        else:
            raise LoomError(f"library {tp.stem}: still failing after repairs")
    nxt = [t for t in write_tasks() if t not in tasks]
    if nxt and depth < 4:
        run_api(nxt, depth + 1)
