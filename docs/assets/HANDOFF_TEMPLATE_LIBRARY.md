# Loom template and asset library: the hand-off sheet (2026-10-16)

STATUS: COMMISSION 2026-10-16. Written for a maker with a Claude Max account (Claude Code and Claude Design) who builds
reusable templates for Loom, the RedTee teaching-video engine. Kshitij's brief: "most of it should be code based and
things that the different style engines can make use of and templates that anyone can make use of ... by a terminal I
mean it should be properly a template of it but it can be coded in and shown as a terminal in the video with custom
code inside every time ... corporate, engineering, development, tech and non tech ... AI, LLM, DevOps, HR and more ...
explaining topic videos as well."

**What is inside:**
- 150 items in 11 families, each a paste-ready prompt;
- the context a maker needs, the two contracts (code and drawn art), and the naming and labelling rules;
- what Loom already has, so nothing is made twice.

**Mostly code:** 136 items are code templates (Claude Code) and 14 are drawn art (Claude Design).

---

## 0. How to work through this sheet

1. **Get the engine folder.** Kshitij shares a copy of `Video-Engine`. Work only in `runtime/components/` and
   `runtime/components/fixtures/` (code), or in a Claude Design project (art). Never edit anything else: the rest
   of the engine is maintained by other sessions.
2. **One Claude Code session per batch** of 5 to 8 items from one family. Paste the MASTER PROMPT (section 3) once,
   then the items' blocks. For drawn art, paste the ART MASTER PROMPT (section 4), then the item.
3. **Prove each item.**
   ```
   py -m loom library accept <id>
   ```
   It must pass. It renders every fixture case in every one of the 14 style packs and refuses invented words,
   colours written as hex, randomness, the clock and overflowing text. Then **look at** `library/sheets/<id>.jpg`. A
   pass that looks wrong is a fail.
4. **Deliver a zip per batch:**
   - `runtime/components/<id>.js`;
   - `runtime/components/fixtures/<id>.json`;
   - the sheet images;
   - a `BATCH.md` listing each id, what it is, the accept output and anything left open.

   Kshitij's sessions take it in, look again and file it.
5. **Order:** P1 items first (the most reused), then P2, then P3. Each item's priority is in its heading.

---

## 1. Loom in one page (the context every prompt needs)

**What Loom makes.** Loom makes narrated, animated corporate training and explainer lessons (2 to 10 minutes) from an
organisation's documents or a topic.

**Code-rendered, and deterministic.** Every frame is drawn by code: SVG built by JavaScript into one
continuous "world" canvas, animated on one paused GSAP timeline, rendered by headless Chrome. A frame is a pure function
of time: no `Math.random`, no clock, no timers, no network. The same lesson renders the same frames every time.

**Styles are data.** A lesson picks a style pack (14 today, from corporate-clean to whiteboard and blueprint). The pack
holds the palette as tokens, the fonts and type roles, the shape language and the motion personality. Code never
writes a colour or a font: it asks the pack. That is how one lesson restyles with no model calls, and why every
template must work in every pack.

**Some styles have an engine** (`runtime/engines/<style>.js`). The engine is the working code for the style's
medium: whiteboard (a hand writes with a marker) and blueprint (a technical drawing drafted live) exist today.
Living screencast, sci-fi hologram and isometric infographic are planned next. A scene reaches its style's engine as
`ctx.engine`.

**Why templates matter (the cost).** An AI author writes each beat's scene code. Writing scenes is 69 to 81 percent
of a lesson's cost (measured on 2026-10-14), and most of it goes on the author looking at its own frames and fixing
them. A tested template turns an 80 to 150 line beat into about 10 lines that cannot go wrong: the item is built
once, cached in the library, and reused by every lesson in every style.

**What a template is here.** A template is a component: a small, reusable element registered with
`Loom.component(id, {...})` and used in a scene as `ctx.use(id, params, opts)`.
- **Fixed:** its idea and its parts.
- **Open:** its content (the words, code, numbers and items) and its geometry, tokens and timing, all passed in at the
  point of use.

A terminal component shows whatever commands a lesson needs. It types them on the spoken words, in whatever style the
lesson is in.

---

## 2. The code contract (Claude Code): what every component must do

The full reference is in the engine folder: `docs/COMPONENTS.md` (the component API), `docs/SCENE_API.md` (ctx, kit,
motion), `docs/LAYOUT.md` (text fitting) and `runtime/kit.js`. This section is the minimum.

### 2.1 Shape of a component

```js
// runtime/components/dev_terminal.js
Loom.component("dev_terminal", {
  version: 1,
  idea: "A terminal session: a window with a title bar and a prompt, commands typed on cue and their output printed under them.",
  outline: ["window frame", "title bar with three dots and a title", "body of lines", "a block cursor"],
  family: "dev",                                   // the family from this sheet (labels, section 5)
  tags: ["terminal", "shell", "command line", "cli", "devops", "git"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-001)",
  params: {
    lines: { type: "list", content: true },       // CONTENT: always passed by the scene, never defaulted
    title: { type: "str", content: true },
    w: { type: "number", default: 1100 }, rows: { type: "int", default: 12 },
    at: { type: "number", default: -1 },           // when typing starts (seconds); -1 = drawn complete, no motion
    cps: { type: "number", default: 22 },          // characters a second when typing
    accent: { type: "token", default: "accent" },
  },
  slots: { header: "redraw the title bar: (g, p, ctx) => void" },
  parts: ["frame", "bar", "title", "body", "lines", "cursor"],
  example: 'ctx.use("dev_terminal", { title: "deploy", lines: [{ kind: "cmd", text: "git push origin main" }, { kind: "out", text: "Everything up-to-date" }], at: ctx.cue("push it") }, { x: 380, y: 200, name: "term" })',
  size: (p) => ({ w: p.w, h: 64 + p.rows * 34 + 28 }),   // MEASURE, THEN DRAW: the real size from the params
  build(ctx, g, p, slots) {
    // draw with ctx.kit and Loom.svg; colours only as tokens (Loom.style.c("surface")); fonts only from the pack
    // (Loom.style.font("mono").family); timing only from params; return the parts so a scene can animate them
    return { frame, bar, title, body, lines, cursor };
  },
});
```

### 2.2 The rules (each is checked, or will be looked at)

1. **Content is never defaulted.** Every word, number, code line or item on screen comes from a param marked
   `content: true`. A default that prints words is an error (`library accept` finds "sample text").
2. **Measure, then draw.**
   - Body text: size boxes from `Loom.kit.fit(str, {role, w, maxLines})` (real font metrics).
   - Code: the mono face is JetBrains Mono in every pack today; one character advances 0.6 em. Read the family from
     `Loom.style.font("mono").family`, never hard-code it.
   - Text never shrinks below its role's floor: grow the box, wrap, truncate with an ellipsis part the scene can
     see, or scroll. `size(p)` returns the true size.
3. **Colours are tokens only:**
   - `field`, `field2` (the background);
   - `surface`, `surface2` (cards and panels);
   - `ink` (words), `muted` (secondary), `line` (rules and connectors);
   - `accent` (what the narration names), `accent2` (measures and warnings), `accent3` (failure), `accent4` (success);
   - `pos` and `neg` (outcomes).

   Pick text colour on a fill with `Loom.style.pickTokenOn(fill)`. Never write a hex colour.
4. **Type roles only:** `display`, `hero`, `title`, `lead`, `body`, `label`, `caption`, and `mono` for code.
5. **Time is a param.**
   - Every animated component takes `at` (seconds; in scenes it comes from `ctx.cue("spoken words")`) and draws
     complete and still when `at` is -1, so it can be a still or a held picture.
   - Motion goes on the lesson's timeline: `Loom.tween(target, from, to, t, meta)`, `Loom.drive(fn, t, dur, ease,
     meta)` (one progress drives many properties), or `ctx.m.*` (reveal, draw, travel, count, highlight).
   - Typing, scrolling, a blinking cursor and counters are pure functions of time inside a `Loom.drive`, never timers.
6. **Return the parts.** The scene highlights a line, moves a card or circles a value afterwards. Name parts
   plainly: `lines`, `rows`, `cells`, `nodes`, `edges`, `badge`.
7. **States as functions on the parts.** A component that changes (a pipeline stage goes green, a pod restarts, a
   toggle flips) returns functions:
   ```js
   parts.set(stageIndex, "passed", t)
   parts.addLine({kind, text}, t)
   parts.focus(i, t)
   ```
   Each schedules on the timeline at time `t`.
8. **Engine-aware when it is line work.** If `ctx.engine` exists (`Loom.engines && Loom.engines.current()`), outlines
   and words that a person would draw go through it:
   - whiteboard: `const B = ctx.engine.board(ctx)`, then `B.draw` and `B.write`;
   - blueprint: `const D = ctx.engine.sheet(ctx)`, then `D.draw`, `D.letter` and `D.card`.

   Wrap the access in try/catch: a style with no engine throws. Code text and UI chrome stay in the pack's fonts.
   Offer `engine: "auto" | "off"` (default `"auto"`).
9. **One element per thing.** Use `ctx.el(name, {x, y, w, h, kind})` for each thing a later beat might hold, move or
   exit (`kind`: `card`, `panel`, `text`, `label`, `node`, `connector`, `value`, `token`). Labels and tags that may
   be moved clear by the layout guard get `layout: "flex"`.
10. **Determinism and safety:**
    - no `Math.random` (use `Loom.rng(seed)`), `Date`, timers, `requestAnimationFrame`, `fetch` or network;
    - no `<image>`, `<foreignObject>` or external URL;
    - icons from `ctx.kit.icon(parent, lucideName, {x, y, size, color})` (1,993 Lucide icons are installed).
11. **Fixtures:** `runtime/components/fixtures/<id>.json` with at least 3 cases whose CONTENT differs, and one case
    at the maximum the params allow (the longest words, the most rows), to prove the fit:
    ```json
    {"cases": [{"label": "short", "params": {...}, "opts": {"x": 300, "y": 200}}, ...]}
    ```
12. **Accessibility and taste:**
    - words at or above the floor (labels 24 px, body 30 px at 1080p);
    - contrast measured by the pack lint;
    - no drop shadows unless the pack has them (`Loom.style.pack.shape.shadow`);
    - no decoration that means nothing.

### 2.3 Versions

`"id"` resolves to the newest version and `"id@1"` pins one. A breaking change registers `version: 2` beside the old
one, so older lessons recompose unchanged.

---

## 3. MASTER PROMPT for Claude Code (paste once at the start of each batch)

```
You are building reusable code templates (Loom "components") for Loom, a deterministic, code-rendered teaching-video
engine (SVG + GSAP timeline, rendered by headless Chrome, frames are a pure function of time). The engine folder is
open in this session. Read first, in this order: docs/COMPONENTS.md, docs/SCENE_API.md, docs/LAYOUT.md, runtime/kit.js
(the drawing primitives), runtime/ui_artefacts.js and runtime/interaction.js (how existing UI artefacts are built),
docs/styles/engines/whiteboard.md and docs/styles/engines/blueprint.md (the two style engines), and section 2 of
docs/assets/HANDOFF_TEMPLATE_LIBRARY.md (the contract). Do not edit any file outside runtime/components/ and
runtime/components/fixtures/.

For each item block I paste after this message:
1. Restate in two lines what it is for and who uses it in a lesson, and list its params (content vs open), parts and
   state functions. Ask nothing; decide sensibly and say what you decided.
2. Write runtime/components/<id>.js with Loom.component(id, {version, idea, outline, family, tags, commissioned_by,
   params, slots, parts, example, size, build}). Content params have content: true and no default. Colours are
   tokens, fonts are pack roles (Loom.style.font("mono") for code), sizes are measured (kit.fit), motion is
   scheduled from params (at = -1 means drawn complete and still), and the build returns its parts and state functions.
   If ctx.engine exists, route hand-drawable outlines and words through it (engine: "auto" | "off").
3. Write runtime/components/fixtures/<id>.json: at least 3 cases with different content, one at the maximum the
   params allow.
4. Run: py -m loom library accept <id>. Fix every error. Then open library/sheets/<id>.jpg and look at every style's
   row: words inside their boxes, nothing overlapping that should not, readable in dark and light packs, nothing
   drawn that no param supplied. Fix what looks wrong even if the check passed.
5. Report per item: the id, what it draws, its params, the accept output, what you looked at, and anything left open.

Rules: no Math.random (use Loom.rng(seed)), no Date, timers, requestAnimationFrame or network; no hex colours; no
<image> or <foreignObject>; no em or en dashes in any text; plain, concrete names. Never copy a real product's look,
logo or trademark (a terminal is a generic terminal, a chat is a generic chat): draw the idea, not a brand.
```

---

## 4. ART MASTER PROMPT for Claude Design (paste once, then one art item)

```
You are drawing reusable art for Loom, a code-rendered teaching-video engine. Every asset must be an SVG that the
engine can recolour and animate: colours only from the slot list given in the item, every part a named group, no
text or letters (words are placed by the engine in empty rects called slot_<name>), no images, no filters unless the
item allows them, nothing that resembles a real person, brand, product or franchise.

