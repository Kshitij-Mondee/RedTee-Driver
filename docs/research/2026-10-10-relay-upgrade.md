# Relay upgrade: one vision, honest tools, one world (2026-10-10, D-155)

Asked (Kshitij, after the research in `2026-10-10-relay-quality-context-research.md`): "I believe that sonnet writes
good. it's not its fault. Just go ahead and upgrade the relay pipeline and give it all the fixes required." So the
model placement stays (Sonnet writes, Opus storyboards, D-142), and every finding of the research is fixed in the
engine. Tests: `tests/suites/relay_upgrade.py` (16), red runs `docs/research/relay_upgrade/red_runs.py` and
`red_runs.txt` (14 of 14 red with the old behaviour put back, green restored; 2 red by construction).

## 1. Honest tools

| Finding (R-46) | Change | Where |
|---|---|---|
| Snapshot times were seconds from the beat start, while every number the worker had was on the lesson clock: 48 of 146 snapshots outside their beat, 4 scenes submitted unseen | `lab_snapshot` takes LESSON-clock seconds (the phrase timings' clock, the scene API's t); a time outside the beat (1 s before its start to 0.5 s after its end) is refused with the beat's span, the draft still written. The same function serves Shuttle, whose description said the same wrong thing | `loom/agents/tools.py` `lab_snapshot_prepare`, tool description; `loom/shuttle/server.py` |
| Whole files re-sent with every look (Shuttle L-377: about a third of sub-agent cost) | `edits` ([{old, new}]) on `lab_snapshot` and `kit_preview`; `apply_edits` shared with Shuttle (`Server._edited` calls it) | `tools.py` `apply_edits` |
| Runtime errors passed the submit gate (13 of 17 sessions in feedback-relay-sb) | `submit_scene` holds a file whose own last look threw, or that changed after such a look (not counted as a resubmission); a kit part's error, once reported with fix_route "kit", lets it through; after 2 holds the file is taken, so no worker loses its scene | `tools.py` `_runtime_hold` |
| Bug reports lost: the finding's fields were never shown, and "kit" was not a route (the normaliser made every kit report "human") | `report_finding` shows the finding's fields (required ones marked, lenient so the normaliser still maps near misses); "kit" added to the schema and the routes | `tools.py` `_finding_param`, `FIX_ROUTES`; `contracts/finding.schema.json`; Shuttle's `report_finding` |
| No builder could fetch a plan file | `read_artifact`: `film` (the card), plan files, `storyboard:<key>`, `scene:<beat>`, `kit`, `kit_api`, `kit_draft`, `review`; for every reading role and the critic | `tools.py` `t_read_artifact`, `READ_COMMON` |
| The kit worker could not see its kit | `kit_preview` (Shuttle's `kitpreview`, every part through its states); in an agents run `submit_kit` takes only a previewed source and holds a preview that threw (twice at most); `source` left out submits the previewed draft | `tools.py` `t_kit_preview`, `t_submit_kit`; conductor sets `require_kit_preview` |
| Snapshot sheets: three 640 x 360 tiles (about 520 px a frame after the reader's scaling), unlabelled, a missing frame dropped silently | One or two frames at 1280 x 720 (stacked), three or four in a 2 x 2 grid of 960 x 540, each labelled with its time; a missing time is named in the reply | `loom/qa.py` `snapshot_sheet_build` |
| One lesson lock held whole snapshots (median wait 82 s, max 557 s); no tool call was logged | `lab_snapshot` takes the lesson lock itself for the draft and compose only; one line per call in `logs/cc/<task>/calls.jsonl` | `loom/agents/cc_server.py` |
| Bare tool names cost 14 failed calls in v2 | The claude_code system prompt maps each name to `mcp__relay__<name>` | `loom/agents/cc_runner.py` |

## 2. One vision: some context, not all

- **The film card** (`conductor.film_card`, code, no model call, at most 12,000 characters): the brief's outcome,
  through-line, what to avoid and voice; the style; the storyboard's concept, story, cast, stations, devices, motifs,
  value bands and kit parts; and every beat in one line (kind, station, join, subject, what is said). It is the first
  block of the scene, kit, clip and critic messages and of every fixer's (a fresh storyboard fixer also gets the
  outline). The same text for every task of a lesson, so it rides the cache. Before the storyboard it holds the brief's
  part only. Shuttle's sub-agent briefs use the same `task_message`, so they carry it too.
- **The planners get the whole brief** (through-line, arc, what to avoid, voice) and the narrator; the persona pick
  gets `voice_note` (it asked for `voice`); the script gets THE FILM'S LOOK (the style summary, the mix, the brief's
  visual direction) because it writes every `visual_intent` and rates how much moves. The script card's rule 9 says
  that in a story lesson the story is the taught thing (a person doing the behaviour, the reaction, the consequence).
