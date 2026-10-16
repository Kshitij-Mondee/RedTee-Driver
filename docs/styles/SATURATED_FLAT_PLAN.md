# A saturated flat register (Kurzgesagt-inspired): what Loom can do, what it needs (2026-10-01)

STATUS: PARTIAL 2026-10-01 (later). Steps 1 to 3 are built (D-78) and previewed without a browser; the Chrome lab render on the PC is pending. Steps 4 and 5 are open. Earlier status: "DESIGN 2026-10-01. Nothing here is built." It was written because Kshitij asked whether Loom could make
videos in this style, as a new style or as an evolution of an existing one. The answer and the plan are
for him to choose (D-70).

**Evidence:** `docs/research/kurz/2026-10-01-kurzgesagt-study.md`. That includes the 10-second motion section:
nine windows strip-read at 0.5 s, plus the fingerprint numbers.

**Originality.** We borrow techniques, not their work. Their characters (including the bird), any recognisable
mascot or design, their logo, their exact palette and their compositions are never copied. Every asset is an
original design, the pack gets a neutral name, and nothing is presented as theirs.

## The short answer
- **The graphic language: yes.** Loom can make it in code:
  - colour fields on a deep indigo ground, glow and soft light;
  - gloss-shaded volumes;
  - pill labels, status panels and comparison pairs;
  - bursts, vortices, crackle, sparkles, rising particles;
  - depth-of-field layers and continuous camera moves;
  - one state change per spoken word.

  Most pieces exist; a few builders are missing (below).
- **The illustration: not from code alone.** Their creatures, characters and evolving towns are hand-designed,
  dozens of distinct objects per shot. Loom's code-drawn people (`pip`, `tess`) are deliberately simple. For
  their level of detail we need drawn assets (the Claude Design route in `docs/ASSET_WISHLIST.md`), the intake
  check (`tools/asset_intake.py`, built), and the importer and rig importer (not built).
- **Character acting will be close, not equal.** Their character acting is drawn by animators. Loom rigs give
  poses, gestures, blinks, mouth shapes and springs, which is good for explainers but not hand-keyed acting.
  Expect the frames to read in the same family; the acting will be simpler.

## Where Loom stands today (checked in the repo, 2026-10-01)

| ingredient seen in the frames | Loom today | gap |
|---|---|---|
| Deep indigo field, saturated accents, glow | `flat-cosmos` has the field and accents (see `projects/spacing-sticks/qa/sheets/_overview.jpg`) | its frames are cards on an empty field (drawn 0.13, covered 0.60); there are no colour fields, glow areas or scenery |
| Gloss shading: base, a darker inner band, one white highlight shape | `crescent` shading in `runtime/kit.js` is close | a `gloss` grammar (inner band + highlight blob, no outline) |
| Pill labels with pointers | `presenter-pop` pills | pack-level pill style per category colour |
| Status panel whose icons dim one per word; "stat" pop with a leader line | cues, tweens, `ctx.narrationCard`; no panel builder | a `hud` builder |
| Radial burst behind a figure; turning vortex; electric crackle; sparkles | fx layer: background, grain, vignette, light, glow (`runtime/fx.js`) | `burst`, `vortex`, `crackle`, `sparkle` builders (procedural, seeded) |
| Something alive everywhere: bob, wobble, sway, small agents on their own paths | ambient drift (`runtime/motion.js`); seeded `Loom.rng` | an `idle` helper (bob, wobble, sway per element) and a `swarm` (many small agents, seeded paths) |
| Depth layers with focus pull, light shafts, push-through camera | `ctx.depth` with depth-of-field blur (`runtime/depth.js`), camera | a light-shaft helper; a focus pull over time (today `focus` is one fixed value per stage, `runtime/depth.js` line 38) |
| Blobs that merge and divide (metaball-like), cells that split | GSAP `MorphSVGPlugin` is installed in `node_modules/gsap` (not yet wired into the runtime) | a deterministic `goo` filter group and a `divide` move |
| Isometric world that changes era as the camera pans | `ctx.iso` (`runtime/iso.js`) | era tile sets (drawn assets) and a pan-through-time helper |
| "You are here" gauge beside a descent | tweens; none as a builder | a `gauge_track` builder |
| Comparison pair that returns with one new value | none | the comparison-pair builder (already a candidate, D-76) |
| Characters with big expressions, cartoon symbols (anger mark, sweat, sparkles) | rigs with faces; no symbol kit | Wishlist G4 part 2 (face kit) plus a symbol kit; the cast in this register's treatment |
| Creatures, props, worlds at their density | none | drawn assets via Claude Design, then the importer |

## The plan (each step proven before the next; the person chooses at each gate)
1. **Pack.** A new pack, so `flat-cosmos` stays exactly as it is (D-70, options not overwrites). Working name
   `glow-flat`, final name the requester's. It sets:
   - a deep indigo graded field;
   - 8 saturated accents, each with a light and a dark step;
   - the `gloss` shading grammar;
   - pill labels by category colour;
   - a display face for chapter cards;
   - idle motion on by default;
   - glow in the fx layer.
2. **Builders, in code:** `burst`, `vortex`, `crackle`, `sparkle`, `idle`, `swarm`, `hud`, `gauge_track`, the
   comparison pair, light shafts, `goo`/`divide`. All are seeded and deterministic, with lab scenes and tests,
   following the existing builder pattern (`docs/SCENE_API.md`).
