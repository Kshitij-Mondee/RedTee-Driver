# Loom portability audit: can it run as an automated pipeline outside Cowork? (2026-10-01)

STATUS: SHIPPED 2026-10-01. Kept in full as evidence for `docs/PORTABILITY_CHECKLIST.md` (the short version), D-75.

This is the full report of a read-only audit agent. It was run in the Cowork sandbox and spot-checked by the
orchestrator: `api.py` and the key, the model ids, no `.git`, no CI, the `context_check` filter and the `claude`
CLI version were all confirmed. Its paths are repo-relative; line numbers are as of that day.

**Updates since (not part of the original audit):**
- The `context_check` same-line fix closed the false negative in section 5 (L-122).
- Windows has since run the setup, and the suite got to 62 passed, 1 failed (L-125 to L-127, L-129).
- The STATE Manim line was superseded.

---

Audited 2026-10-01 against the sandbox working copy. The engine code was confirmed identical to the
`Video-Engine` mirror: `diff -rq` of `loom/` and `skills/` printed nothing. Read-only: no file was modified by
hand. Running the test suite rewrote 34 generated files (`projects/spacing-sticks/build/*`, `qa/*`,
`runtime/catalog.json`), and the sha1 of each one spot-checked matched the mirror.

## Verdict
**Mostly portable. Nothing in the engine code calls a Cowork tool.** Loom is a plain Python + Node CLI that
stores its state in files. The 7 code stages run headless, and so do the gates and the tests. The 7 model
stages (brief, knowledge, pedagogy, persona, script, storyboard, scenes, plus optional review) run in one of
two ways:
- **Agent mode:** a Claude session follows a generated task file. This is how every shipped lesson was made.
- **API mode:** `--api` calls the Anthropic Messages API directly with `ANTHROPIC_API_KEY`. It is implemented,
  but has only been tested against a mock server and has never run a real lesson.

What depends on Cowork is the **orchestration** (the Opus/Sonnet/Haiku sub-agent routing, the looking at
frames, the bookkeeping). It exists only as prose for a Claude session to follow. There is also no version
control and no CI config.

## 1. Pipeline stages
- **Source:** `loom/stages.py:28-68` (14 stages; `context_check` reports `stages 14`).
- **Mechanism:** `loom/cli.py:301-354` (`go`). Agent mode writes `tasks/<stage>.md` and exits 3
  (`cli.py:338-340`); `--api` calls `agent/api.py:run_stage`.
- **Models:** they come from `project.json` `models`. The defaults are in `loom/project.py:12-17`:
  - plan: `claude-opus-5-5`;
  - build: `claude-sonnet-5-5`;
  - tweak: `claude-haiku-4-5-20251001`.

  These match the published model names; whether the calls succeed is unverified.

| item | what it is | Cowork/Claude-app? | evidence | needed elsewhere |
|---|---|---|---|---|
| ingest | PDF/DOCX to page-anchored chunks (source mode) | no (code) | `stages.py:29`; pdfplumber, python-docx (`requirements.txt`) | pip deps |
| brief | Production Brief, plan tier | partly: agent mode needs a Claude session; API mode does not | `stages.py:31`; `agent/tasks.py:21-46`; `agent/api.py:28-47` (urllib, `x-api-key`, `ANTHROPIC_API_KEY`, `LOOM_ANTHROPIC_URL`) | `ANTHROPIC_API_KEY` in `<engine>/.env` (loaded at `cli.py:12-20`), or any agent that can read and write files |
| knowledge | topic-mode fact sheet, plan tier, **human gate** | partly | `flow.py:56-57` sets `needs_approval`; `prompts/knowledge.md:21` says "never set approved"; `flow.py:63-74` `approve --by` | a person (or recorded unattended consent) runs `py -m loom approve <id> knowledge --by ...`; works from any shell |
| pedagogy, script, storyboard | plan tier | partly (same as brief) | `stages.py:37,45,50` | same |
| persona | build tier | partly | `stages.py:41` | same |
| allocate | treatment mix | no (code) | `stages.py:48`, `flow.py:81-83` | none |
| narrate | TTS + word timings | no (code; Kokoro local by default) | `narrate/providers.py:1-5,116`; a Kokoro synth ran: 2.0 s of audio in 2.8 s, offline | `models/kokoro/` (116 MB, gitignored; `py -m loom setup voice`). OpenAI/ElevenLabs need their keys (never proven) |
| scenes | bespoke JS / Manim scenes, build tier, one task per scene | partly | `agent/scenes.py:22-54` (tasks say "LOOK at the snapshot"); API: `scenes.py:67-89` runs them **sequentially**, and its gate is only `check_scenes` + `node --check`, with no snapshot | an agent that can run the CLI and view images; or API mode with weaker feedback |
| compose | bundle runtime, Manim/Skia/Three clips, sound mix | no (code) | `flow.py:87-98` | Node, Chromium (for three), Manim/skia if used; RedTee checkout for `kind: redtee` |
| check | gates, runtime probe, HyperFrames check, contact sheets | no (code) | `flow.py:99-109` | Chromium |
| review | director's look at sheets, build tier, **optional** | partly | `stages.py:64`; **skipped by `go`** (`cli.py:305`); runnable via `run <id> review --api`, which inlines up to 40 sheet images (`api.py:53-57`) | a vision-capable model call or agent |
| render | MP4 + SRT/VTT + transcript + verify | no (code) | `flow.py:110-120`, `render.py` | Chromium, FFmpeg |
| tweak | scoped edit, tweak tier | partly | `agent/tweak.py:34-53`; `--api` only with `--beat` (`tweak.py:61-62`) | same as brief |
| library harvest/status | count `@form`/`@design` tags | no (code) | `cli.py:262-274` | none |
| library assess/promote/select/backfill | LLM judgment tasks | partly | `library.py:1183-1208` `run_api` sends **only the task text**; the scene files the task says to read are not inlined, and the task holds absolute sandbox paths | inline the referenced files in `run_api`, or use an agent with file access |
| trailer, animatic, options/switch, cost, restyle, brand, lab, reel, studio | utilities | no (code) | `cli.py` dispatch | Chromium/FFmpeg for the visual ones |

