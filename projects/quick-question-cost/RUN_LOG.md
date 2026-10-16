# RUN_LOG: quick-question-cost (append-only)

Planner: opus sub-agent, brief to script, overnight showcase 2026-10-06 (D-116). Style editorial-paper, genre
explainer, about 2.5 min.

## brief (accepted, 2 gate rounds)
- **Through-line as a mechanism plus a lever, not a topic:** "a quick question is never only the minute it
  takes ... a team protects focus by choosing when questions land, not by asking fewer of them". The second
  clause pre-decides the payoff (timing habits) and forbids the cheap "stop interrupting" lesson. Rejected:
  "interruptions are costly" (a title, true of any video on the topic).
- **Numbers pushed down to knowledge, explicitly:** `must_cover[2]` says any recovery-time figure appears only
  if the knowledge sheet establishes it with its caveat, else hypothetical; `must_avoid[0]` names the widely
  repeated recovery figure as a risk without writing it. The brief carries no digit.
- **Visual direction compiled from the notes into one invariant:** the visible minute and the hidden re-entry
  cost always side by side, so the difference IS the picture; the same morning layout returns at the payoff.
  This gives the storyboard a return device without naming a template.
- **Gate lesson:** the template-name lint matches substrings: "quoted as fact" tripped on `quote` (a template
  id). Reworded to "repeated as fact". Words like quote, card, grid in prose can trip it; check `must_avoid`.

## knowledge (accepted, 1 gate round; approved unattended per Kshitij)
- **Zero digits in any statement (all 18 facts have `numbers: []`).** The topic's famous figures are the
  danger: F18 is a `caution` fact (established) that no single recovery figure exists, which licenses the
  script to show size only as hypothetical ("say", "imagine"). Rejected: including the recovery-time figure
  as a caveated `contested` fact; the lesson does not need the debate, and a caveated number on screen still
  reads as a fact.
- **Mechanism chain chosen so the script can build the hidden cost from parts:** switch cost (F1, F2),
  resumption lag (F4), errors after seconds-long interruptions (F5), attention residue (F6), cost moves to
  stress when people speed up (F8). Each is a lab finding with a caveat saying so.
- **Asymmetry fact for the "why it matters" segment:** F11 (Perlow 1999: the asker gets unstuck, the cost
  lands on the interrupted). This is what lets the script avoid blaming the asker (F17) while still showing
  the team-level cost.
- **Habits all grounded in direction, labelled honestly:** quiet periods (F12, faded after the trial: honest
  "needs upkeep"), batching (F13, F16), ready-to-resume note (F14), urgent channel plus response time (F15,
  `practice`, caveat "common practice, not proven"). `not_claimed` names the twenty-three-minute figure in
  words, the IQ and percentage myths, and any money-lost figure.

## pedagogy (accepted, 1 gate round)
- **concrete_first, with a two-column ledger as the signature move:** "show the moment on the one morning, put
  what it costs on the ledger (visible, hidden), THEN name the idea". Each of the three new terms (switch cost,
  resumption lag, attention residue) is named only after the viewer watched it happen. Rejected `contrast_led`:
  the contrast (visible vs hidden) is the picture, but the teaching order is case-then-name; one strategy only.
- **Bloom understand -> apply -> apply, three sections for 150 s.** sec2 is the peak (apply the split to a whole
  morning, faded: the narrator stops naming parts after the first questions). Rejected an `analyze` sec2
  ("distinguish") because understand -> analyze is a two-level jump and the gate forbids it.
- **The one stopping check is the hinge of the lesson:** a pause_predict after sec2, "if the same questions
  arrived together, which column shrinks?" Answer: hidden; tempting wrong: visible. Its reveal opens sec3, so the
  habits arrive as the answer to the viewer's own prediction rather than as tips (brief must_avoid: tips not tied
  to the mechanism).
- **Second person and a seat flip instead of a named character:** the viewer is the interrupted in sec1 and the
  asker in sec2 (F11), which makes "nobody is careless" land without blaming anyone. Self-interruption (F9) cut for
  coherence at this length.

