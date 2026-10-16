# RUN_LOG: feedback-shuttle-opus (Shuttle, Opus lead, subscription), 2026-10-08

Written by the Shuttle build session, which ran this lesson as operator only (Kshitij: "act as the proper API layer
only and nothing else ... log every cost at every step and also log everything else from errors to issues and
blockers faced"). Sources: `logs/shuttle/trace.jsonl`, `calls.jsonl`, `state.json`, `report.md`,
`launcher_out.txt`, `logs/decisions.jsonl`, `qa/review.json`, `qa/render_verify.json`, and the MP4 itself.

## Result

- **Exit 0 at 21:20:17, every phase P1 to P11 accepted.** Film: `renders/feedback-shuttle-opus.mp4`, 132.0 s,
  1920x1080, 30 fps, with audio, captions (`.srt`, `.vtt`) and a transcript. Render verification: 51 of 51 sampled
  frames match the build, 0 mismatches.
- **Request:** topic "How to give feedback that changes behaviour, not just feelings"; corporate employees;
  story-cartoon; 2 minutes; persona mentor; mix as ceiling (set by the launcher); Kokoro voice af_heart.
- **Models:** lead Opus 5.5 (`claude-opus-5-5`, 234 calls). Sub-agents: the CLI's `sonnet` alias served
  **`claude-sonnet-5`, not Sonnet 5.5** (383 calls), priced as Sonnet 5.5 (`priced_as`). Skeptic and critic: Gemini
  3.8 Flash on the key (29 calls).
- **Wall time:** 16:09:03 to 21:20:17, 5 h 11 min, of which about 8 min was waiting for a person (20:36:59 to 20:44:28).
- **Cost:** $71.27 at the engine's price table (Claude notional $70.90, Gemini real $0.37); the CLI's own figure for the
  Claude part is $69.98. **$18.33 of it (118 calls) ran as paid overage** (see Blockers 1). Per minute of film:
  $32.40.

## Timeline

| time | event |
|---|---|
| 16:09:03 | session P1-P4 (Opus lead, new) |
| 16:09:51 | brief accepted; 16:12:10 facts approved unattended (`--approve-as`) |
| 16:14:38 | P1-P4 session ends (36 turns, CLI $1.43); P5-P6 starts |
| 16:19:19 | storyboard accepted; 16:23:48 plan approved unattended |
| 16:23:56 | P5-P6 ends (41 turns, CLI $1.94); P7-P9 starts |
| 16:45:24 | kit accepted (first) |
| 17:42:51 / 17:44:29 | first compose; first check: **52 errors, 42 warnings** |
| 17:49:16 | **reopen 1 (P7)** by the lead: the kit API cannot carry the storyboard's continuity |
| 18:07:21 | kit accepted (second) |
| 18:20:11 | **five-hour window rejected, paid overage in use; the session was not stopped** |
| 19:25:14 | **reopen 2 (P8)**: four beats still on the old code; the fixer's 8-turn cap |
| 19:41:30 | check: 7 errors, 18 warnings |
| 19:41:41 | new window; overage ends (utilization 0) |
| 19:49 to 20:01 | checks: 4, 3, 1 errors (b12 "nothing developing" last) |
| 20:02:20 | **reopen 3 (P5)**: b12 needs intent "hold" (a storyboard field); cap used |
| 20:02:54 | plan approved unattended again |
| 20:13:55 | check: **0 errors, 18 warnings**; P9 accepted |
| 20:14:45 | P7-P9 ends (192 turns, CLI $59.35); **launcher exit 5** from a limit flag left over from 18:20 |
| 20:15:20 | operator resume; session P10-P11 |
| 20:16:49 | critic pass 1: fix, 4 major |
| 20:35:52 | critic pass 2: fix, 1 blocker (b13), 3 minor |
| 20:36:40 | lead stops for a person: b13's quiz props count from 1; the fix is P5; reopen refused (cap 3) |
| 20:36:59 | automatic retry session (4 turns) ends the same way; **launcher exit 2** |
| 20:43 | Kshitij chose (in chat) to grant one more reopen: `shuttle grant-reopen`, cap 3 to 4 |
| 20:44:28 | operator resume; 20:44:42 **reopen 4 (P5)**: b13 `answer 1, tempting 0` |
| 20:47:50 | check 0 errors; 20:49:35 critic pass 3: fix, 2 major, 2 minor |
| 20:58:06 | critic pass 4: fix, 2 major, 2 minor (new ones) |
| 21:05:34 | render refused by the rails (P10 needs a critic look at the current build) |
| 21:07:15 | critic pass 5: fix, 1 major, 3 minor; lead submits review "ship" (fixed or accepted with reasons) |
| 21:18 to 21:19:38 | render; 21:20:01 final approved unattended; 21:20:03 P11 accepted |
| 21:20:17 | session ends (53 turns, CLI $3.82); **launcher exit 0** |

## Cost at every step

All Claude figures are list price (notional; the subscription paid them, except the overage). Gemini is real money.

- **By phase:** P1 $0.38 (9 calls), P2 $0.28 (8), P3 $0.22 (5), P4 $0.33 (3), P5 $2.39 (30), P6 $2.15 (12),
  P7 $4.64 (46), **P8 $22.41 (321)**, **P9 $25.20 (88)**, P10 $12.22 (89), P11 $0.32 (3), no phase $0.74 (33).
- **By agent:** lead $55.69 (234), scene-author $7.32 (245), fixer $2.55 (101), kit-builder $1.72 (34),
  fact-finder $0.04 (3), critic $0.35 (28, real), skeptic $0.02 (1, real), reconcile row $3.59 (the CLI's total
  for P7-P9 minus the per-message rows).
- **By model:** Opus 5.5 $55.69; Sonnet 5 (priced as 5.5) $11.63 plus most of the $3.59 reconcile; Gemini 3.8 Flash
  $0.37.
- **Tokens:** 91.99 M in all; input 91.77 M, of which 84.27 M cache reads (92 %) and 7.24 M cache writes; output:
  Opus 182,136, Gemini 38,701, Sonnet 2,795 as logged (undercounted, see Issues 9).
- **Sessions (the CLI's own totals):** P1-P4 $1.43; P5-P6 $1.94; P7-P9 $59.35; P10-P11 $3.45 (the first run and its
  resumed retry, cumulative: the report's line lists $3.27 and $3.45 separately, which counts the first part twice);
  P10-P11 again $3.82. Sum $69.98. The engine's rows sum to $70.90: they price a little above the CLI on the short
  sessions.
- **Overage, 18:20:11 to 19:41:41:** 118 calls, $18.33 at list price (Opus $16.05, Sonnet $2.27). This is billed to
  the account as extra usage; the account's usage page has the actual charge.
- **Money really spent:** Gemini $0.37 on the key, plus the overage above. The rest was within the subscription.

## Gates, checks and the critic

- **Checks (11 runs):** first 52 errors and 42 warnings (held_missing, content_overlap at every join, text overlap);
  then 7, 4, 3, 1, then 0 errors with 18 warnings from 20:13:55 to the end.
- **Critic (Gemini 3.8 Flash), 5 passes, every one "fix":** pass 1, 4 major (b13 label "Why not B?", b10 sign on the
  answer bubble, b05 tag over the face, b04 dial without needle); pass 2, b13 blocker and 3 minor; pass 3, 2 major
  (b07 tag on the chin, b05 to b06 tag continuity) and 2 minor; pass 4, 2 major (b14 label cut by the border, b13
  card late) and 2 minor; pass 5, 1 major (b05 tag again) and 3 minor. The findings change from pass to pass, and the
  b05 tag moves between minor, major and absent.
- **The lead's final review (`qa/review.json`, verdict ship), 14 findings:** blocker 1 fixed; major 2 fixed and 2
  accepted with a measured reason (b05 tag, b13 card timing); minor 2 fixed and 7 accepted with reasons.
- **Reopens:** 4 (cap 3 plus one granted by a person). Approvals voided by reopens were re-recorded unattended.
- **Rails refusals:** 9 (contact_sheet before P8 was accepted; delegate of scene-authors in P9, 4 times;
  patch_storyboard while P5 was accepted; reopen at the cap; render before P10 was accepted). **Hook denials: none.**

## Errors (tool calls that failed, as seen)

- `report_finding` 21 errors: severity "medium" or "low" (not blocker, major, minor), an extra "summary" field,
  missing "severity" or "stage".
- `get_api_section` 12: sections that do not exist ("ctx.el", "ctx.held", "exits").
- `list_skill_sections` 7 and `get_skill_section` 1: "story-cartoon" and "docs/styles/guides/story-cartoon.md" are not
  a skill or guide name the tool knows.
- `read_artifact` 5 (files not written yet); `get_example_scene` 3 (no match for "close", "continue",
  "instrument"); `get_catalog_entry` 2 ("avatar", "peep").
- `kit_preview` 1 and `lab_snapshot` 1: the Node command failed once each; `frames` 1: "cannot write empty image".

## Blockers and issues (each with where it showed)

1. **Paid overage was not stopped** (`loom/shuttle/launch.py:294`). The rate-limit event at 18:20:11 had status
   "rejected" and isUsingOverage true; the "rejected" branch only records the limit, and the branch that stops the
   session is an `elif` below it, so it never ran. The session went on for 81 minutes on overage. The operator's
   attempt to stop the process was refused by Claude Code's permission system; Kshitij was asked to stop it and the
   run went on. Kshitij declined the fix before resuming (window at about 25 %). OPEN.
2. **A stale limit flag ended a finished session as exit 5** (20:14:45): the same Stream object kept the 18:20 limit
   after the window reset. OPEN.
3. **The kit could not carry continuity, found only after all beats were written** (reopen 1, 17:49, 85 min into
   P7-P9): desk_set drew raw SVG into the station; rails and planners bundled elements the beats needed separately.
   Every beat was rewritten. OPEN (a continuity check at P7).
4. **The fixer's 8-turn cap** (reopen 2): two fixer runs on b05 ended without a submission; scene-authors work only in
   P8, so the lead had to reopen P8 (4 delegate refusals in P9). OPEN.
5. **Storyboard fields the gate did not catch:** b12's hold had no intent (reopen 3); b13's quiz.answer props counted
   from 1 where the template counts from 0, so no option was marked and the screen contradicted the narration
   (blocker; neither the storyboard gate nor the check caught it). OPEN (a range check on quiz answer props).
6. **The reopen cap stopped the run** (exit 2, 20:36:59). A person granted one more reopen with the new command
   `shuttle grant-reopen` (written mid-run on Kshitij's choice; test `agents_shuttle_a_person_grants_one_more_reopen`).
7. **The critic does not converge:** five passes, each with a partly new set of findings and shifting severities. OPEN.
8. **Snapshots run one at a time:** 102 lab_snapshot calls, about 50 s each, under the engine lock; parallel
   scene-authors queue (also seen in S1). OPEN.
9. **Logging:** sub-agent output tokens are undercounted (Sonnet: at most 32 per call, 2,795 in all), so the per-agent
   split is low; the session reconcile covered P7-P9 only; the report's session line counts a resumed session twice.
   OPEN.
10. **Sub-agents ran on Sonnet 5, not 5.5:** the CLI's `sonnet` alias. State this in the comparison (Relay's
    `cc-sonnet` now names the full model, D-142). OPEN for Shuttle's sub-agent files.
11. **Shared window:** the Relay comparison run (`feedback-relay-cmp`) started at 19:50 on the same subscription.

## Interventions (none touched the lesson's content)

- Two operator resumes (20:15:19 after exit 5; 20:44:28 after exit 2), with the run's own arguments.
- One person's decision: the reopen grant (cap 3 to 4), logged in `state.json` (`grants`), the trace and the ledger.
- New engine code during the run, on Kshitij's choice: `shuttle grant-reopen` (rails, CLI, test). Logged with
  `py -m loom note` (override).
- One attempted stop of the overage session (refused by the permission system; nothing changed).

## The film, as seen (frames every 6 s and the critic's shots; no judging)

Two characters, "You" and Leo, at a desk with a laptop, a week planner and a window, in story-cartoon. It opens and
closes on the mentor presenter card ("Be more proactive." then "What they did. What it caused. Ask."). Leo's laptop
shows "Report due today will be late."; "Two weeks later" repeats it; a Feelings and an Actions dial; Leo with a
"Label: who he is" sign and a small "Proactive" tag; a thought bubble of four guesses; the three-part fix built up as
cards ("1 What he did", "2 What it caused", "3 Ask"); a midpoint check-in on the planner; a two-option quick check
where B is marked correct and the card reads "Why not A? Leo reacts, but reacting isn't knowing what to change.";
Tuesday's heads-up message. Visible in the frames: the opening card is mostly empty below its one line; the Actions
needle crosses its label; the "Proactive" tag and some planner labels are very small.

## After the run: what was fixed (2026-10-08 evening, D-144; appended)

Kshitij, after watching the film: "Why is it re-writing everything if one thing goes wrong? This is a complete waste.
Please fix all the above and this." Every open item above now has a fix and a test that was red on the code before it
(`docs/AGENT_LEARNINGS.md` run 38, `docs/research/shuttle/red_runs.txt`). This film was made before them; none of its
files were changed.
- Blockers 1 and 2 (overage, stale flag): fixed (L-318).
- Blocker 3 (the kit found late): the pilot pair and `pilot_check`; on this run's own first kit and b02/b03 it fails with
  10 errors at 9.696 s, on the shipped ones it passes (L-319, L-334).
- Blockers 4 and 6 (fixer cap, reopen cap): fixer 16 turns; scene-authors in P8 to P10; beat-scoped reopens with their
  own cap (L-320, L-332).
- Blocker 5 (the quiz index): the props gate checks indexes against their list (L-321).
- Issue 7 (critic): later passes judge only what changed (L-322).
- Issue 8 (serial snapshots): private builds, the slow half outside the lock.
- Issues 9 and 10 (cost rows, Sonnet 5): per-model reconcile, the resumed session counted once, pinned full model ids
  (L-323).
- Why everything was redone: a reopen marked every later phase stale. Now only the reopened phase is; the rest re-check
  themselves (L-332).
- Interference found afterwards (disclosed): the lead ran in the engine folder and Claude Code also loaded Kshitij's
  global ~/.claude/CLAUDE.md (two lines about the graphify skill, nothing about the lesson); measured on the real CLI
  with this run's settings. Possibly also the auto-memory index of this folder (unverified). Neither carried content
  about the film. Fixed: the lead's settings now exclude both (L-316 closed for Shuttle).
