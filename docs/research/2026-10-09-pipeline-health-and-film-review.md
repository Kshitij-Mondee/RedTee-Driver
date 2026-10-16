# Pipeline health check and film review, 2026-10-09 (R-41)

STATUS: SHIPPED 2026-10-09. Asked by Kshitij: "look at both the video generation api pipelines and make sure they are
healthy and see their previous run logs and verify everything has been fixed", then "analyze the new videos from both
the pipelines frame by frame and rate each lesson". Cowork session, Linux sandbox, no paid calls.

## 1. What was run

| Check | Command or method | Result |
|---|---|---|
| Every Relay and Shuttle test (suites `relay_*`, `shuttle_rails`, `agents_*`, `run35_fixes`, `toolbox_models`, the device and router tests) | per-test runner, browser on (`HYPERFRAMES_BROWSER_PATH`) | **129 of 129 pass, 0 skipped** (after the fixes below; first run 126 pass, 1 fail, 6 skipped for want of a browser and a personal CLAUDE.md) |
| Mutation check of 31 fix tests with no recorded red run | each fix disabled in-process, test re-run | **31 of 31 go red** for the right reason; 2 extra mutations stayed green (holes, fixed below); `pipeline_health/2026-10-09-mutation-report.md` |
| My own red runs for the tests changed here | fix disabled in-process | all 6 red, then green |
| `py -m loom agents doctor` | sandbox | cannot reach providers from the sandbox (proxy 403, Anthropic 401); **live provider health unverified here**, run it on the PC |
| Latest lessons' state | `py -m loom status`, `qa/report.json`, `qa/render_verify.json` | both rendered; check 0 errors; render verification 63/63 (Relay), 51/51 (Shuttle). Both read "check stale" in the sandbox: a real defect, L-351 |
| Films | every frame scanned (`blackdetect`, `freezedetect`), 2 frames a second looked at (36 sheets, 576 frames), full-resolution crops of each suspect, loudness | section 3 |

## 2. Defects found in the pipelines, fixed and proven

- **L-351 The build hash depended on the operating system.** `qa.build_hash` hashed `str(relative path)` (backslashes
  on Windows, slashes elsewhere) in the OS's own sort order, so both lessons rendered on Kshitij's PC read "check
  stale" on Linux with their build untouched. A Shuttle resume or a CI run on another OS would redo the check, and a
  `render --force` would refuse. Fixed: the canonical form is the one Windows already wrote (backslash-joined parts,
  case-folded part order, as Python 3.12's WindowsPath sorts), so **no recorded Windows hash changes**; shown by
  reproducing `988b08d7eb5a843e` and `2604030d6eba356e` on Linux. Test `agents_relayfix_the_build_hash_is_the_same_on_every_os`
  (golden value; red on the old function). Not run on Windows itself here.
- **L-352 Four tests could not fail, or failed for the wrong reason.**
  - `agents_shuttle_snapshots_run_in_parallel_on_private_builds` failed on a correct build: a fixed 1.5 s sleep raced the
    locked half (2.5 s on 2 CPUs). Now a barrier: both pictures must be in flight together. Red with the lock held
    across the picture.
  - `agents_shuttle_lead_reads_the_engine_claude_md_and_nothing_of_the_persons` could not fail: with
    `CLAUDE_CONFIG_DIR` set the CLI reads the user file from that folder, never `~/.claude` (shown both ways on the real
    CLI), and it skipped on any machine without a personal file. Now it plants a marker file as both config dir and
    home `.claude`, with a control that the plain CLI sends it. Red only when both isolation layers are removed
    (`--setting-sources project` alone also isolates).
  - `agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher` (L-350) only checked that a string came back; an
    empty build's hash passed. Now it must equal the hash of the build without the vanished file.
  - `..._the_last_fixes_get_a_final_look_and_a_blocker_stops_the_render` called `final_review()` directly; removing its
    one call in the run loop left everything green. New `agents_relayfix_the_run_loop_stops_before_the_render_on_a_final_blocker`
    runs the loop. Red with the call removed.
- **L-353 A draft taken as a beat lost its reason (L-348 follow-up).** The server required a reason and dropped it; at
  the rails level a draft was taken with none. Now refused without a reason and logged (`take_draft_as_beat` in
  `logs/decisions.jsonl`, `draft_taken` in the trace). Test extended; red on the old `take_files`.
- **L-354 A locked file made the build hash an empty build's.** A file another process holds open (Windows answers
  `PermissionError`, which `is_file()` does not swallow) failed the whole listing three times and hashed nothing. Each
  file is now asked on its own. Red on the old listing.

Not fixed (minor, recorded): in `..._no_colour_survives_the_colour_maths...` the "no NaN in the page" assertion never
fires (the test scene draws no mix of "none"); the test still goes red through its other assertions.

Still OPEN from earlier runs (not touched): L-349's three (P10 accepts on the critic's own "ship"; no join tag in
get_example_scene; the avatar catalog entry), L-343 (kit anchors as keepable elements), R-36's third critic pass.

## 3. The films, frame by frame

Both are 2:21 to 2:24 at 1920x1080, 30 fps, -16.2 LUFS integrated (LRA 2.5 to 2.7), no silent gap over 1.2 s. Same
request, same style (story-cartoon), same mentor voice. Captions track the words in both (karaoke highlight). Audio
was not listened to: sync is judged from the caption timing only.

