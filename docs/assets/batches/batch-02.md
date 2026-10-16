# Batch 02: Family M, screencast app shells (T-154, T-157, T-158, T-159, T-162)

Branch `assets/batch-02`, made in a Claude Code on the web session on 2026-10-16. Inputs:
- the hand-off sheet (`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, section 7b, Family M);
- the cloud route (`docs/assets/HANDOFF_CLOUD_START.md`, batch 02).

It builds on batch 01 (`BATCH.md` beside this file): the same shared helper `_app_kit.js`, the same two hosts and the
same rules.

| id | file | what it is |
|---|---|---|
| T-154 | `app_hris.js` | HR system: an employee's profile with leave balances, a time off request form with past requests, the team's org chart, a manager's approvals queue |
| T-157 | `app_cloud_console.js` | cloud console: services, project and region, a resource list with status, a resource's detail (overview, metrics, permissions, logs), a create panel, a scale dialog, a role form |
| T-158 | `app_analytics.js` | analytics workspace: filter chips, headline numbers, a grid of line and bar charts, a drill-down table with a breadcrumb, an export menu |
| T-159 | `app_project_board.js` | project tracker: a board of columns with work-in-progress limits, a backlog list, an issue drawer with assignee and sub-tasks (extends `biz_kanban`, T-081) |
| T-162 | `app_ide_workspace.js` | developer workspace: file tree, tabs, a code editor with syntax colour and breakpoints, terminal, problems, status bar, debug toolbar, source control panel |
| shared | `_app_kit.js` | additions for this batch (decision 2) |

Each has its fixture in `fixtures/<id>.json` and its sheet in `library/sheets/<id>.jpg`. Every fixture has 3 or more
cases with different content (one of them the maximum the params allow) and the shell in 2 more themes, each with a
state (loading, error, or the backlog view). The IDE has 6 cases: 4 content cases (run, debug, commit, maximum) and
2 themes.

The actions each shell scripts (each returns the time its reaction settles, and each is also a `steps` entry):

| id | actions |
|---|---|
| `app_hris` | `go(view)`, `requestLeave({type, from, to, note, days})`, `approve(i)`, `decline(i)`, `viewTeam()`, `setState` |
| `app_cloud_console` | `open(id)`, `back()`, `tab(name)`, `create({name, type, region, size})`, `scale(id, n)`, `attachRole(id, {member, role})`, `viewLogs(id)`, `setState` |
| `app_analytics` | `filter(i, value)`, `drillDown(chart, index)`, `export({format})`, `setState` |
| `app_project_board` | `create(card)`, `drag(id, column)`, `open(id)`, `assign(id, person)`, `close(id)`, `closePanel()`, `show(view)`, `setState` |
| `app_ide_workspace` | `openFile(id)`, `run(cmd, output)`, `debug(lines)`, `commit(message)`, `setState` |

## Gate results

`library accept` cannot route a commissioned component yet (Left open, item 1). So each id was proved with the gate
accept runs, `check_component(<id>)`: lint, catalogue, fixtures, every case in all 17 style packs, the sample-text
audit and the sheet. Final runs, after the last change to each file:

`app_hris`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_hris.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_cloud_console`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_cloud_console.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_analytics`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_analytics.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_project_board`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_project_board.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_ide_workspace`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_ide_workspace.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 6 cases each;
- warnings: none.

Batch 01's five ids were re-gated after the kit change in decision 3. All five PASSED (0 errors), each in 17 of
17 packs with 0 runtime errors, 0 console errors and 0 leaks:
`app_email`, `app_chat_workspace`, `app_calendar`, `app_docs_editor` and `app_lms_course`. Their sheets in
`library/sheets/` are the new renders.

`python3 -m loom library accept <id>` itself still exits 2 for each id:
``unknown form <id> (run `py -m loom library harvest` first)`` (checked again after the final gates).
The IDE's and the cloud console's mono text changed last (`AK.monoProp`), and both were re-gated after it. No other
shell draws mono text.

## What I looked at

I looked at every row of each `library/sheets/<id>.jpg` (17 packs, 5 or 6 cases each). For the cases and packs below,
I also looked at full-size frames at 2.4 s and 5.9 s:
- all cases in corporate-clean, whiteboard, hologram and story-cartoon;
- the maximum cases in blueprint, line-art and isometric;
- the IDE in all four outlined packs.

I checked:
- words whole and inside their boxes;
- nothing drawn over what it should not cover;
- dark and light packs both legible;
- nothing drawn that no param supplied;
- each action's end state: the leave request toast and its new pending row, the approval moving out of the queue, the
  card in its new column, the scaled instance count and chart, the bucket from provisioning to active, every number
  changing with a filter, the narrowed table after a drill, the test run passing, the debug arrow on its line, the
  commit clearing the change list.

Fixed after looking, though the checks had passed (or before they could catch it):
- **solid marks in the outlined packs** (decision 3): white on bright cyan in hologram on the IDE's status bar, and
  the same pale-on-pale on avatars, badges and brand tiles in every shell;
- **code in isometric**: that pack has no mono face, so its mono role is the body face, which is proportional. Code
  set on mono columns had wide gaps between its words. `AK.mono` now detects a proportional face and lets the line
  flow (indentation kept as space widths), measuring each run at its own weight. A bold prompt had overlapped its
  command;
- **the IDE terminal** showed the bottom of a scrolled-out line at its top; lines that scroll out now fade;
- **the IDE debug toolbar** covered code; it now sits in the tab row;
- **the IDE tree** cut every deep file to "region..." (each folder level indented); it now uses compact folders;
- **the analytics filter chips** in the maximum case ran past the window's edge ("Cu"), and in presenter-pop one
  was cut to "Reporti…". A chip now draws only when its value's first word fits, its value is cut at a word to the
  room left, and a chip with no room is not drawn;
- **the HR system's company name** in the maximum case was cut to "Internationa…" in six packs with wide label
  faces (the gate caught this one). The name now steps down from the heading size to UI text when its first word
  would not fit whole;
- **the YAML comment rule**: `#` and `//` were read as comments in every language. They now open a comment only
  in languages that use them;
- **the IDE commit** came too late for the 5.9 s frame; the fixture's message is shorter.

Found and fixed while building, before the final gate:
- the HR system's header text sat too close to its box (`tight_inset`); its height is now measured from the face;
- a dragged board card jumped back to its old place on its next move (`AK.setShift`);
- a fixture card fell below the board's fold and so was never seen; the fixture now places it in view;
- the cloud console's role form threw on a variable defined in the wrong scope;
- the analytics headline numbers and charts went blank after a filter: their redraws read stale positions, and a
  nested `alt` array was read as one series.

## Decisions (each made without asking, as the brief says)

1. **The same frame as batch 01.** Batch 01's decisions 1 to 9 hold here unchanged:
   - one shared helper;
   - two hosts (the screencast engine's window and pointer, or the shell's own);
   - every word from a param, with chrome words as optional `labels`;
   - truncation only at word boundaries;
   - sizes from the pack's roles;
   - colours as tokens or mixes of tokens;
   - `theme` plus `layout` for fidelity to a reference;
   - `state`;
   - actions as functions and `steps`.
2. **Kit additions (`_app_kit.js`), all additive.** The batch 01 shells call none of them, except the one fix in
   decision 3:
   - `AK.chart(g, x, y, w, h, o)`: a line or bar chart from token colours. It is used by the cloud console's metrics
     and by the analytics grid. It returns its plot and column geometry, and `update(series, values, t)` and
     `set(list, t)` animate new values in. A filter or a scale changes the numbers in place; the chart is not redrawn.
   - `AK.mono(g, runs, o)`, `AK.monoW(size)`, `AK.monoReveal`, `AK.typeMono`: mono text. The packs have no `mono`
     type role, but they do have a mono face. Code, logs and terminals are drawn as one `<text>` with a `<tspan>` per
     coloured run at whole columns. Each line is reported to `Loom.report.texts`, so the checks still see it, and it is
     typed with a caret like any other text.
   - `AK.setShift(node, dx, dy)`: records where a node was left after a drag that moved it by hand, so the next
     `AK.shift` starts from there (the board's drag had jumped back).
   - `AK.on(token)` and `AK.solid(token)`: the colour for words or icons on a solid mark the kit draws (decision 3).
   - `AK.monoProp(size)`: true when the pack's mono role is a proportional face (isometric has no mono face). `AK.mono`
     then lets the line flow, with its indentation kept as space widths, instead of placing words on columns.
3. **Solid marks in the outlined styles (a fix that also touches batch 01).** In hologram, blueprint, line-art and
   whiteboard (`shading: line | sketch`), `Loom.style.pickTokenOn` answers `ink`, and `kit.text` turns a knockout
   colour back to `ink`. Both expect a sparse sketch fill, but the app shells draw solid status bars, badges, brand
   tiles, check boxes and avatars. On hologram's bright cyan, that came out as pale ink on a pale fill, and the IDE's
   status bar could not be read. The checks passed it; the frames did not.

   `AK.solid(token)` now draws such a mark as line art in the outlined styles: a surface fill, the token as its
   outline, and its glyphs in the token. In the other styles it keeps the solid fill, with whichever of ink, field,
   surface and onAccent reads best on it. The change is in:
   - the avatar in `_app_kit.js` (all ten shells);
   - the brand tiles of `app_docs_editor`, `app_cloud_console`, `app_project_board` and `app_hris`;
   - the calendar's check boxes, the chat's mention badge and the board's sub-task ticks;
   - the IDE's status bar (in the outlined styles, a surface bar with an accent rule on top) and its change count.

   Batch 01's five ids were re-gated after it (results above).
4. **Families.** Following section 5's family list:
   - `app_hris`: `ui`, like batch 01;
   - `app_cloud_console`: `ops` (infrastructure);
   - `app_analytics`: `viz` (charts and numbers);
   - `app_project_board`: `biz`, beside `biz_kanban`, which it extends;
   - `app_ide_workspace`: `dev`.
5. **T-159 extends `biz_kanban`**, as the sheet says. It draws its own board, because a working tracker needs things
   the template does not do:
   - cards that are created, dragged, assigned and closed;
   - a backlog view;
   - an issue drawer.

   It keeps the template's idea of a work-in-progress limit. A column over its limit shows its count against the
   limit and a warning pill (accent4 with a triangle). The drag uses the shell's pointer carry, and the card lands in
   its new column's order.
6. **T-162 uses the engine's own code and terminal regions in the screencast style**, as the hand-off row asks:
   - `W.app` with the file tree as its nav (folder sections, change marks as counts);
   - one page per file, with the editor as a `code` region and the terminal and problems as a row under it;
   - the actions are the engine's: `A.click` on the tree, `A.run` and `A.out`, `A.highlight` for each debug step,
     `A.dialog` plus `A.type` for the commit.

   The engine cuts a label at any letter and lets tabs run past the window. To keep those cuts out of view, the IDE
   prepares every engine label before handing it over:
   - each label is cut at a word boundary or a path separator, to the engine's own widths (sidebar 300 px, nav text
     300 - 86, tab text 300, the problems list's text width);
   - only the tabs that fit are passed, with the showing file always among them;
   - a deep folder keeps its last segments (`…/exports/quarterly`).

   The engine's code editor has no loading or error screen. So an IDE with `state` other than ready, or a `state`
   step, draws itself in the screencast style too.

   In every other style the IDE draws its own workspace, with a small tokenizer for syntax colour:
   - keywords for js, ts, py, go, sql and bash;
   - strings, numbers, function names and types;
   - YAML and JSON keys;
   - comments only with the language's own marker, so a URL in YAML or a flag in shell stays code.

   The colours are pack tokens or mixes of two, never literals.
7. **The IDE's tree uses compact folders.** One row names the whole folder path, and its files sit one step in. A
   deep path therefore keeps its file names readable. A folder path too long for the row shows its last segments.
   Lines that scroll out of the terminal fade, so no half line shows at its top.
8. **The debug toolbar sits in the tab row at the right**, as a floating bar in real IDEs does, never over code.
9. **The cloud console's metrics answer the scale.** `scale(id, n)` opens a stepper dialog and updates the instance
   count, then the CPU chart eases to the values in `metrics[].after`. `create` shows the new row as provisioning, then
   running. `viewLogs` writes mono log lines with their level coloured (error neg, warn accent4).
10. **The analytics filter answers everywhere.** `filter(i, value)` opens the chip's menu, redraws the chip (the
    chips after it slide to make room), and then changes the headline numbers, every chart and the table rows to
    `filters[i].data[value]`. `drillDown(chart, index)` dims the other columns, narrows the table to rows whose
    `table.key` matches, and adds a breadcrumb pill.
11. **Generic products only.** No real brands, logos or product names:
    - the companies, services, branches, commands and code are invented;
    - the commands are the generic forms (`npm test`, `kubectl apply`, `go build`);
    - the brand tiles are Lucide icons, not marks.

## The screencast engine path (proved outside the sheet)

As in batch 01, the sheet harness loads no style engine. The engine path was proved with the same scratch harness
(`render_sheet` with `engines/screencast.js`, and `Loom.clock` driven from the timeline).

All five shells, every case:
- `app_hris`: 5 cases, 0 errors, 0 console errors, 0 leaked words;
- `app_cloud_console`: 5 cases, 0 errors, 0 console errors, 0 leaked words;
- `app_analytics`: 5 cases, 0 errors, 0 console errors, 0 leaked words;
- `app_project_board`: 5 cases, 0 errors, 0 console errors, 0 leaked words;
- `app_ide_workspace`: 6 cases, 0 errors, 0 console errors, 0 leaked words.

The warnings:
- `sc_pointer_late` on the first click of a case, as in batch 01: the fixtures press early;
- for the IDE's maximum case only, `sc_code_wide` (its 25 lines of 153 characters are wider than the editor) and
  `sc_term_wide` (a 102-character terminal line). That case is meant to overflow (Left open, item 3).

Before the IDE prepared its engine labels, the same run found 51 leaked words in the maximum case. The engine had cut
labels such as "region_0_sett…", "fix/refund-rou…" and "Argument of type string is not assign…" mid-word, and the
tabs ran past the window. Decision 6 fixed that.

I looked at the frames:
- the engine's pointer lands on the shells' own controls;
- the IDE's tree opens a file into the engine's editor;
- `npm test` types and its output streams in the engine's terminal;
- each debug step highlights its line;
- the commit dialog types its message and shows the toast;
- a loading or error IDE draws its own skeleton or notice.

## Left open

1. **`library accept` still cannot accept a commissioned component.** For every id it exits 2 with
   `unknown form <id> (run py -m loom library harvest first)`. The cause and the one-line fix are in `BATCH.md`, Left
   open, item 1. The gate above is `check_component(<id>)`, the gate `accept` runs.
2. **Generated files are left out of the commit**, as in batch 01. The gate rebuilds `runtime/catalog.*`,
   `runtime/capabilities.*` and `library/forms.json`, `FORMS.md` and `scenes/`. I restored them, and Kshitij's
   `library accept` rebuilds them.
3. **The engine's own cuts.** In the IDE's maximum case, code lines and terminal lines wider than the engine's regions
   are cut at the region's edge. The engine reports `sc_code_wide` and `sc_term_wide` and draws no ellipsis. That is how
   an editor shows a long line, and the self-drawn IDE ends such a line in an ellipsis. Shortening them is the
   lesson's job (the warning says so).
4. **Not drawn:**
   - scrolling of long lists: rows that do not fit are not drawn;
   - the analytics' drill into a line chart's point: bars only;
   - a cloud console's billing page;
   - the IDE's search and debug side panels: their activity bar icons are there, but only files and source control
     open a panel;
   - the debug variables pane.

   The hand-off rows do not ask for these.
5. **`pickTokenOn` in the outlined styles** (decision 3) is a runtime matter, outside these folders. Another solid
   mark drawn with it elsewhere in the library would have the same pale-on-pale result in hologram. I fixed it only in
   the shells.
