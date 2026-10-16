/* Loom material and motif joins (D-114): screen covers that look made of something.
 *
 * What it is for: the TED-Ed study (docs/research/vision/2026-10-05-tedEd-full-conclusions.md, s7 and s8) found
 * cartoon films join shots with MATERIAL (torn paper, a page turn, a scroll) and with the topic's own MOTIF (a
 * heart-shaped iris for a heart lesson), and editorial films with a COLOUR HANDOFF (the next field colour grows in)
 * or a FILL JOIN (a shape of the old frame grows until it is the new frame's ground). These are six new screen
 * joins, next to iris / wipe / dip / fade (runtime/world.js):
 *
 *   torn     a torn-paper matte (seeded jagged edge, field2, a darker edge band) crosses the frame like a wipe
 *   page     a sheet lands with a page-turn flap, then peels from a corner (def.corner br|bl|tr|tl) to reveal
 *   scroll   a paper band crosses the frame with a rolled edge (a cylinder) leading, then rolls away
 *   motif    the topic's shape (def.shape: circle|heart|hex|drop|leaf|cog or an SVG path d) grows from def.from
 *            to cover the frame, then a hole of the same shape opens on def.at (an iris of any shape)
 *   handoff  the next shot's field colour (def.to, default field) grows from def.from (an edge or [x, y]), then
 *            fades off the new shot that sits on that colour
 *   fill     a shape of the old frame (def.shape d + def.box [x, y, w, h], or just def.box) grows in def.token
 *            until it fills the frame, then fades off the new shot
 *
 * API (pure, like Loom.world.coverAt):
 *   Loom.material.coverAt(kind, p, def, pal) -> { d, fill, opacity, layers: [{ d, fill, opacity, stroke?, sw? }] }
 *     p: join progress 0..1; def: the storyboard's join_in; pal: the style pack's palette (hex by token).
 *     The primary path {d, fill, opacity} alone is the whole cover and is opaque from p = 0.42 to 0.58 (the camera
 *     jumps at 0.5 under it); `layers` are optional shading drawn on top (page flap, fold shadow, roll shadow).
 *   Loom.material.DUR       join kind -> default duration (s); compose's JOIN_DUR carries the same numbers
 *   Loom.material.has(kind) whether a kind is a material join
 *   Loom.material.layerGroup(parent) / .drawLayers(group, layers)   draw `layers` (the lab does; world needs a
 *     two-line wiring in installCovers, see docs/primitives/material.md)
 *   Loom.material.SHAPES    the named motif shapes (unit paths)
 *
 * Determinism: every cover is a pure function of (kind, p, def, palette). The torn edge comes from Loom.rng(def.seed)
 * and is the same at every p; paths are built from arithmetic only. The one side effect is idempotent: the first
 * call that needs a gradient (a band, a roll, a flap) adds a <linearGradient> keyed by its colours and stops to one
 * hidden <svg> of defs, so any seek order draws the same picture. Colours are palette tokens and mixes of them;
 * the only literal is none.
 *
 * Look families: torn, page, scroll and motif read as cartoon MATERIAL and suit look_family "illustrated"; handoff
 * and fill suit every family. Joins are chosen per storyboard (join_in.type), so nothing here switches on by pack.
 */
