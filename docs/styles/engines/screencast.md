# The screencast engine: how a lesson uses it (2026-10-16)

A lesson in the screencast style has `ctx.engine`: a believable **generic** application redrawn as vector UI from a
compact spec, walked through by a pointer that is the learner, with a camera that frames the active region and a
teaching layer (rings, callouts, pills, a spotlight) in the pack's signal colour, `accent2`, which no product state
uses. Research and sources: `docs/research/2026-10-16-style-screencast.md`. Style rules: `docs/styles/guides/screencast.md`.
Lab strips: `sc_tour`, `sc_walkthrough`, `sc_lesson` (`py -m loom lab sc_lesson --style screencast`). Developer
content (a code editor, a terminal, a live dashboard): `docs/research/2026-10-16-style-stress/screencast_stress.js`.

**Every word on the screen comes from the lesson** (the product's own documentation, through the knowledge sheet or
source anchors). The engine has no sample text. Labels, menu items, field names and shortcuts must be true to the
product being taught; if a button is not in the docs, it is not in the film. The shell is generic on purpose: never a
real product's logo, chrome or palette.

## For the storyboard agent: plan a software lesson

**One app shell, held.** Draw the app once (the first beat of a chapter) and keep it (`keep: ["app"]`, or
`W.resume(ctx, "app")` in the next beat). The camera does the moving inside the shell; cuts happen only between
chapters, ideally under a chapter card. A different screen of the same product is a page of the same shell
(`pages` + `A.go`), not a new shell.

**Two registers, alternating.**
- **Tour** (calm, whole screen, scale 1): orientation and the "why". Name 3 to 6 regions, one a sentence
  (`A.name`), then clear them. The first chapter of a lesson is usually a tour (Plaisant and Shneiderman: a tour of
  the main screen "introduces the vocabulary"). Use it again to show where a result lives.
- **Walkthrough** (zoomed, step-precise): the "how". A step pill announces the step, the pointer goes to the control,
  the camera frames it as the pointer arrives, the press lands on a still frame, the product reacts, the camera
  follows the reaction if it happens elsewhere, then returns.
- A 5 to 10 minute lesson: 3 to 6 chapters of 1 to 3 minutes each, each a complete subtask with a clear start and end
  (tutorials are skimmed and re-watched: a learner who jumps to chapter 3 lands on a clean start). Tour beats about a
  third of the time, walkthrough beats two thirds.

**Chapters and steps.** Chapter pills (2 or 3 words each, at most 5 chapters) say where in the task we are; a step
pill ("2 / 4  Turn on two-step sign-in", imperative verb first) says what this step does. At most 5 actions a step
(van der Meij: subtasks of 3 to 5 actions). End each chapter on the finished state, held 2 s.

**Where to zoom.** Zoom when the learner must read something small or see exactly where a click lands: a toggle in a
settings list, a field being typed into, a menu item, a toast. Do not zoom for big obvious targets (a primary button
in a sparse page), for a whole-page change, or in a tour. Frame the control with its neighbourhood (its row, its
label), never the control alone. A menu is framed with its anchor (the engine does it).

