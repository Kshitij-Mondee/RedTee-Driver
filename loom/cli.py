"""Loom command line.   py -m loom <command> ...   (use `python3 -m loom` on Linux/macOS)"""
from __future__ import annotations

import argparse
import json
import os
import sys

from .util import ENGINE_ROOT, LoomError, info


def _load_env():
    """One key file: <engine>/.env (KEY=VALUE lines). Never committed."""
    p = ENGINE_ROOT / ".env"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main(argv=None) -> int:
    _load_env()
    ap = argparse.ArgumentParser(prog="loom", description="Loom: pedagogy-first, code-rendered L&D video engine")
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("new", help="create a project")
    a.add_argument("id"); a.add_argument("--topic"); a.add_argument("--source", nargs="*")
    a.add_argument("--audience"); a.add_argument("--genre", default="auto", help="teaching, explainer, onboarding, policy, soft-skills, or auto (read from the topic)"); a.add_argument("--length", type=float, default=4)
    a.add_argument("--style", default="flat-cosmos"); a.add_argument("--voice", default="af_heart"); a.add_argument("--voice-provider", default="kokoro")
    a.add_argument("--persona"); a.add_argument("--notes", default=""); a.add_argument("--no-captions", action="store_true")
    a.add_argument("--avatar", default="presenter", help="presenter | file | heygen | none")
    a.add_argument("--mix", default=None, help="auto (default: the style's native mix, D-192) | classic (template 50 / motion 40 / avatar 10) | cinema (template 10 / motion 80 / avatar 10; D-91)")
    a.add_argument("--isolated", action="store_true",
                   help="a lesson no other lesson influences, and that influences none (comparisons): its design seed reads no "
                        "other lesson and no other lesson's seed reads it (L-324)")

    for name, hlp in [("status", "stage table"), ("next", "what to do next"), ("doctor", "check the toolchain"),
                      ("catalog", "rebuild runtime/catalog.json + catalog.md")]:
        s = sub.add_parser(name, help=hlp)
        if name in ("status", "next"):
            s.add_argument("id")

    s = sub.add_parser("task", help="write the agent task file for a stage"); s.add_argument("id"); s.add_argument("stage")
    s = sub.add_parser("recommend-style", help="the styles that fit a topic and kind of video, with reasons (D-192)")
    s.add_argument("--topic", required=True); s.add_argument("--kind", default=None); s.add_argument("--notes", default="")
    s.add_argument("-n", type=int, default=3)
    s = sub.add_parser("accept", help="validate a stage's artifact (agent mode)"); s.add_argument("id"); s.add_argument("stage")
    s = sub.add_parser("approve", help="human approval gate: knowledge (or facts), plan, final"); s.add_argument("id"); s.add_argument("stage")
    s.add_argument("--by", required=True); s.add_argument("--notes", help="what the person wants changed or kept (handed to the Shuttle lead on resume)")
    s = sub.add_parser("run", help="run one stage (code stages; agent stages with --api)"); s.add_argument("id"); s.add_argument("stage")
    s.add_argument("--api", action="store_true"); s.add_argument("--force", action="store_true"); s.add_argument("--quality", default="high")
    s.add_argument("--reason", help="render --force: why this build ships despite its check (required; logged as the override)")
    s = sub.add_parser("go", help="run everything that can run; stop at the next agent task (or use --api)")
    s.add_argument("id"); s.add_argument("--api", action="store_true"); s.add_argument("--until", default="render")
    s = sub.add_parser("tweak", help="a small, scoped change for a cheap model"); s.add_argument("id"); s.add_argument("instruction")
    s.add_argument("--beat"); s.add_argument("--api", action="store_true")
    s = sub.add_parser("agents", help="run the pipeline through API agents (Claude, OpenAI, Gemini; D-115)")
    s.add_argument("action", choices=["run", "bench", "doctor", "report", "profiles"])
    s.add_argument("id", nargs="?", help="project id (run, report)")
    s.add_argument("--profile", default="mixed-value"); s.add_argument("--profiles", help="bench/doctor: comma list")
    s.add_argument("--until", default="storyboard"); s.add_argument("--budget", type=float, default=3.0, help="USD cap for the whole run")
    s.add_argument("--provider-cap", type=float, help="USD cap per provider"); s.add_argument("--approve-knowledge-as")
    s.add_argument("--topic"); s.add_argument("--style", default="story-cartoon"); s.add_argument("--length", type=float, default=2)
    s.add_argument("--audience", default="corporate employees"); s.add_argument("--workers", type=int, default=4)
    s.add_argument("--redo", help="run: write this stage again (and so everything after it), e.g. --redo pedagogy")
    s.add_argument("--keep", action="store_true", help="run: keep stages accepted earlier even if a newer gate would refuse them")
    s.add_argument("--context", choices=["cards", "parity"], default="cards",
                   help="cards: short role cards + sections on demand; parity: the full Cowork reading list per stage, cached")
    s.add_argument("--mix", help="bench: treatment mix name (classic, cinema)")
    s.add_argument("--critic", action="store_true", help="bench: run the picture critic too (agents run always does)")
    s.add_argument("--repair-rounds", type=int, default=2, help="run: fix rounds per owner when the check or critic finds defects")
    s.add_argument("--plan-gate", action="store_true", help="run: opt in to the plan checkpoint (off by default, D-131): stop "
                   "for `py -m loom approve <id> plan --by` before the kit and scenes")
    s.add_argument("--approve-plan-as", help="run: with --plan-gate, approve the plan (script + storyboard) unattended, "
                   "recorded with this name")
    s = sub.add_parser("snapshot", help="contact sheet at times"); s.add_argument("id"); s.add_argument("--at", required=True)
    s = sub.add_parser("setup", help="download models"); s.add_argument("what", choices=["voice"])
    s = sub.add_parser("brand", help="brand on any style: list, check, preview")
    s.add_argument("action", choices=["list", "lint", "preview"]); s.add_argument("brand", nargs="?"); s.add_argument("--styles")
    s = sub.add_parser("restyle", help="switch a lesson's style and/or brand and re-prove it (no model calls)")
    s.add_argument("id"); s.add_argument("--style"); s.add_argument("--brand", help="brand id, or '' to remove"); s.add_argument("--as", dest="fork_as")
    s = sub.add_parser("manim", help="render a lesson's Manim clips (reuses the shared store; --draft for fast previews)")
    s.add_argument("id"); s.add_argument("--draft", action="store_true"); s.add_argument("--force", action="store_true")
    s.add_argument("--jobs", type=int, help="scenes rendered at once (default: $LOOM_MANIM_JOBS, else up to 4 by CPU)")
    s = sub.add_parser("cache", help="the shared Manim clip store: status, or prune clips no lesson uses")
    s.add_argument("action", choices=["status", "prune"]); s.add_argument("--days", type=float, default=30.0)
    s.add_argument("--all", action="store_true", help="prune every unused clip, whatever its age")
    s = sub.add_parser("verify", help="compare the rendered MP4 with the checked preview frames (optionally a slice)")
    s.add_argument("id"); s.add_argument("--from", dest="a", type=int); s.add_argument("--to", dest="b", type=int)
    s = sub.add_parser("trailer", help="a 20-35 s course trailer cut from an approved lesson (no model calls)")
    s.add_argument("id"); s.add_argument("--tone", default="default"); s.add_argument("--beats", help="hook,highlight...,payoff")
    s.add_argument("--render", action="store_true"); s.add_argument("--quality", default="high")
    s = sub.add_parser("animatic", help="one panel per beat from the plan (shot, depth, light, narration), timed to the voice: review the story before the build")
    s.add_argument("id"); s.add_argument("--plan-only", action="store_true", help="draw every panel from the plan even when built frames exist")
    s = sub.add_parser("options", help="the beats that have more than one treatment, and which one each uses now")
    s.add_argument("id")
    s = sub.add_parser("switch", help="use another treatment for a beat (the current one is kept as an alternative)")
    s.add_argument("id"); s.add_argument("beat"); s.add_argument("option")
    s = sub.add_parser("cost", help="what a lesson's plan will take to make: model tasks, clip seconds, render-time estimate (loom/cost.py; no tiers, D-67)")
    s.add_argument("id")
    s = sub.add_parser("reel", help="a short showcase video cut from lab and clip scenes by the engine's renderers (loom/reel.py)")
    s.add_argument("spec"); s.add_argument("--only", type=int, help="render one segment (1-based) and stop"); s.add_argument("--force", action="store_true")
    s = sub.add_parser("variety", help="variety ledger and AI-tells lint across lessons (loom/checks/variety.py, D-79)")
    s.add_argument("id", nargs="?", help="judge one lesson against the baseline (default: lessons not in the baseline)")
    s.add_argument("--last", type=int, default=5); s.add_argument("--baseline", action="store_true", help="record the present lessons as the baseline")
    s.add_argument("--demo", action="store_true", help="include _demo projects")
    s = sub.add_parser("art", help="search the approved free illustration sets (loom/vendor_art.py, D-88)")
    s.add_argument("query", nargs="?", default=""); s.add_argument("--set")
    s = sub.add_parser("seed", help="the lesson's design seed: its own treatment of the essentials (loom/seed.py, D-81)")
    s.add_argument("id"); s.add_argument("--set", action="append", default=[], help="axis=option, the person's choice (repeatable)")
    s.add_argument("--show", action="store_true", help="print the choice and the alternatives, write nothing")
    s.add_argument("--clear", action="store_true", help="opt out: draw the classic treatments")
    s = sub.add_parser("device", help="swap a device beat's device, screen or mood after the storyboard (loom/devices.py, D-140)")
    s.add_argument("id", nargs="?"); s.add_argument("beat", nargs="?"); s.add_argument("device", nargs="?")
    s.add_argument("--screen", help="a screen spec as JSON"); s.add_argument("--mood"); s.add_argument("--params", help="other params as JSON")
    s.add_argument("--list", action="store_true", help="the devices, moods and screen kinds")
    s = sub.add_parser("models", help="the 3D model library (assets/models3d): list, check, turntable sheets")
    s.add_argument("action", nargs="?", choices=["list", "check", "sheet"]); s.add_argument("ids", nargs="*"); s.add_argument("--style")
    s = sub.add_parser("sets", help="the set library (assets/sets/<world>/<scene>): list, add <batch> --by NAME, find TEXT --style S, check, demand")
    s.add_argument("action", nargs="?", choices=["list", "add", "find", "check", "demand"]); s.add_argument("target", nargs="?")
    s.add_argument("--by", help="add: who approved the sets"); s.add_argument("--style", help="find: the lesson style")
    s.add_argument("--only", help="add: only these scene ids from the batch, comma-separated (the rest are held)")
    s.add_argument("--write", action="store_true", help="check: rewrite INDEX.md")
    s = sub.add_parser("slice", help="a lesson cut to a run of its beats, its scenes to be written again (D-166): slice <source> <new id> --beats b08-b18")
    s.add_argument("source"); s.add_argument("new_id"); s.add_argument("--beats", required=True); s.add_argument("--by")
    s = sub.add_parser("kept", help="reuse or build per style (assets/kept/<style>, D-163): list [--style S], keep <lesson> [--force], remove <id>")
    s.add_argument("action", nargs="?", choices=["list", "keep", "remove"]); s.add_argument("target", nargs="?")
    s.add_argument("--style"); s.add_argument("--force", action="store_true", help="keep: also an isolated lesson")
    s = sub.add_parser("lab", help="motion lab: render a technique's filmstrip (scenes_examples/lab) with the real runtime")
    s.add_argument("scene", nargs="?", default=None, help="a lab scene id, or 'all' (or use --file)"); s.add_argument("--style"); s.add_argument("--at")
    s.add_argument("--file", help="any scene file (a style example): its @lab cues or words time its ctx.cue calls")
    s.add_argument("--out", help="the folder the strip goes to (default docs/styles/demos/lab)")
    s.add_argument("--frames", help="also keep each full-size frame in this folder (for tools/style_fingerprint.py)")
    s.add_argument("--seed", help="a design seed for the strip: axis=option,axis=option or @<lesson id> (D-81)")
    s = sub.add_parser("studio", help="the Loom Studio (brand kits, looks, lessons) on http://127.0.0.1:8820")
    s.add_argument("--port", type=int, default=8820)
    s = sub.add_parser("library", help="element library: count forms, assess and promote reusable components")
    s.add_argument("action", choices=["harvest", "status", "tasks", "accept", "sheet", "backfill", "verify-backfill", "check"])
    s.add_argument("form", nargs="?"); s.add_argument("--api", action="store_true")
    s = sub.add_parser("strips", help="film strips: 8 frames per beat and per join from the MP4 or the build (loom/strips.py, D-100)")
    s.add_argument("id"); s.add_argument("--source", default="auto", choices=["auto", "mp4", "build"])
    s.add_argument("--range", help="a-b seconds of the MP4 to extract this call"); s.add_argument("--budget", type=int)
    s.add_argument("--beats", help="only these beats and their joins: b17-b21 or b03,b07")
    s.add_argument("--preview", action="store_true", help="instead of sheets, a watchable MP4 of --beats from the build, with the mix")
    s.add_argument("--fps", type=int, default=12)
    s = sub.add_parser("ledger", help="the decision ledger (D-97): stats for a lesson, --backfill an old one, or 'export' all to datasets/")
    s.add_argument("id", help="a lesson id, 'all' (stats of every lesson) or 'export'"); s.add_argument("--backfill", action="store_true")
    s = sub.add_parser("golden", help="the golden set (D-102 E1): build the frames, serve the blind rating page, report ratings and judge agreement (loom/golden.py)")
    s.add_argument("action", choices=["build", "serve", "report", "export"])
    s.add_argument("--root", action="append", help="build: override a source root, e.g. docs=C:/Users/Admin/Documents")
    s.add_argument("--force", action="store_true", help="build: re-extract frames that already exist")
    s.add_argument("--port", type=int, default=8830); s.add_argument("--no-open", action="store_true")
    s.add_argument("--set", dest="gset", help="a later rating set in docs/research/golden/sets/<name> (e.g. e2); default: the E1 set")
    s.add_argument("--rater", default="kshitij"); s.add_argument("--judge", help="report: a judge's scores {frame key or id: score}")
    s = sub.add_parser("shuttle", help="Shuttle: one lead agent owns the lesson, on rails the engine enforces (loom/shuttle, beside Relay)")
    s.add_argument("action", choices=["run", "resume", "status", "report", "agents", "grant-reopen", "waive"])
    s.add_argument("--beat", help="waive: the beat whose critic blocker a person ships over (L-439)")
    s.add_argument("id", nargs="?", help="project id (run, resume, status, report, grant-reopen)")
    s.add_argument("--by", help="grant-reopen, waive: the person who decides (never an agent)")
    s.add_argument("--why", help="grant-reopen: the reason, logged")
    s.add_argument("--count", type=int, default=1, help="grant-reopen: reopens to add (default 1)")
    s.add_argument("--mode", choices=["subscription", "api"],
                   help="api (the default with the loom runner): the providers' API keys from .env; subscription: claude -p on the "
                        "person's claude.ai login (--runner cli only)")
    s.add_argument("--lead", help="the lead's model: sonnet or opus (Claude Code aliases), or any loom/agents/config/models.json alias with "
                                  "the loom runner, e.g. gemini-3.1-pro (Opus only where a decision allows it, D-119, D-164)")
    s.add_argument("--budget", type=float, help="USD for the lesson (notional list price in subscription mode)")
    s.add_argument("--budget-tokens", type=int, help="tokens for the lesson (input plus output)")
    s.add_argument("--budget-calls", type=int, help="model calls for the lesson")
    s.add_argument("--approve-as", help='unattended approvals, recorded as such: "agent, unattended per <who>"')
    s.add_argument("--until", help="stop once this phase is accepted (P1 to P11)")
    s.add_argument("--runner", choices=["loom", "cli", "sdk"],
                   help="loom (the default, D-165): Shuttle's own agents on any provider; cli: Claude Code sessions (claude -p); sdk: the "
                        "Agent SDK when installed")
    s.add_argument("--emit", choices=["claude", "sdk", "both"], default="both", help="agents: which sub-agent target to write")
    s.add_argument("--build-lead",
                   help="the lead's model for the build session (P7 to P9); default config.json lead_by_group (sonnet); same = --lead")
    s.add_argument("--preset", help="a named model preset from loom/shuttle/config.json model_presets, e.g. sonnet-only (Sonnet "
                   "everywhere, Opus for the storyboard only)")
    s = sub.add_parser("layout", help="the layout guard (D-169): the engine moves labels, tags and edge-crossing texts clear: layout <id> on|off|solve|show")
    s.add_argument("id"); s.add_argument("action", choices=["on", "off", "solve", "show"])
    s = sub.add_parser("asr", help="speech check: transcribe every narrated phrase and compare it with the script (D-174)")
    s.add_argument("id"); s.add_argument("--accept", action="append", default=[], help="a phrase id (b07.2) a person listened to and found right")
    s.add_argument("--model", default=None)
    s = sub.add_parser("note", help="log a decision or correction made outside a stage (orchestrator fix, deviation, override) in the ledger")
    s.add_argument("id"); s.add_argument("text"); s.add_argument("--beat"); s.add_argument("--stage", default="orchestrator")
    s.add_argument("--kind", default="fix", choices=["fix", "deviation", "override", "routing", "tooling", "finding"])
    s.add_argument("--by", default="orchestrator")

    args = ap.parse_args(argv)
    try:
        return _dispatch(args)
    except LoomError as e:
        print(f"\nloom: {e}", file=sys.stderr)
        return 2


