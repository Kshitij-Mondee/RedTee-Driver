# Glow Flat: the style guide

STATUS: PARTIAL (round 2 review, 2026-10-07). Pack `packs/styles/glow-flat.json` (its `guide` key points here).
Builders in `runtime/glow.js`. Worked examples: `scenes_examples/style_glow_flat_handover.js` and
`scenes_examples/style_glow_flat_focus_day.js`. Every API, option and line number below was read in `runtime/`,
`loom/` or `docs/SCENE_API.md` on 2026-10-07 (round 2). Contrast ratios and the film check's hue bins were
recomputed in round 2 with the WCAG formula and the check's own thresholds (a short Python run of the formulas in
`loom/checks/style_lint.py` and `loom/checks/film.py` `_tone`). Numbers marked **(round 1)** come from the first
pass and were not re-run here. Nothing in this guide has been judged on a Chrome render or an MP4 of this pack
version (s15).

This guide compares versions of glow-flat with each other only. It never ranks glow-flat against another style
(D-122). The register is inspired by techniques measured in the newer Kurzgesagt videos; every design, character
and composition made in it is original.

## 1. Purpose and register

Glow-flat is a saturated flat world that glows on a deep indigo ground: colour fields instead of lines, gloss
volumes with no outline, one light that matters, pill labels sitting on the things they name, and quiet life in
every frame while only one thing changes the meaning. It is for corporate adults learning something that has a
mechanism: how stress works, how a handover or an incident flows, why a habit compounds, what happens inside a
system, change and strategy told as a world. It feels curious, warm and confident, never cute. It fits the pack's
`fits` (explainer, change and strategy, wellbeing, science and systems, onboarding, teaching). It must not carry the
pack's `avoid_for` (sober compliance, verbatim legal policy, dense tables) or anything that must look like a
document of record: the glow makes every sentence feel like spectacle, and a policy clause is not one.

**References (study, never copy or republish; every design stays original):**

| reference | where | take | do not take |
|---|---|---|---|
| Newer Kurzgesagt videos (5 local files, studied privately) | `docs/research/kurz/2026-10-01-kurzgesagt-study.md` | colour fields with light, not line work; one hue family per shot plus one accent; pill labels on things; one state change per word over constant quiet life; the returning comparison pair; gloss volumes (base, darker band, one highlight) | their characters, birds, mascots, logo, exact palette, compositions; their entertainment pace (92 to 99 % of seconds moving, about 155 wpm, round 1) for procedure lessons |
| The Stress video moments at 2:39, 6:55 and 9:53 | same study, table "The animation itself" (lines 152 to 154) | a status panel whose icons go dark one per named function (our `G.hud`); a stat pill on a leader line (our `G.stat`); the same body under a different threat | the horror treatment of ordinary work messages; the anger mark and sweat drop of 9:53 on adult learners |
| TED-Ed films of the "glow technical 3D" family | `docs/research/vision/tedEd_2026-10/colour_and_tone.md` line 53 | cool, saturated, one accent on the named thing in most shots (accent shots 36 %) | its brightness (0.48) as a target; this pack's `tone_reference` is the Kurzgesagt measure |
| Rim light in flat illustration (general craft) | e.g. Icons8 blog, "Vector illustration basics"; Clip Studio rim-light tutorials (links not checked in round 2) | a thin bright edge on the side facing the light separates a dark shape from a dark ground without an outline | soft airbrushed gradients on every object; plastic gloss on text panels |

## 2. Palette roles

Ratios: WCAG, recomputed in round 2. Area shares are for a settled frame of a bespoke beat.

| token | hex | role | may appear | never | area share |
|---|---|---|---|---|---|
| field | #120F3A | the deep ground under everything | frame base, `G.ground` bottom | as the fill of anything the narration names | bare field under 35 % |
| field2 | #1E1957 | top of the graded ground | `G.ground({top})`, nebula | as a text colour (1.15:1 on field) | part of the 40 to 60 % of colour fields |
| surface | #2C2578 | lifted ground: desks, rails, card bodies, colour-field blobs | sets, panels, `G.ground` fields | as the only separation between a shape and the field (1.42:1) | 15 to 25 % |
| surface2 | #231D66 | darker furniture fronts, track beds, hud and compare panels, card bodies | `G.hud`, `G.compare`, desks | as a text colour (1.25:1) | inside the 15 to 25 % |
| plum | #4A1D7A | warm-violet colour field, hills | `G.ground` fields and floor | as a text or line colour (1.51:1 on field); ink ON plum is fine (11.39:1) | in the colour fields |
| violet | #8C6CFF | the lit edge of the field family: desk tops, a neutral pill, bloom | lit tops, neutral labels (onAccent text 4.94:1) | the accent of a beat | under 8 % |
| deep | #0B0930 | the darkest step: bottom of grounds, rig line colour | `G.ground` bottom, `characters.ink`, chapter extrude | text | edge darkness only |
| ink | #FFF8EE | all body and title text, captions | text on field, surface, surface2, plum | fills over 2 % of the frame (a white hole: `document.page` paints a 760 x 780 ink page, s10) | under 5 % |
| muted | #BDB6F4 | secondary text, neutral objects, people's clothes (`characters.cloth`) | labels, hour marks, meeting chips, shirts | the meaning of a beat | under 10 % |
| line | #8E85D8 | connectors, axes, arrows, dashed routes | `kit.line`, `kit.path`, `kit.arrow` defaults; trousers until `characters.bottom` lands (s8) | text | under 2 % |
| accent | #FF9B3D | warm accent (orange); also the hard-coded wood and chairs of `Loom.place` furniture (s9) | one meaning per lesson | a beat that already spends its accent family elsewhere | 3 to 8 % when it is the beat's accent |
| accent2 | #FFD24A | values and terms (the default colour of every template value role, s10), caption active word | big numbers, the spoken word | fills over 8 % (glare) | under 5 % |
| accent3 | #FF4F8B | hot pink: alarms, pressure, warnings | one meaning per lesson | backgrounds | 3 to 8 % when it is the beat's accent |
| accent4 | #35D6E8 | cyan: the default tone of `G.pill`, `G.hud`, `G.stat`, `G.compare` left | the beat's meaning | people's clothes | 3 to 8 % when it is the beat's accent |
| pos / neg | #7BE36A / #FF5A6E | right and wrong, done and blocked | marks, ticks, crosses, a state | decoration | under 3 % |
| glow | #8FF4FF | electric light: crackle, dust, shafts (`G.shafts` default) | `G.crackle`, dust | text | under 2 % |
| core | #FFF3C9 | warm light: lamp, inner core, payoff glow | `G.glowDisc`, light cones, sparkles | text fills | under 3 % plus its halo |
| shadow | #0A0826 | object contact shadows (`Loom.obj` draws one ellipse at 0.35) | objects | anything else | under 2 % |
| onAccent | #120F3A | text and icons on every saturated fill | pill text, icons on accent discs | text on the field | |

