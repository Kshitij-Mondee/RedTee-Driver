# corporate-clean: the style guide

STATUS: PARTIAL (written 2026-10-07, round 1; round 2 review 2026-10-07: every API, option, token, file and line
number below was re-checked by reading `runtime/` and `docs/SCENE_API.md`; nothing was rendered in Chrome).
Pack: `packs/styles/corporate-clean.json` (look_family `editorial`). Example scenes:
`scenes_examples/style_corporate_clean_request_route.js` (R1) and `scenes_examples/style_corporate_clean_wall_chart.js`
(R2). Every style has its own purpose and is never ranked against another (D-122); "better" below means closer to
this style's own references and purpose.

**How the numbers here were measured.** Contrast: `loom.checks.style_lint.contrast` (WCAG relative luminance) on the
pack's hex values, run in the sandbox on 2026-10-07:
`python3 -c "import json; from loom.checks.style_lint import contrast, caption_ratios; ..."`. Caption ratios:
`py tools/caption_contrast.py`. Round 2 re-derived ink on field (16.09), accent on field (4.81), line on field (4.05),
caption_active on field (1.34) and accent on the mesh pole (4.08) by hand with the same WCAG formula; all matched.
Values marked "hand" were computed by hand only. Frames: the build frames and sheets of `projects/mfa-story` and
`projects/feedback-that-lands`, the lab strips in `docs/styles/demos/lab/*corporate-clean*` (most of these strips
predate the 2026-10-07 pack polish: a pink avatar or pink pill in them is the old accent3), and browser-free previews
(`tools/lab_preview.py`, which estimates text widths and skips blur and WebGL; marked PREVIEW wherever used). Nothing
in this guide was judged on an encoded MP4 or a Chrome render in this session (the sandbox has no browser, L-135).

---

## 1. Purpose and register

Corporate-clean is the house register for training that adults take at work because they must or because they want
to do the job better: compliance, policy, onboarding, product and process training, security awareness, internal
change. It should feel like a well-run company's own product: calm, exact, quiet confidence, nothing to forgive.
The picture explains a mechanism (a route, a state, a number, a screen) in a believable workplace, with ONE
saturated blue that always marks the thing the narration is naming. It is adult and never teacher-like: no mascots,
no bouncing (the pack has `motion.overshoot: false`), no confetti, no pastel blobs. Fits (pack `fits`): compliance,
policy, onboarding, product training, process, enterprise. Never for: children's content (`avoid_for: kids`),
comedy-led stories whose jokes need squash, overshoot and cartoon timing (this pack cannot overshoot), or content
whose subject is emotion first and mechanism second.

**Reference board** (study, never copy or republish; nothing was downloaded):

