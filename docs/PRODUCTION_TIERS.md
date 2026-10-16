# Production tiers: what each kind of video costs to make (D-65)

> **PARKED 2026-09-30 (D-67).** The requester: "whatever's costly and whatever's cheap we will decide with
> time. No need to mark them as anything for now." Nothing in the engine labels tiers or budgets any more;
> `py -m loom cost <id>` only reports what a plan will take to make (model tasks, clip seconds, a render
> estimate). This page is kept as the record of the idea.

Loom can make many kinds of video, from a plain policy refresher to a cinematic case study. They cost
different amounts to make, so every path is labelled. **The requester chooses the tier, and pays for what
they choose.** The engine never forces a tier. When a storyboard uses something above the chosen budget,
the storyboard gate adds a note, and the requester decides whether the learning is worth it.

- Set a budget: `py -m loom new <id> ... --production essential|standard|cinematic`, or add
  `"production"` to the storyboard.
- See what a lesson needs: `py -m loom cost <id>`. It reports:
  - the tier;
  - the beats that push it there;
  - model tasks per tier;
  - clip seconds per renderer;
  - the shader layer and the voice;
  - a render-time **estimate** built from measured rates.

## What makes a video cost more
| driver | why it costs | where it shows |
|---|---|---|
| **Build-model tasks** | each bespoke, Manim, Skia or Three.js scene is written by a build-tier model (Sonnet) and its frames reviewed; templates and blueprints are filled from the storyboard with no extra task | `model_tasks.build` |
| **Clip renders** | Skia, Three.js and Manim render offline, frame by frame, before compose | `clip_seconds` |
| **Render time** | the page renders at about real time; the shader layer forces screenshot capture and is slower; Skia is far slower | `render_minutes_estimate` |
| **Paid voice** | OpenAI or ElevenLabs are paid per character; Kokoro is local and free | `voice` |
| **Human assets** (future) | commissioned illustration kits, composed music stems, licensed 3D models: a one-off cost, then reused by every lesson in that style | not in the estimate |
| **Planning** | the plan-tier stages (brief, knowledge, pedagogy, script, storyboard) are the same for every tier | `model_tasks.plan` |

Measured rates (CPU sandbox, 2026-09-30):
- the page renders a lesson in about real time (303.8 s for the 5:04 blameless lesson, before the
  shader layer);
- Skia takes 0.7 to 3 s per frame (21 to 90 s of render per second of clip);
- Three.js takes about 8 s of render per second of clip.

Anything computed from these is an estimate, and `loom cost` says so. A GPU machine will be faster; that
has not been measured.

## The tiers
| tier | what it uses | good for | relative cost |
|---|---|---|---|
| **Essential** | templates and blueprints, the presenter, supplied screenshots or media, flat or whiteboard styles, the shader layer off or light, Kokoro voice, synthesised music and sound | policy and compliance, procedures, product updates, refreshers, micro-lessons | lowest: planning plus a normal render; no build tasks beyond persona and review |
| **Standard** | plus bespoke motion scenes, 2D characters acting a scenario, the isometric kit, the 2.5D depth stage for a hook or chapter opener, Lottie, the shader layer with light and spotlight moments | onboarding, soft skills, systems and processes, most teaching | moderate: one build task per bespoke scene; depth and fx make the render slower |
| **Cinematic** | plus Manim (maths shown as it moves), Skia hero moments, Three.js 3D objects and dioramas, the cinematic style packs, a trailer; optionally a paid voice | flagship lessons, change and vision stories, case studies, brand pieces | highest: clip renders on top of the build tasks. Still code-rendered, so no per-video studio cost |
| Commissioned art (not built) | metaphor-world illustration kits, composed music stems, licensed models | a house style that looks hand-made | a one-off asset cost per style, then reused (see `docs/styles/WALLS_AND_NEEDS.md`) |

## Where each path sits (by scene kind and feature)
| path | tier | note |
|---|---|---|
| `template`, `blueprint`, `redtee` | essential | filled from the library |
| `avatar` (presenter), `media` | essential | HeyGen avatars are not proven yet |
| `bespoke` | standard | one build task each |
| characters, iso, depth, Lottie inside a bespoke scene | standard | depth adds render time (SVG blur per frame) |
| shader layer (`fx`) | standard | slower render (L-86); set `fx: {"enabled": false}` for essential lessons |
| `manim` | cinematic | clips are reused from the shared store when the look has not changed |
| `skia` | cinematic | keep to 2 to 5 hero moments |
| `three` | cinematic | 3D where depth is the idea |
| OpenAI or ElevenLabs voice | paid on top of any tier | Kokoro is free |

## How this fits with pedagogy
The tier is a budget, not a style guide. The storyboard still starts from what the learner must be able
to do (`skills/lnd/lnd-learning-pedagogy`). The genre's storytelling dial (`packs/genres/*.md`) suggests
how much story and cinema usually helps that kind of video. A policy lesson on a cinematic budget should
still be a clear policy lesson.