Keep each asset as its own file in the project, with a manifest.json listing every file: {"batch", "assets": [{"file",
"kind", "id", "family", "style", "tags", "description", "parts", "slots", "anchors", "pivots"}]}. Make an index.html
review page with the same SVG markup inline (data-asset="<file path without .svg>" on each <svg>) and the manifest in
<script type="application/json" id="loom-manifest">. Before you reply, check every asset against the item's quality
list and redraw what fails. Reply with the file list and your self-review.
```

Art comes back through `py tools/asset_intake.py <export.zip> --batch <name>`. That tool checks the palette, the
structure and the size budget.

---

## 5. Names and labels (so the authoring agents find and choose each item)

**Ids.**
- Format: `<family>_<name>` in snake_case. The families are `dev`, `ops`, `ai`, `data`, `sec`, `biz`, `hr`, `ui`,
  `viz`, `gen`, `kit`.
- The id says what the thing IS (`ops_pipeline_stages`), never what one lesson used it for.

**`idea`:** one sentence on what it shows, with no lesson nouns. The storyboard agent reads it to choose.

**`tags`:** 5 to 12 search words: what people call it, its synonyms and the topics it serves.

**`family`, and `commissioned_by`:** `"Kshitij 2026-10-16 (hand-off sheet T-<n>)"`.

**`example`:** one working `ctx.use(...)` line with realistic content (for a different topic than the fixtures).

**Parts and state functions:** listed in `parts` and named for what they are.

**Art:** every manifest entry carries `id`, `family`, `style` (or `any`), `tags`, a one-line `description`, and its
`slots`, `anchors` and `pivots`.

**No duplicates of what exists (section 6).** Where an item extends something that exists, its block says so and
what is new.

---

## 6. What Loom already has (do not remake these)

| area | what exists | where |
|---|---|---|
| lesson templates (17) | title.card, definition, list.steps, compare.two, process.flow, stat.hero, document.page, calendar.plan, quiz.question, quiz.answer, chart.bars, scenario.dialogue, recap, icon.grid, cycle, timeline, quote | `runtime/templates/` |
| blueprints (5) | hero.meter, hero.character_moment, hero.journey, hero.hub, hero.portal | `runtime/templates/` |
| UI artefacts | ui.mail, ui.inbox, ui.chat, ui.doc, ui.card, ui.wire; window, field, button, toast, cursor, tap, type-into | `runtime/ui_artefacts.js`, `runtime/interaction.js` |
| page clips (sealed pictures, not components) | code_typing, terminal, flow_diagram, formula, glyph_morph, plot_line, stroke_text, world_map | `scenes_examples/page/` |
| data helpers | counter, barsOn, dipLine, unitGrid, tag | `runtime/data.js` |
| objects and 3D models | phone, laptop, monitor, server rack, GPU server, padlock, key, envelope, folder, document, credit card, ID badge, globe, cloud, gear, clock, coin stack, balance scale, lightbulb, building, meeting room, office floor and more | `runtime/objects.js`, `assets/models3d/` |
| element forms (37, from lessons) | verdict stamp, speech bubble, progress track, clock dial, checklist card, owner chip, labelled axes and more | `library/FORMS.md` |
| RedTee blueprints (150, imported) | concept.* (funnel, iceberg, matrix 2x2, pyramid, onion, fishbone, RAG grounding, next-token loop, prefill/decode), explain.* (checklist, dos and donts, prompt anatomy, token split, truth check, kpi tiles, feature matrix, doc redline, chat exchange), fin.*, gen.*, math.*, stats.*, agent.*, product.* | `RedTee_V1_Video/common/blueprints/` |
| style engines | whiteboard (board, draw, write, heading), blueprint (sheet, part, letter, dim, balloon, card, connect, cloud, overlay, titleBlock, notes, explode, extrude, step) | `runtime/engines/` |
| designed sets | office world (meeting room and 8 more places), prompts for 17 other worlds | `assets/sets/`, `docs/assets/world_prompts/` |

**The terminal case.** A terminal exists as a page clip: a sealed picture. Inside it the engine cannot hold a line into
the next beat, the layout checks cannot read its words, a restyle needs a re-render, and the camera can only move the
rectangle. The component (T-001) is the native version, and the same holds for the other "native" items below.

---

## 7. The items

**Block format.** Each block is the prompt for its item (paste it after the master prompt). Its fields are:
- **For**: the lessons and moments it serves;
- **Shows**: the picture;
- **Params**: content first, then open params with their defaults;
- **Parts and states**: the returned parts and state functions;
- **Motion**: what moves on the timeline and how it is cued;
- **Engines**: how it behaves in the whiteboard and blueprint styles and in the planned ones;
- **Fixtures**: the cases;
- **Avoid**.

**Priorities:** P1 is used in most lessons of its kind; P2 is common; P3 is specialised but high value when it fits.

---

## Family A. Developer and code (`dev_`): 18 items

### T-001 · `dev_terminal` · Terminal session · P1
- **For:** any lesson with a command line: git, deployment, package installs, cloud CLIs, debugging, secrets
  hygiene, "run this, see that".
- **Shows:** a terminal window: a title bar (three neutral dots, a title), a body of lines in the mono face, a block
  cursor. Commands carry a prompt (`$`, or `PS>`, or a custom string); output lines sit under them; error lines in
  the failure token; comments muted.
- **Params:**
  - `lines` (content): a list of `{kind: "cmd" | "out" | "err" | "ok" | "warn" | "comment", text, at?}`;
  - `title` (content);
  - `prompt` ("$"), `cwd` (optional, shown before the prompt, muted), `w` (1100), `rows` (12, visible rows; later lines scroll);
  - `at` (-1), `cps` (22, typing speed for cmd lines; output lines appear whole, a line every 0.08 s);
  - `scheme`: `"dark" | "light" | "pack"` (pack: surface2 body on the field), `accent` (token for the prompt);
  - `highlight` (indexes to mark), `wrap` (`"wrap" | "cut"`).
- **Parts and states:**
  - parts: `frame`, `bar`, `title`, `body`, `lines[]`, `cursor`;
  - `parts.type(i, t)` types line i from t;
  - `parts.addLine({kind, text}, t)` appends, scrolling when full;
  - `parts.mark(i, tone, t)` puts a soft highlight bar behind a line;
  - `parts.clear(t)`.
- **Motion:**
  - typing is a `Loom.drive` that reveals characters by count; the cursor follows the last character;
  - the cursor blink is a function of time (0.53 s on and off) and stops while typing;
  - scrolling moves the lines group by whole rows.
- **Engines:**
  - whiteboard: the frame and bar are drawn by the hand; code stays in the mono face;
  - blueprint: the frame is drafted (`D.draw`) and the title lettered;
  - living screencast (planned): it is the app window the cursor works in.
- **Fixtures:**
  1. a `git push` with output;
  2. `kubectl get pods` with a CrashLoopBackOff err line;
  3. 20 lines that scroll, with the longest allowed line (wrap).
- **Avoid:** a real product's window chrome; coloured syntax inside output text; any sample command in a default.

### T-002 · `dev_code_editor` · Code editor pane · P1
- **For:** explaining code: a function, a fix, a config, a vulnerable line, an API call, a prompt template in code.
- **Shows:** an editor pane: a tab with a file name and language label, a line-number gutter, code with syntax
  colouring from tokens, an optional minimap stripe and a status line.
- **Params:**
  - `code` (content, string), `file` (content), `lang` (`js | ts | py | go | java | sql | yaml | json | bash | html |
    css | text`);
  - `w` (1200), `rows` (16), `startLine` (1), `at` (-1), `typeLines` (indexes typed on cue, the rest shown at once);
  - `colors` (a map from token kind to colour token: defaults keyword accent, string accent4, number accent2,
    comment muted, function accent3, type ink, punctuation muted);
  - `focus` (a line range dimming the rest).
- **Parts and states:**
  - parts: `tab`, `gutter`, `lines[]` (each with `tokens[]`), `cursor`;
  - `parts.focus(a, b, t)` dims all lines but a to b;
  - `parts.mark(line, tone, t)` puts a squiggle under a span, or `{col0, col1}` for a span;
  - `parts.replace(line, newText, t)` strikes out the old line and types the new one;
  - `parts.scrollTo(line, t)`.
- **Motion:** typing per character (Loom.drive); focus dims over 0.3 s; replace strikes the old line in accent3
  then types the new.
- **Tokenising:** a small tokenizer per language: keywords, strings, numbers, comments, function names. No external
  library at runtime. The page clip uses Shiki; this component must not.
- **Engines:** blueprint: the pane frame is drafted; whiteboard: the pane frame is drawn; the code text stays mono.
- **Fixtures:**
  1. a 10-line Python function;
  2. a YAML deployment with a focus range;
  3. 60 lines of TypeScript that scroll, with a replace on line 42.
- **Avoid:** a real editor's look (no recognisable icons or theme names).

### T-003 · `dev_diff_view` · Code diff · P1
- **For:** code review, change management, "what changed", security fixes, config drift.
- **Shows:** a unified or split diff: line numbers on both sides, removed lines on a faint failure band with a minus,
  added lines on a faint success band with a plus, context lines plain, a hunk header muted.
- **Params:**
  - `hunks` (content): a list of `{header, lines: [{op: " " | "+" | "-", text}]}`, `file` (content);
  - `mode` (`"unified" | "split"`), `w` (1300), `rows` (18), `at` (-1), `lang`.
- **Parts and states:** parts `header`, `rows[]`; `parts.reveal(op, t)` shows removals first, then additions;
  `parts.comment(row, text, t)` adds a review comment balloon on a row (content).
- **Motion:** removals collapse or fade to their band, then additions grow in; a comment appears on a leader.
- **Fixtures:**
  1. one hunk, 3 removed and 4 added;
  2. split mode with two hunks;
  3. the longest lines, with wrapping.
- **Avoid:** colouring by hue alone: also use the plus and minus glyphs and the bands' tone.

### T-004 · `dev_git_graph` · Branch and commit graph · P1
- **For:** git branching, merges, rebases, release branches, hotfix flow, trunk-based development.
- **Shows:** horizontal lanes (one per branch, a label at the left), commits as dots on their lanes, merge lines
  between lanes, tags as small flags, HEAD as a marker.
- **Params:**
  - `branches` (content): `[{id, label}]`;
  - `commits` (content): `[{id, branch, parents: [ids], label?, tag?}]`;
  - `head` (commit id), `w` (1500), `at` (-1), `stepX` (110).
- **Parts and states:**
  - parts: `lanes`, `commits{id}`, `edges[]`, `labels`, `head`;
  - `parts.commit(spec, t)` adds a commit;
  - `parts.merge(fromBranch, intoBranch, t)`;
  - `parts.moveHead(id, t)`;
  - `parts.focus(branchId, t)`.
- **Motion:** commits pop in order; a merge line draws from parent to child; HEAD travels.
- **Fixtures:**
  1. main plus feature, merged;
  2. main, develop and release with a hotfix;
  3. 5 branches, 30 commits.
- **Avoid:** placing labels on lines; give each lane its label space.

### T-005 · `dev_pull_request` · Pull request card · P2
- **For:** code review culture, approvals, the four-eyes principle, CI gates before merge.
- **Shows:** a card with title, branch from and to, author role marker, a checks list (passed, failed, pending icons),
  a reviewers row with approval states, and a merge button that is enabled or blocked.
- **Params:** `title`, `from`, `to`, `checks` (`[{name, state}]`), `reviewers` (`[{role, state}]`) (all content);
  `w` (900), `at` (-1).
- **Parts and states:** parts `checks[]`, `reviewers[]`, `merge`; `parts.check(i, state, t)`;
  `parts.approve(i, state, t)`; `parts.merge(state, t)` (blocked, ready, merged).
- **Motion:** pending checks spin a short arc driven by time, then turn to a tick or a cross; the merge button lights
  when all are green.
- **Fixtures:**
  1. all passed and 2 approvals;
  2. one failing check blocks the merge;
  3. 8 checks and 4 reviewers.
- **Avoid:** a real platform's look or wording.

### T-006 · `dev_ci_pipeline` · CI/CD pipeline stages · P1
- **For:** DevOps, release processes, quality gates, "shift left", supply-chain security.
- **Shows:** stages left to right (build, test, scan, deploy...) as rounded boxes joined by connectors, each with a
  status icon and a duration; parallel jobs stacked within a stage.
- **Params:**
  - `stages` (content): `[{name, jobs: [{name, state, dur?}]}]`;
  - `w` (1600), `at` (-1), `orientation` (`"h" | "v"`).
- **Parts and states:** parts `stages[]`, `jobs[][]`, `edges[]`; `parts.run(stageIndex, t)` (pending to running);
  `parts.set(stageIndex, jobIndex, state, t)` (passed, failed, skipped, blocked); `parts.flow(t, dur)` sends a token
  along the edges.
- **Motion:** a running job shows a progress sweep (Loom.drive); state changes cross-fade the icon; a failed stage
  stops the flow, and later stages turn to skipped.
- **Engines:**
  - blueprint: stages as `D.card`, edges as `D.connect`;
  - isometric (planned): conveyor sections.
- **Fixtures:**
  1. 4 stages, all pass;
  2. a scan stage fails and blocks deploy;
  3. 7 stages with 3 parallel jobs each.
- **Avoid:** progress bars that move without a cue.

### T-007 · `dev_build_log` · Streaming log viewer · P2
- **For:** debugging, observability, "read the logs", incident triage.
- **Shows:** a log panel with timestamp, level badge (DEBUG, INFO, WARN, ERROR), source and message per line; a
  filter bar showing the active level; new lines stream in at the bottom.
- **Params:** `entries` (content): `[{ts, level, src, msg}]`; `filter` (`"all"` or a level), `rows` (12), `w` (1400),
  `at` (-1), `rate` (lines a second when streaming).
- **Parts and states:** parts `rows[]`, `badges[]`; `parts.filter(level, t)` hides other levels with a collapse;
  `parts.find(text, t)` marks matches; `parts.pin(i, t)` holds a row while others scroll.
- **Fixtures:**
  1. 10 INFO and 1 ERROR;
  2. 40 mixed lines streaming;
  3. the longest message (wrap or cut).
- **Avoid:** colour alone for levels: each level has its badge text.

### T-008 · `dev_test_results` · Test run results · P2
- **For:** testing culture, TDD, regression, flaky tests.
- **Shows:** a suite tree (suite, then cases) with a pass, fail or skip mark and a duration per case, and a summary
  bar of passed, failed and skipped counts.
- **Params:** `suites` (content): `[{name, cases: [{name, state, ms?}]}]`; `w` (1100), `rows` (14), `at` (-1).
- **Parts and states:** parts `cases[]`, `summary`; `parts.run(t, dur)` runs cases in order (each spins, then
  resolves); `parts.expand(i, msg, t)` opens a failure message (content).
- **Fixtures:**
  1. 6 cases, all pass;
  2. 2 failures with messages;
  3. 3 suites and 40 cases with a scroll.

### T-009 · `dev_stack_trace` · Error and stack trace · P2
- **For:** debugging lessons, reading errors, exception handling.
- **Shows:** an error header (type and message), then frames (function, file, line), with the user's own frame
  emphasised and library frames muted and collapsible.
- **Params:** `error` (content), `frames` (content): `[{fn, file, line, mine?}]`; `w` (1200), `at` (-1).
- **Parts and states:** parts `header`, `frames[]`; `parts.focus(i, t)`; `parts.collapseLibrary(t)`.
- **Fixtures:** a Python traceback; a Java exception with 20 frames; a JavaScript TypeError.

### T-010 · `dev_http_exchange` · HTTP request and response · P1
- **For:** APIs, REST, auth headers, status codes, rate limits, CORS, security (tokens in headers).
- **Shows:** a request card (method badge, URL, headers, body) and a response card (status badge with its meaning
  tone, headers, body), joined by an arrow; an optional latency figure on the arrow.
- **Params:**
  - `request` (content): `{method, url, headers: [[k, v]], body?}`;
  - `response` (content): `{status, reason, headers, body?}`;
  - `latencyMs`, `layout` (`"side" | "stack"`), `w` (1500), `at` (-1), `maskSecrets` (true: values of
    Authorization, Cookie and keys shown as dots, with a reveal state).
- **Parts and states:** parts `req`, `res`, `arrow`, `status`, `headers[]`; `parts.send(t)` (the request travels as a
  token, then the response appears); `parts.mark(headerKey, tone, t)`; `parts.reveal(headerKey, t)` (unmask a secret,
  for a "do not do this" moment).
- **Fixtures:** GET 200 with JSON; POST 401 with a missing token; 429 with a Retry-After header.

### T-011 · `dev_json_tree` · JSON or YAML viewer · P2
- **For:** API payloads, config files, model outputs, structured data.
- **Shows:** a collapsible tree of keys and values in the mono face, with type tones per value (string, number,
  boolean, null) and guides for depth.
- **Params:** `data` (content: an object, or a string to parse), `format` (`"json" | "yaml"`), `expandDepth` (2),
  `w` (1000), `rows` (16), `at` (-1).
- **Parts and states:** parts `nodes{path}`; `parts.expand(path, t)`; `parts.collapse(path, t)`; `parts.mark(path,
  tone, t)`; `parts.set(path, value, t)` (a value changes, with a flash).
- **Fixtures:** a user record; a nested config of 4 levels; an array of 30 items with collapsing.

### T-012 · `dev_db_table` · Database table and query · P1
- **For:** SQL basics, data quality, joins, PII in tables, "where does this data live".
- **Shows:** an optional query bar (SQL in mono), and a table grid with column headers (name and type), rows,
  highlighted cells and a row count.
- **Params:** `columns` (content): `[{name, type?}]`; `rows` (content: arrays); `query` (content, optional);
  `w` (1400), `maxRows` (8), `at` (-1).
- **Parts and states:** parts `query`, `header[]`, `cells[r][c]`; `parts.run(t)` types the query, then rows appear in
  order; `parts.filter(predicateRows, t)` collapses the rows that do not match; `parts.mark(r, c, tone, t)`;
  `parts.redact(col, t)` masks a column (PII).
- **Fixtures:** customers with an email column redacted; orders with a WHERE filter; 12 columns by 30 rows, cut with
  "and 22 more".

### T-013 · `dev_er_diagram` · Entities and relations · P3
- **For:** data modelling, system design, data ownership.
- **Shows:** entity boxes (name, then fields with key marks), relation lines with crow's-foot ends and labels.
- **Params:** `entities` (content): `[{id, name, fields: [{name, key?: "pk" | "fk"}]}]`; `relations` (content):
  `[{from, to, card: "1-1" | "1-n" | "n-n", label?}]`; `layout` (`"auto" | "grid"`, or positions), `at` (-1).
- **Parts and states:** parts `entities{id}`, `relations[]`; `parts.focus(id, t)`; `parts.reveal(order, t)`.
- **Fixtures:** 3 entities; 6 entities; one many-to-many with a join table.
- **Avoid:** crossing lines; route orthogonally around boxes.

### T-014 · `dev_file_tree` · Project file tree · P2
- **For:** repository structure, where config lives, secrets in the wrong file, monorepos.
- **Shows:** an indented tree with folder and file icons (Lucide), expand marks, and highlighted entries.
- **Params:** `tree` (content: nested `{name, children?}`), `open` (paths), `w` (700), `rows` (16), `at` (-1).
- **Parts and states:** parts `items{path}`; `parts.open(path, t)`; `parts.mark(path, tone, t)`; `parts.add(path, t)`;
  `parts.remove(path, t)`.
- **Fixtures:** a web app; a Python package with a `.env` marked in accent3; a monorepo, 40 entries, scrolling.

### T-015 · `dev_dependency_graph` · Package dependency graph · P3
- **For:** supply-chain security, transitive dependencies, a vulnerable package deep in the tree.
- **Shows:** the app at the root, dependencies as a layered tree or DAG, the vulnerable node in accent3 with the
  path to it emphasised.
- **Params:** `nodes` (content): `[{id, label, version?}]`; `edges` (content): `[[from, to]]`; `root`; `mark` (ids),
  `at` (-1).
- **Parts and states:** parts `nodes{id}`, `edges[]`; `parts.path(toId, t)` lights the path from the root;
  `parts.patch(id, newLabel, t)` swaps the version.
- **Fixtures:** 8 nodes; 25 nodes in 4 layers; a diamond dependency.

### T-016 · `dev_devtools_network` · Network waterfall · P3
- **For:** web performance, slow pages, blocking requests, caching.
- **Shows:** a request list with name, type, size and time, and waterfall bars on a time axis, with the critical
  path emphasised.
- **Params:** `requests` (content): `[{name, type, start, dur, size?, status?}]`; `w` (1600), `at` (-1), `axisMs`.
- **Parts and states:** parts `rows[]`, `bars[]`, `axis`; `parts.play(t, dur)` grows the bars in time order;
  `parts.mark(i, tone, t)`.
- **Fixtures:** 6 requests; 20 with a slow script blocking; a cached reload (short bars).

### T-017 · `dev_regex_match` · Pattern matching highlighter · P3
- **For:** regex, input validation, log parsing, data cleansing.
- **Shows:** the pattern in mono at the top, test strings below, with matches highlighted and capture groups
  numbered.
- **Params:** `pattern` (content), `samples` (content, list), `matches` (content: per sample, `[{start, end,
  group?}]`, precomputed by the scene author, so no regex runs at render), `at` (-1).
- **Parts and states:** parts `pattern`, `samples[]`, `marks[][]`; `parts.scan(t, dur)` sweeps a caret along each
  sample, marking matches as it passes.
- **Fixtures:** emails; dates; a log line with 3 groups.

### T-018 · `dev_browser_frame` · Browser window with address bar · P2
- **For:** web apps, phishing sites (look-alike URLs), HTTPS padlock states, cookies, SaaS walkthroughs.
- **Shows:** a generic browser: tabs, back and forward, an address bar with a lock state (secure, warning,
  not secure), the URL with its domain emphasised, and a content area that is an empty slot or a nested component.
- **Extends:** `ui.window`. Check what `ui.window` already draws and reuse it; this adds the address bar, tabs,
  lock state and domain emphasis.
- **Params:**
  - `url` (content), `tabs` (content, list), `lock` (`"secure" | "warning" | "insecure"`);
  - `w` (1500), `h` (900), `at` (-1), `content` (a slot function, or a component ref to nest).
- **Parts and states:** parts `bar`, `url`, `domain`, `lock`, `tabs[]`, `content`; `parts.typeUrl(text, t)`;
  `parts.setLock(state, t)`; `parts.markDomain(tone, t)` (for "look closely at the domain").
- **Fixtures:** a secure banking-like domain (invented); a look-alike domain with a warning; 6 tabs and a long URL.
- **Avoid:** any real browser's chrome or a real company's domain.

---

## Family B. DevOps, cloud and reliability (`ops_`): 16 items

### T-019 · `ops_cluster_map` · Container cluster map · P1
- **For:** Kubernetes and container basics, scheduling, node failure, resilience, scaling.
- **Shows:** a cluster frame with nodes (machines) as panels; pods as small rounded tiles inside nodes, labelled with
  their service and coloured by state (running, pending, failed, terminating); an optional control-plane panel.
- **Params:** `nodes` (content): `[{id, label, cpu?, mem?}]`; `pods` (content): `[{id, svc, node, state}]`;
  `w` (1600), `h` (800), `at` (-1).
- **Parts and states:**
  - parts `nodes{id}`, `pods{id}`;
  - `parts.schedule(podSpec, nodeId, t)`: a pod flies from the control plane to its node;
  - `parts.fail(nodeId, t)`: the node greys out and its pods turn to failed, then reschedule elsewhere when
    `parts.reschedule(map, t)` is called;
  - `parts.scale(svc, n, t)`;
  - `parts.state(podId, state, t)`.
- **Motion:** pods travel on scheduling; a failing node shakes once, never in a loop, then dims; utilisation bars
  per node fill by a drive.
- **Engines:** isometric (planned): nodes as server blocks, pods as small cubes on them.
- **Fixtures:** 3 nodes and 6 pods; a node failure with rescheduling; 8 nodes and 40 pods.

### T-020 · `ops_rollout` · Deployment rollout (rolling, blue-green, canary) · P1
- **For:** release strategies, risk reduction, rollbacks.
- **Shows:** traffic as a stream of small dots from a router to two groups of instances (old and new versions); a
  percentage split label; instances flipping from old to new.
- **Params:** `strategy` (`"rolling" | "bluegreen" | "canary"`), `versions` (content: `[old, new]` labels),
  `instances` (6), `steps` (content: a list of percentages for canary, e.g. 5, 25, 50, 100), `at` (-1),
  `w` (1500).
- **Parts and states:** parts `router`, `groups[]`, `instances[]`, `split`; `parts.step(i, t)` moves to step i;
  `parts.rollback(t)`; `parts.health(i, state, t)` (an instance turns unhealthy).
- **Motion:** the traffic dots flow continuously while visible, as a function of time; changing the split re-routes
  the dots' paths over 0.6 s.
- **Fixtures:** a canary at 5, 25 and 100 percent; blue-green with a cut-over; rolling with one failure and a
  rollback.

### T-021 · `ops_load_balancer` · Load balancer routing · P2
- **For:** scaling, health checks, sticky sessions, failover.
- **Shows:** clients at the left, a balancer in the middle, backends at the right; requests travel and the
  balancer's algorithm label shows (round robin, least connections).
- **Params:** `backends` (content: labels), `algorithm` (content: label), `requests` (12), `at` (-1); `health`
  (a state per backend).
- **Parts and states:** parts `lb`, `backends[]`, `paths[]`; `parts.down(i, t)`: backend i fails its health check and
  traffic avoids it; `parts.burst(n, t)`.
- **Fixtures:** 3 backends; one down; 6 backends under a burst.

### T-022 · `ops_autoscale` · Autoscaling against load · P2
- **For:** capacity, cost control, scaling policies, cold starts.
- **Shows:** a load line over time with a threshold band; instance count as a step line under it; instances as
  icons that appear and disappear.
- **Params:** `load` (content: a series of numbers), `threshold` (content: `{up, down}`), `instances` (content: a
  series), `unit` (content), `w` (1500), `at` (-1), `dur`.
- **Parts and states:** parts `load`, `steps`, `icons[]`, `band`; `parts.play(t, dur)` draws both lines left to
  right, with icons following.
- **Fixtures:** a daily curve; a spike with a lag; flat load (no scaling).

### T-023 · `ops_metric_tile` · Monitoring metric tile · P1
- **For:** observability, SLIs, dashboards, golden signals (latency, traffic, errors, saturation).
- **Shows:** a tile with the metric name, the current value large with its unit, a sparkline, a threshold line and
  a state colour (ok, warn, critical).
- **Params:** `name`, `unit`, `series` (all content); `value` (content, or the last point), `threshold`
  (`{warn, crit}`), `w` (420), `h` (240), `at` (-1).
- **Parts and states:** parts `value`, `spark`, `threshold`, `state`; `parts.push(v, t)` appends a point, the line
  shifts, and the value counts; `parts.state(s, t)`.
- **Use it in a grid:** a scene lays 4 to 8 tiles out as a dashboard.
- **Fixtures:** latency in ms, ok; error rate in percent, critical; saturation at the threshold.

### T-024 · `ops_alert_card` · Alert or page notification · P1
- **For:** on-call, incident response, alert fatigue, severities.
- **Shows:** an alert card with a severity badge (SEV1 to SEV4, or P1 to P4), a title, the service, the time it
  fired and an acknowledge state; it can stack in a pile.
- **Params:** `severity`, `title`, `service`, `time` (all content); `state` (`"firing" | "acked" | "resolved"`),
  `w` (700), `at` (-1).
- **Parts and states:** parts `badge`, `title`, `state`; `parts.ack(t)`; `parts.resolve(t)`; `parts.escalate(t)`
  (the badge pulses once and a second card slides in under it).
- **Fixtures:** SEV1 database down; SEV3 disk at 80 percent; a long title.

### T-025 · `ops_incident_timeline` · Incident timeline · P1
- **For:** postmortems, incident communication, MTTD and MTTR, blameless reviews.
- **Shows:** a horizontal time axis with phases (detect, triage, mitigate, resolve, review) as bands; events as
  pins with a time and a label; duration brackets (time to detect, time to resolve).
- **Params:** `events` (content): `[{t, label, kind?}]`; `phases` (content): `[{from, to, label}]`; `w` (1700),
  `at` (-1); `brackets` (content, optional).
- **Parts and states:** parts `axis`, `bands[]`, `pins[]`, `brackets[]`; `parts.play(t, dur)` reveals events in time
  order; `parts.focus(i, t)`.
- **Extends:** the `timeline` template. That template is a general lesson timeline; this one has phases, brackets
  and event kinds.
- **Fixtures:** 6 events; 14 events, two of them close together (labels must not collide); one with an 8-hour gap.

### T-026 · `ops_slo_budget` · SLO and error budget · P1
- **For:** reliability targets, SLOs, error budgets, release freezes.
- **Shows:**
  - the target as a big figure (99.9 percent);
  - a budget bar that burns down as errors happen, with the budget left in time units;
  - a burn-rate arrow;
  - a "freeze" state when the budget is spent.
- **Params:** `target`, `window`, `budget` (`{total, used}`, all content); `unit` (content), `w` (1100), `at` (-1).
- **Parts and states:** parts `target`, `bar`, `left`, `rate`; `parts.burn(used, t, dur)`; `parts.freeze(t)`.
- **Fixtures:** 99.9 over 30 days with 20 percent used; 100 percent used with a freeze; 99.99 with a fast burn.

### T-027 · `ops_queue_topic` · Message queue or event topic · P2
- **For:** async systems, decoupling, backpressure, ordering, retries, dead-letter queues.
- **Shows:** producers, a queue (or topic partitions as parallel tubes) holding message tokens, consumers, and an
  optional dead-letter queue.
- **Params:** `producers`, `consumers` (content: labels), `partitions` (1), `depth` (content: messages in queue),
  `dlq` (bool), `at` (-1).
- **Parts and states:** parts `queue`, `slots[][]`, `producers[]`, `consumers[]`, `dlq`; `parts.produce(n, t)`;
  `parts.consume(n, t)`; `parts.fail(msgIndex, t)` (retried, then sent to the DLQ); `parts.lag(t)` (the queue fills
  and a lag label counts).
- **Fixtures:** 1 queue with 2 consumers; 3 partitions; a DLQ case.

### T-028 · `ops_cache_lookup` · Cache hit and miss · P2
- **For:** performance, caching layers, stale data, TTL.
- **Shows:** a client, a cache and the origin; a request travels to the cache and either returns fast (hit) or goes
  on to the origin and back while filling the cache (miss); latency figures on the paths.
- **Params:** `labels` (content: `{client, cache, origin}`), `hitMs`, `missMs` (content), `sequence` (content: a list
  of hit and miss), `at` (-1).
- **Parts and states:** parts `paths`, `entries[]`, `timer`; `parts.request(kind, t)`; `parts.expire(key, t)`.
- **Fixtures:** miss then hits; TTL expiry; a stampede of misses.

### T-029 · `ops_feature_flags` · Feature flag panel · P2
- **For:** progressive delivery, kill switches, A/B tests, risk control.
- **Shows:** a panel of flags, each with a name, a toggle, a rollout percentage and target segments as chips; a
  "kill switch" style for one flag.
- **Params:** `flags` (content): `[{name, on, pct?, segments?: [labels]}]`; `w` (1000), `at` (-1).
- **Parts and states:** parts `rows[]`, `toggles[]`; `parts.toggle(i, on, t)`; `parts.pct(i, value, t, dur)`;
  `parts.kill(i, t)`.
- **Fixtures:** 3 flags; a kill switch; 8 flags with segments.

### T-030 · `ops_cloud_architecture` · Cloud region and zones frame · P1
- **For:** cloud architecture, high availability, multi-region, data residency, network boundaries.
- **Shows:** nested frames: a provider-neutral cloud boundary, regions, availability zones, VPC or VNet and subnets
  (public and private), with service nodes placed inside (generic icons from Lucide: server, database, globe, shield,
  hard-drive).
- **Params:**
  - `frames` (content): a nested `{id, kind: "cloud" | "region" | "zone" | "network" | "subnet", label,
    children}`;
  - `nodes` (content): `[{id, frame, icon, label}]`;
  - `links` (content): `[[from, to, label?]]`;
  - `at` (-1), `w` (1700), `h` (900).
- **Parts and states:** parts `frames{id}`, `nodes{id}`, `links[]`; `parts.reveal(order, t)` (outer to inner);
  `parts.outage(frameId, t)` (a zone fails, and its nodes dim); `parts.flow(path, t)`.
- **Engines:**
  - blueprint: the frames are drafted, with chain lines for boundaries;
  - isometric (planned): stacked plates.
- **Avoid:** real cloud providers' icons and names.
- **Fixtures:** one region, 2 zones; 2 regions with replication; a 3-tier app across 3 zones.

### T-031 · `ops_iac_plan` · Infrastructure-as-code plan · P3
- **For:** Terraform-like plans, change review, drift, "what will this apply do".
- **Shows:**
  - a plan listing resources with `+` (create), `~` (change) or `-` (destroy) and their attributes;
  - a summary line ("2 to add, 1 to change, 1 to destroy");
  - destroy lines emphasised.
- **Params:** `changes` (content): `[{op, resource, attrs?: [[k, from, to]]}]`; `w` (1300), `rows` (16), `at` (-1).
- **Parts and states:** parts `rows[]`, `summary`; `parts.mark(i, t)`; `parts.apply(t)` ticks each row in order.
- **Fixtures:** small; a destroy of a database marked; 25 changes.

### T-032 · `ops_oncall_rotation` · On-call rotation · P3
- **For:** on-call fairness, handover, escalation policies.
- **Shows:** a week or month strip with shifts as bars per person (role markers, not faces), the current shift
  marker, and an escalation chain (primary, then secondary, then manager).
- **Params:** `people` (content: role labels), `shifts` (content), `now`, `chain` (content), `at` (-1).
- **Parts and states:** parts `bars[]`, `now`, `chain[]`; `parts.handover(from, to, t)`; `parts.escalate(step, t)`.
- **Fixtures:** 4 people over a week; a follow-the-sun rotation across 3 time zones; a 3-step escalation.

### T-033 · `ops_runbook` · Runbook procedure · P2
- **For:** operational procedures, incident playbooks, change checklists, SOPs.
- **Shows:** numbered steps, each with a short instruction, an optional command chip (mono) and a check state; a
  decision step branches to two paths.
- **Params:** `steps` (content): `[{text, cmd?, branch?: {yes, no}}]`; `w` (1100), `at` (-1).
- **Parts and states:** parts `steps[]`; `parts.do(i, state, t)` (doing, done, skipped, failed); `parts.branch(i,
  which, t)`.
- **Extends:** `list.steps` and RedTee's `explain.checklist`. This adds command chips, states and branches.
- **Fixtures:** 5 steps; a decision branch; 12 steps with a scroll.

### T-034 · `ops_network_path` · Network hops (trace) · P3
- **For:** networking basics, latency, where a connection fails, DNS, firewalls.
- **Shows:** hops from a client to a server as nodes on a path, with a latency per hop, a timeout hop marked, and
  firewall or proxy gates on the path.
- **Params:** `hops` (content): `[{label, ms?, kind?: "router" | "firewall" | "proxy" | "dns"}]`; `at` (-1),
  `w` (1700).
- **Parts and states:** parts `hops[]`, `links[]`, `packet`; `parts.trace(t, dur)` (a packet goes hop by hop and
  each ms figure appears); `parts.block(i, t)`.
- **Fixtures:** 6 hops; a DNS lookup chain (resolver, root, TLD, authoritative); a firewall block.

---

## Family C. AI, LLMs and machine learning (`ai_`): 18 items

RedTee already has several AI diagrams (section 6): token split, next-token loop, RAG grounding, prefill and decode,
prompt anatomy, agent loops, truth check. These items are the working parts around them: consoles, traces,
metrics, pipelines.

### T-035 · `ai_context_window` · Context window budget · P1
- **For:** why models forget, long documents, RAG, cost, "the prompt is full".
- **Shows:** one long bar for the model's context limit, filled with labelled segments (system prompt, instructions,
  history, retrieved documents, the answer's reserve) in distinct tones; a token count per segment and the total
  against the limit; overflow drawn past the end in accent3, and the oldest history truncated.
- **Params:** `limit` (content, a number), `segments` (content): `[{label, tokens, tone?}]`, `unit` (content, for
  example "tokens"), `w` (1600), `at` (-1).
- **Parts and states:** parts `bar`, `segments[]`, `total`; `parts.add(seg, t)` grows in; `parts.overflow(t)`;
  `parts.truncate(n, t)` (the oldest n tokens slide out at the left); `parts.resize(i, tokens, t)`.
- **Fixtures:** a 128k limit with 5 segments; an overflow with truncation; a tiny 4k limit.

### T-036 · `ai_token_distribution` · Next-token probabilities and sampling · P1
- **For:** temperature, top-p, why outputs vary, determinism settings.
- **Shows:** the context so far (a short line), then candidate next tokens as horizontal bars with percentages; a
  temperature dial and a top-p cut line; a sampled token highlighted and appended.
- **Params:** `context` (content), `candidates` (content): `[{token, p}]` (the scene supplies the numbers);
  `temperature` (1.0), `topP` (1.0), `pick` (an index), `at` (-1).
- **Parts and states:** parts `bars[]`, `dial`, `cut`, `pick`;
  - `parts.setTemperature(v, t)`: re-shapes the bars, sharpening below 1 and flattening above, from the given logits
    (computed deterministically: p_i^(1/T), normalised);
  - `parts.setTopP(v, t)`: greys out the bars past the cut;
  - `parts.sample(i, t)`.
- **Fixtures:** 5 candidates at T=1; T=0.2 sharpens; top-p 0.9 with 8 candidates.
- **Avoid:** inventing probabilities in the component: the numbers come from the scene's grounded content.

### T-037 · `ai_llm_console` · LLM conversation console · P1
- **For:** how chat models work, system prompts, roles, streaming, tool calls, token usage, stop reasons.
- **Shows:** a console with role-labelled blocks (system, user, assistant, tool) in the mono face for prompts and the
  body face for answers; assistant text streams in; a footer with tokens in and out and the stop reason.
- **Extends:** `ui.chat` and RedTee `explain.chat_exchange`, which are chat apps. This is the developer's view with
  roles, tool blocks and usage.
- **Params:** `turns` (content): `[{role, text, tool?: {name, args, result}}]`, `usage` (content: `{in, out}`,
  optional), `stop` (content, optional), `w` (1300), `rows` (16), `at` (-1), `cps` (40, streaming speed).
- **Parts and states:** parts `turns[]`, `usage`; `parts.stream(i, t)`; `parts.add(turn, t)`; `parts.focus(i, t)`;
  `parts.redact(i, spans, t)` (for PII lessons).
- **Fixtures:** a system, user and assistant exchange; a tool call round trip; a long answer that scrolls.

### T-038 · `ai_tool_call` · Function or tool call card · P2
- **For:** agents, tool use, APIs from models, permissions.
- **Shows:** a call card (tool name, JSON arguments in mono, a permission badge: auto, ask, denied) and a result card
  under it; a connector from the model icon.
- **Params:** `name`, `args` (an object), `result` (an object or text) (all content); `permission`, `state`
  (`"pending" | "running" | "done" | "error" | "denied"`), `at` (-1), `w` (1000).
- **Parts and states:** parts `call`, `args`, `result`, `badge`; `parts.run(t)`; `parts.state(s, t)`;
  `parts.ask(t)` (an approval prompt appears with approve and deny).
- **Fixtures:** a weather lookup; a file delete awaiting approval; a denied payment call.

### T-039 · `ai_agent_trace` · Agent execution trace · P2
- **For:** how agents work step by step, debugging agents, observability, cost of loops.
- **Shows:** a collapsible tree:
  - a task at the root;
  - steps (think, act, observe) with tool icons, durations and token counts;
  - nested sub-calls;
  - a final answer at the bottom;
  - failed steps in accent3 with a retry under them.
- **Params:** `steps` (content: nested `{kind, label, tool?, ms?, tokens?, state?, children?}`), `w` (1200),
  `rows` (16), `at` (-1).
- **Parts and states:** parts `steps{path}`; `parts.play(t, dur)` reveals the steps in order;
  `parts.expand(path, t)`; `parts.focus(path, t)`; `parts.total(t)` shows the summed time and tokens.
- **Extends:** RedTee `agent.*` diagrams. Those are conceptual; this is the trace.
- **Fixtures:** 5 steps; a failure with a retry; a 3-level nesting with 20 steps.

### T-040 · `ai_attention_map` · Attention heat map · P3
- **For:** transformers explained, what a model looks at, interpretability basics.
- **Shows:** tokens along both axes and a grid of cells shaded by weight (field to accent); one row highlighted with
  lines from the query token to its strongest keys.
- **Params:** `tokens` (content), `weights` (content: a matrix), `focusRow`, `at` (-1), `cell` (48).
- **Parts and states:** parts `cells[r][c]`, `labels`; `parts.focusRow(r, t)`; `parts.reveal(t, dur)` (rows in
  order).
- **Fixtures:** 6 tokens; 12 tokens; a pronoun row pointing at its noun.

### T-041 · `ai_network_layers` · Neural network layers · P2
- **For:** what a neural network is, layers, training intuition, activations.
- **Shows:** columns of neurons (input, hidden, output) joined by weight lines; activations flow left to right as
  pulses; neurons light by activation value; optional labels on the input and output layers.
- **Params:** `layers` (content: counts or labels per layer), `activations` (content, optional: per layer, values
  0 to 1), `inputs` and `outputs` labels (content), `at` (-1), `w` (1500), `h` (800).
- **Parts and states:** parts `neurons[][]`, `edges[][]`; `parts.forward(t, dur)`; `parts.backward(t, dur)` (a
  gradient sweep right to left in accent2); `parts.set(layer, values, t)`.
- **Engines:** blueprint draws it as a drafted schematic; the hologram engine (planned) as a glowing lattice.
- **Fixtures:** 3-4-2; 4-8-8-3 with labels; 6 layers of 10 (neurons thinned with an ellipsis).

### T-042 · `ai_training_curves` · Training and validation curves · P2
- **For:** overfitting, early stopping, evaluation, data size.
- **Shows:** axes (epoch, loss or metric); a train line and a validation line drawn over time; the overfit gap
  shaded; an early-stopping marker at the best validation point.
- **Params:** `train`, `val` (content: series), `metric` (content: a label), `best` (an index, optional), `at` (-1),
  `w` (1400), `h` (700).
- **Parts and states:** parts `axes`, `train`, `val`, `gap`, `marker`; `parts.play(t, dur)`; `parts.stop(i, t)`.
- **Fixtures:** a healthy fit; overfitting after epoch 12; noisy validation.

### T-043 · `ai_eval_scorecard` · Model evaluation scorecard · P2
- **For:** choosing models, evals, regression testing of prompts, quality gates for AI features.
- **Shows:** a table of models or prompt versions against tests or benchmarks, with scores, the best per row marked,
  a pass threshold line and a summary column.
- **Params:** `rows` and `cols` (content), `scores` (content: a matrix), `threshold` (optional), `higherIsBetter`
  (true), `at` (-1), `w` (1400).
- **Parts and states:** parts `cells[r][c]`, `best[]`; `parts.reveal(byCol, t)`; `parts.mark(r, c, t)`.
- **Fixtures:** 3 models by 4 tests; prompt v1 to v4 by 6 checks with a threshold; 6 by 10.

### T-044 · `ai_confusion_matrix` · Confusion matrix with precision and recall · P3
- **For:** classifiers, false positives in fraud or spam, model quality.
- **Shows:** an n-by-n grid of counts shaded by size, labelled actual and predicted axes, the diagonal emphasised,
  and precision and recall per class at the edges.
- **Extends:** RedTee `stats.error_matrix_2x2`. This is n by n, with derived metrics.
- **Params:** `labels` and `counts` (content), `at` (-1), `cell` (110).
- **Parts and states:** parts `cells[r][c]`, `precision[]`, `recall[]`; `parts.focusCell(r, c, t)` (explains one
  error type); `parts.reveal(t, dur)`.
- **Fixtures:** 2x2 spam; 3x3; 6x6.

### T-045 · `ai_guardrails` · AI guardrail pipeline · P1
- **For:** responsible AI, safety filters, data leakage prevention, policy enforcement.
- **Shows:** user input, then input checks (PII, prompt injection, topic policy) as gates, then the model, then
  output checks (toxicity, grounding, PII), then the response. Each gate shows pass, flag or block; a blocked request
  turns back with a reason.
- **Params:** `input` (content), `inputChecks`, `outputChecks` (content: `[{name, result}]`), `outcome` (content),
  `at` (-1), `w` (1700).
- **Parts and states:** parts `gates[]`, `model`, `token`; `parts.run(t)` (a token passes gate by gate, each resolving
  in turn); `parts.block(gateIndex, reason, t)`.
- **Fixtures:** all pass; an injection blocked at input; a PII leak caught at output.

### T-046 · `ai_model_card` · Model card · P3
- **For:** AI governance, choosing a model, documenting an AI system.
- **Shows:** a spec sheet with name, provider (generic), context size, modalities, intended use, known limits, data
  cut-off and an evaluation summary; labelled fields in two columns.
- **Params:** `fields` (content: `[[label, value]]`), `limits` (content: list), `w` (1000), `at` (-1).
- **Parts and states:** parts `fields[]`, `limits[]`; `parts.focus(i, t)`.
- **Fixtures:** a chat model; a vision model; a long limits list.

### T-047 · `ai_prompt_template` · Prompt template with variables · P2
- **For:** prompt engineering, templating, injection risk (user text in a template), reuse.
- **Shows:** a template in mono with `{variables}` as chips; values fly in and replace the chips; the filled prompt
  is shown, with a user-controlled value outlined as untrusted.
- **Extends:** RedTee `explain.prompt_anatomy`, which annotates a prompt's parts. This one fills variables.
- **Params:** `template` (content), `values` (content: a map), `untrusted` (keys), `at` (-1), `w` (1300).
- **Parts and states:** parts `chips{key}`, `filled`; `parts.fill(key, t)`; `parts.fillAll(t, gap)`.
- **Fixtures:** a support reply template; a summary prompt with a long document variable; an injection attempt in a
  value.

### T-048 · `ai_vector_results` · Vector search results · P2
- **For:** RAG ingestion and retrieval, semantic search, relevance, grounding.
- **Shows:** the query at the top; ranked result cards, each with a similarity score bar, the source name and a
  snippet; a top-k cut line; the chosen chunks flow onward.
- **Extends:** RedTee `concept.rag_grounding` (the concept) and `concept.neighbourhood_query` (the vector space).
  This is the results list.
- **Params:** `query` (content), `results` (content): `[{source, snippet, score}]`, `k` (3), `at` (-1), `w` (1300).
- **Parts and states:** parts `results[]`, `cut`; `parts.rank(t)` (cards sort themselves by score); `parts.pick(t)`;
  `parts.mark(i, tone, t)` (a stale or wrong source).
- **Fixtures:** 5 results with k=3; a low-relevance set (all below a threshold); long snippets.

### T-049 · `ai_chunking` · Document chunking · P3
- **For:** RAG pipelines, chunk size and overlap, why answers miss context.
- **Shows:** a document's text block split into chunks by brackets, with overlaps shaded; each chunk becomes a card
  with an id and a token count; a too-small chunk cuts a sentence in half (marked).
- **Params:** `text` (content), `chunks` (content: character ranges with ids), `at` (-1), `w` (1500).
- **Parts and states:** parts `brackets[]`, `cards[]`; `parts.split(t, dur)`; `parts.mark(i, t)`.
- **Fixtures:** 3 chunks without overlap; 5 with overlap; a bad split mid-sentence.

### T-050 · `ai_dataset_sample` · Labelled dataset sample · P3
- **For:** training data quality, label noise, bias, train, validation and test splits.
- **Shows:** a table of examples with label chips; suspicious labels flagged; a split bar under it (train,
  validation, test percentages).
- **Params:** `columns`, `rows`, `labels` (content), `flags` (row indexes), `split` (content: `{train, val, test}`),
  `at` (-1).
- **Parts and states:** parts `rows[]`, `flags[]`, `split`; `parts.flag(i, t)`; `parts.relabel(i, label, t)`.
- **Fixtures:** sentiment; images described as text; an imbalanced dataset.

### T-051 · `ai_human_review` · Human-in-the-loop review queue · P2
- **For:** AI governance, approval workflows, confidence thresholds, oversight.
- **Shows:** items arriving with the model's suggestion and a confidence bar; those under a threshold route to a
  human reviewer panel with approve, edit or reject; counters for automated and reviewed.
- **Params:** `items` (content: `[{text, suggestion, confidence}]`), `threshold`, `at` (-1), `w` (1500).
- **Parts and states:** parts `items[]`, `queue`, `counters`; `parts.route(t, gap)`; `parts.decide(i, action, t)`.
- **Fixtures:** 6 items with 2 reviewed; all high confidence; a threshold change re-routing items.

### T-052 · `ai_cost_meter` · Token cost and latency meter · P2
- **For:** AI cost awareness, model choice, caching, prompt length.
- **Shows:** a meter with tokens in, tokens out, the cost per call and the cost running up as calls happen, with
  latency per call; a comparison of two models side by side.
- **Params:** `calls` (content: `[{in, out, ms}]`), `prices` (content: `{in, out}` per unit), `unit` (content),
  `models` (content, optional: 1 or 2), `at` (-1).
- **Parts and states:** parts `counters`, `bars[]`; `parts.play(t, gap)`; `parts.cacheHit(i, t)` (the input cost
  drops for a cached call).
- **Fixtures:** 5 calls, one model; two models compared; a cached prompt.
- **Avoid:** prices built into the component: they come from the scene's grounded facts.

---

## Family D. Data and charts (`viz_`): 12 items

These are charts Loom and RedTee do not have yet. Bars, line, scatter, histogram, waterfall, funnel, gauge, bar race
and the 2x2 matrix already exist.

**Common rules for every chart:**
- axes and gridlines are muted;
- the named series is in accent;
- values are lettered with their unit;
- labels never sit on a line;
- `at` = -1 draws the chart complete;
- `parts.play(t, dur)` draws the data in reading order;
- `parts.focus(key, t)` dims everything else;
- `parts.note(key, text, t)` adds a pinned note in data space (the note stays on its data point if the scale
  changes);
- data comes in as content, and nothing is invented.

### T-053 · `viz_donut` · Donut or pie with labels · P1
- **For:** shares of a whole: budget split, survey answers, time spent, incident causes.
- **Params:** `slices` (content: `[{label, value}]`), `unit`, `hole` (0.6; 0 = pie), `total` (content, optional:
  shown in the hole), `at` (-1).
- **Parts and states:** `slices[]`, `labels[]`; `parts.explode(i, t)` (a slice slides out); `parts.merge(indices,
  label, t)` (small slices merge into "Other").
- **Fixtures:** 3 slices; 7 with tiny ones merged; one slice of 92 percent.

### T-054 · `viz_stacked_bars` · Stacked and 100 percent bars · P1
- **For:** composition over categories or time: headcount by team, ticket types per month.
- **Params:** `categories`, `series` (content), `mode` (`"stack" | "percent"`), `orientation`, `at` (-1).
- **Parts and states:** `bars[c][s]`, `legend`; `parts.switchMode(mode, t)` (it morphs between counts and percent).
- **Fixtures:** 4 by 3; 12 months by 5; a negative segment refused with a clear error.

### T-055 · `viz_area_stack` · Stacked area over time · P2
- **For:** growth of parts over time: cloud spend by service, users by plan.
- **Params:** `x` and `series` (content), `at` (-1).
- **Parts and states:** `areas[]`; `parts.isolate(i, t)` lifts one series to the baseline.
- **Fixtures:** 3 series over 12 points; 6 series; a series that drops to 0.

### T-056 · `viz_heatmap` · Heat map grid · P2
- **For:** risk by area, usage by hour and day, skills by team, test coverage by module.
- **Params:** `rows`, `cols`, `values` (content), `scale` (`{min, max}`), `legend` (true), `at` (-1).
- **Parts and states:** `cells[r][c]`; `parts.reveal(order, t)` (by row, column or value); `parts.mark(r, c, t)`.
- **Fixtures:** 7 by 24 hours; 5 by 5; 12 by 30 with labels thinned.

### T-057 · `viz_calendar_heatmap` · Calendar activity grid · P3
- **For:** habits, deployments per day, attendance, learning streaks.
- **Params:** `start` (a date), `values` (content: a per-day list), `weeks` (26), `at` (-1).
- **Parts and states:** `days[]`; `parts.play(t, dur)` (days fill in time order); `parts.streak(from, to, t)`.
- **Fixtures:** 26 weeks; a year; a gap in the middle.

### T-058 · `viz_sankey` · Flow (Sankey) diagram · P2
- **For:** where money, users, energy or tickets go: budget allocation, a conversion funnel with branches, energy
  use.
- **Params:** `nodes`, `links` (content: `[{from, to, value}]`), `at` (-1), `w` (1700), `h` (800).
- **Parts and states:** `nodes{id}`, `links[]`; `parts.flow(t, dur)` (the links grow left to right);
  `parts.trace(nodeId, t)` (everything through one node).
- **Fixtures:** 3 stages and 6 links; 4 stages and 15 links; one dominant flow.

### T-059 · `viz_treemap` · Treemap · P3
- **For:** proportions with hierarchy: cost by department and team, a codebase by module, storage use.
- **Params:** `tree` (content: nested `{label, value?, children?}`), `at` (-1), `w`, `h`.
- **Parts and states:** `tiles{path}`; `parts.zoom(path, t)` (a tile grows to fill the frame and shows its
  children).
- **Fixtures:** 6 leaves; 3 levels; a tiny tile without a label (its label shows on focus).

### T-060 · `viz_bullet` · Bullet chart (actual against target) · P2
- **For:** KPIs against targets with bands (poor, ok, good): sales, SLAs, training completion.
- **Params:** `rows` (content: `[{label, value, target, bands: [a, b, c]}]`), `unit`, `at` (-1).
- **Parts and states:** `rows[]`; `parts.fill(i, t)`.
- **Fixtures:** 3 KPIs; 8 KPIs; a value over target.

### T-061 · `viz_slope` · Slope chart (before and after) · P2
- **For:** change between two moments: survey scores before and after training, costs this year against last.
- **Params:** `items` (content: `[{label, before, after}]`), `labels` (content: `[beforeLabel, afterLabel]`),
  `at` (-1).
- **Parts and states:** `lines[]`; `parts.play(t, dur)`; `parts.focus(i, t)`.
- **Fixtures:** 5 items; 12 with crossing lines (labels kept apart); one item flat.

### T-062 · `viz_small_multiples` · Sparkline grid · P3
- **For:** many metrics at once: one per region, team or service; spotting the odd one out.
- **Params:** `panels` (content: `[{label, series}]`), `cols` (4), `sharedScale` (true), `at` (-1).
- **Parts and states:** `panels[]`; `parts.flag(i, t)`.
- **Fixtures:** 8 panels; 16; one anomaly.

### T-063 · `viz_ranked_dots` · Ranked dot plot (lollipop) · P2
- **For:** rankings: top causes, most common errors, scores by team.
- **Params:** `items` (content: `[{label, value}]`), `unit`, `sort` (true), `at` (-1).
- **Parts and states:** `rows[]`; `parts.play(t, dur)` (dots slide out from the axis); `parts.reorder(newValues, t)`.
- **Fixtures:** 6 items; 15; ties.

### T-064 · `viz_data_table` · Data table with conditional formatting · P1
- **For:** any tabular facts: comparisons, schedules, price lists, results. Every corporate lesson has some.
- **Params:**
  - `columns` (content: `[{name, align?, format?}]`), `rows` (content);
  - `rules` (open: `[{col, when: ">" | "<" | "=", value, tone}]`), `maxRows`, `zebra` (true), `at` (-1).
- **Parts and states:** `cells[r][c]`, `header[]`; `parts.sort(col, t)` (rows re-order with a travel);
  `parts.highlightRow(r, t)`; `parts.highlightCol(c, t)`.
- **Extends:** `dev_db_table` (T-012), which shows a query and types; this is the presentation table.
- **Fixtures:** 4 by 3; 10 by 6 with rules; long cell text with wrapping.

---

## Family E. Security, privacy and compliance (`sec_`): 12 items

### T-065 · `sec_redflag_callouts` · Red-flag annotations over any artefact · P1
- **For:** phishing awareness, spotting mistakes in a document, an invoice fraud check, a risky configuration.
- **Shows:** numbered red-flag markers that attach to points on another element (an email from `ui.mail`, a browser
  frame, a document), each with a short label on a leader; a counter of flags found.
- **Params:** `target` (an element), `flags` (content: `[{at: [x, y] or a part name, label}]`), `tone` (accent3),
  `at` (-1), `gap` (0.6 s between flags).
- **Parts and states:** `markers[]`, `labels[]`, `counter`; `parts.reveal(i, t)`; `parts.revealAll(t, gap)`;
  `parts.dim(t)` (dims the target except at the flags).
- **Fixtures:** 3 flags on an email; 6 on an invoice-like document; labels that must avoid each other.

### T-066 · `sec_password_meter` · Password strength meter · P2
- **For:** password policy, passphrases, why length beats complexity.
- **Shows:** a password field (masked or shown), a strength bar in 4 or 5 steps, the estimated time to crack, and
  rule checks with ticks.
- **Params:** `value` (content), `masked` (true), `strength` (content: 0 to 4, supplied by the scene), `crack`
  (content: a time label), `rules` (content: `[{text, ok}]`), `at` (-1).
- **Parts and states:** `field`, `bar`, `rules[]`; `parts.type(text, t)`; `parts.strength(n, crack, t)`.
- **Fixtures:** a weak password; a strong passphrase; a reused one flagged.

### T-067 · `sec_mfa_prompt` · MFA approval prompt · P1
- **For:** MFA, push fatigue attacks, number matching, approving only what you started.
- **Shows:** a phone-sized prompt card: "Sign-in request", location, app, a number-matching code, approve and deny
  buttons; repeated requests stack for a fatigue attack.
- **Params:** `title`, `details` (`[[label, value]]`), `code` (all content); `stack` (1), `at` (-1); `outcome`
  (`"approve" | "deny" | "none"`).
- **Parts and states:** `card`, `buttons`, `code`; `parts.request(t)`; `parts.spam(n, t, gap)`; `parts.tap(button,
  t)` (with the cursor or a finger hint).
- **Engines:** living screencast (planned): it sits in a phone device frame.
- **Fixtures:** a legitimate request; a fatigue attack of 6; number matching with a mismatch.

### T-068 · `sec_login_states` · Login form and its security states · P2
- **For:** account security, lockout, credential stuffing, SSO, "never type your password here".
- **Shows:** a login card (logo slot, username, password, a sign-in button, an SSO button) with states: error, locked,
  captcha, success, a suspicious-location warning.
- **Extends:** `ui.field` and `ui.button`. This composes them into a form with security states.
- **Params:** `title` (content), `username` (content), `state`, `message` (content), `at` (-1).
- **Parts and states:** `fields[]`, `button`, `message`; `parts.attempt(ok, t)`; `parts.lock(t)`.
- **Fixtures:** a failed attempt; locked after 5; SSO.

### T-069 · `sec_access_matrix` · Roles and permissions matrix · P1
- **For:** least privilege, access reviews, segregation of duties, joiner-mover-leaver.
- **Shows:** a grid of roles (rows) by permissions or systems (columns) with grant marks; an excessive grant flagged;
  a conflict pair (segregation of duties) linked.
- **Params:** `roles`, `perms`, `grants` (content: a matrix of `"none" | "read" | "write" | "admin"`), `flags`
  (cells), `conflicts` (pairs), `at` (-1).
- **Parts and states:** `cells[r][c]`; `parts.revoke(r, c, t)`; `parts.grant(r, c, level, t)`; `parts.review(t, dur)`
  (a sweep ticks rows).
- **Fixtures:** 4 by 5; 8 by 10 with conflicts; a mover keeping old access.

### T-070 · `sec_data_labels` · Data classification labels · P1
- **For:** information handling: public, internal, confidential, restricted; marking documents and emails.
- **Shows:** a set of label badges (a shape and a tone per level, with the level name); applied to a document or
  email header; a "handling rules" card per level.
- **Params:** `levels` (content: `[{name, rules: [text]}]`), `active` (index), `target` (an element, optional),
  `at` (-1).
- **Parts and states:** `badges[]`, `rules`; `parts.apply(levelIndex, target, t)`; `parts.compare(t)`.
- **Fixtures:** 4 levels; 3 levels; a mislabelled document corrected.

### T-071 · `sec_threat_cards` · Threat model cards (STRIDE-style) · P3
- **For:** secure design, threat modelling, architecture review.
- **Shows:** cards per threat category with an icon, the threat, an example and a mitigation; they attach to
  components of a diagram by leaders.
- **Params:** `threats` (content: `[{category, threat, mitigation, at?: [x, y]}]`), `at` (-1).
- **Parts and states:** `cards[]`; `parts.mitigate(i, t)` (the mitigation is stamped on).
- **Fixtures:** 6 categories; 3 threats on one diagram; long text.

### T-072 · `sec_vuln_card` · Vulnerability severity card · P2
- **For:** patch priority, CVSS-style severity, exposure, "fix this first".
- **Shows:** a card with an identifier slot, a severity band (low to critical) with a score dial, affected asset
  chips, exploit status and a fix deadline.
- **Params:** `id`, `title`, `score`, `severity`, `assets`, `due` (all content); `at` (-1).
- **Parts and states:** `dial`, `band`, `chips[]`; `parts.score(v, t)`; `parts.patched(t)`.
- **Fixtures:** critical with a known exploit; medium; a list of 3 cards ranked.

### T-073 · `sec_audit_log` · Audit trail · P2
- **For:** accountability, investigations, SOX-style controls, "who changed what, when".
- **Shows:** a table of who, what, when, from where and the result; a suspicious row highlighted; filtering by user.
- **Extends:** `viz_data_table` (T-064). This adds the audit columns, the suspicious-row logic and replay.
- **Params:** `entries` (content), `mark` (indexes), `at` (-1).
- **Parts and states:** `rows[]`; `parts.filter(user, t)`; `parts.replay(t, gap)`.
- **Fixtures:** 8 entries; 25 with a filter; a deletion at 3 am marked.

### T-074 · `sec_consent_banner` · Consent and privacy notice · P3
- **For:** GDPR-style consent, cookie choices, data subject rights, dark patterns to avoid.
- **Shows:** a banner or modal with purposes and toggles (necessary is locked on), accept and reject buttons of equal
  weight, and a "manage" panel.
- **Params:** `title`, `text`, `purposes` (all content); `layout` (`"banner" | "modal"`), `at` (-1).
- **Parts and states:** `toggles[]`, `buttons`; `parts.toggle(i, on, t)`; `parts.choose(which, t)`.
- **Fixtures:** 3 purposes; 6; a dark-pattern version for "spot the problem".

### T-075 · `sec_pii_flow` · Personal data flow map · P2
- **For:** privacy by design, data mapping, retention, cross-border transfers.
- **Shows:** systems as nodes, personal data moving along links as tokens with a data-type tag; region frames; a
  retention clock on stores; a risky link marked.
- **Params:** `systems`, `flows` (content: `[{from, to, data, region?}]`), `regions` (content, optional), `at` (-1).
- **Parts and states:** `nodes{id}`, `links[]`; `parts.flow(i, t)`; `parts.mark(i, t)`; `parts.erase(nodeId, t)`
  (deletion on request).
- **Fixtures:** 4 systems; 8 with 2 regions; a deletion request traced.

### T-076 · `sec_url_inspector` · URL anatomy and look-alike check · P1
- **For:** phishing awareness, spotting fake domains, link safety.
- **Shows:** a URL broken into labelled parts (scheme, subdomain, registered domain, path, query), with the
  registered domain boxed. Look-alike characters are marked (`rn` for `m`, `0` for `o`, extra words before the real
  domain).
- **Params:** `url` (content), `parts` (content: character ranges with roles, from the scene), `realDomain`
  (content, optional, for comparison), `at` (-1).
- **Parts and states:** `segments[]`, `brackets[]`; `parts.explain(t, gap)`; `parts.compare(t)`.
- **Fixtures:** a safe URL; a subdomain trick; a character swap.

---

## Family F. Business, management and operations (`biz_`): 17 items

### T-077 · `biz_org_chart` · Organisation chart · P1
- **For:** who does what, reporting lines, escalation paths, new-starter orientation, re-organisations.
- **Shows:** a tree of role cards (a role, an optional name, a team colour band and an optional avatar slot that takes
  a designed character or a monogram); orthogonal connectors; one branch highlighted.
- **Params:** `nodes` (content: `[{id, role, name?, parent?, team?}]`), `layout` (`"top" | "left"`), `at` (-1),
  `w` (1700), `h` (900).
- **Parts and states:** `cards{id}`, `links[]`; `parts.reveal(order, t)` (top down); `parts.focus(id, t)`;
  `parts.move(id, newParent, t)` (a re-org: the card travels and its links redraw); `parts.vacant(id, t)`.
- **Fixtures:** 7 nodes; 20 nodes in 4 levels; a move.

### T-078 · `biz_raci_matrix` · RACI matrix · P1
- **For:** responsibilities, ownership, decision rights, project kick-offs.
- **Shows:** tasks (rows) by roles (columns) with R, A, C and I chips in distinct tones; a row with no A, or two As,
  flagged.
- **Params:** `tasks`, `roles`, `cells` (content: letters), `at` (-1).
- **Parts and states:** `cells[r][c]`, `flags[]`; `parts.fill(t, gap)`; `parts.fix(r, c, letter, t)`.
- **Fixtures:** 5 by 4; 10 by 6 with a missing A; long task names.

### T-079 · `biz_okr_tree` · Objectives and key results · P2
- **For:** goal setting, alignment, cascading goals, progress reviews.
- **Shows:** an objective card at the top; key-result cards under it with a progress bar and a confidence dot;
  initiatives under the key results; a link to a parent objective.
- **Params:** `objective`, `krs` (content: `[{text, progress, confidence?}]`), `initiatives` (content, optional),
  `at` (-1).
- **Parts and states:** `objective`, `krs[]`, `bars[]`; `parts.progress(i, value, t)`; `parts.focus(i, t)`.
- **Fixtures:** 1 objective with 3 key results; with initiatives; 5 key results.

### T-080 · `biz_kpi_scorecard` · KPI scorecard with targets and trends · P1
- **For:** management reporting, business reviews, team health, service levels.
- **Shows:** a scorecard table: KPI, actual, target, a status chip (on track, at risk, off track) and a trend arrow
  with a sparkline.
- **Extends:** RedTee `explain.kpi_tiles` (tiles of figures). This adds targets, status and trends in a table.
- **Params:** `rows` (content: `[{kpi, actual, target, unit, status, trend: [values]}]`), `at` (-1).
- **Parts and states:** `rows[]`; `parts.update(i, actual, t)` (counts, then re-evaluates the status).
- **Fixtures:** 4 KPIs; 9 KPIs; one far off target.

### T-081 · `biz_kanban` · Kanban board · P1
- **For:** agile basics, work in progress limits, flow, blocked work, team rituals.
- **Shows:** columns (to do, doing, review, done) with WIP limits in their headers; cards with a title, an owner chip
  and a tag; a blocked card with a red flag.
- **Params:** `columns` (content: `[{name, wip?}]`), `cards` (content: `[{id, title, col, owner?, tag?, blocked?}]`),
  `at` (-1), `w` (1700), `h` (850).
- **Parts and states:** `columns[]`, `cards{id}`; `parts.move(id, col, t)` (it travels, and the WIP counter updates;
  over the limit, the header turns accent2); `parts.block(id, t)`; `parts.add(card, t)`.
- **Fixtures:** 4 columns and 8 cards; over a WIP limit; 20 cards in a scrolling column.

### T-082 · `biz_gantt` · Gantt chart · P2
- **For:** project planning, dependencies, the critical path, slippage.
- **Shows:** tasks as bars on a time axis, dependency arrows, milestones as diamonds, a "today" line and the critical
  path in accent.
- **Params:** `tasks` (content: `[{id, label, start, end, deps?, milestone?}]`), `axis` (content: labels), `today`,
  `at` (-1), `w` (1700).
- **Parts and states:** `bars{id}`, `deps[]`, `today`; `parts.slip(id, days, t)` (it moves along with everything that
  depends on it); `parts.critical(t)`.
- **Fixtures:** 6 tasks; 15 with dependencies; a slip.

### T-083 · `biz_roadmap_lanes` · Roadmap (now, next, later) · P2
- **For:** product and strategy communication, priorities, trade-offs.
- **Shows:** three columns or quarters with theme lanes; items as cards; an item moving from later to now.
- **Params:** `columns`, `lanes`, `items` (content), `at` (-1).
- **Parts and states:** `cards{id}`; `parts.move(id, col, t)`; `parts.drop(id, t)`.
- **Fixtures:** 3 by 3; quarters by 4 lanes; a dropped item.

### T-084 · `biz_decision_record` · Decision record card · P2
- **For:** decision making, accountability, architecture decisions, governance.
- **Shows:** a card with the decision title, context, options considered (with pros and cons ticks), the decision, the
  owner and date, and a status (proposed, accepted, superseded).
- **Params:** `title`, `context`, `options`, `decision`, `owner`, `date`, `status` (all content); `at` (-1).
- **Parts and states:** `options[]`, `status`; `parts.choose(i, t)`; `parts.supersede(t)`.
- **Fixtures:** 2 options; 4 options; a superseded record.

### T-085 · `biz_risk_heatmap` · Risk register heat map · P1
- **For:** risk management, likelihood against impact, mitigation effects, compliance.
- **Shows:** a 5x5 likelihood-by-impact grid shaded from low to high; risks as numbered dots placed in cells; a
  mitigation arrow moving a risk to a lower cell; a side list naming the risks.
- **Params:** `risks` (content: `[{id, label, l, i}]`), `size` (5), `at` (-1).
- **Parts and states:** `cells`, `dots{id}`, `list`; `parts.mitigate(id, l2, i2, t)`; `parts.focus(id, t)`.
- **Fixtures:** 4 risks; 12 risks with 3 in one cell (they spread within the cell); a mitigation.

### T-086 · `biz_stakeholder_map` · Stakeholder map · P3
- **For:** change management, communication planning, influence.
- **Shows:** a 2x2 of influence by interest with labelled quadrants (manage closely, keep satisfied, keep informed,
  monitor); stakeholder chips placed; arrows for movement over a project.
- **Extends:** RedTee `concept.matrix_2x2`. This adds chips, movement and quadrant actions.
- **Params:** `stakeholders` (content: `[{label, influence, interest}]`), `at` (-1).
- **Parts and states:** `chips[]`; `parts.move(i, inf, int, t)`.
- **Fixtures:** 6 chips; 12; a move.

### T-087 · `biz_swimlane_process` · Cross-functional swimlane process · P1
- **For:** processes across teams: hiring, procurement, incident handling, customer onboarding, handoffs.
- **Shows:**
  - horizontal lanes per role or team (a label at the left);
  - steps as rounded boxes and decisions as diamonds;
  - connectors across lanes with orthogonal routing;
  - start and end markers;
  - a token travelling the path.
- **Extends:** `process.flow`. This adds lanes, decisions and cross-lane routing.
- **Params:**
  - `lanes` (content);
  - `steps` (content: `[{id, lane, label, kind: "step" | "decision" | "start" | "end"}]`);
  - `links` (content: `[{from, to, label?}]`);
  - `at` (-1), `w` (1750), `h` (850).
- **Parts and states:** `lanes[]`, `steps{id}`, `links[]`, `token`; `parts.walk(path, t, gap)`;
  `parts.bottleneck(id, t)`.
- **Engines:** blueprint uses its card and connect calls; whiteboard draws it by hand.
- **Fixtures:** 3 lanes and 6 steps; 5 lanes and 14 steps with 2 decisions; a loop back.

### T-088 · `biz_invoice` · Invoice or purchase order document · P2
- **For:** finance processes, invoice fraud (a changed bank account), approvals, three-way match.
- **Shows:** a document with a header (vendor slot, invoice number, date), line items in a table, totals, and a
  payment details box that can be marked as changed.
- **Extends:** `document.page`. This adds the invoice structure and the "changed details" state.
- **Params:** `vendor`, `number`, `date`, `lines`, `totals`, `payment` (all content); `at` (-1).
- **Parts and states:** `lines[]`, `totals`, `payment`; `parts.change(field, newValue, t)` (the old value struck, the
  new one written in accent3); `parts.match(po, t)` (ticks against a purchase order).
- **Fixtures:** 3 lines; 10 lines; changed bank details.

### T-089 · `biz_approval_chain` · Multi-step approval chain · P2
- **For:** delegation of authority, spend approvals, change approval boards, sign-off.
- **Shows:** approver nodes in sequence with a role and a threshold; a request token moving through them; each node
  with an SLA timer and a state (waiting, approved, rejected, escalated).
- **Params:** `steps` (content: `[{role, limit?, sla?}]`), `amount` (content), `at` (-1).
- **Parts and states:** `nodes[]`, `token`; `parts.advance(i, state, t)`; `parts.skip(i, t)` (under its threshold).
- **Fixtures:** 3 steps; 5 with a rejection; a skip under threshold.

### T-090 · `biz_meeting_agenda` · Meeting agenda with timer · P3
- **For:** effective meetings, facilitation, time-boxing.
- **Shows:** agenda items with an owner chip and a time box; a running clock; the current item highlighted; items
  overrunning in accent2.
- **Params:** `items` (content: `[{text, owner?, minutes}]`), `at` (-1), `speed` (compressed minutes a second).
- **Parts and states:** `items[]`, `clock`; `parts.run(t, dur)`; `parts.overrun(i, t)`.
- **Fixtures:** 4 items; 8; an overrun.

### T-091 · `biz_survey_likert` · Survey results (Likert) · P2
- **For:** engagement surveys, training feedback, customer satisfaction.
- **Shows:** diverging stacked bars per question (strongly disagree to strongly agree) centred on neutral, with net
  scores at the right.
- **Params:** `questions` (content), `counts` (content: 5 per question), `at` (-1).
- **Parts and states:** `bars[]`; `parts.play(t, dur)`; `parts.focus(i, t)`.
- **Fixtures:** 4 questions; 10; one polarised question.

### T-092 · `biz_journey_emotion` · Customer or employee journey with an emotion curve · P2
- **For:** customer experience, employee experience, moments that matter, service design.
- **Shows:** stages across the top, touchpoints under each, and an emotion curve above a neutral line (highs and
  lows) with pain points marked.
- **Extends:** RedTee `concept.journey_path`. This adds the emotion curve, touchpoints and pain points.
- **Params:** `stages` (content: `[{name, touchpoints, emotion}]`), `pains` (content: indexes with notes), `at` (-1).
- **Parts and states:** `stages[]`, `curve`, `pains[]`; `parts.walk(t, dur)` (a marker travels the curve).
- **Fixtures:** 5 stages; 8; a deep low point.

### T-093 · `biz_pricing_tiers` · Plans and pricing comparison · P3
- **For:** sales enablement, product knowledge, choosing a plan for a customer.
- **Shows:** 2 to 4 plan columns with a name, price, feature ticks and a recommended badge; a feature row
  highlighted across plans.
- **Params:** `plans` (content: `[{name, price, period, features: [bool or text]}]`), `featureNames` (content),
  `recommended`, `at` (-1).
- **Parts and states:** `plans[]`, `rows[]`; `parts.recommend(i, t)`; `parts.highlightFeature(r, t)`.
- **Fixtures:** 3 plans; 4 plans and 12 features; long feature names.

---

## Family G. People, HR and learning (`hr_`): 16 items

People in these items are designed characters or role markers, never drawn by the component: an avatar slot takes a
character kit from the art lane (Family K) or a monogram disc.

### T-094 · `hr_profile_card` · Employee profile card · P1
- **For:** onboarding ("meet your buddy"), team intros, scenarios with named roles.
- **Shows:** a card with an avatar slot, name, role, team, location or time zone, two or three skill chips and a
  status dot (available, in a meeting, away).
- **Params:** `name`, `role`, `team`, `place`, `chips` (all content); `status`, `avatar` (a slot function or a
  monogram), `at` (-1).
- **Parts and states:** `avatar`, `fields[]`, `chips[]`, `status`; `parts.status(s, t)`.
- **Fixtures:** short; long names and titles; no avatar (monogram).

### T-095 · `hr_onboarding_path` · Onboarding path (first day to 90 days) · P1
- **For:** onboarding programmes, the first week, 30-60-90 plans, buddy systems.
- **Shows:** a path with milestones (day 1, week 1, day 30, 60, 90); each milestone opens to 2 or 3 tasks with ticks;
  a "you are here" marker.
- **Params:** `milestones` (content: `[{label, tasks: [text]}]`), `current` (index), `at` (-1), `w` (1700).
- **Parts and states:** `milestones[]`, `tasks[][]`, `marker`; `parts.advance(i, t)`; `parts.tick(i, j, t)`.
- **Fixtures:** 5 milestones; 7 with 3 tasks each; the marker at the start.

### T-096 · `hr_rating_scale` · Rating scale with behavioural anchors · P2
- **For:** performance reviews, calibration, competency assessment.
- **Shows:** a scale of 4 or 5 levels, each with a label and a short behavioural anchor; a selected level; an evidence
  note pinned to it.
- **Params:** `levels` (content: `[{label, anchor}]`), `selected`, `evidence` (content, optional), `at` (-1).
- **Parts and states:** `levels[]`, `pointer`; `parts.select(i, t)`; `parts.calibrate(from, to, t)` (the pointer
  moves with a reason).
- **Fixtures:** 5 levels; 4 levels; long anchors.

### T-097 · `hr_feedback_model` · Feedback model card (situation, behaviour, impact) · P1
- **For:** giving feedback, coaching, difficult conversations, manager training.
- **Shows:** three or four connected panels (situation, behaviour, impact, request or next step) filled with an
  example; a "say" and "avoid" pair under them.
- **Params:** `steps` (content: `[{label, text}]`), `say`, `avoid` (content, optional), `at` (-1).
- **Parts and states:** `panels[]`, `say`, `avoid`; `parts.reveal(i, t)`; `parts.contrast(t)`.
- **Model names:** the model's labels are content. The same component serves SBI, STAR or any other model the lesson
  teaches.
- **Fixtures:** SBI; STAR (4 panels); long example text.

### T-098 · `hr_competency_radar` · Competency radar · P2
- **For:** skills profiles, development plans, role fit, self against manager assessment.
- **Shows:** a radar with 5 to 8 axes; one or two profiles as filled polygons (current and target); gaps marked.
- **Params:** `axes` (content), `profiles` (content: `[{label, values}]`), `max` (5), `at` (-1).
- **Parts and states:** `polygons[]`, `axes[]`; `parts.grow(i, t)`; `parts.gap(axis, t)`.
- **Fixtures:** 5 axes with 1 profile; 8 with 2; a single big gap.

### T-099 · `hr_skills_matrix` · Team skills matrix · P2
- **For:** team capability, cross-training, bus factor, succession.
- **Shows:** people (role markers) by skills, with level dots (0 to 4); a skill only one person has flagged as a
  single point of failure.
- **Params:** `people`, `skills`, `levels` (content), `at` (-1).
- **Parts and states:** `cells[r][c]`; `parts.flagSpof(t)`; `parts.train(r, c, level, t)`.
- **Fixtures:** 5 by 6; 10 by 10; a single point of failure.

### T-100 · `hr_career_ladder` · Career ladder · P2
- **For:** career frameworks, promotions, growth conversations.
- **Shows:** rungs of levels (with titles) and the expectations per rung; two tracks side by side (individual
  contributor and manager), with crossing links; a person marker climbing.
- **Params:** `tracks` (content: `[{name, levels: [{title, expectations}]}]`), `marker`, `at` (-1).
- **Parts and states:** `rungs[][]`, `marker`; `parts.climb(track, level, t)`; `parts.cross(fromTrack, toTrack,
  level, t)`.
- **Fixtures:** 1 track of 5; 2 tracks; long expectations.

### T-101 · `hr_leave_tracker` · Leave and time-off balance · P3
- **For:** HR policy explainers, leave types, carry-over rules.
- **Shows:** balance rings or bars per leave type (used, booked, left), a small calendar strip with booked days, and
  a policy note.
- **Params:** `types` (content: `[{name, total, used, booked}]`), `days` (content, optional), `note` (content),
  `at` (-1).
- **Parts and states:** `rings[]`; `parts.book(type, n, t)`.
- **Fixtures:** 3 types; 5; an over-booked type.

### T-102 · `hr_payslip` · Payslip breakdown · P3
- **For:** pay explainers, deductions, benefits, tax basics (grounded in the organisation's documents).
- **Shows:** a payslip document: gross pay, then deductions as rows (tax, pension, benefits), then net pay; a
  waterfall view option from gross to net.
- **Params:** `items` (content: `[{label, amount, kind: "earn" | "deduct"}]`), `currency` (content), `view`
  (`"slip" | "waterfall"`), `at` (-1).
- **Parts and states:** `rows[]`, `net`; `parts.switchView(v, t)`.
- **Fixtures:** 5 items; 12; both views.

### T-103 · `hr_benefits_cards` · Benefits options · P3
- **For:** benefits enrolment, choosing a plan, wellbeing offers.
- **Shows:** cards per benefit or option with an icon, a name, cost to employee and what is covered; a choose
  state.
- **Params:** `options` (content), `chosen`, `at` (-1).
- **Parts and states:** `cards[]`; `parts.choose(i, t)`; `parts.compare(i, j, t)`.
- **Fixtures:** 3; 6; long coverage text.

### T-104 · `hr_interview_scorecard` · Structured interview scorecard · P2
- **For:** fair hiring, structured interviews, bias reduction, calibration.
- **Shows:** criteria rows with a rating scale and an evidence note per row; interviewers as columns for calibration;
  an overall recommendation.
- **Params:** `criteria`, `interviewers`, `ratings`, `notes`, `recommendation` (all content); `at` (-1).
- **Parts and states:** `cells[r][c]`, `overall`; `parts.score(r, c, v, t)`; `parts.discuss(r, t)` (a spread across
  interviewers is highlighted).
- **Fixtures:** 4 criteria by 1; 6 by 3 with a spread; long notes.

### T-105 · `hr_policy_ack` · Policy acknowledgement · P2
- **For:** compliance training, code of conduct, "read and confirm".
- **Shows:** a policy card with a title, a version and date, 3 key points, a scroll indicator, a confirm checkbox and
  a confirm button that unlocks after scrolling.
- **Params:** `title`, `version`, `points` (content), `at` (-1).
- **Parts and states:** `points[]`, `check`, `button`; `parts.scroll(t, dur)`; `parts.confirm(t)`.
- **Fixtures:** 3 points; 6; a long title.

### T-106 · `hr_mood_checkin` · Wellbeing check-in · P2
- **For:** wellbeing, psychological safety, team check-ins, stress awareness.
- **Shows:** a 5-step mood scale with simple faces (drawn from shapes: curves for mouth and brows, no character); a
  selected mood; an optional note and support links as chips.
- **Params:** `labels` (content), `selected`, `note` (content), `links` (content), `at` (-1).
- **Parts and states:** `faces[]`, `note`, `chips[]`; `parts.select(i, t)`.
- **Fixtures:** default labels supplied; selected low with support links; a team view (counts per face).

### T-107 · `hr_kudos_card` · Recognition card · P3
- **For:** recognition culture, values in action.
- **Shows:** a card with from and to roles, the value it recognises (a badge), a short message and reaction counts.
- **Params:** `from`, `to`, `value`, `message` (content); `at` (-1).
- **Parts and states:** `badge`, `message`, `reactions`; `parts.react(n, t)`.
- **Fixtures:** short; long message; a value badge only.

### T-108 · `hr_learning_path` · Learning path map · P1
- **For:** course structure, programme overviews, "where we are in the series", certification paths.
- **Shows:** modules as stations on a route (a metro-map feel with lines for tracks), each with a state (done,
  current, locked) and a duration; an elective branch.
- **Params:** `modules` (content: `[{id, title, minutes?, state, track?}]`), `links` (content), `at` (-1).
- **Parts and states:** `stations{id}`, `lines[]`, `marker`; `parts.complete(id, t)`; `parts.unlock(id, t)`;
  `parts.go(id, t)`.
- **Fixtures:** 5 modules in a line; 10 with 2 tracks; an elective branch.

### T-109 · `hr_branching_scenario` · Branching scenario (choose, see what happens) · P1
- **For:** ethics, customer service, harassment prevention, safety decisions, judgement training.
- **Shows:** a situation card; 2 to 4 choice cards; the chosen card expands into a consequence card (good, mixed or
  bad tone) with a short reason; the other choices stay visible, dimmed, and can be revealed in turn.
- **Extends:** `quiz.question` and `quiz.answer`. This is narrative branching with consequences, not right and wrong
  answers.
- **Params:** `situation` (content), `choices` (content: `[{text, outcome, tone, reason}]`), `pick`, `at` (-1).
- **Parts and states:** `situation`, `choices[]`, `outcomes[]`; `parts.choose(i, t)`; `parts.revealAll(t, gap)`.
- **Fixtures:** 2 choices; 4 choices with mixed outcomes; long text.

---

## Family H. App and screen interfaces (`ui_`): 13 items

These are the screens corporate lessons live in: software training, process walkthroughs and remote work. **Since 2026-10-16 the screencast engine builds app shells from a spec** (region kinds: cards, table, form, settings, detail, list, empty), so build these items as **region kinds or shells that the engine's `W.app` can host**, and read `docs/styles/engines/screencast.md` first. Its gaps are good targets: drag and drop, right-click menus, a phone chrome, a dark product theme, and spreadsheet, ticket, CRM, video-call and checkout regions. They build
on `ui.window`, `ui.field`, `ui.button`, `ui.toast` and the cursor (`runtime/interaction.js`), and nest inside the
device frames (phone, laptop). Each one is a generic product, never a copy of a real one.

### T-110 · `ui_mobile_screen` · Mobile app screen · P1
- **For:** app training, mobile workflows, notifications, MFA, field apps.
- **Shows:** a phone screen layout: a status bar, an app bar with a title, content (a list, cards or a form, chosen by
  `layout`) and a bottom navigation.
- **Params:** `title` (content), `layout` (`"list" | "cards" | "form" | "detail"`), `items` (content), `tab` (the
  selected nav index), `at` (-1).
- **Parts and states:** `bar`, `items[]`, `nav[]`; `parts.tap(i, t)`; `parts.push(screenSpec, t)` (it slides to a
  new screen); `parts.back(t)`.
- **Fixtures:** a list; a form; a detail with a long title.

### T-111 · `ui_notification_stack` · Notification centre · P2
- **For:** interruptions, alert fatigue, phishing by SMS, focus time.
- **Shows:** a stack of notifications (app icon slot, title, text, time) that pile, group and expand.
- **Params:** `items` (content), `group` (true), `at` (-1).
- **Parts and states:** `items[]`; `parts.arrive(i, t)`; `parts.clear(t)`; `parts.expand(group, t)`.
- **Fixtures:** 3; 12 grouped; one suspicious SMS.

### T-112 · `ui_settings_toggles` · Settings panel · P2
- **For:** privacy settings, security settings, configuration walkthroughs.
- **Shows:** grouped rows with labels, descriptions and toggles, selects or chevrons; a changed row is highlighted.
- **Params:** `groups` (content: `[{title, rows: [{label, desc?, kind, value}]}]`), `at` (-1).
- **Parts and states:** `rows[]`; `parts.set(path, value, t)` (with the cursor); `parts.highlight(path, t)`.
- **Fixtures:** 1 group; 3 groups; long descriptions.

### T-113 · `ui_form_validation` · Form with validation · P2
- **For:** data entry training, data quality, accessibility, error prevention.
- **Shows:** a form of fields (labels, inputs, help text), inline errors, a disabled submit until valid and a
  success state.
- **Params:** `fields` (content: `[{label, value?, error?, help?}]`), `submit` (content), `at` (-1).
- **Parts and states:** `fields[]`, `submit`; `parts.fill(i, value, t)`; `parts.error(i, msg, t)`;
  `parts.submit(t)`.
- **Fixtures:** 3 fields; 8 fields with 2 errors; a success state.

### T-114 · `ui_modal_confirm` · Confirmation dialog · P2
- **For:** destructive actions, "are you sure", data deletion, sending to the wrong person.
- **Shows:** a dimmed backdrop, a dialog with a title, consequence text, an optional "type the name to confirm"
  field, and cancel and destructive buttons.
- **Params:** `title`, `text`, `confirmText`, `buttons` (all content); `danger` (true), `at` (-1).
- **Parts and states:** `dialog`, `buttons[]`; `parts.open(t)`; `parts.choose(which, t)`.
- **Fixtures:** delete a file; type-to-confirm; a long consequence text.

### T-115 · `ui_upload_progress` · File upload or transfer · P3
- **For:** data sharing rules, sending files outside the company, large uploads.
- **Shows:** a file row (type icon, name, size) with a progress bar and a status: scanning, blocked by policy, done.
- **Params:** `files` (content), `at` (-1).
- **Parts and states:** `rows[]`; `parts.progress(i, pct, t, dur)`; `parts.block(i, reason, t)`.
- **Fixtures:** 1 file; 4 files; one blocked.

### T-116 · `ui_search_results` · Search results page · P3
- **For:** finding information, intranet search, judging sources, sponsored results.
- **Shows:** a search bar with a query, then result entries (title, source line, snippet with the query terms in
  bold), and a filter chip row.
- **Params:** `query`, `results` (content), `at` (-1).
- **Parts and states:** `results[]`; `parts.type(query, t)`; `parts.mark(i, tone, t)`.
- **Fixtures:** 4 results; 8 with filters; a misleading result marked.

### T-117 · `ui_spreadsheet` · Spreadsheet grid with formulas · P1
- **For:** finance and operations training, formulas, data errors, sharing a spreadsheet with personal data.
- **Shows:**
  - a grid with column letters and row numbers, cells with values, and a selected cell with its formula in a formula
    bar;
  - cells that depend on the selection outlined;
  - an error cell (`#REF!`-style) marked;
  - sheet tabs.
