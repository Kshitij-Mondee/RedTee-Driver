# Bringing back the wow: hologram and blueprint (2026-10-16)

Kshitij, 2026-10-16, after the stress test: "our implementation of these styles isn't better. The cool factor and the
wow factor of both hologram and blueprint style feels like it's gone. Opuscar frames looked definitely better."

Opuscar is a reference, not the goal (memory: external engines are references). This note names what makes the first
impression and turns it into Loom's own ingredients. Readability gates stay; the wow must not cost legibility.

## What was looked at

- Opuscar's preview stills, viewed in the browser and not downloaded:
  - `docs/frames/hologram-hud.jpg`: an e-bike scanned into a hologram;
  - `docs/frames/blueprint.jpg`: "The Cloud Catcher", fig. 3.
- Their style specs, read: `styles/hologram-hud/STYLE.md` and `styles/blueprint/STYLE.md`.
- Our stress frames (`2026-10-16-style-stress/`). Blueprint and hologram frame 1 were rendered again with the pack's
  shader layer on, because the lab had shown them without it. With it on, blueprint gains a faint grid and a soft
  vignette, and hologram's edges darken: a little better, still flat.

## Why theirs impresses and ours does not

**Hologram.** Theirs is one hero object: a dense, glowing 3D wireframe on a projector pad in true perspective, with
light beams falling from above, depth fog (far lines fainter), "hot" near-white edges on what is active, two glow
passes, a radial lift behind the subject, a strong vignette, and HUD chrome at the frame's edges (corner brackets,
coordinates, small mono status text). The words are few and small, and the values glow amber. Ours is flat 2D panels
on a hex grid: no hero object, no light, no depth, large text everywhere. The builders left the 3D object, the orbit
and the glow out on purpose (clarity, render cost); that is the wow that went missing.

**Blueprint.** Theirs is a sheet of paper:
- the sheet: a cyanotype with two Prussian blues mottled by noise, fibres and specks, fold creases with a bright and a
  dark edge, bleached edges, lying on a dark cloth with a drop shadow;
- the lines: pale blue-white and slightly soft, breaking up on the grain;
- the drawing: an illustrated machine (a crane, gears, a mast), with oblique extrusion turning flat parts into
  objects, and one "real" thing (the cloud) with volume, a gradient, a glow and a shadow falling across the lines;
- the lettering: hand lettering, a glowing nib, and a dense parts list and title block in small type.

Ours is a flat navy fill with crisp, uniform vector lines and rectangles: correct, sterile, and it reads as a diagram
tool rather than a drawing.

## Loom's own ingredients (the plan)

**Hologram** (`runtime/engines/hologram.js`):
1. **A hero object in 3D wireframe**, drawn by the engine itself: true perspective projection, deterministic, no Three.js
   (frozen, D-121). The models are CAD-like: rings plus longitudinal lines, every part connected. A small set for
   corporate topics: a server rack, a chip, a drone, a data-centre block, a globe, a phone, a shield or lock, a car or
   bike. Each has depth fog (alpha by depth), hot edges for the active part, an orbit or turntable, a scan plane that
   builds it, and an exploded view along an axis.
2. **A projector pad**: a bright ring, a dashed ring and ticks, rotating slowly, with faint light beams and dust.
3. **Light**: a near-black stage tinted by the hue, a radial lift behind the hero, a stronger vignette, and an additive
   glow on strokes (two soft passes). Glow never goes under words.
4. **HUD chrome** at the frame's edges: corner brackets, rulers, coordinates and small mono status text, in a near layer
   that parallaxes a little with the camera.
5. **Typography in the analysis register**: smaller mono labels with wide tracking, values in amber with rolling digits,
   text on dark plates with 1 px borders and corner ticks.
6. **The briefing register stays calm**, as now. The wow is for the hero moments, one or two a lesson.

**Blueprint** (`runtime/engines/blueprint.js`, and a new shader in `runtime/fx.js`):
1. **Cyanotype paper**: a procedural shader with two Prussian blues mottled by noise, fibres and specks, fold creases
   with a bright and a dark edge, bleached edges, and the sheet on a dark cloth with a drop shadow (a "sheet on the
   table" option).
2. **Lines**: pale blue-white, slightly soft (a faint bloom), with a little breakup on the grain, and a weight
   hierarchy that holds at every zoom.
3. **Objects, not boxes**: oblique extrusion animating from flat to object; a gear, shaft and chain vocabulary for
   mechanisms; Lucide icons traced in the drafting line for everything else (as the whiteboard does with `W.icon`).
4. **One real thing** per sheet: a soft volume with a gradient, a glow and a shadow across the lines.
5. **Lettering**: keep the single-stroke technical hand, with a faint glow at the nib, and add the hand-lettered note
   face for annotations.
6. **Camera**: a whole-sheet establishing shot on the table, a track along a force path, a close-up cut, and a lateral
   pan across figures.

## How it will be judged

The same three stress moments, before and after, within each style (D-122), with the shader layer on. Kshitij judges
the wow; the lab checks judge readability (layout, contrast, line through a word). Render cost is measured before and
after.

## Correction, same day: direction stays ours

Kshitij, 2026-10-16: "don't copy the direction directly from opuscar. I want our storyboarding and direction to shine.
Our videos are generally much better than opuscar."

What this note takes from the reference is the LOOK only: light, texture, depth and a hero object. The camera items
above (blueprint item 6) are engine capabilities, generic film grammar the engines can perform:
- `D.camera` (blueprint): establish, close-up, track, pan;
- `H.object`'s orbit (hologram).
When and why a lesson uses them is decided by Loom's own direction: the director, pedagogy and the storyboard, with the
per-style direction cards designed in `docs/strategy/2026-10-16-style-direction.md`. That direction is not built from
opuscar's moves, beat structure or pacing.
