# Cinema plan: a cinematic explainer register, and the house upgrades it teaches (DESIGN)

STATUS: DESIGN 2026-10-02; choices made (D-91): copy the engine for Track A, ALL of Track B first, cinema mix opt-in.
Build progress is logged per item in the table's proof column and in CHANGELOG.

**Why:** `docs/research/2026-10-02-explainer-skill-study.md`. Kshitij's own explainer skill, given the same
references, makes frames that move more and change more, and that draw the subject itself, a new world each shot.
The measured gaps:

| measure | the skill's films | Loom stress-signal |
|---|---|---|
| seconds with motion | 83 to 85 % | 67 % |
| median gap between visual events | 2 to 4 s | 7 s |
| frozen share | 5 to 12 % | 22 % |
| scene code | 7.5 to 7.8 lines/s | 2.7 lines/s |

The cause is the authoring stance, not the renderer. Its engine also runs as-is beside Loom's skia bridge.

**Two tracks, both kept** (D-70: classic and new side by side; the person chooses):
- **Track A, the cinema register.** A lesson whose pictures are made the skill's way: shots, one drawn world each,
  rendered by skia. Loom keeps planning, grounding, narration, captions, audio and gates around it.
- **Track B, house upgrades.** What the study teaches, added to the existing HyperFrames runtime, so every pack
  gains from it.

## Track A: the cinema register
**Shape:** `request.register = "cinema"`. The stages up to the script are unchanged: brief, knowledge (grounded),
pedagogy, persona, script, narrate.

From there, cinema has its own path:

1. **Shot sheet** (replaces the storyboard for this register). One shot per 1 or 2 beats, 6 to 20 s. Each shot
   declares:
   - its WORLD (setting, theme), its HERO (the noun being said) and its camera ladder (wide, close, wide);
   - one HOLD-AND-TRANSFORM (what changes while it holds);
   - the transition in, with its meaning: iris = "into this", wipe = time or travel, dip = era or mood,
     fade = meanwhile, cut = shock;
   - its OVERLAYS (tag, bigtype or counter, bars, plaque, chapter, quote), each with a grounding anchor;
   - the references it draws on (D-87).

   Gates:
   - every number overlay has an anchor;
   - every shot has a hero and a transform;
   - a new world at least every 20 s;
   - no shot shorter than its transition + 2 s.
2. **Cinema runtime** (`runtime/cinema/`): the skill's engine as a library, after Kshitij's approval.
   - Keep: core, camera, shots, paint, shapes, backdrop, fx, motion, ui overlays, actors and the Natural Earth
     data (public domain).
   - Adapt (the adapter lives in `loom/cinema_bridge.py` beside `skia_bridge.py`):
     - **timing:** `N['key']` comes from Loom's narration timeline (beats and phrases), not from `tts.Narration`;
     - **colour:** roles come from the pack's tokens (`style.role(body, rim)` from token pairs), so brands
       and packs still restyle a cinema lesson;
     - **text reporting:** every `text()` and overlay draw records its screen box, so Loom's layout checks
       (overlap, spill, type floor, caption band) see it;
     - **audio:** Loom owns narration, music and SFX. The skill's synth or score is an option, not the default;
     - **captions:** Loom's captions (SRT/VTT, word-synced) replace its subtitle pass, or are burned in by it.
3. **Scene authoring:** one Python shot file per shot, `d_<shot>(ctx, t)` plus its `Camera`. Written by a Sonnet
   sub-agent from the shot sheet with the skill's style guide and scene logic as its references.
   - It runs a stills loop: `py -m loom cinema stills <id> 3 9 15 ...` gives a grid, which is looked at and
     fixed.
   - Reusable props are promoted into `runtime/cinema/actors/`, like the skill's racks, chips and globe.
4. **Render:** the whole film in one pass, so transitions blend real frames: grain, vignette, paper and motion
   blur, resumable chunks.
   - Loom muxes its own audio and captions, then runs `render_verify`, contact sheets and the AI-tells ledger.
5. **Mixing registers** (later): a normal lesson may contain a `kind: cinema` beat, rendered as an opaque clip
   through the skia bridge, for one cinematic moment inside a HyperFrames lesson.

**Proof for Track A:**
- One 60 to 90 s cinema lesson on a grounded topic, through the full Loom pipeline.
- Measured with `tools/video_study.py` against the two reference films: motion share, event gap, frozen share.
- Kshitij watches it next to the skill's own films.

## Track B: house upgrades (HyperFrames runtime, all packs)
Each item is small and is proven in the lab (strips plus the ledger) before a lesson uses it.

