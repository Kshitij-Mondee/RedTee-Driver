# Loom - a pedagogy-first, code-rendered L&D video engine

Loom turns a topic or a source document into a finished, narrated, animated lesson. It plans the
teaching first (outcome, strategy, arc, misconceptions, practice, retrieval), then writes, storyboards
and builds the video as **code on one continuous canvas**, so lessons read as a film rather than a
slideshow. The same inputs always render the same frames.

- **Opus plans** (brief, knowledge sheet, teaching plan, script, storyboard).
- **Sonnet builds** (persona, bespoke motion scenes, Manim scenes, visual review).
- **A cheap model tweaks** afterwards (one beat, one file at a time).
- **Code does everything else** deterministically: narration timing, treatment mix, cue resolution,
  camera, composition, sound, gates, render.

Works in **agent mode** (Claude Code / Cowork runs each model stage from a task file; no API key) and
**API mode** (Anthropic Messages API, `ANTHROPIC_API_KEY`).

## What a Loom lesson has in it
- **~50% templates** (definition, steps, compare, stat, bars, cycle, timeline, quote, quiz question and
  answer, recap, icon grid, document page, calendar plan, dialogue scenario, title card) plus the whole
  **RedTee blueprint library** through a read-only bridge.
- **~40% motion heroes**: instruments whose readings travel (`hero.meter`), characters whose thoughts change
  (`hero.character_moment`), journeys (`hero.journey`), systems (`hero.hub`), zoom portals
  (`hero.portal`), **Manim** scenes for curves and maths, and **bespoke** scenes written as code.
- **~10% presenter** bookends (a code-drawn presenter that talks from the narration's envelope; HeyGen or
  your own clips can replace it).
- One **world canvas**: stations, a camera that travels, zoom-throughs into nested stations, elements that
  are held or travel across beats by semantic name, ambient parallax, section chrome, word-synced captions.
- **Style packs** that restyle everything from data: `flat-cosmos`, `editorial-paper`, `whiteboard`,
  `corporate-clean`, `dark-technical`.

## Quick start (Windows, PowerShell or Git Bash)
```
cd Video-Engine
./setup.ps1                      # npm install, pip install, voice model, render browser, catalog, doctor
py -m loom doctor                # every row should be ok
py -m loom new my-lesson --topic "How to give feedback that lands" --audience "new people managers" --genre soft-skills --length 4 --style editorial-paper --persona mentor
py -m loom go my-lesson          # runs code stages; stops at each model task and prints its path
```
In **agent mode**, open this folder in Claude Code and say *"make the lesson my-lesson"*: the
`loom-director` skill (and `CLAUDE.md`) tell the agent how to run the stages. In **API mode**:
`py -m loom go my-lesson --api` (key in `.env`).

## Commands
| command | what it does |
|---|---|
| `new <id> --topic/--source ...` | create a project (topic mode or source mode) |
| `status <id>` / `next <id>` | stage table / what to do next |
| `go <id> [--api] [--until stage]` | run everything runnable; stop at a model task or human gate |
| `task <id> <stage>` / `accept <id> <stage>` | write an agent task / gate its artifact |
| `approve <id> knowledge --by NAME` | the human approval gate for topic-mode facts |
| `run <id> <stage> [--api]` | one stage (code, or model via API) |
| `snapshot <id> --at t1,t2` | contact sheet at times |
| `tweak <id> "change" --beat bXX [--api]` | scoped cheap-model edit |
| `catalog` / `doctor` / `setup voice` | rebuild the template catalog / check the machine / fetch Kokoro |
| `library status\|harvest\|tasks\|check\|accept <id>\|sheet <id>` | the library: count `@form` element tags (components, assessed at 3 uses) and `@design` beat tags (templates, assessed at 2 uses); `<id>` is a form id or `design:<id>` (`docs/COMPONENTS.md`) |
| `manim <id> [--draft] [--jobs N]` / `cache status\|prune` | make or reuse a lesson's Manim clips; inspect or prune the shared clip store (`docs/MANIM.md`) |
| `trailer <id> [--tone T] [--beats ...] [--render]` | a 20-35 s course trailer cut from the lesson's own scenes and narration (`docs/strategy/2026-09-30-brag-and-motion-adoption.md`) |
| `lab <scene\|all\|skia:name\|three:name> [--style S]` | render a technique's filmstrip in the real runtime or clip renderer (`scenes_examples/lab/`, `skia/`, `three/`) |
| `verify <id> [--from A --to B]` | compare the rendered MP4 with the checked preview frames (in slices on a slow machine) |
| `studio [--port 8820]` | the Loom Studio: brand kits, per-style preview, restyle and render lessons (`docs/BRANDS.md`) |
| `brand list\|lint\|preview <id>` / `restyle <id> --style X --brand Y [--as copy]` | brand on any style; switch a lesson's look with no model calls |
| `library backfill [designs]` / `library verify-backfill` | tag older scenes, comments only, with a code-unchanged gate |

## Folder map
```
loom/            Python: CLI, stages, gates, narration, compose, Manim + RedTee bridges, QA, render, brand, studio/
runtime/         the canvas runtime (JS): core, style, kit, motion, world/camera, overlay, components, templates/, blueprints/, components/, manim/
library/         forms.json + FORMS.md (generated counts), decisions.json, assessments/, selection/, sheets/, proofs/ (archived, not live)
packs/           styles/*.json, brands/<id>/ (brand kits), genres/*.md, personas/*.json
prompts/         engine instructions for each model stage
skills/lnd/      your L&D skills (creative director, pedagogy, persona, visual design, motion fit/craft, choreography)
skills/loom/     engine skills: director, scene author, style pack, template author, tweak
docs/            ARCHITECTURE, SCENE_API, STORYBOARD_GUIDE, COMPONENTS, AGENT_LEARNINGS (append-only)
docs/context/    START HERE for context: STATE, DECISIONS (ledger), RUNS, MANIFEST; verified by tools/context_check.py
scenes_examples/ finished bespoke + Manim scenes to imitate
assets/lottie/   Lottie animations a scene can place with ctx.lottie (re-coloured to the style)
cache/           the shared clip store (Manim, Skia, Three.js) (local to each machine; safe to delete; `py -m loom cache`)
projects/        one folder per lesson (spacing-sticks, blameless-postmortem), each with its RUN_LOG
tests/           offline test suite: py tests/run_tests.py
```

## Honest status
The living picture is `docs/context/STATE.md`, and `py tools/context_check.py` prints the live counts
from the code.

Verified in the build environment by running it:
- two lessons from brief to MP4 (`spacing-sticks`, 4:11; `blameless-postmortem`, 5:04, whiteboard);
- every gate proven able to fail (`py tests/run_tests.py`);
- determinism of compose, and the MP4 matching the checked preview;
- API mode against a mock server;
- the RedTee bridge on a real blueprint;
- all style packs rendered;
- the element and template library paths end to end (`library/proofs/`). **Not yet verified:** the real Anthropic API (no key was available), OpenAI/ElevenLabs voices,
HeyGen avatars, and a full run on Windows (the code is written for it: `py`, `Path`, no bash
dependencies).