- **Craft notes preloaded** (`runtime.craft_notes`): the style guide's sections for the role (scene: palette roles,
  composition, people, recipes, failure modes, polish checklist; kit, clip, critic and the storyboard roles their own)
  and the skill sections the card names, in the cached prefix (scene about 47 KB with the card). About a sixth of what
  parity pasted, and none of it was being fetched.
- **Style summary** now carries the palette token names and roles (the scene card promised them).
- **Role cards** say what each agent really receives (the critic no longer claims `lab_snapshot`; the scene, kit,
  clip and critic cards name the film card and craft notes); `_shared.md` rule 12 says what THE FILM is.

## 3. One world

- **Gate `one_world`** (`checks/story.py world_checks`, a film check under the ratchet): a template or blueprint that
  draws its own people and room (`scenario.dialogue`, `hero.character_moment`, `hero.journey`) on a station the
  lesson's bespoke beats draw is an error; the fix is to draw the beat there with the kit, or give it its own station
  as a deliberate cut-away. Structure templates (a quiz, a term) are not touched. feedback-relay-v2 has two (b02, b06).
  A count of stations was tried as a note and dropped: mfa-story, one of the best lessons, uses 12 for 21 beats.
- **Finished lessons baselined** (`loom/checks/film_baseline.json`, by hand, as the ratchet requires; `_note_r46`):
  bench-20261006-132027-claude-balanced 3, bench-20261006-151439-budget 1, bench-20261006-151439-budget-fix1007 1,
  blameless-postmortem 1, feedback-relay-v2 2, feedback-shuttle-s1 1. Each is a warning for that lesson only.
- **The pilot pair** (Shuttle D-144): with a kit and three or more new bespoke beats, the first two that share a
  station (a `continue` join first) are written first; their kit reports send the kit back once before the other beats
  start (not routed again later), and their last pictures go to every other scene worker as THE LOOK SO FAR.
- **Outline and storyboard cards**: the story's beats are planned in its main set; in an agents run the template mix
  is a ceiling with no 25 % cap on upgrades.
- **The other mix is named**: an illustrated style on the classic mix prints that `--mix cinema` exists (rule 11: both
  stay, the person chooses).

## 4. Tests changed

- `agents_kit_worker_runs_once_before_the_scenes`: its Conductor runs with `require_snapshot=False` (the preview gate
  has its own test).
- `agents_shuttle_snapshots_run_in_parallel_on_private_builds`: times on the lesson clock; its stub takes `missing`.

## 5. Not verified, and open

- The film's quality: only a real run shows it (the verification run is logged in RUNS as the next entry after this
  document, with its film rated within story-cartoon against feedback-relay-v2).
- `agents_shuttle_pilot_check_verifies_beats_after_a_kit_fix` fails today because D-154 made Loom's checker the default
  and the test's stubbed probe carries no layout audit; not from this change (another session's work, left to it).
- The cost effect of edits, the pilot and the film card is unmeasured until the run.

## 6. Verification run (R-48): `feedback-relay-v3`

- **Film** `renders/feedback-relay-v3.mp4`, 140.6 s, 12 beats; render verification 40 of 40; check 0 errors, 20
  warnings; critic pass 2 "ship".