| # | upgrade | what it changes | proof |
|---|---|---|---|
| B1 | **Draw the subject.** Storyboard field `subject` (the noun of the beat). New tell `label_for_subject`: a beat whose subject appears only as a pill, icon or card | stops "presenter + labels" frames | ratchet on the ledger |
| B2 | **A world per shot.** A beat may open its own `place` or world. New tell `one_world_share` (share of time in the most-used setting) | variety of settings | ledger number down on the next lesson |
| B3 | **Data as a picture:** `Loom.data.counter` (count-up big number), `unitGrid` (n things = the quantity, e.g. 100 homes), `barsOn` (bars over a map or scene), `dipLine` (line chart with a marked event), `profile` (dashed before, solid after, scale ticks) | numbers stop living in cards | lab strip; each value carries its anchor |
| B4 | **Real geography:** Natural Earth 1:110m (public domain) as `Loom.geo.map` / `globe`, with country fill by order and great-circle arcs | maps and globes that are true | lab strip; a test that coastlines load and the projection is deterministic |
| B5 | **Object recipe** shade (`shade: "recipe"`: edge, rim, body, light pool, gloss) for neon packs; ink-outline shade for paper | objects look designed | strip, before and after |
| B6 | **Finish by default:** grain, vignette and paper texture per pack at the measured levels (neon vignette about 0.6, paper 0.8, grain on) | stops the clip-art look | fingerprint against the references |
| B7 | **Transitions that mean something:** the storyboard join names its meaning (into, time, era, meanwhile, shock); compose maps it to iris (on the hero), wipe (in the direction of time), dip, fade or cut | joins tell the story | the join check names unmotivated cuts |
| B8 | **Hold-and-transform blueprints:** cutaway lift, heat recolour, layer peel, map flood, swarm or scale-up | fewer pop-and-stay beats | ledger frozen share down |
| B9 | **Openings and closings:** epigraph card, chapter sting over the blurred shot, a callback ending to the opening image | structure the references share | story gate suggestion |
| B10 | **Scale by repetition:** seeded arrays (racks, houses, crowds, windows) with per-instance variation | one thing becomes many | lab strip |
| B11 | **Allocation for explainers:** the explainer genre defaults to template 10 %, motion 80 %, avatar 10 % (from 50/40/10), with overlays on drawn worlds instead of slide templates | fewer slides | ledger template share |
| B12 | **Denser scenes:** the scene prompt asks for a drawn world (background with content, props with parts, many instances) and gives a line budget (about 6 to 8 lines/s of film), not "the fewest calls" | frames feel made | lines/s reported by `variety` |

**Kept from Loom in both tracks:**
- grounding and its gates;
- measured text, plus the overlap and caption-band checks that the skill's own films fail (counter caption
  crossed by traces; STRATOSPHERE under particles);
- pedagogy and the persona;
- rigs and Maya;
- determinism and the review gates.

## Decisions for Kshitij
1. **Track A:** may the skill's engine be copied into Video-Engine as `runtime/cinema/` and adapted? It stays your
   design; its README will say where it came from.
2. **Order:** Track A pilot first, or Track B first? Recommended: B1, B11 and B12 first (cheap, and they change
   every lesson), then a Track A pilot, then B3 to B10 one at a time.
3. **The explainer default** (B11): change it, or keep it as an opt-in mix (`--mix cinema`)?

## Build log (added 2026-10-02, D-92)
All twelve Track B items are built and proven in the browser-free preview (strips in `docs/styles/demos/preview/`).
Chrome strips on the PC are still to run: `py -m loom lab all`.

| # | built | proof |
|---|---|---|
| B1 | storyboard `subject`; story note; tell `labels_over_objects_share` (ratchet) | tests `cinema_mix_...`, `story_warnings_...` |
| B2 | storyboard `world`; story note; tell `one_world_share` (ratchet) | same |
| B3 | `Loom.data.counter / unitGrid / barsOn / dipLine / profile / tag` | `lab_data`; test `cinema_house_...` |
| B4 | `Loom.geo.map / globe`, Natural Earth asset | `lab_geo`; the test checks Indonesia floods in the neg colour |
| B5 | `{shade: "recipe"}`, `{shade: "ink"}` in kit.rect / kit.disc | `lab_shades` |
| B6 | pack finish levels; fx `paper` | packs lint clean; the WebGL layer is not drawn in the preview |
| B7 | joins iris / wipe / dip / fade and `join_in.meaning`; sound for wipe and iris | `lab_joins`; the test checks the iris is shut at the middle |
| B8 | `Loom.hold.lift / heat / peel / breathe` | `lab_hold` |
| B9 | `Loom.data.chapter`; callback note (the existing `quote` template is the epigraph) | `lab_world` |
| B10 | `Loom.array` (seeded, ordered arrivals) | `lab_world`, `lab_hold` |
| B11 | `--mix cinema` (opt-in) | test `cinema_mix_...` |
| B12 | scene prompt density and layers; `lines_per_s` in the ledger | `py -m loom variety` |

**Not verified:**
- Chrome rendering of the new lab scenes (text widths are estimated in the preview; the tag gets 6 % extra room
  for tracked capitals, L-150);
- the WebGL `paper` texture and the new vignette levels on screen;
- a lesson built with all of this. That is the cinema pilot (Track A) and the step-7 lessons.
