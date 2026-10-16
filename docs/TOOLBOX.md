# The toolbox: five tools beyond plain SVG, and when each one earns a beat

STATUS: SHIPPED 2026-10-08 (D-137 for the loader, D-138 for the 3D model library). The single source both pipelines
read. The **Menu** is in front of every storyboard, scene, clip and kit agent; a tool's own section is loaded on
demand: `use_tool(["three"])` on the API path, or read the section here in Cowork. A storyboard that picks a tool for
a beat names it in that scene's `tools` list, so the beat's worker is handed the section without asking.

Why this page exists: across 23 lessons and bench runs, Three.js and Skia were picked 0 times (once each, in the demo
built to show them). They were findable; nothing said when they beat SVG. This page says that, and says when not to.

## Menu

| tool | how a beat uses it | pick it when the picture must show | not when | cost |
|---|---|---|---|---|
| `physics` | bespoke scene: `Loom.physics.world(...)`, or a ready recipe (`sieve`, `sortIntoBins`, `contextWindow`, `inboxFlood`, `trainTestSplit`, `nextTokenDraw`, `biasedFunnel`, `priorityJar`, `redundancyTopple`, `puePour`) | things that fall, pile up, collide, topple, roll or sort into bins, where that motion IS the point (a backlog piling into a queue, one more task toppling a stack) | as decoration; anything a single tween says; more than about 30 bodies; people | cheap: simulated once at build, replayed |
| `brush` | bespoke scene: `Loom.brush.paint(...)`, or a recipe (`redFlags`, `markup`, `sketchSystem`, `wash`) | hand-made marks: a process sketched as it is said, an idea annotated, a watercolour wash under a key word; whiteboard, paper and hand-drawn looks | crisp UI, charts or data; any words (labels stay SVG text); glossy dark looks | medium once at load, free per frame |
| `orb` | bespoke scene: `Loom.orb(...)`, or a recipe (`toolLoop`, `retrieval`, `unsure`, `approval`) | an AI assistant at work (listening, searching, composing) in an AI-literacy lesson | any meaning other than an AI working; decoration | cheap |
| `three` | `kind: "three"` clip: a ready preset (`device_shot`: a swappable phone, tablet, laptop, monitor or desk with its screen; `model_shot`: any one library model or set, its keys on spoken words) or a file using the model packs (devices, security, workplace, data centre, AI and ML, devs) and moods | a real object in 3D that turns, opens or changes state: a phone showing a code, a laptop opening on a sign-in page, a padlock unlocking, a server rack going to alert, a desk left with its screen unlocked, coins stacking up | flat diagrams, text or tables; people; anything SVG shows as well | medium: an offline clip, stored and reused |
| `skia` | `kind: "skia"` clip | a hero moment of light: a glow, frosted glass, a key phrase arriving blur to sharp, real motion blur; an opener, a divider or a payoff | more than one or two per lesson; teaching content that must stay crisp | heavy: seconds per frame offline |

How to choose, in one breath: start from what the beat must make the viewer understand. If the plain picture already
says it, use the plain picture. A tool earns the beat when the thing it does (falling, being hand-made, thinking,
being an object, being light) is the idea itself. One tool per beat; a lesson rarely needs more than three of these
beats. Physics, brush and orb live inside a bespoke scene; Three.js and Skia are their own beat kinds (clips placed
in the world by `rect`).

## physics

**Pick it** for a pile, a queue that overflows, a stack that topples, items that drop into the right or wrong bin,
a domino chain of consequences. **Not** for ambient motion or anything with fewer than three bodies.

```js
const w = Loom.physics.world(ctx, "backlog", { x: 560, y: 180, w: 800, h: 640, t: ctx.cue("the requests keep coming"),
  seconds: 5, gravity: 1, seed: 7 });
w.static({ shape: "rect", x: 400, y: 630, w: 800, h: 20 });                    // the floor (world-local coords, centres)
for (let i = 0; i < 12; i++) w.body("req" + i, { shape: "rect", x: 300 + (i % 4) * 60, y: -60 - i * 70, w: 120, h: 44,
  at: i * 0.18, chamfer: 10, draw: (g, W, H) => kit.rect(g, 0, 0, W, H, { fill: "surface", stroke: "line", r: 12 }) });
w.run();
```

- Simulated once (fixed 1/60 s steps, its own seed), replayed from a table: any seek gives the same frame.
- The last quarter of `seconds` brings every body to rest (`rest: false` opts out); the runtime warns
  `physics_not_settled` and `physics_lost` by name.
