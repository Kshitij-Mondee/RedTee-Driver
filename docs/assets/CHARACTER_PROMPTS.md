# Character prompt library for Claude Design (2026-10-07)

STATUS: DESIGN. Prompts, not delivered assets. Built on `docs/ASSET_WISHLIST.md` (Prompt 0, the contract;
Prompt R, the return format; A0, the first cast bible) and on `skills/lnd/lnd-character-design` (the rules these
prompts encode). Worlds and their casts: `docs/assets/WORLD_PACKS.md`.

**Styles are never compared with each other** (D-122). Each style below has its own purpose; the same character
can be drawn in several of them, and a lesson picks the one that suits it.

## How a prompt is assembled

Every character request is built from four parts, pasted in this order in one Claude Design session:

1. **Prompt 0** (the contract, `ASSET_WISHLIST.md`) and **Prompt 0+** (below: the additions for the newer styles
   and for non-human characters). Paste once per session.
2. **Prompt R** (the return format, `ASSET_WISHLIST.md`). Paste once per session that should deliver files.
3. **One STYLE block** (S1 to S11).
4. **One CHARACTER block** (C1 to C15), with its brief filled in.
5. **One DELIVERABLE block** (D1 to D10).

Then: pilot ONE character, review it against the reject list (lnd-character-design section 11), paste the
failures back ("fix these, keep everything else"), and only then order the rest of the cast with "same sheet,
same proportion system, same line and shading rules". Bring the .zip back through
`py tools/asset_intake.py <file> --batch <name>`; a clean intake (exit 0) is the gate.

The **assembled prompts** (F1 to F13) at the end are the four parts already joined for the most common needs.

---

## Prompt 0+ : contract additions (paste right after Prompt 0)

```
CONTRACT ADDITIONS (these extend the contract above; everything else in it still applies)

EXTRA LAYER CLASSES
- class="lm-texture": a texture layer made of vector marks only (brush strokes, grain dots, paper fibres,
  hatching), one group per volume, never over the face's eyes or mouth. Used by the painterly and hand-drawn
  styles. No raster images, no filters.
- class="lm-glow": soft light shapes for the glow-flat style: concentric shapes stepping down in opacity
  (0.35, 0.2, 0.1), or a radial gradient with two stops if asked. Glow sits only on light sources and key edges.
- For the 2.5D style, group each character into <g id="base">, <g id="shadow">, <g id="light">, <g id="rim">,
  in that order, so the engine can relight a figure by changing layer opacity.

EXTRA COLOUR SLOT FAMILIES (exact values; the engine maps them to the style's colours)
  fur1    #8C5A2B base  #6B4320 shade  #B07A45 highlight   (main coat of an animal or creature)
  fur2    #E8DCC8 base  #C9BBA4 shade  #FFF6E6 highlight   (belly, muzzle, markings)
  feature #3A2A22 base                                     (nose, beak, claws, hooves, horn)
  mat1    #7A8CA0 base  #5C6C80 shade  #A0B0C4 highlight   (a personified object's main material)
  mat2    #C8A060 base  #A07E44 shade  #E4C488 highlight   (its second material)
  glow    #FFF2B0                                          (lm-glow shapes only)
  Human characters still use the skin, hair, eye, lips, cloth1-3 and metal families from the contract.

NON-HUMAN ANCHORS
- Animals: anchor_feet_front, anchor_feet_back, anchor_nose, anchor_tail_base.
- Personified objects: anchor_face_centre, anchor_base, anchor_grip (where a hand would hold it).

QUALITY
- Before delivering, review every character against this reject list and redraw what fails: the face could
  belong to another character; eyes are dots or lines (except mascots and pictograms, chosen on purpose); the
  head is wider than the shoulders (except mascots); hands are mittens; clothes have no folds or seams; hair is
  one flat shape; the pose is stiff and symmetrical; the character floats with no weight on its support; light
  disagrees with the set; at quarter size the action no longer reads; it resembles an existing franchise,
  mascot, channel or real person; any group's features are exaggerated. Say what you redrew.
```

---

## Style blocks (each has its own purpose; never ranked against each other)

