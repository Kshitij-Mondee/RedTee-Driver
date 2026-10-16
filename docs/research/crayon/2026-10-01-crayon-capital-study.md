# Crayon Capital: what seven videos actually do (study, 2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. Read with `docs/research/2026-09-30-reference-channels.md`
(what we knew from captions and oEmbed) and `docs/research/2026-10-01-attention-learning-recall.md` (evidence).

**What this is.** Seven Crayon Capital videos, supplied by the requester as local files for private study
(`C:\Users\Admin\Documents\Crayon Capital`). Each one was measured by `tools/video_study.py` (cuts, motion,
holds, audio gaps, palette, a contact sheet every 10 s) and transcribed by `tools/transcribe_videos.py`, then
the contact sheets were looked at in order. Every observation below points to a time in the video or to a
measured number. The notes paraphrase; no narration, frame or transcript is republished. Transcripts, sheets
and study JSON stay in the gitignored cache (`cache/research/crayon/`).

**How far to trust it.**
- Transcripts are **rough**: pocketsphinx (no punctuation), because the whisper model could not be downloaded
  in the sandbox (Hugging Face returns 403). Good for speech rate and pauses; not for quotes or sentence
  length. Speech rate reads about 10% high against the known pace of the channel (sphinx splits words), so
  the rates below are given as measured and as corrected. For accurate text, run on your own machine:
  `py tools/transcribe_videos.py "<folder>" --out cache/research/<channel> --engine whisper`.
- Cuts come from a detector at 5 fps that needs both the colour mix and a visible share of pixels to change.
  The first version used the colour mix alone; checked against the frames at 8 random cuts in the NVIDIA
  video, 7 were real and 1 (404.8 s, a torch scene brightening) was a lighting change on a flat area
  (colour-mix change 0.57, pixels changed 0.0; the real cuts changed 77% to 100% of pixels). The detector
  was fixed, a synthetic test with a slow fade now proves the fade is not counted, and the numbers below
  are from the fixed detector (NVIDIA went from 15.7 to 14.0 cuts a minute; the others moved by 0.2 to 0.9).
- The palette "field" reads black or white for most videos. That is an artefact: black narration cards and
  white cards and characters cover more area than any one background, so the field colour says little about
  the illustrated scenes. The accents are the useful part.
- Contact sheets sample one frame every 10 s. Anything shorter can be missed.

| file | length | video (identified by content) |
|---|---|---|
| `videoplayback.mp4` | 14:30 | NVIDIA explained simply |
| `videoplayback (1).mp4` | 20:16 | Rockefeller |
| `videoplayback (2).mp4` | 20:13 | How Jeff Bezos built Amazon |
| `videoplayback (3).mp4` | 13:26 | The 2008 financial crisis |
| `videoplayback (4).mp4` | 16:29 | The Great Depression |
| `videoplayback (5).mp4` | 16:33 | The Wolf of Wall Street story |
| `videoplayback (6).mp4` | 16:40 | How BYD beat Tesla |

## Measured craft numbers

| video | cuts/min (whole) | cuts in first min | median shot s (p25-p75) | seconds with motion | holds >= 2 s (total s) | longest hold outside end card | speech wpm measured (about -10%) |
|---|---|---|---|---|---|---|---|
| NVIDIA | 14.0 | 19 | 4.0 (2.0-6.0) | 92% | 15 (40) | 5 s | 167 (150) |
| Rockefeller | 16.0 | 18 | 3.2 (2.4-4.4) | 89% | 34 (84) | 3 s | 167 (150) |
| Bezos | 11.4 | 19 | 4.8 (2.2-7.0) | 92% | 22 (60) | 4 s | 167 (150) |
| 2008 crisis | 9.2 | 11 | 4.0 (2.4-7.0) | 49% | 102 (318) | 8 s | 158 (142) |
| Great Depression | 10.4 | 15 | 5.0 (2.6-8.2) | 85% | 36 (91) | 5 s | 160 (144) |
| Wolf of Wall St | 9.4 | 10 | 5.7 (3.4-8.6) | 89% | 25 (68) | 7 s | 164 (148) |
| BYD vs Tesla | 17.0 | 27 | 2.6 (1.0-5.0) | 89% | 29 (80) | 5 s | 167 (150) |

What the numbers say, read together with the frames:
- **The picture is almost never still.** In six of seven videos something moves in 85-92% of seconds, and
  apart from the end cards no hold lasts longer than about 5-7 s. Motion is small (a blink, a head turn, a
  prop sliding in), not constant camera movement. The one exception is the 2008 video (49% motion, 102 holds),
  which is also the one drawn in an older, simpler doodle style; the richer illustrated videos move more.