- Keep labels as SVG text on top of the bodies, never inside a body's drawing if they must be read.
- **Example:** `scenes_examples/lab/lab_physics.js`. **Look at:** does the pile read at the end frame, and does
  nothing leave the frame.
- **Recipes** (`runtime/recipes_physics.js`): ready teaching moments whose words, counts and shares are all inputs.
  The outcome the lesson states is built in and then checked on the baked poses (a mismatch warns
  `physics_recipe_outcome` by name): `sieve` (layered defences, each stops the given count: spam filters, guardrails,
  defence in depth), `sortIntoBins` (each item lands in its named bin: evals, never-paste data, spam), `contextWindow`
  (a fixed window, oldest out or refused), `inboxFlood` (reply-all doubles and spills), `trainTestSplit` (shares into
  three bins, the test set locked), `nextTokenDraw` (bin widths are the probabilities; the ball lands on the chosen
  token), `biasedFunnel` (a skewed sample in, a skewed answer out), `priorityJar` (big rocks first or they do not fit),
  `redundancyTopple` (one support falls, two hold), `puePour` (energy beads into IT and overhead bins). Signature
  `Loom.physics.<name>(ctx, name, opts)`; each returns `{ok, expected, got}`; lab scenes
  `scenes_examples/lab/recipe_phys_*.js`. The baked table is readable with `w.posesAt(p)`.

## brush

**Pick it** in whiteboard, editorial-paper, hand-drawn and story looks, when a sketch drawn as it is spoken is the
explanation: three boxes and two arrows of a process, a circled word, a wash behind the one idea that matters.
**Not** for anything that must be exact (data, UI) and never for words.

```js
Loom.brush.paint(ctx, "steps", { x: 160, y: 200, w: 1600, h: 600, seed: 3, layers: [
  { at: ctx.cue("ask first"), reveal: "wipe", dir: "right", dur: 0.9,
    draw: (b, W, H) => { b.set("2B", ctx.c("ink"), 1.2); b.noFill(); b.rect(40, 60, 420, 220); } },
  { at: ctx.cue("then check the facts"), reveal: "fade", dur: 0.6,
    draw: (b, W, H) => { b.fill(ctx.c("accent2"), 120); b.fillBleed(0.12); b.noStroke(); b.rect(560, 60, 420, 220); } },
]});
```

- `b` is the p5.brush API in the layer's own pixels: `set(brush, colour, weight)`, `line`, `rect`, `circle`,
  `polygon`, `fill`, `fillBleed`, `noFill`, `hatch`, `noHatch`, `noStroke`. Colours only through `ctx.c("token")`.
- Painted once into an image, then revealed by wipe or fade; `blend: "multiply"` on light paper (default),
  `"screen"` on a dark field.
- **Example:** `scenes_examples/lab/lab_brush.js`. **Look at:** marks finished and readable at the hold; no dark
  blobs (a scale applied twice, L-282).
- **Recipes** (`runtime/recipes_brush.js`; marks only, every word stays the scene's SVG text; rects in scene
  coordinates, e.g. from `Loom.ui.at` on a real `Loom.ui.mail`): `Loom.brush.redFlags(ctx, name, {flags: [{rect, at,
  kind}], wash: {rect, at}})` (rings round the red flags in spoken order, a wash under the stressed one),
  `Loom.brush.markup(ctx, name, {marks: [{rect, kind: circle|underline|strike|bracket|tick, at}]})` (a reviewer's
  marks), `Loom.brush.sketchSystem(ctx, name, {boxes: [{rect, at}], arrows: [{from, to, at}]})` (a system sketched as
  it is named), `Loom.brush.wash(ctx, name, {rect, at, colour})`. Lab scenes `scenes_examples/lab/recipe_brush_*.js`.

## orb

**Pick it** only for an AI assistant doing something the narration names: listening to a request, searching the
policy, writing an answer. **Not** as a generic glowing ornament.

```js
Loom.orb(ctx, "assistant", { x: 1280, y: 540, size: 260, t: ctx.cue("the assistant"), states: [
  { at: ctx.cue("listens"), state: "listening" }, { at: ctx.cue("searches the policy"), state: "searching" },
  { at: ctx.cue("drafts a reply"), state: "composing" } ], tint: "accent" });
```

- States: working, searching, solving, listening, connecting, weaving, composing, breathing, shaping, and Loom's own
  `unsure` (dots loosen and drift, the colour cools), `checking` (a scan ring passes over), `paused` (contracts and
  holds, waiting for a person).
