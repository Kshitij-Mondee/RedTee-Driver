/* Brush recipes (D-139): ready hand-made marks on Loom.brush (runtime/brush.js), for the topic packs in
 * docs/research/2026-10-08-topic-asset-needs.md section 11. Marks only: every word stays SVG text drawn by the scene.
 *
 * Every rect is in the SCENE's coordinates (the station, 0..1920 x 0..1080): lay the real artefact out first and pass
 * the rects of its parts, e.g. Loom.ui.at(A, "address") or Loom.ui.phrase(A, "subject", "expires today").
 *
 *   Loom.brush.redFlags(ctx, "flags", {flags: [{rect, at, kind: "pencil"|"marker"}], wash: {rect, at}, tone: "neg"})
 *   Loom.brush.markup(ctx, "review", {marks: [{rect, at, kind: "circle"|"underline"|"strike"|"bracket"|"tick", tone, side}]})
 *   Loom.brush.sketchSystem(ctx, "rag", {boxes: [{rect, at}], arrows: [{from, to, at}], tone: "ink"})
 *   Loom.brush.wash(ctx, "stress", {rect, at, colour: "accent2"})
 *
 * Each call bakes ONE Loom.brush.paint element over the union of its rects (seed: opts.seed, else the name), one layer
 * per mark. The layers fade in at their time in 0.08 s and are revealed by the recipe's own clip, which follows the
 * hand: a ring or a box is drawn AROUND from its start (a sweep about its centre), a line ALONG its direction. Each
 * clip writes its progress into the image's data-reveal (the tests read it). Every mark is painted in black on the
 * bake's white paper and an SVG colour filter turns it into the token's colour with the paper as transparency, so a
 * stroke sits ON the page in its own colour in light and dark styles alike, over words too (multiply hid a strike on
 * black letters; screen on a dark field turned the white paper white). Washes keep a blend so the words stay on top:
 * multiply on a light field, lighten on a dark one. Colours come only from ctx.c(token): redFlags `tone` (default the
 * pack's alert role, else neg), markup per kind (circle, underline, bracket accent; strike neg; tick pos), sketchSystem
 * `tone`/`arrowTone` (ink), wash `colour` (the pack's ui_mark role, else accent2). `gain` / `washGain` set the opacity.
 * redFlags `hatch`: true (short strokes across each ring's shoulder), "pennant" (a hatched flag above the ring, for
 * rings with room above) or false.
 * Returns {E, marks: [{at, end, kind}], region, dark}; arrows `from`/`to` take a box index, a rect or a point.
 */
