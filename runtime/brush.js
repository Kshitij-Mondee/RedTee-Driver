/* Loom brush: real-media marks (pencil, charcoal, marker, ink, watercolour fills, hatching), BAKED (2026-10-08).
 *
 * p5.brush (MIT; the STANDALONE build, so no p5.js and no LGPL) paints each layer ONCE when the scene is built, into
 * one shared WebGL canvas, with its own seed. The result becomes an <image> in an element, multiplied onto the page
 * (white paper disappears, pigment stays), and the timeline only reveals it: a wipe in drawing order, or a fade. Each
 * frame is therefore a pure function of t, and every bake of a layer paints the same pixels (checked: same seed, same
 * data URL, across loads and across repeated bakes in one page; fills needed the shader fix below, L-304).
 *
 *   Loom.brush.paint(ctx, "map", {x, y, w, h, seed: 3, scale: 3, layers: [
 *     {at: t1, reveal: "wipe", dir: "right", dur: 0.9, draw: (b, W, H) => { b.set("2B", ctx.c("ink"), 1.4); b.line(20, 40, W - 20, 60); }},
 *     {at: t2, reveal: "fade", draw: (b) => { b.fill(ctx.c("accent"), 150); b.fillBleed(0.15); b.noStroke(); b.circle(200, 150, 90); }},
 *   ]})
 *
 * `b` is the p5.brush standalone API in the layer's local pixels (0..W, 0..H, y down): set(name, colour, weight),
 * line, rect, circle, arc, polygon, spline, beginShape/vertex/endShape, fill, fillBleed, fillTexture, noFill, hatch,
 * noHatch, noStroke, wash. Brush names: 2B, HB, 2H, cpencil, pen, rotring, spray, marker, marker2, charcoal,
 * hatch_brush. Colours: pass ctx.c("token") so a restyle restyles the marks (a hex is a scene-gate error as usual).
 * Fits light paper styles (whiteboard, hand-drawn, story-cartoon, editorial-paper); on dark fields use
 * {blend: "screen"} with light colours. Text stays SVG (kit.text), never painted.
 */
