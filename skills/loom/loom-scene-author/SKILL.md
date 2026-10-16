---
name: loom-scene-author
description: Write or fix a Loom bespoke motion scene (JavaScript, Loom scene API) or a Loom Manim scene (loom_manim.LoomScene) from a storyboard design spec - choreographed to narration cues, deterministic, style-token driven, and proven by snapshots. Use for every `tasks/scenes/{beat}.md` task, when a storyboard scene has kind bespoke or manim, and when asked to make a Loom scene "more animated", "smoother" or "more like a video".
---

# Loom scene author

Read, in order: `docs/SCENE_API.md` (the contract), `skills/lnd/lnd-motion-choreography-loop/SKILL.md`
(the method), `skills/lnd/lnd-motion-fit/SKILL.md` (what each form needs and in what order),
two examples in `scenes_examples/`, and the style pack named in the storyboard. When the lesson's style has a guide
(`docs/styles/guides/<style>.md`; today corporate-clean, story-cartoon, glow-flat, cinematic-noir, whiteboard),
read it before drawing: it is the contract for how a frame in that style looks (token roles, shape, light,
composition, motion, people, per-template notes, recipes, polish checklist), and its example scenes
`scenes_examples/style_<style>_*.js` are the first examples to read. Where the guide and a general rule differ,
the guide wins for that style.

## Method
1. From the storyboard's `design` (treatment, why_motion, elements, beat_sheet), sketch THREE treatments
   in a comment block and say which wins and why (the animation gate: motion only where the taught
   thing changes over time; everything else reveals and holds).
2. Map every beat-sheet row to `ctx.cue("<words the narration actually says>")`. Use the task file's
   narration and phrase timings; anchors that are not spoken fail compose.
3. Build scaffold -> reference -> cause -> whole -> peers (lnd-motion-fit s9). A connector DRAWS INTO what
   follows; a value travels from its minimum; the reading is marked when it stops; totals last.
4. Semantic element names via `ctx.el(name, ...)`; draw in local coords into `E.inner`.
5. Tokens only for colour; `ctx.style.dur(...)` or motion defaults for timing; `Loom.rng("seed")` for any
   scatter. No Math.random, Date, timers, rAF, network, repeat:-1.
6. Nothing arrives after ~85% of the beat's speech; one emphasis per scene; <= 5-6 chunks on screen.
   The saturated accent goes on the element the scene's `accent_on` names, and only there (often under 2 %
   of the frame); the rest stays in field, ink and muted tokens. More than two saturated hue families in a
   settled frame warns (D-112).
7. Draw from the storyboard's `devices` (D-112). A held layout changes state (swap, recolour, relabel on the cue
   word) instead of being rebuilt. Lists and numbers are objects: items arrive on their words (about 0.4 to 0.5 s
   per entrance, about 1.5 s per spoken list item), unit grids, a counter on a pile; never an icon grid or a bare
   number card. Text lives on the object (`T.label`, `T.badge`, a tag), never a box on a gradient. Texture
   belongs to the drawing, never a full-frame noise overlay.
8. Reuse library components (`ctx.use`, catalog Components section) before drawing an element yourself;
   adapt with params, slots, returned parts or a local `Loom.component.variant`. Tag each small element
   you DO build with `// @form snake_id: idea without lesson nouns`, reusing ids from `library/FORMS.md`
   (see `docs/COMPONENTS.md`). Never tag what you only hold from the previous scene.
9. Tag the whole beat once, on line 1: `// @design snake_id: the visual argument` (`<id>_continued` if the
   scene only extends the held picture). Recurring designs become templates.

## Expressive motion and "show it in use" (docs/SCENE_API.md, Expressive section)
Reach for these before hand-rolling motion. Each one is deterministic, token-driven and writes its own sound
event:
- **Arrivals:** `m.spring(E, t, {preset})`. Presets are gentle, snappy and lively; the style clamps the
  bounce.
- **Groups:** `m.group(Es, t, {enter, order, parent, sfx})` and `m.groupExit(Es, t)`, which leaves in
  reverse.
- **Gestures:** `m.shake` (wrong), `m.nudge` (look here), `m.press` (tapped) and `m.glow` (payoff). Use one
  per element per scene.
- **Software and process lessons:** show it in use.
  - Draw the interface with `ui.window`, `ui.field`, `ui.button` and `ui.toast`.
  - Drive it with `ui.cursor`, `m.cursorIn`, `m.cursorTo`, `m.tap`, `m.typeInto` and `m.toastIn`, all at
    `ctx.cue(...)` times.
  - Draw the cursor LAST so it sits on top.
  - Cursor coordinates are station coordinates.