// @capability brush_recipes | drawing | Loom.brush.redFlags, markup, sketchSystem, wash (ctx, name, opts) | Real-media marks | ready hand-made marks: pencil rings round the red flags of a real email in spoken order, a reviewer's circles, brackets and strikes over a diff or a draft, a system sketched box by box as it is named, a watercolour wash behind one phrase
(function () {
  "use strict";
  const Loom = window.Loom;
  if (!Loom || !Loom.brush) return;
  const B = Loom.brush;
  const S = () => Loom.style;
  const TAU = Math.PI * 2;

  function rgb(hex) {
    const h = String(hex || "").replace("#", "");
    return h.length >= 6 ? [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] : [0, 0, 0];
  }
  function lum(hex) { const c = rgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function isDark() { return lum(S().c("field")) < 0.45; }
  // every mark is painted in black on the white paper, and an SVG filter turns that into the token's colour with the
  // paper as transparency (alpha = 1 - red channel, inside the painted area only): a stroke then sits ON the page in
  // its own colour in any style, over words too (multiplied, a strike over black letters vanished, first markup strip;
  // screened on a dark field, the white paper went white). Washes keep a blend so the words stay above them.
  const INK = "#000000";
  function filterFor(E, cache, hex, gain) {
    gain = gain || 1;
    const key = hex + "@" + gain;
    if (cache[key]) return cache[key];
    const c = rgb(hex).map((v) => (v / 255).toFixed(4));
    const id = Loom.uid("brcol");
    const f = Loom.svg("filter", { id, x: 0, y: 0, width: 1, height: 1, "color-interpolation-filters": "sRGB" }, Loom.svg("defs", {}, E.inner));
    Loom.svg("feColorMatrix", { type: "matrix", values: `0 0 0 0 ${c[0]}  0 0 0 0 ${c[1]}  0 0 0 0 ${c[2]}  ${-gain} 0 0 ${gain} 0` }, f);
    return (cache[key] = id);
  }
  function R(r) {   // a rect from {x, y, w, h} or [x, y, w, h]
    if (Array.isArray(r)) return { x: +r[0], y: +r[1], w: +r[2], h: +r[3] };
    return { x: +r.x || 0, y: +r.y || 0, w: +r.w || 0, h: +r.h || 0 };
  }
  function region(rects, pad) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of rects) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad));
    x1 = Math.min(1920, Math.ceil(x1 + pad)); y1 = Math.min(1080, Math.ceil(y1 + pad));
    return { x: x0, y: y0, w: Math.max(8, x1 - x0), h: Math.max(8, y1 - y0) };
  }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  /* ---------------- hand geometry (layer-local pixels) ---------------- */
  /** a hand-drawn ring round a rect: starts upper left, goes clockwise, overshoots its start a little and spirals out
   *  a few per cent, so the two ends never meet in a neat join; pressure swells and tapers */
  function ringPts(r, rnd, o) {
    o = o || {};
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, n = 3;   // a superellipse: hugs a line of words closer than an ellipse
    let rx = r.w / 2 + (o.px == null ? 14 : o.px), ry = r.h / 2 + (o.py == null ? 10 : o.py);
    const k = Math.pow(Math.pow(r.w / 2 / rx, n) + Math.pow(r.h / 2 / ry, n), 1 / n);
    if (k > 0.92) { rx *= k / 0.92; ry *= k / 0.92; }   // the corners of the words stay inside the ring
    const a0 = -2.5 + (rnd() - 0.5) * 0.25, sweep = TAU + 0.45 + rnd() * 0.2, N = 72;
    const ph = rnd() * TAU, tilt = (rnd() - 0.5) * 0.03;
    const pe = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const pass = (dr, from, to, p0, p1) => {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = from + (to - from) * (i / N), a = a0 + sweep * u;
        const wob = 1 + 0.02 * Math.sin(2 * a + ph) + 0.01 * Math.sin(5 * a + ph * 2);
        const sp = 1 + 0.05 * u + dr;
        const x = pe(Math.cos(a)) * rx * wob * sp, y = pe(Math.sin(a)) * ry * wob * sp;
        pts.push([cx + x, cy + y + x * tilt, p0 + (p1 - p0) * Math.sin(Math.PI * Math.min(1, (i / N) * 1.1))]);
      }
      return pts;
    };
    const pts = pass(0, 0, 1, 0.6, 1.25);
    const at = (u, dr) => { const a = a0 + sweep * u; return [cx + pe(Math.cos(a)) * rx * (1 + 0.05 * u + (dr || 0)), cy + pe(Math.sin(a)) * ry * (1 + 0.05 * u + (dr || 0))]; };
    return { pts, again: pass(0.025, 0.05, 0.62, 0.4, 0.8), cx, cy, start: pts[0], rx: rx * 1.08, ry: ry * 1.08, at };
  }
  /** four hand strokes for a box, each a little past its corner and a little off straight */
  function boxStrokes(r, rnd) {
    const j = () => (rnd() - 0.5) * 5, ov = () => 6 + rnd() * 8;
    const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
    return [
      [[x0 - ov(), y0 + j()], [(x0 + x1) / 2, y0 + j()], [x1 + ov(), y0 + j()]],
      [[x1 + j(), y0 - ov()], [x1 + j(), (y0 + y1) / 2], [x1 + j(), y1 + ov()]],
      [[x1 + ov(), y1 + j()], [(x0 + x1) / 2, y1 + j()], [x0 - ov(), y1 + j()]],
      [[x0 + j(), y1 + ov()], [x0 + j(), (y0 + y1) / 2], [x0 + j(), y0 - ov()]],
    ];
  }
  function edgePoint(r, toward, gap) {   // where the line from a rect's centre toward a point leaves the rect
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = toward[0] - cx, dy = toward[1] - cy;
    if (!dx && !dy) return [cx, cy];
    const tx = dx ? (r.w / 2) / Math.abs(dx) : Infinity, ty = dy ? (r.h / 2) / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty), L = Math.hypot(dx, dy);
    return [cx + dx * t + (dx / L) * gap, cy + dy * t + (dy / L) * gap];
  }

  /* ---------------- the clip that follows the hand ---------------- */
  // around: a sweep about (cx, cy) from angle a0, clockwise on screen; along: a half plane whose edge moves from p0
  // along u for len. Both are polygons in layer pixels; q in 0..1.
  function sweepPath(g, q, W, H) {
    if (q <= 0) return "M0 0Z";
    if (q >= 1) return `M-10 -10H${W + 10}V${H + 10}H-10Z`;
    const Rb = Math.hypot(W, H) * 2, n = Math.max(2, Math.ceil(q * 90));
    let d = `M${g.cx.toFixed(1)} ${g.cy.toFixed(1)}`;
    for (let i = 0; i <= n; i++) {
      const a = g.a0 + q * TAU * (i / n);
      d += `L${(g.cx + Rb * Math.cos(a)).toFixed(1)} ${(g.cy + Rb * Math.sin(a)).toFixed(1)}`;
    }
    return d + "Z";
  }
  function alongPath(g, q) {
    if (q <= 0) return "M0 0Z";
    const B_ = 4000, ux = g.u[0], uy = g.u[1], nx = -uy, ny = ux;
    const s = -g.pad + q * (g.len + 2 * g.pad);
    const P = (a, b) => `${(g.p0[0] + ux * a + nx * b).toFixed(1)} ${(g.p0[1] + uy * a + ny * b).toFixed(1)}`;
    return `M${P(-B_, B_)}L${P(s, B_)}L${P(s, -B_)}L${P(-B_, -B_)}Z`;
  }
  function along(p0, p1, pad) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    return { kind: "along", p0, u: [dx / L, dy / L], len: L, pad: pad == null ? 24 : pad };
  }
  function around(cx, cy, sx, sy) { return { kind: "around", cx, cy, a0: Math.atan2(sy - cy, sx - cx) - 0.12 }; }

  /**
   * bake(ctx, name, opts, rects, marks): one Loom.brush.paint over the union of `rects` (scene coords), one layer
   * per mark: {at, dur, draw(b, ox, oy) in SCENE coords, clip: around|along geometry in SCENE coords}.
   */
  function bake(ctx, name, o, rects, marks) {
    const dark = o.dark == null ? isDark() : !!o.dark;
    const reg = region(rects, o.pad == null ? 70 : o.pad);
    const beatId = ctx.beat && ctx.beat.id;
    const layers = marks.map((m) => ({
      at: m.at, reveal: "fade", dur: 0.08, blend: m.under ? (dark ? "lighten" : "multiply") : "normal",
      draw: (b) => { b.push(); b.translate(-reg.x, -reg.y); m.draw(b); b.pop(); },
    }));
    const E = B.paint(ctx, name, { x: reg.x, y: reg.y, w: reg.w, h: reg.h, seed: o.seed, scale: o.scale || 3,
      layers, kind: o.kind || "art", exit: o.exit });
    if (!E) return null;
    const imgs = Array.from(E.inner.querySelectorAll("image"));
    if (imgs.length !== marks.length) Loom.error("brush_recipe_layers", `${name}: ${marks.length} marks but ${imgs.length} painted layers`);
    const filters = {};
    const out = [];
    marks.forEach((m, i) => {
      const img = imgs[i]; if (!img) return;
      img.setAttribute("data-mark", m.kind || "mark");
      img.setAttribute("data-at", (+m.at).toFixed(3));
      img.setAttribute("data-colour", m.colour);
      // the colour filter on a wrapper, so the reveal clip (on the image) cuts the mark before it is coloured
      const host = Loom.svg("g", { filter: `url(#${filterFor(E, filters, m.colour, m.under ? (o.washGain || (dark ? 1.6 : 1.5)) : (o.gain || 3))})` }, null);
      img.parentNode.insertBefore(host, img); host.appendChild(img);
      const g = m.clip;
      const id = Loom.uid("brrc");
      const cp = Loom.svg("clipPath", { id }, Loom.svg("defs", {}, E.inner));
      const path = Loom.svg("path", { d: "M0 0Z" }, cp);
      img.setAttribute("clip-path", `url(#${id})`);
      const loc = g.kind === "around" ? { cx: g.cx - reg.x, cy: g.cy - reg.y, a0: g.a0 }
        : { p0: [g.p0[0] - reg.x, g.p0[1] - reg.y], u: g.u, len: g.len, pad: g.pad };
      const set = (q) => {
        path.setAttribute("d", g.kind === "around" ? sweepPath(loc, q, reg.w, reg.h) : alongPath(loc, q));
        img.setAttribute("data-reveal", Math.max(0, Math.min(1, q)).toFixed(3));
      };
      set(0);
      const dur = m.dur || 0.7;
      Loom.drive((e) => set(e), m.at, dur, m.ease || "move", { kind: "enter", beat: beatId, name: `${name}.${i}`, key: `brushrecipe.${name}.${i}`, content: true });
      out.push({ at: m.at, end: m.at + dur, kind: m.kind });
    });
    (Loom.report.brush_recipes = Loom.report.brush_recipes || []).push({ beat: beatId, name, marks: out.length, dark });
    return { E, marks: out, region: reg, dark };
  }
  function seedRnd(o, name, i) { return Loom.rng(((o.seed == null ? Loom.hash(name) : o.seed) + 104729 * (i + 1)) >>> 0); }
  function times(list, fallback) {   // a missing `at` follows the previous mark by 0.9 s
    let t = fallback;
    return list.map((m) => { t = m.at == null ? t : +m.at; const r = t; t += 0.9; return r; });
  }

  /* ---------------- shared mark makers ---------------- */
  function ringMark(ctx, r, at, rnd, col, brush, weight, dur, kind, go) {
    const G = ringPts(r, rnd, go);
    return { at, dur: dur || 0.75, kind, clip: around(G.cx, G.cy, G.start[0], G.start[1]),
      draw: (b) => { b.set(brush, col, weight); b.noFill(); b.spline(G.pts, 0.6); b.spline(G.again, 0.6); }, geo: G };
  }
  /** a small hatch ON the ring's upper right shoulder: short strokes across the ring line, so the emphasis takes no room
   *  from the words around it (a pennant above the ring ran into the line above, first strip) */
  function shoulderHatch(at, G, col, brush, weight) {
    const n = 6, segs = [];
    for (let i = 0; i < n; i++) {
      const u = 0.34 + 0.16 * (i / (n - 1)), p = G.at(u), q = G.at(u + 0.006);
      const tx = q[0] - p[0], ty = q[1] - p[1], L = Math.hypot(tx, ty) || 1, nx = -ty / L, ny = tx / L;
      const d = 12, sk = 7;   // across the line, leaning with the stroke
      segs.push([[p[0] - nx * d - (tx / L) * sk, p[1] - ny * d - (ty / L) * sk], [p[0] + nx * d + (tx / L) * sk, p[1] + ny * d + (ty / L) * sk]]);
    }
    const a = segs[0][0], b2 = segs[n - 1][1];
    return { at, dur: 0.3, kind: "hatch", clip: along(a, b2, 16),
      draw: (b) => { b.set(brush, col, weight * 0.8); for (const s of segs) b.line(s[0][0], s[0][1], s[1][0], s[1][1]); }, end: b2 };
  }
  /** a small hatched pennant (a literal red flag) in the margin to the left of a ring */
  function pennantMark(at, G, col, brush, weight) {
    const foot = G.at(0.02, 0.02), hgt = 50, fw = 34, px = foot[0] - 4, py0 = foot[1], top = py0 - hgt;
    return { at, dur: 0.35, kind: "hatch", clip: along([px, py0 + 6], [px, top - 6], 14),
      draw: (b) => {
        b.set(brush, col, weight); b.noFill();
        b.line(px, py0, px, top);
        b.hatch(4, 0.9); b.polygon([[px, top], [px + fw, top + 11], [px, top + 23]]); b.noHatch();
      } };
  }
  function washMark(at, r, col, alpha, dur, kind, dark) {
    const x0 = r.x - 10, y0 = r.y - 4;
    return { at, dur: dur || 0.6, kind: kind || "wash", under: true, ease: "enter", clip: along([x0, y0 + r.h / 2 + 4], [x0 + r.w + 20, y0 + r.h / 2 + 4], 30),
      draw: (b) => { b.noStroke(); b.fill(col, alpha); b.fillBleed(0.05, "out"); b.fillTexture(0.45, 0.4, false); b.rect(x0, y0, r.w + 20, r.h + 8); } };
  }

  /* ---------------- redFlags ---------------- */
  /** pencil (or marker) rings round each flagged rect in the given order, a small hatched pennant beside each, and a
   *  final watercolour wash under the one flag the lesson stresses */
  B.redFlags = function (ctx, name, o) {
    o = o || {};
    const dark = o.dark == null ? isDark() : !!o.dark;
    const flags = (o.flags || []).map((f) => Object.assign({}, f, { rect: R(f.rect) }));
    if (!flags.length) { Loom.error("brush_recipe_empty", `${name}: redFlags needs flags: [{rect, at}]`); return null; }
    const tone = o.tone || S().role("alert", "neg");
    const col = INK, show = ctx.c(tone);
    const ts = times(flags, ctx.start + 0.3);
    const marks = [], rects = [];
    flags.forEach((f, i) => {
      const brush = f.kind === "marker" ? "marker" : "cpencil", w = f.kind === "marker" ? 0.9 : (o.weight || 1.6);
      const rnd = seedRnd(o, name, i);
      const ring = ringMark(ctx, f.rect, ts[i], rnd, col, brush, w, 0.75, "ring", { px: 10, py: 9 });
      marks.push(ring);
      if (o.hatch === "pennant") marks.push(pennantMark(ts[i] + 0.7, ring.geo, col, brush, w));
      else if (o.hatch !== false) marks.push(shoulderHatch(ts[i] + 0.7, ring.geo, col, brush, w));
      rects.push({ x: ring.geo.cx - ring.geo.rx * 1.1 - 60, y: ring.geo.cy - ring.geo.ry * 1.1 - 30, w: ring.geo.rx * 2.2 + 60, h: ring.geo.ry * 2.2 + 50 });
    });
    if (o.wash) {
      const wr = R(o.wash.rect || flags[flags.length - 1].rect);
      const wt = o.wash.at == null ? ts[ts.length - 1] + 1.2 : +o.wash.at;
      marks.push(Object.assign(washMark(wt, wr, INK, o.wash.alpha || 140, 0.7, "wash", dark), { colour: ctx.c(o.wash.colour || tone) }));
      rects.push(wr);
    }
    marks.forEach((m) => { m.colour = m.colour || show; });
    return bake(ctx, name, o, rects, marks);
  };

  /* ---------------- markup ---------------- */
  const MARK_TONE = { circle: "accent", underline: "accent", bracket: "accent", strike: "neg", tick: "pos" };
  /** a reviewer's marks on real lines: circle, underline, strike, bracket (margin, left by default), tick (margin,
   *  right by default); marker by default, `brush: "2B"` for pencil */
  B.markup = function (ctx, name, o) {
    o = o || {};
    const dark = o.dark == null ? isDark() : !!o.dark;
    const list = (o.marks || []).map((m) => Object.assign({}, m, { rect: R(m.rect) }));
    if (!list.length) { Loom.error("brush_recipe_empty", `${name}: markup needs marks: [{rect, kind, at}]`); return null; }
    const ts = times(list, ctx.start + 0.3);
    const marks = [], rects = [];
    list.forEach((m, i) => {
      const r = m.rect, rnd = seedRnd(o, name, i), kind = m.kind || "circle";
      const col = INK, show = ctx.c(m.tone || o.tone || MARK_TONE[kind] || "accent"), n0 = marks.length;
      const brush = m.brush || o.brush || "marker", w = m.weight || o.weight || (brush === "marker" || brush === "marker2" ? 1.8 : 1.5);
      const j = () => (rnd() - 0.5) * 4;
      if (kind === "circle") {
        const ring = ringMark(ctx, r, ts[i], rnd, col, brush, w, 0.7, "circle");
        marks.push(ring);
        rects.push({ x: ring.geo.cx - ring.geo.rx * 1.1, y: ring.geo.cy - ring.geo.ry * 1.1, w: ring.geo.rx * 2.2, h: ring.geo.ry * 2.2 });
      } else if (kind === "underline") {
        const y = r.y + r.h + 4, p0 = [r.x - 6, y + j()], p1 = [r.x + r.w + 8, y - 3 + j()];
        const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 3];
        marks.push({ at: ts[i], dur: 0.45, kind, clip: along(p0, p1), draw: (b) => { b.set(brush, col, w); b.spline([[...p0, 0.7], [...mid, 1.1], [...p1, 0.6]], 0.5); } });
        rects.push({ x: r.x - 10, y: y - 10, w: r.w + 20, h: 24 });
      } else if (kind === "strike") {
        const y = r.y + r.h * 0.56, p0 = [r.x - 8, y + 3 + j()], p1 = [r.x + r.w + 8, y - 3 + j()];
        marks.push({ at: ts[i], dur: 0.4, kind, clip: along(p0, p1), draw: (b) => { b.set(brush, col, w * 1.35); b.spline([[...p0, 0.8], [...p1, 0.8]], 0); } });   // over the letters: heavier
        rects.push({ x: r.x - 12, y: y - 12, w: r.w + 24, h: 24 });
      } else if (kind === "bracket") {
        const right = m.side === "right", d = right ? 1 : -1, xe = right ? r.x + r.w + 14 : r.x - 14, xb = xe + d * 14;
        const pts = [[xe, r.y - 4, 0.6], [xb, r.y + 6, 1], [xb + j() * 0.3, r.y + r.h / 2, 1], [xb, r.y + r.h - 6, 1], [xe, r.y + r.h + 4, 0.6]];
        marks.push({ at: ts[i], dur: 0.45, kind, clip: along([xb, r.y - 6], [xb, r.y + r.h + 6], 12), draw: (b) => { b.set(brush, col, w); b.spline(pts, 0.35); } });
        rects.push({ x: Math.min(xe, xb) - 10, y: r.y - 10, w: 34, h: r.h + 20 });
      } else if (kind === "tick") {
        const s = Math.max(22, Math.min(44, r.h * 0.9)), left = m.side === "left";
        const x0 = left ? r.x - 22 - s * 1.2 : r.x + r.w + 22, cy = r.y + r.h / 2;
        const a = [x0, cy], b0 = [x0 + s * 0.38, cy + s * 0.42], c = [x0 + s * 1.15, cy - s * 0.55];
        marks.push({ at: ts[i], dur: 0.35, kind, clip: along([x0 - 4, cy], [x0 + s * 1.2, cy], 8),
          draw: (b) => { b.set(brush, col, w * 1.2); b.spline([[...a, 0.7], [...b0, 1.1], [...c, 0.5]], 0); } });
        rects.push({ x: x0 - 10, y: cy - s, w: s * 1.4, h: s * 2 });
      } else {
        Loom.warn("brush_markup_kind", `${name}: unknown mark kind ${kind} (circle, underline, strike, bracket, tick)`);
      }
      for (let k = n0; k < marks.length; k++) marks[k].colour = show;
    });
    return bake(ctx, name, o, rects, marks);
  };

  /* ---------------- sketchSystem ---------------- */
  /** boxes drawn in pencil one by one as each is named, then arrows between them; the labels stay the scene's SVG text */
  B.sketchSystem = function (ctx, name, o) {
    o = o || {};
    const dark = o.dark == null ? isDark() : !!o.dark;
    const boxes = (o.boxes || []).map((b) => Object.assign({}, b, { rect: R(b.rect) }));
    if (!boxes.length) { Loom.error("brush_recipe_empty", `${name}: sketchSystem needs boxes: [{rect, at}]`); return null; }
    const col = INK, acol = INK, show = ctx.c(o.tone || "ink"), ashow = ctx.c(o.arrowTone || o.tone || "ink");
    const bts = times(boxes, ctx.start + 0.3);
    const marks = [], rects = [];
    boxes.forEach((bx, i) => {
      const r = bx.rect, rnd = seedRnd(o, name, i), st = boxStrokes(r, rnd);
      marks.push({ at: bts[i], dur: bx.dur || 0.8, kind: "box", colour: show, clip: around(r.x + r.w / 2, r.y + r.h / 2, r.x - 6, r.y),
        draw: (b) => { b.set(o.brush || "cpencil", col, o.weight || 2.2); b.noFill(); for (const s of st) b.spline(s.map((p, k) => [p[0], p[1], k === 1 ? 1.05 : 0.75]), 0.4); } });
      rects.push(r);
    });
    const pt = (v) => (typeof v === "number" ? boxes[v] && boxes[v].rect : (Array.isArray(v) && v.length === 2 ? { x: v[0], y: v[1], w: 0, h: 0 } : (v && v.w != null ? R(v) : { x: v.x, y: v.y, w: 0, h: 0 })));
    const ats = times(o.arrows || [], bts[bts.length - 1] + 0.9);
    (o.arrows || []).forEach((a, i) => {
      const A = pt(a.from), Bb = pt(a.to);
      if (!A || !Bb) { Loom.error("brush_recipe_arrow", `${name}: arrow ${i} names a box that is not there`); return; }
      const ca = [A.x + A.w / 2, A.y + A.h / 2], cb = [Bb.x + Bb.w / 2, Bb.y + Bb.h / 2];
      const p0 = A.w ? edgePoint(A, cb, 14) : ca, p1 = Bb.w ? edgePoint(Bb, ca, 14) : cb;
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const bend = a.bend == null ? 0.06 : a.bend;
      const mid = [(p0[0] + p1[0]) / 2 - uy * L * bend, (p0[1] + p1[1]) / 2 + ux * L * bend];
      const hs = Math.min(38, L * 0.32), ang = 0.48;
      // the head follows the shaft's last direction (mid -> p1)
      const ex = p1[0] - mid[0], ey = p1[1] - mid[1], eL = Math.hypot(ex, ey) || 1, vx = ex / eL, vy = ey / eL;
      const h1 = [p1[0] - hs * (vx * Math.cos(ang) - vy * Math.sin(ang)), p1[1] - hs * (vy * Math.cos(ang) + vx * Math.sin(ang))];
      const h2 = [p1[0] - hs * (vx * Math.cos(-ang) - vy * Math.sin(-ang)), p1[1] - hs * (vy * Math.cos(-ang) + vx * Math.sin(-ang))];
      marks.push({ at: ats[i], dur: a.dur || 0.6, kind: "arrow", colour: ashow, clip: along(p0, p1, 30),
        draw: (b) => {
          b.set(o.arrowBrush || "marker", acol, o.arrowWeight || 1.7);
          b.spline([[...p0, 0.7], [...mid, 1], [...p1, 0.9]], 0.6);
          b.set(o.arrowBrush || "marker", acol, (o.arrowWeight || 1.7) * 0.7); b.spline([[h1[0], h1[1], 0.6], [p1[0], p1[1], 1], [h2[0], h2[1], 0.6]], 0);
        } });
      rects.push({ x: Math.min(p0[0], p1[0], mid[0]) - 30, y: Math.min(p0[1], p1[1], mid[1]) - 30, w: Math.abs(dx) + 60 + Math.abs(mid[0] - (p0[0] + p1[0]) / 2) * 2, h: Math.abs(dy) + 60 + Math.abs(mid[1] - (p0[1] + p1[1]) / 2) * 2 });
    });
    return bake(ctx, name, o, rects, marks);
  };

  /* ---------------- wash ---------------- */
  /** a watercolour wash that blooms behind one phrase (left to right, soft edges); the words above it stay the real text */
  B.wash = function (ctx, name, o) {
    o = o || {};
    if (!o.rect) { Loom.error("brush_recipe_empty", `${name}: wash needs a rect`); return null; }
    const dark = o.dark == null ? isDark() : !!o.dark;
    const r = R(o.rect), at = o.at == null ? ctx.start + 0.3 : +o.at;
    const show = ctx.c(o.colour || o.color || S().role("ui_mark", "accent2"));
    return bake(ctx, name, o, [r], [Object.assign(washMark(at, r, INK, o.alpha || 150, o.dur || 0.7, "wash", dark), { colour: show })]);
  };
})();