**Text pairs that pass (round 2):** ink on field 17.24:1, surface 12.12, surface2 13.84, plum 11.39; muted on field
9.66, surface 6.79, surface2 7.76; accent2 on field 12.61, on surface2 10.12; accent4 on field 10.33; accent on field
8.66; accent3 on field 5.84; onAccent on accent 8.66, accent2 12.61, accent3 5.84, accent4 10.33, pos 11.29, neg
6.01, violet 4.94, muted 9.66. Captions: pill rgba(11,9,48,0.86) over field composites to #0C0A31; ink on it
18.05:1, accent2 (active word) 13.20:1 (`caption_ratios()` in `loom/checks/style_lint.py`).

**Forbidden pairs (round 2):** ink on accent2 1.37, accent4 1.67, glow 1.20, core 1.05, pos 1.53, accent 1.99, neg
2.87, accent3 2.95 (use onAccent on every saturated fill); ink on violet 3.49 (use onAccent); any text coloured
field2, surface2, surface or plum on the field (1.15 to 1.51); text over a `G.glowDisc` halo (a moving luminance
field: put the pill beside the glow, never on it).

**Hue families: what the film check counts.** `tone_checks` (`loom/checks/film.py` lines 365 to 434) counts a pixel
as saturated when its saturation is over 0.5 and its brightest channel over 90, bins hues into 12 bins of 30 degrees,
keeps bins covering 1.5 % of the frame, merges neighbouring bins, and warns above `max_hues` 2. Recomputed for this
palette in round 2:
- surface, surface2, plum and violet are saturated and all fall in bin 8: **the field family always counts as one**.
  field, field2 and deep are too dark to count; ink, muted, line, glow and core are not saturated enough to count.
- accent (bin 0), accent2 (bin 1), accent3 and neg (bin 11) are neighbours: when each covers 1.5 % they merge into
  one warm family; accent3 with accent2 and no accent between them counts as two.
