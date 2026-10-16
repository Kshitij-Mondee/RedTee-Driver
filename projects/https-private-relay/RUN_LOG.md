# RUN_LOG: https-private-relay (append-only)

Purpose: the https-private idea through Relay on the API, compared with the two Shuttle runs (https-private,
https-private-v2). Prompt: `docs/prompts/2026-10-12-relay-https-private-api.md`. Operator: Claude Code (Opus 5.5), operator
only (no edits to the engine or the lesson, no added context mid-run).

Approval (Kshitij, 2026-10-12): paid Anthropic API calls for this one run, Opus on the storyboard, Sonnet elsewhere, capped
at $25 for the whole run (`--budget 25`); the Gemini skeptic and critic inside the same cap; nothing else paid, no other runs,
no downloads.

Kshitij's added instruction (2026-10-12): "Don't read the code or the script or anything else from any other video. First
make yours and then compare with the other." So, as a deviation from the prompt: projects/https-private-v2/RUN_LOG.md was
NOT read before the run (the prompt said to read it for the setup to copy), and the request block was NOT compared with
https-private-v2's project.json before launch; both happen after the film is made. The request is the prompt's command,
word for word. The lesson is `--isolated` (it reads no other lesson's seed and, D-163, neither reuses nor feeds
assets/kept).

## Setup (2026-10-12)
- Profile `claude-core-opus-sb` (D-162): Opus 5.5 writes the storyboard outline and the storyboard; Sonnet 5.5 the brief,
  knowledge, pedagogy, script, kit and scenes; Haiku 4.5 the persona pick; Gemini 3.8 Flash the skeptic and the critic.
  Relay's roles (a conductor runs the stages; one agent per role) against Shuttle's one lead on rails with sub-agents.
- `py -m loom agents doctor --profiles claude-core-opus-sb`: anthropic, openai, gemini keys set; claude CLI found;
  "profile claude-core-opus-sb: all models served".
- Full suite with the browser (HYPERFRAMES_BROWSER_PATH = the HyperFrames chrome-headless-shell): a first run was stopped
  and restarted because another session's D-163 work changed loom/agents/tools.py and the storyboard role card at 13:35,
  after it began (that session confirmed its edits finished and froze the shared files). Second run on the final files:
  426 passed, 1 failed, 9 skipped. The failure, check_render_segments_carry_the_build_hash_and_stale_ones_are_dropped
  ("a runtime change must invalidate the segments"), passes alone (rerun: 1 passed): order dependent in the full suite,
  logged, not blocking (suspect the build-hash memo keyed by path seeing a reused temp path; to look at after the run).
- `py -m loom new https-private-relay --topic "How HTTPS keeps your data private" --audience "corporate employees" --genre
  teaching --length 2 --style corporate-clean --persona analyst --voice af_heart --voice-provider kokoro --avatar none
  --mix cinema --isolated --notes "<the prompt's notes, word for word>"`: created; project.json request as the prompt.
- Engine fingerprint (loom/, runtime/, tools/node/, packs/styles/; `docs/research/https_private_relay/fingerprint.py`):
  227 files, sha256 fc7bdde9ee7c5f7a1386538a2916a50bd163951ef827cd64daba505224cf793f, the same at the suite and at launch
  (`logs/engine_fingerprint_suite.json`, `logs/engine_fingerprint_launch.json`). STATE.md carries the MEASURED RUN IN
  FLIGHT line.

## Run 1
```
py -m loom agents run https-private-relay --profile claude-core-opus-sb --until render --budget 25 --approve-knowledge-as "agent, unattended per Kshitij (https-private on Relay via API, 2026-10-12)"
```
Output: `logs_run1.txt` in this folder.

- Intervention by another session during the run (told first, agreed): D-164 changed two Shuttle-only files, loom/shuttle/config.json (lead.storyboard.api ["opus"]) and loom/shuttle/launch.py (a preset may give P5 a model from lead.storyboard). Relay reads neither; the end fingerprint will differ for these two files only. That session launches its own Shuttle API run only after this one ends (no CPU overlap).

