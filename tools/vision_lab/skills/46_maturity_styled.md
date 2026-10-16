# Skill: name the style, then rate how professional and clean the frame is (maturity, style-aware)

You see one still frame from an animated explainer or training video. These videos are delivered to **corporate
clients for their employees**. Every video must be **professional level and clean**, but not every video has to be
in a corporate STYLE: many different visual styles are welcome.

You answer two separate questions. Never let the first decide the second.

**The frame:**
- it is small (640 x 310) and slightly compressed;
- the bottom has been cut off the same way on every frame.

Ignore blur, compression and the crop.

## Question 1: which style is it? (`style`)
Pick the closest:
- `corporate_flat`: clean vector, flat figures and icons, brand-like colours;
- `editorial_ui`: typography-led, real interfaces, documents, layouts;
- `infographic_diagram`: diagrams, charts, maps, schematics;
- `cinematic_illustration`: painterly or lit illustration with atmosphere, light and depth;
- `cartoon_character`: character-led cartoon or comic, outlined figures;
- `isometric_3d`: isometric scenes or 3D renders;
- `whiteboard_sketch`: hand-drawn line art;
- `live_action_photo`: footage, photography, collage;
- `mixed_other`.

**No style is better or worse than another.** Cinematic is a style, not a quality level. Corporate is a style, not a
quality level. A cartoon can be excellent or bad.

## Question 2: how well does THIS frame execute ITS style? (`score`)
**One bar for every style:** could this frame go, as it is, into a professional video delivered to a corporate
client's employees?

"Clean" means **execution**: deliberate design, polish, consistency, legible type, nothing generic, cluttered or
unfinished. Clean does NOT mean plain or tidy.

**A tidy frame can still be a 1:**
- it looks like a slide: text in a box on a plain or gradient background;
- it looks like a template: stock-style figures, clip-art icons;
- it looks amateur.

**What excellent and failing look like, per style:**
| style | excellent | failing |
|---|---|---|
| corporate_flat | a designed system: strong hierarchy, considered space, consistent custom shapes, polish like a top product explainer | slide look, text boxes, stock icons, clip-art people built from default shapes, empty frame |
| editorial_ui | real typography and grid, real artefacts with real detail, depth and focus | grey placeholder bars, default fonts in boxes, a document dumped on a background |
| infographic_diagram | one clear idea, designed and finished, consistent icon language | bullet lists dressed as a diagram, clutter, mixed icon styles |
| cinematic_illustration | light, atmosphere, composed shot, coherent texture | muddy, over-busy, inconsistent; mood without clarity |
| cartoon_character | designed, appealing, consistent characters; staging; finish | default shapes, bean figures, stiff poses, babyish tone, clip-art |
| isometric_3d | clean geometry, light, a readable scene | toy-like blocks, flat untextured renders, confusing angles |
| whiteboard_sketch | confident line, clear hierarchy | scribbly, cramped, illegible |
| live_action_photo | well lit and composed, purposeful | snapshot quality, cluttered |

**The scale (the same for every style):**
| score | name | means |
|---|---|---|
| 1 | Not usable | slide-like, template or amateur; would embarrass a corporate client |
| 2 | Weak | some intent, but generic or unfinished; needs rework |
| 3 | Acceptable | clean and correct, but plain; nothing a viewer would remember |
| 4 | Professional | clearly designed and polished for its style; ready to deliver |
| 5 | Excellent | top-of-its-style craft; studio quality |

**Then fill in:**
- **`what_is_shown`:** a plain description, first.
- **`fails`:** the failure markers you see; `none` if there are none.
- **`to_reach_top`:** in one sentence, what this frame would need to reach 5 in its own style. Every frame has an answer,
  even a good one.
- **`drivers`:** up to 4, most important first.
- **`why`:** 1 to 3 sentences on VISIBLE features.
- **`confidence`:** honest.

**Rules:**
- Do not reward or punish a frame for looking like a famous channel.
- Output only the JSON object.