## persona (accepted, 1 gate round)
- **Copied `packs/personas/mentor.json` (the project's named persona), adapted, not replaced.** Kept every voice
  rule, move and rhythm number. Added two rules the brief needs: any hidden-cost size is framed with say/imagine
  and followed by "the real figure varies"; never blame the asker. Rewrote examples and anti-examples for this
  topic, including the twenty-three-minute line as an anti-example (in words, so no digit enters the plan).
- **Rejected keeping the pack's memory/spacing examples:** the scriptwriter imitates examples more than rules;
  off-topic examples pull the register toward a different lesson.

## script (accepted, 2 gate rounds)
- **First draft was 567 words, 24 beats, ~254 s against 150 s (x1.69, rejected).** The re-cut to 366 words, 19 beats
  (~151 s of narration, gate estimate ~167 s with beat gaps; allocator 170.6 s with the pause) merged the hook's two
  beats (b01), folded the misconception "ask fewer questions" into the reveal (b14), merged the seat flip and "lands on
  someone else" (b12), and cut F5 (seconds-long interruptions cause errors) and F9 entirely. Lesson for the rubric:
  at 145 wpm a 2.5 minute lesson holds about 330 to 370 words; budget words per section from the plan BEFORE
  drafting (here roughly 45 intro, 110 sec1, 110 sec2, 110 sec3), not after.
- **One device carries every beat: the two-column ledger (visible, hidden) beside a held slot.** Every unit is stamped
  on the spoken term (b03 switch cost, b04 resumption lag, b05 attention residue); sec2 turns the same page into a
  morning grid; b14 collapses the hidden runs; b18 is the hook's page returned (callback). Rejected: a separate chart
  for the morning; the brief's invariant is visible and hidden side by side.
- **Hypothetical framing is explicit where sizes appear:** b01 "Say", b08 "Say five questions, a minute each ... The
  real figure varies" (F18 voiced, per the persona rule added at the persona stage). All 19 beats carry grounding;
  every beat with a size is `hypothetical: true`. No digit appears anywhere, so the number gate had nothing to clear;
  the risk lived in prose ("bigger", "helped"), which was rewritten to what the facts say ("a column you don't" see,
  "many felt more productive").
- **The pause_predict (b13, pause 4 s) and its reveal (b14) are the hinge:** the three habits (b15 to b17) arrive as
  consequences of the answer "hidden". b17 echoes b04's "where you were" as "where you are, what comes next" so the
  ready-to-resume note is a visual callback, not a new idea.
- Stopped at the storyboard: `go` wrote `plan/allocation.json` (0 avatar, the project has no avatar) and
  `plan/design_seed.json`, and printed `tasks/storyboard.md`. Not written by this planner.

## storyboard (accepted, 2 gate rounds; planner: opus sub-agent, D-116)
- **Concept:** one magazine feature about one morning. The plan sits in a held slot on an editorial working page and a
  two-column ledger (Visible, Hidden) beside it accounts for every quick question as countable units; a second page
  carries the same split over a whole morning as a unit grid. Typeset pages (headline, term card, table, quiz, habit)
  print over the held page or stand as the headline page. No figure drawn: the viewer is "you", seen through the
  work, the slips and the ledger (answers the brief's open question; editorial pack, D-102).
- **World:** three stations. `spread` (the working page, b01, b03 to b07, b16 to b18), `headline` above it (b02, b19,
  reached only by fill joins: the bookend), `morning` to the right (b08 to b15). Geometry is a contract written into
  the station notes: the slot rect [200, 150, 760, 780] equals `document.page` (side left), so the three template
  beats that are the plan or the note (b04, b17, b18) land in exactly the slot.
- **The allocation was the main design problem.** 9 of 19 beats must be catalog templates, and templates cannot draw
  or change the held page. Solutions, in order of preference: (1) a template that IS the thing in the slot
  (`document.page` with `keep` of the ledger and `backplate: false`: b04 the hunt for where you were, b17 the note,
  b18 the plan further written); (2) the overprint device, a template card over the held page under the default
  paper veil, whose kept elements the next bespoke beat holds back to full strength (b05 term, b13 quiz, b15 habit);
  (3) a typeset page with the drawn page leaving (b07 table) or a fill-in headline page (b02, b19).
- **Devices (6, the schema max):** slot, ledger, morning_grid, overprint, time_strip, plus the join material `fill`
  (the question slip becomes the headline in b02, the batch tray becomes the closing question in b19). Rejected torn
  paper and page turns: cartoon material, illustrated packs only.
- **Value script:** light open (b01), mid from the morning (b08), one break at b11 (red hatch fills the freed cells:
  the most red in the film, kept for the cost moving to stress), light quiz (b13), mid answer (b14, red drains out),
  light close from b16. Colour meaning fixed: red = hidden cost only; ink = visible minute; accent4 green = the plan
  and its work (forced by `document.page`'s header band, so the bespoke plan matches it).
- **Joins:** cut (b01), fill (b02), camera pan down (b03, "into the page"), continue b04 to b07, chapter hard cut
  (b08), continue b09 to b15 (b13's quiz card is the sec2/sec3 chapter card, so the answer plays on the very picture
  the viewer predicted on), camera pan back left (b16, "back to the opening page"), continue b17, b18, fill (b19).
  13 of 18 joins are continue (held layouts), under the 80 % warning.
- **Bespoke beats (10, all motion or hybrid allocations, each with a full design):** b01 hook (plan still, strip runs
  to lunch), b03 ledger ruled + slot swap + switch cost stamped, b06 flicker (hard swaps, not Loom.slot, under 3 Hz)
  + ledger catch-up, b08 morning grid + pile, b09 accelerating stamps, b10 magnifier on the fragments, b11 runs
  compress and relabel time to stress, b12 seat flip as a spread opening inside the same station, b14 the re-flow
  answer, b16 the opening page returned with focus time on the strip.
- **Compromise, flagged:** because b04 and b05 are templates, the ledger cannot stamp resumption lag and attention
  residue on their words. b03 reserves three dashed rows; b06 stamps rows 2 and 3 as the veil clears, before its first
  word (not word-synced). b07 then sets all three in type. Rejected: scheduling b04's stamps from b03's code at guessed
  times (not on the word, fragile); zooming into the hidden column for two term cards (shows nothing).
- **Also rejected:** `calendar.plan` for habit one (blue header and ochre cards add two hue families); a b19
  alternative that overprints the returned page (switching would keep elements across stations and break `held`).
- **Animatic:** `py -m loom animatic` CRASHES before narration exists: `story.animatic` calls
  `read_json(audio/timings.json, None)`, and None means "no default" (the L-171 trap again). Ran the same function with
  that one read patched in memory (no file edited); 19 panels, 140.8 s estimated. What it showed: every beat has a
  subject and a world, worlds alternate page / headline / page / morning / page / headline, but b08 to b12 were five
  "wide" shots in a row (35 s at one size). Changed b10 to an insert (the lens) and b12 to establishing (the spread
  opening). Accept warnings left: "three consecutive bespoke" (L-20 false positive: different scenes), "every scene is
  flat" (deliberate: editorial, typographic, calm).
- **Anchors:** all 33 prop anchors and every beat-sheet anchor checked as substrings of their beat's narration (0 bad).