## Result (2026-10-12)
- Exit 2 at 15:02 (launched 13:57:42; 65 min): brief to storyboard accepted first time (the brief once refused for naming a
  template); kit 16 turns ($1.59); the pilot pair b01, b02, then 16 beats in chains; check 33 errors (24 lesson_vocabulary
  from the kit's invented login words, 4 line_into_object, 2 held_missing, 1 overlap, 1 covered text, 1 other); critic; round
  1 (storyboard, kit, 13 scenes); check 26 errors; critic; round 2 (the kit removed the words after a scene worker's kit
  report; scenes); check 4 errors, all b12's board path into b11's lingering packet (83 to 87 s), b12 out of rounds:
  "stopped: the check still fails".
- Operator: `py -m loom note https-private-relay --kind override --stage render ...` and
  `py -m loom run https-private-relay render --force --reason "..."` so the film exists for the comparison (no model call,
  the checked build). No other intervention; no edit to the engine or the lesson.
- Cost: $10.62 billed (Sonnet $8.56, Opus $1.87, Gemini $0.18, Haiku $0.01), 228 calls, 54 tasks, 14 repairs; 12.3 M in (83 %
  cached), 293 k out. Cap $25, not reached.
- Engine fingerprint at the end: 2 files changed since the launch, `loom/shuttle/config.json` and `loom/shuttle/launch.py`
  (the other session's D-164, announced), nothing Relay reads.
- Request check after the run (deferred per Kshitij): the same as https-private-v2's request block except the voice speed
  (0.739 against 0.701, calibrated).
- Film: `renders/https-private-relay.mp4`, 142.8 s; looked at: 18 contact sheets, a 24-frame grid, 4 frames at full size.
  Comparison, defects and what to fix: `docs/research/2026-10-12-https-private-relay-comparison.md` (R-54, L-417 to L-419).

## Run 2: scenes written again under the held-parts fix (2026-10-12)
- Why: Kshitij, "the video is a mess ... Fix this." Diagnosis `docs/research/2026-10-12-https-private-relay-mess.md`
  (beats drew a second board over the held one); fix L-423 (CHANGELOG 2026-10-12, held kit parts).
- Kshitij: "use paid api". Profile `claude-core-opus-sb` (API), `--budget 14` (the rest of the $25 cap after run 1's $10.62).
- Operator: the 17 bespoke scene files moved to `logs/run1_scenes/` (a `--redo scenes` keeps a file whose spec did not
  change); kit, storyboard, narration and the template beat b13 kept. Logged with `py -m loom note --kind override`.
- Engine fingerprint at launch: `logs/engine_fingerprint_redo_launch.json`; since run 1's end only the fix's four files
  changed (loom/agents/conductor.py, loom/agents/roles/scene.md, runtime/core.js, runtime/world.js).
- Command: `py -m loom agents run https-private-relay --profile claude-core-opus-sb --until render --budget 14 --redo scenes`
- Run 2 result: exit 0 at 18:35 (35 min, $4.95): 17 scenes written fresh, first check 1 error (run 1: 33), one fix round
  each for b04 and b03, critic and final review passed, rendered. Kit got a 6-turn fix pass ($0.53) at the start.
- Looked at the render (24-frame grid, frames 40.5 to 43.5 s): no second board anywhere (probe: one `board` 0 to 88 s held
  by b02 to b12), but the board was an empty frame from about 10 s: its pieces (browser, path, watcher, server) are
  elements inside it and switched off when b01 ended. Engine bug, masked in run 1 by the redraws. Fixed in
  runtime/world.js planLife (a nested element lives as long as its host); re-check and re-render as run 2b.
- Run 2b launch fingerprint: besides runtime/world.js, the other session changed loom/cli.py and loom/shuttle/{config.json,launch.py,loop.py,server.py} since run 2 ended (Shuttle work; cli.py is shared).
- Run 2b result: exit 0 (24 min, $2.17): critic pass 2 sent 6 findings to b01, b02, b03, b06, b11 (fixed); final review
  left 4 majors, all "the path board does not appear" (b01, b03, b04, b06), and the film rendered because the final review
  blocks only on a blocker. Looked: the 24-frame grid, the engine's frames at 1, 5, 30, 48 s. The board is still not drawn.
- Cause found for b01 (operator test on a private build copy, nothing changed in the lesson): b01's fixer replaced the
  board's reveal with a raw `Loom.tween(B.outer, {opacity: 0} ...)` on the element's outer group, the node the engine's
  life clock owns. With that line replaced by `ctx.m.reveal(B, tImg)` the board draws at 1 and 5 s; it is still missing at
  30 s (b04 uses the same raw tween on held elements' outer groups; not yet traced). A live-page probe with
  `__timelines.main.seek` reports the board visible at opacity 1 while the captured frame shows nothing: the probe and the
  capture disagree, so a check built on the probe cannot see this. OPEN.
- Spent on this lesson so far: $10.62 + $4.95 + $2.17 = $17.74 of the $25 cap.
- Three more runtime causes of the missing board found on private build copies with HyperFrames' own snapshot (one change
  at a time, plus an overlay printed into the frame): the join from b01 retired the board's pieces (b01's elements, only
  `board` was held); the backplate blur filter sat on b01's group from load and the capture painted nothing of it once the
  camera zoomed 1.85x; b01's raw tween on the board's outer group. Fixed in the runtime (L-427 to L-430, tests red first).
  On a copy with all fixes the board shows at 9.5, 30, 48 and 70 s, and the scenes, written against an empty board, now
  collide with it (the certificate over the browser card, a tag over Submit, value slots on the board).
- Run 2c: `py -m loom agents run https-private-relay --profile claude-core-opus-sb --until render --budget 7`, launched
  23:20 after the other session's previews ended; fingerprint `logs/engine_fingerprint_run2c_launch.json`.
- Run 2c result: exit 2 ($1.69): storyboard and three scene fixes, then 7 check errors all on b01's board pieces at 48 s and
  77 to 79 s (covered text, contrast), routed to b01, which cannot change what b07 and b11 do to the board; b01 out of
  rounds. Router fix L-431 (a defect on a held element in a later beat goes to the beat on screen), test red first; full
  suite 401 passed, 1 failed (the STATE test count, fixed), 47 environment skips.
- Run 2d: `py -m loom agents run https-private-relay --profile claude-core-opus-sb --until render --budget 5` (the rest of
  the cap: $19.43 spent of $25); fingerprint `logs/engine_fingerprint_run2d_launch.json`.
- Run 2d result: exit 0 (21 min, $0.95): storyboard fix, b11 fix, critic, final review with 1 major left (b11), rendered.
  Looked at the 24-frame grid of the render: one board from 0 to 88 s, carried and changed in place, never doubled or
  empty. Left on screen: close shots crop the cards at the frame edge (about 30 s, 54 to 66 s), tags over the scrambled
  blocks at about 72 s, the dip to black at 45 s, b11's major. Total on this lesson: $20.38 of the $25 cap
  ($10.62 + $4.95 + $2.17 + $1.69 + $0.95).