- **Sound:** `Loom.sfx(kind, t)` places an extra sound (click, key, card, land, reveal, success, error). It
  is mixed in the music's key.
- **Readability:** a line you reveal must stay settled for its reading floor (0.8 s for a label, 0.3 s per
  word for a sentence). A replaced element leaves BEFORE its replacement arrives (no double exposure), unless
  the storyboard declares `join_in.overlap: "ghost"` or `intent: "ghost"`.
- **Beyond SVG** (`docs/VISUALS_PLUS.md`):
  - `ctx.lottie(name, id, {at, colors: "auto"})` places a designer-made animation, re-coloured to tokens.
  - `ctx.fxMoment("light"|"spotlight", t0, t1, rect)` adds a shader moment. Use one per scene at most, on the
    payoff.
  - A `kind: "skia"` scene is a Python `frame(c, t)` using `loom_skia` (`C.<token>`, `ctx.cue`, `shader()`,
    `backdrop_blur()`).
  - A `kind: "three"` scene is a JS module `build(ctx, THREE, X)` returning `{scene, camera, update(t)}`, with
    `ctx.c(token)` for colours.
  - A `kind: "page"` scene (D-176) is a JS module `build(ctx, P)` returning `{render(t)}`, drawing into `P.root` with
    Canvas 2D, SVG, DOM or the approved libraries the beat names in `page.libs` (maps, charts, diagrams, formulas,
    code, a terminal, stroke lettering, morphs): `docs/PAGE_CLIPS.md` has the kit (`P.world`, `P.plot`, `P.layout`,
    `P.tex`, `P.code`, `P.terminal`, `P.strokeText`, `P.glyphs`, `P.morph`).
  - All three render to clips. Prove them with `py -m loom lab skia:<name>`, `three:<name>` or `page:<name>`.
- **Timing grid (D-173).** `ctx.hit(id)`, `ctx.bar(t, dir)` and `ctx.onBeat(t, sub)` give the lesson's shared clock:
  land a motion on a music beat or a section's downbeat when it should feel on the rhythm; cues stay the first choice.
- **Unsure how a technique looks?** Copy a lab scene from `scenes_examples/lab/` and run
  `py -m loom lab <id> --style <style>` to get its filmstrip.

## Characters, depth and isometric (docs/SCENE_API.md, "Characters, depth and isometric")
- **A person does the thing:** `ctx.character(name, "ava"|"sam", {x, y (feet), scale, skin, top})`, then key
  `pose` on the key phrase, `gesture` on the verb, `look` toward what matters, `talk()` only on their own
  lines. Stand them on something (a floor line, a ridge); never float them.
- **Mood and place:** `ctx.depth(...)` with 3 to 5 layers (sky, far, mid focus plane, near), one light
  source, haze between far and mid. Titles stay outside the stage.
- **A system as a model:** `ctx.iso(...)` boxes on a board, `iso.done()` last, boxes `m.grow`, flows drawn,
  labels last. Prefer 3 to 6 boxes; label the ones the narration names.
- Prove with `py -m loom lab lab_characters|lab_depth|lab_iso --style <the lesson's style>`.

**Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard,
cinematic-noir, cinematic-dawn)** (D-112):
- People are small in a composed place, faceless or minimal, emotion in posture; profile, three-quarter and back
  views; hands as presenters; silhouette crowds. Big faces only with designed rigs. Code never draws figurative
  content from imagination (D-102 freeze, D-122): every living character comes from a designed kit by id,
  briefed and reviewed with `skills/lnd/lnd-character-design`; a missing one is an asset request, never a drawing.
- Springy pops (`m.spring` lively) on cartoon people and small accents; editorial and technical packs keep no
  overshoot.
- Mixed media shares one framing system (border, palette, label style, grain).

## Look first (docs/REFERENCE_FIRST.md, D-87)
- Before drawing a scene, a place, an object or a new builder, look at existing drawn work:
  - web search pages for "<subject> flat / isometric / line art / cartoon illustration";
  - the studied reference channels in `docs/research/`;
  - the open-source sets in `docs/references/SOURCES.md`.
- Use the beat's board if the storyboard names one (`design.references`); otherwise write one with
  `py tools/ref_board.py new <area>/<topic>`.
- Put the rules you took at the top of the scene file.
- Take ideas, never drawings. Compare your strip with the references before you call it done.

## Essentials in the lesson's own form (docs/SCENE_API.md, "Treatments"; D-80, D-81)
- Draw every label, speech or thought bubble, panel, icon standing for an object, and tick or cross with
  `Loom.treat` (`T.label`, `T.bubble`, `T.panel`, `T.badge`, `T.mark`). They draw in the lesson's design seed.
