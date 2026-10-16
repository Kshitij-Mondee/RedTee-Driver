# Kshitij's batch-fix idea, brainstormed and critiqued (2026-10-09)

Kshitij: "can't we just identify all the beats with issues first and then get them all fixed by the agent loading the
storyboarding skill from the playbook... does that sound logical?? ... for now the best videos are the clear need of
the hour. Then we can optimize the pipeline but still just asking if my idea works out better?"
Method: the brainstorm loop (diverge, cluster, stress-test, converge) and the critique loop, on the Shuttle Opus run's
data (`projects/feedback-shuttle-opus/logs/shuttle/trace.jsonl`, the check records in `logs/decisions.jsonl`).

## The problem, framed
After planning (P1 to P6: 15 minutes, $5.75 list price), the build and fix loop cost $64.79 and about 5 hours. What the
data shows about that loop:
- The lead already batched within a round (19:42: four fixers at once; 19:50: three). The check rounds converged after
  the kit rework: 7 errors, 4, 3, 1, 0 between 19:41 and 20:13.
- Issues arrived in waves: check errors first; the critic only after the check passed (5 passes, 20:16 to 21:07); the
  lead's own look in between.
- The dominant waste after the kit rework was the same beat fixed again and again: b05 had 8 agents (3 scene-authors,
  5 fixers), b04 6, b14 5, b02 and b11 4 each.
- Of the lead's final 14 review findings, 3 were the storyboard's (b12's hold, b13's quiz index, b11's shot) and 11 were
  a beat's own code or layout; the check errors after the rework were all beat code, plus b12.

## Ideas (diverge)
1. The idea as asked: collect every issue first, then one agent with the storyboarding skill fixes all the beats.
2. Collect every issue first, then one parallel round routed by owner (storyboard issues in one patch, the kit first,
   each beat's code by its own fixer), then one recheck.
3. Let the critic judge the first composed build together with the check (Relay does), so one list holds both.
4. An error at a join goes to one fixer that owns both beats.
5. A per-beat layout gate at submit: authors never saw overlap errors (lab_snapshot returns runtime errors only).
6. A beat that fails twice is rewritten by a scene-author from the full brief instead of patched again.
7. The fixer's brief carries the picture of the failing frame, and it must snapshot that time before it submits.
8. A Sonnet lead for the build (asked for and done, D-145).
9. Take the lead out of the fix loop: code routes defects to owners (Relay's router).
10. Two authors per beat, the critic picks the better.
11. Fewer bespoke beats, more templates.
12. Deterministic auto-fixes for mechanical classes (label boxes, overlap nudges).
13. Editor's notes: render a draft once, watch it whole, write every note at once.
14. Prove the kit first (the pilot pair; done, D-144).

Clusters by mechanism: batch the loop (1, 2, 3, 13); make fixes stick (4, 5, 6, 7); who decides and routes (8, 9); do
less or cheaper work (10, 11, 12, 14).

## Stress test
- **1, the idea as asked.** Evidence for its core: issues did arrive in waves, and a single list would merge rounds.
  Against its mechanism: the storyboarding skill is the right tool for about 1 issue in 5 here; beat fixes need the
  scene API, the kit API and the beat's file. One agent holding 6 to 10 beats' code and context re-reads 200 to 300
  thousand tokens a turn, which is exactly what made the Opus lead expensive (P7 to P9: 192 turns, $59.35), and it
  fixes serially, slower than parallel fixers. Graveyard: the lead's own P7 to P9 session already was "one agent that
  sees everything". Repair: keep "collect everything first, one round" and route by owner; the storyboarding-skill
  agent takes the storyboard's issues together, which is where it is right. That repair is idea 2.
- **2 with 3, one combined round.** Attack: a critic on a build with 52 check errors judges broken beats. Repair: batch
  the polish stage only, once the check is nearly clean; before that, check-driven rounds (they converged). Expected:
  critic passes 5 to about 2, the checks after the critic 4 to about 2 (an estimate, not measured). Survives.
- **4 with 7, fixes that stick.** Attack: are the repeats joins? Partly: b02's overlap took three rounds inside one beat.
  Repair: the pair fixer for joins, and the failing frame's picture plus a required snapshot at that time for every
  fixer. Survives; the join part is in the playbook now.
- **5, a per-beat layout gate.** Attack: HyperFrames' check samples the whole timeline (24 samples over 132 s, about 2
  inside a 9 s beat); whether it can sample one window is not known. Survives on condition: verify that first.

## Survivors, ranked
1. **Make fixes stick** (4, 7; 6 as the backstop). Mechanism: the fixer sees and owns the whole problem. Strongest
   argument: repeated fixes on the same beats were the largest waste after the rework. Cheapest validation: the next
   run's agents per beat (target: no beat above 2).
2. **One combined polish round** (2, 3; the idea in its repaired form). Mechanism: one list from the check, the critic
   and the lead's look, routed by owner, the storyboard's issues to one storyboard pass. Cheapest validation: count
   critic passes and check rounds in the next run with the playbook changed.
3. **A per-beat layout gate** (5). Mechanism: authors see overlaps before submitting. Cheapest validation: whether
   `hyperframes check` takes a time window.

Cut: 1 as asked (wrong tool for most issues; one big context is the cost problem; serial); 9 (Relay's code routing sent
kit defects to scene workers and R-35 ended with no film; the Shuttle lead's judgment caught the b13 contradiction);
10 (doubles the build cost, gain unproven); 11 (lowers quality, against "best videos first"); 12 (later, for mechanical
classes only); 13 (a draft render takes 10 to 20 minutes; contact sheets give the same notes sooner).

## Critique of the plan (with the two changes made on 2026-10-09)
Goal: the best film first, cost second; within the rails (gates, one writer per file, determinism).
- **Major: a Sonnet build lead is unproven for quality.** The only Sonnet-led Shuttle run (S1) was stopped before a film.
  The build lead triages the check and the defects. Fix in place: Opus keeps P10 and P11 (critique, the render decision:
  $7.27 in the Opus run), Sonnet takes P7 to P9 ($59.35); `--build-lead same` returns to Opus. Validate on the next run.
- **Major: nothing in the pipeline measures the film.** The plan optimises rounds and cost; only the critic and the lead
  judge the picture. Fix: Kshitij rates the Opus film and the next run's film blind, and RUNS records the rating.
- **Major: "rewrite only that beat" relies on the check seeing every error.** A beat left "to verify" after a kit change
  stands if the check passes, even if it looks wrong in a way the check cannot see. Held by design: the critic re-judges
  every beat whose contact sheet changed (D-144), and the lead looks at the sheets.
- Minor: the pair fixer for joins is in the playbook, not enforced by the rails.
- Minor: a change in the kit's shared code marks every beat calling the kit "to verify" (checked, not rewritten).
Strengths to protect: the gates and rails; staleness by real dependencies; the lead's refusal to ship a contradiction;
the pilot pair; per-beat owner tokens.
Verdict: fix the majors first: measure on one run (Sonnet build, re-fix rate, rounds, Kshitij's rating) before changing
the fix loop's shape.