- **Openings run hotter than the middle.** The first minute has more cuts than the middle minutes in 6 of 7
  (BYD: 27 in the first minute against 17 a minute after; Bezos 19 against 11; Wolf of Wall Street is level).
  The pace then settles to a new shot every 3 to 6 s (median) for the rest of the video.
- **Narration is fast and dense.** About 150 words a minute, with 83-122 pauses longer than 0.6 s per video
  but only 3-6 longer than 1.5 s. The breathing room comes from the black narration cards, not from silence.
- **Audio is almost continuous.** 10-23 quiet gaps of 1 s or more per video; music and effects run under
  everything.

## Per-video notes

### NVIDIA (14:30)
- **Cold open (0:00-0:30):** starts inside a diner booth with a burger and coffee, then jumps straight to a
  scene where a large loss has just been admitted, then a spotlight portrait of the founder over a rising
  line. Place, stakes and the person in 30 seconds, before any explanation.
- **Backstory as quick scenes (0:35-1:25):** immigration, a rough boarding school, study at night, a
  university. Each life stage is one shot of 5-10 s with a place sign doing the exposition.
- **The founding scene returns (1:35-2:05):** back to the diner booth with the co-founders, the idea spoken
  as italic dialogue captions, the checkerboard floor and the company name on a napkin. The opening image is
  paid off within two minutes.
- **The near-failure (2:25-3:55):** a rival standard is published; a big contract; a black card turns the
  story; the partner's CEO is shown with a nameplate so the viewer knows who is speaking; he asks for the money
  to be kept as an investment instead. Business mechanics are shown as people deciding things in rooms.
- **Integrated sponsor (about 4:15-5:15):** the channel's mascot (glasses, bow tie, brown vest) steps in on a
  phone screen and a quiz screen, drawn in the same style so it does not break the look.
- **Product proof as an object (5:45):** the chip that saved the company appears alone, lit, in dark space.
- **Late turns (12:05-13:15):** a board-room of rival logos, a Washington official with a nameplate, a gauge
  with ticks and crosses for what can and cannot be exported, a chess board with the founder as a piece.
- **Payoff (14:05-14:15):** a three-panel collage of earlier scenes (the diner, the cheque) and a closing quote
  card, then Subscribe. The end recalls the beginning on screen.

### Rockefeller (20:16)
- **Cold open (0:00-0:15):** two men in the dark ordering something destroyed; then a room overflowing with
  money and the man himself at a desk with a nameplate. Conflict first, identity second.