**What to cut.** Waiting (a time-lapse tag says how long it really takes), repeated identical steps (show one, say "and
the same for the other two"), features the task does not need (no feature catalogue: van der Meij G5, "do not
advertise"), sign-in screens unless sign-in is the lesson, and every word on screen that repeats the narration.

**Narration and the screen.** The step is announced just before it happens ("Open the Security tab", then the click
lands on "Security"). One change at a time: a reaction the camera does not show is a reaction nobody sees.

### Beat recipes (each a beat or two; adapt, never copy the lab words)

1. **A settings change.** Tour beat: name the settings area. Walkthrough beat: step pill, click the tab or nav item
   (`go:` the page), `A.click("sec.<row>", {zoom: true})` on the toggle (it flips), toast if the product shows one,
   `A.zoomOut`, `A.spotlight("<region>.<row>.row", {label})` on the row that is now on.
2. **A form fill with validation.** Zoom to the form (`A.zoom("<form>")`), `A.type` each field (2 to 4 fields, short
   values), click submit, `A.error("<form>.<field>", "<the product's message>", t)` on the invalid field, retype it
   (`A.type(..., {click: false})` if the caret is there), submit again, toast, zoom out.
3. **A report export.** `A.click("tool.export", {zoom: true, menu: [...]})`, click the menu item, `A.closeMenu`, a
   toast with `progress: true` and `A.progress`, `A.timelapse({speed, label: "About 2 min"})`, the "ready" toast, zoom
   out, then a tour beat on the page where the file lives (`A.go`, `A.name`). (Lab: `sc_lesson`.)
4. **A permission share.** Click "Share" (`zoom: true`), a dialog (`A.dialog` with a field and a select), type the
   colleague's address, open the role select (`A.click("dialog.role", {menu: [...]})`), choose the role, click the
   primary action, `A.closeDialog`, toast, `A.callout` on who now has access.
5. **A security setting.** As recipe 1, with the dialog the product shows on turning it on (a recovery phone, a code),
   `A.keys` for a shortcut the docs give, and the spotlight freeze on the promise ("On for every sign-in"). (Lab:
   `sc_walkthrough`.)
6. **Finding something in a menu.** Hover the menu button with a tooltip (`A.hover(id, {tip})`), click it with
   `menu:`, `A.callout` on the item (2 to 6 words), click it. If the menu is long, `A.scroll` its region first.
7. **A config change, deployed.** An editor shell (`code` region, the file tree as `nav`): `A.scrollToLine`, a zoom
   that keeps the tree (`read: "code"`), `A.highlight`, `A.codeType(..., {diff: "+"})`, a callout on `code.line.<n>`,
   `A.keys(["Ctrl", "S"])` once the callout has gone. Then a terminal window (`chrome: "terminal"`) beside the product's
   dashboard: `A.run` the command the docs give, `A.out` its stages, while the dashboard answers (`A.cell`, `A.card` with
   `count`, `A.series`). (Lab: `screencast_stress`, chapters 1 and 2.)

## Pacing rules (the engine keeps most of them; plan for them)

| what | rule |
|---|---|
| pointer speed | never faster than 1500 px/s on screen; a move takes 0.5 to 1.3 s (`0.42 + distance/1500`). A move asked faster is stretched and warns `sc_pointer_fast` |
| before a press | the pointer arrives 0.3 s early and hovers (the hover state shows) |
| after a press | the reaction plus 0.6 s before the next move; a click returns the time its reaction settles |
| typing | 14 characters a second, caret visible; values short enough for their field (`sc_type_long` warns) |
| zoom | in 0.8 s, out 0.7 s, eased; scale 1.25 to 2.4; one camera move in flight; never across a press, typing or a shortcut (`sc_camera_during_action`); `sc_camera_busy` when asked while one runs |
| subtask end | 2 s on the finished state before the next chapter |
| spotlight freeze | 1.5 to 3 s, at most once a chapter; the pointer holds still (`sc_spotlight_moves`) |
| callout | 2 to 6 words, 2.5 s or more (`sc_callout_long` over 8 words) |
| a change | one at a time (`sc_two_changes`), inside the frame once the camera settles (`sc_reaction_offscreen`, checked when every scene is built) |

## For the scene author: the calls

```js
const W = ctx.engine;
const A = W.app(ctx, "app", spec, { at, build: "regions" | undefined, exit });   // a new shell (full frame element)
const A2 = W.resume(ctx, "app");                                                   // the held shell, in a later beat
```

**The spec** (every word from the lesson):
- `chrome: "browser" | "window" | "terminal" | "none"`, `url` (browser), `title` (window, terminal), `frame: {x, y, w, h}` (default
  96, 78, 1728, 856: above the caption band, room for pills above).
- `brand`, `nav: [{id, label, icon, count} | {section}]`, `active` (nav id), `sidebarW`.
- `search` (placeholder), `searchKey` ("Ctrl K"), `actions: [{id, icon, badge}]`, `user` (initials).
- One page: `page: {title, sub, toolbar: [{id, label, icon, kind: "primary"|"secondary"|"danger"|"ghost"}], tabs:
  {items, active}}` and `content`; or many: `pages: {id: {title, sub, toolbar, tabs, content}}`, `start`.
- `content`: rows; a row is a region or an array of regions side by side (`w` fractions). Region kinds:
  - `cards {items: [{label, value, tone, icon, sub}]}`;
  - `table {title, columns: [{label, w, kind: text|strong|muted|mono|status|avatar, align}], rows, tones, select, check}`;
  - `form {title, cols, fields: [{id, label, value, placeholder, help, kind: text|password|select|textarea|toggle|checkbox}], actions}`;
  - `settings {title, rows: [{id, label, desc, kind: toggle|select|button|chevron, value, button}]}`;
  - `detail {title, rows: [[label, value, tone?]], actions}`; `list {title, items: [{id, title, sub, meta, icon, tone}], select}`;
  - `empty {icon, title, text}`;
  - `code {lang, lines | text, start, highlight, diff, size, title}`: a code editor (below);
  - `terminal {prompt, lines, size}`: a dark terminal (below);
  - `chart {type: line|bar, labels, series: [{name, values, tone}], min, max, unit, decimals, limit: {value, label, tone}, title, h}` (below).
  Tables, lists, settings, code and terminals scroll when longer than their box.

**A code editor** (`kind: "code"`, added 2026-10-16 after the stress test faked one with a table). Line numbers and diff
markers in a quiet gutter, the code in the pack's mono face (JetBrains Mono) at `screencast.code_px` (26 px: any zoom of
1.25x or more reads at the 32 px floor, so the editor can be framed with its file tree), each run of characters placed
at its column so indentation is kept exactly, and syntax colour from the product's tokens (keys, keywords, strings in
pos, numbers in accent4, comments in muted, functions, types, bash flags and variables; a pack may override any kind in
`screencast.syntax`). Languages: `yaml`, `json`, `js`, `ts`, `python`, `bash` (`sh`), else plain. `lines` is an array (or
`text` with newlines); `start` the first line number; `highlight: 12` or `[12, 13]` the current line at build;
`diff: {12: "+", 9: "-", 7: "~"}` added, removed and changed-since-save markers. Leave a line empty (`""`) where a new
line is typed. Lines wider than the editor are cut at its edge and warn `sc_code_wide`.
```js
{ id: "code", kind: "code", lang: "yaml", lines: [...], diff: { 7: "~" } }
A.scrollToLine("code", 12, { at, dur, pos: 0.4 });            // line 12 to 40 % down the box
A.zoom(rect, { at, scale: 1.3, read: "code" });               // the text to be read is the code (26 px x 1.3 = 34 px)
A.highlight("code", 12, { at, until });                       // the current-line wash and a bold line number
A.codeType("code", 12, "  backoff: exponential", { at, cps, keep, diff: "+" });   // typed with a caret; returns its end
A.codeMark("code", 9, "-", t);                                // "+", "-", "~" or null
```
`codeType` keeps the characters the old line and the new share (or `keep` of them) and types the rest at 14 a second
with a caret; the typed words are reported for the vocabulary audit like any other text.

