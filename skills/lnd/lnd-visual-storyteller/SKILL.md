---
name: lnd-visual-storyteller
description: Turn a lesson's concept into a visual STORY that is interesting, memorable and sound - a governing visual metaphor when one helps, a setting and running character, a shot plan that moves wide to close like a film, a few reused devices, where depth and light carry meaning, which style family (flat 2D, 2D characters, 2.5D depth, isometric, 3D, cinematic motion graphics) fits each beat, the form of story each kind of video wants, recent evidence on attention and recall, and an animatic to review it. The person making the video chooses; classic and newer treatments are both kept as options. References, not a checklist. Use when a training, explainer or L&D video keeps coming out as a sequence of slides, when asked for something "more cinematic", "more interesting", "more like a story" or "catchier", when choosing between 2D, 2.5D, isometric or 3D treatments, and before storyboarding any lesson.
---

# Visual storytelling for learning video

A slide deck shows a list of true things. A film shows a place where something happens. Learners
remember the second one, because a place gives every idea an address and a change gives it a reason.
Your job is to find the place and the change, then plan the camera as a director would, before any
designer picks a template.

This skill sits between the pedagogy (what must be learned, in what order) and the visual design (how
each frame is built). It never invents facts: a metaphor is framed as a metaphor, a character as
illustrative.

**Interesting and sound, together.** Attention is scarce, and a lesson nobody watches teaches nobody. The
classic instructional principles (Gagne, Merrill, Mayer) are respected, but they are old evidence, not the
last word: every lesson should also be something a learner wants to keep watching and can remember a week
later. Story, characters, surprise, rhythm and cinema are how. Everything below is a set of references to
draw on, not a checklist or a template to fill. Recent evidence on attention and recall is summarised in
section 8 below (the full report, 118 sources: Loom `docs/research/2026-10-01-attention-learning-recall.md`).

**The person making the video chooses.** Nothing here replaces the classic way of making a lesson (clear
templates, illustrated faces, calm diagrams); it adds options beside it. Both are good, and which one a
video gets is the requester's taste, not a rule: ask them (plain and clear, some story, or cinematic;
illustrated faces, acting characters, or no people), and when they have no preference, use the way you
would have used before and offer the newer one. They see sample frames before anything renders and can
change any beat in one sentence. Keep it simple and human.

Every kind of video can have a story. What changes is the form it usually takes:

| kind of video | the form of story that usually fits |
|---|---|
| policy, compliance | a realistic workplace moment with a decision and its consequence, a character the learner recognises, the rule large on screen |
| teaching | a running example or character the idea happens to, one picture for the part that moves |
| onboarding | a place to find your way around, the new starter as the character, a map of how things connect |
| soft skills | people doing the thing: a small cast, a scenario with a turn, reactions on the key moment |
| explainer, change, vision | a governing metaphor, a scale journey, a mechanism shown running, a depth or 3D moment |

## 1. Find the one governing metaphor (the world), when one helps
When a picture would help, pick ONE the whole lesson lives inside, rather than a new one per beat. Test
candidates against four questions:
1. **Structural fit:** do the concept's parts map onto the picture's parts? (A release pipeline maps onto
   a harbour: ships are changes, the lock is review, the lighthouse is monitoring. A forgetting curve maps
   onto sand running out of a hand, not onto a harbour.)
2. **Does it change?** The concept must be SHOWN as a change in that world (a ship stuck at the lock, a
   tide going out). A metaphor that only decorates is a background, not a world.
3. **Does it scale?** Can you go wide (the whole harbour) and close (one rope on one cleat) inside it?
   That is where your shot variety will come from.
4. **Is it safe?** No metaphor that mocks the learner, trivialises harm, or needs a cultural reference half
   the audience lacks. For policy and compliance, a sober world (a building, a city grid, a workshop).
Write it down: `story: {metaphor, setting, arc, cast}`. If nothing passes all four, use a neutral stage
(a desk, a studio, an abstract space) and say so; a forced metaphor is worse than none.

### A device set per lesson (every pack)
The 96 films of the TED-Ed study (12 drawing families) repeat a few devices instead of inventing every beat: 3 to 5
named devices plus one join material (a held cutaway relabelled, a unit grid, a returning desk, cut paper as the
join). Name them in `storyboard.devices` and let beats draw from the set.

