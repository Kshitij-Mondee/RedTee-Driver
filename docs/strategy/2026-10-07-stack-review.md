# Is Loom built the right way? A stack and architecture review (2026-10-07)

STATUS: DESIGN, REVISED 2026-10-07 after the E2 rating (`docs/research/golden/2026-10-07-e2-findings.md`): the kit drawn as SVG by Claude rated lowest (1.0), so 'kit' below means designed OUTSIDE the model (pack, illustrator, Claude Design) or image models, still untested; the editorial register (3.0) is the default until one clears 3. Claims: `docs/research/2026-10-07-claims-ledger.md`. Asked by Kshitij: "think very hard, brainstorm-loop and
feature-loop, and help me understand if whatever stack, techniques, ideas, libraries are the best way of doing
this; if not, why and what instead; look at the entire architecture and capabilities."

Builds on, and does not repeat, the visual maturity plan (D-102, `2026-10-03-visual-maturity.md`). Market facts were
searched on 2026-10-07 (sources at the end); everything about Loom was measured in the repo the same day.

## 1. What Loom is today (measured)
| Layer | What it is | Size and evidence |
|---|---|---|
| Authoring brain | 8 model stages with schemas and gates: brief, knowledge (+ skeptic), pedagogy, persona, script, storyboard (outline, then full), scenes, critic; 2 ways to run them: Cowork task files, or API agents over Anthropic, OpenAI, Gemini | `loom/` 14.6k lines of Python; 11 L&D skills plus 5 Loom skills |
| Planning by code | allocation (template, motion, avatar), design seed, cues, timings | `loom/allocate.py`, `seed.py`, `cues.py` |
| Motion and layout | one SVG world with stations and a camera, a paused GSAP timeline, measured text, joins, held elements; 17 templates, 5 blueprints, about 40 runtime modules (rigs, depth, iso, UI artefacts, data, maps, WebGL fx, Lottie) | `runtime/` 9.9k lines of JS |
| Clips | Manim (maths), skia-python (shaders, blur), Three.js (3D), each rendered to a video clip and placed | `loom/*_bridge.py` |
| Sound | Kokoro (local) narration with word timings; OpenAI and ElevenLabs adapters exist; music and effects synthesised | `loom/narrate/` |
| Render | HyperFrames: headless Chrome seeks each frame, FFmpeg encodes; deterministic | `loom/render.py` |
| Proof | runtime probe, layout and contrast check, film checks on real frames, contact sheets, render-vs-preview check, 166 tests, 244 logged learnings | `loom/qa.py`, `loom/checks/` |
| Reuse | element and whole-beat harvest with promotion rules | `loom/library.py`: **0 promoted so far** |

