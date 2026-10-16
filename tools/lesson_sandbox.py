"""Check a finished lesson against the CURRENT engine without touching it (2026-10-07, bench fixes).

    py tools/lesson_sandbox.py <id> [<id> ...] --to <folder> [--check | --probe] [--frames t1,t2,...]

Copies the lesson's inputs (project.json, state.json, plan/, scenes/, audio/, media/, sources/) to <folder>/<id>/,
recomposes there with the current runtime and runs the probe (default) or the full check. The lesson keeps its id, so
id-keyed ratchets (loom/checks/film_baseline.json, film_offframe_baseline.json) apply as they would to the original. The
original project folder is only read. `--frames` also snapshots those times into <folder>/<id>/qa/frames/ to look at.

Use it before claiming a runtime or check change leaves finished lessons alone (Rule 0: run it, look at the frames).
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

COPY = ("project.json", "state.json", "plan", "scenes", "audio", "media", "sources")


def sandbox(pid: str, dest: Path) -> Path:
    src = ROOT / "projects" / pid
    if not (src / "project.json").exists():
        raise SystemExit(f"no project {pid}")
    out = dest / pid
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in COPY:
        s = src / name
        if s.is_dir():
            shutil.copytree(s, out / name)
        elif s.exists():
            shutil.copy2(s, out / name)
    for d in ("build", "qa", "renders", "logs"):
        (out / d).mkdir(exist_ok=True)
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+")
    ap.add_argument("--to", required=True)
    ap.add_argument("--check", action="store_true", help="run the full check (probe, HyperFrames, sheets, frame checks)")
    ap.add_argument("--probe", action="store_true", help="run the probe only (the default)")
    ap.add_argument("--frames", help="comma-separated times to snapshot into qa/frames")
    a = ap.parse_args(argv)
    from loom import flow, qa
    from loom.project import Project
    from loom.util import LoomError, write_json
    dest = Path(a.to).resolve()
    dest.mkdir(parents=True, exist_ok=True)
    summary = {}
    for pid in a.ids:
        d = sandbox(pid, dest)
        p = Project.open(str(d))
        print(f"== {pid}: compose in {d}")
        flow.run_code(p, "compose")
        row = {"dir": str(d)}
        if a.check:
            try:
                flow.run_code(p, "check")
                row["check"] = "passed"
            except LoomError as e:
                row["check"] = str(e)[:200]
            rep = json.loads((d / "qa/report.json").read_text(encoding="utf-8"))
            row["errors"], row["warnings"] = len(rep.get("errors") or []), len(rep.get("warnings") or [])
        else:
            pr = qa.probe(p)
            row["probe"] = {"ready": pr.get("ready"), "errors": len(pr.get("errors") or []), "warnings": len(pr.get("warnings") or [])}
        if a.frames:
            ts = [float(x) for x in a.frames.split(",") if x.strip()]
            qa._snap(p, ts)
            row["frames"] = len(ts)
        summary[pid] = row
        print(json.dumps(row))
    write_json(dest / "sandbox_summary.json", summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