- **Params:** `cells` (content: a map `"B3": {v, f?}`), `cols` (8), `rows` (15), `select`, `tabs` (content),
  `at` (-1).
- **Parts and states:** `cells{ref}`, `bar`; `parts.select(ref, t)`; `parts.type(ref, text, t)`; `parts.recalc(refs,
  t)` (dependent values change with a flash); `parts.trace(ref, t)` (precedent arrows).
- **Fixtures:** a budget; a formula error; a 20 by 40 sheet scrolled.

### T-118 · `ui_slide_mock` · Presentation slide · P3
- **For:** presenting skills, "what makes a good slide", before and after slide makeovers.
- **Shows:** a 16:9 slide frame with a title, bullets or a chart slot, and a presenter-notes strip; a thumbnail rail.
- **Params:** `slides` (content: `[{title, bullets?}]`), `current`, `at` (-1).
- **Parts and states:** `slide`, `thumbs[]`; `parts.go(i, t)`; `parts.makeover(i, newSpec, t)`.
- **Fixtures:** 3 slides; a dense slide made over; 10 slides.

### T-119 · `ui_video_call` · Video call grid · P1
- **For:** remote work, meeting etiquette, screen-sharing risks, hybrid meetings, inclusive meetings.
- **Shows:** a grid of participant tiles (a character slot or a monogram, a name, mute and camera states, a speaking
  ring), a control bar, an optional shared screen tile and a chat side panel.