def _dispatch(args) -> int:
    from .project import Project
    if args.cmd == "golden":
        from . import golden as G
        return G.main(args.action, roots=args.root, force=args.force, port=args.port, rater=args.rater,
                      judge=args.judge, no_open=args.no_open, set_name=args.gset)
    if args.cmd == "strips":
        from . import strips as ST
        if args.preview:
            if not args.beats:
                raise LoomError("--preview needs --beats")
            r = ST.preview(Project.open(args.id), args.beats, fps=args.fps, budget=args.budget)
            print(json.dumps(r)); return 0 if not r["missing"] else 3
        rng = tuple(float(x) for x in args.range.split("-")) if args.range else None
        idx = ST.sheets(Project.open(args.id), args.source, rng, args.budget, beats=args.beats)
        print(f"{len(idx['sheets'])} sheets, {idx['missing_frames']} missing frames"); return 0 if not idx["missing_frames"] else 3
    if args.cmd == "ledger":
        from . import ledger as L
        if args.id == "export":
            print(json.dumps(L.export(), indent=1)); return 0
        ids = [d.name for d in sorted((ENGINE_ROOT / "projects").iterdir()) if (d / "project.json").exists()] if args.id == "all" else [args.id]
        for i in ids:
            pp = Project.open(i)
            if args.backfill:
                print(i, "backfill:", json.dumps(L.backfill(pp)))
            st = L.stats(pp)
            print(i, json.dumps({k: v for k, v in st.items() if k != "versions"}), f"versions={len(st['versions'])}")
        return 0
    if args.cmd == "asr":
        from .narrate import asr as A
        pp = Project.open(args.id)
        if args.accept:
            for pid in args.accept:
                A.accept(pp, pid); print(f"accepted {pid}: a person listened and the voice is right")
        E, W, st = A.check_speech(pp, model_name=args.model)
        for w in W: print("[warn]", w)
        for e in E: print("[error]", e)
        print(st); return 1 if E else 0
    if args.cmd == "note":
        from . import ledger as L
        pp = Project.open(args.id)
        r = L.log(pp, "note", node=f"{args.stage}:{args.beat}" if args.beat else args.stage, decision=args.kind,
                  choice=args.text, by={"kind": "agent" if args.by != "human" else "human", "who": args.by})
        print(f"logged {r['id'] if r else '(failed)'}"); return 0 if r else 1
    if args.cmd == "library":
        return _library(args)
    if args.cmd == "agents":
        return _agents(args)
    if args.cmd == "shuttle":
        from .shuttle.launch import cli as shuttle_cli
        return shuttle_cli(args)
    if args.cmd == "brand":
        from . import brand as B
        if args.action == "list":
            for b in B.list_brands():
                info(f"  {b['id']:20s} {b.get('name', '')}" + ("  [locked]" if (b.get("locks") or {}).get("locked") else ""))
            return 0
        if not args.brand:
            raise LoomError("brand lint/preview needs a brand id")
        if args.action == "lint":
            m = B.lint_matrix(B.load_brand(args.brand)); bad = 0
            for st, r in m.items():
                info(f"  {st:18s} {'OK' if r['ok'] else 'FIX'}")
                for i in r["issues"]:
                    bad += 1
                    info(f"      - {i['msg']}" + (f"  -> set {i['fix']['role']} {i['fix']['from']} to {i['fix']['to']}" if i["fix"] else ""))
            return 2 if bad else 0
        res = B.preview(args.brand, styles=args.styles.split(",") if args.styles else None)
        for st, r in res.items():
            info(f"  {st:18s} {len(r['errors'])} error(s)  {r['sheets'][0] if r['sheets'] else ''}")
        return 0
    if args.cmd == "restyle":
        from .brand import restyle
        r = restyle(args.id, style=args.style, brand=args.brand, fork_as=args.fork_as)
        info(json.dumps(r, indent=1)); return 0 if not r["errors"] else 3
    if args.cmd == "studio":
        from .studio.server import serve
        serve(port=args.port); return 0
    if args.cmd == "new":
        req = {"audience": args.audience, "genre": args.genre, "length_min": args.length, "style": args.style,
               "voice": {"provider": args.voice_provider, "voice": args.voice, "speed": 1.0}, "persona": args.persona,
               "notes": args.notes, "captions": not args.no_captions, "avatar": {"provider": args.avatar, "member": "woman"}}
        if args.mix:
            from .allocate import resolve_mix
            resolve_mix(args.mix)  # an unknown name stops here
            req["mix"] = args.mix
        if not args.topic and not args.source:
            raise LoomError("give --topic \"...\" or --source file(s)")
        p = Project.create(args.id, args.topic, args.source, req)
        if args.isolated:
            cfg = p.cfg
            cfg["isolated"] = True
            p.save_cfg(cfg)
        if args.source:
            import shutil
            from pathlib import Path
            for f in args.source:
                shutil.copy2(f, p.path("sources") / Path(f).name)
        info(f"created {p.root}\nnext: py -m loom go {args.id}")
        return 0
    if args.cmd == "recommend-style":
        from .essence import recommend
        for i, r in enumerate(recommend(args.topic, args.kind, args.notes, args.n), 1):
            info(f"{i}. {r['style']} ({r['tier']}, fit {r['score']}): {r['essence']}")
            info(f"   why: {'; '.join(r['why'])}")
        return 0
    if args.cmd == "doctor":
        from .doctor import doctor
        return doctor()
    if args.cmd == "catalog":
        from .catalog import build_catalog
        build_catalog(); return 0
    if args.cmd == "setup":
        from .setup_models import setup_voice
        setup_voice(); return 0
    if args.cmd == "reel":
        from .reel import build
        r = build(args.spec, only=args.only, force=args.force)
        info(json.dumps(r, indent=1)); return 0
    if args.cmd == "variety":
        from .checks import variety as VR
        return VR.main(args.id, last=args.last, write_baseline=args.baseline, include_demo=args.demo)
    if args.cmd == "art":
        from . import vendor_art as VA
        return VA.main([args.query] + (["--set", args.set] if args.set else []))
    if args.cmd == "seed":
        from . import seed as SD
        return SD.main(args.id, sets=args.set, show=args.show, clear=args.clear)
    if args.cmd == "device":
        from . import devices as DV
        if not args.list and not (args.id and args.beat):
            raise LoomError("device: give <id> <beat> [device] [--screen JSON] [--mood m], or --list")
        return DV.cli(args)
    if args.cmd == "models":
        from . import models3d as M3
        return M3.cli(args)
    if args.cmd == "sets":
        from . import sets as ST
        return ST.cli(args)
    if args.cmd == "layout":
        from . import layout_guard as LG
        return LG.cli(args)
    if args.cmd == "slice":
        from . import slice as SL
        return SL.cli(args)
    if args.cmd == "kept":
        from . import kept as KP
        return KP.cli(args)
    if args.cmd == "lab":
        from . import lab as LB
        from .seed import parse_seed
        at = [float(x) for x in args.at.split(",")] if args.at else None
        if args.file:
            r = LB.strip(None, args.style, at, out_dir=args.out, frames_dir=args.frames, file=args.file)
            for e in r["errors"]:
                info(f"  {r['scene']} [{r['style']}]: {e}")
            for w in r["warnings"]:
                if w.startswith("lab_cue_unresolved"):
                    info(f"  {r['scene']} [{r['style']}]: {w}")
            return 1 if r["errors"] else 0
        if not args.scene:
            raise LoomError("lab: give a scene id, 'all', or --file <scene file>")
        if ":" in args.scene:   # skia:hero_orb, three:device_spin - a clip scene through its real renderer
            kind, name = args.scene.split(":", 1)
            LB.clip_strip(kind, name, args.style or "flat-cosmos", at); return 0
        # --out goes to every path (it was read by --file only: a scene strip landed in docs/styles/demos/lab whatever
        # --out said, 2026-10-08)
        rs = LB.all_strips() if args.scene == "all" else ([LB.strip(args.scene, args.style, at, out_dir=args.out, frames_dir=args.frames, seed=parse_seed(args.seed))]
                                                          if args.seed else LB.scene_strips(args.scene, args.style, at, frames_dir=args.frames, out_dir=args.out))
        bad = [r for r in rs if r["errors"]]
        for r in bad:
            info(f"  {r['scene']} [{r['style']}]: " + "; ".join(r["errors"][:5]))
        return 1 if bad else 0
    if args.cmd == "cache":
        from . import manim_bridge as M
        if args.action == "prune":
            r = M.prune(days=args.days, all_unused=args.all)
            info(f"pruned {len(r['removed'])} clip(s); {r['kept']} in use by lessons were kept"); return 0
        st = M.store_status(); used = M.referenced_ids()
        info(f"Manim clip store: {st['dir']}\n  {len(st['entries'])} clip(s), {st['bytes'] / 1e6:.1f} MB, "
             f"{sum(1 for e in st['entries'] if e['id'] in used)} in use by lessons")
        for e in st["entries"]:
            reads = "all (whole context)" if e["reads"].get("raw") else ", ".join(sorted(e["reads"].get("palette", {}))) or "no colours"
            info(f"  {e['id']}  {e['source']:<10} {e['quality']:<5} {e['made_by']:<8} {'in use' if e['id'] in used else 'unused':<6}  reads: {reads}")
        return 0
    p = Project.open(args.id)
    from . import flow
    from .stages import BY_NAME, active
    if args.cmd == "status":
        for r in flow.status(p):
            print(f"  {r['stage']:<11} {r['kind']:<6} {(r['tier'] or ''):<6} {r['status']:<15} {r['out']}")
        return 0
    if args.cmd == "task":
        from .agent.tasks import write_task
        print(write_task(p, args.stage)); return 0
    if args.cmd == "accept":
        E, W = flow.accept(p, args.stage)
        for w in W:
            print(f"  [warn] {w}")
        if E:
            print(f"\n{args.stage}: REJECTED ({len(E)} error(s))")
            for e in E:
                print(f"  - {e}")
            return 1
        print(f"{args.stage}: accepted" + (" (awaiting human approval)" if p.stage_info(args.stage).get("status") == "needs_approval" else ""))
        return 0
    if args.cmd == "approve":
        flow.approve(p, args.stage, args.by, notes=args.notes); return 0
    if args.cmd == "run":
        st = BY_NAME[args.stage]
        if st.kind == "code":
            flow.run_code(p, args.stage, force=args.force, quality=args.quality, reason=args.reason); return 0
        if not args.api:
            raise LoomError(f"'{args.stage}' is a model stage: write it in agent mode (py -m loom task {p.id} {args.stage}) or add --api")
        from .agent import api
        api.run_stage(p, args.stage, lambda: flow.accept(p, args.stage)[0])
        return 0
    if args.cmd == "next" or args.cmd == "go":
        return _go(p, api_mode=getattr(args, "api", False), until=getattr(args, "until", "render"), only_next=args.cmd == "next")
    if args.cmd == "tweak":
        from .agent.tweak import tweak
        tweak(p, args.instruction, beat=args.beat, api_mode=args.api); return 0
    if args.cmd == "animatic":
        from .story import animatic
        r = animatic(p, use_frames=not args.plan_only)
        info(f"animatic: {r['panels']} panels, {r['duration']} s ({r['timed_by']}) -> {r['sheet']}" + (f", {r['video']}" if r["video"] else ""))
        for w in r["warnings"]:
            info(f"  story: {w}" if not w.startswith("story") else f"  {w}")
        return 0
    if args.cmd == "options":
        from .options import listing
        L = listing(p)
        for r in L:
            info(f"  {r['beat']}: now '{r['now']}'; also: " + ", ".join(f"'{a}'" for a in r["alternatives"]))
        if not L:
            info("  no beat in this lesson has alternatives yet")
        return 0
    if args.cmd == "switch":
        from .options import switch
        switch(p, args.beat, args.option)
        return 0
    if args.cmd == "cost":
        from .cost import estimate
        info(json.dumps(estimate(p), indent=1)); return 0
    if args.cmd == "trailer":
        from . import trailer as TR
        P = TR.build(p, tone=args.tone, beats=args.beats.split(",") if args.beats else None)
        info(json.dumps({k: P[k] for k in ("duration", "why", "cuts", "card_copy")}, indent=1))
        if args.render:
            TR.render(p, quality=args.quality)
        return 0
    if args.cmd == "manim":
        from .manim_bridge import render_all
        rs = render_all(p, force=args.force, quality="draft" if args.draft else "final", jobs=args.jobs)
        for r in rs:
            info(f"  {r['beat']}: {r['how']:<8} {r['quality']:<5} {r['seconds']:>6.1f}s" + (f"  reads: {r['reads']}" if r.get("reads") else ""))
        if not rs:
            info("  no Manim scenes in this lesson")
        return 0
    if args.cmd == "verify":
        from .render import verify_render
        r = verify_render(p, p.path(f"renders/{p.id}.mp4"), frames_slice=(args.a, args.b) if args.a is not None or args.b is not None else None)
        info(f"verify: {r['checked']} frame(s) checked, {len(r['mismatches'])} mismatch(es)" + (f": {r['mismatches']}" if r["mismatches"] else "")
             + (f" ({r['note']})" if r.get("note") else ""))
        return 0 if not r["mismatches"] and r["checked"] else 3
    if args.cmd == "snapshot":
        from .qa import snapshot_sheet
        print(snapshot_sheet(p, [float(x) for x in args.at.split(",")])); return 0
    return 1


