# Why Relay's films fall short of Shuttle and Cowork: an architecture diagnosis (2026-10-12)

Kshitij: "I feel like the relay pipeline is great but it is missing something at the architectural or structural or agentic
level due to which the output quality is never close to shuttle and never near as good as claude cowork. ... Dig deep, be
clear, find the issue and propose solutions."

Evidence: the code (loom/agents/conductor.py, router.py, runtime.py, tools.py; loom/shuttle/*; skills/loom/*), the run
record (RUNS, AGENT_LEARNINGS, DECISIONS, the research docs) and today's two https-private-relay runs. File references are
to the code as of today.

## 1. The answer in one paragraph

Relay is a production line whose only closed feedback loop runs on mechanical checks. Every agent in it either knows the
intent and cannot see the film (the storyboard, the scene workers beyond their own beat), or sees frames and does not own
the intent (the Gemini critic, which reads 4-frame tiles per beat with a text row). Nothing compares what the film was
meant to show with what it shows, at the level of the whole film, and nothing can send a problem back to the layer that
caused it. Shuttle has that loop in a weak form (a lead that looks at contact sheets, triages and reopens the plan); Cowork
has it in a strong form (one orchestrator that looks at the overview and every sheet, rewrites the plan and the shared
code, re-composes and looks again). The models are not the gap: Shuttle's scene authors get the same role card and the
same engine task text as Relay's (agents.py:86-104, server.py:980-1021), and Sonnet writes in all three.

The proof from today: in run 2 the board, the film's main picture, was an empty frame from 10 s to 88 s (an engine bug,
now fixed, L-425). Eleven scene workers each photographed their beat 2 to 9 times, the check passed, the Gemini critic
passed, the final review said "the last fixes look right", and the film rendered. Seventy-eight seconds without the
picture the whole lesson is about went through every stage of Relay without one agent saying so. In Cowork the
orchestrator's first look at the overview would have stopped it; in Shuttle the lead's P10 contact sheets would likely
have.

## 2. The five structural gaps (ranked by how much of the quality gap each explains)

### Gap 1. No film-level closed loop: intent and result never meet

| Who | Knows the intent | Sees the film | Can change |
|---|---|---|---|
| Storyboard (Opus) | the whole film | never a rendered frame: one look at a plan-drawn animatic (`look_at_animatic`, `use_frames=False`, conductor.py:700-712) | its plan, once; later only "change ONLY what they name" patches (router.py:207) |
| Scene worker (Sonnet) | its beat, plus a 12 KB card | its own beat only (`lab_snapshot` refuses other beats' times, tools.py:988-998) | its own file |
| Critic (Gemini Flash) | a text row per beat | 4 tiles per beat at 640x360; the whole-film grid `_overview.jpg` is filtered out (conductor.py:1035); later passes only changed beats | nothing: findings are text, routed by code |
| Shuttle lead | the whole plan (it wrote it) | contact sheets, frames, strips when it chooses (server.py:823-850) | triage, briefs, scoped reopens of the plan |
| Cowork orchestrator | everything (about 180 KB read, L-241) | the overview and every sheet, again after each change (RUN_LOG.scenes-C2.md:7-16) | anything: plan, shared code, any beat |

In Relay, no row has both "knows the whole intent" and "sees the whole film". That is the missing piece. Everything else in
this document is a consequence or an amplifier of it. The recorded symptoms all fit: "the gates passed and the films
failed" (D-99), "a film can pass every gate and still hardly move" (L-408), "a correct lesson can still fail to explain"
(L-227), the real mess sat in warnings no one read (L-424).

### Gap 2. The plan is never corrected by what it produced

The storyboard decides most of what makes a film good or bad: the world, what is kept across beats, the camera, how much is
on screen. Relay's storyboard never sees a rendered frame, and the router sends every critic finding on a bespoke beat to
the scene worker (router.py:185-192), never to the storyboard, even when the cause is the plan. Today's examples: the camera
pushes into a 1680 px board crop the browser and server cards (b07, b10, b11) and the key-exchange beats are small parts in
a large empty field (b06, b08). Both are planning decisions; a scene worker can only shrink or move things inside a frame
the plan fixed. Cowork revises the plan after looking ("watch it, fix the plan, then build", loom-director SKILL.md:33;
groupthink-trap's storyboard went two rounds after its animatic, and session C2 moved b15's shot focus after seeing it).
The bench post-mortem said the same in October: "in Cowork the storyboard is revised after looking" while the pipeline's
"never looked" (bench-postmortem.md:182-183).

### Gap 3. Things that span beats have no owner

A film is made of objects that live across beats: the board, the cast, a device, a motif. In Relay the unit of ownership is
the beat (one worker, one file) and the router assigns a defect by error code and by which beat is on screen at its time
(router.py:62-66, 150). So a cross-beat object belongs to whoever drew it first and to nobody after. Every major Relay
failure of the last week is this class: the doubled boards (L-423), the empty board (L-425), b12's line into b11's packet
routed twice to a beat that cannot change b11 (L-418), the kit's invented words routed to seven beats that cannot change the
kit (L-417), 22 held_missing from names agreed by no one (L-409). Cowork's fix was structural: session C2 turned the set
into "ONE piece of code" (`Loom.gt`) that every beat called (RUN_LOG.scenes-C2.md:9-14). Relay has the kit for drawings,
but nothing owns an object's life across the film: its states beat by beat, when it is shown, when it leaves.

### Gap 4. Effort stops at the gate, not at "good"

A Relay scene worker ends when `submit_scene` accepts: one clean look is enough (tools.py:660-725), with a "write it now"
nudge at half the turns and a forced submit at the end (runtime.py:337-340). In run 2 the workers took 3 to 6 turns and
2 to 4 looks each, about $0.15 a beat. Shuttle spent $8.59 to $11.60 in P8 against Relay's $3.30, with 79 to 259 looks
against 106; Cowork's scenes average about 10 KB of code a beat against Relay's about 3 KB (relay-v3-diagnosis.md). The
scene contract asks for three treatments and a choice (scene.md section 4), but nothing checks that it happened and nothing
rewards a better version over a passing one. With no one judging the beat against the film (Gap 1), "no errors" becomes the
definition of done, and thin, pale beats pass (the v3 diagnosis: "tells more than it shows").

### Gap 5. Feedback is routed by rule, without escalation or memory

- Ownership by error code and timestamp; no reassignment when the owner cannot fix; an owner out of rounds means "left as it
  is" and exit 2 (conductor.py:1289-1291). There is no escalation path (`escalate` is empty in every profile).
- Two critic passes at most; later passes see only changed beats, so continuity across the film is judged once.
- Fixers are mostly fresh workers: a session is resumed only within 270 s of its save, because the CLI never passes a
  1-hour cache lifetime (conductor.py:551-560, cli.py). The fixer reads the defect and the file, not the reasoning that
  made the file.
- Warnings are never routed (router.py:132-159).

Shuttle replaces most of this with a reasoning agent's triage (fix or accept each finding with a reason, choose the fixer,
group a join's two beats, reopen the plan), which is its real advantage over Relay, and also its cost (L-421: the lead chased
an engine-owned error 16 times).

## 3. What is not the cause

- **The authoring model.** Sonnet writes the scenes in all three; Kshitij: "I believe that sonnet writes good. it's not its
  fault" (D-155). Opus already plans in Relay.
- **The amount of context.** Pasting the whole Cowork reading ("parity mode") did not fix quality (relay-quality-context
  research). The film card, neighbours, held elements and now the on-screen block and the previous frame are in place; they
  removed defects but cannot make a beat good, because context is input and the gap is in the loop.
- **One long context.** Shuttle's lead is 7 to 12 short sessions with notes.md between them (rails.py:42-52); it is not one
  mind holding the film either. What it has is a reasoning agent with eyes at every phase.

## 4. Proposed architecture: Relay with a Director

Keep what Relay does well (deterministic rails, cheap parallel authoring, gates, determinism, the cost of a fifth of
Shuttle's) and add the one thing it lacks: a film-level agent that owns the intent, looks at the whole film at fixed
checkpoints, and decides at which layer each problem is fixed. Code still decides the order, the budgets and the gates; the
Director decides what is good.

### 4.1 The Director (closes Gap 1 and Gap 5)

- One role, Opus (or Sonnet in shadow mode first, D-97 rule 0), with a persistent journal (`logs/director.md`, the vision,
  the decisions and their reasons, as Cowork's RUN_LOG) and a resumed session where the cache allows.
- Eyes: the whole-film overview grid, per-beat sheets at full size, frames at chosen times, the strip across each join.
  Not error lists first: pictures first, then the check.
- Five checkpoints, each a bounded call (about 10 to 20 turns):
  1. After the storyboard: the animatic drawn from frames of a pilot compose, not from the plan (Gap 2).
  2. After the pilot pair: the look the rest of the film will copy.
  3. After all scenes are composed: the whole film, against the brief and the storyboard; writes findings by layer.
  4. After each repair round: only what changed plus the joins around it, and the overview again.
  5. Before render: sign-off, with the reasons, or the remaining defects named for the person.
- Powers: send a finding to the scene, the kit, the set track (4.3) or the storyboard (scoped reopen); accept a finding
  with a reason; reassign a defect whose owner cannot fix it; group a join's two beats for one worker. It replaces
  `repair_rounds` as the stop rule for quality, while code keeps the budget and a hard cap.
- Briefs in its own words: for each beat, three lines Shuttle's lead writes (the beat's one idea, what is seen on which
  words, the expected failure), on top of the engine's task text. This is the translation from vision to beat that Relay
  lacks today.
- The cross-family Gemini critic stays, as a second opinion the Director reads, not as the only eye.

Expected cost: 5 checkpoints at $0.30 to $0.80 each on Opus with cached context, about $2 to $4 a film; Relay would still be
well under Shuttle.

### 4.2 The plan sees its frames (closes Gap 2)

- The storyboard's look round uses a pilot compose's real frames (`animatic(use_frames=True)` once b01 and b02 exist), not
  the plan drawn over boxes.
- A Director or critic finding whose cause is the plan (framing, crop, density, what is kept, joins) is routed to the
  storyboard as a scoped reopen of those beats, with the frames attached. The router's rule "bespoke means scene" goes.

### 4.3 A set track: every object that spans beats has one owner (closes Gap 3)

- The storyboard declares each shared object once: `set: [{id: "board", part: "path_board", from: "b01", to: "b12",
  states: {"b02": "router_highlight", "b03": "tray_empty", ...}, frame: [x, y, w, h]}]`.
- The kit-builder (or a set role) draws it once in a set layer composed before the beats; the engine plays its states on
  the timeline from the declaration; beats receive it by `ctx.set("board")` and may add states on their own words, never
  draw it.
- The check owns its continuity: on screen for its whole span, the same position unless a beat moves it, no second copy,
  not cropped by a beat's camera. Its defects go to the set's owner, not to the beat on screen.
- This is Cowork's `Loom.gt` made a contract. Today's L-423 and L-425 fixes are the runtime half of it; the declaration and
  the owner are the missing half.

### 4.4 Done means good, not clean (closes Gap 4)

- Scene submit carries a short self-review against the beat's intent with the last frames (is the one idea readable at a
  glance; does the frame have one focal point and enough on it; does it continue the previous frame), and the three
  treatments the role card asks for, named. The Director accepts the beat at checkpoint 3, not the gate.
- Cheap deterministic film audits for what passed today: a held element's box with almost no drawn pixels (the empty
  board), a frame under N % ink for more than 2 s in a teaching beat, text cut by a camera framing. Each is code, costs
  nothing, and would have stopped run 2.
- Warnings repeated across beats are raised to one finding (L-424).

### 4.5 Hygiene

- Pass the 1-hour cache lifetime so fixers resume the author's own session (conductor.py:551-560).
- Escalate instead of exit 2: an owner out of rounds, or a cross-owner defect, goes to the Director.

## 5. How to prove it, before building all of it

1. **Ablation on the loop, not the model (one run, about $3):** take https-private-relay as it is now and run only the
   Director's checkpoint 3 and one repair round on it. If the Director names the defects the operator found today (the
   crops, the sparse key exchange, the "Noise" tag over the blocks) and the round fixes them, Gap 1 is confirmed as the
   lever.
2. **A/B within corporate-clean (D-122: versions within one style):** the same https-private request through Relay and
   Relay plus Director (4.1 and 4.2), rated by Kshitij without knowing which is which. Shuttle v2's 8 is the bar.
3. Build the set track (4.3) after the A/B, since it is the largest change, and judge it by the cross-beat defect count
   (doubles, empty holds, held_missing, cross-owner routes) over two runs.

## 6. Order of work

| Step | What | Size | Closes |
|---|---|---|---|
| 1 | Film audits: empty held element, sparse teaching frame, text cut by the camera; warnings raised across beats | small, code only | part of 1 and 4 |
| 2 | Director role with checkpoints 3 to 5, journal, triage powers, escalation; critic as second opinion | medium | 1, 5 |
| 3 | Storyboard look round on real frames; plan findings routed to the storyboard as scoped reopens | small to medium | 2 |
| 4 | Director checkpoints 1 and 2, per-beat briefs in its words | small | 1 |
| 5 | Set track: declaration, set layer, `ctx.set`, continuity check, its owner | large | 3 |
| 6 | Fixer session resume, scene self-review in submit | small | 4, 5 |

## Not verified

- The ratings that separate the pipelines are few: Kshitij rated two Shuttle films (8 and 8.5) and called today's Relay
  film a mess; the Relay v3 ratings (7 to 7.5) are the agent's own. No Cowork film carries a rating of his.
- The Director's effect is a prediction until step 5.1 and 5.2 are run.
- Shuttle's lead also missed things (L-421, the shipped majors of R-34); a Director is not a guarantee, it is the missing loop.