- **Rated within story-cartoon (D-122), R-41's rubric: 7 / 10** (feedback-relay-v2 6 / 10, feedback-shuttle-v2 7.5).
  What works: one world and one cast from the first frame to the last (the manager and Dev in the same meeting room;
  the board is that room's whiteboard, entered by a zoom; the coffee corner is the same two people); the vague remark
  is a grey cloud over Dev that the closing beat dissolves; the board builds one line per part with an icon each
  (camera, chair, speech) and the same three-line sheet comes back on the coffee table and in the last beat; the check
  shows both options in full (B carries behaviour, effect and step on screen, v2's worst defect), with a pause pill and
  a reason for why not A.
  Defects, by weight: (1) a stray hook mark at the top centre of the coffee-corner beats (b09, b11, about 1:39 to 2:04),
  meaningless on screen; (2) the board beats b04 to b06 hold one card for about 27 s, with an empty lower half at
  first and its part labels (observed behaviour, effect, next step) about 14 px; (3) the presenter card b10 (about
  1:43 to 1:58) holds three single words in a large empty card; (4) two black dips, 0.4 s at 1:58.2 and 0.3 s at
  2:04.9 (v2 had three); (5) the check's cards sit in the top half with the lower half empty (a template frame);
  (6) the last second is blank paper with a faint "good terms" before the end.
- **Process** (run 1 14:57 to 17:26, exit 1 at the check's probe timeout; run 2 resume 2665 s, exit 0): every stage
  accepted first time up to the scenes; script 12 beats, 6 change over time (v2: 5 of 18); storyboard 9 of 12 bespoke,
  the story in the meeting room, its board and a coffee corner, only the quiz pair as templates (v2: 9 of 18 bespoke,
  8 stations); the kit previewed 5 times before it was taken (text overflow and unknown motion names fixed before any
  beat used it); pilot b01 and b02 first; 0 snapshot times refused (every look inside its beat; v2: 48 of 146
  outside); 6 of 9 workers sent edits; the runtime hold stopped b04, b05 and b06 once or twice and they reported real
  defects (the storyboard's keep lists named board elements b04 never drew; a kit label 4 px over its box). On the
  resume the storyboard gate caught the keep lists and a fresh storyboard fixer (with the film card and the outline)
  fixed them; one repair round (storyboard, kit, b03, b06, b11, b12) took the check from 20 errors to 0 and the
  critic from a blocker (placeholder hands in b06) and a major (b10's card) to "ship".
- **Cost** (engine table, notional at list price on the subscription; Gemini billed): $8.85 notional over 138 calls and
  31 tasks (v2: $11.10, 276 calls, 61 tasks); first pass $6.17, rework $2.67 (v2: $6.02 and $5.08); Gemini $0.11.
  Not like for like: v3 has 12 beats and more of them drawn ($0.74 a beat against v2's $0.62).

Open after it: L-394 (write continue chains in order); the six film defects above.

## 7. After the verification run (R-49)

- L-394 closed: `Conductor.chains` writes a continue chain in order (chains in parallel).
- `loom/compose.py`: a seam between worlds becomes a fade through the field colour, not a dip through black.
- `runtime/world.js`: the last scene holds and leaves with the camera's outro fade.
- R-48's defect list corrected at full size (L-401): the presenter card and the check's cards were fine.
- **Run 3 result:** exit 0 in 1517 s; check 0 errors, 19 warnings; the critic's fresh first pass found three minors
  (b07 a ring touching its pill, b09 the hook seen before its pennant, b11 the sheet's labels about 22 to 25 px), each
  sent to its owner and fixed (a storyboard patch, b09, b11), then "ship"; render verification 40 of 40.
- **Seen in the new render (frames at full size):** the 1:58 join is a fade through the paper colour (no black frame; the
  only black left is the storyboard's own 0.3 s dip at 2:04.9); the last half second fades as one frame (the room, the
  people and the cards together); b11 has no stray hook; b09's pennant hangs on its hook.
- **Cost of the follow-up:** $1.14 notional in 29 calls (the b11 fix, the critic's three fixes, the critic); the lesson in
  all $9.98 notional, Gemini about $0.17 billed.
- **Rating after the fixes:** 7.5 / 10 within story-cartoon (from 7): the three real defects fixed; what is left is craft,
  not breakage (the board holds one card for about 27 s while it builds; the board's part labels are small).