- **Palette as era:** sepia browns and muted greens throughout (accents cluster in browns: #94643C, #745C34,
  #BCA474), so the 19th century reads before any date appears.
- **Character through props (2:35-2:55):** a ledger of tiny daily expenses; a sign saying capital is needed; a
  money case with an interest rate. The personality is shown as objects he keeps.
- **Dates as set dressing (3:15, 3:55):** year numbers painted into the corner of the scene rather than put
  on title cards.
- **Auction as comparison (4:15-4:35):** a bidding room where the paddles carry rising numbers; the escalation
  is shown by the next paddle, not by a chart.
- **Black narration cards** carry the turns (1:15, 3:45, 4:45), in a white italic hand.
- **Payoff (18:45-19:55):** a list of enemies crossed out; a headstone; the ledger again, now listing what he
  achieved beside what he could not control; a portrait quote card. The ledger from minute 2 closes the video.

### How Jeff Bezos built Amazon (20:13)
- **Cold open (0:05-0:25):** a clock face over money with a per-minute earnings figure, then a phone showing a
  shop screen. A single striking number is the hook.
- **Childhood to graduation (0:35-1:45):** hospital birth record, school praise, a graduation speech where the
  dream of space is said out loud, a lecture hall.
- **Office life (2:05-3:35):** bank tower, a meditation room of grey figures, a trading firm, a report showing
  a growth rate, a spreadsheet of business ideas, a white text card, the colleague who is not convinced.
- **Chapter card (5:25):** a black title card names the next act.
- **Early company (6:05-7:55):** a garage-style office, a year on a sky card, a board meeting with a skeptic's
  speech bubble, a product catalogue spreading out.
- **The crash (9:05-10:25):** a city under a glass dome, a falling chart, a balloon labelled with the company's
  slogan drifting into storm clouds, scissors cutting a chart, a black card naming the crisis.
- **Rebuild (10:35-11:55):** warehouses, a map with pins in three states, conveyor belts, a castle-like
  warehouse, a customer who loves the service, a radar sweep of members.
- **Payoff (19:35-19:55):** the graduation hall from minute 1 returns, and the rocket leaves Earth. The dream
  stated at the start is the last picture.

### The 2008 financial crisis (13:26)
- **An older, different look.** Grey doodle background (field #D4D4D4), pastel characters with thin lines,
  captions in a plain rounded sans instead of the italic hand. This is the least animated of the seven (49% of
  seconds with motion, 318 s of holds). It reads as an earlier stage of the same channel.
- **Cold open (0:05-0:35):** a newspaper headline about a global shock, a blue street of people collapsing,
  a bar where a character labelled Wall Street sits beside a character wearing the national flag.
- **Abstractions as characters with labels:** Wall Street and Main Street are people with the name on their
  shirts; the subprime mortgage is a little devil holding a debt note (3:55); a CDO is a potion bottle (4:55);
  "totally safe" is a rock with a label (4:05).
- **Plain explanation as a diagram (1:15):** the dotted outline of a house around a small figure explains what
  was being bought.
- **Slogan card (3:35):** a black card with a four-word rhythm that sums up the flipping behaviour.
- **Payoff (12:05-12:55):** a foreclosure, a protest camp, a character floating down on a golden parachute, two
  people thinking the unfairness out loud; then a small hand-drawn chart and black end frames.

### The Great Depression (16:29)
- **Cold open (0:05-0:25):** money being sucked into a tornado; then the mascot; then a city skyline and the
  jazz-age street. The disaster is shown before the good times.
- **Good times as objects (0:35-1:25):** toaster, vacuum, fridge; a car production line; oil, steel, tyres;
  a radio. The boom is a list of things you could buy.
- **Mechanism explained with small visual jokes:** credit cards stuck on a radio and a car (2:05); a sign in a
  stock office; a line chart with a character's self-esteem riding it (3:15); nesting dolls for layered risk
  (3:25).
- **Chapter card (4:05):** a black title card names the crash as the next act, then a front page, a phone, a
  vault.
- **Crowd scenes carry the mood (6:15-6:35):** a bank run as a grey crowd with signs and exclamation bubbles.
- **Maps and places (7:05, 10:15):** the globe with the drop in trade written beside it; states on a map for
  the dust bowl.
- **Payoff (12:55-16:15):** the president's speech on a red stage; the programmes as documents and places
  (dam, bank, social security seal, the arts); a famous photograph restaged as a line drawing; the flag; then a
  television announcing the next war. It ends on a door to the next story.

### The Wolf of Wall Street story (16:33)
- **Cold open (0:05-0:15):** a man behind bars, then the same man on a stage in confetti. Two opposite
  pictures of one person; the video is the road between them.
- **Early hustle (0:25-2:05):** a seaside ice stall, a beach lounger with money, a medical school he leaves,
  a door-to-door meat round, a business that collapses into boxes.
- **Firm and crash (2:25-3:05):** a brokerage with a logo; a flip calendar at zero; a line of people all
  wearing a "fired" notice. The market drop is shown as a crowd, not a chart.
- **The pitch as performance (3:25-4:25):** repeated phone-call shots with the caller's words in italic
  captions, a split screen between the caller and the buyer, a notepad counting the sale.
- **Office built as a place (5:15-5:55):** the new firm's lobby, a banner welcoming recruits, the training
  board.
- **Fall (12:15-13:45):** unmarked cars, a torn document, a tape recorder, a chapter card, the office cracking,
  the charge sheet, a line-up.
- **Payoff (15:45-16:05):** the confetti stage from 0:15 returns, now framed by words about success and
  ethics; then the mascot and Subscribe. The opening pair of pictures is resolved.

### How BYD beat Tesla (16:40)
- **Cold open (0:05-0:15):** a huge headquarters seen from above with a label, then a lot of rival cars. The
  scale of the result first.
- **Childhood in a village (0:25-1:25):** a rural province with a place caption, a large family, a scholarship
  letter, a research institute sign with bilingual text.
- **Business mechanics made physical:** a price ladder of currency symbols for three rival makers (2:35); a
  globe with their money (2:55); a three-card strategy board (3:25); a price quotation document comparing
  suppliers (5:15); a revenue bar chart (5:45).
- **Phone calls with nameplates (2:45, 3:05):** two named people in split screen, so a negotiation is easy to
  follow.
- **Integrated sponsor (about 3:55-4:35):** real product screen captures with the mascot, then the story
  resumes.
- **Proof scenes (12:55-13:25):** a safety test where a nail is driven through a battery, a news card of
  sceptics, a flip calendar, an analyst's line.
- **Payoff (15:55-16:25):** annual sales as two podiums (one falling, one rising), a new cheap car beside a
  price tag, a family at a charger, a closing quote card with a king, then the company's own end slate.

## The channel's signature, in one place

These are what the seven have in common. They are descriptions of one channel's choices, not a template.

1. **A person, not a topic.** Every video is a biography of a person or of an era told through people. Even
   the finance crises are told through named characters (Wall Street, Main Street, a banker, a family).
2. **Open on the paradox or the result, then rewind.** Prison and stage; a per-minute fortune; money in a
   tornado; a headquarters from the air. The first 15 seconds show the end state or a contradiction.
3. **Bookends.** The opening image or the dream stated early comes back in the last minute (the diner, the
   ledger, the graduation hall, the confetti stage). The viewer is rewarded for remembering.
4. **Dialogue carries the mechanism.** Business decisions are dramatised as short exchanges in italic
   captions or speech bubbles, often a phone call in split screen with nameplates.
5. **Props are the information.** Ledgers, letters, contracts, news front pages, flip calendars, price
   documents, maps with pins, podiums, auction paddles, a gauge. A number almost always lives on an object in
   the scene rather than on a floating chart.
6. **Black narration cards for turns.** White italic text on black, a word or two appearing at a time, used
   for "but", "until", "and still" moments. 2-3 chapter title cards per video mark the acts.
7. **Era and mood through palette.** Sepia for the 1800s, a grey doodle world for 2008, cooler greys and dark
   blues for the NVIDIA late game; warm oranges for good times, grey crowds for panic.
8. **Visual metaphors, briefly.** A tornado of money, a balloon into a storm, a chess board, nesting dolls, a
   devil holding the debt, a parachute. Each lasts one shot, then the story moves on.
9. **Small constant motion, fast pace.** A new shot every 3 to 6 s after a hotter first minute, something moving
   in almost every second, narration at about 150 wpm under continuous music.
10. **A host mascot** who steps in for asides and the sponsor, then leaves.

## What transfers to workplace learning (judgement, not rules)

- **Frame a process as a person's decision.** "The analyst had one day to decide whether to approve the
  refund" teaches a policy better than a list of the policy's clauses, and it is how this channel makes dry
  mechanics followable. In Loom: a running character (`story.cast`) and a `story_role` per scene.
- **Put the number on an object.** A figure on a contract, a ledger line or a flip calendar is read as part
  of the story; a floating chart is read as a slide. Loom already has props and iso tiles; the storyboard can
  ask for "the number lives on" in the scene's visual note.
- **Pay off the opening.** A cold open that returns at the end is cheap to plan and is the single most
  repeated device here. `loom animatic` makes it visible whether the last scene answers the first.
- **Use the black card as punctuation.** One short line on the brand's dark ground between acts. It gives the
  eye a rest in a fast edit and makes the turn audible.
- **Keep the frame alive, gently.** Blinks, a prop sliding in, a head turn. The reading floor still applies:
  a sentence on screen must stay long enough to read. Crayon holds text for about as long as it takes to
  speak it, not less.
- **Where not to copy.** Entertainment pace (a new shot every 3 s, 150 wpm) is faster than most workplace
  learners can process new procedures at; the evidence on segmenting and signalling still governs how much
  new material a beat carries. Dramatised dialogue must stay inside hypothetical framing unless the source
  documents it. Caricatures of real people are not appropriate for internal training.

## What Loom would need to make this kind of video

Described here as needs, ranked by how often the device appears. See `docs/styles/WALLS_AND_NEEDS.md` for the
current walls.
- A **simple character cast** that can sit at a desk, talk on a phone and stand in a crowd (the rig covers
  standing, walking, gestures and lip sync; sitting poses and crowds of simplified figures are the gap).
- **Speech and caption bubbles in a hand style** tied to word timings (captions exist; an italic hand font and
  bubble shapes are a style-pack choice).
- **Prop kit:** document, ledger, newspaper front, flip calendar, nameplate, price tag, podium, map pin. Many
  can be built from existing kit primitives; a small named library would make them one line each.
- **Split-screen call** as a layout (two framed rooms with nameplates).
- **Black narration card** as a join type (typed words on the dark ground between scenes).
- **Bookend check** in `loom animatic`: flag when the first scene's image never returns.
