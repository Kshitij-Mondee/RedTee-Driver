# screencast (living screencast): the style guide

STATUS: FIRST VERSION (2026-10-16), built with its engine (`runtime/engines/screencast.js`, sections 17 to 21) at
Kshitij's request: living screencast "better than lemo-opuscar's ... as an engine, as a visual style, in its output
quality and efficiency, and in its direction and storyboarding". Proven on lab strips in the Node preview only
(section 16): not yet in Chrome, on a lesson or on an encoded MP4.

Pack: `packs/styles/screencast.json`. Engine guide (for the storyboard and scene agents):
`docs/styles/engines/screencast.md`. Research: `docs/research/2026-10-16-style-screencast.md`. Lab scenes:
`scenes_examples/lab/sc_tour.js`, `sc_walkthrough.js`, `sc_lesson.js`. A guide compares versions within its own style
only (D-122): "better" here means a clearer, calmer, truer software lesson, never closer to another style.

## 1. Purpose and register

A believable application on a quiet light desk, redrawn as sharp vector UI so the camera can go anywhere and the words
stay crisp at any zoom. The pointer is the learner: it travels at a person's pace, hovers, presses and types, and the
product answers. The look is clean, modern and brand-neutral: a generic app built from the lesson's own words, never a
real product's chrome, logo or palette. On top of the product sits a teaching layer in one magenta signal colour, so a
learner never mistakes a ring, a callout or a tag for part of the software (van der Meij and van der Meij 2013, G6.3).

Fits: software and systems training (the most common corporate L&D job), new tool roll-outs, settings and
configuration, security settings, data entry and forms, reports and exports, sharing and permissions, onboarding to an
internal system. Audience: corporate adults who will do this task tomorrow (CLAUDE.md rule 11).

Never for: soft skills, people stories, abstract concepts with no screen, wellbeing, children. A lesson that needs the
"why" in a story uses another style for those beats and this one for the screen.

References (study, never copy or republish): lemo-opuscar's living-screencast (the grammar: a redrawn UI, the cursor as
the user, push-ins, a keystroke HUD, chapter pills, a spotlight freeze; not its mascot, whips, blur or one-minute arc),
Screen Studio's auto zoom on clicks (where to zoom), and the research on software demonstrations (van der Meij 2013;
Plaisant and Shneiderman 2005). Full list with dates: the research file.

## 2. Palette roles

Hex values are copied from `packs/styles/screencast.json` as it is on 2026-10-16. Ratios measured with
`loom.checks.style_lint.contrast`.

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #E9EDF3 | the desk behind the window; the chapter card's wash | around the window, under the captions | inside the product | 15 to 25 % |
| field2 | #DCE2EA | hairlines in the product (with line), the window's edge tone | separators, borders | as text | under 2 % |
| surface | #FFFFFF | the window and its cards, inputs, menus, dialogs, toasts | every product surface | as the only edge of a card (it needs its hairline) | 50 to 65 % |
| surface2 | #F3F5F8 | the page behind the cards, table heads, the search box | backgrounds inside the product | as text | 10 to 20 % |
| ink | #101828 | all product words; the pointer (17.75:1 on surface) | text, the pointer | a large fill | 3 to 6 % |
| muted | #475467 | secondary words: subtitles, help, placeholders, table heads (7.69:1 on surface) | secondary text, icons at rest | the thing the narration names | 2 to 4 % |
| line | #6B7588 | mixed into the hairlines; connectors (3.95:1 on field) | borders (mixed), rare strokes | text under 24 px | under 1 % |
| accent | #2456D3 | the PRODUCT's primary: primary buttons, the active nav item and tab, toggles on, focus rings, links | product controls | a teaching mark (that is accent2) | 2 to 5 % |
| accent2 | #C0177A | the TEACHING signal: click rings, callout leaders and edges, the spotlight edge, region names, the active chapter pill, step badges (4.90:1 on field; white on it 5.76:1) | the teaching layer only | any product control or state | under 3 % |
| accent3 | #5B6B82 | a neutral product status ("Draft"), avatars | status pills, monograms | as the named thing | under 1 % |
| accent4 | #B45309 | the product's warning ("Pending") | status pills, warning values | as decoration | under 1 % |
| pos | #11805C | the product's success ("Approved", toasts, done chapters) | status pills, toasts, ticks | a teaching mark | under 2 % |
| neg | #C52A2A | the product's error: validation, "Returned", danger buttons | errors, danger | a teaching mark | under 1 % |
| shadow | #0B1220 | window and menu lift (low opacity), dark callouts, the HUD, the spotlight dim, the step pill | overlays of the teaching layer, soft shadows | a product surface | under 4 % |
| onAccent | #FFFFFF | words on accent, accent2, neg | buttons, pills | anywhere else | |
| caption_active | #FFD36B | the spoken word in the caption pill (9.71:1 on it) | captions only | scene art | |

