/* Blueprint engine (2026-10-16, D-175's slot; Kshitij: "improve the entire blueprint style ... by taking more inspiration
 * and input and learning from the opuscar blueprint style"). A technical drawing drafted live on the cyanotype sheet.
 *
 * Learned from lemo-opuscar's blueprint style (drafting order, line weights and dash conventions, paper occlusion,
 * dimensions that measure, numbered balloons, section lines, FIG numbers as transitions, the title block as the story,
 * exploded views, mechanisms that step like an escapement, projection as a camera). Rebuilt for Loom, not copied: every
 * mark is an SVG path inside an element a scene made with ctx.el (so holds, joins, the camera, the layout guard, the probe
 * and restyles keep working), every reveal is a tween on the lesson's timeline, colours are pack tokens, the lettering is
 * a single-stroke technical hand (Hershey Sans, MIT/OFL via hersheytext), and a frame is a pure function of time.
 *
 *   const W = ctx.engine, D = W.sheet(ctx);                    // once per scene
 *   const valve = ctx.el("valve", { x: 520, y: 260, w: 640, h: 420, kind: "card", exit: "recede" });
 *   let t = D.part(valve, {                                     // drafted in order: centre lines, outline, detail, hidden, hatching
 *     centre: W.centre(320, -30, 320, 450),
 *     outline: W.rect(80, 60, 480, 300),
 *     detail: W.circle(320, 210, 70),
 *     hidden: W.hidden([[250, 60], [250, 360]]),
 *   }, { at: ctx.cue("the valve body") - 0.3, by: ctx.cue("bolted") });
 *   const d = D.dim(valve, 80, 360, 560, 360, { off: 60, value: 480, unit: "mm", at: t });   // a live figure: d.set(520, at)
 *   D.balloon(valve, 1, 640, 40, { to: [480, 120], at: d.t });
 *   const lbl = ctx.el("valve_label", { x: 520, y: 700, w: 640, h: 50, kind: "text" });
 *   D.letter(lbl, "Gate valve, body", { role: "label", at: d.t + 0.2 });
 *
 * Loom's own register (docs/styles/guides/blueprint.md): crisp technical-pen lines with no wobble, one quiet glowing nib
 * at the drawing head (no hand), cyan for the part the narration names, amber for figures, coral or mint for a verdict,
 * no sound by default (`{sound: true}` on one draw gives one short pen sound).
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

  // ---------------------------------------------------------------- line weights (the drafting hierarchy)
  // outline: visible edges (the pack's stroke); detail: inner edges; thin: dimensions, leaders, centre and hidden lines;
  // hair: hatching. Ratios after ISO 128's wide : narrow lines, kept a little heavier so they survive H.264 at 1080p.
  const base = () => ((S().pack && S().pack.shape && S().pack.shape.stroke) || 2.5);
  const WEIGHT = { outline: 1.0, detail: 0.72, thin: 0.52, hair: 0.42, text: 0 };
  const widthOf = (k) => typeof k === "number" ? k : Math.max(0.9, base() * (WEIGHT[k] == null ? 1 : WEIGHT[k]));
  // dash conventions in px at 1080p (chain for centres and axes, short dashes for hidden edges, long-short-short for a
  // cutting plane or a part's other position)
  const DASH = { centre: [26, 6, 5, 6], hidden: [11, 7], phantom: [30, 6, 5, 6, 5, 6] };

  // ---------------------------------------------------------------- geometry
  // a mark: {pts (flat, element-local px), cum, len, w, kind, dash, pen, closed}
  function mark(pts, o) {
    o = o || {};
    const n = pts.length / 2, cum = new Array(n).fill(0);
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    return { pts, cum, len: cum[n - 1] || 0.001, w: widthOf(o.weight || "outline"), kind: o.kind || "line", dash: o.dash || null,
      pen: o.pen || null, closed: !!o.closed, fill: o.fill || null };
  }
  function at(m, L) {
    const c = m.cum, p = m.pts; L = clamp(L, 0, m.len);
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (c[md] < L) lo = md; else hi = md; }
    const u = (L - c[lo]) / ((c[hi] - c[lo]) || 1);
    return [lerp(p[2 * lo], p[2 * hi], u), lerp(p[2 * lo + 1], p[2 * hi + 1], u)];
  }
  function slice(m, a, b) {                          // the part of a mark between arc lengths a and b, as flat points
    const out = [...at(m, a)];
    for (let i = 0; i < m.cum.length; i++) if (m.cum[i] > a && m.cum[i] < b) out.push(m.pts[2 * i], m.pts[2 * i + 1]);
    out.push(...at(m, b));
    return out;
  }
  const flat = (points) => (points.length && Array.isArray(points[0]) ? points.flat() : points.slice());
  const startOf = (m) => [m.pts[0], m.pts[1]];
  const endOf = (m) => [m.pts[m.pts.length - 2], m.pts[m.pts.length - 1]];
  const dpath = (pts, closed) => "M" + pts.reduce((a, v, j) => a + (j % 2 ? "," : j ? " L" : "") + f1(v), "") + (closed ? " Z" : "");

  // ---------------------------------------------------------------- vocabulary (pure data, element-local px)
  const V = {};
  V.line = (x0, y0, x1, y1, o) => [mark([x0, y0, x1, y1], o)];
  V.path = (points, o) => [mark(flat(points), o)];
  V.polygon = (points, o) => { const p = flat(points); return [mark(p.concat(p.slice(0, 2)), Object.assign({ closed: true }, o || {}))]; };
  V.rect = (x, y, w, h, o) => V.polygon([x, y, x + w, y, x + w, y + h, x, y + h], o);
  V.roundRect = (x, y, w, h, r, o) => {
    r = Math.min(r == null ? 10 : r, w / 2, h / 2);
    const p = [], seg = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    seg(x + w - r, y + r, -Math.PI / 2); seg(x + w - r, y + h - r, 0); seg(x + r, y + h - r, Math.PI / 2); seg(x + r, y + r, Math.PI);
    p.push(p[0], p[1]);
    return [mark(p, Object.assign({ closed: true }, o || {}))];
  };
  V.arc = (cx, cy, r, a0, a1, o) => {
    o = o || {};
    const ry = o.ry == null ? r : o.ry, n = Math.max(12, Math.ceil(Math.abs(a1 - a0) * Math.max(r, ry) / 6)), p = [];
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * ry); }
    return [mark(p, o)];
  };
  // a drafted circle closes exactly (a compass), starting at the top
  V.circle = (cx, cy, r, o) => V.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU, Object.assign({ closed: true }, o || {}));
  V.ellipse = (cx, cy, rx, ry, o) => V.circle(cx, cy, rx, Object.assign({}, o || {}, { ry }));
  // conventions: chain line (centres, axes), hidden edges, phantom (a cutting plane, another position of a part)
  V.centre = (x0, y0, x1, y1, o) => [mark([x0, y0, x1, y1], Object.assign({ weight: "thin", dash: DASH.centre, kind: "centre", pen: "muted" }, o || {}))];
  V.hidden = (points, o) => [mark(flat(points), Object.assign({ weight: "thin", dash: DASH.hidden, kind: "hidden", pen: "muted" }, o || {}))];
  V.phantom = (points, o) => [mark(flat(points), Object.assign({ weight: "thin", dash: DASH.phantom, kind: "phantom", pen: "muted" }, o || {}))];
  // the centre mark of a hole or a shaft: two chain lines crossing past the circle
  V.centreMark = (cx, cy, r, o) => [].concat(V.centre(cx - r - 14, cy, cx + r + 14, cy, o), V.centre(cx, cy - r - 14, cx, cy + r + 14, o));
  // section hatching: parallel narrow lines at an angle (45 degrees by default) clipped to a convex outline
  V.hatch = (poly, o) => {
    o = o || {};
    const P0 = flat(poly), P = [];
    for (let i = 0; i < P0.length; i += 2) P.push([P0[i], P0[i + 1]]);
    const ang = (o.angle == null ? 45 : o.angle) * Math.PI / 180, sp = o.spacing || 12, ca = Math.cos(ang), sa = Math.sin(ang);
    const R = P.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const v0 = Math.min(...R.map((p) => p[1])), v1 = Math.max(...R.map((p) => p[1])), out = [];
    for (let v = v0 + sp * 0.5; v < v1; v += sp) {
      const xs = [];
      for (let i = 0; i < R.length; i++) {
        const [ax, ay] = R[i], [bx, by] = R[(i + 1) % R.length];
        if ((ay - v) * (by - v) < 0) xs.push(ax + (v - ay) / (by - ay) * (bx - ax));
      }
      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      const a = xs[0], b = xs[xs.length - 1];
      out.push(mark([a * ca - v * sa, a * sa + v * ca, b * ca - v * sa, b * sa + v * ca], Object.assign({ weight: "hair", kind: "hatch", pen: o.pen || "muted" }, o)));
    }
    return out;
  };
  // a spur gear's outline (teeth as trapezoids), its bore and its centre mark: a mechanism's drawing
  V.gear = (cx, cy, r, teeth, o) => {
    o = o || {};
    const n = Math.max(6, teeth | 0), d = o.depth || Math.max(6, r * 0.14), p = [], ph = o.phase || 0;
    for (let i = 0; i < n; i++) {
      const a = ph + i / n * TAU, s = TAU / n;
      // a drawing's gear: teeth as wide as the gaps; a mechanism's (`mesh: true`): slimmer teeth with backlash, so two
      // meshing gears read as meshing (a tooth that fills its gap exactly drew as a clash)
      const pts = o.mesh ? [[a, r - d], [a + s * 0.1, r], [a + s * 0.34, r], [a + s * 0.44, r - d], [a + s, r - d]]
        : [[a, r - d], [a + s * 0.18, r], [a + s * 0.5, r], [a + s * 0.68, r - d], [a + s, r - d]];
      for (const [aa, rr] of pts) p.push(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr);
    }
    p.push(p[0], p[1]);
    const out = [mark(p, Object.assign({ closed: true }, o))];
    if (o.bore !== false) out.push(...V.circle(cx, cy, o.bore || r * 0.22, Object.assign({}, o, { weight: "detail" })));
    if (o.centre !== false) out.push(...V.centreMark(cx, cy, r, o));
    return out;
  };
  // a revision cloud: outward scallops round a box, one continuous stroke
  V.cloud = (x, y, w, h, o) => {
    o = o || {};
    const r = o.r || 26, p = [], per = (a, b) => Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (r * 1.7)));
    const C = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let s = 0; s < 4; s++) {
      const a = C[s], b = C[(s + 1) % 4], n = per(a, b), dx = (b[0] - a[0]) / n, dy = (b[1] - a[1]) / n, L = Math.hypot(dx, dy) || 1;
      const nx = dy / L, ny = -dx / L;                  // outward for a clockwise box in screen coordinates
      for (let i = 0; i < n; i++) {
        const sx = a[0] + dx * i, sy = a[1] + dy * i;
        for (let k = 0; k <= 8; k++) { const u = k / 8, bump = Math.pow(Math.sin(Math.PI * u), 0.7) * L * 0.5; p.push(sx + dx * u + nx * bump, sy + dy * u + ny * bump); }
      }
    }
    return [mark(p, Object.assign({ weight: "detail", closed: true }, o))];
  };
  // an arrow for flow (a request, a force): the shaft, then a small filled head (dimensions use their own heads)
  V.arrow = (x0, y0, x1, y1, o) => { const m = mark([x0, y0, x1, y1], o); m.head = o && o.head === false ? 0 : (o && o.head) || 16; return [m]; };

  // ---- the mechanism vocabulary (2026-10-16, the wow pass): a shaft, a pulley, a belt or chain between two pulleys
  // a shaft: two parallel edges, its axis as a chain line, the ends as narrow ellipses (a round bar seen from the side)
  V.shaft = (x0, y0, x1, y1, r, o) => {
    o = o || {};
    r = r || 10;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * r, ny = (x1 - x0) / L * r;
    return [].concat(V.line(x0 + nx, y0 + ny, x1 + nx, y1 + ny, o), V.line(x0 - nx, y0 - ny, x1 - nx, y1 - ny, o),
      V.centre(x0 - (x1 - x0) / L * 16, y0 - (y1 - y0) / L * 16, x1 + (x1 - x0) / L * 16, y1 + (y1 - y0) / L * 16),
      V.line(x0 + nx, y0 + ny, x0 - nx, y0 - ny, Object.assign({ weight: "detail" }, o)), V.line(x1 + nx, y1 + ny, x1 - nx, y1 - ny, Object.assign({ weight: "detail" }, o)));
  };
  // a pulley (or a sprocket): its rim, the groove, the hub and the centre mark
  V.pulley = (cx, cy, r, o) => {
    o = o || {};
    return [].concat(V.circle(cx, cy, r, Object.assign({ fill: o.paper === false ? null : "field" }, o)), V.circle(cx, cy, r * 0.82, Object.assign({}, o, { weight: "thin" })),
      V.circle(cx, cy, Math.max(5, r * 0.22), Object.assign({}, o, { weight: "detail" })), V.centreMark(cx, cy, r));
  };
  // an open belt round two pulleys: the two tangent runs and the wraps, as ONE closed stroke (so a chain's links can run
  // along it). Its geometry is kept on the mark (beltOf) for the motion
  V.belt = (c1, r1, c2, r2, o) => {
    o = o || {};
    const [x1, y1] = c1, [x2, y2] = c2, d = Math.hypot(x2 - x1, y2 - y1) || 1, base = Math.atan2(y2 - y1, x2 - x1);
    const a = Math.acos(clamp((r1 - r2) / d, -1, 1));       // the tangent points' angle from the line of centres
    const p = [], arc = (cx, cy, r, from, to) => { const n = Math.max(8, Math.ceil(Math.abs(to - from) * r / 6)); for (let i = 0; i <= n; i++) { const t = lerp(from, to, i / n); p.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r); } };
    arc(x1, y1, r1, base + a, base + TAU - a);             // round the back of pulley 1
    arc(x2, y2, r2, base - a, base + a);                   // round the front of pulley 2
    p.push(p[0], p[1]);
    const m = mark(p, Object.assign({ weight: "detail", closed: true }, o));
    m.belt = { c1, r1, c2, r2 };
    return [m];
  };

  // ---- a Lucide icon traced in the drafting line (assets/icons/lucide.json, embedded by compose when the scene names
  // it as a string literal). Parsed here, with no DOM: the same marks in the browser and in the Node preview
  function svgPathPoints(d, k, ox, oy) {
    const out = []; let cur = [], x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null, cmd = "";
    const tok = String(d).match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) || [];
    let i = 0;
    const num = () => +tok[i++];
    const put = (px, py) => cur.push(ox + px * k, oy + py * k);
    const flush = () => { if (cur.length >= 4) out.push(cur); cur = []; };
    const cubic = (x1, y1, x2, y2, ex, ey) => { const n = 10; for (let j = 1; j <= n; j++) { const u = j / n, v = 1 - u; put(v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * ex, v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * ey); } };
    const arcTo = (rx, ry, rot, large, sweep, ex, ey) => {        // the SVG arc, endpoint to centre form
      rx = Math.abs(rx); ry = Math.abs(ry);
      if (!rx || !ry) { put(ex, ey); return; }
      const ph = rot * Math.PI / 180, cp = Math.cos(ph), sp = Math.sin(ph);
      const dx = (x - ex) / 2, dy = (y - ey) / 2, x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
      let lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const num_ = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
      const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num_ / (den || 1)));
      const cxp = co * rx * y1 / ry, cyp = -co * ry * x1 / rx, cx = cp * cxp - sp * cyp + (x + ex) / 2, cy = sp * cxp + cp * cyp + (y + ey) / 2;
      const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
      const t1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
      let dt = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
      if (!sweep && dt > 0) dt -= TAU; else if (sweep && dt < 0) dt += TAU;
      const n = Math.max(4, Math.ceil(Math.abs(dt) * Math.max(rx, ry) / 1.5));
      for (let j = 1; j <= n; j++) { const t = t1 + dt * j / n, px = rx * Math.cos(t), py = ry * Math.sin(t); put(cp * px - sp * py + cx, sp * px + cp * py + cy); }
    };
    while (i < tok.length) {
      if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), bx = rel ? x : 0, by = rel ? y : 0;
      if (C === "M") { flush(); x = bx + num(); y = by + num(); sx = x; sy = y; put(x, y); cmd = rel ? "l" : "L"; lc = lq = null; continue; }
      if (C !== "M" && C !== "Z" && !cur.length && "LHVCSQTA".includes(C)) put(x, y);   // a run after Z starts where the sub-path did
      if (C === "Z") { put(sx, sy); x = sx; y = sy; flush(); lc = lq = null; cmd = ""; continue; }
      if (C === "L") { x = bx + num(); y = by + num(); put(x, y); lc = lq = null; continue; }
      if (C === "H") { x = bx + num(); put(x, y); lc = lq = null; continue; }
      if (C === "V") { y = (rel ? y : 0) + num(); put(x, y); lc = lq = null; continue; }
      if (C === "C") { const a1 = bx + num(), b1 = by + num(), a2 = bx + num(), b2 = by + num(), ex = bx + num(), ey = by + num(); cubic(a1, b1, a2, b2, ex, ey); lc = [a2, b2]; lq = null; x = ex; y = ey; continue; }
      if (C === "S") { const a1 = lc ? 2 * x - lc[0] : x, b1 = lc ? 2 * y - lc[1] : y, a2 = bx + num(), b2 = by + num(), ex = bx + num(), ey = by + num(); cubic(a1, b1, a2, b2, ex, ey); lc = [a2, b2]; lq = null; x = ex; y = ey; continue; }
      if (C === "Q" || C === "T") {
        let qx, qy; if (C === "Q") { qx = bx + num(); qy = by + num(); } else { qx = lq ? 2 * x - lq[0] : x; qy = lq ? 2 * y - lq[1] : y; }
        const ex = bx + num(), ey = by + num(); cubic(x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), ex + 2 / 3 * (qx - ex), ey + 2 / 3 * (qy - ey), ex, ey); lq = [qx, qy]; lc = null; x = ex; y = ey; continue;
      }
      if (C === "A") { const rx = num(), ry = num(), rot = num(), la = num(), sw = num(), ex = bx + num(), ey = by + num(); arcTo(rx, ry, rot, la, sw, ex, ey); x = ex; y = ey; lc = lq = null; continue; }
      i++;                                               // an unknown token: skip it
    }
    flush();
    return out;
  }
  const attrOf = (tag, a, dflt) => { const m = new RegExp(`\\s${a}="([^"]*)"`).exec(tag); return m ? m[1] : dflt; };
  V.icon = (name, x, y, size, o) => {
    o = o || {};
    const src = ((Loom.assets || {}).icons || {})[name];
    if (!src) { Loom.error("bp_icon_unknown", `no Lucide icon "${name}" (assets/icons/lucide.json; the name must be a string literal in the scene so compose embeds it)`); return []; }
    const k = (size || 120) / 24, strokes = [];
    for (const tag of src.match(/<(path|circle|ellipse|rect|line|polyline|polygon)\b[^>]*>/g) || []) {
      const kind = /^<(\w+)/.exec(tag)[1], n = (a, d) => +attrOf(tag, a, d == null ? 0 : d);
      if (kind === "path") strokes.push(...svgPathPoints(attrOf(tag, "d", ""), k, x, y));
      else if (kind === "line") strokes.push([x + n("x1") * k, y + n("y1") * k, x + n("x2") * k, y + n("y2") * k]);
      else if (kind === "polyline" || kind === "polygon") {
        const v = (attrOf(tag, "points", "").match(/-?[\d.]+/g) || []).map(Number), p = [];
        for (let j = 0; j + 1 < v.length; j += 2) p.push(x + v[j] * k, y + v[j + 1] * k);
        if (kind === "polygon" && p.length) p.push(p[0], p[1]);
        if (p.length >= 4) strokes.push(p);
      } else if (kind === "circle" || kind === "ellipse") {
        const cx = n("cx"), cy = n("cy"), rx = kind === "circle" ? n("r") : n("rx"), ry = kind === "circle" ? n("r") : n("ry"), p = [];
        const N = Math.max(16, Math.ceil(Math.max(rx, ry) * k * TAU / 6));
        for (let j = 0; j <= N; j++) { const t = -Math.PI / 2 + TAU * j / N; p.push(x + (cx + Math.cos(t) * rx) * k, y + (cy + Math.sin(t) * ry) * k); }
        strokes.push(p);
      } else if (kind === "rect") {
        const rx_ = n("x"), ry_ = n("y"), w = n("width"), h = n("height"), r = Math.min(n("rx", n("ry", 0)), w / 2, h / 2);
        strokes.push(V.roundRect(x + rx_ * k, y + ry_ * k, w * k, h * k, r * k)[0].pts);
      }
    }
    const w = o.weight || "detail", marks = [];
    for (const p of strokes) {
      let len = 0; for (let j = 2; j < p.length; j += 2) len += Math.hypot(p[j] - p[j - 2], p[j + 1] - p[j - 1]);
      if (len < 2.5) { const m = mark([p[0], p[1], p[0] + 0.6, p[1] + 0.6], { weight: w, pen: o.pen }); m.kind = "dot"; marks.push(m); }
      else marks.push(mark(p, { weight: w, pen: o.pen }));
    }
    return marks;
  };

  // ---- lettering: a single-stroke technical hand (manifest.assets.strokeFonts, embedded by compose)
  const ROLE_CAP = 0.78;                             // cap height as a share of the pack role's smallest size (a one-line hand reads lighter than a font)
  function roleCap(role) {
    const T = (S().pack && S().pack.type) || {}, r = T[role] || T.label || [24, 28];
    return r[0] * ROLE_CAP + (role === "title" || role === "hero" || role === "display" ? 4 : 2);
  }
  function font(name) {
    const F = ((Loom.assets || {}).strokeFonts || {})[name || "HersheySans1"];
    if (!F) throw new Error(`blueprint engine: stroke font ${name || "HersheySans1"} is not in this build (compose embeds it for blueprint lessons)`);
    return F;
  }
  // a hyphen is short: Hershey's "-" is a minus sign as wide as an "M" (on-call read "on - call" in the 2026-10-16 stress
  // test). The long stroke stays for a real minus sign (U+2212). En and em dashes never appear in scene text (CLAUDE.md)
  const HYPHEN = { a: 470, s: [[205, 284, 470, 284]] };
  const glyphOf = (F, ch) => (ch === "-" || ch === "\u2010" || ch === "\u2011" ? HYPHEN : ch === "\u2212" ? F.glyphs["-"] : F.glyphs[ch] || F.glyphs["?"]);
  const advOf = (F, ch) => { const g = glyphOf(F, ch); return g ? g.a : F.adv; };
  // letter spacing as a share of the size: capitals keep the drafting spacing; mixed case is set tighter, because the
  // hand's lower case already has wide side bearings (card lettering read widely spaced in the stress test)
  const trackOf = (o, s) => (o.track != null ? o.track : /[a-z]/.test(s) ? 0.0 : 0.08);
  // the time the pen takes to letter a string: `pace` s a character (0.052 by default), a space a little less. A
  // seven-word phrase of about 44 characters letters in about 2.2 s, the time a narrator takes to say it
  const PACE = 0.052;
  const paceOf = (s, pace) => {
    let n = 0, sp = 0;
    for (const ch of String(s)) if (/\s/.test(ch)) sp++; else n++;
    const p = pace || PACE;
    return Math.max(0.15, n * p + sp * p * 0.6);
  };
  const widthStr = (F, s, k, tr) => { let a = 0; for (const ch of s) a += advOf(F, ch) * k + tr; return a - tr; };
  // lay out `str` in a box {x, y, w, h, size | role, caps, align, valign, maxLines, track}: wraps on spaces, shrinks to
  // fit, never below the floor (then it says so)
  V.text = (str, o) => {
    o = o || {};
    const F = font(o.font), want = o.size || roleCap(o.role || "label"), floor = o.minSize || Math.max(11, roleCap("caption") * 0.95);
    const s0 = o.caps === false ? String(str) : o.caps ? String(str).toUpperCase() : String(str);
    const W0 = o.w == null ? 1e9 : o.w, H0 = o.h == null ? 1e9 : o.h, gap = o.lineGap == null ? 0.7 : o.lineGap, maxL = o.maxLines || 99;
    let size = want, lines, tr = 0;
    const wrap = (k) => {
      const out = []; let cur = "";
      for (const w of s0.split(/\s+/).filter(Boolean)) {
        const t = cur ? cur + " " + w : w;
        if (cur && widthStr(F, t, k, tr) > W0) { out.push(cur); cur = w; } else cur = t;
      }
      if (cur) out.push(cur);
      return out;
    };
    for (;;) {
      const k = size / F.cap; tr = trackOf(o, s0) * size;
      lines = wrap(k);
      const tall = lines.length * size * (1 + gap) - size * gap, wide = Math.max(...lines.map((l) => widthStr(F, l, k, tr)));
      if ((lines.length <= maxL && tall <= H0 && wide <= W0) || size <= floor) break;
      size = Math.max(floor, size * 0.94);
    }
    const k = size / F.cap;
    tr = trackOf(o, s0) * size;
    const fits = !(lines.length > maxL || Math.max(...lines.map((l) => widthStr(F, l, k, tr))) > W0 + 0.5);
    const tall = lines.length * size * (1 + gap) - size * gap;
    const y0 = (o.y || 0) + (o.valign === "middle" && o.h ? (o.h - tall) / 2 : o.valign === "bottom" && o.h ? o.h - tall : 0);
    const marks = [], boxes = [], lw = clamp(size * 0.085, 1.2, 3.4);
    lines.forEach((line, li) => {
      const wl = widthStr(F, line, k, tr), x0 = (o.x || 0) + (o.align === "center" ? (W0 - wl) / 2 : o.align === "right" ? W0 - wl : 0);
      const baseY = y0 + size + li * size * (1 + gap);
      let adv = 0;
      boxes.push({ text: line, x: x0, y: baseY - size * 1.2, w: wl, h: size * 1.5, base: baseY, size, first: marks.length });
      for (const ch of line) {
        const g = glyphOf(F, ch), ga = advOf(F, ch) * k;
        if (g && g.s) for (const st of g.s) {
          const p = [];
          for (let i = 0; i < st.length; i += 2) p.push(x0 + adv + st[i] * k, baseY - st[i + 1] * k);
          if (p.length === 2) p.push(p[0] + 0.6, p[1] + 0.6);
          marks.push(mark(p, { weight: lw, kind: "text", pen: o.pen }));
        }
        adv += ga + tr;
      }
      boxes[li].last = marks.length;
    });
    marks.text = s0; marks.lines = boxes; marks.size = size; marks.fits = fits;
    marks.width = Math.max(0, ...boxes.map((b) => b.w)); marks.height = tall;
    return marks;
  };

  // ---------------------------------------------------------------- the nib: one for the film, posed by the clock
  // A small bright point with a soft halo at the drawing head; it travels between strokes and fades when the pen rests.
  // One for the whole film (two beats never pose two nibs), moved to the station it draws on, always on top there.
  let NIB = null;
  function nibInstall(host) {
    if (NIB) return NIB;
    NIB = { segs: [], free: -1, node: null };
    const g = svg("g", { class: "lm-bp-nib", opacity: 0, "pointer-events": "none", filter: "url(#lm-bp-soft-nib)" }, host);
    const ac = S().c("accent"), ink = S().c("ink");
    // a glowing nib (the wow pass, 2026-10-16): a wide faint bloom, a tight cyan halo, a white-hot core; drawn
    // soft by the engine's blur when the sheet has made its filters (a frame without them keeps the rings)
    svg("circle", { cx: 0, cy: 0, r: 30, fill: ac, opacity: 0.07 }, g);
    svg("circle", { cx: 0, cy: 0, r: 16, fill: ac, opacity: 0.16 }, g);
    svg("circle", { cx: 0, cy: 0, r: 8, fill: ac, opacity: 0.38 }, g);
    svg("circle", { cx: 0, cy: 0, r: 3.6, fill: ink, opacity: 1 }, g);
    NIB.node = g;
    const pose = (t) => {
      const S_ = NIB.segs; let q = null;
      if (S_.length) {
        const i = S_.findIndex((s) => s.t1 >= t);
        if (i >= 0 && t >= S_[i].t0) {
          const s = S_[i], p = at(s.m, clamp((t - s.t0) / Math.max(1e-6, s.t1 - s.t0), 0, 1) * s.m.len);
          q = { x: p[0] + s.ox, y: p[1] + s.oy, a: 1, host: s.host };
        } else {
          const a = i < 0 ? S_[S_.length - 1] : i > 0 ? S_[i - 1] : null, b = i < 0 ? null : S_[i];
          const gap = a && b && a.host === b.host ? b.t0 - a.t1 : 1e9;
          if (a && b && gap < 0.6) {                   // a hop to the next stroke, a little dimmer
            const u = clamp((t - a.t1) / gap, 0, 1), e = u * u * (3 - 2 * u), [ax, ay] = endOf(a.m), [bx, by] = startOf(b.m);
            q = { x: lerp(ax + a.ox, bx + b.ox, e), y: lerp(ay + a.oy, by + b.oy, e), a: 0.55, host: a.host };
          } else if (a && t - a.t1 < 0.3) {            // fading where it stopped
            const [ax, ay] = endOf(a.m); q = { x: ax + a.ox, y: ay + a.oy, a: 1 - (t - a.t1) / 0.3, host: a.host };
          } else if (b && b.t0 - t < 0.25) {           // brightening where it starts
            const [bx, by] = startOf(b.m); q = { x: bx + b.ox, y: by + b.oy, a: 1 - (b.t0 - t) / 0.25, host: b.host };
          }
        }
      }
      if (!q) { g.setAttribute("opacity", 0); return; }
      if (q.host && q.host.lastChild !== g) q.host.appendChild(g);
      g.setAttribute("opacity", clamp(q.a, 0, 1).toFixed(3));
      g.setAttribute("transform", `translate(${f1(q.x)} ${f1(q.y)})`);
    };
    if (Loom.clock) Loom.clock(pose);
    else {                                           // no film clock (an old build): one long drive poses it
      const proxy = { v: 0 };
      Loom.tween(proxy, { v: 0 }, { v: 1, duration: 3600, ease: "none", onUpdate() { pose(proxy.v * 3600); } }, 0, { kind: "performer", name: "bp_nib", content: false });
    }
    return NIB;
  }

  // ---------------------------------------------------------------- the sheet: one scheduler for a scene
  function sheet(ctx, opts) {
    opts = opts || {};
    const beat = ctx.beat, D = { nib: opts.nib !== false };
    const host = (ctx.station && ctx.station.svg) || ctx.g;
    const own = { segs: [], free: -1 };                // a sheet with no nib keeps its own schedule
    D._par = { segs: [], free: -1 };                    // furniture drawn in parallel (D.draw {parallel: true})
    const H = () => (D.nib ? nibInstall(host) : own);
    const worldOf = (E) => {
      let x = 0, y = 0;
      for (let n = E.outer; n && n !== ctx.g && n.parentNode; n = n.parentNode) {
        const tr = n.getAttribute && n.getAttribute("transform"), m = tr && /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\s*\)/.exec(tr);
        if (m && n.classList && n.classList.contains("lm-el")) { x += +m[1]; y += +m[2]; }
      }
      return [x, y];
    };
    const meta = (E, kind) => ({ kind: kind || "draw", beat: beat.id, name: E.name, content: true });
    const need = (E, what) => { if (!E || !E.inner) throw new Error(`${beat.id}: ${what} needs an element made with ctx.el`); };
    // `by` and `quick` for a call made of several pen runs (a figure, a balloon, a dimension, the notes title): `quick`
    // prints it beside the pen in a short window (it never waits for the pen); `by` ends it on a spoken word. Returns
    // {t0, by, par}: where the window starts (the pen's free time unless parallel), its end (or null) and the mode
    const windowOf = (o, quickDur) => {
      const at0 = o.at == null ? ctx.speechStart : o.at, par = !!(o.quick || o.parallel);
      const t0 = par ? at0 : Math.max(at0, H().free + 0.04);
      const by = o.by != null ? Math.max(o.by, t0 + 0.1) : o.quick ? t0 + (o.dur || quickDur) : null;
      return { t0, by, par };
    };
    // the end of each step when a window [t0, by] is shared by weight
    const shares = (w, ws) => { const s = ws.reduce((a, b) => a + b, 0) || 1; let acc = 0; return ws.map((x) => (w.by == null ? undefined : w.t0 + (w.by - w.t0) * (acc += x) / s)); };

    // ================================================================ the look (2026-10-16, the wow pass)
    // Kshitij: "The cool factor and the wow factor ... feels like it's gone" (docs/research/2026-10-16-wow-hologram-
    // blueprint.md). The parts were flat blue cut-outs on the cyanotype paper and the lines crisp and uniform. Now:
    // - every element's marks sit in one ink group with a faint two-pass bloom (`glow: false` on the sheet turns it off);
    // - a part's paper is translucent (the sheet's mottle, creases and grid show through it) and what is BEHIND it is
    //   hidden by a mask instead (`occlude: false` turns that off): the lines of an element lower in the page lose the
    //   part's shape from the moment its paper is down. A mask is still: while the part moves (an explode, a travel, a
    //   stepping mechanism) or after it leaves, its holes close and its paper turns nearly solid instead;
    // - the nib glows; the hero part (D.hero) has a volume, a glow and a shadow that falls across the lines under it.
    const LOOK = { glow: opts.glow !== false, occlude: opts.occlude !== false, paperAlpha: opts.paperAlpha };
    const els = [], papers = [], holes = [];
    function defs() {
      let r = host; while (r.ownerSVGElement) r = r.ownerSVGElement;
      if (r.__bpDefs) return r.__bpDefs;
      const d = svg("defs", { class: "lm-bp-defs" }, r);
      const blur = (id, sd) => {
        const f = svg("filter", { id, filterUnits: "userSpaceOnUse", x: -4000, y: -4000, width: 12000, height: 12000, "color-interpolation-filters": "sRGB" }, d);
        svg("feGaussianBlur", { in: "SourceGraphic", stdDeviation: sd }, f);
      };
      // the bloom: the line itself, a tight soft pass and a wide faint one (two passes at low opacity)
      const g = svg("filter", { id: "lm-bp-glow", filterUnits: "userSpaceOnUse", x: -4000, y: -4000, width: 12000, height: 12000, "color-interpolation-filters": "sRGB" }, d);
      svg("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 1.8, result: "b1" }, g);
      svg("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 6, result: "b2" }, g);
      const c1 = svg("feComponentTransfer", { in: "b1", result: "g1" }, g); svg("feFuncA", { type: "linear", slope: 0.55 }, c1);
      const c2 = svg("feComponentTransfer", { in: "b2", result: "g2" }, g); svg("feFuncA", { type: "linear", slope: 0.3 }, c2);
      const mg = svg("feMerge", {}, g);
      for (const n of ["g2", "g1", "SourceGraphic"]) svg("feMergeNode", { in: n }, mg);
      blur("lm-bp-soft", 8); blur("lm-bp-soft2", 18); blur("lm-bp-soft-nib", 1.2);
      r.__bpDefs = d;
      return d;
    }
    const pathOf = (n) => { const p = []; for (; n && n.parentNode; n = n.parentNode) p.unshift(Array.prototype.indexOf.call(n.parentNode.childNodes, n)); return p; };
    const above = (A, B) => {                         // A is painted over B (later in the page, or inside it)
      const a = pathOf(A.outer), b = pathOf(B.outer);
      for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] > b[i];
      return a.length > b.length;
    };
    const inside = (E, A) => { for (let n = E.outer; n; n = n.parentNode) if (n === A.inner) return true; return false; };
    function maskOf(E2) {
      if (E2.__bpMask) return E2.__bpMask;
      const id = Loom.uid("lm-bp-m");
      const mk = svg("mask", { id, maskUnits: "userSpaceOnUse", x: -6000, y: -6000, width: 14000, height: 14000 }, E2.inner);
      svg("rect", { x: -6000, y: -6000, width: 14000, height: 14000, fill: "#ffffff" }, mk);
      E2.__bpInk.setAttribute("mask", `url(#${id})`);
      return (E2.__bpMask = mk);
    }
    function hole(E2, P) {
      const [ax, ay] = worldOf(P.E), [bx, by] = worldOf(E2), dx = ax - bx, dy = ay - by;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < P.pts.length; i += 2) { x0 = Math.min(x0, P.pts[i] + dx); x1 = Math.max(x1, P.pts[i] + dx); y0 = Math.min(y0, P.pts[i + 1] + dy); y1 = Math.max(y1, P.pts[i + 1] + dy); }
      const M = 320, w2 = E2.w || 1920, h2 = E2.h || 1080;   // marks may reach past their element's box (dimensions, leaders)
      if (x1 < -M || y1 < -M || x0 > w2 + M || y0 > h2 + M) return;
      const n = svg("path", { d: dpath(P.pts.map((v, i) => v + (i % 2 ? dy : dx)), true), fill: "#000000", opacity: 0, class: "lm-bp-hole" }, maskOf(E2));
      holes.push({ node: n, t0: P.t0, E: P.E });
    }
    function inkOf(E) {
      if (E.__bpInk) return E.__bpInk;
      defs();
      const g = svg("g", { class: "lm-bp-ink" }, E.inner);
      if (LOOK.glow) g.setAttribute("filter", "url(#lm-bp-glow)");
      E.__bpInk = g; els.push(E);
      for (const P of papers) if (P.E !== E && above(P.E, E)) hole(E, P);
      return g;
    }
    D.ink = inkOf;
    // when a part starts to move (its first travel, explode or mechanism step), read from the build's own record
    let mvN = -1, mvMap = null;
    const moveT = (E) => {
      const T = (Loom.report && Loom.report.tweens) || [];
      if (T.length !== mvN) {
        mvMap = new Map(); mvN = T.length;
        for (const w of T) if (w.kind === "travel" || w.kind === "along" || w.kind === "mechanism") { const k = w.beat + "|" + w.name; if (!mvMap.has(k) || w.t0 < mvMap.get(k)) mvMap.set(k, w.t0); }
      }
      const v = mvMap.get(beat.id + "|" + E.name);
      return Math.min(v == null ? 1e9 : v, E.__bpMoveT == null ? 1e9 : E.__bpMoveT);
    };
    let posing = false;
    function pose(t) {                                 // a pure function of t and of the finished build
      for (const h of holes) { const E = h.E, end = Math.min(E.exitT == null ? 1e9 : E.exitT, moveT(E)); h.node.setAttribute("opacity", t >= h.t0 && t < end ? 1 : 0); }
      for (const P of papers) { const solid = LOOK.occlude && t >= moveT(P.E); for (const f of P.fills) f.setAttribute("fill-opacity", (solid ? Math.max(P.alpha, 0.9) : P.alpha).toFixed(3)); }
    }
    function installPose() {
      if (posing) return; posing = true;
      if (Loom.clock) Loom.clock(pose);
      else { const pr = { v: 0 }; Loom.tween(pr, { v: 0 }, { v: 1, duration: 3600, ease: "none", onUpdate() { pose(pr.v * 3600); } }, 0, { kind: "performer", name: "bp_occlude", content: false }); }
    }
    function paperOf(E, parent, m, t0) {
      const tone = m.fill, alpha = m.paperAlpha != null ? m.paperAlpha : LOOK.paperAlpha != null ? LOOK.paperAlpha : tone === "field" ? 0.3 : 0.6;
      const f = svg("path", { d: dpath(m.pts, true), fill: S().c(tone), "fill-opacity": (LOOK.occlude ? alpha : 1).toFixed(3), stroke: "none", opacity: 0, class: "lm-bp-paper" }, parent);
      Loom.tween(f, { opacity: 0 }, { opacity: 1, duration: 0.35 }, t0, meta(E));
      if (!LOOK.occlude || !m.closed || (parent.getAttribute && parent.getAttribute("transform"))) return;
      const P = { E, pts: m.pts, t0, fills: [f], alpha };
      papers.push(P);
      for (const E2 of els) if (E2 !== E && above(E, E2)) hole(E2, P);
      installPose();
    }

    // draw one mark into a parent node over [t0, t1]; returns nothing (its reveal is on the timeline)
    function reveal(E, parent, m, t0, t1, col) {
      const d = Math.max(0.02, t1 - t0);
      if (m.fill) paperOf(E, parent, m, t0);           // paper under an outline: what is behind is hidden from its start
      if (m.dash) {                                     // a convention line: its dashes appear in order along it
        const pat = m.dash;                             // [on, off, on, off, ...]
        let s = 0, k = 0;
        while (s < m.len - 0.5 && k < 4000) {
          const e = Math.min(m.len, s + Math.max(0.5, pat[k % pat.length]));
          if (k % 2 === 0) {
            const p = svg("path", { d: dpath(slice(m, s, e)), fill: "none", stroke: col, "stroke-width": m.w.toFixed(2), "stroke-linecap": "butt", opacity: 0 }, parent);
            Loom.tween(p, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0 + d * s / m.len, meta(E));
          }
          s = e; k++;
        }
        return;
      }
      if (m.len < m.w * 1.4) {                          // a dot
        const c = svg("circle", { cx: f1(m.pts[0]), cy: f1(m.pts[1]), r: (m.w * 0.6).toFixed(2), fill: col, opacity: 0 }, parent);
        Loom.tween(c, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0, meta(E));
        return;
      }
      const L = m.len, off0 = L + m.w + 2;
      const p = svg("path", { d: dpath(m.pts, m.closed && false), fill: "none", stroke: col, "stroke-width": m.w.toFixed(2),
        "stroke-linecap": m.kind === "text" ? "round" : "square", "stroke-linejoin": "round",
        "stroke-dasharray": `${L.toFixed(2)} ${(L + 3 * m.w + 6).toFixed(2)}`, "stroke-dashoffset": off0.toFixed(2) }, parent);
      Loom.tween(p, { strokeDashoffset: off0 }, { strokeDashoffset: 0, duration: d, ease: "none" }, t0, meta(E));
      if (m.head) {                                     // a flow arrow's head lands as the shaft arrives
        const [ex, ey] = endOf(m), [px, py] = at(m, Math.max(0, L - 2)), a = Math.atan2(ey - py, ex - px), h = m.head;
        const pts = [ex, ey, ex - Math.cos(a - 0.35) * h, ey - Math.sin(a - 0.35) * h, ex - Math.cos(a + 0.35) * h, ey - Math.sin(a + 0.35) * h];
        const hd = svg("path", { d: dpath(pts, true), fill: col, stroke: "none", opacity: 0 }, parent);
        Loom.tween(hd, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0 + d * 0.96, meta(E));
      }
    }

    // ---- draw marks into an element, in order, one pen; returns the time the last stroke ends
    D.draw = function (E, marks, o) {
      o = o || {};
      need(E, "sheet.draw");
      const list = [].concat(marks || []).filter(Boolean);
      const want = o.at == null ? ctx.speechStart : o.at;
      if (!list.length) return want;
      const h = o.parallel ? D._par : H();          // parallel: sheet furniture drawn beside the pen (no nib, never late)
      let t = Math.max(want, o.parallel ? want : h.free + 0.04);
      const late = t - (o.asked != null ? Math.min(o.asked, want) : want);   // `asked`: when the caller first wanted it (D.letter)
      if (late > 0.3) Loom.warn("bp_pen_late", `${beat.id}: the pen starts "${E.name}" ${late.toFixed(2)}s after it was asked (it was still drafting)`, { beat: beat.id });
      const [ox, oy] = worldOf(E), parent = o.parent || inkOf(E);
      // under a sheet camera (D.camera) the nib lives inside the sheet element, so it moves with the drawing
      const camE = D._camEl && E !== D._camEl && inside(E, D._camEl) ? D._camEl : null;
      const [cox, coy] = camE ? worldOf(camE) : [0, 0], segHost = camE ? camE.inner : host;
      // hops between strokes: a letter's strokes are close together, so lettering moves on quickly
      const gaps = list.map((m, i) => i ? (m.kind === "text" ? clamp(Math.hypot(m.pts[0] - endOf(list[i - 1])[0], m.pts[1] - endOf(list[i - 1])[1]) / 4000, 0.008, 0.05)
        : clamp(Math.hypot(m.pts[0] - endOf(list[i - 1])[0], m.pts[1] - endOf(list[i - 1])[1]) / 2200, 0.02, 0.16)) : 0);
      const speed = o.speed || 1100;                    // px a second along a line (lettering slower, hatching faster)
      let durs = list.map((m) => Math.max(m.kind === "text" ? 0.022 : 0.06, m.len / (m.kind === "text" ? speed * 0.45 : m.kind === "hatch" ? speed * 1.8 : speed)) * (o.slow || 1));
      // `natural`: the run's own length in seconds (lettering at the pace of speech, D.letter); fitted like `dur`
      let win = o.by != null ? o.by - t : o.dur != null ? o.dur : o.natural != null ? o.natural * (o.slow || 1) : null;
      // catching up: a run that starts late and has no deadline is drawn faster (at most 1.8 x), so one slow part does
      // not push every later word further from its cue (the whiteboard engine's rule, 2026-10-15)
      if (late > 0.1 && o.by == null && o.dur == null && !o.parallel) {
        const nat = win != null ? win : durs.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0), k = Math.min(1.8, 1 + late / Math.max(0.4, nat));
        if (win != null) win /= k; else for (let i = 0; i < durs.length; i++) { durs[i] /= k; gaps[i] /= k; }
      }
      if (win != null) {                                // fit: finish exactly at `by` (a spoken word); hops take at most 30 %
        if ((o.by != null || o.dur != null) && win < 0.06 * Math.sqrt(list.length)) Loom.warn("bp_window_tight", `${beat.id}: ${list.length} strokes of "${E.name}" in ${win.toFixed(2)}s`, { beat: beat.id });
        const G = gaps.reduce((a, b) => a + b, 0), gs = G > Math.max(0, win) * 0.3 ? Math.max(0, win) * 0.3 / G : 1;
        for (let i = 0; i < gaps.length; i++) gaps[i] *= gs;
        const avail = Math.max(list.reduce((a, m) => a + (m.kind === "text" ? 0.005 : 0.03), 0), win - G * gs), Lsum = list.reduce((a, m) => a + m.len, 0);
        durs = list.map((m) => avail * m.len / Lsum);
      }
      const t00 = t;
      list.forEach((m, i) => {
        t += gaps[i];
        const t0 = t, t1 = t + durs[i];
        reveal(E, parent, m, t0, t1, S().c(o.pen || m.pen || "ink"));
        h.segs.push({ m, t0, t1, ox: ox - cox, oy: oy - coy, host: segHost });
        t = t1;
      });
      h.segs.sort((a, b) => a.t0 - b.t0);
      h.free = t;
      if (o.sound && Loom.sfx) Loom.sfx("pen", t00, { g: 0.4 });
      if (E.revealT == null || t00 < E.revealT) { E.revealT = t00; E.revealKind = "draw"; }
      return t;
    };

    // ---- a part in drafting order: centre lines, paper and outline, detail, hidden edges, hatching. Each layer is a
    // separate pass of the pen, the way a draughtsman builds a view. `by` fits the whole part to a spoken word.
    D.part = function (E, layers, o) {
      o = o || {};
      need(E, "sheet.part");
      const ORDER = [["centre", "muted"], ["outline", o.pen || "ink"], ["detail", o.pen || "ink"], ["hidden", "muted"], ["hatch", "muted"]];
      const groups = ORDER.map(([k, pen]) => {
        const ms = [].concat(layers[k] || []).filter(Boolean).map((m) => {
          if (k === "outline" && layers.paper !== false && m.closed && !m.fill) m.fill = layers.paper || "field";
          if (k === "detail" && m.w === widthOf("outline")) m.w = widthOf("detail");
          return m;
        });
        return { k, pen, ms };
      }).filter((g) => g.ms.length);
      let t = o.at == null ? ctx.speechStart : o.at;
      if (o.by != null) {                               // share the window by length, a short pause between layers
        const win = Math.max(0.2, o.by - t), L = groups.map((g) => g.ms.reduce((a, m) => a + m.len, 0)), Ls = L.reduce((a, b) => a + b, 0) || 1;
        const pause = Math.min(0.18, win * 0.06);
        groups.forEach((g, i) => { const d = Math.max(0.1, (win - pause * (groups.length - 1)) * L[i] / Ls); t = D.draw(E, g.ms, { at: t, dur: d, pen: g.pen }) + pause; });
        return t - pause;
      }
      for (const g of groups) t = D.draw(E, g.ms, { at: ctx.onBeat ? ctx.onBeat(t, 2) : t, pen: g.pen }) + 0.12;
      return t - 0.12;
    };

    // ---- lettering in the technical hand. The words are also on the page as text the checks read (same place and width,
    // invisible: the strokes paint them)
    D.letter = function (E, str, o) {
      o = o || {};
      need(E, "sheet.letter");
      const marks = V.text(str, Object.assign({ x: o.x || 0, y: o.y || 0, w: o.w || E.w || undefined, h: o.h || E.h || undefined }, o));
      if (!marks.fits) Loom.warn("bp_text_floor", `${beat.id}: "${String(str).slice(0, 40)}" does not fit "${E.name}" (${E.w}x${E.h}) at the smallest size`, { beat: beat.id });
      // quick: printed fast beside the pen (a card's body, a note): the teaching register cannot letter every word by hand
      if (o.quick) { o = Object.assign({}, o, { parallel: true }); if (o.by == null && o.dur == null) o.dur = clamp(0.25 + String(str).length * 0.012, 0.3, 0.9); }
      // lettered by the pen, it keeps pace with speech: about 3 words a second (it was 1.6 to 1.9 before 2026-10-16, so a
      // dense sheet drifted seconds behind its narration). Per character, so a large title takes no longer than a label
      else if (o.by == null && o.dur == null) o = Object.assign({}, o, { natural: paceOf(marks.text, o.pace) });
      const t0 = o.parallel ? (o.at == null ? ctx.speechStart : o.at) : Math.max(o.at == null ? ctx.speechStart : o.at, H().free + 0.04);
      const fam = (S().font && S().font("mono") && S().font("mono").family) || "monospace";
      for (const b of marks.lines) {
        const tx = svg("text", { x: f1(b.x), y: f1(b.base), "font-size": f1(b.size / 0.72), "font-family": fam,
          textLength: Math.max(1, b.w).toFixed(1), lengthAdjust: "spacingAndGlyphs", "fill-opacity": 0, opacity: 0, "data-engine-text": "blueprint" }, o.parent || inkOf(E));
        tx.textContent = b.text;
        Loom.tween(tx, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0, meta(E));
      }
      const t = D.draw(E, marks, Object.assign({}, o, { at: t0, asked: o.at == null ? ctx.speechStart : o.at }));
      D.lastText = marks;
      return t;
    };

    // ---- a dimension: extension lines, a dimension line with closed arrowheads, the figure lettered above it in amber.
    // `value` with `unit` makes a live figure: the handle's set(value, at, dur) counts it to a new value on the timeline
    D.dim = function (E, x0, y0, x1, y1, o) {
      o = o || {};
      need(E, "sheet.dim");
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * (o.side === "left" ? -1 : 1), ny = ux * (o.side === "left" ? -1 : 1);
      const off = o.off == null ? 50 : o.off, gap = 8, over = 10;
      const ax = x0 + nx * off, ay = y0 + ny * off, bx = x1 + nx * off, by_ = y1 + ny * off;
      const ext = [].concat(V.line(x0 + nx * gap, y0 + ny * gap, ax + nx * over, ay + ny * over, { weight: "thin" }),
        V.line(x1 + nx * gap, y1 + ny * gap, bx + nx * over, by_ + ny * over, { weight: "thin" }));
      const dl = V.line(ax, ay, bx, by_, { weight: "thin" });
      const pen = o.pen || "muted";
      // `by` / `quick`: the lines take 55 % of the window, the figure the rest
      const win = windowOf(o, 0.6), [lineBy] = shares(win, [0.55, 0.45]);
      let t = D.draw(E, ext.concat(dl), { at: win.t0, pen, by: lineBy, dur: lineBy == null ? (o.dur || Math.min(0.9, 0.25 + L / 1600)) : undefined, parallel: win.par });
      // arrowheads (or ticks), placed when the line is there
      const heads = svg("g", { opacity: 0 }, inkOf(E)), col = S().c(pen), hl = 13, hw = 4;
      const head = (x, y, dx, dy) => {
        if (o.ends === "tick") svg("path", { d: dpath([x - (dx + dy) * 7, y - (dy - dx) * 7, x + (dx + dy) * 7, y + (dy - dx) * 7]), stroke: col, "stroke-width": widthOf("thin").toFixed(2), fill: "none" }, heads);
        else svg("path", { d: dpath([x, y, x + dx * hl - dy * hw, y + dy * hl + dx * hw, x + dx * hl + dy * hw, y + dy * hl - dx * hw], true), fill: col }, heads);
      };
      head(ax, ay, ux, uy); head(bx, by_, -ux, -uy);
      Loom.tween(heads, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t - 0.05, meta(E));
      // the figure, centred above the dimension line, turned with it (never upside down)
      const fmt = (v) => (o.text != null && o.value == null ? String(o.text) : `${(+v).toFixed(o.decimals || 0)}${o.unit ? " " + o.unit : ""}`);
      let ang = Math.atan2(uy, ux) * 180 / Math.PI; if (ang > 90.01 || ang < -89.99) ang += 180;
      const size = o.size || roleCap("label");
      const fg = svg("g", { transform: `translate(${f1((ax + bx) / 2 + nx * (size * 0.55 + 6))} ${f1((ay + by_) / 2 + ny * (size * 0.55 + 6))}) rotate(${f1(ang)})` }, inkOf(E));
      const figPen = o.figPen || "accent2";
      const H0 = { t, value: o.value };
      const place = (str) => {                           // the figure's strokes, centred on (0, 0) of fg
        const ms = V.text(str, { size, caps: false, track: 0.06 });
        const w = ms.width;
        for (const m of ms) for (let i = 0; i < m.pts.length; i += 2) { m.pts[i] -= w / 2; m.pts[i + 1] -= size * 0.5; }
        return ms;
      };
      const first = place(fmt(o.value == null ? 0 : o.value));
      const figE = { name: E.name, inner: fg, outer: E.outer, w: 0, h: 0 };
      t = D.draw(figE, first, { at: t, pen: figPen, by: win.by == null ? undefined : Math.max(win.by, t + 0.08), natural: win.by == null ? paceOf(first.text) : undefined, parallel: win.par });
      const fam = (S().font && S().font("mono") && S().font("mono").family) || "monospace";
      const tx = svg("text", { x: f1(-first.width / 2), y: f1(size * 0.5), "font-size": f1(size / 0.72), "font-family": fam, textLength: Math.max(1, first.width).toFixed(1),
        lengthAdjust: "spacingAndGlyphs", "fill-opacity": 0, opacity: 0, "data-engine-text": "blueprint" }, fg);
      tx.textContent = fmt(o.value == null ? 0 : o.value);
      Loom.tween(tx, { opacity: 0 }, { opacity: 1, duration: 0.01 }, H0.t, meta(E));
      H0.t = t;
      // live: the figure is redrawn as it counts (one drive; the strokes are a pure function of the drive's progress)
      H0.set = function (to, when, dur) {
        if (o.value == null) throw new Error(`${beat.id}: a dimension's set() needs it made with {value, unit}`);
        const from = H0.value, live = svg("g", { opacity: 0 }, fg), d = dur || 0.9;
        const old = Array.from(fg.childNodes).filter((n) => n !== live);
        Loom.drive((e, p) => {
          if (!(p > 0)) { live.setAttribute("opacity", 0); for (const n of old) n.setAttribute && n.setAttribute("opacity", 1); tx.textContent = fmt(from); return; }
          const v = lerp(from, to, e), ms = place(fmt(v));
          live.innerHTML = ms.map((m) => `<path d="${dpath(m.pts)}" fill="none" stroke="${S().c(figPen)}" stroke-width="${m.w.toFixed(2)}" stroke-linecap="round"/>`).join("");
          live.setAttribute("opacity", 1);
          for (const n of old) n.setAttribute && n.setAttribute("opacity", 0);
          tx.textContent = fmt(v);
        }, when, d, (u) => u * u * (3 - 2 * u), { kind: "count", beat: beat.id, name: E.name + "_dim", content: true, key: "bpdim:" + E.name + ":" + when });
        H0.value = to;
        return when + d;
      };
      return H0;
    };

    // ---- a numbered balloon on a leader that ends on the part with a dot
    D.balloon = function (E, n, cx, cy, o) {
      o = o || {};
      need(E, "sheet.balloon");
      const r = o.r || Math.max(18, roleCap("label") * 1.05), pen = o.pen || "ink";
      // `by` / `quick`: leader 30 %, circle 35 %, number 35 % of the window
      const win = windowOf(o, 0.45), [b1, b2, b3] = shares(win, o.to ? [0.3, 0.35, 0.35] : [0, 0.5, 0.5]);
      let t = win.t0;
      if (o.to) {
        const [px, py] = o.to, L = Math.hypot(px - cx, py - cy) || 1;
        t = D.draw(E, V.line(cx + (px - cx) / L * r, cy + (py - cy) / L * r, px, py, { weight: "thin" }), { at: t, pen: o.leaderPen || "muted", by: b1, parallel: win.par });
        const dot = svg("circle", { cx: f1(px), cy: f1(py), r: 3.6, fill: S().c(o.leaderPen || "muted"), opacity: 0 }, inkOf(E));
        Loom.tween(dot, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t, meta(E));
      }
      t = D.draw(E, V.circle(cx, cy, r, { weight: "detail", fill: "field" }), { at: t, pen, by: b2 == null ? undefined : Math.max(b2, t + 0.06), parallel: win.par });
      return D.letter(E, String(n), { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, size: r * 0.8, align: "center", valign: "middle", at: t, pen, caps: false,
        by: b3 == null ? undefined : Math.max(b3, t + 0.06), parallel: win.par });
    };

    // ---- a leader to a note: a narrow line with a short shoulder, the note lettered at its end
    D.leader = function (E, points, o) {
      o = o || {};
      need(E, "sheet.leader");
      const P = flat(points);
      const win = windowOf(o, 0.6), [l1] = shares(win, o.note ? [0.3, 0.7] : [1]);
      let t = D.draw(E, V.path(P, { weight: "thin" }), { at: win.t0, pen: o.pen || "muted", by: l1, parallel: win.par });
      const [sx, sy] = [P[0], P[1]];
      const dot = svg("circle", { cx: f1(sx), cy: f1(sy), r: 3.4, fill: S().c(o.pen || "muted"), opacity: 0 }, inkOf(E));
      Loom.tween(dot, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t - 0.05, meta(E));
      if (o.note) {
        const [ex, ey] = [P[P.length - 2], P[P.length - 1]], left = o.noteSide === "left";
        const w = o.noteW || 360, size = o.size || roleCap("label");
        t = D.letter(E, o.note, { x: left ? ex - w - 10 : ex + 10, y: ey - size * 1.25, w, h: size * 2.6, size, align: left ? "right" : "left", at: t, pen: o.notePen || "ink", caps: o.caps,
          by: win.by == null ? undefined : Math.max(win.by, t + 0.1), parallel: win.par });
      }
      return t;
    };

    // ---- a cutting plane: a phantom line with heavy ends, arrows that show the view's direction, its letters
    D.section = function (E, x0, y0, x1, y1, o) {
      o = o || {};
      need(E, "sheet.section");
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, s = o.look === "left" ? -1 : 1;
      const nx = -uy * s, ny = ux * s, k = 34, pen = o.pen || "accent";
      const marks = [].concat(
        V.phantom([x0, y0, x1, y1], { pen }),
        V.line(x0, y0, x0 + ux * k, y0 + uy * k, { weight: "outline" }), V.line(x1 - ux * k, y1 - uy * k, x1, y1, { weight: "outline" }),
        V.arrow(x0, y0, x0 + nx * 46, y0 + ny * 46, { weight: "detail", head: 14 }), V.arrow(x1, y1, x1 + nx * 46, y1 + ny * 46, { weight: "detail", head: 14 }));
      let t = D.draw(E, marks, { at: o.at, pen, by: o.by });
      const lab = o.label || "A", size = roleCap("label") * 1.1;
      for (const [x, y] of [[x0 + nx * 70, y0 + ny * 70], [x1 + nx * 70, y1 + ny * 70]])
        t = D.letter(E, lab, { x: x - size, y: y - size, w: size * 2, h: size * 2, size, align: "center", valign: "middle", at: t, pen, caps: true });
      return t;
    };

    // ---- a figure label ("FIG. 1", a sub-title under it) and its rewrite: struck through, then the next figure lettered
    // in its place. The transition from one view to the next, the way a revised sheet reads
    D.fig = function (E, label, o) {
      o = o || {};
      need(E, "sheet.fig");
      const size = o.size || roleCap("lead"), subSize = size * 0.62;
      // the double underline sits under the label, and the sub-title starts a clear gap below it (the second rule used to
      // touch the sub-title's capitals: every figure of the 2026-10-16 stress test)
      const ul1 = size * 1.3, ul2 = ul1 + Math.max(5, size * 0.2), subY = ul2 + Math.max(8, size * 0.4);
      let cur = svg("g", {}, inkOf(E));
      // `by` / `quick` (o, or the third argument of next): label, rules and sub-title share the window by their length
      const write = (lab, sub, when, g, wo) => {
        const win = windowOf(Object.assign({}, wo, { at: when }), 0.7), pen = o.pen || "ink";
        const [b1, b2, b3] = shares(win, [paceOf(lab), 0.25, sub ? paceOf(sub) * 0.8 : 0]);
        let t = D.letter(E, lab, { parent: g, x: 0, y: 0, w: E.w, h: size * 1.4, size, caps: true, at: win.t0, pen, by: b1, parallel: win.par });
        const lw = D.lastText ? D.lastText.width : 0;
        const ul = V.line(0, ul1, Math.max(lw, 60), ul1, { weight: "detail" }).concat(V.line(0, ul2, Math.max(lw, 60), ul2, { weight: "thin" }));
        t = D.draw(E, ul, { at: t, pen, parent: g, by: b2 == null ? undefined : Math.max(b2, t + 0.06), parallel: win.par });
        if (sub) t = D.letter(E, sub, { parent: g, x: 0, y: subY, w: E.w, h: subSize * 1.3, size: subSize, caps: true, at: t, pen: "muted",
          by: b3 == null ? undefined : Math.max(b3, t + 0.1), parallel: win.par });
        return { t, w: lw };
      };
      const r = write(label, o.sub, o.at == null ? ctx.speechStart : o.at, cur, { by: o.by, quick: o.quick, dur: o.dur });
      const Hd = { t: r.t, w: r.w, sub: { y: subY, size: subSize } };
      Hd.next = function (label2, sub2, when, wo) {      // strike the old label, then letter the new one in its place
        wo = wo || {};
        let t = D.draw(E, V.line(-6, size * 0.55, Hd.w + 6, size * 0.45, { weight: "detail" }), { at: when, pen: "accent3", parent: cur, dur: wo.quick || wo.by != null ? 0.2 : undefined, parallel: !!wo.quick });
        const old = cur;
        Loom.tween(old, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t + 0.15, meta(E, "exit"));
        cur = svg("g", {}, inkOf(E));
        const q = write(label2, sub2, t + 0.4, cur, wo);
        Hd.t = q.t; Hd.w = q.w;
        return Hd.t;
      };
      return Hd;
    };

    // ---- the title block: a table of fields (label above, value lettered), a status field for the verdict, revision rows.
    // The block is the lesson's record: the stamp is the verdict, the revision rows are its history
    D.titleBlock = function (E, fields, o) {
      o = o || {};
      need(E, "sheet.titleBlock");
      const w = E.w, h = E.h, rows = fields.length, rh = h / Math.max(1, rows);
      let t = D.draw(E, V.rect(0, 0, w, h, { fill: o.paper === false ? null : "field" }).concat(
        ...Array.from({ length: rows - 1 }, (_, i) => V.line(0, rh * (i + 1), w, rh * (i + 1), { weight: "thin" })),
        V.line(w * 0.34, 0, w * 0.34, h, { weight: "thin" })), { at: o.at, pen: "ink", dur: o.dur || 1.0, parallel: o.printed !== false });
      const small = Math.max(10, Math.min(rh * 0.28, roleCap("caption")));
      const tFrame = t;                                 // the printed field labels all appear with the frame
      fields.forEach(([lab, val], i) => {
        D.letter(E, lab, { x: 10, y: rh * i + (rh - small * 1.2) / 2, w: w * 0.34 - 20, h: small * 1.6, size: small, caps: true, at: tFrame, pen: "muted", parallel: o.printed !== false, dur: 0.25 });
      });
      // each value is lettered into its own group, so a later fill of the same field replaces it (SHEET 2 OF 3 becomes
      // 3 OF 3) instead of lettering over it
      const vals = [];
      const letterVal = (i, val, when, pen) => {
        vals[i] = svg("g", {}, inkOf(E));
        return D.letter(E, val, { parent: vals[i], x: w * 0.34 + 12, y: rh * i + 4, w: w * 0.66 - 24, h: rh - 8, size: Math.min(rh * 0.42, roleCap("label")), valign: "middle", caps: true, at: when, pen: pen || "ink", maxLines: 1 });
      };
      fields.forEach(([, val], i) => { if (val) t = letterVal(i, val, t, "ink"); });
      const Hd = { t };
      // a field's value written later (the status, a date, an approver); a field that has a value already: the old one
      // fades (0.2 s) and the new one is lettered in its place
      Hd.fill = function (i, val, when, pen) {
        const old = vals[i];
        if (old) { Loom.tween(old, { opacity: 1 }, { opacity: 0, duration: 0.2 }, when, meta(E, "exit")); when += 0.25; }
        return letterVal(i, val, when, pen);
      };
      // the stamp: the verdict, in one colour, once. A double-ruled box set at an angle, landing with a short settle
      Hd.stamp = function (text, so) {
        so = so || {};
        const tone = so.tone || "accent3", when = so.at;
        const size = so.size || roleCap("title") * 0.75, sh = size * 1.9;
        const ms = V.text(text, { size, caps: true, track: 0.12 });
        // the box fits its word: the lettering's measured width, the stroke's own width, and a margin inside the inner rule
        // ("APPROVED" overflowed a 330 px box in the stress test). A `w` narrower than that grows, with a warning
        const fitW = Math.max(120, ms.width + (ms.length ? ms[0].w * 1.5 : 0) + 2 * (8 + 1.6 + size * 0.45));
        const sw = Math.max(fitW, so.w || 0);
        if (so.w && so.w < fitW - 0.5) Loom.warn("bp_stamp_grown", `${beat.id}: the stamp "${text}" needs ${fitW.toFixed(0)} px; its w ${so.w} grew to fit`, { beat: beat.id });
        const cx = so.x == null ? w * 0.62 : so.x, cy = so.y == null ? -sh * 0.9 : so.y;
        const g = svg("g", { opacity: 0 }, E.inner), body = svg("g", {}, g);
        for (const m of ms) for (let i = 0; i < m.pts.length; i += 2) { m.pts[i] -= ms.width / 2; m.pts[i + 1] -= size * 0.5; }
        body.innerHTML = [`<rect x="${f1(-sw / 2)}" y="${f1(-sh / 2)}" width="${f1(sw)}" height="${f1(sh)}" rx="6" fill="none" stroke="${S().c(tone)}" stroke-width="4"/>`,
          `<rect x="${f1(-sw / 2 + 8)}" y="${f1(-sh / 2 + 8)}" width="${f1(sw - 16)}" height="${f1(sh - 16)}" rx="3" fill="none" stroke="${S().c(tone)}" stroke-width="1.6"/>`]
          .concat(ms.map((m) => `<path d="${dpath(m.pts)}" fill="none" stroke="${S().c(tone)}" stroke-width="${(m.w * 1.5).toFixed(2)}" stroke-linecap="round"/>`)).join("");
        const tx = svg("text", { x: f1(-ms.width / 2), y: f1(size * 0.5), "font-size": f1(size / 0.72), "font-family": "monospace", textLength: ms.width.toFixed(1),
          lengthAdjust: "spacingAndGlyphs", "fill-opacity": 0, "data-engine-text": "blueprint" }, body);
        tx.textContent = ms.text;
        const rot = so.rotate == null ? -8 : so.rotate;
        Loom.drive((e, p) => {                         // lands: a little large, then settles (0.22 s)
          const k = 1 + 0.18 * (1 - e);
          g.setAttribute("opacity", p > 0 ? 1 : 0);
          g.setAttribute("transform", `translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${k.toFixed(3)})`);
        }, when, 0.22, (u) => 1 - (1 - u) * (1 - u), { kind: "stamp", beat: beat.id, name: E.name + "_stamp", content: true, key: "bpstamp:" + E.name });
        if (so.sound && Loom.sfx) Loom.sfx("stamp", when + 0.2, { g: 0.6 });
        return when + 0.22;
      };
      return Hd;
    };

    // ---- a revision table: rows added over the lesson (REV, what changed, when): change control as a picture
    D.revisions = function (E, o) {
      o = o || {};
      need(E, "sheet.revisions");
      const rh = o.rowH || 44, cols = [0, 0.16, 0.78, 1].map((f) => f * E.w);
      let t = D.draw(E, V.rect(0, 0, E.w, rh, { fill: "field" }).concat(V.line(cols[1], 0, cols[1], rh, { weight: "thin" }), V.line(cols[2], 0, cols[2], rh, { weight: "thin" })), { at: o.at, pen: "ink", dur: 0.6 });
      const size = Math.min(rh * 0.4, roleCap("caption"));
      ["Rev", o.head || "Description", "Date"].forEach((s, i) => { t = D.letter(E, s, { x: cols[i] + 8, y: 0, w: cols[i + 1] - cols[i] - 16, h: rh, size, valign: "middle", caps: true, at: t, pen: "muted" }); });
      const Hd = { t, n: 0 };
      Hd.add = function (rev, desc, date, when, pen) {
        const y = rh * (++Hd.n);
        let tt = D.draw(E, V.rect(0, y, E.w, rh, { fill: "field" }).concat(V.line(cols[1], y, cols[1], y + rh, { weight: "thin" }), V.line(cols[2], y, cols[2], y + rh, { weight: "thin" })), { at: when, pen: "ink", dur: 0.45 });
        [rev, desc, date].forEach((s, i) => { if (s) tt = D.letter(E, s, { x: cols[i] + 8, y, w: cols[i + 1] - cols[i] - 16, h: rh, size: Math.min(rh * 0.42, roleCap("label")), valign: "middle", caps: true, at: tt, pen: pen || "ink", maxLines: 1 }); });
        return tt;
      };
      return Hd;
    };

    // ---- general notes: a numbered column the narration's key points are lettered into (the sheet's own recap)
    D.notes = function (E, o) {
      o = o || {};
      need(E, "sheet.notes");
      const size = o.size || roleCap("caption") * 1.05;
      // `by` / `quick` on the title: the words take 85 % of the window, the rule under them the rest
      const win = windowOf(o, 0.5), [n1, n2] = shares(win, [0.85, 0.15]);
      let t = D.letter(E, o.title || "General notes", { x: 0, y: 0, w: E.w, h: size * 1.8, size: size * 1.1, caps: true, at: win.t0, pen: "ink", by: n1, parallel: win.par });
      t = D.draw(E, V.line(0, size * 1.75, Math.min(E.w, (D.lastText ? D.lastText.width : 200) + 8), size * 1.75, { weight: "thin" }), { at: t, pen: "ink",
        by: n2 == null ? undefined : Math.max(n2, t + 0.05), parallel: win.par });
      const Hd = { t, n: 0, y: size * 2.4 };
      Hd.add = function (text, when, pen) {
        const n = ++Hd.n, lines = Math.max(1, o.lines || 2);
        const tt = D.letter(E, `${n}. ${text}`, { x: 0, y: Hd.y, w: E.w, h: size * (1 + 0.7) * lines, size, caps: o.caps !== false, at: when, pen: pen || "ink", maxLines: lines, quick: o.lettered !== true });
        Hd.y += (D.lastText ? D.lastText.height : size) + size * 0.9;
        return tt;
      };
      return Hd;
    };

    // ---- the sheet's border with its zone references (letters down the sides, numbers across), drawn once
    D.border = function (E, o) {
      o = o || {};
      need(E, "sheet.border");
      const m = o.margin == null ? 26 : o.margin, cols = o.cols || 6, rows = o.rows || 4, w = E.w, h = E.h;
      const marks = [].concat(V.rect(0, 0, w, h, { weight: "detail", fill: null }), V.rect(m, m, w - 2 * m, h - 2 * m, { weight: "outline", fill: null }));
      for (let i = 1; i < cols; i++) marks.push(...V.line(w * i / cols, 0, w * i / cols, m, { weight: "thin" }), ...V.line(w * i / cols, h - m, w * i / cols, h, { weight: "thin" }));
      for (let j = 1; j < rows; j++) marks.push(...V.line(0, h * j / rows, m, h * j / rows, { weight: "thin" }), ...V.line(w - m, h * j / rows, w, h * j / rows, { weight: "thin" }));
      const par = o.parallel !== false;
      let t = D.draw(E, marks, { at: o.at, pen: "ink", dur: o.dur || 1.6, parallel: par });
      const size = Math.min(m * 0.55, 15);
      if (o.zones !== false) {
        for (let i = 0; i < cols; i++) for (const y of [0, h - m]) D.letter(E, String(i + 1), { x: w * i / cols, y: y + (m - size) / 2 - 2, w: w / cols, h: size * 1.4, size, align: "center", at: t, pen: "muted", caps: false, parallel: par, dur: 0.2 });
        for (let j = 0; j < rows; j++) for (const x of [0, w - m]) D.letter(E, "ABCDEFGH"[j], { x, y: h * j / rows + h / rows / 2 - size, w: m, h: size * 2, size, align: "center", at: t, pen: "muted", caps: true, parallel: par, dur: 0.2 });
      }
      return t;
    };

    // ---- an exploded view: parts leave along their own offsets one after another, and come back the same way. Each part
    // is an element; its balloons and leaders drawn inside it fly with it
    D.explode = function (items, o) {
      o = o || {};
      const m = ctx.m || Loom.motion;
      let t = o.at == null ? ctx.speechStart : o.at, end = t;
      const gap = o.gap == null ? 0.16 : o.gap, dur = o.dur || 0.7;
      items.forEach((it, i) => {
        const E = it.el || it;
        need(E, "sheet.explode");
        const x0 = E.__pos ? E.__pos.x : 0, y0 = E.__pos ? E.__pos.y : 0;
        end = Math.max(end, m.travel(E, t + i * gap, { x: x0 + (it.dx || 0), y: y0 + (it.dy || 0), dur }));
      });
      if (o.back != null) items.slice().reverse().forEach((it, i) => {
        const E = it.el || it;
        end = Math.max(end, m.travel(E, o.back + i * (o.backGap || gap), { x: 0, y: 0, dur: o.backDur || dur * 0.8 }));
        if (o.click && Loom.sfx) Loom.sfx("click", o.back + i * (o.backGap || gap) + (o.backDur || dur * 0.8), { g: 0.35 });
      });
      return end;
    };

    // ---- projection as a camera: a flat face gains depth along an oblique axis, from the elevation (0) to an object
    // (`to`, 1 = `depth` px back at `angle`; `ratio` gives the depth as a share of the face's size instead, 0.5 at
    // most reads as an object, not a tunnel). Drafting order: the face is drafted first, then the depth grows: the side
    // faces the viewer can see are shaded (the upper ones lit, the others in shadow) and edged in the outline weight; the
    // edges it cannot see are hidden lines. A convex face (a box, a chip, a cabinet) reads best. Returns the end time
    D.extrude = function (E, poly, o) {
      o = o || {};
      need(E, "sheet.extrude");
      const P = flat(poly), n = P.length / 2, ang = (o.angle == null ? -35 : o.angle) * Math.PI / 180;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < P.length; i += 2) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); }
      const depth = o.depth || (o.ratio != null ? o.ratio : 0.35) * Math.max(x1 - x0, y1 - y0);
      const pen = o.pen || "ink", ux = Math.cos(ang), uy = Math.sin(ang);
      // which side faces show: the outward normal of an edge points the way the depth goes
      let area = 0;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += P[2 * i] * P[2 * j + 1] - P[2 * j] * P[2 * i + 1]; }
      const sgn = area > 0 ? 1 : -1;
      const faces = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, ex = P[2 * j] - P[2 * i], ey = P[2 * j + 1] - P[2 * i + 1], L = Math.hypot(ex, ey) || 1;
        const nx = sgn * ey / L, ny = -sgn * ex / L;   // outward
        faces.push({ i, j, vis: nx * ux + ny * uy > 1e-6, lit: ny < -0.3 });
      }
      const g = svg("g", { class: "lm-bp-solid" }, inkOf(E));   // under the face: the face is drafted after it, on top
      const col = S().c(pen), mut = S().c("muted");
      const fills = faces.map((f) => (f.vis ? svg("path", { d: "", fill: S().c(f.lit ? "ink" : "shadow"), "fill-opacity": f.lit ? 0.1 : 0.32, stroke: "none", class: "lm-bp-face" }, g) : null));
      const hid = svg("path", { d: "", fill: "none", stroke: mut, "stroke-width": widthOf("thin").toFixed(2), "stroke-dasharray": DASH.hidden.join(" "), class: "lm-bp-hidden" }, g);
      const vis = svg("path", { d: "", fill: "none", stroke: col, "stroke-width": widthOf("outline").toFixed(2), "stroke-linejoin": "round", "stroke-linecap": "square", class: "lm-bp-edges" }, g);
      const t = D.draw(E, V.polygon(P, { fill: o.paper === false ? null : "field" }), { at: o.at, pen, by: o.by });
      const from = o.from == null ? 0 : o.from, to = o.to == null ? 1 : o.to, dur = o.dur || 1.2;
      const when = o.turnAt == null ? t + 0.2 : o.turnAt;
      const seg = (ax, ay, bx, by_) => `M${f1(ax)},${f1(ay)} L${f1(bx)},${f1(by_)} `;
      Loom.drive((e) => {
        const k = lerp(from, to, e) * depth, dx = ux * k, dy = uy * k, B = [];
        for (let i = 0; i < n; i++) B.push(P[2 * i] + dx, P[2 * i + 1] + dy);
        let dv = "", dh = "";
        if (k > 0.5) {
          faces.forEach((f, q) => {
            const { i, j } = f;
            if (fills[q]) fills[q].setAttribute("d", dpath([P[2 * i], P[2 * i + 1], P[2 * j], P[2 * j + 1], B[2 * j], B[2 * j + 1], B[2 * i], B[2 * i + 1]], true));
            if (f.vis) dv += seg(B[2 * i], B[2 * i + 1], B[2 * j], B[2 * j + 1]); else dh += seg(B[2 * i], B[2 * i + 1], B[2 * j], B[2 * j + 1]);
          });
          for (let i = 0; i < n; i++) {                // a corner's connector shows when a face beside it shows
            const a = faces[(i + n - 1) % n], b = faces[i];
            if (a.vis || b.vis) dv += seg(P[2 * i], P[2 * i + 1], B[2 * i], B[2 * i + 1]); else dh += seg(P[2 * i], P[2 * i + 1], B[2 * i], B[2 * i + 1]);
          }
        } else fills.forEach((f) => f && f.setAttribute("d", ""));
        vis.setAttribute("d", dv); hid.setAttribute("d", dh);
      }, when, dur, (u) => u * u * (3 - 2 * u), { kind: "project", beat: beat.id, name: E.name, content: true, key: "bpext:" + E.name });
      D.lastSolid = { faces: faces.map((f) => ({ edge: [f.i, f.j], visible: f.vis, lit: f.lit })), depth };
      return when + dur;
    };

    // ---- a mechanism that moves: gears that mesh, pulleys on a belt, sprockets on a chain, parts on one shaft. `parts`
    // in the order the motion passes through them: {gear: [cx, cy, r, teeth]} or {pulley: [cx, cy, r]}, each after the
    // first with `link`: "mesh" (turns the other way, by the tooth ratio), "belt" or "chain" (the same way, by the radius
    // ratio; the belt or chain is drawn and its links run), "shaft" (the same speed). The first part turns `rps` turns a
    // second (0.2) from `from` (when it is drafted) to `to` (the scene's end); `step: {every, ease}` makes it step like an
    // escapement instead. Meshing teeth are phased to interleave. Returns {t, omega: [deg/s per part], groups}
    D.mechanism = function (E, parts, o) {
      o = o || {};
      need(E, "sheet.mechanism");
      const pen = o.pen || "ink";
      const geo = parts.map((p) => {
        const g = p.gear, q = p.pulley, v = g || q;
        // a tooth as deep as 0.45 of its pitch, so two gears of one pitch (module) mesh whatever their size
        const teeth = g ? Math.max(6, g[3] | 0) : 0;
        return { cx: v[0], cy: v[1], r: v[2], teeth, link: p.link || null, phase: p.phase || 0, depth: g ? clamp(0.45 * TAU * v[2] / teeth, 5, v[2] * 0.22) : 0, icon: p.icon || null };
      });
      geo[0].omega = (o.rps == null ? 0.2 : o.rps) * 360 * (o.dir || 1);
      for (let i = 1; i < geo.length; i++) {           // speeds, and the meshing phase
        const a = geo[i - 1], b = geo[i];
        b.omega = b.link === "mesh" ? -a.omega * (a.teeth || a.r) / (b.teeth || b.r) : b.link === "shaft" ? a.omega : a.omega * a.r / b.r;
        if (b.link === "mesh" && a.teeth && b.teeth) {          // teeth that interleave need one pitch and the right distance
          const d0 = Math.hypot(b.cx - a.cx, b.cy - a.cy), want = a.r + b.r - 0.85 * (a.depth + b.depth) / 2;   // a little tip clearance
          if (Math.abs(d0 - want) > Math.max(a.depth, b.depth) * 0.4 || Math.abs(a.r / a.teeth - b.r / b.teeth) > 0.12 * a.r / a.teeth)
            Loom.warn("bp_mesh_fit", `${beat.id}: gears ${i - 1} and ${i} of "${E.name}" are ${d0.toFixed(0)} px apart (they mesh at ${want.toFixed(0)}) or differ in pitch`, { beat: beat.id });
        }
        if (b.link === "mesh" && a.teeth && b.teeth && !parts[i].phase) {
          const sa = TAU / a.teeth, sb = TAU / b.teeth, phi = Math.atan2(b.cy - a.cy, b.cx - a.cx);
          const del = (((phi - a.phase - 0.22 * sa) % sa) + sa) % sa;    // the mesh profile: tooth centre 0.22, gap centre 0.72
          b.phase = phi + Math.PI + del * sb / sa - 0.72 * sb;
        }
      }
      let t = o.at == null ? ctx.speechStart : o.at;
      const ink = inkOf(E), belts = [], beltG = svg("g", { class: "lm-bp-belts" }, ink);   // belts run behind the wheels
      // drafting order: each wheel (centre lines, rim, teeth, bore), then the belts and chains round them. `by` shares
      // the window between them by the length of their lines
      const wheelMarks = geo.map((p) => {
        const marks = p.teeth ? V.gear(p.cx, p.cy, p.r, p.teeth, { phase: p.phase, depth: p.depth, fill: "field", mesh: true }) : V.pulley(p.cx, p.cy, p.r);
        for (const m of marks) if (m.fill) m.paperAlpha = 0.78;   // a wheel hides the belt or chain behind it
        // `icon` on a part: a Lucide icon traced on the wheel, turning with it (a fan's blades, a pump's impeller)
        if (p.icon) marks.push(...V.icon(p.icon, p.cx - p.r * 0.62, p.cy - p.r * 0.62, p.r * 1.24, { weight: "detail" }));
        return marks;
      });
      const beltMarks = geo.map((b, i) => {
        if (!i || (b.link !== "belt" && b.link !== "chain")) return null;
        const a = geo[i - 1], ra = a.teeth ? a.r - a.depth * 0.5 : a.r, rb = b.teeth ? b.r - b.depth * 0.5 : b.r;
        return Object.assign(V.belt([a.cx, a.cy], ra, [b.cx, b.cy], rb, { weight: b.link === "chain" ? "thin" : "detail" }), { ra, a, b });
      });
      const lenOf = (ms) => (ms || []).reduce((acc, m) => acc + m.len, 0);
      const runs = wheelMarks.map(lenOf).concat(beltMarks.map(lenOf)), total = runs.reduce((a, b) => a + b, 0) || 1;
      const t0m = Math.max(t, H().free + 0.04);
      let acc = 0;
      const until = (len) => (o.by == null ? undefined : t0m + (o.by - t0m) * (acc += len) / total);
      const groups = geo.map((p, i) => {
        const g = svg("g", { class: "lm-bp-wheel" }, ink);
        t = D.draw(E, wheelMarks[i], { at: t, pen, parent: g, by: until(runs[i]) });
        return g;
      });
      beltMarks.forEach((bm, i) => {
        if (!bm) return;
        const { a, b, ra } = bm, chain = b.link === "chain";
        t = D.draw(E, bm, { at: t, pen: o.beltPen || "line", parent: beltG, by: until(runs[geo.length + i]) });
        // the links: a dashed run over the belt whose dashes travel at the rim speed
        const pat = chain ? [7, 5] : [4, 22], v = a.omega * Math.PI / 180 * ra;
        const ln = svg("path", { d: dpath(bm[0].pts), fill: "none", stroke: S().c(o.beltPen || "line"), "stroke-width": (widthOf("outline") * (chain ? 1.6 : 1.2)).toFixed(2), "stroke-dasharray": pat.join(" "), "stroke-dashoffset": 0, opacity: 0, class: "lm-bp-links" }, beltG);
        Loom.tween(ln, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t, meta(E));
        belts.push({ ln, v, period: pat[0] + pat[1] });
      });
      const from = o.from == null ? t : o.from, to = o.to == null ? ctx.end : o.to;
      E.__bpMoveT = Math.min(E.__bpMoveT == null ? 1e9 : E.__bpMoveT, from);
      const st = o.step;
      Loom.drive((e, p) => {
        const tt = p * (to - from);
        let turned = tt;                                // seconds of turning (stepping: whole steps plus the eased part)
        if (st) { const ev = st.every || 0.5, k = Math.floor(tt / ev), f = clamp((tt - k * ev) / (ev * (st.ease || 0.35)), 0, 1); turned = ev * (k + (1 - (1 - f) * (1 - f))); }
        geo.forEach((q, i) => groups[i].setAttribute("transform", `rotate(${(q.omega * turned).toFixed(3)} ${f1(q.cx)} ${f1(q.cy)})`));
        for (const b of belts) b.ln.setAttribute("stroke-dashoffset", (-(b.v * turned) % (b.period * 1000)).toFixed(2));
      }, from, Math.max(0.05, to - from), "linear", { kind: "mechanism", beat: beat.id, name: E.name, content: false, key: "bpmech:" + E.name + ":" + from });
      return { t, omega: geo.map((q) => q.omega), groups };
    };

    // ---- a Lucide icon traced by the pen in the drafting line, inside a part or as a part (a lock, a database, a cloud):
    // D.icon(E, "server", x, y, size, {at, by, pen, weight}). An unknown name is an error and draws nothing
    D.icon = function (E, name, x, y, size, o) {
      o = o || {};
      need(E, "sheet.icon");
      const ms = V.icon(name, x, y, size, o);
      if (!ms.length) return o.at == null ? ctx.speechStart : o.at;
      return D.draw(E, ms, { at: o.at, by: o.by, dur: o.dur, pen: o.pen || "ink", parallel: o.parallel });
    };

    // ---- the one real thing on a sheet (the hero part the narration is about). Its outline is drafted by the pen; then
    // it gains a volume (one gradient across it, lit from `light` degrees, -135 = the top left), a soft glow in its
    // tone, and a shadow that falls across the lines under it (`shadow`: [dx, dy] px, false for none). It hides what is
    // behind it, like a part. `shape`: closed marks (W.circle, W.polygon, W.cloud, W.roundRect ...) or points. Returns
    // the time the volume is in
    D.hero = function (E, shape, o) {
      o = o || {};
      need(E, "sheet.hero");
      defs();
      if (D._heroes && D._heroes.length && !o.another) Loom.warn("bp_hero_twice", `${beat.id}: a second hero ("${E.name}") on one sheet; the style keeps one real thing a sheet`, { beat: beat.id });
      (D._heroes = D._heroes || []).push(E.name);
      const marks = Array.isArray(shape) && shape.length && shape[0] && shape[0].pts ? shape : V.polygon(shape);
      const closed = marks.filter((m) => m.closed);
      const d = closed.map((m) => dpath(m.pts, true)).join(" ");
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const m of closed) for (let i = 0; i < m.pts.length; i += 2) { x0 = Math.min(x0, m.pts[i]); x1 = Math.max(x1, m.pts[i]); y0 = Math.min(y0, m.pts[i + 1]); y1 = Math.max(y1, m.pts[i + 1]); }
      const la = (o.light == null ? -135 : o.light) * Math.PI / 180, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
      const tone = o.tone || "accent", gid = Loom.uid("lm-bp-vol");
      const lg = svg("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: f1(cx + Math.cos(la) * R), y1: f1(cy + Math.sin(la) * R), x2: f1(cx - Math.cos(la) * R), y2: f1(cy - Math.sin(la) * R) }, defs());
      svg("stop", { offset: 0, "stop-color": S().c("ink"), "stop-opacity": 0.42 }, lg);
      svg("stop", { offset: 0.45, "stop-color": S().c(tone), "stop-opacity": 0.2 }, lg);
      svg("stop", { offset: 1, "stop-color": S().c("shadow"), "stop-opacity": 0.55 }, lg);
      const ink = inkOf(E), before = (nd) => E.inner.insertBefore(nd, ink);
      const sh = o.shadow === false ? null : (o.shadow || [22, 28]);
      const nodes = [];
      if (sh) { const s_ = svg("path", { d, fill: S().c("shadow"), opacity: 0, transform: `translate(${sh[0]} ${sh[1]})`, filter: "url(#lm-bp-soft)", class: "lm-bp-shadow" }); before(s_); nodes.push([s_, o.shadowAlpha == null ? 0.78 : o.shadowAlpha]); }
      const gl = svg("path", { d, fill: S().c(tone), stroke: S().c(tone), "stroke-width": 8, opacity: 0, filter: "url(#lm-bp-soft2)", class: "lm-bp-halo" }); before(gl); nodes.push([gl, o.glowAlpha == null ? 0.34 : o.glowAlpha]);
      const vol = svg("path", { d, fill: `url(#${gid})`, opacity: 0, class: "lm-bp-volume" }); before(vol); nodes.push([vol, 1]);
      // it hides what is behind it: a paper with no tint of its own (the volume is its face)
      const t0 = o.at == null ? ctx.speechStart : o.at;
      for (const m of closed) paperOf(E, ink, Object.assign(mark(m.pts.slice(), { closed: true }), { fill: "field", paperAlpha: 0 }), Math.max(t0, H().free + 0.04));
      // `draw: false`: the outline is drafted already (a part drawn with D.part); only the volume, glow and shadow come
      const tEnd = o.draw === false ? (o.by != null ? o.by : t0 + (o.dur || 0.8)) : D.draw(E, marks, { at: t0, by: o.by, pen: o.pen || "ink" });
      const tIn = lerp(Math.max(t0, tEnd - 1.2), tEnd, 0.4);
      for (const [nd, a] of nodes) Loom.tween(nd, { opacity: 0 }, { opacity: a, duration: Math.max(0.3, tEnd - tIn + 0.3) }, tIn, meta(E, "reveal"));
      return tEnd + 0.3;
    };

    // ---- the camera on the sheet, when every part of the sheet is drawn inside ONE element (`sheetEl`, made with ctx.el
    // and passed as `parent` to the others): an establishing shot of the whole sheet, a close-up (a cut or a move), a
    // track along a path, a lateral pan across figures. Built on Loom.cam.frame. A camera between stations (two sheets,
    // a zoom-through) is the storyboard's join_in, not this
    D.camera = function (sheetEl, o) {
      o = o || {};
      need(sheetEl, "sheet.camera");
      D._camEl = sheetEl;
      const frame = (rect, t, dur, fo) => (Loom.cam && Loom.cam.frame ? Loom.cam.frame(sheetEl, rect, t, dur, Object.assign({ name: sheetEl.name + ".camera" }, fo || {})) : t + dur);
      const all = { x: 0, y: 0, w: sheetEl.w || 1920, h: sheetEl.h || 1080 };
      const C = {};
      C.establish = (t, dur, fo) => frame(all, t, dur == null ? 1.6 : dur, Object.assign({ margin: 0 }, fo || {}));
      C.close = (rect, t, fo) => { fo = fo || {}; return frame(rect, t, fo.cut ? 0.01 : (fo.dur || 1.2), fo); };
      C.track = (points, t, dur, fo) => {               // along a force or request path, at `zoom`
        fo = fo || {};
        const z = fo.zoom || 1.8, w = all.w / z, h = all.h / z, P = flat(points), legs = [];
        let L = 0;
        for (let i = 2; i < P.length; i += 2) { const l = Math.hypot(P[i] - P[i - 2], P[i + 1] - P[i - 1]); legs.push(l); L += l; }
        let tt = frame({ x: P[0] - w / 2, y: P[1] - h / 2, w, h }, t, fo.lead == null ? 0.8 : fo.lead, { margin: 0 });
        for (let i = 2; i < P.length; i += 2) tt = frame({ x: P[i] - w / 2, y: P[i + 1] - h / 2, w, h }, tt, Math.max(0.2, dur * legs[i / 2 - 1] / (L || 1)), { margin: 0, ease: "linear" });
        return tt;
      };
      C.pan = (rects, t, dur, fo) => {                   // across figures, one after another, holding each
        fo = fo || {};
        const hold = fo.hold == null ? 1.0 : fo.hold;
        let tt = t;
        for (const r of rects) tt = frame(r, tt, dur, fo) + hold;
        return tt - hold;
      };
      return C;
    };

    // ---- a mechanism stepping like an escapement: the element's drawing turns `step` degrees about (cx, cy) every `every`
    // seconds from `from` to `to`, each step a short ease-out (gears, a dial, a valve wheel). Pure function of time
    D.step = function (E, o) {
      o = o || {};
      need(E, "sheet.step");
      const step = o.step == null ? 15 : o.step, every = o.every || 0.5, from = o.from == null ? ctx.speechStart : o.from, to = o.to == null ? ctx.end : o.to;
      const cx = o.cx == null ? E.w / 2 : o.cx, cy = o.cy == null ? E.h / 2 : o.cy, ease = o.ease || 0.35, dir = o.dir || 1, a0 = o.angle || 0;
      const g = o.target || E.inner;
      Loom.drive((e, p) => {
        const tt = p * (to - from), n = Math.floor(tt / every), f = clamp((tt - n * every) / (every * ease), 0, 1);
        const a = a0 + dir * step * (n + (1 - (1 - f) * (1 - f)));
        g.setAttribute("transform", `rotate(${a.toFixed(3)} ${f1(cx)} ${f1(cy)})`);
      }, from, Math.max(0.05, to - from), "linear", { kind: "mechanism", beat: beat.id, name: E.name, content: false, key: "bpstep:" + E.name });
      return to;
    };

    // ================================================================ the teaching register (Loom's own, 2026-10-16)
    // A 5 to 10 minute lesson cannot be dense drawings all the way (Kshitij: "complex at places where it needs to be ...
    // a bit more relaxed at places where we need to explain or teach"). These calls keep the sheet's language (paper,
    // drafted outlines, the technical hand) at a calmer density: a few large cards, one connector, one idea a frame.

    // ---- a card: a drafted rounded box, a short heading lettered large, an optional line under it, an index tag
    D.card = function (E, title, o) {
      o = o || {};
      need(E, "sheet.card");
      const w = E.w, h = E.h, pad = o.pad == null ? 22 : o.pad, pen = o.pen || "ink";
      // `by` (a spoken word): the box takes about a third of the window, the heading the rest
      const t0c = o.at == null ? ctx.speechStart : o.at, boxDur = o.drawDur || (o.by != null ? clamp((o.by - t0c) * 0.33, 0.25, 0.8) : Math.min(0.9, 0.3 + (w + h) / 2400));
      let t = D.draw(E, V.roundRect(0, 0, w, h, o.r == null ? 10 : o.r, { fill: o.paper === false ? null : "surface" }), { at: o.at, pen, dur: boxDur });
      if (o.index != null) {
        const s = roleCap("caption");
        D.letter(E, String(o.index).padStart(2, "0"), { x: w - pad - s * 3, y: pad * 0.6, w: s * 3, h: s * 1.5, size: s, align: "right", caps: true, at: t, pen: "muted", quick: true });
      }
      const lead = o.size || roleCap(o.role || "lead");
      t = D.letter(E, title, { x: pad, y: pad, w: w - 2 * pad - (o.index != null ? 60 : 0), h: o.body ? lead * 2.6 : h - 2 * pad, size: lead, caps: o.caps, valign: o.body ? "top" : "middle", at: t, by: o.by != null && o.by > t + 0.2 ? o.by : undefined, pen, maxLines: o.body ? 2 : 3 });
      if (o.body) {
        const by = pad + (D.lastText ? D.lastText.height : lead) + lead * 0.6;
        t = D.draw(E, V.line(pad, by - lead * 0.3, pad + Math.min(w - 2 * pad, 120), by - lead * 0.3, { weight: "thin" }), { at: t, pen: o.accent || "accent" });
        t = D.letter(E, o.body, { x: pad, y: by, w: w - 2 * pad, h: h - by - pad, role: "label", caps: false, at: t, pen: "muted", maxLines: o.bodyLines || 3, quick: o.quickBody !== false });
      }
      return t;
    };

    // ---- a connector between two points of the sheet (element-local px of E), with an optional label lettered beside
    // its line; the head lands as the line arrives. The label sits ON its line, beside the point `labelAt` (0 to 1 along
    // the path, 0.5 by default) or beside the middle of segment `labelSeg` (an index, or "first", "last", "longest"):
    // above a horizontal run, to the right of a vertical one (`labelSide`: "above" | "below" | "left" | "right"), a
    // `labelGap` px clear of it. `labelDx` / `labelDy` still nudge it. (Before 2026-10-16 it sat at the path's midpoint
    // plus an offset, and floated away from elbowed lines.)
    D.connect = function (E, x0, y0, x1, y1, o) {
      o = o || {};
      need(E, "sheet.connect");
      let pts = [x0, y0, x1, y1];
      if (o.elbow) pts = o.elbow === "v" ? [x0, y0, x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, x1, y1] : [x0, y0, (x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1];
      if (o.points) pts = flat(o.points);
      const m = mark(pts, { weight: o.weight || "detail" }); m.head = o.head === false ? 0 : (o.head || 15);
      let t = D.draw(E, [m], { at: o.at, by: o.by, pen: o.pen || "line" });
      if (o.label) {
        const L = labelPlace(m, o);
        t = D.letter(E, o.label, { x: L.x, y: L.y, w: L.w, h: L.h, size: L.size, align: "center", valign: "middle", caps: o.caps, at: t, pen: o.labelPen || "muted", maxLines: 1,
          by: o.labelBy, quick: o.labelQuick });
        D.lastLabel = L;
      }
      return t;
    };
    // where a connector's label goes: a box the size of its lettering, beside the line at the chosen point
    function labelPlace(m, o) {
      const s = o.labelSize || roleCap("label"), n = m.pts.length / 2;
      // a scene written for the first version (offsets only, no labelAt / labelSeg / labelSide) keeps its old place: the
      // path's midpoint, a labelW box above it, plus the offsets (bp_engine_teach's "runs first" was tuned to that)
      if ((o.labelDx != null || o.labelDy != null) && o.labelAt == null && o.labelSeg == null && o.labelSide == null) {
        const [mx, my] = at(m, m.len / 2), lw = o.labelW || 260;
        return { x: mx - lw / 2 + (o.labelDx || 0), y: my - s * 2.4 + (o.labelDy || 0), w: lw, h: s * 1.8, size: s, px: mx, py: my, legacy: true };
      }
      let Lp;                                           // arc length of the anchor point
      if (o.labelSeg != null) {
        const lens = []; for (let i = 1; i < n; i++) lens.push(m.cum[i] - m.cum[i - 1]);
        let k = o.labelSeg === "first" ? 0 : o.labelSeg === "last" ? lens.length - 1 : o.labelSeg === "longest" ? lens.indexOf(Math.max(...lens)) : clamp(o.labelSeg | 0, 0, lens.length - 1);
        Lp = m.cum[k] + lens[k] / 2;
      } else Lp = clamp(o.labelAt == null ? 0.5 : o.labelAt, 0, 1) * m.len;
      const [px, py] = at(m, Lp), [ax, ay] = at(m, Math.max(0, Lp - 2)), [bx, by_] = at(m, Math.min(m.len, Lp + 2));
      const dl = Math.hypot(bx - ax, by_ - ay) || 1, ux = (bx - ax) / dl, uy = (by_ - ay) / dl;
      const caps = o.caps, str = caps ? String(o.label).toUpperCase() : String(o.label);
      const meas = V.text(str, { size: s, caps: false });
      const w = Math.min(o.labelW || 1e9, meas.width) + 6, h = s * 1.5;
      // the side: a normal to the run; above (or right of a vertical run) unless told otherwise
      let nx = uy, ny = -ux;                            // one normal
      const side = o.labelSide || (Math.abs(uy) > 0.85 ? "right" : "above");
      const want = side === "above" ? [0, -1] : side === "below" ? [0, 1] : side === "left" ? [-1, 0] : [1, 0];
      if (nx * want[0] + ny * want[1] < 0) { nx = -nx; ny = -ny; }
      const gap = o.labelGap == null ? 8 : o.labelGap, reach = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2 + gap;
      const cx = px + nx * reach + (o.labelDx || 0), cy = py + ny * reach + (o.labelDy || 0);
      return { x: cx - w / 2, y: cy - h / 2, w, h, size: s, px, py };
    }

    // ---- a revision cloud round what changed (the classic mark for "this is different now"), with its delta triangle
    D.cloud = function (E, x, y, w, h, o) {
      o = o || {};
      need(E, "sheet.cloud");
      const cl = V.cloud(x, y, w, h, o);
      let t = D.draw(E, cl, { at: o.at, by: o.by, pen: o.pen || "accent" });
      if (o.rev != null) {
        // the delta sits off a corner (`revAt`: "ne" by default, "nw", "se", "sw"), moved out along the diagonal until it
        // clears the scallops by `revGap` px (they bulge half a scallop's width past the box: the first version put it
        // 14 px off the box corner, on the scallops)
        const s = roleCap("lead") * 1.0, tw = s * 1.9, th = s * 1.7, at_ = o.revAt || "ne", gapR = o.revGap == null ? 8 : o.revGap;
        const sx = /e/.test(at_) ? 1 : -1, sy = /s/.test(at_) ? 1 : -1, cx0 = sx > 0 ? x + w : x, cy0 = sy > 0 ? y + h : y;
        const tri = (d) => {                           // the triangle whose box corner nearest the cloud is d px out along the diagonal
          const bx = cx0 + sx * d + (sx > 0 ? 0 : -tw), by0 = cy0 + sy * d + (sy > 0 ? 0 : -th);
          return [bx, by0 + th, bx + tw, by0 + th, bx + tw / 2, by0];
        };
        const cp = cl[0].pts, clear = cl[0].w / 2 + widthOf("detail") / 2 + gapR;
        const segD = (px, py, ax, ay, bx, by_) => { const dx = bx - ax, dy = by_ - ay, u = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - ax - u * dx, py - ay - u * dy); };
        const inside = (px, py, T) => { let sg = 0; for (let i = 0; i < 3; i++) { const [ax, ay, bx, by_] = [T[2 * i], T[2 * i + 1], T[(2 * i + 2) % 6], T[(2 * i + 3) % 6]]; const c = (bx - ax) * (py - ay) - (by_ - ay) * (px - ax); sg += c > 0 ? 1 : c < 0 ? -1 : 0; } return Math.abs(sg) === 3; };
        const distTo = (T) => {
          let m = 1e9;
          for (let k = 0; k < cp.length; k += 2) {
            if (inside(cp[k], cp[k + 1], T)) return 0;
            for (let i = 0; i < 3; i++) m = Math.min(m, segD(cp[k], cp[k + 1], T[2 * i], T[2 * i + 1], T[(2 * i + 2) % 6], T[(2 * i + 3) % 6]));
          }
          return m;
        };
        let d = 0;
        while (d < 400 && distTo(tri(d)) < clear) d += 2;
        const T = tri(d);
        t = D.draw(E, V.polygon(T, { weight: "detail" }), { at: t, pen: o.pen || "accent" });
        t = D.letter(E, String(o.rev), { x: T[0], y: T[5] + th * 0.33, w: tw, h: th * 0.6, size: s * 0.75, align: "center", valign: "middle", caps: true, at: t, pen: o.pen || "accent" });
      }
      return t;
    };

    // ---- a tracing overlay: a sheet of tracing paper laid over the drawing (a proposal, a change, a future state). The
    // element is the overlay; draw the proposed marks into it after this. It leaves with the element (its exit), or by
    // `lift` (fades away) at a time
    D.overlay = function (E, o) {
      o = o || {};
      need(E, "sheet.overlay");
      const g = svg("g", { opacity: 0 }, E.inner);
      svg("rect", { x: 0, y: 0, width: E.w, height: E.h, rx: 4, fill: S().c("ink"), opacity: o.tint == null ? 0.07 : o.tint }, g);
      svg("rect", { x: 0, y: 0, width: E.w, height: E.h, rx: 4, fill: "none", stroke: S().c("muted"), "stroke-width": widthOf("thin").toFixed(2), "stroke-dasharray": "2 7" }, g);
      const when = o.at == null ? ctx.speechStart : o.at;
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.45 }, when, meta(E, "reveal"));
      if (E.revealT == null || when < E.revealT) { E.revealT = when; E.revealKind = "draw"; }
      let t = when + 0.45;
      if (o.tag) t = D.letter(E, o.tag, { x: 16, y: 12, w: E.w - 32, h: roleCap("caption") * 1.6, size: roleCap("caption"), caps: true, at: t, pen: o.tagPen || "accent" });
      if (o.lift != null) Loom.tween(E.inner, { opacity: 1 }, { opacity: 0, duration: 0.4 }, o.lift, meta(E, "exit"));
      return t;
    };
    return D;
  }

  const api = Object.assign({ sheet }, V);
  Loom.engines.define("blueprint", { version: "1", summary: "a technical drawing drafted live: line weights and dash conventions, drafting order with paper occlusion, single-stroke technical lettering, dimensions that measure (live figures), balloons, leaders, section lines, FIG rewrites, title block with a stamp and revisions, general notes, exploded views, oblique projection, stepping mechanisms; one glowing nib for the film", api });
})();
