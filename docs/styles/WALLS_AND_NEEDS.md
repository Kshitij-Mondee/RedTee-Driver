# Walls and needs, per style (2026-09-30, run R-14)

What each look can do today (proven by a lab strip or the reel), where it hits a wall, and what it would
take to reach the level of the reference channels (3Blue1Brown, TED-Ed, Kurzgesagt, Cleo Abram, Crayon
Capital; research in `docs/research/2026-09-30-reference-channels.md`).

**How to read the numbers.** A number with a command behind it is marked *measured*. Asset counts, sizes
and effort are *estimates* (rule 0). Gap sizes: S (days of engine work), M (one to three weeks, or a small
asset set), L (needs human art, audio or a new subsystem).

The showcase: `docs/styles/demos/2026-09-30_styles_reel.mp4` (13 segments, 38.8 s, *measured*),
built by `py -m loom reel docs/styles/reels/styles_2026-09-30.json`, with its contact sheet next to it.

---

## The headline
- The research's main finding: **five of the seven techniques that most separate those channels from
  ordinary explainers are script and storyboard skills**, not rendering ones:
  - a question hook with an explicit payoff;
  - concrete examples before definitions;
  - one governing metaphor;
  - a misconception, then its correction;
  - numbers shown at human scale.
  (The other two in the top seven are the mechanism shown as a change, and acts with turns.)
- Loom's pedagogy and storytelling stages address these. They are not yet measured against the rubric;
  proposal P-5 would do that.
- **The largest visual gap is illustration richness,** not rendering power. Kurzgesagt and TED-Ed are drawn
  by human illustrators; Loom's shapes are drawn by code. Loom can already render depth, light, grain, 3D
  and motion blur. What it lacks is **art to render**:
  - metaphor-world kits;
  - props;
  - characters with more than one view.
- **The second is sound:** a synthesised pad is not a score, and one TTS voice without emphasis control is
  not a narrator.

---

## 1. Flat motion graphics (flat-cosmos, corporate-clean, dark-technical, engineering, editorial-paper)
- **Works now:**
  - 17 templates and 5 blueprints;
  - the world canvas with camera joins;
  - measured type;
  - springs and orchestration;
  - simulated product UI;
  - the shader layer (living background, grain, vignette, light sweep, spotlight);
  - brand on any style;
  - two rendered lessons.
- **Walls:**
  - Scenes are geometric (cards, discs, icons, bars); there is no illustrated object vocabulary (a server
    room, a factory floor, a harbour), so every metaphor has to be built from rectangles.
  - Lucide icons are line icons: good for UI, thin for storytelling.
  - No path morphing between arbitrary shapes, so "this becomes that" is faked with cross-fades.
  - No unit chart, "representative sample" or scale-ladder component (research patterns P2 and P3).
- **Needs:**
  - a morph primitive (flubber-style path interpolation, MIT; S);
  - a unit-chart component with a regroup animation (S);
  - a log-scale zoom camera for scale journeys (S-M);
  - **6 to 10 metaphor-world kits** (factory, city, harbour, journey map, body, garden, machine, office,
    control room), each 20 to 40 pieces, drawn once per style family, by a human illustrator or bought
    CC0 and adapted (L, the biggest single item).
- **Peak looks like:** Kurzgesagt-level scenes assembled from kits, with the camera, light and grain Loom
  already has.

## 2. Whiteboard and line art
- **Works now:**
  - seeded Rough.js hachure;
  - line-art shading;
  - strokes that draw on;
  - the blameless-postmortem lesson;
  - iso boxes switch to outlines automatically in these styles.
- **Walls:**
  - no drawing hand;
  - no hand-lettered type that writes itself (Caveat and Patrick Hand are fonts, not strokes);
  - drawings appear by stroke dash, not in the order a person would draw them.
- **Needs:**
  - single-stroke (Hershey-style) fonts for write-on text (S);
  - a stroke-order pass (S);
  - an optional drawing-hand sprite that follows the stroke head (S-M, one hand asset).
- **Peak looks like:** an RSA Animate-style board, with the reasoning drawn as it is spoken.

## 3. 2D characters (runtime/rig.js, runtime/rigs/people.js) - new in this run
- **Works now** (*measured*: `lab_characters`, 0 problems in 2 styles):
  - two rigs, Ava and Sam, with forward kinematics;
  - 8 poses blended by a critically damped spring;
  - 5 additive gestures;
  - a walk cycle with a body bob;
  - breathing;
  - a seeded blink;
  - 5 emotions (brows and mouth);
  - lip flaps from narration word timings, with vowel-to-mouth mapping;
  - gaze direction;
  - skin tones, hair and clothes from the style pack, so a brand re-dresses them;
  - they can live inside a depth layer.
