# More styles for Loom: 2D character animation, 2.5D, cinematic motion graphics, isometric (2026-09-30)

STATUS: DESIGN (proposal P-4, awaiting the requester). Research plus two working proofs. Nothing is decided.

## 1. What the two references are doing

**The moonlit silhouette (2.5D cinematic).**
- The picture is almost monochrome. Value (light against dark) carries it, not hue.
- Four or five depth layers are flat silhouettes, each lighter and softer the further away it is (aerial
  perspective).
- Light is designed:
  - the moon has bloom;
  - a volumetric cone falls on the one object that matters;
  - thin lit rim lines trace the ridges.
- Film grain and haze in the foreground.
- The camera moves slowly and the layers part (parallax), so it reads as deep although every layer is flat.

**The couch scene (2D character animation).**
- A rigged flat character with separately rotating limbs, head and hands, expressive faces and a prop in
  use (the tablet).
- A limited palette with one saturated accent, and stipple-grain shading on the big shapes.
- A believable set (shelf, frames, table) in desaturated greys so the characters pop.
- Broadcast chrome: a lower third.

Loom already has most of the grammar for these (stations, camera, joins, springs, the fx layer, Skia and
Three.js clips). Two things are missing: character rigs, and a depth-staged world with a lighting plan.

## 2. Style families, and how Loom gets each

| Family | Best route for Loom | Libraries and tools (licence) | Proof |
|---|---|---|---|
| **2D character animation** | A Loom SVG RIG: a character is a data package of parts with pivots, parents, limits, poses and swaps (eyes, mouths, hands), driven by the timeline. Mouth shapes come from the narration's word timings; eyes blink on a seeded schedule | Our own (the OpenMontage character-rigging pattern: data-driven parts, pivots, constraints). Parts from **Humaaans** and **Open Peeps** (CC0). **Rive** for designer-authored rigs (runtime MIT; its low-level API steps frames, so seeking is replay from 0). **DragonBones** (free, dated). **Spine is excluded**: every user needs a paid licence | Not built yet |
| **2.5D cinematic** | An in-page DEPTH STAGE (layers with z, camera push and drift driving parallax, blur by distance, haze between layers, rim light) plus the fx layer for light, grain and grade. Skia clips for hero shots | Skia (have), the fx shaders (have). Optional: AI depth-from-still for the user's own photos | **Built**: `scenes_examples/skia/cinematic_25d.py` (layers, bloom, light cone, beam, haze, depth of field, grain) |
| **Cinematic motion graphics** | A lighting plan per beat (key, rim, cone, bloom); camera grammar (push-in, rack focus, whip pan with motion blur, match cut); a colour grade in the fx top layer; dust particles; aspect-ratio drama for openers | **pmndrs postprocessing** (zlib: bloom, depth of field, SSAO, vignette, noise) and **three-good-godrays** for Three.js clips. Theatre.js core (Apache 2.0) only if an authoring timeline is ever needed; its studio is AGPL, so no | Bloom, cone, grain and motion blur proven in Skia; postprocessing not yet |
| **Isometric** | Two tiers:<br>- an SVG ISO KIT in the page for diagrams (tile, box, arrow, grid, label, all projected with iso maths, in tokens);<br>- Three.js orthographic dioramas for hero scenes | Three.js (have). **Kenney** (CC0; isometric packs and glTF) and **Quaternius** (CC0 low-poly glTF with animations) for props and people | **Built**: `scenes_examples/three/isometric_office.js` (true isometric angles, soft shadows, pieces rising on springs, slow orbit) |
| Premium 3D, when it is worth it | Blender headless (`bpy` on PyPI) with Eevee, for a few seconds of true cinematic 3D | Blender (GPL, used as a tool, not linked) | Parked: heavy install, slow |

## 3. From a concept to a cinematic storyline (the LXD method)

The engine can now draw almost anything. What decides whether it is cinematic and still teaches is the plan
made before any scene is written. Proposal: a **visual storytelling pass** between the storyboard and the
scenes, with its own skill (`lnd-visual-storyteller`) and gate.

1. **One governing metaphor and one world per lesson.** The metaphor climbs a ladder: literal, then analogy,
   then a world the analogy lives in. For example: an alert, then "a signal nobody watches", then a
   lighthouse on a ridge. Beats return to the same world, so the payoff can mirror the opening shot.
2. **A story spine mapped onto the pedagogy arc:** situation, tension, turn, resolution. It lines up with
   Gagne's gain attention, present, practise, and transfer. The cinematic register belongs at the hook,
   the dividers and the payoff; the teaching middle is clarity first.
3. **A shot for every beat, from a small grammar:**
   - establishing (the world);
   - push-in (this idea matters);
   - reveal (the answer was here);
   - rack focus (detail to context);
   - match cut (A becomes B);
   - POV (you are there);
   - montage (a sequence);
   - return shot (the payoff mirrors the opening).
4. **A depth plan and a light plan per beat.** Name the foreground, middle ground and background, and where
   the key light falls. Light is the signalling principle made visible: the brightest thing is what to look
   at, and everything else recedes (value, blur, scale).
5. **A register per beat:** cinematic, diagram, character, or interface. Plus a rule for switching between
   them: a match cut or a light change, never a hard jump in style.
6. **An animatic before any scene:** `loom animatic <id>` renders one still per beat from the shot, depth
   and light plan (blocking boxes, the world's palette, the key light) for a five-minute human review.
   A still that does not read will not read in motion.

The storyboard schema would gain `world`, `metaphor`, and per scene `shot`, `depth` and `light`. The gate
checks, for example:
- every beat has a shot;
- a return shot mirrors the opening;
- spectacle stays within its budget;
- the cinematic register never carries a definition, quiz or step list.

## 4. Proposed build, in order

**P1 (the biggest visible gain):**
1. **Character rig v1.**
   - A rig format.
   - Two original characters built from our own parts.
   - Poses and gestures: idle breathing, talk, wave, point, sit, walk cycle, react.
   - Blink, and mouth shapes from the word timings.
   - Stipple-grain shading from the fx layer.
   - A `character.scene` template and lab strips.
2. **Depth stage in the page.**
   - Layers with z, parallax from the camera, blur by distance, haze and rim light.
   - Two style packs: `cinematic-noir` (value-driven monochrome, as in reference 1) and `cinematic-dawn`
     (warm).
3. **SVG iso kit and two iso templates:** `iso.system` (connected blocks) and `iso.flow` (a process on a
   board).
4. **Visual storytelling pass:** the skill, storyboard fields, gate and `loom animatic`.

**P2:**
- postprocessing in Three.js clips;
- an iso diorama template;
- Rive as an asset kind;
- CC0 asset import (Kenney, Quaternius, Humaaans), with the requester approving each download;
- a colour grade and LUT in fx;
- dust and particles.

**P3:**
- Blender Eevee clips;
- 2.5D from the user's own photos via depth maps.

## 5. Caveats
- **Licences:**
  - Spine excluded; Rive's editor is proprietary (its runtime is MIT).
  - Kenney, Quaternius and Humaaans are CC0.
  - Downloads need the requester's approval.
  - The references are studied for technique only; nothing is copied from them.
- **Cost:** Skia heroes and Three.js clips cost seconds per frame in the sandbox, and the fx layer forces
  screenshot capture. The spectacle budget is also a render budget.
- **Pedagogy:** more cinema is not more learning. The gate keeps definitions, steps and checks in the
  clarity registers.
