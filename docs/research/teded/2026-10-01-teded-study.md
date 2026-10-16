# TED-Ed: what seven lessons actually do (study, 2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. The requester's own files
(`C:\Users\Admin\Documents\Ted-Ed`), studied privately; notes paraphrase and nothing is republished.
Cache (gitignored): `cache/research/teded/`, with transcripts, `*.study.json`, contact sheets every 10 s,
`fingerprint.json`, `cues.txt`, word-aligned strips, `_cutcheck_*.jpg` and `_holds.jpg`.

**Method.** The tools were run in the sandbox on the mounted folder, and every frame claim below was checked
on the sheets or strips:
- `tools/transcribe_videos.py --engine sphinx`. This is pocketsphinx, so the text is rough. The faster-whisper
  model needs a download, which was not approved.
- `tools/video_study.py --sheet-every 10`.
- `tools/style_fingerprint.py --every 5`.
- `tools/explain_study.py cues` and `strip`.

**Instrument check (Rule 0).** The cut detector was checked by hand on 8 random cuts in the rail video:
- 5 were hard cuts;
- 1 was a designed motion-blur transition;
- 1 was a match into an x-ray view of the same train;
- 2 were changes inside a shot (a light turning red, a speed counter changing).

In animation, "cuts" here means visual events, and the per-minute rates are upper bounds. Pairs of cuts
under 0.5 s apart were 35 of 79 in that video, which is why the 25th-percentile shot reads 0.2 s.

| file | length | lesson (identified by content) | look |
|---|---|---|---|
| `videoplayback.mp4` | 6:36 | AI data centres, energy and photonic chips | glowing isometric, neon purple and blue |
| `videoplayback (1).mp4` | 5:40 | Ethics: Plato's "ship of state" | textured painterly 3D, stone statues |
| `videoplayback (2).mp4` | 6:30 | H5N1 bird flu | outlined cartoon, thick ink, personified viruses |
| `videoplayback (3).mp4` | 6:12 | Fungi, the hidden kingdom | gouache on paper, earth palette |
| `videoplayback (4).mp4` | 6:27 | High-speed rail (the Shinkansen) | soft anime-like, passengers, neon x-ray mode |
| `videoplayback (5).mp4` | 5:34 | The history of castles | parchment-textured cartoon, ribbon labels |
| `videoplayback (6).mp4` | 5:26 | Why concentrating is hard | crayon and pencil texture, a guide character |

## The frame around every lesson (fixed) and the world inside it (new each time)
- **Same shell every time.** A white card with a short quote and its attribution, 5 to 10 s. Then the
  lesson's own world. Then a credits strip naming the educator, director, narrator and composer, sometimes
  after a sponsor card.
- **A different look for every lesson.** Seven lessons, seven animation studios, seven styles. The look is
  chosen from the subject's own material:
  - Plato in stone statues;
  - castles on parchment;
  - fungi in earthy gouache;
  - data centres in neon;
  - attention in a child-like crayon;
  - a train in soft travel-poster light.

  The brand lives in the shell, not in the drawing.
- **For Loom:** this is a working model of "the person chooses the look per lesson". The pack is picked to
  suit the topic, and the shell stays the organisation's: brand, opening card, credits.

## Measured craft numbers

| lesson | visual events a minute (upper bound) | in first minute | median shot s (p25-p75) | seconds with motion | holds >= 2 s (total s) | longest hold, what is on screen | speech wpm measured (about -10%) | pauses > 1.5 s |
|---|---|---|---|---|---|---|---|---|
| AI data centres | 7.6 | 11 | 3.4 (0.2-10.2) | 88% | 6 (34) | 8 s, labelled GPU and PIC chips side by side | 140 (126) | 1 |
| Ship of state | 16.1 | 30 | 2.4 (0.4-4.8) | 95% | 5 (10) | 2 s, a statue holding a scroll | 143 (129) | 2 |
| H5N1 | 14.5 | 16 | 2.8 (0.2-5.1) | 84% | 13 (35) | 4 s, the term card "Influenza A subtype H5N1" | 139 (125) | 0 |
| Fungi | 9.0 | 11 | 4.8 (3.4-8.4) | 80% | 18 (56) | 7 s, spores in the dark; the underground network | 139 (125) | 1 |
| High-speed rail | 12.2 | 11 | 1.2 (0.2-7.2) | 95% | 4 (13) | 3 s, an empty platform | 133 (120) | 0 |
| Castles | 12.0 | 17 | 2.8 (0.5-6.2) | 77% | 18 (55) | 6 s, the motte and bailey, labelled | 147 (132) | 2 |
| Concentration | 11.2 | 23 | 3.3 (0.9-6.3) | 79% | 16 (56) | 7 s, the guide standing alone, a pause before the brain | 157 (141) | 0 |