- accent4 (bin 6) and pos (bin 3) are each a family of their own.
- skin indexes 2 and 3 (#A86F4C, #7A4B32) are saturated, bin 0: a face and hands covering 1.5 % of the frame count
  as the warm family (s8).

So the rule is: **field family plus ONE accent family per beat** (2, the check's limit). A deliberate contrast the
narration names (before and after, safe and unsafe) may add a second accent family; it will measure 3 and warn, so
name it in the storyboard's `accent_on` and expect the warning. Never three accent families. Round 1 measured 86 %
of 341 Kurzgesagt keyframes at two families or fewer and 99 % at three or fewer, counting with the same function
(round 1).

**Brightness:** the Kurzgesagt keyframes average 0.42 (pack `tone_reference`, round 1); the stress-signal lesson
averaged 0.25 with 70 % dark beats (round 1). Target a settled frame at 0.30 to 0.50 measured by `tone_checks`: let
mid-tone colour fields (field2, surface, plum, violet) cover 40 to 60 % and keep the bare field under 35 %.

## 3. Type

Faces loaded by the pack: Fredoka 600 and 700 (display), Nunito 700 and 800 (body), JetBrains Mono 400 and 700.
`style.font(role)` (`runtime/style.js` lines 65 to 73) sends display, hero and title to Fredoka, `label` to Fredoka
too (pack `fonts.roles.label: "display"`), and every other role to Nunito. With no `weight`, `kit.text` uses the
heaviest loaded weight for display, title and hero (Fredoka 700) and the second loaded weight for the rest (Nunito
800, Fredoka 700 for label) (`runtime/kit.js` line 306).

| role | family | size (pack) | use in glow-flat |
|---|---|---|---|
| display, hero | Fredoka | 110 to 170, 96 to 150 | one big number or a chapter word; at most one per beat |
| title | Fredoka | 60 to 92 | template titles and terms, at most 6 words |
| label | Fredoka | 26 to 32 | one- to three-word pills (`G.pill` default role, weight 700) |
| lead | Nunito | 34 to 44 | a pill that carries the beat's meaning, definitions, subtitles |
| body | Nunito | 30 to 36 | sentences on panels and UI artefacts |
| caption | Nunito | 22 to 26 | only when it fits at 26 (hour marks); the film check warns under 26 px |

- There is no `mono` type role in this pack: `kit.text(..., {role: "mono"})` raises `unknown_type_role`
  (`kit.js` line 415). JetBrains Mono is loaded but unused by the kit; write codes in body.
- Weights: ask only for loaded weights. Fredoka has 600 and 700, Nunito 700 and 800. Several builders ask Fredoka for
  800 or 900 (s10 and s15, "font weight clamp"); whether Chrome synthesises bold there is unverified.
- Sentence case everywhere. Caps only through `kit.kicker` (at most 4 words, tracking 0.2em, accent2, `kit.js` line
  476). No italic (no italic faces are loaded).
- Fredoka is rounded and friendly: for corporate adults it stays on titles, numbers and pills of one to three words.
  A sentence in Fredoka reads like a children's book; sentences are Nunito (lead or body).
- Line length on panels 28 to 52 characters. A pill is always one line (`G.pill` fits with `maxLines: 1`, max width
  520 px, `glow.js` line 426).
- Numbers: a number that stands alone is Fredoka (display, hero or title) in accent2; a number inside a pill takes the
  pill's role (lead, Nunito 800) in onAccent. Units live in the same string ("3 h focus", never "3" and "hours").
- On-screen text never under 26 px after camera scale (film check: warns under 26, fails under 18).

## 4. Shape language

- **Radius ladder:** pills full-round (`r = h / 2`, `G.pill`, `kit.pill`); cards and panels 24 (pack
  `shape.radius`); chips and slots 22; furniture tops 14 to 18; tickets 12. Use the ladder by size: the AI-tells
  ledger reports the share of the single commonest radius over all rects 40 px and up (`one_radius_share`,
  `loom/checks/variety.py` line 254; baseline worst 0.40, ratchet on growth). Keep it at or under 0.40.
- **Strokes: none on shapes.** Gloss `kit.rect` draws no outline, only a 2 px rim of the fill lightened 35 % at
  opacity 0.45 (`kit.js` line 116); gloss `kit.disc` draws no rim at all (lines 158 to 168). Strokes exist only as:
  connectors and routes (`line`, 4 px; `dash: "4 14"` for a route), pill leaders (the pill's tone, 4 px, ending in a
  dot of radius 7, `glow.js` lines 430 to 434), the tone frames that `G.hud` (4 px) and `G.compare` (5 px) draw, and
  the 3 px tone outline of an open `G.ticket` (`glow.js` line 398, it reads as "open"). Never draw a rod, stem or limb
  with `kit.line`: use `kit.polygon` (the handover lamp stem).
- **Card:** `kit.rect(..., {fill: "surface2"})`; a lifted card is surface on surface2, never a drop shadow
  (`shape.shadow: "none"`). In a seeded lesson `kit.card` draws the seed's panel treatment; use `kit.rect` or
  `T.panel` deliberately.
- **Label:** `G.pill` on or beside the thing, with `point: [x, y]` at the thing; the tone is the category. In a lesson
  with a design seed (the default for new lessons) `G.pill` draws the seed's label treatment (tag, ribbon, flag ...,
  `glow.js` lines 410 to 424); that is intended (D-81), and the placement rules here apply to whatever treatment it
  draws. `as: "pill"` forces the pill for one call; use it only where the pill shape itself is the point.
- **Badge or icon disc:** gloss `kit.disc` (a darker lower-right crescent, one white highlight up-left at 0.42, a
  catch-light at 0.6).
- **Arrow:** `kit.arrow(..., {stroke: "line"})` (shaft 5 px); an arrow that carries the meaning takes the accent.
- **Divider:** none. Separate by colour field and space.
- **Joins of strokes:** round caps and joins (the kit sets them).

## 5. Light, shading, depth and texture

**The gloss recipe (what the kit draws; `runtime/kit.js` lines 107 to 118 for rects, 158 to 168 for discs):**
1. Base fill in the token colour.
2. A darker inner band: rect, the bottom `min(24 px, 24 % of h)` darkened 20 % (toward black, `style.js` line 25),
   clipped to the shape; disc, the whole disc darkened 24 % under an up-left offset copy, which leaves a lower-right
   crescent.
3. One highlight: rect, a white strip near the top at 0.16 (only when the rect is 25 to 219 px tall); disc, a white
   ellipse up-left at 0.42 plus a catch-light at 0.6.
4. Rect only: a 2 px rim, the fill lightened 35 %, at 0.45.
5. No outline, no drop shadow.

Light comes from the top left, always; it never rotates with an object. Pass `flat: true` for things that must read
as print (a line inside a ticket, a progress fill) and `crisp: true` for thin bars (both skip the gloss).

**Glow:** `G.glowDisc(p, cx, cy, r, token, {rings, spread, opacity, core, coreOpacity})` draws concentric translucent
circles, no filters (`glow.js` lines 82 to 89; defaults rings 6, spread 2.2, opacity 0.22, core on at 0.9).
- One meaningful glow per beat (the lamp, the payoff, the alarm core). Ambient light does not count but stays faint:
  `G.shafts` opacity 0.06 to 0.12 (default 0.22 is too strong here).
- Core `r` 20 to 70 px, `spread` 2.2 to 3.4, `opacity` 0.10 to 0.30.
- When `r * spread` exceeds 150 px, use `rings` 12 to 14 with `opacity` at most 0.14: the default 6 rings showed as
  bands on the focus-day preview (round 1).
- Never put text inside a halo. Never add a glow to a pill, a text panel or a person yourself. `G.hud` and
  `G.compare` draw their own faint halo (0.10 and 0.08) behind their frame; that is their design.

**Ground:** every bespoke beat starts with `G.ground` (`glow.js` lines 93 to 135: a linear gradient top to bottom, a
radial bloom, 4 seeded colour-field blobs, optional hills, twinkling dust). For a corporate topic: `top: "surface"`
or `"surface2"`, `bottom: "field"`, `bloom: "violet"`, `bloomOpacity` 0.45 to 0.6, `fieldOpacity` 0.5 to 0.6, `dust`
40 to 60 (the default 120 reads as space), `floor: false` when the bottom of the frame is furniture. A ground with no
place in the beat counts as wallpaper in the variety ledger (`variety.py` line 194): give every ground beat a set
(a `desk` element, `G.ticket`, `Loom.place.*`, `ctx.scenery`, `ctx.depth`; the ledger matches these names in the
source, `variety.py` line 58).

**Depth:** three layers at most: ground (colour fields), the set (desks, rails), the meaning (pills, tickets, the one
glow). For more, `ctx.depth` (its own dolly) or a `Loom.place` (layers far, mid, near), where `Loom.cam.push`, `pan`
and `pull` move the layers (`runtime/places.js` lines 448 to 460; they take a place, not a bare scene).

**Texture and finish:** none in the drawing. Pack `fx.grain` 0.01 (D-100, near-off). Pack `fx.vignette` 0.35: by the
`fx.js` formula (line 84) the corner alpha is 0.30, 0.15 at 200 x 150 px from a corner and 0.09 at 300 x 200 px
(computed, not seen on a frame). The vignette sits over the world, labels included (only captions are above it).
The nebula shader (`fx.colors` violet, plum, surface) shows only where no `G.ground` covers it.

## 6. Composition

- Safe area `ctx.box` = {x 96, y 84, w 1728, h 846}; the caption band is the bottom 150 px (caption pill top at y
  948, Nunito 800 38 px, radius 22). Furniture may run under the caption band (a dark bed for the caption); text,
  pills and faces never.
- **Density:** full through colour, not through objects. A settled frame: colour fields 40 to 60 %, set and objects
  15 to 25 %, the accent family plus its pills 2 to 8 %, ink text under 5 %. Round 1 measured the accent family at
  1.6 % (handover preview, cyan) and 3.5 % (focus day), and 9.1 % cyan in stress-signal b05 (dress, two pills and the
  status panel shared it).
- **Focal point:** one per beat, the element the narration names (`accent_on`). It is the only thing in the accent
  family, or the brightest thing, or the thing that just moved; never all three on different elements.
- **People:** waist-up behind furniture, `ava` or `sam` at scale 0.64 to 0.86, feet below the frame (y 1000 to
  1180), so the head top lands at y 380 to 560 (estimated from the rig, not measured). A full figure on an open
  field reads as a sticker; anchor every person to a desk, a floor or a seat.
- **Empty space:** the upper third may be field when a colour field or a faint shaft lives there. A frame that is
  half bare field reads as a slide (stress-signal b02 and b08, `projects/stress-signal/qa/sheets`).
- **Text near pictures:** a pill sits 60 to 110 px from its thing on a leader and never more than 400 px away; pills
  at least 16 px apart. Labels ride WITH a moving thing (drawn inside its element). Keep pills out of the 200 x 150 px
  corners (vignette, s5).
- **Corners and edges:** no word within 24 px of the frame edge (the film check errors on words cut by the edge).
- **Captions:** the pack's caption pill (rgba(11,9,48,0.86), ink words at 18.05:1, the spoken word in accent2 at
  13.20:1) sits at y 948. Nothing that must be read lives below y 930, and no accent2 element sits directly above the
  pill, where it competes with the active word.
- **Chapter chrome:** a chapter is a `title.card` beat (`accent: "accent2"`, kicker of 2 to 3 words, title at most 6
  words, centred, one icon or none), at most one per 60 to 90 s. `Loom.data.chapter` (a sting over
  the world: field dim 0.62, Fredoka 900 title with 4 deep extrude copies, `data.js` lines 200 to 229) asks for a
  weight the pack does not load; avoid it until the weight clamp lands (s15).

## 7. Motion

- Personality "lively" (pack `motion`): enter 0.48 s, move 0.36 s, exit 0.28 s, stagger 0.07 s, draw 0.75 s, count
  1.1 s, overshoot on. `m.travel` defaults to 2 x move = 0.72 s.
