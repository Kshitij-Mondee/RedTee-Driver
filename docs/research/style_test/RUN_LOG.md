# RUN_LOG: the five-style test (D-167), 2026-10-13

Kshitij: "for the style you suggested above. Make of a video for each style using each model of the three above. For those, I
want you to keep the videos of 1.5-2 minutes each and do the entire videos. Planning opus 5.5, sonnect 5.5 manager and the
above three models doing the scene writing and visual coding like right now. If you can run these videos in parallal, that would
be great. if not, then make off one by one."

## Setup
- Styles and topics (docs/research/2026-10-13-stable-styles.md): whiteboard (running a meeting that ends with decisions),
  line-art (data classification), story-cartoon (speaking up), corporate-clean (the 3-2-1 backup rule, mix cinema),
  cinematic-noir (one leaked password to a breach, mix cinema); corporate employees, teaching, 1.75 minutes, isolated.
- Phase A: each lesson planned once on the loom runner and the API with --preset opus-plan (Opus 5.5 P1 to P5, Sonnet 5.5 P6
  and P7, the kit by a Sonnet kit-builder), --until P7, cap $8; the five in parallel.
- Phase B: per style, `py -m loom slice` clones the whole lesson three times (style-<s>-sonnet, -sol, -terra: plan, narration
  and kit identical); the three run side by side to the final render with presets scenes-sonnet, scenes-gpt-6.1-sol,
  scenes-gpt-5.6-terra (Sonnet leads; the scene authors, clip authors and fixers change), caps $16, $9, $10. The critic for all
  is the first other-family reviewer with a key (gemini-3.8-flash), the same for every clone. Unattended approvals in Kshitij's
  name. Styles one after another, so each style's three clones share the same load.
- Parallel runs share the CPU, so times are comparable within a style's three clones, not with earlier single runs.
- Engine fingerprinted at launch (engine_fingerprint_at_launch.json). Before launch: D-167 (Opus may plan on the API), the
  Shuttle tests 51 of 51.
- Script: tools/style_test.sh.

## Interrupted, fixed and resumed (2026-10-14)
- 2026-10-13: whiteboard ($4.59) and line-art ($5.44) planned to P8; story-cartoon stopped at its $8 cap in P7 ($7.79);
  cinematic-noir (P3, $0.98) and corporate-clean (P6, $5.07) ended on report_finding's idx(None) (L-435); whiteboard's three
  clones were in P8 ($7.37 in all) when the session running the launcher ended and stopped them (L-436). $31.24 spent.
- Fixed: the rails and Server.call (L-435); whole-lesson slices are exact clones (L-437). Added: Qwen 3.8 Max as a fourth
  scene-writer arm (D-168; key checked: 99 models listed; two test calls $0.002).
- Resumed detached: the three unfinished plans resume (story-cartoon cap $12, corporate-clean $10, cinematic-noir $8); then
  per style four clones side by side (Sonnet $16, Sol $9, Terra $10, Qwen $9). Whiteboard's three interrupted clones are kept
  as style-whiteboard-<m>-interrupted and started again from fresh clones. Full suite before: 441 passed, 2 failed (the new
  office sets: world prompts out of date and a set-selection case, neither touched by this test; told to the other session).

## Qwen refused (2026-10-14, 09:36)
- Every qwen3.8-max call: HTTP 403, the free quota exhausted on a free-tier-only account. style-whiteboard-qwen and
  style-line-art-qwen failed (exit 2). Deviation: loom/agents/llm/base.py now reads that as a credit stop (L-438), so the later
  styles' Qwen clones stop at once; the four other arms are untouched by it. The Qwen clones are kept to resume once the account
  is paid.

## Kshitij's blind rating: whiteboard (2026-10-14)
- "All were good actually. A had visible issues like 1-2 of them. B was great, no issues outright in the visuals and C was also
  great." Key: A = gpt-6.1-sol ($3.52, critic 1 blocker 3 major 1 minor), B = gpt-5.6-terra ($3.27, critic 1 major 1 minor),
  C = claude-sonnet-5-5 ($3.88, critic 1 major 5 minor). On this style the cheapest (Terra) rated at the top with Sonnet.

## Kshitij's blind rating: line-art (2026-10-14)
- "A is ok-ish, B and C clean and good with minimal issues in both. A has visible issues and overlaps." Key: A = gpt-5.6-terra
  ($3.14), B = claude-sonnet-5-5 ($4.86), C = gpt-6.1-sol ($2.74). Here Sol, the cheapest, rated with Sonnet; Terra behind.