- A pure function of t (repainted on every seek). **Example:** `scenes_examples/lab/lab_orb.js`, `recipe_orb_states.js`.
- **Recipes** (`runtime/recipes_orb.js`; every word is an input): `Loom.orb.toolLoop(ctx, name, {x, y, size, tools,
  steps: [{at, state, tool, caption}]})` (plan, act, observe; the active tool card lights), `Loom.orb.retrieval(ctx,
  name, {question, answer, citation, chunks, cite, at: {listen, search, compose}})` (chunk cards fly in, the answer
  types into a real `Loom.ui.chat`, the citation chip lands), `Loom.orb.unsure(ctx, name, {question, answer, flag,
  at: {compose, check, unsure}})` (fluent, checked, found unsure; returns `claim` and `verdictAt` for a verdict),
  `Loom.orb.approval(ctx, name, {title, draft, button, at: {compose, pause, press, work}})` (drafts, pauses for a
  person, works after the press). Lab scenes `scenes_examples/lab/recipe_orb_*.js`.

## three

**Pick it** when the beat is about an object, and seeing it as a real thing (turning, opening, lighting up, changing
state) is what makes the point land: the push prompt on a phone, the security key being touched, the padlock opening,
the rack unit that fails, the screen left unlocked on an empty desk, the folder of records, coins draining. One clean
3D object beats a busy flat illustration of the same thing. **Not** for diagrams, tables or words, and never for
people (they come from character kits).

**Devices are variables (D-140).** A beat that shows a phone, tablet, laptop, monitor or desk names the preset and
writes no file; the engine can swap the device, its screen or the mood after the storyboard:

```json
{"beat": "b07", "kind": "three", "tools": ["three"],
 "three": {"preset": "device_shot", "rect": [160, 110, 1600, 780],
           "params": {"device": "phone", "screen": {"kind": "code", "title": "Your sign-in code", "code": "482915"},
                      "notify": {"title": "Sign-in request", "line": "Was this you?"}, "notify_say": "was this you",
                      "screens": [{"say": "approve it", "screen": {"kind": "lock", "title": "Signed in"}}],
                      "mood": "warm_office"}}}
```

`py -m loom device <id> b07 laptop` (or `--screen '{...}'`, `--mood m`; `--list` shows the choices) swaps it,
validated against the preset's card and logged; agents use `set_device`. Times are spoken words (`arrive_say`,
`wake_say`, `notify_say`, `lid_say`, `chair_say`, `mood_say`, `screens[].say`).

**One library model or set is a preset too (`model_shot`, D-147).** A beat that shows one model (a rack, a chip, a
CDU, a whole hall) names the model and drives its card keys on spoken words; no file is written, and the model, its
options, its states and the mood stay params:

```json
{"beat": "b13", "kind": "three", "tools": ["three"],
 "three": {"preset": "model_shot", "rect": [192, 54, 1536, 864],
           "params": {"model": "server_rack", "mood": "cold_aisle", "arrive_say": "a rack",
                      "states": [{"key": "load", "from": 0, "to": 1, "say": "fills up", "dur": 1.2}],
                      "zoom": 1, "turn": 0.5}}}
```

The storyboard gate checks the model exists and every state key is on its card (or `t`). The camera fits the model's
projected vertices (instances included) across the whole turn, so it fills the frame without cropping; `zoom` above
1 leaves more room. A set (an aisle, a hall) reads smaller than one object at the same zoom: try 0.85.

A beat that needs more than one device, a set or a custom move writes its own file:

```json
{"beat": "b07", "kind": "three", "tools": ["three"],
 "three": {"file": "scenes/b07_three.js", "rect": [160, 110, 1600, 780], "params": {"title": "Sign-in request"}}}
```

The clip (one ES module):

```js
export async function build(ctx, THREE, X) {
  const K = X.kit;                                                    // the toolkit: stage, roles, springs, faces
  const st = K.stage(ctx, THREE, X, { light: "studio", frame: [0, 0.85, 2.5] });
  const phone = await X.model("phone", { screen: { kind: "code", title: ctx.params.title, code: ctx.params.code } });
  st.scene.add(phone.group);
  return { scene: st.scene, camera: st.camera, update(t) {
    K.arrive(phone.group, t, ctx.cue("a code arrives"));               // springs in, turned, and settles
    phone.set("notify", K.progress(t, ctx.cue("was this you"), 0.7));  // a model is driven only by its keys
    K.sway(phone.group, t);                                             // a held object still reads as 3D
  } };
}
```

