"""Compare Shuttle and Relay runs phase by phase (a Relay lesson's roles are read onto Shuttle's phases, see
RELAY_PHASE): wall time, model calls, tokens, cost, engine time, looks, checks and what each
check failed on. Read only (a Shuttle lesson's logs/shuttle, a Relay lesson's logs/llm_calls.jsonl and logs/traces, and
logs/decisions.jsonl).

    py tools/run_compare.py https-private https-private-v2 [--md docs/research/<file>.md]

Phases come from each call's and each tool's own `phase` field, so runs with different session splits compare
alike. Cost is the engine's table (notional in subscription mode, the same table for every run). Kshitij, 2026-10-10:
"make sure to run this new video in such a way that the previous videos can be compared to it with the step by step
cost, time, token and errors and stuff".
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHASES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11"]


def _jsonl(f: Path) -> list:
    if not f.exists():
        return []
    out = []
    for line in f.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except ValueError:
            continue
    return out


def _ts(s: str) -> datetime:
    return datetime.fromisoformat(str(s)[:19])


def run_stats(pid: str) -> dict:
    d = ROOT / "projects" / pid / "logs"
    calls, trace = _jsonl(d / "shuttle" / "calls.jsonl"), _jsonl(d / "shuttle" / "trace.jsonl")
    P = {p: {"calls": 0, "in": 0, "cached": 0, "out": 0, "usd": 0.0, "lead_usd": 0.0, "sub_usd": 0.0, "first": None, "last": None,
             "engine_s": 0.0, "tools": collections.Counter(), "looks": 0, "checks": 0, "delegated": 0} for p in PHASES}
    other = {"calls": 0, "usd": 0.0}

    def touch(p, at):
        if p not in P or not at:
            return
        t = _ts(at)
        P[p]["first"] = t if P[p]["first"] is None or t < P[p]["first"] else P[p]["first"]
        P[p]["last"] = t if P[p]["last"] is None or t > P[p]["last"] else P[p]["last"]
    # a reconcile row (the CLI's tokens for a whole sub-agent session minus its per-call rows: most of an author's output)
    # is written when the session ends, often after the phase has moved on; it belongs to the phase its session worked in
    sess_phase = {}
    for r in calls:
        if not r.get("reconcile") and r.get("session") and r.get("phase") in P:
            sess_phase.setdefault(r["session"], collections.Counter())[r["phase"]] += 1
    for r in calls:
        p = r.get("phase")
        if r.get("reconcile") and sess_phase.get(r.get("session")):
            p = sess_phase[r["session"]].most_common(1)[0][0]
        if p not in P:
            other["calls"] += 0 if r.get("reconcile") else 1
            other["usd"] += float(r.get("usd") or 0)
            continue
        a = P[p]
        a["calls"] += 0 if r.get("reconcile") else 1
        a["in"] += int(r.get("input") or 0); a["cached"] += int(r.get("cached") or 0); a["out"] += int(r.get("output") or 0)
        u = float(r.get("usd") or 0); a["usd"] += u
        a["lead_usd" if (r.get("agent") or "lead") == "lead" else "sub_usd"] += u
        touch(p, r.get("at"))
    for t in trace:
        if t.get("event") != "tool":
            continue
        p = t.get("phase")
        if p not in P:
            continue
        touch(p, t.get("at"))
        s = (t.get("ms") or 0) / 1000
        P[p]["engine_s"] += s
        P[p]["tools"][t.get("tool")] += s
        P[p]["looks"] += t.get("tool") == "lab_snapshot"
        P[p]["checks"] += t.get("tool") in ("check", "pilot_check")
        P[p]["delegated"] += t.get("tool") == "delegate"
    sess = [t for t in trace if t.get("event") == "session_start"]
    ends = [t for t in trace if t.get("event") in ("session_result", "session_killed")]
    span = (_ts(ends[-1]["at"]) - _ts(sess[0]["at"])).total_seconds() / 60 if sess and ends else None
    checks = []
    for r in _jsonl(d / "decisions.jsonl"):
        if r.get("node") == "check" and r.get("decision") == "check" and r.get("event") in ("outcome", None, "decision") and (r.get("data") or {}).get("per_beat") is not None:
            kinds = collections.Counter()
            for v in (r["data"].get("per_beat") or {}).values():
                for k, n in (v.get("errors") or {}).items():
                    kinds[k] += n
            checks.append({"at": str(r.get("at"))[11:16], "errors": r["data"].get("errors"), "kinds": dict(kinds.most_common(5))})
    return {"pid": pid, "phases": P, "other": other, "span_min": span, "sessions": len(sess), "checks": checks}


# Relay (2026-10-12): a conductor runs one agent per role, so a phase is read from the role and from when it ran. A role's
# FIRST task is its stage's phase; a later task of the same role (and beat) is rework: before the first picture critic it
# is the check's repair (P9), after it the critique's (P10); the storyboard's look round, before any kit or scene, stays P5.
RELAY_PHASE = {"brief": "P1", "knowledge": "P2", "skeptic": "P2", "pedagogy": "P3", "persona_pick": "P4", "script": "P4",
               "storyboard_outline": "P5", "storyboard": "P5", "kit": "P7", "scene": "P8", "clip": "P8", "critic": "P10"}


def _blank_phases() -> dict:
    return {p: {"calls": 0, "in": 0, "cached": 0, "out": 0, "usd": 0.0, "lead_usd": 0.0, "sub_usd": 0.0, "first": None, "last": None,
                "engine_s": 0.0, "tools": collections.Counter(), "looks": 0, "checks": 0, "delegated": 0} for p in PHASES}


def relay_task_phases(rows: list) -> dict:
    """task id -> phase, from the call rows in time order (see RELAY_PHASE)."""
    order, first_row = [], {}
    for r in rows:
        if r.get("task") not in first_row:
            first_row[r["task"]] = r
            order.append(r["task"])
    seen, critic_seen, build_seen, out = set(), False, False, {}
    for tid in order:
        r = first_row[tid]
        role = r.get("role")
        key = role + (":" + tid.split("-")[1] if role in ("scene", "clip") else "")
        if role == "critic":
            out[tid] = "P10"
            critic_seen = True
        elif key not in seen:
            out[tid] = RELAY_PHASE.get(role, "P10")
            if role in ("kit", "scene", "clip"):
                build_seen = True
        elif role == "storyboard" and not build_seen:
            out[tid] = "P5"
        else:
            out[tid] = "P10" if critic_seen else "P9"
        seen.add(key)
    return out


def relay_stats(pid: str) -> dict:
    """run_stats for a Relay lesson: logs/llm_calls.jsonl (every model call), logs/traces/<task>.jsonl (every tool call
    with its time), logs/decisions.jsonl (the checks), state.json (when each code stage ended)."""
    d = ROOT / "projects" / pid / "logs"
    rows = _jsonl(d / "llm_calls.jsonl")
    phase_of = relay_task_phases(rows)
    P, other = _blank_phases(), {"calls": 0, "usd": 0.0}

    def touch(p, at):
        t = _ts(at)
        P[p]["first"] = t if P[p]["first"] is None or t < P[p]["first"] else P[p]["first"]
        P[p]["last"] = t if P[p]["last"] is None or t > P[p]["last"] else P[p]["last"]
    for r in rows:
        p = phase_of.get(r.get("task"), "P10")
        a = P[p]
        a["calls"] += 1
        a["in"] += int(r.get("input") or 0); a["cached"] += int(r.get("cached") or 0); a["out"] += int(r.get("output") or 0)
        a["usd"] += float(r.get("usd") or 0)
        a["sub_usd"] += float(r.get("usd") or 0)          # Relay has no lead: every call is a role agent's
        if r.get("at"):
            touch(p, r["at"])
    for tid, p in phase_of.items():
        cc_calls = _jsonl(d / "cc" / tid / "calls.jsonl")
        if cc_calls:          # a claude_code task: its server logs each tool call with its seconds
            for e in cc_calls:
                P[p]["engine_s"] += float(e.get("s") or 0)
                P[p]["tools"][e.get("tool")] += float(e.get("s") or 0)
                P[p]["looks"] += e.get("tool") in ("lab_snapshot", "kit_preview", "render_clip")
            continue
        prev = 0.0
        for e in _jsonl(d / "traces" / f"{tid}.jsonl"):
            if e.get("event") == "tool":
                s = max(0.0, float(e.get("t") or 0) - prev)
                P[p]["engine_s"] += s
                P[p]["tools"][e.get("name")] += s
                P[p]["looks"] += e.get("name") in ("lab_snapshot", "kit_preview", "render_clip")
            if isinstance(e.get("t"), (int, float)):
                prev = float(e["t"])
    st = (json.loads((ROOT / "projects" / pid / "state.json").read_text(encoding="utf-8")).get("stages") or {}) \
        if (ROOT / "projects" / pid / "state.json").exists() else {}
    # the code stages make no model call: narration runs from the storyboard's last call to its own end, each check
    # ends at its logged outcome, the render from the last check to its end
    # (state.json keeps only a stage's LAST time, and narration is re-run after fixes, so its first end is read as the
    # moment the kit starts)
    if P["P5"]["last"] and P["P7"]["first"]:
        touch("P6", P["P5"]["last"].isoformat()); touch("P6", P["P7"]["first"].isoformat())
        P["P7"]["first"] = None
        for r in rows:
            if phase_of.get(r.get("task")) == "P7" and r.get("at"):
                t = _ts(r["at"])
                P["P7"]["first"] = t if P["P7"]["first"] is None or t < P["P7"]["first"] else P["P7"]["first"]
    for r in _jsonl(d / "decisions.jsonl"):
        if r.get("node") == "check" and r.get("decision") == "check" and (r.get("data") or {}).get("per_beat") is not None:
            touch("P9", r["at"])
    if (st.get("render") or {}).get("at") and P["P9"]["last"]:
        touch("P11", P["P9"]["last"].isoformat()); touch("P11", st["render"]["at"])
    checks = []
    for r in _jsonl(d / "decisions.jsonl"):
        if r.get("node") == "check" and r.get("decision") == "check" and (r.get("data") or {}).get("per_beat") is not None:
            kinds = collections.Counter()
            for v in (r["data"].get("per_beat") or {}).values():
                for k, n in (v.get("errors") or {}).items():
                    kinds[k] += n
            checks.append({"at": str(r.get("at"))[11:16], "errors": r["data"].get("errors"), "kinds": dict(kinds.most_common(5))})
    P["P9"]["checks"] = len(checks)
    stamps = [_ts(r["at"]) for r in rows if r.get("at")] + [_ts(v["at"]) for v in st.values() if isinstance(v, dict) and v.get("at")]
    span = (max(stamps) - min(stamps)).total_seconds() / 60 if stamps else None
    return {"pid": pid, "phases": P, "other": other, "span_min": span, "sessions": len(phase_of), "checks": checks, "kind": "relay"}


def stats(pid: str) -> dict:
    """Shuttle or Relay, by the logs the lesson has."""
    d = ROOT / "projects" / pid / "logs"
    return run_stats(pid) if (d / "shuttle" / "calls.jsonl").exists() else relay_stats(pid)


def table(runs: list) -> str:
    ids = [r["pid"] for r in runs]
    L = []
    h = lambda cols: "| " + " | ".join(cols) + " |"
    L.append(h(["phase"] + [f"{i}: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks" for i in ids]))
    L.append(h(["---"] * (len(ids) + 1)))
    T = [{"min": 0, "calls": 0, "in": 0, "out": 0, "usd": 0.0, "looks": 0, "checks": 0} for _ in runs]
    for p in PHASES:
        row, any_ = [p], False
        for k, r in enumerate(runs):
            a = r["phases"][p]
            if not a["calls"] and not a["engine_s"] and not a["checks"] and a["first"] is None:
                row.append("-")
                continue
            any_ = True
            mins = (a["last"] - a["first"]).total_seconds() / 60 if a["first"] else 0
            row.append(f"{mins:.0f} / {a['calls']} / {a['in'] / 1e6:.2f} ({a['cached'] / max(1, a['in']):.0%}) / {a['out'] / 1e3:.0f} / "
                       f"{a['usd']:.2f} ({a['lead_usd']:.2f}+{a['sub_usd']:.2f}) / {a['looks']} / {a['checks']}")
            t = T[k]; t["min"] += mins; t["calls"] += a["calls"]; t["in"] += a["in"]; t["out"] += a["out"]; t["usd"] += a["usd"]
            t["looks"] += a["looks"]; t["checks"] += a["checks"]
        if any_:
            L.append(h(row))
    L.append(h(["other (reviewers)"] + [f"{r['other']['calls']} calls, {r['other']['usd']:.2f}" for r in runs]))
    L.append(h(["**total**"] + [f"**{(r['span_min'] or 0):.0f} min wall, {t['calls'] + r['other']['calls']} calls, {t['in'] / 1e6:.1f} M in, "
                                f"{t['out'] / 1e3:.0f} k out, ${t['usd'] + r['other']['usd']:.2f}, {t['looks']} looks, {t['checks']} checks**"
                                for r, t in zip(runs, T)]))
    L.append("")
    L.append("Engine time per phase (the three longest tools, minutes summed across parallel callers):")
    L.append("")
    for r in runs:
        L.append(f"- {r['pid']}: " + "; ".join(f"{p} " + ", ".join(f"{k} {v / 60:.1f}" for k, v in r["phases"][p]["tools"].most_common(3))
                                                 for p in PHASES if r["phases"][p]["tools"]))
    L.append("")
    L.append("Checks (errors, and their kinds):")
    L.append("")
    for r in runs:
        L.append(f"- {r['pid']}: " + ("; ".join(f"{c['at']} {c['errors']} {c['kinds']}" for c in r["checks"]) or "none logged"))
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("lessons", nargs="+")
    ap.add_argument("--md")
    a = ap.parse_args()
    runs = [stats(p) for p in a.lessons]
    out = table(runs)
    print(out)
    if a.md:
        Path(a.md).write_text(f"# Run comparison: {', '.join(a.lessons)}\n\nWritten by `py tools/run_compare.py`.\n\n{out}\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
