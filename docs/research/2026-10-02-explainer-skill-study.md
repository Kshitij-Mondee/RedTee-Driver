# Study: Kshitij's independent explainer-video skill, and why its frames beat Loom's (2026-10-02)

STATUS: STUDY 2026-10-02. Research only. Nothing in the render path changed.

**Studied:**
- The skill folder `Downloads/explainer-video.skill/explainer-video`: SKILL.md, 7 references, the engine (about
  9,000 lines with the examples) and 4 examples.
- Its two renders, `the_answer_factory.mp4` (125 s, neon look) and `the_year_without_a_summer.mp4` (130 s, paper
  look).
- Compared against Loom's latest real lesson, `projects/stress-signal` (76.7 s, glow-flat).

**How:**
- `tools/video_study.py` on all three videos;
- full-resolution frames at the same moments;
- line and call counts of the scene code;
- running its engine in this sandbox: it renders a still in about 0.7 s (skia 144, the same build Loom's skia
  bridge uses).

Evidence is in `docs/research/explainer_skill/`:
- contact sheets every 4 s: `*.sheet-01.jpg`;
- full frames: `af_frames.jpg`, `yw_frames.jpg`, `loom_stress_signal_frames.jpg`;
- the study JSON for each video.

The skill is Kshitij's own work, so it is studied here as a reference, not copied. Nothing from it has been
vendored into Loom.

## 1. The measured difference
| measure (`tools/video_study.py`) | Answer Factory | Year Without a Summer | Loom stress-signal |
|---|---|---|---|
| seconds with visible motion | **85 %** | **83 %** | 67 % |
| median picture change while moving | **0.071** | 0.055 | 0.034 |
| median gap between visual events | **2.0 s** | 4.0 s | 7.0 s |
| frozen holds (share of runtime) | **5 %** (6 s) | 12 % (16 s) | 22 % (17 s) |
| settings (worlds) in the film | 10 shots, each its own world | 14 shots, each its own world | about 2 (desk, night field), one ground |
| most common accent | spread across 5 roles | spread, one accent per scene | cyan in 63 % of frames, the same skin tone in 60 % (one character in most frames) |
| scene code per second of film | **7.8 lines/s** (971 lines for 125 s), plus 562 lines of reusable actors | 7.5 lines/s | **2.7 lines/s** (207 lines for 76.7 s; about 26 lines per bespoke beat) |
| what scene code calls | skia paths, rects, circles; glow; iso boxes, racks, chips, packets, globe, map, plume, figures | the same | `ctx.cue`, `ctx.el`, `ctx.character`, `kit` pills and cards |

The cut detector undercounts Answer Factory (1 cut). Its 10 shots are joined by fades and irises, which the tool
does not count as cuts. The shot counts come from the scene files.

## 2. Why their frames look better (what the frames show)
Look at `af_frames.jpg` and `yw_frames.jpg` next to `loom_stress_signal_frames.jpg`.

1. **They draw the subject itself; Loom draws a presenter plus labels.**
   - Every Answer Factory frame IS the noun being said: a phone with a real chat, the cable, a globe with real
     coastlines and great-circle arcs, the data-centre box, a hall of 50 racks, the chip, the rack turning hot,
     the cooling loop, the microwave, the world at night.
   - Stress-signal shows the same character in most frames. The subject (adrenaline, cortisol, digestion) appears
     as a pill or a stock icon in a card. The words carry the idea and the picture decorates it.
2. **A new world every shot.**
   - Each shot is its own coordinate world, with its own camera, theme and props. Space, inside a building, a
     circuit board and a map all appear in 2 minutes.
   - Loom keeps one ground and one place per lesson, so frame 1 and frame 40 look alike. The variety ledger (D-79)
     measures this but cannot fix it.
3. **Scale through repetition.** 50 racks (5 rows of 10), 100 houses (10 x 10), a crowd of 13, and about 970 city lights scattered around the 243 real cities in Natural Earth.
   Loom draws one of each thing, and one thing reads as an illustration, not a fact.
4. **The number becomes a picture.**
   - "100+ kW" stands next to a grid of 100 lit homes, and a 15-digit counter runs over the chip.
   - The map carries 1.5 % and the bars; the chart's line dips with a marker on 1816.
   - Loom puts numbers in text cards.
5. **Hold and transform instead of pop and stay.**
   - A shot holds 8 to 15 s while it changes: the roof lifts off, the rack heats from violet to coral, the plume
     climbs into the stratosphere band, the map floods country by country.
   - Loom's elements pop in and sit still, hence 22 % frozen time.