- **Params:** `people` (content: `[{name, muted?, camera?}]`), `share` (content or a nested element), `chat`
  (content, optional), `speaking`, `at` (-1).
- **Parts and states:** `tiles[]`, `controls`, `share`, `chat`; `parts.speak(i, t)`; `parts.mute(i, on, t)`;
  `parts.share(on, t)`; `parts.raise(i, t)` (a raised hand).
- **Fixtures:** 4 people; 9 people with a share; 2 people with chat.

### T-120 · `ui_helpdesk_ticket` · Support ticket · P1
- **For:** IT support, customer service, SLAs, triage, escalation.
- **Shows:** a ticket with an id, title, requester, priority, category, an SLA timer that counts down, a status
  pipeline (new, triage, in progress, resolved) and a comment thread.
- **Params:** `ticket` (content: fields), `comments` (content), `sla` (content: minutes), `at` (-1).
- **Parts and states:** `fields`, `status[]`, `timer`, `comments[]`; `parts.status(s, t)`; `parts.comment(c, t)`;
  `parts.breach(t)` (the timer runs out and the ticket turns accent3).
- **Fixtures:** a password reset; a P1 outage; a long comment thread.

### T-121 · `ui_crm_record` · Customer record · P2
- **For:** sales training, account management, customer data handling.
- **Shows:** a record with company and contact fields, a pipeline stage bar, an activity timeline and a deal value.
- **Params:** `fields`, `stage`, `activities`, `value` (all content); `at` (-1).
- **Parts and states:** `stages[]`, `activities[]`; `parts.advance(stage, t)`; `parts.log(activity, t)`.
- **Fixtures:** a new lead; a negotiation stage; 12 activities.