### Relay: `feedback-relay-v2` (143.8 s). Rating 6 / 10

What works: a clear arc (vague praise, nothing changed, the label, the behaviour, the effect, one step, a check, apply,
callback). The interruption at 0:10 (Sam's dark bubble slides over Priya's) shows the behaviour without a word. One
comment bubble gains a row per part (0:43 to 1:18), the strongest device in the film. The "Dominating" label falls off
(0:41). The callback (2:05) moves the calendar from This week to Next week. The b18 summary card the last critic flagged
is fixed (lines centred, 2:17).

Defects, by weight:
1. **The check's options do not show what makes B right** (1:31 to 1:54). On screen: A "Be more organised", B "Send it
   the day before", C "Be more prepared". Spoken B carries the behaviour and the effect; the card shows only the step,
   so a viewer reading the screen sees two steps and a vague one. The reveal ("Observable behaviour, a real effect")
   names things that were never on screen. Pedagogy, major.
2. **Characters cut by a hard edge mid-torso** (0:50 to 0:57): both bodies end on a straight line at y = 718 with chair
   backs visible below, and the bubble's tail sits inside Sam's head, covering his hair. Visual, major.
3. **Empty pages** of about 1 s at 0:16.5, 1:26.0 and 1:57.5, plus black dips at 0:08.1, 0:13.9, 2:04.9. The check
   allows them; a viewer sees the film stop. Pacing, minor to major.
4. **Underfilled frames**: the two cards at 0:17 to 0:25 use the top-left quarter; the dark thought cloud (0:31 to 0:40)
   carries three unlabelled icons; "You have been Sam" (0:14.5) is a large dark card holding only a thumb icon. Minor.
5. Small text: the opening bubble (0:03 to 0:08) and the callback bubble (2:06 to 2:16) are about 20 px. Minor.
6. A white disc crosses the bubble text at 1:18.5 (transition). A stray dot sits top-left in every room shot. Trivial.

### Shuttle: `feedback-shuttle-v2` (141.2 s). Rating 7.5 / 10

What works: one world, planted and paid off. The whiteboard agenda, clock and This week / Next week calendar appear at
0:00; "Budget question" sits last on the agenda (0:15), the "Budget decision" card slides to Next week as the effect is
spoken (1:05), and the last shot puts the budget question first with "Decided" (2:16). Feeling versus target with a dart
(0:24). The "You ramble" tag sticks to Theo and a glass wall rises (0:42 to 0:49). The check is the best piece in either
film: three full-text cards, each with three dots (behaviour, effect, step) that fill on the reveal; B gets three, C two
and a red ring "No step", A "Label" (1:32 to 2:01), with a silent pause to decide (1:46). No black frames.

Defects, by weight:
1. **The "Next step" tag is struck through by the red emphasis frame** (1:11.5 to 1:18, about 6.5 s): the frame's top
   edge runs through the tag's words, which are unreadable. Neither the check nor the critic ("ship") caught it.
   Visual, major.
2. Small text: the agenda items (0:13 to 0:17, 2:12 on) and the laptop notification at its small size are about 14 to
   18 px, unreadable on a phone. The check cards are about 24 px. Minor.
3. The speech bubble wraps "a / bit." onto its own line (0:05 to 0:33, repeated in three shots). Minor.
4. Page-turn flashes and empty paper at 1:19, 1:28 and 2:09, an iris at 0:33.5. Minor.
5. The two characters sit at the frame's edges with a dead centre in the table shots, and Theo's mouth moves on lines
   that are the narrator's (0:40 to 0:48). Minor.

### Side by side

Shuttle is the better lesson: its world carries the facts (agenda, calendar, clock), and its check is honest about
what makes an answer right. Relay has the single best device (the bubble that gains a row per part) but its check
misleads, and its frames are emptier and stop more often. Both share two blind spots in the engine's gates (below).

## 4. What the gates missed (OPEN, candidates)

- **Text crossed by a stroke.** Shuttle's tag passed the layout check; the overlap check looks at text over text and
  boxes, not a border line through a label. Candidate: a painted check that samples a label's box for a foreign
  stroke colour.
- **On-screen option text versus the spoken option.** Relay's B card dropped the half that makes it correct. Candidate:
  the storyboard gate compares each quiz option's on-screen text with the script's option and requires every
  distinguishing clause the reveal names.
- **Figures cut by a clip box.** Relay's 0:50 crop is an element's clip rectangle, not the frame edge. Candidate: the
  probe reports a character whose drawn box is cut by its own element's bounds inside the frame.
- **Empty paper during a join.** Inside the allowance by rule; on screen it reads as a stop. Candidate: halve the
  allowance for page turns, or fill the turn with the next scene earlier.

## 5. Evidence

Frames at full size: `docs/research/pipeline_health/relay_0050_clipped_figures.jpg`, `relay_ghost_bubble_crops.jpg`,
`shuttle_tag_struck_and_quiz.jpg`. The 36 contact sheets (2 frames a second) were a sandbox copy and are not kept; they
are re-made with `ffmpeg -i <mp4> -vf "fps=2,scale=480:270,tile=4x4"`. Mutation table:
`docs/research/pipeline_health/2026-10-09-mutation-report.md`. Tests and red runs: this document, section 2.
