# Style guide: cinematic-noir

STATUS: PARTIAL 2026-10-07 (round 2 review the same day). Written from the pack (`packs/styles/cinematic-noir.json`), the
runtime code that reads it (`runtime/depth.js`, `fx.js`, `style.js`, `kit.js`, `world.js`, `overlay.js`, `scenery.js`,
`ui_artefacts.js`, `data.js`, `places.js`, `objects.js`, `motion.js`, `templates/*.js`), `loom/compose.py` (join
meanings), the phishing lesson's frames (`projects/phishing-report/qa/sheets/_overview.jpg`), the frame audit
(`docs/research/2026-10-03-frame-audit.md`) and two example scenes (`scenes_examples/style_cinematic_noir_after_hours.js`,
`scenes_examples/style_cinematic_noir_evidence.js`). The example renders and the H.264 test cited as `outputs/noir_lab/...`
live in the Cowork session's outputs folder, NOT in this repo (they were not synced, CLAUDE.md rule 10); a reader of
the repo cannot open them. Anything not verified is marked where it is said and collected in section 14. Proposed
runtime keys and fixes are labelled "proposed (not yet read by the runtime)" and listed in section 15.

This guide compares versions of THIS style only (D-122). "Better" here means closer to noir's own references and
purpose.

**The style in ten rules** (each is expanded below):
1. Darkness is drawn, not overlaid: 55 to 70 % of a settled frame is unlit field; every light has a visible source and
   a surface it lands on.
2. Light is hard: lit planes are flat fills with an edge (a pool on a desk, bars through blinds). A soft gradient is
   allowed only under 250 px across (a glow halo) or inside the depth stage's own cone and haze.
3. One key (ink, warm white), one fill (accent3, cool), one accent (amber) on the one thing the narration names. The
   accent is never a light that fills a room.
4. Red means danger or the wrong move. Write `neg` for it in new code; never write `accent2` (section 2, interim rule
   for D-N1).
5. Text never sits inside the first 70 % of a cone, within 3 r of a glow's centre, over the window or in a haze band;
   it sits on dark field or on a pane.
6. Titles, panes, tags and leads live outside the depth stage: only scenery rides the dolly.
7. A UI artefact is a lit object in a dark world: pane 1100 px wide or more, a lit plane behind it, never alone on the
   void.
8. One camera move per shot: `push` 0.03 to 0.08, `drift` -15 to -40 px over the whole beat; a light whose lamp is in
   frame rides in the lamp's own layer (R2b).
9. No improvised people: a designed 2.5D lit cast, or the beat is framed on the object, the empty chair, the screen.
10. Finish stays near-off (grain 0.01, vignette 0.35, leak 0.05); judge darks on the encoded MP4.

---

## 1. Purpose and register

