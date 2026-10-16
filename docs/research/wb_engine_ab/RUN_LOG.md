# RUN_LOG: the whiteboard engine with/without comparison (D-179), 2026-10-15

Kshitij: "Build a pilot engine for whiteboard and run the with/without comparison on one new lesson."

## Setup
- Lesson `wb-prioritise` (new): "How to prioritise when everything feels urgent", corporate employees, teaching, 1.75 min,
  whiteboard, isolated. Request `engine: "off"` for the shared plan, so the plan and the kit are the same for both arms
  and no planner saw the engine.
- Phase A (running): planned once on the loom runner and the API with `--preset opus-plan --until P7 --budget 8`
  (Opus 5.5 P1 to P5, Sonnet P6 and P7), unattended approvals in Kshitij's name for this comparison. Output:
  `plan.out`; engine fingerprint at launch: `engine_fingerprint_at_launch.json`.
- Phase B (waiting for the designed writing hand, Kshitij's choice): `py -m loom slice` clones the plan twice:
  `wb-prioritise-engine` (request engine on: the scene authors get the engine's guide and `ctx.engine`) and
  `wb-prioritise-classic` (engine off). Both run to the final render side by side with the same scene-writer preset and
  cap. Then: blind rating by Kshitij, and cost, wall time, looks, check rounds, critic findings, render time and film
  measures (`tools/video_study.py`) per arm.
- Operator only during the runs: no engine or prompt edits until both finish (memory: pipeline test runs operator only).

## 2026-10-15: handed to Kshitij
- Kshitij is near his session limit and runs the rest himself: `bash tools/wb_engine_ab.sh <hand zip>` does the intake,
  installs the hand, renders the lab strip, waits for (or resumes) the plan, clones both arms, runs them side by side
  (Terra scene writer, Sonnet lead, $10 cap each) and writes `compare.md`, the film study and a blind pair with a sealed
  key. The hand's angle is untuned on real art (tuned only on a labelled stand-in).

## 2026-10-15: the hand is Kshitij's PNG
- Kshitij: "This png file that I have attached, I want to use this as the hand with marker." Prepared by
  `tools/hand_from_png.py` (source kept at `assets/incoming/wb-hand-png/hand_marker.png`): the nib cut out and redrawn as
  a vector the engine colours with the ink in use, the "CARMINE RED" label lettering painted over (no text in assets),
  the sleeve continued past the frame along the arm (it floated in the first strip), halved and embedded in
  `assets/hands/marker/write.svg` (59 KB) with its anchor, scale and angle. Deviation: an embedded picture is outside the
  vector intake contract, so `tools/asset_intake.py` was not the gate; the tool's own checks and the strip were. The
  LICENSE.txt asks Kshitij to state the picture's origin before client use. One pose only: the engine uses it lifted
  and at rest too.
- The command is now `bash tools/wb_engine_ab.sh` with no argument.

## 2026-10-15: phase A done
- `wb-prioritise` planned to P7, every phase accepted, exit 0 (`plan.out`). The speech check ran in narration inside
  Shuttle for the first time: 34 phrases, 0 failed, 0 minor. Phase B waits for `bash tools/wb_engine_ab.sh`.

## 2026-10-15 20:05 to 20:20: phase B, first attempt (Kshitij ran tools/wb_engine_ab.sh)
- Both arms wrote every beat (P8) and stopped at P9 with exit 2 on the same 13 caption-hold errors (D-170's rule could not
  be met by any caption timing; not an arm difference). Before the stop: engine P8 $2.53, 8 min, 31 looks; classic P8
  $3.72, 14 min, 50 looks (`compare.md`).
- Fixed between runs (both arms equally, no arm running): D-180 caption timing and tail rule, chosen by Kshitij. Deviation
  from operator-only: an engine change between attempts, logged here; it touches compose's captions, not the scenes.
- Next: `bash tools/wb_engine_ab.sh` again resumes both arms from P9.

## 2026-10-15: the hand fixed between attempts (L-461)
- Kshitij, on the engine arm's frames: the hand showed text through it, its arm sometimes came from the side, and two
  hands showed at once ("at a time only 1 hand will be there on the screen"). Measured on the arm's own build (probe every
  0.1 s, `scratchpad hand_probe.mjs`): 151 two-hand frames, the hand under later content in every frame, 70 side exits,
  one hand frozen for 20 s. Fixed in the engine (`runtime/engines/whiteboard.js`, `tools/hand_from_png.py`,
  `loom/engines.py`, `loom/lab.py`): one hand for the film, always on top of its station, its arm always from the bottom
  edge. The same build with the new engine and hand: 0, 0, 0. Not measured: the arm's new build (it renders on resume).
- Deviation from operator-only, as with D-180: an engine change between attempts, no arm running. It changes only the
  engine arm's picture (the classic arm has no hand). The engine arm's scenes are unchanged; they rebuild on resume.
- Next: `bash tools/wb_engine_ab.sh` resumes both arms from P9.

## 2026-10-15 21:42 to 22:14: phase B, second attempt: both arms finished
- Both arms resumed from P9 at 21:42 (Kshitij ran `bash tools/wb_engine_ab.sh`) and finished with exit 0: engine at
  22:12, classic at 22:14. Every check after the D-180 fix passed with 0 errors in both arms.
- Cost, from `compare.md`. The engine arm cost $4.64 against $6.81 (32 % less), with 204 calls against 306, 55 looks
  against 80, and 6 checks against 9. P8, writing the scenes, cost $3.37 against $4.86. The final render took 5.5 min in
  both arms.
- Wall time: the phase minutes in `compare.md` include the 1.5 h pause between attempts, so they do not measure the arms.
  - Attempt 1 (P8): engine 8 min, classic 14 min.
  - Attempt 2 (P9 to P11): engine 30 min, classic 32 min.
- Critic (`qa/review.json`):
  - Engine: 3 major and 3 minor. The 3 majors are in b10 to b12: the week strip's day labels and the quadrant action labels
    ("Do first", "Batch", "Decline or park") are not held from b09. The lead ACCEPTED them unfixed, and the frames show
    them missing.
  - Classic: 4 blockers, 2 major and 1 minor, all fixed. Cards and labels vanished or left the frame in b06, b08, b09 and
    b12.
- Runtime warnings, engine arm: 17 `wb_pen_late`. The one hand started a part up to 0.65 s after it was asked, because
  it was still drawing, so some words are written behind the voice.
- Film measures (`study/`, `tools/video_study.py`):

  | Measure | Engine | Classic |
  | --- | --- | --- |
  | Seconds with motion | 76 % | 30 % |
  | Holds | 5 (16 s in all) | 19 (68 s in all) |
  | Median gap between visual events | 3 s | 14 s |
  | Audio | the same | the same |

  The hand's own movement counts as motion, so these numbers say the engine arm is never still. They do not say it
  teaches better.
- The hand in the engine arm's final build was probed every 0.1 s:
  - 0 frames with two hands;
  - 0 frames with content drawn over the hand;
  - 0 frames with the arm leaving by a side.
- Not blind in practice: the hand shows which film is the engine arm. The rating is Kshitij's judgement of the two films
  as they are, with the key still sealed.
- Next: Kshitij rates `blind/A.mp4` and `blind/B.mp4`, then opens `blind_KEY_open_after_rating.json`.

## 2026-10-15: the rating
- Kshitij watched both: "A is better." The key, opened after the rating: A = engine, B = classic. He preferred the engine
  film. Not truly blind (the hand shows the engine arm). Decision D-181: the engine stays on for new whiteboard lessons,
  and the classic way is kept with `"engine": "off"`.

## 2026-10-15: Kshitij on film A, and what the check missed (L-462)
- "even though A is better, its not perfect at all. There are still overlaps and more than that, the entire canvas looks
  a lot messy and doesn't look clean". Also: the hand "looks very stretched out" near the top, "can be scaled and made a
  bit bigger".
- Measured on film A's build with the patched probe: 7 errors that the check had passed, all visible in the frames (6
  lines through words: the week strip's cell lines through "Budget report" and "New analysis", the reply box's edge
  through "To: deck request", the bracket through "Fill-ins", the axis through "difference it makes"; and "work it
  takes" on "Effort?"). Film B, the same probe: 11 lines through words.
- Board messiness, measured per beat end: film A shows three typefaces at once (the engine's lettering, Patrick Hand and
  Caveat bold: the kit was built with the engine off and draws its parts in the pack's fonts), up to 27 words on one board
  (b09), and the matrix board grows from b05 to b12 without clearing.
- Fixed now: the probe reads engine words and finds lines through words; the hand is 0.85 (was 0.62). Waiting on Kshitij:
  lettering and board density.

## 2026-10-15: Kshitij's choices, and what was built (D-182, L-463)
- Asked about lettering and board space, Kshitij chose "Two faces" and "You can carry text and designs over from
  previous frames/sections but not too many so there is enough place for new text and explanation. The rest gets wiped
  off at the end of the section."
- Built: `board.heading`, the lettering audit, `line_through_text`, `board_carry`, the guides, and the lab's clean
  board (`wb_engine_board`).
- Film A under the new checks: 23 `wb_face`, 7 `line_through_text` and 3 `board_carry` errors.
- The two arms are finished and are not re-run (memory: engine work leaves finished lessons). The next whiteboard engine
  lesson is the first made under these rules.