## 2. The arc in pictures
Map the pedagogy's arc (hook, setup, worked example, turn, practice, payoff) onto the world:
- **Hook:** the world at its most striking, and something wrong in it (establishing or wide shot).
- **Setup:** we meet the parts (wide to medium; labels arrive as the camera settles).
- **Turn / reveal:** the mechanism, shown close (close or insert shot; light narrows to what matters).
- **Practice:** the learner is handed the camera: a choice inside the world (medium, pov).
- **Payoff:** the world again, now working (the establishing framing returns, changed). Returning to the
  opening frame is the cheapest powerful device in the book: the viewer feels the change.
A `story_role` on each scene makes the arc visible in the animatic.

**Reuse is a device (every pack):** besides the bookend, a returning set, a callback to an earlier image, a recap that
replays the lesson's own images. Declare a deliberate repeat with `intent: "callback"`.

## 3. Shot grammar (plan it like a film)
| size | what it is for | typical beat |
|---|---|---|
| establishing | where are we, how big is it | hook, chapter openers, payoff |
| wide | the parts and their relations | setup, systems, flows |
| medium | one part and its neighbour; people talking | worked examples, dialogue |
| close | one mechanism, one number, one face | the turn, the key definition |
| insert | a detail (a button, a line of a policy) | proof, "look here" moments |
| overhead | plans, maps, isometric boards | processes, org and system maps |
| pov | the learner's eyes | practice, decisions |
Rules of thumb: vary it (a lesson that sits at one size reads as a slideshow); move in steps (wide to medium to
close, not wide to insert) unless a jolt is the point; and cut wider when the idea changes. When a
face carries the moment, frame it medium or closer: a face the size of a dot cannot act. (D-112: a small figure can
act through posture instead; illustrated packs, section 6.)

### Hold the layout, change its state (every pack)
The default for mechanism and structure beats: one held panel, cutaway or object whose contents swap, recolour or
relabel on the spoken word (one studied diagram ran 44 s this way), not a new station per beat. Lists and numbers
are objects in it: a slot that swaps, items arriving on their words, a unit grid stamped to a share, labels on the
things. Inside one idea, a held layout that changes is not a slideshow. (A swap-in-place slot is coming; until
then use held elements on a `continue` join, never a hand-coded imitation.)

### Joins: where they go, and what a zoom means (every pack)
- **Chapter boundaries are hard cuts or a card** (26 of 33 in one studied group); gradual joins live inside a topic.
- **A zoom enters the object:** the destination is drawn inside the source (a monitor, a door), so the join means
  "into": a `zoom` into a nested station, `hero.portal` drawing the frame.
- **The camera is mostly still;** one long eased move may carry a whole explanation (10 to 20 s) and cross a join.
  A deliberate ghost of the outgoing image is declared `join_in.overlap: "ghost"`.

**Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard,
cinematic-noir, cinematic-dawn).** Cartoon joins come from the film's material: a morph chain, a motif-shaped wipe,
torn paper or a page turn, a dive through a surface. Built in D-114: storyboard joins `motif`,
`torn`, `page`, `scroll` (and `handoff`, `fill`, which suit every family), `Loom.morph` chains inside scenes. Name the
one join material in `devices`, and never fake them in scene code.

### Rest, punctuation and pace follow the content (every pack)
- **Rest is deliberate.** A finished, dense frame may hold 7 to 24 s while the voice explains (`intent: "rest"`, or
  `"process_hold"` when a process runs on it). Loom's failures were long holds on empty frames.
- **Punctuation:** a 0.6 to 1.2 s beat with no new information marks a turn (`intent: "punctuation"`).
- **Pace per content, not house numbers:** hold at definitions and diagrams, move quickly through lists. Entrances
  short and eased (about 0.4 to 0.5 s), about 1.5 s per spoken list item. Motion share and cut rate describe, never target: good films
  sat at 0.60 motion share and at 1 to 31 joins a minute.

## 4. Depth and light carry meaning, not decoration
- **flat:** diagrams, text, data. The default; most beats stay here.
- **layered (2.5D):** mood and place: the hook, a story moment, a chapter opener. Near things move more
  than far things; focus is the idea, blur is everything else.