Two colour systems on purpose: the product keeps its own (accent, pos, neg, accent4, accent3); the teaching layer has
one (accent2 on shadow and surface). A lesson about a real product keeps this neutral product palette (brand-neutral by
rule); a brand pack may change accent only.

## 3. Type

- **Inter** for the product and the teaching layer (a generic modern app is set in a grotesk like it; the shell reads as
  software, not a slide). Weights 400, 600, 700. **JetBrains Mono** for code, IDs and URLs when a lesson shows them.
- **UI text at video sizes, not desktop sizes** (research section 4): base 21 px (`screencast.ui_text`), floor 20 px
  for context text, 26 to 28 px for page and region titles, 52 px for card values. A desktop app at 13 to 14 px would be
  40 % smaller and unreadable in an LMS player.
- **Words the learner must read: 32 px or more on screen** after the zoom (`read_px`); the walkthrough's camera exists
  to get there (21 px x 1.6 = 34 px). `sc_zoom_small_text` warns when a zoom falls short.
- Overlays: 24 to 28 px in screen space (pills, HUD, callouts, region names), never scaled by the camera.
- Roles (pack `type`): display 96 to 132, hero 80 to 112, title 52 to 72, lead 32 to 40, body 28 to 34, label 24 to
  28, caption 20 to 24. The film check's warning floor is lowered to 20 px for this pack (`pace.text_warn_px`, with its
  reason); the 18 px error stays.
- Truncation is real UI behaviour: a cell or label too long for its box ends in an ellipsis (the engine measures).
  Keep lesson words short enough that nothing that matters is cut.

## 4. Shape language

- Rounded rectangles, radius 10 (controls) to 16 (dialogs), hairline borders (1.5 px, a field2/line mix), flat fills.
- Pills for status, chapters, steps and tags; circles for monograms and badges.
- Lucide icons at 22 to 26 px, stroke 2, in muted (at rest) or the control's colour.
- The pointer: a classic arrow (ink with a white edge and a soft offset shadow), 44 px at scale 1, an I-beam over text
  fields; it grows with the zoom, but less (by the square root), so it never hides the words it points at.

## 5. Light, shading, depth and texture

- Flat, with soft lift only where the product has it: the window, menus, dialogs and toasts get three stacked
  low-opacity offset washes (no blur filter). No gradients, no texture, no grain, no vignette (pack `fx`).
