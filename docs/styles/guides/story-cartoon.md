# Style guide: story-cartoon

STATUS: PARTIAL (2026-10-07, round 2 review). Pack: `packs/styles/story-cartoon.json`. Structure:
`docs/styles/guides/README.md`. Every style has its own purpose and is never ranked against another (D-122); "better"
below means closer to this style's own references and purpose.

How this guide was checked (round 2):
- Every token, hex and ratio was read from the pack as it is now and recomputed with the engine's own
  `loom.checks.style_lint` (command in s2). `lint_style` on the pack returns `[]`; the same call with
  `captions.active` set back to `accent2` returns the RC20 error, so the lint can fail.
- Every API, option and default was read in `runtime/` and `docs/SCENE_API.md`; file and line are given where a rule
  depends on one (`file.js:line`).
- Character sizes were computed from the rig's own coordinates (`assets/rigs/maya.json`: size 1000 x 1905; brow
  y 412, chin 601, hip pivot 1040, knee pivot 1500) and checked on no-browser previews made with `tools/lab_preview.py`
  (session `outputs/sc_r2/`; round 1 previews in `outputs/sc_style/`). Previews estimate text widths, use fallback
  fonts for Nunito, draw no WebGL fx, and run the lab's `ctx.cue`, which returns 0 for words (`loom/lab.py:41`).
- Nothing here has been checked on a Chrome render or an encoded MP4. Where a rule depends on that, it says
  "unverified".

---

## 1. Purpose and register

A story told through people deciding things in places. The viewer watches a named colleague meet the situation the
lesson is about, in a room that looks like work, and the fact that matters sits ON something in that room (a board, a
notice, a document, a nameplate, a calendar). Warm paper ground, flat fills with one crisp cel shade, a dark ink
outline round the cast and every prop that carries information, hand-lettered signs and numbers, black narration
cards for the turns. The feeling is a well-made short for adults: warm, specific, a little dry, never a children's
cartoon. Fits (pack `fits`): scenarios, case stories, soft skills, policy in practice, the history of a decision,
onboarding. Never for: dense data and precise technical diagrams (pack `avoid_for`), a lesson with no people in it,
or anything that needs a real person's likeness (caricatures of real people are not for internal training, Crayon
study "What transfers to workplace learning").

