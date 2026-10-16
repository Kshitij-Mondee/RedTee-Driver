# The layout guard: labels and text kept clear by the engine (2026-10-15, D-169)

Kshitij: "overlapping and text fitting was very nicely tackled by my deterministic and fully offline engine the last time
in redtee_v1_video. Can you draw influence from there and make something like this here as well so AI agents are not
really required to fix small things like text fitting and overlapping." Then: "there will always be objects that will
need to overlap or collide like a mug on a table. Make those things possible."

## What RedTee did (read only; nothing there was run or changed)
- **No mover.** RedTee had no solver that moves elements once they collide. It avoided collisions by construction: a
  resolver split the canvas into divisions inside a 5 % margin, with gutters, so two divisions could not overlap; each
  drawer fitted its text before drawing (largest size that fits, the floor always wins, then an ellipsis); edge labels
  anchored inward; long spine labels were demoted into their card.
- **Checks after.** Text-over-text box checks, the safe area, the floor and truncation, all arithmetic on a settled SVG
  with per-character width ratios (0.52 to 0.70 of the size, calibrated by hand). Shape-over-shape was only a warning.
- **Why it does not carry over whole:** Loom's scenes are bespoke code with motion, held elements and a camera; their
  geometry is only known by running them, and the settled frame is not the only one that matters. RedTee's ratio widths
  also erred narrow; Loom already measures with the real font.

## What Loom had
- `kit.fit` / `kit.text`: real font metrics, the largest size in the style's range, never below the floor; a text that
  does not fit is a `text_overflow` error. Measure-then-draw for cards.
- No placement: every label's x and y is the author's number. Overlaps were found after the build by the probe's
  layout audit and fixed by an agent (scene author, fixer).
- The five-style test (15 films): 20 check errors of the text and overlap kinds (text_covered 6, text_overflow 6,
  text_too_small 4, text_off_card 3, content_overlap 1), 16 critic findings about overlap or the frame edge, and the
  tag pile-ups seen in the frames, several of them shipped (L-439, L-440).

## What was built (runtime/layout.js, loom/layout_guard.py, tools/node/layout_solve.mjs)
1. **Solve** a built page: seek every 0.5 s, record the screen boxes of each element's words and opaque shapes.
2. **Move only flexible things.** Labels, tags, stamps, badges, callouts, notes, pills and chips (or `{layout: "flex"}`)
   move out of a conflict held for at least two samples: over words (12 px of air), on another label, across an object's
   edge, past the frame, into the caption band. Texts, cards, lists, documents and panels move only back inside the
   frame. Objects (icons, instruments, characters, props, documents, cards) never move.
3. **Meant overlaps stay.** Objects touching or overlapping is never a conflict (the mug on its table). A label the
   author put mostly on an object may stay on it (a stamp on a device), only not half on it. `{overlaps: [names]}`
   and `{layout: "fixed"}` say what is meant; the checker's own allow and ignore marks are honoured.
4. **Only clean moves.** Candidates in a fixed order of distance (8 directions, 16 to 230 px), at most 160 px for a
   label, the way back inside the frame unlimited; a move is taken only if it clears everything at every sample;
   otherwise the element stays where its author put it and the conflict is listed for the author.
5. **A plan, not edits.** Moves go to `projects/<id>/layout/plan.json`, each tied to the hash of its scene and kit;
   compose puts the valid entries in the manifest, and `kit.element` and `treat.label` apply them when the element is
   made (a label's lead is drawn to its new place). Solved again until nothing moves (a fixed point).
6. **Text fit.** With the guard on, `kit.text` grows a box too short for its words at the floor (the "?", "Weigh." and
   "Notice." overflows of the test) instead of failing; never smaller type; the grown box is still checked for spill,
   inset and its card.
7. **Where it runs:** before the probe in `check`, in `pilot_check`, and in every scene author's `lab_snapshot`, which
   tells the author what moved. Opt-in: `py -m loom layout <id> on` (or LOOM_LAYOUT_GUARD=1); off, nothing changes.

## Evidence (copies of two finished corporate-clean films; the test lessons were not touched)
| copy | moved | left for the author | checker layout errors before / after | solve |
|---|---|---|---|---|
| Sol | 3: "Drive failed" off the laptop base, LAPTOP clear of "Same place", EXTERNAL DRIVE off the laptop edge | 4 | 0 / 0 | about 0.7 s; 15 s with compose |
| Terra | 2: "DRIVE FAILED" further onto the laptop (still across its screen edge, less), "MISSING: 1 OFFSITE" clear of the tiles | 2 | 0 / 0 | about 0.7 s; 18 s with compose |

Frames: `docs/research/layout_guard/cc_<model>_before.jpg` and `_after.jpg`. Four moves are clearly better in the frames; Terra's stamp is only a little better. The
checker passed these films before and after: the guard fixes what it lets through, the crowding a viewer sees.

**What went wrong on the way (the rules above are the fixes):** the first version (`v1_*` frames) took any move that
reduced a conflict and treated sitting on an object as fine: it moved EXTERNAL DRIVE onto the drive and OFFLINE OR
DISCONNECTED up 190 px onto a document, and a half fix created a checker error that was not there before. Hence: only
moves that clear everything, the author's intent for objects, an object's outline including what it holds, at most
160 px, and a caption band of 110 px (150 had pushed a label off the captions onto the document).

## Not done, honest limits
- The guard measured on two copies, not a run: whether scene authors and fixers then spend fewer turns, and whether
  Kshitij sees cleaner films, is for a comparison run (rule 13 before it becomes a default).
- It moves an element as a whole (a label and its lead, a title); it does not re-wrap a sentence, resize a card, or
  re-time a reveal. Text wider than its box at the floor is still the author's.
- Rotated labels are judged by their screen box, which is generous.
- A label whose conflict can only be cleared by moving something else stays a residual (one at a time, first seen first).
