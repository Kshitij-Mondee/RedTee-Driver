# RUN_LOG: groupthink-trap (overnight showcase, D-116, 2026-10-06)

Planned brief to script by an Opus planner sub-agent from `docs/primitives/BRIEF_PLANNER.md`. Append-only.

## brief (accepted, 1 round; warn: ~1777 tokens against an aim of ~1200)
- **Through-line chosen as a mechanism, not a topic:** "every doubter thinks they are the only one, so the silence
  looks like agreement". Rejected "groupthink and how to avoid it" (a title) and "leaders should listen more" (blames
  one person; breaks the genre's "never blame" and makes the leader a villain). The illusion that you are alone in
  doubting is the hinge every later stage can picture: private thoughts the viewer sees and the characters do not.
- **Arc built for a replay:** `the moment it goes wrong` and `the model applied (worked)` are the SAME meeting with the
  same people, so the habit is the only variable. Each habit is meant to land on one doubt we already saw in the
  opening; that ties practice to the story instead of a tip list.
- **must_cover kept fact-free:** origin of the term, the habits and the evidence caveat are all `from_knowledge: true`;
  the four example habits are named only as "for example", marked inferred in provenance until the knowledge sheet
  confirms each. Historical case studies are pushed to `must_avoid` as the story (one line at most) so a 2.5 minute
  lesson does not turn into a history lecture.
- **Look translated, not copied:** the request notes name engine techniques; `visual_direction` says them as kinds
  ("motion that steps like drawn frames", "a page turning or torn paper") to keep rubric rule 3 (no tool names).
- **Gate taught:** the size warning fires at ~1.8k tokens; the arc `what` lines carry most of it. Kept because each
  line instructs the script; noted for the rubric as the trade-off.

## knowledge (accepted, 1 round; approved "agent, unattended per Kshitij (overnight showcase, 2026-10-06)")
- **17 facts, 2 digits total** (F2 "1952", F5 "1961"), both history dates with a named source. No percentage anywhere:
  Asch (F10) is kept as a direction ("conformity dropped sharply with one ally"), and the conformity rates are in
  `not_claimed` so the script cannot reach for them.
- **Who coined it:** F2 records that Whyte used the word before Janis, with a caveat that the safe line is "Janis
  developed it". Rejected the common "Janis coined groupthink", which is a circulating error.