def _agents(args) -> int:
    from .project import Project
    from .agents import bench as B
    from .agents.budget import Budget
    from .agents.conductor import Conductor
    from .agents.llm import registry as R
    if args.action == "profiles":
        for n in R.profiles():
            P = R.profile(n)
            info(f"{n:16s} {P['description']}")
            info("                 " + ", ".join(f"{k}={v}" for k, v in sorted(P["roles"].items())))
        return 0
    if args.action == "doctor":
        return B.doctor(args.profiles.split(",") if args.profiles else None)
    if args.action == "bench":
        if not args.topic:
            raise LoomError("bench needs --topic \"...\"")
        profs = (args.profiles or "claude-balanced,openai-balanced,gemini-balanced,mixed-value,budget").split(",")
        req = {"style": args.style, "length_min": args.length, "audience": args.audience}
        if args.mix:
            req["mix"] = args.mix
        B.bench(args.topic, profs, until=args.until, budget_usd=args.budget, provider_cap=args.provider_cap, request=req, context=args.context, critic=args.critic)
        return 0
    if not args.id:
        raise LoomError(f"agents {args.action} needs a project id")
    p = Project.open(args.id)
    if args.action == "report":
        B.report(p); return 0
    caps = {k: args.provider_cap for k in ("anthropic", "openai", "gemini")} if args.provider_cap else {}
    budget = Budget(args.budget, caps)
    info(f"[agents] {p.id}: profile {args.profile}, context {args.context}, style {p.request.get('style')}, budget ${args.budget:g}")
    return Conductor(p, args.profile, budget, approve_knowledge_as=args.approve_knowledge_as, scene_workers=args.workers,
                     context=args.context, repair_rounds=args.repair_rounds, plan_gate=args.plan_gate,
                     approve_plan_as=args.approve_plan_as).run(args.until, redo=args.redo, regate=not args.keep)