### S1. Flat 2D vector, editorial (corporate explainers, process and product)
```
STYLE: flat 2D vector, editorial. The quality of high-end magazine and corporate illustration, calm and adult.
- Proportions: natural, 7 to 7.5 heads; real anatomy simplified with intent; no tiny heads on giant limbs, no
  "corporate Memphis" distortion.
- Line: none, or a very thin line in a darker shade of the same hue only on the jaw, ears and fingers.
- Form: 3 to 4 flat tone shapes per volume give the planes (forehead, cheek, jaw; sleeve top and underside).
  Key light from the top left; a slightly cooler shade side.
- Face: real eyes (upper lid, iris shape, catch-light) kept small and calm; the nose as a plane change with
  nostril shapes; lips as two shapes.
- Palette: the slot families only; restraint, two accents at most per character.
- Motion it must allow: a full rig (contract parts).
```

### S2. 2D story cartoon (narrative scenarios, behaviour change)
```
STYLE: 2D story cartoon. Contemporary editorial animation for adult story-driven training, the craft of a top
motion-design studio's character work, not a children's cartoon.
- Proportions: about 6 heads (a slightly larger head for expression; never a ball head wider than the
  shoulders); hands and feet a touch larger than life.
- Line: a confident outline with VARIED weight, 6 px on the outer contour at 1080p scale, 2.5 to 3.5 px on inner
  details, tapered ends on folds and hair; all in class="lm-outline".
- Shading: two-tone cel (base and shade) with a crisp terminator; thin highlights on hair, nose bridge,
  cheekbone and fabric edges (lm-hi); soft occlusion where parts meet (under the chin, armpits, collar) at low
  opacity (lm-shade).
- Face: full eye construction, the 12 expressions and 9 mouths.
- Motion it must allow: a full rig plus the face kit.
```

### S3. 2.5D lit layers (cinematic moments, mood, emphasis)
```
STYLE: 2.5D lit layers for a depth stage with parallax and changing light. Build each character in the S1 or S2
construction named below, then render it as separate light layers.
- Layers: base (flat local colour), shadow (cast and form shadows as shapes, cool), light (key light shapes,
  warm), rim (a thin bright edge on the side away from the key). Group them as base, shadow, light, rim.
- Light: one warm key from one side, a cool fill, cast shadows that fall on the clothes and face believably.
- Deliver each pose in three light setups: key from the left, key from the right, backlit with rim only.
- Motion it must allow: whole-figure and head turns, a lean, breathing; relight by layer opacity.
```

### S4. Painterly / artistic (reflective, historical and human stories)
```
STYLE: painterly, gouache-like illustration in vector form, warm and human.
- Proportions: 6.5 to 7.5 heads, natural.
- Edges: lost and found, contours shaped like brush strokes, no uniform outline.
- Value: a clear value structure first (light, middle, dark masses), then colour with temperature shifts (warm
  light, cooler shadows).
- Texture: in class="lm-texture" only: vector brush marks and grain that follow the form, sparse on faces, never
  noise over everything.
- Face: simplified planes, expressive, eyes still clearly open with a catch-light.
- Motion it must allow: layer moves (a turn of the head, a lean, a hand gesture as a separate arm), not a
  full limb rig.
```

### S5. Hand-drawn ink and wash (informal, thinking aloud, sketchbook)
```
STYLE: hand-drawn ink and wash, like a skilled illustrator's sketchbook.
- Proportions: 6 to 7 heads.
- Line: real line variation, a slight natural wobble, line drives the drawing; class="lm-outline".
- Shade: a wash or hatching on the shade side only (lm-shade); paper texture as vector fibres in lm-texture,
  sparse.
- Face: economical and lively; a few confident lines carry the expression.
- Motion it must allow: a rig with overlapping parts; the engine may "boil" the line (re-draw it slightly
  per frame), so keep strokes as separate paths.
```

### S6. Line art (technical, minimal, elegant)
```
STYLE: clean line art. Single or two line weights, no fills except the background tint the engine adds.
- Proportions: natural, 7 heads.
- Every form closed by its line; overlaps shown by line breaks.
- Face: precise, minimal, the eye still open with an iris.
- Motion it must allow: a full rig; strokes in lm-outline only.
```

