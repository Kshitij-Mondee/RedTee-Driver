"""Before and after numbers for the bench fixes (2026-10-07, docs/strategy/2026-10-07-fix-prompt.md, PROOF).

    py tools/bench_proof.py before <bench id> [...] --to <folder>     # the ORIGINAL build, measured with today's instruments
    py tools/bench_proof.py after <bench id> [...] --suffix <s>       # fork to <bench id>-<s>, compose, full check
    py tools/bench_proof.py table <before folder> <bench id> [...] --suffix <s>   # both, side by side (markdown)

`before` copies the bench (inputs AND its composed build, never renders) to <folder>/<id>/ and runs the full check
there on the old build, so the old runtime is measured by the new probe and film checks; the bench folder is only read.
`after` forks the bench (its inputs copied to projects/<id>-<suffix>, the id fixed; `restyle --as` would stop at the
storyboard gate, which refuses these plans by design), composes it with today's runtime and runs the full check. Both write <dir>/qa/proof.json:
- blurred: beats whose own words measured blurred (film check `blurred_beat`);
- foreign: beats whose settled frame shows more than 300 px of other beats' pictures (probe foreign pass);
- off_frame: check errors for elements, words or figures off the frame;
- late_lead: template beats whose first element arrives more than 1.0 s after the beat starts (and the worst);
- dim_off: fx moments (light, spotlight) whose screen rect is less than half inside the frame;
- empty: film `empty` and `blank` errors (a nested station laid out off frame read as a blank beat);
- kinds: the check's errors by kind (the decision ledger's kinds);
- gates: the plan gates' errors today (pedagogy, script, storyboard, scenes, narration): the storyboard SHOULD now be
  refused (length, focus on templates, keep names, variety); that is the gate working.
Every count carries its denominator; a zero denominator is printed as "blind".
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

COPY = ("project.json", "state.json", "plan", "scenes", "audio", "media", "sources", "build")


def _copy_before(pid: str, dest: Path) -> Path:
    src = ROOT / "projects" / pid
    out = dest / pid
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in COPY:
        s = src / name
        if s.is_dir():
            shutil.copytree(s, out / name, ignore=shutil.ignore_patterns("renders"))
        elif s.exists():
            shutil.copy2(s, out / name)
    for d in ("qa", "renders", "logs"):
        (out / d).mkdir(exist_ok=True)
    return out


def fx_moments(build: Path) -> list[dict]:
    r = subprocess.run(["node", str(ROOT / "tools/node/fx_moments.mjs"), str(build / "index.html")], capture_output=True, text=True,
                       encoding="utf-8", timeout=600)
    if r.returncode != 0:
        raise RuntimeError(f"fx_moments failed: {r.stderr[-400:]}")
    return json.loads(r.stdout or "[]")


def metrics(d: Path) -> dict:
    from loom import ledger as L
    from loom.checks import gates as G
    from loom.project import Project
    from loom.util import read_json
    p = Project.open(str(d))
    rep = read_json(d / "qa/report.json", {}) or {}
    pr = read_json(d / "qa/probe.json", {}) or {}
    sb = read_json(d / "plan/storyboard.json", {}) or {}
    tm = read_json(d / "audio/timings.json", {}) or {}
    errs = [str(e) for e in rep.get("errors") or []]
    kinds = {s.get("beat"): s.get("kind") for s in sb.get("scenes") or []}
    n_beats = len(sb.get("scenes") or [])
    blurred = sorted({e.split(":")[0] for e in errs if "blurred_beat" in e})
    frows = pr.get("foreign") or []
    foreign = sorted({r["beat"] for r in frows if (r.get("px") or 0) > 300})
    off = [e for e in errs if any(k in e for k in ("off frame", "words cut by the frame", "figure_cropped", "cut off at the frame"))]
    starts = {b["id"]: float(b.get("start") or 0) for b in tm.get("beats") or []}
    first: dict = {}
    for el in pr.get("elements") or []:
        b, rt = el.get("beat"), el.get("revealT")
        if el.get("kind") == "scenery" or el.get("name") == "template_backplate":
            continue    # the backplate is the field behind the template, not its first content
        if kinds.get(b) in ("template", "redtee", "blueprint") and isinstance(rt, (int, float)):
            first[b] = min(first.get(b, 1e9), float(rt))
    delays = {b: round(t - starts.get(b, 0.0), 2) for b, t in first.items() if b in starts}
    late = sorted(b for b, v in delays.items() if v > 1.0)
    try:
        mom = fx_moments(d / "build")
    except Exception as e:  # noqa: BLE001
        mom = None
        mom_err = str(e)[:200]
    dim_off = [m for m in (mom or []) if m["on_frame"] < 0.5]
    empty = [e for e in errs if "empty" in e.lower() or "blank" in e.lower()]
    gates = {}
    for g in ("pedagogy", "script", "storyboard", "scenes"):
        try:
            gates[g] = G.GATES[g](p)[0]
        except Exception as e:  # noqa: BLE001
            gates[g] = [f"gate did not run: {e}"]
    try:
        gates["narration"] = G.check_narration(p)[0]
    except Exception as e:  # noqa: BLE001
        gates["narration"] = [f"gate did not run: {e}"]
    out = {
        "id": p.id, "dir": str(d), "beats": n_beats, "check_errors": len(errs), "check_warnings": len(rep.get("warnings") or []),
        "blurred": {"beats": blurred, "of": n_beats if rep else 0},
        "foreign": {"beats": foreign, "of": len(frows), "measured": sum(1 for r in frows if r.get("candidates"))},
        "off_frame": {"errors": len(off), "first": off[:6]},
        "late_lead": {"beats": late, "of": len(delays), "worst": max(delays.values()) if delays else None},
        "dim_off": {"moments": [f"{m['beat']} {m['kind']} {m['t0']}s on frame {m['on_frame']}" for m in dim_off], "of": len(mom) if mom is not None else 0,
                    **({"error": mom_err} if mom is None else {})},
        "empty": {"errors": len(empty), "first": empty[:4]},
        "kinds": dict(Counter(L._kind_of(e) for e in errs).most_common()),
        "gates": {g: {"errors": len(v), "kinds": dict(Counter(_gate_kind(e) for e in v).most_common()), "first": v[:5]} for g, v in gates.items()},
    }
    (d / "qa").mkdir(exist_ok=True)
    (d / "qa/proof.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    return out


def _gate_kind(e: str) -> str:
    """A short name for a gate error, for counting (the first words that name the rule)."""
    rules = [("request asks for", "length"), ("beats for a", "beat cap"), ("requested_s", "requested_s"), ("no length was requested", "no length"),
             ("shot focus", "focus on frame layout"), ("shot zoom", "focus on frame layout"), ("declares its own", "nested w/h"), ("nested station", "nested w/h"),
             ("keep names", "keep missing"), ("same station", "keep across stations"), ("empty husk", "keep husk"),
             ("is used", "template cap"), ("ping-pong", "ping-pong"), ("allocation says", "allocation"), ("story.cast", "cast"),
             ("one person, one look", "cast"), ("avatar", "avatar props"), ('"empty": true', "placeholder"),
             ("never uses", "invented words"), ("draws no element of that name", "held missing"), ("held_needs_same_station", "held across stations"), ("narration runs", "narration length"), ("props.", "props spec")]
    for k, v in rules:
        if k in e:
            return v
    return e.split(":")[1].strip()[:40] if ":" in e else e[:40]


def run_before(ids, dest: Path):
    from loom import qa
    from loom.project import Project
    for pid in ids:
        d = _copy_before(pid, dest)
        print(f"== before {pid}: full check of the ORIGINAL build in {d}", flush=True)
        try:
            qa.check(Project.open(str(d)))
        except Exception as e:  # noqa: BLE001
            print(f"   check raised: {str(e)[:200]}")
        m = metrics(d)
        print(json.dumps({k: m[k] for k in ("check_errors", "blurred", "foreign", "late_lead", "dim_off")}, ensure_ascii=False)[:600], flush=True)


def fork(pid: str, fork_id: str) -> Path:
    """Copy a bench to projects/<fork_id> (inputs only: no build, qa or renders) and give it its id. `restyle --as`
    copies the same way but then runs the storyboard gate, which now refuses the bench plans by design."""
    from loom.util import read_json, write_json
    src, dst = ROOT / "projects" / pid, ROOT / "projects" / fork_id
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("renders", "build", "qa"))
    cfg = read_json(dst / "project.json")
    cfg["id"] = fork_id
    write_json(dst / "project.json", cfg)
    return dst


def run_after(ids, suffix: str):
    from loom import flow
    from loom.project import Project
    from loom.util import LoomError
    for pid in ids:
        fork_id = f"{pid}-{suffix}"
        d = ROOT / "projects" / fork_id
        if not d.exists():
            print(f"== after {pid}: fork to {fork_id} (a copy of its inputs, its id fixed)", flush=True)
            fork(pid, fork_id)
        p = Project.open(fork_id)
        if not (d / "build/index.html").exists():
            print(f"== after {fork_id}: compose with today's runtime", flush=True)
            flow.run_code(p, "compose")
        print(f"== after {fork_id}: full check", flush=True)
        try:
            flow.run_code(p, "check")
        except LoomError as e:
            print(f"   check: {str(e)[:200]}")
        m = metrics(d)
        print(json.dumps({k: m[k] for k in ("check_errors", "blurred", "foreign", "late_lead", "dim_off")}, ensure_ascii=False)[:600], flush=True)


def table(before: Path, ids, suffix: str) -> str:
    from loom.util import read_json
    rows = ["| bench | measure | before (original build) | after (fork, today's engine) |", "|---|---|---|---|"]
    for pid in ids:
        b = read_json(before / pid / "qa/proof.json", {}) or {}
        a = read_json(ROOT / "projects" / f"{pid}-{suffix}" / "qa/proof.json", {}) or {}
        name = pid.split("151439-")[-1]

        def cnt(m, key, of="of"):
            x = m.get(key) or {}
            n = len(x.get("beats") or x.get("moments") or [])
            return "blind (0 measured)" if not x.get(of) else f"{n} of {x.get(of)}" + (f": {', '.join((x.get('beats') or x.get('moments') or [])[:8])}" if n else "")
        rows.append(f"| {name} | self-blurred beats | {cnt(b, 'blurred')} | {cnt(a, 'blurred')} |")
        rows.append(f"| {name} | foreign-pixel beats (>300 px) | {cnt(b, 'foreign')} | {cnt(a, 'foreign')} |")
        rows.append(f"| {name} | off-frame errors | {(b.get('off_frame') or {}).get('errors')} | {(a.get('off_frame') or {}).get('errors')} |")
        rows.append(f"| {name} | template beats first reveal > 1 s (worst) | {cnt(b, 'late_lead')} ({(b.get('late_lead') or {}).get('worst')} s) | "
                    f"{cnt(a, 'late_lead')} ({(a.get('late_lead') or {}).get('worst')} s) |")
        dim = lambda m: ("none in this lesson (nothing to measure)" if not (m.get("dim_off") or {}).get("of") and "error" not in (m.get("dim_off") or {})  # noqa: E731
                         else cnt(m, "dim_off"))
        rows.append(f"| {name} | dim moments off screen | {dim(b)} | {dim(a)} |")
        rows.append(f"| {name} | empty or blank errors | {(b.get('empty') or {}).get('errors')} | {(a.get('empty') or {}).get('errors')} |")
        rows.append(f"| {name} | check errors (kinds) | {b.get('check_errors')} {b.get('kinds')} | {a.get('check_errors')} {a.get('kinds')} |")
    return "\n".join(rows)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=("before", "after", "measure", "table"))
    ap.add_argument("args", nargs="+")
    ap.add_argument("--to")
    ap.add_argument("--suffix", default="fix1007")
    a = ap.parse_args(argv)
    if a.mode == "before":
        run_before(a.args, Path(a.to).resolve())
    elif a.mode == "measure":     # recompute qa/proof.json from a folder's saved reports (no check run)
        for d in a.args:
            m = metrics(Path(d).resolve())
            print(json.dumps({k: m[k] for k in ("id", "check_errors", "blurred", "foreign", "late_lead", "dim_off")}, ensure_ascii=False)[:700])
    elif a.mode == "after":
        run_after(a.args, a.suffix)
    else:
        print(table(Path(a.args[0]).resolve(), a.args[1:], a.suffix))
    return 0


if __name__ == "__main__":
    sys.exit(main())