- **Model packs** (D-139): devices (phone, tablet, laptop, monitor, desk_set), security (padlock, key, security_key,
  shield, id_badge, badge_door with a mantrap pair, shredder), workplace (document, folder, envelope with a disguised
  attachment, clock, lightbulb, building, coin_stack, credit_card, bar_chart, gear, globe, cloud, balance_scale, and
  the sets meeting_room and office_floor), data centre (server_rack with doors, blanking, airflow, recirculation and
  A/B feeds, tor_switch, rack_pdu, gpu_server air or liquid, accelerator_chip, cdu, ups_cabinet, generator_set, and
  the sets dc_aisle_pair, dc_hall, power_path, dc_security_layers), AI and ML (embedding_space, chunk_cabinet,
  loss_landscape, neural_lattice, transformer_stack, agent_sandbox), devs (the ci_conveyor set). Models with motion
  take a key `t` (seconds): call `m.set("t", t)` every frame.
- **Moods** (colour and depth presets): `K.stage(ctx, THREE, X, {mood})` with `cold_aisle`, `hot_aisle`,
  `machine_night`, `latent_space`, `clean_bench`, `warm_office`, `incident` (call `st.update(t)`), `blueprint_iso`.
  Light in roles and haze in the page's own field colour, so every style restyles them.
- **The model library** (`assets/models3d`, D-138): models, each with parts and keys (states) and a turntable
  sheet in `docs/assets/models3d/`. `use_tool(["three"])` returns the live list; in Cowork, `py -m loom models`.
  Every model takes its colours from the style through roles (a device is dark on a light page and lit on a dark
  one; `opts.colors = {role: "token"}` overrides), and shows only the words passed in its options.
- **Screens** (phone, tablet, laptop, monitor, desk_set, meeting_room) take a spec: `blank`, `notification {title, line}`,
  `code {title, code}`, `lock {title, line}`, `chat {lines: [[who, text]]}`, `login {title, field1, field2, button}`,
  `alert {title, line}`, `list {title, items}`, `diff {title, lines: [[sign, text]]}`, `terminal {title, lines}`,
  `link_hover {text, shown, real}`, `prompt {blocks: [[role, text]]}`, or `custom` with your own `draw(g, W, H, ui)`.
- **Stage:** `K.stage(ctx, THREE, X, {light: "studio" | "soft" | "iso", frame: [cx, cy, height], elevation})`;
  `iso` is a true isometric orthographic view with soft shadows. `K.fitHeight(model, h)` scales a model.
- **Laws:** a frame is a pure function of t (no `Math.random`, `Date`, timers); colours only from tokens; every time
  is `ctx.cue("spoken words")` (string literals, words spoken in this beat); words only from params or narration.
- **A new object** the library lacks: build it in the clip from `K.rbox`, `K.extrude`, `K.lathe`, `K.mat(ctx,
  THREE, role, kind)`; if a second lesson needs it, promote it to `assets/models3d/<id>.js` with its `@model` card
  and a turntable sheet (`py -m loom models check`, `py -m loom models sheet <id>`).
- **Examples:** `scenes_examples/three/models_mfa.js` (three models in one shot), `model_turntable.js` (any model
  through its keys), `device_turn.js`, `isometric_office.js`. **Look at:** the object fills its rect without
  cropping on the turn, the key state lands on its word, and the end frame holds still long enough to read.

## skia

**Pick it** for at most one or two hero moments in a lesson: the opening image, a chapter divider, the payoff line
arriving from blur to sharp, an orb of light behind frosted glass. **Not** for teaching content that must stay crisp,
and not where a simple shader `fx` moment (a light sweep, a spotlight) already does it, which is cheaper.

```python
from loom_skia import *
def frame(c, t):
    k = ease_out(progress(t, ctx.cue("what made it easy"), 0.8))
    backdrop_blur(c, skia.Rect.MakeXYWH(W * 0.2, H * 0.3, W * 0.6, H * 0.4), 18 * (1 - k))
    c.drawString(ctx.params["phrase"], W * 0.25, H * 0.52, font("title", 72), paint("ink", alpha=k))
```

- Storyboard: `{"kind": "skia", "tools": ["skia"], "skia": {"file": "scenes/b16_skia.py", "rect": [...],
  "params": {...}, "motion_blur": {"samples": 4, "shutter": 0.5}}}`.
- Colours only `C.<token>`, `paint(token)`, `C.alpha(token, a)`; a fixed colour is refused by the scenes gate.
- Needs skia-python on the render machine (Windows and macOS wheels need nothing else).
- **Example:** `scenes_examples/skia/hero_orb.py`, `cinematic_25d.py`. **Look at:** the phrase is sharp and
  legible at the hold; the glow does not wash the text.
