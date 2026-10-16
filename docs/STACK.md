# The Loom stack: every library, tool and asset source, what it does, its licence, where it lives

Versions are the ones installed and verified on 2026-09-30 (`package.json`, `requirements.txt`,
`node_modules/*/package.json`, `importlib.metadata`). A new dependency is added here in the same change that
adds it (rule 9: context is managed).

## Rendering and runtime (the picture)
| What | Version | Licence | Used for | Where |
|---|---|---|---|---|
| **HyperFrames** (`hyperframes`) | 0.8.91 | Apache-2.0 | Renders the composed HTML page to MP4, frame by frame. Also `check` (layout, contrast), `snapshot` and `beats` | `loom/render.py`, `loom/qa.py`, `loom/trailer.py` |
| Chromium (chrome-headless-shell) | via HyperFrames | BSD-3 and others | The browser HyperFrames and the probes drive (`HYPERFRAMES_BROWSER_PATH` pins one) | `render.py`, `tools/node/*.mjs` |
| **GSAP** (`gsap`) | 3.15.0 | GreenSock Standard "no charge" licence (free for commercial use; not OSI) | The single paused timeline every tween lives on | `runtime/core.js` and everything built on it |
| **Rough.js** (`roughjs`) | 4.6.6 | MIT | The hand-drawn look (`shading: sketch`) | `runtime/kit.js` |
| **Three.js** (`three`) | 0.186.1 | MIT | `kind: "three"` 3D clips: devices, isometric dioramas (RoomEnvironment, RoundedBoxGeometry) | `runtime/three/render.mjs`, `loom/three_bridge.py` |
| **lottie-web** (`lottie-web`, SVG player) | 5.13.0 | MIT | `ctx.lottie`: designer-made animations seeked by the timeline | `runtime/lottie.js`, compose bundles `lottie_svg.min.js` |
| **puppeteer-core** | 24.43.1 | Apache-2.0 | Drives Chromium for the probe, the motion lab, the component sheets and the Three.js renderer | `tools/node/*.mjs`, `runtime/three/render.mjs` |
| **skia-python** | 144.0.post2 | BSD-3 | `kind: "skia"` clips: SkSL shaders, backdrop blur, blur-to-sharp type, motion blur | `runtime/skia/`, `loom/skia_bridge.py` |
| **Manim Community** (`manim`) + ManimPango | 0.19.1 / 0.6.1 | MIT | `kind: "manim"` clips: curves, functions, geometry | `runtime/manim/loom_manim.py`, `loom/manim_bridge.py` |
| WebGL (in Chromium, software GL in headless) | - | - | The shader layer: backgrounds, grain, vignette, light moments | `runtime/fx.js` |
| **FFmpeg** | 4.4+ (system) | LGPL/GPL (used as a tool, not linked) | Encoding (VP9 alpha clips, H.264 MP4), loudness (`loudnorm`), frame extraction, poster baking | everywhere media is written |

## Sound
| What | Version | Licence | Used for | Where |
|---|---|---|---|---|
| **Kokoro** (`kokoro-onnx`, model v1.0 int8) | 0.6.1 | Apache-2.0 (model weights) | Local narration (TTS) with word timings | `loom/narrate/`, `loom/setup_models.py` |
| ONNX Runtime | 1.23.2 | MIT | Runs the Kokoro model | via kokoro-onnx |
| NumPy / SciPy | 2.2.6 / 1.15.3 | BSD-3 | The synthesised music bed, the sound effects, ducking, filters | `loom/narrate/mix.py` |
| soundfile | 0.14.0 | BSD-3 | Reading and writing WAV | `loom/narrate/` |

## Content, checks and tooling
| What | Version | Licence | Used for | Where |
|---|---|---|---|---|
| Pillow | 12.3.0 | MIT-CMU | Contact sheets, lab strips, verify-render image diffs, posters | `loom/qa.py`, `loom/lab.py`, `loom/render.py` |
| jsonschema | 3.2.0 | MIT | Stage artifact schemas (brief, script, storyboard ...) | `loom/validate.py`, `loom/schemas/` |
| fontTools | 4.65.0 | MIT | WOFF to TTF for Manim and Skia text | `loom/manim_bridge.py` |
| pdfplumber / python-docx | 0.11.10 / 1.2.0 | MIT | Source mode: reading PDFs and Word files | `loom/ingest.py` |
| Python 3.10+ / Node 22+ | - | PSF / MIT | The CLI (`py -m loom`) and the JS tools | - |