// @capability material_joins | joins | storyboard join_in.type torn, page, scroll, motif, handoff, fill | Primitives from the TED-Ed study | a join made of the frame's material (paper tears, a page turns, a shape fills); one material per lesson
(function () {
  "use strict";
  const Loom = window.Loom;
  const W = Loom.W, H = Loom.H;
  const MT = (Loom.material = {});
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const io3 = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  // closing progress completes at p = 0.42 (u = 0.84); opening starts at p = 0.58 (u = 0.16): fully covered between
  const closeK = (u) => io3(Math.min(1, u / 0.84));
  const openK = (u) => io3(Math.max(0, (u - 0.16) / 0.84));
  const BOX = `M0 0H${W}V${H}H0Z`;
  const NONE = { d: "", fill: "none", opacity: 0, layers: [] };

  /* ---------------- the table: kinds and default durations (compose.py JOIN_DUR mirrors it) ---------------- */
  MT.DUR = { torn: 0.8, page: 0.9, scroll: 0.9, motif: 0.9, handoff: 0.8, fill: 0.8 };
  MT.KINDS = Object.keys(MT.DUR);
  MT.FAMILY = { torn: "illustrated", page: "illustrated", scroll: "illustrated", motif: "illustrated", handoff: "any", fill: "any" };
  MT.has = (kind) => Object.prototype.hasOwnProperty.call(MT.DUR, kind);
  MT.MAX_LAYERS = 3;

  /* ---------------- once-only messages (coverAt runs every frame) ---------------- */
  const said = new Set();
  function once(level, code, msg) {
    const k = code + "|" + msg;
    if (said.has(k)) return;
    said.add(k);
    (level === "error" ? Loom.error : Loom.warn)(code, msg);
  }
  function tok(pal, name, fallback) {
    const t = name || fallback;
    if (pal[t]) return pal[t];
    if (name) once("warn", "material_token", `join colour token "${name}" is not in the palette; using ${fallback}`);
    return pal[fallback] || pal.field || "#000";
  }
  const mix = (a, b, k) => (Loom.style && Loom.style.mix ? Loom.style.mix(a, b, k) : a);

  /* ---------------- gradients (shared defs, created on first use, keyed by content) ---------------- */
  const made = new Set();
  function grad(spec) {
    // spec: {x1, y1, x2, y2, stops: [[offset, colour], ...]} in objectBoundingBox units
    const key = "lmmat_" + Loom.hash(JSON.stringify(spec)).toString(36);
    if (made.has(key) || typeof document === "undefined") { made.add(key); return `url(#${key})`; }
    made.add(key);
    let host = document.getElementById("lm-material-defs");
    if (!host) {
      // not display:none: Chrome does not paint gradients that live in a display:none subtree
      host = Loom.svg("svg", { id: "lm-material-defs", width: 0, height: 0, style: "position:absolute;width:0;height:0;overflow:hidden" }, document.body);
      Loom.svg("defs", {}, host);
    }
    const g = Loom.svg("linearGradient", { id: key, x1: spec.x1, y1: spec.y1, x2: spec.x2, y2: spec.y2 }, host.firstChild);
    for (const [o, c] of spec.stops) Loom.svg("stop", { offset: clamp01(o).toFixed(4), "stop-color": c }, g);
    return `url(#${key})`;
  }

  /* ---------------- path maths: parse, transform, flatten (for motif / fill shapes) ---------------- */
  const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  function parse(d) {
    const out = [], re = /([MLHVCSQTAZmlhvcsqtaz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
    let m, cmd = null, nums = [];
    const flush = () => {
      if (!cmd) return;
      const U = cmd.toUpperCase(), n = ARITY[U];
      if (!n) out.push([cmd, []]);
      else for (let i = 0; i + n <= nums.length; i += n) out.push([i > 0 && U === "M" ? (cmd === "M" ? "L" : "l") : cmd, nums.slice(i, i + n)]);
      nums = [];
    };
    while ((m = re.exec(d))) { if (m[1]) { flush(); cmd = m[1]; } else nums.push(parseFloat(m[2])); }
    flush();
    return out;
  }
  /** uniform scale s then translate (tx, ty), for any path (absolute and relative commands, arcs) */
  function xform(d, s, tx, ty) {
    const segs = typeof d === "string" ? parse(d) : d;
    let o = "";
    for (const [c, a] of segs) {
      const U = c.toUpperCase(), abs = c === U;
      const X = (v) => f1(s * v + (abs ? tx : 0)), Y = (v) => f1(s * v + (abs ? ty : 0)), R = (v) => f1(s * v);
      let q;
      if (U === "Z") q = [];
      else if (U === "H") q = [X(a[0])];
      else if (U === "V") q = [Y(a[0])];
      else if (U === "A") q = [R(a[0]), R(a[1]), a[2], a[3], a[4], X(a[5]), Y(a[6])];
      else q = a.map((v, i) => (i % 2 ? Y(v) : X(v)));
      o += c + q.join(" ");
    }
    return o;
  }
  /** polygons (arrays of [x, y]) approximating a path; curves sampled, arcs taken as chords (see docs) */
  function flatten(d) {
    const polys = [];
    let cur = null, x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
    const push = (px, py) => { if (!cur) { cur = [[x, y]]; polys.push(cur); } cur.push([px, py]); x = px; y = py; };
    for (const [c, a] of parse(d)) {
      const U = c.toUpperCase(), rel = c !== U;
      const ax = (v) => (rel ? x + v : v), ay = (v) => (rel ? y + v : v);
      if (U === "M") { x = ax(a[0]); y = ay(a[1]); sx = x; sy = y; cur = [[x, y]]; polys.push(cur); lc = lq = null; continue; }
      if (U === "Z") { if (cur) push(sx, sy); x = sx; y = sy; cur = null; lc = lq = null; continue; }
      if (U === "L") { push(ax(a[0]), ay(a[1])); lc = lq = null; continue; }
      if (U === "H") { push(ax(a[0]), y); lc = lq = null; continue; }
      if (U === "V") { push(x, ay(a[0])); lc = lq = null; continue; }
      if (U === "C" || U === "S") {
        const x0 = x, y0 = y;
        let c1x, c1y, i = 0;
        if (U === "C") { c1x = ax(a[0]); c1y = ay(a[1]); i = 2; } else { c1x = lc ? 2 * x0 - lc[0] : x0; c1y = lc ? 2 * y0 - lc[1] : y0; }
        const c2x = ax(a[i]), c2y = ay(a[i + 1]), ex = ax(a[i + 2]), ey = ay(a[i + 3]);
        for (let k = 1; k <= 16; k++) {
          const t = k / 16, mt = 1 - t;
          push(mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex, mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey);
        }
        lc = [c2x, c2y]; lq = null; continue;
      }
      if (U === "Q" || U === "T") {
        const x0 = x, y0 = y;
        let qx, qy, i = 0;
        if (U === "Q") { qx = ax(a[0]); qy = ay(a[1]); i = 2; } else { qx = lq ? 2 * x0 - lq[0] : x0; qy = lq ? 2 * y0 - lq[1] : y0; }
        const ex = ax(a[i]), ey = ay(a[i + 1]);
        for (let k = 1; k <= 12; k++) { const t = k / 12, mt = 1 - t; push(mt * mt * x0 + 2 * mt * t * qx + t * t * ex, mt * mt * y0 + 2 * mt * t * qy + t * t * ey); }
        lq = [qx, qy]; lc = null; continue;
      }
      if (U === "A") { push(ax(a[5]), ay(a[6])); lc = lq = null; continue; }
    }
    return polys.filter((p) => p.length >= 3);
  }
  function inside(polys, px, py) {
    let c = false;
    for (const P of polys) for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function edgeDist(polys, px, py) {
    let best = Infinity;
    for (const P of polys) for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [ax_, ay_] = P[j], [bx, by] = P[i], dx = bx - ax_, dy = by - ay_, L2 = dx * dx + dy * dy;
      const t = L2 ? clamp01(((px - ax_) * dx + (py - ay_) * dy) / L2) : 0;
      best = Math.min(best, Math.hypot(px - (ax_ + t * dx), py - (ay_ + t * dy)));
    }
    return best;
  }
  function bboxOf(polys) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const P of polys) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return [x0, y0, x1 - x0, y1 - y0];
  }
  /** the shape's fattest point (pole of inaccessibility, by grid refinement) and its inscribed radius */
  const poles = new Map();
  function pole(d) {
    if (poles.has(d)) return poles.get(d);
    const polys = flatten(d);
    let res = null;
    if (polys.length) {
      const [bx, by, bw, bh] = bboxOf(polys);
      let cx = bx + bw / 2, cy = by + bh / 2, span = Math.max(bw, bh), best = -1, bp = [cx, cy];
      for (let it = 0; it < 4; it++) {
        const n = 16, step = span / n;
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
          const px = cx - span / 2 + i * step, py = cy - span / 2 + j * step;
          if (!inside(polys, px, py)) continue;
          const r = edgeDist(polys, px, py);
          if (r > best) { best = r; bp = [px, py]; }
        }
        cx = bp[0]; cy = bp[1]; span = span / 4;
      }
      if (best > 0) res = { x: bp[0], y: bp[1], r: best, bbox: [bx, by, bw, bh] };
    }
    poles.set(d, res);
    return res;
  }
  /** distance from (x, y) to the farthest frame corner: what a shape centred there must reach to cover the frame */
  const reach = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));

  /* ---------------- named motif shapes, in a unit box around (0, 0) ---------------- */
  function cogPath(n) {
    const pts = [], step = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const c = i * step - Math.PI / 2;
      for (const [r, k] of [[0.78, -0.3], [1, -0.17], [1, 0.17], [0.78, 0.3]]) pts.push([r * Math.cos(c + k * step), r * Math.sin(c + k * step)]);
    }
    return "M" + pts.map(([x, y]) => `${x.toFixed(4)} ${y.toFixed(4)}`).join("L") + "Z";
  }
  const K = 0.5523;
  MT.SHAPES = {
    circle: `M0 -1C${K} -1 1 -${K} 1 0C1 ${K} ${K} 1 0 1C-${K} 1 -1 ${K} -1 0C-1 -${K} -${K} -1 0 -1Z`,
    heart: "M0 1C-0.55 0.62 -1 0.25 -1 -0.25C-1 -0.65 -0.7 -0.9 -0.45 -0.9C-0.25 -0.9 -0.08 -0.78 0 -0.6C0.08 -0.78 0.25 -0.9 0.45 -0.9C0.7 -0.9 1 -0.65 1 -0.25C1 0.25 0.55 0.62 0 1Z",
    hex: "M" + [0, 1, 2, 3, 4, 5].map((k) => { const a = (-90 + 60 * k) * Math.PI / 180; return `${Math.cos(a).toFixed(4)} ${Math.sin(a).toFixed(4)}`; }).join("L") + "Z",
    drop: "M0 -1C0.35 -0.45 0.75 -0.05 0.75 0.3C0.75 0.72 0.4 1 0 1C-0.4 1 -0.75 0.72 -0.75 0.3C-0.75 -0.05 -0.35 -0.45 0 -1Z",
    leaf: "M0 -1C0.78 -0.55 0.78 0.55 0 1C-0.78 0.55 -0.78 -0.55 0 -1Z",
    cog: cogPath(8),
  };
  function shapeD(shape) {
    if (!shape) return null;
    if (MT.SHAPES[shape]) return MT.SHAPES[shape];
    if (/^[\s,]*[Mm]/.test(String(shape))) return String(shape);
    once("error", "material_shape", `motif shape "${String(shape).slice(0, 40)}" is not a named shape (${Object.keys(MT.SHAPES).join(", ")}) or an SVG path d`);
    return null;
  }

  /* ---------------- moving-band geometry (torn, scroll), in a canonical frame ---------------- */
  // canonical: the band moves along +x across a frame Lx long and Ly wide; dir maps it to the screen
  function axes(dir) {
    const v = dir === "up" || dir === "down";
    const Lx = v ? H : W, Ly = v ? W : H;
    const map = dir === "left" ? (x, y) => [W - x, y] : dir === "down" ? (x, y) => [y, x] : dir === "up" ? (x, y) => [y, H - x] : (x, y) => [x, y];
    // a gradient running canonical -x -> +x, in the shape's bounding box
    const gv = dir === "left" ? [1, 0, 0, 0] : dir === "down" ? [0, 0, 0, 1] : dir === "up" ? [0, 1, 0, 0] : [0, 0, 1, 0];
    return { Lx, Ly, map, gv };
  }
  const poly = (pts, map) => "M" + pts.map(([x, y]) => { const [a, b] = map(x, y); return f1(a) + " " + f1(b); }).join("L") + "Z";
  const jags = new Map();
  function jagEdge(seed, Ly, amp) {
    const key = seed + "|" + Ly + "|" + amp;
    if (jags.has(key)) return jags.get(key);
    const r = Loom.rng(seed), out = [], step = 15, ph = r() * 6.28, ph2 = r() * 6.28;
    for (let y = -30; y <= Ly + 30; y += step) {
      // a slow wander plus a sharp tooth: the eye reads paper fibre, not noise
      const v = 0.42 * Math.sin(y / 97 + ph) + 0.18 * Math.sin(y / 31 + ph2) + 0.4 * (r() * 2 - 1);
      out.push([Math.max(-1, Math.min(1, v)) * amp, y]);
    }
    jags.set(key, out);
    return out;
  }

  function torn(p, def, pal) {
    const { Lx, Ly, map, gv } = axes(def.dir || "right");
    const amp = 24, BW = Lx + 6 * amp, closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    const paper = tok(pal, def.token, "field2"), edge = mix(paper, pal.ink || "#000", 0.12);
    const seed = def.seed == null ? 11 : def.seed;
    const J = jagEdge(closing ? seed : seed + 101, Ly, amp);
    const js = J.map((q) => q[0]), mn = Math.min(...js), mx = Math.max(...js);
    let pts, spec;
    if (closing) {
      const lead = -2 * amp + (Lx + 4 * amp) * closeK(u);
      pts = [[lead - BW, -30], ...J.map(([j, y]) => [lead + j, y]), [lead - BW, Ly + 30]];
      const bw = BW + mx;
      spec = { x1: gv[0], y1: gv[1], x2: gv[2], y2: gv[3], stops: [[0, paper], [(BW + mn - 16) / bw, paper], [(BW + mn + 6) / bw, edge], [1, edge]] };
    } else {
      const trail = -2 * amp + (Lx + 4 * amp) * openK(u);
      pts = [[trail + BW, -30], [trail + BW, Ly + 30], ...J.slice().reverse().map(([j, y]) => [trail + j, y])];
      const bw = BW - mn;   // measured from the straight far end back to the torn edge
      spec = { x1: gv[2], y1: gv[3], x2: gv[0], y2: gv[1], stops: [[0, paper], [(BW - mx - 16) / bw, paper], [(BW - mx + 6) / bw, edge], [1, edge]] };
    }
    return { d: poly(pts, map), fill: grad(spec), opacity: 1, layers: [] };
  }

  function scroll(p, def, pal) {
    const { Lx, Ly, map, gv } = axes(def.dir || "right");
    const RW = 74, BW = Lx + 2 * RW + 80, closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    const paper = tok(pal, def.token, "field2"), ink = pal.ink || "#000", hi = pal.surface || paper;
    const shade = (k) => mix(paper, ink, k), lit = mix(paper, hi, 0.7);
    // the roll, across its width from the paper side to its outer side: seam, shade, highlight, body, rim
    const roll = [[0, shade(0.35)], [0.08, shade(0.2)], [0.42, lit], [0.7, paper], [0.95, shade(0.28)], [1, shade(0.4)]];
    const sh = pal.shadow || ink, layers = [];
    let pts, spec;
    if (closing) {
      const lead = -RW - 30 + (Lx + 2 * RW + 60) * closeK(u), a = 1 - RW / BW;
      pts = [[lead - BW, -10], [lead, -10], [lead, Ly + 10], [lead - BW, Ly + 10]];
      spec = { x1: gv[0], y1: gv[1], x2: gv[2], y2: gv[3], stops: [[0, paper], [a - 0.002, paper], ...roll.map(([o, c]) => [a + o * (1 - a), c])] };
      layers.push({ d: poly([[lead, -10], [lead + 26, -10], [lead + 26, Ly + 10], [lead, Ly + 10]], map), fill: sh, opacity: 0.16 });
    } else {
      const trail = -RW - 30 + (Lx + 2 * RW + 60) * openK(u), a = 1 - RW / BW;
      pts = [[trail, -10], [trail + BW, -10], [trail + BW, Ly + 10], [trail, Ly + 10]];
      spec = { x1: gv[2], y1: gv[3], x2: gv[0], y2: gv[1], stops: [[0, paper], [a - 0.002, paper], ...roll.map(([o, c]) => [a + o * (1 - a), c])] };
      layers.push({ d: poly([[trail - 26, -10], [trail, -10], [trail, Ly + 10], [trail - 26, Ly + 10]], map), fill: sh, opacity: 0.16 });
    }
    return { d: poly(pts, map), fill: grad(spec), opacity: 1, layers };
  }

  /* ---------------- page: a sheet with a turned flap ---------------- */
  // clip a polygon to the half plane g(P) >= 0 (Sutherland-Hodgman, one plane)
  function clipHalf(P, g) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const A = P[i], B = P[(i + 1) % P.length], ga = g(A), gb = g(B);
      if (ga >= 0) out.push(A);
      if ((ga >= 0) !== (gb >= 0)) { const t = ga / (ga - gb); out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]); }
    }
    return out;
  }
  const rawPoly = (pts) => (pts.length >= 3 ? "M" + pts.map(([x, y]) => f1(x) + " " + f1(y)).join("L") + "Z" : "");
  function page(p, def, pal) {
    const corner = ["br", "bl", "tr", "tl"].includes(def.corner) ? def.corner : "br";
    const C = [corner[1] === "r" ? W : 0, corner[0] === "b" ? H : 0];
    const diag = Math.hypot(W, H), d = [(W - 2 * C[0]) / diag, (H - 2 * C[1]) / diag];   // unit, toward the far corner
    const L = diag + 24, closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    // closing: the sheet lands (its fold runs back to the corner); opening: it peels from the corner away
    const s = closing ? L * (1 - closeK(u)) : L * openK(u);
    const proj = (P) => (P[0] - C[0]) * d[0] + (P[1] - C[1]) * d[1];
    const rect = [[-2, -2], [W + 2, -2], [W + 2, H + 2], [-2, H + 2]];
    const sheet = clipHalf(rect, (P) => proj(P) - s);
    const lifted = clipHalf(rect, (P) => s - proj(P));
    const k = 0.55;   // the flap is narrower than what it lifted: it reads as a curl, not a flat fold
    const flap = lifted.map((P) => { const dl = s - proj(P); return [P[0] + d[0] * dl * (1 + k), P[1] + d[1] * dl * (1 + k)]; });
    const paper = tok(pal, def.token, "surface"), ink = pal.ink || "#000";
    // the flap's gradient runs from the fold (shaded) to its tip (lit), in its bounding box
    const gx = d[0] < 0 ? [1, 0] : [0, 1], gy = d[1] < 0 ? [1, 0] : [0, 1];
    const flapFill = grad({ x1: gx[0], y1: gy[0], x2: gx[1], y2: gy[1], stops: [[0, mix(paper, ink, 0.2)], [0.35, mix(paper, ink, 0.06)], [1, mix(paper, pal.field || paper, 0.25)]] });
    const shadow = clipHalf(clipHalf(rect, (P) => s - proj(P)), (P) => proj(P) - (s - 40));
    const layers = s > 0.5 && s < L ? [
      { d: rawPoly(shadow), fill: pal.shadow || ink, opacity: 0.2 },
      { d: rawPoly(flap), fill: flapFill, opacity: 1, stroke: mix(paper, ink, 0.35), sw: 1.5 },
    ] : [];
    return { d: rawPoly(sheet), fill: paper, opacity: 1, layers };
  }

  /* ---------------- shapes that grow: motif, fill, handoff ---------------- */
  function motif(p, def, pal) {
    const d0 = shapeD(def.shape || "circle");
    const pl = d0 && pole(d0);
    if (!pl) { once("error", "material_shape", "motif shape has no inside to grow from"); return NONE; }
    const fill = tok(pal, def.token, "accent"), closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    const at = def.at || [W / 2, H / 2], A = closing ? def.from || at : at;
    const kc = (reach(A[0], A[1]) / pl.r) * 1.04;
    const k = kc * (closing ? closeK(u) : openK(u));
    const shape = () => xform(d0, k, A[0] - k * pl.x, A[1] - k * pl.y);
    if (closing) return { d: k * pl.r < 0.5 ? "" : shape(), fill, opacity: 1, layers: [] };
    return { d: k * pl.r < 0.5 ? BOX : BOX + shape(), fill, opacity: 1, layers: [] };
  }
  function fillJoin(p, def, pal) {
    const fill = tok(pal, def.token, "accent"), closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    if (!closing) return { d: BOX, fill, opacity: 1 - openK(u), layers: [] };
    let d0 = null;
    const box = Array.isArray(def.box) && def.box.length === 4 ? def.box : null;
    if (def.shape) {
      d0 = shapeD(def.shape);
      const vb = MT.SHAPES[def.shape] ? [-1, -1, 2, 2] : def.viewBox;
      if (d0 && vb && box) {   // map the shape's own box into def.box, keeping its aspect
        const k0 = Math.min(box[2] / vb[2], box[3] / vb[3]);
        d0 = xform(d0, k0, box[0] + box[2] / 2 - k0 * (vb[0] + vb[2] / 2), box[1] + box[3] / 2 - k0 * (vb[1] + vb[3] / 2));
      } else if (d0 && MT.SHAPES[def.shape] && !box) { once("error", "material_fill_box", `fill join: a named shape needs def.box [x, y, w, h]`); d0 = null; }
    } else if (box) d0 = `M${box[0]} ${box[1]}h${box[2]}v${box[3]}h${-box[2]}Z`;
    const pl = d0 && pole(d0);
    if (!pl) {
      once("error", "material_fill_shape", "fill join needs def.shape (a path d in screen pixels, or a named shape with def.box) or def.box");
      return { d: BOX, fill, opacity: closeK(u), layers: [] };   // degrade to a fade in the token, never a pop
    }
    const P = def.at ? { x: def.at[0], y: def.at[1] } : pl;
    const r = P === pl ? pl.r : Math.max(1, edgeDist(flatten(d0), P.x, P.y));
    const kc = Math.max(1, (reach(P.x, P.y) / r) * 1.04), k = 1 + (kc - 1) * closeK(u);
    return { d: xform(d0, k, P.x * (1 - k), P.y * (1 - k)), fill, opacity: 1, layers: [] };
  }
  function handoff(p, def, pal) {
    const fill = tok(pal, def.to, "field"), closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    if (!closing) return { d: BOX, fill, opacity: 1 - openK(u), layers: [] };
    const e = closeK(u), from = def.from == null ? [W / 2, H / 2] : def.from;
    if (Array.isArray(from)) {
      const r = reach(from[0], from[1]) * 1.02 * e;
      if (r < 0.5) return NONE;
      return { d: `M${f1(from[0] - r)} ${f1(from[1])}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`, fill, opacity: 1, layers: [] };
    }
    // an edge: the colour slides in from it (left means it enters from the left edge)
    const dir = { left: "right", right: "left", top: "down", up: "down", bottom: "up", down: "up" }[from];
    if (!dir) { once("error", "material_handoff_from", `handoff: from "${from}" must be an edge (left, right, top, bottom) or [x, y]`); return { d: BOX, fill, opacity: e, layers: [] }; }
    const { Lx, Ly, map } = axes(dir), lead = (Lx + 4) * e - 2;
    return { d: e <= 0 ? "" : poly([[-4, -4], [lead, -4], [lead, Ly + 4], [-4, Ly + 4]], map), fill, opacity: 1, layers: [] };
  }

  const KIND = { torn, page, scroll, motif, fill: fillJoin, handoff };
  /** the cover of a material join at progress p (0..1). Pure; world.coverAt delegates here. */
  MT.coverAt = function (kind, p, def, pal) {
    if (!MT.has(kind)) { once("error", "join_unknown", `material join "${kind}" (have: ${MT.KINDS.join(", ")})`); return NONE; }
    const r = KIND[kind](clamp01(Number(p) || 0), def || {}, pal || {});
    r.layers = r.layers || [];
    return r;
  };

  /* ---------------- drawing the shading layers (the lab, and world once wired) ---------------- */
  MT.layerGroup = function (parent) {
    const g = Loom.svg("g", { class: "lm-material-layers" }, parent);
    for (let i = 0; i < MT.MAX_LAYERS; i++) Loom.svg("path", { d: "", opacity: 0 }, g);
    return g;
  };
  MT.drawLayers = function (g, layers) {
    const L = layers || [];
    for (let i = 0; i < g.childNodes.length; i++) {
      const el = g.childNodes[i], l = L[i];
      if (!l || !l.d) { el.setAttribute("d", ""); el.setAttribute("opacity", "0"); continue; }
      el.setAttribute("d", l.d); el.setAttribute("fill", l.fill || "none"); el.setAttribute("opacity", Number(l.opacity == null ? 1 : l.opacity).toFixed(3));
      if (l.stroke) { el.setAttribute("stroke", l.stroke); el.setAttribute("stroke-width", l.sw || 1); el.setAttribute("stroke-linejoin", "round"); }
      else el.removeAttribute("stroke");
    }
  };

  // exposed for tests and for fill joins that want a shape's centre
  MT._path = { parse, xform, flatten, inside, pole, reach };
})();
