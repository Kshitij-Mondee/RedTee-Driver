# Style guides: the precise visual grammar of each style pack

STATUS: PARTIAL (started 2026-10-07). One guide per pack, `docs/styles/guides/<pack id>.md`. The pack JSON
(`packs/styles/<id>.json`) holds the tokens the runtime reads; the guide holds everything a storyboard writer or a
scene author must know to make a frame in that style look finished: what each token is FOR, the shape and light
recipe, composition, motion, characters, and the failure modes already seen in real frames.

**Every style has its own purpose and is never ranked against another (D-122).** A guide compares versions WITHIN
its own style only. "Better" in a guide means closer to that style's own references and purpose.

## Who reads a guide
- The storyboard stage (Cowork task file and the API storyboard agent) for the lesson's style.
- Every scene author (Cowork or API) before drawing a bespoke scene in that style.
- Anyone changing the pack JSON: a token change must keep the guide true. (Planned, not built yet: context_check
  compares each guide's palette table with its pack; workstream 6 of docs/strategy/2026-10-07-fix-prompt.md.)

## Guides that exist (2026-10-07, two review rounds each; nothing yet judged on a Chrome render or MP4)
| style | guide | example scenes |
|---|---|---|
| corporate-clean | `corporate-clean.md` | `scenes_examples/style_corporate_clean_request_route.js`, `..._wall_chart.js` |
| story-cartoon | `story-cartoon.md` | `scenes_examples/style_story_cartoon_two_shot.js`, `..._rig_mid_shot.js` |
| glow-flat | `glow-flat.md` | `scenes_examples/style_glow_flat_handover.js`, `..._focus_day.js` |
| cinematic-noir | `cinematic-noir.md` | `scenes_examples/style_cinematic_noir_after_hours.js`, `..._evidence.js` |
| whiteboard | `whiteboard.md` | `scenes_examples/style_whiteboard_handover.js`, `..._meeting_cost.js` |
| blueprint (2026-10-15, D-178; lab strips only, no lesson yet) | `blueprint.md` | `scenes_examples/style_blueprint_request_path.js`, `..._detail_callout.js` |
| blueprint engine (2026-10-16, D-183; Node preview only) | `blueprint.md` s17 to 21 | `scenes_examples/lab/bp_engine_detail.js`, `bp_engine_teach.js` |
| isometric (2026-10-16, D-185; Node preview only) | `isometric.md` | `scenes_examples/lab/iso_teach.js`, `iso_diorama.js`, `iso_lesson.js` |
| hologram (2026-10-16, D-185; Node preview only) | `hologram.md` | `scenes_examples/lab/holo_briefing.js`, `holo_analysis.js`, `holo_lesson.js` |
| screencast (2026-10-16, D-185; Node preview only) | `screencast.md` | `scenes_examples/lab/sc_tour.js`, `sc_walkthrough.js`, `sc_lesson.js` |

Skills that point here: `skills/loom/loom-scene-author`, `loom-style-pack`, `loom-director` (2026-10-08).

Section 15 of each guide lists the engine and asset requests it depends on, with the fallback rule until each
lands. The shared ones use one set of names across guides: pack `materials`, pack `roles`, `fx.spotlight`,
`fx.vignette_under`, `characters.bottom`, and the runtime fixes "M.travel drive key", "m.draw stroke-first",
"font weight clamp", "loom lab --file".

## The sections every guide has (in this order)
1. **Purpose and register:** what this style is for, the feeling, the audiences and lesson kinds it fits, what it
   must never be used for. One paragraph, then 3 to 5 reference works (title, link, WHAT to take, what NOT to
   take). Study references, never copy or republish them.
2. **Palette roles:** a table of every token: hex, role, where it may appear, where it must never appear, and the
   area share it should hold in a typical frame (for example field 60 %, surfaces 25 %, ink 10 %, accent under 5 %).
   Contrast pairs that are allowed for text (with measured ratios) and pairs that are forbidden.
3. **Type:** which family for which role, sizes from the pack's ranges, weight, case, tracking, line length, how
   numbers are set, what never happens (for example no all-caps body, no italic in this style).
4. **Shape language:** radius, stroke weight and when strokes exist at all, corner and join style, how a card,
   a label, a badge, an arrow, a connector and a divider are drawn in this style.
5. **Light, shading, depth and texture:** the shading recipe (flat, gloss, hachure, rim light ...), shadow rules,
   gradients allowed or not, grain and texture, glow, depth layers, how the background field behaves.
6. **Composition:** grid and safe areas, caption band, density (how full a frame is in this style), focal point
   rules, scale of people and objects, how much empty space is right, where text sits relative to pictures.
7. **Motion:** the motion personality (the pack's durations and overshoot), entrance and exit vocabulary that fits
   (and what never fits), ambient life, camera habits, joins that suit the style.
8. **People and living characters:** how characters look in this style (with `skills/lnd/lnd-character-design` and
   `docs/assets/CHARACTER_PROMPTS.md` style block), scale and framing, what the code may draw (kit rigs by id) and
   what it may never improvise.
9. **Objects, icons, data and UI:** icon family and stroke, object drawing (Loom.obj recipe in this style), how a
   chart, a number, a table, a mail or chat screen look here.
10. **Templates in this style:** for each common template (title.card, definition, compare.two, document.page,
    list.steps, process.flow, timeline, quiz.question, recap, avatar), what to set or avoid so it looks native.
11. **Recipes (code):** 3 to 6 short scene-code snippets using ONLY real Loom APIs (each API name checked against
    `docs/SCENE_API.md` and the runtime), for the moves this style relies on.
12. **Failure modes seen in real frames:** each with the frame or lesson where it was seen, why it happens, and the
    rule or check that prevents it.
13. **Polish checklist:** 10 to 20 yes/no checks a reviewer runs on a contact sheet before a lesson in this style is
    called finished.
14. **Gaps:** what the style needs that the engine or the assets do not have yet (asset requests, engine requests),
    each sized S, M or L. Not for the guide to fake.

## Rules for writing a guide
- Every API, token and file named must exist (checked by grep or by running). Mark anything unverified.
- No em or en dashes. Plain words. Measured numbers carry the command that measured them.
- A rule earns its place by preventing a failure that was seen, or by encoding what the references do. No filler.
