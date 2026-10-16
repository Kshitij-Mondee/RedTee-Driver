# Can Loom run as a real pipeline outside Claude Cowork? (checklist, 2026-10-01)

STATUS: SHIPPED 2026-10-01 (an audit, not a plan). Every row was checked by running something or reading a
line of code in this session. Anything not checked is marked **unverified**. The full audit with line
references (`docs/research/2026-10-01-portability-audit.md`) was written by a read-only audit agent and
spot-checked by the orchestrator (D-75).
**Update, later that day, on Kshitij's PC:**
- setup ran;
- the suite reached 62 passed and 1 failed, with no skips;
- the browser and skia now work there.

So items 9 and the Windows row are largely done; see RUNS R-21.

## Verdict
**Mostly yes.** Loom is a plain Python + Node command line that keeps every bit of state in files. Nothing
in the engine code calls a Cowork tool.
- **What runs headless today:**
  - the code stages: ingest, allocate, narrate (local Kokoro), compose, check and render;
  - every gate, the tests, and `context_check`.
- **What still depends on an agent session:** the 7 model stages (brief, knowledge, pedagogy, persona,
  script, storyboard, scenes, and optionally review and tweak) and the orchestration around them. They run
  in two ways today:
  - **Agent mode:** `go` writes a task file and exits with code 3; an agent does the work; `accept` gates it.
    Every shipped lesson was made this way, by Claude in Cowork.
  - **API mode:** `go --api` calls the Anthropic Messages API with `ANTHROPIC_API_KEY` (`loom/agent/api.py`),
    gates the reply and allows 2 repair rounds. It is **tested only against a mock server**; no real lesson
    has run this way.
- **Exists only as prose:** the "Opus plans, Sonnet builds, Haiku tweaks" routing, parallel scene authors,
  and the "look at the frames" review loop. They live in skills and learnings that a Claude session
  follows. No code does them.

## The checklist
| # | item | today | outside Cowork | status |
|---|---|---|---|---|
| 1 | Code stages (ingest, allocate, narrate, compose, check, render, verify) | Python + Node CLI | same commands on any machine with the deps | ready |
| 2 | Gates and tests | `tests/run_tests.py` (62), `tools/context_check.py` | run in CI as they are | ready (but see 12, 13) |
| 3 | Model stages via API | `go <id> --api`, Anthropic only | needs a key and one real smoke run | **unproven** |
| 4 | Model stages via an agent | task files + `accept` (made for "a coding agent") | Claude Code headless (`claude -p`) or the Agent SDK can follow the same task files; `claude` 2.1.284 is on the sandbox | **unverified end to end** |
| 5 | Orchestration (stage loop, model per tier, parallel scenes, review) | prose in `loom-director` and AGENT_LEARNINGS | needs a small driver (`tools/drive.py`): loop `go`, read the task paths it prints on exit 3, run one agent per task on the recommended model, scenes in parallel, stop at the knowledge approval | **to build** |
| 6 | Skills | plain markdown under `skills/`, read by path; also saved on the Cowork account | repo copy only (no Cowork tool calls inside, grep-checked); for Claude Code, place them where it loads skills | ready (account copies drift, L-80) |
| 7 | Human gates | `py -m loom approve <id> knowledge --by <name>` | the same command from any shell, or a manual CI approval | ready |
| 8 | Looking at frames (scene authoring, review) | the agent views contact sheets | a vision-capable agent, or API review with sheets inlined (`run <id> review --api`, up to 40 images) | partly (API scenes get no snapshot feedback) |
| 9 | Rendering stack | HyperFrames 0.8.91, GSAP, puppeteer-core, three, lottie, fonts, FFmpeg, Kokoro, Manim 0.19.1 | `setup.sh` / `setup.ps1` installs it; pin Chromium with `HYPERFRAMES_BROWSER_PATH` (its own download returned 403 in the sandbox); run `hyperframes telemetry disable` | ready, needs provisioning |
| 10 | Models and fonts | `models/` is gitignored (116 MB: Kokoro, fonts) | `py -m loom setup voice`; the fonts command is **unverified** | needs provisioning |
| 11 | State | plain files: project.json, state.json, plan/, qa/, library/, docs/context | the same | ready |
| 12 | Version control and CI | **none**: no `.git`, no CI file, persistence by a sandbox rsync | `git init`, commit with the existing `.gitignore`, add a CI job for tests + `context_check` | **to do (highest priority)** |
| 13 | A fresh clone passes `context_check` | **no**: MANIFEST lists gitignored render MP4s as must-exist logged files, so a clone without renders reports 10 deletions | keep renders in Git LFS, or treat MANIFEST entries under `renders/` as optional in CI | **to fix** |
| 14 | Machine paths in committed files | some generated files carry `/sessions/...` paths; `library/tasks/backfill_pins.json` reads them back | store engine-relative paths; treat `projects/*/tasks/` as generated | **to fix** |
| 15 | Research tools (video study, transcribe, palette, explain study, style fingerprint, note checker) | stdlib + numpy + Pillow, shell out to ffmpeg | portable; whisper transcription needs Hugging Face access on the machine that runs it | ready |
| 16 | Other providers (OpenAI, local models) | Anthropic only in API mode; TTS can use OpenAI or ElevenLabs (never proven) | a second `_call` in `api.py`; the prompts and gates are provider-neutral | to build if wanted |

## The smallest path out of Cowork, in order
1. **Version control and CI:** put Video-Engine under git and add a CI job (tests + `context_check`). Fix
   item 13 so a clean checkout is green.
2. **Prove API mode:** one paid smoke run (`py -m loom go <id> --api --until storyboard` on a 1-minute topic)
   and read `qa/llm_ledger.json`. The model ids in `loom/project.py` match the published model names; whether
   the calls succeed is still unproven.
3. **Write `tools/drive.py`**, the driver from item 5, so agent mode runs without a person typing. Use
   `claude -p` per task (agent mode, keeps the snapshot loop), or `--api` per stage (simpler, weaker feedback).
4. **Close the API-mode gaps:** snapshot feedback for scenes, parallel scenes, review after check, and library
   tasks that receive the files they reference.
5. **Provisioning:** a CI image or script with Node 22, FFmpeg, Chromium, libEGL (for skia), the Kokoro
   model and the fonts.

**Not verified in this session:**
- a real Anthropic, OpenAI or ElevenLabs call;
- `claude -p` or the Agent SDK running a stage end to end;
- a full render outside the sandbox;
- Windows CI;
- whether the skills saved on the Cowork account match the repo.
