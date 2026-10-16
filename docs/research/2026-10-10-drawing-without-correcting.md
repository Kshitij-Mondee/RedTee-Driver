# Drawing scenes without a correction loop: brainstorm, critique, decision (2026-10-10)

Kshitij: "I am sure that we are still missing something due to which drawing scenes and then correcting them takes so
long. Can't we just run the checker immediately after the scene is drawn and if it passes, the irrelevant context is
dropped from the agent about that scene and only if there is continuity to the next frame, then it keeps the relevant
context and moves on to drawing the next frame. Also, if it is determined that 2 or 3 number of frames have continuity,
they should be made by the same agent ... if all the frames need continuity, then break them so that each agent draws 2
frames only. Again parallel agents are very important for speed but yes, I am just looking from the viewpoint of less
errors as well."

## The measured facts

https-private (2026-10-10, sonnet-only, $25.16, 4 h 33 min), per stage from `logs/shuttle`:

| Stage | Wall | Cost | What took the time |
|---|---|---|---|
| P8 drawing | 43 min | $10.09 ($8.86 sub-agents) | 206 lab_snapshot looks, 93 min summed across parallel authors |
| P9 fixing | 139 min | $8.72 | 94.5 min of checks (HyperFrames' 13-minute checks), 46 min of looks |
| P10 review | 49 min | $1.35 | 38 min of checks |

The 10 full checks failed on 27, 15, 8, 7, 3, 3, 0, 0, 2, 0 errors; by kind almost all `hf layout content_overlap` (21,
14, 6, 5, 3, 3) and `text_too_small` (6, 1, 1, 1). 14 of the lesson's 17 joins are continue joins. Scene authors are
fresh sub-agents per beat already (the rails accept several beats per token; the role text says one).

**The replay that changed the plan.** The scenes as they stood at the first check (bundle 06:23) were rebuilt in
scratch (`replay_bundle.py`, the lesson untouched) and checked both ways:

- HyperFrames: 80 overlap errors, 21 kept by Loom's old painted filter ("both texts painted at 9 of 9 points").
- Loom's checker: 1 `text_covered` ("Shared wifi" under the ciphertext card) and 6 `text_too_small` (the login card's
  "user: alex / password: harbour" at 12 to 17 px in five beats; the ciphertext).
- The frames: HyperFrames' 21 are texts drawn twice exactly on themselves ("1 Prove who", "Issuer / Name / Date",
  "Login"); identical copies, clean on screen. Loom files them as `text_redrawn` warnings.

So most of P9's six rounds chased overlaps no viewer could see. The real defects at the first check were 7, and every
one is measured by the probe each `lab_snapshot` already runs.

## Brainstorm (15 ideas, 4 clusters)

- **A. Catch it where it is made:** (1) the checker in every look, submit refused on the beat's own errors; (7) the full
  check only verifies; (11) one page load per look (the probe photographs too); (12) audit only the beat's window in a
  look; (15) a static source lint (exists: the scenes gate).
- **B. Carry continuity as data:** (3) drop a passed beat's context, keep what the next needs (Kshitij); (4) an
  engine-written continuity card per continue join (held elements, boxes, end states, kit handles); (5) a free-space map
  of the boxes already taken at a beat's start; (6) kit handles so a later beat carries a held part instead of
  redrawing it.
- **C. Reshape who draws what:** (2) chains of 2 to 3 continue-joined beats per author (Kshitij); (9) one author for all
  beats; (10) two authors per beat, keep the passing one; (13) a look budget.
- **D. Replace model work with code:** (8) the engine moves overlapping texts itself; (14) partial compose.

Cut: (8) bespoke geometry is code, not data, so a move breaks arrows and intent; (9) one long context, fifteen times the
wall time; (10) doubles P8; (13) a cap risks quality where shift-left lowers looks by itself; (14) unmeasured, compose
may be seconds; (15) exists.

Survivors before the critique: shift-left with fast looks; continuity as data (the card's contract from the plan, checked
against the drawing: RedTee's declared geometry, at the plan level where it transfers); chains of 2 as a selectable mode
(a sub-agent cannot delete its own turns, so "drop the context" means a fresh author with a card).

## Critique

- **Fatal: the premise.** The plan assumed P9's rounds were authors' real overlaps; the replay shows they were mostly
  HyperFrames reading a redrawn text as a collision. The biggest cut already landed (Loom's checker as the default,
  D-154). Continuity machinery built on that premise would be built for defects that are not there.
- **Major: a submit gate on what the author cannot fix.** An overlap with a neighbour's held element, or a redraw forced
  by an unreachable kit instance, would re-create L-335's stuck run. Gate only the beat's own errors; show the rest
  with the owner named.
- **Major: the defects start upstream.** The six real type-size errors are one kit part used small in five beats; five
  authors would each meet it. A look must name the kit part, so it goes to the kit once.
- **Minor:** one-load looks need a pixel diff against HyperFrames' snapshot before they replace it; chains of 2 have
  little evidence now (park them); context cannot be dropped inside one agent.
- **Protect:** parallel per-beat authors, the pilot pair, look-before-submit, deterministic gates.

## Decision

1. **Now:** every `lab_snapshot` returns the beat's findings from Loom's checker and the film checks on the probe (overlap,
   covered, off card, line into an object, contrast, type size, words cut); `submit_scene` refuses while the beat's OWN
   errors stand; findings that involve another beat are shown with that beat named and never block.
2. **Now:** the three open items: text leaving its card; the story-cartoon eyebrows over the vignette (2.7:1); a line
   running into an object (https-private's leader through the padlock's shackle).
3. **Next, with Kshitij's approval for a paid run:** one measured lesson under this setup. Continuity cards and chains of
   2 are built only if that run still spends real money on continuity defects.

What I think of the proposal: checking at draw time is the right instinct and now costs almost nothing, because the
checker lives in the probe the look already runs (with HyperFrames' 13-minute check it was impossible). Keeping
continuing beats with one agent lowers continuity errors but halves parallelism and grows each call's context; the
measured run shows continuity was not where the money went, so it waits for evidence.