- **iso:** systems and processes seen as a whole: services, teams, flows, buildings, org charts.
- **3d:** an object whose shape matters (a device, a product, a part).
- **light:** `key` (one warm source: attention), `spotlight` (this, not that), `silhouette` (a person as
  anyone: stakes without a face), `night` (risk, the unknown), `dawn` (change, the future), `glow` (success).
- **value script (every pack):** tone is part of the shot plan (`storyboard.value_script`): one value band, broken
  on purpose (a dark beat for the key mechanism, a flood of colour at the turn, colour withheld until the payoff).
  The studied habit: a pale open, a slightly richer middle, a lift at the close. Place `night` where the script breaks.
- **one accent, placed (every pack):** `accent_on` names what the narration names; often under 2 % of the frame.
Depth that is everywhere stops meaning anything: save it for the moments where place or feeling helps
the learner care or remember.

## 5. Choose the style family per lesson, and the exception per beat
| family | reads as | good for | avoid for |
|---|---|---|---|
| flat motion graphics | clear, modern, neutral | most teaching | stories that need a face |
| illustrated faces (busts) | warm, expressive, simple | a person's moment, reactions, a thought | walking, acting a procedure |
| 2D acting characters | people doing things | soft skills, customer, safety behaviour, dialogue | abstract systems |
| 2.5D depth (noir, dawn) | cinematic, emotional | hooks, case studies, change stories | dense data |
| isometric | a system as a model | architecture, process, operations | feelings |
| 3D object | tangible, premium | products, devices, physical parts | text-heavy beats |
| whiteboard / line | thinking out loud | reasoning, first principles | premium brand pieces |
One family for the lesson usually reads best, with exceptions where a beat needs them (a 2.5D hook in a
flat lesson; an iso map in a character lesson). A lesson that changes family every beat is a
showreel, not a story.

**Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard,
cinematic-noir, cinematic-dawn).** Mixed media (cut paper beside line, a photo card on paint) works inside one
framing system: shared border, palette, label style and grain. Without it, two languages read as stock.

## 6. Cast (when there are people)
Name at most two recurring characters, give each a role (the learner's stand-in; the expert), and keep
them consistent across the lesson. Characters are illustrative: frame what they do as "say" or
"imagine" unless the source describes a real case. Acting beats: a pose change on the key phrase, a
gesture on the verb, a look toward what matters, lip sync on their own lines only. An illustrated bust
with a strong expression and an acting full character are both fine ways to show the same person.

**Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard,
cinematic-noir, cinematic-dawn).** How the studied films draw people:
- small in a composed place, faceless or minimal faces, emotion in posture, one gesture on the key word;
- profile, three-quarter and back views; a figure seen from behind shares the learner's view;
- hands as presenters (enter from the edge, act once, leave); silhouette crowds, the one who matters in the accent;
- big faces only with a designed rig (the busts above are one).

Featureless figures read as professional only when small, in the frame's most detailed place, or posed as
equal-scale specimens. Code never draws figures from imagination (D-102): use designed rigs and assets, and where a
pose or hands kit is missing, name the need and choose a non-figurative treatment.

## 7. The animatic, then the build
Before any scene is built, draw one panel per beat with its shot, depth, light, device, value and narration, timed
to the voice, and watch it through once. Does the learning land? Does the picture hold? Do the shots help the
learner follow? Do the devices return, and does tone break only for meaning? Fix the plan, then build.

## 8. What recent evidence says about attention, learning and recall (references, not rules)
Research from 2018 to 2026, weighed for strength. "Estimate" marks a working number no study has tested.
- **Attention follows purpose, not a fixed span.** The 8-second "goldfish" span has no research source, and
  there is no primary evidence for a 10-15 minute limit. Minds wander a lot during passive video; giving the
  mind a job (predict, notice, choose, recall) is what brings it back. Every 60 to 120 s is a good rhythm
  (estimate).
- **Questions inside the video are the strongest lever** for both attention and recall: interpolated
  questions roughly halved mind wandering in a lecture study, and embedded questions improved retention,
  comprehension and transfer across 54 video studies (2025). Checks are the lesson's second half, and
  spaced follow-ups keep it. Open question: a "pause and think" prompt in a linear MP4 with no response is
  not well evidenced; pair it with a real response where the platform allows.
- **Predict, then reveal.** Asking for a prediction before a demonstration multiplies what is learned from
  it; a misconception shown and then overturned beats clean exposition. The best surprise is a
  misconception breaking, not a manufactured twist.