## 2. Skills
- **What they are:** plain markdown under `skills/`, with only `name` and `description` frontmatter. Usable
  by any framework.
- **No Cowork tool calls inside them:** a grep for `save_skill`, `present_files`, `show_widget`, `mcp__`,
  `Artifact tool`, `Task tool` and `TodoWrite` found nothing. The only agent-specific line is conditional
  ("if you can spawn sub-agents ...").
- **How the engine uses them:** it reads them by path. Agent task files list the skill paths
  (`tasks.py:28-30`), and API mode inlines them into the system prompt (`api.py:97-100`).
- **Cowork-only element:** a second copy saved on the Cowork account (L-80). Outside Cowork the repo copy is
  the only one.

## 3. Sub-agent orchestration (Opus plans, Sonnet builds, Haiku tweaks)
- **What code does:** it only names a tier.
  - `stages.py:18` carries a `tier` field.
  - `tasks.py` prints "Recommended model".
  - API mode maps tier to model id.
- **What it does not do:** there is no code that spawns agents, routes tasks to models in agent mode, runs
  scene tasks in parallel, or retries. `go` exits 3 and waits.
- **Where the protocol lives:** in prose (`AGENT_LEARNINGS.md`, `loom-director/SKILL.md`), followed by a
  Claude session.
- **The one coded loop:** API mode, which is sequential: generate, gate, up to 2 repair rounds
  (`api.py:107-130`).

## 4. Runtime dependencies
| dep | portable? | evidence | needed elsewhere |
|---|---|---|---|
| Node >= 22, HyperFrames 0.8.91, GSAP, puppeteer-core, three, lottie-web, roughjs, Fontsource fonts | yes (npm) | `package.json` | `npm install`. Two npm scripts point at missing files (`tools/node/doctor.mjs`, `tests/runtime/`) |
| Chromium | yes, but must be provisioned | `doctor` needs `HYPERFRAMES_BROWSER_PATH` or the managed browser; the managed download returned 403 in the sandbox (it worked on the PC) | `npx hyperframes browser ensure`, or pin a Chrome. HyperFrames collects anonymous telemetry (`hyperframes telemetry disable`) |
| FFmpeg 4.4+ | yes (system) | sandbox 4.4.2; PC 8.1.1 | apt/winget install |
| Kokoro (kokoro-onnx + ONNX Runtime) | yes, offline | synth ran | `py -m loom setup voice`, `pip install -r requirements.txt` |
| Manim CE | yes | 0.19.1 in the sandbox, 0.20.1 on the PC | pip + cairo/pango system libs; the clip store `cache/` is gitignored, so a fresh box re-renders clips |
| skia-python | Linux needs libEGL | failed in the sandbox with `libEGL.so.1`; passes on the PC | `apt install libegl1`, or `LOOM_SKIA_LIBPATH` |
| Python 3.10+, numpy, scipy, pillow, jsonschema, soundfile, fonttools | yes | `requirements.txt` | `pip install -r requirements.txt` |
| `models/fonts/*.ttf` | yes (files) | 13 TTFs; `models/` is gitignored | must be shipped or regenerated; the command that creates them is unverified |
| RedTee_V1_Video | optional sibling repo | `redtee_bridge.py` (`REDTEE_ROOT` or `loom.config.json`); used only for `kind: redtee` | checkout plus `REDTEE_ROOT`; `loom.config.json` is machine-specific |
| Setup | yes | `setup.sh` / `setup.ps1` | the whole bootstrap; no Dockerfile exists |

## 5. Gates and tests (headless, no key)
- **The suite in the sandbox:** 58 passed, 0 failed, in 27 s. With the sandbox browser pinned it was the same
  plus the browser probe; only skia skipped.