| reference | link | take | do not take |
|---|---|---|---|
| IBM Carbon, motion | https://carbondesignsystem.com/elements/motion/overview/ | Two motion modes: *productive* (subtle, out of the way, for the moment the viewer is working) and *expressive* (for a significant moment). Durations grow with the size of the thing moving. Entrance easing decelerates (expressive entrance `cubic-bezier(0, 0, 0.3, 1)` is close to Loom's `enter` `(0.16, 1, 0.3, 1)`). | The 70 to 240 ms UI durations: a video viewer is reading, not clicking; our floor is the pack's 0.3 to 0.8 s. |
| IBM Carbon, data visualization colour | https://carbondesignsystem.com/data-visualization/color-palettes/ | Colour is applied in a fixed order and is always reinforced by position, shape or label; categorical colour only when categories have no order. | A 14-colour categorical palette: this style has one accent and slate context. |
| Atlassian, illustrations (low-fidelity UI) | https://atlassian.design/foundations/illustrations | Explaining a workflow with "basic shapes, sharp corners, and mostly gray tones"; illustration supports the message and is never decorative-only; collage is "too visually busy". | Spot illustrations as stickers in empty corners; the brand's own characters. |
| Atlassian, applying motion | https://atlassian.design/foundations/motion/applying-motion | Duration bands by job (interactions 50 to 150 ms, transitions 150 to 400 ms); ease-out to arrive, ease-in to leave; larger elements move longer. | Hover and press states (a video has none). |
| GOV.UK publishing guidance on video | https://guidance.publishing.service.gov.uk/formatting-content/videos/ | Captions and transcripts are part of the product; plain words; the video must earn its place over text. | "Usually do not use video" (we are making video on purpose; take the discipline, not the conclusion). |
| Material Design 3, easing and duration tokens | m3.material.io, styles, motion (unverified: link not fetched this session; values from search: emphasized decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)` at 400 ms to enter) | One strong decelerate for things arriving, a matching accelerate for things leaving. | Shared-axis and container-transform page transitions as lesson joins: they read as an app, not a film. |

Inside the engine, the frames closest to this style's purpose are `projects/mfa-story` b01 (a real sign-in screen in
a real office), b07 and b15 (two-bar and three-bar data on a plain field). Their faults are in section 12.

---

## 2. Palette roles

Area shares are for a typical settled frame of a bespoke beat (the caption pill excluded). Hex values are copied
from `packs/styles/corporate-clean.json` as it is on 2026-10-07.

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #F4F7FB | the canvas | everywhere behind | as text | 45 to 60 % |
| field2 | #EAF0F7 | wall, band, second plane | walls, bands, empty table tops | as text | 5 to 15 % |
| surface | #FFFFFF | cards, screens, desks, documents | anything you could pick up or read | as text on the field (1.07:1) | 10 to 25 % |
| surface2 | #E3EAF3 | tinted card, floor, an inactive slot | floors, pedestals, empty states | as the only edge between two whites | 5 to 15 % |
| ink | #0F1B2D | all primary text; screens and bezels; the cast's clothes | text, monitor bodies, a person's top | in bespoke art, as a fill over 20 % of the frame behind text (the darkest mass pulls the eye); the `document.page` template's 760 x 780 ink page is the one sanctioned exception (s10) | 5 to 10 % (up to 30 % on a document.page beat) |
| muted | #51607A | secondary text, axis words, a quiet person's top | captions under things, months, sources | as a fill behind white text under 28 px (6.36:1 passes, but it reads as a disabled button) | 1 to 4 % |
| line | #6B7A93 | connectors, axes, rules, dot grid | strokes 2 to 5 px | as text under 24 px bold (4.05:1 on the field) | 1 to 3 % |
| accent | #2563EB | THE named thing: the active state, the bar that changed, the button to press | one element per frame, or one family of elements that are the same thing | decoration, furniture, clothes, backgrounds, a second meaning | 1 to 5 % |
| accent2 | #B45309 | the term being defined, kickers (`kit.kicker` default, `kit.js:478`), the verdict pill | type: kickers, terms; one pill | data series, furniture, a second highlight next to a blue one | under 3 % |
| accent3 | #64748B | slate: context and neutral objects | context bars, inactive pills, iso boxes that are not the point, a second person's top | the highlight (it is the opposite: "not this one") | 3 to 15 % |
| accent4 | #0F766E | teal support, same hex as pos | template icon discs and headers (the runtime puts it there: s10) | decoration in a frame where pos means "correct" | under 3 % (document.page header band excepted) |
| pos | #0F766E | outcome good: done, correct, approved | ticks, the final state, a good number | anything that is not an outcome | under 3 % |
| neg | #DC2626 | outcome bad: wrong, risk, blocked | crosses, an error outline, a short risk tag | any fill larger than 300 x 60 px (a 1000 px red bar is alarm, not information) | under 2 % |
| shadow | #0F1B2D | offset shadows at 8 % | under cards (`shape.shadow_opacity`) | as a fill | n/a |
| onAccent | #FFFFFF | text on accent, accent2, accent3, accent4, pos, neg | knockout text | on the field | n/a |
| caption_active | #FCD34D | the spoken word in the caption pill ONLY | `captions.active` | anywhere in scene art (1.34:1 on the field) | n/a |

**Hue budget:** at most two saturated families in a settled frame (blue plus one of amber, teal or red). Slate and
navy are neutrals and do not count. `lnd-visual-design` s5a warns above two; in this style it is the rule. Several
templates spend both families by themselves (s10 lists which); add no third colour to those frames.

**Text pairs, measured (2026-10-07):**

| text \ ground | field | field2 | surface | surface2 | verdict |
|---|---|---|---|---|---|
| ink | 16.09 | 15.07 | 17.28 | 14.26 | any size |
| muted | 5.92 | 5.54 | 6.36 | 5.24 | any size |
| line | 4.05 | 3.79 | 4.35 | 3.59 | 24 px bold or larger only |
| accent | 4.81 | 4.51 | 5.17 | 4.27 | any size on field, field2 and surface; 24 px bold or larger on surface2 |
| accent2 | 4.67 | 4.38 | 5.02 | 4.14 | any size on field and surface; 24 px bold or larger on field2 and surface2 |
| accent3 | 4.43 | 4.15 | 4.76 | 3.93 | not for text; use muted |
| accent4 / pos | 5.09 | 4.77 | 5.47 | 4.52 | any size |
| neg | 4.49 | 4.21 | 4.83 | 3.99 | 24 px bold or larger, or any size on surface |

Knockout text on fills (white / ink): accent 5.17 / 3.34, accent2 5.02 / 3.44, accent3 4.76 / 3.63,
accent4 and pos 5.47 / 3.16, neg 4.83 / 3.58, muted 6.36 / 2.72. So **every coloured fill takes white text**; get it
with `Loom.style.pickTokenOn(fill)` (`runtime/templates/_helpers.js:141`; it returns the token `"onAccent"` on every
saturated fill of this pack). Never pass `color: "ink"` on a coloured fill. Caption pill (rgba(15,27,45,0.86) over the
field = #2F3A4A): white words 11.51:1, active word #FCD34D 7.98:1.

**Forbidden pairs:** ink on any accent (3.2 to 3.6:1), line or accent3 as text under 24 px, caption_active anywhere
but the pill, white text on surface2 (1.21:1), accent text under 30 px on the fx mesh's blue pole (4.08:1, see s5).

---

## 3. Type

| role | family | pack range (px) | weight to pass | use |
|---|---|---|---|---|
| display | Space Grotesk | 110 to 160 | 700 | one hero number or word per frame, at most |
| hero | Space Grotesk | 96 to 140 | 700 | a chapter title (`Loom.data.chapter` uses it, s6a); bespoke openers |
| title | Space Grotesk | 60 to 88 | 700 (500 for a title over 6 words) | the frame's headline, a defined term, the `title.card` title (it is set in `title`, not `hero`: `core.js:45`) |
| lead | Inter | 34 to 42 | 700 | chart titles, a card's title, a callout sentence |
| body | Inter | 30 to 36 | 500 | sentences (three lines at most) |
| label | Inter | 24 to 30 | 700 for names, 500 for axis words | labels ON things |
| caption | Inter | 20 to 24 | 500 | a source line only; never load-bearing |
| mono | JetBrains Mono | body or label size | 400 / 700 | codes, amounts in a UI, file names, IDs |

- **Always pass `weight` to `kit.text` for Inter roles.** With no weight, `kit.text` uses the family's second loaded
  weight for every non-display role (`runtime/kit.js:306`), which in this pack is 700: body text silently renders
  bold. Every template that sets body text without a weight (list.steps items, compare.two rows, quiz options,
  timeline labels) therefore sets it at 700 in this pack. The lab strip `lab_ui_artefacts__corporate-clean.jpg` shows
  mail body copy in bold for this reason.
- **Weights the pack does not load:** the pack loads 500 and 700 for Space Grotesk and Inter, 400 and 700 for
  JetBrains Mono. Templates ask for 800 (and `Loom.data.chapter` for 900); by CSS font matching these resolve to the
  loaded 700 face, so no synthetic bold appears in this pack (unverified in Chrome; see s15 "font weight clamp").
  Never pass 600: it also resolves to 700, and the measured width then disagrees with intent.
- **Set bespoke labels at 28 to 30 px** (`size: 28`), not the 24 px floor. The film check warns under 26 px
  (`docs/SCENE_API.md`, film checks) and the step 7 audit called 24 px chips specks. The pack floor stays 24 only
  because `Loom.ui` artefacts need it (a 26 px floor overflowed "09:16" in `lab_ui_artefacts`, PREVIEW). `iso.label`
  sets its pills at 30 px (`S().size("label")` returns the range top, `runtime/style.js:59`).
- Sentence case everywhere. Caps only through `kit.kicker` (4 words at most, 0.2 em tracking, accent2 by default,
  `kit.js:478`; more than 4 words warns `kicker_too_long`).
- No italics: the pack loads no italic faces, so any italic is a browser-faked slant.
- Scale contrast: headline at least 2 x the label beside it (title 64 over label 30); one display element per frame.
- Line length 45 to 75 characters; body `maxLines: 3`; a title at most 9 words on at most 2 lines.
- Numbers: say them, then show them; one decimal at most unless the decimal is the point ("99.22% lower" in mfa b07
  was the source's own figure). Units in words next to the number ("under 1 day"), not a legend.
- Never size type by hand to dodge the fit: `kit.fit` / `kit.text` fit to the box; a `text_overflow` means the box
  is wrong.

---

## 4. Shape language

- **Radius tiers, never one radius everywhere** (the D-85 tell counts radii, `kit.js:86`): 20 px (pack
  `shape.radius`, the `kit.rect` default) for cards and panels; 14 px for screen bezels; 10 px for tags and buttons
  inside UI (`Loom.ui` buttons use 10); 6 px for data bars, inner fields and `Loom.data.tag` (its default `r`);
  `h / 2` (`kit.pill`) only for status chips. Pass `{ r: ... }` explicitly on anything that is not a card.
- **Strokes:** shapes are flat with no outline (`shading: flat`). Strokes exist for connectors, axes and rules only:
  2 to 3 px in `line` (pack `stroke` 3, the `kit.line` default), arrows 4 to 5 px with a filled head (`kit.arrow`
  defaults to `stroke + 1` = 4 px; `iso.arrow` takes `sw`). Round caps and joins (the kit's default). A white card on
  a white screen gets a 2 px `surface2` edge (`{ stroke: "surface2", sw: 2 }`), because white on white is 1.0:1.
  Iso boxes carry a 1 px edge in their own darkened face colour (`runtime/iso.js:33`); that is a fold, not an outline.
- **Card:** `kit.card` (surface, r 20, offset shadow). Content inset at least 32 px (the `tight_inset` check wants
  max(6, 0.2 x size), `kit.js:458`).
- **Label:** a white pill hanging from the thing on a 2 px `muted` leader (`iso.label` draws exactly this,
  `iso.js:90`), or text directly on the object. Name things and people, never a place ("Corridor", "Quiet room").
- **Badge / status:** a solid tag in the outcome colour with white text (`Loom.data.tag`, `color: "pos" | "neg" |
  "accent"`; text is `onAccent` unless `textColor` is passed, `data.js:186`), one per frame.
- **Arrow and connector:** `line` token, drawn on its word (`m.draw` with the whole `kit.arrow` result so the head
  lands at 0.9 of the draw; for `iso.arrow`, draw `E.path` and reveal `E.head`). Dashed means "expected, not yet":
  wipe dashed lines in with `m.unmask` on an element whose box hugs the line, because `m.draw` replaces the dash
  pattern (`runtime/motion.js:87`).
- **Divider:** 48 px of space (preferred), or a 2 px `line` rule at 0.6 opacity.
- **Tick and cross:** `kit.mark(p, "yes" | "no", cx, cy, size)` (shape AND colour, pos or neg disc, white mark; under
  a design seed it takes the seed's mark treatment, `kit.js:223`).

---

## 5. Light, shading, depth and texture

- **Flat fills, one offset shadow:** `shadow: offset`, dx 0, dy 10, opacity 0.08 in navy, no blur. It is the only
  thing that separates a white card from the field (1.07:1), so keep it on cards. `kit.rect` adds it to EVERY rect
  unless you pass `shadow: false` (`kit.js:96`): pass it on fills that sit ON a card or screen (bars, chips, inner
  fields, bezels' inner panels). `Loom.data.barsOn` bars do not pass it (`data.js:103`), so its bars carry a shadow.
- **Depth by value, not by blur:** near things one value step darker or lighter than far things (wall field2, floor
  surface2, desk surface, screen ink). An object and the ground it sits on differ by at least one step in that list
  (surface on surface2, never surface on surface). No depth-of-field, no `m.glow`, no glow kit, no gradients inside
  objects, no gloss, no `shade: "recipe"`.
- **The background field (fx, pack default):** a blue-only mesh at intensity 0.2 (`runtime/fx.js:50`): each pole
  tints the field at most 12 % toward the accent (#DBE5F9; muted text still 5.02:1, ink 13.65:1, accent 4.08:1). It
  drifts slowly and is screen-locked. Set storyboard `fx.enabled: false` for a dead-flat field (mfa-story did).
  Grain 0 (D-100), paper and leak never, vignette 0.08 (about 7 % darker at the corners, `fx.js:84`; it darkens
  cards and text in the corners too, see s15 `fx.vignette_under`).
- **Ambient:** the pack's dot grid (`ambient.kind: dots`: 48 px step, 2.2 px dots in `line` at 0.22 opacity, parallax
  factor 0.08, `runtime/world.js:155-160`). It belongs to template beats and empty fields; a drawn place covers it.
- **fx moments:** the light sweep (`ctx.fxMoment("light", t0, t1, [x, y, w, h])`, rect in station coordinates) suits a
  payoff number; keep it 0.8 to 1.2 s. The spotlight dims everything outside its rect with black at 0.55
  (`fx.js:106`), which turns this light field a muddy grey (`docs/styles/demos/lab/lab_fx__corporate-clean.jpg`,
  t 2.9 and 3.6): do not use it until `fx.spotlight` exists (s15); recolour the rest to neutrals instead (R3).

---

## 6. Composition

- **Safe area** `ctx.box` = {x 96, y 84, w 1728, h 846}. The caption pill sits at y 950 to about 1010 (pack
  `captions.top` 950, 36 px words); nothing that must be read goes below y 930. A floor or a table edge may run under
  the pill (R2 does).
- **Fill:** content covers at least 45 % of the safe area (the step 7 audit's bar); a template on an empty field
  covering 20 % is the most common failure of this style (feedback-that-lands b08, b12 to b18, b42 to b45).
- **One focal point:** the accent element. Everything else is neutral, so the eye lands where the voice is.
- **Text sits on or beside its object** (`lnd-visual-design` s5, spatial contiguity): a label hangs within 80 px of
  its desk, a value sits on its bar, a source line under its chart. No text boxes floating on a gradient.
- **Density:** 3 to 6 meaningful elements per frame (working memory 4 +/- 1); a place adds furniture but each piece
  is neutral.
- **Grid:** 12 columns, 96 px outer margins, 48 px between blocks (`kit.split` default gap), 16 to 24 px inside a group
  (`kit.row`, `kit.col` take the gap; their default is 48).
- **Scale of people and objects:** a person stands 380 to 520 px tall in a mid shot (code rigs at `scale` about 0.45
  to 0.55; Maya 0.42 to 0.5); devices at their real share of a person (`O.REAL`, `O.px`; the scale check warns at
  2 x). A screen that carries the content takes at least 60 % of the frame width (R2: 1200 of 1920) and the people
  around it are smaller.
- **Empty space is composed:** a single object on a plain field is fine for a hero moment (one number, one
  document). A block hugging one side with the other half of the frame empty is not (definition, and document.page
  without a person, do this: s10).

### 6a. Captions and chapter chrome

- **Captions** are the pack's: navy pill at 0.86, white 36 px Inter 700 words, the spoken word in `caption_active`
  (#FCD34D), radius 14, top at y 950. Do not draw your own subtitles or on-screen transcripts.
- **A section change** is a hard cut (compose maps `join_in.meaning: "chapter"` to a cut, `loom/compose.py:26`) onto
  either a `title.card` (kicker of 4 words at most plus a title of at most 9 words, on a place or beside a drawn
  subject) or `Loom.data.chapter` over the held world. `Loom.data.chapter` draws its title in `hero` at weight 900
  with four offset copies in `shadow` behind it (`data.js:211-216`); in this pack those copies are the same navy as
  the title and read as a smear. Pass `depth: "surface2"` so the extrusion becomes a pale offset (unverified on a
  frame), keep its kicker 4 words, and give it at least 3.2 s (`dur`, the default).
- One chapter device per lesson: either title cards or chapter stings, not both.

---

## 7. Motion

- **Personality:** smooth, no overshoot (`motion.overshoot: false`, so `m.pop` and `m.drop` use the `enter` ease,
  `motion.js:35`, `:43`). enter 0.5 s, move 0.36 s (a travel is 2 x move = 0.72 s by default, `motion.js:209`; R1 uses
  1.0 s for a long route), exit 0.3 s, stagger 0.08 s, draw 0.8 s, count 1.2 s. `m.grow` runs 1.4 x enter = 0.7 s;
  `m.settle` 0.55 s. `Loom.data.counter` ignores the pack's count and runs 2.2 s unless you pass `dur`
  (`data.js:49`): pass `dur: 1.2`.
- **Entrances that fit:** `m.reveal` (text and cards, `dy` 8 to 16 px), `m.settle` (a card landing), `m.unmask`
  (lines of text, dashed lines), `m.grow` (bars, desks, anything with magnitude), `m.draw` (connectors),
  `m.converge` (two sides meeting), `m.travel` and `m.along` (the thing that moves through the process).
- **Use sparingly:** `m.pop` for ticks and small marks under 100 px in bespoke scenes (templates pop their nodes and
  options without overshoot; that is accepted); `m.stamp` for one verdict per lesson; `m.emphasis` once per scene.
- **Never in this style:** `m.spring` presets `snappy` and `lively` (the pack clamps their bounce to 0 and warns
  `spring_bounce_clamped`, `expressive.js:44`: use `gentle` or nothing), `m.shake` on text, `m.glow`, stepped time
  and line boil (SCENE_API: never on corporate packs), confetti, `G.burst`.
- **Motion is content:** animate what changes over time (the request moving, the bar dropping, the state switching
  colour). Static facts are composed, not animated (`lxd-asset-design` gate).
- **Ambient life while holding:** the mesh drifts; `Loom.hold.breathe(E, t0, t1, { amp: 0.01 })` on a held hero
  object (default amp is 0.018, too much here), never on text. A hold over 4 s needs a development (a recolour, a
  camera push, a value).
- **Camera:** one continuous move per idea, 1.2 to 1.6 s, `editorial` ease. `Loom.cam.frame(E, rect, t, dur, {margin,
  cx, cy, maxScale})` on one element (`places.js:468`; `cx`, `cy` and `maxScale` are real options not yet in
  SCENE_API); `Loom.cam.push(P, {to, scale, t0, t1})` and `Loom.cam.pan(P, {dx, dy, t0, t1})` on a place: pass `t1`,
  their default length is 2.5 s (`places.js:451`). Pick the frame rect so its edges fall in gaps between words (R2),
  and put the frame centre above the caption band (`cy` about 470).
- **Joins and transitions** (storyboard `join_in`; durations from `loom/compose.py:18`):
  - within one world: `camera` (the pack's `join_default`, 0.95 s) or `continue`;
  - between worlds: `dip` (1.0 s; compose turns a camera join between different worlds into a dip);
  - a section change: `cut` (s6a);
  - `iris` (1.1 s) only into a round thing, `zoom` only into a nested station;
  - `fade` (0.8 s) only for "meanwhile";
  - `handoff` (an object carries into the next shot) or `fill` at most once per lesson, named in the storyboard's
    `devices`;
  - never `torn`, `page`, `scroll` or `motif` (they read as cartoon material, SCENE_API D-114 table).

---

## 8. People and living characters

- **Style block:** S1 "Flat 2D vector, editorial" in `docs/assets/CHARACTER_PROMPTS.md` (natural 7 to 7.5 heads, no
  outline or a thin same-hue line, 3 to 4 flat tone shapes per volume, small calm real eyes, two accents per
  character at most). Characters come from designed kits (`skills/lnd/lnd-character-design`), never improvised in
  scene code: the code may place a kit rig by id (`ctx.character(name, rigId, ...)`), pose it, and choose its clothes
  from tokens; it may not draw a face, a body or a hand.
- **What exists today:** the code rigs `ava` and `sam` (`ctx.character`, flat, no outline), the imported `maya` rig
  (outlined, an illustrated look: two drawing languages next to flat rooms, frame audit A), and Open Peeps busts
  (`kit.peep`, outlined cartoon busts the audit rejected as presenters).
- **Rules until an S1 corporate cast is delivered:**
  - one person in focus at a time, mid shot (380 to 520 px tall), doing something (typing, pointing at the screen,
    handing over a document);
  - the pack dresses code rigs, `kit.peep` and the avatar in `ink` by default (`characters.cloth`). Templates do NOT:
    `document.page`'s person, `scenario.dialogue` (accent left, accent4 right) and the hero blueprints fall back to
    `cloth: "accent"` (`_helpers.js:66`, `documents.js:77`, `more.js:211`, `heroes.js:136`). Give every template
    person `cloth: "ink"` in its props, or a `story.cast` entry with `cloth: "ink"`, until `roles.person_cloth` lands
    (s15);
  - a second cast member takes `top: "accent3"` or `"muted"`; never accent, accent2, pos or neg on clothes;
  - always pass `bottom: "muted"` (or `"ink"`) to a code rig: its default trousers are `field2` and vanish on this
    field (`runtime/rig.js:40`) until `characters.bottom` lands (s15);
  - crowds are `ctx.crowd` with the pack's `extras: "people"` (tops muted, surface2, line; bottoms ink or muted,
    `scenery.js:145`), in the far layer, never beans;
  - Maya only where the set is drawn in her style or she is alone on a plain field (mfa b01 shows the clash);
  - no avatar busts in a void (feedback b01 to b03, b46, b47).

---

## 9. Objects, icons, data and UI

- **Icons:** Lucide only (`kit.icon`), stroke 2.0 (`icons.stroke`), one family per lesson (no Fluent emoji next to
  line icons, audit A). Icons are small marks (under 100 px). Anything the narration names as a thing is an object
  (`Loom.obj.draw(ctx, name, kind, {x, y, size, tone, detail})`, x and y are its centre), in neutral tones
  (`surface`, `surface2`, `accent3`) unless it is the named thing.
- **Places:** draw the place in neutrals. The perspective office paints desks and shelves in `accent`
  (`runtime/places.js:189`, `:218`), books in accent4, accent2 and accent3 (`:198`) and plants in pos and accent4
  (`:212`); `Loom.place.meeting` paints its chairs in `accent` (`:371`, `:372`) and its wall chart teal and amber
  (`:364`); the warehouse shelves are `accent` (`:395`). Until pack `materials` lands (s15), either build the set
  yourself (R1 iso floor, R2 wall and table), or use `Loom.place.office(ctx, name, { look: "flat" })`, the plain office
  (`places.js:109`, `:232`), whose desk is muted and surface (its near plant is still teal, 300 px tall: keep it out of
  frame or out of focus).
- **Data:** grey context, one blue. Context bars `accent3` (slate), the bar the voice names `accent`, nothing else
  saturated (R2). Bars start at zero; label directly (months under bars, the value on its bar); show only the values
  you speak, with a dashed reference line for "around three days". `Loom.data.barsOn` already does slate context
  with a blue LAST bar (`data.js:103`): order the bars so the named one is last, or pass `color` per bar. The
  `chart.bars` template paints context bars `accent4` teal (`templates/more.js:171`), which reads as "good": prefer
  `barsOn` or a bespoke chart (s10, s15 `roles`). `Loom.data.dipLine` draws its line in `neg` by default
  (`data.js:129`): pass `color: "accent"` (or `"ink"` for context).
- **Outcome colours:** pos and neg are for outcomes, as marks and short tags, never as data series or fills over
  300 x 60 px.
- **A number:** `Loom.data.counter` (default colour ink, caption muted, `data.js:44-46`; pass `dur: 1.2`) for one
  number; the accent only if the number IS the named change. The `stat.hero` template paints its number amber
  (`core.js:329`): accept it for a template beat, never copy it in bespoke art.
- **UI, mail, chat, documents:** `Loom.ui.mail | inbox | chat | doc` with every word real (reference board
  `docs/references/ui/mail-chat-doc.md`). Mostly greys with one accent: the link and the Report and button fills are
  `accent` by default (`ui_artefacts.js:88`, `:158`, `:170`); a `banner` is accent4 by default (`:95`). Mark words with
  `Loom.ui.mark` (default tone accent2 at 0.32, `:303`) and lead to a card with `Loom.ui.wire` (default tone accent).
  Sender avatars take accent, accent3, accent4 or accent2 from the name's hash (`:41`): a four-colour inbox breaks
  the hue budget, so show at most two senders' avatars in one frame. Known risk in this pack (unverified): `Loom.ui`
  measures the address, time and body at weight 400 (`:125`, `:137`, `:151`) but draws them with no weight, so they
  render at 700 (s3). Words may sit wider than their measured box and a `Loom.ui.mark` sweep may fall short of its
  phrase; check marked phrases on the contact sheet.

---

## 10. Templates in this style

Every template draws in the pack's tokens; these are the settings that keep it native here. "Families" counts
saturated hue families the template spends by itself (s2 budget: two).

- **title.card:** title in the `title` role (60 to 88 px, `core.js:45`), an `accent` rule under it, kicker amber:
  two families. `align: "left"` with a drawn subject beside it, or centred on a place; `accent` stays "accent";
  `panel: true` only over a busy shot. Kicker 4 words at most. With `icon`, the disc is filled `accent`.
- **definition:** term amber, rule blue, icon disc teal (`core.js:91`, `:96`, `:117`), and the example card's "e.g." is
  amber: three families with an icon. Omit `icon`. The block is centred vertically but starts at x 216 and is at most
  1180 px wide, so the right third of the frame stays empty: use it at most once per section, and prefer a bespoke
  beat with the term ON the object it names.
- **compare.two:** `valence: "pos" | "neg"` fills the whole 104 px header band of that side (about 800 x 104 px,
  `core.js:212-214`): a neg band is a big red fill. Leave `valence` neutral (a surface2 band with ink header) and use
  `verdict: "right" | "wrong"` for the judgement only when one side is the correct answer; `stance: myth | fact` for
  myths. The verdict pill is amber (`core.js:245`); row bullets are blue on neutral sides. Never `valence: neg` on
  both sides.
- **document.page:** an INK page (760 x 780, `documents.js:25`) with a teal header band and white title, lines in
  `field` (near-white) text, and `mode: "highlight"` sweeping an amber marker at 0.55 behind them (`:62`; field on
  amber over ink about 8.8:1, hand). Two families already (teal, amber): no blue in this frame. Without a `person` the
  page sits at x 200 and the right 56 % is empty: pass `side: "center"`, or a `person` with `cloth: "ink"`. Keep the
  element name `page` and build the next beats on it (`keep: ["page"]`).
- **list.steps:** 3 to 5 items, `marker: "number"` (blue discs, white numerals: one family); ticks only for a done
  list. Item text is body at 700 (s3).
- **process.flow:** 3 to 5 steps; the last step's disc is blue, earlier icons amber on white discs (`core.js:280`):
  two families. Labels lead 700. A `token` travels the chain as a navy pill. For a process in a place, prefer R1.
- **timeline:** dates and dots in amber, lead 700 (`more.js:394-395`); keep labels to 6 words (the column is 300 px,
  two lines of body). One family: an accent may mark the event the voice names, nothing else.
- **quiz.question / quiz.answer:** option letters are amber discs (`more.js:47`); the pause bar is teal at 0.55
  (`:60`): two families, so the question frame takes no blue. Keep the default `kicker` ("Your turn") and
  `pause_label`. In the answer the right option gets a 7 px pos ring and a tick, the others dim to 0.38; the
  tempting option gets its `why_not`; a `takeaway` is set in accent.
- **recap:** every item gets an icon: a missing icon draws a Lucide `check` (`more.js:277`), which reads "do this".
  Icons and the rule pill are amber, labels flash amber then settle ink: one family. The thread is a dotted `line`.
- **chart.bars:** set `highlight` on the bar the narration names; context bars are teal and bar radius reaches 18 px
  (`more.js:171`). Prefer `Loom.data.barsOn` or R2 until `roles` lands (s15).
- **stat.hero:** the number is amber (`core.js:329`) and pulses once (`m.emphasis`). Use it for a source number in
  a template beat; in a place, use `Loom.data.counter` in ink.
- **scenario.dialogue:** bubbles in ink and amber with white text; people in accent and teal unless `cloth` or a cast
  is given (s8). Pass `cloth: "ink"` and `cloth: "accent3"`.
- **avatar:** avoid (an Open Peeps bust in a disc). If used, give it a `card` (up to 3 lines, `overlay.js:119-122`) so
  the empty side is not empty; its card title is amber; its cloth follows the pack (ink) unless `cloth` is passed.
- **Any template over a drawn scene** gets the automatic backplate (blurred at 9 px, `world.js:291`); never pass
  `backplate: false` here.

---

## 11. Recipes (code)

Every call below exists and was checked against `docs/SCENE_API.md` and `runtime/*.js` on 2026-10-07 (round 2 also
checked every option name). R1 and R2 are whole scenes in `scenes_examples/` and were previewed (PREVIEW,
browser-free); R3 to R5 are unrendered.

**R1. A process as a route across a real place: one blue owner at a time.**
`scenes_examples/style_corporate_clean_request_route.js`. The core, for one leg:

```js
const tFin = ctx.cue("goes to finance first");
const iso = ctx.iso({ x0: 700, y0: 210, unit: 80 });
iso.tile("floor", -1, -0.5, 14, 5.2, { fill: "surface2" });
const own = iso.tile("own_finance", 4.65, 1.15, 2.9, 1.9, { fill: "accent" });   // the owner's tile, the one blue
iso.box("desk_finance_top", 5, 1.5, 0.62, 2.2, 1.2, 0.1, { fill: "surface" });
const leg = iso.arrow("leg_1", [2.5, 2.1, 0.02], [4.4, 2.1, 0.02], { stroke: "line", sw: 5 });
iso.label("label_finance", 6.15, 1.6, 1.34, "Finance", { lift: 70 });
iso.done();                                                        // painter's order, once
const [ax, ay] = iso.P(0.75, 2.35, 0.72), [bx, by] = iso.P(5.75, 2.35, 0.72);
const carrier = ctx.el("request_carrier", { x: ax - 87, y: ay - 127, w: 174, h: 174, kind: "token" });   // true box
Loom.obj.draw(ctx, "request_doc", "document", { x: 87, y: 87, size: 96, tone: "surface", detail: 2, parent: carrier.inner });
m.reveal(leg, tFin - 0.05, { dy: 0, dur: 0.01 });
m.draw(leg.path, tFin, { dur: 0.6 });
m.reveal({ inner: leg.head }, tFin + 0.5, { dy: 0 });
m.travel(carrier, tFin + 0.2, { x: bx - ax, y: by - ay, dur: 1.0 });
Loom.tween(own.outer, { opacity: 0 }, { opacity: 1, duration: Loom.style.dur("exit") }, tFin + 1.0, { kind: "reveal", name: own.name, content: true });
```

Two legs need two carriers (the second nested with `parent: carrier.inner`), one `m.travel` each: two travels on
one element both render their start state at load (seen in this scene's first preview), until "M.travel drive key"
lands (s15).

**R2. Data in a place, then a camera push to the bar that changed.**
`scenes_examples/style_corporate_clean_wall_chart.js`:

```js
const BASE = 700, X0 = 500, STEP = 170, BW = 100, AXW = 5 * STEP + BW + 80;
const room = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
const h = 0.8 * 108, x = X0 + 5 * STEP;
const B = ctx.el("bar_jun", { x, y: BASE - h, w: BW, h, kind: "bar", parent: room.inner });
kit.rect(B.inner, 0, 0, BW, h, { fill: "accent", r: 6, shadow: false });            // context bars: "accent3"
const ref = ctx.el("ref_three_days", { x: X0 - 40, y: BASE - 3 * 108 - 4, w: AXW, h: 8, kind: "connector", parent: room.inner });
kit.line(ref.inner, 0, 4, AXW, 4, { stroke: "muted", sw: 3, dash: "12 10" });
m.grow(B, ctx.cue("drops to under one"));
m.unmask(ref, ctx.cue("hovers around three days") + 0.5, { dur: 0.6 });   // dashed: wipe its own box, never draw
Loom.cam.frame(room, { x: 710, y: 300, w: 927, h: 460 }, ctx.cue("the change worth talking about"), 1.4, { margin: 70, cy: 470 });
```

**R3. Move the accent instead of dimming the rest.** The owner of a state changes on the word; the old owner goes
back to a neutral. `Loom.hold.heat` finds shapes by the colour they were DRAWN in, at build time (`hold.js:39`), so
draw each card in exactly its `from` token, and recolour each card once per scene (a second heat back to the start
token finds nothing and warns `hold_nothing`):

```js
const cardA = ctx.el("state_draft", { x: 300, y: 380, w: 360, h: 200, kind: "card" });
const cardB = ctx.el("state_review", { x: 1260, y: 380, w: 360, h: 200, kind: "card" });
kit.rect(cardA.inner, 0, 0, 360, 200, { fill: "accent" });
kit.rect(cardB.inner, 0, 0, 360, 200, { fill: "accent3" });
kit.text(cardA.inner, "Draft", { role: "lead", x: 32, y: 0, w: 296, h: 200, valign: "middle", weight: 700, color: Loom.style.pickTokenOn("accent") });
kit.text(cardB.inner, "In review", { role: "lead", x: 32, y: 0, w: 296, h: 200, valign: "middle", weight: 700, color: Loom.style.pickTokenOn("accent3") });
const t = ctx.cue("then it moves to review");
Loom.hold.heat(cardA, t, { from: "accent", to: "accent3", dur: 0.5, name: "a_off" });
Loom.hold.heat(cardB, t, { from: "accent3", to: "accent", dur: 0.5, name: "b_on" });   // white reads on both: 5.17 and 4.76:1
```

Never fade an accent fill that carries white text to 40 % opacity (`lab_matrix_build`: white on pale blue).

**R4. A labelled object with an outcome.**

```js
const doc = Loom.obj.draw(ctx, "policy_doc", "document", { x: 960, y: 470, size: 300, tone: "surface", detail: 3 });
m.settle(doc, ctx.cue("the policy"));
const done = ctx.el("doc_ok", { x: 1130, y: 300, w: 72, h: 72, kind: "mark" });
kit.mark(done.inner, "yes", 36, 36, 64);
m.pop(done, ctx.cue("signed"));
Loom.data.tag(ctx, "doc_state", { x: 860, y: 680, text: "Signed", color: "pos", t: ctx.cue("signed") + 0.2 });
```

**R5. A real message with the one thing to notice marked.** Every word comes from the script or the knowledge sheet
(`S`, `N`, `ADDR`, `P`, `L` stand for them here):

```js
const A = Loom.ui.mail(ctx, "msg", { x: 260, y: 120, w: 1400, subject: S, from: { name: N, address: ADDR },
  to: "you", time: "09:14", paragraphs: P, link: { text: L } });
Loom.ui.build(ctx, A, ctx.cue("the message arrives"));
Loom.ui.mark(ctx, A, "address", "-help", ctx.cue("look at the address"), { tone: "accent2" });   // part keys: ui_artefacts.js part(A, ...)
```

Check the marked phrase on the contact sheet: in this pack the address is measured at 400 and drawn at 700 (s9).

---

## 12. Failure modes seen in real frames

| failure | where seen | why | rule or check that prevents it |
|---|---|---|---|
| Spoken caption word unreadable (amber on navy, 2.29:1) | every caption of mfa-story, e.g. `qa/frames/60.72.png` "guarantee." | `captions.active` was accent2, a dark amber made for the light field | pack: `caption_active` #FCD34D (7.98:1); style lint measures the pill (`style_lint.caption_ratios`, RC20) |
| Pink in a style that has no pink: axis pills, a queue box, a chart bar, books, a plant pot, a sender avatar | `lab_matrix_build__corporate-clean.jpg`, `lab_iso__corporate-clean.jpg`, `lab_characters__corporate-clean.jpg`, `lab_ui_artefacts__corporate-clean.jpg` ("F" avatar), mfa b01 | the runtime uses accent3 as its default context and decoration colour; this pack's accent3 was #DB2777 | pack: accent3 slate #64748B (compared in browser-free previews, 2026-10-07; not stored in the repo) |
| Teal fills got navy icons and text while blue and amber got white; teal tags printed white at 3.74:1 | `lab_iso` "Orders DB" box, `lab_tpl_definition` icon disc | #0D9488 is too light for white text, so `pickTokenOn` chose ink; `Loom.data.tag` hard-codes onAccent | pack: accent4 and pos #0F766E (white 5.47:1) |
| Pastel pink, teal and blue wash behind every template | feedback-that-lands sheets (b08 to b18, b22 to b25, b42 to b45), `lab_fx__corporate-clean.jpg` | mesh at 0.55 with accent, accent4, accent3: a 33 % tint, muted text 3.71:1 | pack: blue-only mesh at 0.2; or `fx.enabled: false` |
| Spotlight turns the frame muddy grey | `lab_fx__corporate-clean.jpg` t 2.9, 3.6 | the shader dims 55 % with black on a near-white field (`fx.js:106`) | s5: no spotlight; recolour (R3); `fx.spotlight` (s15) |
| Royal-blue furniture | feedback b10, b19 to b36; mfa b01 (pale blue desk, shelf) | `places.js` builds furniture in the accent token | s9: neutral sets or `look: "flat"`; `materials` (s15) |
| Three saturated families in one frame | mfa b07 (red bars, amber ring and tag, teal number) | each element picked its own meaning colour | s2 hue budget: blue plus one |
| Red as a big fill | mfa b07 "Without MFA" bar, about 1000 x 96 px | neg used as a data series | s2, s9: neg only as marks and tags under 300 x 60 px; risk bars in accent3 with the named bar in accent |
| White words on a faded accent | `lab_matrix_build` "Routine", "Safe, slower" | an accent cell dimmed to 42 % keeps its white text | R3: recolour, never fade a text-carrying fill |
| Ink text on a coloured pill | `lab_matrix_build` axis pills (ink on slate 3.63:1, before: ink on pink 3.76:1) | `color: "ink"` hard-coded on a fill | s2: `pickTokenOn(fill)` always |
| Slides on an empty gradient: kicker, one line, 70 % empty | feedback b08, b12, b13, b18, b22, b23, b42 to b45 | template-heavy plan on a decorated field | s6 fill rule; s10 template limits; R1/R2 places instead |
| Specks of type | feedback b19 checklist, b45 panels; mfa b02 to b14 window captions ("Someone else, far away") | labels at the 24 px floor inside scaled-down screens | s3: bespoke labels 28 to 30 px after scale; film check under 26 px |
| Body copy in bold | `lab_ui_artefacts__corporate-clean.jpg` (mail paragraphs) | `kit.text` with no weight uses Inter's second loaded weight, 700 (`kit.js:306`) | s3: pass `weight: 500` for body |
| Illustrated character in a flat room | feedback b04, b19 to b36; mfa b01, b21 | an outlined kit next to outline-free sets | s8 |
| A second travel's start shown from frame 0 | this guide's R1, first preview (t 1.5: the request already at finance) | two `m.travel` on one element: the later drive renders its start at load | R1 carriers; "M.travel drive key" (s15) |
| A push that cuts a word at the frame edge | R2 first preview ("Feb" cut to "b") | a frame rect chosen by the bars, not by the words | s7: choose the rect so the edges fall in gaps |
| Props with no value step | R2 first preview (a surface2 laptop and a surface sheet on a white table read as smudges) | neutral on neutral, 1.0 to 1.2:1 | s5: one value step between an object and its ground |

---

## 13. Polish checklist (yes or no, on the contact sheet and the strips)

1. Is the spoken caption word light amber and readable on the pill on every sheet?
2. In each settled frame, is there exactly one blue element (or one blue family of the same thing), and is it what
   the caption names at that moment?
3. Does every frame show at most two saturated hue families (blue plus amber, teal or red; navy and slate excluded)?
4. Is there no pink, no purple and no pastel wash anywhere?
5. Is all text on a coloured fill white, and is no text set in line or slate under 24 px?
6. Do pos and neg appear only as ticks, crosses and tags no bigger than about 300 x 60 px, never as bars or bands?
7. Is every bespoke label at least 28 px as seen (after camera and scale), and is nothing readable below y 930?
8. Does content cover at least 45 % of the safe area, with neither half of the frame empty?
9. Does each motion beat happen somewhere (a desk, a screen, a floor, a room), not on an empty field?
10. Is all furniture neutral (no blue desks, chairs or shelves; no teal plants in focus)?
11. Are people in navy or slate clothes with visible trousers, one in focus, and no beans or busts in a void?
12. Is there one icon family (Lucide line icons), and no emoji-style art?
13. Charts: zero baseline, direct labels, slate context, one blue bar, only spoken values on screen?
14. Is body copy visibly lighter than names and titles (500 against 700)?
15. Are radii varied by role (20 cards, 14 bezels, 6 bars, pills only for chips), not one radius on everything?
16. Are dashed lines dashed in every frame of the strip, including the frames where they arrive?
17. In the strips around a camera move, is no word cut by the frame edge?
18. Does every hold longer than 4 s (8 or more identical strip frames) show a change by its end: a recolour, a push
   or a new value?

---

## 14. Gaps (assets and checks; engine requests are in s15)

| gap | size | what |
|---|---|---|
| An S1 corporate cast (people at a desk, in a meeting, presenting) | L | Claude Design from `docs/assets/CHARACTER_PROMPTS.md` S1 and F2: the biggest gap. Today: flat code rigs `ava` and `sam` (simple) or outlined Maya (another drawing language). Until then: s8 rules. |
| Office and meeting sets drawn in the flat editorial look | L | Claude Design or CC0 kits through `tools/asset_intake.py`: places from references, in neutrals, with the accent reserved. Until then: R1, R2 or `office` with `look: "flat"`. |
| Chrome proof of this guide's pack changes | S | `py -m loom lab lab_iso --style corporate-clean`, then `lab_fx`, `lab_matrix_build`, `lab_tpl_definition`, `lab_ui_artefacts`, then the two example scenes (needs "loom lab --file", s15). The previews here are browser-free; the PC render is the truth. |
| Guide table check | S | `docs/styles/guides/README.md` says context_check checks a guide's token table against the pack; `tools/context_check.py` has no such check (grep "guides": no match, 2026-10-07). Until it does, a pack edit must update s2 by hand. |
| `caption_active` under a brand | S | `loom/brand.py apply_brand` recolours accent, accent2 and accent4 but not `caption_active` or `pos`; check whether they should follow the brand (lint passes either way). |

---

## 15. Engine and asset requests

Names below are the shared names used by all five style guides. Each is **proposed (not yet read by the runtime)**
unless marked otherwise. "Until then" is the fallback this guide follows now.

| request | size | what this guide needs from it | until then |
|---|---|---|---|
| pack `materials: {wood, chair, screen}` | M | furniture tokens read by `runtime/places.js` (189, 218, 371, 372, 395) and `scenery.js` instead of hard-coded `accent`; corporate-clean sets `wood: "surface2"`, `chair: "accent3"`, `screen: "ink"` | s9: build the set (R1, R2) or `Loom.place.office(..., {look: "flat"})`; keep `meeting` and the perspective `office` for far, small shots only |
| pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` | M | template default colours from the pack; corporate-clean wants `stat_value: "ink"`, `person_cloth: "ink"`, the rest as today (amber for kicker, term, verdict, date, quiz_letter, recap_rule, chapter_kicker, ui_mark; accent for link, button). Same mechanism should cover the chart.bars context bar (`more.js:171`, slate) and the definition icon disc (`core.js:117`, surface2 with an ink icon), which are not in the shared list: added here as guide-specific asks | s10: pass `cloth: "ink"` on every template person; omit `icon` on definition; prefer `barsOn` or R2 to `chart.bars`; accept the amber `stat.hero` number in template beats only |
| `fx.spotlight: {strength, tint}` | S | `fx.js:106` reads strength and tint; corporate-clean `{strength: 0.25, tint: "field2"}` | s5: no spotlight; recolour the rest (R3) |
| `fx.vignette_under: true` | S | the 0.08 vignette darkens only the field, not cards and text in the corners | accept the 7 % corner darkening; keep text out of the outer 96 px |
| `characters.bottom` | S | the rig's default trousers (`rig.js:40`, `field2`) come from the pack; corporate-clean `muted` | always pass `bottom: "muted"` or `"ink"` |
| runtime fix "M.travel drive key" | S | a second `m.travel` on one element no longer shows its start at load (`motion.js:211` passes a key, as `core.js:111-115` allows) | one carrier element per leg (R1) |
| runtime fix "m.draw stroke-first, keeps per-path opacity and dashes" | S | a dashed reference line can be drawn on its word | wipe dashed lines with `m.unmask` on a box that hugs the line (R2) |
| runtime fix "font weight clamp to loaded weights (no synthetic bold)" | S | weights 600, 800 and 900 asked by templates and `Loom.data.chapter` map to the loaded 700 explicitly, so measure and draw agree; this guide asks the same fix to cover `Loom.ui`'s 400 measurements (`ui_artefacts.js:125`, `:137`, `:151`), which draw at the pack default 700 here | s3: pass `weight` on every `kit.text`; check `Loom.ui.mark` phrases on the sheet |
| tooling "loom lab --file with @lab cue map" | S | render `scenes_examples/style_corporate_clean_*.js` in Chrome with their narration cues | `tools/lab_preview.py` (PREVIEW only); judge nothing final on it |
| `guide` key read by the API agents | S | `loom/agents/conductor.py _style_summary` passes the pack's `guide` path so storyboard and scene workers read this file (today it does not read it) | Cowork task files name the guide by hand |
| `Loom.data.counter` takes the pack's `count` | S | default `dur` from `motion.count` (1.2 s) instead of 2.2 s (`data.js:49`) | pass `dur: 1.2` |
| `Loom.data.dipLine` default colour | S | default line `accent` or `ink`, not `neg` (`data.js:129`) | pass `color` |
| Tabular figures | S | `font-variant-numeric: tabular-nums` on counters so digits do not jitter (unverified that Inter's woff2 subset carries tnum) | counters hold their final width (`Loom.data.counter` measures the final string) |
| A UI type role separate from label | M | lets the pack raise the label floor to 26 to 28 without overflowing `Loom.ui` | bespoke labels at 28 to 30 px by hand (s3) |
| An S1 corporate cast | L | s14 | s8 rules |
| Flat editorial office and meeting sets | L | s14 | s9 |

---

## 16. Verified on 2026-10-08 (the WS6 proof)

The section 15 runtime requests marked S shipped on 2026-10-08 (D-128; report
`docs/research/2026-10-08-style-system-report.md`; tests `tests/suites/style_system.py`). Sections 1 to 15 were
written before they landed: where a passage says "proposed", "not yet read by the runtime" or "until X lands", X has
landed, the pack below sets it, and that passage's fallback is no longer needed unless this section says so. The
strips, the measurements and the section 13 checklist results are in
`docs/styles/demos/guides/corporate-clean/README.md`; the encoded example is `docs/styles/demos/guides/corporate-clean/style_corporate_clean_wall_chart__h264_crf18.mp4`.

**What the runtime now reads from this pack:**
- `materials`: wood `surface2`, chair `accent3`, screen `ink`, books `["accent3", "muted", "line", "surface2"]`, plant `muted`
- `roles`: term `accent2`, stat_value `ink`, person_cloth `["ink", "accent3"]`
- `fx.spotlight` `{"strength": 0.25, "tint": "field2"}`, `fx.vignette_under` `true`
- `characters.bottom` `muted`

**Shared changes every style gets:** words are drawn and measured at a weight the family loaded (no synthetic bold);
`m.draw` draws outlines before fills, keeps each path's own opacity and keeps a dashed line's dashes; a second
`m.travel` of one element no longer shows at load; the lab renders any scene file with its `@lab` cues and words
(`py -m loom lab --file <scene> --out <dir>`); the API agents and the Cowork task files read this guide for the
storyboard and scene stages; `py tools/context_check.py` fails when section 2's palette rows disagree with the pack.

**Verified in Chrome:** every word in both examples 28 px or larger as seen, none cut, none below y 930; the
June bar is the frame's one blue thing; the dashed reference stays dashed in every frame; the office set is neutral
after the pack set `materials.books` and `plant`; the definition template is one amber family (`roles.term` set
explicitly, so its rule and icon follow). On the crf 18 MP4 the mesh field shows no banding (44.3 dB).
**Still unverified:** the caption pill (no captions in lab strips), content coverage (item 8), radii by role (item
15); `Loom.ui`'s Report button, link and chat bubble are all blue (the guide keeps link and button in accent), so a UI
beat has more than one blue thing.

## 17. Set decorations follow the pack (2026-10-08, D-133)

`runtime/places.js` now reads `materials.window_lights`, `vessel`, `cells`, `leds`, `cables`, `chart` and
`safety_line` (L-286), and `Loom.obj` reads `materials.objects` for every kind. Each value below comes from section 2
and is set only where the runtime's fallback breaks a rule there; a key left out keeps its fallback because section 2
allows it. Where an earlier section says `places.js` hard-codes one of these, it no longer does. This section
supersedes the `materials` line of section 16. Strips: `docs/styles/demos/guides/corporate-clean/lab_set_decor__corporate-clean.jpg` (after)
and `lab_set_decor__corporate-clean__before.jpg`, from `scenes_examples/lab/lab_set_decor.js`; record
`docs/research/style-system/red_L276_set_decor.txt`.

**What the runtime now reads from this pack (`materials`, in full):**
- wood `surface2`, chair `accent3`, screen `ink`, books `["accent3", "muted", "line", "surface2"]`, plant `muted`,
  window_lights `accent3`, cells `["accent3"]`, leds `["accent3"]`, cables `["accent3", "line"]`, chart `["accent3"]`,
  safety_line `accent3`, objects `{document: accent3, envelope: surface, clock: accent3, folder: accent3, package:
  accent3, building: accent3, bulb: accent3, lock: accent3}`

**Why (section 2):** accent is the named thing and never decoration or furniture; accent2 may appear only as type and
one pill and never as a data series; accent4 and pos read as "correct". So the window lights, the cells, the LEDs, the
chart bars, the safety line and the clock, folder, package, building, bulb and lock take accent3 (context and neutral
objects: context bars, iso boxes that are not the point). Cables add line (connectors). The envelope is surface
(anything you could pick up or read). The document is accent3 because a surface document draws its header in the
accent (`objects.js:109`). Left at the fallback: vessel, calendar and heart accent3, phone surface2; the laptop reads no
tone. Measured: the accent3 packages are 13.2 % of the warehouse frame (accent3's share is 3 to 15 %).
**Seen on the strips:** no accent left in the set decorations or in the default object tones. **Still open:** the laptop
screen's chart keeps a teal and an amber bar, drawn inside the object (L-287).