- **Each habit carries its own honest limit:** F12 (devil's advocate) carries Nemeth's finding that role-played
  dissent is discounted; F15 (premortem) forbids attaching a measured gain. F17 is the mixed-evidence caveat the
  brief's must_cover asked for, marked "must carry in one plain line".
- **Bridge facts for the story's hinge:** F9 (pluralistic ignorance) and F16 (why people stay silent at work) are
  what let the through-line ("every doubter thinks they are the only one") be grounded rather than asserted.
- **Gate taught:** the accept gate only checks schema and digits; fact accuracy was self-reviewed against the
  references before approving. Unverified here: no web lookup was run; references are from memory of the literature.

## pedagogy (accepted, 1 round)
- **scenario_led, not contrast_led:** the replay looks like a before/after contrast, but the skill is judgement in a
  live meeting, so the plan is built on consequences (sec1 fails, sec2 recovers) with the signature move "show the
  hidden doubt, show what happens, THEN name it". Rejected question_led ("why do smart teams...?"): it delays the
  story and turns the hook into the title.
- **Three sections, energy build -> peak -> rest, Bloom understand -> apply -> apply.** sec2 carries exactly four new
  terms (the four habits), the rubric's limit, so sec1 voices only "groupthink" and says the other mechanisms in
  plain words. One slowdown only: "each doubter thinks they are the only one" (the through-line's hinge).
- **The single stopping check is a quiz, not a pause_predict:** the scenario (leader already spoke, "any
  objections?", silence) has a statable answer (write privately why it could fail, then read out: F14 + F15), and a
  real tempting wrong (ask again out loud), refuted by F9/F16. A pause_predict had no single predictable fork.
- **Misconception 3 ("the fix is braver people") comes from the brief's through-line**, not the sheet, and is refuted
  by staging: same people, same nerves in the replay, only the meeting changes.
- **Gate taught:** passed first time; the mechanical checks (goal prefix, Bloom path, energy, budget) were designed in
  up front rather than discovered.

## persona (accepted, 1 round)
- **Copied `packs/personas/storyteller.json` unchanged** (only `provenance` records the copy). It already holds the
  brief's voice: "meet them" opener framed as invented, present tense for the moment, "the plain lesson" after each
  story beat, max 8 words a phrase, mean 9 words a sentence. Rejected `mentor` (a coaching voice drifts teacherly on
  a soft-skills topic) and writing a bespoke persona (no brief need the pack misses).
- **One tension carried into the script, not the persona:** the pack says "use the character's name at most once
  per beat"; with five people at one table the script names only the leader, and the others are "one colleague",
  "the person by the window", so the name budget is never under pressure.

## script (accepted, 3 rounds: 1 pass with a length warning, 2 cuts to clear it)
- **First draft ran ~196 s against the 150 s plan (448 words, 21 beats); the gate only warned.** Cut to 375 words
  (narration alone ~150 s at 150 wpm, ~167 s with the per-beat allowance) by deleting restatements, not ideas:
  b08 lost its three-item consequence list (the picture carries it: each doubt returns on its own object), b11's
  recap became three two-word phrases, b12 dropped "same room, same people" (moved into b13). Lesson for the rubric:
  write to the word budget (target_s minus 0.8 s per beat, times wpm/60) BEFORE drafting, not after.
- **One running motif carries the whole lesson:** four private doubts drawn as objects (checklist, headset, sealed
  envelope, calendar page) in folded thought bubbles (b01, b05). They fail on the same objects (b08), each habit in
  the replay brings exactly one of them onto the table as a note (b13 date, b14 testing, b15 support, b16 client),
  and the payoff b21 is the opening frame with the four notes on the table. The habit-to-doubt mapping is what stops
  sec2 reading as a tip list.
- **Groupthink is named only at b10, after the failure (b08) and the refutation (b09)**, per the signature move;
  Janis is said to have "developed the idea" (F1, F2 caveat honoured), and F17's caveat is one line in b11 ("The
  evidence for it is mixed. Call it a pattern, not a law."). F5 (Bay of Pigs) and both dated facts are not voiced, so
  the lesson carries no digits at all.
- **Quiz built so the obvious habit is wrong:** b18 lists all four habits aloud (narration contract), and "speak
  last" is ruled out by the setup (Dana already spoke); b19 answers with write-first aimed like a premortem and
  refutes "ask again" via F9/F16. pause_after_s 4.
- **Rejected:** a presenter (avatar provider is none and the brief asks for a narrator-told story world); naming the
  other four people (the persona's name budget and the brief's open question); "the fix is courage" lines.

## storyboard (accepted, 2 rounds: round 1 passed first time; round 2 after the animatic, a timing fix in b12)
- **Concept:** one meeting room drawn like a small paper stage set, five people behind one long table under a locked
  camera, four private doubts (calendar page, checklist, headset, sealed envelope) folded in bubbles only the viewer
  sees. They stay folded through the first vote, come true weeks later on the SAME objects, and in the rewound meeting
  each habit turns one doubt into a written note on the table. b21 is b01's frame with the doubts on the table.
- **World:** moving right is forward in time (room x 0, weeks later x 2400, the viewer's week x 4800); the naming page
  and the quiz sit below (the idea under the story). The viewer's week holds Dana's room as a nested station ('meet') in
  its Wednesday block, so b20 pulls OUT of the room into the week (camera join) and b21 zooms back IN (zoom, 'into').
- **Set bible in the 'room' station note:** exact coordinates for board, clock, table, five seats, bubble and note
  slots, sheet and stamp, plus the colour meanings (red = a doubt, ochre = the plan, teal = a habit). Reason: the room
  is redrawn by five different scene authors (b01, b09, b12, b19, b21: `ctx.held` only works from the previous scene on
  the same station), and L-15 showed an author moving a table breaks "same room".
- **Devices (5 + join):** the_room (held layout, reframed only by cuts: wide, medium left, close right, medium right),
  doubt_bubbles (folded/open/lid are one morphing outline), doubt_to_note (object outline morphs into a note card),
  the_board (a Loom.slot relabelled on the word), stepped_vote (arms on fours; result b02, cause b07, rewind b12,
  answered by cards written and turned at once b14/b19). **Join material: torn paper, used only for time jumps**
  (b08 right, b12 left), read as a calendar page torn off: the date doubt's own material.
- **Value script:** light open (b01, colour withheld, four thin red seams) -> mid story (b03) -> DARK break at the
  failure (b08 dark field, carried into the dimmed room b09) -> mid (b10, after the dip) -> light lift (b17, plan fixed)
  -> light break at the payoff (b21: the four red notes and the ochre plan together, the only saturated things).
- **Bespoke beats (18, all motion beats):** none of the catalog blueprints can draw five people round a table with
  bubbles, so every motion beat is bespoke; the load is kept down by the held set (most beats only add their change)
  and the set bible. Templates by allocation: b10 definition (after a dip to black = the turn card), b11 document.page
  (the pattern as the meeting's notes, F17 caveat as its title), b18 quiz.question.
- **People:** pip and tess bean rigs, small, seated (hidden below the hips by the table), muted clothes; emotion by
  posture and stepped glances; no hands kit; Dana never points and has no doubt bubble.
- **What the animatic showed:** plan-only panels (no frames yet). Shot rhythm varies (no three beats share a framing);
  every beat has a subject; the only flat-card run is b10 to b11 (16 s, by allocation). b12 was over-booked (about 3 s
  for a torn join, four one-per-step glimpses and a 1.6 s rewind): the glimpses became one gesture.
- **Rejected:** a recap template with icons for b11 (a recap slide; the films replay their own images); Loom.place.meeting
  (its chairs are accent red, which this lesson reserves for doubts, and its laptop and papers clutter the note slots);
  a camera pan in b06 (still camera; the slowdown is held glances); `page` as the join material (its flap is not wired in
  world.js yet, docs/primitives/material.md); the script's "seen from the doubters' side" in b07 (front-view rigs only:
  replaced by a deliberate repeat of b02's frame); the word "failed" stamped in b16 (red cross plus the spoken 'it
  failed.' instead).
- **Engine note (not fixed, no engine edits):** `py -m loom animatic` crashes before narration exists:
  `story.animatic` calls `read_json(audio/timings.json, None)`, which raises on a missing file (the L-171 trap). Run
  here by tolerating that one read in-process; the command needs the fix.
- **Unverified:** the b19 -> b20 camera join out of a nested station and the b20 miniature hand-over (b19's elements
  switch off after the join); the motif travel of four objects as one group (b08 -> b09); the torn join on a dark
  incoming field; whether "Each one doubts it" over five people with four bubbles reads as a mismatch.
