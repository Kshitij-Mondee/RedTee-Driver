# Style engines: what lemo-opuscar's engines teach, what a Loom engine needs, and what it would change (2026-10-15)

STATUS: STUDY 2026-10-15. Research only; nothing built beyond the empty slot of D-175. Kshitij asked: learn from
opuscar's engines without copying their format; say what an engine would require, whether it can all be done, and
whether engines would improve quality and change time and cost.

**Read:** `styles/whiteboard/demo/engine/wb.js` in full (487 lines) and how `film.js` (403 lines) uses it; the
exported API of `dataviz/demo/engine.js` (398 lines) and `iso-infographic/demo/engine.js` (388 lines). **Loom data:**
the 2026-10-14 style test (`docs/research/style_test/RUN_LOG.md`, `tools/run_compare.py`), the whiteboard guide
(`docs/styles/guides/whiteboard.md` sections 7, 14, 15) and the scene sizes of three whiteboard lessons. Nothing was
rendered for this note.

## 1. What an opuscar engine is

Not a library of pictures. It is **the medium simulated in code**, in five layers. The whiteboard engine:

| layer | what it does in wb.js | why it matters |
|---|---|---|
| **1. the mark** | `Stroke`: resampled to even steps, a low-frequency hand wobble along the normal, an overshoot with a small hook at the end; drawn as a **ribbon** whose width follows a chisel nib (by direction) and pressure (a ramp in, a taper out); a pooled ink dot where the nib landed; tiny strokes become dots | this is what makes a line read as marker, not as a vector path with a texture |
| **2. the vocabulary** | `line` (a slight bow), `circle` (never closes, overlaps by a set amount, starts at an angle), `rect` (four strokes with corner overshoot), `roundRect`, `arrow` (shaft then two head strokes), `dashed` (one stroke per dash), `hatch` (a zig-zag scribble), `text` (single-stroke font, per-glyph rotation, baseline and scale jitter, glyphs the font lacks drawn in the same hand) | the style's craft rules live here, once: a circle can't close, a rectangle can't be one path |
| **3. the scheduler** | `Timeline.draw(pen, shapes, t, {by})` puts every stroke on a pen in writing order; pen-up hops sized by distance; **fit mode** solves the speed so the writing ends exactly at `by` (a spoken word); warns when a pen is late or a window too tight; emits an event per stroke (tap, write, dash, stroke) for the sound mix; `erase` sweeps a path | the timing rules (finish on the word, hops, order) can't be got wrong by the scene |
| **4. performers and camera** | `penPose`: a floating marker drawn at the tip, lifting between strokes, parking off-frame between phrases; an eraser and a magnet as objects; a camera with log-interpolated zoom that keeps a zoom's midpoint steady | the maker is always visible, which is where the whiteboard film's motion comes from (96 % of seconds moving, measured) |
| **5. surface and finish** | the board gradient, a scuff tile, ghost marks of old lessons, ink composited with multiply, a dry-marker speckle cut out of the ink (locked to the board), a window sheen moving slower than the camera | the "real board" look; all procedural and seeded |

The dataviz engine has the same five layers for a different medium (paper and dot grid, a pencil stroke, handwritten
notes with leaders and un-closed rings, data dots and morphs, a drawn pencil as the performer, a caption) and the iso
engine too (projection and a depth-sorted queue, three tones per face from one colour, pins, insets, cut lines,
Isotype grids, billboard people).

**How a film uses it:** the whiteboard film is 403 lines for 111 s: a layout (world positions), then a list of
`tl.draw(pen, shapes, at(line, word), {by: at(line, other word)})` calls hung on the spoken words. The scene states
*what and when*; the engine owns *how it looks and moves*.

**What we should not take from it:** immediate-mode canvas that redraws everything every frame; one film owning one
board with no checks; the engine copied per film (the survey found 6 forks of shared pieces); hardcoded colours and
pixel constants; no layout measurement. Those suit one-off films and would break Loom's checks, restyles and reuse.

## 2. What a Loom engine needs (and how it differs)

Loom draws differently: retained SVG elements on one world canvas, one paused GSAP timeline, held parts across beats,
the layout guard and runtime probe reading element boxes, colours as tokens so a lesson restyles, captions, and now the
timing grid. A Loom engine must keep all of that working. So it needs:

1. **The same five layers, rebuilt as Loom code.** The mark model and the vocabulary are the core; the scheduler,
   performer and surface are added only where the style has them (a flat corporate style has no pen to perform).
2. **Output as Loom elements.** Each drawn thing is an element made with `ctx.el` (so it can be held, carried by the
   camera, exited at joins, measured by the probe and moved by the layout guard). A variable-width mark becomes an SVG
   path whose outline is the ribbon; its reveal is a timeline tween that rebuilds the outline up to the drawn length
   (deterministic: it depends only on the timeline's time). Only the surface layer (texture, sheen) can be a canvas,
   through the existing fx layer, because nothing in it carries meaning.
3. **Time from the lesson, not from constants.** The scheduler takes its windows from cues (`ctx.cue`) and the timing
   grid (`ctx.hit`, `ctx.onBeat`), and its fit mode ends writing on the spoken word, the rule the whiteboard guide now
   asks authors to compute by hand (section 7: "words start being written within 0.4 s after the cue").
4. **Sound from the marks.** Each stroke emits a `Loom.sfx` event; the mix needs the style's sound kinds (a marker
   stroke whose length and speed shape the sound, a tap, an erase). The grid (D-173) already places and checks every
   planned sound, so this is a few new synths in `loom/narrate/mix.py`, not a new system.
