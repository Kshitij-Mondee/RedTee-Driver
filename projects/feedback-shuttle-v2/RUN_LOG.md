# RUN_LOG: feedback-shuttle-v2 (Shuttle, the measured run on the fixed rails), 2026-10-09

Written by the Shuttle build session, which ran this lesson as operator. Kshitij's instruction: "start the measured run
and this time as well, don't interfere actively. But make sure that if you catch something that will be a headache or
can like spend a lot of time on this one run only and can be fixed, fix it actively and then again go back to testing."
Sources: `logs/shuttle/trace.jsonl`, `calls.jsonl`, `state.json`, `report.md`, `launcher_out.txt`, `logs/decisions.jsonl`
(interventions logged with `py -m loom note`), Claude Code's own transcripts of the stopped session, and the MP4.

## Result

- **Exit 0 at 07:10:28, every phase P1 to P11 accepted.** Film: `renders/feedback-shuttle-v2.mp4`, 141.2 s, 1920x1080,
  30 fps, audio, captions, transcript. Render verification 51 of 51 frames, 0 mismatches.
- **Request:** the Opus run's, word for word (topic "How to give feedback that changes behaviour, not just feelings",
  corporate employees, story-cartoon, 2 minutes, mentor); `loom new --isolated` (its design seed read no other film).
- **Models:** Opus 5.5 leads P1 to P6 and P10 to P11 (68 calls); Sonnet 5.5 leads the build P7 to P9 and serves every
  sub-agent (281 calls; D-145, pinned full ids, D-144); Gemini 3.8 Flash skeptic and critic (8 calls).
- **Wall time:** 05:23:13 to 07:10:28, 1 h 47 min (the first start failed at 05:23 in 16 s, see intervention 1).
- **Cost:** $18.31 logged at the engine's price table, plus $1.25 recovered from the stopped build session's
  transcripts (intervention 6): **about $19.56** list price, all within the subscription. No overage; the five-hour
  window peaked at 54 %. Gemini (real money): $0.14. The CLI's own figure for the sessions that ended normally: $14.14.

## Against the Opus run (feedback-shuttle-opus, R-34), the same request