- **Walls** (seen in the strips):
  - front view only: no 3/4 or profile, so they cannot turn to each other or walk convincingly (they slide
    sideways with swinging legs);
  - capsule limbs with round hands: no hand shapes (open, fist, pointing, holding);
  - no props in hand;
  - two body types and one build each;
  - mouth shapes are vowel guesses, not phonemes;
  - no automatic acting (the scene author keys every pose);
  - at small scale in a wide shot the faces are dots.
- **Needs:**
  - 3 views per rig (front, 3/4, profile) with view switching (M);
  - 8 hand shapes (S);
  - a props socket in the hand with 20 common props: laptop, phone, clipboard, mug, badge, box (M);
  - a cast of 6 to 8 rigs covering ages, builds and presentation, reached by composition (heads, hair,
    bodies, clothing slots) rather than by drawing every combination (M);
  - phoneme mouths from Kokoro's phonemes, which it already computes (S-M);
  - an "acting pass" that proposes poses and gestures from the script's verbs and cues, for the author to
    accept (M).
- **The professional route, if art quality matters more than code control:**
  - Rive (runtime MIT, editor proprietary) with designer-made rigs, seeked frame by frame like Lottie (M,
    plus an illustrator);
  - Spine is excluded (every user needs a licence).
- **Peak looks like:** TED-Ed character lessons, or Crayon Capital's small cast doing skits.

## 4. 2.5D depth (runtime/depth.js in the page; skia/cinematic_25d.py as a clip) - new in this run
- **Works now** (*measured*: `lab_depth`, 0 problems in cinematic-noir and cinematic-dawn):
  - layers at depth z, with parallax from a push-in and drift;
  - aerial perspective (far layers toned toward the field);
  - depth of field (blur grows with distance from the focus plane);
  - bloom on a light source;
  - a light cone, haze and rim light;
  - rigged characters inside a layer;
  - two new style packs that pass the contrast lint;
  - the Skia clip adds real motion blur and grain.
- **Walls:**
  - the layers are silhouettes (ridges, skylines, a lamp post): mood without detail;
  - SVG blur is expensive per frame, so a lesson full of depth scenes renders slowly;
  - no volumetric light through objects (god rays are a gradient cone);
  - no camera move other than push and drift (no crane, orbit or rack focus between two named planes);
  - light does not fall on the characters (no shading from the key light).
- **Needs:**
  - illustrated layer sets per metaphor world, drawn as separated layers (foreground, mid, back, sky):
    about 5 layers x 8 worlds (L, human art, and the same kits as section 1 if they are drawn layered);
  - rack focus and crane moves (S);
  - a key-light direction that shades characters and props (a gradient overlay per part, S-M);
  - caching static layers as bitmaps so blur is paid once, not per frame (S-M).
- **Peak looks like:** the opening of a Kurzgesagt video, or a film-noir case study.

## 5. Isometric (runtime/iso.js in the page; three/isometric_office.js as a clip) - new in this run
- **Works now** (*measured*: `lab_iso`, 0 problems in 3 styles):
  - true isometric projection;
  - boxes shaded from one token (top, left, right faces);
  - a grid board;
  - arrows;
  - labels that hug their text and pass the reading floor;
  - painter's order;
  - outlined in whiteboard or line styles;
  - boxes extrude with `m.grow`;
  - the Three.js diorama adds real shadows and a slow orbit.
- **Walls:**
  - boxes, tiles and arrows only: no cylinders, people, desks, servers or trees in the SVG kit;
  - no label collision avoidance;
  - flows run along the floor, never up or down a level;
  - no animated tokens moving along a flow (packets, parcels, people);
  - the Three.js diorama is built from primitives, with no models.
- **Needs:**
  - an iso prop library of 30 to 50 pieces drawn in the three-face shading (server, laptop, desk,
    person, tree, truck, database, shield, building; M, can be code-drawn);
  - `iso.flow` tokens moving along paths (S);
  - multi-level flows (S);
  - label layout that avoids overlaps (S-M);
  - for Three.js, GLTF models from Kenney or Quaternius (CC0; each download needs your approval) and a
    postprocessing pass (bloom, SSAO; pmndrs, zlib) (M).
- **Peak looks like:** the "system as a model" style of the best architecture and operations explainers.

## 6. 3D objects (Three.js clips)
- **Works now:**
  - a device turning in on a spring;
  - a screen texture drawn from the style;
  - a room-environment light;
  - transparent clips composited on the canvas;
  - style fonts loaded before the build.
- **Walls:**
  - primitives only (rounded boxes);
  - software GL in headless Chromium limits quality settings (no heavy shadows or postprocessing);
  - no camera paths beyond a turn or orbit.