- **`context_check`:** exit 0. It is proven able to fail: planting "16 templates" gave exit 1.
- **The suite is not hermetic:** it writes into `projects/spacing-sticks/{build,qa}` and
  `runtime/catalog.json`. In CI it needs a scratch checkout.
- **CI blockers:**
  - **A fresh clone fails `context_check`.** `docs/context/MANIFEST.json` lists render archives
    (`.../renders/archive/*.mp4`) as append-only files, but `.gitignore` excludes them.
  - **A false negative:** the historical-number filter matched a phrase on the line before. Fixed later
    (L-122).

## 6. State and storage
All of it is plain files:
- **Per project:** `projects/<id>/project.json`, `state.json`, `plan/*.json`, `scenes/`, `audio/`, `build/`,
  `qa/` (including `llm_ledger.json`) and `renders/`.
- **Human approval:** stored in `plan/knowledge.json` `review`.
- **Library:** `library/decisions.json`, `assessments/`, `proofs/`.
- **Logs:** `docs/context/*`, `CHANGELOG.md`, `AGENT_LEARNINGS.md`.
- **No Cowork artifacts or memory are used.**

Cowork-tied items:
- no git and no CI file;
- persistence relied on a sandbox rsync (`work/sync.sh`, outside the repo);
- some committed files carry sandbox absolute paths, and `library/tasks/backfill_pins.json` reads them back.

## 7. Research tools
`video_study`, `transcribe_videos`, `palette_study`, `explain_study`, `check_video_notes` and
`style_fingerprint`:
- They use only the standard library plus numpy and Pillow, and shell out to ffmpeg.
- None calls Cowork or an LLM, and none hardcodes a path.
- Optional pieces:
  - `transcribe_videos` uses `faster-whisper` (downloads a model from Hugging Face) or `pocketsphinx`;
  - `check_video_notes` calls YouTube oEmbed over the network.

## 8. Options for running outside Cowork
- **(a) Claude Code headless / Agent SDK driving the same task files.**
  - **Fit:** the closest to how lessons were made.
  - **Needed:** a small driver that does the following.
    - Run `py -m loom go <id>`.
    - On exit 3, parse the task paths.
    - Run `claude -p "Follow <task file>; run the accept command until it passes" --model <tier id>` per task
      (in parallel for scenes).
    - Stop for the knowledge approval.
    - Repeat.
  - **Also needed:** a key or a Claude login, Bash, file and image-read permissions, and write-root limits
    (L-40).
  - **Unverified:** end to end.
- **(b) A plain orchestrator calling the API per stage.**
  - **Already exists:** `go --api`, proven against a mock only.
  - **Limits:**
    - one-shot generation, with no view of rendered frames for scenes;
    - scenes run sequentially;
    - review is not in `go`;
    - library tasks lack their referenced files;
    - Anthropic only.
- **(c) Hybrid.** The code stages, gates, tests and `context_check` run in CI; only the model stages call a
  model, through (a) or (b). Needed:
  - a CI image (Node 22, FFmpeg, Chromium, libEGL, Kokoro, fonts);
  - a secret for the key;
  - a human-approval step.

## 9. Gaps, prioritised (each with the smallest step)
1. **No version control or CI.** `git init` in Video-Engine; a CI job for the tests and `context_check`.
2. **A fresh clone fails `context_check`.** Git LFS for `renders/archive/`, or treat MANIFEST render entries
   as optional under `LOOM_CI=1`.
3. **The orchestration is prose only.** A small `tools/drive.py`, as in 8a.
4. **API mode has never run for real.** One paid smoke run (`go <id> --api --until storyboard`); read
   `qa/llm_ledger.json`.
5. **API mode is weaker than agent mode:** no scene snapshots, sequential scenes, no review, library tasks
   without their files. Inline the files, run review after check, thread the scene loop.
6. **The browser must be provisioned.** Document `HYPERFRAMES_BROWSER_PATH` and `hyperframes telemetry
   disable`; pin a Chrome in CI.
7. **Gitignored models and fonts.** Add `py -m loom setup voice` to CI; record the fonts command.
8. **Machine-specific absolute paths are committed.** Make `backfill_pins.json` engine-relative; treat
   `projects/*/tasks/` as generated.
9. **Doc drift:**
   - STATE's Manim line (since superseded);
   - the `context_check` filter (since fixed);
   - the broken npm scripts.
10. **Skills have two copies** (L-80). Outside Cowork, use the repo copy only.
11. **The knowledge gate and the "look at the frames" steps need a person or a vision agent.** Keep
    `approve --by` as a manual approval, and attach `qa/sheets` to the review call.

**Unverified in that session:**
- a real Anthropic, OpenAI or ElevenLabs call;
- `claude -p` or the Agent SDK end to end;
- a full render;
- a Manim re-render;
- skia with libEGL;
- Windows (since partly done on the PC);
- whether the Cowork-installed skills match the repo (repo is canonical; see L-80).