### S7. Isometric (systems, processes, places from above)
```
STYLE: true isometric figures for scenes on a 2:1 grid (30 degree axes), small in frame.
- Proportions: 4 to 5 heads; readable at 80 to 160 px tall.
- Volumes: three flat tones per volume (top lit, left mid, right dark); an optional thin outline.
- Face: minimal (two small eyes allowed at this size), the posture carries the emotion.
- Directions: draw facing south-east and south-west; the engine mirrors for north-west and north-east.
- Motion it must allow: whole-figure moves and a 4-frame walk cycle per direction.
```

### S8. Glow-flat (science, space and big-idea explainers)
```
STYLE: bright flat shapes on a dark ground with soft glow, for science and big-idea explainers. Original design:
nothing resembling any existing channel's characters or birds.
- Proportions: rounded, simplified, 4 to 5 heads; shapes clean and geometric but with designed asymmetry.
- No outlines; flat fills with a rim of light (lm-hi) on the edge facing the light source.
- Glow: lm-glow only on light sources, screens and key edges.
- Face: simple, large eyes with a clear catch-light; small, readable mouths.
- Motion it must allow: a light rig (head, torso, arms) and springy secondary motion.
```

### S9. Semi-realistic editorial portrait (presenters, interviews, close emotional shots)
```
STYLE: semi-realistic flat editorial, natural adult faces for waist-up and head-and-shoulders shots.
- Proportions: natural, 7.5 heads.
- Form: tone shapes for every plane of the face (brow, cheek, jaw, nose sides), a key light and a cool rim; no
  plastic smoothness, no uncanny realism.
- Face: specific, real adults; eyes with lids, iris rim and catch-light; lips with a highlight.
- Motion it must allow: head turns, blinks, lip-sync, small gestures in waist-up framing.
```

### S10. Mascot or guide (a recurring helper across a course)
```
STYLE: a mascot or guide character, designed for appeal and for adults (confident, dry, helpful; never cute for
its own sake and never talking down).
- One clear shape idea, readable in silhouette; 2.5 to 4 heads if humanoid; a signature gesture or prop.
- Large, readable features (dot eyes allowed here on purpose, or simple full eyes); a limited palette.
- Drawn in the lesson's base style (state which: S1, S2, S8...), so it belongs to the same world.
- Motion it must allow: a full rig, the face kit, a set of reactions.
```

### S11. Pictogram (inside charts and flows only)
```
STYLE: a pictogram family for diagrams, geometric and consistent like a good public-signage set. Simple is
correct HERE because these are symbols, not characters: a circle head, a shaped torso with shoulders, optional
role markers, one fill slot (accent), an optional outline layer, a highlighted and a faded variant.
```

---

## Character blocks (fill the brief in brackets)

### C1. The workplace cast (the first eight)
```
Use the CHARACTER BIBLE (Prompt A0 in this session) for MAYA, DANIEL, PRIYA, SAM, KOFI, ELENA, AISHA and LEO.
Start with [MAYA] as the pilot.
```
(A0 is in `ASSET_WISHLIST.md`; paste it before this block.)

### C2. One new person (any role)
```
CHARACTER BRIEF
- Name and role: [name], [role in the organisation or story]
- What the viewer must read: [one feeling or fact]
- Personality: [three adjectives], but [one contradiction]
- Age, build, height: [age], [build], [height]
- Face shape, skin tone and undertone, hair type and style: [details]
- Signature items (one or two that make the silhouette): [items]
- Wardrobe for this world: [garments, fabrics, colours within the slot families]
- Default expression and posture: [details]
- Shape language: primary [circle / square / triangle], secondary [...]
- Must avoid: [stereotypes or likenesses to avoid]
Design this person as a real, specific adult who could stand with the existing cast: same proportion system,
same line and shading rules. Silhouette test against the cast.
```

### C3. Background people and crowds (any world)
```
Design [16] background people for [WORLD] in the chosen style at mid detail: real proportions and clothing,
simplified faces (small eyes and brows, no mouths needed), fewer folds. Mix ages 20 to 65, builds, skin tones,
hair and the world's workwear ([list from the world pack]). Each in two versions: full colour, and a receding
version in the muted slots. Front, 3/4 and back; [4] standing and [4] seated poses across the set; some holding
[world props]. They fill rooms and crowds without drawing the eye, and are never faceless blobs.
```

