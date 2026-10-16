"""A/B: does the toolbox change what the storyboard picks? (D-137)

The same lesson's storyboard is written twice from the same script and allocation: once with the toolbox (the menu
in the prompt, use_tool, the hand-over) and once without it (LOOM_TOOLBOX=off, the engine as it was before). Then the
two storyboards are counted side by side: beat kinds, the tools each scene names, three and skia beats, the toolbox
calls the bespoke designs make, use_tool loads, and the storyboard's cost. Quality is not a count: look at both
animatics before deciding.

    py tools/toolbox_ab.py prepare mfa-explained                 # makes projects/ab-mfa-explained-on and -off
    py -m loom agents run ab-mfa-explained-on  --profile claude-balanced --until storyboard --redo storyboard --budget 3 --approve-knowledge-as "agent, unattended per Kshitij (A/B copy of an approved lesson)"
    LOOM_TOOLBOX=off py -m loom agents run ab-mfa-explained-off --profile claude-balanced --until storyboard --redo storyboard --budget 3 --approve-knowledge-as "agent, unattended per Kshitij (A/B copy of an approved lesson)"
      (PowerShell: $env:LOOM_TOOLBOX="off"; py -m loom agents run ... ; Remove-Item Env:LOOM_TOOLBOX)
    py tools/toolbox_ab.py compare ab-mfa-explained-on ab-mfa-explained-off   # prints and writes the table
    py -m loom animatic ab-mfa-explained-on ; py -m loom animatic ab-mfa-explained-off              # then LOOK
"""
from __future__ import annotations

import json
import re
import shutil
import sys
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from loom.util import read_json, write_json  # noqa: E402

CALLS = {"physics": r"Loom\.physics", "brush": r"Loom\.brush", "orb": r"Loom\.orb\("}


def prepare(src: str) -> list[str]:
    """Two copies of a lesson that has its script and allocation: plan, sources and project files only (no build,
    audio, renders or logs), each with its own id."""
    s = ROOT / "projects" / src
    if not (s / "plan" / "script.json").exists() or not (s / "plan" / "allocation.json").exists():
        raise SystemExit(f"{src}: needs plan/script.json and plan/allocation.json")
    made = []
    for arm in ("on", "off"):
        pid = f"ab-{src}-{arm}"
        d = ROOT / "projects" / pid
        if d.exists():
            raise SystemExit(f"{pid} exists: remove it first (nothing is overwritten)")
        d.mkdir(parents=True)
        for sub in ("plan", "sources"):
            if (s / sub).exists():
                shutil.copytree(s / sub, d / sub)
        if (s / "qa" / "approvals").exists():          # the knowledge approval travels with the plan
            shutil.copytree(s / "qa" / "approvals", d / "qa" / "approvals")
        for f in ("project.json", "state.json"):
            if (s / f).exists():
                shutil.copy2(s / f, d / f)
        cfg = read_json(d / "project.json")
        cfg["id"] = pid
        write_json(d / "project.json", cfg)
        made.append(pid)
    return made


def summary(pid: str) -> dict:
    p = ROOT / "projects" / pid
    sb = read_json(p / "plan" / "storyboard.json", {}) or {}
    sc = sb.get("scenes") or []
    kinds = Counter(s.get("kind") for s in sc)
    named = Counter(t for s in sc for t in (s.get("tools") or []))
    calls = Counter()
    for s in sc:
        blob = json.dumps(s.get("design") or {})
        for k, rx in CALLS.items():
            if re.search(rx, blob):
                calls[k] += 1
    loads = []
    f = p / "logs" / "decisions.jsonl"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            if '"tool_load"' in line:
                r = json.loads(line)
                loads.append(r.get("choice"))
    cost = tokens = 0.0
    g = p / "logs" / "llm_calls.jsonl"
    if g.exists():
        for line in g.read_text(encoding="utf-8").splitlines():
            r = json.loads(line)
            if str(r.get("role", "")).startswith("storyboard"):
                cost += float(r.get("usd") or 0)
                tokens += float(r.get("input") or 0) + float(r.get("output") or 0)
    return {"project": pid, "beats": len(sc), "kinds": dict(kinds), "tools_named": dict(named),
            "three_beats": kinds.get("three", 0), "skia_beats": kinds.get("skia", 0), "design_calls": dict(calls),
            "use_tool_loads": loads, "storyboard_usd": round(cost, 4), "storyboard_tokens": int(tokens), "has_storyboard": bool(sc)}


def compare(a: str, b: str) -> str:
    A, B = summary(a), summary(b)
    rows = ["beats", "kinds", "tools_named", "three_beats", "skia_beats", "design_calls", "use_tool_loads", "storyboard_usd", "storyboard_tokens"]
    md = [f"# Toolbox A/B: {a} (toolbox on) vs {b} (off), {time.strftime('%Y-%m-%d %H:%M')}", "",
          "Counts from the two storyboards; quality is judged by looking at both animatics.", "",
          f"| measure | {a} | {b} |", "|---|---|---|"]
    md += [f"| {r} | {json.dumps(A[r])} | {json.dumps(B[r])} |" for r in rows]
    if not (A["has_storyboard"] and B["has_storyboard"]):
        md += ["", "**Not comparable yet:** at least one arm has no storyboard (run both arms first)."]
    out = "\n".join(md) + "\n"
    dst = ROOT / "docs" / "research" / f"{time.strftime('%Y-%m-%d')}-toolbox-ab-{a}.md"
    dst.write_text(out, encoding="utf-8")
    return out + f"\n(written to {dst.relative_to(ROOT).as_posix()})"


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "prepare":
        print("made:", ", ".join(prepare(sys.argv[2])))
    elif len(sys.argv) >= 4 and sys.argv[1] == "compare":
        print(compare(sys.argv[2], sys.argv[3]))
    else:
        print(__doc__)