Cinematic-noir is the 2.5D night register: layered depth with parallax, one warm key light in a dark room, cool fill
through a window, haze, a serif title face and slow camera moves. It is for lessons where stakes, risk and consequence
should be felt before they are explained: security incidents, fraud and social engineering, a case study told as a
story, ethics dilemmas, a hook that opens a lesson cold. It reads as serious and adult, the way a good documentary
treats a case file. It must not be used for cheerful onboarding or dense data (the pack's `avoid_for`), nor for a
step-by-step software walkthrough of more than 3 screens (a long UI procedure needs light screens, and every pane here
must be lit and placed, section 9). It suits corporate adults because it never talks down: it lights the evidence and
lets the viewer look.

**Reference board** (studied, never copied or republished; no files downloaded):

| reference | take | do not take |
|---|---|---|
| Classic film noir lighting: low key, hard small sources, venetian-blind shadows, figures backlit in fog ([PremiumBeat](https://www.premiumbeat.com/blog/lighting-for-film-noir), [No Film School](https://nofilmschool.com/2016/05/film-noir-budget)) | hard light with crisp edges; light as shapes on walls and floors (blind bars); a lit pool with darkness around it; the silhouette as "anyone" | crushed pure black over most of the frame (it blocks after H.264, section 5); Dutch angles (the depth stage has no rotation, and corporate adults read them as mannered); smoke and cigarettes |
| Sin City (2005): monochrome with one saturated colour ([colour analysis](https://colorculture.org/sin-city-cinematography-analysis/)) | one accent colour that carries meaning, made loud by the restraint around it | its violence, blown highlights and gore; red as decoration |
| Saul Bass titles, Anatomy of a Murder (1959) ([notes](https://coolhunting.com/design/saul-bass-anatomy-of-a-murder/)) | at most three colours in a title frame; one symbolic silhouette; type that is part of the composition | the cut-paper jaggedness (a different material) |
| "The Kid Stays in the Picture" 2.5D photo parallax ([technique](https://petapixel.com/2013/11/19/creating-motion-stills-animate-photo-post-parallax-effect)) | separated foreground, mid and back layers; ONE slow camera move per still; near layers move more | fast or bouncing parallax; pushes that reveal the edge of a layer |
| Zero Days (2016) explainer graphics of code in dark interfaces ([review](https://www.scworld.com/news/zero-days-documentary-stuxnet-a-harbinger-of-cyberwarfare)) | the real artefact (code, a message) shown on a dark field, tied to the story at the right moment | "hacker" green rain, glitch effects, invented screens that look technical but say nothing |
| Teal and orange grading ([overview](https://pixflow.net/blog/teal-and-orange-color-grading/)) | warm key on the subject, cool shadows and fill: here ink and accent warm, accent3 cool | the saturation push of blockbuster grades; warm and cool both loud at once |

The pack's `tone_reference` (the TED-Ed "dark void, single light" family) is a measured reference, not a target
(D-112); section 5 has what it measures and what it means for a noir lesson.

## 2. Palette roles

Area shares are TARGETS for a settled frame of a scene beat, judged on the contact sheet; the measured part is the
luma distribution in section 5. Contrast ratios are WCAG, from `loom.checks.style_lint.contrast` (several re-computed
by hand in the round 2 review from the hex values below; they match to 0.01).

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #0B0F17 | night air, unlit wall, the page | everywhere as the ground | be crushed further by a vignette over 0.35 (section 5) | 55 to 70 % |
| field2 | #141B28 | upper air, far planes, lifted shadow | `st.sky` (its default top), far layers, the night outside a window | carry text smaller than lead (34 px) | 5 to 15 % |
| surface | #1C2536 | panes, cards, near furniture, the desk | `Loom.ui` panes, cards, props | fill more than 40 % of the frame as one flat rectangle (it reads as a slide) | 15 to 30 % |
| surface2 | #101723 | recessed planes, room walls, wells | walls, attachment chips, legs and backs of furniture, the "away" laptop lid (objects.js) | carry body text without a lighter pane under it (15.18:1 with ink, but it reads as a hole) | 5 to 15 % |
| shadow | #05070B | the deepest dark: cast shadows, foreground silhouettes, blind slats | near layers (z 0.85 to 1), contact shadows, slats | be a text ground except the turn card (section 11); sit as a large area next to field (they differ by 6 to 12 code values and band) | under 10 % |
| ink | #F3EBDD | text; the KEY LIGHT colour (lamp, moon, bulb, cone) | titles, body, light sources at 0.06 to 0.35 opacity | be a full-frame ground (`ctx.narrationCard`'s default ground is ink: pass `{ground: "shadow", color: "ink"}`) | text 3 to 8 %, light 2 to 6 % |
| muted | #9AA4B6 | secondary text, meta, inactive icons, lit-window specks | subtitles, `to you`, times, toolbar icons, the section label | sit inside a cone or a glow halo (2.74:1 at a cone peak) | under 3 % |
| line | #677286 | hairlines, dividers, axes, leads at rest, lamp arms | strokes 2 to 7 px | carry text (3.95:1 on field is for strokes) | under 2 % |
| accent | #F2A541 | THE accent: the one thing the narration names, and the move the lesson teaches | the named object's glow, the Report action, the active caption word, a tag for the move | decorate: desks, shelves, chairs, windows, avatars, links, chat bubbles, washes behind panes (all seen, section 12) | 0.5 to 2 %, never over 5 % |
| accent2 | #E4572E | identical to `neg` (the pack's `_palette_note`) | nowhere in new code: write `neg` | be a kicker, term, date, quiz letter, recap rule, stat or stage light (all runtime defaults, section 10) | 0 % as accent2 |
| accent3 | #7FB3D5 | the cool FILL: moonlight, window glass, rims, haze; a link in a UI | window glass at 0.5 opacity or less, rim strokes, `st.haze(..., "accent3")`, `link.tone`, `button.fill` | be a second emphasis next to the accent; be a solid area over 1 % of the frame at full strength (a 520 x 440 window at full accent3 out-pulled the accent) | 2 to 8 % |
| accent4 | #C9B79C | old paper: quiet warm labels | kickers, chapter kicker and sub, case-file stamps, the mail banner (its default), the quiz pause bar (its default) | fill more than 2 % of the frame at full strength | under 2 % |
| pos | #8FBF8F | correct, safe | a tick, a verdict, the "reported" state | appear without a verdict to carry | under 1 % |
| neg | #E4572E | danger, the wrong move, the sign of a threat | marks on a phishing sign, a "not our domain" tag, a cross | decorate | 0 to 2 % |
| onAccent | #0B0F17 | text ON accent, neg, accent3, accent4, pos | tag text, button labels (`Loom.data.tag` default) | sit on surface (1.25:1) | with its fill |

**Interim rule for D-N1 (accent2 equals neg, pending Kshitij, section 14).** Until D-N1 is decided: (a) new scene code
writes `neg` wherever the meaning is danger and never writes `accent2`; (b) nothing that is not danger may be drawn by a
call whose default is accent2, so pass a colour or avoid the call (the list is in section 10); (c) leave every template
`kicker` empty. Scenes written this way are correct under both options of D-N1 and need no migration.

**Text pairs that are allowed** (`py -c "from loom.checks.style_lint import contrast as c; print(c('#9AA4B6','#0B0F17'))"`):

| text on ground | ratio | use |
|---|---|---|
| ink on field / surface / surface2 | 16.20 / 12.97 / 15.18 | any size |
| muted on field / surface | 7.63 / 6.11 | any size, secondary |
| accent on field / surface | 9.35 / 7.48 | any size |
| accent3 on surface (a link) | 6.81 | body (30 px) and up |
| accent4 on field | 9.81 | kickers |
| neg on field / surface | 5.21 / 4.17 | on field any size; on surface 24 px bold or larger only |
| onAccent on accent / neg / accent3 / accent4 / pos | 9.35 / 5.21 / 8.50 / 9.81 / 9.15 | tag and button text |
| caption fg (ink) / active (accent) on the caption pill composited over field (#06090E) | 16.84 / 9.72 | captions (pack `captions`) |
| the same, pill composited over ink #F3EBDD (gives #393939, the worst case) | 9.76 / 5.63 | still above 4.5 |

**Forbidden pairs:** ink on accent, accent3, accent4 or pos (1.65 to 1.91); field or onAccent on surface (1.25); line as
text anywhere; muted inside a cone or glow (2.74 at a cone peak); muted behind a `ui.mark` sweep over 0.22 opacity
(4.03 at 0.34 neg); any text the narration is still reading outside a spotlight rect (ink on surface drops to 3.50 under
the 0.55 dim).

**Frame stats** (the film check's own measure, used in section 5):
```
py -c "import sys,glob; from loom.checks.film import _tone; [print(f, round(_tone(f)['brightness'],3)) for f in sorted(glob.glob(sys.argv[1]))]" "<frames>/*.png"
```

## 3. Type

`kit.text` picks a weight when none is given (`kit.js` fontStr): the display face's LAST loaded weight for display,
hero and title (Fraunces 800 here), and the body face's SECOND loaded weight for every other role (Inter 700 here). So
body text is Inter 700 unless the call passes `weight: 500`.

| role | family, default weight | size range (pack) | use in noir |
|---|---|---|---|
| display | Fraunces 800 | 110 to 170 | one word or number per lesson at most (a chapter sting) |
| hero | Fraunces 800 | 96 to 150 | chapter titles (`Loom.data.chapter` asks for 900; only 700 and 800 are loaded, so CSS matching picks 800; not checked frame by frame) |
| title | Fraunces 800 (700 allowed) | 60 to 92 | the beat's headline, sentence case, at most 2 lines |
| lead | Inter 700 | 34 to 44 | subtitles, mail subject and sender, tags |
| body | Inter 700 by default; pass `weight: 500` for paragraphs of 2 lines or more | 30 to 36 | paragraphs, mail body (Loom.ui clamps to this range: a pane cannot type larger than 36 at any `display`) |
| label | Inter 700 | 24 to 30 | kickers (tracked caps), meta, chips; 26 px or larger on screen after camera scale (film check: warning under 26, error under 18) |
| caption | Inter 700 | 20 to 24 (burned captions use their own 36 px, `captions.size`, at y 948) | |

- **Serif for the story, sans for the evidence.** Fraunces sets titles and chapter stings (the case-file voice); Inter
  sets everything inside an artefact, every tag and every number that is evidence. A mail pane never uses Fraunces.
- **Case:** sentence case for titles and tags; tracked capitals (0.2 em, `kit.kicker`) for kickers only, at most 4 words
  (`kit.kicker` warns over 4). No all-caps body, no italics (no italic face is loaded; `Loom.data.chapter`'s doc comment
  says "italic subtitle" but the code sets none).
- **Line length:** titles at most 2 lines; body at most 62 characters a line (a 1180 px pane at 32 px).
- **Numbers:** Inter 700 in tags and counters (`Loom.data.counter` defaults to ink); a value in accent only when it is
  the named thing.
- **Loaded weights only:** ask only for 500 or 700 (Inter) and 700 or 800 (Fraunces). `Loom.ui` asks for 600 on the
  attachment chip and the section label chrome asks for 800; both fall to 700 by CSS matching. Whether Chrome adds a
  synthetic bold anywhere is unverified (request "font weight clamp to loaded weights (no synthetic bold)", section 15).
- **Chapter chrome:** with storyboard `chrome.section_labels`, `overlay.js` prints the section label at (96, 44) in
  muted, Inter at 24 px, tracked 0.18 em, upper case. It is 2 px under this guide's 26 px floor and is fixed in code;
  whether the film check measures it is unverified. It sits in the overlay ABOVE the fx layer, so the vignette never
  darkens it. Keep scene text out of the band y 30 to 80, x 96 to 900 when section labels are on.

## 4. Shape language

Pack: `shape.radius` 6, `stroke` 2, `shading` flat, `shadow` none.

- **Panes and cards:** radius 6 to 18 (Loom.ui mail and chat panes use 22, the doc page 8, ui.card 14), flat
  `surface`, no drop shadow (a dark offset shadow is invisible on field). A pane is separated from the dark by its own
  value and by a lit plane behind it (section 5), not by a stroke.
- **Strokes:** hairlines and dividers 2 px in line at 0.3 to 0.35 opacity (as `Loom.ui` draws them); leads 3 px
  (`Loom.ui.wire`); rim light 2 to 4 px in accent3 (window side) or ink (key side) at 0.25 to 0.45 opacity along the lit
  edge of an object; lamp arms 5 to 7 px in line. Round caps and joins (`kit.path` always sets them).
- **Tags:** `Loom.data.tag`, radius 6, solid fill in the token that carries the meaning (`neg` for a sign, `accent` for
  the move), onAccent text (its default). A tag names a thing in the picture and has a lead to it.
- **Leads:** `Loom.ui.wire`, 3 px, a 6 px dot at each end, ALWAYS with `tone` (its default is the accent), starting at
  the pane's edge level with the words, never across the words after them.
- **Icons:** Lucide line icons at `icons.stroke` 2.2 in muted or ink; one icon family per lesson (L-174).
- **Arrows:** at most 1 per frame; in noir a lead or a light does the pointing.

## 5. Light, shading, depth and texture

### Light is the drawing
- **Value structure first.** Decide where the light lands before drawing anything: the lit subject, a second light (a
  window, a screen), and dark everywhere else. Round 1 measured on the two examples (command not recorded, so treat as
  an estimate): 33 to 47 % of pixels under luma 20, 90 to 95 % under 40, 2 to 5 % over 90.
- **Hard light shapes, not wide gradients.** A lit plane is a flat fill (`Loom.style.mix(c("surface"), c("ink"), k)`
  with k 0.16 to 0.28) clipped to the surface it lands on, or bars of `mix(field, accent3, 0.16)` through blinds. A
  620 px radial wall wash at 0.09 opacity showed concentric rings in the PNG and worse after H.264 (`after_hours` v2).
  A soft gradient is allowed only under 250 px across (a glow halo, a screen spill) or inside `st.cone` and `st.haze`.
- **The key is ink, the fill is accent3, the accent is not a light.** `ink` for the lamp, `accent3` for window light,
  rims and haze. The accent may glow only on the named thing, at most 460 px across (`after_hours`: a 460 x 240 spill
  behind the lid on "a message lands"). Amber radial washes behind panes and buildings were seen in phishing b09 to
  b13 and b17 to b20; they spend the accent on air.
- **The pack's own wash:** `ambient.wash` is an amber radial (`rgba(242,165,65,0.10)` at 50 % 30 %, out to 65 %), drawn
  on the field div (`world.js` buildAmbient). The nebula canvas is opaque WebGL and covers it, so it shows only when the
  fx background is off or WebGL is missing (read from the code, not seen in a frame). A lesson that turns the fx
  background off sets storyboard `ambient: {wash: ""}` (decision D-N4, section 14).
- **Cone numbers** (`depth.js` cone): a screen-blended trapezoid, top width 0.12 w, stops 0 at 0 / 0.34 at 8 % / 0.12 at
  70 % / 0 at the end, blurred 14 px, always drawn at z 0.3. Use w 400 to 600 and len 120 to 450; aim the far end at
  the surface it lights. No text inside the first 70 % of a cone.
- **Glow numbers** (`depth.js` glow): a core disc of r, a halo of 1.5 r at 0.35 and one of 2.8 r at 0.12, always drawn
  at z 0.05. Bulbs r 6 to 12; a moon r 50 to 70. No text within 3 r of a glow's centre.
- **A light rides with its lamp.** At the end of the dolly a light drawn at depth zl is offset from its lamp at zo by
  dx = (zo - zl) x (drift + push x (x - cx)), dy = (zo - zl) x (lift + push x (y - cy)). `after_hours` (lamp z 0.55,
  bulb at z 0.05, push 0.06, drift -26, lamp head 280 px left of cx) gives 22 px; the frames show the bulb moving from
  the middle of the shade's mouth to its right corner (about 19 px) between 0.4 s and 9.8 s. Rule: when the lamp is in
  frame and the dolly moves, draw its cone and bulb in a screen layer at the lamp's own z (R2b); use `st.cone` and
  `st.glow` only for sources off frame or on layers within 0.05 of z 0.05 (a moon on the sky) and z 0.3. Until the
  request "depth cone and glow z option with unique gradient ids" lands (section 15).
- **One cone and one haze per depth per stage.** The cone's gradient id is `${uid}cone` and a haze's is `${uid}hz<z>`:
  a second cone in the same stage, or a second haze at the same z, takes the FIRST one's colour (read from the code).
  A second cone goes through R2b.
- **Haze:** `st.haze(z, top, token)` is a band from `top` to the bottom, 0 to 0.16 opacity of the token (default top
  700, default token ink). Use accent3 at z 0.35 to 0.45, top 560 to 700. Keep muted text out of a haze band.

### Depth (the stage: `ctx.depth(name, {dolly, push, drift, lift, focus, dof, atmosphere, cx, cy, clip, exit, parent})`)
| z | what lives there | blur at focus 0.55, dof 9 (defaults) | `st.tone` mix toward field: (1 - z) x atmosphere 0.55 |
|---|---|---|---|
| 0 to 0.15 | sky, back wall, window, far skyline | 5 to 3.5 px | 55 to 47 % |
| 0.2 to 0.45 | far furniture, haze, light bars | 3 to 1 px | 44 to 30 % |
| 0.5 to 0.6 | the focus plane: the subject, its props, its light pool | 0 to 0.5 px | 28 to 22 % |
| 0.7 to 0.85 | near furniture | 1.5 to 2.5 px | 17 to 8 % |
| 0.9 to 1.0 | foreground silhouettes (shadow token), a chair back, a door edge with a rim | 3 to 4 px | 6 to 0 % |

- Blur is `round(|z - focus| x dof x 2) / 2` px; layers made with a blend (`st.layer(z, "screen")`, the cone, the glow)
  are never blurred. With `dof` 4 to 6 (the examples) the foreground stays readable as a shape.
- Toning happens ONLY where you ask for it: `st.tone(token, z)` and `st.ridge` mix toward field; anything drawn into a
  raw `st.layer(z)` with `c(token)` keeps its full value. Use `st.tone` for every scenery fill on a layer under z 0.5.
- The dolly scales each layer by `1 + push x e x (0.25 + z)` about (cx, cy) and shifts it by `drift x e x z` (and
  `lift x e x z`), eased "editorial", over the `dolly` window.
- **Depth of field hides what must be read**: text, a pane or a number on a stage layer gets blurred and parallaxed.
  `docs/SCENE_API.md` says it and both examples obey it: keep text OUT of the stage.
- **Edges:** draw layers from x -200 to 2120 and y -200 to 1280 (the stage's own sky and haze do); a 1920 px layer shows
  its edge during a drift.
- **Shading:** the pack is flat. Volume comes from light: a rim stroke on the side facing the window, a lit plane where
  the key lands, a contact shadow (`shadow` at 0.35 to 0.6, an ellipse 0.5 to 0.6 of the object's width) under every
  object. `kit.rect(..., {shade: "recipe"})` is for glowing objects, not noir props.

### Finish (the fx layer, `runtime/fx.js`) and what H.264 does to it
| setting | pack value | why |
|---|---|---|
| background | nebula, intensity 0.35, colours [accent3, surface, accent] | slow fbm clouds kept within 0.07 luminance of the field (`band(col, 0.07)`); the field to field2 mix runs at full strength whatever the intensity (request "nebula mix scaled by intensity"); round 1 computed the worst cloud as #243141, where muted still reads 5.26:1 |
| vignette | 0.35 (was 0.6) | the TOP layer sits over the world (text drawn in scenes included) but under the overlay (captions, section label, brand logo). Alpha = 0.35 x smoothstep(0.35, 1.05, 1.25 x d): 0.23 at the safe-area corner (96, 84), 0.30 at the frame corner (re-computed in round 2). At 0.6 round 1 computed muted scene text in the safe-area corner at 2.92:1; at 0.35 it is 4.86:1 |
| grain | 0.01 | D-100 / L-173; `style_lint` fails a pack default over 0.015 |
| leak | 0.05 | a faint top-left leak in `colors[0]`, which is accent3 here: it is cool, not warm |

Round 1's H.264 test (`ffmpeg -loop 1 -i frame.png -t 1 -r 30 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p`,
darks stretched 0 to 45 into 0 to 255, `outputs/noir_lab/h264_darks_stretched.png`, Cowork outputs only): the vignette
shows faint 1-code-value rings at 0.6 and 0.35 (fainter at 0.35); the nebula shows as smoke blotches in empty field; a
wide low-opacity radial gradient shows clear rings. None is visible at normal gamma on those frames; on a calibrated
display or after a platform re-encode it is **unverified**. **Rule:** add no soft gradient over 250 px across on top
of the finish; let empty field be empty.

### Tone against the reference
The `tone_reference` (TED-Ed "dark void, single light" family) has brightness 0.37, dark share 0.37, light share 0.11,
tolerance 0.15. Round 1 measured with `_tone`: phishing frames median 0.153 (200 frames, every beat under 0.25);
`lab_depth` 0.09 to 0.11; the two examples 0.09 to 0.13. Every noir lesson will raise the tone warning (0.37 - 0.15 =
0.22 floor). **Rule:** give a noir lesson a `value_script` with at least one lifted band of 8 s or more (a lit document
filling the frame, a recap on a lit plane) and keep the dark band for the mechanism and the turn. Whether the reference
should change is D-N3, not a reason to brighten every frame.

## 6. Composition

- **Safe area and bands:** `ctx.box` = x 96, y 84, w 1728, h 846; captions at y 948 (pack `captions.top`), 36 px.
  Nothing that must be read below y 930.
- **Thirds:** the lit subject on a third (the desk at x 470 to 1400, the pane at x 120 to 1300); the title on the dark
  third opposite the light (`after_hours`: top left at x 230, y 104, 86 px clear of the window at x 1176).
- **Density:** subject plus text fill at least 45 % of the safe area on a teaching beat (audit rule). A hook or
  establishing shot may hold more dark for at most 4 s before something changes.
- **Focal point:** one per frame, and it is the lit thing: the brightest, warmest point is the named thing. A second
  light (window) is cooler and at most half as bright (accent3 glass at 0.5 opacity).
- **Scale:** objects at real proportion (`Loom.obj.O.REAL`: laptop 0.36 m, desk 1.5 m, so a laptop is 24 % of the desk's
  width); a pane in a teaching beat at least 1100 px wide; a tag's text at least 26 px on screen.
- **Text and picture:** text sits on dark field beside the light, or on a pane; never over the window, a cone, a glow
  or a busy layer. Tags go on the open dark side of the artefact, aligned to the rows they name, 70 px or more from the
  pane's edge (the examples: pane edge 1300, tags at 1370).
- **Empty space:** the dark IS the space, but a frame with no light source and no text for more than 3 s reads as black
  (phishing b38: 4 s of black, round 1 frame audit).

## 7. Motion

Pack `motion`: personality smooth, enter 0.8 s, move 0.6 s, exit 0.5 s, stagger 0.14 s, draw 1.1 s, count 1.6 s,
overshoot false. With overshoot false, `m.pop` and `m.drop` use the enter ease and `Loom.spring` clamps every preset to
bounce 0 (`motion.js`, SCENE_API): nothing in this pack can bounce.

- **Entrances that fit:** `m.unmask` (a wipe, like light crossing), `m.reveal` and `m.settle` (a fade with a 16 to 28 px
  rise), `Loom.ui.build` (a pane builds in reading order, 0.12 s apart), `Loom.data.tag` (wipes in over 0.45 s), a light
  switching on (tween the opacity of a glow or a lit plane over `ctx.style.dur("enter")`, as `after_hours` does).
- **Use sparingly:** `m.pop` (scale 0.6 to 1) only on discrete tokens under 200 px (template nodes and peers do it);
  `m.stamp` (scale 1.3 to 1) only on a verdict, at most once per beat.
- **Never:** stepped time or line boil (`Loom.stepped`, a hand-made texture), spinning icons, `m.shake` on a pane.
- **The change carries the meaning:** a noir beat's motion is light (on, off, narrowing to one thing with
  `ctx.fxMoment("spotlight", ...)`) or attention (a mark sweeping behind words). Animate what changes; keep the rest
  still.
- **Camera:** one move per shot: `push` 0.03 to 0.08 with `drift` -15 to -40 px over the whole beat
  (`dolly: [ctx.start, ctx.end]`). On a held element, `Loom.cam.frame(E, rect, t, dur, {margin})` with `margin` 60 px or
  more (60 is its default; phishing b19 cropped "Confirm your passw"). No shake, no whip pan, no tilt.
- **Ambient life:** the dolly, the nebula's drift, a blinking cursor if the scene has one. No twinkling, no particles.
- **Joins:** the pack's `join_default` is camera, and a camera join between different worlds becomes a dip unless
  `join_in.continuous: true`. By meaning (`compose.py` MEANING_JOIN): `into` gives iris, `time` wipe, `era` dip (through
  black), `meanwhile` fade (through the field), `shock` and `chapter` a cut. In noir: within one world (desk to its
  screen) a camera or zoom join; a new place a dip (`era`); a message arriving or a reveal of harm a cut (`shock`); a
  section boundary a cut. Never a material join (torn, page, scroll): a cartoon material.
- **Chapter stings:** `Loom.data.chapter(ctx, name, {kicker, title, sub, accent: "accent4"})`. `accent` colours BOTH the
  kicker and the sub (default accent2, red here: always pass it). It dims the world with field at 0.62 for `dur` 3.2 s
  and holds the scene's reveals until `E.after`.

## 8. People and living characters

Characters are needed in every style (D-122) and come from designed kits, never improvised in scene code
(`skills/lnd/lnd-character-design`). The look for this style is **S3, 2.5D lit layers** (`docs/assets/CHARACTER_PROMPTS.md`):
each figure as base, shadow, light and rim layers, one warm key from one side, a cool fill, in three light setups (key
left, key right, backlit rim only), so the stage can relight a figure by layer opacity.

- **What exists today:** no S3 cast. The code rigs `ava` and `sam` and the grey `extra` bean are not this look. The
  pack's `characters.extras` is `people`, so `ctx.crowd` draws `ava` and `sam` with muted, surface2 or line tops and ink
  or muted trousers (`scenery.js`): ink trousers are cream legs in a dark room (phishing b33 to b36). The Open Peeps
  busts (`kit.peep`) of the avatar beat and of `document.page`'s `person` are a cartoon bust, not S3.
- **Until the S3 cast is delivered** (A1, section 15), frame the beat without a person (lnd-character-design s10): the
  object the person is about (the screen, the message), the empty chair, hands only if a designed hand family exists, a
  cut to the world without people. Never a figure from primitives. Write the asset request (brief plus prompt id F3)
  into the storyboard's findings. No `ctx.crowd` in a noir scene until A2 exists.
- **When the cast exists:** a person stands on the focus plane (z 0.5 to 0.6, `parent: st.layer(z)`), lit from the side
  the key is on, rim on the window side; waist-up or closer when a face carries the moment; the backlit setup when the
  person is "anyone". Feet on the floor line with a contact shadow. Height from `Loom.obj.O.px`: a 1.7 m person beside a
  1.5 m desk drawn 930 px wide is about 1050 px.
- **Crowds:** far layers only (z 0.15 to 0.35), toned with `st.tone`, from a D7 crowd sheet in S3 (A2).

## 9. Objects, icons, data and UI

- **Objects:** `Loom.obj.shape(g, kind, cx, cy, size, {state, shadow})` on the focus-plane layer. A laptop seen from the
  room faces its user: `state: {facing: "away"}` (all surface2, lid towards us) or `"left"` / `"right"`; `"viewer"` (the
  default) only for a point-of-view shot (its bezel is ink, a cream slab here, and its default chart screen has a red
  bar). Real sizes (`O.REAL`). Lit edge and contact shadow as in section 5.
- **Places:** `Loom.place.office|meeting|...` paint desks, drawer pedestals and shelf units in the ACCENT (`places.js`
  `wood = "accent"` in deskSet and shelfUnit), meeting chairs in the accent, red books on shelves and red lit windows
  in a night skyline (accent2). Seen as amber furniture in phishing b02, b07, b08 and b41. Until pack
  `materials: {wood, chair, screen}` (proposed, not yet read by the runtime) lands: do not use `Loom.place` in noir;
  build rooms on the depth stage from surface and surface2 as the examples do.
- **Icons:** Lucide, stroke 2.2, muted or ink; an icon in the accent only if it is the named thing.
- **Data:** a number as `Loom.data.counter` (ink by default) on dark field; the one number that matters in accent.
  Bars with `Loom.data.barsOn` and a per-bar `color`: surface for the rest, accent for the named bar; axes in line. At
  most 5 bars and 1 number per frame (dense data is in `avoid_for`).
- **Mail, chat and documents (`Loom.ui`):** a dark client pane in surface, real words only.
  - Size: `w` 1100 to 1240 and `display` 0.85 to 1. At 0.85 the role clamps give subject 44, body 36, meta 30 (computed
    from `ui_artefacts.js` SZ and the pack ranges); at 1, 44 / 32 / 27.
  - Link: `link: {text, tone: "accent3"}` (default accent). Button: `button: {label, fill: "accent3"}` (default accent).
  - Report: `report: true` draws the Report pill in the accent: in a security lesson that is the accent's job.
  - Banner: `banner: {text, tone}` defaults to accent4 (right for a quiet "external sender" line); `tone: "neg"` only
    when the banner warns of a threat.
  - Sender avatar: its tone is a hash of the name over accent, accent3, accent4, accent2 (`toneOf`). Computed in round 2
    from that function: "Payroll Services" gives accent3, "Payroll Team" the accent, "Payroll Office" red. Pick a name
    that lands on accent3 or accent4 until "Loom.ui avatar and me-bubble tones" lands (section 15).
  - Signs: `Loom.ui.mark(ctx, A, key, phrase, t, {tone: "neg", opacity})` at 0.34 behind ink text, 0.22 behind muted
    text (default tone accent2 at 0.32: always pass both). Then a `Loom.data.tag` in neg on the dark side and a
    `Loom.ui.wire` with `tone: "neg"` from the pane's edge. Paragraph keys are `body_0`, `body_1` ... (0-based).
  - Marks sit about 4 to 8 px left of their words (seen in `evidence_final` 10.60 on "within 2 hours"): `Loom.ui`
    measures phrases at weight 400 and draws them at the role default 700. Pick phrases that start after a space so the
    offset falls on whitespace, until the font weight request lands.
  - Chat: `Loom.ui.chat` draws "me" bubbles in the accent. Use it only when that message IS the move (a report sent);
    otherwise a bespoke thread, until "Loom.ui avatar and me-bubble tones" lands.
  - Evidence cards: `Loom.ui.card` defaults its tone to the accent: pass `tone: "neg"` for a sign card, `"accent4"` for a
    neutral one.
  - Inbox: unread dots are the accent (`ui_artefacts.js`): one unread row at most, and only the message the lesson is about.
  - The pane sits in light: a hard lit plane behind it on the stage (`evidence`: a trapezoid of mix(field, ink, 0.06) at
    z 0.2), never alone on the void.

## 10. Templates in this style

Templates are slides by design (audit 3.4). In noir several paint accent2 (red) by default, and a template that follows
a drawn scene on the same station gets a backplate: a field veil at 0.94 plus a 9 px blur over the picture (0.82 if the
storyboard `keep`s a picture and nothing text-like; `world.js`). **Every template's `kicker` is drawn by `kit.kicker`
in accent2 (`_helpers.js` H.header): leave `kicker` empty in noir** (the interim rule, section 2).

| template | what it paints by default here (code) | set or avoid in noir |
|---|---|---|
| title.card | kicker accent2; a title rule 180 x 8 px and the optional hero icon disc in `accent` (prop, default "accent") | no kicker; set `accent: "accent4"` (rule and icon are decoration, not the named thing). A bespoke title (`after_hours`) is preferred over a template on a noir world |
| definition | term in accent2 (title role); "e.g." label in accent2; rule in accent; icon disc in accent4 | only for a threat's name (phishing), where red is right; otherwise a bespoke term in ink with an accent4 kicker |
| compare.two | header band from `valence` (neg, pos, or surface2 when neutral); item dots in neg, pos or the accent; verdict pill in accent2 stamped | set `valence` on both sides (neutral gives a surface2 band); `verdict` pill only when its text names the danger; a right-answer verdict is a bespoke tag in pos |
| document.page | the page is an INK (cream) slab 760 x 780 with an accent4 header and field text; highlights accent2 at 0.55; `person` draws a peep bust with accent cloth | the cream page is a 29 % lifted band: use it as the lesson's lift (section 5), at most once; `mode: "appear"` avoids most red highlights; never `person`; prefer `Loom.ui.doc` + `Loom.ui.mark` |
| list.steps | row cards in surface; number discs in the accent on every row (`marker` "number" or "icon") | `marker: "tick"` (kit.mark) instead of accent discs; 3 to 4 rows; one list per lesson |
| process.flow | node icons in accent2 on surface discs; the LAST node filled with the accent; nodes `m.pop` | right only when the last node is the move and every icon names a danger; otherwise bespoke, nodes in surface with ink icons |
| timeline | dates and dots in accent2 | avoid: dates are not danger; bespoke with `Loom.data.tag` in accent4 and dots in line |
| quiz.question | kicker forced (`p.kicker \|\| "Your turn"`, so it cannot be emptied) in accent2; option letters on accent2 discs; pause bar accent4 | avoid until pack `roles` (quiz_letter, kicker) land; a bespoke question with `Loom.ui` artefacts as options. phishing b38 shows the red letters and kicker |
| quiz.answer | right option ringed in pos with a tick; others dim to 0.38; takeaway in the accent | usable as is: the accent on the takeaway is the move |
| recap | item icons in accent2; labels flash accent2 then ink; rule pill in accent2, stamped | avoid: the red pill painted "Move three, report it" (the right move) as danger (phishing b14) |
| icon.grid | icon colours cycle accent, accent2, accent4, accent3 | avoid: four hues in one frame and the accent spent on a list (phishing b06, b22) |
| stat.hero | the number in accent2 at display size; kicker accent2 | only for a harm number; a neutral number is a bespoke `Loom.data.counter` |
| avatar (presenter) | a 600 px disc (460 px with a `card`) in surface holding an Open Peeps bust; kicker, card title and name in accent2; card rule in the accent | not this style: no code busts on a dark void (audit A, phishing b01, b42). Open on a place or an object instead |

General: a template over a drawn noir world gets the backplate automatically; to keep the world visible, `keep` the
picture (the 0.82 veil) and check the template's words sit where the world is dark.

## 11. Recipes (code)

Every name below was checked in the code: `ctx.depth` and the stage methods (`depth.js`; `st.layer(z, blend)` takes the
blend as its second argument in the code, SCENE_API shows `st.layer(z)`), `Loom.style.mix` (`style.js`),
`Loom.obj.shape` (`objects.js`), `Loom.ui.*` (`ui_artefacts.js`), `Loom.data.tag` (`data.js`), `ctx.fxMoment`
(`world.js`), `kit.kicker`, `kit.text`, `kit.path` (`kit.js`), `m.unmask`, `m.settle` (`motion.js`), `ctx.cue`,
`ctx.style.dur`, `Loom.uid`, `Loom.svg`, `Loom.rng`, `Loom.tween` (`core.js`). Cues are string literals; colours are
tokens. Full working versions: the two example scenes (rendered in round 1; the round 2 edits to them are not rendered).

**R1. The stage: a dark room, one slow move, text outside it**
```js
const c = (t) => ctx.c(t);
const st = ctx.depth("office", { dolly: [ctx.start, ctx.end], push: 0.06, drift: -26, focus: 0.55, dof: 6, atmosphere: 0.45 });
const wall = st.layer(0.1);
Loom.svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("surface2", 0.1) }, wall);
st.haze(0.4, 600, "accent3");
const mid = st.layer(0.55);                       // the focus plane: the subject and its props
const T = ctx.el("title", { x: 230, y: 104, w: 860, h: 240, kind: "text", exit: "wipe" });   // NOT in the stage
kit.kicker(T.inner, "After hours", { x: 0, y: 0, w: 600, h: 40, color: "accent4" });       // never the default
kit.text(T.inner, "One message, one choice", { role: "title", x: 0, y: 52, w: 860, h: 110, maxLines: 1, weight: 800 });
m.unmask(T, ctx.cue("After hours"));
```

**R2. A hard pool where the key lands**
```js
const pool = st.layer(0.56), cid = Loom.uid("pool");
const cp = Loom.svg("clipPath", { id: cid }, pool);
Loom.svg("polygon", { points: "516,606 1354,606 1400,660 470,660" }, cp);          // the desk top
const lit = Loom.svg("g", { "clip-path": `url(#${cid})` }, pool);
Loom.svg("ellipse", { cx: 790, cy: 634, rx: 300, ry: 40, fill: Loom.style.mix(c("surface"), c("ink"), 0.16) }, lit);
Loom.svg("ellipse", { cx: 790, cy: 634, rx: 190, ry: 26, fill: Loom.style.mix(c("surface"), c("ink"), 0.28) }, lit);
```
For a source OFF frame (a moon on the sky, a ceiling light above the frame): `st.cone(x, y, w, len, "ink")` and
`st.glow(x, y, r, "ink")`, one cone per stage.

**R2b. A lamp IN frame: its cone and bulb ride the lamp's own layer** (fallback until "depth cone and glow z option
with unique gradient ids" lands; the same numbers as `depth.js`)
```js
const kl = st.layer(0.55, "screen"), k = Loom.uid("key"), kd = Loom.svg("defs", {}, kl);
const blur = (id, sd, box) => { const f = Loom.svg("filter", Object.assign({ id: k + id }, box), kd); Loom.svg("feGaussianBlur", { stdDeviation: sd }, f); return `url(#${k}${id})`; };
const cg = Loom.svg("linearGradient", { id: k + "c", x1: 0, y1: 0, x2: 0, y2: 1 }, kd);
[[0, 0], [0.08, 0.34], [0.7, 0.12], [1, 0]].forEach(([o, a]) => Loom.svg("stop", { offset: o, "stop-color": c("ink"), "stop-opacity": a }, cg));
const x = 780, y = 468, w = 520, len = 138;       // from the bulb to the desk top
Loom.svg("path", { d: `M${x - w * 0.06} ${y} L${x + w * 0.06} ${y} L${x + w / 2} ${y + len} L${x - w / 2} ${y + len} Z`,
  fill: `url(#${k}c)`, filter: blur("cb", 14, { x: "-20%", y: "-5%", width: "140%", height: "110%" }) }, kl);
const halo = { x: "-100%", y: "-100%", width: "300%", height: "300%" }, r = 8;
Loom.svg("circle", { cx: x, cy: y - 2, r: r * 2.8, fill: c("ink"), opacity: 0.12, filter: blur("g1", Math.round(r * 0.9), halo) }, kl);
Loom.svg("circle", { cx: x, cy: y - 2, r: r * 1.5, fill: c("ink"), opacity: 0.35, filter: blur("g2", Math.round(r * 0.35), halo) }, kl);
Loom.svg("circle", { cx: x, cy: y - 2, r, fill: c("ink") }, kl);
```

**R3. Cool fill through blinds (hard bars, flat fills)**
```js
for (let y = 156; y < 590; y += 28) Loom.svg("rect", { x: 1190, y, width: 520, height: 15, fill: c("shadow"), opacity: 0.82 }, wall);
const bars = st.layer(0.62);
for (let i = 0; i < 4; i++) { const y0 = 868 + i * 17;
  Loom.svg("polygon", { points: `${1240 - i * 60},${y0} ${1700 - i * 40},${y0} ${1690 - i * 40},${y0 + 9} ${1226 - i * 60},${y0 + 9}`,
    fill: Loom.style.mix(c("field"), c("accent3"), 0.16) }, bars); }
```

**R4. The accent arrives on the named thing, as light**
```js
const glow = Loom.svg("g", { opacity: 0 }, mid);  // the screen's spill behind the lid, drawn BEFORE the object
const gid = Loom.uid("spill"), rg = Loom.svg("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, glow);
Loom.svg("stop", { offset: "0", "stop-color": c("accent"), "stop-opacity": 0.55 }, rg);
Loom.svg("stop", { offset: "1", "stop-color": c("accent"), "stop-opacity": 0 }, rg);
Loom.svg("ellipse", { cx: 1110, cy: 538, rx: 230, ry: 120, fill: `url(#${gid})` }, glow);   // 460 px across: the cap
Loom.obj.shape(mid, "laptop", 1110, 568, 223, { state: { facing: "away" }, shadow: false });
Loom.tween(glow, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, ctx.cue("a message lands"),
  { kind: "reveal", beat: ctx.beat.id, name: "screen_glow", content: true });
```

**R5. A message read for its signs: danger in neg, the move in the accent**
```js
const A = Loom.ui.mail(ctx, "message", { x: 120, y: 150, w: 1180, display: 0.85,
  subject: "Action needed: confirm your details",
  from: { name: "Payroll Services", address: "payroll@pay-roll-update.example" }, to: "you", time: "23:47",
  paragraphs: ["Your payment is on hold until you confirm your bank details.", "Please confirm within 2 hours to avoid a delay."],
  link: { text: "Confirm my details", tone: "accent3" }, report: true });
Loom.ui.build(ctx, A, ctx.start + 0.3);
const edge = A.E.x + A.E.w, t1 = ctx.cue("Look at the sender");
const r1 = Loom.ui.mark(ctx, A, "address", "pay-roll-update.example", t1, { tone: "neg", opacity: 0.22 });
const tag = Loom.data.tag(ctx, "sign_domain", { x: 1370, y: r1.y - 8, text: "Not our domain", color: "neg", t: t1 + 0.5 });
Loom.ui.wire(ctx, "lead_domain", { x: edge, y: r1.cy }, { x: 1366, y: r1.y - 8 + tag.h / 2 }, t1 + 0.25, { tone: "neg" });
```

**R6. Narrow the light to the move, and keep what names it inside the light**
```js
const rp = Loom.ui.at(A, "report"), tm = ctx.cue("report it");
const mv = Loom.data.tag(ctx, "the_move", { x: 1370, y: rp.cy - 26, text: "Your move: report it", color: "accent", t: tm + 0.55 });
Loom.ui.wire(ctx, "lead_move", { x: edge, y: rp.cy }, { x: 1366, y: rp.cy - 26 + mv.h / 2 }, tm + 0.3, { tone: "accent" });
const x0 = rp.x - 40, x1 = 1370 + mv.w + 30;      // the pill, the lead and the tag: everything read in this window
ctx.fxMoment("spotlight", tm, Math.min(ctx.end, tm + 2.6), [x0, rp.y - 30, x1 - x0, rp.h + 60]);   // dims the rest by 0.55
```
Rules: the rect holds EVERYTHING that appears or is read during the moment (round 1's version dimmed the move's own tag
as it wiped in, `evidence_final` 08.90); at most 2.6 s; the rect's edge is soft over 40 px. The rect is in station
coordinates and is resolved with the world camera at t0 (`world.js` fxMoment), so it does not follow `Loom.cam.frame`
moves on an element made after t0; confirmed by reading the code, not in a lesson render.

**Turn card:** `ctx.narrationCard(name, text, t, { ground: "shadow", color: "ink" })` (its default ground is ink, a full
cream frame here, and its default text colour is field).

## 12. Failure modes seen in real frames

| failure | where seen | why | rule or check that prevents it |
|---|---|---|---|
| The accent spent on furniture: amber desks, pedestals, shelves | phishing b02, b07, b08, b41 (`qa/sheets/_overview.jpg`, re-checked in round 2) | `places.js` hard-codes `wood = "accent"` | section 9: no `Loom.place` in noir until pack `materials` lands |
| Amber radial washes behind a pane or a building | phishing b09 to b13, b17, b18, b20 (overview sheet) | a soft accent glow used as atmosphere | section 5: the accent glows only on the named thing, at most 460 px across |
| The accent with four meanings in one frame: lure link, sender avatar, Report, the learner's chat bubble | `lab_ui_artefacts` in noir, t 9.6 (`outputs/noir_lab/ui_fx/`, Cowork outputs): amber 3.6 % of the frame | `Loom.ui` defaults link, button and "me" bubble to the accent; avatar tone is a name hash | section 9 (link and button accent3, avatar by name); request "Loom.ui avatar and me-bubble tones" |
| Red kickers, terms, quiz letters, and a red recap pill for the RIGHT move | phishing b01 "ODD MESSAGES", b04, b38 kicker and letters, b14 "Move three, report it" | templates, `kit.kicker` and `Loom.data.chapter` default to accent2, which is neg here | section 10; interim rule for D-N1; request pack `roles` |
| The bulb slides off its lamp during the dolly | `after_hours_final` 00.40 to 09.80 (Cowork outputs): about 19 px, from the middle of the shade to its corner | `st.glow` is fixed at z 0.05 and `st.cone` at z 0.3 while the lamp is at z 0.55 | section 5 formula; R2b (the example now uses it); request "depth cone and glow z option" |
| The spotlight dims the words that name the move | `evidence_final` 08.90: "Your move: report it" wipes in under the 0.55 dim | the rect covered the Report pill only | R6: everything read during the moment sits inside the rect (the example now does) |
| Marks start left of their words | `evidence_final` 10.60: the sweep on "within 2 hours" starts about 8 px early | `Loom.ui` measures at 400 and draws at 700 | section 9; request "font weight clamp to loaded weights" |
| Muted text unreadable in the corners | computed, vignette 0.6: 2.92:1 at the safe-area corner | the vignette is composited over scene text | pack fixed (vignette 0.35, muted #9AA4B6); request `fx.vignette_under` |
| Wide soft gradient bands into rings | `after_hours` v2 at 08.20 and `h264_darks_stretched.png` (Cowork outputs) | 0.09 opacity over 620 px spans about 20 code values on an 8-bit near-black | section 5: hard light shapes, no soft gradient over 250 px |
| A pane floating on a void, the lower half empty | phishing b15, b16, b24 (overview sheet) | the artefact placed on the field with no world and no light | section 9: a lit plane behind it; 45 % fill; `evidence` example |
| Push-in crops the words | phishing b19 ("Confirm your passw" cut at the right edge, overview sheet) | `Loom.cam.frame` with a tight rect | margin 60 px or more; the film check's cut-words error |
| Specks of type in dark frames | phishing b11 to b13, b17 to b21, b25 to b29 | content laid out small in the centre | section 3 floors; tags 26 px or more on screen |
| A uniformly dim frame with no light | `lab_depth` in noir: the whole frame a flat slate blue, the accent on about 200 lit windows | every layer toned toward one mid-dark value; windows in the accent | section 5 value structure; lit windows in muted at 0.35 to 0.5 |
| A stage edge read as a seam | `after_hours` v1: a near-layer door edge at x 0 to 170 read as a frame border | a full-height dark strip at the frame edge | foreground silhouettes are objects (a chair back), never a full-height strip at the edge |
| Code-drawn people in a noir lesson: busts, cream-trousered crowds | phishing b01, b42 (avatar busts), b33 to b36 (crowd rigs) | no S3 cast; `characters.extras` is `people`; the avatar beat | section 8: no `ctx.crowd`, no avatar beat, no `document.page` person |
| Grain reads as grit | phishing at grain 0.06 (audit F) | finish chosen from stills | D-100: grain 0.01 here, `style_lint` fails a default over 0.015 |

## 13. Polish checklist (contact sheet and the 4 fps strips, at 100 %)

1. Does every frame have exactly one brightest, warmest point, and is it the thing the narration names?
2. Is amber present ONLY on the named thing or the move (no desk, shelf, chair, window, avatar, link, bubble, wash)?
3. Is every red element a danger sign or a wrong move (no red kicker, date, term, letter, sub or decoration)?
4. Is every word on dark field or on a pane, with none in a cone, a glow halo, the window or a haze band?
5. Is every word on screen 26 px or larger, and is muted text in the frame corners still clearly readable?
6. Do titles, panes and tags stay sharp and still while the scenery drifts (none rides the stage)?
7. Does each shot have one camera move, with no layer edge showing and no word cut by the frame?
8. Does every lamp in frame keep its bulb inside its shade from the first to the last frame of the shot?
9. Are lit areas hard-edged shapes (pools, bars) with no soft wash wider than about an eighth of the frame?
10. Does every prop face its user, sit at real scale, and have a contact shadow?
11. Are there no code-drawn people (no busts, beans or rig crowds), and where a person was needed, is the asset request in the findings?
12. Is every UI pane at least 57 % of the frame width (1100 px), with a lit shape behind it?
13. Does every sign have a mark on its words, a tag on the dark side and a lead from the pane's edge, all in red?
14. During a spotlight, is everything that appears or is read inside the lit rect?
15. Does every hold longer than 4 s change something (a light, a mark, a camera move)?
16. Is there no black or near-empty frame longer than 3 s while the voice speaks?
17. Does the lesson lift to a bright band at least once (a lit document, a recap on a lit plane)?
18. On the encoded MP4, viewed at 100 %, are the dark corners free of visible rings and blotches?

## 14. Gaps (not for the guide to fake)

What the style lacks today: a designed S3 cast and crowd (A1, A2), layered night sets (A3), lit props (A4); colour
roles for template defaults (pack `roles`); a material token for places (pack `materials`); a lamp light that rides its
lamp (the depth z option); avatar and me-bubble tones in `Loom.ui`. Each request, its size and the rule this guide
follows until it lands are in section 15.

**Decisions for Kshitij:**
- **D-N1:** accent2 is the same red as neg, so every template's second emphasis reads as danger. Option A: keep it and
  steer templates (section 10). Option B: set accent2 to a quiet warm (accent4's family) and migrate scenes that use
  accent2 to mean danger to neg (round 1 counted 25 calls in 12 phishing scene files with Grep, including the golden
  segment b17 and b18 awaiting sign-off; not re-counted in round 2). **Interim (both options):** the rule in section 2:
  write `neg`, never `accent2`; no template kickers.
- **D-N2:** `characters.extras` is `people` (code rigs). `none` would match the no-improvised-people rule until A2
  exists, but would empty the crowds in phishing b33 to b36. Interim: no `ctx.crowd` in new noir scenes.
- **D-N3:** the `tone_reference` (brightness 0.37) will warn on every noir lesson (phishing 0.15). Keep it as the reason
  to lift some beats, or point the pack at a darker measured family.
- **D-N4 (new in round 2):** the pack's `ambient.wash` is an amber radial, hidden under the opaque nebula canvas today
  and visible only when the fx background is off. Remove it from the pack (set `""`), or keep it. Interim: a lesson that
  turns the fx background off sets storyboard `ambient: {wash: ""}`.

**Unverified in this pass:** how the finish looks on a calibrated display or after a platform re-encode; the vignette
change and the muted and line values inside a full lesson render (lab renders only); the RC13 spotlight fix in a
lesson; the example scenes with real narration (their cues were mapped to fixed times); the round 2 edits to both
example scenes (R2b in `after_hours`, the wider spotlight in `evidence`: not rendered, checked by reading and by
`node --check` only); synthetic bold in Chrome; whether the film check measures the section label; the luma shares in
section 5 (round 1, command not recorded); contrast figures that involve compositing (cone peak 2.74, mark 4.03, worst
nebula cloud 5.26, spotlight 3.50), which are round 1 computations not re-run.

## 15. Engine and asset requests

Every request this guide depends on, with the shared names used across the five style guides. "Proposed" means not
yet read by the runtime. The fallback is what a noir scene does until the request lands.

| request | size | what it changes for noir | fallback until it lands |
|---|---|---|---|
| pack `materials: {wood, chair, screen}` (shipped 2026-10-08, WS6: see section 16) | S | `places.js` paints desks, pedestals, shelves and chairs from `materials.wood` / `materials.chair` instead of the accent; noir sets wood and chair to surface | no `Loom.place` in noir; build rooms on the depth stage (R1 to R3) |
| pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` (shipped 2026-10-08, WS6: see section 16) | M | template and kit defaults read a role instead of accent2 or the accent; noir: kicker and chapter_kicker accent4, term and stat_value ink, verdict and recap_rule neg only for danger, date accent4, quiz_letter surface, ui_mark neg, link and button accent3, me_bubble surface2, person_cloth surface | section 10 table; empty kickers; pass `accent: "accent4"` to `Loom.data.chapter`; pass `tone` to every `ui.mark`, `ui.wire`, `ui.card`, link and button |
| `fx.spotlight: {strength, tint}` (shipped 2026-10-08, WS6: see section 16) | S | the dim outside a spotlight (fixed 0.55 today) set per pack; noir wants about 0.45 so muted text outside stays near 4.5:1 | R6: everything read during the moment inside the rect, at most 2.6 s |
| `fx.vignette_under: true\|false` (shipped 2026-10-08, WS6: see section 16) | S | the vignette drawn under the world, darkening field and drawing but never scene text; noir sets true | vignette 0.35; muted text 4.5:1 or better computed at the safe-area corner |
| `characters.bottom` (shipped 2026-10-08, WS6: see section 16) | S | the crowd's trouser token (ink or muted today, so cream legs in the dark); noir: surface2 | no `ctx.crowd` in noir (D-N2) |
| font weight clamp to loaded weights (no synthetic bold) | S | every requested weight snaps to a loaded face (900 to 800, 600 to 700), and `Loom.ui` measures phrases with the weight it draws, so marks land on their words | ask only for loaded weights; pick mark phrases that start after a space |
| m.draw stroke-first, keeps per-path opacity and dashes | S | a rim (0.25 to 0.45 opacity) or a dashed lead keeps its opacity and dash when drawn on | never `m.draw` a rim or a dashed line: fade it in with `Loom.tween` on opacity |
| loom lab --file with @lab cue map | S | `py -m loom lab` renders a scene outside `scenes_examples/lab/` and reads the `@lab` `"cues"` map, so the noir examples render with real timing (today `ctx.cue("words")` returns 0 in the lab) | judge example timing only in a lesson render or a one-off harness, and say so |
| depth cone and glow z option with unique gradient ids | S | `st.cone(..., {z})` and `st.glow(..., {z})` so a light rides with its lamp; unique ids so two cones (or two hazes at one z) keep their own colours | R2b for any lamp in frame; one `st.cone` and one `st.haze` per z per stage |
| Loom.ui avatar and me-bubble tones | S | `from.tone` for the sender avatar and a tone for "me" chat bubbles | name senders so `toneOf` gives accent3 or accent4; `Loom.ui.chat` only when the learner's message is the move |
| nebula mix scaled by intensity | S | the field to field2 mix scales by `fx.intensity`, so the blotches seen after H.264 shrink at 0.35; re-judge on the encoded MP4 | intensity 0.35; leave empty field empty; check dark corners on the MP4 (checklist 18) |
| M.travel drive key | S | noir does not depend on it (no motif travels in the examples); listed so the shared set is complete | no change |
| A1, L: the workplace cast in 2.5D lit layers | L | the people this style needs. In Claude Design paste Prompt 0, Prompt R and Prompt A0 (`docs/ASSET_WISHLIST.md`), Prompt 0+ (`docs/assets/CHARACTER_PROMPTS.md`), then F3 (MAYA, DANIEL, ELENA first), adding: "These figures must read on a near-black night set (#0B0F17 field): the key light is warm white, the fill and rim are cool blue; deliver the backlit setup as a true silhouette with only the rim lit, for shots where the person is anyone." | section 8: frame on the object, the empty chair or the screen; write the request into the storyboard's findings |
| A2, M: a noir crowd sheet | M | S3 style block plus D7: "8 background office workers, standing and seated, front, 3/4 and back, each in the backlit setup only (silhouette with a cool rim), plus one assembled crowd of 12 on a floor plane receding into darkness." | no crowds |
| A3, L: layered night sets from the office world | L | `docs/assets/WORLD_PACKS.md` office `evening_floor`, `desk_close` (night), `exec_office` (night): "STYLE: 2.5D lit layers. Deliver each scene as separate SVG layers for a depth stage: sky or back wall (z 0 to 0.15), far furniture (z 0.2 to 0.45), the focus plane with the desk and its props (z 0.5 to 0.6), near furniture and a foreground silhouette (z 0.8 to 1.0), each layer 2320 px wide so a camera drift never shows its edge. Light as separate flat shapes in their own groups: the lamp's pool on the desk, blind bars on the floor and wall, window glass; one warm key, one cool fill. No text anywhere. Palette slots mapped to: field, field2, surface, surface2, shadow, ink (the key light), accent3 (the fill)." | rooms built in code on the depth stage (R1 to R3, `after_hours`) |
| A4, S: props in this light | S | desk lamp (off, on, on with the shade's inner glow), laptop lid back, monitor back, office chair (back and 3/4), each with a lit-edge layer and a contact shadow, from the same S3 prompt | `Loom.obj.shape` with `facing: "away"` plus a hand-drawn rim and contact shadow |

---

## 16. Verified on 2026-10-08 (the WS6 proof)

The section 15 runtime requests marked S shipped on 2026-10-08 (D-128; report
`docs/research/2026-10-08-style-system-report.md`; tests `tests/suites/style_system.py`). Sections 1 to 15 were
written before they landed: where a passage says "proposed", "not yet read by the runtime" or "until X lands", X has
landed, the pack below sets it, and that passage's fallback is no longer needed unless this section says so. The
strips, the measurements and the section 13 checklist results are in
`docs/styles/demos/guides/cinematic-noir/README.md`; the encoded example is `docs/styles/demos/guides/cinematic-noir/style_cinematic_noir_after_hours__h264_crf18.mp4`.

**What the runtime now reads from this pack:**
- `materials`: wood `surface`, chair `surface`, books `["surface", "surface2", "muted", "line"]`, plant `surface2`, pot `surface`, screen `surface2`, monitor `shadow`
- `roles`: kicker `accent4`, chapter_kicker `accent4`, term `ink`, stat_value `ink`, date `accent4`, quiz_letter `surface`, ui_mark `neg`, link `accent3`, button `accent3`, me_bubble `surface2`, person_cloth `surface`, turn_card `shadow`, avatar `["accent3", "accent4"]`
- `fx.spotlight` `{"strength": 0.45}`, `fx.vignette_under` `true`
- `characters.bottom` `surface2`

**Shared changes every style gets:** words are drawn and measured at a weight the family loaded (no synthetic bold);
`m.draw` draws outlines before fills, keeps each path's own opacity and keeps a dashed line's dashes; a second
`m.travel` of one element no longer shows at load; the lab renders any scene file with its `@lab` cues and words
(`py -m loom lab --file <scene> --out <dir>`); the API agents and the Cowork task files read this guide for the
storyboard and scene stages; `py tools/context_check.py` fails when section 2's palette rows disagree with the pack.

**Verified in Chrome:** both examples have one warm point on the named thing, amber only on the move, red only on
danger, every word 28.7 px or larger, titles still while the stage drifts, the bulb inside its shade. Fixed in the
proof: the amber monitor screen, the white monitor body, the cream turn card and its pale dip (`roles.turn_card:
shadow`, so the section 11 recipe is now the default), avatars on amber. On the crf 18 MP4 the darkest corner keeps
its levels (mean 12.8 to 12.2, 26 levels to 27, largest step 2) and the lamp cone has no rings (42.7 dB).
**Decided (D-132):** noir sets no `shape.contact_shadow`; item 10's shadow comes from the prop itself (`Loom.obj` draws
one, the depth stage casts its own).
**Unchanged (Kshitij's decisions):** `accent2` equal to `neg`, the extra tokens, the tone reference, the ambient wash.
**Still unverified:** a calibrated display and a platform re-encode.

## 17. Set decorations follow the pack (2026-10-08, D-133)

`runtime/places.js` now reads `materials.window_lights`, `vessel`, `cells`, `leds`, `cables`, `chart` and
`safety_line` (L-286), and `Loom.obj` reads `materials.objects` for every kind. Each value below comes from section 2
and is set only where the runtime's fallback breaks a rule there; a key left out keeps its fallback because section 2
allows it. Where an earlier section says `places.js` hard-codes one of these, it no longer does. This section
supersedes the `materials` line of section 16. Strips: `docs/styles/demos/guides/cinematic-noir/lab_set_decor__cinematic-noir.jpg` (after)
and `lab_set_decor__cinematic-noir__before.jpg`, from `scenes_examples/lab/lab_set_decor.js`; record
`docs/research/style-system/red_L276_set_decor.txt`.

**What the runtime now reads from this pack (`materials`, in full):**
- wood `surface`, chair `surface`, books `["surface", "surface2", "muted", "line"]`, plant `surface2`, pot `surface`,
  screen `surface2`, monitor `shadow`, window_lights `muted`, vessel `surface`, cells `["line", "muted"]`, leds
  `["muted", "accent3"]`, cables `["line", "muted"]`, chart `["line", "muted"]`, safety_line `muted`, objects
  `{document: accent4, envelope: accent4, folder: accent4, package: surface, heart: muted, bulb: ink, lock: muted}`

**Why (section 2):** the accent never decorates, and accent2 (equal to neg) appears nowhere in new code. The window
lights are muted (lit-window specks); the safety line muted; the LEDs muted with accent3 points (rims, well under
1 %); the cables and the chart line and muted (hairlines, no accent bar). The vessel is surface (accent3 is glass and
haze at 0.5 opacity or less, and the vessel stacks 0.55 over 0.5), its cells line and muted. Paper things are accent4
(old paper, case files): the document header, the envelope, the folder. The package is surface (props); the heart
muted (accent3 is never over 1 % of the frame at full strength, and a 260 px heart is about 1.6 %); the lock muted (it
was the accent); the spark bulb ink (the key light: lamp, moon, bulb). Left at the fallback: calendar accent3 (a
header under 1 %), clock and building accent4 (under 2 % at 260 px), phone surface2; the laptop reads no tone.
**Seen on the strips:** the sets are dark and grey, the paper things warm. **Still open:** the laptop chart's red bar
(accent2, drawn inside the object), the clock's blue minute hand (L-287).
