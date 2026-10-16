# How the reference channels look, measured, and what Loom changed because of it (2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. Builds on the per-channel studies
(`docs/research/crayon/`, `cleo/`, `lucas/`) and `docs/research/2026-10-01-channels-compared.md`. TED-Ed is next
(the requester is supplying the files); this doc gets a TED-Ed section then.

**Method.**
- **Measured:** every frame every 5 or 6 s of 14 videos by `tools/style_fingerprint.py` (new). It measures the
  same things on a Loom render: how much of the frame is drawn on, outlines, flat versus soft areas, grain,
  palette size, saturation and lightness.
- **Looked at:** each frame at full size, in specimen sheets per channel.
- **Read with the words:** 25 windows of 60 to 90 s, as word-aligned strips (`tools/explain_study.py strip`),
  to see what is on screen while each idea is said.
- **Limits:**
  - The study copies are 640 x 360, so fine line weights are approximate.
  - Grain includes compression noise, so it reads high for video and low for Loom's lossless frames.
  - The Loom lesson numbers come from each lesson's check frames: 7 to 92 per lesson, against 108 to 303
    per reference video.

## 1. What each channel's pictures are made of

| | Crayon Capital (story cartoon) | Cleo Abram (presenter documentary) | Lucas's Lab (math on a board) |
|---|---|---|---|
| **Line** | One dark outline round everything, even weight, round caps; limbs are single strokes | Little outline; flat vector shapes or real footage | Chalk-thin white strokes; glowing tinted borders on boxes |
| **Fill** | Flat, muted, desaturated; one crisp cel shade per volume (half a face, the side of a book) | Saturated brand blue or calm sage pages; 3D renders (low-poly, layered stacks); photos | Near-black field; teal glass sphere; coloured symbols |
| **Light** | A lamp glow, a spotlight cone, a vignette; colour shifts for mood (sepia era, grey crowd) | Soft gradients and real light from footage | A soft violet gradient on section cards; a faint dot grid and chalk grain |
| **People** | Big round heads, bean bodies, stick limbs, dot eyes; background people are grey silhouettes | The real host, real guests; one flat animated figure for a physical explanation | Almost none; a portrait card for a named scientist |
| **Type** | Hand-lettered signs on props; italic hand captions for dialogue; white italic on black for turns | Bold geometric sans; tight lime pills with a pointer; highlighted lines in real documents | Serif for symbols (kets), bold sans caps for names |
| **Frame** | A full set every shot (room, street, stage); text lives on objects in the set | The diagram is the whole frame, or the footage is | One board, built up; lots of black on purpose |

## 2. The numbers (medians over frames)

| source | drawn | covered | outline | soft | colours | sat | light |
|---|---|---|---|---|---|---|---|
| Crayon, six newer videos | 0.40 to 0.50 | 0.66 to 0.76 | 0.031 to 0.047 | 0.085 to 0.103 | 17 to 29 | 0.19 to 0.25 | 70 to 134 |
| Crayon, older 2008 video | 0.24 | 0.28 | 0.028 | 0.037 | 5 | 0.06 | 213 |
| Cleo Abram, five videos | 0.30 to 0.46 | 0.80 to 0.88 | 0.007 to 0.020 | 0.29 to 0.35 | 45 to 75 | 0.18 to 0.38 | 58 to 105 |
| Lucas's Lab, two videos | 0.11 to 0.16 | 0.09 to 0.30 | 0.010 to 0.017 | 0.05 to 0.06 | 1 to 4 | 0.31 to 0.36 | 3 to 13 |
| **Loom lessons before** (flat-cosmos, engineering, line-art, whiteboard, corporate-clean) | **0.13 to 0.28** | **0.06 to 0.60** | 0.014 to 0.022 | 0.02 to 0.15 | **1 to 6** | 0.02 to 0.63 | 37 to 251 |

The metrics:
- **drawn** is the share of 16 px blocks with a strong edge.
- **covered** is the share of the frame not in its single most common colour.
- **soft** is the share of pixels in gentle gradients.

