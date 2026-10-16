# Direction card: blueprint

A technical drawing drafted live, for how a thing is built, how it moves and how its parts depend on each other.
A drawing set has many sheets, each a different view; a lesson that stays on one sheet reads as one repeated diagram.

## Signature moves, and when each fits
- **Changing layouts** (every lesson): the sections are sheets of one set, each with its own composition: the general
  arrangement, a plan, a section through it, an elevation, a schematic of the flow, a detail. Change the sheet when
  the question changes; a camera lean-in on the same sheet (`D.camera`) is not a new layout.
- **Detail sheet** (at most 1 beat in 3): DETAIL A on its own station: one part enlarged, cut open (`D.section`),
  measured (`D.dim`, live when a measure changes), numbered (`D.balloon`), with the verdict in `D.titleBlock`.
- **Extrude** (`D.extrude`, once or twice a lesson): a flat face gains depth when the lesson moves from the plan to
  the thing itself.
- **Mechanism** (`D.mechanism`, `D.step`): when the content is a cause that turns or repeats (a pump, a fan, gears, a
  belt, a cycle); one moving part at a time.
- **Exploded view** (`D.explode`, with a `D.fig` rewrite): what is inside, part by part.
- **The hero** (`D.hero`): the one real thing on a sheet.
- **Change and proposal:** `D.cloud` for "this changed", `D.overlay` for "this is proposed".

## Outline (pass 1)
- Give each section a sheet and say which view it is; no two neighbouring sections share a view.
- Hold a sheet inside a section and change it at the section boundary; a section of more than about 6 beats gets a
  second sheet or a detail.
- Place the extrude, the mechanism and the exploded view on the beats whose narration is about them.

## Storyboard (pass 2)
- One station per sheet; a detail is a nested station (a `zoom` join) or its own station (a `cut` with a FIG label).
- No station carries more than about 60 % of the narration.
- Teaching beats on a sheet use cards and connectors (`D.card`, `D.connect`); dimensions only when a measure is the point.

## Not this style
- People are Lucide icons with a lettered role until a designed blueprint kit exists; no more than 7 parts and 4
  dimensions on a detail sheet.

## Motion in this style (D-190)
- Drafted, not animated: outline, then detail, then dimension, in reading order. Flow travels along the pipe it belongs
  to; parts never bounce or slide on their own.
- A sheet is changed like paper: the next sheet replaces it at a section boundary; the camera holds a sheet and moves
  between sheets, never during a drawing.

## By kind of video
- Explainer: one plant, its mechanism running (`D.mechanism`), replayed on the last sheet.
- Teaching: a detail sheet per step, and the check is a fault found on a sheet.

## The soft check
The storyboard gate warns `bp_one_layout` when one station carries more than 60 % of the narration (6 beats or more).

## Templates (D-198)
- A catalog template is drafted by the nib; long sentences print beside it. No people template.