**A terminal** (`kind: "terminal"`, best in `chrome: "terminal"`: a window dark from edge to edge, from the pack's
shadow and ink). Mono at `screencast.term_px` (24 px), a prompt (`prompt: "~ $"`: the path in a light accent, the sigil in
a light pos), no rows, no header, no hairlines. `lines` is the history at build: a string is output, `{cmd}` a command
after the prompt. Status words in output are coloured as a CLI colours them: `done`, `ready`, `healthy`, `passed`, `OK`
in pos; `WARN`, `warning:`, `retrying`, `degraded` in accent4; `ERROR`, `error:`, `failed`, `FAILED`, `denied` in neg (a
bare "error" in "error rate" is a noun and stays plain); `{out, tone: "ok"|"warn"|"error"|"muted"|"plain"}` sets a whole
line.
```js
let t = T.run("sh", "shipctl deploy payments-api --canary 10", { at, cps, wait, prompt });   // caret waits, then types
t = T.out("sh", ["Building image payments-api:4.18", "  step 1/4  compile  done", { out: "limit 1.0%", tone: "muted" }], { at: t + 0.2, gap: 0.22 });
T.callout("sh.line." + T.lineCount("sh"), "Healthy, safe to promote", { at, until, side: "above" });
```
Output streams in one line every `gap` s and the body scrolls a line at a time to keep the newest in view. Lines are
parts `sh.line.<n>`, numbered from 1 in the order they appear (`A.lineCount(rid)` is the count so far). Lines wider than
the terminal warn `sc_term_wide`.

