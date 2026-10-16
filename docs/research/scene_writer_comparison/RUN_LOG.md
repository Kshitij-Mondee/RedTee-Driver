# RUN_LOG: the scene-writer comparison (D-166), 2026-10-12

Kshitij: "take it's storyboarding and run the scene writers and basically the beat writers that write all the visuals on
different models ... Let's see for each step and each sub process what models can be cheaper yet match the level of claude
for us." Then: "Build the slim briefs and the error-routing fixes first ... then continue. I agree with all of it."

## Setup
- The slice: gps-position b08 to b18 (11 beats, 73.5 s, the diagram station where elements carry from beat to beat), cut by
  `py -m loom slice` five times (gps-slice-luna, -flash, -sonnet, -sol, -terra): the plan, the narration and the kit are
  gps-position's; no scene file; isolated. Two gate errors kept as logged overrides (no recall moment in a slice; b12's keep of
  two names b11's old file drew, which the new b11 author is told to build).
- Every arm: the loom runner (D-165) on the API, Sonnet 5.5 leads P8 and P9, the slim briefs and the routing of D-166; only the
  scene authors, clip authors and fixers change (presets scenes-<model>); each stops when P9 is accepted (--until P9) or at its
  cap. No critic (P10): no single other-family critic is neutral for every arm; the frames are judged after, blind for Kshitij.
- Caps (sum $25, Kshitij's approval): gpt-6-luna $2.5, gemini-3.8-flash $3.5, Sonnet $7, gpt-6.1-sol $6, gpt-5.6-terra $6.
  One arm at a time, cheapest first: tools/scene_writer_comparison.sh.
- Engine fingerprinted at launch (engine_fingerprint_at_launch.json here). The full suite before launch: 435 passed, 2 failed
  (a test count, and a test that expected the kit's source in a scene brief, which D-166 removed); both pass after their fix.

## Result
- Luna exit 0 (20:41 to 21:15), Flash exit 4 at its cap (21:15 to 21:36), Sonnet exit 4 at its cap (21:36 to 21:53), Sol exit
  0 (21:53 to 22:13), Terra exit 0 (22:13 to 22:25). Spent $17.63 of the $25 approved. Engine unchanged during the runs.
- Previews built after (py -m loom strips --preview, from each build, 12 fps); the other session's runtime change came after the
  builds, which carry their own runtime copy. Findings: docs/research/2026-10-12-scene-writer-comparison.md.

## Kshitij's blind rating of round 1 (2026-10-13)
- A (Sol): "looks decent with like 2-3 errors overall, mostly in transition/continuing to the next beat."
- B (Luna): "clearly the worst ... the most visual errors present ... mostly breaking and visual errors."
- C (Sonnet): "feels great and clean ... issues are there but very few. Gives me the claude sonnet vibes."
- D (Terra): "also good. Just a few differences here and there, a few things could've been visualized better ... I feel like
  it's terra or sol."
- Then: "Try again." Round 2: Sonnet, Sol and Terra on a second lesson (https-private-shuttle-api b01 to b12, corporate-clean,
  12 beats, 76 s; no gate override needed), caps Terra $5, Sol $5, Sonnet $8 ($18); Luna and Flash dropped (round 1 settled them).
  tools/scene_writer_comparison_r2.sh, launched after the other session's measured run.

## Round 2 result (2026-10-13)
- Terra exit 4 at its $5 cap in P8 (13:47 to 14:59; $4.61, writers $4.22): three looks hung in `hyperframes snapshot` for the
  full 3600 s timeout (13:59 to 14:58), so b03, b06, b09 stayed drafts (L-434); its model calls took 25 min in all.
- Sol exit 0, P9 passed (14:59 to 15:22; $3.63, writers $2.87, $0.24 a beat; 2 checks, 8 fixers).
- Sonnet exit 4 at its $8 cap in P8 (15:22 to 15:35; $7.68, writers $7.48, $0.62 a beat), b07 and b11 drafts.
- Spent $15.92 of the $18. Engine unchanged during the runs; Terra and Sonnet composed after (free), same runtime as Sol's build.
- Blind set: round2/blind/A to C.mp4, key in round2/blind_KEY_open_after_rating.json.

## Kshitij's blind rating of round 2 (2026-10-13)
- "A worse, C better, B the cleanest": A = gpt-5.6-terra (3 of 12 beats unfinished drafts after the snapshot hang, L-434: not a
  fair reading), B = claude-sonnet-5-5, C = gpt-6.1-sol.
- Both rounds: Sonnet rated the cleanest blind; Sol second (round 2) and "decent, 2-3 errors at the joins" (round 1) at about 40 %
  of Sonnet's scene-writer cost ($0.22 to $0.24 against $0.55 to $0.62 a beat); Sonnet hit its cap in both rounds.
- Proposed next (asked): Sol writes and Sonnet fixes; Sonnet's scene authors at a lower effort; Sol kept as a choice
  (preset scenes-gpt-6.1-sol), Sonnet the default.

## Terra redo of round 2 (2026-10-13, Kshitij: "can you redo the terra part only again for this video?")
- A fresh slice https-slice-terra2, the same b01 to b12, on the engine of Sol's and Sonnet's runs plus the snapshot-timeout fix
  (loom/qa.py only). 16:46 to 16:58 (12 min, no hang: looks a median 13 s, the longest 31 s); $4.62 (lead $0.45, writers $4.17,
  $0.35 a beat); stopped at its $5 cap in P8 with b03 and b07 drafts; no check run. Preview round2/terra_redo.mp4.
- Looked at (8 frames, corporate-clean): the story reads, but labels collide more than Sol's or Sonnet's ("Readable text" and
  "Copy" over the card, "Temporary value" over the watcher, the scrambled tiles over the password field, one frame framed off
  the board). Round 2 for Terra: dearer per beat than Sol ($0.35 against $0.24) and less clean.
