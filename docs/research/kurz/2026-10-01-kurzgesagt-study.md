# Kurzgesagt (In a Nutshell): what seven videos actually do (study, 2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule.

**Source and method.** The videos are the requester's own files
(`C:\Users\Admin\Documents\Kurzgesagt-In a Nutshell`), studied privately. Notes paraphrase and nothing is
republished. The method and tools are the same as the TED-Ed study
(`docs/research/teded/2026-10-01-teded-study.md`), with the same rough pocketsphinx transcripts. Cache
(gitignored): `cache/research/kurz/`.

**Instrument check (Rule 0).** The cut detector was checked by hand on 8 random cuts in the stress video:
- 5 were hard cuts.
- 2 were designed panel wipes (diagonal strips sliding in, each strip a small scene).
- 1 was a background colour change inside one shot.

Rates are upper bounds on visual events, not edit counts.

**Two eras.** Two of the seven are clearly the channel's older style: flat circles on near-black, few colours
and small labels. They are reported separately, because the look changed a lot.

| file | length | video (identified by content) | era |
|---|---|---|---|
| `videoplayback.mp4` | 14:52 | Designing the best possible planet ("Hestia") | newer |
| `videoplayback (1).mp4` | 11:58 | Stress: what it is for, and how to use it | newer |
| `videoplayback (2).mp4` | 14:12 | Scales of civilisation (Kardashev, Barrow) | newer |
| `videoplayback (3).mp4` | 15:14 | A scientist who treated her own cancer with viruses | newer |
| `videoplayback (4).mp4` | 7:25 | Neutron stars, nuclear pasta and magnetars | newer |
| `videoplayback (5).mp4` | 5:56 | Black holes | older |
| `videoplayback (6).mp4` | 6:16 | How the universe could end | older |

## Measured craft numbers

| video | visual events a minute (upper bound) | in first minute | median shot s (p25-p75) | seconds with motion | holds >= 2 s (total s) | longest hold, what is on screen | speech wpm measured (about -10%) | pauses > 1.5 s |
|---|---|---|---|---|---|---|---|---|
| Best planet | 12.4 | 17 | 3.2 (1.0-6.4) | 92% | 15 (42) | 6 s, two labelled panels, Earth against Hestia | 174 (156) | 4 |
| Stress | 16.4 | 16 | 3.0 (0.8-5.2) | 99% | 2 (4) | 2 s, a face with three labelled immune cells | 175 (158) | 1 |
| Civilisation scales | 13.7 | 10 | 3.0 (0.2-6.0) | 98% | 3 (6) | 2 s, the planet | 174 (156) | 1 |
| Viruses for cancer | 10.1 | 16 | 4.2 (1.7-8.8) | 94% | 10 (28) | 4 s, Week 1 against Week 9, "63% smaller" | 180 (162) | 2 |
| Neutron stars | 9.8 | 8 | 2.0 (0.2-7.9) | 95% | 5 (10) | 2 s, a labelled cut-away and an atom | 169 (152) | 3 |
| Black holes (older) | 6.6 | 7 | 3.7 (0.2-10.1) | 78% | 20 (60) | 7 s, an empty starfield | 194 (174) | 1 |
| End of universe (older) | 2.7 | 3 | 8.3 (0.2-24.1) | 69% | 13 (103) | 29 s, a near-empty dark field (and the end card) | 157 (141) | 2 |

What the numbers say, with the frames (`_holds.jpg`, sheets):
- **Newer videos almost never stop.** Something moves in 92 to 99% of seconds, and the holds add up to 4 to 42 s
  across 7 to 15 minutes. The few rests are on labelled comparisons: two panels side by side, a before/after
  split with a percentage, a row of three stars with pill labels and bars.
- **The fastest narration of the five channels studied:** about 150 to 160 wpm after correction, dense with
  turns and questions. There are 2.0 to 3.9 explanation cues a minute ("but", "why", "imagine", numbers),
  against TED-Ed's 0.9 to 2.3. The transcript is rough, so this is a direction, not a measurement.
- **The older videos rested on emptiness.** "End of the universe" holds for 29 s on a nearly empty dark frame
  while the narration describes nothing left. The emptiness is the content there. The newer videos never do
  this.

## What the look is made of (`tools/style_fingerprint.py`, medians over every 5 s)