### T-122 · `ui_checkout_flow` · Checkout and payment flow · P3
- **For:** retail and e-commerce training, payment security, fraud signals, accessibility.
- **Shows:** a stepper (cart, details, payment, confirm), a cart summary, a payment form with masked card fields and
  a secure badge, and a confirmation.
- **Params:** `items`, `totals`, `step` (content), `at` (-1).
- **Parts and states:** `steps[]`, `cart`, `payment`; `parts.next(t)`; `parts.decline(reason, t)`.
- **Fixtures:** 2 items; 6 items; a declined payment.
- **Avoid:** real card brands.

---

## Family I. Explainer building blocks (`gen_`): 8 items

General pieces any explainer reaches for, in any topic, that Loom and RedTee do not have yet.

### T-123 · `gen_safety_sign` · Safety sign builder (ISO 7010 conventions) · P1
- **For:** health and safety, PPE, site rules, hazard awareness, evacuation.
- **Shows:** a sign of one of four kinds, built from shapes, with a Lucide or slot pictogram inside, and an optional
  text panel under it (content):
  - warning: a yellow-toned triangle with a dark border;
  - mandatory: a blue-toned disc;
  - prohibition: a red-toned ring with a diagonal bar;
  - safe condition: a green-toned square.
- **Colours:** signal colours are part of a sign's meaning. Use the pack's `accent2` (warning), `accent3`
  (prohibition), `accent4` (safe) and `accent` (mandatory) tokens, and make sure the pack lint passes. If a pack's
  tones break the convention, the sign takes its four fixed signal tokens from `Loom.style.signal(kind)`. Ask
  Kshitij's session to add that helper rather than writing hex.
