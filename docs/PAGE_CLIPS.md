# Page clips: kind "page" (D-176)

The escape hatch for a beat Loom's runtime cannot draw yet: a real map, a laid-out diagram, a typeset formula,
highlighted code, a working terminal, stroke-written lettering, a morph between two shapes. The beat is any ES module
page that draws a frame for a time; it renders in headless Chromium to a transparent clip the camera carries, like the
Three.js clips.

**A clip is a sealed picture.** Its parts cannot be held into the next beat, the layout probe cannot read its words,
and a restyle re-renders it. Normal teaching beats stay `bespoke` scenes; a page clip is for what the runtime lacks.

## The storyboard
```json
{"beat": "b09", "kind": "page", "station": "board",
 "page": {"file": "scenes/b09_page.js", "rect": [160, 110, 1600, 780], "libs": ["d3", "topojson"],
          "params": {"lit": ["Brazil", "India"]}, "cues": ["the signal"], "offset": 0, "spill": 1.6}}
```
- `file` defaults to `scenes/<beat>_page.js`; `rect` is where the clip sits on the station.
- `libs` names libraries from `runtime/page/libs.json` (the storyboard gate refuses an unknown one).
- `params` reach the scene as `ctx.params`; words in them that are anchors resolve as cues. `params.code` is special:
  `{code, lang, theme}` (or a list) becomes Shiki tokens before the render (`tools/node/shiki_tokens.mjs`).
- The clip runs from the beat's start (plus `offset`) to its end plus `spill`.

## The scene
```js
export async function build(ctx, P) {
  const g = P.canvas();                         // or P.svg(), P.el(...), or a library
  return {
    render(t) {                                 // t in seconds from the clip's start; may be async
      g.clearRect(0, 0, P.w, P.h);
      g.fillStyle = ctx.c("accent");
      g.fillRect(40 + 200 * P.ease.out(P.seg(t, ctx.cue("the signal"), ctx.cue("the signal") + 0.8)), 40, 120, 120);
    },
  };
}
```
Rules (the scenes gate and the bridge lint them): a frame is a pure function of `t`: no `Math.random` (use `P.rng`),
no `Date` or `performance.now`, no timers or `requestAnimationFrame`, no network (`P.data` serves local files; any other
request fails the render). Colours are tokens (`ctx.c("accent")`); type is the style's (`P.font("display" | "body" |
"mono")`).

## The kit (runtime/page/kit.js)
| capability | library | calls |
|---|---|---|
| core | none | `P.w`, `P.h`, `P.root`, `P.params`, `P.duration`, `P.speech`, `P.cue(a)`, `P.c(token)`, `P.font(role)`, `P.seg(t, a, b)`, `P.ease.{linear,in,out,inOut}`, `P.rng(seed)`, `P.canvas()`, `P.svg()`, `P.el(tag, attrs, parent)`, `P.data(name)` |
| maps | d3, topojson (+ world-atlas, Natural Earth, public domain) | `await P.world("countries" \| "land", "110m" \| "50m" \| "10m")` -> GeoJSON; draw with `d3.geoPath(projection, canvas2d)` (a canvas captures faster than hundreds of SVG paths) |
| charts | plot (with d3) | `P.plot(spec)`: one Observable Plot per frame, sized to the clip, transparent ground |
| diagrams | dagre | `P.layout({nodes, edges, rankdir})` -> positions; `P.drawGraph(svg, layout, k, {fill, stroke, text, edge, order})` reveals nodes and arrows by k |
| formulas | katex | `P.tex(latex, {size, color, display})` -> a positioned div (use `String.raw` for the LaTeX) |
| code | none at render (Shiki before) | `P.code(ctx.params.code[0], {size})` -> `{el, show(k)}`: show(k) types the first k of the characters |
| terminal | xterm | `P.terminal({cols, rows, size, theme})` -> `{show(text)}`: the terminal after `text` (ANSI allowed), from empty, every frame |
| lettering | none (hersheytext's SVG fonts, OFL and MIT) | `await P.strokeFont("EMSReadability" \| "EMSTech" \| "HersheySans1" \| "HersheyScript1" ...)`, `P.strokeText(font, text, {size, x, y})` -> strokes in writing order, `P.drawStrokes(svg, strokes, k, {color, width})` writes them at an even pen speed |
| glyphs | opentype | `await P.glyphs(text, role, size)` -> an SVG path in the style's own face |
| morphs | paper | `P.morph(dA, dB, k)`: contours resampled and paired left to right; a missing contour grows from a point |
| also | rough, gsap, matter | hand-drawn shapes; a paused timeline seeked to t; physics stepped from 0 to t |

## Proving and rendering
- `py -m loom lab page:<name> --style <pack>` renders a capability scene from `scenes_examples/page/` as a strip
  (world_map, plot_line, flow_diagram, formula, code_typing, terminal, stroke_text, glyph_morph).
- In a lesson, compose renders page clips with the other clips (`py -m loom run <id> compose`), reusing the shared
  clip store while the scene, its timing, its libraries' versions and the colours it read are unchanged.
- Speed (2026-10-15, this PC): about 50 to 90 ms a frame for a chart, a diagram or code, about 300 ms for a detailed
  world map. Frames render in parallel, one browser per worker (`LOOM_PAGE_WORKERS`, default 4); the frames are the
  same whatever the worker count (tested).

## Adding a library
Only with Kshitij's approval (downloads need it). Add it to `package.json`, then to `runtime/page/libs.json` (its
browser files and its npm package), build a kit call around it in `runtime/page/kit.js`, a capability scene in
`scenes_examples/page/`, look at its strip, and add it to this table.
