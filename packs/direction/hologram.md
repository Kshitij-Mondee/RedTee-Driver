# Direction card: hologram

A calm operations console in light, for the systems a learner cannot see: AI, data, networks, security.
Most of the lesson briefs calmly; the moment that makes it worth watching is the HERO, and the plan must ask for it.

## Signature moves, and when each fits
- **Holograms carry the film** (D-194: at least one hero per 8 beats, more where the subject is seen working; each
  subject of the lesson may have its own): the subject and its parts made of light. Console panels are the minority.
  - A physical thing whose shape teaches (a bicycle, the earth, a server rack, a phone, a chip, a data hall): a 3D hero.
    Write `hero3d` on the storyboard scene (a library model, `use_tool(["three"])` lists them); the author locks and
    reads its parts with `H.hero3d`, `H.lock`, `H.reading`.
  - An abstract subject (a model, tokens, attention, a pipeline): push the SVG. `H.plane` sheets in depth on `H.stage`,
    `H.tokens`, `H.arcs`, `H.trace`, `H.dist`. Declare it with `design.hero` (what the hero is and how it is drawn).
  - A shape that matters for a few seconds only: `H.object` on `H.pad`.
- **Brief, lean in, come back:** briefing about 2 beats in 3; analysis at most 1 in 3, entered with `H.through`,
  left with `H.pull`, ending on something kept (a status, a verdict).
- **Globe or mesh with traffic** (`H.globe`, `H.mesh`): only when where things are, or how they connect, is the point.

## Outline (pass 1)
- Name the hero subject in the concept and choose 3D or pushed SVG, with the reason.
- Put the hero beat where the subject is first seen working (the turn or the reveal), not on a definition.
- A lesson with no physical subject still plans one pushed-SVG hero beat.

## Storyboard (pass 2)
- On the hero beat: `"hero3d": {"<name>": {"rect": [x, y, w, h], "dur": s, "params": {"model": "<id>", ...}}}`,
  times from the beat's start, the rect clear of the caption band (y + h at most 930), `dur` within the beat.
- Name in `design.beat_sheet` the parts to lock and the spoken word for each; one lock at a time.
- A hero kept for a second beat is declared on that beat too.

## Not this style
- No idle spin; no beat of console UI alone where a hologram can show it; at most 10 % templates; every reading's value
  comes from the knowledge sheet.

## Motion in this style (D-190)
- Light arrives in place: it draws on, scans, traces. A panel never flies across another, and words never shrink to fit:
  lean the camera in (`H.through`) or make room.
- A moving thing is a signal on a path (`H.trace`, `H.arcs`), one at a time; the frame holds while the light works.
- Joins: hold the stage (`H.stage`) across a section and change what is on it; a copy redrawn from nothing replays the beat.

## Its use, and words (2026-10-17)
- Mostly a concept and one example: shown working, then a concrete case run on the console. Teaching: the same,
  a lock (`H.lock`) per step. Words: labels and readings, about 14 a beat; the narrator says the rest.

## The checks
The storyboard gate refuses (D-194) `holo_heroes_few` (fewer than one hero beat per 8), `holo_hero_model` and
`holo_ui_templates`; the engine audit refuses `holo_hero_unplaced`, `holo_hero_missing`, `holo_hero_not_drawn` and
`holo_ui_heavy` (under 75 % of beats showing a hologram).