- **Open with a real gap:** a question the learner can almost answer, from their own work, answered in the
  video. Curiosity improves memory for the answer (and for what sits near it).
- **Interesting must be relevant.** Seductive details (fun but irrelevant) reliably hurt. Deletion test: if
  cutting it loses no step of understanding, cut it, or make it the example. Humour works when the joke is
  the lesson's mistake.
- **A story as the spine**, sized to the concept: a named character, a goal, a complication the concept
  resolves, a consequence; the same scenario returns in the checks. Stories are remembered and understood
  better than exposition, for novices especially.
- **Simple, warm, social visuals help a little and consistently:** pleasant colour, friendly faces, 2D
  characters who look at and point to the content. Simple beats realistic. A presenter on screen raises
  motivation more than learning, and should step out of dense explanation.
- **Animate change, hold still for structure.** Animation beats static pictures modestly overall and a lot
  for procedures. Draw each thing as it is named.
- **One cue at a time, timed to the word.** Cueing works less in video than on the page (motion already pulls
  the eye), and stacking cues can backfire.
- **Energy and load at different moments.** Music, comedy and big transitions at openings and boundaries;
  explanations calm and single-stream. Music is not simply harmful (a small positive effect overall); the
  cost is music under dense narration.
- **Voice:** modern TTS teaches as well as a human voice; AI presenters produce the same test scores but are
  enjoyed less. Warm, conversational, short sentences, about 130 to 160 words per minute (estimate).
- **Segment by idea; split rather than compress.** Shorter videos are watched more fully (observational), but
  shorter does not teach better for the same content. 3 to 8 minutes from 60 to 120 s idea segments
  (estimate). A meaningful visual change every 5 to 15 s with 2 to 4 s holds after key reveals (estimate), while
  a frame is building; a finished, dense frame may rest 7 to 24 s (section 3; D-112 made this conditional).
- **Heavy short-form use correlates with weaker attention control** (correlational). A good reason to be
  interesting, not a reason to cut like a feed: fast cutting within an idea fragments it.
- **Distrust polish.** Beautiful, fluent videos feel more instructive than they are. Judge a lesson by what
  learners can do later (delayed checks), not by completion or likes; keep the strongest treatment for one
  key idea per segment so it stays distinctive.

**Where catchy and learns-well pull together:** the hook is the lesson's first question; the surprise is a
misconception breaking; the plot turns on the concept; motion shows the real process; the character points
at the content; music marks structure. **Where they pull apart:** fun facts beside the point, fast cuts
within an idea, many streams at once (captions, labels, effects, music, fast talk), music under dense
narration, polish that inflates confidence. Let engagement devices double as learning devices.

## 9. What reference channels actually do (studied from their frames; references, not rules)
Measured and watched, not guessed. Side by side: `docs/research/2026-10-01-channels-compared.md`; per channel
under `docs/research/crayon/`, `cleo/`, `lucas/`, `teded/`, `kurz/`. Three registers first, then two more
channels; all are kept as options for the person to choose.

**Story cartoon (Crayon Capital, seven videos):**
- **A person, not a topic.** Even a financial crisis is told through labelled characters deciding things.
- **Open on the paradox or the result, then rewind;** and **bring the opening image back at the end.** The
  bookend was the most repeated device across all seven.
- **The number lives on an object** (a ledger, contract, flip calendar, price tag, podium), rarely on a
  floating chart.
- **Dialogue carries the mechanism:** short exchanges, often a split-screen phone call with nameplates.
- **A black card with one short line** marks each turn; 2 or 3 chapter cards mark the acts.
- **Pace (measured):** a new shot every 3 to 6 s after a hotter first minute, something moving in 85 to 92%
  of seconds, no hold longer than about 5 to 7 s (that channel's habit, not a cap), narration near 150 wpm.
  That is entertainment pace; a procedure lesson usually wants fewer new things per beat, and the reading
  floor still governs text.
- Dramatised dialogue stays inside hypothetical framing unless the source documents it.

**Presenter documentary (Cleo Abram, five videos):** a host who is the learner's proxy (visits, asks, tries it
on); a big claim shown with its caveat; the real source on screen with one phrase highlighted; one simple
diagram (a 2x2, a timeline) built in steps and returned to with new information; the physical thing before
the abstract one. Cuts every 1.5 to 2.5 s on footage, but the longest holds (7 to 21 s) are on the diagrams.