6. **The finish layer is always on.**
   - Film grain (1.8 neon, 3 to 3.5 paper), a heavy vignette (0.62 to 0.8) and a multiplicative paper texture.
   - A quarter-resolution additive glow layer, so light never muddies the shapes.
   - Real motion blur from sub-frame accumulation.
   - Loom's glow-flat has grain 0.02 and vignette 0.24, and most packs are clean vector, which reads as clip art.
7. **Two complete looks with their own type systems.**
   - Neon: Montserrat, rectangular wipe-in tags, extruded chapter word, giant count-up numbers.
   - Paper: Cinzel plaques, Lora italic epigraph card, ink outlines, parchment.
   - The look decides the grammar (plaques, epigraph, maps with graticules), not just the colours. Loom's packs
     change colours and shading over the same grammar.
8. **Transitions carry meaning.** Iris into the thing explained, wipe in the direction of time, dip to black for
   a change of era, fade for "meanwhile". Loom has `m.iris` and joins, but the storyboard does not tie a join to
   a meaning.

## 3. Why (the honest part): the difference is the stance, not the talent or the renderer
The same model, the same reference frames. The difference is what each system asks the author to do.

- **Their engine is low-level, with a few strong primitives.** The author writes drawing code directly (paths,
  rects, a layered object recipe, a glow layer, iso boxes, a globe), and each shot is a hand-built world of about
  100 lines. Nothing pushes the author toward a card or a pill: tags are optional overlays on top of a drawn
  world.
- **Loom routes the author into high-level, legible primitives:** `ctx.character`, `kit.card`, pills, labels,
  icons, and templates.
  - By default half of the running time is template beats (`loom/allocate.py`: avatar 10 %, template 50 %,
    motion 40 %). A template beat is a laid-out slide (the "Stress response" title card, `definition`).
  - The scene prompt's emphasis is fit, measure, type floors and one emphasis per scene. Those guardrails buy
    legibility and pay for it in picture.
  - The result is frames that are correct and uniform, with UI on a background.
- **Their scenes are about 3 times denser per second.** That is the drawing that makes a frame feel made: props
  with parts, many instances, a background with content. Loom's scene authors are given about 26 lines per beat.

## 4. What Loom does better (keep it)
- **Grounding and gates.**
  - Every claim is traced, and story, script and storyboard are gated.
  - Their only guard is "research first", with sources listed at delivery.
- **Layout correctness.** The references show the cost of having no layout logic:
  - the 15-digit counter's caption is crossed by the chip's traces (`af_frames.jpg`, panel 3);
  - "STRATOSPHERE" is half buried in the sulphur particles (`yw_frames.jpg`, panel 3);
  - Loom's measured text, its spill and containment checks, and its Chrome tight_inset check would have caught
    both.
- **Pedagogy and the narrator persona.** Their films are short documentaries: no learner model, no retrieval, no
  transfer.
- **Characters.** Their people are stick figures with dot eyes (the bakery crowd, the four writers). Loom has
  rigs, and Maya v3 is ready for import.
- **Determinism and parallel rendering:** both have them. Theirs is built from a seeded `Random`.

## 5. Can this architecture run inside Loom? Yes; the pieces already line up
- **Same renderer family.** Loom already renders `kind: skia` beats through `loom/skia_bridge.py`, with skia-python
  144. Their engine ran unchanged in this sandbox (stills at 20, 47 and 84 s, about 0.7 s each).
- **Same narration model.** Both use local Kokoro and a line-keyed timeline. Loom's narrate stage gives word
  timings; their shots read `N['key']`.
- **Same contract.** Both treat a frame as a pure function of (scene, t), use seeded randomness and support
  chunked or parallel rendering.
- **What would need adapting:**
  - timings come from Loom's timeline, not from `tts.Narration`;
  - colours come from Loom's style tokens (their `style.role` takes two hexes);
  - every text draw reports its box, so Loom's layout checks see it;
  - grounding anchors on every number overlay;
  - Loom owns audio and captions; their score and synth are an option.

The plan for this is `docs/styles/CINEMA_PLAN.md`.

## 6. Limits of this study
- Two films, made by one author, so the numbers are a comparison, not a norm.
- Loom's side is one lesson (stress-signal). A lesson in another pack would score differently; the gap in
  worlds, density and data-as-picture would not.
- Kshitij watched the films. These notes judge frames and code, not the full viewing experience with sound.
