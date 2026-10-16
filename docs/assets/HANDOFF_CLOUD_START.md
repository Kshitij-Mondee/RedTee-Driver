# Building Loom assets in Claude Code on the web (2026-10-16)

The cloud route for the hand-off sheet (`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`). Kshitij chose it: the asset maker's
Claude works on the private repository in a cloud sandbox, where it can run the engine's own checks and look at its
results. Drawn art still goes through Claude Design, as the sheet says.

## Once, before the first batch

1. The repository `Kshitij-Mondee/RedTee-Driver` (private) is pushed with the current engine, and the Claude account's
   GitHub connection can read it.
2. In Claude Code on the web, start a session on that repository.
3. The environment's setup command:
   ```
   bash tools/cloud_setup.sh
   ```
   It installs the Python and Node packages and the headless Chrome, then runs `python3 -m loom doctor`. On Linux the
   commands are `python3 -m loom ...` where the docs write `py -m loom ...`.

## Each batch

- One session per batch of 5 to 8 items from one family, on its own branch: `assets/batch-01`, `assets/batch-02` and so
  on. Never `main`.
- Paste the start prompt (below), then work the batch as the sheet says.
- At the end, commit to the batch branch and push it. Kshitij's session takes it in: it reruns the checks, looks at the
  sheets and merges it.

## The start prompt (paste at the start of each session)

```
You are building reusable assets for Loom, a code-rendered teaching-video engine that makes narrated corporate
training lessons. The engine belongs to Kshitij. This repository is the engine, checked out in a cloud sandbox. The
commission is docs/assets/HANDOFF_TEMPLATE_LIBRARY.md (184 items, each with its own prompt).

Setup: if `python3 -m loom doctor` fails, run `bash tools/cloud_setup.sh` first. Use `python3 -m loom ...` wherever the
docs write `py -m loom ...`.

Work on branch assets/batch-NN (I will tell you NN and the items). Start like this:
1. Read docs/assets/HANDOFF_TEMPLATE_LIBRARY.md sections 0 to 6 in full: how to work, what Loom is, the code contract,
   the master prompts, the naming and labels, and what already exists (never rebuild those). Skim the item lists in
   sections 7 and 7b.
2. Before the family, read what the sheet names for it: docs/COMPONENTS.md, docs/SCENE_API.md, docs/LAYOUT.md and
   runtime/kit.js for components; docs/styles/engines/<style>.md for anything tied to a style (whiteboard, blueprint,
   screencast, hologram, isometric); the models in assets/models3d/ for Family L. Look at docs/styles/demos/lab/*.jpg
   to see each style.

For every item:
- Follow the MASTER PROMPT in section 3 and the item's own block.
- Write only where section 0 says that family's work goes. Never touch any other file.
- Prove it. Components: python3 -m loom library accept <id> must pass, then open library/sheets/<id>.jpg and look at
  every style's row. Models: python3 -m loom models sheet <id>, then look at the sheet. A pass that looks wrong is a
  fail: fix it.

Rules that matter most:
- frames are a pure function of time: no Math.random (use Loom.rng), no Date, timers, requestAnimationFrame or network;
- colours only as tokens and fonts only as pack roles;
- on-screen content is never defaulted, and text is measured, never squeezed;
- no real brands, logos or products;
- no em or en dashes in any text;
- label everything as section 5 says.

Decide sensibly instead of asking, and write each decision down. Ask only if an item's block contradicts what the
engine does.

At the end of the batch, write BATCH.md (each id, what it is, its accept output, what you looked at, anything left
open), commit it with the items, their fixtures and the sheet images, and push the branch. Do not open a pull request
into main and do not merge.
```

## The first batches (highest value first)

| batch | items | family |
| --- | --- | --- |
| 01 | T-149 email, T-150 chat workspace, T-151 calendar, T-152 docs editor, T-153 learning platform | M (screencast shells) |
| 02 | T-154 HR system, T-157 cloud console, T-158 analytics, T-159 project tracker, T-162 developer workspace | M |
| 03 | the P1 items of family A (developer and code) | section 7 |
| 04 | the P1 items of families B and C (DevOps, AI) | section 7 |
| 05 | T-137 laptop, T-138 GPU, T-146 building | L (hologram heroes) |

Drawn art in Claude Design: A-18 (whiteboard hand poses) first, then A-19 (hologram people).
