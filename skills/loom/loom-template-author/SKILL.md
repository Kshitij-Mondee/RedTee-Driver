---
name: loom-template-author
description: Add or improve a reusable Loom template (structure beats) or blueprint (motion-hero beats) in the runtime library, with its props schema, anchored reveals, build grammar, catalog entry and tests. Use when a lesson needed a bespoke scene that other lessons will need too (promote it), when the storyboard keeps reaching for a form the catalog lacks, or when asked to extend the library of templates/animations.
---

# Loom template author

Templates live in `runtime/templates/*.js` (`Loom.template(id, {...})`), blueprints in
`runtime/blueprints/*.js` (`Loom.blueprint(id, {...})`). Each declares `doc`, `job`, `register`,
`motion_is`, `props` (schema: type, required, max_words, min/max items, choices, default) and
`build(ctx, props)`. Read `docs/SCENE_API.md` and `skills/lnd/lnd-visual-design` + `lnd-motion-fit` first.

## Rules
- Every revealed element has an anchor prop (`say`, `say_*`, `*_say`, `*_cue`) and reveals ON it via
  `Loom.th.when(ctx, anchor, fallbackFrac, label)`. Declare `H.ordered(...)` for sequences.
- Honour the build grammar (scaffold first, connectors draw into what follows, instruments from the
  minimum, totals last) and the cognitive budget (lists <= 6, one focal point).
- Text via `kit.text` (real metrics, floors); layout via the safe box `ctx.box`; vertically balance the
  block (a block floating at the top is a layout bug).
- **Measure, then draw:** size containers from `kit.fit(...)` (card height = measured text + 2 x inset, inset
  >= max(6px, 0.2 x size)), and make each `ctx.el` box cover everything it draws. `check` fails
  `text_overflow`, `text_spill`, `text_outside_element` and `tight_inset` by measuring the rendered glyphs
  (`docs/LAYOUT.md`).
- Prefix-free names (`item_1`, `panel`) so storyboards can `keep` them across beats.
- Deterministic; tokens only; durations from the style.

## Small elements are components, not templates
Reusable ELEMENTS (a card, a mark, a connector) go to `runtime/components/` through the element library
(`docs/COMPONENTS.md`): counted from `@form` tags, assessed at 3 uses, promoted only when confidently
reusable. This skill is for whole-beat templates and motion-hero blueprints.

## Promote a bespoke scene (the library path: this is how templates are earned)
Scenes tag their whole-beat design with `// @design id: idea`. When a design has 2 distinct uses, a
plan-tier assessment decides, and on `promote` the task `library/tasks/promote-design-<id>.md` asks you
for `runtime/templates/<id>.js` (with `promoted_from_design`) plus `runtime/templates/fixtures/<id>.json`.
`py -m loom library accept design:<id>` promotes it only when all three hold:
1. **All on-screen text comes in through props.**
   - A str prop may default only if it is structural chrome, marked `chrome: true`; template-owned
     words go in `chrome: [...]`.
   - The sample-text audit renders every fixture, plus an automatic case with every text prop at its
     `max_words`, in every style pack. It fails on any word no prop supplied, and on any overflow.
2. **`check` really flags leftover sample text:** `tests/run_tests.py`
   (`check_flags_leftover_sample_text_that_no_prop_supplied`) and the same audit inside every lesson's
   `check`.
3. **The engine really picks it.**
   - A blind storyboard-tier model sees 5 test beats and the catalogue, with the candidate listed like
     any other.
   - It must choose the new template for at least 2 of 3 targets and for neither decoy.
   - Its props must validate, have spoken anchors, and render clean.

   Until then the template is a hidden candidate: not in `catalog.md`, and refused by the storyboard gate.

Worked example: `library/proofs/2026-09-30-template-promotion/`.

### By hand (outside the library path)
Generalise the hard-coded words into props, keep the choreography, add a `doc` that says when to use it,
then `py -m loom catalog` (regenerates `runtime/catalog.json|md` - never edit those by hand) and
`py tests/run_tests.py` (the catalog delivery test fails if a declared template is missing).
