# Relay: why the film looks worse, what the agents share, what to take from Shuttle, and cost (2026-10-10)

Asked (Kshitij): look into the quality of the Relay video and what is missing, since it "just doesn't feel the same as
what we make in claude"; check that tool calling really works; study Shuttle's changes (skills loaded only when
needed and more) and what Relay can take; test the idea that the agents do not pass enough context to each other
("not all the context, but some, so the video is made by all agents with the same vision"); and where cost can be cut
without losing quality. Research only: nothing in the engine was changed for this document.

Method: frames and plans of three lessons in ONE style (story-cartoon, D-122 compares within a style), the
cost table of `feedback-relay-v2`, and three read-only audits (context per role, tool calls from the Claude Code
transcripts, Shuttle's mechanisms). Every number below was measured from files named here; what was not measured
is listed at the end.

| Lesson | Pipeline | Beats | Bespoke | Template / blueprint | Avatar | Length | Scene code |
|---|---|---|---|---|---|---|---|
| `groupthink-trap` | Cowork (one Claude) | 21 | 18 | 3 / 0 | 0 | 195 s | 210 KB |
| `feedback-shuttle-opus` | Shuttle | 15 | 11 | 2 / 0 | 2 | 132 s | 67 KB (kit 26 KB) |
| `feedback-relay-v2` | Relay | 18 | 9 | 5 / 2 | 2 | 144 s | 46 KB (kit 15 KB) |

Ratings already on file (R-41, same rubric, same request): Relay `feedback-relay-v2` 6 / 10, Shuttle
`feedback-shuttle-v2` 7.5 / 10.

## 1. What the pictures show

Looked at 16-frame grids of all three films (one frame every 8 to 12 s) and the R-41 defect list.

- **Cowork and Shuttle tell the lesson inside one world; Relay visits eight.** `groupthink-trap` holds 16 of 21 beats
  in one room drawn from a written set bible (board, clock, window, table), and the objects on the table change state
  as the story moves (doubt cards land one by one). Shuttle holds 11 of 15 beats at one desk: the wall planner
  circles Thursday, gains a card, moves a card, gets a Tuesday pin. Relay's storyboard names 8 stations for 18 beats
  (meeting_room, desk, desk_bubble, presenter, replay, tiles, dev_call, calendar_desk). Several of those beats are
  templates and blueprints (`scenario.dialogue`, `hero.character_moment`, `compare.two`, `recap`, `document.page`)
  that draw their own room and their own people, so the meeting room and the cast change look in the middle of the
  story (b02, b03, b06), and some beats float on an empty page (b04 card, b05 thought cloud, b12 tiles, b16 page).
- **Relay planned a strong device and then drew it thinly.** Its concept (one comment bubble that gains a row per
  part) is as good as either other film's, and R-41 called it the best single device of the two films. But the
  average bespoke beat is about 3.4 KB of code against about 10 KB in Cowork: fewer held props, less ambient motion,
  fewer state changes per beat, more empty frame.
- **Defects a viewer sees (R-41):** the check's on-screen options leave out what makes B right; two characters cut
  mid-torso by a clip box (0:50 to 0:57); about 1 s of empty page three times plus three black dips; underfilled
  cards in the top-left quarter; 20 px bubble text.

### Why: the plan was steered to templates before anyone had a vision

| | Relay v2 | Shuttle opus | Cowork |
|---|---|---|---|
| Script beats marked `change_over_time` | 5 of 18 | 12 of 15 | 14 of 21 |
| Script's `treatment_hint` = template | 10 | 1 | 2 |
| Mean allocation score | 0.17 | 0.82 | 0.91 |
| Mix in the request | classic (template 50 %) | classic | **cinema (motion 80 %)** |
| Brief has `look` | no | no | yes (from the request notes: TED-Ed style, one story world) |

1. **The Cowork lesson is not a like-for-like target.** It was made with `--mix cinema` and request notes that set the
   look; the two pipeline runs used the classic mix. Part of "doesn't feel the same" is that setting, not the agents.
   Rule 11 keeps both mixes and lets the person choose, so this is a choice to surface, not a default to flip.
2. **The script writer in Relay rates beats static, because it has never been told what the film looks like.** The
   script role gets the brief, plan, persona and knowledge, but no style, no look and no world, yet it writes every
   `visual_intent` and `animate_score`; its card also says a static composition "is correct, not second best"
   (`roles/script.md:36`). With the same topic and the same classic mix, Shuttle's script (written by the Opus lead
   who also plans the film) marked 12 of 15 beats as change over time; Relay's (Sonnet) marked 5 of 18. Which half of
   that is model and which half is missing context is not separated yet (section 7).
