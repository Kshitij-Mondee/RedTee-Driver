/* Loom data pictures, overlays on drawn worlds, and seeded arrays (D-90, docs/styles/CINEMA_PLAN.md B3, B9, B10).
 *
 * The reference films never put a number in a card. The number is a PICTURE: a counter that runs, as many things
 * as the quantity, bars laid over the scene, a line that dips with the event marked. And their words name things
 * that are drawn, on tags that wipe in, never instead of them. Every builder here draws in the station's
 * coordinates, measures its text with kit.text (the type floors and the spill checks apply), times itself from the
 * `t` it is given, and records what it drew in Loom.report.data (builder, values, beat) so a check can hold the
 * numbers to the script.
 *
 *   Loom.data.counter(ctx, "rate", {x, y, w, to: 1e15, decimals: 0, caption: "CALCULATIONS EVERY SECOND", t, dur})
 *   Loom.data.unitGrid(ctx, "homes", {x, y, w, h, n: 100, cols: 10, unit: "house", lit: 100, t, stagger})
 *   Loom.data.barsOn(ctx, "use", {x, y, w, bars: [{label: "2024", value: 415}, {label: "2030", value: 945, color: "neg"}], unit: "TWh", title, t})
 *   Loom.data.dipLine(ctx, "temp", {x, y, w, h, values: [...], labels: [...], mark: {i: 6, label: "1816"}, title, t, dur})
 *   Loom.data.profile(ctx, "peak", {x, y, w, h, before: [[x, y]...], after: [[x, y]...], ticks: [{v, label}], t})
 *   Loom.data.tag(ctx, "tokens", {x, y, text: "TOKENS", color: "accent", t, lines: [...]})          // wipes in
 *   Loom.data.chapter(ctx, "ch1", {kicker, title, sub, t, dur})                                      // over the world
 *   Loom.array(ctx, "racks", {x, y, cols, rows, dx, dy, draw: (g, i, r, c, rnd) => ..., seed, t, stagger, order})
 */
