---
name: lnd-character-design
description: Design, brief, commission or review any LIVING character for a learning or explainer video - people of every age and role, background crowds, presenters, hands, animals, mascots and guides, personified objects, cells and microbes, robots and assistants, fantasy and historical figures - in any style (flat 2D vector, 2D story cartoon, 2.5D lit layers, painterly, hand-drawn ink and wash, line art, isometric, glow-flat, semi-realistic editorial, mascot, pictogram). Covers the brief, construction, faces and expression, hands, wardrobe, non-human anatomy, the rules of each style, cast variations and consistency, rig and lip-sync readiness, who draws (Claude Design first; never scene code), and the reject list. Use whenever a lesson, storyboard, scene or asset request involves a character; before writing any character prompt; when reviewing a character delivery; and whenever a figure is about to be drawn from primitives.
---

# Living characters, in any style

A character is how a learning video borrows the viewer's empathy: we watch a person make the mistake, feel the
pressure, find the fix. A weak character does not just look bad, it breaks that borrowing. This skill is how an
agent briefs, commissions, places and reviews characters so they are designed, consistent, and alive in the style
the lesson chose.

## 0. Three rules before anything

1. **Styles are never compared with each other** (Kshitij, D-122). Flat 2D, 2.5D, painterly, hand-drawn,
   isometric, editorial: each has its own purpose. A lesson that needs people gets people, in the style that suits
   it. When you test or review, you compare two versions of the SAME style (two ways to draw the same people),
   never a style against another.