3. **The allocator then turned the low ratings into 9 template beats**, and the storyboard kept them. The storyboard
   may draw a template beat (`roles/storyboard.md:18`, the mix is a ceiling); Shuttle's storyboard drew 4 of its 6
   allocated templates as bespoke (only the quiz pair stayed templates). Relay's drew 2 of 9 as bespoke, turned 2
   into blueprints (which bring their own room and people) and kept 5 as templates, three of them mid-story.

## 2. Context between the agents: the hypothesis holds

Each Relay role gets one system prompt (shared rules, its role card, the schema, the toolbox menu) and one task
message built by `conductor.task_message` (`loom/agents/conductor.py:109-295`). Nothing else reaches it: Relay has no
`read_artifact`, so the brief, teaching plan, persona, outline, design seed and the storyboard's film-level fields
cannot be fetched by any tool (`loom/agents/tools.py:895-914`). Verified in the code for the storyboard and critic
messages.

| Role | Gets | Never gets |
|---|---|---|
| script | brief, teaching plan, persona, knowledge | style, look, world (yet writes every `visual_intent`) |
| outline / storyboard | brief `look, visual_direction, audience, outcome` only, plan, script, allocation, style summary, design seed | brief `through_line`, `arc_plan`, `must_avoid`, `example_posture`, `voice_note`; persona. The brief has no `look` key, so that slot is empty |
| kit | its part specs, the designs and narration of the beats that use it, cast, style summary | concept, story, world, motifs, value script, design seed |
| scene | its own spec, held elements, neighbours as names, cast, timings, style summary, kit source (15 KB), devices | **concept, story, motifs, value script, through-line, outcome; neighbours' looks**; the palette and design seed its own card promises (`roles/scene.md:10`) |
| clip | spec, API line, timings, style summary | neighbours, cast, held elements, kit, devices |
| critic (Gemini Flash) | per beat: narration, on-screen, props, treatment; gate report | brief, outcome, style, concept, cast, value script. Later passes see only changed beats, so continuity across the film is never judged |
| storyboard fixer, fresh session | about 1.3 k characters of defects (9 such sessions in v2) | outline, concept, script, plan, brief |
| persona_pick | brief keys incl. `voice` | the brief's key is `voice_note`, so the voice wish never arrives |

So the film's vision (concept, world, cast, motifs, value bands, through-line) is written once, by the storyboard, and
then reaches the beat builders only as fragments of their own beat's spec. Nine scene workers run in parallel, each
seeing its beat and its neighbours' names, and nobody downstream can look the vision up. That matches what the
frames show: good parts that do not add up to one world.

Shuttle shares the vision differently: one lead plans brief to storyboard itself (the vision lives in one mind), keeps
`logs/shuttle/notes.md` across sessions, writes a free-text intent paragraph on top of each sub-agent's brief (the
engine part of that brief is the same `task_message` Relay uses), and gives every sub-agent `read_artifact` for all
plan files. In short: Shuttle = Relay's data block + an intent paragraph + pull access to every plan file.

## 3. Does tool calling work? Mechanically yes; four silent leaks

From the Claude Code transcripts of `feedback-relay-v2` and `feedback-relay-sb` (every tool call and result): every
task ended accepted; no nudges, turn caps, call caps or loop stops; about 76 MCP server logs show no crash or timeout;
snapshot images reach the model (60 of 60 results in v2 carry an image block, and the models describe them).

1. **Scene workers photograph the wrong moment (the biggest leak).** `lab_snapshot` takes "seconds from the beat
   start" (`tools.py:852`) and adds the beat's start (`tools.py:794`), but the task message gives absolute times
   (`conductor.py:188`). Models pass absolute times. In v2, 48 of 146 snapshot times fell outside the beat (16 past
   the end of the lesson); 20 of 26 scene sessions took at least one wrong picture; 4 sessions submitted without ever
   seeing their own beat. In sb: 38 of 102 outside, 6 of 17 sessions blind. A worker wrote: its one snapshot "showed a
   different beat's picture ... I didn't check the tag position by eye", and the submit was accepted. Shuttle wraps
   the same tool, so it may share this (not checked).
2. **Bug reports are lost.** `report_finding`'s schema is only `{finding: object}`; the required fields are never
   shown. In sb, 8 of 8 reports were rejected and none retried, though all 8 workers had found the same kit bug.