// @capability data_pictures | data | Loom.data.counter, unitGrid, barsOn, dipLine, profile, tag, chapter, stamp, pile, flood; Loom.array | Data as a picture | a number drawn as a picture (a counter that runs, as many things as the quantity, a line that dips at the event), never a number on a card
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const svg = (...a) => Loom.svg(...a);
  const K = () => Loom.kit;
  const D = (Loom.data = {});
  const f1 = (v) => Math.round(v * 10) / 10;
  const beat = () => Loom.ctxBeat && Loom.ctxBeat.id;
  const rec = (builder, name, values) => (Loom.report.data = Loom.report.data || []).push({ beat: beat(), builder, name, values });
  const dur = (k, m) => (S().dur ? S().dur(k) : 0.6) * (m || 1);
  function fmtNum(v, dec) {
    const s = Math.abs(v) >= 1e21 ? v.toExponential(2) : v.toFixed(dec || 0);
    const [i, f] = s.split(".");
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : "");
  }
  D.format = fmtNum;

  /** a big number that RUNS from `from` to `to` (the count is the event), with an optional caption under it */
  D.counter = function (ctx, name, o) {
    o = o || {};
    const dec = o.decimals || 0, pre = o.prefix || "", suf = o.suffix || "";
    const finalS = pre + fmtNum(o.to, dec) + suf;
    const w = o.w || 1200, role = o.role || "display";
    const E = ctx.el(name, { x: o.x, y: o.y, w, h: o.h || 260, kind: "data", exit: o.exit || "recede" });
    const tx = K().text(E.inner, finalS, { x: 0, y: 0, w, h: o.numH || 190, role, align: o.align || "center", color: o.color || "ink", weight: o.weight });
    tx.setAttribute("style", "font-variant-numeric: tabular-nums");   // digits keep one width while counting (s15)
    let capY = (tx.__fit ? tx.__fit.height : 150) + 12;
    if (o.caption) K().text(E.inner, o.caption, { x: 0, y: capY, w, h: (o.h || 260) - capY, role: o.captionRole || "label", align: o.align || "center", color: o.captionColor || "muted", tracking: 2 });
    const t = o.t == null ? ctx.start + 0.3 : o.t;
    Loom.motion.reveal(E, t, { dy: 10 });
    // the pack's count duration (motion.count) unless the scene says (corporate-clean guide s15, 2026-10-08; was 2.2 s)
    const cd = o.dur || (((S().pack.motion || {}).count != null) ? S().dur("count") : 2.2);
    Loom.motion.count(tx, t + 0.1, { from: o.from || 0, to: o.to, dur: cd, fmt: (v) => pre + fmtNum(v, dec) + suf });
    rec("counter", name, { from: o.from || 0, to: o.to, text: finalS, caption: o.caption || null });
    return E;
  };

  /* unit shapes for unitGrid (drawn in a 1 x 1 cell, centred; scaled by the cell) */
  const UNITS = {
    dot: (g, s, fill) => K().disc(g, 0, 0, s * 0.36, { fill, flat: true }),
    square: (g, s, fill) => K().rect(g, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72, { fill, r: s * 0.12, flat: true }),
    house: (g, s, fill) => {
      K().polygon(g, [[-s * 0.38, -s * 0.02], [0, -s * 0.4], [s * 0.38, -s * 0.02]], { fill: S().darken(S().c(fill), 0.18), flat: true });
      K().rect(g, -s * 0.3, -s * 0.04, s * 0.6, s * 0.42, { fill, r: s * 0.03, flat: true });
      K().rect(g, -s * 0.07, s * 0.14, s * 0.14, s * 0.24, { fill: "field", r: 1, flat: true });
    },
    person: (g, s, fill) => {
      K().disc(g, 0, -s * 0.22, s * 0.15, { fill, flat: true });
      K().rect(g, -s * 0.17, -s * 0.04, s * 0.34, s * 0.42, { fill, r: s * 0.15, flat: true });
    },
  };
  /** n things standing for the quantity: a grid of units that light up in order (one becomes many) */
  D.unitGrid = function (ctx, name, o) {
    o = o || {};
    const n = Math.max(1, Math.round(o.n || 10)), cols = o.cols || Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const w = o.w || 600, cell = Math.min(w / cols, (o.h || 1e9) / rows), h = cell * rows;
    const E = ctx.el(name, { x: o.x, y: o.y, w: cell * cols, h, kind: "data", exit: o.exit || "recede" });
    const lit = o.lit == null ? n : o.lit, t = o.t == null ? ctx.start + 0.3 : o.t, st = o.stagger == null ? Math.min(0.03, 2.4 / n) : o.stagger;
    const draw = typeof o.unit === "function" ? o.unit : (UNITS[o.unit] || UNITS.dot);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const g = svg("g", { transform: `translate(${f1((c + 0.5) * cell)} ${f1((r + 0.5) * cell)})` }, E.inner);
      const on = i < lit;
      if (o.art && Loom.art) Loom.art.shape(g, o.art, 0, 0, cell * 0.82, { colors: o.colors || "keep" });
      else draw(g, cell, on ? (o.color || "accent4") : (o.off || "muted"));
      const order = o.order === "random" ? ((i * 7919) % n) : i;
      Loom.tween(g, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: on ? 1 : 0.35, scale: 1, duration: 0.32, ease: ((S().pack && S().pack.motion) || {}).overshoot ? Loom.ease.overshoot : Loom.ease.enter }, t + order * st, { kind: "pop", beat: beat(), name: `${name}.${i}` });
    }
    rec("unitGrid", name, { n, lit, unit: typeof o.unit === "string" ? o.unit : (o.art || "custom") });
    return E;
  };

  /** horizontal bars that grow to their values, laid over the scene (a title line, labels, value at the bar end) */
  D.barsOn = function (ctx, name, o) {
    o = o || {};
    const bars = o.bars || [], w = o.w || 900, bh = o.barH || 40, gap = o.gap || 26, lw = o.labelW || 150, vw = o.valueW || 210;
    const top = o.title ? 64 : 0, h = top + bars.length * (bh + gap);
    const E = ctx.el(name, { x: o.x, y: o.y, w, h, kind: "data", exit: o.exit || "recede" });
    if (o.title) K().text(E.inner, o.title, { x: 0, y: 0, w, h: 56, role: "label", color: o.titleColor || "ink", tracking: 1 });
    const max = o.max || Math.max(...bars.map((b) => b.value), 1), span = w - lw - vw - 20;
    const t = o.t == null ? ctx.start + 0.3 : o.t;
    bars.forEach((b, i) => {
      const y = top + i * (bh + gap);
      K().text(E.inner, b.label, { x: 0, y: y + bh / 2 - 22, w: lw - 14, h: 44, role: "label", align: "right", color: "ink", valign: "middle" });
      const bw = Math.max(4, span * b.value / max);
      const bar = ctx.el(`${name}.bar${i}`, { x: lw, y, w: bw, h: bh, kind: "bar", parent: E.inner });
      K().rect(bar.inner, 0, 0, bw, bh, { fill: b.color || (i === bars.length - 1 ? "accent" : "accent3"), r: Math.min(8, bh / 3) });
      Loom.motion.grow(bar, t + i * 0.35, { axis: "x", dur: 0.9 });
      const val = (o.prefix || "") + fmtNum(b.value, o.decimals || 0) + (o.unit ? " " + o.unit : "") + (b.note ? " " + b.note : "");
      const v = ctx.el(`${name}.val${i}`, { x: lw + bw + 14, y: y + bh / 2 - 24, w: vw, h: 48, kind: "label", parent: E.inner });
      K().text(v.inner, val, { x: 0, y: 0, w: vw, h: 48, role: "label", color: "ink", valign: "middle" });
      Loom.motion.reveal(v, t + i * 0.35 + 0.7, { dy: 6 });
    });
    Loom.motion.reveal(E, t - 0.2, { dy: 8 });
    rec("barsOn", name, { bars: bars.map((b) => ({ label: b.label, value: b.value })), unit: o.unit || null, title: o.title || null });
    return E;
  };

  /** a line chart that draws itself, a dashed baseline, and the one event marked (the dip, the peak) */
  D.dipLine = function (ctx, name, o) {
    o = o || {};
    const v = o.values || [], n = v.length, w = o.w || 1100, h = o.h || 420, padL = o.padL || 70, padB = 56, top = o.title ? 56 : 0;
    const E = ctx.el(name, { x: o.x, y: o.y, w, h: h + top, kind: "data", exit: o.exit || "recede" });
    if (o.title) K().text(E.inner, o.title, { x: 0, y: 0, w, h: 48, role: "caption", color: o.titleColor || "muted", align: "center" });
    const lo = o.min == null ? Math.min(...v, o.base == null ? Infinity : o.base) : o.min, hi = o.max == null ? Math.max(...v, o.base == null ? -Infinity : o.base) : o.max;
    const X = (i) => padL + (w - padL - 20) * (n > 1 ? i / (n - 1) : 0.5), Y = (val) => top + 10 + (h - padB - 20) * (1 - (val - lo) / Math.max(1e-9, hi - lo));
    const axis = svg("g", {}, E.inner);
    K().line(axis, padL, top + 10, padL, top + h - padB, { stroke: "line", sw: 3 });
    K().line(axis, padL, top + h - padB, w - 20, top + h - padB, { stroke: "line", sw: 3 });
    if (o.base != null) svg("line", { x1: padL, y1: f1(Y(o.base)), x2: w - 20, y2: f1(Y(o.base)), stroke: S().c("muted"), "stroke-width": 2, "stroke-dasharray": "10 8" }, axis);
    (o.labels || []).forEach((lb, i) => { if (lb != null && lb !== "") K().text(axis, String(lb), { x: X(i) - 60, y: top + h - padB + 6, w: 120, h: 40, role: "caption", align: "center", color: "muted" }); });
    const d = v.map((val, i) => `${i ? "L" : "M"}${f1(X(i))} ${f1(Y(val))}`).join("");
    // the line is the subject, not a verdict: accent by default (it was neg; corporate-clean guide s15, 2026-10-08)
    const line = svg("path", { d, fill: "none", stroke: S().c(o.color || "accent"), "stroke-width": o.sw || 6, "stroke-linejoin": "round", "stroke-linecap": "round" }, E.inner);
    const t = o.t == null ? ctx.start + 0.3 : o.t, dd = o.dur || 2.4;
    Loom.motion.reveal(E, t - 0.2, { dy: 0 });
    Loom.motion.draw(line, t, { dur: dd });
    if (o.mark && o.mark.i != null && o.mark.i < n) {
      const mi = o.mark.i, mx = X(mi), my = Y(v[mi]);
      // the label sits on the open side of the point: above it when the point is low (the dip), below when high
      const low = my > top + (h - padB) * 0.55, dy = low ? 70 : 30;
      const M = ctx.el(`${name}.mark`, { x: mx - 70, y: my - dy, w: 140, h: 120, kind: "mark", parent: E.inner });
      K().disc(M.inner, 70, dy, 16, { fill: o.color || "neg" });
      svg("circle", { cx: 70, cy: dy, r: 28, fill: "none", stroke: S().c(o.color || "neg"), "stroke-width": 3, opacity: 0.6 }, M.inner);
      if (o.mark.label) K().text(M.inner, o.mark.label, { x: 0, y: low ? 2 : 64, w: 140, h: 36, role: "label", align: "center", color: o.color || "neg" });
      Loom.motion.pop(M, t + dd * (n > 1 ? mi / (n - 1) : 1) + 0.15);
    }
    rec("dipLine", name, { values: v, base: o.base == null ? null : o.base, mark: o.mark || null });
    return E;
  };

  /** before / after: a dashed outline of what was, the solid shape of what is, and a scale with ticks */
  D.profile = function (ctx, name, o) {
    o = o || {};
    const w = o.w || 1200, h = o.h || 460;
    const E = ctx.el(name, { x: o.x, y: o.y, w, h, kind: "data", exit: o.exit || "recede" });
    const path = (pts, close) => pts.map((p, i) => `${i ? "L" : "M"}${f1(p[0])} ${f1(p[1])}`).join("") + (close ? `L${f1(pts[pts.length - 1][0])} ${h}L${f1(pts[0][0])} ${h}Z` : "");
    const t = o.t == null ? ctx.start + 0.3 : o.t;
    const after = svg("path", { d: path(o.after || [], true), fill: S().c(o.fill || "surface2"), stroke: S().c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, E.inner);
    const before = svg("path", { d: path(o.before || [], false), fill: "none", stroke: S().c(o.dash || "ink"), "stroke-width": 3, "stroke-dasharray": "14 10" }, E.inner);
    const sc = svg("g", {}, E.inner), sx = o.scaleX == null ? w - 10 : o.scaleX;
    K().line(sc, sx, 0, sx, h, { stroke: "ink", sw: 3 });
    (o.ticks || []).forEach((tk) => {
      K().line(sc, sx - 14, tk.y, sx, tk.y, { stroke: tk.color || "ink", sw: 3 });
      if (tk.guide) svg("line", { x1: 0, y1: tk.y, x2: sx, y2: tk.y, stroke: S().c(tk.color || "muted"), "stroke-width": 2, opacity: 0.7 }, sc);
      if (tk.label) K().text(sc, tk.label, { x: sx + 12, y: tk.y - 22, w: 220, h: 44, role: "label", color: tk.color || "ink", valign: "middle" });
    });
    Loom.tween(after, { opacity: 0 }, { opacity: 1, duration: 0.6 }, t, { kind: "reveal", beat: beat(), name: name + ".after" });
    Loom.motion.draw(before, t + 0.5, { dur: 1.6 });
    Loom.tween(sc, { opacity: 0 }, { opacity: 1, duration: 0.5 }, t + 1.6, { kind: "reveal", beat: beat(), name: name + ".scale" });
    rec("profile", name, { ticks: (o.ticks || []).map((x) => x.label || null) });
    return E;
  };

  /** a solid tag that WIPES in left to right (stack several with `lines`); it names a thing that is drawn */
  D.tag = function (ctx, name, o) {
    o = o || {};
    const lines = o.lines || [o.text], role = o.role || "label", pad = o.pad || 16;
    const trk = o.tracking == null ? 1 : o.tracking;
    const fits = lines.map((s) => K().fit(s, { role, w: 900, maxLines: 1, weight: o.weight || 800, tracking: trk }));
    const size = Math.min(...fits.map((f) => f.size));
    // tracked capitals run wider in the browser than the estimate (L-150): 6 % of room, then the padding
    const w = Math.max(...fits.map((f) => f.width)) * 1.06 + pad * 2, lh = Math.max(...fits.map((f) => f.height)) + pad * 1.2;
    const E = ctx.el(name, { x: o.x, y: o.y, w, h: lh * lines.length + 6 * (lines.length - 1), kind: "label", exit: o.exit || "recede" });
    const t = o.t == null ? ctx.start + 0.3 : o.t;
    lines.forEach((s, i) => {
      const row = ctx.el(`${name}.${i}`, { x: 0, y: i * (lh + 6), w, h: lh, kind: "label", parent: E.inner });
      const plate = K().rect(row.inner, 0, 0, w, lh, { fill: o.color || "accent", r: o.r == null ? 6 : o.r, flat: true, crisp: true });
      // measure what the browser actually laid out and widen the plate to it: tracked bold capitals can run past the
      // estimate (L-150; a tag in feedback-that-lands b07 spilt 7 px in Chrome)
      const probeT = K().text(row.inner, s, { x: pad, y: 0, w: 1600, h: lh, role, size, valign: "middle", weight: o.weight || 800, tracking: trk, color: o.textColor || "onAccent" });
      let tw = probeT.__fit ? probeT.__fit.width : w - pad * 2;
      try { const bb = probeT.getBBox && probeT.getBBox(); if (bb && bb.width > 0) tw = Math.max(tw, bb.width); } catch (e) { /* not laid out */ }
      probeT.remove();
      const ww = Math.max(w, Math.ceil(tw) + pad * 2 + 4);
      const r0 = plate.querySelector ? plate.querySelector("rect") : null;
      if (r0 && ww > w) { r0.setAttribute("width", ww); row.w = ww; row.outer.setAttribute("data-w", ww); }
      K().text(row.inner, s, { x: pad, y: 0, w: ww - pad * 2, h: lh, role, size, color: o.textColor || "onAccent", valign: "middle", weight: o.weight || 800, tracking: trk });
      Loom.motion.unmask(row, t + i * 0.18, { dur: 0.45 });
    });
    return E;
  };

  /** a chapter sting OVER the drawn world: the world dims, a kicker, a heavy title with depth, an italic subtitle */
  D.chapter = function (ctx, name, o) {
    o = o || {};
    const W = Loom.W, H = Loom.H, t = o.t == null ? ctx.start + 0.2 : o.t, hold = o.dur || 3.2;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "chapter", exit: "recede" });
    const dim = svg("rect", { x: -400, y: -400, width: W + 800, height: H + 800, fill: S().c(o.dimColor || "field"), opacity: 0 }, E.inner);
    Loom.tween(dim, { opacity: 0 }, { opacity: o.dim == null ? 0.62 : o.dim, duration: 0.6 }, t, { kind: "reveal", beat: beat(), name: name + ".dim" });
    Loom.tween(dim, { opacity: o.dim == null ? 0.62 : o.dim }, { opacity: 0, duration: 0.6, immediateRender: false }, t + hold, { kind: "exit", beat: beat(), name: name + ".undim" });
    const blockW = o.w || 1500, x0 = (W - blockW) / 2, y0 = o.top == null ? 330 : o.top;
    const parts = [];
    if (o.kicker) parts.push(["kicker", K().text(E.inner, o.kicker, { x: x0, y: y0, w: blockW, h: 50, role: "label", align: "center", color: o.accent || S().role("chapter_kicker", "accent2"), tracking: 6, weight: 800 })]);
    const ty = y0 + (o.kicker ? 60 : 0);
    const depth = o.depth || (S().pack.palette.deep ? "deep" : "shadow");
    for (let k = 4; k >= 1; k--) {   // extruded depth: offset copies in a dark token behind the title
      const tt = K().text(E.inner, o.title, { x: x0 + k * 3, y: ty + k * 3, w: blockW, h: 200, role: "hero", align: "center", color: S().pack.palette[depth] ? depth : "shadow", weight: 900 });
      tt.setAttribute("opacity", "0.9"); parts.push(["depth", tt]);
    }
    parts.push(["title", K().text(E.inner, o.title, { x: x0, y: ty, w: blockW, h: 200, role: "hero", align: "center", color: o.color || "ink", weight: 900 })]);
    if (o.sub) parts.push(["sub", K().text(E.inner, o.sub, { x: x0, y: ty + 190, w: blockW, h: 60, role: "lead", align: "center", color: o.accent || S().role("chapter_kicker", "accent2") })]);
    parts.forEach(([k, node], i) => {
      Loom.tween(node, { opacity: 0, y: k === "kicker" ? -10 : 24 }, { opacity: k === "depth" ? 0.9 : 1, y: 0, duration: 0.55, ease: Loom.ease.enter }, t + 0.3 + (k === "sub" ? 0.6 : k === "kicker" ? 0 : 0.2), { kind: "reveal", beat: beat(), name: `${name}.${k}` });
      Loom.tween(node, { opacity: k === "depth" ? 0.9 : 1 }, { opacity: 0, duration: 0.45, immediateRender: false }, t + hold - 0.1, { kind: "exit", beat: beat(), name: `${name}.${k}.out` });
    });
    rec("chapter", name, { title: o.title, kicker: o.kicker || null, sub: o.sub || null });
    // D-100: an overlay owns the frame while it shows. Its window is reported, the check fails a scene that builds
    // underneath it (phishing b09: the funnel rim drew over "Why move three matters", L-172), and `E.after` is the
    // time the scene may start building again.
    E.after = t + hold + 0.4;
    (Loom.report.overlays = Loom.report.overlays || []).push({ beat: beat(), name, t0: t + 0.3, t1: t + hold + 0.35 });
    return E;
  };

  /* ---------------- seeded arrays: one thing becomes many (B10) ---------------- */
  /** a grid of instances, each drawn by `draw(g, i, row, col, rnd)` with its own seeded variation; they arrive in
   *  `order` ("row", "col", "random" or "centre") staggered from `t`, so a hall fills, a street lights up. */
  Loom.array = function (ctx, name, o) {
    o = o || {};
    const cols = o.cols || 5, rows = o.rows || 1, dx = o.dx || 120, dy = o.dy || 120, n = cols * rows;
    const E = ctx.el(name, { x: o.x, y: o.y, w: o.w || cols * dx, h: o.h || rows * dy, kind: o.kind || "group", exit: o.exit || "recede", parent: o.parent });
    const R = Loom.rng ? Loom.rng(o.seed || name) : Math.random;   // seeded: identical on every render
    const t = o.t, st = o.stagger == null ? Math.min(0.06, 2.0 / n) : o.stagger;
    const keyOf = (i, r, c) => o.order === "col" ? c * rows + r : o.order === "random" ? (i * 7919 + 13) % n
      : o.order === "centre" ? Math.round(Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2) * 4) : i;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, rnd = () => (typeof R === "function" ? R() : R.next());
      const sk = o.skew ? o.skew(r, c) : [0, 0];
      // the placement lives on an outer group and the entrance on an inner one: a tween of y on the same group
      // would replace its translate and collapse every row onto the first (found by a scene author, D-92 follow-up)
      const place = svg("g", { transform: `translate(${f1(c * dx + sk[0])} ${f1(r * dy + sk[1])})` }, E.inner);
      const g = svg("g", {}, place);
      o.draw(g, i, r, c, rnd);
      if (t != null) Loom.tween(g, { opacity: 0, y: o.rise == null ? 18 : o.rise }, { opacity: 1, y: 0, duration: 0.4, ease: Loom.ease.enter }, t + keyOf(i, r, c) * st, { kind: "settle", beat: beat(), name: `${name}.${i}` });
    }
    (Loom.report.arrays = Loom.report.arrays || []).push({ beat: beat(), name, n });
    return E;
  };

  /* ---------------- data as OBJECTS (D-114): a share is a count of things, a total is a pile ----------------
   * TED-Ed films rarely chart a share: they show the things. 37 of 100 people get stamped, a pile of coins grows
   * while its number runs, a crowd floods a square. These builders keep the unitGrid conventions (cells, the
   * UNITS shapes, records in Loom.report.data) and add nothing to the existing builders:
   *
   *   Loom.data.stamp(ctx, "share", {x, y, w, h, n: 100, cols: 10, share: 0.37, unit: "person", t, stagger, token})
   *   Loom.data.pile(ctx, "cost", {x, y, w, unit: "coin", count: 30, to: 1200000, prefix: "$", t, dur, label})
   *   Loom.data.flood(ctx, "crowd", {region: {x, y, w, h}, glyph: "person", share: 0.6, t, dur, seed, origin})
   *
   * stamp: a neutral grid of n units is drawn first (one calm reveal at gridT, default t - 0.9 s), then
   * round(n * share) units are STAMPED over it in reading order (from 1.35x, accent token): the share is seen as
   * a count. A share that does not give a whole number of units warns `stamp_rounded` (the picture then says a
   * slightly different number than the script). Each stamped unit carries data-loom-stamp="1".
   * pile: `count` unit objects stack from the base, row by row, while a counter sitting ON the top of the pile
   * runs from `from` to `to`. One eased progress drives the number, the height of the counter and the arrival of
   * every unit (each unit lands when the progress passes its share of the pile), so they never disagree.
   * flood: glyphs fill a region to a share. Positions are a jittered grid seeded with Loom.rng(seed), the filled
   * ones are the nearest to `origin` (with seeded unevenness at the front) and arrive in order of distance, so
   * the region fills like a spreading tide. The empty capacity shows faintly (ghost: false hides it).
   * Determinism: positions come from the seeded rng, every arrival is a Loom.tween / Loom.drive at an absolute
   * time; nothing reads the clock.
   */
  const EXTRA_UNITS = {
    coin: (g, s, fill) => {
      K().disc(g, 0, 0, s * 0.38, { fill, flat: true });
      svg("circle", { cx: 0, cy: 0, r: f1(s * 0.25), fill: "none", stroke: S().darken(S().c(fill), 0.25), "stroke-width": f1(Math.max(1.5, s * 0.05)) }, g);
    },
    box: (g, s, fill) => K().rect(g, -s * 0.4, -s * 0.34, s * 0.8, s * 0.68, { fill, r: s * 0.06, flat: true }),
  };
  const unitDraw = (u) => (typeof u === "function" ? u : (UNITS[u] || EXTRA_UNITS[u] || UNITS.dot));
  const unitName = (u) => (typeof u === "string" ? u : "custom");
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  D.stamp = function (ctx, name, o) {
    o = o || {};
    const n = Math.max(1, Math.round(o.n || 100)), cols = o.cols || Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const share = clamp01(o.share == null ? 0.5 : o.share), k = Math.round(n * share);
    if (Math.abs(k - n * share) > 1e-6) Loom.warn("stamp_rounded", `stamp ${name}: ${n} x ${share} = ${(n * share).toFixed(2)} units, drawn as ${k}`, { beat: beat(), name });
    const w = o.w || 600, cell = Math.min(w / cols, (o.h || 1e9) / rows), h = cell * rows;
    const E = ctx.el(name, { x: o.x, y: o.y, w: cell * cols, h, kind: "data", exit: o.exit || "recede" });
    const t = o.t == null ? ctx.start + 1.2 : o.t, gridT = o.gridT == null ? Math.max(0, t - 0.9) : o.gridT;
    const draw = unitDraw(o.unit);
    const at = (i) => `translate(${f1((i % cols + 0.5) * cell)} ${f1((Math.floor(i / cols) + 0.5) * cell)})`;
    const base = svg("g", { "data-loom-grid": "base", opacity: o.offOpacity == null ? 0.5 : o.offOpacity }, E.inner);
    for (let i = 0; i < n; i++) draw(svg("g", { transform: at(i) }, base), cell, o.off || "muted");
    const baseIn = svg("g", {}, E.inner); E.inner.insertBefore(baseIn, base); baseIn.appendChild(base);   // reveal on a wrapper: the static opacity stays
    Loom.tween(baseIn, { opacity: 0 }, { opacity: 1, duration: dur("enter"), ease: Loom.ease.enter }, gridT, { kind: "reveal", beat: beat(), name: name + ".grid" });
    const st = o.stagger == null ? Math.min(0.09, 1.6 / Math.max(1, k)) : o.stagger, sd = dur("enter", 0.7);
    const top = svg("g", { "data-loom-grid": "stamped" }, E.inner);
    for (let i = 0; i < k; i++) {   // reading order: row by row, left to right
      const g = svg("g", { "data-loom-stamp": "1" }, svg("g", { transform: at(i) }, top));
      draw(g, cell, o.token || o.color || "accent");
      Loom.tween(g, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: sd, ease: Loom.ease.enter }, t + i * st, { kind: "stamp", beat: beat(), name: `${name}.${i}`, content: true });
    }
    if (o.sfx && k) { Loom.sfx(o.sfx === true ? "tick" : o.sfx, t + sd * 0.4); if (k > 1) Loom.sfx(o.sfx === true ? "tick" : o.sfx, t + (k - 1) * st + sd * 0.4); }
    E.landed = t + Math.max(0, k - 1) * st + sd;
    rec("stamp", name, { n, share, stamped: k, unit: unitName(o.unit) });
    return E;
  };

  D.pile = function (ctx, name, o) {
    o = o || {};
    const count = Math.max(1, Math.round(o.count || 24)), w = o.w || 360, coin = o.unit === "coin" || o.unit == null;
    const cols = o.cols || Math.max(2, Math.min(count, Math.round(Math.sqrt(count * (coin ? 0.3 : 1.4)))));   // coins: a few tall stacks
    const cell = w / cols, rowH = cell * (coin ? 0.3 : 0.9), rows = Math.ceil(count / cols);
    const dec = o.decimals || 0, pre = o.prefix || "", suf = o.suffix || "", from = o.from || 0;
    const finalS = pre + fmtNum(o.to, dec) + suf, role = o.role || "title";
    const F = K().fit(finalS, { role, w, maxLines: 1 });
    const numH = Math.ceil(F.height) + 8, labelH = o.label ? 64 : 0;
    const pileH = rows * rowH + (coin ? cell * 0.5 : 0);
    const h = o.h || Math.ceil(numH + 16 + Math.max(24, rowH * 1.5) + pileH + labelH);
    const E = ctx.el(name, { x: o.x, y: o.y, w, h, kind: "data", exit: o.exit || "recede" });
    const baseY = h - labelH;
    const t = o.t == null ? ctx.start + 0.3 : o.t, dd = o.dur || dur("count", 1.6);
    const ease = Loom.ease[o.ease || "move"];
    // the time a progress value is reached (invert the ease), so each unit lands when the count passes it
    const when = (p) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ease(m) < p) lo = m; else hi = m; } return t + hi * dd; };
    const draw = unitDraw(o.unit || "coin");
    const fall = Math.max(24, rowH * 1.5);   // a short fall, so a unit in the air never crosses the counter above
    const units = svg("g", {}, E.inner);
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const place = svg("g", { transform: `translate(${f1((c + 0.5) * cell)} ${f1(baseY - (r + 0.5) * rowH - (coin ? cell * 0.18 : 0))})` }, units);
      const g = svg("g", { "data-loom-pile": "1" }, place);
      if (coin) {   // a coin lying flat: an ellipse with a rim
        const fill = S().c(o.token || "accent4");
        svg("ellipse", { cx: 0, cy: f1(rowH * 0.35), rx: f1(cell * 0.44), ry: f1(cell * 0.16), fill: S().darken(fill, 0.25) }, g);
        svg("ellipse", { cx: 0, cy: 0, rx: f1(cell * 0.44), ry: f1(cell * 0.16), fill }, g);
        svg("ellipse", { cx: 0, cy: 0, rx: f1(cell * 0.3), ry: f1(cell * 0.1), fill: "none", stroke: S().darken(fill, 0.18), "stroke-width": f1(Math.max(1.5, cell * 0.03)) }, g);
      } else draw(g, cell, o.token || "accent4");
      const land = when((i + 1) / count);
      Loom.tween(g, { opacity: 0, y: -fall }, { opacity: 1, y: 0, duration: 0.22, ease: Loom.ease.exit }, Math.max(0, land - 0.22), { kind: "drop", beat: beat(), name: `${name}.${i}` });   // falls (gravity), lands on its count
    }
    // the counter sits ON the pile and rises with it (one progress: number, height, units)
    const cg = svg("g", {}, E.inner);
    const tx = K().text(cg, finalS, { x: 0, y: 0, w, h: numH, role, align: "center", valign: "bottom", color: o.color || "ink", weight: o.weight, maxLines: 1 });
    const tn = tx.querySelector("tspan") || tx;
    const topOf = (p) => baseY - Math.min(rows, (p * count) / cols) * rowH - (coin ? cell * 0.35 : 0);
    Loom.drive((e) => {
      tn.textContent = pre + fmtNum(from + (o.to - from) * e, dec) + suf;
      cg.setAttribute("transform", `translate(0 ${f1(topOf(e) - numH - fall - 6)})`);
    }, t, dd, o.ease || "move", { kind: "count", beat: beat(), name: name + ".count", content: true });
    if (o.label) K().text(E.inner, o.label, { x: 0, y: baseY + 10, w, h: labelH - 10, role: "label", align: "center", color: o.labelColor || "muted", tracking: 1 });
    Loom.tween(E.inner, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, Math.max(0, t - 0.3), { kind: "reveal", beat: beat(), name });
    E.landed = t + dd;
    rec("pile", name, { count, from, to: o.to, text: finalS, unit: unitName(o.unit || "coin"), label: o.label || null });
    return E;
  };

  D.flood = function (ctx, name, o) {
    o = o || {};
    const R0 = Object.assign({ x: 0, y: 0, w: 600, h: 400 }, o.region || {});
    const size = o.size || (o.n ? Math.sqrt((R0.w * R0.h) / o.n) : 44);
    const cols = Math.max(1, Math.floor(R0.w / size)), rows = Math.max(1, Math.floor(R0.h / size)), N = cols * rows;
    const share = clamp01(o.share == null ? 0.5 : o.share), k = Math.round(N * share);
    const E = ctx.el(name, { x: R0.x, y: R0.y, w: R0.w, h: R0.h, kind: "data", exit: o.exit || "recede" });
    const rnd = Loom.rng(o.seed == null ? "flood:" + name : o.seed);
    const ox = (R0.w - cols * size) / 2, oy = (R0.h - rows * size) / 2;
    const pts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const jx = (rnd() - 0.5) * size * 0.45, jy = (rnd() - 0.5) * size * 0.45, noise = rnd();
      pts.push({ x: ox + (c + 0.5) * size + jx, y: oy + (r + 0.5) * size + jy, noise });
    }
    const org = Array.isArray(o.origin) ? { x: o.origin[0], y: o.origin[1] }
      : o.origin === "left" ? { x: 0, y: R0.h / 2 } : o.origin === "centre" || o.origin === "center" ? { x: R0.w / 2, y: R0.h / 2 }
      : o.origin === "top" ? { x: R0.w / 2, y: 0 } : { x: R0.w / 2, y: R0.h };   // default: from the bottom edge, like a tide
    for (const p of pts) p.d = Math.hypot(p.x - org.x, p.y - org.y) + p.noise * size * 0.8;
    const order = pts.map((p, i) => i).sort((a, b) => pts[a].d - pts[b].d || a - b);
    const draw = unitDraw(o.glyph || "dot"), gs = size * (o.scale || 0.95);
    const t = o.t == null ? ctx.start + 0.4 : o.t, dd = o.dur || 2.4;
    if (o.ghost !== false) {
      const ghost = svg("g", { opacity: o.ghostOpacity == null ? 0.18 : o.ghostOpacity }, E.inner), gIn = svg("g", {}, E.inner);
      E.inner.insertBefore(gIn, ghost); gIn.appendChild(ghost);
      for (const p of pts) draw(svg("g", { transform: `translate(${f1(p.x)} ${f1(p.y)})` }, ghost), gs, o.off || "muted");
      Loom.tween(gIn, { opacity: 0 }, { opacity: 1, duration: dur("enter"), ease: Loom.ease.enter }, Math.max(0, t - 0.6), { kind: "reveal", beat: beat(), name: name + ".ghost" });
    }
    const filled = svg("g", { "data-loom-grid": "flood" }, E.inner);
    const d0 = k ? pts[order[0]].d : 0, d1 = k ? pts[order[k - 1]].d : 1;
    for (let j = 0; j < k; j++) {
      const p = pts[order[j]];
      const g = svg("g", { "data-loom-flood": "1" }, svg("g", { transform: `translate(${f1(p.x)} ${f1(p.y)})` }, filled));
      draw(g, gs, o.token || "accent");
      const at = t + dd * (d1 > d0 ? (p.d - d0) / (d1 - d0) : 0);   // arrival in order of distance: a front that spreads
      Loom.tween(g, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: Loom.ease.enter }, at, { kind: "pop", beat: beat(), name: `${name}.${j}` });
    }
    E.landed = t + dd + 0.3;
    rec("flood", name, { capacity: N, share, filled: k, glyph: unitName(o.glyph || "dot"), seed: o.seed == null ? null : o.seed });
    return E;
  };
})();
