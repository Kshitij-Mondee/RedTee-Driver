"""The layout guard (D-169): the engine keeps labels, tags and edge-crossing texts clear of words, of each other and of the
frame edge, so a scene author or a fixer is never sent to move a label by a few pixels.

Kshitij, 2026-10-15: "overlapping and text fitting was very nicely tackled by my deterministic and fully offline engine the
last time in redtee_v1_video. Can you draw influence from there and make something like this here as well so AI agents
are not really required to fix small things like text fitting and overlapping." Then: "there will always be objects that
will need to overlap or collide like a mug on a table. Make those things possible."

How (runtime/layout.js has the rules):
  1. compose puts the lesson's stored plan in the manifest (only the entries whose scene and kit are unchanged) and marks
     the manifest `layout_guard: true` when the lesson has the guard on;
  2. guard_build(build) runs before a build is probed or photographed: Loom.layout.solve() on the page
     (tools/node/layout_solve.mjs), the moves merged into the plan, the build's manifest patched, solved again until
     nothing moves (at most ROUNDS); the plan is saved to projects/<id>/layout/plan.json, each entry with the hash of
     the scene and kit it was solved for;
  3. kit.element and treat.label apply the plan when an element is made.
The plan is data, deterministic and replayable; scene files are never edited. Off (the default), nothing changes: the
classic way is kept (CLAUDE.md rule 11), and the guard becomes a default only after a comparison shows no loss (rule 13).

On: project.json {"layout_guard": true}, or LOOM_LAYOUT_GUARD=1 for every lesson; `py -m loom layout <id> on|off|solve|show`.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import datetime as _dt

from .util import LoomError, info, read_json, sha, write_json, ENGINE_ROOT


def now_iso() -> str:
    return _dt.datetime.now().isoformat(timespec="seconds")

ROUNDS = 3


def enabled(project) -> bool:
    if os.environ.get("LOOM_LAYOUT_GUARD") in ("1", "true", "on"):
        return True
    if os.environ.get("LOOM_LAYOUT_GUARD") in ("0", "false", "off"):
        return False
    return bool((project.cfg or {}).get("layout_guard"))


def plan_path(project) -> Path:
    return project.path("layout/plan.json")


def _scene_keys(build: Path, manifest: dict) -> dict:
    """beat -> the hash of what draws it (its scene file, or its template definition) and of the lesson kit"""
    kit = build / "scenes" / "_kit.js"
    kit_h = sha(kit.read_bytes()) if kit.exists() else "-"
    out = {}
    for s in manifest.get("scenes") or []:
        b = s.get("beat")
        if s.get("kind") == "bespoke":
            f = build / "scenes" / f"{s.get('scene') or b}.js"
            out[b] = (sha(f.read_bytes()) if f.exists() else "missing") + ":" + kit_h
        else:
            out[b] = sha({k: v for k, v in s.items() if k not in ("media", "svg")}) + ":" + kit_h
    return out


def stored(project) -> dict:
    return read_json(plan_path(project), {}) or {}


def manifest_plan(project, build: Path, manifest: dict) -> dict:
    """the stored entries still valid for this build: {"<beat>/<name>": {dx, dy}}"""
    keys = _scene_keys(build, manifest)
    out = {}
    for k, e in (stored(project).get("entries") or {}).items():
        beat = k.split("/", 1)[0]
        if keys.get(beat) and keys[beat] == e.get("for"):
            out[k] = {"dx": e["dx"], "dy": e["dy"]}
    return out


def _index_manifest(build: Path) -> tuple[str, re.Match, dict]:
    html = (build / "index.html").read_text(encoding="utf-8")
    m = re.search(r"window\.LOOM_MANIFEST = (\{.*?\});</script>", html, re.S)
    if not m:
        raise LoomError(f"{build / 'index.html'}: no LOOM_MANIFEST")
    return html, m, json.loads(m.group(1).replace("<\\/", "</"))


def _patch(build: Path, plan: dict) -> None:
    html, m, man = _index_manifest(build)
    man["layout_plan"] = plan
    data = json.dumps(man, ensure_ascii=False).replace("</", "<\\/")
    (build / "index.html").write_text(html[:m.start(1)] + data + html[m.end(1):], encoding="utf-8", newline="\n")
    mf = read_json(build / "manifest.json", {}) or {}
    mf["layout_plan"] = plan
    write_json(build / "manifest.json", mf)


def solve_page(build: Path, beats: list | None = None, step: float | None = None) -> dict:
    from .render import hf_env
    from .util import run, which
    out = Path(build) / "layout_solve.json"
    env = dict(hf_env())
    if step:
        env["LOOM_LAYOUT_SOLVE_STEP"] = str(step)
    if beats:
        env["LOOM_LAYOUT_SOLVE_BEATS"] = ",".join(beats)
    try:
        run([which("node"), str(ENGINE_ROOT / "tools/node/layout_solve.mjs"), str(Path(build) / "index.html"), str(out)], env=env, timeout=600)
    except Exception as e:  # noqa: BLE001
        res = read_json(out, None) if out.exists() else None
        raise LoomError(f"layout solve failed: {(res or {}).get('error') or str(e)[:400]}")
    return read_json(out)


def guard_build(build: Path, beats: list | None = None, project=None) -> dict | None:
    """Solve a composed build until nothing moves, patch it, and store the plan. None when the build has no guard.
    beats: only those beats' windows are sampled (a scene author's look)."""
    build = Path(build)
    if not (build / "index.html").exists():
        return None
    _, _, man = _index_manifest(build)
    if not man.get("layout_guard"):
        return None
    if project is None:
        from .project import Project
        project = Project.open(str((man.get("lesson") or {}).get("id")))
    plan = dict(man.get("layout_plan") or {})
    keys = _scene_keys(build, man)
    rounds, moves_all, last = [], [], None
    for _ in range(ROUNDS):
        last = solve_page(build, beats)
        mv = last.get("moves") or []
        rounds.append({"moves": len(mv), "residual": len(last.get("residual") or []), "samples": last.get("samples"), "ms": last.get("ms")})
        if not mv:
            break
        for m in mv:
            k = f"{m['beat']}/{m['name']}"
            old = plan.get(k) or {"dx": 0, "dy": 0}
            plan[k] = {"dx": round(old["dx"] + m["dx"], 1), "dy": round(old["dy"] + m["dy"], 1)}
            moves_all.append(m)
        _patch(build, plan)
    # the store: every entry with the hash of the scene and kit it was solved for (an edited scene drops its entries)
    from .util import file_lock
    project.path("layout").mkdir(parents=True, exist_ok=True)
    with file_lock(project.path("layout/.lock")):   # parallel scene authors' looks store into one plan
        return _store(project, build, beats, plan, keys, rounds, moves_all, last)


def _store(project, build: Path, beats, plan: dict, keys: dict, rounds: list, moves_all: list, last) -> dict:
    st = stored(project)
    ent = dict(st.get("entries") or {})
    touched = {f"{m['beat']}/{m['name']}" for m in moves_all}
    for k in touched:
        beat = k.split("/", 1)[0]
        why = [m for m in moves_all if f"{m['beat']}/{m['name']}" == k]
        ent[k] = {"dx": plan[k]["dx"], "dy": plan[k]["dy"], "for": keys.get(beat), "kind": why[-1].get("kind"), "mode": why[-1].get("mode"),
                  "fixed": sorted({c for m in why for c in (m.get("before") or {}).get("codes") or []}), "at": now_iso()}
    summary = {"at": now_iso(), "beats": beats, "rounds": rounds, "moved": sorted(touched), "plan_entries": len(plan),
               "residual": (last or {}).get("residual") or [], "converged": bool(rounds) and rounds[-1]["moves"] == 0}
    if touched or not st:
        st = {"about": "written by the layout guard (loom/layout_guard.py, D-169); offsets in each element's parent units; "
                       "an entry applies only while its scene and kit hash ('for') is unchanged. Never hand-edited.",
              "entries": ent, "last": summary}
        write_json(plan_path(project), st)
    write_json(build / "layout_guard.json", summary)
    if build.resolve() == project.path("build").resolve():
        write_json(project.path("qa/layout_guard.json"), summary)
    if touched:
        from . import ledger as L
        L.log(project, "decision", node="layout", decision="layout_guard", choice=f"{len(touched)} moved",
              by={"kind": "code", "who": "loom/layout_guard.py"}, why="the engine moved flexible elements clear of a held conflict (D-169)",
              data={"moved": sorted(touched), "beats": beats, "rounds": rounds, "residual": len(summary["residual"])})
        info(f"layout guard: moved {len(touched)} ({', '.join(sorted(touched)[:6])}{'...' if len(touched) > 6 else ''})")
    return summary


def set_enabled(project, on: bool) -> None:
    cfg = project.cfg
    cfg["layout_guard"] = bool(on)
    project.save_cfg(cfg)


def cli(args) -> int:
    from .project import Project
    p = Project.open(args.id)
    if args.action in ("on", "off"):
        set_enabled(p, args.action == "on")
        from . import ledger as L
        L.log(p, "decision", node="layout", decision="layout_guard_" + args.action, choice=args.action,
              by={"kind": "person", "who": "py -m loom layout"}, why="the layout guard was turned " + args.action + " for this lesson (D-169)")
        info(f"layout guard {args.action} for {p.id}" + (" (compose and check apply it from now on)" if args.action == "on" else ""))
        return 0
    if args.action == "show":
        st = stored(p)
        print(json.dumps({"on": enabled(p), "entries": st.get("entries") or {}, "last": st.get("last")}, indent=1, ensure_ascii=False))
        return 0
    if not enabled(p):
        raise LoomError(f"the layout guard is off for {p.id}: py -m loom layout {p.id} on")
    from .compose import compose
    compose(p, strict=False)
    s = guard_build(p.path("build"), project=p)
    print(json.dumps(s, indent=1, ensure_ascii=False))
    return 0
