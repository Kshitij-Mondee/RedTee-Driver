# Lucas's Lab: what two videos actually do (study, 2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. Same method and limits as the Crayon Capital study
(`docs/research/crayon/2026-10-01-crayon-capital-study.md`): the requester's own files
(`C:\Users\Admin\Documents\Lucas's Lab`), `tools/video_study.py`, `tools/transcribe_videos.py` (pocketsphinx,
rough; speech rate reads about 10% high), contact sheets looked at in order. Paraphrase only; cache in
`cache/research/lucas/` (gitignored). Two videos is a small sample: treat this as a sketch of the channel.

**Detector check.** 8 random cuts in the qubit video: 6 clear cuts, 1 an element arriving over a full-frame
effect (354.4 s, a sphere fading in over red rays) and 1 a fade up from black (554.2 s). More important is
what the detector cannot see here: on a dark field, a new equation or graph replacing the last one changes
few pixels, so it is not counted as a cut. For this channel the cut count is a floor, and the "gap between
visual events" is the better pace measure.

| file | length | video (identified by content) |
|---|---|---|
| `videoplayback (3).mp4` | 8:58 | Quantum computing from the laws up: superposition, entanglement, gates, algorithms, error correction |
| `videoplayback (4).mp4` | 12:37 | How a physical qubit works: spin, energy levels, the Bloch sphere, atoms and superconducting circuits |

## Measured craft numbers

| video | cuts/min | median shot s | seconds with motion | holds >= 2 s (total s) | longest holds | median gap between visual events | speech wpm measured (about -10%) | pauses > 1.5 s |
|---|---|---|---|---|---|---|---|---|
| Quantum overview | 8.7 | 1.8 | 41% | 39 (297) | 43, 24, 23 s | 5 s (p90 24 s) | 187 (168) | 0 |
| Physical qubit | 3.8 | 2.2 | 51% | 45 (340) | 53, 42, 19 s | 4 s (p90 15 s) | 189 (170) | 1 |

What the numbers say, with the frames:
- **The opposite shape to the other two channels.** Motion in only 41 to 51% of seconds and holds of 40 to 53 s
  on a single board (the Bloch sphere sequence at 3:15-4:25 of the qubit video; a Bloch sphere of the overview
  around 4:36), while the narration never stops: the fastest speech of the three channels (about 170 wpm
  corrected) with almost no pauses longer than 1.5 s.
- **The picture changes by addition.** A board stays; arrows rotate, a term is added, an angle is marked. Most
  visual events are small changes to the same frame, not new frames.

## Per-video notes

### Quantum computing overview (8:58)
- **Cold open (0:00-0:35):** a golden dilution refrigerator with a light sweep, then the title "laws of quantum
  mechanics" with a single qubit dial, then superposition and entanglement side by side, then real hardware.
- **Section cards on a purple gradient (0:45, 2:05, 6:45-7:25, 7:35):** each concept gets a title card in the
  same purple, with a photo of real hardware in a rounded frame; a pale lilac card defines a term in one line.
- **Math on a dark dotted grid (1:15-1:55, 5:25-6:15):** kets, the state equation, the Bloch sphere, the
  entangled state and why it cannot be factored, written term by term.
- **From logic gates to circuits (3:45-5:15):** classical gates, then how they combine into an ALU, then quantum
  circuit lines with single- and multi-qubit gates, then a two-case comparison of the same circuit.
- **Algorithms as one-idea cards (6:45-7:25):** each algorithm is a title plus one tiny diagram (a frequency
  bar pair, a number to factor, a search grid with one star, constant against balanced).
- **Current state (8:15-8:55):** a flat phone-and-chip icon, a real paper's figure, a real paper's abstract, a
  product render, then the channel page.

### How a physical qubit works (12:37)
- **Cold open (0:00-0:35):** real hardware, three framed panels of spinning particles, a famous physicist's
  quote card over a portrait.
- **One running symbol:** a blue sphere with an orbit ring stands for a particle's spin all video, from the
  magnet field lines (1:05) to the measurement box that splits it up or down (1:15-1:35, 3:05).
- **Everyday switch first (2:35-2:55):** an open and closed switch, then doors marked open and closed, then a
  third door between them, before the Bloch sphere arrives (3:15).
- **Bloch sphere as the main board (3:15-4:25, 6:05-8:25):** angles theta and phi marked in turn; two spheres
  side by side for two qubits with the joint state written underneath and simplified term by term.
- **Energy diagrams (4:55-5:45, 9:55, 10:25):** an energy-well curve with levels drawn in as dashed lines and an
  electron stepping between them, paired with the orbit picture.
- **Lab footage and a portrait card (8:35-10:45):** real labs, a physicist with a name card, cryostats.
- **Hardware schematics (10:55, 12:15):** a capacitor and Josephson junction drawn as a circuit with labels,
  then two circuits side by side; ends on the next video's thumbnail.

## The channel's signature (from two videos)
1. **Math-first explainer in the 3Blue1Brown family:** dark field, thin lines, coloured kets, a sphere that
   rotates; the same symbols reused all the way through.
2. **Build on one board.** A frame is set up and then changed by small additions for 20 to 50 s.
3. **Real hardware as punctuation.** Photos and lab footage of the actual machines between math boards, so
   the abstraction is tied to an object.
4. **One-idea section cards** in a single purple (overview) or plain labels on dark (qubit video).
5. **Dense narration, no pauses.** About 170 wpm with almost no breaks longer than 1.5 s.

## What transfers to workplace learning (judgement, not rules)
- **Build on one board** is the most useful device for technical procedures: set up the system diagram once,
  then change one part per step. It lowers load (the learner keeps their bearings) and is cheap to render.
- **Everyday analogy, then the formal picture** (switch, doors, then the sphere) is the order worth copying.
- **Real object between abstractions** keeps a technical lesson grounded; for internal training that is a
  screenshot of the real system or a photo of the real equipment, from the source.
- **Where not to copy.** 170 wpm with no pauses under a changing equation is hard to follow; the evidence on
  segmenting and pacing points the other way for learners meeting the idea for the first time.

## What Loom would need
Loom already has this register: `kind: manim` scenes, the Manim bridge, and the `dark-technical` style pack with a dark math
look. Gaps seen here: a **Bloch-sphere or rotating-3D-glyph** helper in the Manim kit, **term-by-term equation
simplification** as a named move, and a **hardware photo card** that takes a source image with a caption.
