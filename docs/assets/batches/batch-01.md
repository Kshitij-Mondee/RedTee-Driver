# Batch 01: Family M, screencast app shells (T-149 to T-153)

Branch `assets/batch-01`, made in a Claude Code on the web session on 2026-10-16 from the hand-off sheet
(`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, section 7b, Family M) and the cloud route (`docs/assets/HANDOFF_CLOUD_START.md`).

| id | file | what it is |
|---|---|---|
| T-149 | `app_email.js` | email client: folders, a thread list with unread and flags, the reading pane, a compose window |
| T-150 | `app_chat_workspace.js` | team chat: channels and direct messages, mentions, reactions, file cards, threads, a composer |
| T-151 | `app_calendar.js` | calendar week view: events in lanes, a now line, a booking form with the guests' availability |
| T-152 | `app_docs_editor.js` | document editor: toolbar, headings and lists, suggestion mode, comments in the margin, version history |
| T-153 | `app_lms_course.js` | learning platform: course outline, lesson player, quiz with feedback, progress, certificate |
| shared | `_app_kit.js` | not a component: the helpers the five shells share (`Loom.appKit`) |

Each has its fixture in `fixtures/<id>.json` (5 cases: 3 with different content, one of them the maximum the params
allow, and the shell in 3 themes) and its sheet in `library/sheets/<id>.jpg`.

## Gate results

`library accept` cannot route a commissioned component yet (Left open, item 1), so each id was proved with the gate
accept runs, `check_component(<id>)`. That covers lint, catalogue, fixtures, every case in all 17 style packs, the sample-text
audit and the sheet. Results, final run:

`app_email`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_email.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_chat_workspace`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_chat_workspace.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_calendar`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_calendar.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_docs_editor`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_docs_editor.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`app_lms_course`: PASSED (0 error(s)); styles rendered: 17; sheet: library/sheets/app_lms_course.jpg
- 17 of 17 packs with 0 runtime errors, 0 console errors and 0 sample-text leaks over 5 cases each;
- warnings: none.

`python3 -m loom library accept <id>` itself, for each of the five ids, exits 2:
`library <id>: REJECTED (1 error(s)) - unknown form <id> (run py -m loom library harvest first)`.

## What I looked at

I looked at every row of each `library/sheets/<id>.jpg` (17 packs x 5 cases), and at full-size frames at 2.4 s and
5.9 s in corporate-clean, whiteboard, blueprint, hologram, story-cartoon, engineering and line-art. I checked:
- words inside their boxes, with nothing overlapping that should not;
- dark and light packs both legible;
- nothing drawn that no param supplied;
- each action's end state.

Fixed after looking, though the checks had passed:
- body text drew semi-bold (the caption role's default weight); regular text now asks for 400;
- flags were drawn in the success colour; now neg;
- the window's bottom corners were square;
- the chat thread pane covered the conversation mid-word; the conversation now reflows beside it;
- the calendar showed tiny lanes as single letters ("C…") and stand-ups with no title; now no text in a too-narrow
  lane, and a short event is drawn tall enough for its title;
- a dragged event kept its old times; it is now redrawn in its slot;
- the docs margin cards stacked far from their lines; they now take the free place nearest their line;
- the collaborator avatars overlapped their initials;
- the insert after a struck phrase had no space ("quarterevery");
- the learning outline kept the old lesson highlighted;
- the docs error banner covered the heading; it is now a notice in the margin.

## Decisions (each made without asking, as the brief says)

1. **One shared helper file, `runtime/components/_app_kit.js`.** The five shells need the same window, pointer,
   typing, measured text, state switch and theme code. Writing it five times would have drifted. The file starts with
   `_`, so the catalogue tool (`tools/node/catalog.mjs`), compose and the sheet all load it before the components. It
   registers no component and touches no DOM at load. **Consequence:** an `app_*` file needs `_app_kit.js` beside it.
   The later Family M batches (T-154 to T-162) can reuse it.
2. **Two hosts, one body.** In the screencast style with its engine loaded, a shell asks the engine for the window, the
   pointer, the camera, the toasts and the teaching layer (`W.app` with `chrome: "window"`). It then draws its own body
   inside the app's main area and registers each click target as an engine part (`A.reg`), so `A.click`, zoom,
   `sc_pointer_late` and the teaching layer all work on it. In every other style the shell draws its own window and its
   own pointer: minimum-jerk travel at the engine's pace (0.42 + d/1500 s, 0.5 to 1.3 s), arriving 0.3 s before the
   press, a dip and an accent2 ring on each press, typing at 14 characters a second. `engine: "off"` forces the
   self-drawn host. The screencast engine has no custom region kind, so the bodies (a reading pane, a week grid, a page
   with suggestions) are the shells' "own small parts" over the engine's window. Its built-in regions (table, list,
   form) are not used: none matches these layouts closely enough.
3. **Every word comes from a param.** UI chrome words ("Reply", "Send", "Search mail", "Today", "Save", "Submit") are
   optional `labels` (each shell lists its keys). With no label, the control shows its Lucide icon alone. This keeps the
   sample-text audit clean and follows the screencast rule "labels must be true to the product being taught". Times
   inside events ("9:30 - 10:30") and player times are made from numeric params; they are numbers, not words.
4. **Text truncates only at word boundaries.** One-line text that does not fit ends in an ellipsis after a whole word.
   A single long token (a file name, an address) is cut at a separator (`_ - . / @`). A word cut to its first letters
   would read as a word no param supplied, and the audit rightly flagged it ("treasu"). In very narrow event lanes the
   calendar draws no text rather than single letters (`whole: true`). Paragraphs clamp to a line count the same way.
5. **UI text sizes come from the pack.** UI text uses the caption role at about 21 px, clamped to the pack's caption
   range (never below its floor: 20 to 24 px across the 17 packs). Headings use the label role, titles the lead role.
   Box heights come from the face's real ascent and descent (`AK.boxH`, `AK.lineH`), so the handwriting and cartoon
   faces keep the inset the checks ask for.
6. **Colours are tokens, or mixes of tokens.** Hairlines, selection washes and hover washes are `Loom.style.mix` of
   pack tokens, as the screencast engine does. Product tones: pos, neg, accent4 (warning), never accent2 (the teaching
   signal). The video player in T-153 must be dark in every pack, so it takes the darkest neutral token of the pack and
   whichever token reads best on it.
7. **Reference fidelity is `theme` plus `layout`.** `theme: {accent, sidebar, page, card, radius, density, text}`:
   - the colours are token names (the rule forbids literal colours, so a screenshot's hex palette is not taken here;
     the screencast engine's own `theme` still does that for `W.app` shells);
   - density runs 0.85 to 1.3, the text scale 1 to 1.4.

   `layout` sets the column widths (`sidebarW`, `listW`, `threadW`, `pageW`, `marginW`, `gutterW`). Fixture cases 4
   and 5 of each shell show it in two more themes beside the default.
8. **States.** `state: "ready" | "loading" | "empty" | "error"`:
   - loading draws skeleton rows;
   - empty and error draw an icon with the words of `labels.empty` or `labels.error` (or `notice`);
   - `setState(name, t)` cross-fades between them;
   - success is the product's toast after an action (`labels.sent`, `saved`, `moved`, `restored`).

   The calendar, docs and learning shells have no empty state, because an empty week or page is just the ready view
   with no events.
9. **Actions are functions on the parts and scriptable steps.** Each shell returns its actions (for example
   `parts.open(i, at)`, `parts.reply(text, at, {send})`), and each returns the time its reaction settles, so a scene
   can chain them. The same actions can be listed in a `steps` param, `[{do, at, ...}]`, which makes a walkthrough a
   few lines in a scene and lets the fixtures prove the actions. `cps` (default 14) sets the typing speed. One fixture
   raises it so a whole compose fits the 6 s sheet.
10. **Section 7 overlaps:** T-150 extends `ui.chat`, T-151 extends the `calendar.plan` template, T-152 extends
    `ui.doc` and `document.page`, and T-153 extends `quiz.question` and `quiz.answer`. Each file's header comment
    says so. None of them redraws those artefacts; they are different, larger things.
11. **Family label:** `family: "ui"`. Section 5's family list has no `app` family, though Family M's ids start
    `app_`. Kshitij may prefer a new `app` family, which is a one-word change per file.
12. **Sheets in the screencast row show the self-drawn host.** The library sheet loads no style engine, so its
    screencast row is the shell's own window and pointer. The engine path was proved separately (below).
13. **Branch.** The session was configured for `claude/elegant-ride-ymuztn`; the brief asked for `assets/batch-01`.
    The work is on `assets/batch-01` as the brief says.

## The screencast engine path (proved outside the sheet)

The sheet harness does not load `runtime/engines/screencast.js` and does not run the world's frame clock, so it cannot
show the engine host. I proved it with a scratch harness (not committed):
- `render_sheet` with `engines/screencast.js` added to the scripts;
- `Loom.clock` driven from the timeline.

All five shells, all 5 cases each, rendered with 0 errors, 0 console errors and 0 leaked words. The only warnings were
`sc_pointer_late` on the first click of a case: the engine's pointer starts far from the first target and the fixtures
press early. In a lesson the cue gives it time.

I looked at the frames:
- the engine's pointer and press ring land on the shell's own controls;
- the engine's toasts show;
- the chat thread reflows the conversation;
- the calendar drag lands in its new slot with its new times.

That run found and fixed two bugs:
- the click ripple was drawn in a translated layer, which put it about 100 px off;
- the drag's carry read the engine pointer's shape wrongly (`q.p`).

## Left open

1. **`library accept` cannot accept a commissioned component (engine, not the items).** For each id,
   `python3 -m loom library accept <id>` exits 2 with
   `unknown form <id> (run py -m loom library harvest first)`.

   `loom/library.py accept()` reaches `check_component` only when the id is a harvested form or has a `promote`
   decision in `library/decisions.json`. A commissioned component (`commissioned_by`, no lesson uses) has neither,
   although `check_component` already has a commissioned branch (lines 488 to 495).

   I could not change `loom/` (outside this batch's folders), so I ran `check_component(<id>)` directly. That is the
   exact gate `accept` runs after its bookkeeping: lint, `node --check`, catalogue, content params, 3 distinct
   fixtures, every case in all 17 packs, the sample-text audit and the sheet. Its output is above.

   A one-line fix for Kshitij's session, in `accept()`, routes a commissioned component to `check_component` and
   records the decision as `promoted` on a pass:

   ```python
   commissioned = bool(((_components().get(fid) or {}).get("commissioned_by")))
   if (F and F["status"] == "approved") or (comp_file.exists() and ((decisions.get(fid) or {}).get("decision") == "promote" or commissioned)):
       ...  # and create decisions[fid] = {"decision": "promote", "status": "promoted", "commissioned": True} when absent
   ```
2. **Generated files are left out of the commit.** The gate rebuilds them, but the brief says to commit only the items,
   fixtures, sheets and this file, and CLAUDE.md rule 4 says never hand-edit generated files. Running the gate
   rewrites:
   - `runtime/catalog.json`, `runtime/catalog.md`;
   - `runtime/capabilities.json`, `runtime/capabilities.md`;
   - `library/forms.json`, `library/FORMS.md`, `library/scenes/`.

   I restored them. Kshitij's `library accept` rebuilds them.
3. **Setup in this sandbox.** `bash tools/cloud_setup.sh` stopped at its first step. `pip install -r
   requirements.txt` failed building the optional `manim` (`RequiredDependencyException: pangocairo >= 1.30.0 is
   required`: the system pangocairo library is missing), and the script's `set -eu` ended it there. I ran the remaining
   steps by hand:
   - the requirements without manim (all installed);
   - `npm ci` (ok);
   - `npx hyperframes browser ensure` (downloaded Chrome Headless Shell 152, ok).

   `python3 -m loom doctor` then reported one XX row: the kokoro voice model (`py -m loom setup voice`), which narration
   needs and components do not. I did not download it (downloads need Kshitij's approval). Manim shows as optional and
   missing. Suggested fix: `cloud_setup.sh` installs `manim` only if pangocairo is present, or continues past a failed
   optional package.
4. **Sizes.** The shells default to 1728 x 856, the screencast engine's window. They lay out from `w` and `h`, but
   below about 1300 x 700 the columns get tight. Each has `layout` to narrow its side columns.
5. **Not drawn:** a month view in the calendar, threads inside threads in chat, and the scrolling of long lists. Rows
   that do not fit are not drawn, and `parts.more` (email) or `views[i].hidden` (chat) says how many. The hand-off
   table does not ask for these.