- Overshoot is for pills, stat pops, small tokens and a burst (`m.pop`, `G.stat`, `G.burst`). Panels, text blocks and
  furniture settle without it: `m.pop(E, t, {overshoot: false})` (`motion.js` line 35), or `m.settle`, `m.reveal`.
- **One meaning change per spoken word,** on `ctx.cue("literal words")` (80 ms lead). Nothing revealed after 85 % of
  the beat's speech (SCENE_API Rules). Background life is constant and quiet: `G.idle` bob 3 to 6 px at a 2.4 to 2.6 s
  period, dust twinkle, shafts breathing between 0.65 and 1 of their opacity (0.9 rad/s, `glow.js` line 337), a crackle only on a person under pressure in the
  story.
- **Entrance mix:** pop and settle together under half of a lesson's entrances (the ledger's `pop_settle_share`,
  baseline worst 0.54). Glow-flat entrances that fit: pop (pills), settle (objects onto furniture), grow (a value
  block, `axis: "x"`), unmask (a dashed route, until the m.draw fix lands, s15), draw (a solid connector), iris (an
  icon disc), travel with an arc (the hop, recipe C). **Never:** typewriter on pills, stamp on people, spins, wipes
  across a glow.
- **Pointer pills:** at most one new pill with a leader per beat; across a lesson keep `pointer_pill_share` (pills
  with `point` out of all labels) at or under the ledger baseline 0.22.
- **Camera:** continuous moves inside an idea (`Loom.cam.push`, `pan`, `pull` on a place; `ctx.depth` dolly); hard
  cuts at idea boundaries; a pull-back or a burst is a chapter-sized moment, at most once a minute.
- **Effects budget:** `G.burst`, `G.vortex` and `G.crackle` are loud: at most one per minute, only where the narration
  is about pressure or alarm, never behind text the viewer must read, never on a workplace process beat.
- **Chained moves on one element:** never call `m.travel` twice on the same element. Each call is a `Loom.drive`
  with no key (`motion.js` lines 211 to 214), every unkeyed drive renders its start state at load (`core.js` lines 111
  to 116), so the second call's start (the first one's destination) shows from frame 0. Use a carrier element for one
  axis and a keyed `Loom.drive` for the other (recipe C).
- **Joins and transitions:** the pack's `join_default` is `camera`: inside one world, a camera move carries the eye.
  Between worlds a camera join becomes a dip unless `join_in.continuous: true` (SCENE_API "Layering and joins").
  Material joins that suit this register: `fill` (a colour-field shape in a field-family token grows to become the
  next ground) and `handoff`. Never `torn`, `page` or `scroll` here (they read as cartoon material). Screen joins:
  `dip` and `fade` only; one join material per lesson. Bespoke beats build their ground and set at `ctx.start`, so
  the join frame is never an empty field.

## 8. People and living characters

- Characters come from designed kits only, never drawn in scene code (CLAUDE.md rule 11,
  `skills/lnd/lnd-character-design`).
- The code kit offers `ava` and `sam` (`runtime/rigs/people.js`: flat shapes, one darker shade per volume, no
  outline) and the outlined bean rigs `pip`, `tess`, `extra` (`runtime/rigs/beans.js`). **In glow-flat cast `ava` and
  `sam`.** The beans break the no-outline rule (stress-signal b03 to b10: a thick deep outline round a cyan bean,
  stick arms with ball hands).
- Clothes: the pack dresses people in `muted` (`characters.cloth`). Dress one person in an accent only when that
  person IS the meaning of the beat (`top: "accent3"` for the one under pressure).
- Trousers default to `field2` (`rig.js` line 40), 1.15:1 on the field: invisible. Keep people waist-up; a standing
  figure gets `bottom: "line"` until `characters.bottom` lands (s15).
- Eye whites are drawn in `surface` (`rig.js` line 41, `people.js` line 62), which is #2C2578 here: dark sclera with
  a deep pupil. Found in code, not judged on a frame; keep faces under about 120 px tall until a frame shows it reads.
- Hair: the pack's `hair_colors` (#4E3A3F, #5C3A30, #4A3640, #8A5530) measure 1.64 to 2.96:1 on the field. With no
  `hair` option the rig takes hair index = skin index (`rig.js` line 39).
- Skin: cast skin by the story, never to satisfy a check. Indexes 2 and 3 are saturated by the film check (s2): once
  a face and hands cover 1.5 % of the frame (about 31,000 px at 1080p) they count as the warm family. A waist-up
  person at scale 0.86 or less should stay under that (estimated from the rig, not measured); if the check warns on a
  cyan or green beat, scale the person down or move the camera.
- Crowds: `ctx.crowd` draws what the pack's `characters.extras` says, today `"silhouette"` (the outlined grey bean).
  That conflicts with the no-outline rule (s15 asks for a pack decision). Until then: no `ctx.crowd` in glow-flat;
  bystanders are `ava`/`sam` at scale 0.5 or less in the far layer, in muted, with no accent.
- Template people (`avatar`, `scenario.dialogue`) are Open Peeps busts (`kit.peep`), line art with an outline. Use
  them at most once a lesson (s10).
- The acting until a designed cast exists: poses idle, explain, point, wave, think, shrug, cheer, present; gestures
  wave, nod, shake, beat, shrug; emotions neutral, happy, surprised, concerned, focused; `look(dx, dy, t)`.
- Never: cartoon symbols (anger marks, sweat drops) on adult learners; a person replaced by a "user" icon on a disc
  (stress-signal b07); a top-down person improvised in code (no rig has a top-down view).
- A designed glow-flat cast does not exist yet: the prompt is at the end of s14.

## 9. Objects, icons, data and UI

- **Things are drawn as things:** `Loom.obj.draw(ctx, name, kind, {x, y, size, tone, family, state, t})` or
  `Loom.obj.shape(g, kind, cx, cy, size, o)` (document, envelope, calendar, clock, phone, laptop, folder, package,
  building, heart, bulb, lock). **Always pass `tone`**: without it an object takes a default accent (calendar
  accent3, envelope accent2, clock accent4, package accent; `objects.js` lines 89 to 90) and spends a hue family.
  Neutral objects take `muted` or `surface2`; the named one takes the beat's accent. A laptop on a desk faces its
  user (`state: {facing: "away"}` seen from the camera side).
- **Icons:** Lucide via `kit.icon`, stroke 2.2 (pack `icons.stroke`; the glow builders use 2.4), colour onAccent on an
  accent fill, ink on surface. Pass `G.token("onAccent")` so the scene restyles. One icon family per beat; icons at
  60 px or more count against `hero_icon_rate` in the ledger: use an object instead.
- **Work items:** `G.ticket(g, x, y, {tone, state: "open" | "done", rot, w, h})`: open is a surface2 body with a 3 px
  tone outline, a tone header and a tone dot; done is a surface body, a muted header and a tick (`glow.js` lines 394
  to 404).
- **Numbers:** a number lands as a pill on its thing (`G.pill`, role lead), as `G.stat` on a leader line, or as
  `Loom.data.counter` (default colour ink; pass `color: "accent2"` for the value) for a count that runs. Never a
  number card floating on the field.
