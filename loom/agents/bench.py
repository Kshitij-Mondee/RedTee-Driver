"""Model-combination bench, doctor and run report (D-115).

bench:  the same request through several routing profiles, each into its own project, gated stage by stage, with
        one shared budget and a per-provider cap; writes bench/<run>/REPORT.md and results.json.
doctor: keys present (never printed), each provider's real model list, every profile model checked against it.
report: cost, tokens and time per role and stage for one project.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

from ..project import Project
from ..util import ENGINE_ROOT, LoomError, info, read_json, write_json
from .budget import Budget
from .conductor import Conductor
from .llm import registry as R
from .llm.base import KEY_ENV, has_key


def _claude_code_login() -> bool:
    """Provider claude_code: the `claude` CLI and its claude.ai login, as the role sessions will see it (the child
    environment drops every API key, so the subscription bills, never a key). No model call."""
    import subprocess
    from ..shuttle.launch import child_env
    from ..util import which
    exe = which("claude")
    if not exe:
        info("  claude_code: the claude CLI is not on PATH")
        return False
    try:
        r = subprocess.run([exe, "auth", "status"], capture_output=True, text=True, timeout=60, env=child_env("subscription"),
                           encoding="utf-8", errors="replace")
        st = json.loads(r.stdout or "{}")
    except Exception as e:  # noqa: BLE001
        info(f"  claude_code: `claude auth status` failed: {str(e)[:200]}")
        return False
    ok = bool(st.get("loggedIn")) and st.get("authMethod") == "claude.ai"
    info(f"  claude_code: claude CLI found; login {st.get('authMethod') or 'none'}, subscription {st.get('subscriptionType') or 'none'}"
         + ("" if ok else " (needs a claude.ai login: run `claude` once and sign in)"))
    return ok


def doctor(profiles: list[str] | None = None) -> int:
    bad = 0
    served = {}
    for prov, env in KEY_ENV.items():
        if not has_key(prov):
            info(f"  {prov:9s} key {env}: not set")
            continue
        try:
            ids = R.PROVIDERS[prov]().list_models()
            served[prov] = set(ids)
            info(f"  {prov:9s} key {env}: set; the provider lists {len(ids)} models")
        except Exception as e:  # noqa: BLE001
            bad += 1
            info(f"  {prov:9s} key {env}: set, but listing models failed: {str(e)[:200]}")
    cc = _claude_code_login()
    if cc:
        served["claude_code"] = {m["id"] for m in R.models().values() if m["provider"] == "claude_code"}
    for name in profiles or R.profiles():
        if name == "mock":
            continue
        P = R.profile(name)
        rows = []
        for role, alias in sorted(P["roles"].items()):
            m = R.model(alias)
            if m["provider"] not in served:
                rows.append(f"{role}={alias}: no key or no list")
            elif m["id"] not in served[m["provider"]]:
                rows.append(f"{role}={alias}: '{m['id']}' is NOT served by {m['provider']}")
                bad += 1
        info(f"  profile {name}: " + ("all models served" if not rows else "; ".join(rows)))
        # a claude_code alias is "served" by the CLI whatever it resolves to: say which name the CLI gets, and that every
        # task is stopped if its first message comes from another model (served_model_mismatch, L-325)
        cc_used = sorted({(a, R.model(a)["id"], R.model(a).get("cli")) for a in P["roles"].values() if R.model(a)["provider"] == "claude_code"})
        if cc_used:
            info(f"  profile {name}: claude -p --model " + ", ".join(f"{cli} for {a}" + ("" if cli == mid else f" (an alias, not {mid})")
                                                                for a, mid, cli in cc_used)
                 + "; each task stops if another model answers")
    return 1 if bad else 0


def _summ(p: Project) -> dict:
    run = read_json(p.path("logs/agents_run.json"), {"tasks": []})
    st = {r["stage"]: r for r in __import__("loom.flow", fromlist=["status"]).status(p)}
    sb = read_json(p.path("plan/storyboard.json"), {})
    ol = read_json(p.path("plan/outline.json"), {})
    rep = {"stages": {k: v["status"] for k, v in st.items()}, "tasks": len(run["tasks"]),
           "usd": round(sum(t["cost_usd"] for t in run["tasks"]), 4),
           # the subscription's list-price notional and the billed providers' real USD, never only their sum (R-35)
           "usd_notional": round(sum(t["cost_usd"] for t in run["tasks"] if t.get("provider") == "claude_code"), 4),
           "usd_billed": round(sum(t["cost_usd"] for t in run["tasks"] if t.get("provider") != "claude_code"), 4),
           "seconds": round(sum(t["seconds"] for t in run["tasks"]), 1),
           "repairs": sum(t.get("repairs", 0) for t in run["tasks"]),
           "tokens_in": sum(t["usage"].get("input", 0) for t in run["tasks"]), "tokens_cached": sum(t["usage"].get("cached", 0) for t in run["tasks"]),
           "tokens_out": sum(t["usage"].get("output", 0) for t in run["tasks"]),
           "by_role": {}, "devices": [d.get("id") + ": " + d.get("what", "")[:80] for d in (sb.get("devices") or ol.get("devices") or [])],
           "value_script": [f"{v.get('from')} {v.get('band')}" + (" (break)" if v.get("break") else "") for v in (sb.get("value_script") or ol.get("value_script") or [])],
           "scenes": {}, "warnings_left": {}}
    for t in run["tasks"]:
        r = rep["by_role"].setdefault(t["role"], {"model": t["alias"], "status": [], "usd": 0.0, "turns": 0})
        r["status"].append(t["status"]); r["usd"] = round(r["usd"] + t["cost_usd"], 4); r["turns"] += t["turns"]
    for s in sb.get("scenes") or []:
        rep["scenes"][s.get("kind")] = rep["scenes"].get(s.get("kind"), 0) + 1
    # the share of each capability the lesson used (WS5, 2026-10-07): kinds by beat, and what the drawn scenes call
    from ..capabilities import usage
    rep["capability_share"] = usage(p)
    for k in ("brief", "pedagogy", "script", "storyboard"):
        rep["warnings_left"][k] = len(p.stage_info(k).get("warnings") or [])
    return rep


STAGE_ROLES = [("brief", ["brief"]), ("knowledge", ["knowledge", "skeptic"]), ("pedagogy", ["pedagogy"]), ("persona", ["persona_pick"]),
               ("script", ["script"]), ("storyboard", ["storyboard_outline", "storyboard"]), ("scenes", ["scene"]), ("review", ["critic"])]


def roles_until(until: str) -> set[str]:
    """The roles a run up to `until` can call (a profile is only skipped for keys it would actually use)."""
    out = set()
    for st, roles in STAGE_ROLES:
        out |= set(roles)
        if st == until:
            break
    return out


def bench(topic: str, profiles: list[str], until: str = "storyboard", budget_usd: float = 4.0, provider_cap: float | None = None,
          request: dict | None = None, approve_as: str = "agent, unattended bench (topic mode)", run_id: str | None = None,
          provider_override=None, context: str = "cards", critic: bool = False) -> Path:
    run_id = run_id or time.strftime("%Y%m%d-%H%M%S")
    out = ENGINE_ROOT / "bench" / run_id
    out.mkdir(parents=True, exist_ok=True)
    caps = {p: provider_cap for p in KEY_ENV} if provider_cap else {}
    budget = Budget(budget_usd, caps, ledger=out / "llm_calls.jsonl")
    req = {"audience": "corporate employees", "genre": "teaching", "length_min": 2, "style": "story-cartoon", "persona": "mentor", **(request or {})}
    results = {}
    for name in profiles:
        P = R.profile(name)
        need = roles_until(until)
        missing = sorted({R.model(a)["provider"] for r, a in P["roles"].items() if r in need and not R.available(R.model(a))}) if not provider_override else []
        dead = sorted({R.model(a)["provider"] for r, a in P["roles"].items() if r in need} & budget.dead)
        if dead:
            results[name] = {"skipped": f"out of credit this run: {', '.join(dead)}"}
            info(f"[bench] {name}: skipped ({', '.join(dead)} is out of credit; top up and run it with agents run)")
            continue
        if missing:
            results[name] = {"skipped": f"no key for {', '.join(missing)}"}
            info(f"[bench] {name}: skipped (no key for {', '.join(missing)})")
            continue
        pid = f"bench-{run_id}-{name}".lower().replace(".", "-")[:60]
        p = Project.create(pid, topic, None, req)
        info(f"[bench] {name} -> {p.root}")
        t0 = time.monotonic()
        try:
            code = Conductor(p, name, budget, approve_knowledge_as=approve_as, provider_override=provider_override, critic=critic,
                             context=context).run(until)
        except Exception as e:  # noqa: BLE001
            code = -1
            info(f"[bench] {name}: crashed: {str(e)[:300]}")
        r = _summ(p)
        r.update(exit=code, project=str(p.root), wall_s=round(time.monotonic() - t0, 1))
        results[name] = r
        write_json(out / "results.json", {"topic": topic, "until": until, "request": req, "context": context, "budget": budget.summary(), "results": results})
    write_json(out / "results.json", {"topic": topic, "until": until, "request": req, "context": context, "budget": budget.summary(), "results": results})
    (out / "REPORT.md").write_text(report_md(topic, until, results, budget, req=req, context=context), encoding="utf-8")
    info(f"[bench] report: {out / 'REPORT.md'}")
    return out


def report_md(topic, until, results, budget, req: dict | None = None, context: str = "cards") -> str:
    req = req or {}
    # the same style, persona and mix for every profile is the bench's design: said here, so nobody reads it as the
    # models' choice (2026-10-06)
    L = [f"# Model bench: {topic}", "", f"Held the same for every profile: style `{req.get('style')}`, persona `{req.get('persona')}`, "
         f"mix `{req.get('mix', 'classic')}`, length {req.get('length_min')} min, context `{context}`.", "",
         f"Stages run: up to `{until}`. Spent ${budget.spent:.4f} of ${budget.run_usd:.2f} "
         f"({', '.join(f'{k} ${v:.4f}' for k, v in budget.by_provider.items())}).", "",
         "Gate results are facts. Quality is NOT judged here: read each project's outline and storyboard, or render the animatic "
         "(`py -m loom animatic <project>`), and pick by looking.", "",
         "| profile | exit | stages done | repairs | cost | tokens in (cached) / out | wall |", "|---|---|---|---|---|---|---|"]
    for n, r in results.items():
        if "skipped" in r:
            L.append(f"| {n} | skipped: {r['skipped']} | | | | | |")
            continue
        done = sum(1 for v in r["stages"].values() if v == "done")
        L.append(f"| {n} | {r['exit']} | {done}/{len(r['stages'])} | {r['repairs']} | ${r['usd']:.4f} | {r['tokens_in']} ({r['tokens_cached']}) / {r['tokens_out']} | {r['wall_s']} s |")
    for n, r in results.items():
        if "skipped" in r:
            continue
        L += ["", f"## {n}", f"- project: `{r['project']}`", f"- stages: " + ", ".join(f"{k} {v}" for k, v in r["stages"].items()),
              f"- by role: " + "; ".join(f"{k} {v['model']} {'/'.join(v['status'])} ${v['usd']}" for k, v in r["by_role"].items()),
              f"- gate warnings left: {r['warnings_left']}", f"- storyboard scene kinds: {r['scenes']}",
              "- capability share: " + ", ".join(f"{k} {v}" for k, v in (r.get("capability_share") or {}).items()),
              "- devices:" + "".join(f"\n  - {d}" for d in r["devices"]) if r["devices"] else "- devices: (none)",
              "- value script: " + ", ".join(r["value_script"]) if r["value_script"] else "- value script: (none)"]
    L += ["", "Exit codes: 0 done, 2 a gate failed after repairs, 3 waiting at a human gate, 4 budget stop, -1 crash."]
    return "\n".join(L) + "\n"


def report(p: Project) -> dict:
    r = _summ(p)
    info(json.dumps({k: r[k] for k in ("usd", "usd_notional", "usd_billed", "seconds", "tasks", "repairs", "tokens_in", "tokens_cached", "tokens_out", "by_role")}, indent=1))
    return r