- **Params:** `kind`, `icon` (a Lucide name or a slot), `text` (content, optional), `size` (220), `at` (-1).
- **Parts and states:** `shape`, `icon`, `panel`; `parts.flash(t)` (one pulse, for a hazard appearing).
- **Fixtures:** each of the 4 kinds; a long text panel; a row of 6 signs.

### T-124 · `gen_countdown` · Countdown or timer · P2
- **For:** deadlines, SLAs, time pressure in scenarios, "you have 72 hours to report".
- **Shows:** a ring or digital countdown with a label; it turns accent2 near the end and accent3 when expired.
- **Params:** `from` (content: seconds or a label), `to`, `label` (content), `style` (`"ring" | "digits"`),
  `at` (-1), `speed` (a compressed-time factor).
- **Parts and states:** `ring`, `digits`, `label`; `parts.run(t, dur)`; `parts.expire(t)`.
- **Fixtures:** 72 hours compressed; 30 seconds real time; an expiry.

### T-125 · `gen_odometer` · Rolling-digit counter · P2
- **For:** big numbers that change: incidents avoided, savings, users affected, records exposed.
- **Shows:** digits in drum columns that roll to a new value, with a unit and a label.
- **Extends:** `m.count` (text counting) and `data.counter`. This is the rolling mechanical look, with per-digit
  drums.