What the numbers say, with the frames:
- **Five to seven minutes, about 125 to 140 words a minute after correction.** That is calmer than Crayon
  (about 142 to 150) and Kurzgesagt (see its study). Narration is continuous: 0 to 2 pauses over 1.5 s.
- **Pace follows the look.** Gouache fungi and parchment castles hold the longest (18 holds, 55 to 56 s
  of rest). Painterly 3D and the rail lesson barely rest.
- **The rests are on what must be read** (checked on `_holds.jpg`): a term card, a labelled diagram, a pair
  of labelled chips, or a quiet character beat before a new section. This is the same pattern as the earlier
  channels.
- **Fewer explanation cues than Kurzgesagt:** 0.9 to 2.3 a minute (questions, turns, analogies, quantities),
  against 2.0 to 3.9. TED-Ed narrates a story more than it argues. The transcript is rough, so treat this as
  a direction, not a measurement.

## What the look is made of (`tools/style_fingerprint.py`, medians over every 5 s)

| lesson | drawn | covered | outline | soft | grain | colours | sat | vivid |
|---|---|---|---|---|---|---|---|---|
| AI data centres | 0.49 | 0.91 | 0.017 | 0.30 | 1.43 | 159 | 0.52 | 0.43 |
| Ship of state | 0.32 | 0.81 | 0.010 | 0.24 | 0.97 | 32 | 0.41 | 0.12 |
| H5N1 | 0.33 | 0.77 | 0.019 | 0.19 | 0.83 | 19 | 0.49 | 0.35 |
| Fungi | 0.23 | 0.71 | 0.004 | 0.12 | 0.60 | 10 | 0.36 | 0.02 |
| High-speed rail | 0.29 | 0.82 | 0.004 | 0.25 | 0.98 | 50 | 0.42 | 0.07 |
| Castles | 0.20 | 0.89 | 0.000 | 0.41 | 1.02 | 22 | 0.30 | 0.02 |
| Concentration | 0.25 | 0.83 | 0.012 | 0.53 | 1.46 | 48 | 0.41 | 0.15 |

**Read this table carefully.** In `cache/research/teded/fingerprint.md` the first row is labelled "teded",
not with a file name. `--label` names the i-th input, so `--label teded` renamed the Ship of state video,
and nothing in that file is a pooled average. A first draft of this table misread that row as pooled and
was shifted by one lesson; it was caught by re-reading the tool's code (L-130).

- **No empty pages.** Covered is 0.71 to 0.91 in every lesson. Even the sparsest-looking styles fill the frame
  with a textured ground (paper, parchment, crayon wash).
- **Texture is everywhere.** Grain is 0.60 to 1.46; it is highest in the crayon (1.46) and neon glow (1.43) looks. It
  comes from the paper, wash or parchment, not from added noise.
- **Muted, not vivid.** The vivid share is 0.02 to 0.15 in five of seven. It is higher only in the neon
  data-centre lesson (0.43) and the saturated flu cartoon (0.35). Compare Kurzgesagt's newer videos at 0.71
  to 0.95.
- **Outline is optional.** It is strongest in the cartoon flu lesson (0.019), and near zero in the castles,
  fungi and rail lessons. The style decides it, not the channel.

## How the explaining is pictured (seen on the sheets and strips)
1. **The term gets its own frame.** The flu lesson gives each new term a hand-lettered card that fills the
   frame and holds 4 s: "Influenza A subtype H5N1", "Hemagglutinin / Neuraminidase", "Antigenic shift". The
   ethics lesson does the same with single words in giant yellow type over the scene: MUTINY, DEMOCRACY,
   POWERFUL, ME.
2. **Personify the mechanism, literally.** Attention becomes a tiny scientist with a flashlight walking inside
   a brain (concentration, 1:27 to 1:48):
   - the named region lights pink while the others go dark;
   - a handwritten label names it ("PARIETAL CORTEX");
   - then the camera dives inside and the beam is the attention.

   In the flu lesson the viruses have faces, and a white blood cell confronts them.
3. **One object, transformed in place.** The castle lesson builds one castle from the same angle (2:00 to 2:54):
   - a wooden motte, then a pull-out to the bailey with its label;
   - a dissolve to stone in the same spot;
   - the curtain walls painted yellow as they are named;
   - a whitewash close-up, then the whole castle turned red.

   It is a story-register version of "one board changed by additions".
