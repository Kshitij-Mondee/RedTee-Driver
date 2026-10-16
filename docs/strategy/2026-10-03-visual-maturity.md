# Visual maturity: why code-drawn Loom looks childish, and the fix (D-102)

STATUS: DESIGN, 2026-10-03. Reached through a brainstorm loop and three critique rounds, at Kshitij's request:
"without references, whatever code based templates or scenes you make, they are very childish and very immature
and very subpar". Nothing is built yet. Experiments E1 and E2 come first.

## The diagnosis
1. **Figurative content is drawn from imagination with primitives.** People, rooms and props become circles,
   rounded boxes, uniform outlines and saturated fills, and that reads as a children's app. Professional
   explainers also use simple shapes, but their silhouettes are DESIGNED: asymmetry, tapered lines, a value
   structure, light, restraint. A language model writing SVG blind cannot design silhouettes.
2. **There is no target image before building.** Each scene is invented alone, so it regresses to a generic
   average. Motion studios make styleframes before animating; Loom skipped that stage.
3. **Toy signals add up:**
   - pops and bounces;
   - big-headed beans;
   - pastel blobs;
   - icon grids with labels;
   - text in a box on a gradient.
4. **The gates measure mechanics, not taste** (L-172).
5. **Reference-first (D-87) did not fix it.** I looked at references, then still drew with primitives. The gap is
   making the visuals, not finding references. Even a designed character (Maya) beside code-drawn scenery read as
   "two drawing languages" (the step-7 review).

## The brainstorm (17 ideas, 4 mechanisms) and what died
| mechanism | ideas | outcome |
|---|---|---|
| change WHO draws | Claude Design kits, a human designer, image models on the GPU pod, 3D, stock footage | survives as part 2 |
| play to code's strengths | an editorial and information register, de-cartoon corporate, fewer registers done well | survives as part 4 |
| encode taste as rules | style bible, maturity lint, corpus rules, fingerprint distance | **cut as a solution:** rules set a floor, not a ceiling; we had lints and the films were still awful. Kept as guardrails (part 3) |
| close the loop with eyes | styleframes, generate N and judge, vision critic, rebuild templates from references | styleframes survive (part 1); **judge-and-select alone is cut:** it cannot beat the generator's ceiling; **reference-first alone is cut:** already failed (D-87) |

## The critique rounds
**Round 1, on the draft** (assets plus code staging, styleframes, editorial register):
- **FATAL: no test of "mature".** Without one we repeat L-172: confident claims and an awful film. Fixed by
  part 0.
- **MAJOR: assets alone do not make maturity; the art direction does.** Maya was a designed asset and still read
  as cartoon beside code-drawn rooms. Fixed by putting the style choice first (part 1), one drawing language per
  frame, and never improvising a missing asset.
- **MAJOR: motion was left out.** Pops, bounces and everything arriving at once are half of the toy look. Fixed by
  part 3.
- **MAJOR: the image-model asset route is unproven** (consistency across poses, whether it animates, licences).
  Fixed by bake-off E2 before any commitment, with the asset sources in tiers.

**Round 2, on the diff:** all four resolved. New:
- **MAJOR: composition.** With good assets, a model can still compose like a slide (centred, wrong scale).
  Fixed by shot recipes taken from the styleframes (part 2).
- **MINOR:** Claude Design is manual. Acceptable, because kits are made once per register; per-lesson gaps go to
  the pod generator later.

**Round 3, on the diff:** no fatal or major left. Remaining open risk: whether Kshitij prefers the illustrated or
the editorial register for corporate work. That is his choice, kept as both (D-70).

## The plan
**0. Define "mature" with a test, before anything else.**
- **Golden set:** about 60 frames.
  - 20 reference stills from our existing study sheets, kept local and never published;
  - 20 frames from the rejected step-7 films;
  - 20 frames from new candidates.
- Kshitij rates each one from 1 (childish) to 5 (professional) on a simple rating page, in about 10 minutes.
- The vision judge's maturity score must rank them the way he does (Spearman 0.7 or better) before it is
  allowed to gate anything.
- Every later change is measured on this set.

**1. Art direction first: styleframes per register, reused across lessons.**
- For each register:
  - start from references (the vision lab's style families, the reference boards);
  - make 3 to 5 high-fidelity styleframes with the strongest available source;
  - Kshitij approves them.
- **A styleframe fixes:**
  - shape language and silhouette style;
  - palette and value plan;
  - light;
  - type;
  - density;
  - camera habits.
- These become the pack's tokens and a style bible. Lessons pick from a register; they do not invent one.

**2. Designed assets, coded staging. Code never draws figurative content from imagination.**
- **What code draws:** what it is good at, which is type, UI, documents, data, diagrams, maps and abstract
  geometry.
- **What comes from the register's asset kit:** people, places and props (rigs, props, sets). Each register has
  ONE source, so the drawing language never mixes.
- **Where the kit comes from**, in tiers decided by E2:
  - (a) Claude Design kits (proven: Maya, the rig importer);
  - (b) image models on the GPU pod in the styleframe's style, vectorised or used as layered cut-outs;
  - (c) one coherent licensed pack.
- **A missing asset becomes an asset request,** and the beat falls back to the editorial treatment. A scene
  never improvises a figurative drawing. A scene lint warns when bespoke code builds figurative shapes outside
  the kit, with a declared opt-out for diagrams.
- **Shot recipes from the styleframes:** composition grids per shot size, subject scale and placement,
  foreground, middle and background, and where text sits. Scene authors (including cheaper models) fill
  recipes; they do not compose from scratch.

**3. Mature motion, per register.**
- Motion presets come from the TED-Ed corpus, measured at full frame rate by the vision lab: easing shapes,
  durations, how many things move at once, how often cuts land on sound.
- Corporate registers get:
  - no overshoot on text or people;
  - limited simultaneous arrivals;
  - camera moves with a motivation;
  - text that never bounces.
- The maturity lint enforces these as guardrails, and the calibrated judge checks the rest.

**4. A code-native editorial register as the default corporate path, beside the illustrated registers (D-70).**
- **Built from:** typography, a grid, real UI and documents (`Loom.ui`), data, maps, and photography or footage
  (licensed; downloads approved).
- **Rules that keep it from becoming slides:**
  - motion carries meaning (documents assemble, data transforms, the camera travels through artefacts);
  - density and fill rules hold;
  - no text box on a gradient.
- The golden segment b17-b21 (one real message, evidence cards) is the first example of this register.

**5. The gate:** the calibrated maturity judge, plus the lints and film checks, then Kshitij's final look. Never
"gates pass, so it is good".

## Experiments, in order (cheap first)
| # | what | cost | decides |
|---|---|---|---|
| E1 | golden set plus Kshitij's ratings (a rating page) | his ~10 min; my ~1 h | what "mature" means; calibrates the judge |
| E2 | bake-off: one 20 s corporate beat (two people discussing a report at a desk) made 4 ways: current code; a Claude Design kit; an image-model kit on the pod; the editorial register. He blind-ranks them | ~1 day; some pod time | which asset source and register to build first |
| E3 | the judge's maturity score vs his ratings (needs the pod) | ~1 h of pod time | whether the judge may gate |
| E4 | styleframes for the winning register; his approval | ~1 day | the art direction every lesson reuses |

## Not verified (Rule 0)
- Whether image models give consistent, animatable assets (E2 tests it).
- Whether the vision judge's maturity score tracks Kshitij's taste (E3).
- Whether he prefers the editorial or the illustrated register for corporate work (E2; kept as both).