| video | drawn | covered | outline | soft | grain | colours | sat | vivid | sparse share |
|---|---|---|---|---|---|---|---|---|---|
| Best planet | 0.33 | 0.79 | 0.011 | 0.20 | 1.00 | 73 | 0.79 | 0.71 | 0.03 |
| Stress | 0.29 | 0.84 | 0.008 | 0.19 | 0.94 | 81 | 0.72 | 0.77 | 0.01 |
| Civilisation scales | 0.28 | 0.75 | 0.012 | 0.17 | 0.83 | 46 | 0.80 | 0.89 | 0.02 |
| Viruses for cancer | 0.30 | 0.84 | 0.009 | 0.13 | 0.72 | 48 | 0.78 | 0.83 | 0.01 |
| Neutron stars | 0.29 | 0.62 | 0.010 | 0.24 | 1.15 | 40 | 0.90 | 0.95 | 0.05 |
| Black holes (older) | 0.26 | 0.29 | 0.021 | 0.07 | 0.98 | 4 | 0.64 | 0.17 | 0.24 |
| End of universe (older) | 0.19 | 0.24 | 0.015 | 0.07 | 0.92 | 3 | 0.36 | 0.03 | 0.33 |

The row labelled "kurz" in `fingerprint.md` is the stress video (see L-130).

- **Dense without many edges.** The newer look reads as full, but its drawn share (0.28 to 0.33) is no higher
  than Loom's best lessons (up to 0.28) and below Crayon (0.40 to 0.50). What makes it full is:
  - coverage (0.62 to 0.84);
  - saturation: vivid 0.71 to 0.95, the highest of all channels studied;
  - 40 to 81 colours;
  - soft glow (0.13 to 0.24).

  In short: flat colour fields with light, not line work.
- **The older look is where Loom's dark styles already are:** covered 0.24 to 0.29, 3 to 4 colours, a quarter
  to a third of frames sparse. The channel moved from that to the dense look over the years.
- **Outline is low throughout** (0.008 to 0.021). Shapes are separated by colour and glow, not ink.

## How the explaining is pictured (seen on the sheets and strips)
1. **Pill labels on the thing.** One or two words in a saturated rounded pill, attached to the object with a
   small pointer: "Red Dwarf", "Adrenaline", "Cortisol", "Macrophage", "Gnocchi Phase". The pill colour
   carries the category. The older videos used small italic tabs the same way.
2. **A running comparison pair.** The planet video keeps returning to two framed panels, Earth and Hestia,
   each time with a new property: radius, gravity in m/s², atmosphere, coastline length, number of species.
   It is the same unit every time, with one new number. Split screens with a single vertical line do the
   same job (Earth's atmosphere against Hestia's; a hot neutron star against the Sun's surface).
3. **The same body, a different threat.** The stress video follows one ancestor through a predator attack,
   with the hormones as glowing icons on a body x-ray and a status bar. Then the same character design, now
   in glasses at an office desk, meets "THE DEADLY EMAIL", lettered like a horror title. The sabre-tooth
   returns later as a shadow over modern scenes. One picture carries "your body cannot tell these apart".
4. **A chart that comes back changed.** Adrenaline and cortisol first appear as a single rise and fall. Later
   the same axes show repeated spikes that never settle, which is chronic stress drawn as the same chart,
   changed.
5. **A list as moving panels, not bullets.** Modern stressors arrive as three diagonal strips sliding in:
   - an alarm clock;
   - keys and a wallet;
   - an inbox showing "6,616" unread;

   then a bill and a traffic jam. Calming activities arrive as horizontal strips in the same way. Each item is
   a small scene with its number on the prop.
6. **Simulated interface as the explaining device.** A cursor clicks "Activate" on a "Magnetic field: update
   required" panel. A "Planetary editor" changes the atmosphere. A depth gauge is dragged. Virus candidates are
   picked from trading cards ("weak and pathetic"). The therapy plan is a week-by-week grid of syringes.
   Choosing is shown as using a tool, which makes the design reasoning visible.
7. **Everyday analogies drawn literally:**
   - nuclear matter in phases named after pasta, each phase drawn as that pasta;
   - all of humanity squeezed into one sugar cube;
   - (older) a coffee cooling from 51 to 20 °C before the heat death of the universe.
8. **A true story through one person.** The cancer video follows one scientist: her diagnosis, her lab, her
   choice, the outcome. The ethics debate around her is shown as social-media comment cards ("So brave!",
   "Not approved by an ethics board!") around her photo. The controversy is pictured as voices, not asserted.
9. **Chapter cards in display type:** "HOW TO USE STRESS AS INTENDED", "BEST POSSIBLE OCEAN", "BEATA'S
   VIRUSES", "MAGNETAR". Each sits on its own frame, styled to the topic.
10. **Honest small print.** "Not to scale" and "Atoms don't look like this" appear in small type where the
    picture simplifies.
11. **Sponsor segments are drawn in the same world,** mid-video and at the end. (Not relevant to L&D except
    as proof that a different message can live inside the same style.)

## For Loom (references; the person chooses)
- **The workplace is already their subject.** The stress video's office (a desk, a headset, sticky notes,
  an unread count, a rejection email on a tablet) is close to corporate L&D. "Same body, different threat"
  is a ready pattern for wellbeing, change and safety lessons. Use it with grounding: a dramatised scene stays
  hypothetical unless the source documents it.