def _library(args) -> int:
    from . import library as L
    if args.action in ("harvest", "status"):
        t = L.harvest(write=args.action == "harvest")
        rows = sorted(t["forms"].items(), key=lambda kv: (-kv[1]["count"], kv[0]))
        info(f"library: {len(rows)} forms (promote after {t['promote_after']} uses)")
        for fid, F in rows:
            info(f"  {fid:34s} uses={F['count']:<3d} lessons={F['lessons']:<2d} {F['status']}" + (f" {F['component']}" if F["component"] else ""))
        drows = sorted((t.get("designs") or {}).items(), key=lambda kv: (-kv[1]["count"], kv[0]))
        info(f"library: {len(drows)} beat designs (template after {t['template_promote_after']} uses)")
        for did, D in drows:
            info(f"  design:{did:27s} uses={D['count']:<3d} lessons={D['lessons']:<2d} {D['status']}" + (f" {D['template']}" if D["template"] else ""))
        if t["possible_duplicates"]:
            info("  possible duplicates: " + "; ".join("/".join(d) for d in t["possible_duplicates"]))
        return 0
    if args.action == "backfill":
        tp = L.backfill_task(kind="design" if (args.form or "") == "designs" else "form"); info(f"AGENT TASK (library backfill): {tp}" if tp else "library: every scene is tagged"); return 3 if tp else 0
    if args.action == "verify-backfill":
        E = L.verify_backfill()
        info("backfill: " + ("REJECTED\n" + "\n".join(f"  - {e}" for e in E) if E else "accepted (code unchanged, tags well-formed)")); return 2 if E else 0
    if args.action == "tasks":
        ts = L.pending_tasks()
        if args.api and ts:
            L.run_api(ts); return 0
        info("\n".join(f"AGENT TASK (library, auto): {x}" for x in ts) or "library: nothing due")
        return 3 if ts else 0
    if not args.form:
        raise LoomError(f"library {args.action} needs a form id")
    if args.action == "check":
        E = L.check_design_assessment(args.form[7:]) if args.form.startswith("design:") else L.check_assessment(args.form)
        info(f"assessment {args.form}: " + ("REJECTED\n" + "\n".join(f"  - {e}" for e in E) if E else "valid (not yet recorded: run `library accept`)")); return 2 if E else 0
    if args.action == "sheet":
        rep = L.render_sheet(args.form)
        bad = {k: len(v["errors"]) + len(v["console"]) for k, v in rep["styles"].items()}
        info(f"sheet: {rep['sheet']}  problems per style: {bad}"); return 0
    E = L.accept(args.form)
    if E:
        info(f"library {args.form}: REJECTED ({len(E)} error(s))\n" + "\n".join(f"  - {e}" for e in E)); return 2
    info(f"library {args.form}: accepted"); return 0


