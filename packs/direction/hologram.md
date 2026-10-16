# Direction card: hologram

A calm operations console in light, for the systems a learner cannot see: AI, data, networks, security.
Most of the lesson briefs calmly; the moment that makes it worth watching is the HERO, and the plan must ask for it.

## Signature moves, and when each fits
- **The hero moment** (1 or 2 beats a lesson, analysis register): the lesson's one subject, made of light.
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
- No hero on a briefing beat, no idle spin, at most 2 hero beats; every reading's value comes from the knowledge sheet.

## The soft check
The storyboard gate warns `holo_no_hero` when no scene has a `hero3d`, a `design.hero` or an `H.object`.
