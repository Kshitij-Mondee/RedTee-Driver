# Loom context layer - start here

This folder is how Loom stays understandable as it grows. It records **what exists**, **why it is that
way**, and **what happened**, and one command checks that it still agrees with the code.

## Read in this order
1. `STATE.md`: what Loom is today. Subsystems, where each lives, what is proven, and what is weak.
2. `DECISIONS.md`: the decision ledger. Every decision that shaped the engine, who made it (the
   requester or an agent), why, and what would change it.
3. `../strategy/`: proposals and the reasoning behind them. `P-n` rows in DECISIONS stay pending until
   the requester decides.
4. `RUNS.md`: every run so far (lessons made, library passes, proofs), with links to their logs.
5. `../AGENT_LEARNINGS.md`: what went wrong in each run, why, and the gate or instruction that now
   prevents it (`L-n` ids, `DONE` / `OPEN`).
6. `../COMPONENTS.md`: the element library (components) and design promotion (templates).
7. Then the engine docs: `../ARCHITECTURE.md`, `../SCENE_API.md`, `../STORYBOARD_GUIDE.md`, and
   `../LAYOUT.md`, which covers how space, text fit and insets are measured, and what is not measured yet.
8. Research and long-term plans:
   - `../research/`: the reference-channel studies, measured from the videos (Crayon Capital, Cleo Abram,
     Lucas's Lab; TED-Ed next), `2026-10-01-channels-compared.md`, `2026-10-01-visual-study.md`, the attention
     and recall evidence, and the portability audit.
   - `../ASSET_WISHLIST.md`: the library of characters, sets and props to commission, with Claude Design
     prompts and the restyle contract.
   - `../PORTABILITY_CHECKLIST.md`: running Loom outside Cowork.
   - `../styles/WALLS_AND_NEEDS.md`: what each style still lacks.

## Verify before you believe
```
py tools/context_check.py          # python3 on Linux/macOS
```
- It prints the live facts from the code: counts of templates, blueprints, components, style packs,
  tests, stages, forms, designs, learnings and open items.
- It fails when a living doc states a number the code disagrees with.
- It also checks that no logged file has been deleted, ids are unique, and nothing writes into RedTee.
- The test suite runs it, so drift turns the tests red.

## House rules for the context
- **Append-only logs:** `CHANGELOG.md`, `docs/AGENT_LEARNINGS.md`, `docs/context/DECISIONS.md`,
  `docs/context/RUNS.md`, `projects/*/RUN_LOG.md`, `library/decisions.json`, `library/assessments/` and
  `library/proofs/` are the history the product grows from.
  - Never delete or rewrite an entry.
  - If one is wrong, add a new entry that supersedes it and says so.
  - `MANIFEST.json` lists every logged file; `context_check` fails if one disappears.
- **Living docs:** `README.md`, `STATE.md`, the engine docs and the skills describe *now*.
  - Update them in the same change as the code.
  - Numbers in them are checked.
  - A historical number belongs in a log, not here.
- **Trust code over docs.** If a doc and the code disagree, the code wins. Then fix the doc, and log why
  it drifted.
- **RedTee_V1_Video is read-only.** Loom imports its blueprints through `loom/redtee_bridge.py`, which
  only reads. Nothing is ever synced, copied or written into that folder.
- **Every run leaves a trail.** A `RUN_LOG.md` in the project (deviations, gate results, what was
  unverified), an entry in `RUNS.md`, new learnings in `AGENT_LEARNINGS.md`, and new decisions in
  `DECISIONS.md`.
- **Generated files are never hand-edited:**
  - `runtime/catalog.*` and `runtime/redtee_catalog.md`;
  - `projects/*/build|audio|qa`;
  - the library's `forms.json`, `FORMS.md`, `scenes/`, `tasks/` and `sheets/`.
  - `library/decisions.json` is written only by `py -m loom library accept`.