- **Needs:**
  - GLTF product and prop models (licensed or commissioned per client; M);
  - postprocessing (bloom, depth of field) (S-M);
  - GPU rendering on the owner's machine for heavy scenes (a flag, S);
  - Blender only if photoreal is ever required (L, parked as P3).

## 7. Skia hero and cinematic motion graphics (Skia clips)
- **Works now:**
  - SkSL light;
  - frosted glass (backdrop blur);
  - blur-to-sharp type;
  - motion blur by sub-frame accumulation;
  - grain;
  - resumable frames.
- **Walls** (*measured* in this sandbox, CPU only):
  - speed: the hero orb took about 3 s a frame at 1600 x 780 with motion blur (99 frames over two runs,
    298 s);
  - the 2.5D scene took about 0.7 s a frame;
  - so Skia is for 2 to 5 hero moments a lesson, not whole lessons;
  - every hero is hand-written Python.
- **Needs:**
  - a small library of parameterised Skia heroes (title reveal, number slam, orb, glass card, light
    streak), so a storyboard picks one instead of commissioning code (M);
  - GPU Skia on the owner's machine (S to try).

## 8. Lottie
- **Works now:**
  - designer animations seeked by the timeline;
  - automatic re-colouring to tokens;
  - one Loom-made asset (`check_success`).
- **Walls:**
  - there is no library: one asset.
- **Needs:**
  - 30 to 60 micro-animations (checks, warnings, loaders, arrows, confetti, hand-drawn underlines,
    icons that act);
  - either drawn in-house or taken from LottieFiles, licence checked per file (M; each download needs your
    approval).

## 9. Mathematical motion (Manim), the 3Blue1Brown register
- **Works now:**
  - the Manim bridge with tokens, fonts and cues;
  - a shared clip store;
  - draft previews;
  - a fixed-colour check;
  - the forgetting-curve clips in spacing-sticks.
- **Walls:**
  - each concept is hand-authored Manim;
  - Manim is not installed in this sandbox, so new Manim scenes can only be rendered on your machine
    (rule 0 addendum 3: it is installed there);
  - no "pi creature" learner stand-in.
- **Needs:**
  - a small Manim scene library for L&D maths (percentages, compounding, rates, distributions, sampling,
    funnels; M);
  - a simple mascot rig for Manim (S-M).
- **Peak looks like:** the transformation IS the explanation (research rank 4).

---

## Cross-cutting walls

| wall | now | needs | gap |
|---|---|---|---|
| **Illustration kits** | code-drawn shapes, icons, Open Peeps busts, 2 rigs | 6 to 10 metaphor-world kits (layered, per style family), props, a cast | **L** |
| **Music** | synthesised pads in key, following the edit | composed stems per style pack (4 to 6 moods x intro, loop, turn, outro) that change at act boundaries; licensed or commissioned | **M-L** |
| **Voice** | Kokoro, one voice per lesson, phrase timings | emphasis and pause control (SSML-like marks), 2 to 3 voices for dialogue, a premium voice path for flagship lessons (OpenAI and ElevenLabs adapters exist, not yet proven) | M |
| **Sound design** | synthesised whoosh, pop, tick, chime, keys, from motion events | a curated foley library (paper, mechanical, UI, ambience beds per world) | M |
| **Render speed** | HyperFrames at CPU speed; the fx layer forces screenshot capture (L-86); Skia at 0.7 to 3 s a frame | GPU paths on the owner's machine, bitmap caching of static depth layers | S-M |
| **Story quality** | storytelling fields, suggestions by kind of video, the animatic | richer references per kind of video from the Gemini study (`docs/research/GEMINI_BRIEF.md`); not checks (D-64) | S-M |

## Order of work that gives the most quality per unit of effort (a recommendation)
> **Superseded in part (D-64, D-65):** item 1 (P-5) was declined. The rubric and patterns stay as
> references in the storyteller skill and genre notes, not checks or templates. Every path now carries a
> production-tier label (`docs/PRODUCTION_TIERS.md`, `py -m loom cost`).
> **Later (D-67):** tier labels are parked; cost will be decided with time. `loom cost` reports drivers only.

1. **P-5, the story rubric as gates, plus the five reference patterns as templates:**
   - the wrong answer first;
   - the representative sample;
   - the scale ladder;
   - the running character;
   - the mechanism machine.
   This is mostly engine work, and it attacks the techniques ranked 1 to 7.
2. **Morph, unit chart, scale zoom, iso props and flow tokens:** S-sized items with a high payoff.
3. **Character v2:** three views, hands, props, a cast by composition, phoneme mouths.
4. **Commission or source the art:** 2 metaphor-world kits and one music stem pack as a pilot, then
   measure the difference in a lesson before buying more.
5. **GPU paths and caching** once lessons use depth and Skia heavily.