- **Charts:** data as a lit object first (a rail, a stack of tickets, `Loom.data.unitGrid` with `color` the accent and
  `off: "muted"`). A conventional chart (`chart.bars`, `Loom.data.barsOn`, `Loom.data.dipLine`) sits on a panel
  (`kit.rect` surface2) over a `G.ground`; on the bare field its axes float (`docs/styles/demos/lab/lab_data__glow-flat.jpg`).
  `dipLine` defaults to `neg`, `barsOn` to accent3 and accent: pass the beat's accent.
- **Mail, chat, document:** `Loom.ui.mail`, `.chat`, `.doc` with real words (fill `surface` by default, crisp, no
  gloss), framed by a surface2 panel. Mark the one phrase with `Loom.ui.mark(ctx, A, key, phrase, t, {tone})`
  (default accent2). Known colour leaks: the sender avatar disc takes one of four accents from a hash of the name
  (`ui_artefacts.js` lines 39 to 42), a link is accent, a button accent, the learner's own chat bubble accent. Pass
  `link.tone`, `button.fill` and pick sender names whose disc lands in the beat's family until `roles` lands (s15). A
  glowing email reads as a threat: glow an artefact only when the narration says it is one.
- **Status builders:** `G.hud` for functions switching off one per word (`hud.dim(i, t)`); `G.gauge` for "you are
  here"; `G.compare` for the returning pair (`cmp.value(side, text, t)`); `G.stat` for one stat on a leader.
- **Loud builders need explicit colours:** `G.burst` `layers` (default accent3, accent, accent2, core), `G.vortex`
  `colors` and `core` (default plum, violet, plum, accent3 and an accent2 core), `G.orbit` `tones` (default five
  families), `G.swarm` `colors` (default five), `G.sparkles` `color` (default accent2 and pos). Always pass them
  from the field family plus the beat's one accent.
- **Underwater builders** (`G.coral`, `G.fan`, `G.kelp`, `G.rock`, `G.swarm` fish and cells) are for science worlds
  only, never on a workplace topic.

## 10. Templates in this style

Templates draw no `G.ground`. On a fresh station they sit on the nebula; after a bespoke beat on the same station
they get a backplate: a field-coloured veil at 0.94 and a 9 px blur of the picture (`runtime/world.js` lines 317 to
341). Either way a template beat is flatter than the bespoke beats around it (stress-signal b02 and b08). At most one
template beat in three, never two in a row, placed where a rest is meant.

| template | colours it draws (runtime) | set or avoid in glow-flat |
|---|---|---|
| title.card | kicker accent2, title ink (Fredoka), rule and icon disc in `accent` prop, subtitle muted (`templates/core.js` lines 11 to 62) | set `accent: "accent2"` so kicker, rule and disc are one family; one icon; the chapter card of choice (chapter chrome, s6) |
| definition | term accent2 (line 91), rule `accent` (line 96), icon disc accent4 (line 117) | omit `icon` (it adds cyan); the term and rule merge into one warm family by the check (s2) |
| compare.two | header band surface2 for valence neutral, pos or neg fill otherwise; item dots accent on a neutral side (pos or neg on a valenced one); verdict pill accent2; a side's `verdict` (right or wrong) draws a tick or a cross; `tone` is deprecated (lines 162 to 251) | before and after: both sides `valence: "neutral"` and no `verdict`; a red `neg` band is for a harmful side only; for the returning pair prefer `G.compare` in a bespoke beat |
| document.page | a 760 x 780 ink page with an accent4 header (`templates/documents.js` lines 23 to 33) | avoid: a cream page is a white hole on this ground (29 % of the frame) and policy text is in `avoid_for`; use `Loom.ui.doc` (surface page) on a panel |
| list.steps | rows on surface cards, number discs in `accent`, numbers in Fredoka at weight 800 (not loaded; lines 145 to 149) | 3 to 5 steps (the template takes 2 to 6); when orange is not the lesson's accent use `marker: "tick"` (a pos disc; under a seed, the seed's mark), because `"icon"` also sits on an accent disc (line 151) |
| process.flow | step discs surface with accent2 icons, the last disc accent, arrows `line`, labels lead 800, subs label muted (lines 254 to 312) | 3 to 5 steps (2 to 5 allowed); labels at most 4 words; the token pill is ink, keep it under 140 x 60 px |
| timeline | a solid `line` arrow spine (5 px), event dots and dates accent2, labels body ink in a 300 px card (`templates/more.js` lines 373 to 401) | 3 to 6 events; dates at most 3 words; labels at most 6 words (2 lines of body at 300 px, estimated) |
| quiz.question | kicker "Your turn" accent2, option letter discs accent2, pause bar accent4 at 0.55 with a label at Fredoka 800 (lines 8 to 67) | 2 to 4 options of at most 6 words; the pause bar adds cyan, so make cyan the lesson's accent or accept the warning on that beat; the answer and its tick come in `quiz.answer` (pos ring, others dim to 0.38) |
| recap | discs surface with accent2 icons, labels flash accent2 then ink, a dashed `line` thread, the rule pill accent2 (lines 253 to 289) | 3 to 5 items of at most 3 words; one icon family; an item with no icon shows a check, so give mistakes a `circle-x` icon |
| stat.hero | value in display accent2, counts up, caption muted (`templates/core.js` lines 315 to 342) | once a lesson at most: the loudest thing the style has |
| avatar | an Open Peeps bust in a `frame_fill` disc (default surface), title, optional `card` of up to 3 lines (`runtime/overlay.js` lines 109 to 230) | at most once a lesson, always with `card` (a bare disc leaves two thirds of the frame empty), `cast` set so the look is fixed; the bust is outlined line art, the one accepted exception until a designed glow-flat presenter exists |

## 11. Recipes (code)

Every call below exists with this signature (checked in `runtime/` on 2026-10-07, round 2). Cues are literal and
must be spoken in the beat; colours are tokens; times come from cues; boxes are true.

**A. The ground for a workplace beat** (mid-tone fields, a quiet sky, faint light)
```js
const G = Loom.glow;
G.ground(ctx, "ground", { top: "surface", bottom: "field", bloom: "violet", bx: 0.5, by: 0.3, br: 0.75,
  bloomOpacity: 0.5, fieldTones: ["plum", "surface", "surface2", "plum"], fieldOpacity: 0.55, dust: 50,
  t0: ctx.start, t1: ctx.end });
G.shafts(ctx, "shafts", { n: 3, opacity: 0.08, t0: ctx.start, t1: ctx.end });
```

**B. A label that rides with its thing, popped on its word**
```js
const work = ctx.el("tickets", { x: 410, y: 560, w: 390, h: 130, kind: "card" });
G.ticket(work.inner, 150, 72, { tone: "accent4", state: "open", w: 110, h: 74 });
const tag = Loom.svg("g", {}, work.inner);                  // inside the element: it travels with it
G.pill(tag, 150, -60, "3 open", { tone: "accent4", role: "lead", point: [150, 34] });
Loom.motion.pop(tag, ctx.cue("open tickets"));
```

