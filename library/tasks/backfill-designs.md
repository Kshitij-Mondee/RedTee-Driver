# Loom library - tag the beat DESIGN of existing scenes (COMMENTS ONLY)

**Recommended model:** Sonnet (building) - `claude-sonnet-5-5`

Add ONE `// @design snake_id: one-line idea` line (`# @design ...` in .py) at the top of each scene below,
naming the design of the WHOLE beat, so repeats can become templates. You may ONLY add or edit comment
lines. Any change to the code itself fails the gate.

Read `/sessions/practical-funny-cannon/work/loom/docs/COMPONENTS.md` and `/sessions/practical-funny-cannon/work/loom/runtime/catalog.md` (existing templates) first.

## Rules

- The idea describes the beat's visual argument without this lesson's nouns ('several conditions converge
  on one failure', not 'the checkout outage'). Name the id after it (`cause_convergence`).
- A scene that only EXTENDS the previous scene's held picture (same diagram, next step) is not a new use:
  tag it `// @design <id>_continued: ...` (the library ignores `_continued` designs when counting).
  A NEW instance of the same design, drawn afresh with different content, gets the plain id.
- Read ALL scenes before naming anything; one idea, one id, across lessons. No near-synonyms.
- If the design is already an existing template in the catalogue, still tag it, and say so in your report.

## Also fix these element tags (split merged ideas; comments only)

- blameless-postmortem b01.js and b28.js: the tilted, outlined pinned note is tagged `verdict_stamp`. Re-tag it `tilted_note: a tilted outlined note pinned to a surface, naming one fact`. Keep `verdict_stamp` only for the solid valence-coloured pill (b13, spacing-sticks b10).
- blameless-postmortem b20.js: the "several conditions" pill is an aggregate label, not a verdict. Re-tag it `summary_tag: a pill naming what a group of items adds up to`.
- blameless-postmortem b19.js: the dashed rings with a question mark are tagged `placeholder_slot`. Re-tag them `unknown_ring: a dashed ring with a question mark marking something not yet known`.
- blameless-postmortem b11.js: the empty dashed frames are tagged `placeholder_slot`. Re-tag them `empty_frame: an empty dashed frame waiting for content`.
- spacing-sticks b10.js: the blank recall rows are tagged `placeholder_slot`. Re-tag them `empty_slot_row: a blank filled row where a recalled answer will appear`.

## Scenes

- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b01.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b02.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b11.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b12.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b13.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b16.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b19.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b20.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b23.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b25.js`
- `/sessions/practical-funny-cannon/work/loom/projects/blameless-postmortem/scenes/b28.js`
- `/sessions/practical-funny-cannon/work/loom/projects/spacing-sticks/scenes/b05.js`
- `/sessions/practical-funny-cannon/work/loom/projects/spacing-sticks/scenes/b06.py`
- `/sessions/practical-funny-cannon/work/loom/projects/spacing-sticks/scenes/b10.js`
- `/sessions/practical-funny-cannon/work/loom/projects/spacing-sticks/scenes/b14.py`

## Prove it

From `/sessions/practical-funny-cannon/work/loom`:

```
py -m loom library verify-backfill
py -m loom library status
```
Report the design vocabulary (id: idea), the id per scene, and every element tag you changed.
