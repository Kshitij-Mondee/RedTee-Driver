# RUN_LOG: phishing-report (R-24, 2026-10-02)

Step 7, lesson 2 of 2: spot and report phishing, for all employees. Look: `cinematic-noir` with the opt-in cinema
mix (`--mix cinema`, D-91), with code presenter bookends.

## Stages
- **brief, pedagogy, persona (analyst), script:** written by plan and build sub-agents from their task files, then
  accepted.
- **knowledge:** 20 facts from UK NCSC, US CISA and the Verizon 2026 DBIR executive summary (sources in
  `plan/knowledge.json`). Approved "agent, unattended per Kshitij (2026-10-02)".
- **allocation:** cinema (avatar 0.1, template 0.1, motion 0.8). Actual: avatar 5 %, template 24 %, motion 72 %.
- **narrate:** Kokoro `am_michael` at speed 0.84, calibrated once. 42 beats, 420.5 s after the b01 pause.
- **storyboard and scenes:** 42 beats. The scenes were written by Sonnet sub-agents.
- **check (sandbox Chromium, probe + lints + snapshots, no HyperFrames layout pass):** 0 errors, 38 warnings. 42
  sheets were looked at.

## Deviations (orchestrator edits outside a task file, disclosed)
- **Scene fixes after the first Chrome check:**
  - b25 holds line_1, line_2 and attachment_chip;
  - b05 inserts into `msg.outer.parentNode`;
  - b03 and b15 chips widened x1.06;
  - b08 report button height 52.
- **Storyboard b39:**
  - first `shot.move = "push"`, which did not clear the static hold;
  - then the new `quiz.answer` slots `also` / `also_why` (D's why-not) and `takeaway` (L-163).
- **Script b01:** `pause_after_s` 1.4, so the hook headline can be read before the camera leaves (L-164).
- **Storyboard b19:** `shot` set to medium with no move. The scene pushes the board itself. Kept after the travel
  fix.
- **Storyboard b22:** drops `keep`. **b21:** gives the board and message parts a real exit, so b22's title no
  longer prints over the board (L-165).
- **Engine fixes found on this lesson's sheets:**
  - station residue (b42 over b01, L-164);
  - the reading-floor blind spot (L-164);
  - `m.travel` origin and seek order (b19, b21 and the motif chip, L-166).
- **Tried and reverted:** a runtime rule fading every unclaimed `exit: "none"` element. It emptied b19, b33 and
  b36 (L-165).

## Not verified
- Not rendered and not watched.
- The HyperFrames layout and contrast check was not run here.
- 9 `literal_colour` warnings are probably token shades the warning cannot tell from typed hex (unverified which
  call).
- Review findings left open: `qa/review.json` (verdict fix).

## 2026-10-03: golden segment b17 to b21 (D-100)
- **Rebuilt by the orchestrator (Opus) by hand, as an engine proof, not through a scene task.** The old scenes are
  kept in `scenes/_v1_2026-10-02/` (D-70).
- **What changed:**
  - one real message (`Loom.ui.mail`) at reading size, held from b17 to b21;
  - each sign is marked on its own words and carried by a transient lead to a family card (pressure, mismatch,
    request);
  - b19 pushes in on the address with the correct spelling set under it; b20 pulls back.
- **Storyboard:** b21 `shot` changed from `{wide, pull}` to `{medium}`, because the pull showed the station edge.
  This is a plan change outside the storyboard stage; logged with `py -m loom note`.
- **Checks:**
  - quick check: no error in b17 to b21;
  - preview `qa/preview/b17-b21.mp4` (6 fps from the build): no flash, no still run of 3 s or more, 22 % moving.
- **Not verified:** not rendered and not watched at 30 fps with sound. b13 to b16 still show the old message, so the
  join into b17 swaps designs.