- **Pill labels and the comparison pair** map onto things Loom has:
  - `presenter-pop`'s pointer pills;
  - a two-panel frame;
  - the simulated interaction kit (cursor, tap, typing) for "using the tool".

  Nothing new is needed to use them; a two-panel comparison builder would save scene code if it keeps
  recurring.
- **Dense through colour and light, not line.** That is the cheapest way for a code-drawn engine to stop
  looking empty: full-bleed colour fields, saturated accents and the existing glow and fx layer. It is a
  direction for `flat-cosmos` (whose frames measured drawn 0.13 and covered 0.60). It is not changed here,
  because a change to an existing pack is the requester's call (D-70).
- **Pace is entertainment pace.** 99% of seconds moving and about 155 wpm suit a viewer who chose to watch.
  A procedure lesson needs the reading floor and rests on what must be read; the comparison-pair rests are
  the part to borrow.

## The animation itself: 10-second moments at 0.5 s (added later the same day)

The contact sheets above sample every 10 s, so they can step over the best animation. The windows were picked
by rule rather than by eye: the 10 s spans with the most motion and at most one cut, outside the last 40 s.
Eight were picked by a first ad-hoc script. A ninth (Neutron stars, 5:08) is the top pick of the same rule
built into a tool, `py tools/explain_study.py moments <name.study.json>` (L-134). That tool steps every
second, so it can choose windows near, not identical to, the first eight. Strips are in
`cache/research/kurz/motion/`.

| moment | what moves, and how |
|---|---|
| Best planet, 11:13 (reef) | **A slow push through the scene.** The camera moves forward through six or more depth layers. One creature passes close to the lens; it is sharp and the reef behind it goes soft (a rack focus). Light shafts come from above. Dozens of small fish each move on their own path while plants sway. The shot ends by pushing into a foreground kelp layer, which wipes to the next shot. |
| Stress, 2:39 (inside the body) | **One state change per word.** The x-ray figure idles with a breath-like bob while cyan energy flickers on its limbs. A status panel slides up, and its icons go dark one at a time as each suppressed function is named (digestion, immune defence, sleep). Then a hard cut to the ancestor on a jagged radial starburst, with electric crackle looping around him. |
| Stress, 6:55 (the modern office worker) | **Game-style stats, then a vortex.** Electric crackle loops around the figure, and a "WISDOM -30" stat pill pops out on a leader line from his head. Then a top-down vortex: concentric jagged rings turn while the temptations (phone, burger, bottle, ashtray) orbit him and drift inward. Being pulled in is drawn as orbit motion. |
| Stress, 9:53 | **Copies, then the one who calms down.** Several copies of the same man stand in a row, the back ones darker, which reads as time or repetition. A green glow bubble with sparkles forms around one, whose face relaxes. Then a cut to a big close-up on a starburst: eyes squeezed shut, a mouth-shape change, a cartoon anger mark and a sweat drop. |
| Civilisation, 1:09 | **Time shown as a camera move.** One continuous isometric pan across a settlement that changes era as the camera travels: palisade village, then medieval town, then modern town. Hundreds of tiny people, animals and carts move within it. |
| Civilisation, 10:55 | **Rising through a glowing field.** Glowing shards drift upward in parallax layers (outline plus inner glow); a figure floats up through them. The field thins to empty space and ends on light rays. |
| Neutron stars, 4:05 | **A "you are here" gauge beside a continuous descent.** A narrow panel on the left holds a column of dots with a marker sliding down it. On the right, the camera descends while particles pack tighter and merge into blobby shapes (a metaball-like morph). A pill label appears at the moment the phase is named. |
| Neutron stars, 5:08 | **One volume, one gloss.** Glossy spheres (a base colour, a darker inner band, one white highlight shape each) cut to a continuous rise through the phases in reverse: a packed nucleon slab, strands, then separate blobs. Texture density, not line work, carries the detail. |
| Viruses for cancer, 2:45 | **A slow pull-back over moving cells.** The camera pulls back to reveal a cluster of tumour cells inside healthy tissue. Every cell wobbles gently and one divides. Later a macrophage crawls in from the edge. |

What this adds to the study:
- **Something is always alive, but only one thing changes the meaning.** Idle motion (bobbing, wobbling,
  swaying, particles drifting) runs everywhere. The change that carries the point (an icon going dark, a
  label, a stat) lands on the narrated word. Background life is cheap and constant; the point is single and
  timed.
- **Continuous camera moves replace cuts inside an idea:** a push through layers, an isometric pan through
  time, a descent beside a gauge, a pull-back reveal. Cuts come at idea boundaries, often onto a radial
  burst or a close-up.
- **A few procedural effects do a lot:** a starburst behind a figure, a turning vortex, crackle loops,
  sparkles, light shafts, rising particles, depth-of-field blur. All of them can be drawn in code.
- **The detail is drawn, not generated.** The creatures, characters and the evolving town are illustrator
  work: dozens of distinct, hand-designed objects per shot.