**Later (2026-10-01), from watching seven Crayon Capital videos** (`docs/research/crayon/2026-10-01-crayon-capital-study.md`):
the story-cartoon register leans on things Loom only partly has. Needs, by how often the device appeared:
sitting and phone poses for the rig and crowds of simplified figures; a hand-style caption and speech-bubble
set tied to word timings; a named prop kit (document, ledger, newspaper front, flip calendar, nameplate, price
tag, podium, map pin); a split-screen call layout; a black narration card as a join; a bookend note in
`loom animatic` when the opening image never returns. None is built yet.

**Later (2026-10-01), from Cleo Abram (5 videos) and Lucas's Lab (2 videos)** (`docs/research/2026-10-01-channels-compared.md`):
for the presenter-documentary register, a source highlight card (an excerpt of the lesson's own source page
with one phrase marked), a diagram revisit in the storyboard (a scene returns to an earlier diagram with one
change and reuses its state), brand pill labels as style tokens, and a presenter-proxy mode for the rig (reacts,
asks, points). For the math register, a Bloch-sphere or rotating 3D glyph helper and term-by-term equation
simplification in the Manim kit, and a hardware photo card for a source image with a caption. None is built yet.

**Later (2026-10-08, WS6: the style guides' section 15 requests).** Every S-sized runtime request in the five
guides shipped in this pass (pack `materials` and `roles`, `fx.spotlight`, `fx.vignette_under`, `characters.bottom`
and `white`, `shape.gloss_toward` and `contact_shadow`, the paper `document.page`, the travel drive key, `m.draw`
stroke-first with its own opacity and dashes, the font weight clamp, `loom lab --file`, the guide read by the
agents, sketch arrows and rounded rects, the glow gradient and defaults, depth z and unique ids, counter and dip-line
defaults; tests in `tests/suites/style_system.py`, report `docs/research/2026-10-08-style-system-report.md`). What is
left is M or L, or a decision, and stays here until it is built:

| style | request | size | why it is not an S |
|---|---|---|---|
| corporate-clean | a UI type role separate from `label`, so the pack can raise the label floor to 26 to 28 without overflowing `Loom.ui` | M | every `Loom.ui` builder sizes from `label`; a new role touches the type scale, the lint and each builder |
| corporate-clean | an S1 corporate cast (guide s14) | L | designed characters, made through `skills/lnd/lnd-character-design` from Claude Design first, never in scene code |
| corporate-clean | flat editorial office and meeting sets (guide s9, s14) | L | set art |
| story-cartoon | A1 DANIEL and PRIYA (ASSET_WISHLIST A0, Claude Design prompt F1 with Maya's sheet) | M | character art |
| story-cartoon | A2 3/4 and back views, a walk and sitting poses for imported rigs | M | rig art and poses |
| story-cartoon | A3 a designed bust kit in the S2 style block with open-eyed rest faces | S (art) | art, not engine |
| story-cartoon | A4 the office crowd kit (`office_crowd`, packs/worlds/office.json) | M | crowd art |
| story-cartoon | A5 a hand italic face for dialogue captions | S | a font download: needs Kshitij's approval first |
| story-cartoon | A6 a split-screen call layout and speech bubbles tied to word timings | M | a new layout and caption subsystem |
| glow-flat | templates on the glow ground: a pack-level backing so template beats sit in the world, not on a veil or the nebula | M | touches every template's backplate and the world veil |
| glow-flat | `characters.extras`: the pack's crowd is the outlined grey bean, against this style's no-outline rule | decided | D-132 (2026-10-08): keep beans and no crowds in glow-flat |
| glow-flat | a designed glow-flat cast and presenter (S8) | L | character art |
| cinematic-noir | A1 the workplace cast in 2.5D lit layers | L | character art |
| cinematic-noir | A2 a noir crowd sheet | M | crowd art |
| cinematic-noir | A3 layered night sets from the office world | L | set art |
| cinematic-noir | A4 props in this light (lamp, laptop and monitor backs, chairs, each with a lit edge and contact shadow) | S (art) | art, not engine |
| whiteboard | places, objects and data fills through `kit.sketch`, no contact shadows when `shape.shadow` is none | M | three modules route their fills; every place and object must be re-judged on a strip |
| whiteboard | single-stroke write-on lettering (Hershey-style or a stroked Caveat centre line) | M | a glyph source and a text-as-path path through `m.draw` |
| whiteboard | a drawing hand at the dash head of the active `m.draw` path | M (art + engine) | `Loom.hands` has only the PLACEHOLDER set; needs a designed hand family |
| whiteboard | A1 a marker-on-whiteboard character kit | L | character art (the STYLE block is in the guide) |

Not changed on purpose (the guides mark them decisions for Kshitij): noir `accent2` equal to `neg`, the noir and
glow extra palette tokens, noir's tone reference and ambient wash, and story-cartoon's vignette value.
