# The measured Shuttle film: what was drawn new, what was reused, and where the tokens went (2026-10-09)

Kshitij asked, after `feedback-shuttle-v2` (R-40): "how much of these assets were drawn by the AI for the first time and
how many were re-used as assets?" and "which step is taking how much tokens and cost and why?". Measured from the
lesson's own files (`plan/storyboard.json`, `scenes/*.js`, `logs/shuttle/calls.jsonl`); nothing here is estimated
except where it says so.

## Drawn new, or reused

The film has 16 beats: 15 bespoke (code written in this run) and 1 avatar (the engine's presenter). No catalogue
template, no library object or place, no 3D model, no physics, brush or orb.

| what is on screen | where it came from |
|---|---|
| Nina and Theo | **reused**: the engine's character rigs (`kit.peep`), coloured by the storyboard's cast; 22 placements in 9 beats |
| the presenter (b05) | **reused**: the engine's presenter avatar |
| 3 icons (b04, b12) | **reused**: the engine's icon set (`kit.icon` x2, the theme's icon disc x1) |
| the look: palette, fonts, paper, captions, page-turn joins, motion verbs | **reused**: the story-cartoon style pack and the runtime |
| the meeting room (wall, table), the wall screen, the wall clock, the wall calendar (with its flipping page), the comment bubble, the label tag, the answer cards of the quiz, the viewer's desk (monitor, chair, plant, cup) | **drawn new** by the kit-builder: the lesson kit, 8 parts, 36 KB of code, about 90 drawing calls plus 69 SVG elements |
| the beats' own pictures: the Feeling and Target dartboard, the checklist, the Behaviour, Effect and Next step cards, the "Decided" tick, "Next update" and the rest of the choreography | **drawn new** by 15 scene-authors and their fixers: about 70 KB of code, about 70 drawing calls of their own; 13 of the 15 beats compose kit parts |

So by thing on screen: the people, the presenter, a few icons and the look are reused; every set, prop and object is
drawn new for this lesson. The Opus film (R-34) was the same, except that it also reused two catalogue templates (its
quiz); this film drew its quiz as a kit part (`answer_cards`).

**Reuse that was available and not taken.** The engine already has a meeting room and an office
(`Loom.place.meeting`, `Loom.place.office`, with anchors for the screen, table, seats, calendar and clock) and objects
for a wall clock that passes time, a wall calendar that marks and crosses days, and a laptop or monitor with a screen
(`Loom.obj`). The storyboard (Opus, P5) declared the room, clock and calendar as kit parts, the lead's kit brief gave
their sizes and tones, and the kit role card mentions `Loom.obj` in one line ("where they fit") and places not at all.
The kit took 28 minutes, two kit-builders and the run's one reopen (its calendar and bubble drew their text twice).
Whether library places and objects would have served this lesson as well is not tested: a candidate for the next run
(the storyboard and the kit brief prefer `Loom.place` and `Loom.obj` where they fit, and draw new only what is the
lesson's own).

## Where the tokens and the money went

$18.31 logged at the engine's price table (plus $1.25 in the stopped build session's last minutes, recovered from its
transcripts, not in this table). 21.6 M input tokens, 87 % of them read from the prompt cache.

| phase | calls | input (M tokens) | cached | output (k) | USD | share |
|---|---|---|---|---|---|---|
| P1 brief | 6 | 0.16 | 81 % | 2.4 | 0.35 | 2 % |
| P2 facts | 7 | 0.21 | 89 % | 4.5 | 0.28 | 2 % |
| P3 pedagogy | 4 | 0.18 | 97 % | 1.1 | 0.14 | 1 % |
| P4 persona and script | 4 | 0.24 | 90 % | 17.1 | 0.62 | 3 % |
| P5 storyboard | 21 | 1.39 | 93 % | 39.1 | 1.95 | 11 % |
| P6 narration and animatic | 4 | 0.46 | 92 % | 14.7 | 0.75 | 4 % |
| P7 kit | 33 | 2.67 | 84 % | 18.1 | 1.95 | 11 % |
| P8 beats | 188 | 8.80 | 83 % | 16.4 | 5.94 | 32 % |
| P9 compose and check | 50 | 3.43 | 91 % | 15.7 | 1.97 | 11 % |
| P10 critique and fix | 18 | 2.05 | 90 % | 93.0 | 2.92 | 16 % |
| P11 render | 5 | 0.89 | 99 % | 2.2 | 0.44 | 2 % |
| between phases | 12 | 1.14 | 93 % | 64.4 | 1.01 | 6 % |

Why each costs what it does:
- **Every call re-reads its whole context.** An agent's prompt is its instructions plus everything said so far,
  including every tool result and picture. The lead's calls in P9 read about 89 thousand tokens each. The cache makes
  a re-read cost a tenth of a fresh read, which is why 87 % cached still adds up: input is most of the bill, output a
  small part.
