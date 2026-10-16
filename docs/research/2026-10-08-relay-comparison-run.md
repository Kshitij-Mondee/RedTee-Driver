# Relay vs Shuttle, the Relay run (2026-10-08)

Relay's column only; the Shuttle build session lines it up with Shuttle's report. Operator: Claude Code (Opus 5.5),
watching and logging. Full trail: `projects/feedback-relay-sb/RUN_LOG.md` (the comparison run) and
`projects/feedback-relay-cmp/RUN_LOG.md` (a first attempt, stopped by Kshitij to change the model placement).

## Differences to state (part of the comparison, not things to correct)
- **Model placement.** Kshitij, during the run: "use opus 5.5 only for storyboarding, make sonnet 5.5 write the code".
  So Relay ran with Opus 5.5 on the storyboard (outline and storyboard) only, and Sonnet 5.5 on the brief, facts,
  teaching plan, persona, script, kit, scenes and clips (profile `claude-cc-opus-sb`, D-142). Shuttle's lead is Opus
  for planning AND storyboard. Relay's rule against Opus on the storyboard (D-119) was opened for this one profile by
  D-142. The comparison is pipeline plus model placement.
- **Engine changes before this run, made by the operator on Kshitij's instruction** (D-142): the profile above, the
  registry's opt-in for Opus on the storyboard, and `cc-sonnet` calling `claude -p --model claude-sonnet-5-5` (the
  `sonnet` alias served `claude-sonnet-5` in the first attempt). Also, earlier that day, `runtime/brush.js` (L-304);
  this film calls no `Loom.brush`.
- **Billing.** Both bill the subscription for Claude and the Gemini key for the reviewers, and both log list-price USD
  for the Claude part from the same table (`loom/agents/config/models.json`). Relay's Claude rows are `notional`.
- **Engine.** Both use the engine as it is today; the Shuttle build session holds its engine fixes until both report.
- **Cross-film influence.** Relay's design seed read the last 5 lessons, the Shuttle film `feedback-shuttle-opus`
  among them, and chose 2 axes as "not used in the last 5 lesson(s)" (L-324 in docs/AGENT_LEARNINGS.md).