- A hand-made bubble or pill ignores the seed, and the variety ledger counts it as the repeated classic look.
- Keep every essential the beat needs; the seed changes its form, never whether it is there.
- `ctx.character()` returns a handle: its element is `.E` (L-144).
- **The layout guard (D-169), when a lesson has it on:** the engine moves labels, tags, stamps and badges clear of
  words, of each other and of the frame edge, and pulls a text or card that crosses the frame edge back inside. It
  only moves an element to a spot that is fully clear, and its snapshot says what it moved
  (`layout_guard.moved`): keep your x and y as you wrote them. Objects never move, and objects touching or
  overlapping is never a fault (a mug on its table). Say when an overlap is meant: `ctx.el(name, {overlaps:
  ["table"]})` or `T.label(ctx, name, {..., overlaps: ["mug"]})`; a label you put mostly ON an object stays on it.
  `{layout: "fixed"}` keeps an element exactly where you put it.
- **A thing the narration names** (a document, an envelope, a calendar, a clock, a phone, a laptop, a folder, a
  package, a building, a heart, a bulb, a lock) is a drawn object: `Loom.obj.draw(ctx, name, kind, {x, y, size,
  state, t})`. A stock icon at hero size is one of the AI tells.
- **A motion beat happens in a place:** `Loom.place.office|inside|server|meeting|warehouse(ctx, name, o)`. Explore
  it with `Loom.cam.push` or `Loom.cam.pan` (parallax), unless it holds a layout or rests; one long eased move
  may carry a 10 to 20 s explanation. The lint names still beats and wallpaper beats. (D-112: was unconditional;
  most studied shots are a still camera on a moving drawing.)

## Real things, real scale, the film (docs/SCENE_API.md, "Real artefacts"; D-100)
- If the beat is ABOUT a message, an inbox, a chat or a page, draw it with `Loom.ui.mail`, `inbox`, `chat` or `doc`,
  with every word real. Mark the words with `ui.mark` and carry them with `ui.wire` (`hold` it). Never draw grey
  bars where the learner is meant to read.
- Draw props from the shot's viewpoint and at the size people need. A screen faces its user (laptop `facing`). Wall
  items take `shadow: "wall"`. Mark a hand-drawn object with `real:`, and a close-up with `hero: true`.
- To move in on one element (a page, a board, a desk), use `Loom.cam.frame` and chain it across held beats. Frame
  between lines of text. Declare a deliberate crop with `data-bleed="t0-t1"`. Give drives on one property one `key`.
- Before you call a scene done, look at its strip (`py -m loom strips <id> --beats <ids>`). For timing, watch the
  preview (`--preview`). The film checks fail on empty or repeated frames, type under 18 px, words cut by the edge,
  and reveals under an overlay, except where the storyboard's `intent` declares it, as the D-112 gate lands
  (`rest`, `process_hold`, `punctuation`, `callback`; `diegetic_text` makes tiny signage a warning, never a
  narrated term). A rest scene finishes building, then holds; never add fidget motion to pass a check.

## Primitives from the TED-Ed study (D-114): use them, never hand-roll them
Table and rules: `docs/SCENE_API.md`, "Primitives from the TED-Ed study"; full APIs in `docs/primitives/`.
- **One shape becomes another:** `Loom.morph.to` / `.chain`; a shape that becomes the next field: `Loom.morph.fill`.
- **Hold the layout, change its state:** `Loom.slot(...)` with `show(content, cueTime, {how})` on the cue words. Never
  rebuild a station to change one value.
- **A detail or an inside:** `Loom.magnify` (lens and leader line) or `Loom.magnify.cutaway`.
- **Numbers as objects:** `Loom.data.stamp` (a share), `.pile` (a counter riding a pile), `.flood` (a glyph flood),
  with the existing `counter` and `unitGrid`.
- **Hand-made time** (illustrated packs): `Loom.stepped.on(E, {hz: 6})` for drawings that hold and jump;
  `Loom.stepped.boil` for a living outline. Not on corporate or technical packs unless the storyboard asks.
- **Material joins** are chosen in the storyboard (`join_in.type`: torn, page, scroll, motif, handoff, fill); a scene
  only leaves its frame ready for them.