### C4. Presenter or host
```
Design [NAME], a presenter who talks to camera for a corporate course: [age], [look], [wardrobe that reads
professional but warm], [one signature item]. Natural, credible, not a news anchor parody. Waist-up front and
3/4, full body front; talking to camera, pointing to screen right, two-hand explaining, holding a tablet and
showing it, listening, a small laugh, thinking with a hand at the chin, walking and talking.
```

### C5. Close-up portrait kit (for emotional moments)
```
Design head-and-shoulders portraits of [CAST] at 1200 x 1200 in the chosen style, the most detailed pieces in the
library: eyelashes as 3 to 5 strokes, an iris with a darker rim and a catch-light, a lip highlight, skin shade
planes on forehead, cheek and jaw, hair in strand groups, collar and fabric detail. Each carries the 12
expressions and 9 mouths as layers, with eyes and brows as separate groups so they blink and move. The expression
must be readable and specific (a realisation, a worry, relief), never generic.
```

### C6. Hands
Use Prompt H1 in `ASSET_WISHLIST.md` (hands as presenters, three families), in the chosen style block.

### C7. Families and young people (safeguarding, education, wellbeing lessons only)
```
Design [a family / students] for [LESSON PURPOSE]: [members, ages]. Age-accurate proportions (a 10-year-old is
about 5.5 heads, a teenager 6.5 to 7), everyday clothes, natural, warm, never stylised as adults in miniature and
never in any revealing or suggestive pose or clothing. Same style rules as the adult cast so they stand together.
```

### C8. Animals (pets, working animals, wildlife)
```
Design [ANIMAL: species, breed or type] for [ROLE: e.g. the office dog in a wellbeing lesson, a guide dog in an
accessibility lesson, wildlife in a sustainability lesson]. Stylised to the chosen style but true to the species:
correct muzzle length, ear shape and set, eye position, leg joints (digitigrade or plantigrade as the species
is), paw or hoof structure, tail carriage, coat pattern in fur1 and fur2. Expression comes from ears, eyes,
posture and tail first; no human mouth expressions unless it is a mascot. Personality: [three adjectives].
```

### C9. A mascot or guide (original, any species or none)
```
Design an original guide character for a [COURSE TOPIC] course for adult employees. Offer THREE distinct
concepts first (one animal, one object, one abstract shape), each with a one-line idea and a silhouette, then
develop the one I choose. The guide is confident, dry and helpful, never cute for its own sake, never
condescending. One clear shape idea, a signature gesture, a limited palette, reactions: explaining, warning,
approving, curious, thinking, celebrating (small), facepalm (small). Nothing resembling an existing mascot,
franchise, channel or brand.
```

### C10. Personified objects and concepts
```
Design personified versions of [OBJECTS / CONCEPTS: e.g. a phishing email, a strong password, a weak password, a
document, a laptop, a deadline] for a [TOPIC] lesson. Keep each object's real shape readable first; put the face
on its natural front (a laptop's screen, an envelope's flap, a document's upper third); limbs are simple and
consistent across the whole set; materials stay true (paper folds, metal reflects). Personality per object:
[e.g. the phishing email is smooth and too friendly; the strong password is calm and solid]. Expressions:
neutral, sly, worried, proud, surprised, defeated.
```

### C11. Cells, microbes and the body's characters
```
Design [AGENTS: e.g. a cold virus particle, a bacterium, a white blood cell, a red blood cell, a skin cell] for a
[TOPIC: hand hygiene / immunity] lesson. Scientific shape first: [the correct shapes, e.g. a red blood cell is a
biconcave disc; a bacterium is a rod or a sphere with optional flagella; a virus particle is a capsid with
surface proteins]. Colour coding consistent across the set; faces ONLY if the lesson personifies them, and then
small and simple; flag any simplification you make so the facts can be checked.
```

### C12. Robots and AI assistants
```
Design an AI assistant character for [TOPIC: AI literacy, automation] lessons: friendly and legible, never uncanny
or menacing. A rounded form with a clear front, a simple screen face or two eyes, one signature light or antenna,
no realistic humanoid features. States: idle, listening, thinking (a subtle pattern), answering, uncertain (it
says "I am not sure"), wrong (a gentle error state), helping a person.
```