**A chart** (`kind: "chart"`). A line (with a light area under a single series) or grouped bars on a round-step grid,
labels below, an optional dashed `limit` line with its label, a legend in the title row for two or more series, series
in the product's tones (accent, accent3, pos, accent4; never accent2). `null` is a point not known yet.
```js
A.series("trend", 0, [0.9, 0.7, 0.6, 0.5, null, null], t, { dur: 0.6 });   // series 0 moves; a new point grows from the last
```
A value outside the axis warns `sc_chart_range` (set `max`). Parts: `trend.plot`, `trend.col.<i>`, `trend.limit`.

**A real web page** (`kind: "page"`, SCREENCAST V2, 2026-10-16). The page itself, captured once and offline by
`py tools/page_capture.py <url> --project <id> --approved-by "<name>"` (a capture is a download: each site needs the
requester's approval; public pages only, robots.txt respected, no sign-in; a page served from this computer needs no
approval). The capture keeps the DOM (scripts, frames and handlers removed), the CSS at the capture width with
`:hover`, `:focus` and `:active` rewritten as classes, fonts and images inlined, and each element's box; its
`<name>.page.js` registers it (`Loom.webpage`). The region draws it live inside the window, scaled to the region's
width (a 1280 px capture in a full browser window is 1.35x, so 16 px page text reads 21.6 px), and the page's own
styles answer on cue. Its elements are parts by selector, `"<region>@<selector>"`: `#id`, `.class`, `tag`, `[attr=v]`
(also `*=`, `^=`, `$=`), descendant and child (`>`) paths, `a, b`, `text=Create workspace`, and `:nth(k)` (from 0).
```js
const A = W.app(ctx, "web", { chrome: "browser", url: "fieldnote.example.com", content: [{ id: "site", kind: "page", page: "fieldnote" }] }, { at });
A.hover("site@#nav-product", { at });                                      // the page's own :hover style while the pointer rests
A.type("site@#email", "dana@company.com", { at, zoom: true, frame: ["site@#email", "site@#create"], read: "site@#email" });
A.click("site@#updates", { at });                                          // a checkbox ticks; a press shows :active; a field takes :focus
A.click("site@#yearly", { at, toggle: { target: "site@#plans", cls: "yearly" } });   // a class the page's CSS answers
A.scrollTo("site@#pricing", { at, dur: 1.4, pos: 0.05 });                  // a smooth scroll (inertia) to an element
A.zoom(["site@#tier-team"], { at, scale: 1.6 }); A.callout("site@#tier-team", "6.40 a person, yearly", { at, side: "below" });
A.webClass("site@#menu", "open", true, t); A.webSet("site@#size", "6 to 20 people", t);   // a class or a value by hand
```
A `<select>` opens no native list in a frame: show the choice with `menu:` on the click and `A.webSet`. The page's
animations and transitions are off (they run on the wall clock); its states switch on cue. A lab scene loads the
capture by bundling it into one file: `py tools/page_capture.py bundle --scene x.src.js --pages a.page.js --out x.js`.
(Lab: `docs/research/2026-10-16-style-stress/screencast_web.js`.)