- **Params:** `value` (content), `unit` and `label` (content), `digits` (auto), `at` (-1).
- **Parts and states:** `drums[]`; `parts.roll(to, t, dur)`.
- **Fixtures:** 0 to 1,250; 7 digits; a decreasing value.

### T-126 · `gen_before_after` · Before and after wipe · P1
- **For:** improvements, redesigns, policy changes, "this is how it should look".
- **Shows:** two versions of anything (two nested elements or slots) in one frame, with a divider that wipes across
  and before and after labels; it can rest at a split.
- **Params:** `before`, `after` (slot functions or component refs), `labels` (content), `orientation`, `at` (-1).
- **Parts and states:** `divider`, `before`, `after`; `parts.wipe(to, t, dur)`.
- **Extends:** RedTee `explain.before_after`, which shows two cards. This wipes between two drawings at full size.
- **Fixtures:** two documents; two charts; two UI screens.

### T-127 · `gen_sticky_wall` · Sticky-note wall (affinity clustering) · P2
- **For:** workshops, retrospectives, brainstorming, research synthesis.
- **Shows:** sticky notes (short text) scattered on a wall, then grouped into labelled clusters by travel.
- **Params:** `notes` (content: `[{text, group?}]`), `groups` (content: labels), `seed` (a layout seed for the
  scatter, through `Loom.rng`), `at` (-1).
- **Parts and states:** `notes[]`, `groups[]`; `parts.cluster(t, dur)`; `parts.vote(i, n, t)` (dot votes).
- **Engines:** whiteboard draws the notes and cluster rings by hand.
- **Fixtures:** 8 notes into 3 groups; 20 into 5; long note text.

### T-128 · `gen_mind_map` · Mind map · P2
- **For:** overviews, topic maps, brainstorming, a lesson's structure.
- **Shows:** a central idea with branches curving out to sub-ideas, with branch tones per main branch and leaf labels.
- **Params:** `tree` (content), `depth` (2), `at` (-1), `w`, `h`.
- **Parts and states:** `nodes{path}`, `branches[]`; `parts.grow(path, t)`; `parts.focus(path, t)`.
- **Engines:** whiteboard and blueprint draw the branches through the engine.
- **Fixtures:** 4 branches; 7 with leaves; long labels.

### T-129 · `gen_stepper` · Chapter or step indicator · P1
- **For:** lesson navigation, "step 2 of 5", process walkthroughs, recaps.
- **Shows:** numbered dots joined by a line, labels under them, the current step filled and completed steps ticked.
- **Params:** `steps` (content), `current`, `at` (-1), `w` (1400), `compact` (false).
- **Parts and states:** `dots[]`, `labels[]`; `parts.go(i, t)`.
- **Fixtures:** 3 steps; 7 steps; long labels (wrap under the dots).

### T-130 · `gen_lower_third` · Lower-third name caption · P2
- **For:** introducing a speaker, character or expert; scenario roles; interviews.
- **Shows:** a band in the lower third with a name and a role line, an accent bar and an optional small icon. It
  never overlaps the caption band: it sits above y 840.
- **Params:** `name`, `role` (content), `side` (`"left" | "right"`), `at` (-1), `hold` (seconds before it leaves).
- **Parts and states:** `band`, `name`, `role`; `parts.show(t)`; `parts.hide(t)`.
- **Fixtures:** short; long role; right side.

---

## Family J. Kits for the style engines (`kit_`): 6 items

These are made for one engine each. They draw through `ctx.engine` and fail with a clear error in other styles. The
whiteboard and blueprint engines exist; the screencast, hologram and isometric engines are planned (Kshitij,
2026-10-16), so their kits are written to the API those engines will have. Build them after the engine lands, or
design the API with Kshitij's session first.

### T-131 · `kit_wb_board_layouts` · Whiteboard board layouts (8 in one component) · P1
- **For:** whiteboard lessons; this removes the kit-builder's per-lesson board work, which caused the mixed typefaces
  and crowding Kshitij flagged.
- **Shows:** one of 8 layouts, drawn and written by the engine's hand: 2x2 matrix, week or timeline strip, process
  chain, compare columns, checklist with ticks, cycle, funnel and mind map. Every word is `B.write` or `B.heading`,
  with room around every word and a word budget per layout.
- **Params:** `layout` (enum), `content` (content: a shape per layout), `at`, `by` (spoken-word times), `pen`
  (`"ink" | "accent"`).
- **Parts and states:** per layout (`cells`, `steps`, `items`); `parts.add(i, t)`; `parts.circle(i, t)`;
  `parts.tick(i, t)`.
- **Rules:**
  - read `docs/styles/engines/whiteboard.md` (two faces, room around every word, the board carries little across
    sections);
  - stay within 10 to 27 words a board;
  - the lab scene `wb_engine_board` is the quality bar.
- **Fixtures:** each layout once with realistic content.

### T-132 · `kit_bp_mechanical_parts` · Blueprint mechanical parts library · P2
- **For:** blueprint lessons about physical systems: plant, facilities, manufacturing, data-centre cooling.
- **Shows:** parts drawn as drafted views through `D.part`, each with centre lines, outline, hidden edges and
  hatching, sized by params: pipe run, elbow, tee, flange, gate valve, check valve, pump, motor, bearing, gear pair,
  belt and pulley, heat exchanger, tank, fan.
- **Params:** `part` (enum), `size`, `rotation`, `label` (content, optional), `at`, `by`.
- **Parts and states:** the part's layers; `parts.flow(t, dur)` (a flow arrow through pipes);
  `parts.step(t0, t1)` (for rotating parts).
- **Rules:** ISO-like drafting conventions; read `docs/styles/engines/blueprint.md` and the `bp_engine_detail` lab
  scene.
- **Fixtures:** each part once; a pump-to-tank run.

### T-133 · `kit_bp_schematic_symbols` · Blueprint schematic symbols (electrical, network, P&ID) · P3
- **For:** blueprint lessons on electrical safety, networks and process control.
- **Shows:** a symbol set drawn by the engine:
  - electrical: breaker, switch, fuse, earth, transformer, motor, lamp;
  - network: router, switch, firewall, server, access point;
  - process: valve, sensor, controller;
  - each with connection points and a `D.connect`-able anchor map.
- **Params:** `symbol` (enum), `label` (content), `at`.
- **Parts and states:** `pins{name}` (connection anchors); `parts.state(on, t)` (a switch flips).
- **Fixtures:** a lighting circuit; a small office network.

### T-134 · `kit_iso_blocks` · Isometric building blocks · COVERED (2026-10-16)
- **Do not build.** The isometric engine (`runtime/engines/isometric.js`, D-185) has the object library: 26 kinds with parts, cutaways and focus. The spec below is kept for the record. New kinds go to Kshitij's session as engine additions.
- **For:** isometric infographic lessons on supply chains, data centres, offices, cities and process flows; Kshitij
  named isometric the most important of the next three styles.
- **Shows:** code-built isometric primitives with three tones per face from one token:
  - box, slab, cylinder, ramp, stairs;
  - server rack, desk with screen, shelf rack, truck, forklift, container, building with floors, cloud, conveyor;
  - parametric sizes;
  - a cutaway option (the top or front face slides away, with hatched cut rims);
  - a focus option (everything greys except the subject).
