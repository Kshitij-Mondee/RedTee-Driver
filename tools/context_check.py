"""Loom context check: print the live, code-verified facts, and fail when a living doc disagrees with the code.

    py tools/context_check.py            (python3 on Linux/macOS)
    py tools/context_check.py --json     (machine-readable)

Rule: trust code over docs. Every number an agent reads in a LIVING doc (README, docs/*.md except the
append-only logs, docs/context/*, CLAUDE.md, AGENTS.md, skills/loom) is compared with the count the code
gives. Historical, append-only logs (CHANGELOG.md, docs/AGENT_LEARNINGS.md, projects/*/RUN_LOG.md,
library/proofs/) are dated snapshots and are never "corrected": their numbers were true when written.

It also checks the context layer's own integrity:
- learning ids (L-n) and decision ids (D-n) are unique, and every OPEN item has an id;
- every library decision has its assessment file, and nothing logged has been deleted
  (library/assessments, library/proofs and the RUN_LOGs are listed in docs/context/MANIFEST.json, which
  only grows);
- no configured sync destination or bridge ever writes into RedTee_V1_Video;
- each style guide's palette table matches its pack (section 2 against packs/styles/<id>.json);
- the Cowork account skill copies match skills/ (tools/skill_sync.py) when env LOOM_ACCOUNT_SKILLS names the account
  skills folder; without it the check says it skipped and why (never a silent pass).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

LIVING = ["README.md", "CLAUDE.md", "AGENTS.md", "docs/ARCHITECTURE.md", "docs/SCENE_API.md", "docs/STORYBOARD_GUIDE.md",
          "docs/COMPONENTS.md", "docs/LAYOUT.md", "docs/context/README.md", "docs/context/STATE.md", "skills/loom"]
APPEND_ONLY = ["CHANGELOG.md", "docs/AGENT_LEARNINGS.md", "docs/context/DECISIONS.md", "docs/context/RUNS.md"]
CLAIMS = {  # regex over living docs -> live fact key
    r"\b(\d+) (?:offline )?tests\b": "tests",
    r"\b(\d+) templates\b": "templates",
    r"\b(\d+) (?:motion[- ]hero )?blueprints\b": "blueprints",
    r"\b(\d+) style packs\b": "styles",
    r"\b(\d+) components\b": "components",
}


def _suite_prefixes(tests_src: str) -> list[str]:
    """The name prefixes tests/run_tests.py loads from tests/suites (its `prefixes = (...)` line)."""
    m = re.search(r"^\s*prefixes\s*=\s*\(([^)]*)\)", tests_src, re.M)
    if not m:
        raise SystemExit("tests/run_tests.py has no `prefixes = (...)` line: cannot count the suite tests")
    return re.findall(r"[\"'](\w+)[\"']", m.group(1))


def facts() -> dict:
    from loom.util import read_json
    cat = read_json(ROOT / "runtime/catalog.json", {}) or {}
    tests_src = (ROOT / "tests/run_tests.py").read_text(encoding="utf-8")
    forms = read_json(ROOT / "library/forms.json", {}) or {}
    dec = read_json(ROOT / "library/decisions.json", {}) or {}
    live_t = [k for k, v in (cat.get("templates") or {}).items() if not v.get("candidate")]
    live_b = [k for k, v in (cat.get("blueprints") or {}).items() if not v.get("candidate")]
    projects = sorted(p.name for p in (ROOT / "projects").iterdir() if (p / "project.json").exists()) if (ROOT / "projects").exists() else []
    learn = (ROOT / "docs/AGENT_LEARNINGS.md").read_text(encoding="utf-8") if (ROOT / "docs/AGENT_LEARNINGS.md").exists() else ""
    return {
        "templates": len(live_t), "blueprints": len(live_b),
        "candidate_templates": len(cat.get("templates", {})) - len(live_t) + len(cat.get("blueprints", {})) - len(live_b),
        "components": len(cat.get("components") or {}),
        "styles": len(list((ROOT / "packs/styles").glob("*.json"))),
        "personas": len(list((ROOT / "packs/personas").glob("*.json"))),
        "genres": len(list((ROOT / "packs/genres").glob("*.md"))),
        # @test functions in run_tests.py plus the suites it registers (tests/suites/*.py, D-114: module-level
        # functions whose names start with the loader's prefixes, read from run_tests.py itself so the two cannot
        # drift: a copy of the list here missed check_ and pipeline_, 2026-10-07)
        "tests": len(re.findall(r"^@test\s*$", tests_src, re.M)) + sum(
            len(re.findall(r"^def (?:" + "|".join(_suite_prefixes(tests_src)) + r")\w+\(", f.read_text(encoding="utf-8"), re.M))
            for f in sorted((ROOT / "tests" / "suites").glob("*.py"))),
        "stages": _stages(),
        "projects": projects,
        "forms": len(forms.get("forms") or {}), "designs": len(forms.get("designs") or {}),
        "library_decisions": len(dec),
        "promoted": sorted(k for k, v in dec.items() if v.get("status") == "promoted"),
        "learnings": len(re.findall(r"^- \*\*L-\d+", learn, re.M)),
        "open_items": len(re.findall(r"\bOPEN\b", learn)),
    }


def _stages() -> int:
    from loom.stages import STAGES
    return len(STAGES)


def _living_files():
    for rel in LIVING:
        p = ROOT / rel
        if p.is_dir():
            yield from sorted(p.rglob("*.md"))
        elif p.exists():
            yield p


def guide_drift(root: Path = ROOT) -> list[str]:
    """Each style guide's palette table (section 2, rows `| token | #hex |`) against its pack (WS6, 2026-10-08): a
    guide that names a hex the pack no longer has is a guide that lies to every scene author. A guide whose pack does
    not name it in `guide`, or with no palette rows at all (a zero denominator), is a problem too."""
    from loom.util import read_json
    E = []
    gdir = root / "docs" / "styles" / "guides"
    for g in sorted(gdir.glob("*.md")) if gdir.exists() else []:
        if g.name == "README.md":
            continue
        rel = g.relative_to(root).as_posix()
        pack = root / "packs" / "styles" / f"{g.stem}.json"
        if not pack.exists():
            E.append(f"{rel}: no pack packs/styles/{g.stem}.json for this guide")
            continue
        pk = read_json(pack, {}) or {}
        if pk.get("guide") != rel:
            E.append(f"packs/styles/{g.stem}.json: `guide` should be \"{rel}\" (is {pk.get('guide')!r})")
        pal = {k: str(v).upper() for k, v in (pk.get("palette") or {}).items()}
        sec = re.search(r"^## 2\..*?(?=^## 3\.)", g.read_text(encoding="utf-8"), re.M | re.S)
        rows = 0
        for line in (sec.group(0) if sec else "").splitlines():
            m = re.match(r"^\|\s*`?([A-Za-z0-9_]+)`?\s*\|\s*(#[0-9A-Fa-f]{6})\s*\|", line)
            if not m:
                continue
            rows += 1
            tok, hx = m.group(1), m.group(2).upper()
            if tok not in pal:
                E.append(f"{rel}: section 2 lists token '{tok}', which packs/styles/{g.stem}.json does not have")
            elif pal[tok] != hx:
                E.append(f"{rel}: section 2 says {tok} is {hx}, packs/styles/{g.stem}.json says {pal[tok]}")
        if rows == 0:
            E.append(f"{rel}: no palette rows (| token | #hex |) in section 2: nothing was compared")
    return E


def skills_check(account: str | None = None) -> tuple[list[str], list[str]]:
    """(problems, notes): the account skill copies against skills/ (B7, 2026-10-08; L-267: 15 of 16 copies had drifted
    and nothing checked). The account folder comes from env LOOM_ACCOUNT_SKILLS; unset is a named skip."""
    import importlib.util
    import os
    spec = importlib.util.spec_from_file_location("skill_sync", ROOT / "tools" / "skill_sync.py")
    ss = importlib.util.module_from_spec(spec); spec.loader.exec_module(ss)
    return ss.check(account if account is not None else os.environ.get("LOOM_ACCOUNT_SKILLS"))


NOTES: list[str] = []


def check(F: dict) -> list[str]:
    E = []
    # 1) numeric claims in living docs vs the code
    for p in _living_files():
        txt = p.read_text(encoding="utf-8")
        for rx, key in CLAIMS.items():
            for m in re.finditer(rx, txt):
                # the historical-number filter looks at the SAME line only: reading 60 characters back used to
                # reach the line above, so 'studies of 3 channels' hid a wrong test count beneath it (L-122)
                ls_, le_ = txt.rfind("\n", 0, m.start()) + 1, txt.find("\n", m.end())
                le_ = len(txt) if le_ < 0 else le_
                ctx = txt[max(ls_, m.start() - 60): min(le_, m.end() + 20)]
                if re.search(r"(was|were|earlier|before|stale|distrust|at \d+ uses|of \d+)", ctx):
                    continue  # a quoted historical number, not a claim about now
                if int(m.group(1)) != F[key]:
                    E.append(f"{p.relative_to(ROOT)}: says '{m.group(0)}' but the code has {F[key]} {key}")
    # 2) id integrity in the append-only logs
    learn = (ROOT / "docs/AGENT_LEARNINGS.md").read_text(encoding="utf-8")
    ids = re.findall(r"^- \*\*(L-\d+)", learn, re.M)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        E.append(f"docs/AGENT_LEARNINGS.md: duplicate learning ids {dup}")
    dl = ROOT / "docs/context/DECISIONS.md"
    if dl.exists():
        dids = re.findall(r"^\| (D-\d+) \|", dl.read_text(encoding="utf-8"), re.M)
        ddup = sorted({i for i in dids if dids.count(i) > 1})
        if ddup:
            E.append(f"docs/context/DECISIONS.md: duplicate decision ids {ddup}")
    # 3) every library decision has its assessment; logged artefacts are never deleted
    from loom.util import read_json
    for k, v in (read_json(ROOT / "library/decisions.json", {}) or {}).items():
        a = v.get("assessment")
        if a and not (ROOT / a).exists():
            E.append(f"library/decisions.json: {k} points at a missing assessment {a}")
    man = read_json(ROOT / "docs/context/MANIFEST.json", {}) or {}
    for rel in man.get("append_only_files", []):
        if not (ROOT / rel).exists():
            E.append(f"logged file was deleted (the logs are append-only): {rel}")
    # 4) RedTee is read-only from here
    cfg = read_json(ROOT / "loom.config.json", {}) or {}
    for k, v in cfg.items():
        if k != "redtee_root" and isinstance(v, str) and "RedTee" in v:
            E.append(f"loom.config.json: '{k}' points into RedTee_V1_Video, which is read-only from Loom")
    br = (ROOT / "loom/redtee_bridge.py").read_text(encoding="utf-8") if (ROOT / "loom/redtee_bridge.py").exists() else ""
    # every write in the bridge must target Loom's own folders (project media, runtime/), never root() (RedTee)
    for n, line in enumerate(br.splitlines(), 1):
        if re.search(r"write_text|write_json|open\([^)]*['\"][wa]", line) and re.search(r"root\(\)|redtee_root|REDTEE", line):
            E.append(f"loom/redtee_bridge.py:{n}: a write that targets the RedTee folder; the bridge must only read it")
    # 5) the world packs doc is generated from packs/worlds/*.json: it must match them (edit the JSON, regenerate)
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("world_packs", ROOT / "tools/world_packs.py")
        wp = importlib.util.module_from_spec(spec); spec.loader.exec_module(wp)
        worlds, werrs = wp.load()
        E += [f"packs/worlds: {e}" for e in werrs]
        if not werrs:
            for f in wp.stale(worlds):     # WORLD_PACKS.md and every end-to-end prompt in docs/assets/world_prompts/
                E.append(f"{f} is out of date with packs/worlds/*.json or packs/set_styles.json: run `py tools/world_packs.py`")
    except Exception as e:  # noqa: BLE001  (a check that cannot run is a problem, never a silent pass)
        E.append(f"world packs check did not run: {e}")
    # 5b) the set library (D-152): every card agrees with its svg, the index is current
    try:
        sys.path.insert(0, str(ROOT))
        from loom import sets as _sets
        E += [f"set library: {e}" for e in _sets.check()]
    except Exception as e:  # noqa: BLE001
        E.append(f"set library check did not run: {e}")
    # 6) each style guide's palette table matches its pack (WS6, 2026-10-08)
    E += guide_drift(ROOT)
    # 7) the account skill copies follow skills/ (B7, 2026-10-08), when the account folder is named
    try:
        se, sn = skills_check()
        E += se; NOTES[:] = sn
    except Exception as e:  # noqa: BLE001  (a check that cannot run is a problem, never a silent pass)
        E.append(f"skills check did not run: {e}")
    return E


def main() -> int:
    F = facts()
    E = check(F)
    if "--json" in sys.argv:
        print(json.dumps({"facts": F, "problems": E, "notes": NOTES}, indent=1))
    else:
        print("Loom live facts (from the code, not from docs):")
        for k, v in F.items():
            print(f"  {k:22s} {v}")
        for n in NOTES:
            print(f"\n{n}")
        print(("\nPROBLEMS:\n" + "\n".join(f"  - {e}" for e in E)) if E else "\ncontext: OK (living docs agree with the code)")
    return 1 if E else 0


if __name__ == "__main__":
    raise SystemExit(main())
