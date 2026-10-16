# RUN_LOG: https-private-v2 (Shuttle, sonnet-only, the https-private request rerun), 2026-10-10

Written by the session that runs it as operator. Kshitij: "do a run for the same video and same topic and everything and
lets see if anything changes. Also, Make sure to run this new video in such a way that the previous videos can be compared
to it with the step by step cost, time, token and errors and stuff. I want to make sure nothing is inefficient or
unoptimized in the pipeline." And: "Use claude -p only as we don't have api credits yet."
Operator rule as before: no edits or context mid-run; a fault that would cost the run a lot of time is fixed and logged
(`py -m loom note`) as an intervention.

## Setup

- The request of `https-private` word for word (topic "How HTTPS keeps your data private", corporate employees, teaching,
  2 minutes, persona analyst, corporate-clean, no presenter, mix cinema, the same notes, `--isolated`); only the voice
  speed differs at the start (1.0; P6 calibrates it, as it did for https-private).
- Models: `--preset sonnet-only` (Sonnet leads everywhere, Opus for P5 only; sub-agents Sonnet; skeptic and critic Gemini),
  subscription mode (`claude -p`), budget $80 notional, unattended approvals in Kshitij's name as before.
- What changed in the engine since https-private (the variables of this comparison): Loom's own checker is the default
  (D-154, HyperFrames' check off), the check runs in every scene author's look and holds a beat's own errors (D-157),
  the background is one pattern (98,958 DOM nodes became about 3,100), the pilot check uses Loom's checker, redraws are
  warnings in the check and errors at the pilot join, the WebGL preflight, and whatever other sessions changed since
  05:13 (the Relay upgrade D-155 does not touch Shuttle's path; the world scenes D-156).
- Engine state at launch: the full suite 412 passed, 1 failed (`primitive_style_untouched_packs_draw_byte_identical_to_before`:
  corporate-clean lab pages a few hundred bytes smaller after another session's unlogged edit of runtime/world.js,
  loom/compose.py and loom/agents/conductor.py at 19:55 to 19:57; that session was asked what it changed). WebGL
  available again after a restart (it was lost mid-afternoon, L-400). Shared files fingerprinted at launch
  (`logs/engine_fingerprint_at_launch.json`).
- Launch: `py -m loom shuttle run https-private-v2 --mode subscription --preset sonnet-only --budget 80 --approve-as
  "agent, unattended per Kshitij (https-private rerun for comparison, 2026-10-10)"`.
- The failing golden test, explained by the session that made the change (R-48 follow-up, 20:20): the last scene now
  leaves as one frame with the camera's outro fade instead of each element receding from duration - 0.9 (runtime/world.js),
  a camera pan between two different worlds is a fade through the field instead of a dip through black (loom/compose.py),
  and Relay's scene workers write continue chains in order (loom/agents/conductor.py, Relay only). Both runtime changes
  landed before this launch, so they are part of this run's engine: the film's last 0.9 s and any cross-world pan differ
  from https-private by design. That session re-records the golden (test data only) and keeps the engine still.
- Shared CPU: that session's re-render of feedback-relay-v3 ran during this run's first hour; early wall times are a
  little inflated by it.

## Result

- **Exit 0 at 21:32, every phase accepted, one reopen (P7, the kit), no operator intervention.** Film
  `renders/https-private-v2.mp4`, 143.6 s. No shared engine file changed during the run (fingerprints compared at the end).
- **Side by side** (`py tools/run_compare.py https-private https-private-v2 feedback-shuttle-v3`, written to
  `docs/research/2026-10-10-https-private-v2-comparison.md`; engine's price table, notional on the subscription):

  | | https-private | https-private-v2 |
  |---|---|---|
  | wall | 273 min | 71 min |
  | cost | $25.16 | $16.50 |
  | calls | 695 | 415 |
  | scene-author looks | 215 | 79 |
  | full checks and their errors | 10: 27, 15, 8, 7, 3, 3, 0, 0, 2, 0 | 5: 1, 1, 0, 0, 0 |
  | check time | 133 min | 4 min |
  | render | 13.5 min | 3.0 min |
  | P8 drawing | $16.51, 231 min | $8.59, 36 min |
  | P9 check and fix | $2.86, 188 min | $1.27, 22 min |

- **What still cost money:** drawing (P8, $8.59: 15 authors, 2 to 7 looks each, about 17 k output tokens a beat, most of
  it the model's reasoning); the kit twice (P7, $2.92); the review (P10, $1.34: three fixer jobs for graphics overlaps the
  critic named). The CLI prices the same tokens at $27.58 by its own table; every run here is compared on the engine's.
- **The reopen:** the lead found two kit faults on the contact sheets. (1) A clock leak: the kit started each instance's
  tween at its scene's start, so a later beat's state showed early (b03's step bar showed b11's state at 17.2 s). No
  checker looks for this; it is a causality fault (a frame changed by a later beat). (2) A contrast flicker: the step
  bar cross-faded fill and label together, white on half-blended blue, 2.14:1 at 8 samples: Loom's checker caught it.
- **The film, looked at (16 frames across it, within corporate-clean):** one clean world throughout (the browser, the
  path, the server, the three-step bar lighting in order); the quiz's question wipes out while the answer's title fades
  in (122 s, half a second, a transition); nothing cut, covered or unreadable seen. Not listened to.
- **Caveat on the comparison tool:** sub-agent reconcile rows (the CLI's session totals minus the per-call rows: most of
  an author's output) are logged after the phase moves on; the first comparison put them in the next phase.
  `tools/run_compare.py` now attributes them to their session's phase (L-403).

## Kshitij's review (2026-10-10, after the run)

"I feel like the frames and everything was good enough. Only the narration and the overall teaching style felt lacking.
Also, the visuals are perfect, the vizualization though could have been a bit better. It's an 8 right now, can be an easy
9 or 9.5 with just more interesting stuff happening on screen. The explaining part was a bit lacking, both through the
visuals and the narration."

What the files show (the operator's reading, not yet acted on):
- The narration names the steps more than it explains them: 17 beats in 143 s, lines such as "Move one, identity." and
  "They run a key exchange. The key itself never travels in a form a watcher can use." say what happens, rarely why it
  works (why a certificate proves who, how two ends agree a key in full view, what scrambling does to the data).
- The visual intents keep one literal diagram for the whole film (browser, path, server, cards and slots moving on it);
  the only image that explains a mechanism is b09's two signals combining. No zoom into a mechanism, no transformation
  shown step by step.
- Who wrote them: the teaching plan (P3, 3 calls, $0.05) and the script with every visual intent (P4, 3 calls, $0.10) were
  Sonnet under the sonnet-only preset; Opus storyboarded (P5, $0.88) inside the script's intents. Planning cost about $1.30
  of $16.50.
