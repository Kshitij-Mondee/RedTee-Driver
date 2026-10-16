# Batch 03: Family A, developer and code (the P1 items)

Made in a Claude Code on the web session on 2026-10-16. Inputs:
- the hand-off sheet (`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, sections 0 to 6 and Family A);
- the cloud route (`docs/assets/HANDOFF_CLOUD_START.md`): batch 03 is "the P1 items of family A".

Batches 01 and 02 were already on main, so this batch starts at 03. They were checked first (below).

| id | file | what it is |
|---|---|---|
| T-001 | `dev_terminal.js` | a terminal session: title bar, commands typed after a prompt, output, errors, warnings, comments, a block cursor, scrolling |
| T-002 | `dev_code_editor.js` | a code editor pane: tab with file and language, line numbers, syntax colour, overview stripe, status line |
| T-003 | `dev_diff_view.js` | a code diff, unified or split: old and new line numbers, minus and plus with their bands, hunk headers, inline review comments |
| T-004 | `dev_git_graph.js` | a branch and commit graph: a lane per branch with its label at the left, commits, fork and merge curves, tag flags, HEAD |
| T-006 | `dev_ci_pipeline.js` | CI/CD stages as cards joined by arrows, jobs with status icons and durations; a run that stops at a failure |
| T-010 | `dev_http_exchange.js` | an HTTP request card and response card joined by an arrow, status in its tone, secret headers masked |
| T-012 | `dev_db_table.js` | a database table with an optional SQL query bar, typed headers, rows, "and N more", a row count |
| shared | `_dev_kit.js` | the dev family's shared helpers (decision 2) |

Each has its fixture in `runtime/components/fixtures/<id>.json` (3 cases with different content, one at the maximum
the params allow) and its sheet in `library/sheets/<id>.jpg`.

The state functions each item returns (each also scriptable as a `steps` entry, so the fixtures prove them):

| id | state functions |
|---|---|
| `dev_terminal` | `type(i, t)`, `addLine({kind, text}, t)`, `mark(i, tone, t)`, `clear(t)` |
| `dev_code_editor` | `focus(a, b, t)`, `mark(line, tone, t, {col0, col1})`, `replace(line, newText, t)`, `scrollTo(line, t)` |
| `dev_diff_view` | `reveal(op, t)`, `comment(row, text, t)` |
| `dev_git_graph` | `commit(spec, t)`, `merge(fromBranch, intoBranch, t)`, `moveHead(id, t)`, `focus(branchId, t)` |
| `dev_ci_pipeline` | `run(stage, t)`, `set(stage, job, state, t)`, `flow(t, dur)` |
| `dev_http_exchange` | `send(t)`, `mark(headerKey, tone, t)`, `reveal(headerKey, t)` |
| `dev_db_table` | `run(t)`, `filter(keepRows, t)`, `mark(r, c, tone, t)`, `redact(col, t)` |

## Gate results

`python3 -m loom library accept <id>`, final runs after the last change to each file (exit 0 for each):

```
component dev_terminal (commissioned): accepted; sheet library/sheets/dev_terminal.jpg
component dev_code_editor (commissioned): accepted; sheet library/sheets/dev_code_editor.jpg
component dev_diff_view (commissioned): accepted; sheet library/sheets/dev_diff_view.jpg
component dev_git_graph (commissioned): accepted; sheet library/sheets/dev_git_graph.jpg
component dev_ci_pipeline (commissioned): accepted; sheet library/sheets/dev_ci_pipeline.jpg
component dev_http_exchange (commissioned): accepted; sheet library/sheets/dev_http_exchange.jpg
component dev_db_table (commissioned): accepted; sheet library/sheets/dev_db_table.jpg
```

Every case rendered in each item's styles (9, or 10 for the two diagrams) with 0 runtime errors, 0 console errors and
0 sample-text leaks. The D-190 fix holds: `accept` routes a commissioned component now (batches 01 and 02 could only run
`check_component`).

**Batches 01 and 02 checked first, and again at the end.** All ten shells are on main (`app_email`,
`app_chat_workspace`, `app_calendar`, `app_docs_editor`, `app_lms_course`, `app_hris`, `app_cloud_console`,
`app_analytics`, `app_project_board`, `app_ide_workspace`, with `_app_kit.js` and their fixtures), as are
`docs/assets/batches/batch-01.md` and `batch-02.md`. Each passed `check_component` at the start, in its 6 styles, and
again at the end with this batch's files loaded beside it (the sheet loads every component file). Their sheets are not
committed on main (`library/sheets/` is untracked there), so this batch commits only its own seven.

## The engine paths (proved outside the sheet)

The sheet loads no style engine. Each item's three cases were rendered through `python3 -m loom lab --file` in the
screencast, whiteboard and blueprint styles, with their engines: a scratch scene that bundles `_app_kit.js`,
`_dev_kit.js` and the component, then `ctx.use`s the fixture (`at` set to 0.6 where the case was still). Not committed.

- 63 strips (7 items x 3 cases x 3 styles): 0 errors.
- The warnings left are the screencast engine's own, on the maximum cases that are meant to overflow:
  - `sc_term_wide`: the 131-character pip command;
  - `sc_code_wide`: line 42 of the TypeScript, the long Python lines of the diff;
  - `dev_diff_comment_long`: the diff comments cut for the engine's callout (decision 8).
- `dev_engine_box` (an info warning) names the CI job names the whiteboard hand letters on two lines.

What I looked at in the strips:
- whiteboard: the hand draws each frame, card, outline and arrow, then writes every word on a diagram. That covers
  stage, job, branch, commit and tag names, durations and HEAD; HEAD's word travels with its marker;
- blueprint: the pen drafts the outlines and letters the words, centred in their boxes;
- screencast: the terminal is the engine's terminal window. Commands type at its cadence, the CrashLoopBackOff line is
  highlighted, and the code editor and unified diff are its code region with its diff markers.

Found and fixed by the engine runs, though the sheets had passed:
- **`wb_face` on the diagrams.** Words in the kit's face on a whiteboard board are an error. The engine's `ctx.el`
  wants the parent group (`E.inner`), not the element, so every word had fallen back to the kit;
- **`wb_pen_late`.** All the words were asked at once, and there is one hand. Each word now starts when the pen is
  free, and the pipeline's run starts after its words;
- **`wb_text_floor` / `bp_text_floor`.** The hand and the pen letter wider than the face the kit measures. Branch,
  job and duration boxes now get that room (x1.75 whiteboard, x1.4 blueprint). The engine's own text layout chooses
  between one line and two, and a box never grows past its card;
- the git tags were kit pills in whiteboard; their words are now written by the hand;
- the CI job icons showed before their cards were drawn.

## What I looked at on the sheets

Every row of every `library/sheets/<id>.jpg`, plus 3x crops of the maximum cases. I checked:
- words whole and inside their boxes;
- nothing over what it should not cover;
- dark packs (dark-technical, blueprint, chalk-lab) and light packs;
- nothing drawn that no param supplied;
- each state's end frame: the replaced line 42, the squiggle on line 17, the inline comment, HEAD on its commit, the
  failed scan skipping deploy, the revealed API key, the redacted email column and the filtered rows with their new
  count.

Fixed after looking, though the gate had passed:
- **terminal:** a half row showed above the first visible row of a scrolled terminal. The clip now starts on the row
  grid;
- **dim tones:** green and blue were dim on the dark terminal body. Every tone is now mixed toward the body's text
  colour until it reaches contrast 4.5 (it was 3.5);
- **editor:** the overview stripe's window mark did not match its line bars;
- **diff:** a review balloon covered the code around it, and the code showed through it in whiteboard (a hatched
  fill). Comments now open inline under their row, on an opaque backing. The rows below move down by whole rows;
- **git graph:** the HEAD pointer and its word sat on the commit's own label. Lane guides were solid sketch lines in
  whiteboard;
- **CI pipeline:**
  - in the 7-stage case job names were cut to one word ("fetch…"); names now wrap to a second line;
  - in presenter-pop one word did not fit at the floor; the gap between cards is tighter from 6 stages;
- **wrapped strings** (HTTP bodies, diffs) lost their string colour on the second row. A line is now tokenized whole,
  then wrapped (`DK.wrapRuns`);
- **db table:** whiteboard's "j" in "joined" hangs 3 px left of its origin (`text_spill`). A word that hangs now gets
  a box hugging it, centred in it (`DK.textL`).

## Decisions (made without asking, as the brief says)

1. **Styles (D-193).** These are screens of software, so the screen items (T-001, T-002, T-003, T-010, T-012) are made
   for nine styles:
   - the six that show products as screens: screencast, corporate-clean, engineering, line-art, editorial-paper,
     presenter-pop;
   - dark-technical, the precise technical style;
   - whiteboard and blueprint, which the hand-off rows ask for by name, with their engines.

   The two diagrams (T-004, T-006) add chalk-lab ("systems ... chalk diagrams").

   They are not made for hologram, isometric, glow-flat, flat-cosmos, story-cartoon or the cinematic styles: each shows
   the same subject its own way. The CI row's "isometric: conveyor sections" is a separate item made in that style
   (D-193).
2. **One shared helper, `_dev_kit.js`** (loaded after `_app_kit.js`, whose mono text, measured UI text and motion it
   reuses):
   - the engine hook (`DK.engine`, `DK.pen`, `DK.penDraw`, `DK.word`);
   - legible tones (`DK.legible`, `DK.scheme`);
   - a tokenizer for js, ts, py, go, java, sql, yaml, json, bash, html and css. A comment opens only with the
     language's own marker; there is no library at runtime;
   - wrapping (`DK.wrapCols`, `DK.wrapRuns`), the window frame (`DK.frame`), status icons and motion helpers.

   Nothing in `_app_kit.js` changed, so batches 01 and 02 are untouched.
3. **`kind: "screen"`** on the five screen items. The whiteboard's face audit then treats them as screens, as it does
   devices: code stays in the mono face, as the rows say. The two diagrams have no such kind, so every word on them
   goes through the engine.
4. **Engines only when animated, for outlines.** The hand or the pen draws a frame only when `at` >= 0. A still
   (`at` = -1) is drawn by the kit in the pack's sketch or line look, as a still picture should be. The diagrams' words
   go through the engine in either case (a still writes them at the beat's start), for the face rule.
5. **Screencast builds on the engine's regions**, as section 6 asks:
   - the terminal is `W.app` with chrome `terminal`;
   - the editor, and a unified diff, are its `code` region with its diff markers;
   - a split diff, the git graph, the pipeline, the HTTP cards and the table draw themselves: the engine has no region
     for them.
6. **Colour.**
   - Warnings use `accent2` (measures and warnings, the contract), except in screencast, where `accent2` is the teaching
     layer's signal and the engine colours warnings `accent4`.
   - The terminal's `scheme` (dark, light, pack) applies in filled packs. In the outlined packs (whiteboard, blueprint,
     line-art) a solid dark block would bury the line work, so the body is the pack's own surface there.
7. **Content that is not a param string becomes one.** The text audit reads param values, never object keys. So:
   - an HTTP `body` is text (JSON text is laid out by level, which adds no words);
   - the latency is a string (`latency: "118 ms"`), not `latencyMs`, because "ms" would be a word no param supplied;
   - the db table's row count and "and N more" come from `countLabel` and `moreLabel` with `{n}`. With no
     `moreLabel`, the table shows `+22` and no words;
   - HEAD's word is `headLabel`, and the editor's language name is `langLabel` (else the lang id).
8. **The screencast diff comment** goes in the engine's callout, which holds 2 to 6 words. A longer comment is cut at
   its 8th word with an ellipsis, and `dev_diff_comment_long` says so. Elsewhere the comment opens inline at full
   length, up to 4 lines.
9. **`steps`** on every item but the terminal, which scripts with each line's own `at`. A fixture can then prove a
   state function (replace on line 42, a filter, a redaction, a reveal), as the app shells do.
10. **Families and names** follow section 5: `family: "dev"`, ids `dev_<name>`, `commissioned_by: "Kshitij
    2026-10-16 (hand-off sheet T-<n>)"`, 10 tags each.
11. **Generic products only.**
    - The files, services, companies, branches and data are invented, and the commands are generic forms (`git push`,
      `kubectl get pods`, `pytest`, `npm`).
    - The status line once said "Kubernetes manifest"; it now says "Deployment manifest".
    - The icons are Lucide.
12. **Branch.** The session was configured for `claude/sharp-johnson-q7yt5b`, and the brief asks for
    `assets/batch-NN`. The same commit is pushed to both: `assets/batch-03`, as the brief names it, and the
    session's branch.

## Left open

1. **Pace in the engine styles.** In whiteboard and blueprint the hand writes every word of a diagram before its run
   starts: it is one hand. The 7-stage pipeline takes about 8 s of lettering. A lesson that needs the run sooner gives
   it a later beat, or uses fewer words a card.
2. **Generated files are left out of the commit**, as in batches 01 and 02. The gates rebuilt these, and I restored them:
   - `runtime/catalog.*`, `runtime/capabilities.*` and `library/decisions.json`;
   - the harvest's untracked `library/scenes/` folders.

   Kshitij's `library accept` rebuilds them.
3. **The engines' width factors** (x1.75 whiteboard, x1.4 blueprint) are measured on these fixtures, not derived from
   the engines' fonts. A label much longer than the fixtures' may still letter on two lines (with the
   `dev_engine_box` info).
4. **Not drawn** (the rows do not ask for them):
   - syntax colour inside a terminal's output (the row says no);
   - horizontal scrolling of a wide table: cells are cut at a word with an ellipsis instead;
   - the editor's minimap when `rows` is far below the file length: it compresses to 3 px a line.
5. **Not in this batch: the Family A P2 and P3 items** (T-005, T-007 to T-009, T-011, T-013 to T-018), by the cloud
   plan's order.

## The quality pass (assets/batch-03 e117237, taken in 2026-10-17)

The seven batch 03 items were looked at again at full size, case by case, after the requester's ask for clean,
perfectly crafted templates. Fixed:
- **terminal:** the window frame's body corners (`DK.frame` draws a rounded-bottom path) and the warning tone (now
  `DK.warnTok`), both in the shared kit;