- Depth comes from the camera (zoom) and from dimming (a modal backdrop, the spotlight, the tour's wash), never from
  parallax or blur.

## 6. Composition

- The window fills the frame at scale 1 (96, 78, 1728 x 856): above the caption band (950), with a 78 px strip above it
  for chapter pills (left) and the step pill (right). The keystroke HUD sits bottom centre above the captions.
- Zoomed, the window always covers the frame (never its edge, never the desk) except below 944 px, where the captions
  are; the view centres a little above the middle.
- One focus at a time: the pointer, the zoomed control, or the spotlight. Tour names go outside their region, on a
  light wash over the rest of the window.

## 7. Motion

- **UI micro-motion** (NN/g 2020): hover 120 ms, press 70 + 140 ms, toggles 200 ms, menus 200 ms, dialogs 260 ms (scale
  0.96 to 1), toasts 280 ms (rise 18 px), all ease-out; exits shorter.
- **The pointer:** minimum-jerk speed on a slight seeded arc, 0.5 to 1.3 s a move, capped at 1500 px/s on screen;
  arrives 0.3 s before the press; a 220 ms dip and a ring in accent2 on each press.
- **The camera:** zoom in 0.8 s, out 0.7 s, eased in and out, scale interpolated geometrically; one move in flight;
  never across a press, typing or a shortcut.
- **Typing:** 14 characters a second with a caret that blinks when idle.
- Nothing loops, drifts or breathes while the screen holds.

## 8. People and living characters

A screencast is about the screen: no background crowd (`characters.extras: none`) and no mascot. People appear inside
the product only, as monogram avatars drawn by the engine or, later, as designed role avatars (hand-off A-09); a
presenter, when a lesson wants one, belongs to a beat in another style. Never draw a person in code.

## 9. Objects, icons, data and UI

- The UI is the subject: every region a named element with targetable parts (section 17). Tables, forms, settings,
  cards, detail panes, lists, empty states, dialogs, menus, toasts and tooltips are built in.
- Developer content (2026-10-16): a **code editor** region (JetBrains Mono at 26 px, line numbers, syntax colour for
  yaml, json, js and ts, python and bash from the product's tokens, indentation kept to the column, a current-line wash,
  `+`, `-` and `~` diff markers, a line typed with a caret), a **terminal** (a dark window from the pack's shadow and
  ink, 24 px mono, a prompt, a command typed, output streaming in with status words in pos, accent4 and neg lifted toward
  surface), and a **chart** (line or bar series that move on cue, a dashed limit). Cards update (`A.card`, counting).
  The teaching layer never uses these colours: syntax and status are the product's palette, accent2 stays the signal.
- The real thing (SCREENCAST V2, 2026-10-16), two routes, and the lesson may use both: a **captured web page** (the
  `page` region, from `tools/page_capture.py`, with the requester's approval for each site) drawn live with its own
  fonts and hover, focus and pressed styles, and a **shell themed from screenshots** (`theme` and `layout`, proposed by
  `tools/screenshot_theme.py`) for desktop software. A lesson about a real product takes its look from the user's
  references, never from memory; its words still come from the lesson's sources.
- The planned `ui_*` hand-off items (T-110 to T-122) get a shell to sit in: a spreadsheet, a ticket or a CRM record is
  a region kind to add to this engine (or a kit part drawn into a region), not a free-floating card.
- `kit_screencast` (T-136) is no longer needed: its parts (the pointer, auto-zoom, the HUD, the spotlight, pills, the
  time-lapse tag) are this engine.
- Data in the product (numbers in cards and cells) comes from the lesson's sources like every other word.

## 10. Templates in this style

Templates still work in this pack (they read its tokens), but a software lesson rarely needs them: the shell is the
frame. Use a template for a beat that leaves the screen (a "three rules" card, a recap), and come back to the held
shell. Never put a template over the shell.

## 11. Recipes (code)

The three lab scenes are the recipes (each under 90 lines): `sc_tour` (a tour: names, the pointer arrives),
`sc_walkthrough` (a settings change with a dialog, typing, a shortcut, a toast, a spotlight freeze, a callout),
`sc_lesson` (tour, chapter card, an export walkthrough with a menu, a time-lapse and progress, then a tour of the result
on the next page). Six beat recipes in prose: `docs/styles/engines/screencast.md`.

## 12. Failure modes seen in real frames (Node preview, 2026-10-16)

| seen | fix (in the engine now) |
|---|---|
| tour labels drawn inside their region covered its words; later number badges covered card labels | labels go outside the region on a light wash over the rest; a shrunk name is a badge on the outline's corner |
| a veil drawn at 0.5 opacity showed fully opaque (its first tween's from-state was 1) | tween from the veil's own opacity |
| a menu framed with its anchor only: the zoom cut the menu off | `click({menu})` frames the anchor and the menu it opens |
| a toast appeared outside the zoomed frame | `sc_reaction_offscreen` (checked once all scenes are built, after the camera settles); the camera follows the reaction |
| the zoomed view put a bottom-right toast under the captions | the vertical clamp stops at 944 px (the caption band) |
| the I-beam sat on the characters being typed | the click into a field lands at 78 % of its width |
| a grey hover wash on an input read as "disabled" | fields and selects have no hover wash (focus ring only) |
| card values (52 px) overflowed a 48 px box; badges and key caps failed the inset check | boxes sized to the role |
| stress test (2026-10-16, Chrome): code faked as a table in Inter, indentation lost (kit.text splits on whitespace), no caret | the `code` region: mono, each run placed at its column, syntax colour, `A.codeType` with a caret |
| a terminal faked as a light table with a header row and hairlines | the `terminal` region and `chrome: "terminal"`: dark, mono, a prompt, `A.run`, `A.out` |
| no chart; cards could not change | the `chart` region with `A.series`; `A.card` (and `A.cell` on cards) with `count` |
| four overlays at once (three callouts, a toast, the step pill) with no warning | `sc_overlays_crowded`, once per crowded stretch, naming each overlay |
| the step badge (38 px for a 24 px figure) left 4.5 px above and below its font box: `tight_inset` | the badge is the pill's full height (8.5 px) |
| `sc_zoom_small_text` was skipped whenever a zoom gave `scale` | it runs on every zoom, judged on the target's own text size (`read` names it) |
| V2: a camera move started from rest at full acceleration and kinked where the framing met the window's edge (1840 to 1970 px/s change in one frame in sc_lesson and the stress scene) | a critically damped spring on the on-screen transform: 450 to 460 at most |
| V2: the zoomed editor ran off the right edge; the toast covered the chart's axis; a highlight hid the diff tint | a 1460 px editor window (1.3x fits); `toast({avoid})` and room under the content; a translucent highlight |

## 13. Polish checklist (yes or no, on the contact sheet)

1. Is every word on screen from the lesson's sources (no sample text, no invented feature)?
2. Does the shell read as a generic app, not a real product?
3. In the tour, is one region named at a time, with the label outside it?
4. In the walkthrough, is every word the learner must read at 32 px or more on screen?
5. Does every press land on a still frame, and is the reaction inside the frame?
6. Is the pointer never in a hurry (no `sc_pointer_fast`), and does it rest before each press?
7. Is the teaching layer all accent2, and is no product control accent2?
8. At most two overlays at once? Captions never covered?
9. Does each chapter end on its finished state, held?
10. Is the spotlight used at most once a chapter, on a result?
11. No blur, no parallax, no whip pans?
12. Are the engine's warnings (`sc_*`) in the report all explained or fixed?

## 14. Gaps

- Not yet rendered in Chrome, in a lesson, or encoded to MP4: the strips are the Node preview (text widths estimated,
  no blur or WebGL; the caret lags real glyph widths there).
- No drag (drag and drop, a slider, resizing) and no right-click context menu yet.
- No mobile shell (a phone frame with a bottom bar): T-110 should become `chrome: "phone"`.
- No spreadsheet, ticket, CRM record, video-call or checkout region kinds yet (T-117, T-120, T-121, T-119, T-122).
- The code editor has no folding, no autocomplete popup and no inserted line that pushes the lines below (type into an
  empty line). The tokenizer carries a block comment, a template literal, a triple-quoted string, a YAML block scalar
  and a heredoc from line to line, but a typed line does not re-colour the lines after it.
- A captured page: no native `<select>` list or date picker in a frame (use `menu:` and `A.webSet`), no page scripts
  after the capture (a page that changes itself must be captured in each state), no animations or transitions (they run
  on the wall clock), cross-origin stylesheets kept as raw text (their :hover rules still become classes). A lesson's
  runtime does not yet load a project's `assets/pages/*.page.js` (compose has to add them after the engine); the lab
  bundles them into the scene file.
- A theme keeps the pack's type face (Inter): a product's own font is not taken from a screenshot. The terminal has no colour escape codes (status words and `tone` instead) and no progress
  bars drawn in characters. Charts have no axes titles, no stacked bars and no tooltip.
- `sc_lesson`'s toast zoom (`scale: 1.35`) now warns `sc_zoom_small_text` (30 px): a larger scale slices the KPI cards
  there; left for whoever owns that lab scene to decide.
- `W.resume` across beats is written but not run in a composed lesson (the lab is one beat).
- Dark product themes: the pack is light only.

## 15. Engine and asset requests

- A-09 role avatars (for people in tables, comments and video tiles).
- Region kinds: `sheet` (T-117), `ticket` (T-120), `record` (T-121), `call` (T-119), `checkout` (T-122), and
  `chrome: "phone"` (T-110), each with its parts and states in this engine.
- `A.drag(from, to)` with a ghost and a drop target.

## 16. Verified on 2026-10-16

- `lint_style(packs/styles/screencast.json)`: `[]`; captions active 9.71:1 and fg 13.79:1 on the pill.
- `loom.engines.lint(runtime/engines/screencast.js)`: `[]`.
- Node preview strips looked at, three rounds or more each: `docs/styles/demos/lab/sc_tour__screencast__PREVIEW.jpg`,
  `sc_walkthrough__screencast__PREVIEW.jpg`, `sc_lesson__screencast__PREVIEW.jpg`; the three scenes build with no
  runtime errors and no engine warnings.
- `python3 tests/run_tests.py --only screencast` (section 16 of the report lists each test and its control).
- Not verified: Chrome, a composed lesson, captions over the shell, an MP4, the film checks on a lesson in this style.
- 2026-10-16, V2: a captured stand-in site walked through in Chrome (`out_screencast_web/frames/`), a stand-in desktop
  app rebuilt from its screenshot (`screencast_rebuild/compare.jpg`), the stress scene re-rendered (`out_screencast_v2/`),
  smoothness measured on every lab scene; 16 tests in `tests/suites/screencast_engine.py`.
- 2026-10-16, after the stress test: the code editor, terminal and chart rendered in Chrome
  (`docs/research/2026-10-16-style-stress/out_screencast_after/frames/`, looked at full size); `sc_tour`,
  `sc_walkthrough` and `sc_lesson` re-rendered in Chrome with 0 problems; `py tests/run_tests.py --only screencast`
  (11 tests, each with a control). Not verified: the new regions in a composed lesson, an MP4.

## 17. The engine and the two registers (2026-10-16)

`ctx.engine` builds the shell (`W.app`) and gives one handle with the learner's actions, the product's reactions, the
camera and the teaching layer (calls in `docs/styles/engines/screencast.md`).
- **Tour** (calm, scale 1): the whole screen, regions named one a sentence, the pointer absent or at rest. For
  orientation, the "why", and where a result lives.
- **Walkthrough** (zoomed, step-precise): a step pill, the pointer to the control, the camera framing it as the pointer
  arrives, the press on a still frame, the reaction (followed by the camera if it happens elsewhere), back out.
- A lesson alternates them on one held shell: tour, walkthrough, walkthrough, tour of the result, and so on.

## 18. Camera grammar

- Scale 1 is home (the whole window). Zoom 1.25 to 2.4, framing a control with its neighbourhood (its row, its label;
  at least 560 x 300 px of context).
- In with the pointer (both arrive together), hold for the action, then follow the reaction or come out. One move at a
  time; no pans while holding; no camera move across an action.
- Never below 1, never the window's edge once zoomed, never into the caption band.
- A cut only between chapters (under a chapter card); within a chapter, one continuous take.

## 19. Sound palette

Low and passive: a soft click on each press, every third key while typing, a quiet success or error on a toast, one key
sound for a shortcut. Music `calm_focus` under the voice. No whooshes on camera moves. Keep sounds off word onsets.

## 20. Native moves (with what they fit in corporate lessons)

| move | the call | fits content like |
|---|---|---|
| region names | `A.name`, `A.clearNames` | a first look at a new tool; where things live |
| framed click | `A.click(id, {zoom: true})` | settings, small controls, menu items |
| typing with a caret | `A.type` | forms, search, a recovery phone, a filter |
| keystroke HUD | `A.keys` | shortcuts the docs give |
| spotlight freeze | `A.spotlight` | the one promise: "Saved", "On for every sign-in", "Shared with view only" |
| callout with a leader | `A.callout` | a detail the voice names that the eye might miss |
| time-lapse tag | `A.timelapse` + `A.progress` | exports, uploads, syncs, approvals that take minutes |
| validation | `A.error`, `A.clearError` | data quality, required fields, formats |
| rack focus | `A.focus` | two panes, one matters (a preview beside its settings) |
| chapter card | `A.chapterCard` | between subtasks |

## 21. Variation space for lessons

- **Structures:** tour then walkthroughs then a tour of the result; a mistake-and-fix (the error shown, then the right
  way); before and after (the setting off, its consequence, then on); a scenario thread (one colleague's task across
  chapters, the same example data throughout, as Plaisant and Shneiderman advise).
- **Openings:** the finished result first in a spotlight, then "here is how"; the empty state ("No reports yet") and the
  first click; a tour of the screen.
- **Endings:** a tour of where the result lives; the chapter pills all ticked; a spotlight on the promise.
