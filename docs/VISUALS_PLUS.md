# Beyond SVG: shaders, Skia, Three.js and Lottie (run R-12, 2026-09-30)

Loom renders in Chrome, and Chrome draws with Skia. What plain SVG could not reach was per-pixel light,
real blur and grain, 3D, and designer-made animation. Four capabilities add them. Every one of them keeps
Loom's laws:
- **Deterministic:** a frame is a function of time.
- **Token colours:** style and brand apply.
- **Proven in the motion lab** before any lesson depends on it.

| Capability | For | Where it runs | Cost |
|---|---|---|---|
| **Shader layer** (`runtime/fx.js`) | The living background of every style, film grain, vignette, light leaks; timed **moments** (a light sweep across a payoff, a spotlight that dims everything except what is taught) | In the page, WebGL, every frame | Cheap. Renders inside HyperFrames |
| **Skia clips** (`kind: "skia"`) | Hero moments: SkSL shaders, frosted glass (backdrop blur), blur-to-sharp type, blend modes, real motion blur | Offline, skia-python, to a transparent clip | Heavy (seconds per frame with motion blur in the sandbox). Stored and reused |
| **Three.js clips** (`kind: "three"`) | Real 3D: devices, systems, objects that turn to show their sides, lit by a room environment | Offline, headless Chromium, to a transparent clip | Medium. Stored and reused |
| **Lottie** (`ctx.lottie`) | Designer-made After Effects animations (icons, badges, loops) inside a scene | In the page, lottie-web SVG, seeked by the timeline | Cheap |

Skia and Three.js clips share the Manim clip machinery (`docs/MANIM.md`):
- **Reuse:** a clip is reused by the tokens it READ.
- **One store:** all clip renderers share one store.
- **Drafts:** draft clips for previews; final clips for check and render; render refuses drafts.
- **Motion blur:** real motion blur by sub-frame accumulation.
- **Resumable:** Skia frames persist in `cache/manim/partial/` until the clip is stored.

## Shader layer
- **Style packs** gain `fx`:
  ```json
  {"background": "nebula|aurora|mesh|paper|blueprint", "intensity": 1, "colors": ["accent4", "accent3", "surface"],
   "grain": 0.035, "vignette": 0.28, "leak": 0}
  ```
  A storyboard `fx` object overrides these per lesson; `"enabled": false` turns the layer off. `"drift"` (default 1)
  scales how fast the nebula clouds move; flat-cosmos uses 0.4 so a long lesson's field stays quiet (L-412).
- **Contrast is protected by construction.** The background stays within a small luminance band around the
  `field` token, so contrast proven for text on `field` still holds. HyperFrames' pixel contrast check
  backs it up.
- **Moments** come from the storyboard (`scenes[].fx: [{"kind": "light"|"spotlight", "at": "spoken words",
  "dur": 1.3, "rect": [x, y, w, h]}]`) or from a scene (`ctx.fxMoment(kind, t0, t1, rect)`). Rects are in
  station coordinates and placed with the camera.
- **Grain** is a hash of the frame index, so it moves like film and is identical on every render.

Overlays (grain, vignette, leak, moments) are drawn at a gain and shown at CSS opacity 0.58: the same pixels,
and a canvas that layout checkers read as translucent (D-68).

## Skia clips
- **Storyboard:**
  ```json
  {"kind": "skia", "skia": {"file": "scenes/b16_skia.py", "rect": [...], "params": {...},
   "motion_blur": {"samples": 4, "shutter": 0.5}}}
  ```
- **Contract:** `runtime/skia/loom_skia.py`.
  - The scene defines `frame(c, t)`.
  - Colours: `C.<token>`, `C.alpha(token, a)`, `C.rgb(token)`.
  - Timing: `ctx.cue("words")` and `*_say` params.
  - Helpers: `font(role)`, `paint(token)`, `shader(sksl, **uniforms)`, `backdrop_blur(c, rect, sigma)`,
    `spring`, `ease_out`, `progress`.
- **Fixed colours are refused** by the scenes gate: `skia.ColorWHITE`, `skia.Color(255, 0, 0)` and
  `0xFFFF0000`.
- **Install on the render machine:** `py -m pip install skia-python`.
  - On Linux without libEGL, point `LOOM_SKIA_LIBPATH` at extracted EGL libraries.
  - Windows and macOS wheels need nothing extra.
- **Example:** `scenes_examples/skia/hero_orb.py`. Run `py -m loom lab skia:hero_orb --style flat-cosmos`.

## Three.js clips
- **Storyboard:** `{"kind": "three", "three": {"file": "scenes/b11_three.js", "rect": [...], "params": {...}}}`.
- **The module:** exports `build(ctx, THREE, X)` returning `{scene, camera, update(t)}`.
  - `ctx.c(token)` is a `THREE.Color`; `ctx.hex(token)` a hex string for canvas textures.
  - `ctx.font(role)` is the style's face, loaded before build.
  - `X` provides `env` (RoomEnvironment), `RoundedBoxGeometry`, `renderer`, `W` and `H`.
- **Determinism:** no `Math.random`, `Date` or timers (the scenes gate checks) and no literal colours.
- **Example:** `scenes_examples/three/device_turn.js`. Run `py -m loom lab three:device_turn --style engineering`.

## Lottie
- **Usage:** `ctx.lottie(name, id, {x, y, w, h, at, speed, loop, colors: "auto" | {"#HEX": "token"}})`.
- **Assets:** animations live in `assets/lottie/<id>.json`. Compose bundles the ones a lesson names.
- **`"auto"` recolouring** maps the animation's distinct colours (most used first) to the style's accents,
  so a designer's file follows every style and brand.
- **Example:** `assets/lottie/check_success.json`, a CC0 animation Loom generated from code.

## Characters, depth stage, isometric kit (run R-14)
In-page, deterministic, token-coloured; API in `docs/SCENE_API.md` (Characters, depth and isometric).
Style packs `cinematic-noir` and `cinematic-dawn` pair with the depth stage. What each can and cannot do
yet: `docs/styles/WALLS_AND_NEEDS.md`.

## The reel
`py -m loom reel <spec.json> [--only N]`: a showcase cut from lab and clip scenes by the real renderers,
each segment labelled, dipped and cached by what it reads (`cache/reel/`), with a synthesised bed.
Spec: `docs/styles/reels/styles_2026-09-30.json`.

## The motion lab
- `py -m loom lab all` renders the in-page techniques in their styles.
- `py -m loom lab skia:<name>` and `three:<name>` render a clip scene's stills through its real renderer.
- All strips land in `docs/styles/demos/lab/`.