## 2026-10-14 16:35: the last three blind sets
- The test finished at 14:10 (ALL_DONE). Blind sets made for story-cartoon, corporate-clean and cinematic-noir, each in a
  new shuffled order, keys in `blind/<style>_KEY_open_after_rating.json` (not opened by Kshitij yet).
- Deviation: four originals were over the 30 MiB phone upload limit, so all six files of story-cartoon and cinematic-noir
  got phone copies with the same settings (`blind/<style>/phone/`, x264 crf 26, 1280 wide); the originals stay the
  reference. Corporate-clean went at full quality.
- Ratings awaited.

## 2026-10-14 17:00: results of the Sonnet, Sol and Terra arms (the record; models named)
Cost, wall time and the Gemini 3.8 Flash critic's findings per finished film (all 15 rendered):

| style | model | cost | time | critic findings |
|---|---|---|---|---|
| whiteboard (2:09) | claude-sonnet-5-5 | $3.88 | 42 min | 1 major, 5 minor |
| whiteboard | gpt-6.1-sol | $3.52 | 48 min | 1 blocker, 3 major, 1 minor |
| whiteboard | gpt-5.6-terra | $3.27 | 43 min | 1 major, 1 minor |
| line-art (2:04) | claude-sonnet-5-5 | $4.86 | 39 min | 3 major, 1 minor |
| line-art | gpt-6.1-sol | $2.74 | 45 min | 1 major, 2 minor |
| line-art | gpt-5.6-terra | $3.14 | 45 min | 1 major, 3 minor |
| story-cartoon (1:39) | claude-sonnet-5-5 | $9.20 | 81 min | 2 blocker, 3 major, 2 minor |
| story-cartoon | gpt-6.1-sol | $3.55 | 67 min | 2 minor |
| story-cartoon | gpt-5.6-terra | $5.42 | 74 min | 3 minor |
| corporate-clean (1:39) | claude-sonnet-5-5 | $8.65 | 46 min | 1 blocker, 2 major, 4 minor |
| corporate-clean | gpt-6.1-sol | $3.91 | 51 min | 4 major, 1 minor |
| corporate-clean | gpt-5.6-terra | $5.13 | 55 min | 2 minor |
| cinematic-noir (2:12) | claude-sonnet-5-5 | $8.42 | 70 min | 1 major |
| cinematic-noir | gpt-6.1-sol | $3.74 | 76 min | none |
| cinematic-noir | gpt-5.6-terra | $3.84 | 69 min | 1 blocker, 1 major, 3 minor |

All style-* lessons, interrupted ones included: $117.80. Frame reads (agent) of the last three styles: story-cartoon, the
three very alike, Sol's "Compliance" tag clipped at the right in one frame; corporate-clean, all three cut the final title
"Now check your own key fi" at the frame edge (shared, from the plan or kit), Sonnet otherwise clean, Sol's tilted LAPTOP and
EXTERNAL DRIVE tags overlap labels, Terra's cloud, 3-2-1 tiles and "Drive failure" pill overlap; cinematic-noir, Sonnet
clean, Sol's numbered tags crowd one frame and its "Reported" frame has an empty dark panel, Terra has small doors over the
big doors, cut striped panels, a stray tile and sparse frames. The critic and the frames disagree on corporate-clean.
Next: the Qwen arms, handed to Kiro (docs/prompts/2026-10-14-kiro-style-test-qwen.md, tools/style_test_qwen.sh; not started).

## 2026-10-14: Kshitij's blind rating, story-cartoon
- Kshitij: "C was the best in my opinion and B was also clean" (A not mentioned).
- Key: A = claude-sonnet-5-5 ($9.20, 81 min, critic 2 blocker 3 major 2 minor), B = gpt-5.6-terra ($5.42, 74 min, critic 3 minor),
  C = gpt-6.1-sol ($3.55, 67 min, critic 2 minor). Here the cheapest (Sol) rated best, Terra clean, and the critic agreed
  with the order; Sonnet cost the most and drew the most findings.