| reference | what to take | what NOT to take |
|---|---|---|
| Crayon Capital, 7 videos supplied by Kshitij for private study (`C:\Users\Admin\Documents\Crayon Capital`; notes `docs/research/crayon/2026-10-01-crayon-capital-study.md`, look `docs/research/2026-10-01-visual-study.md` s1) | the number lives on a prop; dialogue carries the mechanism; nameplates say who is speaking; black cards for "but" and "until"; grey or muted extras so the cast wins; bookends; something moves in 85 to 92 % of seconds (study table, 6 of 7 videos) | the 150 wpm entertainment pace and a new shot every 3 s (the study's own "where not to copy"); big-headed bean people and dot eyes (they read as a children's cartoon in a corporate lesson, L-128, bench post-mortem); caricatures of real people |
| TED-Ed character lessons, measured in-house (`docs/research/vision/tedEd_2026-10/colour_and_tone.md`, family "wobbly outline, grain, flat", 12 films; the pack's `tone_reference` is that row) | brightness 0.60, dark shots 9 %, an accent in 38 % of shots, 5 working colours a frame; designed characters with real eyes | their per-film art direction changes (each film has its own illustrator; this pack is one look for a whole course) |
| Film grammar for two-person scenes: the 180-degree rule, shot and reverse shot, over the shoulder ([wolfcrow, 180-degree rule](https://wolfcrow.com/?p=60196); [Melies, over-the-shoulder](https://melies.co/cinematic-techniques/framing/over-the-shoulder-frame)) | two people keep the same left and right relation for the whole lesson; matched eyelines; a cut between them never jumps the line | coverage that needs a back or 3/4 view of a character: no kit has one yet (s15, A2) |
| Mix-and-match people systems: Open Peeps (CC0, in Loom as `kit.peep`) and Humaaans (CC0) ([licence notes](https://licenseorg.com/guide/design-graphics/humaaans)) | a cast built by composition (heads, hair, bodies, clothing slots) so one person keeps one look; clothing as colour slots the pack fills | generic "anyone" faces; a person who is never the same twice; Humaaans' tiny heads and long limbs (this style wants about 6 heads with a slightly larger head, lnd-character-design s7) |

Study, never copy or republish. No reference frame is stored in the repo.

## 2. Palette roles

Measured with (run from the engine folder; Linux CI form `python3`):
`py -c "import json; from loom.checks.style_lint import contrast, caption_ratios; P=json.load(open('packs/styles/story-cartoon.json')); p=P['palette']; print(contrast(p['accent'], p['field']), caption_ratios(P))"`
prints `4.777... {'pill': '#3a322b', 'active': '#E9B65C', ..., 'active_ratio': 6.768..., 'fg_ratio': 10.140...}`.
The caption pill is `rgba(42,34,28,0.92)` composited over the field = `#3A322B`. Every other ratio below is the same
WCAG formula applied to the pack's hexes.

Shares are TARGETS for a typical frame, estimated from the previews; no command measures per-token share yet.

| token | hex | role | may appear | never | target share |
|---|---|---|---|---|---|
| field | #EEE6D8 | paper ground; caption words (`captions.fg`) | behind everything; text on ink and on the turn card | as a card fill on the field (1.00:1) | 10 to 40 % (less when a set fills the frame) |
| field2 | #D8CBB4 | floors (`ctx.scenery("room")` default `floorFill`), the near face of tables | floors, table fronts, quiet props | text | 10 to 25 % |
| surface | #FBF7EF | paper props and cards: signs, boards, notices, nameplates, documents, desk tops | any prop that carries words | a wall (it would glow) | 8 to 20 % |
| surface2 | #E4D8C4 | walls (`ctx.scenery("room")` default `wall`), quiet panels | sets | the near face of furniture in front of a surface2 wall (it merges, seen in the R2 preview) | 25 to 50 % in a set |
| ink | #2A221C | text, outlines, the black turn card, monitor bodies | all text on light grounds; every toon outline | a large fill outside the turn card and screens | 6 to 10 % (outlines and text) |
| line | #2A221C | connectors, axes, the room's floor line | lines | n/a | inside ink's share |
| muted | #6F665C | secondary text, table legs, extras' clothes, pins, desk legs (`scenery.js:105`) | labels on surface (5.27:1) and field (4.54:1) | text on field2 (3.52:1); text in a vignetted corner (s5) | under 5 % |
| accent | #A9442A | THE teaching accent: the one thing the narration names (the number on the prop, the key word) | one element per frame (s6 defines an element) | clothes, furniture, books, chairs, screens, background fills | under 3 % |
| accent2 | #87570F | ochre: terms, values, dates, kickers and names in templates; text on the field (4.98:1) | template labels; small details (the room's door knob, `scenery.js:43`) | the dark caption pill (2.03:1, RC20); text on ink (2.53:1); the thing the narration names (that is the accent's job) | under 4 % |
| accent3 | #5E9C8F | teal: calm fills (pots, calendar headers, curtains) | fills under ink text (ink on it 4.93:1) | text on the field (2.56:1) | under 8 % |
| accent4 | #8DAE5A | sage: plant leaves, quiet badges, the document header band | fills under ink text (6.20:1) | a verdict next to pos (both green: a "correct" reading the lesson did not mean) | under 8 % |
| pos | #6E9F4A | right, agreed, done, with a tick shape | verdict marks; the places' plant leaves also use it (`places.js:94`, `places.js:212`) | decoration chosen by a scene | under 2 % |
| neg | #9B2D4F | wrong, myth, refused, with a cross shape | verdict marks; field text on it 5.88:1; mouths (pack `characters.mouth`) | the teaching accent's job | under 2 % |
| shadow | #B9AC97 | contact shadows (`places.js:154`, opacity 0.28) | under things that stand | text | under 3 % |
| onAccent | #2A221C | kept for the lint and `S.on` candidates | | | |
| caption_active | #E9B65C | honey: the spoken caption word on the pill (6.77:1); a whole one to three word line on a black turn card (8.42:1 on ink) | dark grounds only | the field (1.50:1), surfaces, any light ground | a word |
| cloth | #5B7A99 | slate: the first cast member's clothes (pack `characters.cloth`) | clothing | text, teaching marks | inside the people's share |
| cloth2 | #8A6A85 | dusty plum: the second cast member's clothes | clothing | text, teaching marks | inside the people's share |

People (rigs, busts, extras) together: 10 to 25 % of a medium shot, 5 to 12 % of a wide one (targets). At most two
saturated hue families in a frame besides skin: the accent and one of accent3, accent4, cloth or cloth2 (the pack's
`tone_reference.colours` is 5).

Allowed text pairs (ratio): ink on field 12.61, on surface 14.62, on surface2 11.10, on field2 9.76; field on ink
12.61; accent on field 4.78, on surface 5.54; accent2 on field 4.98, on surface 5.78; muted on surface 5.27, on field
4.54; field on accent 4.78, on accent2 4.98, on neg 5.88; ink on accent3 4.93, on accent4 6.20, on pos 5.00;
caption_active on the pill 6.77, on ink 8.42; field on the pill 10.14.
Large type only (30 px and up in this style, above WCAG's 24 px large-text line where 3:1 is enough): muted on
surface2 4.00, accent2 on surface2 4.39, accent on surface2 4.21.
Forbidden: accent2 on the pill 2.03 or on ink 2.53; accent on ink 2.64; accent3, accent4 or pos as text on the field
(2.56, 2.03, 2.52); caption_active on any light ground (1.50 on the field); muted on field2 (3.52); ink on neg
(2.14); any text on cloth or cloth2 (3.33 to 3.78: they are clothes).

Pack changes made by round 1 (2026-10-07, kept): neg #B23E2C to #9B2D4F (hue 8 degrees to 342 degrees: it sat 4
degrees from the accent at 12 degrees, so the teaching mark and the "wrong" mark were one red); caption_active
#BDA37B (the RC20 interim) to #E9B65C; new cloth and cloth2; `characters.cloth` from accent to cloth;
`characters.extras` from silhouette to people. Round 2 made no pack change.

## 3. Type

| role | face (pack) | size (pack range, px) | weight | used for |
|---|---|---|---|---|
| display | Patrick Hand | 120 to 170 | 400 only | the number on a prop |
| hero | Patrick Hand | 104 to 150 | 400 only | a stat on a board |
| title | Patrick Hand | 68 to 96 | 400 only | titles, the turn card line |
| lead | Nunito | 36 to 46 | 800 (default) or 700 | sentences on signs and cards, card titles |
| body | Nunito | 30 to 38 | 800 (default) or 700 | card text, bubble lines |
| label | Patrick Hand (pack `fonts.roles.label: "display"`) | 30 to 38 | 400 only | nameplates, sign headers, kickers |
| caption (kit role) | Nunito | 22 to 26 | 800 | in-picture captions |
| subtitle band | Nunito (pack `captions.font: "body"`) | 36 | 800 | the caption pill |

Defaults come from `runtime/kit.js:306`: display, title and hero take the face's last listed weight (400 for Patrick
Hand); other roles take the second listed weight (Nunito 800; Patrick Hand 400 for label).

- **Never ask Patrick Hand for a weight above 400.** It ships one weight (pack `fonts.faces`), so a bold request is
  drawn as a browser-synthesised bold (unverified in a Chrome frame here; the runtime request
  "font weight clamp to loaded weights (no synthetic bold)" would stop it, s15 E3). Several runtime defaults ask for
  it today, so pass the weight yourself:
  - `Loom.scenery.sign(..., text, {weight: 400})` (default 700, `scenery.js:124`);
  - `ctx.narrationCard(name, text, t, {weight: 400})` (default 700, `scenery.js:157`);
  - do not use `Loom.data.chapter` (title at 900 with four extruded copies, kicker at 800, `data.js:209` to `:216`);
  - section labels draw label at 800 (`overlay.js:96`): keep them off (s6);
  - templates that set `weight: 800` on a label-role text (list.steps numerals `core.js:149`, the Myth and Fact tags
    `_helpers.js:79`, the quiz pause label `more.js:61`) cannot be changed from a scene: see s10.
- Hand-lettering (Patrick Hand) is for what a person in the story would have written: signs, boards, nameplates and
  numbers (6 words or fewer), and titles and turn cards (9 words or fewer, the title.card schema). Everything else the
  learner reads as text (definitions, card lines, bubbles, a sign of 7 words or more) is Nunito (`role: "lead"` or
  `"body"`).
- Sentence case everywhere. Caps only through `kit.kicker` (it upper-cases and warns over 4 words, `kit.js:476`).
  A sign is never set in caps (the lab set's "REFUNDS OVER $500: SECOND CHECK" is the thing not to do).
- No italic: no italic face is installed. Crayon's italic hand captions are not available (s15 A5).
- Line length: 42 characters a line at most on a card or sign. Captions are grouped by compose at 7 words or 44
  characters (`loom/compose.py:79`).
- Numbers: the figure is the largest type in its frame, in display (120 px or more), in accent, on its prop, with its
  unit ("$500", "3 of 5", "40 %"). The words around it (what it counts, the condition) are ink in lead or label and at
  least 2.5 times smaller (display 120 against lead 46 is 2.6).

## 4. Shape language

- Radius: 10 on cards and props (pack `shape.radius`); 8 on signs (`Loom.scenery.sign` default, `scenery.js:122`);
  nameplates are trapezoids (`kit.polygon`).
- Toon shading (`shape.shading: "toon"`, `kit.js:98` to `:105`): `kit.rect` draws the fill, a bottom cel band
  `min(22 % of the height, 26 px)` tall in the fill darkened 13 %, and a 5 px ink outline (`shape.stroke`). `kit.disc`
  draws the shade as an offset crescent toward the lower right (`kit.js:149` to `:156`). `kit.polygon` gets the same
  5 px outline, no band (`kit.js:213`).
  - `flat: true` drops the cel band and keeps the outline (pins, trays).
  - `crisp: true` drops the outline and the band (header bands, so no outline runs through a title; groupthink-trap
    b11).
- People carry the designed kit's own line: 6 px outer and 2.5 to 3.5 px inner at full size (CHARACTER_PROMPTS S2),
  so Maya at scale 0.85 draws about 5 px outer, the same as the props. Never raise a prop's `sw` above the pack's 5.
- Joins and caps are round (`kit.line` and `kit.path` use round caps and joins).
- Arrows: `kit.arrow(parent, x1, y1, x2, y2, {stroke: "ink", sw: 5})` (its default `sw` is stroke + 1 = 6,
  `kit.js:201`), drawn with `m.draw(arrowResult, t)` so the head lands at 0.9 of the draw.
- Connectors: `kit.line(..., {stroke: "ink", sw: 4})`. Dividers: `kit.line(..., {stroke: "muted", sw: 3})`, never an
  outlined box. A dashed line is revealed, never drawn: `m.draw` overwrites `stroke-dasharray` (`motion.js:87`) until
  "m.draw stroke-first, keeps per-path opacity and dashes" lands (s15 E4).
- A card is a paper thing in the room (a notice, a board, a page), never a floating panel. A label is a sign, a
  nameplate or a tag tied to its object. A badge is `Loom.th.iconDisc(ctx, parent, cx, cy, r, icon, "accent4")` or on
  accent3; the icon then takes ink by contrast (6.20:1 and 4.93:1).
- Backgrounds may stay unoutlined: `ctx.scenery("room")` draws its wall and floor `crisp` (`scenery.js:29` to `:30`)
  and outlines only the window, skirting and props. Anything the viewer must read (a person, a prop with words or a
  number) is outlined.

## 5. Light, shading, depth and texture

- Flat fills, one crisp cel shade per volume, no gradients, no glow, no drop shadows (`shape.shadow: "none"`).
- Contact shadows: the 3D `Loom.place.office` furniture and chairs draw a soft ellipse in `shadow` at 0.28
  (`places.js:154`, `:171`). The flat office (`look: "flat"`), `ctx.scenery("room")`, `Loom.scenery.desk` and every
  rig (`runtime/rig.js` and `runtime/rigs/` contain no shadow) draw none: use them where the floor contact is out of
  frame (medium and closer shots), or stand people's feet behind a desk or table edge. A wide shot with feet on an open
  floor is the one place this style still floats its people (s15 E11).
- Finish (pack `fx`): paper 0.06, grain 0.012 (near off, D-100), vignette 0.32, background "paper" at intensity 0.6.
  - The vignette is black at alpha `0.32 x smoothstep(0.35, 1.05, 1.25 x d)`, where d is the distance from the frame
    centre in frame fractions (x / 1920, y / 1080) (`fx.js:84`), drawn over the world and under captions and chrome. By that formula (computed, not measured on a
    frame) it darkens the field by about 21 % at the section-label position (x 110, y 56) and 17 % at the safe area's
    bottom-right corner, which takes muted text there to about 2.7:1 and 3.0:1, and ink text to about 7.6:1.
  - So: no muted text within 400 px of a frame corner; ink text there is fine. Section labels stay off (s6).
  - `fx.vignette_under` (proposed, not yet read by the runtime, s15 E6) would draw it under the world so it never
    darkens text. A within-style A/B of vignette 0.32 against 0.18 on an encoded MP4 is open (s14).
- Depth: three layers at most (wall, the people and their furniture, a near prop or table edge). A near table or desk
  that hides where a bust ends is the cheapest depth in this style (recipe R2). Each layer one value step apart: the
  near face of furniture is never the same token as the wall behind it.
- Night or mood scenes: a dimmer set (`ctx.scenery("room", name, {wall: "muted", floorFill: "shadow", window: true,
  glass: "accent2"})`, options at `scenery.js:29` to `:35`) with the one warm window, never a colour filter over the
  frame. Ink text on a muted wall reads 2.78:1, so words in a night set sit on a surface prop. Unverified: no night
  set has been previewed in this pack.
- `ctx.fxMoment("spotlight", t0, t1, rect)` dims everything outside the rect with black at 0.55 (`fx.js:106`): on this
  warm paper that is a heavy brown. Do not use it until `fx.spotlight: {strength, tint}` (proposed, not yet read by the
  runtime, s15 E5) can set strength 0.3 or less and an ink tint. Until then the number is emphasised by its prop
  landing and, at most, a camera push (R5).

## 6. Composition

- Frame 1920 x 1080. Safe area x 96 to 1824, y 84 to 930 (`ctx.box`). The caption band is y 930 and below; the
  caption pill's top is y 950 (pack `captions.top`), about 65 px tall for one line (36 px at line height 1.25 plus
  10 px padding, `overlay.js:46`). Nothing that must be read goes in the band; furniture and floors may.
- Density: a set fills the frame. Crayon's newer videos draw on 0.40 to 0.50 of 16 px blocks and cover 0.66 to 0.76
  of the frame (visual study s2); the lab story set in this pack measured 0.31 drawn and 0.48 covered (visual study s6,
  `py tools/style_fingerprint.py`). A beat in this style draws on at least 0.31. A person on an empty field is a
  failure.
- One focal point per moment: a face or the number, never both arriving together. The number arrives on its word;
  the person's look, hand or pose points to it.
- An "accent element" is any accent-filled shape 24 px or more on both sides, or any text in accent. One per frame.
  Bullet dots (16 px in compare.two rows, 20 px in the avatar card) and thin strokes inside drawn objects do not
  count.
- Thirds: the person on one third, the prop on the other. The picture reads left to right (who, then what).

**Character size by shot (frame height 1080).** For Maya, screen y of a landmark = feet y minus
(1905 minus the landmark's rig y) x scale. Landmarks in rig units: hair top about 148, brow 412, chin 601, hip pivot
1040, knee pivot 1500, ankle pivot 1846 (`assets/rigs/maya.json`). Values marked "computed" use that formula; the
medium shot was also checked on the round 2 preview.

| shot | Maya placement | what is in frame | face (brow to chin) | use it for |
|---|---|---|---|---|
| wide | scale 0.23 to 0.31, feet on the floor line | full figure 430 to 600 px; head top below y 160 | 43 to 59 px (computed): act with poses only | establishing a place, crowds |
| medium wide | scale 0.5, feet at y 1180 | frame cuts mid-shin; knee at y 978, head top about y 300 (computed) | about 95 px (computed) | two people at a board or desk |
| medium | scale 0.85, feet at y 1710 | frame cuts the upper thigh, 105 px below the hip (y 975) | about 160 px computed, about 150 px on the preview | one person reacting, presenting, deciding |
| two-shot, seated | peeps `size: 640`, box centre y 620 | busts above a table top at y 900 | eyes at about y 630 on the preview | a conversation |
| close | scale 1.35 to 1.85 | head and shoulders | 250 to 350 px | the reaction that is the point |

- A reaction beat (the face carries the point) needs brow to chin of 150 px or more: the medium shot or closer.
- In a wide shot faces are under 60 px: act with poses and gestures only, never with a facial beat.
- Never cut a person at a joint: the frame edge stays 80 px or more from the neck, hip, knee and ankle landmarks.
  Never cut the top of a head in a medium or wider shot (`figure_cropped` warns for the top, left and right edges,
  `rig.js:263`; it does not check joints).
- No tangents: the floor line, a window edge, a board edge or a table top stays 40 px or more from a head, chin, hand,
  hem or hip. Seen: round 1's R1 put the skirting at y 954 to 972 along Maya's sweater hem (hip y 975); round 2 moved
  the floor to y 1048.

**Two people (the two-shot).**
- The 180-degree line: each person keeps their side of the screen for the whole lesson (left faces right, right
  faces left; `flip: true` on the right-hand peep). Write the side into the story.cast `role` note.
- Both heads in one eye band: same bust size and the same centre y, so the eyes differ by 20 px or less (Rina 630,
  Joel 640 on the R2 preview).
- Gap between the two heads' nearest edges: 300 px or more; the prop that carries the number sits in that gap,
  above the heads (its lower corners 35 px or more above the hair) or on the table between them.
- The speaker moves (mouth on their own words, a lean, a gesture); the listener holds and reacts on the key word.
- Nameplates on the table edge (or name labels under busts) the first time a person appears in a lesson.

**The number on a prop.** The figure is written on something that belongs in the place (wall board, notice,
calendar, nameplate, document, price tag, a screen in the room), is the largest type in the frame, is the frame's
accent element, and stamps in on its spoken word (`m.stamp(E, ctx.cue("..."))`). The prop arrives first, with its
label, so the eye knows where to look (structure before content). Never a floating number card beside the story.

**Captions.** The pill is the pack's: Nunito 800 at 36 px, field words, the spoken word in caption_active (6.77:1),
radius 10, top 950 (`overlay.js:38` to `:59`). If a pack edit ever drops the active colour under 4.5:1 the runtime
lightens it and warns `caption_active_contrast` (`overlay.js:25` to `:37`): treat that warning as an error in this
style. Keep hands, nameplates and numbers 20 px or more above y 950.

**Chapter chrome.** Section labels are on by default (`loom/compose.py:330`) and draw the label face at weight 800,
24 px, muted, upper case, at x 96, y 44 (`overlay.js:96`): a synthetic bold, under this pack's 30 px label floor, and
about 2.7:1 on the vignetted corner (s5). Set `"chrome": {"section_labels": false}` in every story-cartoon storyboard.
A chapter opens with a `title.card` beat on the field (s10), not a black card: black is for turns only.

## 7. Motion

- Personality "lively": enter 0.42 s, move 0.34, exit 0.26, stagger 0.07, draw 0.8, count 1.0, overshoot on.
- Overshoot comes from `m.drop` and `m.pop` (`motion.js:33` to `:44`) and from `m.spring` presets `snappy` (0.15) and
  `lively` (0.3). Use it for things that land: a prop dropped on a wall (`m.drop`), a nameplate (`m.spring` preset
  `snappy`), people's gestures. `m.stamp` has no overshoot (scale 1.3 to 1, `motion.js:37`): it is the number's move.
  An element of kind `text` (words on their own, no prop) never bounces: `m.reveal`, `m.unmask`.
- No still stretch longer than 4 s outside a turn card (Crayon: motion in 85 to 92 % of seconds, longest hold
  outside the end card 3 to 7 s). Still means no visible change: a rig's breath, sway and blinks (`rig.js:111`,
  `:139`) do not count; a gesture, a nod, a pose or face change, a prop arriving or a camera move does. A peep bust
  does not breathe at all: when busts are all that moves, one of them changes face or leans at least every 4 s.
- Stepped time and line boil (`Loom.stepped.on`, `.boil`) act in this pack because its `look_family` is
  "illustrated" (`stepped.js:49`), and are off unless a scene calls them. Never on people (rig parts would judder) and
  never on an element that holds `kit.text`: boil is an SVG filter, and text never sits inside filters (SCENE_API
  Rules).

**Joins and transitions.**
- `cut` is the default (pack `join_default`). A cut between two shots of the same place keeps the 180-degree line.
- Turns ("but", "until", "then nobody checked") are a black narration card (`ctx.narrationCard`, R3): one sentence
  of 8 words or fewer (at the title size it may wrap to two lines), 1 to 3 per lesson.
- A time skip uses storyboard `join_in.meaning: "time"` (compose picks the join, SCENE_API "Screen joins").
- One material join family per lesson at most, named in the storyboard's `devices`: `torn` or `page` suit this
  paper material (SCENE_API "Primitives from the TED-Ed study").
- A camera push inside a place (`Loom.cam.push`, R5) for "look closer", never a zoom on a template beat (RC10). A
  camera join between different worlds becomes a dip unless `join_in.continuous: true`.

## 8. People and living characters

**Who draws them.** Characters come from a designed kit and are placed by id; scene code never builds a person from
circles and rectangles (lnd-character-design s0 rule 2). What exists today:

| kit | how it is placed | fits this style? |
|---|---|---|
| `maya` (imported Claude Design rig, `assets/rigs/maya.json`, batch maya_story_parts_v6) | `ctx.character(name, "maya", {x, y, scale, pose})`; 20 poses, 20 emotion keys (with aliases), `maya.hold("hand_r", "palm_up_offer", t0, t1)` and 19 other hand drawings, gestures nod, beat, wave, shrug, tilt (`runtime/rigs/imported.js:14`) | yes: the only designed full-figure cast member. Front view only, no walk; her delivered colours are baked into the parts (the pack cannot re-dress her); `maya.look()` has no effect on an imported rig (`rig.js:187` to `:190` never calls the look path), so her gaze comes from pose and emotion |
| Open Peeps busts (CC0) | `kit.peep(parent, member, emotion, {x, y, size, flip, cloth, skin})`; members woman, man, girl, boy, elder_woman, elder_man; emotions neutral, happy, surprised, explaining; templates draw them for `person` props | for busts only, until a designed bust kit exists (s15 A3). They fail one review item (head wider than the shoulders, lnd-character-design s11), and the `neutral` face has closed eyes, so a listener at rest reads asleep (R2 preview, Joel) |
| `ava`, `sam` (code-drawn rigs) | through `ctx.crowd` only | background only: `ctx.crowd` draws them in muted, surface2 or line tops and ink or muted trousers (`scenery.js:145`), default scale 0.4 (`scenery.js:137`). Never a named cast member |
| `pip`, `tess`, `extra` (code-drawn beans, `runtime/rigs/beans.js`) | none | no: ball heads wider than the shoulders and dot eyes fail this style's reject list (lnd-character-design s7 and s11); the bench videos' beans were a named defect |

**Mouths.** A character's mouth moves only inside that character's own speech act: their line, or a narrated
"she asks", "he says". On narration that describes them ("Maya checks the notice") they act with a gesture, a pose or
an emotion and keep the mouth shut. Round 1's R1 lip-flapped Maya on "Maya checks"; round 2 replaced it with a head
tilt.

**One name, one look, for the whole lesson (cast continuity).** The bench videos changed people between beats
(budget's Jordan had five forms; Priya and Dev swapped rigs; a colleague changed skin and shirt, post-mortem RC18).
So:
1. The storyboard declares every person once in `story.cast`, before any beat uses them, with a fixed look:
   `"story": {"cast": [{"name": "Rina", "member": "woman", "skin": 1, "cloth": "cloth", "role": "team lead, screen left"},
   {"name": "Joel", "member": "man", "skin": 3, "cloth": "cloth2", "role": "analyst, screen right"}]}`.
   A rig cast member still needs skin and cloth, because the gate requires both (`loom/checks/story.py:507`):
   `{"name": "Maya", "rig": "maya", "skin": 0, "cloth": "cloth", "role": "new starter"}` (the imported rig draws its
   delivered colours either way). Compose copies the list to the manifest (`loom/compose.py:340` to `:342`).
2. The gate `story.cast_errors` (`loom/checks/story.py:486`, run by the storyboard and scenes gates,
   `loom/checks/gates.py:549` and `:727`) fails a lesson with people and no cast, a cast entry without its look, and any
   appearance whose look differs from the entry.
3. The scenes gate reads people from the source text (`loom/checks/story.py:437` to `:465`): `ctx.character("name",
   "rig", {skin})` and `kit.peep(<el>.inner, "member", emotion, {cloth: "token", skin: n})` with literal strings, where
   `<el>` was made by `const <el> = ctx.el("<name>", ...)`. A loop over variables hides the people from the gate (round
   1's R2 did; round 2 proved the old form returns no appearances). Write each person's call with literals.
4. One drawing system per name: a bust member (peeps) or a designed rig, never both. Templates draw peep members only
   and raise `cast_not_drawable` for a rig cast (`_helpers.js:62`): a lesson with a rig cast draws that person in
   bespoke scenes.
5. Every template person prop names `cast` (or a `name` that is a cast name; `_helpers.js:51` matches first names).
   Without it the template falls back to its default clothes, the teaching accent (`_helpers.js:66`), until
   `roles.person_cloth` (proposed, not yet read by the runtime, s15 E2) lands.
6. A cast name never reuses another kit's id ("Maya" drawn with rig `ava` happened in `_ss_story`).
7. Clothes are cloth, cloth2, accent3 or muted; never accent, accent2, pos or neg (a person in the teaching red
   competes with the number; lab_story_set and every bench video did this). Skin is an index into the pack's four
   tones (`characters.skin`) and is fixed per name.
8. Two people in one frame differ in at least two of: skin index, cloth token, hair shape (silhouette test,
   lnd-character-design s2).

**When the kit lacks the person or the pose:** frame the beat without improvising (lnd-character-design s10): the
object they hold, their nameplate and an empty chair, hands only (`Loom.hands`, placeholder set until a designed
family exists; it warns `hands_placeholder`), or a cut to the place without people. Write an asset request into the
storyboard findings.

## 9. Objects, icons, data and UI

- Props are things: `Loom.obj.shape(g, kind, cx, cy, size, {state})` for documents, calendars, clocks, phones,
  laptops (`state.facing` toward their user), folders, packages; `Loom.scenery.sign(parent, x, y, w, h, text,
  {weight: 400})` and `Loom.scenery.desk(parent, x, floorY, w, o)` for signs and desks. Objects draw no words of their
  own: the words are `kit.text` on the prop. A sign drawn by `Loom.scenery.sign` arrives with its parent; a prop that
  must land on a word is its own `ctx.el` (R1).
- Icons: Lucide at stroke 2.4 (pack `icons.stroke`), ink, inside an accent4 or accent3 disc (`Loom.th.iconDisc`). An
  icon never stands in for a thing the narration names when an object grammar exists (`Loom.obj.forIcon`).
- Data: a number on a prop (s6). A small chart only on a board or screen inside the place:
  `Loom.data.barsOn(ctx, name, {x, y, w, bars: [{label, value, color}], t})` placed over the board's face, with
  `color: "muted"` on every bar but the one that matters (`"accent"`). Its defaults are accent3 bars with the last
  one accent (`data.js:103`), so pass every colour. It lays out a 150 px label column and a 210 px value column
  (`data.js:92`): the board must be 760 px wide or more for a 380 px bar span. It is a station-level element (no
  `parent`), so it does not ride a `Loom.cam` push: no push in a beat with a chart. Unverified on a frame.
- `Loom.data.unitGrid` with `unit: "person"` is allowed on a board or screen only (pictograms in a chart are the one
  place code may draw people, lnd-character-design s0).
- Messages and pages: `Loom.ui.mail`, `Loom.ui.chat`, `Loom.ui.doc` shown on a laptop or phone in the place, every
  word real; never grey bars where words should be. Their accent use (`ui_artefacts.js`):
  - links are accent (`:158`) and buttons are accent (`:170`); when the link or button is not what the narration
    names, pass `link: {tone: "accent2"}` and `button: {fill: "accent3"}`;
  - the chat's "me" bubbles are accent with no option (`:237`): a chat frame has no other accent element until
    `roles.me_bubble` (proposed, s15 E2) lands;
  - initials discs take accent, accent3, accent4 or accent2 from a hash of the name (`:41`): check that no cast
    name's disc comes out in the accent next to the number;
  - `Loom.ui.mark` sweeps in accent2 at 0.32 (`:303`), the intended highlight.
- Furniture never uses the accent. `Loom.place.office` draws its desks, drawers and shelf in the accent
  (`places.js:189`, `:218`; office chairs are surface2, `:272`, `:274`) and `Loom.place.meeting` its chairs
  (`:371` to `:372`): brick-red furniture filling about a fifth of the frame (preview
  `outputs/sc_style/lab_props_people__story-cartoon__08.60.png`). Until `materials: {wood, chair, screen}` (proposed,
  not yet read by the runtime, s15 E1) lands, use one of:
  - `Loom.place.office(ctx, name, {look: "flat"})`: the plain office (`places.js:109` to `:130`) has a muted desk top,
    a surface drawer and no accent furniture. Its props still carry small accents on the round 2 preview (R4): ochre
    folders, an accent2 bar in the laptop's chart and a thin accent stroke on the desk document (under the s6 element
    size, so it does not count, but the number in that beat must clearly outweigh it);
  - `ctx.scenery("room")` with `Loom.scenery.desk(..., {monitor: true, screen: "surface2"})` (the monitor's screen
    defaults to accent, `scenery.js:112`) and no `shelf` (its books are all four accents, `scenery.js:53`);
  - the red office only in a beat where nothing else uses the accent.

## 10. Templates in this style

Templates are the slide-like part of a story lesson: definitions, checks and recaps, not the story itself. Keep them
to 25 % of the beats or fewer (the bench mix at 50 % read as a deck, RC17). A template frame obeys the same one-accent
rule; where a template draws more accents than that and no prop can change it, the note says so.

In a lesson with a design seed, `Loom.th.iconDisc` draws a disc whose fill is `surface` as an accent badge
(`_helpers.js:134`): recap tokens, process steps and cycle nodes then all turn accent. Read in code, not yet seen in a
frame; count accents on every seeded template frame.

| template | set or avoid in story-cartoon |
|---|---|
| title.card | The chapter opener: title in Patrick Hand 400 on the field, a kicker of 4 words or fewer ("Part two"), a 180 px rule in `accent` (`core.js:51`). No `icon` (it adds an accent disc, `core.js:34`), or pass `accent: "accent3"`. Never the black card (black is for turns) |
| definition | Native as is: term in accent2 Patrick Hand title (`core.js:91`), one 220 px accent rule (`:96`), definition in Nunito lead, icon disc in accent4 (`:117`); preview `lab_tpl_definition`. Term 5 words or fewer |
| compare.two | Use `valence` (colour only) and `verdict: "right"`/`"wrong"` only when one side is the correct answer; never the deprecated `tone` (it drew a cross on a side that was not wrong, RC19). Neutral rows carry 16 px accent dots (`core.js:229`), under the 24 px element size. `stance` tags are label at 800 (faux bold, s3). A person-led contrast (two people, two choices) is a bespoke two-shot instead |
| document.page | Draws an ink page with a sage header (`documents.js:25`, `:28`) and an accent2 highlight at 0.55 on ink (`:62`): a dark card that is not a turn, and a muddy highlight (bench mixed, openai). Prefer `Loom.ui.doc` on a desk or a paper prop in a scene. If used: `person.cast` always (default cloth accent, `:77`) and `stance` where it applies; a paper variant is requested (s15 E7) |
| list.steps | Every number disc is accent (`core.js:148`), so a 4-step list shows 4 accents, and the numeral is label at 800 (faux bold). For a checklist use `marker: "tick"` (pos ticks: the "done" meaning). For an ordered procedure prefer a bespoke prop (steps on a clipboard or a wall board) until a step-marker role exists (s15 E2 note) |
| process.flow | Native: only the last node is accent (`core.js:280`), the others surface with accent2 icons; labels Nunito 800. The token pill is ink with a label at 800 (faux bold): no `token` in this style until the weight clamp lands |
| timeline | Native: event dots and dates in accent2 (`more.js:394` to `:395`), no accent. Dates 3 words or fewer |
| quiz.question | Native: option letters on accent2 discs (`more.js:47`), kicker accent2. The pause label is label at 800 (faux bold, `:61`): give `pause_label` 3 words or fewer so the faux bold is small |
| quiz.answer | Native: the right option gets a pos ring and tick (`more.js:105`); the takeaway is lead in accent (`:138`), the frame's one accent |
| recap | Native: tokens are surface discs with accent2 icons (`more.js:277`); the rule pill is accent2 with field text (4.98:1, `:284`). No accent unless seeded (see above). Labels 3 words or fewer |
| scenario.dialogue | Draws no room: a 34 px surface2 bar on the field (`more.js:202`), so it fails polish item 1. Prefer the bespoke two-shot (R2). If used, at most once a lesson: both sides name `cast` (else left wears accent and right accent4, `:211`); bubbles are ink (left) and accent2 (right) with field text at Nunito 800 (`:227`, `:230`); lines 12 words or fewer (schema) |
| avatar (`Loom.presenter`) | At most once a lesson, with `cast` and a `card` (the bare disc left two thirds of the frame empty, RC17). Without `cast` it wears the pack's `characters.cloth`. The card's rule is title in accent (`overlay.js:220`), its bullets are 20 px accent dots (`:212`). Its mouth follows the narration's loudness, which is right for a presenter |
| hero.character_moment | Name `cast` (the schema's `cloth` defaults to accent, `heroes.js:110`), and give the same `member` as story.cast (a different one warns `cast_overrides_props`). Its desk is a 30 px surface2 bar on the field (`heroes.js:126`): prefer a bespoke scene in a room |
| stat.hero, chart.bars | Avoid: a floating number or chart. Put the figure on a prop (s6) |

## 11. Recipes (code)

Every call below was read in the runtime file named. Full, previewed versions:
`scenes_examples/style_story_cartoon_rig_mid_shot.js` (R1) and `scenes_examples/style_story_cartoon_two_shot.js` (R2).

**R1. One designed person in a medium shot, presenting the prop that carries the number** (`ctx.scenery`,
`Loom.scenery.desk`: `scenery.js`; `ctx.character`, `.pose`, `.hold`, `.emotion`, `.gesture`: `rig.js`,
`rigs/imported.js`; `m.drop`, `m.stamp`: `motion.js`)
```js
const room = ctx.scenery("room", "set", { window: true, windowX: 1530, floor: 0.97 });   // floor line at y 1048, 73 px below her hip
Loom.scenery.desk(room.E.inner, 1440, room.floorY + 40, 480, {});
const notice = ctx.el("notice", { x: 150, y: 150, w: 640, h: 460, kind: "card", exit: "recede" });
kit.rect(notice.inner, 0, 0, 640, 460, { fill: "surface", r: 8 });
kit.text(notice.inner, "Refunds over", { role: "lead", x: 40, y: 50, w: 560, h: 70, maxLines: 1, align: "center", valign: "middle", color: "ink" });
const num = ctx.el("notice_number", { x: 40, y: 130, w: 560, h: 190, kind: "value", parent: notice.inner });
kit.text(num.inner, "$500", { role: "display", x: 0, y: 0, w: 560, h: 190, maxLines: 1, align: "center", valign: "middle", color: "accent" });
m.drop(notice, Math.max(ctx.start + 0.05, ctx.cue("the notice") - 0.2));   // never before the beat (bad_time)
m.stamp(num, ctx.cue("five hundred"));
const maya = ctx.character("maya", "maya", { x: 1230, y: 1710, scale: 0.85, pose: "idle" });   // medium shot
maya.gesture("tilt", ctx.cue("Maya checks"), ctx.cue("the notice") + 0.4);   // narration about her: act, no talk
maya.pose("present", ctx.cue("the notice"), { dur: 0.6 });
maya.hold("hand_r", "palm_up_offer", ctx.cue("the notice"), ctx.cue("second check") + 0.6);
maya.emotion("focus", ctx.cue("five hundred"));
```

**R2. Two people across a table, the number on the board between them** (`kit.peep`: `kit.js:501`; `Loom.drive`:
SCENE_API low level). Literal calls, so the cast gate sees both people; one drive per person owns its faces.
```js
const SIZE = 640, Y = 620, EMOS = ["neutral", "explaining", "surprised"];
const rina = ctx.el("rina", { x: 560 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character" });
const joel = ctx.el("joel", { x: 1360 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character" });
const faces = { rina: {}, joel: {} };
for (const em of EMOS) {
  faces.rina[em] = kit.peep(rina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  faces.joel[em] = kit.peep(joel.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
}
// then a table drawn AFTER the people (top surface at y 900, front field2) hides where the busts end; nameplates on its edge;
// then per person: Loom.drive((e, raw) => { const want = faceAt(t); for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden"; }, ...)
```
The member, skin and cloth are story.cast's, so a template that draws the same people later draws them identically.

**R3. The turn card** (`ctx.narrationCard`: `scenery.js:153`)
```js
const done = ctx.narrationCard("turn", "But on Friday, nobody checked.", ctx.cue("But on Friday"), { weight: 400 });
```
One sentence, 8 words or fewer, title role in field on ink (12.61:1), typed at 24 characters a second; `done` is when
the line is complete. On the round 2 preview (`outputs/sc_r2/r3_check__story-cartoon__03.50.png`) this 5-word line set
at the title size on two lines, centred, Patrick Hand at 400. A card of one to three words may be set whole in
caption_active (`{weight: 400, color: "caption_active"}`, 8.42:1). Never one coloured word inside a longer line: that
needs a second `kit.text` for one label.

**R4. A crowd that stays behind the cast** (`ctx.crowd`: `scenery.js:133`; draws the pack's `characters.extras`)
```js
const P = Loom.place.office(ctx, "office", { side: "right", look: "flat" });   // no accent furniture
ctx.crowd("colleagues", { x: 620, y: P.floorY + 10, w: 320, count: 3, rows: 1, scale: 0.36, parent: P.layers.far.g });
```
Feet come from the place's own `floorY` (842 in the flat office), never a typed number: round 1's y 712 suited the
3D office's back wall (bottom at y 700) and floats above the flat office's floor. On the round 2 preview (`outputs/sc_r2/r4_check__story-cartoon__03.50.png`) the
three extras stand on the floor between the window and the desk at about 270 px tall, in muted, surface2 and ink
clothes. Extras are at least a third smaller than the cast and never in front of a cast member's face.

**R5. A push into the prop when the number matters** (`Loom.cam.push`: `places.js:448`; only on a place)
```js
Loom.cam.push(P, { to: P.anchors.calendar, scale: 1.5, t0: ctx.cue("the deadline") - 0.4, t1: ctx.cue("the deadline") + 0.6 });
```
At most one push a beat; annotations leave before it (SCENE_API "Layering and joins").

**R6. A sign in the hand face** (`Loom.scenery.sign`: `scenery.js:118`)
```js
Loom.scenery.sign(room.E.inner, 1180, 240, 520, 170, "Refunds desk", { weight: 400 });   // label role, 6 words or fewer
```
The sign arrives with the room. For 7 words or more pass `role: "lead"` (Nunito, weight 800).

## 12. Failure modes seen in real frames

| failure | where it was seen | why | the rule or check that prevents it |
|---|---|---|---|
| the spoken caption word vanished | every bench video (post-mortem RC20): accent2 on the dark pill, 2.03:1 | the active colour was a light-ground accent | pack `captions.active: "caption_active"` (6.77:1); `loom/checks/style_lint.py` `lint_style` now fails it (proved in round 2) |
| people changed between beats | budget's Jordan in five forms; claude's Priya and Dev on three rigs; gemini's colleague changed skin and shirt (RC18) | no tie from a name to a look; templates coloured people by side | s8: story.cast with a fixed look; the `story.cast_errors` gate; literal person calls in scenes |
| bean people in a corporate lesson | claude-balanced b01 to b04, lab_story_set | `pip`, `tess` used as cast; extras were grey beans | s8 table; pack `characters.extras: "people"` |
| heads cut by the frame | claude-balanced b01 to b04, b21, b47 to b52 (RC12) | bean rigs at scale 1.1 to 1.5 with no frame check | s6 shot table; `figure_cropped` (`rig.js:263`) |
| everyone wears the teaching red | lab_story_set (Tess), claude-balanced b01, lab_props_people (Jo) | pack `characters.cloth` was accent; template default cloth accent | pack `characters.cloth: "cloth"`; s8 rule 7; `roles.person_cloth` (s15 E2) |
| red furniture fights the cast and the number | `Loom.place.office` preview in this pack (desk, drawers, shelf all accent) | `places.js` uses the accent as wood | s9 fallbacks; `materials` (s15 E1) |
| the "wrong" red and the teaching red were one colour | brick-red discs carrying ticks beside red emphasis (claude-balanced b05, b11, b14 to b16; which token each disc used was not traced) | neg #B23E2C was 4 degrees of hue from the accent | neg #9B2D4F (31 degrees away and darker); verdicts always carry a tick or cross shape |
| a dark card that is not a turn | document.page "Pocket rule" and "Handover account" pages (budget b05, b10; openai b08 to b11) | the template's page is ink | s10; paper variant (s15 E7) |
| avatar beats two thirds empty | openai b01, b04; mixed b01 to b03 (RC17) | a 600 px disc and nothing else | s10: avatar once, with `card` |
| the floor line along a hem or through a chin | round 1 R1 preview (`outputs/sc_style/style_story_cartoon_rig_mid_shot__story-cartoon__04.80.png`: skirting at y 954 to 972 along the sweater hem); round 1 R2's first draft (chins) | set lines placed without the figure's landmarks | s6 tangent rule (40 px) and Maya's landmark formula; R1 floor 0.97 |
| a face too small for a reaction | round 1's first R1 draft (Maya at scale 0.62, a full figure) | a full figure in a frame meant for a reaction | s6: a reaction needs brow to chin 150 px or more (Maya at 0.62 is about 117 px, computed) |
| the table front read as more wall | round 2 R2 preview (`outputs/sc_r2/style_story_cartoon_two_shot__story-cartoon__04.50.png`, before the fix) | the front and the wall were both surface2 | s5: each depth layer one value step apart; R2 front in field2 |

## 13. Polish checklist (yes or no, on the contact sheet or the beat's strip)

1. Does every beat with a person happen in a place (no person on a bare field)?
2. Does each named person look the same in every beat (same kit, skin, clothes, hair)?
3. Is any person drawn as a bean (`pip`, `tess`, `extra`) or a named `ava` or `sam`? (must be no)
4. Is any person wearing accent, accent2, pos or neg? (must be no)
5. Does each frame have at most one accent element (a shape 24 px or more on both sides, or accent text), and is it
   the thing the narration names at that moment?
6. Is every number on a prop, the largest type in its frame, and on screen by its spoken word?
7. Are the two people of a two-shot on the same sides in every beat, with eyes within 20 px of each other?
8. Is any head cut at the top, or any person cut by the frame within 80 px of a neck, hip, knee or ankle? (must be
   no)
9. Does any set line (floor, window, board, table edge) touch or run along a head, chin, hand, hem or hip? (must be
   no)
10. In a reaction beat, is the face (brow to chin) at least 150 px?
11. On every frame with a caption, is the spoken word visibly honey and the rest light on the dark pill?
12. Is any sign, nameplate or title in a heavy, smeared hand face (synthetic bold)? (must be no)
13. Is hand lettering only on signs, nameplates and numbers (6 words or fewer) and titles and turn cards (9 or
    fewer), with everything else in Nunito?
14. Is every black card a turn (one sentence of 8 words or fewer), with 1 to 3 in the lesson?
15. Is any dark card used for something other than a turn or a screen? (must be no)
16. On each beat's strip (`py -m loom strips <id>`), does something visibly change (not a breath or blink) at least
    every 4 s outside turn cards?
17. Are extras muted, at least a third smaller than the cast, and behind every cast face?
18. Are verdicts (pos, neg) shown with a tick or cross shape, never by colour alone?
19. Are template beats a quarter of the lesson or fewer?
20. Is any text in muted within about 400 px of a frame corner, or any section label at the top left? (must be no)

## 14. Gaps (what the style needs and the engine or assets do not have)

| gap | size | what it blocks | request (s15) |
|---|---|---|---|
| a second and third designed story cast member | M | a full-figure two-shot; today two people means peep busts | A1 |
| 3/4 and back views, a walk, sitting poses for imported rigs | M | over-the-shoulder coverage, walking in, a seated meeting | A2 |
| a designed bust kit with open-eyed rest faces | S | listeners look asleep at rest | A3 |
| a designed office crowd kit | M | extras today are code-drawn ava and sam | A4 |
| furniture without the accent in `Loom.place` | S | the office and meeting places in this pack | E1 |
| template colour roles (person cloth, links, buttons, chat bubbles) | M | template people without `cast`; UI frames | E2 |
| no synthetic bold for Patrick Hand | S | signs, turn cards, chapters, section labels, three templates | E3 |
| a paper document.page | S to M | documents without a dark card | E7 |
| previews of example scenes with real cue timing | S | every "check the strip" note in this guide | E8 |
| a contact shadow under people and scenery furniture | S | wide shots with feet on an open floor | E11 |
| a hand italic face for dialogue captions (download needs Kshitij's approval) | S | Crayon's italic dialogue lines | A5 |
| a split-screen call layout and speech bubbles tied to word timings (WALLS_AND_NEEDS, the Crayon needs paragraph under "Order of work") | M | phone calls and negotiations | A6 |

Verification still open (no engine change needed, run on the PC):
- a Chrome strip of R1 and R2 (`py -m loom lab` once E8 lands, or a one-off harness), including the R2 board corners
  against the hair, R4's crowd feet and R1's hand against the caption pill;
- an encoded-MP4 look at the caption colour and a within-style A/B of vignette 0.32 against 0.18;
- a Chrome frame of a Patrick Hand sign at weight 700, to confirm the synthetic bold this guide assumes.

## 15. Engine and asset requests

Shared names across the five style guides. "Proposed" means not yet read by the runtime. Each line says what this
guide does until it lands.

| id | request (shared name) | size | what story-cartoon would set | until it lands (the fallback rule) |
|---|---|---|---|---|
| E1 | pack `materials: {wood, chair, screen}`, read by `runtime/places.js` and `runtime/scenery.js` instead of the hard-coded accent (shipped 2026-10-08, WS6: see section 16) | S | wood `shadow`, chair `muted`, screen `surface2` (to be judged on a within-style preview) | s9: `Loom.place.office` with `look: "flat"`, or `ctx.scenery("room")` with `screen: "surface2"` and no shelf; the red office only where nothing else is accent |
| E2 | pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` for template default colours (shipped 2026-10-08, WS6: see section 16) | M | person_cloth `cloth`, link `accent2`, button `accent3`, me_bubble `accent3` (ink text 4.93:1); the other nine keep today's accent2 | `cast` on every template person; `link: {tone: "accent2"}`, `button: {fill: "accent3"}`; a chat frame has no other accent. Not in the shared set, raised for round 3: a list.steps marker role (today every number disc is accent, `core.js:148`); until then `marker: "tick"` or a bespoke prop |
| E3 | font weight clamp to loaded weights (no synthetic bold) (shipped 2026-10-08, WS6: see section 16) | S | nothing: Patrick Hand clamps to 400 | pass `weight: 400` to `Loom.scenery.sign` and `ctx.narrationCard`; no `Loom.data.chapter`; section labels off; avoid list.steps numerals, compare.two stance tags and the process.flow token |
| E4 | m.draw stroke-first, keeps per-path opacity and dashes (shipped 2026-10-08, WS6: see section 16) | S | nothing | reveal dashed lines (`m.reveal`), draw only solid ones |
| E5 | `fx.spotlight: {strength, tint}` (shipped 2026-10-08, WS6: see section 16) | S | strength 0.3, tint `ink` | no `ctx.fxMoment("spotlight")` in this style |
| E6 | `fx.vignette_under` true or false (shipped 2026-10-08, WS6: see section 16) | S | `true` | no muted text within 400 px of a corner; section labels off |
| E7 | a paper (light) document.page variant (this guide's own request; not in the shared set) | S to M | the paper variant, surface page and ink text | `Loom.ui.doc` on a desk, or a paper prop in a bespoke scene |
| E8 | loom lab --file with @lab cue map (proposed runtime fix: `py -m loom lab` takes a scene outside `scenes_examples/lab/` and resolves word cues from the `@lab` words; today `ctx.cue` returns 0 there, `loom/lab.py:41`) | S | nothing | previews with `tools/lab_preview.py` and a one-off `lab.LAB` override; every timing claim stays "check the strip" |
| E9 | pack `characters.bottom` (shipped 2026-10-08, WS6: see section 16) | S | `ink` | none needed: this guide places `ava` and `sam` only through `ctx.crowd`, which sets trousers itself (`scenery.js:145`), and Maya's colours are baked in |
| E10 | M.travel drive key (shipped 2026-10-08, WS6: see section 16) | S | nothing | this guide uses no `m.travel`; a scene that travels a prop twice is checked on its strip |
| E11 | a contact shadow under rigs and under `Loom.scenery` furniture (this guide's own request; not in the shared set) | S | `shadow` at 0.28, as the 3D office draws | medium or closer shots, or feet behind a desk or table edge (s5) |
| A1 | DANIEL and PRIYA from ASSET_WISHLIST A0, Claude Design prompt F1 with Maya's sheet | M | | busts (peeps) for a second person; one full-figure person a frame |
| A2 | 3/4 and back views, a walk and sitting poses for imported rigs (WALLS_AND_NEEDS s3) | M | | front-facing staging only; cut away instead of walking in |
| A3 | a designed bust kit in the S2 style block (CHARACTER_PROMPTS) with open-eyed rest faces | S | | never hold the closed-eyed peep `neutral` on a listener for more than 4 s; switch to `surprised` or `explaining` on a key word |
| A4 | the office crowd kit (`office_crowd` in `packs/worlds/office.json`) | M | | `ctx.crowd` with muted ava and sam at scale 0.4 or less, behind the cast |
| A5 | a hand italic face for dialogue captions (needs Kshitij's approval to download) | S | | dialogue in the normal caption pill; no faked italic |
| A6 | a split-screen call layout and speech bubbles tied to word timings | M | | one person a shot, cut on the speaker change; the phone in the place shows the call |

---

## 16. Verified on 2026-10-08 (the WS6 proof)

The section 15 runtime requests marked S shipped on 2026-10-08 (D-128; report
`docs/research/2026-10-08-style-system-report.md`; tests `tests/suites/style_system.py`). Sections 1 to 15 were
written before they landed: where a passage says "proposed", "not yet read by the runtime" or "until X lands", X has
landed, the pack below sets it, and that passage's fallback is no longer needed unless this section says so. The
strips, the measurements and the section 13 checklist results are in
`docs/styles/demos/guides/story-cartoon/README.md`; the encoded example is `docs/styles/demos/guides/story-cartoon/style_story_cartoon_two_shot__h264_crf18.mp4`.

**What the runtime now reads from this pack:**
- `materials`: wood `shadow`, chair `muted`, screen `surface2`, books `["cloth", "cloth2", "accent3", "surface"]`, plant `accent4`
- `roles`: person_cloth `["cloth", "cloth2"]`, link `accent2`, button `accent3`, me_bubble `accent3`
- `fx.spotlight` `{"strength": 0.3, "tint": "ink"}`, `fx.vignette_under` `true`
- `characters.bottom` `ink`
- `shape`: contact_shadow `0.28`
- `templates["document.page"].variant` `paper`

**Shared changes every style gets:** words are drawn and measured at a weight the family loaded (no synthetic bold);
`m.draw` draws outlines before fills, keeps each path's own opacity and keeps a dashed line's dashes; a second
`m.travel` of one element no longer shows at load; the lab renders any scene file with its `@lab` cues and words
(`py -m loom lab --file <scene> --out <dir>`); the API agents and the Cowork task files read this guide for the
storyboard and scene stages; `py tools/context_check.py` fails when section 2's palette rows disagree with the pack.

**Verified in Chrome:** both examples pass the checklist items they reach (people in a place, one accent on the
number, the number on a prop, single-weight Patrick Hand, all words 26 px or larger). Fixed in the proof: the
two-shot's nameplates (78 px plates, `tight_inset`), and the mid shot's crop (Maya stands 45 px higher: the frame cuts
mid-thigh, the floor line 85 px below her hem). The paper variant of `document.page` and the contact shadow are
tested. On the crf 18 MP4 the paper grain survives and nothing bands (41.5 dB).
**Still unverified:** a reaction face's size (item 10), eye level in px (item 7), people across beats (item 2), the
0.32 vignette on a real lesson (Kshitij's decision, unchanged).
**Found on the claude fork (a story-cartoon lesson):** with `vignette_under`, a template beat shows no vignette: its
full-frame backplate covers the layer under the world, while bespoke beats keep it. Decided (D-132): kept as is. Engine lab layouts overflow the 30 px label floor
(the UI type role, M in WALLS_AND_NEEDS).

## 17. Set decorations follow the pack (2026-10-08, D-133)

`runtime/places.js` now reads `materials.window_lights`, `vessel`, `cells`, `leds`, `cables`, `chart` and
`safety_line` (L-286), and `Loom.obj` reads `materials.objects` for every kind. Each value below comes from section 2
and is set only where the runtime's fallback breaks a rule there; a key left out keeps its fallback because section 2
allows it. Where an earlier section says `places.js` hard-codes one of these, it no longer does. This section
supersedes the `materials` line of section 16. Strips: `docs/styles/demos/guides/story-cartoon/lab_set_decor__story-cartoon.jpg` (after)
and `lab_set_decor__story-cartoon__before.jpg`, from `scenes_examples/lab/lab_set_decor.js`; record
`docs/research/style-system/red_L276_set_decor.txt`.

**What the runtime now reads from this pack (`materials`, in full):**
- wood `shadow`, chair `muted`, screen `surface2`, books `["cloth", "cloth2", "accent3", "surface"]`, plant `accent4`,
  cells `["field2", "accent2"]`, leds `["accent4", "accent2"]`, cables `["accent3", "line", "muted"]`, chart
  `["muted", "accent4"]`, objects `{document: accent4, envelope: surface, folder: surface, package: field2, lock:
  accent3}`

**Why (section 2):** the accent is the one thing the narration names and never furniture or a background fill, so the
cells and the package are field2 (quiet props) and the lock accent3 (calm fills); pos is never decoration, so the
LEDs are accent4 and accent2 (small details); a frame holds at most two saturated families besides skin, so the cables
are accent3 with line and muted, and the chart is muted bars with an accent4 last bar; accent2 is labels and small
details, so the envelope and folder are surface (paper props); the document is accent4 (the document header band; a
surface document draws its header in the accent). Left at the fallback: window lights and safety line accent2 (small
details), vessel and calendar accent3 (calm fills, calendar headers), clock and building accent4, heart accent3,
phone surface2, bulb accent2; the laptop reads no tone.
**Seen on the strips:** cream and ochre cells on the teal vessel, one teal family in the server room, tan packages in
outline. **Still open:** the accents inside the object drawings (L-287).