The full table was in the sandbox's `cache/research/fingerprint/all.json`, which was lost with that sandbox
(L-123). To rebuild it on the PC, run `py tools/style_fingerprint.py <the video folders' mp4s> --every 5 --json
cache/research/fingerprint/all.json`. The ranges above are the record.

What the numbers say:
- **Loom frames were the emptiest of the five sources.** The light-style lessons put small cards on a big plain
  page: 71 to 100% of their frames are one colour over 85% of the picture, and only 6 to 11% of the frame is
  covered. Crayon draws on 40 to 50% of the blocks; Loom drew on 13 to 28%.
  - flat-cosmos reads 0.60 covered only because its nebula background varies in colour; its drawn score
    (0.13) is the lowest of all.
- **Loom used far fewer colours** (1 to 6 cover 90% of a frame) than the cartoon (17 to 29) or the documentary
  (45 to 75). Palette discipline is right, but a whole frame in one or two colours reads as a slide.
- **Loom has almost no soft light** (0.02 to 0.06 in four of the five lessons) against Crayon's glows (about 0.09) and Cleo's photography and
  3D (about 0.32).
- **Lucas's Lab is the one register where emptiness is correct:** a near-black board with thin strokes (drawn
  0.11 to 0.16). Loom's dark styles already sit there.

## 3. How a concept becomes a picture (seen in the strips)

These are the moves the channels use to explain. Each was seen in a strip; times are in the per-channel notes.

1. **Personify the abstraction, then reveal its nature.** A subprime mortgage drawn as an angel that turns
   into a devil holding the debt note. Its three attributes are written beside it as they are said (2008,
   3:50-4:00).
2. **Label the lie on the object.** A pile of junk gets a "totally safe" sign, then a product-launch card
   ("now with more lies") (2008, 4:02-4:11).
3. **Show the transaction.** Who pays whom: a bank handing money to the rating agency. Then an everyday
   analogy drawn literally: a food critic paid only if they praise raw chicken (2008, 4:29-4:38).
4. **Write the number on the furniture.** "$100 to only $10" painted on the broker's desk (Great Depression,
   2:27); a price ladder of currency symbols with arrows (BYD, 2:36).
5. **Cut from the story scene to a plain white pictogram for the mechanism, then back.** Robots on a conveyor
   against people at a table with hand tools; then flags with figures; then a strategy board of five icon cards
   built one by one (BYD, 3:12-3:27).
6. **One figure, one hazard at a time, one overlay each.** The same suited figure carries each hazard in turn:
   - a dashed outline with arrows for pressure;
   - an x-ray cutaway for the lungs;
   - a warning badge for the brain;
   - red and blue temperature tags on opposite sides;
   - a green radiation band.

   The figure grows (a closer shot) when the hazard is inside the body (spacesuit, 3:50-5:00).
7. **Physical model, then diagram, then the diagram used to ask.** Lego boards on the table become a 2x2 that
   fills cell by cell. Its cells show the mechanism moving (a dot splitting or merging), and the last cell is
   left as the open question (fusion, 4:00-4:42).
8. **Everyday thing, then the formal picture.** A real light switch, then a switch symbol, then a full-screen
   sentence, then three doors (open, between, closed), then a measurement box splitting the spin. Only then the
   Bloch sphere (qubit, 2:20-3:17).
9. **Grey for everyone else.** Crowds, bystanders and earlier cells go grey or dim, so the one thing being
   discussed is the only saturated thing.

## 4. How they emphasise, and why

| device | what it marks | why it works |
|---|---|---|
| The word on screen as it is said (written on a prop, a pill, a card) | the term the learner must keep | two channels for one idea, at the same moment |
| Saturated against grey: one cell lit, the rest calm | the thing being discussed now | attention goes to the one difference |
| A black card with one line | a turn (but, until, and still) | the eye rests and the ear hears the pivot |
| A closer shot of the same figure | something inside, or something that matters more | scale says importance without a word |
| Contrast in one image (gold LOAN with a skull sign; angel and devil) | a hidden risk | the contradiction is the point |
| Real document with a highlighted line | the claim is sourced | credibility is shown, not asserted |
| The opening image returning | the payoff | recall of the start, now changed |