**C. A dashed route, then a hop along it (one travel plus one keyed drive, never two travels)**
```js
const route = ctx.el("route", { x: 800, y: 420, w: 330, h: 250, kind: "connector" });   // the path's true box
Loom.kit.path(route.inner, "M 10 240 Q 165 0 320 240", { stroke: "line", sw: 4, dash: "4 14" });
Loom.motion.unmask(route, ctx.cue("hand the work over"), { dir: "ltr" });   // m.draw would make it solid (s15)
const carrier = ctx.el("handover", { x: 410, y: 560, w: 390, h: 130, kind: "group" });
// ... build the thing inside carrier.inner, or as an element with parent: carrier.inner
const tGo = ctx.cue("next shift");
Loom.motion.travel(carrier, tGo, { x: 710, y: 0, dur: 1.1 });
Loom.drive((e) => carrier.life.setAttribute("transform", `translate(0 ${(-480 * e * (1 - e)).toFixed(1)})`),
  tGo, 1.1, "editorial", { kind: "travel", beat: ctx.beat.id, name: "handover", key: "handover.hop" });
```

**D. The one light that matters, switched on at the payoff**
```js
const light = ctx.el("lamp_light", { x: 1620, y: 578, w: 270, h: 112, kind: "shape" });
Loom.kit.polygon(light.inner, [[126, 0], [174, 0], [270, 112], [0, 112]], { fill: G.token("core"), opacity: 0.16 });
G.glowDisc(light.inner, 150, 2, 20, "core", { opacity: 0.3, spread: 3 });
Loom.motion.reveal(light, ctx.cue("with everything"), { dy: 0 });
```

**E. Hold and transform: the same things move, the payoff grows into the freed space**
```js
// given: chips = the meeting elements, fromX[i] and toX[i] their old and new x in station pixels
chips.forEach((E, i) => Loom.motion.travel(E, ctx.cue("Move the same meetings") + i * 0.07,
  { x: toX[i] - fromX[i], y: 0, dur: 0.8 }));
const focus = ctx.el("focus_block", { x: 264, y: 290, w: 517, h: 104, kind: "value" });
G.glowDisc(focus.inner, 258, 52, 70, "accent4", { core: false, rings: 14, opacity: 0.1, spread: 3.2 });
Loom.kit.rect(focus.inner, 0, 0, 517, 104, { fill: "accent4", r: 22 });
Loom.motion.grow(focus, ctx.cue("three hour block"), { axis: "x" });
```

**F. A person from the kit, at a desk, acting on the word**
```js
const ava = ctx.character("worker", "ava", { x: 960, y: 1180, scale: 0.86, skin: 2 });   // feet below the frame
const desk = ctx.el("desk", { x: 560, y: 820, w: 800, h: 330, kind: "scenery" });       // built after: hides the legs
Loom.kit.rect(desk.inner, 30, 30, 740, 300, { fill: "surface2", r: 18 });
Loom.kit.rect(desk.inner, 0, 0, 800, 36, { fill: G.token("violet"), r: 14 });
ava.emotion("concerned", ctx.cue("No gap")); ava.look(0, -0.7, ctx.cue("No gap"));
ava.emotion("happy", ctx.cue("opens up")); ava.pose("explain", ctx.cue("opens up"), { dur: 0.5 });
```

**The corporate recipe (so a workplace topic never looks childish):** ground A with `dust` 40 to 60; a set of desks
(recipe F) or `Loom.place.office` with the beat's accent not `accent` (s9); `ava`/`sam` waist-up in muted; work
drawn as `G.ticket`, `Loom.obj` with explicit tones and `Loom.ui` artefacts with real words; Fredoka only on 1 to 3
word pills and titles; overshoot only on pills; at most 4 sparkles of size 16 or less, only at the payoff; no
burst, vortex, crackle, orbit, swarm or underwater builder; one accent family; one meaningful glow.

## 12. Failure modes seen in real frames (and found in code)

| seen | where | why | rule or check that prevents it |
|---|---|---|---|
| The cast wears the meaning colour: dress, Cortisol pill and status panel all one cyan | stress-signal b05 (MP4 30.4 s) | `characters.cloth` was accent4, the default pill and hud tone | pack `cloth: "muted"` (round 1); s8 |
| Outlined bean people in a no-outline style; stick arms with ball hands | stress-signal b03 to b10 (`qa/sheets`) | the lesson cast `tess` (beans.js) | s8: cast `ava`/`sam`; S8 cast (s14, s15) |
| A person replaced by a "user" glyph on a disc | stress-signal b07, `lab_glow_pressure__glow-flat.jpg` | no top-down rig | s8; a top-down view only from a designed kit |
| Three saturated hue families in one settled frame | stress-signal b01 and b07 (film check, round 1), `lab_glow_pressure__glow-flat.jpg` | the burst and vortex default colours span pink to yellow on top of the field family | s2 rule; s9 explicit `layers`/`colors`; film check `max_hues` 2 |
| Template beats look like empty slides on a muddy field | stress-signal b02 (MP4 13.5 s) and b08 | templates have no ground; the nebula mixed accent3 into the field | pack nebula `colors` violet, plum, surface (round 1); s10 one template in three |
| Lesson darker than its reference (0.25 against 0.42; 70 % dark beats) | stress-signal, `tone_checks` (round 1) | bare deep field over most of the frame | s2 brightness rule; checklist 2 |
| Hair vanishes into the field | old `hair_colors` at 1.07 to 1.33:1 (round 1) | near-black hair on a near-black ground, no outline | pack `hair_colors` lifted (round 1) |
| Pills stacked and overlapping; a sparkle drawn over the P of "Pause" | stress-signal b10 (MP4 74.5 s) | pills placed by hand with negative gaps; sparkles built after the pills | pills 16 px apart; build sparkles before labels (focus-day example, round 2) |
| The frame at the join is an empty dark field | stress-signal b10 join (67.6 s), b02 arrive (10.2 s) | nothing on the station until the first cue | `H.lead` for templates; bespoke beats build ground and set at `ctx.start` |
| A chained travel shows its midpoint from the first frame | handover example preview, first version (round 1) | each `m.travel` is an unkeyed drive that renders its start at load | s7; recipe C; "M.travel drive key" (s15) |
| Glow halos show as rings | focus-day preview with 6 rings (round 1) | `glowDisc` draws stepped circles | s5; "glowDisc as a radialGradient" (s15) |
| A pill points at an empty desk after its thing has moved | handover preview, first version (round 1) | the pill was its own element | recipe B |
| Axes and connectors as loud as labels | `lab_data__glow-flat.jpg` | `line` was the hex of `muted` | pack `line` #8E85D8 (round 1) |
| Office furniture all in the warm accent | `lab_places__glow-flat__classic.jpg` | `places.js` hard-codes `accent` as wood (lines 189, 218) and chairs (371, 372) | s9; `materials` (s15) |
| A dashed route turns solid when drawn | found in code, round 2 (`motion.js` lines 85 to 105: `m.draw` rewrites `stroke-dasharray` and tweens opacity from 1) | the draw owns the dash pattern | reveal dashed routes with `m.unmask` (recipe C); "m.draw stroke-first" (s15) |
| The lamp lit at 88 % of the speech | handover example, round 2 reading (cue "everything they need" at 9.22 s of 0.4 to 10.4 s) | the payoff word came last in the sentence | cue the payoff on an earlier word ("with everything", 84 %); SCENE_API Rules |
| Eye whites in a dark token | found in code, round 2 (`rig.js` line 41) | the rig's `white` slot is `surface` | s8; "characters.white" (s15); not judged on a frame |