3. **Runtime errors pass the submit gate.** In sb, 13 of 17 scene sessions submitted with runtime errors still in the
   snapshot; in v2, 2.
4. **Most reading tools go unused.** Scene workers read `get_api_section` and `get_example_scene` and almost nothing
   else; about 13 skill-section reads in the whole run, none by a scene worker (as L-240 found). Bare tool names in the
   prompts ("call lab_snapshot") cost 14 failed calls in v2, and each re-sent the whole scene (about 4 k output
   tokens). One lesson lock serialises snapshots: median wait 82 s, max 557 s.

Also: the snapshot sheet is always three 640 x 360 tiles with no time labels, scaled to about 520 px per frame, which
is borderline for small text; a frame that fails to render is dropped without notice (`loom/qa.py:51`).

## 4. Shuttle's changes and what Relay can take

| Shuttle mechanism | Relay today | Take it? |
|---|---|---|
| Skills as sections on demand, a per-phase "what to read" list (D-135), only the phase's tools listed (D-148), menu only where needed (L-369) | Has the same tools, the menu only for menu roles, and per-role tool lists | **Yes, the reading list.** Relay already loads on demand; the gap is that workers never pull. A short "read these sections first" line per role card, named for the beat's kind, closes it |
| `read_artifact` for every plan file | Missing | **Yes**: the pull half of the shared vision |
| Lead's intent paragraph on each brief, notes file across sessions | Not applicable as built (no lead) | **The idea, yes**: a film card (section 5) plays the same part without a lead |
| Pilot pair: the first continuing join is built and composed first, then the rest (D-144, L-319) | Missing: all scene jobs start at once (`conductor.py:540`) | **Yes**: it catches kit continuity before nine workers copy a mistake |
| Kit preview gate before `submit_kit` | Missing | Yes, medium effort |
| Edits `{old, new}` instead of whole files on snapshot, kit preview and clips (D-150, L-377) | Whole source each time | **Yes**, the biggest cost lever Shuttle found (about a third of sub-agent cost) |
| Critic re-judges changed beats with earlier and accepted findings | Has it (L-346), without accepted findings | Small addition |
| Scoped reopen, one-beat rework, judge/fix split, session split, brief by reference | Code already routes fixes; no lead context to protect | Not needed |

Shuttle's own record is a caution, not only a model: v3 (D-148, less context per call) made 838 calls and cost $41.58
against v2's $19.56, and its saving is not shown by one run (R-44). Cutting context did not by itself cut cost.

## 5. Critique (critique-loop)

**Goal restated.** Relay should make a lesson that feels like one film from one point of view, at a cost below a
Cowork or Shuttle run, without a lead agent holding everything. Judged against that, not against Cowork's process.

**Fatal**
1. **Builders work blind to the film and often to their own beat.** The vision never reaches scene, kit, clip or
   critic (section 2), and a third of snapshots show the wrong moment (section 3.1). Together these explain most of
   what the frames show: parts that look fine alone and do not join. Fix: the film card plus `read_artifact`
   (section 6, survivor 1) and an honest snapshot (absolute times, refuse times outside the beat).

**Major**
2. **The world is fragmented at the plan, before any agent draws.** Script without a look, low ratings, 9 templates,
   8 stations, templates that draw their own rooms and people. Fix: a concept seed before the script, a one-world rule
   at the storyboard gate (survivor 3), and the mix offered as a choice for story styles.
3. **Nearly half the money is rework, and the reviewer is the weakest model in the loop.** Of $11.10 logged, $6.02
   was the first pass and $5.08 was fixes: 11 storyboard fix sessions on Opus ($1.82), 18 scene fix sessions ($2.54),
   12 critic re-passes ($0.53). The critic (Gemini Flash) judges without the brief, style or concept and never sees the
   film as a whole. Fix: prevent rework upstream (survivors 1 and 2); give fixers the film card; one whole-film
   critic pass with the card.

**Minor:** `voice_note` never reaches persona_pick; bug reports lost; runtime errors pass submit; bare tool names;
snapshot lock; role cards promising inputs they do not get (scene: palette and design seed; critic: pack, look,
`lab_snapshot`; clip: palette tokens).