4. **A thought experiment as a single story.** The ethics lesson tells Plato's argument as one ship, one
   storm and one crew, with stone figures. The abstract choice (who should steer) is a picture a viewer can
   hold.
5. **The unknown made countable.** The fungi lesson:
   - shows known species as collectible cards in a grid;
   - shows the unknown ones as a wall of "?" cards labelled "species unknown";
   - shows the web of relationships as a network of circular icons, which returns near the end.
6. **A chain of carriers.** In the flu lesson, transmission is a relay of animals (a bird, a cow, a cat, a
   person), each a character, with the virus small and visible on each.
7. **Switch to an x-ray view at the same framing.** The rail lesson cuts from the painted orange train to a
   neon wireframe of the same train in the same place. The engineering is shown "inside" without leaving
   the object. A related cut appears in Kurzgesagt's stress video (a figure to its glowing skeleton).
8. **Numbers on the furniture.**
   - Rail: the speed is on the cabin display, ticking from 100 to 408 to 595 km/h, and LA to New York in
     7 hours is on a window map.
   - Data centres: "100,000 m2" is on the floor plan, and a power bar runs along the bottom.
9. **Era markers inside the scene,** not on a separate slide: "12th Century CE" and "15th Century CE" are
   lettered over the castle as it changes.
10. **Close changed.** Each lesson ends by returning to its opening, changed:
    - Fungi: the opening dishes and forest return in the same shots.
    - Data centres: the character holding a plain globe returns holding a globe covered in data centres,
      then a split frame of polluted and green futures.
    - Rail: the passengers return.
    - Concentration: the guide's house becomes the sponsor's jigsaw puzzle.

## For Loom (references; the person chooses)
- **Pick the pack from the subject's material,** keep the brand in the shell. Packs that already fit this
  idea:
  - `editorial-paper` for paper texture;
  - `story-cartoon` for the outlined cartoon;
  - `cinematic-dawn` for painted light;
  - `flat-cosmos` for the neon or space look.

  Parchment and crayon textures are not in a pack yet (see the wishlist addendum).
- **A term card for each new term.** Loom has a black narration card (`ctx.narrationCard`) for turns. A
  full-frame lettered term card for a new word is a different beat. Today it is a scene choice, not a
  builder.
- **Personified mechanism and one object transformed in place** fit the existing rig and lab scenes
  (`lab_one_board.js` is the board version); no engine change is needed to use them.
- **TED-Ed pace is the calmer reference for teaching:** about 130 wpm, 5 to 7 minutes, rests on terms and
  labelled diagrams. It sits closer to a corporate lesson's needs than the entertainment channels.

## The animation itself: 10-second moments at 0.5 s (added later the same day)

Four windows were picked by the same rule as the Kurzgesagt study (the most motion with at most one cut; first ad-hoc, now `explain_study.py moments`). Strips are in
`cache/research/teded/motion/`.

| moment | what moves, and how |
|---|---|
| High-speed rail, 2:41 | **The comparison moves.** Two top-down tracking shots run side by side: on the left the old train winds through a dense city on curving track; on the right the new train runs a straight line through fields. It is the same camera move twice, so the difference is the route, which is the point. |
| AI data centres, 1:07 | **A glide that builds the place as it is named.** A continuous isometric glide over a glowing data-centre floor, with steam plumes drifting from the power section. Then server racks pop in block by block while the room's name rises as a label. |
| Concentration, 2:13 | **Exit to empty, then overhead.** A handwritten list on a phone screen; the guide character walks out of frame and leaves it empty for a moment. Then an overhead drift over a cut-away house, with a child at a puzzle table in one room. |
| Ship of state, 2:39 | **A reveal by tilt.** The giant word "CHAOS" sits over the ship in the rain. The camera tilts up from the ship through storm clouds to a towering figure, so its scale is the threat. Then the demagogue's mask-like face. On "the cost of liberty", red jagged spikes burst behind him: the same radial burst Kurzgesagt uses, in a painterly register. |

TED-Ed's motion is calmer than Kurzgesagt's. Typically there is one camera move per shot (a glide, a tilt, a
tracking pair), few idle loops, and the change is carried by building or placing things. A burst behind a
figure appears in both channels.

(The Ship of state row was first drafted before its strip had been opened. It was rewritten from the strip
before delivery; see L-133.)