- **P8 beats (32 %)** is the most work: 15 scene-authors and their fixers, 188 calls, each reading its brief, the
  engine's context for its beat (spec, narration timings, held elements, the kit's API), the guide sections it asks
  for, and the pictures its snapshots return (61 snapshots). The scene code itself is output, which the per-message
  rows undercount for sub-agents (filled per model at the session's end, D-144).
- **P10 critique (16 %)** is Opus: the lead looks at contact sheets (images) and judges; Opus's tokens cost twice
  Sonnet's at the engine's table.
- **P5 storyboard and P7 kit (11 % each):** Opus writes the whole storyboard (about 34 thousand output tokens, the
  most expensive tokens in the run) after reading the storyboard guides; the kit is two kit-builders, 13 previews (each
  a picture) and the reopen.
- **P9 compose and check (11 %):** the Sonnet lead's loop around four checks: each turn re-reads the session so far.
- **Planning (P1 to P4, 8 %)** is cheap: short sessions, small contexts.

Against the Opus run (same table): P8 $22.41 to $5.94, P9 $25.20 to $1.97, P10 $12.22 to $2.92. The causes: the build
lead on Sonnet (D-145), one reopen instead of four and no rewrite of every beat (the pilot, D-144), the critic judging
only what changed, and fewer fix rounds.

Cheapest next savings, not yet measured: library places and objects for the set (above); fewer, shorter lead turns in
P9 (the lead re-reads about 90 thousand tokens to decide each small step); pictures sent at the size the judgment needs.

## Context: what each agent starts with, and why it grows (Kshitij: "is there no way to reduce the context?")

Measured from Claude Code's own transcripts of the run (one file per session and per sub-agent):

| agent | context at its first call | at its last call |
|---|---|---|
| sub-agents (scene-author, fixer, kit-builder), 31 of them | about 10 thousand tokens | about 50 to 60 thousand (median) |
| the lead, P1 to P4 | 24.5 thousand | 84.6 thousand |
| the lead, P5 to P6 | 24.6 thousand | 123.9 thousand |
| the lead, P7 to P9 (first session) | 29.8 thousand | 313.8 thousand |
| the lead, P7 to P9 (after the restart) | 29.8 thousand | 120.7 thousand |
| the lead, P10 to P11 | 24.7 thousand | 183.3 thousand |

Nothing carries over between runs (the person's CLAUDE.md and auto-memory are excluded, D-144), and between the lead's
sessions only `logs/shuttle/notes.md` is handed over. Every agent already starts fresh and small, with its objective,
its process (its role card) and the data its job needs. The cost is in what accumulates during a session:

- **Delegation passes every hand-over through the lead.** `delegate` returns the sub-agent's whole prompt (the lead's
  brief plus the engine's context for the beat: about 11 thousand tokens for a scene-author, up to 22 thousand for a
  fixer), and the lead writes it out again as the sub-agent's prompt. This run's 31 delegations carried 1.33 MB of
  hand-over text, about 370 thousand tokens, through the lead's context, and every later lead turn re-reads it. This is
  most of why the first P7 to P9 session reached 314 thousand.
- **Pictures stay in the lead's context.** Every contact sheet and frame the lead looks at is re-read on every later turn
  (P10 to P11 grew from 25 to 174 thousand around its looks and the critic's findings).
- **Long sessions.** P7 to P9 is one session over the kit, 16 beats and the checks.
- **Sub-agents grow to 50 to 60 thousand** from their snapshot pictures and from sending their whole draft with each
  lab_snapshot.

What would cut it, largest first (estimates, not measured):
1. **Hand-overs by reference.** `delegate` returns a short handle; the sub-agent's prompt is "you are the scene-author
   for b06, token X: read your brief with read_artifact('brief:X')". The sub-agent reads the 11 thousand tokens it
   needs; the lead never carries them. The lead's build session would stay near its 30 thousand start plus its own
   work, instead of passing 300 thousand.
2. **Shorter lead sessions.** One per phase instead of one per phase group, with the notes as the handover; the
   playbook and the tool list are the same prefix in every session and come from the cache.
3. **Pictures sized for the judgment.** Contact sheets at the size the decision needs; the lead looks closely only at
   the beats the check or the critic named.
4. **Only the current phases' tools in the lead's list.** Each session lists the tools its phases use (about 50 schemas
   today in every call).
5. **Sub-agents patch their draft** instead of resending all of it with each snapshot.

## Built the same day (D-148; Kshitij: "build the first, second, fourth and ... library places and objects ... fewer, cheaper lead turns ... pictures sent only at the size the judgment needs")

1. **Hand-overs by reference:** `delegate` stores the whole brief (`logs/shuttle/briefs/<token>.md`) and returns a short
   spawn prompt (385 characters for a demo beat, against the whole brief before); the sub-agent reads its brief itself.
2. **One lead session per phase,** the notes as the handover; a reopen of an earlier phase ends the session and that
   phase's own session does the work. `session_split: "group"` keeps the old four sessions.
3. **Only the session's tools:** P1 lists 17 of 52 tools (7,954 of 21,839 characters of schema), P8 lists 34.
4. **The library as an option:** the kit-builder's task lists the engine's 5 places with their anchors and 12 objects
   with their families, read from the runtime; the playbook and the cards say it is never a requirement.
5. **Fewer lead turns in the check loop:** `check` composes first; `delegate(jobs=[...])`; `collect(token='all')`. A
   round is three lead turns (delegate, the Agents, collect beside check).
6. **Pictures by the judgment:** contact sheets as an `overview` sweep (up to 9 beats) or `full` (up to 3 beats, each
   frame about 450 px wide against about 260 in the nine-beat sweep). First built with the sweep at about half the pixels
   (about 800 tokens instead of 1,500); after Kshitij's "hopefully none of these upgrades actually bring down the quality
   of the video" the sweep stays at the size the lead saw before, and the smaller one is a setting
   (`pictures.overview_px`) for a shadow test (CLAUDE.md rule 13). So pictures save nothing yet; the close look got larger.
7. **Briefs read in full:** no sub-agent writes before it has read every part of its brief (the guard for item 1).

Measured so far offline only (tests and S0 on the mock); what it saves on a real lesson is not measured until the next
real run.