**Protect while fixing.** The defect router and owners (fixes go to whoever made the thing); per-role models (D-142);
code stages that cost nothing; the critic re-judging only changed beats; the storyboard's comment-bubble device and the
outline/storyboard split; prompt caching (84 to 86 % of scene and storyboard input was cached, so a shared prefix is
cheap); and "the frames win" (rule 12). Do not answer this with parity mode again: pasting whole reading lists
(about 280 KB per role) is the opposite of "some, not all", and it did not fix quality before.

**Verdict:** fix the fatals first. The architecture is sound; the plumbing between the roles is what is missing.

## 6. Ideas (brainstorm-loop)

**Frame.** Who: Kshitij and the learners who watch the result. Cost to them: a film that reads as a set of slides,
and a pipeline that pays nearly as much to repair as to build. Bounds: keep Relay's many-agent design, keep both
mixes, determinism, no em or en dashes, log everything, never cut a step for cost (D-97).

**Diverge (16)**
1. A film card: a code-built digest (2 to 3 k characters) of the vision, sent to every role after the outline.
2. A concept seed written before the script (world, cast, one recurring device) so the script and allocation plan
   inside a world.
3. `read_artifact` for every role (pull, as in Shuttle).
4. Pilot pair: build the first two continuing beats, then hand their still to every other scene worker as the look.
5. A capped production-notes file each role may append three lines to, read by every later role.
6. One whole-film critic pass with the film card and a strip of all beats, for continuity and drift.
7. Offer the cinema mix for story styles when the brief's look is a story world (a choice, not a default).
8. One-world rule: a station a kit set owns cannot host a template that draws its own room; upgrade it or put it in
   the set.
9. Opus writes the script (the part that decides how much moves).
10. One planner session resumed from brief to storyboard so the vision stays in one mind.
11. Make tools honest: absolute snapshot times, finding schema shown, runtime errors block submit, full tool names,
    snapshot outside the lock, a call log.
12. Edits instead of whole files for snapshots and fixes.
13. Fixers resume their session or get the film card plus the outline, never 1.3 k of defects alone.
14. A "read these first" line per role card, named by beat kind.
15. A Claude critic with vision instead of Gemini Flash.
16. Inverted: no parallel scene workers; one builder writes all beats in order, as Cowork does.

**Clusters (by mechanism)**
- *Carry the vision to every role:* 1, 2, 3, 5, 10, 13.
- *Look before fanning out:* 4, 6, 16.
- *Stop the plan from fragmenting the world:* 7, 8, 9.
- *Make the tools tell the truth:* 11, 14, 15.
- *Pay once, not twice:* 12, plus everything that prevents rework.

**Stress test**
- *Film card (1 + 3 + 13).* Demand: audit gaps 1, 2 and 4, and the frames. Feasible: code only, no new model call,
  built from storyboard, brief, plan and style. Second order: risk of every beat forcing every motif; word it as
  reference ("research is a reference, never a checklist", rule 11) and keep it short. Graveyard: parity mode failed
  by size; this is the opposite. **Survives.**
- *Pilot pair with a reference still (4).* Demand: Shuttle L-319 (a kit that could not carry continuity made every
  beat be rewritten). Feasible: the qa helpers are shared. Second order: the first two beats run before the others,
  a few minutes of wall time. **Survives.**
- *One-world rule and concept seed (2 + 7 + 8).* Demand: the 8 stations and template rooms. Feasible: a storyboard
  gate rule plus one paragraph in the brief or pedagogy output. Attack: rule 11 keeps the classic way; the rule must
  not ban templates. Repair: templates stay; one that shares a station with a kit set must draw inside that set, or be
  listed as a deliberate cut-away. **Survives after one repair.**
- *One planner session (10).* Attack: the outline and storyboard run on Opus and the script on Sonnet; one session
  cannot change model, and cache expires after an hour. Repair: carry a digest instead, which is idea 1. **Cut
  (merged into the film card).**
- *Single builder (16).* Attack: Shuttle v3's long lead sessions raised calls and cost; slower; loses Relay's
  parallelism. **Parked** as a control experiment, not a direction.
- *Opus script (9) and Claude critic (15).* Attack: both raise cost, and rule 13 needs shadow mode before a model
  change. **Parked** until the cheap script experiment (section 7) says whether the model or the missing look causes
  the low ratings.

**Survivors, ranked**
1. **Shared vision, some not all:** film card pushed to every downstream role and fixer, `read_artifact` to pull more,
   a concept seed before the script. Strongest argument: closes the gaps the audit found at almost no cost (a cached
   prefix). Nearly failed on "forced motifs"; survives by reference wording and size cap. Cheapest validation: rerun
   only the script role with and without the seed (section 7).