def _default_seed(p):
    """D-82: before a new lesson's storyboard, give it the engine's design seed and say so (the person chooses)."""
    from .seed import describe, ensure_default
    D = ensure_default(p.root)
    if D:
        info("\n" + describe(D).replace("<id>", p.id))
        info(f"(written to plan/design_seed.json; change any axis with py -m loom seed {p.id} --set axis=option, or --clear for the classic forms)")


def _go(p, api_mode: bool, until: str, only_next: bool) -> int:
    from . import flow
    from .agent.tasks import write_task
    from .stages import active
    order = [s for s in active(p) if not s.optional]
    for st in order:
        rows = {r["stage"]: r for r in flow.status(p)}
        row = rows[st.name]
        if row["status"] == "done":
            if st.name == until:
                break
            continue
        if row["status"] == "needs_approval":
            info(f"\nHUMAN GATE: review {p.path(st.out)} then run:\n  py -m loom approve {p.id} {st.name} --by \"<your name>\"")
            return 3
        if st.name == "scenes" and not flow.scenes_needed(p):
            flow.mark_done(p, "scenes", passed=True); continue
        if st.kind == "code":
            if only_next:
                info(f"next: py -m loom run {p.id} {st.name}   ({st.desc})"); return 0
            info(f"\n== {st.name} ==")
            flow.run_code(p, st.name)
        else:
            if api_mode and not only_next:
                if st.name == "storyboard":
                    _default_seed(p)
                from .agent import api
                if st.name == "scenes":
                    from .agent.scenes import run_scenes_api
                    run_scenes_api(p)
                else:
                    api.run_stage(p, st.name, lambda: flow.accept(p, st.name)[0])
                continue
            if st.name == "scenes":
                from .agent.scenes import write_scene_tasks
                paths = write_scene_tasks(p)
                info("\nAGENT TASKS (bespoke scenes; independent, can run in parallel):\n" + "\n".join(f"  {x}" for x in paths) +
                     f"\nwhen all are written: py -m loom accept {p.id} scenes")
                return 3
            if st.name == "storyboard":
                _default_seed(p)
            tp = write_task(p, st.name)
            info(f"\nAGENT TASK ({st.tier} tier): {tp}\nwhen done: py -m loom accept {p.id} {st.name}")
            return 3
        if st.name == until:
            break
    info("\nall stages up to '%s' are done." % until)
    if until == "render" and not only_next:
        # feed the element library: count forms; assess / promote what is due (automatic, gated)
        from . import library as L
        ts = L.pending_tasks()
        if ts:
            if api_mode:
                L.run_api(ts)
            else:
                info("\nLIBRARY TASKS (automatic promotion; each is gated by `py -m loom library accept <form>`):\n" + "\n".join(f"  {x}" for x in ts))
                return 3
    return 0