### C13. People of a period (history lessons)
```
Design generic people of [PERIOD AND PLACE] for a [TOPIC] lesson: [roles, e.g. a mill worker, an inspector, a
clerk]. Research-accurate costume, hair and tools of the period; ordinary people, never a real named person,
never a caricature. Same construction rules as the modern cast.
```

### C14. Fantasy and metaphor creatures
```
Design [CREATURE] as the governing metaphor of a [TOPIC] lesson (e.g. technical debt as a growing creature,
procrastination as a heavy sloth-like companion). Build it from real anatomy blended ([e.g. a bear's mass, a
tortoise's shell]) so its motion is believable; one clear shape idea; a scale of growth stages if the metaphor
changes over the lesson ([small, medium, large]).
```

### C15. Customers and the public (retail, travel, service)
```
Design [8] customers or travellers for [WORLD]: varied ages, builds, cultures and needs (a parent with a child, an
older traveller with a stick, a business traveller, a student with a backpack, a wheelchair user, a tourist with a
map), each with a clear need readable from posture and props ([luggage, a phone with a booking, a receipt]).
Ordinary and respectful; no stereotypes.
```

---

## Deliverable blocks

### D1. Full model sheet and rig (S1, S2, S5, S6, S8, S10)
```
DELIVER a model sheet, each piece a separate SVG or a clearly named <g>:
 a) turnaround: front, 3/4 front, side, 3/4 back, back, same height lines, 1000 x 2000 per view, feet on anchor_feet;
 b) the rig: front and 3/4 split into parts with pivots (head, jaw, neck, torso_upper, torso_lower, upper_arm_l/r,
    forearm_l/r, hand_l/r swappable, thigh_l/r, shin_l/r, foot_l/r, hair_back, hair_front, accessories), with
    overlapping joints so rotation never shows a gap (shoulder 0 to 170, elbow 0 to 150, knee 0 to 120 degrees);
 c) face kit in head coordinates: eyes (open, half, closed, wide, squint), brows (neutral, raised, frown, worried,
    one up), 9 mouths and the 12 expressions;
 d) poses assembled from the rig: [list from the brief's actions, at least 10];
 e) hands: the 20-pose hand kit, left and right;
 f) a colour callout listing every slot used and where.
```

### D2. Layered light set (S3)
```
DELIVER per character: full body 3/4 and waist-up 3/4, each as base, shadow, light and rim layers, in three light
setups (key left, key right, backlit with rim). Plus the face kit as in D1 c), in the same layer structure.
```

### D3. Painterly set (S4)
```
DELIVER per character: full body and waist-up in 3/4, with the head, each arm and the torso as separate groups
(for layer moves, not a full rig); the lm-texture layer per volume; 6 expressions as separate head groups; 6 poses
from the brief. A colour and value callout (the three value masses and their slots).
```

### D4. Isometric figures (S7)
```
DELIVER per character: south-east and south-west facing, standing, walking (4 frames each), sitting, carrying a
box, pointing, at a desk; 120 to 160 px tall at 1080p; anchor_feet at the grid point.
```

### D5. Presenter set (S9 or S1)
```
DELIVER: waist-up front and 3/4, full body front; the 10 presenter poses; the face kit; three framings marked
(wide, mid, close) with where the presenter sits in a 1920 x 1080 frame for each.
```

### D6. Portrait expression kit (any story style)
```
DELIVER: 1200 x 1200 head-and-shoulders, front and 3/4; the 12 expressions and 9 mouths as layers; eyes and brows
as separate groups; two neutral listening variants (for long holds).
```

### D7. Crowd sheet (any style)
```
DELIVER: each background person as its own file, full colour and receding versions, front, 3/4 and back,
standing and seated; one assembled crowd preview of 12 people on the world's floor plane.
```

### D8. Animal model sheet
```
DELIVER: side, 3/4 and front views; a rig (head, neck, chest, hips, each leg in two parts, tail in three
segments, ears); a gait cycle (walk: 8 keys; trot or run if needed: 6 keys); sitting, lying, alert, curious,
happy (tail and ears), worried; a colour callout of fur1, fur2 and feature.
```

