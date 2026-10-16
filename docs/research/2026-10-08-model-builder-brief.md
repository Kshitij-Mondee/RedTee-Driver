# Brief for a 3D model builder (Loom Video-Engine)

You build reusable 3D models for Loom, a deterministic corporate L&D video engine. Folder: C:\Users\Admin\Desktop\Video-Engine
(in bash: /sessions/practical-funny-cannon/mnt/Video-Engine). Use `python3` in bash (not `py`).

## Read first (in this order)
1. `runtime/three/kit3d.js` in full: the toolkit every model uses (roles for colours, `mat`, `rbox`, `extrude`, `lathe`,
   `face` + `drawUI` for screens, `label` for word plates, `flow` for particles along paths, `arrow3d`, `temp` for
   cool-to-warm colour, `contactShadow`, `spring`, `progress`, `easeInOut`, `clamp`, `MOODS`).
2. Example models: `assets/models3d/phone.js`, `padlock.js`, `server_rack.js`, `desk_set.js` (composes another model with
   `await X.model("monitor", ...)`), `bar_chart.js` (labels from opts).
3. `loom/models3d.py` (the gate and the sheet renderer) and `scenes_examples/three/model_turntable.js`.
4. Your items in `docs/research/2026-10-08-topic-asset-needs.md` (section numbers given in your task): their parts, keys
   and ACCURACY NOTES are the spec. Accuracy is the point: follow the notes exactly.

## The contract (the gate `python3 -m loom models check` enforces most of it)
- One file per model: `assets/models3d/<id>.js`. Line 1 is the card, exactly: `// @model {json}` with keys `id` (= file
  name), `pack` (one of devices, security, workplace, datacentre, ai_ml, devs, email), `what`, `parts`, `keys` (each key:
  what 0..1 means; always include "turn"), `best_for`, `not_for`, `size` [w, h, d] in units (1 unit is about 10 cm for
  objects; sets may be bigger), `sheet` {opts, states [{key, from, to, at, dur} or {key, before, value, at}], optional
  `mood` (a K.MOODS id), `elevation`, `turn`, `light`}. A set (an environment of several objects) adds `"set": true`.
- `export async function make(ctx, THREE, X, opts = {})` returns `{group, size, parts, keys, set(key, value)}`. The group
  stands on y = 0, centred on x and z. `set` must be idempotent and depend only on its value (a frame is a pure function
  of time; frames are rendered in any order). Keep all state in closures, recompute from stored values.
- Colours ONLY through roles/tokens: `K.mat(ctx, THREE, role, kind, opts)`, `K.col`, `K.hexOf`, `ctx.c("token")`. Never a
  hex literal, `0x......`, or `rgba(` with literal numbers. Light colours: `ctx.neutral()`.
- No `Math.random`, `Date`, timers, `requestAnimationFrame`, `fetch`. Variation comes from index hashes, e.g.
  `((i * 7919) % 101) / 101`.
- Words: a model never invents words. Every label, value or screen text comes from `opts` (e.g. `opts.labels`, `opts.title`).
  With no words given, draw a blank plate or nothing. `fillText` of a literal string is refused by the gate.
- People and animals are never modelled (they come from character kits). No brands, logos or real product shapes.
- No em or en dashes anywhere (code comments included).
- Keep polygon counts sensible (instancing or merged geometry for repeated parts if a set has hundreds of parts).
- Do NOT edit any file other than the model files you are assigned. Never edit `runtime/three/kit3d.js`,
  `loom/*.py`, other models, docs or logs. If you need a helper, write it inside your model file and mention it in your
  report as a candidate for the kit.

## Prove it (do this for EVERY model, and iterate until it is right)
- `cd /sessions/practical-funny-cannon/mnt/Video-Engine && python3 -m loom models check`
- Render the turntable sheet in a light style and in one dark style, ONE model per bash call (a call is capped near 3
  minutes; a sheet takes 30 to 90 s; background processes are killed when a call ends):
  `export HYPERFRAMES_BROWSER_PATH=/tmp/chr/chrome.sh; timeout 170 python3 -m loom models sheet <id>` and
  `... models sheet <id> --style cinematic-noir` (or `dark-technical` or `glow-flat`).
  If the browser path is missing, recreate it:
  `mkdir -p /tmp/chr; printf '#!/bin/bash\nexec /sessions/practical-funny-cannon/tmp/chromium --single-process --no-sandbox --no-zygote --disable-setuid-sandbox --in-process-gpu --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --font-render-hinting=none --disable-features=AudioServiceOutOfProcess "$@"\n' > /tmp/chr/chrome.sh; chmod +x /tmp/chr/chrome.sh`
- LOOK at `docs/assets/models3d/<id>__<style>.jpg` with the Read tool (it shows the image). Check: the silhouette reads as
  the real thing at a glance; parts are in proportion and in the right places (accuracy notes); nothing clips or floats;
  each state in the sheet visibly changes what it should; it reads on both the light and the dark style; the camera does
  not crop it. Fix and re-render until you would show it to a design lead. Typical good result: 2 to 4 iterations.
- Choose `sheet.states` that show the model's key moments within 6 s (times 0.4, 1.4, 2.4, 3.4, 4.4, 5.6 are sampled).

## Report back (short)
Per model: id, pack, keys, what you verified by looking (which sheets), any accuracy compromise and why, helper
candidates for the kit, anything unverified. Do not write to CHANGELOG, DECISIONS or other logs (the lead does).