5. **Colours and type from the pack.** Ink colours are pack tokens (so a brand or restyle still works); lettering uses
   a single-stroke font. The fonts are already installed (hersheytext's EMS and Hershey fonts, OFL and MIT, D-176), the
   same family opuscar's whiteboard uses.
6. **The engine slot changes slightly.** D-175's slot is right in shape (`runtime/engines/<style>.js`, `ctx.engine`,
   linted, loaded only for its style). It needs: an engine-owned sound kind list for the mix, a lab scene per engine,
   and a test that a lesson in the style with and without the engine composes and checks the same way where it does
   not call it.
7. **Proof per engine:** a lab strip, the style guide's "Engine" section (the api with one example each), determinism
   and restyle tests, and a within-style comparison (D-122): the same lesson in the same style, with and without.

## 3. Can it all be done here?

- **The code: yes.** Every layer above is ordinary JS and Python inside what Loom already has (elements, timeline,
  cues, grid, mix, probe, lab). No new download is needed for a whiteboard-type engine (the stroke fonts are in).
- **Not by me alone:** which style gets an engine first, and whether its look is right, are Kshitij's calls (taste is
  his, D-106: the vision model does not gate it). People stay designed kits (D-121), never drawn by an engine.
- **Risk to the rest of Loom: low by construction.** An engine loads only for its style and acts only when a scene
  calls it; lessons and styles that don't are untouched (existing lessons are not to be updated anyway).

## 4. Will it improve quality?

**Where the style is a process medium (a pen on a board, a pencil on paper, a drafting line), very likely.**
- The measured gap is in exactly what an engine supplies: opuscar's whiteboard film moves in 96 % of its seconds
  against 53 % for Loom's older whiteboard lesson, and the frames show why: the maker draws the subject the whole time.
- Loom's own whiteboard guide lists its open gaps as single-stroke write-on lettering, stroke order, a drawing hand and
  `m.draw` mishandling hatching and dashes (sections 14 and 15). Those are layers 1 to 4 of an engine.
- The guide's section 7 carries about 15 workaround rules authors must apply by hand (stroke order, hatch order, one
  element per stroke group, draw and writing durations, timing against the voice). Each is a place a model can slip;
  an engine makes them impossible to get wrong.

**But the headroom is smaller than the old lessons suggest.** Kshitij rated the 2026-10-14 whiteboard films "good" to
"great" (Terra and Sonnet top, Sol with 1 or 2 visible issues). An engine there raises craft (written lettering, a real
stroke, the pen, sound on every stroke), not broken frames.

**Where the style is flat graphic (corporate-clean, flat-cosmos, glow-flat), probably not.** Their hard part is
composition, designed assets and layout, which the kit, places, objects and the layout guard already address. An
engine there would mostly re-wrap existing calls.

Nothing here is proven until the within-style comparison runs: same lesson, same style, with and without, rated blind.

## 5. Time and cost

**One-time, per engine:** about a day of Claude Code work for a whiteboard-type engine (the five layers, sound kinds,
lab scene, guide section, tests), plus Kshitij's look at the strips. No paid API calls (built in a session, not a run).

**Per lesson: the engine works on the phase that costs the most.** The 2026-10-14 whiteboard runs (2:09 films, from the
storyboard on):

| run | total | scene writing (P8) | P8 share of cost | looks | check rounds |
|---|---|---|---|---|---|
| style-whiteboard-terra | $3.27, 43 min wall | $2.26, 35 min | 69 % | 28 | 3 |
| style-whiteboard-sonnet | $3.88, 43 min wall | $3.14, 35 min | 81 % | 32 | 3 |

Scene writing dominates (69 to 81 % of the cost); most of its time is the authors' looks at their own beats
(`lab_snapshot`: 22 to 33 minutes summed). Whiteboard scenes in Loom run 980 to 1,500 lines for 11 or 12 bespoke
beats (about 80 to 135 lines a beat). With an engine a beat becomes mostly a layout and a list of timed calls, so:
- **shorter scenes and fewer looks** (fewer things to get wrong), which is where the money goes. A plausible range is
  30 to 50 % off scene writing, so about 20 to 40 % off a run's cost; **an estimate, not a measurement**;
- **cheaper models stay viable**: Terra already matched Sonnet on whiteboard; a smaller scene task widens that margin;
- **render time may rise a little**: rebuilding stroke outlines per frame and a texture layer cost more than a dash
  offset. Renders are 7 minutes of these runs; to be measured, not assumed;
- **planning, narration and the speech check are unchanged.**

## 6. Recommendation

Build one engine as a pilot for a style Kshitij picks, then run the within-style comparison on one new lesson (with and
without, same storyboard): blind rating, cost, wall time, looks and render time. Continue to other styles only if the
pilot shows better pictures at equal or lower cost. A process-medium style is where the evidence points (the whiteboard
guide's own gaps are engine-shaped); a flat corporate style is the weakest case.