### D9. Mascot sheet
```
DELIVER: the three concepts first; after the choice, D1 for the chosen one, with the reaction set as poses, plus a
small version (64 px) that still reads, for corner appearances.
```

### D10. Personified object sheet
```
DELIVER per object: front and 3/4; face kit (6 expressions) placed on the face area; simple limbs as separate
groups with pivots; the object WITHOUT a face too (so the engine can show the plain object); anchors face_centre,
base and grip.
```

---

## Assembled prompts (paste after Prompt 0, Prompt 0+ and Prompt R)

### F1. Workplace cast, 2D story cartoon (pilot: Maya)
```
[Paste Prompt A0, the character bible.]
STYLE: 2D story cartoon. Contemporary editorial animation for adult story-driven training, the craft of a top
motion-design studio's character work, not a children's cartoon. About 6 heads, a slightly larger head for
expression but never wider than the shoulders; hands and feet a touch larger than life. A confident outline with
varied weight (6 px outer contour at 1080p scale, 2.5 to 3.5 px inner details, tapered ends) in
class="lm-outline". Two-tone cel shading with a crisp terminator, thin highlights (lm-hi) on hair, nose bridge,
cheekbone and fabric edges, soft occlusion where parts meet (lm-shade). Full eye construction (upper lid, iris,
pupil, catch-light), brows with thickness, a nose with a bridge and nostrils, two-shape lips.
CHARACTER: MAYA from the bible, new starter, 23. Brief: she is the learner's stand-in; the viewer must read
"anxious but trying". Curious, careful, quiet; stubborn when sure. Shape language: circles (open, friendly) with a
small triangle accent in the hair puff.
DELIVER: the full model sheet: turnaround (5 views, 1000 x 2000 each, feet on anchor_feet); rig parts with pivots
and overlapping joints (shoulder 0 to 170, elbow 0 to 150, knee 0 to 120 degrees); face kit (5 eye states, 5
brows, 9 mouths, 12 expressions); poses: standing idle, walking (4 keys), sitting typing, sitting back thinking,
pointing screen right, presenting with an open palm, reading a phone, on a call, shrugging, arms crossed, hand
on chin, worried with a hand at the neck, talking with both hands, handing over a document, leaning on a desk,
listening and nodding; the 20-pose hand kit; a colour callout.
Review her against the reject list before delivering, redraw what fails, and tell me what you changed. Do not
start the other seven until I approve Maya.
```

### F2. The same cast, flat 2D editorial
```
[Paste Prompt A0.]
STYLE: flat 2D vector, editorial, the quality of high-end magazine and corporate illustration. Natural 7 to 7.5
heads, no "corporate Memphis" distortion. No outline (or a thin same-hue line on jaw, ears and fingers only).
Three to four flat tone shapes per volume for the planes, key light top left, a cooler shade side. Small, calm,
real eyes with a catch-light; the nose as a plane change; two-shape lips. Restraint: two accents per character.
CHARACTER: [MAYA first, then the cast].
DELIVER: D1 (turnaround, rig, face kit, 12 poses for corporate explainers: standing, walking, presenting,
pointing at a screen, at a desk, in a meeting, holding a tablet, on a call, thinking, agreeing, handing over a
document, celebrating quietly), plus waist-up 3/4 versions for mid shots.
```

### F3. The same cast, 2.5D lit layers
```
[Paste Prompt A0.]
STYLE: 2.5D lit layers built on the 2D story cartoon construction: group each figure as base, shadow, light, rim.
One warm key from the side, a cool fill, cast shadows falling on clothes and face as shapes, a thin bright rim on
the far edge.
CHARACTER: MAYA, DANIEL and ELENA first.
DELIVER: per person, full body 3/4 and waist-up 3/4, in three light setups (key left, key right, backlit rim
only), plus the face kit in the same layers. These are for night-office and dawn-window scenes on a depth stage.
```

### F4. The same cast, painterly
```
[Paste Prompt A0.]
STYLE: painterly, gouache-like illustration in vector form. 6.5 to 7.5 heads. Lost and found edges shaped like
brush strokes, no uniform outline. A clear value structure (light, middle, dark masses) first, then colour with
warm light and cooler shadows. Texture only in lm-texture: vector brush marks that follow the form, sparse on
faces. Eyes clearly open with a catch-light.
CHARACTER: [the cast members this lesson needs].
DELIVER: D3 (full body and waist-up 3/4; head, arms and torso as separate groups for layer moves; 6 expressions
as head groups; 6 poses; a value callout).
```

