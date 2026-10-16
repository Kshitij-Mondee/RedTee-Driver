/* Loom kit: drawing primitives that obey the active style pack.
 * Every visible thing a scene makes is an ELEMENT: three nested groups
 *   outer (static placement, attr transform) -> mover (travel / continuity) -> life (low-amplitude
 *   ambient drift) -> inner (entrance / exit)
 * so a static property, a travel and an entrance never fight over one attribute
 * (lnd-visual-design s9: "put the static property on a wrapper and the animation on a child").
 */
// @capability kit_primitives | kit | kit.text, fit, rect, card, pill, disc, line, path, arrow, mark, icon, peep; row, col, split | kit | the measured drawing primitives every element uses (text fitted to real font metrics, shapes, ticks, icons, peep busts)
(function () {
  "use strict";
  const Loom = window.Loom;
  const K = (Loom.kit = {});
  const S = () => Loom.style;
  const svg = (...a) => Loom.svg(...a);

  /* ---------------- elements ---------------- */
  K.element = function (parent, name, opts) {
    opts = opts || {};
    let x = opts.x || 0, y = opts.y || 0;
    // the layout guard's planned offset (D-169), unless the caller applied it already (treat.label moves its lead too)
    const mv = !opts.layoutApplied && Loom.layout && Loom.ctxBeat ? Loom.layout.offset(Loom.ctxBeat.id, name) : null;
    if (mv) { x += mv.dx; y += mv.dy; }
    const outer = svg("g", { class: "lm-el", "data-name": name, "data-w": opts.w || 0, "data-h": opts.h || 0, "data-kind": opts.kind || "shape", transform: `translate(${x} ${y})` }, parent);
    // an overlap that is meant ({overlaps: ["table"]}: a mug on its table) and the guard's mode for this element
    if (opts.overlaps) outer.setAttribute("data-layout-with", [].concat(opts.overlaps).join(","));
    if (opts.layout) outer.setAttribute("data-layout", opts.layout);
    const mover = svg("g", { class: "lm-mv" }, outer);
    const life = svg("g", { class: "lm-life" }, mover);
    const inner = svg("g", { class: "lm-in" }, life);
    const E = {
      name, outer, mover, life, inner, x, y,
      w: opts.w || 0, h: opts.h || 0,
      kind: opts.kind || "shape",
      exit: opts.exit || null,
      order: 0, beat: Loom.ctxBeat ? Loom.ctxBeat.id : null,
      scene: Loom.ctxScene || null, revealT: null, exitT: null, claimed: false,
    };
    outer.__E = E;   // lets text helpers keep the declared box truthful (kit.kicker grows it)
    if (opts.real && Loom.obj && Loom.obj.record) Loom.obj.record(opts.real, Math.max(E.w, E.h), { hero: opts.hero, name });   // a hand-drawn object under the scale check (D-100)
    if (Loom.ctxScene) Loom.ctxScene.register(E);
    return E;
  };
  /** move an element's static placement (before the timeline plays; e.g. after measuring a block) */
  K.place = function (E, x, y) { E.x = x; E.y = y; E.outer.setAttribute("transform", `translate(${x} ${y})`); };
  /** vertically centre a stack of elements [E, height] inside [top, bottom], keeping their gaps */
  K.vcenter = function (items, top, bottom, gap, bias) {
    const total = items.reduce((a, [, h]) => a + h, 0) + gap * (items.length - 1);
    let y = top + (bottom - top - total) / 2 - (bias || 0);
    for (const [E, h] of items) { K.place(E, E.x, y); y += h + gap; }
    return total;
  };
  /** local bbox of an element in its parent's coords */
  K.bbox = function (E) { return { x: E.x, y: E.y, w: E.w, h: E.h }; };

  /* ---------------- primitive shapes (drawn into a parent node) ---------------- */

  /* object recipe and ink shades (D-90, CINEMA_PLAN B5), opt-in per call ({shade: "recipe"|"ink"}) or per pack
   * (shape.shading). recipe: edge (darkest, toward the field) -> rim (brightest) -> body -> a flat light pool up-left
   * -> a white gloss arc. ink: a flat fill and a dark ink outline (the paper "lesson" look). Light never rotates
   * with the object: the pool and the gloss stay up-left. */
  function recipeCols(fill) {
    const field = S().c("field");
    return { edge: S().mix(fill, field, 0.6), rim: S().lighten(fill, 0.45), body: fill, light: S().lighten(fill, 0.16) };
  }
  function recipeDisc(g, cx, cy, r, fill, o) {
    const c = recipeCols(fill);
    svg("circle", { cx, cy, r, fill: c.edge, opacity: o.opacity }, g);
    svg("circle", { cx, cy, r: r * 0.935, fill: c.rim, opacity: o.opacity }, g);
    svg("circle", { cx, cy, r: r * 0.8, fill: c.body, opacity: o.opacity }, g);
    svg("circle", { cx: cx - r * 0.16, cy: cy - r * 0.2, r: r * 0.58 * 0.8, fill: c.light, opacity: o.opacity }, g);
    const a0 = 198 * Math.PI / 180, a1 = 248 * Math.PI / 180, R = r * 0.6;
    svg("path", { d: `M${(cx + R * Math.cos(a0)).toFixed(1)} ${(cy + R * Math.sin(a0)).toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${(cx + R * Math.cos(a1)).toFixed(1)} ${(cy + R * Math.sin(a1)).toFixed(1)}`,
      fill: "none", stroke: "#FFFFFF", "stroke-width": (r * 0.075).toFixed(1), "stroke-linecap": "round", opacity: 0.32 }, g);
    return g;
  }
  function recipeRect(g, x, y, w, h, r, fill, o) {
    const c = recipeCols(fill), m = Math.min(w, h);
    const ins = (k) => ({ x: x + m * k, y: y + m * k, width: Math.max(0, w - 2 * m * k), height: Math.max(0, h - 2 * m * k), rx: Math.max(0, r - m * k) });
    svg("rect", Object.assign(ins(0), { fill: c.edge, opacity: o.opacity }), g);
    svg("rect", Object.assign(ins(0.035), { fill: c.rim, opacity: o.opacity }), g);
    svg("rect", Object.assign(ins(0.1), { fill: c.body, opacity: o.opacity }), g);
    const L = ins(0.16);
    svg("rect", { x: L.x, y: L.y, width: L.width * 0.62, height: L.height * 0.48, rx: L.rx, fill: c.light, opacity: o.opacity }, g);
    if (w > 40 && h > 40) svg("path", { d: `M${(x + m * 0.2).toFixed(1)} ${(y + m * 0.42).toFixed(1)}Q${(x + m * 0.2).toFixed(1)} ${(y + m * 0.2).toFixed(1)} ${(x + m * 0.42).toFixed(1)} ${(y + m * 0.2).toFixed(1)}`,
      fill: "none", stroke: "#FFFFFF", "stroke-width": (m * 0.05).toFixed(1), "stroke-linecap": "round", opacity: 0.32 }, g);
    return g;
  }
  K.rect = function (p, x, y, w, h, o) {
    o = o || {};
    const sh = S().pack.shape;
    const r = o.r != null ? o.r : sh.radius;
    const fill = o.fill === "none" ? "none" : S().c(o.fill || "surface");
    if (fill !== "none" && w >= 40 && h >= 40) { const R = (Loom.report.radii = Loom.report.radii || {}), kk = r >= Math.min(w, h) / 2 - 0.5 ? "pill" : String(Math.round(r)); R[kk] = (R[kk] || 0) + 1; }   // the "one radius everywhere" tell (D-85)
    const g = svg("g", {}, p);
    const mode = o.shade || sh.shading;
    if (mode === "recipe" && fill !== "none" && !o.flat && !o.crisp) return recipeRect(g, x, y, w, h, r, fill, o);
    if (mode === "ink" && fill !== "none") {
      svg("rect", { x, y, width: w, height: h, rx: r, fill, stroke: S().c(o.stroke || "ink"), "stroke-width": o.sw || Math.max(4, sh.stroke), "stroke-linejoin": "round", opacity: o.opacity }, g);
      return g;
    }
    if (sh.shading === "sketch" && !o.crisp) return K.sketch(g, "rectangle", [x, y, w, h], Object.assign({}, o, { r }));
    if (sh.shading === "line" && !o.crisp) return K.lineShape(g, "rect", { x, y, w, h, r }, o);
    if (o.shadow !== false && sh.shadow === "offset" && fill !== "none")
      svg("rect", { x: x + (sh.shadow_dx || 0), y: y + (sh.shadow_dy || 10), width: w, height: h, rx: r, fill: S().c("shadow"), opacity: sh.shadow_opacity || 0.35, class: "lm-shadow" }, g);
    const toon = sh.shading === "toon" && !o.crisp;   // toon: flat fill, one crisp cel shade, a dark outline around everything
    if (toon && fill !== "none" && !o.flat) {
      const id = "lmt" + (clipN++);
      const cp = svg("clipPath", { id }, g); svg("rect", { x, y, width: w, height: h, rx: r }, cp);
      svg("rect", { x, y, width: w, height: h, rx: r, fill }, g);
      svg("rect", { x, y: y + h - Math.min(h * 0.22, 26), width: w, height: Math.min(h * 0.22, 26), fill: S().darken(fill, 0.13), "clip-path": `url(#${id})` }, g);
      svg("rect", { x, y, width: w, height: h, rx: r, fill: "none", stroke: S().c(o.stroke || sh.outline || "ink"), "stroke-width": o.sw || sh.stroke, "stroke-linejoin": "round", opacity: o.opacity }, g);
      return g;
    }
    // gloss (glow-flat, D-78): no outline; a darker inner band at the bottom, one soft highlight strip at the top and
    // a light rim, so a flat shape reads as a lit volume (seen on every object in the newer Kurzgesagt frames)
    if (sh.shading === "gloss" && !o.crisp && fill !== "none" && !o.flat) {
      const id = "lmg" + (clipN++);
      const cp = svg("clipPath", { id }, g); svg("rect", { x, y, width: w, height: h, rx: r }, cp);
      svg("rect", { x, y, width: w, height: h, rx: r, fill, opacity: o.opacity }, g);
      const band = Math.min(h * 0.24, 24);
      svg("rect", { x, y: y + h - band, width: w, height: band, fill: S().shadeTo(fill, 0.2), "clip-path": `url(#${id})`, opacity: o.opacity }, g);
      if (h > 24 && w > 24 && h < 220) svg("rect", { x: x + Math.min(r, w * 0.2) * 0.7, y: y + Math.max(4, h * 0.07), width: Math.max(0, w - Math.min(r, w * 0.2) * 1.4), height: Math.min(h * 0.1, 10), rx: Math.min(h * 0.05, 5), fill: "#FFFFFF", opacity: 0.16 }, g);
      svg("rect", { x: x + 1, y: y + 1, width: w - 2, height: h - 2, rx: r, fill: "none", stroke: o.stroke ? S().c(o.stroke) : S().lighten(fill, 0.35), "stroke-width": o.stroke ? (o.sw || sh.stroke) : 2, opacity: o.stroke ? 1 : 0.45 }, g);
      return g;
    }
    svg("rect", { x, y, width: w, height: h, rx: r, fill, stroke: o.stroke ? S().c(o.stroke) : (toon && fill !== "none" ? S().c(sh.outline || "ink") : "none"), "stroke-width": o.sw || sh.stroke, opacity: o.opacity }, g);
    if (sh.shading === "crescent" && fill !== "none" && !o.flat)
      svg("rect", { x, y: y + h - Math.min(h * 0.18, 18), width: w, height: Math.min(h * 0.18, 18), rx: Math.min(r, h * 0.09), fill: S().darken(fill, 0.16), opacity: 0.55 }, g);
    if (sh.shading === "paper" && fill !== "none" && !o.flat)
      svg("rect", { x: x + 0.5, y: y + 0.5, width: w - 1, height: h - 1, rx: r, fill: "none", stroke: S().darken(fill, 0.22), "stroke-width": 2, opacity: 0.6 }, g);
    return g;
  };
  K.card = function (p, x, y, w, h, o) {
    // in a lesson with a design seed, a card takes the seed's panel treatment (text-safe subset, D-82); no seed: as before
    if (Loom.treat && Loom.treat.seed() && !(o && o.classic)) return Loom.treat.surfaceShape(p, x, y, w, h, Object.assign({ fill: "surface" }, o));
    return K.rect(p, x, y, w, h, Object.assign({ fill: "surface" }, o));
  };

  let clipN = 0;
  /** Flat disc with the style's shading model (crescent = Kurzgesagt-like lower shade + highlight). */
  K.disc = function (p, cx, cy, r, o) {
    o = o || {};
    const sh = S().pack.shape;
    const fill = o.fill === "none" ? "none" : S().c(o.fill || "surface");
    const g = svg("g", {}, p);
    const mode = o.shade || sh.shading;
    if (mode === "recipe" && fill !== "none" && !o.flat && !o.crisp) return recipeDisc(g, cx, cy, r, fill, o);
    if (mode === "ink" && fill !== "none") {
      svg("circle", { cx, cy, r, fill, stroke: S().c(o.stroke || "ink"), "stroke-width": o.sw || Math.max(4, sh.stroke), opacity: o.opacity }, g);
      return g;
    }
    if (sh.shading === "sketch" && !o.crisp) return K.sketch(g, "circle", [cx, cy, r * 2], o);
    if (sh.shading === "line" && !o.crisp) return K.lineShape(g, "circle", { cx, cy, r }, o);
    if (sh.shadow === "offset" && o.shadow !== false)
      svg("circle", { cx: cx + (sh.shadow_dx || 0), cy: cy + (sh.shadow_dy || 10) * 0.8, r, fill: S().c("shadow"), opacity: sh.shadow_opacity || 0.35, class: "lm-shadow" }, g);
    if (sh.shading === "toon" && !o.crisp && fill !== "none") {
      const id = "lmt" + (clipN++);
      const cp = svg("clipPath", { id }, g); svg("circle", { cx, cy, r }, cp);
      svg("circle", { cx, cy, r, fill }, g);
      if (!o.flat) svg("circle", { cx: cx + r * 0.42, cy: cy + r * 0.3, r: r * 0.86, fill: S().darken(fill, 0.13), "clip-path": `url(#${id})` }, g);
      if (!o.flat) svg("circle", { cx: cx - r * 0.08, cy: cy - r * 0.06, r: r * 0.86, fill, "clip-path": `url(#${id})` }, g);
      svg("circle", { cx, cy, r, fill: "none", stroke: S().c(o.stroke || sh.outline || "ink"), "stroke-width": o.sw || sh.stroke }, g);
      return g;
    }
    if (sh.shading === "gloss" && !o.crisp && fill !== "none" && !o.flat) {
      // gloss (D-78): lower-right shade crescent, one bright highlight up-left, a small catch-light, no outline
      const id = "lmg" + (clipN++);
      const cp = svg("clipPath", { id }, g); svg("circle", { cx, cy, r }, cp);
      svg("circle", { cx, cy, r, fill: S().shadeTo(fill, 0.24), opacity: o.opacity }, g);
      svg("circle", { cx: cx - r * 0.1, cy: cy - r * 0.12, r: r * 0.92, fill, "clip-path": `url(#${id})`, opacity: o.opacity }, g);
      svg("ellipse", { cx: cx - r * 0.38, cy: cy - r * 0.42, rx: r * 0.26, ry: r * 0.15, fill: "#FFFFFF", opacity: 0.42, transform: `rotate(-35 ${cx - r * 0.38} ${cy - r * 0.42})` }, g);
      svg("circle", { cx: cx - r * 0.1, cy: cy - r * 0.56, r: r * 0.06, fill: "#FFFFFF", opacity: 0.6 }, g);
      if (o.stroke) svg("circle", { cx, cy, r, fill: "none", stroke: S().c(o.stroke), "stroke-width": o.sw || sh.stroke }, g);
      return g;
    }
    svg("circle", { cx, cy, r, fill, stroke: o.stroke ? S().c(o.stroke) : "none", "stroke-width": o.sw || sh.stroke }, g);
    if (sh.shading === "crescent" && !o.flat && fill !== "none") {
      const id = "lmc" + (clipN++);
      const cp = svg("clipPath", { id }, g); svg("circle", { cx, cy, r }, cp);
      svg("circle", { cx, cy: cy + r * 0.24, r: r * 1.02, fill: S().darken(fill, 0.2), "clip-path": `url(#${id})`, opacity: 0.5 }, g);
      svg("circle", { cx, cy: cy - r * 0.08, r: r * 0.9, fill, "clip-path": `url(#${id})` }, g);
      svg("ellipse", { cx: cx - r * 0.36, cy: cy - r * 0.46, rx: r * 0.17, ry: r * 0.09, fill: "#FFFFFF", opacity: 0.2, transform: `rotate(-30 ${cx - r * 0.36} ${cy - r * 0.46})` }, g);
    }
    if (sh.shading === "paper" && !o.flat && fill !== "none") svg("circle", { cx, cy, r: r - 1, fill: "none", stroke: S().darken(fill, 0.22), "stroke-width": 2, opacity: 0.6 }, g);
    return g;
  };
  K.line = function (p, x1, y1, x2, y2, o) {
    o = o || {};
    if (S().pack.shape.shading === "sketch" && !o.crisp) return K.sketch(svg("g", {}, p), "line", [x1, y1, x2, y2], Object.assign({ fill: "none" }, o));
    return svg("line", { x1, y1, x2, y2, stroke: S().c(o.stroke || "line"), "stroke-width": o.sw || S().pack.shape.stroke, "stroke-linecap": "round", "stroke-dasharray": o.dash, opacity: o.opacity }, p);
  };
  K.path = function (p, d, o) {
    o = o || {};
    return svg("path", { d, fill: o.fill ? S().c(o.fill) : "none", stroke: o.stroke === "none" ? "none" : S().c(o.stroke || "line"), "stroke-width": o.sw || S().pack.shape.stroke, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": o.dash, opacity: o.opacity }, p);
  };
  /** Arrow from a to b; optional bend (perpendicular offset of the control point). Returns {path, head, len}. */
  K.arrow = function (p, x1, y1, x2, y2, o) {
    o = o || {};
    const bend = o.bend || 0;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / L) * bend, cy = my + (dx / L) * bend;
    const hs = o.head || 16 + S().pack.shape.stroke * 2;
    // stop the shaft short of the tip so the head is crisp
    const tx = x2 - (x2 - cx) / Math.hypot(x2 - cx, y2 - cy) * hs * 0.6, ty = y2 - (y2 - cy) / Math.hypot(x2 - cx, y2 - cy) * hs * 0.6;
    const d = bend ? `M${x1} ${y1} Q${cx} ${cy} ${tx} ${ty}` : `M${x1} ${y1} L${tx} ${ty}`;
    const g = svg("g", {}, p);
    const ang = Math.atan2(y2 - cy, x2 - cx);
    const a1 = ang + Math.PI * 0.82, a2 = ang - Math.PI * 0.82;
    if (S().pack.shape.shading === "sketch" && !o.crisp) {
      // a marker arrow (whiteboard guide s15, 2026-10-08): the shaft is a rough stroke and the head two open strokes,
      // never a filled crisp triangle; still {g, path, head}, so m.draw(arrow) draws the shaft and lands the head
      const sw = o.sw || S().pack.shape.stroke + 1, st = o.stroke || "line";
      const sg = svg("g", { class: "lm-arrow-shaft" }, g), hg = svg("g", { class: "lm-arrow-head" }, g);
      K.sketch(sg, "path", [`M${x1} ${y1} ${bend ? `Q${cx} ${cy} ${x2} ${y2}` : `L${x2} ${y2}`}`], { fill: "none", stroke: st, sw });
      K.sketch(hg, "line", [x2, y2, x2 + Math.cos(a1) * hs, y2 + Math.sin(a1) * hs], { fill: "none", stroke: st, sw });
      K.sketch(hg, "line", [x2, y2, x2 + Math.cos(a2) * hs, y2 + Math.sin(a2) * hs], { fill: "none", stroke: st, sw });
      return { g, path: sg, head: hg };
    }
    const path = K.path(g, d, { stroke: o.stroke || "line", sw: o.sw || S().pack.shape.stroke + 1 });
    const head = svg("path", { d: `M${x2} ${y2} L${x2 + Math.cos(a1) * hs} ${y2 + Math.sin(a1) * hs} L${x2 + Math.cos(a2) * hs} ${y2 + Math.sin(a2) * hs} Z`, fill: S().c(o.stroke || "line"), "stroke-linejoin": "round" }, g);
    return { g, path, head };
  };
  K.polygon = function (p, pts, o) {
    o = o || {};
    if (S().pack.shape.shading === "line" && !o.crisp && o.fill !== "none") {   // line art: colour lives in the outline
      const tok = o.fill || "surface";
      return svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill: S().c(LINE_NEUTRAL[tok] ? tok : "field"), stroke: S().c(o.stroke || (LINE_NEUTRAL[tok] ? "ink" : tok)), "stroke-width": o.sw || S().pack.shape.stroke, "stroke-linejoin": "round", opacity: o.opacity }, p);
    }
    const toonP = S().pack.shape.shading === "toon" && !o.crisp && o.fill !== "none";
    return svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill: S().c(o.fill || "surface"), stroke: o.stroke ? S().c(o.stroke) : (toonP ? S().c(S().pack.shape.outline || "ink") : "none"),
      "stroke-width": o.sw || (toonP ? S().pack.shape.stroke : 0), "stroke-linejoin": "round", opacity: o.opacity }, p);
  };
  K.recipe = { disc: (p, cx, cy, r, o) => K.disc(p, cx, cy, r, Object.assign({}, o, { shade: "recipe" })), rect: (p, x, y, w, h, o) => K.rect(p, x, y, w, h, Object.assign({}, o, { shade: "recipe" })) };
  K.pill = function (p, x, y, w, h, o) { return K.rect(p, x, y, w, h, Object.assign({ r: h / 2 }, o)); };

  /** Tick / cross marks (meaning never by colour alone: the SHAPE differs too). */
  K.mark = function (p, kind, cx, cy, size, o) {
    // in a lesson with a design seed, a tick or cross takes the seed's mark treatment (D-82); no seed: as before
    if (Loom.treat && Loom.treat.seed() && !(o && o.classic) && Loom.treat.pick("mark") !== "disc") return Loom.treat.markShape(p, kind === "yes", cx, cy, size, o && o.fill, o);
    return K.markClassic(p, kind, cx, cy, size, o);
  };
  K.markClassic = function (p, kind, cx, cy, size, o) {
    o = o || {};
    const g = svg("g", {}, p);
    const col = S().c(o.fill || (kind === "yes" ? "pos" : "neg"));
    K.disc(g, cx, cy, size / 2, { fill: o.fill || (kind === "yes" ? "pos" : "neg"), shadow: false });
    const on = S().on(o.fill || (kind === "yes" ? "pos" : "neg"));
    const s = size * 0.22;
    if (kind === "yes") svg("path", { d: `M${cx - s} ${cy} L${cx - s * 0.2} ${cy + s * 0.8} L${cx + s * 1.1} ${cy - s * 0.8}`, fill: "none", stroke: on, "stroke-width": size * 0.11, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    else svg("path", { d: `M${cx - s} ${cy - s} L${cx + s} ${cy + s} M${cx + s} ${cy - s} L${cx - s} ${cy + s}`, fill: "none", stroke: on, "stroke-width": size * 0.11, "stroke-linecap": "round" }, g);
    void col;
    return g;
  };

  /* ---------------- line mode (monoline illustration) ----------------
   * Every shape is ONE even-weight outline; colour lives in the line, never in the fill. The inside is the
   * field (or the surface, for cards), so text on any shape reads as ink. A coloured fill token becomes the
   * outline colour; a neutral fill keeps an ink outline. */
  const LINE_NEUTRAL = { surface: 1, surface2: 1, field: 1, field2: 1 };
  K.lineShape = function (g, kind, a, o) {
    o = o || {};
    const sh = S().pack.shape;
    const tok = o.fill || "surface";
    const hollow = tok === "none";
    const stroke = o.stroke && o.stroke !== "none" ? o.stroke : (hollow || LINE_NEUTRAL[tok] ? "ink" : tok);
    const inside = hollow ? "none" : S().c(LINE_NEUTRAL[tok] ? tok : "field");
    const attrs = { fill: inside, stroke: S().c(stroke), "stroke-width": o.sw || sh.stroke, "stroke-linejoin": "round", opacity: o.opacity };
    if (kind === "rect") svg("rect", Object.assign({ x: a.x, y: a.y, width: a.w, height: a.h, rx: a.r }, attrs), g);
    else svg("circle", Object.assign({ cx: a.cx, cy: a.cy, r: a.r }, attrs), g);
    return g;
  };

  /* ---------------- sketch mode (rough.js, seeded => deterministic) ---------------- */
  K.sketch = function (g, shape, args, o) {
    o = o || {};
    const sk = S().pack.shape.sketch || {};
    // In a non-sketch style a scene's direct kit.sketch() call draws the SAME shape with the crisp primitives,
    // so a bespoke scene written for the whiteboard look restyles without edits (L-55)
    if (S().pack.shape.shading !== "sketch") {
      const [a0, a1, a2, a3] = args;
      if (S().pack.shape.shading === "line" && shape === "rectangle") return K.lineShape(g, "rect", { x: a0, y: a1, w: a2, h: a3, r: S().pack.shape.radius }, o);
      if (S().pack.shape.shading === "line" && shape === "circle") return K.lineShape(g, "circle", { cx: a0, cy: a1, r: a2 / 2 }, o);
      if (shape === "rectangle") return K.rect(g, a0, a1, a2, a3, Object.assign({}, o, { crisp: true, shadow: false, stroke: o.stroke || "ink" }));
      if (shape === "circle") return K.disc(g, a0, a1, a2 / 2, Object.assign({}, o, { crisp: true, shadow: false, flat: true, stroke: o.stroke || "ink" }));
      if (shape === "line") { svg("line", { x1: a0, y1: a1, x2: a2, y2: a3, stroke: S().c(o.stroke || "ink"), "stroke-width": o.sw || S().pack.shape.stroke, "stroke-linecap": "round" }, g); return g; }
      if (shape === "path") { svg("path", { d: a0, fill: o.fill && o.fill !== "none" ? (S().pack.shape.shading === "line" ? S().c("field") : S().c(o.fill)) : "none", stroke: S().c(o.stroke || "ink"), "stroke-width": o.sw || S().pack.shape.stroke, "stroke-linejoin": "round" }, g); return g; }
      return g;
    }
    if (!window.rough) { Loom.error("rough_missing", "sketch style requires roughjs"); return g; }
    const gen = window.rough.generator();
    const seed = (Loom.hash(shape + args.join(",")) % 2147483646) + 1;
    let fillTok = o.fill === "none" ? null : (o.fill || "surface");
    let fillStyle = sk.fillStyle || "hachure";
    // a dark fill (ink, line, shadow) hachured edge to edge buries whatever sits on it: a marker artist
    // outlines those shapes instead, so they become a paper-filled outline in the fill's colour
    if (fillTok && S().contrast(S().c(fillTok), S().c("field")) >= 7) { if (!o.stroke) o = Object.assign({}, o, { stroke: fillTok }); fillTok = "surface"; fillStyle = "solid"; }
    const fill = fillTok ? S().c(fillTok) : undefined;
    const opts = {
      seed, roughness: sk.roughness || 1.1, bowing: sk.bowing || 1, stroke: S().c(o.stroke || "ink"),
      strokeWidth: o.sw || S().pack.shape.stroke, fill, fillStyle, fillWeight: sk.fillWeight || 1.6, hachureGap: sk.hachureGap || 9,
      hachureAngle: sk.hachureAngle || -41, disableMultiStroke: !!sk.single,
    };
    let dr;
    // a rect with a radius keeps its shape (pills, the quiz pause box, rounded cards): a rough PATH with arcs, not a
    // square rough rectangle (whiteboard guide s15, 2026-10-08)
    const rr = shape === "rectangle" ? Math.max(0, Math.min(+(o.r || 0), args[2] / 2, args[3] / 2)) : 0;
    if (shape === "rectangle" && rr > 0) {
      const [rx0, ry0, rw0, rh0] = args;
      dr = gen.path(`M${rx0 + rr} ${ry0} H${rx0 + rw0 - rr} A${rr} ${rr} 0 0 1 ${rx0 + rw0} ${ry0 + rr} V${ry0 + rh0 - rr} A${rr} ${rr} 0 0 1 ${rx0 + rw0 - rr} ${ry0 + rh0} H${rx0 + rr} A${rr} ${rr} 0 0 1 ${rx0} ${ry0 + rh0 - rr} V${ry0 + rr} A${rr} ${rr} 0 0 1 ${rx0 + rr} ${ry0} Z`, opts);
    } else if (shape === "rectangle") dr = gen.rectangle(args[0], args[1], args[2], args[3], opts);
    else if (shape === "circle") dr = gen.circle(args[0], args[1], args[2], opts);
    else if (shape === "line") dr = gen.line(args[0], args[1], args[2], args[3], opts);
    else if (shape === "path") dr = gen.path(args[0], opts);
    else dr = gen.rectangle(0, 0, 10, 10, opts);
    const fo = sk.fillOpacity == null ? 1 : sk.fillOpacity;
    const sets = dr.sets || [];
    gen.toPaths(dr).forEach((pi, i) => {
      const isFill = sets[i] && (sets[i].type === "fillSketch" || sets[i].type === "fillPath");
      // data-set tells m.draw which paths are the outline and which the fill set (it draws outlines first)
      svg("path", { d: pi.d, stroke: pi.stroke, "stroke-width": pi.strokeWidth, fill: pi.fill || "none", "stroke-linecap": "round", opacity: isFill && fillStyle !== "solid" && fo < 1 ? fo : null, "data-set": isFill ? "fill" : "stroke" }, g);
    });
    return g;
  };

  /* ---------------- text with REAL metrics ---------------- */
  const ctx2d = document.createElement("canvas").getContext("2d");
  function fontStr(role, size, weight) {
    const f = S().font(role);
    const want = weight || (role === "display" || role === "title" || role === "hero" ? f.weights[f.weights.length - 1] : f.weights[Math.min(1, f.weights.length - 1)]);
    const w = S().loadedWeight(f.family, +want);   // measured and drawn at a weight the pack really loaded
    return { css: `${w} ${size}px "${f.family}"`, family: f.family, weight: w };
  }
  /** The weight kit.text really draws `role` at for a requested weight (or the role's default). */
  K.weightOf = function (role, weight) { return fontStr(role, 10, weight).weight; };
  /** Tracking ("0.2em" / "3px" / number of px) -> extra px added after EVERY character, as SVG/CSS do. */
  function trackPx(tracking, size) {
    if (tracking == null || tracking === "") return 0;
    const m = String(tracking).match(/^(-?[\d.]+)(em|px)?$/);
    if (!m) return 0;
    return m[2] === "em" ? parseFloat(m[1]) * size : parseFloat(m[1]);
  }
  /** Width of one line with REAL font metrics (canvas measureText on the loaded face), including tracking.
   *  Tracking used to be ignored here, so tracked kickers were measured narrower than they render (L-48). */
  K.measure = function (str, role, size, weight, tracking) {
    ctx2d.font = fontStr(role, size, weight).css;
    return ctx2d.measureText(str).width + trackPx(tracking, size) * Array.from(String(str)).length;
  };
  /** Vertical metrics of the face at this size (font-box ascent/descent from the loaded font). */
  K.vmetrics = function (role, size, weight) {
    ctx2d.font = fontStr(role, size, weight).css;
    const m = ctx2d.measureText("Hg");
    const asc = m.fontBoundingBoxAscent || size * 0.8, desc = m.fontBoundingBoxDescent || size * 0.2;
    return { ascent: asc, descent: desc };
  };
  function wrap(str, role, size, weight, maxW, tracking) {
    const words = String(str).split(/\s+/).filter(Boolean);
    const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (K.measure(t, role, size, weight, tracking) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  /**
   * Fit text into a box: the largest size in the role's range whose wrapped lines fit
   * (width, height, maxLines). Never goes below the role's floor; if it cannot fit at the floor,
   * that is recorded as an ERROR (the check stage fails the build) - never silently shrunk further.
   * opts: {role, x, y, w, h, align:left|center|right, valign:top|middle|bottom, maxLines, color, weight, lh}
   */
  /* In sketch shading a fill is hachure over the paper, so a knockout colour (text meant to sit on a
     solid dark fill) lands on paper and vanishes. Same rule as Loom.style.on: in sketch, text is ink. */
  const KNOCKOUT = { field: 1, field2: 1, surface: 1, surface2: 1, onAccent: 1 };
  function textToken(tok) {
    tok = tok || "ink";
    if (S().outlined() && KNOCKOUT[tok]) return "ink";
    return tok;
  }
  /** Height a block of n lines really occupies: n line boxes, or more when the face's own ascent+descent
   *  is taller than one line box (handwriting faces are). */
  function blockHeight(n, role, size, weight, lhF) {
    const v = K.vmetrics(role, size, weight);
    return (n - 1) * size * lhF + Math.max(size * lhF, v.ascent + v.descent);
  }
  /** Baseline of line i, placed like CSS: half the leading above and below the face's ascent+descent.
   *  (It used to be a fixed 0.8 x size, which put tall faces 4-17px above their box: L-49.) */
  function baseline(i, role, size, weight, lhF) {
    const v = K.vmetrics(role, size, weight), L = size * lhF, content = v.ascent + v.descent;
    return i * L + Math.max(0, (L - content) / 2) + v.ascent;
  }
  /** The shape a text sits ON: the smallest earlier sibling (card, pill, bubble, disc) in the same group whose box
   *  contains the text's centre and is bigger than the text. Offset shadows are ignored. null if there is none. */
  function containerOf(p, t, b) {
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const cands = [];
    for (const n of Array.from(p.children || [])) {
      if (n === t) break;                       // only shapes drawn BEFORE the text can be under it
      const tag = n.tagName;
      if (!/^(g|rect|path|circle|ellipse|polygon)$/.test(tag) || (n.classList && (n.classList.contains("lm-shadow") || n.classList.contains("lm-el") || n.classList.contains("lm-texture")))) continue;   // a paper texture is not a container (groupthink b04, 2026-10-06)
      let bb = null;
      try {
        if (tag === "g") {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const c of Array.from(n.children)) {
            if (c.tagName === "text" || (c.classList && c.classList.contains("lm-shadow"))) continue;
            const q = c.getBBox(); if (!q.width || !q.height) continue;
            x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x + q.width); y1 = Math.max(y1, q.y + q.height);
          }
          if (isFinite(x0)) bb = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        } else { const q = n.getBBox(); bb = { x: q.x, y: q.y, w: q.width, h: q.height }; }
        // a transform offset (a shadow drawn as translate(0 12)) moves the box the text is measured against
        const tr = n.transform && n.transform.baseVal && n.transform.baseVal.consolidate();
        if (bb && tr && tr.matrix.a === 1 && tr.matrix.b === 0 && tr.matrix.c === 0 && tr.matrix.d === 1) { bb.x += tr.matrix.e; bb.y += tr.matrix.f; }   // a pure translation only
      } catch (e) { bb = null; }
      if (bb) cands.push({ n, tag, bb });
    }
    // a drop shadow need not be classed: a shape with a same-size twin drawn after it, offset by up to 16 px, is the twin's
    // shadow (gps-position's chip: an unclassed shadow rect 8 px lower was taken as the pill, so its text read -0.5 px from the
    // "edge", and widening the pill could not help, L-410)
    const isShadow = (i) => cands.slice(i + 1).some((o) => Math.abs(o.bb.w - cands[i].bb.w) <= 1 && Math.abs(o.bb.h - cands[i].bb.h) <= 1
      && Math.abs(o.bb.x - cands[i].bb.x) <= 16 && Math.abs(o.bb.y - cands[i].bb.y) <= 16 && (o.bb.x !== cands[i].bb.x || o.bb.y !== cands[i].bb.y));
    let best = null;
    cands.forEach((c, i) => {
      const bb = c.bb;
      if (bb.w < b.width || bb.h < b.height * 0.9) return;
      if (cx < bb.x || cx > bb.x + bb.w || cy < bb.y || cy > bb.y + bb.h) return;
      if (isShadow(i)) return;
      if (!best || bb.w * bb.h < best.w * best.h) best = Object.assign({}, bb, { tag: c.tag === "circle" || c.tag === "ellipse" ? "disc" : "shape",
        desc: `${c.tag} at ${Math.round(bb.x)},${Math.round(bb.y)} ${Math.round(bb.w)}x${Math.round(bb.h)}` });
    });
    return best;
  }
  /** Pure measurement (draws nothing): the size, lines and block height kit.text WOULD use for this box.
   *  Use it to size a container to its words BEFORE drawing the container ("measure, then draw"):
   *    const f = kit.fit(label, { role: "body", w: 360, maxLines: 3 });  const h = f.height + 2 * inset; */
  K.fit = function (str, o) {
    o = o || {};
    const role = o.role || "body";
    const range = S().pack.type[role];
    const [lo, hi] = range || [28, 36];
    const maxW = o.w || 800, maxH = o.h || 100000, maxLines = o.maxLines || 3;
    const lhF = o.lh || (role === "display" || role === "title" || role === "hero" ? 1.12 : 1.36);
    let size = Math.max(lo, Math.min(hi, o.size || hi)), lines = null, fitted = false, widest = 0;
    for (; size >= lo; size -= 1) {
      lines = wrap(str, role, size, o.weight, maxW, o.tracking);
      widest = Math.max(...lines.map((l) => K.measure(l, role, size, o.weight, o.tracking)));
      if (lines.length <= maxLines && blockHeight(lines.length, role, size, o.weight, lhF) <= maxH + 0.5 && widest <= maxW + 0.5) { fitted = true; break; }
    }
    if (!fitted) { size = lo; lines = wrap(str, role, size, o.weight, maxW, o.tracking); widest = Math.max(...lines.map((l) => K.measure(l, role, size, o.weight, o.tracking))); }
    return { size, lines, width: widest, height: blockHeight(lines.length, role, size, o.weight, lhF), fitted, floor: lo, lh: lhF, role };
  };
  K.text = function (p, str, o) {
    o = o || {};
    const role = o.role || "body";
    const range = S().pack.type[role];
    if (!range) Loom.error("unknown_type_role", role);
    const [lo] = range || [28, 36];
    const maxW = o.w || 800, maxH = o.h || 1000;
    if (o.size && o.size < lo) Loom.warn("size_below_floor", `${role} asked for ${o.size}px; the floor is ${lo}px, so it starts there`);
    // a requested size below the floor used to skip the fitting loop entirely and report an overflow
    let F = K.fit(str, Object.assign({}, o, { w: maxW, h: maxH }));
    let boxY = o.y || 0, boxH = maxH;
    // the layout guard (D-169, on per lesson): words that fit the width at the floor but not the box's height (a "?" or
    // "Weigh." at a 68 to 72 px title floor in a box drawn for a smaller size: 20 of the five-style test's overflows) get a
    // taller box, grown about its vertical alignment. Never smaller type (RedTee's rule too). The checks after drawing
    // (spill, inset, off its card, outside its element) still judge the grown box, so a growth that does not fit its card
    // is still an error. {strictBox: true} keeps the box as given
    if (!F.fitted && Loom.layout && Loom.layout.on && !o.strictBox) {
      const G = K.fit(str, Object.assign({}, o, { w: maxW, h: 1e5, size: lo }));
      if (G.fitted && G.height > maxH) {
        const grow = G.height - maxH;
        boxY -= o.valign === "middle" ? grow / 2 : o.valign === "bottom" ? grow : 0;
        boxH = G.height; F = G;
        // drawn straight into an element: its declared box grows with it, as kit.kicker's does (L-50)
        const el = p && p.classList && p.classList.contains("lm-in") && p.closest ? p.closest("g.lm-el") : null;
        if (el && el.__E) {
          const E = el.__E;
          if (boxY < 0) boxY = Math.max(0, o.y || 0);   // never above the element's own top: it grows down instead
          if (E.h < boxY + boxH) { E.h = boxY + boxH; el.setAttribute("data-h", E.h); }
        }
        Loom.warn("text_box_grown", `the box of "${String(str).slice(0, 40)}" was ${Math.round(maxH)} px tall; the ${role} floor (${lo}px) needs ${Math.round(G.height)} px, so it was grown (D-169)`, { beat: Loom.ctxBeat && Loom.ctxBeat.id });
      }
    }
    const size = F.size, lines = F.lines, fitted = F.fitted, lhF = F.lh;
    if (!fitted) Loom.error("text_overflow", `text does not fit at the ${role} floor (${lo}px): "${String(str).slice(0, 60)}"`, { beat: Loom.ctxBeat && Loom.ctxBeat.id });
    const fs = fontStr(role, size, o.weight);
    const align = o.align || "left";
    const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
    const bx = o.x || 0, by = boxY;
    const tx = align === "center" ? bx + maxW / 2 : align === "right" ? bx + maxW : bx;
    const blockH = F.height;
    const vy = o.valign === "middle" ? by + (boxH - blockH) / 2 : o.valign === "bottom" ? by + boxH - blockH : by;
    const t = svg("text", { x: tx, y: vy, "font-family": fs.family, "font-weight": fs.weight, "font-size": size, fill: S().c(textToken(o.color)), "text-anchor": anchor, "letter-spacing": o.tracking }, p);
    lines.forEach((ln, i) => { svg("tspan", { x: tx, y: vy + baseline(i, role, size, o.weight, lhF) }, t, ln); });
    const width = F.width;
    const info = { beat: Loom.ctxBeat && Loom.ctxBeat.id, role, size, lines: lines.length, text: String(str).slice(0, 400), w: width, h: blockH, floor: lo,
                   box: { x: bx, y: by, w: maxW, h: boxH } };
    // MEASURED containment (not the formula): the glyphs the browser actually laid out must sit inside the
    // box the caller gave. Catches font ascent/descent the 0.8/lh formula does not model, and tracking.
    if (fitted && t.getBBox) {
      try {
        const b = t.getBBox();
        if (b.width > 0) {
          const out = { left: bx - b.x, right: b.x + b.width - (bx + maxW), top: by - b.y, bottom: b.y + b.height - (by + boxH) };
          info.drawn = { x: b.x, y: b.y, w: b.width, h: b.height };
          // horizontal tolerance: canvas measureText and SVG layout differ by sub-pixel positioning (<1% of a line)
          const tolX = Math.max(2, 0.008 * b.width);
          const worst = Object.entries(out).filter(([k, v]) => v > (k === "left" || k === "right" ? tolX : 2)).map(([k, v]) => `${k} ${v.toFixed(0)}px`);
          if (worst.length) Loom.error("text_spill", `drawn text leaves its box (${worst.join(", ")}): "${String(str).slice(0, 50)}"`, { beat: Loom.ctxBeat && Loom.ctxBeat.id });
          // ...and inside the ELEMENT it belongs to, when drawn straight into that element (its local box 0..w, 0..h):
          // an element box and its text box that disagree is how b13's term overflowed after a half-applied fix (L-50)
          const el = p && p.classList && p.classList.contains("lm-in") ? p.closest && p.closest("g.lm-el") : null;
          const ew = el ? +el.getAttribute("data-w") : 0, eh = el ? +el.getAttribute("data-h") : 0;
          // ...and inside the CONTAINER it sits on (the card, pill or bubble drawn before it in the same group),
          // with breathing room: inset >= max(6px, 0.2 x size), measured to the font box. This is the check the "text touching the card
          // edge" defect needed (L-51); it measures the real shapes, not the numbers the author typed.
          const cont = containerOf(p, t, b);
          // a single glyph centred in a shape (a letter, a "?", a numeral) is judged by eye, not by its font box
          if (cont && String(str).trim().length > 3) {
            const inset = Math.min(b.x - cont.x, b.y - cont.y, cont.x + cont.w - (b.x + b.width), cont.y + cont.h - (b.y + b.height));
            const need = Math.max(6, 0.2 * size);
            info.container = { x: cont.x, y: cont.y, w: cont.w, h: cont.h, inset: Math.round(inset * 10) / 10, need };
            if (inset < need) Loom.error("tight_inset", `text sits ${inset.toFixed(1)}px from the edge of its ${cont.tag} (needs ${need.toFixed(1)}px; measured against the ${cont.desc}): "${String(str).slice(0, 50)}"`, { beat: Loom.ctxBeat && Loom.ctxBeat.id });
          }
          if (el && ew >= 20 && eh >= 20) {
            const eo = { left: -b.x, right: b.x + b.width - ew, top: -b.y, bottom: b.y + b.height - eh };
            const ebad = Object.entries(eo).filter(([k, v]) => v > (k === "left" || k === "right" ? tolX : 2)).map(([k, v]) => `${k} ${v.toFixed(0)}px`);
            info.element = { name: el.getAttribute("data-name"), w: ew, h: eh };
            if (ebad.length) Loom.error("text_outside_element", `text leaves element "${el.getAttribute("data-name")}" (${ebad.join(", ")}): "${String(str).slice(0, 50)}"`, { beat: Loom.ctxBeat && Loom.ctxBeat.id });
          }
        }
      } catch (e) { /* not in the DOM yet: nothing to measure */ }
    }
    Loom.report.texts.push(info);
    t.__fit = { size, lines, width, height: blockH, x: align === "center" ? tx - width / 2 : align === "right" ? tx - width : tx, y: vy };
    return t;
  };
  /** A short kicker in caps with tracking (<=4 words, per lnd-visual-design s5). */
  K.kicker = function (p, str, o) {
    if (String(str).split(/\s+/).length > 4) Loom.warn("kicker_too_long", "kickers are <=4 words: " + str);
    o = Object.assign({ role: "label", tracking: "0.2em", maxLines: 1, color: S().role("kicker", "accent2") }, o);
    // a one-line kicker box must hold one line at the role floor (styles with a 28px+ label floor overflowed a 36px box)
    const fl = (S().pack.type[o.role] || [28])[0];
    const vm = K.vmetrics(o.role, fl, o.weight);
    if (o.h != null) o.h = Math.max(o.h, Math.ceil(Math.max(fl * 1.36, vm.ascent + vm.descent)) + 1);
    // drawn straight into an element: grow the element's declared box too, so the two never disagree (L-50)
    const el = p && p.classList && p.classList.contains("lm-in") && p.closest ? p.closest("g.lm-el") : null;
    if (el && el.__E && o.h != null && el.__E.h < (o.y || 0) + o.h) { el.__E.h = (o.y || 0) + o.h; el.setAttribute("data-h", el.__E.h); }
    return K.text(p, String(str).toUpperCase(), o);
  };

  /* ---------------- icons (Lucide, ISC) ---------------- */
  K.icon = function (p, name, o) {
    o = o || {};
    const body = (Loom.assets.icons || {})[name];
    const size = o.size || 64;
    const g = svg("g", { transform: `translate(${(o.x || 0) - size / 2} ${(o.y || 0) - size / 2}) scale(${size / 24})`, fill: "none", stroke: S().c(o.color || "ink"), "stroke-width": o.stroke || S().pack.icons.stroke, "stroke-linecap": "round", "stroke-linejoin": "round" }, p);
    if (!body) { Loom.error("icon_missing", "icon not bundled: " + name); return g; }
    g.innerHTML = body;
    return g;
  };

  /* ---------------- characters (Open Peeps busts, CC0) ---------------- */
  K.peep = function (p, member, emotion, o) {
    o = o || {};
    const key = `${member}.${emotion || "neutral"}`;
    const body = (Loom.assets.peeps || {})[key];
    const size = o.size || 320;
    const vb = 704;
    const ch = S().pack.characters;
    const slot = {
      ink: S().c(ch.ink || "field"), skin: ch.skin[(o.skin || 0) % ch.skin.length], cloth: S().c(o.cloth || ch.cloth || "accent"),
      hair: S().c(o.hair || ch.hair || "ink"), paper: S().c(ch.paper || "ink"), mouth: S().c(ch.mouth || "neg"),
    };
    const flip = o.flip ? ` translate(${size} 0) scale(-1 1)` : "";
    const g = svg("g", { transform: `translate(${(o.x || 0) - size / 2} ${(o.y || 0) - size / 2})${flip} scale(${size / vb})` }, p);
    if (!body) { Loom.error("peep_missing", "character not bundled: " + key); return g; }
    const uidp = Loom.uid("pp");
    g.innerHTML = body.replace(/\{\{(\w+)\}\}/g, (m, k) => slot[k] || "#888").replace(/id="viewboxMask"/g, `id="${uidp}"`).replace(/url\(#viewboxMask\)/g, `url(#${uidp})`);
    return g;
  };

  /* ---------------- layout helpers (12-col grid, 96px margins) ---------------- */
  K.SAFE = { x: 96, y: 84, w: 1920 - 192, h: 1080 - 84 - 150 }; // bottom 150px kept for captions
  K.row = function (box, n, gap) {
    gap = gap == null ? 48 : gap;
    const w = (box.w - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ x: box.x + i * (w + gap), y: box.y, w, h: box.h }));
  };
  K.col = function (box, n, gap) {
    gap = gap == null ? 32 : gap;
    const h = (box.h - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ x: box.x, y: box.y + i * (h + gap), w: box.w, h }));
  };
  K.inset = function (b, dx, dy) { dy = dy == null ? dx : dy; return { x: b.x + dx, y: b.y + dy, w: b.w - 2 * dx, h: b.h - 2 * dy }; };
  K.split = function (box, frac, gap) { gap = gap || 48; const w1 = (box.w - gap) * frac; return [{ x: box.x, y: box.y, w: w1, h: box.h }, { x: box.x + w1 + gap, y: box.y, w: box.w - w1 - gap, h: box.h }]; };
})();