// @capability brush | drawing | Loom.brush.paint(ctx, name, {x, y, w, h, layers: [{at, reveal, draw: (b, W, H) => ...}]}) | Real-media marks | pencil, charcoal, marker and ink lines, watercolour washes and hatching that look hand-made (p5.brush), painted once and revealed in drawing order; for hand-drawn, whiteboard and paper styles
(function () {
  "use strict";
  const Loom = window.Loom;
  const B = (Loom.brush = {});
  let shared = null;   // one WebGL canvas for every bake (several contexts break p5.brush's framebuffers)
  let curScale = 1;    // the brush scale in force (scaleBrushes is cumulative)
  const MAXW = 1920, MAXH = 1080;

  function lib() { return window.brush; }

  // p5.brush's composite shader returns early for a pixel with no mask, and only then (fills only) blurs the wash's
  // edge with dFdx/dFdy of the neighbours' mask. Derivatives after a non-uniform return are undefined in GLSL: in a 2x2
  // quad on the edge, the lanes that returned hold whatever their registers held, so one seed and one call stream
  // painted 2 to 7 different fills (9 edge pixels apart) depending on the GPU's threads (L-304). The return moves after
  // the blur, so every pixel takes the derivatives; a pixel with no mask still outputs the source, as before.
  const EARLY = "if(maskColor.a==0.0){outColor=source;return;}";
  const BEFORE_MIX = "vec3 bgColor=mix(vec3(1.0),source.rgb,source.a);";
  function fixFillShader(c) {
    // the context p5.brush asks for, so its load() gets this one back with the patched shaderSource
    const gl = c.getContext("webgl2", { premultipliedAlpha: true, preserveDrawingBuffer: true });
    if (!gl) return;
    const shaderSource = gl.shaderSource;
    gl.shaderSource = function (sh, src) {
      if (typeof src === "string" && src.includes("u_mask") && /dFd[xy]\(/.test(src)) {
        if (src.includes(EARLY) && src.includes(BEFORE_MIX)) src = src.replace(EARLY, "").replace(BEFORE_MIX, EARLY + BEFORE_MIX);
        else Loom.error("brush_shader_changed", "p5.brush's fill shader no longer matches Loom's derivative fix (L-304): fills may paint differently on every load; update runtime/brush.js");
      }
      return shaderSource.call(gl, sh, src);
    };
  }

  function canvas() {
    if (shared) return shared;
    const c = document.createElement("canvas");
    c.width = MAXW; c.height = MAXH;
    fixFillShader(c);
    lib().load(c);
    shared = c;
    return c;
  }

  /** bake one layer: returns a PNG data URL of size w x h (white paper, pigment on it) */
  B.bake = function (w, h, seed, scale, draw) {
    const b = lib();
    const c = canvas();
    b.seed(seed >>> 0); b.noiseSeed(seed >>> 0);
    // scaleBrushes multiplies the brushes' current sizes: applied per bake it compounded (4.5 x 4.5 x ... turned a
    // pencil into dark discs by the fourth layer). Keep the scale in force and apply only the ratio.
    if (Math.abs(scale - curScale) > 1e-9) { b.scaleBrushes(scale / curScale); curScale = scale; }
    b.clear("#ffffff");
    // p5.brush keeps its state between calls: every layer starts clean, or one layer's fill or hatch leaks into the
    // next (seen in the first lab strip: a wash turned every later shape into a filled blob)
    for (const off of ["noFill", "noHatch", "noWash", "noField", "noClip", "noMass", "noStroke"]) {
      if (typeof b[off] === "function") { try { b[off](); } catch (e) { /* not every build has every switch */ } }
    }
    b.push();
    b.translate(-MAXW / 2, -MAXH / 2);    // p5.brush's origin is the canvas centre; layers draw from the top left
    draw(b, w, h);
    b.pop();
    b.render();
    const out = document.createElement("canvas");
    out.width = Math.ceil(w); out.height = Math.ceil(h);
    out.getContext("2d").drawImage(c, 0, 0, w, h, 0, 0, w, h);
    return out.toDataURL("image/png");
  };

  B.paint = function (ctx, name, o) {
    o = o || {};
    if (!lib()) { Loom.error("brush_missing", `${name}: p5.brush is not loaded (compose loads it when a scene calls Loom.brush)`); return null; }
    const w = Math.min(MAXW, Math.round(o.w || 800)), h = Math.min(MAXH, Math.round(o.h || 500));
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w, h, kind: o.kind || "art", exit: o.exit || "recede" });
    const seed = o.seed == null ? Loom.hash(name) : o.seed;
    const scale = o.scale || 3;
    const blend = o.blend || "multiply";
    const layers = o.layers || (o.draw ? [{ at: o.t, draw: o.draw, reveal: o.reveal }] : []);
    const beatId = ctx.beat && ctx.beat.id;
    const dflt = ctx.start + 0.2;
    layers.forEach((L, i) => {
      let url = null;
      try { url = B.bake(w, h, (seed + i * 7919) >>> 0, L.scale || scale, (b, W, H) => L.draw(b, W, H)); }
      catch (e) { Loom.error("brush_failed", `${name} layer ${i}: ${e && e.message}`); return; }
      const g = Loom.svg("g", { style: `mix-blend-mode:${L.blend || blend}` }, E.inner);
      const img = Loom.svg("image", { href: url, x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none" }, g);
      const at = L.at == null ? dflt + i * 0.6 : L.at;
      const dur = L.dur || 0.9;
      const how = L.reveal || "wipe";
      if (how === "fade") {
        Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: dur, ease: Loom.ease.enter }, at, { kind: "enter", beat: beatId, name: `${name}.${i}`, content: true });
      } else {
        // a wipe in drawing order: a clip rect that grows along `dir` (right, left, down, up)
        const id = Loom.uid("brclip");
        const defs = Loom.svg("defs", {}, E.inner);
        const cp = Loom.svg("clipPath", { id }, defs);
        const dir = L.dir || "right";
        const r = Loom.svg("rect", { x: 0, y: 0, width: w, height: h }, cp);
        img.setAttribute("clip-path", `url(#${id})`);
        const set = (p) => {
          const q = Math.max(0, Math.min(1, p));
          if (dir === "right") { r.setAttribute("x", 0); r.setAttribute("width", w * q); }
          else if (dir === "left") { r.setAttribute("x", w * (1 - q)); r.setAttribute("width", w * q); }
          else if (dir === "down") { r.setAttribute("y", 0); r.setAttribute("height", h * q); }
          else { r.setAttribute("y", h * (1 - q)); r.setAttribute("height", h * q); }
        };
        set(0);
        Loom.drive((e) => set(e), at, dur, "move", { kind: "enter", beat: beatId, name: `${name}.${i}`, key: `brush.${name}.${i}`, content: true });
      }
    });
    (Loom.report.brush = Loom.report.brush || []).push({ beat: beatId, name, layers: layers.length, w, h });
    return E;
  };
})();