### F5. The same cast, hand-drawn ink and wash
```
[Paste Prompt A0.]
STYLE: hand-drawn ink and wash, a skilled illustrator's sketchbook. 6 to 7 heads. Real line variation with a
slight natural wobble in lm-outline (each stroke its own path, so the engine can boil it); wash or hatching on the
shade side only in lm-shade; sparse paper fibres in lm-texture. Economical, lively faces.
CHARACTER: [cast members].
DELIVER: D1 with 10 poses; keep strokes separate from fills.
```

### F6. Isometric workplace figures
```
STYLE: true isometric figures on a 2:1 grid, 4 to 5 heads, 120 to 160 px tall at 1080p, three flat tones per
volume (top lit, left mid, right dark), optional thin outline, minimal faces.
CHARACTER: 12 workplace people from the cast and the crowd (office, warehouse, clinic, retail roles), plus 4 with
hand trucks, boxes, laptops and clipboards.
DELIVER: D4 for each (south-east and south-west, standing, walking 4 frames, sitting at a desk, carrying, pointing).
```

### F7. Travel world cast, flat 2D editorial
```
STYLE: [paste S1].
CHARACTER: the travel world cast from WORLD_PACKS.md (W2): a travel agent at a booking desk (headset, two
monitors), a contact-centre agent, an airport check-in agent and a gate agent (airline-neutral uniforms, no real
airline marks), a business traveller, a family of four with luggage, an older traveller with a walking stick, a
backpacker, a wheelchair user with assistance staff, a hotel receptionist. Brief each with C2; travellers with C15.
DELIVER: D1 for the four staff roles; D7 for travellers and crowd.
```

### F8. An animal for a wellbeing or accessibility lesson, 2D story cartoon
```
STYLE: [paste S2].
CHARACTER: [paste C8] with: a medium-sized mixed-breed office dog (wellbeing lesson): calm, curious, gentle;
short coat in two tones; digitigrade, correct muzzle and ear set; tail carriage that shows mood.
DELIVER: D8, plus three interactions with the cast (being stroked by MAYA, resting under a desk, greeting at the
door).
```

### F9. An original guide for a compliance course
```
STYLE: [paste S10], drawn in the S1 base style of the course.
CHARACTER: [paste C9] for "everyday compliance at work" (data protection, gifts, conflicts of interest).
DELIVER: D9.
```

### F10. Personified security threats, 2D story cartoon
```
STYLE: [paste S2].
CHARACTER: [paste C10] with: a phishing email (smooth, over-friendly, a hook-shaped flap), a malicious link (a
chain link with a sly grin), a weak password (flimsy paper, nervous), a strong password (solid, calm, a little
smug), a security update (a tidy box with a shield emblem, no brand).
DELIVER: D10 for each, plus a group pose: the threats sneaking toward a laptop, and the strong password blocking.
```

### F11. Cells and microbes for a hand-hygiene lesson, glow-flat
```
STYLE: [paste S8].
CHARACTER: [paste C11] with: cold virus particles (capsid with surface spikes), bacteria (rods and spheres, some
with flagella), soap molecules (a water-loving head and an oil-loving tail), skin surface as a set. Faces only on
the virus and bacteria, small and simple. Flag simplifications.
DELIVER: D10 adapted (each agent front and 3/4, 6 expressions where faces exist, a "destroyed by soap" state).
```

### F12. An AI assistant for AI-literacy lessons, flat 2D editorial
```
STYLE: [paste S1].
CHARACTER: [paste C12].
DELIVER: D1 adapted (no legs if it floats; arms optional), the 7 states, and three scenes with a person: helping
draft an email, saying it is not sure, being corrected.
```

### F13. People of a period, painterly
```
STYLE: [paste S4].
CHARACTER: [paste C13] with: a 19th-century textile mill (generic, not a real mill): a mill worker, an overseer, a
young apprentice (age 14 to 16, fully clothed, period-accurate work clothes), a factory inspector.
DELIVER: D3 for each.
```