2. **Honest tools:** snapshot times, finding schema, runtime errors at submit, full names, lock. Strongest argument:
   measured leaks, small code. Nearly failed on "is it quality or plumbing?": a worker that never saw its beat cannot
   make it good. Validation: a two-beat bench reporting snapshots inside the beat (target 100 %).
3. **One world by construction:** pilot pair with a reference still, one-world rule, mix offered for story styles.
   Validation: the stations and template-room count on the next run's storyboard, then the frames.

**Cut list:** parity mode again (size, failed before); one planner session (cannot cross models, merged into 1); more
fix rounds (pays twice); a bigger critic before the critic has the brief (wrong order); single builder (parked).

## 7. Cost without losing quality

`feedback-relay-v2`, every logged call ($11.10 notional, 276 calls):

| Role | Cost | Share | First pass | Rework |
|---|---|---|---|---|
| scene | $4.61 | 42 % | $2.07 (9 beats) | $2.54 (18 fix sessions) |
| storyboard | $3.64 | 33 % | $1.82 | $1.82 (11 fix sessions) |
| kit | $1.21 | 11 % | $1.01 | $0.19 |
| critic | $0.56 | 5 % | $0.03 | $0.53 |
| everything upstream (brief to outline) | $1.09 | 10 % | $1.09 | 0 |

The plan (brief to outline) is 10 % of the money and decides most of the quality; the build and repair are 90 %.
That points one way: **spend on the plan's context, save on rework.**

Cuts that do not touch quality:
1. **Prevent rework** (survivors 1 to 3): every fix round avoided is a whole session saved. Rework was 46 % of this
   run. Expected to be the largest saving, unmeasured until the next run.
2. **Edits instead of whole files** on snapshot and fix (Shuttle L-377: about a third of sub-agent cost).
3. **Fixers with context**: a storyboard fix today is a fresh Opus session with 1.3 k of defects; given the film card
   it should land first time instead of in rounds.
4. **Full tool names in the prompts**: 14 failed calls each re-sent about 4 k tokens of scene source.
5. **Kit source in every scene message** (15 KB): send the kit API (already written to `logs/kit_api.md`) and pull the
   source on demand. Small, because it is cached.

Not a free cut (needs shadow mode under rule 13 first): storyboard fixes on Sonnet; a cheaper scene model. Worth
paying more for, if a test shows it: the script on Opus (+ about $0.6), a Claude critic with the film card.

## 8. Close (brainstorm)

- **Key ideas:** the Relay film is fragmented by the plan and blind at the build; a compact film card plus pull access
  gives every agent the same vision without passing everything; the tools leak silently and are cheap to fix; nearly
  half the cost is repair that a shared vision should prevent.
- **Strongest direction:** survivors 1 and 2 together: the film card (with concept seed and `read_artifact`) and the
  honest snapshot. One without the other fails: a worker that knows the vision but photographs the wrong beat cannot
  check it, and a worker that sees its beat but not the film draws a good island.
- **Riskiest assumption:** that missing context, not the script and scene models, is the main cause. Shuttle v2 built
  with Sonnet and rated 7.5, which supports it; Relay's script on Sonnet rated far fewer beats as moving than Opus did,
  which could cut either way.
- **Next step (cheapest test, about $1.5):** rerun only the `script` role of `feedback-relay-v2` four ways (Sonnet as
  now; Sonnet with a concept seed and the style's look; Opus as now; Opus with the seed) and compare
  `change_over_time`, hints and `visual_intent` against Shuttle's script. If the seed moves Sonnet most of the way,
  build survivor 1; if only Opus moves, the model matters too and goes to shadow mode.
- **Parked:** single builder as a control run; Claude critic; production-notes file (revisit if the film card is not
  enough).

## Not verified

- That the context gaps caused any one defect in the frames (inferred from the pattern, not traced per defect).
- That Shuttle's `lab_snapshot` has the same clock mismatch (it wraps the same tool; not checked).
- What snapshots past the end of the lesson showed; whether the Claude Code CLI shrinks images further.
- The savings in section 7: none measured; Shuttle's D-148 and D-150 savings are also unmeasured (R-44).
- The audio was not listened to. Cowork's lesson differs in mix, length and look notes, so it is a direction, not a
  control.

Evidence: grids at `docs/research/relay_quality/` (16 frames per film); audits' scripts were scratch work and are
summarised here with their file and line references.