## 13. Polish checklist (yes or no, on the contact sheet and one frame per beat)

1. Does every bespoke beat start with a `G.ground` or a place, with a set in it, so no frame is bare field?
2. Is each settled frame's brightness 0.30 or more in `tone_checks`, unless the storyboard declares `dark`?
3. Does each beat show the field family plus one accent family (two only for a contrast named in `accent_on`)?
4. Is the accent on the element the narration names, and nowhere else in the frame (clothes, objects, avatars)?
5. Are people `ava`/`sam` (or an imported glow-flat kit), in muted, waist-up behind furniture or on a floor, with no
   bean, peep or improvised figure outside the one allowed avatar beat?
6. Is there at most one meaningful glow per beat, with no text inside a halo and no visible ring bands?
7. Does each pill sit within 400 px of its thing on a leader, 16 px or more from other pills, outside the corners?
8. Do labels on moving things move with them, and does no pill point at an empty place?
9. Is every sentence in Nunito, and is Fredoka only on titles, numbers and pills of 1 to 3 words?
10. Is all on-screen text 26 px or larger after camera scale, and clear of the caption band?
11. Did each meaning change land on its spoken word, one at a time, with nothing new after 85 % of the speech?
12. Is background life quiet: bob at most 6 px, shafts at most 0.12, dust at most 60, sparkles at most 4?
13. Is burst, vortex or crackle absent, or used at most once a minute and only for pressure or alarm?
14. Are template beats at most one in three, never two in a row, with no `document.page` and no `icon` on
    `definition`?
15. Are routes that should be dashed still dashed after they appear?
16. On the MP4 frame: are the corners free of banding and blocks, and does the darkest area still show colour
    fields (vignette 0.35)?
17. Does nothing appear before its cue (sets and people excepted), and does nothing stay after its last beat?
18. Does the join frame between beats show a ground and a set, not an empty field?

## 14. Gaps

The gaps are the requests in s15. Two notes belong here:

- The worked examples cannot be stripped with today's tools: `py -m loom lab` and `tools/lab_preview.py` read only
  `scenes_examples/lab/` (`loom/lab.py` lines 22 and 112), and the lab page resolves `ctx.cue("words")` to 0
  (`loom/lab.py` line 41), so every reveal would land at 0 s. The round 1 previews of the two examples were made outside
  these tools (how is not recorded); their numbers stay unverified until "loom lab --file with @lab cue map" lands.