## 5. What changed in Loom because of this

| change | where | what it does |
|---|---|---|
| `toon` shading | `runtime/kit.js` | flat fill, one crisp cel shade, a dark outline round every rect, disc and polygon (the outlined-cartoon register) |
| Outlined people | `runtime/rigs/beans.js` | `pip`, `tess` (big head, bean body, stick limbs, dot eyes, outline) and `extra` (a grey faceless figure for crowds). Same poses, gestures and walk as `ava` and `sam` |
| Scenery | `runtime/scenery.js` | sets that fill the frame: `ctx.scenery("room" / "stage" / "street")`, `desk`, `sign` (the number on a prop), `ctx.crowd`, `ctx.narrationCard` (the black turn card) |
| Three style packs | `packs/styles/` | `story-cartoon` (warm paper, toon, hand-lettered signs, black turn cards), `presenter-pop` (pale sage pages, cobalt and orange, lime pointer pills, bold sans), `chalk-lab` (near-black board, dot grid, thin strokes, serif symbol labels) |
| Three lab scenes | `scenes_examples/lab/` | `lab_story_set`, `lab_matrix_build`, `lab_one_board`: one per register, renderable in any style |
| `loom lab --frames` | `loom/lab.py`, `loom/cli.py` | keeps full-size frames so a render can be fingerprinted |
| Measuring tool | `tools/style_fingerprint.py` | the numbers above, for references and Loom alike |

No existing pack, template or lesson changed its look. The new shading, rigs and scenery are opt-in (D-70:
options, not overwrites).

## 6. Did it move the numbers (lab frames, six each)

| render | drawn | covered | outline | colours | sat |
|---|---|---|---|---|---|
| Story set, story-cartoon | 0.31 | 0.48 | 0.030 | 11 | 0.19 |
| Story set, corporate-clean (same scene, an existing style) | 0.22 | 0.50 | 0.017 | 5 | 0.27 |
| 2x2 build, presenter-pop | 0.19 | 0.52 | 0.002 | 3 | 0.22 |
| One board, chalk-lab | 0.16 | 0.13 | 0.039 | 2 | 0.27 |
| Loom lessons before | 0.13 to 0.28 | 0.06 to 0.60 | 0.014 to 0.022 | 1 to 6 | |
| Crayon (newer) / Cleo / Lucas | 0.40 to 0.50 / 0.30 to 0.46 / 0.11 to 0.16 | 0.66 to 0.76 / 0.80 to 0.88 / 0.09 to 0.30 | 0.031 to 0.047 / 0.007 to 0.020 / 0.010 to 0.017 | 17 to 29 / 45 to 75 / 1 to 4 | |

What the numbers show:
- **The outline now sits inside Crayon's range** (0.030 against 0.031 to 0.047).
- **Coverage and colour count moved in the right direction** from the old lessons, but not all the way.
- **chalk-lab lands where Lucas's Lab is** (drawn 0.16 against 0.11 to 0.16).

**Not closed yet:**
- **Detail:** Crayon's sets carry more props and texture, so their drawn score is about 0.45 against our 0.31.
- **Soft light:** about 0.04 against Crayon's 0.09 and Cleo's 0.32.
- **Colour richness:** 11 colours against 17 to 29.

Possible next steps:
- A prop library: ledgers, phones, nameplates, price tags, documents, charts on walls.
- A lamp-glow and spotlight helper.
- Era and mood palette variants for story-cartoon.

These are numbers on six lab frames each; a real lesson in each style is the honest test, and is not built yet.

## 7. For the people choosing a look
- **story-cartoon:** cases, scenarios and "how it happened" stories, with people deciding things in places.
- **presenter-pop:** explainers built on one diagram that builds and returns, and a source shown on screen.
- **chalk-lab:** mechanisms and models, a board changed by additions.

Any of them can borrow a move from the others: a white pictogram insert in a cartoon, or a cartoon figure on a
board. Taste stays the requester's (D-70).