**The quality evidence that matters** (Kshitij's golden ratings, 1 to 5, E1 2026-10-03, one rater):
studio frames 3.77, new Loom work 2.75, **code-drawn people and places 1.93**, non-figurative Loom (UI, documents,
data, type, diagrams) 2.86. No Loom frame reached 4.

**The cost evidence** (bench 2026-10-06/07): planning a 2.7-minute lesson cost $1.24 on Anthropic before the cost
fixes; projected $2 to $3 per lesson in all (estimate, to be measured on 2026-10-08).

## 2. Brainstorm loop
**Frame.** Who: L&D teams who need many grounded, on-brand training videos. Cost to them today: Loom frames rate
about 1 point below studio work, people and places about 2 points below; a lesson costs dollars plus a person's
review time. Constraints: grounded facts, deterministic output, corporate adults, Windows, licence-clean,
runnable outside Cowork, cheap per lesson.

**Diverge (17 ideas, judged only after).**
1. Keep the stack; change only where pictures come from.
2. Move rendering to Remotion (React).
3. Move to Motion Canvas or Revideo (canvas, generator API).
4. After Effects templates filled by data (nexrender).
5. Generative video (Veo, Kling) as the main picture.
6. Generative video only for establishing shots and b-roll; Loom for everything that must be exact.
7. Style-referenced AI vector generation (for example Recraft V4 Styles SVG) as an asset source Loom animates.
8. AI raster key art split into depth layers for 2.5D parallax.
9. Designer-made Rive characters, stepped frame by frame in the page.
10. A designed style kit per register or per client (Claude Design or an illustrator), reused for a whole course.
11. A licensed avatar presenter (HeyGen, Synthesia) for talking-head beats.
12. ElevenLabs for final narration, Kokoro for drafts.
13. Inverted: drop figurative drawing and excel at the non-figurative register.
14. Library first: a curated set of polished, parameterised shots; bespoke code only by exception.
15. Course batching: one cached reading and one style kit for a whole course.
16. A stock library of finished animated shots, tagged, picked by the storyboard like stock footage.
17. Merge LLM stages to cut cost.

**Cluster by mechanism.**
- **A. Change the substrate** (2, 3, 4): render the same ideas with another engine.
- **B. Change who makes the pictures** (5, 6, 7, 8, 9, 10, 16): the art comes from designers or image models, the
  engine composes and moves it.
- **C. Narrow the scope** (13, 11): do less, better.
- **D. Reuse to cut cost and raise the floor** (14, 15, 16, 17).
- **E. Voice and presence** (12, 11).

**Stress test.**
| idea | demand | feasibility | second order | graveyard | verdict |
|---|---|---|---|---|---|
| 2 Remotion | same technique as HyperFrames (Chrome screenshots), so no quality gain | rewrite 10k lines of runtime | $100 a month minimum for 4+ people | D-1 parked it; HyperFrames is now HeyGen-backed, Apache-2.0, 33k stars, built for agents | **cut** |
| 3 Motion Canvas / Revideo | no quality gain; editor-centric | rewrite; models know HTML+CSS far better than these APIs | | | **cut** |
| 4 AE + nexrender | real designer quality | AE licence per render machine, slow, models cannot author AE projects | ties every change to a designer | | **cut as the engine**; possible for a fixed brand intro only |
| 5 Generative video as main picture | clients like cinematic | text, numbers and diagrams come out wrong; not deterministic; shot-to-shot drift | breaks rule 1 (grounding) and rule 3 (determinism) | | **cut** |
| 6 Generative b-roll only | establishing shots are where Loom is weakest | about $0.10 to $0.40 per second, so 20 s of b-roll is $2 to $8 per lesson, plus retries | needs a fixed seed cache so renders stay repeatable; uncanny people risk in corporate work | | **survives as an experiment**, not a default |
| 7 Style-referenced vector generation | directly attacks the 1.93 | about $0.05 per image; SVG in, so Loom can place, mask, recolour, parallax | generated SVG is flat paths: whole-object motion, not limbs; licence terms must be checked; a network step at authoring time (cached, so renders stay deterministic) | D-102 parked "image models" until E2 | **survives (repaired: assets are cached and licence-recorded; parts animate only where named)** |
| 10 Designed style kit | highest ceiling; Maya showed one designed asset beside code-drawn rooms reads as two languages, so a WHOLE kit is needed | intake exists (`tools/asset_intake.py`), `Loom.art` exists | human time per kit, amortised over a course | | **survives, pairs with 7** (7 fills gaps in 10's style) |
| 9 Rive characters | acting people | Rive animations can be advanced by time, so frames can be stepped; needs a designer | adds a runtime | candidate P2 since 2026-09-30 | **later** |
| 13 Non-figurative only | 2.86 is the best Loom path today | cheap | Kshitij's 5s are lit places with small people: this caps the ceiling | | **survives as a register, not the whole answer** |
| 14 Library first | consistency and cost | the harvest exists; 0 promotions so far means the flywheel is not turning | fewer bespoke scenes means fewer crashes (4 runtime crash errors across 24 Sonnet scenes, bench 151439) | | **survives** |
| 12 ElevenLabs final voice | narration quality is heard on every second | adapter already written, with timestamps | per-minute cost; voice licensing | | **survives (cheapest win)** |
| 17 Merge stages | cost | | thinner thinking, L-172 again | | **cut** (planning is the cheap part: $0.17 on Sol) |

## 3. The answer
**The stack is right where it matters for an L&D engine and wrong only in one place.**

Keep (each is the best available choice for this job, not a habit):
- **HTML, SVG and GSAP rendered by HyperFrames.** In my judgement (untested, claims ledger #6) models write web code better than other animation languages;
  seek-and-screenshot is deterministic; it is Apache-2.0 and now maintained by HeyGen for exactly this use.
  Remotion and Revideo would be the same technique at a rewrite's cost.
- **The stage graph with schemas and gates, and the grounding rules.** This is what generative video tools cannot
  do: every number traceable, the same input giving the same film.
- **Code checks on real frames** (probe, film checks, render verify): they are what found the defects of every bench run.
- **Kokoro for drafts** (free, local).

Change:
1. **Who makes the pictures.** Code drawing people and places from primitives tops out at about 2 out of 5. Make
   the art with designed kits plus style-referenced vector generation, and let Loom do what it is good at:
   composition, camera, timing, text, data and joins. This is D-102's direction; what is new since then is that
   style-locked vector generation now exists at about $0.05 an image (Recraft V4 Styles, SVG out).
2. **Library first.** The storyboard should mostly pick polished, parameterised shots, with bespoke code by
   exception. Today 0 forms have been promoted, so every lesson pays to invent its pictures again.
3. **Final voice.** Turn on the ElevenLabs adapter for final renders (A/B against Kokoro first).
4. **Freeze breadth.** Skia and Three.js clips appear in one demo lesson only (`_fxdemo`); maintain, do not grow, until the art layer is fixed.

Architecture debts found on the way (fix as you touch them):
- Two authoring paths (Cowork task files and API role cards) can drift; parity mode reads the same files, keep it so.
- How visual a lesson is depends on one score the script writer gives (L-240); the storyboard upgrade rule is a
  patch, the real fix is allocation that looks at the outline's devices too.
- The vision judge cannot gate taste (rho 0.34); keep the human look at the animatic, where a change is cheap.

## 4. Feature loop: the art layer ("Kit and fill")
**Problem (evidence).** Figurative frames rate 1.93 of 5 against 3.77 for studio frames (E1, one rater, p = 3e-5
on the figurative split). Every reviewed Loom office with a person scored 1. If nothing changes, people and places
stay the reason the films look childish, whatever the motion and pedagogy do.

**Proposed solution and flow.**
1. A person picks a register (illustrated corporate, editorial, and so on) and its **kit**: a designed set of
   backgrounds, props and a small cast in a few poses, as layered SVG with named groups and colours mapped to style
   tokens (made once, in Claude Design or by an illustrator, through `tools/asset_intake.py`).
2. The storyboard asks for pictures by **tag** (`office.desk.wide`, `person.talking.left`), never draws them.
3. A missing asset is **filled** by style-referenced vector generation from the kit's own references, cached by
   content hash with its licence and prompt recorded, then reviewed once and added to the kit.
4. Loom composes and moves: parallax planes, camera, masks, reveals, recolour by token, named parts only.
5. The golden page rates the frames; the kit is accepted when it clears the bar.

**Non-goals.** No frame-by-frame character animation (Rive later). No generated video. No new code-drawn
figurative art. No per-lesson generation at render time (renders stay offline and deterministic).

**Success metric.** On Kshitij's golden page, figurative frames made with a kit average at least 3.3 (from 1.93),
and no frame from the kit path rates 1. Measured with `py -m loom golden` on 20 new frames, same rater.

**Technical approach and key risks.**
- Touches: `Loom.art` (asset by reference), `tools/asset_intake.py`, style tokens, storyboard schema (asset tags),
  a new `loom/art_fill.py` adapter (one provider, cached).
- Riskiest: whether generated SVG holds the kit's style across 20+ assets, and whether it separates into parts.
  Mitigation: P0 measures it before anything is built.
- Licence: commercial terms of the generator must be read before any client use (not yet checked).
- Determinism: generation happens at authoring time only; the cache is part of the project.

**Phases.**
- **P0 (no new code, a few dollars): E2 as a bake-off.** One corporate beat (a manager and a colleague at a desk,
  a document between them) made four ways: today's code drawing, a Claude Design kit, style-referenced vector
  generation, AI raster with depth layers. Same motion in all four. Kshitij rates them blind on the golden page.
  Shippable alone: it decides the art source.
- **P1:** kit format plus one register kit, five shots in the library, one lesson made with it, rated.
- **P2:** the fill adapter for gaps, with cache and licence record.
- **P3:** library-first storyboard selection (pick by tag, bespoke by exception), with the share of beats served
  by the library reported per lesson.

**Open questions.**
- Which register comes first (illustrated or editorial)? Owner: Kshitij.
- Generator licence for client work. Owner: Claude reads the terms; Kshitij approves.
- Who makes the first kit (Claude Design or a paid illustrator)? Owner: Kshitij.

**Review pass.**
- *User:* does it relieve the pain? Yes if P0 shows a source above 3; if none clears it, the editorial register
  becomes the default and the figurative path waits.
- *Engineer picking this up cold:* P0 needs no code; P1 lists the files it touches.
- *Exec:* why this over the next thing? Every other improvement (pedagogy, motion, cost) lands on frames that rate
  2 because of what is drawn; this is the one lever on the measured gap.

## Sources (searched 2026-10-07)
- HyperFrames: https://silenceper.com/en/article/2026-05-02-hyperframes-html-video-rendering/ ,
  https://landscape.jimmysong.io/projects/hyperframes/ , https://www.heygen.com/research/html-to-video
- Remotion pricing: https://www.remotion.dev/docs/pricing
- Recraft V4 Styles vector: https://replicate.com/recraft-ai/recraft-v4-styles-svg ,
  https://openrouter.ai/recraft/recraft-v4-styles-vector/api
- Generative video prices: https://modelslab.com/blog/api/veo-3-1-vs-kling-3-sora-2-ai-video-api-cost-2026 ,
  https://www.cometapi.com/kling-3-0-vs-veo-3-1/
- TTS: https://www.pkgpulse.com/guides/elevenlabs-vs-openai-tts-vs-cartesia-text-to-speech-2026
- Rive bitmap rendering: https://rive.app/docs/runtimes/react/rendering-to-a-bitmap.md
