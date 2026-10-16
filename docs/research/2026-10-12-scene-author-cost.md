# Where a scene author's money goes (gps-position, R-52)

Measured 2026-10-12 from `projects/gps-position/logs/shuttle/` (calls.jsonl, callers/, briefs/) and the 44 scene-author
transcripts (Claude Code `subagents/agent-*.jsonl`). Prices are `loom/agents/config/models.json` (Sonnet: in 2.0, cached 0.2,
cache write 2.5 or 4.0 for 1 h, out 10.0 per million tokens). The run was on the subscription, so the dollars are notional.

## Who does what

| step | who | what it decides | size |
| --- | --- | --- | --- |
| P5 storyboard | Opus lead | per beat: station, keep list, subject, shot, join, a 1 to 2 sentence treatment, named elements, a beat sheet (spoken anchor, element, action, motion), continuity (held, travelling, retiring, incoming). What and when, never where, how big or the code | 100,567 chars for 34 beats (about 3 k a beat); $3.29 with one reopen |
| P7 kit | kit-builder (Sonnet) | the shared parts as JS (earth, satellites, signal, phone, clocks) | `_kit.js` 30,103 chars; $2.04 |
| P8 scenes | one scene author (Sonnet) per beat, in parallel | the beat's code: positions, sizes, timings on the phrase anchors, tweens, held elements; looks at it (lab_snapshot) and submits | 34 scene files, 208,874 chars (median about 3.6 k, about 100 lines); $20.52 for sub-agents |
| P9 | fixers | one scoped fix per check defect | $2.20 |

## A scene author, median
- 12 turns, 5.6 looks (lab_snapshot), 6.1 read_artifact, 2.1 API sections, 1.7 get_beat; 44 spawns for 34 beats.
- Context 12.6 k tokens at the first turn, 47 k at the last; every turn rereads all of it.
- Its brief: 57,407 chars (about 14 k tokens), of which about 93 % is identical in all 34 briefs:
  kit source 30,113 (52 %), THE FILM 13,016 (all 34 beat lines, concept, voice, devices), style summary 5,223, kit API note
  3,521. Beat-specific: storyboard spec 2,243 and held elements 1,410 (about 7 %).

## P8 cost split (from the run_compare totals: 37.6 M in, 92 % cached; 853 k out)
- Cache reads about 30 %, cache writes about 33 %: rereading and first writing the context.
- Output about 36 %: 853 k tokens. Code sent by authors (lab_snapshot sources 420 k chars, submit 34 k chars) is about
  130 k tokens; the rest does not show in the transcripts and is most likely extended thinking (UNVERIFIED).

## Levers, by expected saving and risk (estimates, not measured)
1. Brief without the kit source (API note plus part signatures; a part's source on request): about $2 to 3 a run, low risk.
2. THE FILM for one beat: the arc, the voice and the neighbouring beats, not all 34 lines: about $1.
3. Looks by edit instead of the whole source each time: about $1 to 1.5 of output.
4. One author for a run of consecutive beats on one station (fewer briefs, continuity in one head, L-409): about $3 to 5;
   a larger change, needs a shadow run (CLAUDE.md rule 13).
5. A thinking cap or lower effort for scene authors: possibly the largest (about $5), quality risk; shadow run first.
6. More blueprint beats (engine-drawn, no author): about $0.50 to 0.60 a beat converted; a design choice for the storyboard.
7. A shared cached prefix for the identical brief text across authors (read at 0.2 instead of written at 2.5 to 4 by each):
   feasibility in claude -p sub-agents unknown (the spawn prompt carries the owner token), needs a test.

## Would pre-made backgrounds cut it? (Kshitij, 2026-10-12)
- Share of scene code in scenery or ambient elements (an upper bound: from such an element to the next one): gps-position
  22.8 %, dc-cooling 18.5 %, feedback-relay-v2 7.6 %, feedback-relay-v3 2.4 %, https-private-v2 0.9 %. Rooms and sets are
  mostly drawn once, in the kit (P7), not by each scene author.
- A scene author's cost follows its context and its turns, not its file size: the brief (93 % shared), rereading, looks and
  thinking. Fewer background lines move it a little.
- Where ready backgrounds do help: the kit builder (P7, $2 to 3), a smaller kit pasted into every brief (lever 1), fewer
  layout faults around set items, one look across lessons. Set library today: `office/meeting_room` in two set styles
  (assets/sets/INDEX.md); a set is per world, scene and set style (D-122), and an option, never forced.
- The larger form of the same idea for P8: ready beats (blueprints the engine draws with no author, about $0.50 to 0.60 a
  beat saved) for recurring teaching moves, chosen by the storyboard.