2. **Characters are designed, never improvised in scene code.** Measured (Kshitij's blind ratings): people and
   rooms drawn by the engine's code rated 1.86 of 5 (E1, 14 frames); a kit drawn as SVG by Claude itself, styleframe
   first and revised twice, rated 1.0, below the engine (E2). A model writing figure shapes cannot see silhouettes
   the way a person does. So characters come from a designed kit (Claude Design first, then an illustrator or a
   licensed pack; image models only after a within-style test). Scene code places kit characters by name and
   animates them; it never builds a person, animal or creature from circles and rectangles. Pictograms for
   diagrams are the one exception, by design (section 7, pictogram).
3. **Brief before drawing.** Every character starts as a one-page brief (section 1). A prompt written without
   one produces a generic figure that could be anyone, which is exactly what reads as cheap.

## 1. The character brief (fill it before any prompt)

| field | what to write | example |
|---|---|---|
| role in the lesson | what this character DOES for the learner | "the new starter who makes the mistake we teach" |
| what the viewer must read | the one feeling or fact the character carries | "anxious but trying" |
| personality | three adjectives, then one contradiction | "curious, careful, quiet; but stubborn when sure" |
| kind of life | human, animal, creature, personified object, cell, robot | human, 23 |
| world pack | which setting she lives in (`docs/assets/WORLD_PACKS.md`) | corporate office |
| style family | from section 7, chosen for the lesson's purpose | 2D story cartoon |
| shots needed | wide (full body), mid (waist up), close (head and shoulders) | all three |
| actions | from the storyboard's beat sheet | typing, reading a phone, handing over a document, shrug |
| expressions | from the 12 (section 3) plus any special | worry, realisation, relief |
| variations | wardrobe, props, other roles from the same base | lanyard on and off; winter coat |
| constraints | brand palette, culture, accessibility, things to avoid | client palette; no religious symbols unless asked |

The brief goes at the top of the prompt (CHARACTER_PROMPTS.md, block B) and into the kit's `manifest.json`.

## 2. Construction (every style, every species)

1. **Gesture first.** Every pose starts from one line of action through the spine (a C or an S curve). A pose
   without a line of action is a mannequin.
2. **Masses and a proportion system.** Build from masses (skull and jaw, ribcage, pelvis; for animals, add the
   neck, chest barrel and haunches) joined by flexible connections. Proportions are a SYSTEM measured in heads
   and held across the whole cast (section 7 gives each style's range).
3. **Shape language carries personality.** Circles read friendly and soft, squares read stable and dependable,
   triangles read sharp, dynamic or threatening. Give each character one primary shape and a secondary one (a
   square-bodied manager with round, kind eyes). Keep the shapes legible in the silhouette.
4. **Silhouette test.** Filled black, every character must still be recognisable: height, build, hair shape and
   one signature item. Line the cast up; no two silhouettes may be interchangeable.
5. **Asymmetry and overlap.** Real bodies are not mirrored: shoulders tilt, one hand does something, hair parts
   on one side. Overlap forms (the near arm over the torso) to create depth. Avoid tangents (two edges just
   touching) and parallel limbs.
6. **Weight and balance.** The centre of gravity sits over the support (feet, chair, desk). Standing poses carry
   contrapposto unless stiffness is the point. A seated character sits INTO the chair: hips back, weight down.
7. **The three-quarter view is the workhorse.** Draw the cast in 3/4 by default (front for presenters talking to
   camera). Turnarounds (front, 3/4, side, 3/4 back, back) must agree on every landmark height.
8. **Detail hierarchy.** Face and hands first, then the silhouette and its signature props, then clothing
   structure, then texture. Detail goes where the eye should go.
9. **Readable at video size.** Check every character at 1/4 size (a wide shot): the expression and the action
   must still read. Nothing important smaller than 3 px at 1920 x 1080.

## 3. Faces and expression

- **Eyes are the character.** In every story style the eye has an open state that clearly reads as open: an
  upper lid line, a white or light area, an iris or dark shape, a catch-light. Eyes drawn as single strokes read
  as closed or sleepy (a likely reason the E2 kit failed; a hypothesis, not proven). Dot eyes belong only to
  mascots and pictograms, chosen on purpose.
- **Brows lead the emotion;** the mouth confirms it. Change the brows, the lids and the mouth corners together,
  and let one side lead (asymmetric expressions read as real, symmetric ones as masks).
- **The 12 expressions** every story character needs: neutral, listening, smile, laugh, surprise, concern, doubt,
  focus, realisation, frustration, relief, pride. Add the lesson's special ones (embarrassment, suspicion).
- **The 9 mouth shapes** for lip-sync: rest/M-B-P, A-I, E, O, U, F-V, L, W-Q, smile-talk.
- **Look at the thing.** Eye direction is the viewer's pointer: characters look at the document, the screen, the
  other person. Only a presenter looks into the camera.
- **Skin is colour, not grey.** Shade shifts hue (warm skin shades toward red-brown, cool undertones toward
  blue-violet), never toward grey. Undertones are correct for each tone. Features are drawn with respect: no
  exaggeration of any group's features, ever.
- **Age is in the structure,** not just grey hair: nasolabial lines, softer jaw, lid fold, posture, hands.

## 4. Hands, feet and props

- Hands have five fingers with knuckles and nails in every story style; mittens only in pictograms and simple
  mascots. Hands are a kit of their own (open, relaxed, point, thumb up, fist, pinch, holding phone, cup, paper,
  pen, typing, counting 1 to 5, palm up, palm out), left and right.
- Hands that hold things wrap AROUND them (fingers in front of and behind the object).
- Shoes are real types with soles; feet carry the weight the pose implies.
- Signature props belong to the character (Maya's tote, Kofi's radio) and recur across lessons.

## 5. Wardrobe follows the world

- Dress for the world pack: an office has knitwear, blazers, lanyards; a warehouse has hi-vis, boots, gloves; a
  clinic has scrubs, a badge reel; an airport has uniforms and luggage.
- Fabric behaves: knits sag and rib, blazers hold their shape, denim seams, hi-vis crinkles. Three to six fold
  lines per garment, where the body pushes or pulls the cloth.
- Uniform roles still look like individuals (hair, glasses, build, how they wear it).
- No real brands, logos or trade dress; the client's brand enters through the pack's colours only.

## 6. Living, but not human

- **Animals.** Stylise, but keep the species true: muzzle length, ear shape and set, leg joints (digitigrade dogs
  and cats walk on their toes; plantigrade bears and people on their soles), tail carriage, the way the animal
  stands and moves. Expression comes from ears, eyes, posture and tail before the mouth. Human expressions on
  animal faces only for mascots, and then consistently.
- **Mascots and guides** (any species or none). One clear shape idea, big readable features, a limited palette,
  a signature gesture, and the same appeal rules as a person. A guide must never talk down to adults: confident,
  dry, helpful, not cute for its own sake.
- **Personified objects** (a document, a laptop, a password, a virus particle). Keep the object's real shape
  readable first; put the face on its natural front (a laptop's screen, a document's upper third); limbs are
  simple and consistent across all the personified things in one lesson; the material stays the material (paper
  folds, metal reflects).
- **Cells, microbes, molecules.** Shape language and colour coding carry meaning; scientific shape is not
  negotiable (a bacterium is not a virus; a red blood cell is a biconcave disc). Add a face only when the lesson
  personifies the agent on purpose, and flag any simplification to the knowledge stage.
- **Robots and AI assistants.** Friendly and legible, never uncanny: a simple screen face or two eyes, rounded
  forms, a clear "front". Avoid realistic humanoid robots.
- **Fantasy and metaphor creatures.** Build from real anatomy blended (a bird's legs, a cat's posture) so motion
  is believable.
- **Historical and cultural figures.** Research costume, hair and setting (lnd-reference-research); generic
  people of the period, never a real named person; never a stereotype.

## 7. Style families (each has its own purpose; never ranked against each other)

| style | typical purpose | proportions | line | shading and light | faces | delivery |
|---|---|---|---|---|---|---|
| **flat 2D vector (editorial)** | corporate explainers, product and process | 7 to 7.5 heads, natural | none, or thin same-hue line on jaw and hands | 3 to 4 flat tone shapes for planes; key light top left | small but real eyes, nose bridge as a plane | SVG parts, colour slots |
| **2D story cartoon** | narrative scenarios, behaviour change | about 6 heads, slightly larger head and hands | confident outline, varied weight (6 px outer, 2.5 to 3.5 inner), tapered ends | two-tone cel with crisp terminator, thin highlights, soft occlusion | full eye construction, 12 expressions | SVG rig parts, face kit, outline layer |
| **2.5D lit layers** | cinematic moments, mood, emphasis | as the 2D style it extends | as its 2D base | separate base, shadow, light and rim layers; warm key and cool fill; cast shadows as shapes | as its 2D base | SVG layers the depth stage relights by opacity |
| **painterly / artistic** | reflective, historical, human stories | 6.5 to 7.5 heads | lost and found edges, brush-shaped contours | painted value structure, texture as a separate vector brush-mark layer, colour temperature shifts | simplified planes, expressive | SVG with an `lm-texture` layer; no raster unless agreed |
| **hand-drawn (ink and wash, sketchbook)** | thinking aloud, whiteboard, informal | 6 to 7 heads | real line variation, slight wobble, line drives everything | wash or hatching on the shade side only | economical, lively line | SVG strokes in `lm-outline`, wash in `lm-shade` |
| **line art** | technical, minimal, elegant | 7 heads | single weight or two weights, clean | none or a single tint | line only, precise | SVG strokes |
| **isometric** | systems, processes, places from above | 4 to 5 heads, small in the scene | optional thin outline | flat three-tone faces of each volume (top light, left mid, right dark) | minimal, two-dot eyes allowed at this size | SVG on a 2:1 grid, 30 degree axes |
| **glow-flat (bright science explainer)** | science, space, big ideas | round, simplified, 4 to 5 heads | none | flat shapes with a soft glow and a rim of light; dark ground | simple, large eyes; original design (no franchise likeness) | SVG with a glow layer (`lm-hi`) |
| **semi-realistic editorial portrait** | presenters, interviews, close emotional shots | natural 7.5 heads | none or hairline | tone shapes for planes, rim light, no plastic smoothness | real, specific adult faces | SVG layers; waist-up and head shots |
| **mascot / guide** | a recurring helper across a course | 2.5 to 4 heads or non-human | style of the lesson | style of the lesson | big readable features, one signature gesture | SVG rig, face kit |
| **pictogram** | inside charts and flows only | geometric | optional | one fill slot | none (by design) | SVG icons; code may draw these |

Each style's own reject list:
- **flat 2D:** a "corporate Memphis" look (tiny heads, giant limbs, flat purple people) unless the client asks for
  it; no plane changes on the face; everyone the same build.
- **story cartoon:** uniform line weight; ball head wider than the shoulders; rubber limbs with no joints;
  symmetrical stiff poses.
- **2.5D:** a lit character on an unlit set (light must agree); layers that do not register when moved.
- **painterly:** texture as noise over everything; mud (no value structure); a crisp vector face on a painted
  body.
- **hand-drawn:** a perfectly regular line pretending to be hand-made; hatching on the lit side.
- **line art:** a filled shape sneaking in; lines that do not close forms.
- **isometric:** a person not on the grid; wrong axis angles; faces too detailed for the size.
- **glow-flat:** glow on everything (only on light sources and key edges); any likeness to an existing channel's
  characters.
- **semi-realistic:** uncanny smoothness, dead eyes, over-rendered skin.
- **mascot:** cute for its own sake in an adult lesson; changing its design between lessons.
- **pictogram:** used in a story scene in place of a character.

## 8. Variations and a consistent cast

- **Variation axes:** age (22 to 65 for workplaces), build, height, skin tone and undertone, hair type and style,
  facial hair, glasses, hijab, turban or other faith dress (respectfully, accurately, when appropriate), mobility
  aids and visible disability (as ordinary, never as the point), wardrobe and role.
- **Consistency system:** one proportion grid, one line-weight rule, one shading rule, one palette logic for the
  whole cast. Test: the "family" lineup (all together, same scale) and the silhouette lineup.
- **Wardrobe swaps** keep the base body and face; a role change (Kofi in hi-vis, then in a meeting shirt) is a
  costume, not a new character.
- **Background people** are designed too, at mid detail with simplified faces, in a full and a receding (muted)
  version; never faceless blobs.
- **Names and ids** are stable across lessons (`maya`, `kofi`); the manifest holds the brief.

## 9. Ready to animate

- **Rig parts with pivots** (head, jaw, neck, upper and lower torso, upper arm, forearm, hand, thigh, shin, foot,
  hair back and front, accessories), with overlapping joints so rotation never shows a gap. Each style allows
  different motion: flat and cartoon take a full rig; painterly and 2.5D move mostly as layers (a lean, a turn of
  the head, a breath); isometric moves as whole figures with a walk cycle.
- **Face kit** as groups in head coordinates: eyes (open, half, closed, wide, squint), brows (neutral, raised,
  frown, worried, one up), the 9 mouths and 12 expressions.
- **The Loom contract** (`docs/ASSET_WISHLIST.md` Prompt 0 and Prompt R): colour slots, `lm-outline`, `lm-shade`,
  `lm-hi`, `lm-texture`; named anchors (feet, grip, seat); no baked text; one SVG per part and a `manifest.json`.
- **Intake gate:** `py tools/asset_intake.py <zip or html> --batch <name>` must exit 0 before a kit is used.

## 10. Who draws, and in what order

1. **Claude Design first.** Paste Prompt 0, Prompt R, then the assembled prompt from
   `docs/assets/CHARACTER_PROMPTS.md`. Pilot ONE character, review it (section 11), fix, and only then order the
   cast. Ask for the model sheet, not a single pose.
2. **A human illustrator or a licensed pack** when a client brand or the volume needs it; the same contract and
   intake gate.
3. **Image models** only after a within-style pairwise test shows them at least as good as the kit for that
   style (E2 variant C, not yet run).
4. **Code** draws pictograms and diagram figures only.
5. **A scene agent** places kit characters by id (`ctx.character`, `Loom.art`) and animates them. When the kit
   lacks the character or pose, it writes an asset request (brief plus the prompt id) to the storyboard's findings
   and frames the beat without improvising: hands only, over the shoulder, a silhouette against a lit window, the
   object the character is about, or a cut to the world without people. Never a figure from primitives.

## 11. Review: the quality bar (reject and redraw if any is true)

- the face could belong to any other character in the cast;
- eyes are dots or lines in a story style (they read as closed or dead);
- the head is wider than the shoulders outside the mascot style;
- hands are mittens or have fewer than four visible fingers in a story style;
- clothes have no folds, seams or structure;
- hair is one flat shape with no clumps or volume;
- the pose is symmetrical and stiff, or has no line of action;
- the character floats (no contact shadow, no weight on its support);
- light on the character disagrees with light on the set;
- at 1/4 size the action or expression no longer reads;
- it resembles an existing franchise, mascot, channel or real person;
- any group's features are exaggerated.

Then judge it the only way that counts: the person who owns the look rates it blind, against another version in
the SAME style (pairwise), never against a different style. A model's own opinion, mine included, is not that test
(L-247).

## 12. Where things are

- Prompts: `docs/assets/CHARACTER_PROMPTS.md` (style blocks, character-type blocks, assembled prompts).
- Worlds: `docs/assets/WORLD_PACKS.md` and `packs/worlds/*.json` (scenes, cast and common assets per setting).
- The contract and the first cast bible: `docs/ASSET_WISHLIST.md` (Prompt 0, Prompt R, A0 to A6).
- Intake: `tools/asset_intake.py`. Rigs in the runtime: `runtime/rig.js`, imported rigs `runtime/rigs/imported.js`.
- Evidence: E1 `docs/research/golden/2026-10-03-findings-kshitij.md`; E2 `docs/research/golden/2026-10-07-e2-findings.md`;
  decisions D-121, D-122; learnings L-247, L-248.
