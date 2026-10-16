# The layout guard trial: RUN_LOG (D-169)

Kshitij, 2026-10-16: "render a proper whiteboard style any corporate lesson on any tech topic. I want this to be the test
for the Layout Guard Trial. Keep the opus storyboarding, sonnet everything else and gpt sol for coding, around 3-4 min
video". Then: "The other session is actually running tests and fixing some whiteboard animation stuff. You can wait for it
to finish and then render the video if needed."

## Design (2026-10-16)
- One lesson, planned once: `lg-trial-share-links`, "Sharing files safely: who can open your link", whiteboard (the
  whiteboard engine on, the default since D-181), 3.5 min, corporate employees, isolated.
- Models: preset `opus-storyboard-sol-code`: Opus leads P5 (the storyboard); Sonnet leads every other phase and is the
  default for the non-code sub-agents; gpt-6.1-sol writes all code (scene authors, clip authors, fixers, the kit
  builder: "gpt sol for coding" read as every code-writing role). Reviewers as configured (Gemini 3.8 Flash critic).
- Two arms, exact clones of the plan at P8 (`py -m loom slice`, every beat), the same preset, side by side to the render:
  `lg-trial-share-links-off` (guard off) and `lg-trial-share-links-on` (`py -m loom layout ... on`). Both run under the
  critic blocker gate (D-177).
- Compared within the style only: cost, time, fixer runs, refused submissions, check failures, layout findings
  (content_overlap, text_covered, line_through_text), critic findings, the guard's moves and residuals, the frames, and
  Kshitij's blind rating (A and B, shuffled).
- Caps: plan $25, each arm $18. Launcher: `tools/layout_trial.sh` (detached).
- Before the trial, the guard learned drawn lines (CHANGELOG 2026-10-16): without it the guard could move a label onto a
  board line, which the probe then fails.

## Status
- 2026-10-16: set up, not started. Waiting for the whiteboard session (asked by message to say when the engine is stable).
- 2026-10-16 03:10: launched (tools/layout_trial.sh, detached, pid 33540). The whiteboard session was idle with its last fix
  logged (L-465), the whiteboard, layout and gate tests passed (12 of 12), no session busy. Engine fingerprint:
  engine_fingerprint_at_launch.json. STATE has the in-flight line.
- 2026-10-16 03:07: correction to the line above: that launch (pid 33540) exited at once without output (PowerShell split
  the bash command at its spaces); relaunched with the command quoted as one argument, pid 23152, plan started 03:07:01
  (P1 to P4 on the loom runner, lead claude-sonnet-5-5).
- 2026-10-16: the whiteboard session confirmed by message: the whiteboard engine, the probe and the pack are stable; it
  stays off those files while the trial runs. Its full suite: 472 passed, 3 failed that each pass alone. This trial is
  the first lesson under D-182, so wb_face, line_through_text, board_carry and wb_pen_late (now an error past 1.5 s) may
  fire in both arms.

## 2026-10-16 04:36: results (both arms rendered; blind pair made, key closed)
| | plan (shared) | arm off | arm on |
|---|---|---|---|
| cost | $5.11 | $4.26 | $5.15 |
| wall time | 30 min (03:07 to 03:37) | 56 min | 59 min |
| calls | 119 | 252 | 277 |
| scene authors / fixers (gpt-6.1-sol) | kit builder | 9 / 1 (P8) | 11 / 3 (P10) |
| submissions (refused) | | 26 (2) | 29 (0) |
| snapshots | | 43 | 55 |
| full checks (failed) | | 4 (3) | 5 (3) |
| storyboard reopens | | 2 | 2 |
| critic passes: findings | | 1: 3 minor | 2: 1 blocker, 2 major; then 2 major |
| shipped with | | 3 minor, all open | blocker fixed (the gate held it, D-177); 2 majors accepted by the lead |
| final check | | 0 errors, 1 text_covered warning | 0 errors, 1 text_covered warning |
| layout guard | off | | 57 elements checked, 0 flexible: 0 moves, 0 residual (478 samples, 1.4 s a pass) |

**The finding that decides how to read this trial:** the guard did nothing in the on arm. Every word on an engine
whiteboard is written by the engine into a `text` element (labels included; the scenes made no `treat.label` call), and
the guard moves a `text` element only when it crosses the frame edge; none did. So the two films differ by their scene
writers' own runs (the same model, a different draw), not by the guard. The cost and rework differences above are
that variance, not a guard effect. What the trial did show: on a 4-minute engine whiteboard the guard costs about 1.4 s a
pass, and the blocker gate worked in a real run (the on arm's b18 blocker was fixed before ship, not accepted).
Frames: sheet_off.jpg, sheet_on.jpg (one frame every 10 s). Both clean; the hand covers words while writing, by design.