## Joins: the first second of your beat (D-190)
Kshitij on the 2026-10-16 test films: the old beat flashed back at new beats and old elements flickered in; "the
transitions are the worst thing". The engine now handles the causes below, and the check measures every join on frames
(`join_flashback`, `join_blank`, `join_pop`, sent to the beat the join opens). Write so they never fire:
- **Hold only what you keep.** `ctx.held(name)` (or the storyboard's `keep`) is for an element that stays and changes. To
  get rid of the old beat's things, do nothing: the join retires them. Holding one only to `m.exit` it at your first
  words takes it out of the join (the engine now releases it, and warns nothing; a hold you exit later is yours).
- **Never redraw what is on screen.** If the old beat drew it and you need it, hold it and change it (its handle, a slot,
  a new child revealed on your time). A copy drawn again on the same spot is swapped in under the old one by the
  engine, but a copy that rebuilds from nothing still reads as the old beat replaying.
- **Arrive at the join.** Your first element should start arriving within about 0.2 s of the beat's start. A cut waits
  up to 1.2 s for it with the old picture held; a canvas join empties the board only as yours arrives; anything later
  is an empty frame while the voice speaks (`join_blank`).
- **Open on the state the last beat left.** No instant resets on your first frame: a cleared field, a toggle back, a
  page switch, a camera jump. Show the change as an action after your first words (in a screencast the engine refuses a
  cleared value on the cut: `sc_reset_at_join`).
- **A camera framing at your start is a cut:** `dur: 0` (isometric `B.camera`) frames on the beat's first frame.
- **Hands and footage:** `Loom.hands` shows only the PLACEHOLDER set until designed art is imported (the check
  warns), so do not use it in a lesson that ships; `Loom.footage` needs a consented clip declared in the storyboard.

## Libraries behind wrappers, and the lesson kit (docs/SCENE_API.md, 2026-10-08)
- **`Loom.physics`** (Matter.js, baked once): things that fall, pile, collide or topple, where that motion is the
  meaning. Give the world walls and enough `seconds`; read the `physics_not_settled` / `physics_lost` warnings.
- **`Loom.brush`** (p5.brush, painted once): pencil, marker, charcoal, watercolour and hatching, revealed layer by
  layer in drawing order. For paper and hand-drawn styles; words stay `kit.text` on top.
- **`Loom.orb`** (thinking-orbs): an AI assistant working, searching or composing; only where an AI tool is on screen.
- **The lesson kit:** if the storyboard declares `kit.parts`, `scenes/_kit.js` already holds them: compose
  `Loom.lesson.<id>(ctx, E.inner, opts)` inside your element and animate the handle; never redraw a kit part. In
  Cowork, write the kit first when two or more beats show the same made thing.

## The toolbox and 3D models (docs/TOOLBOX.md; D-137, D-138)
- When the storyboard names `tools` for a beat, read those sections of `docs/TOOLBOX.md` first; each says when the
  tool earns the beat, the call, its rules and an example.
- A `kind: "three"` clip starts from the model library: `await X.model("padlock", opts)` and drive it by its keys
  from spoken words (`m.set("open", X.kit.progress(t, ctx.cue("unlocks"), 0.9))`). `py -m loom models` lists them;
  their sheets are in `docs/assets/models3d/`. A new object a second lesson needs is promoted into
  `assets/models3d/` with its `@model` card, `py -m loom models check` and a sheet.
- Model packs (devices, security, workplace, data centre, AI and ML, devs) and their sets, moods for the stage
  (`X.kit.stage({mood})`), and ready recipes on physics, brush and orb (`Loom.physics.sieve`, `Loom.brush.redFlags`,
  `Loom.orb.toolLoop` and more): docs/TOOLBOX.md. A device beat that names `"preset": "device_shot"` has no file.

## Manim scenes
`from loom_manim import *`, `class Main(LoomScene)`, colours `C.accent` etc., `self.wait_until("spoken
words")` with LITERAL strings (or a module-level `CUES = [...]`), `self.text(s, role, color)` for type
that matches the canvas fonts, finish with `self.hold_to_end()`. Shapes that are illustrative carry no
numbers unless the knowledge sheet has them.
**Every colour comes from `C.<token>`**: no `WHITE`, `BLUE_E`, `"#hex"`, `color="red"` or `ManimColor("..")`.
The scenes gate refuses them, because a fixed colour ignores the style and the brand (see
`docs/MANIM.md`). If a literal colour IS the lesson, mark the line `# loom: literal-colour <reason>`.
Read the look only through `C` and `ctx.fonts`; reaching into `ctx.raw` makes the clip redraw on any
change.

## Prove
`py -m loom accept <id> scenes` -> `py -m loom run <id> compose` -> `py -m loom snapshot <id> --at
t1,t2,t3` at arrival, development and settled. Look at the image. Report what you checked and what is
still unverified.
