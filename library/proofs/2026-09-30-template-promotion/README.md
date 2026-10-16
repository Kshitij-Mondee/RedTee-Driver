# Proof: the template-promotion path, end to end (2026-09-30)

**Status: archived proof, NOT live.** `cause.converge` is not in `runtime/templates/` and no storyboard can
pick it. It lives here as a worked example and a head start. If `design:cause_convergence` earns promotion
for real (2 distinct uses, then a real assessment), this is the template to start from.

## Why a proof was needed
No real beat design had reached the threshold. The one that did, `attention_converges`, was rightly
**deferred**: its two uses are one lesson's bookends. So the build, gate and selection steps had only been
unit-tested with fake data. Rule 0 (verify, never assume) needs the real path to have run once.

## How it was isolated
- A full copy of the engine (`work/loom_proof`) had `library.template_promote_after` lowered to **1**, so
  `design:cause_convergence` (1 real use, blameless-postmortem b20) became a candidate.
- **The assessment was written by the orchestrator** (see `proof_note` inside it), not by an assessor
  agent. It went through the real `library check` / `library accept` gate.
- Every later step was done by the models the pipeline names, with only the task file as input:
  - **Build:** a Sonnet agent following `loom-template-author`, from `promote-design-cause_convergence.md`.
  - **Blind pick:** an Opus agent acting as storyboard author, from `select-cause_convergence.md`. It saw
    the catalogue and 5 shuffled beats, and was never told which template was new.

## What happened (the gates did the deciding)
1. **Build gate, first attempt: pass.**
   - No text defaults and no banned JS; the example and 5 fixtures match the props schema.
   - Every case rendered in all 5 style packs with 0 errors and 0 sample-text leaks.
   - The builder then proved the gate can fail: a hard-coded "Sample zebra" was rejected in every style,
     then restored.
2. **Blind pick:** it chose `cause.converge` for **all 3 targets** (safety fall, lost client, late launch,
   including the `refute` beat). It chose `definition` and `process.flow` for the 2 decoys. So the pick
   rule passed (at least 2 of 3 targets, 0 decoys).
3. **Pick render: FAIL.**
   - The picked props rendered with `text_overflow` in whiteboard: "Requested feature never shipped" at
     the 38px lead floor.
   - The schema allowed 6-word labels that the card could not hold at whiteboard's floor. A real defect
     that the fixture sheet had missed, because no fixture used a long label.
4. The builder fixed the template:
   - wider condition cards, a taller outcome card, and a 2-line summary;
   - a 6-word stress fixture;
   - a first widening failed in 3 styles; the second passed.

   `accept` saw the template had changed since it was built, re-proved the fixtures in every style, and
   re-rendered the picked props. Result: **promoted** (in the proof copy only).

## Engine changes this proof caused (in the real engine)
- `accept_design` refreshes `FORMS.md` after an assessment. Found by the `attention_converges` assessor.
- `accept_design` re-runs the full build gate when a template changes after it was built (`built_hash`).
  Without this, a fix could pass on the pick alone.
- **Lesson:** a fixture set must include the longest content the schema allows. Logged as L-43.
  - **Now enforced:** `check_template` adds an automatic case that fills every str prop to its
    `max_words` with long-but-ordinary words (9-11 letters).
  - It was proven both ways on this template:
    - With the label column narrowed back to its pre-fix width and the builder's own stress fixture
      removed, it failed in all 5 styles.
    - Restored, it passed with 0 errors.
  - An all-14-letter version failed even the fixed card, so it was rejected as too strict.

## Files
- **`runtime/`:** the template and its fixtures, exactly as promoted.
- **`library/`:**
  - the assessment;
  - both task files;
  - the blind catalogue the picker saw;
  - the picker's storyboard (`cause_convergence.json`);
  - the shuffle key;
  - the decision record (including the 3 recorded selection failures on the way);
  - both contact sheets.
