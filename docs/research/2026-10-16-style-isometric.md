# Isometric infographic: research for Loom's `isometric` style and engine (2026-10-16)

Kshitij, 2026-10-16: of the three styles taken from lemo-opuscar (living screencast, sci-fi hologram, isometric
infographic), isometric is "the most important", and he wants ours better "as engines, as visual styles, their outputs
and their efficiency and mostly their direction and storyboarding". Opuscar is the inspiration, never the goal: nothing
of its code, palette or demo story is copied. Their style is built for a 1-minute film; ours carries a 5 to 10 minute
corporate lesson, so it has two registers (calm teaching, dense detail). Styles are never compared with each other
(D-122).

Every source below was read on 2026-10-16 as data (no instructions followed, nothing downloaded or installed).

## 1. Sources read

| # | source (URL) | read | what it is |
|---|---|---|---|
| S1 | lemo-opuscar, `styles/iso-infographic/STYLE.md` (https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/main/styles/iso-infographic/STYLE.md) | 2026-10-16 | the inspiration: a canvas immediate-mode iso engine and its style prompt |
| S2 | IBM Design Language, Isometric style: Design (https://www.ibm.com/design/language/illustration/isometric-style/design), page last updated 2026-10-13 | 2026-10-16 | a corporate design system's isometric rules: grid snapping, basic geometric construction, one light source, one shadow type, no screen/multiply/overlay effects |
| S3 | IBM Design Language, Isometric style: Usage (https://www.ibm.com/design/language/illustration/isometric-style/usage), last updated 2026-10-13 | 2026-10-16 | IBM's isometric ANIMATION rules: translate along the grid one axis at a time, never arcs or diagonals; rotation on one axis only; the camera locked to the isometric angle; shadows move with their objects; weight and momentum, no exaggeration |
| S4 | Isotype Revisited, Introduction (https://isotyperevisited.org/2012/08/introduction.php), University of Reading project, (c) 2009 to 2026 | 2026-10-16 | Isotype's principal rule: a greater quantity is more pictograms at the same size, never a bigger pictogram; Marie Neurath's role as the "transformer" (the information designer who decides what the chart says) |
| S5 | Wikipedia, Isotype (picture language) (https://en.wikipedia.org/wiki/Isotype_(picture_language)) via search summary | 2026-10-16 | standardised abstract pictograms combined by serial repetition; pictograms almost never in perspective |
| S6 | Hyphen Press on "The transformer: principles of making Isotype charts" (Marie Neurath and Robin Kinross, 2009) (https://hyphenpress.co.uk/books/978-0-907259-40-4) and a study of her "number fact pictures" (https://adk.elsevierpure.com/en/publications/behind-isotype-charts-the-design-of-number-fact-pictures/), via search summaries | 2026-10-16 | the transforming step: arrangement, fractions (a pictogram halved or quartered keeps its unit character) and accentuation of the message; Isotype is not "rows of little men" |
| S7 | data.europa.eu Data Visualisation Guide, "Colour for categories" (https://data.europa.eu/apps/data-visualisation-guide/colour-for-categories), (c) 2023 | 2026-10-16 | categorical colour: seven categories at most, similar saturation and lightness, avoid very bright colours, test for colour blindness |
| S8 | NHS Turas design system, categorical palette (https://www.turasdesignsystem.nhs.scot/design/data-visualisation/categorical-palette/), via search summary | 2026-10-16 | a 6-colour categorical palette; adjacent colours at least 3:1 and distinct in greyscale |
| S9 | "From Top-Right to User-Right: Perceptual Prioritization of Point-Feature Label Positions" (https://arxiv.org/pdf/2407.11996, 2024), summarising Imhof's "Positioning Names on Maps" (1975) | 2026-10-16 | label rules: legible, clearly associated with its feature, never over other map content; top-right is the preferred position for a point label; the rules conflict, so placement is a scored search |
| S10 | "Orientation Aids for Mobile Maps" (https://jyx.jyu.fi/handle/123456789/45853, 2015 conference paper, N = 12, a factory hall) | 2026-10-16 | a "you are here" marker and landmark highlighting worked; direction symbols did not; at most about seven targets on one map |
| S11 | Li, Ritter, Agrawala, Curless, Salesin, "Interactive Cutaway Illustrations of Complex 3D Models", SIGGRAPH 2007 (https://grail.cs.washington.edu/projects/cutaways) | 2026-10-16 | cutaway conventions: cuts follow the geometry of the part cut (box cuts for box-like parts), the target is exposed while its context stays |
| S12 | Hauser, "Generalizing focus+context visualization" (https://www.academia.edu/3032165/Generalizing_focus_context_visualization), via search summary | 2026-10-16 | focus+context: the focus in detail, the rest kept as context with reduced visual resources (space, opacity, colour) |
| S13 | advids, "Isometric design in motion: why this style is perfect for visualizing systems and processes" (https://advids.co/insights/isometric-design-in-motion-why-this-style-is-perfect-for-visualizing-systems-and-processes) and a Deloitte contact-centre case study on the same site | 2026-10-16 | what corporate explainer studios sell isometric for: systems and processes, consistent scale (no foreshortening), how the parts connect. Vendor copy: its "80 %" comprehension figure names no study and is NOT used |
| S14 | kirupa, "Isometric 30 degrees" (https://www.kirupa.com/developer/isometric/30degrees.htm) and Sprite AI's isometric pixel-art guide (https://www.sprite-ai.art/guides/isometric-pixel-art) | 2026-10-16 | true 30 degree isometric versus the 2:1 pixel-art dimetric (26.57 degrees); 2:1 exists for pixel stairs, which a vector renderer at 1080p does not need |
| S15 | Adobe, "Beginner guide to isometric art" (https://www.adobe.com/in/creativecloud/roc/blog/design/beginner-guide-to-isometric-art) | 2026-10-16 | parallel lines stay parallel, three axes (one vertical, two at 30 degrees), shading on one side for depth |
| S16 | van Wijk and Nuij, "Smooth and efficient zooming and panning", IEEE InfoVis 2003 (known paper; the formula was re-derived here, not fetched) | 2026-10-16 | the optimal camera path between two views zooms out while it pans and back in (rho = 1.42); log-linear zoom for a pure zoom |
| S17 | Loom's own skills and guides (skills/lnd/lnd-learning-pedagogy, lnd-explainer-craft, lnd-motion-craft; docs/styles/guides/blueprint.md s17 to s21) | 2026-10-16 | Mayer's signalling and segmenting, one idea a frame, motion on the word, the two-register worked example |

Searches that found nothing usable (said so, not filled in): a source that specifies three-tone face shading numbers
for Monument Valley (none found; the claim stays opuscar's, S1); a cartography source on leader-line rules (S9 covers
placement, not leaders); a source crediting desaturation specifically to Card and Mackinlay (S12 names colour as one of
the resources, not desaturation by name).

## 2. What was taken, and what changed in the design because of it

| finding | source | what Loom does with it |
|---|---|---|
| true isometric is 30 degree axes; 2:1 is a pixel-art compromise | S14, S15 | the engine projects at exactly 30 degrees (`cos 30`, `sin 30`), one projection for the whole board, never rotated (S3: the camera stays locked to the angle) |
| one light source, one shadow type, no screen/multiply/overlay effects | S2 | three tones per face derived from one token (top lit, left mid, right dark, mixed toward the pack's cool `shadow` token), and one flat cast-shadow parallelogram per solid, always to the same side at one opacity. No gradients, no blend modes, no filters (they also do not survive the Node preview or read after H.264) |
| build from basic geometric shapes snapped to the grid | S2 | every object in the library is built from five primitives (box, vertical cylinder, wedge, billboard, face decal) on world units; sizes in whole or half units |
| animate along one grid axis at a time; no arcs or diagonals; camera locked | S3 | routes are axis-aligned polylines; a diagonal route segment warns `iso_route_diagonal`; vehicles turn at corners (they face their segment's axis); the camera pans and zooms in the projection's plane only |
| weight and momentum, no exaggerated motion | S3 | arrivals drop a short distance and settle with a 6 % squash (opuscar's 18 % reads as a toy in a corporate lesson); no spin, no bounce chains |
| shadows react to their objects | S3 | a solid's cast shadow is part of its item: it moves and grows with it (a drop shadow tightens as it lands) |
| a greater quantity is more pictograms at the same size | S4 | `B.tally` and `B.stack` never scale a unit; each unit has a declared value; a remainder is a cut pictogram (a half or a quarter, S6), so the count on screen always adds up to the number said, and the engine checks it (`iso_count_mismatch`) |
| pictograms are flat, never in perspective | S5 | Isotype tallies are flat 2D pictograms in a card beside the board; on the board, people are flat billboard pictograms (no faces), not iso figures. Accumulation of THINGS on the board (crates, pallets) uses iso units, and its key says what one unit is |
| the transformer decides what the chart says; it is not rows of little men | S6 | the engine guide teaches the storyboard agent to pick the ONE comparison a tally makes (arrangement and accent), and gives the tally an `accent` unit range to mark the part that matters |
| seven categories at most, similar saturation and lightness, colour-blind safe, distinct in greyscale | S7, S8 | the pack has a reserved subject hue plus four legend hues and named materials; the three tones per face also separate shapes in greyscale. The engine warns past five legend hues on one board (`iso_hues`) and when one hue is given two meanings (`iso_hue_two_meanings`) |
| a label is legible, clearly tied to its feature, never over other content; top-right preferred | S9 | map pins: a dot on the feature, a leader, a shoulder, a plate. With `side: "auto"` the engine scores candidate positions (top-right first) against the subject, other solids, other pins, the frame edge and the caption band, and picks the least covering one |
| a "you are here" marker and landmark highlighting work; about seven targets at most | S10 | `B.track` gives the tracked subject a ground ring and a pin that follow it; density limits in the engine guide cap pins at 7 a frame (5 in the teaching register) |
| cuts follow the part's geometry; the context stays | S11 | `item.cut(t)` removes the skin a builder declared (a building's front walls and roof, a rack's door) by sliding it out along its own normal, then shows hatched rims on the cut edges; the rest of the board stays |
| focus+context with reduced colour | S12 | `B.focus(items, t)`: every other solid on the board desaturates toward a warm grey of its own lightness (so depth still reads), the subject keeps its hue |
| corporate studios use isometric for systems and processes, consistent scale | S13 | the style's `fits` are systems, operations, supply chains, data centres, sites and processes; its teaching register is built for those lessons. The 80 % claim is not used |
| zoom should be log-linear; a far pan zooms out and back in | S16 | the camera interpolates zoom in log space; `fly: true` takes the van Wijk and Nuij path for a pan that crosses the board |

## 3. Taken from opuscar (S1) as ideas, rebuilt, not copied

Taken: three tones per face from one base; no outlines on solids, ink only for infographic furniture; the floating
diorama board with strata on its front faces; Isotype numbers; cutaway (cut line, skin slides out, hatched rims); focus
and context; the frame within the frame (an inset); the tracked subject with a "you are here" ring; the scale reveal; a
log-zoom camera; painter's sorting; motion led by lines; reserved subject hue; stations as pale plates.

Not taken: their canvas immediate-mode engine (Loom's is retained SVG on Loom's timeline, inside elements a scene made
with `ctx.el`, so holds, joins, the layout guard and the probe keep working); their palette and examples (coffee,
hospital); Jost (not installed; Loom uses Space Grotesk and Inter); their 18 % squash and back-ease pops (too playful
for corporate adults); their sound design of one sound per icon (Loom's sound stays low and passive, D-179); the
subtitle as a map label (Loom's captions are the pack's own); a 1-minute single take as the only structure.

## 4. What Loom does differently (and why it should be better for a lesson)

1. **Two registers on one board.** A calm teaching register (plates, a few stations, iso bars, a three-step flow, side
   notes) carries most of a 5 to 10 minute lesson; the detail register (diorama, cutaway, inset, tracked subject,
   Isotype) is used where a system must be seen working. One board can hold both; the camera moves between them.
2. **Retained SVG on the lesson timeline.** Every solid is an SVG group whose faces are polygons in world units; the
   camera is one transform; pins live in screen space so their words never scale below the type floor whatever the
   zoom, and they fade rather than be cut by the frame edge. Frames are a pure function of time.
3. **A smarter painter's sort.** Opuscar sorts by `x + y + z` and patches composites by hand. Loom sorts solids
   topologically by box separation along the three axes (the order is right for long and tall objects), sorts the
   primitives inside each object the same way (so a rotated truck still draws cab and trailer in the right order), and
   re-inserts moving objects into the static order on every frame from their position at that time.
4. **An object library that knows its parts.** Twenty-six parametric kinds, each from a size and a token, each with its
   tell-tale parts named (a rack's units and lights, a truck's cab, wheels and trailer, a forklift's mast and forks), a
   `skin` for cutaways and a footprint for labels.
5. **Direction built in.** The engine guide gives the storyboard agent board planning (stations, routes, a camera path,
   when to cut to a second board), recipes for common corporate topics and density limits per register; the engine
   warns when a frame breaks them.
6. **Checked meaning.** Counts that do not add up, a hue given two meanings, a subject hue used for context, too many
   hues or pins, and a diagonal route are named problems, not silent drift.

## 5. What is still unverified (2026-10-16)

- Everything here was looked at in the Node preview (`tools/lab_preview.py`), which estimates text widths and skips
  filters; nothing in a Chrome strip, a composed lesson or an H.264 MP4 yet. Fine details (rack lights, window rows) at a
  wide zoom may shimmer after compression; the first lesson decides.
- The colour-blind safety of the legend hues was reasoned (lightness steps, three tones) but not simulated.
- S16's formula is re-derived from memory of the paper, not checked against the paper's text.