## 2026-10-15: story-cartoon, corrections and redraws per arm (from the trace and the decision ledger)
| | Sonnet | Terra | Sol |
|---|---|---|---|
| scene authors started (12 beats) | 10 | 11 | 10 |
| fixers started (P8 / P10) | 5 / 1 | 4 / 2 | 1 / 0 |
| scene submissions (refused) | 23 (11) | 22 (5) | 20 (7) |
| lab snapshots | 84 | 61 | 34 |
| full checks (failed) | 4 (2) | 4 (2) | 3 (2) |
| storyboard reopens / patches | 7 / 8 | 3 / 4 | 3 / 4 |
| narration synthesised | 3 | 2 | 2 |
| critic rounds (verdicts) | 2 (fix, fix) | 2 (fix, ship) | 1 (ship) |
- The storyboard reopens were the same plan faults in all three arms (b06 keep names a held element b05 never draws,
  b08's token label overflows at the 30 px floor, b12 avatar props): they came from the shared plan, not from the writers.
  Sonnet's lead took seven reopens to land them, one gate refusal at a time.
- Sonnet: the critic's b04 and b05 blockers (desk set gone) were marked "accepted" by the lead and shipped; the frames confirm
  them (story-cartoon_b04-b06_three_arms.jpg). L-439. Kshitij did not mention A in his rating.
- Terra: the critic's two majors (b09 sign over Maya's head, b11 Maya sunk below the desk) were fixed in P10; a second pass
  gave ship. Sol: no fix after the critic.

## 2026-10-15: corrections and waived findings across all 15 films
| style | model | scene authors | fixers P8/P10 | submits (refused) | snapshots | checks (failed) | reopens | blockers / majors waived |
|---|---|---|---|---|---|---|---|---|
| whiteboard | sonnet | 8 | 0/1 | 14 (2) | 32 | 3 (1) | 1 | 0 / 1 |
| whiteboard | terra | 11 | 0/1 | 14 (0) | 28 | 3 (1) | 1 | 0 / 1 |
| whiteboard | sol | 8 | 0/1 | 13 (1) | 24 | 3 (1) | 3 | 1 / 2 |
| line-art | sonnet | 9 | 0/0 | 12 (0) | 40 | 2 (1) | 1 | 0 / 3 |
| line-art | terra | 11 | 1/3 | 20 (1) | 35 | 4 (2) | 1 | 0 / 1 |
| line-art | sol | 10 | 0/1 | 16 (2) | 34 | 3 (1) | 1 | 0 / 0 |
| story-cartoon | sonnet | 10 | 5/1 | 23 (11) | 84 | 4 (2) | 7 | 2 / 3 |
| story-cartoon | terra | 11 | 4/2 | 22 (5) | 61 | 4 (2) | 3 | 0 / 0 |
| story-cartoon | sol | 10 | 1/0 | 20 (7) | 34 | 3 (2) | 3 | 0 / 0 |
| corporate-clean | sonnet | 13 | 0/0 | 18 (4) | 63 | 2 (1) | 0 | 1 / 2 |
| corporate-clean | terra | 12 | 4/1 | 27 (0) | 62 | 6 (4) | 0 | 0 / 0 |
| corporate-clean | sol | 13 | 3/2 | 23 (3) | 49 | 3 (1) | 0 | 0 / 2 |
| cinematic-noir | sonnet | 13 | 0/2 | 19 (3) | 60 | 3 (1) | 1 | 0 / 1 |
| cinematic-noir | terra | 8 | 1/2 | 16 (1) | 44 | 3 (1) | 1 | 1 / 1 |
| cinematic-noir | sol | 8 | 0/4 | 20 (0) | 40 | 5 (2) | 1 | 0 / 0 |
"Waived" = marked "accepted" by the Sonnet lead in its final review. The Sonnet-writer arms of line-art, story-cartoon and
corporate-clean shipped over a critic's last verdict of "fix"; every other film's last critic verdict was ship. Frames of the
waived blockers: waived_blockers_frames.jpg (L-440).

## 2026-10-15: rework per model per style (Kshitij asked which needed the most and the least)
Rework = fixer runs (P8 and P10) + scene submissions the gates refused + failed checks, from the table above.
whiteboard: Sonnet 4, Sol 3, Terra 2. line-art: Terra 7, Sol 4, Sonnet 1. story-cartoon: Sonnet 19, Terra 13, Sol 10.
corporate-clean: Terra 9 (27 submits, 6 checks), Sol 9, Sonnet 5. cinematic-noir: Sonnet 6, Sol 6, Terra 5 (flat).
Caveat: Sonnet's low line-art and corporate-clean numbers sit beside waived findings (3 majors; 1 blocker and 2 majors),
so part of its low rework is defects left, not avoided.
