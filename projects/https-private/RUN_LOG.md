# RUN_LOG: https-private (Shuttle, the sonnet-only preset, a pure motion-graphics lesson), 2026-10-10

Written by the Shuttle build session, which runs this lesson as operator. Kshitij's instruction: "lets make a sonnet only
mode where everything is done by sonnet except for the storyboarding which is Opus. Opus is not used anywhere else",
and "I want the video to be simple but pure motion graphics ... no cinematic backgrounds or hand drawn styles ...
proper plain white or some other corporate background with mostly a lot of stuff related to the topic moving on the
screen. Make it a 2 min video ... a more technical topic that demands proper motion graphics but in a beautiful and
clean way. You can use any library or anything. I just want a clean result."
Operator rule as before: no edits or context mid-run; a fault that would cost the run a lot of time is fixed and logged
(`py -m loom note`) as an intervention.

## Setup

- Topic "How HTTPS keeps your data private", corporate employees, teaching, 2 minutes, persona analyst,
  style corporate-clean (light field #F4F7FB, white surfaces), no presenter (`--avatar none`), mix "cinema" (motion 80 %,
  templates 10 %), `--isolated`; the request's notes carry Kshitij's visual direction word for word in substance.
- Models: `--preset sonnet-only` (config.json model_presets): Sonnet leads every session except P5 (the storyboard,
  its own session on Opus); sub-agents Sonnet; the skeptic and the critic Gemini (the other family, design section 5).
- Engine as of D-150 (the held-element check, edits, the mixed split, the start message with status and notes, the
  parallel verification); P10 has no judge and fix split in this preset (one model).
- Launch: `py -m loom shuttle run https-private --preset sonnet-only --budget 80 --approve-as "agent, unattended per
  Kshitij (sonnet-only motion-graphics run, 2026-10-10)"`.
- Measured: wall time, cost at the engine's table, calls, per stage (the breakdown script used for v3); the film looked
  at within its own style (D-122).

## Result

- **Exit 0 at 09:46, every phase accepted, no operator intervention.** Film `renders/https-private.mp4`, 139.7 s; render
  verification 52 frames in 26.9 s.
- **Cost:** $25.16 at the engine's table, 695 calls (Sonnet leads except P5 on Opus, $1.95; sub-agents Sonnet; Gemini
  reviewers $0.17).
- **Time:** 05:13 to 09:46, 4 h 33 min. 11 full checks at about 13 min each plus an 11-min pilot check: about 2 h 25 min
  of checking. The cause, measured: the corporate-clean background dot grid is 96,163 SVG circles (98,958 DOM nodes in
  all), and HyperFrames' layout audit walks every node at every sample (8 to 13 s a sample against 0.2 s on v3's 4,324-node
  page). Write-up: `docs/research/2026-10-10-why-checks-are-slow.md`.
- Not done yet: the per-stage comparison table against v3 in this log, and a look at the film's frames.

## Follow-up: the check itself (2026-10-10, D-154)

- The background is now one pattern (runtime/world.js): this lesson's page drops from 98,958 to 3,107 DOM nodes; frames
  differ by anti-aliasing only.
- Loom's own overlap and contrast checker replaces HyperFrames' as the default after a planted-defect test and a
  12-lesson corpus judged on frames (`docs/research/2026-10-10-loom-checker-reliability.md`); on this lesson's page the
  whole probe with it takes 14 s. It finds one real defect HyperFrames passed: at 128 to 130 s the "Shared wifi" label is
  cut by the ciphertext card. Kshitij: this film is not the reference for overlap or gap measurement; it was not used as one.