## The table
| measure | Relay (this run) |
|---|---|
| request (topic, style, length, audience, persona) | "How to give feedback that changes behaviour, not just feelings"; story-cartoon; 2 min; corporate employees; mentor |
| models (planning, storyboard, scenes, kit, skeptic, critic) and how each was served | planning (brief, facts, teaching plan, persona, script): Sonnet 5.5; storyboard outline and storyboard: Opus 5.5; scenes, kit, clips, tweaks: Sonnet 5.5; all through Claude Code headless (`claude -p`) on the claude.ai subscription (team), each served model confirmed by the `model` field of its rows (`claude-sonnet-5-5`, `claude-opus-5-5`); skeptic and critic: Gemini 3.8 Flash through the Gemini API key |
| total USD: notional (subscription), billed (Gemini), by stage, by role | **notional $14.1354 as logged** ($13.1605 without a resumed session counted twice; $7.8573 from the per-message rows priced by the engine's table); **billed $0.0656**. By stage (notional): scenes $6.2004, kit $4.1641, storyboard $2.8126, script $0.4085, pedagogy $0.2788, brief $0.1258, knowledge $0.1014, persona $0.0437; billed: critic $0.0621, skeptic $0.0034. By role: scene $6.2004, kit $4.1641, storyboard $2.4327, storyboard_outline $0.3800, then as by stage. By model: Sonnet 5.5 $11.3228, Opus 5.5 $2.8126 (notional), Gemini $0.0656 (billed). Per minute of film (137.9 s of narration): $6.15 notional, $0.0285 billed |
| model calls, input tokens, cached share, cache writes, output tokens | 154 calls (147 Claude, 7 Gemini) plus 24 reconcile rows; input 5,002,727 tokens, cached 4,149,660 (83 %), uncached 49,777, cache writes 803,290, output 297,071. For Sonnet 5.5 the CLI's session totals are about 1.9 times the rows priced from the table; the rows may under-report tokens or the CLI may price above the table (unresolved) |
| wall time, by stage | 1 h 25 min 42 s (19:53:41 to 21:19:23 IST). brief 21 s; facts and skeptic 21 s; teaching plan 51 s; persona 7 s; script 81 s; storyboard outline 86 s; storyboard 205 s plus a resumed fix 68 s; narrate and code stages 314 s; kit 1049 s; scenes 678 s (6 bespoke, 4 in parallel); check 1 150 s; critic 68 s; fixes round 1 589 s; narrate and check 2 221 s; fixes round 2 552 s; checks 3 to 5 972 s |
| gate rejections per stage, repair rounds used | 29 tasks, all accepted; 2 gate resubmissions inside tasks (brief 1, storyboard fix 1); 0 errors, refusals, timeouts or limits. Fix rounds: storyboard 1 (plus one resumed fix before the scenes), scenes 2 of 2 for b01, b02, b05, b07, b12 and 1 for b11 |
| check errors: first run, final run | first 91 errors, 23 warnings; then 84, then 70 (three times); final 70 errors, 30 warnings: 36 "unknown colour token none" from one kit part, 27 tight text insets on kit labels, 6 overlapping text blocks in b12, 1 blank beat in b01 |
| critic findings (blocker, major, minor) and what happened to each | one critic pass (after check 1): 1 blocker, 4 major, 3 minor. Blocker b12 (Theo's body missing): routed, his body shows on the final sheet. Majors: b03 card props missing: fixed (card shows); b09 correct option not highlighted: not fixed (still grey); b02 calendar cropped and b11 black join frame: routed, not judged again. Minors (b05 connector over a card, b06 all lines highlighted, b07 faint badge): still visible on the final sheet |
| redo / escalations / resumed fix sessions | no redo, no escalation; 1 resumed fix session (the storyboard's first fix); 12 fix sessions started new |
| film: duration, beats by kind, kit used or not | not rendered. 12 beats: 6 bespoke, 5 template, 1 avatar; narration 137.9 s; kit used (5 parts) |
| MP4 path, render verification | none: the run stopped with exit 2 before the render; no qa/render_verify.json |
| issues and blockers (each with where it showed) | (1) exit 2 at the check after 2 fix rounds (stdout "stopped: the same defects keep coming back"); (2) 36 of the 70 final errors come from the kit part `meeting_room` and were routed to scene workers, never to the kit's author (qa/defects.json, every round); (3) the design seed read the Shuttle film (stdout, design seed block); (4) the `sonnet` CLI alias served claude-sonnet-5 (first attempt's rows; fixed by D-142 before this run); (5) a resumed session's cost counted twice, $0.9749 (storyboard-c0900c33 reconcile row); (6) Sonnet 5.5's CLI totals about 1.9 times the table (24 reconcile rows); (7) three check passes after every fix round was used up (checks 3 to 5, 16 min, no model calls); (8) no second critic pass judged the fixes |

## The first attempt (feedback-relay-cmp, stopped)
Profile `claude-cc` (Opus on brief, teaching plan and script; Sonnet elsewhere), 19:48 to about 19:51 IST: brief,
facts, skeptic and teaching plan accepted, then stopped by Kshitij's instruction. $0.6135 notional, $0.0037 billed.
Its Sonnet rows report `claude-sonnet-5`. Not part of the comparison.

## Addendum (2026-10-09): after the fixes
The table above is R-35's run (`feedback-relay-sb`, exit 2, no film). After Kshitij's "fix every single issue and
verify", the same request ran again on the fixed engine as an isolated lesson: `projects/feedback-relay-v2`,
`renders/feedback-relay-v2.mp4` (143.8 s, render verification 63 of 63), $9.62 notional and $0.49 billed over five
processes, 0 reconcile rows (R-36; `projects/feedback-relay-v2/RUN_LOG.md`). Its model placement is the same
(claude-cc-opus-sb); its engine is not R-35's (D-143 and L-335 to L-339), which the Shuttle line-up should note.