## Fonts and assets
| What | Licence | Used for | Where |
|---|---|---|---|
| Fontsource: Caveat, Fraunces, Fredoka, Inter, JetBrains Mono, Nunito, Patrick Hand, Space Grotesk (5.3.0) | OFL-1.1 | Style-pack faces | `packs/styles/*.json` (`fonts.faces`) |
| **Lucide** icons (1,993) | ISC | `kit.icon` | `assets/icons/lucide.json` (generated) |
| **Open Peeps** (via @dicebear/collection) | CC0 | `kit.peep` character busts | `assets/peeps/peeps.json` (generated) |
| **Microsoft Fluent Emoji Flat** (`@iconify-json/fluent-emoji-flat` 1.2.6, 3,174 pieces) | MIT | `Loom.art` objects and props by reference (`fluent:<name>`), as made or mapped to tokens (D-88) | `node_modules/@iconify-json/fluent-emoji-flat/` (npm) |
| **Open Doodles** (Pablo Stanley, 31 pieces) | CC0 1.0 | `Loom.art` (`doodles:<name>`), sketchy people for the whiteboard and chalk registers | `assets/vendor/doodles/` (`py tools/fetch_assets.py doodles`, on the PC) |
| **Lukasz Adam free illustrations** (77 SVGs; the "premium" ones excluded) | CC0 1.0 | `Loom.art` (`lukasz:<name>`), flat scenes and people at work | `assets/vendor/lukasz/` (`py tools/fetch_assets.py lukasz`, on the PC) |
| **Kenney Furniture Kit** (isometric renders) | CC0 1.0 (credit optional) | `Loom.art` (`kenney:<name>`), isometric furniture (raster) | `assets/vendor/kenney/` (`py tools/fetch_assets.py kenney`, on the PC) |
| **Natural Earth 1:110m** countries and populated places (177 countries, 288 rings, 243 cities) | public domain | `Loom.geo.map` / `globe`: real coastlines, country floods, great-circle arcs (D-90, B4) | `assets/geo/world110m.json` (from Kshitij's explainer skill, `engine/data/world.npz`) |
| Loom's own Lottie (`check_success`) | CC0 (made by code) | Lottie example | `assets/lottie/` |
| Loom's own rigged characters, Ava and Sam (R-14) | CC0 (made by code) | `ctx.character` | `runtime/rigs/*.js` |
| Loom's style packs incl. `cinematic-noir`, `cinematic-dawn` (R-14) | Loom's own | the look | `packs/styles/*.json` |

## Loom's own tools added in R-14 (no new dependency)
| What | Uses | Where |
|---|---|---|
| Character rig, depth stage, iso kit | SVG + GSAP (existing) | `runtime/rig.js`, `runtime/depth.js`, `runtime/iso.js` |
| Animatic | Pillow + FFmpeg (existing) | `loom/story.py`, `py -m loom animatic` |
| Reel | puppeteer-core, the clip bridges, FFmpeg, NumPy (existing) | `loom/reel.py`, `py -m loom reel` |
| Palette study (research, R-18) | FFmpeg, NumPy, Pillow (existing) | `tools/palette_study.py` |
| Video study (research, R-20) | FFmpeg, NumPy, Pillow (existing) | `tools/video_study.py` |
| Explanation strips and style fingerprint (research, R-21) | FFmpeg, NumPy, Pillow (existing); tesseract was tried for on-screen text and dropped (L-119) | `tools/explain_study.py`, `tools/style_fingerprint.py` |
| Asset intake from Claude Design (R-22) | Python standard library only (zipfile, xml.etree) | `tools/asset_intake.py` |
| Lab preview without a browser (R-23) | Node (existing), CairoSVG (LGPL-3.0, already used by the research tools), fontTools (MIT, woff2 to ttf, optional) | `tools/lab_preview.py`, `tools/node/svg_preview.mjs` |
| Scenery, toon shading, outlined people (R-21) | SVG + GSAP through `kit` (existing); people drawn by code, CC0 | `runtime/scenery.js`, `runtime/kit.js`, `runtime/rigs/beans.js` |
| Transcription for study (research, R-20) | faster-whisper (MIT; the `small.en` model downloads from Hugging Face on first use) or, as a rough fallback, pocketsphinx (BSD-style); both optional, install with `py -m pip install faster-whisper` or `pocketsphinx` | `tools/transcribe_videos.py` |

## Read-only neighbours
- **RedTee_V1_Video blueprints:** read only, through `loom/redtee_bridge.py` (Loom never writes there).

## Researched and not adopted (and why)
| What | Licence | Decision |
|---|---|---|
| Remotion | source-available, company licence | Parked (D-1). HyperFrames covers it |
| Spine runtimes | every user needs a paid Spine licence | Excluded |
| Rive runtime | MIT (the editor is proprietary SaaS) | Candidate (P2): designer-authored rigs; frames by replay stepping |
| DragonBones | free, dated editor | Not needed while Loom rigs are code |
| CanvasKit (Skia WASM) | BSD-3 | Works in the page but its CPU raster is too slow for full frames; skia-python is used instead |
| pmndrs postprocessing, three-good-godrays | zlib / MIT | Candidates (P2): bloom, depth of field, SSAO and god rays in Three.js clips |
| Theatre.js | core Apache-2.0, studio AGPL | Not adopted (AGPL studio; Loom's timeline is code) |
| Blender (`bpy`) | GPL (as a tool) | Parked (P3): true cinematic 3D, heavy |
| Kenney, Quaternius, Humaaans | CC0 | Candidates: props, low-poly people, mix-and-match bodies (each download needs the requester's approval) |
| Motion Canvas, Revideo | MIT | Not needed (same job as Loom) |