- **Claude Design prompt for the cast (assemble in one session, `docs/assets/CHARACTER_PROMPTS.md`):** Prompt 0,
  Prompt 0+, Prompt R, then **S8** (glow-flat), then **C1** (the workplace cast, A0 bible, pilot MAYA) with this
  brief added: "Workplace people for a glowing flat world on a deep indigo ground: no outlines; flat fills with one
  shade shape per volume tinted toward violet (not grey); a 2 to 3 px rim of light on the edge facing the light (top
  left); clothes in calm mid tones that stay neutral beside saturated cyan, pink and orange labels; hair in natural
  dark colours with a warm undertone and a lit edge so it separates from a dark ground; light eye whites; adults at
  6 to 6.5 heads (this overrides S8's 4 to 5 heads for a corporate audience), not cute; poses waist-up behind a desk
  as well as standing; a top-down seated pose at a desk for overhead shots." Then **D1** (full model sheet and rig)
  and **C3** (16 background people, receding version in the muted slots). Review against the reject list in
  `skills/lnd/lnd-character-design` s11, then `py tools/asset_intake.py <zip> --batch glow_cast`.

## 15. Engine and asset requests

Each is **proposed (not yet read by the runtime)** unless it says otherwise. Size S, M or L. The fallback is what
this guide does until it lands.

| request | size | what | fallback until it lands |
|---|---|---|---|
| pack `materials: {wood, chair, screen}` | S | furniture tokens in `runtime/places.js` (wood lines 189 and 218, chairs 371 and 372, shelf 395) and `runtime/scenery.js` (desk screen line 112, books line 53) instead of hard-coded `accent`; glow-flat would set wood `surface2`, chair `surface`, screen `violet` | with `Loom.place.*` or `Loom.scenery.desk`, the beat's accent is accent3 or accent4, never accent; or draw desks with `kit.rect` (examples) |
| pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` | M | template default colour roles; glow-flat would set every value role to accent2, `link` and `button` to accent4, `me_bubble` to violet, `person_cloth` to muted | the template rules of s10 and the UI rules of s9; pass `accent`, `link.tone`, `button.fill`, `cloth` where a template exposes them |
| `fx.spotlight: {strength, tint}` | S | the spotlight moment dims with black at 0.55 (`fx.js` lines 104 to 106); glow-flat would set strength 0.35, tint `deep` | `ctx.fxMoment("spotlight")` at most once a lesson, only on a beat that measures 0.35 or brighter |
| `fx.vignette_under` (true or false; glow-flat true) | S | draw the vignette under labels and pills, not over them | keep pills and words out of the 200 x 150 px corners (s5, s6) |
| `characters.bottom` | S | the rig's trouser token (now `field2`, `rig.js` line 40); glow-flat would set `line` | pass `bottom: "line"` on every standing figure; keep people waist-up |
| M.travel drive key | S | `m.travel` passes a per-element `key` to `Loom.drive`, so only the first travel renders at load (`core.js` line 115 already supports it) | recipe C: one travel per element, a carrier, a keyed drive |
| m.draw stroke-first, keeps per-path opacity and dashes | S | `m.draw` rewrites `stroke-dasharray` and starts from opacity 1 (`motion.js` lines 87 and 105), so a dashed or translucent path comes out solid and opaque | `m.unmask` for dashed routes; `m.draw` only on solid, opaque strokes |
| font weight clamp to loaded weights (no synthetic bold) | S | clamp a requested weight to the pack's loaded weights; asked for today: Fredoka 800 in list.steps numbers, the quiz pause label, stance tags, `Loom.data.tag`, `ui.card` titles, and Fredoka 900 in `Loom.data.chapter` titles (`data.js` lines 209 to 216) | chapter chrome is a `title.card` (Fredoka 700), not `Loom.data.chapter`; avoid `Loom.data.tag` in this pack; accept list.steps until the clamp lands |
| loom lab --file with @lab cue map | S | strip a scene outside `scenes_examples/lab/` and resolve its literal cues from its `@lab` `words` | the examples are judged only inside a composed lesson; their round 1 preview numbers stay unverified (s14) |
| glowDisc as a radialGradient | S | one `radialGradient` circle instead of stepped circles (`glow.js` lines 82 to 89), still filter-free and deterministic | `rings` 12 to 14 and `opacity` at most 0.14 when `r * spread` exceeds 150 px |
| burst and vortex default colours | S | defaults from the field family plus one accent (`glow.js` lines 160 and 177; also orbit 202, swarm 290, sparkles 260) | always pass `layers`, `colors`, `core`, `tones`, `color` (s9) |
| gloss shading toward deep or plum | S | `S().darken` mixes toward black (`style.js` line 25), which greys warm accents; mix the gloss band and disc crescent toward `deep` or `plum` | keep warm-accent fills under 8 % of the frame; use `flat: true` on any warm fill over 300 px wide |
| `characters.white` (glow-specific, proposed in round 2, not in the shared list) | S | the rig's eye-white slot reads `surface` (`rig.js` line 41); glow-flat would set `ink` | faces under about 120 px until a frame is judged |
| templates on the glow ground | M | a pack-level backing for template beats so they sit in the world, not on a veil or the nebula | one template beat in three, never two in a row (s10) |
| `definition` icon and rule follow the term role | S | the icon disc (accent4) and rule (accent) are hard-coded (`templates/core.js` lines 96 and 117) | omit `icon` in glow-flat |
| pack decision: `characters.extras` (decided 2026-10-08, D-132: kept as the bean; the fallback is the rule) | S | the pack's crowd is the outlined grey bean, against this style's no-outline rule; "people" mode exists (`scenery.js` lines 135 to 145) | no `ctx.crowd`; bystanders from `ava`/`sam` at scale 0.5 or less (s8) |
| a designed glow-flat cast and presenter (S8) | L (asset) | the office cast, background people and a presenter bust in the no-outline, rim-lit treatment, with a top-down pose | `ava`/`sam`; the peep avatar once a lesson (s10) |

---

## 16. Verified on 2026-10-08 (the WS6 proof)

The section 15 runtime requests marked S shipped on 2026-10-08 (D-128; report
`docs/research/2026-10-08-style-system-report.md`; tests `tests/suites/style_system.py`). Sections 1 to 15 were
written before they landed: where a passage says "proposed", "not yet read by the runtime" or "until X lands", X has
landed, the pack below sets it, and that passage's fallback is no longer needed unless this section says so. The
strips, the measurements and the section 13 checklist results are in
`docs/styles/demos/guides/glow-flat/README.md`; the encoded example is `docs/styles/demos/guides/glow-flat/style_glow_flat_focus_day__h264_crf18.mp4`.

**What the runtime now reads from this pack:**
- `materials`: wood `surface2`, chair `surface`, screen `violet`, books `["muted", "violet", "plum", "surface2"]`, plant `violet`, pot `plum`, objects `{"calendar": "violet"}`, monitor `deep`
- `roles`: kicker `accent2`, term `accent2`, verdict `accent2`, date `accent2`, quiz_letter `accent2`, recap_rule `accent2`, stat_value `accent2`, chapter_kicker `accent2`, ui_mark `accent2`, link `accent4`, button `accent4`, me_bubble `violet`, person_cloth `muted`, turn_card `deep`, avatar `["violet", "plum", "muted"]`
- `fx.spotlight` `{"strength": 0.35, "tint": "deep"}`, `fx.vignette_under` `true`
- `characters.bottom` `line`, `characters.white` `ink`
- `shape`: gloss_toward `plum`

**Shared changes every style gets:** words are drawn and measured at a weight the family loaded (no synthetic bold);
`m.draw` draws outlines before fills, keeps each path's own opacity and keeps a dashed line's dashes; a second
`m.travel` of one element no longer shows at load; the lab renders any scene file with its `@lab` cues and words
(`py -m loom lab --file <scene> --out <dir>`); the API agents and the Cowork task files read this guide for the
storyboard and scene stages; `py tools/context_check.py` fails when section 2's palette rows disagree with the pack.

**Verified in Chrome:** both examples keep the field family plus one cyan accent, one meaningful glow drawn as a
single gradient disc, dashed routes dashed, all words 26 px or larger. Fixed in the proof: the alarm-pink plant pot
and calendar header, the white monitor body, the cream turn card and its pale dip, avatars on the orange accent (the
values above). On the crf 18 MP4 the glow disc and the dark corners are smooth (41.4 dB; 74 levels in the source
corner, 83 after).
**Still unverified:** settled brightness by `tone_checks` (item 2), word timing against TTS (item 11), joins (item
18); `gloss_toward: plum` on a large warm fill.

## 17. Set decorations follow the pack (2026-10-08, D-133)

`runtime/places.js` now reads `materials.window_lights`, `vessel`, `cells`, `leds`, `cables`, `chart` and
`safety_line` (L-286), and `Loom.obj` reads `materials.objects` for every kind. Each value below comes from section 2
and is set only where the runtime's fallback breaks a rule there; a key left out keeps its fallback because section 2
allows it. Where an earlier section says `places.js` hard-codes one of these, it no longer does. This section
supersedes the `materials` line of section 16. Strips: `docs/styles/demos/guides/glow-flat/lab_set_decor__glow-flat.jpg` (after)
and `lab_set_decor__glow-flat__before.jpg`, from `scenes_examples/lab/lab_set_decor.js`; record
`docs/research/style-system/red_L276_set_decor.txt`.

**What the runtime now reads from this pack (`materials`, in full):**
- wood `surface2`, chair `surface`, screen `violet`, books `["muted", "violet", "plum", "surface2"]`, plant `violet`,
  pot `plum`, monitor `deep`, window_lights `core`, vessel `plum`, cells `["violet", "muted"]`, leds `["glow",
  "core"]`, cables `["line", "violet", "muted"]`, chart `["muted", "violet"]`, safety_line `muted`, objects
  `{calendar: violet, document: violet, envelope: muted, clock: muted, folder: muted, package: surface, building:
  muted, heart: muted, bulb: core, lock: muted}`

**Why (section 2):** a beat is the field family plus ONE accent family, so set dressing spends none. Light is light:
the window lights and the spark bulb are core (warm light), the LEDs glow and core (electric and warm light). The vessel
is plum (a colour field; accent3 is alarms and never a background). Cells, chart bars and objects are violet and muted
(the neutral pill, neutral objects); cables are line (connectors) with violet and muted (plum is never a line colour);
the safety line is muted. The package is surface (sets): muted packages measured 13.9 % of the warehouse frame, over
muted's "under 10 %". The document is violet, as the calendar, because a surface document draws its header in the
accent. Left at the fallback: phone surface2; the laptop reads no tone.
**Seen on the strips:** no warm or cyan family in a set; the warehouse reads in the field family. **Still open:** the
clock's pink minute hand, the laptop chart's cyan and yellow bars, drawn inside the objects (L-287).