| measure | Opus run (2026-10-08) | measured run (2026-10-09) |
|---|---|---|
| lead | Opus throughout | Opus plans and judges, Sonnet builds |
| wall time | 5 h 11 min | 1 h 47 min |
| cost, engine table | $71.27 (of it $18.33 billed as overage) | about $19.56, no overage |
| model calls | 647 | 352 logged (plus the stopped session's unlogged tail) |
| reopens | 4 (cap 3 plus one granted by a person) | 1 (the kit, right after the pilot) |
| when the kit problem showed | after all 11 beats, 85 min into P7 to P9 | after 2 beats (the pilot), 6 min after the kit |
| first check | 52 errors | 6 errors |
| checks to pass | 6 rounds | 4 rounds (06:36 6, 06:43 1, 06:51 1, 06:55 0) |
| critic passes | 5, never "ship" (2 majors accepted) | 2 (5 majors, then 0: "ship") |
| agents per beat, worst | b05: 8 | b15: 3 (author, 2 fixers) |
| snapshots | 102, about 50 s each, one at a time | 61, about 32 s each, in parallel |
| film | 132 s | 141 s |

## Timeline

| time | event |
|---|---|
| 05:23:13 | run; P1 to P4 session ends at once: "Failed to refresh OAuth token: another Claude Code process is refreshing it"; retried at 05:23:22, same; exit 2, $0 |
| 05:24:28 | intervention 1 (wait out a login refresh), resume; P1 to P4 session (Opus) |
| 05:25 / 05:27 | fact-finder; facts approved unattended |
| 05:31:09 | P1 to P4 done (CLI $1.71); P5 to P6 session (Opus) |
| 05:35 / 05:36 | storyboard refused (13 gate errors), accepted on the next submit |
| 05:43:39 | plan approved unattended; P5 to P6 done (CLI $2.13) |
| 05:43:59 | P7 to P9 session on **Sonnet** (claude-sonnet-5-5 confirmed in its init) |
| 05:44 to 06:12 | kit-builder (13 previews); its first submit refused (verified/unverified as sentences), accepted at 06:12:52 |
| 06:13 | the lead delegates only the pilot pair (b01, b02) |
| 06:19:13 | **pilot_check fails** (4 overlaps at 0 s and 9.897 s); the lead is refused every look tool (intervention 3) |
| 06:19:54 | the lead reopens P7: the kit's wall_calendar and comment_bubble draw their text twice |
| 06:25:41 | the second kit-builder's kit accepted (one refused submit for the same sentence slip, intervention 4) |
| 06:25:50 | pilot_check refused "submit the pilot beats first" (they were "to verify"; intervention 5); the lead sends a fixer |
| 06:29:26 | **pilot passes**, 0 errors; 06:30 to 06:31 the other 13 beats go to scene-authors in parallel |
| 06:32 | **the launcher dies** (FileNotFoundError in build_hash during a compose; intervention 6); the session runs on unguarded |
| 06:34:12 | the orphaned session stopped; 06:34:21 a fresh P7 to P9 session (Sonnet) |
| 06:34:32 | its accept_phase('P8') takes 15 beat files, 10 of them unsubmitted drafts (intervention 7) |
| 06:36 to 06:55 | checks: 6 errors, 1, 1, 0; fixers on b09, b10, b13, b14, b15 (b15 twice) |
| 06:55:11 | P7 to P9 done (CLI $6.28); P10 to P11 session (Opus) |
| 06:56:57 | critic pass 1: 5 majors (b01 face, b04 blank arrive, b11 colour coding, b14 empty screen, b16 18 px label) |
| 07:02:45 | after fixers and a clean check, critic pass 2 judges only those 5 beats: 0 findings, "ship" |
| 07:02:59 | the lead's own submit_review refused: P10 was already accepted on the critic's "ship" (noted, not fixed) |
| 07:09:52 | render (51 of 51 verified); 07:10:12 final approved unattended; 07:10:28 exit 0 |

## Cost at every step (engine table; notional, the subscription paid)

- **By phase:** P1 $0.35, P2 $0.28, P3 $0.14, P4 $0.62, P5 $1.95, P6 $0.75, P7 $1.95, P8 $5.94, P9 $1.97, P10 $2.92,
  P11 $0.44, no phase $1.01; plus $1.25 unlogged in the stopped P7 to P9 session (recovered from its transcripts).
- **By agent:** lead $12.09 (133 calls), scene-author $2.38 (98), fixer $2.41 (86), kit-builder $1.20 (25), fact-finder
  $0.09 (2), critic $0.09 (7, real), skeptic $0.05 (1, real).
- **By model:** Opus 5.5 x68, Sonnet 5.5 x281, Gemini 3.8 Flash x8. 21.9 M tokens, 87 % of input read from cache.
- **Sessions (the CLI's own):** P1 to P4 $1.71 (two 0-turn failures $0), P5 to P6 $2.13, P7 to P9 (the fresh one)
  $6.28, P10 to P11 $4.03; the stopped P7 to P9 session has no CLI figure (no result), its transcripts price it at $7.72.

## Interventions (operator; none touched the lesson's content; each logged in `logs/decisions.jsonl` as a note)

1. **Login refresh collision** (05:23): a session that failed on "Failed to refresh OAuth token" now waits 60 s and
   starts fresh, not counted as a try (`launch.auth_transient`, L-341). Resumed at 05:24.
2. **Style guide lookup** (05:31): `list_skill_sections('story-cartoon')` and the guide's path now find
   docs/styles/guides/<id>.md (shared, from the next session).
3. **Looking at a failing pilot** (06:19): pilot_check returns a picture of the failing moments; frames, contact_sheet
   and strips open from P8 (from the next session).
4. **Kit notes as sentences** (06:24): two kit-builders sent verified/unverified as sentences; a sentence is taken as a
   one-item list (shared, from the next session).
5. **Pilot after a kit fix** (06:25): pilot_check checks beats that are only "to verify" and keeps them on a pass (from
   the next session; this session sent a fixer instead).
6. **Launcher crash** (06:32): build_hash skips a file vanishing mid-read; the launcher's phase lookup never raises
   (L-350). The orphaned session was stopped at 06:34:12 and the run resumed at 06:34:21. Lost: about 2 minutes of 13
   scene-authors' work and the cost rows of the session's last minutes ($1.25 recovered from transcripts).
7. **Drafts taken as beats** (06:34): the fresh lead's accept_phase('P8') took 10 unsubmitted drafts (b04, b06 to b10,
   b12 to b14, b16). The rule is fixed for later sessions (a draft is not taken unless named with a reason, L-348).
   Undoing it in this run (stop the session, take back the acceptances) and running the full Shuttle suite were
   refused by Claude Code's permission system; Kshitij was asked and had not answered when the run ended. The check
   and the critic caught three of the drafts (b04 blank arrive, b14 empty screen, b16 small label), which were fixed.
8. **API names** (06:39): get_api_section('held', 'ctx.held', 'ctx.el', 'exits') returns the section that uses the name
   (shared, from the next session).
9. **Findings in other words** (06:41): report_finding maps detail, summary, "medium" and missing route to the schema
   instead of refusing (shared, from the next session).

## Errors and refusals, as seen

- Tool errors: read_artifact 18 (files not written yet, expected), get_example_scene 6 ('peep', 'continue'),
  get_api_section 4, list_skill_sections 1, get_skill_section 1 ('review' in STORYBOARD_GUIDE), get_catalog_entry 1
  ('avatar'), report_finding 1.
- Refusals: delegate 4 (files of the stopped authors' open tokens: collect first), pilot_check 2, frames, contact_sheet,
  strips 1 each (before intervention 3), lab_snapshot 1 (6 times asked, 4 allowed), submit_review 1 (P10 already
  accepted).
- Not fixed, noted: P10 accepts on the critic's own "ship" before the lead submits its review; get_example_scene has no
  tag for joins ('continue'); get_catalog_entry('avatar') could say where the avatar is documented.

## The film, as seen (a frame every 6 s, and frames around the end)

Nina and Theo at their desks in a story-cartoon office: a whiteboard, a clock, a wall planner with "This week" and
"Next week". Nina's comment "Great job, maybe tighten it up a bit." arrives in a bubble and on Theo's screen; a
"Feeling" card against a "Target" dartboard; the mentor's card "Let's rebuild it, one part at a time"; "Theo, you ramble."
as a tag; a checklist (Design, Hiring, Vendors, Timeline, Budget question) and the rebuilt comment as three labelled cards,
Behaviour ("Tuesday: budget question on the last slide"), Effect ("Budget decision moved to next week") and Next step
("Next time: decision first"); a three-option quick check where B (the specific one) is marked; "Now yours." at an empty
desk with the old note crossed out and the three cards waiting; the close, "Next update" and a "Decided" tick. Seen
too: a page turn at 129.0 s shows an almost plain paper frame for under half a second (the b15 to b16 join, planned as a
page turn meaning time); the film fades out at the end.
