# RUN_LOG: feedback-shuttle-v3 (Shuttle, the measured run after D-148), 2026-10-09

Written by the Shuttle build session, which runs this lesson as operator. Kshitij's instruction: "If there is no other
way cutting the cost right now through context or tooling while keeping the quality the same, lets render a proper
video once again and see how much we are saving with cutting the context part. Hopefully everything goes well."
Operator rule as for v2: no edits or context mid-run; a fault that would cost the run a lot of time is fixed and
logged (`py -m loom note`) as an intervention.

## Setup (the same as feedback-shuttle-v2, R-40)

- Request: v2's word for word (topic "How to give feedback that changes behaviour, not just feelings", corporate
  employees, teaching, story-cartoon, 2 minutes, mentor), `loom new --isolated`.
- Launch: `py -m loom shuttle run feedback-shuttle-v3 --lead opus --budget 150 --approve-as "agent, unattended per
  Kshitij (measured run after D-148, 2026-10-09)"`; the build P7 to P9 on Sonnet by config (D-145).
- What is new since v2: D-148 (briefs by reference, one lead session per phase, each listing only its phase's tools,
  agents and menu, a check round in three lead turns, contact sheets as a sweep or a close look at the earlier size, the
  library offered to the kit as an option, no write before a brief is read), L-363 (the launcher survives a state file
  being replaced, and kills its session if it fails), L-364 (a render resumes once after a capture page timeout).
- Also changed in the engine since v2 by other sessions (not part of this comparison, listed so a difference in the
  film is not credited to D-148 alone): the pipeline health pass (R-41: a portable build hash, a draft taken only with a
  reason), the `model_shot` three preset (D-147), directed world sets (D-149).
- Compared with v2 on: wall time, cost at the engine's table, model calls, the lead's context per session (start and
  end), and the film within its own style (D-122).

## Result

- **Exit 0 at 21:02:28, every phase P1 to P11 accepted.** Film: `renders/feedback-shuttle-v3.mp4`, 142.4 s, 16 beats
  (15 bespoke, 1 presenter), a lesson kit of 8 parts; render verification 55 of 55, 0 mismatches. No operator
  intervention.
- **Models, checked per call:** Opus 5.5 leads P1 to P6 and P10 to P11 (279 Opus calls), Sonnet 5.5 leads P7 to P9 and
  serves every sub-agent (569 calls), Gemini 3.8 Flash skeptic and critic (11 calls, $0.17 real money).
- **Wall time:** 17:07 to 21:02, 3 h 55 min. To the first passing check 1 h 24 min (v2: 1 h 32 min); the critique and
  fix loop 18:31 to 20:17; the render 20:17 to 21:02, of which 38 min was the frame verification (L-375).
- **Cost:** $41.58 at the engine's price table, 838 calls (the CLI's own total $56.68); peak 54 % of the five-hour
  window, no overage.

## Against v2 (R-40), the same request, models and roles

| measure | v2 | v3 |
|---|---|---|
| wall time | 1 h 47 min | 3 h 55 min |
| cost, engine table | about $19.56 | $41.58 |
| to the first passing check | 1 h 32 min, $13.30 (lead $8.54, sub-agents $4.76) | 1 h 24 min, $20.00 (lead $8.11, sub-agents $11.88) |
| after it | 15 min, $5.01 | 2 h 31 min, $21.59 |
| lead calls | 133 | 360 |
| lead context per call, session means | 48k to 146k tokens | 23k to 70k (one P10 session 105k) |
| lead context, build peak | 314k (P7 to P9) | 96k (P8) |
| lead session starts | 25k to 30k | 17k to 28k |
| reopens | 1 (the kit) | 0 whole; 3 for named beats (b07 to b10) |
| check rounds to the first pass | 4 | 2 |
| critic | 2 passes, ship | a blocker (b07) and a major (b05), both fixed, ship |

Reading: D-148 did what it was built for (the lead's context per call about halved, the build session never grew
past 96k), but the run did not get cheaper. The lead made almost three times the calls (session overhead and the fix
loop), the sub-agents cost more (v2's figure is low: its build session was stopped before reconcile; and this plan's
beats took more work), and a critic blocker from an engine trap (L-372) cost 2.5 h. One run cannot separate D-148's
effect from the plan's; the like-for-like lead figure is flat.

## The film (contact sheets looked at, 16 beats)

- Reads as one story-cartoon lesson: Asha and Ben in the room, the vague bubble, the SBI card built line by line
  (b07 to b10), the quiz (b11, b12), the private follow-up (b13), the outcome (b16).
- The critic's b07 blocker is fixed in the sheets (the card forms on "Now rebuild it", no stray bubble); b05's label
  leaves with its tag.
- Seen and not fixed: b07 opens on a fully black frame at 45.4 s (the engine's dip for a camera move between
  different sets, desk to room); b02 shows two small seated figures between Asha and Ben, a possible scale problem.
- Not done: a frame-by-frame review and a rating against v2 (as R-41 did for v2).

## Findings (docs/AGENT_LEARNINGS.md run 48)

L-372 the element-name collision (OPEN, a check needed), L-373 per-phase session overhead (OPEN, a mixed split to
measure), L-374 Opus drives the fix rounds (OPEN, shadow test), L-375 the 38-minute verification (OPEN), L-376 the
sub-agent cost (data).