3. **Prove it in the lab.** Three original lab scenes, one per moment type seen in the study:
   - inside the body, with a status panel that changes on the word;
   - a pressure scene, with a burst and a vortex with orbiting props;
   - a living place, with a push through depth layers and a swarm.

   Render the strips; measure with `tools/style_fingerprint.py` against the newer Kurzgesagt numbers (covered
   0.62 to 0.84, vivid 0.71 to 0.95, colours 40 to 81, soft 0.13 to 0.24). Show the requester the frames before
   anything else; the frames decide, not the numbers.
4. **Drawn assets** for the detail code cannot reach:
   - the cast in this treatment (Wishlist A, with a register line added);
   - creature and prop kits;
   - an iso era kit;
   - the face and symbol kit.

   They come back through `tools/asset_intake.py`; the importer, `ctx.asset` and the rig importer are built
   when the first approved batch exists.
5. **A real lesson** in the new pack, end to end, against the gates. That is the honest test.

## What would make it worse (from the study)
- **Entertainment pace without the reading floor.** Their videos move in 92 to 99% of seconds at about 155 wpm.
  A procedure lesson still rests on what must be read; keep their rests (labelled comparisons), not only their
  motion.
- **Effects on every beat.** In their videos, background life is constant but the meaning changes one thing
  at a time. A burst on every line stops meaning anything.

## Built (2026-10-01, later; D-78)
- **Pack `glow-flat`:**
  - deep indigo ground, saturated accents;
  - extra tokens `violet`, `glow`, `core`, `deep`, `plum`;
  - shading `gloss`; motion "lively"; lint clean.
- **`runtime/glow.js`:**
  - ground, shafts, glowDisc, blob, burst, vortex, orbit, crackle, sparkles, idle, swarm;
  - pill, stat, hud, compare, gauge.

  Not built: a `goo` merge filter, `divide`, and a focus pull over time.
- **Lab scenes:**
  - `lab_glow_inside`: one status slot switches off per named function, crackle on the figure.
  - `lab_glow_pressure`: a burst behind a worker at a desk, a stat pop, then a vortex with props closing in.
  - `lab_glow_world`: a push through three layers of a living place with a swarm and light, then a comparison
    pair whose values land on their words.
- **Measured on the PREVIEW frames, not the render** (`tools/style_fingerprint.py`):

  | measure | lab scenes (preview) | newer Kurzgesagt |
  |---|---|---|
  | covered | 0.61 to 0.81 | 0.62 to 0.84 |
  | vivid | 0.95 to 0.97 | 0.71 to 0.95 |
  | drawn | 0.29 to 0.42 | 0.28 to 0.33 |
  | soft | 0.06 to 0.11 | 0.13 to 0.24 |
  | colours | 12 to 22 | 40 to 81 |

  - Coverage and saturation are in range.
  - Soft light and colour count are short. The preview has no blur and no WebGL fx, so the render should read
    higher; it has to be measured, not assumed.
- **Not done yet:**
  - the Chrome render on the PC;
  - Kshitij's judgement of those frames;
  - a character drawn for this treatment (the code rigs are simple);
  - a real lesson.

Previews are in `docs/styles/demos/preview/` and are marked PREVIEW.

## First Chrome render (2026-10-01, Kshitij's PC; D-78)
- **Lab strips:** `py -m loom lab lab_glow_inside|lab_glow_pressure|lab_glow_world --style glow-flat` reported
  7 frames and 0 problems each. The strips are in `docs/styles/demos/lab/`.
- **Suite:** 65 passed, 0 failed, 0 skipped. That includes the browser lab test with the glow scenes.
- **Preview against render, like with like.** Both strips were cut into their 640 x 360 tiles and measured with
  `tools/style_fingerprint.py`. They agree within 0.014 on every measure:

  | scene | drawn | covered | soft | colours |
  |---|---|---|---|---|
  | inside, render | 0.32 | 0.83 | 0.19 | 37 |
  | inside, preview | 0.33 | 0.82 | 0.18 | 39 |
  | pressure, render | 0.30 | 0.75 | 0.15 | 29 |
  | pressure, preview | 0.29 | 0.77 | 0.15 | 29 |
  | world, render | 0.27 | 0.64 | 0.13 | 18 |
  | world, preview | 0.28 | 0.63 | 0.13 | 18 |

  By eye the frames match too; the only visible difference is text in the real face.
- **Why these numbers differ from the earlier table.** At tile size (with JPEG), soft and colours read higher
  than the full-size preview frames gave. The tile scale is closer to the 640 x 360 reference videos, so it is
  the fairer comparison. Against the newer Kurzgesagt videos, covered, saturation and vivid are in range; soft is
  in range (0.13 to 0.19 against 0.13 to 0.24); colours are short (18 to 37 against 40 to 81). JPEG adds some
  colours, so treat that one as approximate.
- **Not approved yet:** Kshitij judges the frames.

## Fixes after the first render (Kshitij: "I love the direction"; R-23)
1. **Crackle:** bolts run along an arc of the figure's outline with small irregular kinks. The first version
   threw bolts into the air, and a dense zig-zag version read as springs.
2. **Vortex:** the outer rings sink toward the deep field (`calm`, default 0.62), and the strongest colour sits
   near the centre, so orbiting props read.
3. **Reef:** new builders `G.coral` (branching, lit tips), `G.fan`, `G.kelp` (sways) and `G.rock` replace the
   balloon blobs.
4. **Comparison panels:** `G.ticket` work items replace the generic blobs. Week 1 has nine open tickets piled
   up; Week 6 has seven done (ticked) and two open.

These were judged on previews (`docs/styles/demos/preview/`). The Chrome strips in `docs/styles/demos/lab/`
date from before the fixes until re-run on the PC.