- **code editor:** the status line's items (split at two or more spaces in the param) are measured and set apart one by
  one, as an editor's status bar; function names that came out faded in some packs now fall back to the text colour
  (`DK.syntax`, low-saturation defaults);
- **diff view:** the first case's view now shows 13 rows (it was 11), so its hunk is not cut at the view's edge;
- **git graph:** two lanes could share a tone; lanes now take distinct tones (`DK.tones`);
- **CI pipeline:**
  - the stage icon and name margins were evened out;
  - a job name that fit its box exactly lost its last word to the one-line drawer's margin ("fetch..." in
    presenter-pop). The line count is now measured 6 px narrower than the box, so such a name wraps instead;
- **HTTP exchange:** side by side, each card is as tall as its own content (the short request card had been stretched
  to the response's height, half empty);
- **db table:**
  - names starting with letters that hang left ("T", "Y") sat a few pixels right of the column's edge. `DK.textL` now
    keeps the word's origin on the column edge;
  - a filter slid the count up with the rows, leaving an empty band under it. The count now stays at the foot;
  - in whiteboard the hand has no bold, so the header names looked like their types; there they are a size larger.

Batch 03's gate results after the pass:

`python3 -m loom library accept <id>`, final runs after the last change to each file (exit 0 for each; the sheet paths are
shortened from absolute):

```
component dev_terminal (commissioned): accepted; sheet library/sheets/dev_terminal.jpg
component dev_code_editor (commissioned): accepted; sheet library/sheets/dev_code_editor.jpg
component dev_diff_view (commissioned): accepted; sheet library/sheets/dev_diff_view.jpg
component dev_git_graph (commissioned): accepted; sheet library/sheets/dev_git_graph.jpg
component dev_ci_pipeline (commissioned): accepted; sheet library/sheets/dev_ci_pipeline.jpg
component dev_http_exchange (commissioned): accepted; sheet library/sheets/dev_http_exchange.jpg
component dev_db_table (commissioned): accepted; sheet library/sheets/dev_db_table.jpg
```

All seven also pass `check_component` in their 9 or 10 styles with 0 errors, and their 63 engine strips (below in
part 3) were rendered again: 0 errors, the same expected screencast warnings as before.