**A product's look from screenshots** (`theme`, `layout`). `py tools/screenshot_theme.py shot.png --out theme.json`
reads the user's screenshots and proposes a theme (the palette sampled from pixels: page, card surface, ink, muted,
accent and its label colour, hairlines, a sidebar and its words, the top bar; the corner radius; the row height; the
text size) and a layout sketch (sidebar width, top bar height, the cards' boxes), scaled to the window. A shell takes
them: `W.app(ctx, "app", { ..., theme: proposal.theme, layout: { sidebarW, topbarH } })`. The product draws in the
theme; the teaching layer (pills, callouts, the spotlight) stays in the pack, accent2 the signal. The type face stays
the pack's. Look at the rebuilt shell beside the screenshot and correct the proposal by hand; logos and marks only when
the user supplies them and owns the rights. (Lab: `screencast_rebuild.js`, compared in `screencast_rebuild/compare.jpg`.)

**Cards that update.** `A.card("kpi", "err" | 0, "0.4%", t, { count: true, dur, tone, sub })`: the value cross-fades, or
with `count` counts from the old number to the new one in the same format ("0.6%" to "0.4%"); `A.cell("kpi", i, null,
value, t, o)` does the same on a cards region. A card answers to its index and its `id`.

**Part ids** (`A.part(id)`, `A.ids()`; an unknown id throws and lists its neighbours): `nav.<id>`, `search`, `user`,
`top.<id>`, `url`, `tool.<id>`, `tab.<id>`, the region id, `<table>.row.<r>`, `<table>.cell.<r>.<c>`,
`<cards>.card.<i|id>`, `<form>.<field>`, `<form>.action.<id>`, `<settings>.<row>` (its control) and
`<settings>.<row>.row` (the whole row), `<list>.item.<id>`, `<detail>.<i>`, `<code>.line.<n>` (the line's words) and
`<code>.row.<n>` (the row), `<terminal>.line.<n>`, `<chart>.plot`, `<chart>.col.<i>`, `<chart>.limit`, `dialog`, `dialog.<field>`,
`dialog.action.<id>`, `menu.<id>`, the toast's id (`toast` by default). A control repeated on a later page is
`<page>:<id>`.

**The learner (one pointer per app):** `A.pointer(at, {x, y})`, `A.pointerOut(at)`; `A.move(id, {at, arrive})`;
`A.click(id, {at, zoom, frame, scale, menu, go, react, hold, dx, dy})` (press at `at`; returns when the reaction
settles; built-in reactions: a toggle flips, a checkbox ticks, a tab, nav item or row is selected, a field shows its
focus ring, `menu:` opens a menu, `go:` changes page); `A.hover(id, {at, tip})`; `A.type(id, text, {at, zoom, cps,
click})`; `A.keys(["Ctrl", "S"], {at, hold})` (the keystroke HUD, bottom centre above the captions); `A.scroll(region,
dy, {at, dur})`.

**The product reacts:** `A.toggle(id, on, t)`, `A.check(id, on, t)`, `A.select(id, t)`, `A.setValue(id, text, t)`,
`A.cell(table, r, c, value, t)`, `A.card(cards, i | id, value, t, {count, tone, sub})`, `A.series(chart, s, values, t,
{dur})`, `A.codeType`, `A.codeMark`, `A.highlight`, `A.run`, `A.out` (above), `A.error(field, msg, t)`, `A.clearError(field, t)`, `A.disable(id, on, t)`,
`A.go(page, t, {nav})`, `A.dialog({title, text, fields, actions, w}, {at})`, `A.closeDialog(t)`,
`A.menu(anchor, items, {at, w})`, `A.closeMenu(t)`, `A.toast(text, {at, tone, icon, id, until, progress, place, avoid})` (`place`: bottom-right, bottom-left, bottom-center,
top-right, top-center; `avoid: [ids]` takes the first place that covers none of them),
`A.progress(id, {at, dur, from, to})`, `A.tooltip(id, text, {at, until})`.

**The camera:** `A.zoom(id | [ids] | rect, {at, dur, scale, margin, read})`, `A.zoomOut({at, dur})`. Call zooms before
the callouts and spotlights that happen under them (their placement reads the camera at their time).
`sc_zoom_small_text` checks every zoom, an explicit `scale` too (it used to skip those): the size it judges is the text
in the target (a code or terminal region's mono size, a toast's 22 px, else the 21 px UI text); `read: id | [ids]` names
what must be read when the target is a rect or holds more than the words (`A.click(id, {zoom, read})` too).

**The teaching layer (accent2):** `A.chapters(labels, {at, active})` returns `{go(i, t), hide(t)}`;
`A.step(label, {at, n, of, until})`; `A.callout(id, text, {at, until, side, point})`;
`A.spotlight(id, {at, dur, label, icon, pad})`; `A.timelapse({at, dur, speed, label})`;
`A.name(id, label, {at, n, tag, veil})` and `A.clearNames(t)` (the tour); `A.focus(id, {at, until})` and
`A.unfocus(t)` (rack focus without blur); `A.chapterCard(title, {at, dur, kicker, sub})`.

## Motion: what makes the walkthrough smooth (the engine does it; measured)

- **The camera** follows each move's eased target (minimum jerk over 70 % of the move) with a critically damped spring
  on its on-screen transform: no overshoot, no snap, its velocity continuous even where the framing slides along the
  window's edge; settled to under 1 % of the move by the move's end.
- **The pointer** moves on a slight seeded arc at minimum-jerk speed, its time from its on-screen distance (0.5 to 1.3
  s, never over 1500 px/s), and settles: it arrives a few px past the target and comes back.
- **Scrolling** has inertia: a short push, then a glide that decays (half the distance in the first quarter).
- **Typing** has a person's cadence: uneven intervals (seeded), a pause before a word and after punctuation, shifted
  keys slower; the average speed is still the pack's `type_cps`. The same in fields, the editor, the terminal and a
  real page's inputs.
- **Page changes** cross-fade with a 24 px slide; **a press** dips the pointer, darkens the control, sends a ripple
  across it (clipped to it) and opens the accent2 ring.
- **Measured**: once every scene is built, each app's camera (three points of its window) and pointer are sampled at
  60 fps; the largest change of screen velocity between frames is reported (`W.smoothness()`) and over 1500 px/s in a
  frame warns `sc_jump` with the time (a snap of D px shows as D x 60). The lab scenes measure 100 to 460.

## Density limits

- A shell: at most 7 nav items, 2 toolbar buttons and 1 primary, 4 tabs, 3 content rows; a table 8 visible rows and
  5 columns; a form 6 fields; a settings list 5 rows; a menu 6 items.
- A walkthrough beat: one step, at most 5 actions, one zoom in and one out, at most 2 overlays at once (a step pill
  plus one of: a callout, a region name, the HUD, a time-lapse tag, a spotlight label), and the product's own toast on
  top of that. The engine counts every overlay of every app on screen (they share it) once all scenes are built and
  warns `sc_overlays_crowded` once per crowded stretch, naming each overlay at its fullest ("5 overlays on screen at once
  from 34.41 s: step ..., toast ..., callout ..."): end one (`until`) before the next arrives.
- A tour beat: 1 to 2 regions named; a whole tour at most 6.
- A chapter: one spotlight freeze at most; chapter cards only between chapters.

## The rules it keeps (do not re-implement them)

- One performer: the pointer and the camera are posed by one clock from one schedule; a press lands on a still frame.
- No blur, no whip pans, no parallax, no motion blur (vestibular safety, WCAG 2.3.3; Loom's sharpness check).
- UI text at video sizes (21 px base, 20 px floor), overlays 24 to 28 px in screen space, words to be read at 32 px or
  more on screen (`sc_zoom_small_text` when a zoom does not get there).
- Sound: a click on each press, every third key while typing, a soft success on a toast; nothing else.

## Joins and the held app (D-190)

What made the 2026-10-16 test lesson (st-sc-2fa) flicker at almost every join, and what the engine now does about it:

- **One pointer, the app's.** A beat that hides the pointer (`A.pointerOut`) when it is already hidden used to flash it
  at its last place for 0.2 s: every show and hide now ramps from the level the pointer has. A pointer drawn by hand
  (`ctx.el("..._pointer")`, `cursor`, `mouse`) while an app is on screen is an error, `sc_second_pointer`.
- **The product is the app's pages.** A panel, card or "plain page" drawn by hand over the app's window (12 % of it or
  more) is an error, `sc_ui_by_hand`: it does not zoom, scroll or answer with the app, and it comes and goes on its own
  at the joins. Put the screen in `spec.pages` and change it with `A.go`, `A.dialog`, `A.cell`, `A.setValue`; teach with
  `A.callout`, `A.spotlight`, `A.chapters`. Small labels beside the app are fine.
- **Open on the picture the last beat left.** A held app changed by the system on a beat's first 0.4 s jumps at the
  join: a value cleared there is an error (`sc_reset_at_join`, b06 cleared the typed password to type it again), a page
  switch or a toggle there warns (`sc_change_at_join`). End the beat before on the state you need, or show the change as
  an action after the first words.
- **Do not hide the pointer and zoom out on every beat's first frame.** If the beat before left the camera framed in,
  pull out on the first words, as a move the learner can follow.
- Held then exited at once, redrawn in place, empty frames at cuts: the world handles these for every style (see the
  scene author skill, "Joins").