**Math or system explainer (Lucas's Lab, two videos):** one board changed by small additions for 20 to 50 s;
a running symbol reused all video; an everyday analogy (a switch, doors) before the formal picture; real
hardware between boards. Motion in only about half the seconds, under dense narration.

**Across all three:** the frame rests where the learner has to read; every channel returns to something (the
opening image, a diagram, a symbol); none uses its fastest pace for its hardest content.

**Two more, studied later** (`docs/research/teded/`, `docs/research/kurz/`):
- **TED-Ed (seven lessons, seven studios).**
  - A fixed shell (a short quote card, credits) around a look chosen from the subject's own material:
    stone for Plato, parchment for castles, gouache for fungi, neon for data centres.
  - A term card for each new word.
  - A mechanism personified literally (attention as a tiny scientist with a flashlight inside a brain).
  - One object transformed in place.
  - The calmest pace measured: about 130 wpm, 5 to 7 minutes.
  - The 96-film study behind sections 1 to 6: `docs/research/vision/2026-10-05-tedEd-full-conclusions.md`.
- **Kurzgesagt (newer videos).**
  - Pill labels on things.
  - A running comparison pair that returns with one new number.
  - The same figure in a new setting with the threat swapped (a predator, then an email).
  - A chart redrawn changed.
  - Simulated interfaces for choices.
  - Full frames through saturated colour and glow rather than line.
  - Entertainment pace: about 155 wpm, motion in 92 to 99% of seconds.

Both keep the five-channel pattern: rests on what must be read, and a return at the end.

## Options, not overwrites
When a beat could be made two ways (an illustrated face or an acting character; a flat diagram or a depth
stage), keep both: choose one by the person's answer, and record the other as an alternative they can
switch to after seeing the frames. A newer treatment never deletes the earlier one.

## Questions worth asking (references, not requirements)
- Is there one picture that makes the idea easier to hold, or is a plain scenario clearer? Either is fine.
- Does each story role serve a learning goal, and which beat lands the idea?
- Would a wider or closer shot help the learner see where they are, or what matters?
- Which 3 to 5 devices does the lesson return to, and which beats rest on a finished frame?
- Where would depth, light or a surprise make a moment stick? Is the surprise a misconception breaking?
- Where does the learner get a job (predict, notice, choose, recall), and how often?
- Are characters framed as illustrative, with nothing invented about them?
- What did the person say they want, and have they seen the frames?
- Having watched the animatic, what would you change?

## In the Loom engine (Video-Engine folder)
Fields: `story {metaphor, setting, arc, cast[{name, rig, role}]}` and per scene `shot.size`, `depth`,
`light`, `story_role` in `plan/storyboard.json` (docs/STORYBOARD_GUIDE.md). The storyboard gate offers
suggestions for every kind of video, never blocks, and names the form of story that usually fits the genre
(`loom/story.py`, `packs/genres/*.md`); `story.dial: "off"`, or a brief `look.story` of "plain", switches
them off. `py -m loom animatic <id>` draws the panels and a timed MP4 into `qa/`. Builders:
`ctx.character` (runtime/rig.js), `ctx.depth` (runtime/depth.js, with `clip` for a stage seen through a
window), `ctx.iso` (runtime/iso.js), `kind: three` and `kind: skia` clips, the `hero.character_moment`
blueprint (illustrated faces), style packs `cinematic-noir` and `cinematic-dawn`. A worked example: `projects/_ss_story` (Maya as a running character in b02, b11, b22,
with the original illustrated busts kept as alternatives). Options: `py -m loom options <id>`, and
`py -m loom switch <id> <beat> "<name>"`; the storyboard fields are `option` and `alternatives`.
D-112 fields: storyboard `devices`, `value_script`; per scene `accent_on`, `intent` (`rest`, `process_hold`,
`punctuation`, `callback`, `ghost`, `diegetic_text`), `join_in.overlap: "ghost"`; packs `look_family`,
`tone_reference`, `pace.rest_max_s`, `pace.sparse_edges`. The gates read them (D-112): the film and hold checks honour the
intents, the storyboard gate warns when devices, a value script or `accent_on` are missing, and the tone checks warn.