- **Params:** `kind`, `size` (`[w, d, h]`), `tone` (token), `cut` (`"none" | "top" | "front"`), `at`.
- **Parts and states:** `faces`, `parts.cut(t)`, `parts.focus(t)`, `parts.place(gridX, gridY, t)`.
- **Rules:**
  - respect `ctx.iso` (`runtime/iso.js`, painter's order) and its grid;
  - tones derive from one token, light from the top-left (top the lightest, the left face middle, the right face
    darkest);
  - no outlines unless the pack asks.
- **Fixtures:** 6 kinds; a small warehouse scene; a cutaway server rack.

### T-135 · `kit_holo_hud` · Hologram HUD frames · COVERED (2026-10-16)
- **Do not build.** The hologram engine (`runtime/engines/hologram.js`, D-185) has every piece below and more. The spec is kept for the record.
- **For:** hologram-styled tech explainers: security operations, AI systems, monitoring, futures.
- **Shows:** HUD pieces:
  - corner-bracket frames;
  - a radial scanner sweep;
  - target lock brackets that close on an element;
  - a data readout panel with scrolling rows;
  - a wireframe globe (code-built latitude and longitude lines);
  - a waveform;
  - a hex grid.

  All lines are thin, with glow only through the pack's glow mechanism (`runtime/glow.js`).
- **Params:** `piece` (enum), `size`, `data` (content where it shows words or numbers), `at`.
- **Parts and states:** `parts.lock(targetElement, t)`, `parts.scan(t, dur)`, `parts.push(row, t)`.
- **Rules:** subtle and readable; motion only on a cue; no constant spinning loops (a loop must be a function of time,
  and stop when not on screen).
- **Fixtures:** each piece; a lock on a server icon.

### T-136 · `kit_screencast` · Screencast kit · COVERED (2026-10-16)
- **Do not build.** The screencast engine (`runtime/engines/screencast.js`, D-185) has the walkthrough layer and an app-shell builder. The spec is kept for the record.
- **For:** software training, the most common corporate L&D job: a real UI walked through, step by step.
- **Shows:** the walkthrough layer over any `ui_*` screen or `ui.window`:
  - the cursor as the learner (eased paths, click ripples);
  - auto-zoom to the cursor or caret (a camera frame on the active region);
  - a keystroke HUD (key caps for shortcuts);
  - a spotlight freeze (everything dims except the one promise: "Saved", "Encrypted");
  - chapter pills;
  - a time-lapse tag for skipped waiting.
- **Params:** `steps` (content: `[{target: element or part, action: "click" | "type" | "hover" | "shortcut", text?,
  keys?, note?}]`), `zoom` (1.6), `at`.
- **Parts and states:** `cursor`, `hud`, `pills[]`; `parts.play(t, gap)`; `parts.spotlight(target, t, dur)`.
- **Rules:** reuse `runtime/interaction.js` (`ui.cursor`, `m.cursorTo`, `m.tap`, `m.typeInto`) and `Loom.cam.frame`;
  never move faster than a person; zoom in and out once per step.
- **Fixtures:** a 4-step settings change; a shortcut-heavy flow; a form fill.

---

## Family K. Drawn art (Claude Design): 14 items

Code cannot draw these well: people above all (Loom rule: characters come from designed kits, never improvised in
scene code). The contracts already exist in the engine folder. Each item names the prompt file to start from, what to
add, and how it is labelled.

| id | item | start from | what to deliver | labels |
|---|---|---|---|---|
| A-01 | **Whiteboard people kit** (P1) | the STYLE block in `docs/styles/guides/whiteboard.md` section 15 (asset request A1) and `docs/assets/CHARACTER_PROMPTS.md` | 6 adults of varied ages, builds and presentation; busts with 4 expressions and full figures in stand, point, present and think; strokes as separate paths in drawing order | `family: people`, `style: whiteboard`, `kind: character`, parts with pivots |
| A-02 | **Blueprint people markers** (P2) | `docs/styles/guides/blueprint.md` section 8 | small outline figures (role markers: engineer, operator, visitor, manager) in drafting line weights, front and three-quarter, 4 poses; outlines only | `style: blueprint` |
| A-03 | **Corporate-clean cast** (P1) | `docs/assets/CHARACTER_PROMPTS.md` and `skills/lnd/lnd-character-design` | 8 adults, workplace clothing, 6 expressions, 8 poses (talk, listen, point, type, phone, think, walk, present), seated and standing | `style: corporate-clean` |
| A-04 | **2.5D lit cast** (P1) | the same, plus the lit_25d set style in `packs/set_styles.json` | 6 adults matching the office sets' light (warm key, cool fill), layers for parallax, 6 poses each | `style: cinematic-dawn` and `cinematic-noir` |
| A-05 | **Story-cartoon cast extension** (P2) | the Maya model sheets (`docs/assets/reviews/2026-10-0*-maya-*.md`) | 5 more characters in Maya's style (a manager, two colleagues, a customer, an older employee) with the same rig parts | `style: story-cartoon` |
| A-06 | **Hands set** (P2) | `docs/SCENE_API.md` (hands), `assets/hands/README.md` | per style: point, hold a phone, type, tap, handshake, thumbs up; anchors at the fingertip | `family: hands` |
| A-07 | **Isometric people and vehicles** (P1, for the isometric engine) | `kit_iso_blocks` (T-134) | 12 billboard people (roles: worker, driver, engineer, customer) and 6 vehicles (van, truck, forklift, car, bike, cart) in three-tone isometric | `style: isometric` |
| A-08 | **Isometric props** (P2) | the same | 24 props (pallet, box stack, plant, chair, desk, screen, door, sign, fence, tree, bin, extinguisher and so on), each in 2 sizes | `style: isometric` |
| A-09 | **Role avatars** (P1) | `docs/assets/CHARACTER_PROMPTS.md` | 24 circular avatars (bust, neutral and smiling) across roles and backgrounds, for profile cards, chat and video tiles (T-094, T-119) | `family: avatars`, per style |
| A-10 | **Expression sheet for avatars** (P3) | A-09 | the 24 avatars in 4 more expressions (concerned, surprised, thinking, pleased) | `family: avatars` |
| A-11 | **A guide character per style** (P2) | `skills/lnd/lnd-character-design` | one friendly non-human guide (an object or animal, original) for wellbeing and HR lessons; turnaround, 6 expressions, 6 poses | `family: guide` |
| A-12 | **Paper and surface textures** (P3) | `tools/asset_intake.py` (texture kind) | seamless tiles for the editorial and painterly styles (paper grain, cardboard, cork, felt), very low contrast, 400 KB maximum | `kind: texture` |
| A-13 | **Set props per world** (P2) | `docs/assets/world_prompts/<world>/<style>/props.md` | the props prompt of each world in each style the lessons use | as the props prompt says |
| A-14 | **World sets** (P1) | `docs/assets/world_prompts/` (89 scenes in 18 worlds, prompts per style, batch prompts) | sets for the worlds and styles Kshitij chooses; the office is done | as each prompt says |

Every art delivery goes through `py tools/asset_intake.py <export.zip> --batch <name>` on Kshitij's side. People
deliveries are reviewed against `skills/lnd/lnd-character-design` (no dot eyes, no mitten hands, no resemblance to
any real person or franchise).

---

## 7b. Additions, 2026-10-16 (second list, from the style stress tests)

Kshitij, 2026-10-16: "add to the list that was made by cowork for my friend. Add to that with all the different assets
you think we need." These come from what the four engine styles and the whiteboard engine showed they lack once they
were stress-tested (`docs/research/2026-10-16-style-stress/FINDINGS.md`):
- people and hands in each style's own look;
- hero objects real enough to impress;
- metaphors the whiteboard hand can draw;
- the app shells a software lesson needs.

Same block format and contracts as section 7; same master prompts (sections 3 and 4). Ids continue from T-136 and A-14.

### Family L. Hologram hero models (`holo_`, code): 12 items

The hologram engine draws a hero object in true perspective, as deterministic SVG wireframe:
`H.object(name, opts)` in `runtime/engines/hologram.js`, with 6 built-in models (rack, chip, drone, datacentre, lock,
phone). A model is a function returning parts. Each part has:
- a name;
- its edges, as lists of 3D points in metres;
- an axis for the exploded view;
- an anchor for locks and callouts.

Read `H.object`'s built-in models first and match their contract exactly.

The bar is a real holographic projection of a real object, not a box of lines. Every model needs:
- **Silhouette and proportions:** true to the real thing, the silhouette recognisable at a glance, measured from
  public dimensions (no brand shapes or logos).
- **Topology:** CAD-like, with rings plus lines along the length on curved parts, panel seams, fasteners, vents and
  cable runs. Density goes where a real object has detail; large flat faces stay quiet, with no moire grids.
- **Parts:** 4 to 9 named, physically connected parts, each with an explode axis that makes sense (a lid lifts, a drawer
  slides).
- **Depth:** a front, middle and back, so the depth fade reads.
- **Fixtures:** a turntable at 3 angles, scanned in, one part hot, exploded.

Avoid: primitives stacked to look like a thing; grids on every face; anything a viewer would read as "AI made this".

| id | model | parts (at least) | for |
|---|---|---|---|
| T-137 · `holo_laptop` P1 | laptop | lid, screen, keyboard deck, trackpad, hinge, ports | endpoint security, onboarding IT, remote work |
| T-138 · `holo_gpu` P1 | GPU card | shroud, fans, heatsink fins, PCB, power connectors, bracket | AI compute, cost of training |
| T-139 · `holo_network_switch` P2 | rack switch | chassis, port rows, uplinks, PSU, fans | networking, data centres |
| T-140 · `holo_satellite` P2 | satellite | bus, solar wings, antenna dish, thrusters | connectivity, global operations |
| T-141 · `holo_wind_turbine` P2 | wind turbine | tower, nacelle, hub, three blades | energy, sustainability (ESG) |
| T-142 · `holo_car` P2 | car (generic sedan or EV) | body shell, wheels, battery pack, motor, cabin | EV, fleet, safety |
| T-143 · `holo_robot_arm` P2 | industrial robot arm | base, shoulder, elbow, wrist, gripper | automation, manufacturing safety |
| T-144 · `holo_battery` P3 | battery pack | cells, BMS board, casing, cooling plate | energy storage, EV |
| T-145 · `holo_brain` P2 | human brain (anatomical, two hemispheres) | left, right, cerebellum, stem | learning science, wellbeing, AI analogies |
| T-146 · `holo_building` P1 | office building | floors, core, facade, roof plant | facilities, workplace security |
| T-147 · `holo_shipping_container` P3 | container on a chassis | box, doors, frame, chassis | supply chain, logistics |
| T-148 · `holo_phone_pro` P2 | upgrade of the built-in phone | frame, glass, camera bump, battery, logic board | mobile security, device policy |

### Family M. Screencast app shells (`app_`, code): 14 items

The screencast engine (`runtime/engines/screencast.js`, D-185 and D-187) draws apps from regions:
- `nav`, `table`, `cards`, `form`, `toggles`;
- `code`, `terminal`, `chart`;
- toasts, modals and a cursor.

A shell is a ready app built from those regions plus its own small parts. It looks like a real product of its category,
true to how such products are laid out, but generic: no real brand, logo, product name or proprietary icon. Authors fill
it with grounded content. Each shell has:
- the category's real information density;
- realistic empty, loading, error and success states;
- 3 to 6 named, scriptable actions (`select`, `open`, `type`, `drag`, `filter`, `submit`) that move the cursor smoothly
  and change the screen, so a walkthrough is a few lines.

Read `docs/styles/engines/screencast.md` first. Items that overlap section 7's `ui_` items extend them (say which).

| id | shell | must have | actions |
|---|---|---|---|
| T-149 · `app_email` P1 | email client | folders, a thread list with unread and flags, the reading pane, a compose window | open, reply, flag, move, search |
| T-150 · `app_chat_workspace` P1 | team chat | channels, threads, mentions, reactions, a file card | open channel, post, react, thread |
| T-151 · `app_calendar` P1 | calendar | week view, an event card, availability, a booking form | create event, drag to reschedule, invite |
| T-152 · `app_docs_editor` P1 | document editor | toolbar, headings, comments in the margin, suggestion mode, version history | type, comment, accept, restore |
| T-153 · `app_lms_course` P1 | learning platform | course outline, a lesson player, quiz, progress, certificate | start, answer, submit, complete |
| T-154 · `app_hris` P1 | HR system | employee profile, time off request, org chart, approvals | request leave, approve, view team |
| T-155 · `app_ats_pipeline` P2 | hiring pipeline | stages board, candidate card, scorecard, offer | move stage, score, send offer |
| T-156 · `app_expenses` P2 | expense tool | receipt capture, line items, policy flags, approval | add receipt, flag, submit, approve |
| T-157 · `app_cloud_console` P1 | cloud console | resource list, a VM or service detail, metrics, IAM roles | create, scale, attach role, view logs |
| T-158 · `app_analytics` P1 | analytics workspace | filters, a chart grid, a drill-down table | filter, drill down, export |
| T-159 · `app_project_board` P1 | project tracker | backlog list, board, issue detail with sub-tasks | create issue, drag, assign, close (extends `biz_kanban`) |
| T-160 · `app_password_manager` P2 | password manager | vault list, item detail, strength meter, share dialog | generate, save, share |
| T-161 · `app_ecommerce_admin` P2 | store admin | orders table, order detail, refund, inventory | refund, restock, fulfil (extends `ui_checkout_flow`) |
| T-162 · `app_ide_workspace` P1 | full developer workspace | the engine's code and terminal regions in an IDE layout with tabs, a file tree, a problems panel, a git panel and a debug toolbar | open file, run, debug step, commit |

**Reference fidelity (all shells):** when a lesson is about a specific product, the author supplies screenshots, and the
shell must take a `theme` (colours, radius, density, font scale) and a `layout` override, so it can sit close to that
product's arrangement without its marks. A fixture shows one shell in 3 themes.

### Family N. Whiteboard drawables (`wb_`, drawn art, stroke only): 3 items

The whiteboard hand traces any stroke SVG (`W.icon` traces Lucide's 1,993 icons the same way, D-186). Lucide has
objects; it lacks metaphors and situations. These must be drawn as single centre lines:
- stroke only, round caps and joins, no fills, no text;
- a 96 x 96 viewBox;
- path order is drawing order: outline first, then details, then small marks.

| id | set | contents |
|---|---|---|
| A-15 · `wb_metaphors` P1 | 40 metaphors | person juggling tasks; bridge between two teams; funnel of requests; ladder of growth; iceberg (seen and hidden); seesaw trade-off; domino chain; magnet drawing people in; rocket launch; mountain path with flags; crossroads; umbrella shielding; puzzle pieces joining; lighthouse; hourglass; balance scale of work and life; maze with a path; shield taking arrows; plant from seed to tree; megaphone; handshake; leaky pipeline; overflowing inbox; tangled wires to a neat cable; key and lock; compass; anchor; stepping stones; gears turning together; bottleneck; snowball growing; spotlight on one person; open door; broken chain link; safety net; thermometer rising; boomerang; tug of war; telescope; signpost |
| A-16 · `wb_workplace_scenes` P2 | 20 small scenes | two people talking at a desk; a team around a table; one person presenting to three; a manager and report one-to-one; a customer at a counter; a person at a laptop; a video call of four; a person reading a policy; a helpdesk call; a handover between shifts; and 10 more workplace moments, people drawn with simple adult proportions (follow `skills/lnd/lnd-character-design`) |
| A-17 · `wb_diagram_parts` P2 | 30 parts | sticky note, speech bubble, thought bubble, arrows (curved, looping, branching), brackets, stars and checks for marking, a clipboard, a calendar page, a chart frame, a stopwatch, a stack of papers, a folder, a mail envelope, a database cylinder, a cloud, a server, a phone, a laptop, a building, a truck, a shop front |

### Family K additions (drawn art): 5 items

| id | item | start from | what to deliver | labels |
|---|---|---|---|---|
| A-18 | **Whiteboard hand poses** (P1) | the installed hand `assets/engines/whiteboard/hand/write.svg` (same hand, same marker) and `docs/assets/HAND_PROMPT_WHITEBOARD.md` | the same hand in 4 more poses: lifted (marker off the board), pointing (no marker, for the recap), placing (holding a card by its edge), erasing (with a cloth). Each has the anchor at the nib or fingertip and a sleeve in a neutral ink or slate, so the board's one accent colour stands alone | `family: wb_hand`, `pose: <name>` |
| A-19 | **Hologram people** (P1) | `skills/lnd/lnd-character-design`, the hologram pack's palette | 5 adults (a presenter, an analyst, an engineer, a manager, a customer) as holographic projections: translucent figures built from contour lines and scan bands, with a soft edge glow allowed through the pack's glow tokens only. Busts and full figures, 6 poses (talk, point, present, listen, type, walk). They must read as people seen in a hologram, never as cartoons | `style: hologram` |
| A-20 | **Blueprint people in oblique** (P2) | A-02 | the A-02 markers drawn also in the blueprint engine's oblique projection, so they stand on an extruded floor | `style: blueprint` |
| A-21 | **Isometric people, detailed** (P1) | A-07 | A-07 at a second level of detail (faces as simple shapes, clothing colour groups) for close-ups, with the same proportions as the engine's pictograms, so the two can swap on a zoom | `style: isometric`, `lod: 2` |
| A-22 | **Screencast cursors and device frames** (P2) | `docs/styles/engines/screencast.md` | cursor states (arrow, hand, text, wait, drag, not-allowed) and a click ripple, plus generic laptop, phone and tablet frames with no brand marks, all in the pack's slots | `style: screencast` |

**Priority for a first batch:**
1. A-18, the hand poses: the whiteboard is in use now.
2. A-19, hologram people.
3. Family M's P1 shells: software training is the most common corporate topic.
4. A-15, the metaphors.
5. Family L's P1 models.

---

## 8. Cost and caching: why this library pays for itself

- **Each item is built once and used by reference.** A lesson that shows a terminal writes one `ctx.use` line instead
  of 100 lines of drawing code, and the author does not look at, fix and re-look at a terminal it drew itself.
- **Scene writing dominates a run's cost** (69 to 81 percent on the 2026-10-14 runs; looks alone were 22 to 33 minutes
  a run). The blueprint and whiteboard engine comparison measured the effect of solved building blocks: the
  whiteboard engine arm cost 32 percent less with 33 percent fewer calls (R-63, one lesson).
- **Restyles cost nothing.** A component drawn from tokens and roles restyles to any pack with no model call.
- **The library grows itself.** Lessons tag what they build (`// @form`). Repeated forms are promoted to components,
  and approved films keep their parts (`assets/kept/`). Commissioned items start the library at the level lessons
  need.
- **Estimate, not a measurement:** each family is worth checking with one lesson that uses it, comparing cost and
  looks with and without, as R-63 did.

## 9. On Kshitij's side when a batch arrives

1. Unzip into `runtime/components/`.
2. Run `py -m loom library accept <id>` for each item, look at the sheets, and run `py -m loom check` on a lab lesson
   using it.
3. Run `py tools/context_check.py`.
4. Log it: CHANGELOG, plus a decision for any new family.
5. Tell the storyboard and scene agents: the catalogue (`runtime/catalog.md`) lists components automatically, and
   their `idea` and `tags` are what the agents read.

## 10. Open questions for Kshitij (answer them before the matching batch)

- **Sign colours:** should T-123 get fixed signal colours from a new `Loom.style.signal(kind)` helper, or follow each
  pack's accents?
- ~~**Planned engines:** should T-134 to T-136 wait for the isometric, hologram and screencast engines, or be designed
  together with them?~~ Answered 2026-10-16: the engines were built and they cover T-134 to T-136.
- **Art order:** which worlds and styles does A-14 cover first?
