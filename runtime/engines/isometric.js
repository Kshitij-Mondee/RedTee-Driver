/* Isometric infographic engine (2026-10-16). A working system drawn as a clean isometric infographic on one floating
 * diorama board: flat three-tone solids at true 30 degree isometric, no outlines on solids, thin ink only for the
 * infographic furniture (map pins on leaders, routes, cut lines, rings, legends), Isotype numbers that add up.
 *
 * Learned from lemo-opuscar's iso-infographic (three tones per face, the diorama board with strata, cutaways, focus and
 * context, an inset, a tracked subject, a scale reveal, log zoom, painter's sorting, motion led by lines). Rebuilt for
 * Loom, not copied: their engine is canvas immediate mode; this one is retained SVG on Loom's timeline, inside an element
 * a scene made with ctx.el, so holds, joins, the layout guard, the probe and restyles keep working. Research and what
 * changed because of it: docs/research/2026-10-16-style-isometric.md. How a scene uses it: docs/styles/engines/isometric.md.
 *
 *   const W = ctx.engine, B = W.board(ctx, { name: "site", size: [14, 9], at: 0.3 });
 *   const wh = B.put("building", { x: 2, y: 2, w: 4, d: 3, floors: 2, at: ctx.cue("the warehouse") });
 *   const r = B.route("lane", [[1, 8], [10, 8], [10, 3]], { at: 4 });
 *   const truck = B.put("truck", { route: r, tok: "accent", subject: true, at: 4.2 });
 *   truck.travel(r, 5, { dur: 4 });  B.track(truck, { label: "Your order", at: 5 });
 *   wh.cut(9);  B.pin(wh, "Warehouse", { at: 2 });  B.camera(11, wh, { zoom: 1.8 });  B.reveal(15);
 *
 * World units: x runs down-right, y down-left, z up; one unit is `unit` px at zoom 1. Every frame is a pure function of
 * time: positions, the camera, pins and the painter's order of moving things are recomputed from t (one clock per board,
 * Loom.clock), and every move is also on the timeline as a drive so the report sees it. No Math.random, Date, timers,
 * requestAnimationFrame or network (loom/engines.py lints it).
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const C30 = Math.cos(Math.PI / 6);
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  const E_ = () => Loom.ease;
  const ptsStr = (P) => P.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ");
  const dPath = (P, closed) => P.map((p, i) => (i ? "L" : "M") + f1(p[0]) + "," + f1(p[1])).join(" ") + (closed ? " Z" : "");
  const DIRS = { "+x": 0, "+y": 1, "-x": 2, "-y": 3 };
  const NEUTRAL = new Set(["field", "field2", "surface", "surface2", "ink", "muted", "line", "shadow", "onAccent", "caption_active"]);
  const VIEW = [1, 1, 1];                                // toward the viewer: a face is seen when its normal points here
  // the brightness of a face from its normal, for the three tones: top 1.0, left (+y) 0.6, right (+x) 0.25
  const LIGHT = [0.25, 0.6, 1.0];
  let UID = 0;

  // ================================================================ colour: three tones from one token
  function hexOf(tok) {
    const P = S().pack.palette;
    if (tok in P) return P[tok];
    const m = S().material ? S().material(tok, null) : null;
    if (m && m in P) return P[m];
    Loom.error("iso_unknown_token", `isometric engine: "${tok}" is not a palette token or a material of the ${S().pack.id} pack`);
    return P.surface2 || P.surface;
  }
  const rgbOf = (h) => { h = String(h).replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const lumaOf = (h) => { const [r, g, b] = rgbOf(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const hexRGB = (r, g, b) => "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  const TONE_CACHE = {};
  /** {base, top, left, right, cut} for a token: top lit toward the pack's surface, the right face toward its cool shadow;
   *  a pale base keeps its top and steps its sides down instead (a white top would merge with a white left face) */
  function tones(tok) {
    const key = (S().pack.id || "") + ":" + tok;
    if (TONE_CACHE[key]) return TONE_CACHE[key];
    const base = hexOf(tok), wh = S().c("surface"), dk = S().c("shadow"), L = lumaOf(base);
    const f = smooth((L - 0.6) / 0.3);
    const T = {
      base,
      top: S().mix(base, wh, 0.30 * (1 - f)),
      left: S().mix(base, dk, 0.10 * f),
      right: S().mix(base, dk, 0.28 - 0.04 * f),
      cut: S().mix(base, dk, 0.5),
    };
    TONE_CACHE[key] = T;
    return T;
  }
  /** the colour of a face of this token with this (unit) normal */
  function toneFor(T, n) {
    const b = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
    if (b >= 0.6) return S().mix(T.left, T.top, clamp((b - 0.6) / 0.4, 0, 1));
    return S().mix(T.right, T.left, clamp((b - 0.25) / 0.35, 0, 1));
  }
  /** focus+context: a colour seen as context (its own lightness in grey, lifted toward the field), so depth still reads */
  const CTX_CACHE = {};
  function contextOf(col) {
    if (CTX_CACHE[col]) return CTX_CACHE[col];
    const v = lumaOf(col) * 255;
    return (CTX_CACHE[col] = S().mix(hexRGB(v, v, v), S().c("field"), 0.42));
  }

  // ================================================================ geometry (world units, local to an object)
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm3 = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
  const centroid = (P) => { const c = [0, 0, 0]; for (const p of P) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } return mul3(c, 1 / P.length); };
  function newell(P) {
    const n = [0, 0, 0];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return norm3(n);
  }
  // every face carries an explicit OUTWARD normal (opuscar's pitfall: normals from vertex order cull the wrong faces).
  // A face built from points gets its normal by Newell, then flipped to point away from the solid's centre.
  function faceOut(pts, centre, o) {
    let n = newell(pts);
    if (dot3(sub3(centroid(pts), centre), n) < 0) n = mul3(n, -1);
    return Object.assign({ pts, n }, o || {});
  }
  const aabbOf = (pts) => {
    const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (const p of pts) for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], p[i]); b[i + 3] = Math.max(b[i + 3], p[i]); }
    return b;
  };

  /* An oriented box: origin O and three edge vectors (ex, ey, ez). Its faces are named by the local axis they face
   * ("+x" ... "-z"); a decal is a flat polygon laid on a face (windows, screens, lights, stripes), drawn after it. */
  function obox(O, ex, ey, ez, tok, o) {
    o = o || {};
    const C = (i, j, k) => add3(add3(add3(O, mul3(ex, i)), mul3(ey, j)), mul3(ez, k));
    const corners = [C(0, 0, 0), C(1, 0, 0), C(1, 1, 0), C(0, 1, 0), C(0, 0, 1), C(1, 0, 1), C(1, 1, 1), C(0, 1, 1)];
    const centre = centroid(corners);
    const F = {
      "+x": [C(1, 0, 0), C(1, 1, 0), C(1, 1, 1), C(1, 0, 1)], "-x": [C(0, 0, 0), C(0, 1, 0), C(0, 1, 1), C(0, 0, 1)],
      "+y": [C(0, 1, 0), C(1, 1, 0), C(1, 1, 1), C(0, 1, 1)], "-y": [C(0, 0, 0), C(1, 0, 0), C(1, 0, 1), C(0, 0, 1)],
      "+z": [C(0, 0, 1), C(1, 0, 1), C(1, 1, 1), C(0, 1, 1)], "-z": [C(0, 0, 0), C(1, 0, 0), C(1, 1, 0), C(0, 1, 0)],
    };
    const ft = o.faceTok || {};
    const faces = Object.keys(F).map((k) => faceOut(F[k], centre, { tok: ft[k] || tok, name: k }));
    const prim = { type: "poly", faces, tok, part: o.part || "body", skin: !!o.skin, out: o.out || null, hidden: !!o.hidden, centre };
    const unit = (v) => norm3(v);
    const span = { "+x": [ey, ez, ex, 1], "-x": [ey, ez, ex, 0], "+y": [ex, ez, ey, 1], "-y": [ex, ez, ey, 0], "+z": [ex, ey, ez, 1], "-z": [ex, ey, ez, 0] };
    /** a decal on face `fc`: a polygon given in face units [[a, b], ...] (a along the first span axis, b along the second),
     *  or a rectangle (a0, b0, a1, b1). Options: tok, part, flat (its own base colour, a lit screen or a light), hatch */
    prim.decal = function (fc, a0, b0, a1, b1, dtok, d) {
      d = d || {};
      const [u, v, w, s] = span[fc], uu = unit(u), vv = unit(v), base = s ? add3(O, w) : O;
      const host = faces.find((f) => f.name === fc);
      const poly = Array.isArray(a0) ? a0 : [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
      const off = mul3(host.n, 0.006 * (1 + (d.layer || 0)));
      const pts = poly.map(([a, b]) => add3(add3(add3(base, mul3(uu, a)), mul3(vv, b)), off));
      faces.push({ pts, n: host.n, tok: dtok || tok, kind: "decal", flat: !!d.flat, pale: d.pale || 0, hatch: !!d.hatch, part: d.part || prim.part, name: fc, hidden: !!d.hidden, rim: !!d.rim });
      return prim;
    };
    /** a decal ellipse on a face (a wheel, a porthole, a dial): centre (a, b), radii (ra, rb) in face units */
    prim.ellipse = function (fc, a, b, ra, rb, dtok, d) {
      const P = [];
      for (let i = 0; i < 20; i++) { const t = i / 20 * TAU; P.push([a + Math.cos(t) * ra, b + Math.sin(t) * rb]); }
      return prim.decal(fc, P, 0, 0, 0, dtok, d);
    };
    return prim;
  }
  const box = (x, y, z, w, d, h, tok, o) => obox([x, y, z], [w, 0, 0], [0, d, 0], [0, 0, h], tok, o);
  /** a wedge (a ramp): the top slopes up toward `rise` ("+x", "-x", "+y", "-y") */
  function wedge(x, y, z, w, d, h, rise, tok, o) {
    o = o || {};
    const x1 = x + w, y1 = y + d, z1 = z + h;
    const base = [[x, y, z], [x1, y, z], [x1, y1, z], [x, y1, z]];
    const hi = { "+x": [[x1, y, z1], [x1, y1, z1], 1, 2], "-x": [[x, y, z1], [x, y1, z1], 0, 3], "+y": [[x, y1, z1], [x1, y1, z1], 3, 2], "-y": [[x, y, z1], [x1, y, z1], 0, 1] }[rise || "+x"];
    const [A, Bq, ia, ib] = hi;
    const all = base.concat([A, Bq]), centre = centroid(all);
    const faces = [faceOut(base, centre, { tok })];
    const lowA = { "+x": 0, "-x": 1, "+y": 0, "-y": 3 }[rise || "+x"], lowB = { "+x": 3, "-x": 2, "+y": 1, "-y": 2 }[rise || "+x"];
    faces.push(faceOut([base[lowA], base[lowB], Bq, A].filter(Boolean), centre, { tok, name: "slope" }));
    faces.push(faceOut([base[ia], base[ib], Bq, A], centre, { tok, name: "end" }));
    const sideA = [base[lowA], base[ia], A], sideB = [base[lowB], base[ib], Bq];
    faces.push(faceOut(sideA, centre, { tok, name: "side" }), faceOut(sideB, centre, { tok, name: "side" }));
    return { type: "poly", faces, tok, part: o.part || "body", skin: !!o.skin, out: o.out || null, centre };
  }
  /** a gable roof over (x, y, z, w, d): the ridge along `axis` ("x" or "y"), `h` above the eaves */
  function gable(x, y, z, w, d, h, axis, tok, o) {
    o = o || {};
    const x1 = x + w, y1 = y + d, zr = z + h;
    let pts;
    if ((axis || "x") === "x") pts = { r0: [x, y + d / 2, zr], r1: [x1, y + d / 2, zr], s0: [[x, y, z], [x1, y, z]], s1: [[x, y1, z], [x1, y1, z]] };
    else pts = { r0: [x + w / 2, y, zr], r1: [x + w / 2, y1, zr], s0: [[x, y, z], [x, y1, z]], s1: [[x1, y, z], [x1, y1, z]] };
    const all = [pts.r0, pts.r1, ...pts.s0, ...pts.s1], centre = centroid(all);
    const faces = [
      faceOut([pts.s0[0], pts.s0[1], pts.r1, pts.r0], centre, { tok, name: "slope" }),
      faceOut([pts.s1[0], pts.s1[1], pts.r1, pts.r0], centre, { tok, name: "slope" }),
      faceOut([pts.s0[0], pts.s1[0], pts.r0], centre, { tok, name: "gable" }),
      faceOut([pts.s0[1], pts.s1[1], pts.r1], centre, { tok, name: "gable" }),
    ];
    return { type: "poly", faces, tok, part: o.part || "roof", skin: !!o.skin, out: o.out || null, centre };
  }
  /** a vertical cylinder: drawn as its top ellipse and two side halves (left mid, right dark) */
  const cyl = (cx, cy, z, r, h, tok, o) => ({ type: "cyl", cx, cy, z, r, h, tok, part: (o && o.part) || "body", skin: !!(o && o.skin), out: (o && o.out) || null, hidden: !!(o && o.hidden) });
  /** a flat polygon at height z (a marking, a mat, a dashed outline's fill) */
  const flat = (pts2, z, tok, o) => ({ type: "poly", faces: [Object.assign({ pts: pts2.map((p) => [p[0], p[1], z]), n: [0, 0, 1], tok, kind: "decal" }, o || {})], tok, part: (o && o.part) || "body" });
  /** a billboard: flat art standing upright at a point, facing the viewer (Isotype people, round tree crowns) */
  const bill = (x, y, z, h, draw, tok, o) => Object.assign({ type: "bill", x, y, z, h, draw, tok, part: "body" }, o || {});
  /** ink in the world (a cut line, a rail): a polyline in world units */
  const ink = (pts, o) => Object.assign({ type: "ink", pts, tok: "line", width: 2 }, o || {});

  // prim helpers for the object library
  const G = { box, obox, wedge, gable, cyl, flat, bill, ink };

  // ================================================================ the object library (parametric, local units)
  // Each kind builds in a local frame: its footprint is [0, L] x [0, W] (L along the direction it faces, "+x"), its base
  // at z = 0. It returns {L, W, H, prims}. Every prim names its part; `skin` prims are what a cutaway removes (with the
  // direction `out` they slide), `rim` decals are the hatched cut edges shown after a cut. Sizes are in world units.
  const KINDS = {};
  const kind = (name, def) => { KINDS[name] = def; };
  const T0 = (o, d) => o.tok || d;

  // ---- primitives
  kind("box", { tok: "steel", build(o) { const w = o.w || 1, d = o.d || 1, h = o.h == null ? 1 : o.h; return { L: w, W: d, H: h, prims: [box(0, 0, 0, w, d, h, T0(o, "steel"))] }; } });
  kind("slab", { tok: "concrete", build(o) { const w = o.w || 2, d = o.d || 2, h = o.h || 0.2; return { L: w, W: d, H: h, prims: [box(0, 0, 0, w, d, h, T0(o, "concrete"))] }; } });
  kind("cylinder", { tok: "steel", build(o) { const r = o.r || 0.5, h = o.h || 1; return { L: 2 * r, W: 2 * r, H: h, prims: [cyl(r, r, 0, r, h, T0(o, "steel"))] }; } });
  kind("ramp", { tok: "concrete", build(o) { const w = o.w || 2, d = o.d || 1, h = o.h || 0.6; return { L: w, W: d, H: h, prims: [wedge(0, 0, 0, w, d, h, o.rise || "+x", T0(o, "concrete"))] }; } });
  kind("stairs", { tok: "concrete", build(o) {
    const w = o.w || 1.6, d = o.d || 1, h = o.h || 1, n = o.steps || 5, P = [];
    for (let i = 0; i < n; i++) P.push(box(i * w / n, 0, 0, w / n, d, h * (i + 1) / n, T0(o, "concrete")));
    return { L: w, W: d, H: h, prims: P };
  } });
  // a station plate: a low plinth with a pale top, its sides in the station's hue, a dashed ink outline inset on its top
  kind("plate", { tok: "accent2", build(o) {
    const w = o.w || 2.4, d = o.d || 2.4, h = o.h || 0.16, t = T0(o, "accent2");
    const P = [box(0, 0, 0, w, d, h, t, { faceTok: { "+z": o.top || "surface" } })];
    if (o.dashed !== false) {
      const m = 0.16, L = [[m, m], [w - m, m], [w - m, d - m], [m, d - m], [m, m]].map((p) => [p[0], p[1], h + 0.004]);
      P.push(ink(L, { tok: "line", width: 1.6, dash: "7 6", opacity: 0.55, part: "outline" }));
    }
    return { L: w, W: d, H: h, prims: P };
  } });

  // ---- buildings
  // floors of `fh`, the shell (front walls and roof) is the skin a cutaway slides away; floor slabs' edges and the back
  // walls' cut ends carry the hatched rims. `rooms(floor, add)` puts objects inside a floor (add(kind, {x, y, ...})).
  kind("building", { tok: "concrete", build(o, sub) {
    const w = o.w || 3, d = o.d || 3, n = o.floors || 2, fh = o.fh || 1.1, t = 0.12, sl = 0.12, tok = T0(o, "concrete");
    const glass = o.glass || "glass", P = [];
    for (let f = 0; f < n; f++) {
      const z = f * fh, wallH = fh - sl;
      const slab = box(0, 0, z, w, d, sl, o.slab || "surface2", { part: "floor" + f });
      slab.decal("+x", 0, 0, d, sl, "surface2", { hatch: true, rim: true, hidden: true, part: "rim" });
      slab.decal("+y", 0, 0, w, sl, "surface2", { hatch: true, rim: true, hidden: true, part: "rim" });
      P.push(slab);
      const bx = box(0, 0, z + sl, t, d - t, wallH, o.inner || "surface", { part: "back" });
      bx.decal("+y", 0, 0, t, wallH, "surface2", { hatch: true, rim: true, hidden: true, part: "rim" });
      const by = box(t, 0, z + sl, w - 2 * t, t, wallH, o.inner || "surface", { part: "back" });
      by.decal("+x", 0, 0, t, wallH, "surface2", { hatch: true, rim: true, hidden: true, part: "rim" });
      P.push(bx, by);
      const sx = box(w - t, 0, z + sl, t, d, wallH, tok, { part: "shell", skin: true, out: [1, 0, 0] });
      const sy = box(0, d - t, z + sl, w - t, t, wallH, tok, { part: "shell", skin: true, out: [0, 1, 0] });
      if (o.windows !== false) {
        const nw = Math.max(1, Math.floor(d / 0.85)), sw = d / nw;
        for (let i = 0; i < nw; i++) sx.decal("+x", i * sw + sw * 0.2, wallH * 0.28, i * sw + sw * 0.8, wallH * 0.78, glass);
        const nx = Math.max(1, Math.floor((w - t) / 0.85)), sx2 = (w - t) / nx;
        for (let i = 0; i < nx; i++) {
          if (f === 0 && o.door !== false && i === Math.floor(nx / 2)) { sy.decal("+y", i * sx2 + sx2 * 0.22, 0, i * sx2 + sx2 * 0.78, wallH * 0.8, "line", { part: "door" }); continue; }
          sy.decal("+y", i * sx2 + sx2 * 0.2, wallH * 0.28, i * sx2 + sx2 * 0.8, wallH * 0.78, glass);
        }
      }
      // a facade for a hall with no windows (a data hall, a depot): louvre bands on the right wall, shutter doors and a
      // door on the ground floor's front, a sign plate (a colour, never words) on the top floor
      const hall = o.facade === "hall";
      if (hall || o.louvres) for (let k = 0; k < 3; k++) sx.decal("+x", d * 0.1, wallH * (0.56 + k * 0.11), d * 0.9, wallH * (0.56 + k * 0.11) + 0.05, "steel", { part: "louvre" });
      if (f === 0 && (hall || o.doors)) {
        const nd = o.doors || Math.max(1, Math.min(3, Math.floor((w - t) / 2.2))), dw = Math.min(1.1, (w - t) / (nd * 2 + 1.5)), dh = Math.min(wallH * 0.62, 1.5);
        for (let i = 0; i < nd; i++) {
          const a = (w - t) * 0.42 + i * dw * 1.5;
          sy.decal("+y", a, 0, a + dw, dh, "steel", { part: "door" });
          for (let k = 1; k < 5; k++) sy.decal("+y", a + 0.04, dh * k / 5, a + dw - 0.04, dh * k / 5 + 0.025, "line", { part: "door", layer: 1 });
        }
        sy.decal("+y", (w - t) * 0.12, 0, (w - t) * 0.12 + 0.42, Math.min(wallH * 0.7, 0.95), "line", { part: "door" });
      }
      if (f === n - 1 && (o.sign || hall)) { const sw = Math.min(2.4, (w - t) * 0.42); sy.decal("+y", (w - t) * 0.08, wallH * 0.74, (w - t) * 0.08 + sw, wallH * 0.74 + Math.min(0.32, wallH * 0.16), o.sign || "surface", { flat: true, part: "sign" }); }
      P.push(sx, sy);
      if (o.rooms) o.rooms(f, (k, q) => { for (const p of sub(k, Object.assign({}, q, { z: z + sl + (q.z || 0) }), "room" + f)) P.push(p); });
    }
    const rz = n * fh;
    const roof = box(0, 0, rz, w, d, 0.14, o.roof || "surface2", { part: "roof", skin: true, out: [0, 0, 1] });
    roof.decal("+z", 0.12, 0.12, w - 0.12, d - 0.12, o.roofInner || "concrete", { part: "roof" });
    P.push(roof);
    // roof units (chillers, air handlers): a row of boxes with a fan on top
    const nu = o.units != null ? o.units : (o.facade === "hall" ? Math.max(2, Math.min(5, Math.floor(w / 1.5))) : 0);
    for (let i = 0; i < nu; i++) {
      const uw = Math.min(0.75, (w - 0.4) / nu - 0.2), ux = 0.3 + i * (w - 0.6) / nu, ub = box(ux, d * 0.22, rz + 0.14, uw, Math.min(0.7, d * 0.3), 0.34, "steel", { part: "roof", skin: true, out: [0, 0, 1] });
      ub.ellipse("+z", uw / 2, Math.min(0.7, d * 0.3) / 2, uw * 0.32, uw * 0.32, "line", { part: "roof" });
      P.push(ub);
    }
    if (o.plant !== false && !nu && w >= 2 && d >= 2) P.push(box(w * 0.55, d * 0.2, rz + 0.14, Math.min(0.8, w * 0.25), Math.min(0.6, d * 0.22), 0.32, "steel", { part: "roof", skin: true, out: [0, 0, 1] }));
    return { L: w, W: d, H: rz + 0.14, prims: P };
  } });
  // a factory: a hall with a sawtooth roof (glazed faces), a chimney and a loading door
  kind("factory", { tok: "concrete", build(o) {
    const w = o.w || 4, d = o.d || 3, h = o.h || 1.4, n = o.teeth || 4, tok = T0(o, "concrete"), P = [];
    const hall = box(0, 0, 0, w, d, h, tok);
    hall.decal("+y", w * 0.12, 0, w * 0.42, h * 0.62, "steel", { part: "door" });
    for (let i = 0; i < 4; i++) hall.decal("+y", w * 0.12, h * (0.1 + i * 0.13), w * 0.42, h * (0.1 + i * 0.13) + 0.02, "line", { part: "door" });
    for (let i = 0; i < 3; i++) hall.decal("+y", w * (0.55 + i * 0.14), h * 0.35, w * (0.55 + i * 0.14) + w * 0.09, h * 0.72, "glass");
    hall.decal("+x", d * 0.15, h * 0.35, d * 0.85, h * 0.72, "glass");
    P.push(hall);
    for (let i = 0; i < n; i++) {
      const wg = wedge(i * w / n, 0, h, w / n, d, 0.55, "+x", o.roof || "steel", { part: "roof" });
      P.push(wg);
      P.push(box((i + 1) * w / n - 0.03, 0.08, h, 0.03, d - 0.16, 0.52, "glass", { part: "glazing" }));
    }
    P.push(cyl(w * 0.18, d * 0.25, h, 0.22, 1.5, o.chimney || "steel", { part: "chimney" }));
    P.push(cyl(w * 0.18, d * 0.25, h + 1.2, 0.235, 0.14, o.band || "accent4", { part: "chimney" }));
    return { L: w, W: d, H: h + 1.5, prims: P };
  } });
  // a store: a shopfront with big windows, a sign band and a striped awning
  kind("store", { tok: "surface", build(o) {
    const w = o.w || 2.6, d = o.d || 2, h = o.h || 1.3, tok = T0(o, "surface"), aw = o.awning || "accent", P = [];
    const b = box(0, 0, 0, w, d, h, tok);
    b.decal("+y", 0.15, 0.08, w * 0.62, h * 0.66, "glass");
    b.decal("+y", w * 0.7, 0, w * 0.88, h * 0.7, "line", { part: "door" });
    b.decal("+y", 0.1, h * 0.8, w - 0.1, h * 0.95, aw, { part: "sign" });
    b.decal("+x", 0.2, h * 0.3, d - 0.2, h * 0.66, "glass");
    P.push(b);
    const n = 6;
    for (let i = 0; i < n; i++) P.push(wedge(i * w / n, d, h * 0.62, w / n, 0.42, 0.16, "-y", i % 2 ? "surface" : aw, { part: "awning" }));
    P.push(box(0, 0, h, w, d, 0.1, "surface2", { part: "roof" }));
    return { L: w, W: d + 0.42, H: h + 0.1, prims: P };
  } });

  // ---- office and IT
  kind("desk", { tok: "wood", build(o) {
    const w = o.w || 1.3, d = o.d || 0.75, top = 0.46, P = [];
    for (const [x, y] of [[0.06, 0.06], [w - 0.12, 0.06], [0.06, d - 0.12], [w - 0.12, d - 0.12]]) P.push(box(x, y, 0, 0.06, 0.06, top, "steel", { part: "legs" }));
    const tp = box(0, 0, top, w, d, 0.06, T0(o, "wood"), { part: "top" });
    tp.decal("+z", w * 0.25, d * 0.5, w * 0.7, d * 0.78, "steel", { part: "keyboard" });
    P.push(tp);
    P.push(box(w * 0.45, 0.08, top + 0.06, 0.08, 0.06, 0.14, "steel", { part: "monitor" }));
    const sc = box(w * 0.16, 0.06, top + 0.18, w * 0.66, 0.06, 0.4, "line", { part: "monitor" });
    sc.decal("+y", 0.03, 0.03, w * 0.66 - 0.03, 0.37, o.screen || "glass", { flat: true, part: "screen" });
    P.push(sc);
    if (o.chair !== false) {
      const ct = o.chairTok || "steel";
      P.push(cyl(w * 0.5, d + 0.32, 0, 0.05, 0.26, "steel", { part: "chair" }));
      P.push(box(w * 0.5 - 0.22, d + 0.1, 0.26, 0.44, 0.42, 0.07, ct, { part: "chair" }));
      P.push(box(w * 0.5 - 0.22, d + 0.46, 0.33, 0.44, 0.07, 0.36, ct, { part: "chair" }));
    }
    return { L: w, W: d + (o.chair !== false ? 0.55 : 0), H: top + 0.6, prims: P };
  } });
  // a server rack: a frame, units stacked inside (each with lights), the side panel and top as the cutaway skin
  kind("rack", { tok: "line", build(o) {
    const w = o.w || 0.8, d = o.d || 0.9, h = o.h || 2.0, tok = T0(o, "line"), P = [], fr = 0.06;
    P.push(box(0, 0, 0, w, d, 0.1, tok, { part: "frame" }));
    P.push(box(0, 0, 0.1, fr, d, h - 0.2, tok, { part: "frame" }));
    P.push(box(0, 0, 0.1, w, fr, h - 0.2, tok, { part: "frame" }));
    const n = o.units || Math.max(4, Math.floor((h - 0.3) / 0.2)), uh = (h - 0.3) / n;
    const lit = o.lit == null ? n : o.lit;
    for (let i = 0; i < n; i++) {
      const u = box(fr, fr, 0.12 + i * uh, w - 2 * fr, d - fr - 0.02, uh - 0.035, o.unit || "steel", { part: "unit" + i });
      u.decal("+y", 0.06, uh * 0.28, w * 0.45, uh * 0.62, "line", { part: "unit" + i });
      u.decal("+y", w - 2 * fr - 0.16, uh * 0.3, w - 2 * fr - 0.1, uh * 0.62, i < lit ? (o.light || "pos") : "muted", { flat: true, part: "light" + i });
      u.decal("+y", w - 2 * fr - 0.28, uh * 0.3, w - 2 * fr - 0.22, uh * 0.62, i < lit ? "accent2" : "muted", { flat: true, part: "light" + i });
      u.decal("+x", 0.1, uh * 0.2, d * 0.75, uh * 0.55, "accent3", { part: "board" });
      P.push(u);
    }
    P.push(box(w - fr, 0, 0.1, fr, d, h - 0.2, tok, { part: "side", skin: true, out: [1, 0, 0] }));
    P.push(box(0, 0, h - 0.1, w, d, 0.1, tok, { part: "top", skin: true, out: [0, 0, 1] }));
    P.push(box(0, d - 0.05, 0.1, fr, 0.05, h - 0.2, tok, { part: "frame" }));
    return { L: w, W: d, H: h, prims: P };
  } });
  kind("laptop", { tok: "steel", build(o) {
    const w = o.w || 1.0, d = o.d || 0.68, P = [], a = (o.open == null ? 102 : o.open) * Math.PI / 180;
    const bs = box(0, 0, 0, w, d, 0.05, T0(o, "steel"), { part: "base" });
    bs.decal("+z", 0.1, d * 0.3, w - 0.1, d * 0.72, "line", { part: "keys" });
    bs.decal("+z", w * 0.38, d * 0.78, w * 0.62, d * 0.94, "concrete", { part: "pad" });
    P.push(bs);
    // the lid hinges on the back edge (y = 0) and leans back
    const ez = [0, Math.cos(a) * 0.62, Math.sin(a) * 0.62], ey = [0, 0.04 * Math.sin(a), -0.04 * Math.cos(a)];
    const lid = obox([0, 0.02, 0.05], [w, 0, 0], ey, ez, T0(o, "steel"), { part: "lid" });
    lid.decal("+y", 0.05, 0.05, w - 0.05, 0.57, o.screen || "glass", { flat: true, part: "screen" });
    P.push(lid);
    return { L: w, W: d, H: 0.7, prims: P };
  } });
  kind("phone", { tok: "line", build(o) {
    const w = o.w || 0.55, h = o.h || 1.0, t = 0.08, P = [];
    P.push(box(w * 0.2, 0, 0, w * 0.6, 0.3, 0.05, "steel", { part: "stand" }));
    const b = box(0, 0.1, 0.05, w, t, h, T0(o, "line"), { part: "body" });
    b.decal("+y", 0.04, 0.08, w - 0.04, h - 0.06, o.screen || "glass", { flat: true, part: "screen" });
    b.decal("+y", w * 0.35, h - 0.045, w * 0.65, h - 0.025, "line", { part: "notch" });
    P.push(b);
    return { L: w, W: 0.3, H: h + 0.05, prims: P };
  } });
  // a database: three discs stacked with gaps (the cylinder bands are the tell)
  kind("database", { tok: "accent2", build(o) {
    const r = o.r || 0.55, n = o.discs || 3, dh = o.dh || 0.3, gap = 0.07, P = [];
    for (let i = 0; i < n; i++) P.push(cyl(r, r, i * (dh + gap), r, dh, T0(o, "accent2"), { part: "disc" + i }));
    return { L: 2 * r, W: 2 * r, H: n * (dh + gap) - gap, prims: P };
  } });
  // a cloud: rounded puffs (short cylinders) in two tiers
  kind("cloud", { tok: "surface", build(o) {
    const s = o.s || 1, t = T0(o, "surface"), P = [];
    P.push(cyl(1.0 * s, 1.0 * s, 0, 0.75 * s, 0.32 * s, t, { part: "puff" }));
    P.push(cyl(0.48 * s, 1.35 * s, 0, 0.45 * s, 0.28 * s, t, { part: "puff" }));
    P.push(cyl(1.62 * s, 0.7 * s, 0, 0.42 * s, 0.26 * s, t, { part: "puff" }));
    P.push(cyl(0.95 * s, 0.95 * s, 0.32 * s, 0.5 * s, 0.26 * s, t, { part: "puff" }));
    return { L: 2.1 * s, W: 2.0 * s, H: 0.58 * s, prims: P };
  } });

  // ---- logistics
  const wheels = (p, fc, xs, r, z) => { for (const x of xs) { p.ellipse(fc, x, z, r, r, "shadow", { part: "wheel" }); p.ellipse(fc, x, z, r * 0.45, r * 0.45, "steel", { part: "wheel", layer: 1 }); } };
  kind("truck", { tok: "accent2", build(o) {
    const L = o.l || 3.2, W = o.w || 1.1, P = [], body = T0(o, "accent2");
    const ch = box(0.15, 0.12, 0.2, L - 0.3, W - 0.24, 0.22, "line", { part: "chassis" });
    wheels(ch, "+y", [0.55, 1.05, L - 0.6], 0.2, 0.0);
    wheels(ch, "-y", [0.55, 1.05, L - 0.6], 0.2, 0.0);
    P.push(ch);
    const tr = box(0, 0, 0.42, L - 0.9, W, 1.15, o.trailer || "surface", { part: "trailer" });
    tr.decal("+y", 0.15, 0.45, L - 1.05, 0.62, body, { part: "stripe" });
    tr.decal("-y", 0.15, 0.45, L - 1.05, 0.62, body, { part: "stripe" });
    tr.decal("-x", 0.1, 0.1, W - 0.1, 1.05, "concrete", { part: "doors" });
    P.push(tr);
    const cab = box(L - 0.82, 0.02, 0.42, 0.82, W - 0.04, 0.95, body, { part: "cab" });
    cab.decal("+x", 0.08, 0.5, W - 0.12, 0.85, "glass", { part: "windscreen" });
    cab.decal("+y", 0.4, 0.5, 0.74, 0.85, "glass", { part: "window" });
    cab.decal("-y", 0.4, 0.5, 0.74, 0.85, "glass", { part: "window" });
    P.push(cab);
    return { L, W, H: 1.57, prims: P };
  } });
  kind("van", { tok: "surface", build(o) {
    const L = o.l || 2.1, W = o.w || 0.95, P = [], body = T0(o, "surface");
    const ch = box(0.12, 0.1, 0.14, L - 0.24, W - 0.2, 0.16, "line", { part: "chassis" });
    wheels(ch, "+y", [0.42, L - 0.45], 0.17, 0.0); wheels(ch, "-y", [0.42, L - 0.45], 0.17, 0.0);
    P.push(ch);
    const b = box(0, 0, 0.3, L - 0.55, W, 0.95, body, { part: "body" });
    b.decal("+y", 0.12, 0.35, L - 0.7, 0.5, o.stripe || "accent2", { part: "stripe" }); b.decal("-y", 0.12, 0.35, L - 0.7, 0.5, o.stripe || "accent2", { part: "stripe" });
    P.push(b);
    const c = box(L - 0.55, 0, 0.3, 0.55, W, 0.55, body, { part: "cab" });
    c.decal("+y", 0.05, 0.28, 0.42, 0.52, "glass", { part: "window" }); c.decal("-y", 0.05, 0.28, 0.42, 0.52, "glass", { part: "window" });
    P.push(c);
    const ws = wedge(L - 0.55, 0, 0.85, 0.32, W, 0.4, "-x", "glass", { part: "windscreen" });
    P.push(ws);
    return { L, W, H: 1.25, prims: P };
  } });
  kind("forklift", { tok: "accent4", build(o) {
    const P = [], t = T0(o, "accent4");
    const ch = box(0.1, 0.08, 0.12, 1.0, 0.64, 0.2, "line", { part: "chassis" });
    wheels(ch, "+y", [0.25, 0.85], 0.15, 0.0); wheels(ch, "-y", [0.25, 0.85], 0.15, 0.0);
    P.push(ch);
    P.push(box(0.0, 0.05, 0.3, 0.28, 0.7, 0.42, "line", { part: "counterweight" }));
    P.push(box(0.28, 0.05, 0.3, 0.72, 0.7, 0.3, t, { part: "body" }));
    P.push(box(0.36, 0.22, 0.6, 0.3, 0.36, 0.22, "line", { part: "seat" }));
    for (const [x, y] of [[0.3, 0.07], [0.3, 0.69], [0.92, 0.07], [0.92, 0.69]]) P.push(box(x, y, 0.6, 0.05, 0.05, 0.75, "line", { part: "guard" }));
    P.push(box(0.3, 0.07, 1.35, 0.67, 0.67, 0.05, t, { part: "guard" }));
    P.push(box(1.02, 0.12, 0.12, 0.07, 0.07, 1.55, "steel", { part: "mast" }));
    P.push(box(1.02, 0.61, 0.12, 0.07, 0.07, 1.55, "steel", { part: "mast" }));
    P.push(box(1.02, 0.12, 1.55, 0.07, 0.56, 0.08, "steel", { part: "mast" }));
    const fz = o.lift || 0.1;
    P.push(box(1.09, 0.18, fz, 0.6, 0.1, 0.05, "line", { part: "forks" }));
    P.push(box(1.09, 0.52, fz, 0.6, 0.1, 0.05, "line", { part: "forks" }));
    if (o.load) {
      P.push(box(1.12, 0.1, fz + 0.05, 0.6, 0.6, 0.1, "wood", { part: "load" }));
      const c = box(1.15, 0.13, fz + 0.15, 0.54, 0.54, 0.42, o.load === true ? "soil" : o.load, { part: "load" });
      c.decal("+z", 0.22, 0, 0.32, 0.54, "wood", { part: "tape" });
      P.push(c);
    }
    return { L: 1.72, W: 0.8, H: 1.6, prims: P };
  } });
  kind("container", { tok: "accent3", build(o) {
    const L = o.l || 3.0, W = o.w || 1.1, H = o.h || 1.15, t = T0(o, "accent3"), P = [];
    const b = box(0, 0, 0, L, W, H, t);
    for (let a = 0.12; a < L - 0.05; a += 0.2) { b.decal("+y", a, 0.06, a + 0.06, H - 0.06, t, { part: "ribs", rib: true }); b.decal("-y", a, 0.06, a + 0.06, H - 0.06, t, { part: "ribs", rib: true }); }
    b.decal("+x", 0.06, 0.06, W / 2 - 0.02, H - 0.06, t, { part: "doors", rib: true });
    b.decal("+x", W / 2 + 0.02, 0.06, W - 0.06, H - 0.06, t, { part: "doors", rib: true });
    for (const a of [0.2, 0.42, W - 0.42, W - 0.2]) b.decal("+x", a, 0.12, a + 0.03, H - 0.12, "line", { part: "bars", layer: 1 });
    P.push(b);
    return { L, W, H, prims: P };
  } });
  kind("conveyor", { tok: "steel", build(o) {
    const L = o.l || 3.0, W = o.w || 0.7, z = o.hz || 0.55, P = [];
    for (let x = 0.2; x < L; x += Math.max(0.9, L / 3)) { P.push(box(x, 0.08, 0, 0.08, 0.08, z, "steel", { part: "legs" })); P.push(box(x, W - 0.16, 0, 0.08, 0.08, z, "steel", { part: "legs" })); }
    const fr = box(0, 0, z, L, W, 0.12, T0(o, "steel"), { part: "frame" });
    P.push(fr);
    const belt = box(0.04, 0.06, z + 0.12, L - 0.08, W - 0.12, 0.02, o.belt || "road", { part: "belt" });
    for (let x = 0.2; x < L - 0.1; x += 0.3) belt.decal("+z", x, 0.02, x + 0.03, W - 0.14, "line", { part: "rollers" });
    P.push(belt);
    return { L, W, H: z + 0.14, prims: P };
  } });
  kind("shelf", { tok: "accent2", build(o) {
    // pallet racking: uprights, beams at each level, decks between the beams (no two boxes intersect, so the painter's
    // order is exact), a pallet with a taped load in each bay
    const L = o.l || 3.0, d = o.d || 1.0, h = o.h || 2.4, lv = o.levels || 3, up = T0(o, "accent2"), beam = o.beam || "accent4", P = [];
    const bays = Math.max(1, Math.round(L / 1.5)), bw = L / bays, lh = h / lv, t = 0.08;
    for (let i = 0; i <= bays; i++) for (const y of [0, d - t]) P.push(box(i * bw - (i === bays ? t : 0) + (i === bays ? 0 : 0), y, 0, t, t, h, up, { part: "upright" }));
    for (let k = 1; k <= lv; k++) for (let i = 0; i < bays; i++) {
      const x0 = i * bw + (i === 0 ? t : t), x1 = (i + 1) * bw - (i === bays - 1 ? t : 0), zt = k * lh - 0.06;
      for (const y of [0, d - t]) P.push(box(x0, y, zt - 0.1, x1 - x0, t, 0.1, beam, { part: "beam" }));
      if (k < lv || o.top !== false) P.push(box(x0, t, zt - 0.04, x1 - x0, d - 2 * t, 0.04, "steel", { part: "deck" }));
    }
    if (o.full !== false) for (let k = 0; k < lv; k++) for (let i = 0; i < bays; i++) {
      if (o.stock && !o.stock(k, i)) continue;
      const z0 = k === 0 ? 0 : k * lh - 0.06, x0 = i * bw + 0.2, w = bw - 0.32;
      P.push(box(x0, 0.14, z0, w, d - 0.28, 0.1, "wood", { part: "pallet" }));
      const c = box(x0 + 0.04, 0.18, z0 + 0.1, w - 0.08, d - 0.36, Math.min(lh - 0.42, 0.6), o.goods || "soil", { part: "goods" });
      c.decal("+z", (w - 0.08) * 0.45, 0, (w - 0.08) * 0.55, d - 0.36, "wood", { part: "tape" });
      P.push(c);
    }
    return { L, W: d, H: h, prims: P };
  } });
  kind("crate", { tok: "soil", build(o) {
    const s = o.s || 0.5, h = o.h || s * 0.85, t = T0(o, "soil");
    const b = box(0, 0, 0, s, s, h, t);
    b.decal("+z", s * 0.42, 0, s * 0.58, s, "wood", { part: "tape" });
    b.decal("+y", s * 0.42, h * 0.7, s * 0.58, h, "wood", { part: "tape" });
    return { L: s, W: s, H: h, prims: [b] };
  } });
  kind("pallet", { tok: "wood", build(o) {
    const w = o.w || 1.0, d = o.d || 1.0, t = T0(o, "wood"), P = [];
    for (const y of [0, d / 2 - 0.06, d - 0.12]) P.push(box(0, y, 0, w, 0.12, 0.08, t, { part: "runner" }));
    const tp = box(0, 0, 0.08, w, d, 0.04, t, { part: "deck" });
    for (let x = 0.18; x < w - 0.05; x += 0.2) tp.decal("+z", x, 0, x + 0.025, d, "soil", { part: "gaps" });
    P.push(tp);
    return { L: w, W: d, H: 0.12, prims: P };
  } });

  // ---- outdoors
  const SPHERE = (rr) => (g, x, y, k, T) => {             // a round crown: base, a darker crescent on the right, a light top
    const r = rr * k;
    svg("circle", { cx: f1(x), cy: f1(y), r: f1(r), fill: T.left }, g);
    const a0 = -1.15, a1 = 2.3, p0 = [x + Math.cos(a0) * r, y + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, y + Math.sin(a1) * r];
    svg("path", { d: `M${f1(p0[0])},${f1(p0[1])} A${f1(r)},${f1(r)} 0 0 1 ${f1(p1[0])},${f1(p1[1])} A${f1(r * 1.25)},${f1(r * 1.25)} 0 0 0 ${f1(p0[0])},${f1(p0[1])} Z`, fill: T.right }, g);
    svg("ellipse", { cx: f1(x - r * 0.28), cy: f1(y - r * 0.4), rx: f1(r * 0.38), ry: f1(r * 0.22), fill: T.top }, g);
  };
  kind("tree", { tok: "leaf", build(o) {
    const s = o.s || 1, P = [];
    P.push(cyl(0.35 * s, 0.35 * s, 0, 0.07 * s, 0.55 * s, o.trunk || "soil", { part: "trunk" }));
    if (o.shape === "pine") {
      const tk = T0(o, "leaf");
      P.push(bill(0.35 * s, 0.35 * s, 0.4 * s, 1.1 * s, (g, x, y, k, T) => {
        const h = 1.1 * k * s, w = 0.42 * k * s;
        svg("polygon", { points: ptsStr([[x, y - h], [x - w, y], [x, y]]), fill: T.left }, g);
        svg("polygon", { points: ptsStr([[x, y - h], [x, y], [x + w, y]]), fill: T.right }, g);
      }, tk, { part: "crown", r: 0.42 * s }));
    } else P.push(bill(0.35 * s, 0.35 * s, 0.5 * s, 0.9 * s, SPHERE(0.46 * s), T0(o, "leaf"), { part: "crown", r: 0.46 * s, centreZ: true }));
    return { L: 0.7 * s, W: 0.7 * s, H: 1.45 * s, prims: P };
  } });
  // a road: a flat dark strip with a dashed centre line; `len` along its direction
  kind("road", { tok: "road", ground: true, build(o) {
    const L = o.len || 4, W = o.w || 1.2, t = T0(o, "road");
    const r = box(0, 0, 0, L, W, 0.03, t);
    if (o.marks !== false) for (let x = 0.2; x < L - 0.3; x += 0.7) r.decal("+z", x, W / 2 - 0.04, x + 0.38, W / 2 + 0.04, "surface", { part: "marks" });
    return { L, W, H: 0.03, prims: [r] };
  } });
  // a screen: a wall display, a monitor or a kiosk whose face shows content (bars, a line chart, rows), never words (a pin
  // names it). The display is on the left front face (+y); dir "-y" turns it to the right front face. panels: [{show:
  // "bars" | "line" | "rows", values, tok, hi (an index), hiTok}] side by side; legs: a stand's height (0: it stands on, or
  // hangs from, what is under it); screen: the face's token (light "surface" by default), ink: the content's token
  const SCREEN_PANELS = [{ show: "bars", values: [5, 8, 6, 9, 7] }, { show: "line", values: [3, 4, 3.5, 5, 4.4, 6, 6.8] }, { show: "rows", values: [0.85, 0.55, 0.7, 0.4] }];
  kind("screen", { tok: "line", build(o) {
    const w = o.w || 3, h = o.h || 1.4, d = o.d || 0.12, legs = o.legs || 0, bz = Math.min(0.08, h * 0.08), P = [];
    const D = legs > 0 ? Math.max(d, 0.5) : d, y0 = (D - d) / 2, tok = T0(o, "line"), ink = o.ink || "accent2";
    if (legs > 0) for (const x of [w * 0.18, w * 0.82 - 0.08]) {
      P.push(box(x - 0.06, 0, 0, 0.2, D, 0.05, tok, { part: "stand" }));
      P.push(box(x, y0 + d / 2 - 0.04, 0.05, 0.08, 0.08, legs - 0.05, tok, { part: "stand" }));
    }
    const fr = box(0, y0, legs, w, d, h, tok, { part: "frame" });
    fr.decal("+y", bz, bz, w - bz, h - bz, o.screen || "surface", { flat: true, part: "screen" });
    const panels = o.panels || SCREEN_PANELS, n = panels.length, pad = 0.1, gap = 0.12;
    const A0 = bz + pad, A1 = w - bz - pad, B0 = bz + pad, B1 = h - bz - pad, pw = (A1 - A0 - gap * Math.max(0, n - 1)) / Math.max(1, n);
    panels.forEach((pn, k) => {
      const a0 = A0 + k * (pw + gap), a1 = a0 + pw, b0 = B0, b1 = B1, ph = b1 - b0, vs = pn.values || [], pt = pn.tok || ink;
      const at = (i) => (i === pn.hi ? (pn.hiTok || "neg") : pt);
      fr.decal("+y", a0, b0, a1, b1, "field", { flat: true, part: "panel", layer: 1 });
      const ia0 = a0 + 0.07, ia1 = a1 - 0.07, ib0 = b0 + 0.08, ib1 = b1 - 0.08, iw = ia1 - ia0, ih = ib1 - ib0;
      if (pn.show === "bars" && vs.length) {
        const m = Math.max(...vs, 1e-9), slot = iw / vs.length, bw = slot * 0.62;
        fr.decal("+y", ia0, ib0 - 0.012, ia1, ib0, "steel", { flat: true, part: "axis", layer: 2 });
        vs.forEach((v, i) => fr.decal("+y", ia0 + i * slot + (slot - bw) / 2, ib0, ia0 + i * slot + (slot + bw) / 2, ib0 + Math.max(0.02, ih * v / m), at(i), { flat: true, part: "bars", layer: 3 }));
      } else if (pn.show === "line" && vs.length > 1) {
        const lo = Math.min(...vs), hi = Math.max(...vs), sp = hi - lo || 1, th = 0.04;
        const pts = vs.map((v, i) => [ia0 + iw * i / (vs.length - 1), ib0 + ih * (0.08 + 0.84 * (v - lo) / sp)]);
        fr.decal("+y", [[ia0, ib0]].concat(pts, [[ia1, ib0]]), 0, 0, 0, pt, { flat: true, pale: 0.78, part: "area", layer: 2 });
        for (let i = 1; i < pts.length; i++) { const [p, q] = [pts[i - 1], pts[i]]; fr.decal("+y", [[p[0], p[1] - th], [q[0], q[1] - th], [q[0], q[1] + th], [p[0], p[1] + th]], 0, 0, 0, pt, { flat: true, part: "line", layer: 3 }); }
        const e = pts[pts.length - 1];
        fr.ellipse("+y", e[0], e[1], 0.055, 0.055, pn.hi != null ? at(pn.hi) : pt, { flat: true, part: "line", layer: 4 });
      } else if (pn.show === "rows" && vs.length) {
        const rh = ih / vs.length, rt = pn.tok || "steel";
        vs.forEach((v, i) => {
          const bt = ib1 - i * rh, bb = bt - rh * 0.5, c = i === pn.hi ? (pn.hiTok || "neg") : rt;
          fr.decal("+y", ia0, bb, ia0 + rh * 0.5, bt, i === pn.hi ? c : (pn.dot || ink), { flat: true, part: "rows", layer: 2 });
          fr.decal("+y", ia0 + rh * 0.8, bb, ia0 + rh * 0.8 + Math.max(0.04, (iw - rh * 0.8) * clamp(v, 0, 1)), bt, c, { flat: true, part: "rows", layer: 2 });
        });
      }
    });
    P.push(fr);
    return { L: w, W: D, H: legs + h, prims: P };
  } });
  // an Isotype person: a flat pictogram standing on the board (no face; a real character comes from a designed kit)
  const PERSON = (g, x, y, k, T, o) => {
    const h = 0.86 * k * (o.s || 1), c = T.base, legSwap = o.step ? 1 : 0;
    svg("circle", { cx: f1(x), cy: f1(y - h * 0.86), r: f1(h * 0.115), fill: c }, g);
    svg("path", { d: `M${f1(x - h * 0.16)},${f1(y - h * 0.4)} L${f1(x - h * 0.16)},${f1(y - h * 0.62)} Q${f1(x - h * 0.16)},${f1(y - h * 0.72)} ${f1(x - h * 0.06)},${f1(y - h * 0.72)} L${f1(x + h * 0.06)},${f1(y - h * 0.72)} Q${f1(x + h * 0.16)},${f1(y - h * 0.72)} ${f1(x + h * 0.16)},${f1(y - h * 0.62)} L${f1(x + h * 0.16)},${f1(y - h * 0.4)} Z`, fill: c }, g);
    const lw = h * 0.12, ly = y - h * 0.4;
    svg("rect", { x: f1(x - h * 0.15), y: f1(ly), width: f1(lw), height: f1(h * (legSwap ? 0.36 : 0.4)), rx: f1(lw * 0.3), fill: c }, g);
    svg("rect", { x: f1(x + h * 0.03), y: f1(ly), width: f1(lw), height: f1(h * (legSwap ? 0.4 : 0.36)), rx: f1(lw * 0.3), fill: S().mix(c, S().c("shadow"), 0.18) }, g);
  };
  kind("person", { tok: "accent2", build(o) {
    return { L: 0.4, W: 0.4, H: 0.9 * (o.s || 1), prims: [bill(0.2, 0.2, 0, 0.9 * (o.s || 1), (g, x, y, k, T) => PERSON(g, x, y, k, T, o), T0(o, "accent2"), { part: "body", person: true })] };
  } });

  // ================================================================ placing a kind: rotate, centre, transform
  function rot2(k, L, W) {
    return [(u, v) => [u, v], (u, v) => [W - v, u], (u, v) => [L - u, W - v], (u, v) => [v, L - u]][k];
  }
  const rotV = (k) => [(a, b) => [a, b], (a, b) => [-b, a], (a, b) => [-a, -b], (a, b) => [b, -a]][k];
  /** build a kind facing `dir`, centred on its footprint: {prims, Lx, Ly, H, aabb} in world units around (0, 0, 0) */
  function buildKind(kname, o, dirK) {
    const def = KINDS[kname];
    if (!def) throw new Error(`isometric engine: no object kind "${kname}" (have: ${Object.keys(KINDS).join(", ")})`);
    const sub = (k2, q, part) => {                     // a kind inside another (rooms of a building): placed at q.x, q.y
      const r2 = buildKind(k2, q, DIRS[q.dir || "+x"]);
      const cx = (q.x || 0) + r2.Lx / 2, cy = (q.y || 0) + r2.Ly / 2, cz = q.z || 0;
      return r2.prims.map((p) => movePrim(p, [cx, cy, cz], part));
    };
    const R = def.build(o, sub);
    const L = R.L, W = R.W, f = rot2(dirK, L, W), fv = rotV(dirK);
    const Lx = dirK % 2 ? W : L, Ly = dirK % 2 ? L : W;
    const P = (p) => { const [x, y] = f(p[0], p[1]); return [x - Lx / 2, y - Ly / 2, p[2]]; };
    const N = (n) => { const [a, b] = fv(n[0], n[1]); return [a, b, n[2]]; };
    const prims = R.prims.map((pr) => {
      const q = Object.assign({}, pr);
      if (pr.type === "poly") q.faces = pr.faces.map((fc) => Object.assign({}, fc, { pts: fc.pts.map(P), n: N(fc.n) }));
      else if (pr.type === "cyl" || pr.type === "bill") { const [x, y] = f(pr.type === "cyl" ? pr.cx : pr.x, pr.type === "cyl" ? pr.cy : pr.y); if (pr.type === "cyl") { q.cx = x - Lx / 2; q.cy = y - Ly / 2; } else { q.x = x - Lx / 2; q.y = y - Ly / 2; } }
      else if (pr.type === "ink") q.pts = pr.pts.map(P);
      if (pr.out) q.out = N(pr.out);
      q.aabb = primBox(q);
      return q;
    });
    return { prims, Lx, Ly, H: R.H, ground: !!def.ground };
  }
  function movePrim(pr, d, part) {
    const q = Object.assign({}, pr);
    const mv = (p) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
    if (pr.type === "poly") q.faces = pr.faces.map((fc) => Object.assign({}, fc, { pts: fc.pts.map(mv), part: part || fc.part }));
    else if (pr.type === "cyl") { q.cx += d[0]; q.cy += d[1]; q.z += d[2]; }
    else if (pr.type === "bill") { q.x += d[0]; q.y += d[1]; q.z += d[2]; }
    else if (pr.type === "ink") q.pts = pr.pts.map(mv);
    if (part) { q.part = part; q.skin = false; }
    q.aabb = primBox(q);
    return q;
  }
  function primBox(p) {
    if (p.type === "poly") return aabbOf([].concat(...p.faces.filter((f) => f.kind !== "decal").map((f) => f.pts)).concat(p.faces.length && p.faces.every((f) => f.kind === "decal") ? [].concat(...p.faces.map((f) => f.pts)) : []));
    if (p.type === "cyl") return [p.cx - p.r, p.cy - p.r, p.z, p.cx + p.r, p.cy + p.r, p.z + p.h];
    if (p.type === "bill") { const r = p.r || 0.18; return [p.x - r, p.y - r, p.z, p.x + r, p.y + r, p.z + p.h]; }
    if (p.type === "ink") return aabbOf(p.pts);
    return [0, 0, 0, 0, 0, 0];
  }

  // ================================================================ painter's order: topological, by box separation
  // Two boxes that overlap on screen are ordered by the axis that separates them (the viewer is at +x, +y, +z: the box
  // with the smaller coordinate on a separating axis is behind). Boxes that intersect fall back to their centre sums.
  const EPS = 1e-4;
  function behind(a, b) {
    if (a[3] <= b[0] + EPS) return true; if (b[3] <= a[0] + EPS) return false;
    if (a[4] <= b[1] + EPS) return true; if (b[4] <= a[1] + EPS) return false;
    if (a[5] <= b[2] + EPS) return true; if (b[5] <= a[2] + EPS) return false;
    return (a[0] + a[3] + a[1] + a[4] + a[2] + a[5]) < (b[0] + b[3] + b[1] + b[4] + b[2] + b[5]);
  }
  // the screen footprint of a box is a hexagon whose edges run along the three projected axes, so two hexagons overlap
  // exactly when their extents overlap on the three axes' normals: x - y, y - z and x - z (a separating-axis test). Only
  // boxes whose hexagons really overlap are ordered: a looser bounding-rectangle test orders pairs that cannot occlude,
  // and their contradictory answers made cycles that drew shelf parts over a roof (preview, 2026-10-16)
  const sbox = (b) => [b[0] - b[4], b[3] - b[1], b[1] - b[5], b[4] - b[2], b[0] - b[5], b[3] - b[2]];
  const sover = (p, q) => p[0] < q[1] - EPS && q[0] < p[1] - EPS && p[2] < q[3] - EPS && q[2] < p[3] - EPS && p[4] < q[5] - EPS && q[4] < p[5] - EPS;
  /** pairs drawn in the wrong order: a later item that the separating axis puts behind an earlier one it overlaps */
  function misordered(ord, boxOf) {
    const out = [], Bx = ord.map(boxOf), SB = Bx.map(sbox);
    for (let i = 0; i < ord.length; i++) for (let j = i + 1; j < ord.length; j++) {
      if (sover(SB[i], SB[j]) && behind(Bx[j], Bx[i]) && !behind(Bx[i], Bx[j])) out.push([ord[j].part || ord[j].id, ord[i].part || ord[i].id]);
    }
    return out;
  }
  function topo(list, boxOf, must) {
    const n = list.length, B_ = list.map(boxOf), SB = B_.map(sbox), indeg = new Array(n).fill(0), out = list.map(() => []);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const fi = must && must(list[i], list[j], B_[i], B_[j]), fj = !fi && must && must(list[j], list[i], B_[j], B_[i]);
      if (!fi && !fj && !sover(SB[i], SB[j])) continue;
      if (fi || (!fj && behind(B_[i], B_[j]))) { out[i].push(j); indeg[j]++; } else { out[j].push(i); indeg[i]++; }
    }
    const key = (i) => B_[i][0] + B_[i][3] + B_[i][1] + B_[i][4] + (B_[i][2] + B_[i][5]) * 0.5 + i * 1e-7;
    const ready = [], done = new Array(n).fill(false), order = [];
    for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
    while (order.length < n) {
      if (!ready.length) {                             // a cycle (intersecting boxes): take the farthest one left
        let best = -1;
        for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || key(i) < key(best))) best = i;
        ready.push(best); indeg[best] = 0;
      }
      ready.sort((a, b) => key(a) - key(b));
      const i = ready.shift();
      if (done[i]) continue;
      done[i] = true; order.push(i);
      for (const j of out[i]) if (!done[j] && --indeg[j] === 0) ready.push(j);
    }
    return order.map((i) => list[i]);
  }

  // ================================================================ Isotype pictograms (flat, never in perspective)
  // drawn in a 100 x 100 box centred on (0, 0); one colour, holes in `hole` (the card's ground)
  const PICTO = {
    person(g, c, h) { svg("circle", { cx: 0, cy: -32, r: 12, fill: c }, g); svg("path", { d: "M-17,-14 Q-17,-19 -12,-19 L12,-19 Q17,-19 17,-14 L17,14 L-17,14 Z", fill: c }, g); svg("rect", { x: -15, y: 12, width: 12, height: 34, rx: 3, fill: c }, g); svg("rect", { x: 3, y: 12, width: 12, height: 34, rx: 3, fill: c }, g); },
    truck(g, c, h) { svg("rect", { x: -46, y: -26, width: 58, height: 42, rx: 3, fill: c }, g); svg("path", { d: "M15,-12 L33,-12 L46,4 L46,16 L15,16 Z", fill: c }, g); svg("path", { d: "M20,-7 L31,-7 L39,3 L20,3 Z", fill: h }, g); for (const x of [-32, -10, 31]) { svg("circle", { cx: x, cy: 20, r: 9, fill: c }, g); svg("circle", { cx: x, cy: 20, r: 3.5, fill: h }, g); } },
    box(g, c, h) { svg("rect", { x: -32, y: -30, width: 64, height: 60, rx: 4, fill: c }, g); svg("rect", { x: -5, y: -30, width: 10, height: 26, fill: h }, g); },
    building(g, c, h) { svg("rect", { x: -28, y: -44, width: 56, height: 88, rx: 3, fill: c }, g); for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) svg("rect", { x: -20 + k * 15, y: -36 + r * 17, width: 9, height: 10, fill: h }, g); svg("rect", { x: -7, y: 30, width: 14, height: 14, fill: h }, g); },
    server(g, c, h) { for (let r = 0; r < 3; r++) { svg("rect", { x: -36, y: -40 + r * 28, width: 72, height: 22, rx: 4, fill: c }, g); svg("circle", { cx: 24, cy: -29 + r * 28, r: 3.5, fill: h }, g); svg("rect", { x: -28, y: -31 + r * 28, width: 26, height: 4, fill: h }, g); } },
    doc(g, c, h) { svg("path", { d: "M-28,-42 L14,-42 L30,-26 L30,42 L-28,42 Z", fill: c }, g); svg("path", { d: "M14,-42 L14,-26 L30,-26", fill: h }, g); for (let r = 0; r < 4; r++) svg("rect", { x: -18, y: -16 + r * 13, width: r === 3 ? 22 : 36, height: 5, fill: h }, g); },
    coin(g, c, h) { svg("circle", { cx: 0, cy: 0, r: 36, fill: c }, g); svg("circle", { cx: 0, cy: 0, r: 24, fill: "none", stroke: h, "stroke-width": 5 }, g); },
    tree(g, c, h) { svg("circle", { cx: 0, cy: -14, r: 30, fill: c }, g); svg("rect", { x: -6, y: 10, width: 12, height: 34, fill: c }, g); },
    cloud(g, c, h) { svg("circle", { cx: -16, cy: 4, r: 20, fill: c }, g); svg("circle", { cx: 10, cy: -8, r: 26, fill: c }, g); svg("circle", { cx: 30, cy: 10, r: 16, fill: c }, g); svg("rect", { x: -36, y: 4, width: 82, height: 22, rx: 11, fill: c }, g); },
    phone(g, c, h) { svg("rect", { x: -20, y: -40, width: 40, height: 80, rx: 8, fill: c }, g); svg("rect", { x: -14, y: -32, width: 28, height: 60, rx: 2, fill: h }, g); },
    car(g, c, h) { svg("path", { d: "M-44,14 L-44,-2 Q-44,-8 -38,-9 L-24,-11 L-12,-26 L18,-26 L32,-11 L40,-9 Q46,-8 46,-2 L46,14 Z", fill: c }, g); svg("path", { d: "M-8,-21 L15,-21 L25,-11 L-17,-11 Z", fill: h }, g); for (const x of [-26, 28]) { svg("circle", { cx: x, cy: 16, r: 10, fill: c }, g); svg("circle", { cx: x, cy: 16, r: 4, fill: h }, g); } },
    order(g, c, h) { svg("rect", { x: -32, y: -38, width: 64, height: 76, rx: 6, fill: c }, g); svg("path", { d: "M-16,0 L-4,12 L18,-14", fill: "none", stroke: h, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, g); },
    // a request (a call, a message, a packet of data): a rounded packet with an arrow through it
    request(g, c, h) { svg("rect", { x: -40, y: -26, width: 80, height: 52, rx: 10, fill: c }, g); svg("path", { d: "M-22,0 L16,0 M4,-12 L18,0 L4,12", fill: "none", stroke: h, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, g); },
  };
  // the pictogram for the noun being counted ("requests", "orders", "people"): a tally picks its icon from its label
  // when it is not given, and names an icon that does not match the noun (iso_tally_icon)
  const NOUN_ICON = [[/\b(request|call|query|queries|message|packet|api)/i, "request"], [/\b(order|purchase|sale|ticket|case)/i, "order"],
    [/\b(people|person|staff|employee|worker|user|customer|visitor|patient|team|member|hire|candidate)/i, "person"],
    [/\b(parcel|package|box|crate|carton|item|unit|goods|pallet)/i, "box"], [/\b(truck|deliver|lorr|shipment)/i, "truck"],
    [/\b(server|rack|machine|node)/i, "server"], [/\b(document|file|form|report|invoice|contract|page)/i, "doc"],
    [/\b(dollar|euro|pound|coin|cost|revenue|spend|budget)/i, "coin"], [/\b(building|site|office|store|shop|branch)/i, "building"],
    [/\b(phone|device|app)/i, "phone"], [/\b(car|vehicle)/i, "car"], [/\b(tree|forest)/i, "tree"], [/\b(cloud|region)/i, "cloud"]];
  const iconForNoun = (words) => { for (const [re, k] of NOUN_ICON) if (re.test(String(words || ""))) return k; return null; };

  // ================================================================ the board: one scheduler per diorama
  const BOARDS = [];
  const NOBODY = {};                                    // a pin on a point is context while anything is in focus
  function board(ctx, opts) {
    opts = opts || {};
    // a later beat resumes a board an earlier beat made: W.board(ctx, {hold: "site"})
    if (opts.hold) {
      const E0 = ctx.held ? ctx.held(opts.hold) : null;
      const B0 = E0 && E0.__isoBoard;
      if (!B0) throw new Error(`${ctx.beat.id}: W.board({hold: "${opts.hold}"}) found no board named ${opts.hold} in the previous beat`);
      B0.ctx = ctx;
      return B0;
    }
    const name = opts.name || "board";
    const B = { ctx, name, items: [], segs: [], pins: [], routes: [], flows: [], rings: [], insets: [], lives: [], moves: [], focusEv: [], legendMap: {}, n: 0, dirty: true };
    const beatId = () => (B.ctx && B.ctx.beat ? B.ctx.beat.id : null);
    const meta = (kind, nm, content) => ({ kind, beat: beatId(), name: nm || name, content: content !== false });
    B.meta = meta;
    const w = (opts.size || [12, 8])[0], d = (opts.size || [12, 8])[1], depth = opts.depth == null ? 0.55 : opts.depth;
    B.w = w; B.d = d; B.depth = depth;
    // the unit fits the board (and the tallest thing expected on it, `headroom`) inside the safe area unless given
    const head = opts.headroom == null ? 2 : opts.headroom;
    B.u = opts.unit || Math.floor(Math.min(1600 / ((w + d) * C30), 760 / ((w + d) / 2 + depth + head)));
    const centre = opts.centre || [960, 470];
    B.ox = centre[0] - (w / 2 - d / 2) * C30 * B.u;
    B.oy = centre[1] - ((w + d) / 4 - (head - depth) / 2) * B.u;
    B.P = (x, y, z) => [B.ox + (x - y) * C30 * B.u, B.oy + (x + y) * 0.5 * B.u - (z || 0) * B.u];
    // ---- the element and its layers: camera > world > (ground, ground items, decals, solids, air), then the overlay
    let E;
    if (opts.parent) E = { name, inner: opts.parent.inner || opts.parent, outer: null, mini: true };
    else E = ctx.el(name, Object.assign({ x: 0, y: 0, w: 1920, h: 1080, kind: "board", exit: opts.exit || "recede" }, opts.el || {}));
    E.__isoBoard = B;
    B.el = E;
    const host = opts.parent ? E.inner : svg("g", { class: "lm-iso-root" }, E.inner);
    B.root = host;
    B.camG = svg("g", { class: "lm-iso-cam" }, host);
    B.worldId = "lmiso" + (++UID) + "_" + String(name).replace(/[^\w-]/g, "");
    B.world = svg("g", { class: "lm-iso-world", id: B.worldId }, B.camG);
    B.Lground = svg("g", { class: "lm-iso-ground" }, B.world);
    B.LgroundItems = svg("g", { class: "lm-iso-ground-items" }, B.world);
    B.Ldecal = svg("g", { class: "lm-iso-decals" }, B.world);
    B.Lsolid = svg("g", { class: "lm-iso-solids" }, B.world);
    B.Lair = svg("g", { class: "lm-iso-air" }, B.world);
    B.overlay = svg("g", { class: "lm-iso-overlay" }, host);
    B.Linsets = svg("g", { class: "lm-iso-insets" }, B.overlay);   // under the pins: a pin's plate is never struck by an inset's leader
    B.Lpins = svg("g", { class: "lm-iso-pins" }, B.overlay);
    BOARDS.push(B);
    B.t0 = opts.at == null ? (ctx.speechStart || 0) : opts.at;
    B.topSafe = opts.topSafe;                            // pins fade above this line (a title band the board must not cover)
    const mark = (t) => { if (E.outer && (E.revealT == null || t < E.revealT)) { E.revealT = t; E.revealKind = "reveal"; } };
    B.mark = mark;

    // ---- the plinth: a floating board with strata on its front faces, a faint lattice on its top
    const strata = opts.strata || [{ tok: opts.ground || "surface2", h: 0.16 }, { tok: "steel", h: Math.max(0.1, depth - 0.16) }];
    B.strata = [];
    const shadowG = svg("g", { class: "lm-iso-board-shadow" }, B.Lground);
    if (opts.float !== false && !opts.parent && opts.plinth !== false) {
      for (let i = 0; i < 4; i++) {
        const g0 = 0.5 + i * 0.22, zb = -depth - 0.55;
        const pts = [B.P(-g0, -g0, zb), B.P(w + g0, -g0, zb), B.P(w + g0, d + g0, zb), B.P(-g0, d + g0, zb)];
        svg("polygon", { points: ptsStr(pts), fill: S().c("shadow"), opacity: 0.035 }, shadowG);
      }
    }
    const plinth = svg("g", { class: "lm-iso-plinth" }, B.Lground);
    let ztop = 0;
    if (opts.plinth !== false) {
      for (const st of strata) {
        const z1 = ztop, z0 = ztop - (st.h || 0.2), T = tones(st.tok || "surface2");
        const right = [B.P(w, 0, z0), B.P(w, d, z0), B.P(w, d, z1), B.P(w, 0, z1)], left = [B.P(0, d, z0), B.P(w, d, z0), B.P(w, d, z1), B.P(0, d, z1)];
        svg("polygon", { points: ptsStr(right), fill: T.right, stroke: T.right, "stroke-width": 0.6 }, plinth);
        svg("polygon", { points: ptsStr(left), fill: T.left, stroke: T.left, "stroke-width": 0.6 }, plinth);
        B.strata.push({ tok: st.tok, z0, z1, label: st.label });
        ztop = z0;
      }
      const top = tones(strata[0].tok || "surface2");
      svg("polygon", { points: ptsStr([B.P(0, 0, 0), B.P(w, 0, 0), B.P(w, d, 0), B.P(0, d, 0)]), fill: top.top, stroke: top.top, "stroke-width": 0.6 }, plinth);
      // the lattice: dots on whole units (lines when the board is large), quiet
      const lat = opts.lattice || "dots", lg = svg("g", { class: "lm-iso-lattice", opacity: 0.5 }, plinth);
      const col = S().mix(top.top, S().c("muted"), 0.45);
      if (lat === "dots" && (w + 1) * (d + 1) <= 900) {
        for (let i = 1; i < w; i++) for (let j = 1; j < d; j++) { const [x, y] = B.P(i, j, 0); svg("circle", { cx: f1(x), cy: f1(y), r: 1.9, fill: col }, lg); }
      } else if (lat !== "none") {
        for (let i = 1; i < w; i++) svg("line", { x1: f1(B.P(i, 0, 0)[0]), y1: f1(B.P(i, 0, 0)[1]), x2: f1(B.P(i, d, 0)[0]), y2: f1(B.P(i, d, 0)[1]), stroke: col, "stroke-width": 1 }, lg);
        for (let j = 1; j < d; j++) svg("line", { x1: f1(B.P(0, j, 0)[0]), y1: f1(B.P(0, j, 0)[1]), x2: f1(B.P(w, j, 0)[0]), y2: f1(B.P(w, j, 0)[1]), stroke: col, "stroke-width": 1 }, lg);
      }
    }
    // the board arrives by motion: it slides up a little into place (no alpha fade on solids: a 1-frame show, then the move)
    if (!opts.parent) {
      const dy = opts.enter === "none" ? 0 : 40, t0 = B.t0;
      Loom.drive((e, p) => {
        host.setAttribute("opacity", p > 0 || opts.enter === "none" ? 1 : 0);
        host.setAttribute("transform", `translate(0 ${f1(dy * (1 - e))})`);
      }, t0, opts.enter === "none" ? 0.01 : 0.7, E_().enter, { kind: "reveal", beat: beatId(), name, content: true, key: "isoboard:" + B.worldId });
      mark(t0);
    }

    // ================================================================ camera (a pure function of time)
    const home = { cx: 960, cy: 540, k: 1 };
    B.cams = [];
    function camAt(t) {
      let c = home;
      for (const m of B.cams) {
        if (t < m.t0) break;
        if (t >= m.t1) { c = m.to; continue; }
        return m.at((t - m.t0) / (m.t1 - m.t0));
      }
      return c;
    }
    B.camAt = camAt;
    const toScreen = (bx, by, c) => [960 + c.k * (bx - c.cx), 540 + c.k * (by - c.cy)];
    B.toScreen = toScreen;
    /** the screen point of a world point at time t (the camera's state then) */
    B.screen = (p, t) => { const q = B.P(p[0], p[1], p[2] || 0); return toScreen(q[0], q[1], camAt(t == null ? B.t0 : t)); };
    function pathFn(a, b, mode, ease) {
      const k0 = Math.log(a.k), k1 = Math.log(b.k), dk = Math.abs(k1 - k0);
      if (mode === "fly") {
        // van Wijk and Nuij (2003): the optimal pan-and-zoom path; w is the visible width in board px
        const rho = 1.42, w0 = 1920 / a.k, w1 = 1920 / b.k, ux = b.cx - a.cx, uy = b.cy - a.cy, u1 = Math.hypot(ux, uy);
        if (u1 < 1) return (p) => { const e = ease(p); return { cx: a.cx, cy: a.cy, k: Math.exp(lerp(k0, k1, e)) }; };
        const bb = (i) => { const wi = i ? w1 : w0; return (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho ** 4 * u1 * u1) / (2 * wi * rho * rho * u1); };
        const r = (bi) => Math.log(-bi + Math.sqrt(bi * bi + 1));
        const r0 = r(bb(0)), r1 = r(bb(1)), Stot = (r1 - r0) / rho;
        return (p) => {
          const s = ease(p) * Stot, wS = w0 * Math.cosh(r0) / Math.cosh(rho * s + r0);
          const uS = w0 / (rho * rho) * Math.cosh(r0) * Math.tanh(rho * s + r0) - w0 / (rho * rho) * Math.sinh(r0);
          const f = clamp(uS / u1, 0, 1);
          return { cx: a.cx + ux * f, cy: a.cy + uy * f, k: p >= 1 ? b.k : 1920 / wS };
        };
      }
      return (p) => {
        const e = ease(p), k = Math.exp(lerp(k0, k1, e));
        // the centre follows the visible width, so a zoom with a pan reads as one move (not a slide then a zoom)
        const f = dk > 0.05 ? (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k) : e;
        return { cx: lerp(a.cx, b.cx, f), cy: lerp(a.cy, b.cy, f), k };
      };
    }
    /** the board-px rectangle of a target: an item, a list, a world point, "all", or {x, y, w, h} in board px */
    function rectOf(target, t) {
      if (!target || target === "all") return B.extent(t == null ? 1e9 : t, true);
      if (target.x != null && target.w != null && !target.kind) return target;
      if (Array.isArray(target) && typeof target[0] === "number") { const q = B.P(target[0], target[1], target[2] || 0); return { x: q[0] - 1, y: q[1] - 1, w: 2, h: 2 }; }
      const list = [].concat(target);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const it of list) {
        const r = it.rect ? it.rect(t) : null; if (!r) continue;
        x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
      }
      return isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : B.extent(t, true);
    }
    /** move the camera at time t to frame `target` (fill the safe area with a margin, or at `zoom`); returns the end time.
     *  {dur, zoom, margin, fly, ease, dx, dy (screen nudge)}. The projection never changes: pan and zoom only. */
    B.camera = function (t, target, o) {
      o = o || {};
      const r = rectOf(target, t), m = o.margin == null ? 70 : o.margin;
      const from = camAt(t);
      let k = o.zoom || Math.min((1728 - 2 * m) / Math.max(1, r.w), (846 - 2 * m) / Math.max(1, r.h));
      k = clamp(k, o.min || 0.3, o.max || 4);
      // the safe area's centre is (960, 507): the bottom 150 px belong to the captions
      const to = { cx: r.x + r.w / 2 - (o.dx || 0) / k, cy: r.y + r.h / 2 + (33 - (o.dy || 0)) / k, k };
      // dur 0 (or under a frame) is a cut to the framing at t: `o.dur || ...` read 0 as "no dur" and flew 0.9 s, and a
      // 0.001 s move showed its start framing on the frame at t (st-iso-order b14: one frame of the whole board before
      // the dock, D-190). A cut is a zero-length move, complete from t on.
      const cut = o.dur != null && o.dur < 1 / 30;
      const dur = cut ? 0 : (o.dur || clamp(0.9 + 0.35 * Math.abs(Math.log(to.k / from.k)) + Math.hypot(to.cx - from.cx, to.cy - from.cy) / 1600, 0.9, 2.6));
      const last = B.cams[B.cams.length - 1];
      if (last && t < last.t1 - 1e-6) Loom.warn("iso_cam_overlap", `${beatId()}: camera move at ${t.toFixed(2)}s starts before the previous one ends (${last.t1.toFixed(2)}s); it starts then`, { beat: beatId() });
      const t0 = last ? Math.max(t, last.t1) : t, ease = Loom.ease[o.ease || "editorial"] || E_().editorial;
      const mv = { t0, t1: t0 + dur, from, to, at: pathFn(from, to, o.fly ? "fly" : "log", ease) };
      B.cams.push(mv);
      Loom.drive(SEEN, t0, dur, "linear", { kind: "camera", beat: beatId(), name: name + ".camera", content: false, key: "isocam:" + B.worldId });
      B.live = true;
      return t0 + dur;
    };
    /** the scale reveal: pull back until everything on the board (and its pins) is in the frame */
    B.reveal = (t, o) => B.camera(t, "all", Object.assign({ margin: 40 }, o || {}));
    /** the board-px rectangle of a world box [x0, y0, z0, x1, y1, z1] (a camera target for a place not built yet) */
    B.worldRect = function (b) {
      const xs = [], ys = [];
      for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) { const q = B.P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    };
    /** open close on the first thing and pull back as more arrive: steps [[t, item or list], ...]; at each t the camera
     *  frames everything named so far (never closer than `max`, default 1.8). An opening that is not mostly empty board */
    B.widen = function (steps, o) {
      o = o || {};
      const seen = [];
      let end = 0;
      steps.forEach(([t, its], i) => {
        seen.push(...[].concat(its).filter(Boolean));
        const next = steps[i + 1] ? steps[i + 1][0] : Infinity;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const el of seen) { const r = el.rect ? el.rect(t) : el; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
        end = B.camera(t, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, { margin: o.margin == null ? 120 : o.margin, max: o.max || 1.8, dur: i === 0 ? (o.first || 0.05) : Math.min(o.dur || 1.4, Math.max(0.4, (next - t) * 0.8)), dy: o.dy });
      });
      return end;
    };
    /** back to the opening view */
    B.home = (t, o) => B.camera(t, { x: 960 - 864, y: 540 - 33 - 423, w: 1728, h: 846 }, Object.assign({ zoom: 1 }, o || {}));

    // ================================================================ items
    /** put an object on the board: B.put(kind, {name, x, y, z, dir, tok, at, enter, subject, role, ...kind options}).
     *  x, y are its footprint's back corner in world units (or `route` to start on a route); returns the item */
    B.put = function (kname, o) {
      o = Object.assign({}, o || {});
      const def = KINDS[kname];
      if (!def) { Loom.error("iso_unknown_kind", `${beatId()}: no isometric object kind "${kname}" (have: ${Object.keys(KINDS).join(", ")})`, { beat: beatId() }); return null; }
      const id = o.name || `${name}_${kname}${++B.n}`;
      const dirK = DIRS[o.dir || "+x"] == null ? 0 : DIRS[o.dir || "+x"];
      const geo = buildKind(kname, o, dirK);
      const tok = o.tok || def.tok;
      const it = { B, id, kind: kname, o, tok, dirK, geo, subject: !!o.subject, role: o.role || null, moves: [], tints: [], variants: {}, cuts: [], parts: {} };
      let pos;
      if (o.route) { const s = o.route.pointAt(o.routeAt || 0); pos = [s.p[0], s.p[1], (o.z || 0) + (s.p[2] || 0)]; it.dirK = DIRS[s.dir]; it.geo = buildKind(kname, o, it.dirK); }
      else pos = [(o.x || 0) + geo.Lx / 2, (o.y || 0) + geo.Ly / 2, o.z || 0];
      it.home = pos;
      it.layer = geo.ground ? B.LgroundItems : B.Lsolid;
      it.g = svg("g", { class: "lm-iso-item", "data-kind": kname, "data-name": id }, it.layer);
      it.sh = svg("g", { class: "lm-iso-shadow" }, it.g);
      it.a = svg("g", { class: "lm-iso-a" }, it.g);
      it.faces = [];
      variant(it, it.dirK);
      place(it, pos);
      B.items.push(it);
      B.dirty = true;
      // meaning: one hue, one meaning; the subject hue is reserved
      if (tok && !NEUTRAL.has(tok) && S().pack.palette[tok] && !/^(concrete|steel|road|glass|leaf|water|soil|wood)$/.test(tok)) {
        if (o.role) {
          const prev = B.legendMap[tok];
          if (prev && prev !== o.role) Loom.warn("iso_hue_two_meanings", `${beatId()}: ${tok} means "${prev}" on board ${name} and now "${o.role}" (${id}): one hue, one meaning`, { beat: beatId() });
          else B.legendMap[tok] = o.role;
        }
        if (tok === "accent" && !o.subject && !o.context) Loom.warn("iso_subject_hue", `${beatId()}: ${id} is in the subject hue (accent) but is not the subject; give it subject: true or another hue`, { beat: beatId() });
      }
      it.rect = (t) => itemRect(it, t == null ? 1e9 : t);
      return it;
    };
    function variant(it, k) {
      if (it.variants[k]) return it.variants[k];
      const geo = k === it.dirK && it.geo ? it.geo : buildKind(it.kind, it.o, k);
      const vg = svg("g", { class: "lm-iso-v", "data-dir": k }, it.a);
      const shp = shadowPoly(geo);
      const shn = shp ? svg("polygon", { points: "", fill: S().c("shadow"), opacity: 0.12, "data-dir": k }, it.sh) : null;
      const V = { k, geo, g: vg, sh: shn, shp, nodes: [], groups: [] };
      const ord = topo(geo.prims, (p) => p.aabb);
      const bad = misordered(ord, (p) => p.aabb);
      if (bad.length) Loom.warn("iso_order", `${beatId()}: ${it.id} (${it.kind}) has ${bad.length} pair(s) of parts drawn in the wrong order (intersecting boxes: ${bad.slice(0, 2).map((q) => q.join(" over ")).join("; ")}); build kinds from boxes that touch, never cross`, { beat: beatId() });
      for (const pr of ord) drawPrim(it, V, pr);
      it.variants[k] = V;
      if (!it.cur) it.cur = V;
      else vg.setAttribute("display", "none"), shn && shn.setAttribute("display", "none");
      return V;
    }
    function shadowPoly(geo) {
      if (geo.ground) return null;
      const hx = geo.Lx / 2, hy = geo.Ly / 2, h = Math.min(geo.H, 3), sx = 0.42 * h, sy = -0.2 * h;
      const pts = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy], [-hx + sx, -hy + sy], [hx + sx, -hy + sy], [hx + sx, hy + sy], [-hx + sx, hy + sy]];
      // convex hull (monotone chain) of the footprint and the footprint pushed away from the light
      const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    // the screen points of a face, and each point's height (for the growth from the base)
    function drawPrim(it, V, pr) {
      const g = svg("g", { "data-part": pr.part || "body" }, V.g);
      V.groups.push({ g, pr });
      (it.parts[pr.part || "body"] = it.parts[pr.part || "body"] || []).push(g);
      if (pr.hidden) g.setAttribute("opacity", 0);
      if (pr.type === "poly") {
        for (const fc of pr.faces) {
          if (dot3(fc.n, VIEW) <= 1e-6) continue;
          const P2 = fc.pts.map((p) => B.P(p[0], p[1], p[2]));
          const col = faceColour(fc.tok, fc);
          const node = svg("polygon", { points: ptsStr(P2), fill: col, stroke: fc.kind === "decal" ? "none" : col, "stroke-width": fc.kind === "decal" ? 0 : 0.7, "stroke-linejoin": "round" }, g);
          if (fc.hidden) node.setAttribute("opacity", 0);
          const rec = { node, tok: fc.tok, fc, P2, zs: fc.pts.map((p) => p[2]), body: fc.tok === it.tok };
          V.nodes.push(rec);
          if (fc.hatch) {                                  // hatched cut rim: the fill in the cut tone, then 45 degree lines
            node.setAttribute("fill", tones(fc.tok).cut); node.setAttribute("stroke", "none");
            rec.cut = true;
            const hg = svg("g", { opacity: fc.hidden ? 0 : 1, "data-hatch": 1 }, g);
            hatchLines(hg, P2, 6);
            rec.hatch = hg;
          }
          if (fc.rim) (it.rims = it.rims || []).push(rec);
        }
      } else if (pr.type === "cyl") {
        const T = tones(pr.tok), n = 28, ring = (z, a0, a1, m) => { const o2 = []; for (let i = 0; i <= m; i++) { const a = lerp(a0, a1, i / m); o2.push([pr.cx + Math.cos(a) * pr.r, pr.cy + Math.sin(a) * pr.r, z]); } return o2; };
        const side = (a0, a1, col) => {
          const bot = ring(pr.z, a0, a1, 10), top = ring(pr.z + pr.h, a1, a0, 10), pts3 = bot.concat(top);
          const P2 = pts3.map((p) => B.P(p[0], p[1], p[2])), node = svg("polygon", { points: ptsStr(P2), fill: col, stroke: col, "stroke-width": 0.7 }, g);
          V.nodes.push({ node, tok: pr.tok, fc: { cylTone: col === T.right ? "right" : "left" }, P2, zs: pts3.map((p) => p[2]), body: pr.tok === it.tok });
        };
        side(-Math.PI / 4, Math.PI / 4, T.right);
        side(Math.PI / 4, Math.PI * 3 / 4, T.left);
        const topP = ring(pr.z + pr.h, 0, TAU, n), P2 = topP.map((p) => B.P(p[0], p[1], p[2]));
        const node = svg("polygon", { points: ptsStr(P2), fill: T.top, stroke: T.top, "stroke-width": 0.7 }, g);
        V.nodes.push({ node, tok: pr.tok, fc: { cylTone: "top" }, P2, zs: topP.map((p) => p[2]), body: pr.tok === it.tok });
      } else if (pr.type === "bill") {
        const [x, y] = B.P(pr.x, pr.y, pr.z + (pr.centreZ ? pr.h * 0.5 : 0));
        const bg = svg("g", { "data-bill": 1 }, g);
        pr.draw(bg, x, y, B.u, tones(pr.tok));
        V.nodes.push({ bill: bg, tok: pr.tok, base: B.P(pr.x, pr.y, pr.z), pr });
      } else if (pr.type === "ink") {
        const P2 = pr.pts.map((p) => B.P(p[0], p[1], p[2]));
        const node = svg("path", { d: dPath(P2), fill: "none", stroke: S().c(pr.tok || "line"), "stroke-width": pr.width || 2, "stroke-dasharray": pr.dash || null, "stroke-linecap": "round", opacity: pr.opacity == null ? 1 : pr.opacity }, g);
        V.nodes.push({ ink: node, P2, zs: pr.pts.map((p) => p[2]) });
      }
    }
    function hatchLines(g, P2, sp) {
      const ys = P2.map((p) => p[1] - p[0]), v0 = Math.min(...ys), v1 = Math.max(...ys);
      for (let v = v0 + sp / 2; v < v1; v += sp) {            // lines y - x = v (45 degrees), clipped to the convex polygon
        const xs = [];
        for (let i = 0; i < P2.length; i++) {
          const a = P2[i], b = P2[(i + 1) % P2.length], fa = a[1] - a[0] - v, fb = b[1] - b[0] - v;
          if (fa * fb < 0) { const u = fa / (fa - fb); xs.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); }
        }
        if (xs.length >= 2) { xs.sort((p, q) => p[0] - q[0]); svg("line", { x1: f1(xs[0][0]), y1: f1(xs[0][1]), x2: f1(xs[xs.length - 1][0]), y2: f1(xs[xs.length - 1][1]), stroke: S().c("line"), "stroke-width": 1.2, opacity: 0.55 }, g); }
      }
    }
    function faceColour(tok, fc) {
      const T = tones(tok);
      if (fc.flat) return fc.pale ? S().mix(T.base, S().c("surface"), fc.pale) : T.base;
      if (fc.cylTone) return T[fc.cylTone];
      if (fc.rib) return S().mix(toneFor(T, fc.n), S().c("shadow"), 0.1);
      return toneFor(T, fc.n);
    }
    function place(it, pos) {
      const q = B.P(pos[0], pos[1], pos[2]), q0 = B.P(0, 0, 0);
      it.g.setAttribute("transform", `translate(${f1(q[0] - q0[0])} ${f1(q[1] - q0[1])})`);
      it.pos = pos;
      // the cast shadow lies on what the item rests on, pushed away from the light by its height: its own base when it
      // sits low (a plate, a dock), else what stands under it (fitSupport: a roof, the ground)
      const support = it.cueSupport != null ? it.cueSupport : it.o.shadowZ != null ? it.o.shadowZ : ((it.o.z || 0) <= 0.6 ? (it.o.z || 0) : 0);
      const lift = pos[2] - support;
      for (const k in it.variants) {
        const V = it.variants[k]; if (!V.sh) continue;
        V.sh.setAttribute("points", ptsStr(V.shp.map((p) => B.P(p[0] + 0.42 * lift, p[1] - 0.2 * lift, -lift))));
        V.sh.setAttribute("opacity", it.cueOn ? 0 : 0.12);
      }
      cueDraw(it, lift);
    }
    // ---- the height cue of a floating item: a soft shadow straight under it on what it floats over, and a thin dashed
    // stem down to it (with a foot dot), so a cloud or a parcel in the air reads as above, not stuck to what is behind it
    function cueDraw(it, lift) {
      if (!it.cueOn) { if (it.cueG) it.cueG.setAttribute("display", "none"); return; }
      if (!it.cueG) {
        it.cueG = svg("g", { class: "lm-iso-cue" }, it.sh);
        const sc = S().c("shadow"), ln = S().c("line");
        it.cueN = {
          soft: svg("polygon", { points: "", fill: sc, opacity: 0.07 }, it.cueG),
          core: svg("polygon", { points: "", fill: sc, opacity: 0.12 }, it.cueG),
          stem: svg("path", { d: "", fill: "none", stroke: ln, "stroke-width": 1.8, "stroke-dasharray": "3 5", "stroke-linecap": "round", opacity: 0.6 }, it.cueG),
          foot: svg("polygon", { points: "", fill: ln, opacity: 0.6 }, it.cueG),
        };
      }
      it.cueG.setAttribute("display", "inline");
      const g = it.cur.geo, rx = g.Lx / 2, ry = g.Ly / 2;
      const ell = (ax, ay) => { const P = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; P.push(B.P(Math.cos(a) * ax, Math.sin(a) * ay, -lift)); } return P; };
      const k = clamp(1.8 / Math.max(lift, 0.1), 0.55, 1);    // higher up, a softer shadow
      it.cueN.soft.setAttribute("points", ptsStr(ell(rx * 0.95, ry * 0.95)));
      it.cueN.soft.setAttribute("opacity", (0.07 * k).toFixed(3));
      it.cueN.core.setAttribute("points", ptsStr(ell(rx * 0.6, ry * 0.6)));
      it.cueN.core.setAttribute("opacity", (0.14 * k).toFixed(3));
      it.cueN.stem.setAttribute("d", dPath([B.P(0, 0, -lift), B.P(0, 0, 0)]));
      it.cueN.foot.setAttribute("points", ptsStr(ell(0.07, 0.07)));
    }
    // ---- when an item is on the board: from its entrance (or always) to the middle of its exit
    const lifeOf = (it) => [it.t0 == null ? -Infinity : it.t0, it.tExit == null ? Infinity : it.tExit + 0.5 * (it.t1 - it.tExit)];
    B.lifeOf = lifeOf;
    /** the height of what stands under a footprint [x0, y0, x1, y1] below height `below`, while [ta, tb] (0: the ground).
     *  When the footprint is inside something that reaches above `below` (a shelf level, a floor), it rests at `below` */
    function groundUnder(fp, below, ta, tb, self) {
      let z = 0;
      const eps = Math.min(0.02, (fp[2] - fp[0]) / 4);
      for (const q of B.items) {
        if (q === self || q.dynamic || q.o.inside) continue;
        const L = lifeOf(q); if (L[1] <= ta || L[0] > tb) continue;
        const b = itemBox(q, 0);
        if (Math.min(fp[2], b[3]) - Math.max(fp[0], b[0]) <= eps || Math.min(fp[3], b[4]) - Math.max(fp[1], b[1]) <= eps) continue;
        if (b[2] >= below - 0.05) continue;
        if (b[5] > below + 0.05) return below;
        z = Math.max(z, b[5]);
      }
      return z;
    }
    /** the height of what stands at a world point at time t (the ground is 0) */
    B.groundAt = (x, y, t) => groundUnder([x - 0.01, y - 0.01, x + 0.01, y + 0.01], Infinity, t == null ? -Infinity : t, t == null ? Infinity : t, null);
    // what an item rests on, and whether it floats (a lift of 0.6 units or more: a height cue; `cue: false` none, `cue:
    // true` always); t null: over its whole life (a standing item), else at t (a mover)
    function fitSupport(it, t, pos) {
      const z = pos[2], o = it.o;
      let s;
      if (o.shadowZ != null) s = o.shadowZ;
      else if (o.inside || it.geo.ground) s = z;
      else if (z <= 0.6) s = Math.min(z, o.z || 0);
      else {
        const g = it.cur.geo, hx = g.Lx / 2, hy = g.Ly / 2, L = t == null ? lifeOf(it) : [t, t];
        s = groundUnder([pos[0] - hx, pos[1] - hy, pos[0] + hx, pos[1] + hy], z, L[0], L[1], it);
      }
      it.cueSupport = s;
      const lift = z - s;
      it.cueOn = o.cue === false ? false : o.cue === true ? lift > 0.05 : lift >= 0.6;
    }
    /** pairs whose order is fixed whatever their boxes say: a host before what is inside it, a route before the mover
     *  riding it, an item before a route segment that enters it (a request dropping into a cut-away hall) */
    function mustBefore(a, b, Ba, Bb) {
      if (b.o.inside === a) return true;
      if (a.seg && b.rides && b.rides.has(a.R)) return true;
      if (b.seg && !a.seg && !(a.rides && a.rides.has(b.R))) {
        return Math.min(Ba[3], Bb[3]) - Math.max(Ba[0], Bb[0]) > 0.02 && Math.min(Ba[4], Bb[4]) - Math.max(Ba[1], Bb[1]) > 0.02 && Bb[2] < Ba[5] - 0.02 && Bb[5] > Ba[2] + 0.02;
      }
      return false;
    }
    /** the box an item is sorted by: a standing item with a height cue is a column down to what it floats over, so its
     *  stem and shadow are hidden by what stands in front of them; a route segment is its own thin box */
    function sortBox(it, t) {
      if (it.seg) return it.box;
      const b = itemBox(it, t);
      if (it.cueOn && !it.dynamic && it.cueSupport != null && it.cueSupport < b[2]) return [b[0], b[1], it.cueSupport, b[3], b[4], b[5]];
      return b;
    }
    function itemBox(it, t) {
      const p = posAt(it, t), V = it.variants[dirAt(it, t)] || it.cur, g = V.geo;
      return [p[0] - g.Lx / 2, p[1] - g.Ly / 2, p[2], p[0] + g.Lx / 2, p[1] + g.Ly / 2, p[2] + g.H];
    }
    function itemRect(it, t) {
      const b = itemBox(it, t);
      const xs = [], ys = [];
      for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) { const q = B.P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    B.itemBox = itemBox;
    /** everything on the board in board px (the plinth, the items, and with `pins` the pins' plates) */
    B.extent = function (t, pins) {
      const pts = opts.plinth === false ? [] : [B.P(0, 0, 0), B.P(B.w, 0, 0), B.P(B.w, B.d, -B.depth), B.P(0, B.d, -B.depth)];
      let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      for (const it of B.items) { if (it.t0 != null && it.t0 > t) continue; const r = itemRect(it, t); x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
      if (pins) for (const pn of B.pins) { if (pn.at > t || (pn.until != null && pn.until <= t)) continue; const r = pn.boardRect(t); x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };

    // ---- motion of items: a pure function of time
    function posAt(it, t) {
      let p = it.home;
      for (const m of it.moves) {
        if (t < m.t0) break;
        if (t >= m.t1) { p = m.end; continue; }
        return m.at(m.ease((t - m.t0) / (m.t1 - m.t0))).p;
      }
      return p;
    }
    function dirAt(it, t) {
      let k = it.dirK;
      for (const m of it.moves) {
        if (t < m.t0) break;
        if (!m.turns) continue;
        if (t >= m.t1) { k = m.endDir; continue; }
        return DIRS[m.at(m.ease((t - m.t0) / (m.t1 - m.t0))).dir];
      }
      return k;
    }
    B.posAt = posAt;

    const ItemProto = {
      /** its entrance: "rise" (grows up from its base), "drop" (lands with a short settle), "draw" (flat things), "none" */
      enter(t, kind, o) {
        o = o || {};
        const it = this, dur = o.dur || (kind === "rise" ? 0.8 : 0.55);
        it.t0 = t;
        B.mark(t);
        const key = "isoA:" + B.worldId + ":" + it.id;
        if (kind === "rise") {
          Loom.drive((e, p) => grow(it, p > 0 ? e : 0, p > 0), t, dur, E_().enter, { kind: "reveal", beat: beatId(), name: it.id, content: true, key: key + ":g" });
        } else if (kind === "drop") {
          const lift = o.from == null ? 1.6 * B.u : o.from;
          Loom.drive((e, p) => {
            const land = clamp((p - 0.72) / 0.28, 0, 1), sq = p < 0.72 ? 1 : 1 - 0.06 * Math.sin(land * Math.PI);
            const fall = clamp(p / 0.72, 0, 1), y = -lift * (1 - fall * fall);
            const by = B.P(0, 0, 0)[1];                      // the item's base, in its own (centred) coordinates
            it.a.setAttribute("opacity", p > 0 ? 1 : 0);
            it.a.setAttribute("transform", `translate(0 ${f1(y)}) translate(0 ${f1(by)}) scale(1 ${sq.toFixed(3)}) translate(0 ${f1(-by)})`);
            it.sh.setAttribute("opacity", (p > 0 ? 0.3 + 0.7 * fall : 0).toFixed(3));
          }, t, dur, "linear", { kind: "reveal", beat: beatId(), name: it.id, content: true, key: key + ":a" });
        } else if (kind === "draw" || kind === "fade") {
          Loom.drive((e, p) => { it.a.setAttribute("opacity", p > 0 ? e.toFixed(3) : 0); it.sh.setAttribute("opacity", p > 0 ? 1 : 0); }, t, Math.min(dur, 0.45), E_().enter, { kind: "reveal", beat: beatId(), name: it.id, content: true, key: key + ":a" });
        }
        return t + dur;
      },
      /** leaves by motion: lifts away and fades (taken away), or "sink" into the board */
      exit(t, o) {
        o = o || {};
        const it = this, dur = o.dur || 0.45, up = o.kind === "sink" ? 30 : -50;
        Loom.drive((e, p) => { if (!(p > 0)) return; it.a.setAttribute("opacity", (1 - e).toFixed(3)); it.a.setAttribute("transform", `translate(0 ${f1(up * e)})`); it.sh.setAttribute("opacity", (1 - e).toFixed(3)); },
          t, dur, E_().exit, { kind: "exit", beat: beatId(), name: it.id, content: false, key: "isoA:" + B.worldId + ":" + it.id + ":a" });
        it.tExit = t; it.t1 = t + dur;
        return t + dur;
      },
      /** travel along a route (or a list of world points) from time t: {dur | by | speed (units a second), from, to (0..1)}.
       *  The route's line is drawn ahead of the mover if it was not drawn already (nothing moves without a line leading it) */
      travel(route, t, o) {
        o = o || {};
        const it = this;
        if (Array.isArray(route)) route = B.route(it.id + "_path", route, { at: null, hidden: true });
        const from = o.from || 0, to = o.to == null ? 1 : o.to, L = route.len * Math.abs(to - from);
        const dur = o.by != null ? Math.max(0.2, o.by - t) : o.dur || Math.max(0.6, L / (o.speed || 2.2));
        if (!route.hidden && (route.drawT == null || route.drawT > t - 0.15)) route.draw(Math.max(0, t - 0.45), t + dur * 0.62);
        (it.rides = it.rides || new Set()).add(route);    // its own route's segments are drawn under it, never over it
        const at = (u) => { const s = route.pointAt(lerp(from, to, u)); return { p: [s.p[0], s.p[1], (it.o.z || 0) + (s.p[2] || 0)], dir: s.dir }; };
        const end = at(1);
        addMove(it, { t0: t, t1: t + dur, at, ease: Loom.ease[o.ease || "editorial"] || E_().editorial, end: end.p, endDir: DIRS[end.dir], turns: o.face !== false });
        return t + dur;
      },
      /** a straight move to `to` (a world point for its footprint's centre) or `by` a delta: one axis at a time reads best */
      move(t, o) {
        o = o || {};
        const it = this, p0 = posAt(it, t), p1 = o.to ? [o.to[0], o.to[1], o.to[2] == null ? p0[2] : o.to[2]] : add3(p0, o.by || [0, 0, 0]);
        const axes = [0, 1, 2].filter((i) => Math.abs(p1[i] - p0[i]) > 1e-6).length;
        if (axes > 1 && !o.free) Loom.warn("iso_move_diagonal", `${beatId()}: ${it.id} moves along ${axes} axes at once; isometric motion reads best one axis at a time (IBM isometric motion guidance)`, { beat: beatId() });
        const dur = o.dur || 0.8;
        addMove(it, { t0: t, t1: t + dur, at: (u) => ({ p: [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u)] }), ease: Loom.ease[o.ease || "move"] || E_().move, end: p1, turns: false });
        return t + dur;
      },
      /** a cutaway: the cut line draws, the skin slides out along its own normal and fades, the hatched rims appear */
      cut(t, o) {
        o = o || {};
        const it = this, V = it.cur, skin = V.groups.filter((gp) => gp.pr.skin), dur = o.dur || 0.5;
        if (!skin.length) { Loom.warn("iso_no_skin", `${beatId()}: ${it.id} (${it.kind}) has no skin to cut away`, { beat: beatId() }); return t; }
        // the cut line: a dashed ink line along the top edge of the skin, drawn first (0.3 s)
        const sk = [].concat(...skin.map((gp) => gp.pr.faces ? gp.pr.faces.filter((f) => f.kind !== "decal").map((f) => f.pts) : [])).flat();
        const zt = Math.max(...sk.map((p) => p[2]));
        const bx = aabbOf(sk);
        const line = [[bx[3], bx[1], zt], [bx[3], bx[4], zt], [bx[0], bx[4], zt]].map((p) => B.P(p[0], p[1], p[2] + 0.02));
        const cl = svg("path", { d: dPath(line), fill: "none", stroke: S().c("line"), "stroke-width": 2.2, "stroke-dasharray": "9 7", opacity: 0 }, V.g);
        Loom.drive((e, p) => cl.setAttribute("opacity", p > 0 && p < 1 ? 1 : 0), t, 0.3 + dur, "linear", { kind: "draw", beat: beatId(), name: it.id + ".cut", content: true, key: "isocut:" + B.worldId + ":" + it.id + (it.cuts.length) });
        const t1 = t + 0.3;
        Loom.drive((e, p) => {
          for (const gp of skin) {
            const out = gp.pr.out || [0, 0, 1], dist = (o.dist || 0.9) * e, q = B.P(out[0] * dist, out[1] * dist, out[2] * dist), q0 = B.P(0, 0, 0);
            gp.g.setAttribute("transform", p > 0 ? `translate(${f1(q[0] - q0[0])} ${f1(q[1] - q0[1])})` : "");
            gp.g.setAttribute("opacity", p > 0 ? (1 - e).toFixed(3) : 1);
            gp.g.setAttribute("display", p >= 1 ? "none" : "inline");
          }
          for (const r of it.rims || []) { const a = p > 0 ? clamp((p - 0.5) / 0.5, 0, 1) : 0; r.node.setAttribute("opacity", a.toFixed(3)); if (r.hatch) r.hatch.setAttribute("opacity", a.toFixed(3)); }
        }, t1, dur, E_().enter, { kind: "cut", beat: beatId(), name: it.id + ".skin", content: true, key: "isoskin:" + B.worldId + ":" + it.id });
        it.cuts.push(t);
        return t1 + dur;
      },
      /** a change of state shown by colour (raw to done, empty to full): its body turns to another token's tones */
      tint(t, tok, o) {
        o = o || {};
        this.tints.push({ t0: t, t1: t + (o.dur || 0.5), tok });
        const it = this;
        Loom.drive((e, p) => B.paint([it], t + p * (o.dur || 0.5)), t, o.dur || 0.5, "linear", { kind: "state", beat: beatId(), name: it.id + ".tint", content: true, key: "isotint:" + B.worldId + ":" + it.id });
        return t + (o.dur || 0.5);
      },
      /** the world point on top of the item (or of one of its parts) at time t */
      top(t, part) {
        const b = itemBox(this, t == null ? 1e9 : t);
        if (part && this.parts[part]) {
          const V = this.cur, prs = V.groups.filter((gp) => gp.pr.part === part).map((gp) => gp.pr.aabb);
          if (prs.length) { const p = posAt(this, t == null ? 1e9 : t); const x0 = Math.min(...prs.map((a) => a[0])), x1 = Math.max(...prs.map((a) => a[3])), y0 = Math.min(...prs.map((a) => a[1])), y1 = Math.max(...prs.map((a) => a[4])), z1 = Math.max(...prs.map((a) => a[5])); return [p[0] + (x0 + x1) / 2, p[1] + (y0 + y1) / 2, p[2] + z1]; }
        }
        return [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, b[5]];
      },
    };
    function addMove(it, m) {
      const last = it.moves[it.moves.length - 1];
      if (last && m.t0 < last.t1 - 1e-6) Loom.warn("iso_move_overlap", `${beatId()}: ${it.id} is asked to move at ${m.t0.toFixed(2)}s before its last move ends (${last.t1.toFixed(2)}s)`, { beat: beatId() });
      it.moves.push(m);
      it.moves.sort((a, b) => a.t0 - b.t0);
      if (m.turns) for (const k of [0, 1, 2, 3]) if (!it.variants[k]) { /* built on demand below */ }
      // variants for every axis the move faces
      if (m.turns) { for (let i = 0; i <= 40; i++) variant(it, DIRS[m.at(i / 40).dir]); }
      it.dynamic = true;
      B.live = true;
      Loom.drive(SEEN, m.t0, m.t1 - m.t0, "linear", { kind: "travel", beat: beatId(), name: it.id, content: true, key: "isomv:" + B.worldId + ":" + it.id });
    }
    // growth from the base: every point's height scaled by k (an exact isometric extrusion), the shadow with it
    function grow(it, k, shown) {
      it.a.setAttribute("opacity", shown ? 1 : 0);
      it.sh.setAttribute("opacity", shown ? k.toFixed(3) : 0);
      for (const kk in it.variants) {
        const V = it.variants[kk];
        for (const r of V.nodes) {
          if (r.P2 && r.node) r.node.setAttribute("points", ptsStr(r.P2.map((p, i) => [p[0], p[1] + (1 - k) * r.zs[i] * B.u])));
          else if (r.P2 && r.ink) r.ink.setAttribute("d", dPath(r.P2.map((p, i) => [p[0], p[1] + (1 - k) * r.zs[i] * B.u])));
          else if (r.bill) { const [bx, by] = r.base; r.bill.setAttribute("transform", `translate(${f1(bx)} ${f1(by)}) scale(1 ${Math.max(0.001, k).toFixed(3)}) translate(${f1(-bx)} ${f1(-by)})`); }
          if (r.hatch) r.hatch.setAttribute("transform", `translate(0 0)`);
        }
      }
    }
    // the face colours of items at time t: their tint (state) and the focus (context greys)
    function tokAt(it, t) {
      let tok = it.tok, prev = it.tok;
      for (const ti of it.tints) {
        if (t < ti.t0) break;
        if (t >= ti.t1) { prev = tok = ti.tok; continue; }
        return { a: prev, b: ti.tok, k: (t - ti.t0) / (ti.t1 - ti.t0) };
      }
      return { a: tok, b: tok, k: 0 };
    }
    function focusAt(it, t) {           // 0 = full colour, 1 = context grey
      let lv = 0;
      for (const ev of B.focusEv) {
        if (t < ev.t0) break;
        const want = ev.set ? (ev.set.has(it) ? 0 : ev.amount) : 0;
        const from = lv, u = clamp((t - ev.t0) / ev.dur, 0, 1);
        lv = lerp(from, want, smooth(u));
      }
      return lv;
    }
    B.focusAt = focusAt;
    B.paint = function (list, t) {
      for (const it of list) {
        const ta = tokAt(it, t), fl = focusAt(it, t);
        for (const kk in it.variants) for (const r of it.variants[kk].nodes) {
          if (r.ink) continue;
          const tk = r.body ? null : r.tok;
          const colOf = (tok) => (r.cut ? tones(tok).cut : r.fc ? faceColour(tok, r.fc) : tones(tok).base);
          let col = tk ? colOf(tk) : (ta.k > 0 ? S().mix(colOf(ta.a), colOf(ta.b), smooth(ta.k)) : colOf(ta.a));
          if (fl > 0.001) col = S().mix(col, contextOf(col), fl);
          if (r.node) { r.node.setAttribute("fill", col); if (r.node.getAttribute("stroke") && r.node.getAttribute("stroke") !== "none") r.node.setAttribute("stroke", col); }
          else if (r.bill) {
            for (const c of Array.from(r.bill.childNodes || [])) {
              if (!c.getAttribute) continue;
              const f0 = c.__f0 || (c.__f0 = c.getAttribute("fill"));
              if (f0 && f0 !== "none") c.setAttribute("fill", fl > 0.001 ? S().mix(f0, contextOf(f0), fl) : f0);
            }
          }
        }
      }
    };
    /** focus+context: at t, every other solid on the board turns to its context grey; the subject(s) keep their hue */
    B.focus = function (items, t, o) {
      o = o || {};
      const set = new Set([].concat(items).filter(Boolean).flatMap((x) => (x.units ? x.units : [x])));   // a stack counts as its units
      B.focusEv.push({ t0: t, dur: o.dur || 0.6, set, amount: o.amount == null ? 0.9 : o.amount });
      B.focusEv.sort((a, b) => a.t0 - b.t0);
      Loom.drive((e, p) => B.paint(B.items, t + p * (o.dur || 0.6)), t, o.dur || 0.6, "linear", { kind: "focus", beat: beatId(), name: name + ".focus", content: true, key: "isofocus:" + B.worldId });
      B.live = true;
      return t + (o.dur || 0.6);
    };
    /** back to full colour */
    B.unfocus = function (t, o) { o = o || {}; B.focusEv.push({ t0: t, dur: o.dur || 0.6, set: null, amount: 0 }); B.focusEv.sort((a, b) => a.t0 - b.t0); Loom.drive((e, p) => B.paint(B.items, t + p * (o.dur || 0.6)), t, o.dur || 0.6, "linear", { kind: "focus", beat: beatId(), name: name + ".unfocus", content: true, key: "isofocus:" + B.worldId }); return t + (o.dur || 0.6); };

    // ================================================================ routes (ink lines on the ground, or in the air)
    /** a route: an axis-aligned polyline of world points ([x, y] or [x, y, z]); {tok, width, dash, arrow, at, dur | by,
     *  air, stems, cue, hidden}. air: true draws each segment among the solids (sorted like a thin box: a hall in front
     *  hides it, it passes over what is under it) with a height cue (a dotted trace on the ground and dashed stems down from
     *  its corners; `stems: false | [point indices]`, `cue: false` for none); air: "over" draws it over everything (the old
     *  way). Returns {len, pointAt(s) -> {p, dir, seg}, draw(t0, t1), flow(t0, t1, o)} */
    B.route = function (rname, pts, o) {
      o = o || {};
      const P3 = pts.map((p) => [p[0], p[1], p[2] || 0]);
      for (let i = 1; i < P3.length; i++) {
        const a = P3[i - 1], b = P3[i], n = [0, 1, 2].filter((k) => Math.abs(a[k] - b[k]) > 1e-6).length;
        if (n > 1) Loom.warn("iso_route_diagonal", `${beatId()}: route ${rname} segment ${i} is not along one grid axis; isometric routes run along the grid (turn at a corner)`, { beat: beatId() });
      }
      const cum = [0];
      for (let i = 1; i < P3.length; i++) cum.push(cum[i - 1] + Math.hypot(P3[i][0] - P3[i - 1][0], P3[i][1] - P3[i - 1][1], P3[i][2] - P3[i - 1][2]));
      const len = cum[cum.length - 1] || 1e-6;
      const R = { name: rname, pts: P3, cum, len, hidden: !!o.hidden, drawT: null };
      R.pointAt = function (s) {
        const L = clamp(s, 0, 1) * len;
        let i = 1; while (i < cum.length - 1 && cum[i] < L) i++;
        const a = P3[i - 1], b = P3[i], u = (L - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "+x" : "-x") : (dy >= 0 ? "+y" : "-y");
        return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], dir, seg: i - 1 };
      };
      if (o.hidden) return R;
      const sorted = o.air === true || o.air === "sorted";
      R.air = !!o.air;
      const layer = o.air === "over" ? B.Lair : B.Ldecal, col = S().c(o.tok || "line"), wd = o.width || 4;
      const P2 = P3.map((p) => B.P(p[0], p[1], p[2] + 0.02));
      const g = svg("g", { class: "lm-iso-route", "data-name": rname }, layer);
      const L2 = P2.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - P2[i - 1][0], p[1] - P2[i - 1][1]) : 0), 0) || 1e-6;
      // the pieces drawn: the whole line in one group, or (sorted) one group per segment among the solids
      const pieces = [];
      if (sorted) {
        R.segs = [];
        let acc = 0;
        for (let i = 1; i < P3.length; i++) {
          const a = P3[i - 1], b = P3[i], pd = 0.02, l = Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]);
          const sg = svg("g", { class: "lm-iso-route lm-iso-airseg", "data-name": rname, "data-seg": i }, B.Lsolid);
          const seg = { seg: true, R, id: `${rname}#${i}`, g: sg, layer: B.Lsolid, o: {}, moves: [],
            box: [Math.min(a[0], b[0]) - pd, Math.min(a[1], b[1]) - pd, Math.min(a[2], b[2]), Math.max(a[0], b[0]) + pd, Math.max(a[1], b[1]) + pd, Math.max(a[2], b[2])] };
          R.segs.push(seg); B.segs.push(seg);
          pieces.push({ g: sg, P: [P2[i - 1], P2[i]], L0: acc, L1: acc + l });
          acc += l;
        }
        B.dirty = true;
      } else pieces.push({ g, P: P2, L0: 0, L1: L2 });
      const pieceAt = (Ls) => pieces.find((pc) => Ls < pc.L1) || pieces[pieces.length - 1];
      const dashes = [];
      if (o.dash) {                                      // a planned or optional route: dashes appear in order along it
        let s = 0; const on = 12, off = 9;
        const at2 = (Ls) => { let acc = 0; for (let i = 1; i < P2.length; i++) { const l = Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]); if (acc + l >= Ls) { const u = (Ls - acc) / (l || 1); return [lerp(P2[i - 1][0], P2[i][0], u), lerp(P2[i - 1][1], P2[i][1], u)]; } acc += l; } return P2[P2.length - 1]; };
        while (s < L2) { const e = Math.min(L2, s + on); const a = at2(s), b = at2(e); dashes.push({ s, n: svg("line", { x1: f1(a[0]), y1: f1(a[1]), x2: f1(b[0]), y2: f1(b[1]), stroke: col, "stroke-width": wd * 0.8, "stroke-linecap": "round", opacity: 0 }, pieceAt(s).g) }); s += on + off; }
      } else {
        for (const pc of pieces) {
          const l = pc.L1 - pc.L0;
          pc.node = svg("path", { d: dPath(pc.P), fill: "none", stroke: col, "stroke-width": wd, "stroke-linecap": "round", "stroke-linejoin": "round",
            "stroke-dasharray": `${l.toFixed(1)} ${(l + 40).toFixed(1)}`, "stroke-dashoffset": (l + 2).toFixed(1) }, pc.g);
        }
      }
      let head = null;
      if (o.arrow !== false) {                          // a flat arrowhead lying on the ground at the end
        const a = P3[P3.length - 2], b = P3[P3.length - 1], dv = norm3(sub3(b, a)), side = [-dv[1], dv[0], 0], hl = 0.42, hw = 0.26;
        const tip = add3(b, [0, 0, 0.02]), bse = add3(tip, mul3(dv, -hl));
        const tri = [tip, add3(bse, mul3(side, hw)), add3(bse, mul3(side, -hw))].map((p) => B.P(p[0], p[1], p[2]));
        head = svg("polygon", { points: ptsStr(tri), fill: col, opacity: 0 }, pieces[pieces.length - 1].g);
      }
      // the height cue of an air route: its trace on the ground (dotted, quiet) and dashed stems from its corners down to
      // what stands under them (each stem a thin column among the solids). A corner whose route already drops straight
      // down needs no stem
      R.stems = [];
      if (o.air && o.cue !== false && P3.some((p) => p[2] >= 0.6)) {
        R.trace = svg("path", { d: dPath(P3.map((p) => B.P(p[0], p[1], 0.01))), fill: "none", stroke: S().c("line"), "stroke-width": 2.2, "stroke-dasharray": "1.5 7", "stroke-linecap": "round", opacity: 0, class: "lm-iso-trace" }, B.Ldecal);
        let acc = 0;
        P3.forEach((p, j) => {
          if (j) acc += Math.hypot(P2[j][0] - P2[j - 1][0], P2[j][1] - P2[j - 1][1]);
          if (p[2] < 0.6 || o.stems === false || (Array.isArray(o.stems) && !o.stems.includes(j))) return;
          const drops = [P3[j - 1], P3[j + 1]].some((q) => q && Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6 && q[2] < p[2]);
          if (drops) return;
          const sg = svg("g", { class: "lm-iso-stem", "data-name": rname, "data-point": j }, sorted ? B.Lsolid : layer);
          const st = { seg: true, stem: true, R, id: `${rname}@${j}`, g: sg, layer: B.Lsolid, o: {}, moves: [], p, Lat: acc, box: [p[0] - 0.02, p[1] - 0.02, p[2], p[0] + 0.02, p[1] + 0.02, p[2]],
            path: svg("path", { d: "", fill: "none", stroke: S().c("line"), "stroke-width": 1.8, "stroke-dasharray": "3 5", "stroke-linecap": "round", opacity: 0 }, sg),
            foot: svg("polygon", { points: "", fill: S().c("line"), opacity: 0 }, sg) };
          R.stems.push(st);
          if (sorted) B.segs.push(st);
        });
        B.dirty = true;
      }
      /** fit the stems to what stands under them (the board's sort calls it) */
      R.fitStems = function () {
        for (const st of R.stems) {
          const [x, y, z] = st.p, sup = groundUnder([x - 0.01, y - 0.01, x + 0.01, y + 0.01], z, R.drawT == null ? -Infinity : R.drawT, Infinity, null);
          st.on = z - sup >= 0.6;
          st.g.setAttribute("display", st.on ? "inline" : "none");
          st.box = [x - 0.02, y - 0.02, st.on ? sup : z, x + 0.02, y + 0.02, z];
          if (!st.on) continue;
          st.path.setAttribute("d", dPath([B.P(x, y, sup), B.P(x, y, z)]));
          const F = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; F.push(B.P(x + Math.cos(a) * 0.08, y + Math.sin(a) * 0.08, sup + 0.01)); }
          st.foot.setAttribute("points", ptsStr(F));
        }
      };
      R.g = g;
      R.draw = function (t0, t1) {
        if (R.drawT != null) return R.drawT1;
        R.drawT = t0; R.drawT1 = t1;
        const d = Math.max(0.05, t1 - t0);
        B.mark(t0);
        for (const pc of pieces) if (pc.node) { const l = pc.L1 - pc.L0; Loom.tween(pc.node, { strokeDashoffset: l + 2 }, { strokeDashoffset: 0, duration: Math.max(0.01, d * l / L2), ease: "none" }, t0 + d * pc.L0 / L2, meta("draw", rname)); }
        for (const ds of dashes) Loom.tween(ds.n, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0 + d * ds.s / L2, meta("draw", rname));
        if (head) Loom.tween(head, { opacity: 0 }, { opacity: 1, duration: 0.12 }, t0 + d * 0.97, meta("draw", rname));
        if (R.trace) Loom.tween(R.trace, { opacity: 0 }, { opacity: 0.45, duration: d, ease: "none" }, t0, meta("draw", rname));
        for (const st of R.stems) { const ts = t0 + d * st.Lat / L2; Loom.tween(st.path, { opacity: 0 }, { opacity: 0.6, duration: 0.25 }, ts, meta("draw", rname)); Loom.tween(st.foot, { opacity: 0 }, { opacity: 0.6, duration: 0.25 }, ts, meta("draw", rname)); }
        B.dirty = true;
        return t1;
      };
      /** pulses running along the route between t0 and t1 (data, goods or people flowing): small diamonds, evenly spaced */
      R.flow = function (t0, t1, fo) {
        fo = fo || {};
        const n = fo.n || Math.max(2, Math.round(len / 1.6)), speed = fo.speed || 1.4, fcol = S().c(fo.tok || o.tok || "accent2");
        const fg = svg("g", { class: "lm-iso-flow", opacity: 0 }, o.air === "over" ? B.Lair : B.Ldecal);
        const dots = [];
        for (let i = 0; i < n; i++) dots.push(svg("polygon", { points: "", fill: fcol, opacity: R.segs ? 0 : 1 }, fg));
        B.flows.push({ R, t0, t1, n, speed, dots, g: fg, sz: fo.size || 0.18 });
        B.live = true;
        Loom.drive(SEEN, t0, t1 - t0, "linear", { kind: "flow", beat: beatId(), name: rname + ".flow", content: true, key: "isoflow:" + B.worldId + ":" + rname + ":" + t0 });
        return t1;
      };
      B.routes.push(R);
      if (o.at != null) R.draw(o.at, o.by != null ? o.by : o.at + (o.dur || clamp(0.25 + len / 9, 0.5, 1.6)));
      return R;
    };
    /** a road along x or y: B.road({x, y, len, dir: "+x" | "+y", at}) (a flat item on the ground layer) */
    B.road = (o) => B.put("road", Object.assign({}, o, { dir: o.dir || "+x" }));

    // ================================================================ pins: map labels on leaders, in screen space
    // A pin is a dot on the feature, a leader, a shoulder and a plate with the words (the pack's label face, measured).
    // Its words never scale with the camera (they stay at the type floor or above); it follows its anchor as the camera
    // moves and fades rather than be cut by the frame edge. side "auto" scores candidates against the subject, the other
    // solids, the other pins and the frame (top-right preferred, after Imhof).
    B.pin = function (target, text, o) {
      o = o || {};
      const at = o.at == null ? B.t0 + 0.4 : o.at;
      const pname = o.name || `${name}_pin${B.pins.length + 1}`;
      const anchorAt = (t) => {
        if (Array.isArray(target)) return target;
        if (target && target.top) return target.top(t, o.part);
        if (target && target.anchor) return target.anchor;
        return [B.w / 2, B.d / 2, 0];
      };
      const A0 = B.screen(anchorAt(at), at);
      const role = o.role || "label", K = Loom.kit;
      const maxW = o.w || 380;
      const F = K.fit(String(o.widest || text), { role, w: maxW, maxLines: o.maxLines || 2, weight: 600 });
      const Fs = o.sub ? K.fit(String(o.subWidest || o.sub), { role: "caption", w: maxW, maxLines: 1 }) : null;
      const bar = o.bar === false ? 0 : 6, padX = 16, padY = 11;
      const tw = Math.ceil(Math.max(F.width, Fs ? Fs.width : 0)) + 6;
      const pw = bar + (bar ? 12 : padX) + tw + padX, ph = Math.ceil(F.height + (Fs ? Fs.height + 4 : 0) + 2 * padY);
      // candidates: [side, leader length]; the plate's rect relative to the anchor
      const C = [];
      // the other pins on screen while this one is (whichever was made first), seen in this pin's frame: their plates,
      // dots and leaders at the first moment both show, moved by how far this pin's anchor moves by then
      const myEnd = o.until == null ? Infinity : o.until, others = [];
      for (const pn of B.pins) {
        const pe = pn.until == null ? Infinity : pn.until, ts = Math.max(at, pn.at);
        if (ts >= Math.min(myEnd, pe)) continue;
        const Am = B.screen(anchorAt(ts), ts), dm = [Am[0] - A0[0], Am[1] - A0[1]], dq = pinDelta(pn, ts);
        const mv = (p) => [p[0] + dq[0] - dm[0], p[1] + dq[1] - dm[1]];
        const dot = mv(pn.A0), r0 = pn.screenRect(ts);
        others.push({ pn, ts, rect: { x: r0.x - dm[0], y: r0.y - dm[1], w: r0.w, h: r0.h }, dot, lead: pn.leadAbs.map(mv) });
      }
      // a crowded spot (another pin's dot close by) may use longer leaders, so the plates fan out
      const crowded = others.some((q) => Math.hypot(q.dot[0] - A0[0], q.dot[1] - A0[1]) < 110);
      const lens = o.lift ? [o.lift] : crowded ? [70, 105, 145, 190, 240] : [70, 105, 145];
      const sides = o.side && o.side !== "auto" ? [o.side] : ["up-right", "up-left", "right", "left", "down-right", "down-left"];
      for (const sd of sides) for (const L of lens) C.push({ sd, L, pref: sides.indexOf(sd) * 0.6 + lens.indexOf(L) * 0.25 });
      const rectFor = (c) => {
        const sh = 16, up = c.sd.startsWith("up") ? -1 : c.sd.startsWith("down") ? 1 : 0, rt = c.sd.endsWith("right") ? 1 : -1;
        if (o.leader === false) return { x: A0[0] - pw / 2, y: A0[1] - ph - 14, sx: A0[0], sy: A0[1] - 14, ex: A0[0], ey: A0[1] - 14 };
        const sx = A0[0], sy = A0[1] + up * c.L, ex = sx + rt * (up ? sh : c.L), ey = up ? sy : A0[1];
        return { x: rt > 0 ? ex : ex - pw, y: ey - ph / 2, sx, sy, ex, ey };
      };
      const cam = B.camAt(at);
      const solids = B.items.filter((it) => it.t0 == null || it.t0 <= at + 0.6).map((it) => {
        const r = itemRect(it, at), a = B.toScreen(r.x, r.y, cam), b = B.toScreen(r.x + r.w, r.y + r.h, cam), sh = 0.14;
        return { it, x: a[0] + (b[0] - a[0]) * sh, y: a[1] + (b[1] - a[1]) * sh, w: (b[0] - a[0]) * (1 - 2 * sh), h: (b[1] - a[1]) * (1 - 2 * sh), subj: !!it.subject, own: it === target };
      });
      const ov = (r, q) => Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) * Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y));
      const leadOf = (r) => (o.leader === false ? [] : [A0, [r.sx, r.sy], [r.ex, r.ey]]);
      // what one candidate does to the pins already there: plates that touch, a plate over another's dot, leaders that
      // cross, a leader through another's plate
      const clashes = (r, R2, L) => {
        const out = [];
        for (const q of others) {
          let k = ov({ x: R2.x - 10, y: R2.y - 10, w: R2.w + 20, h: R2.h + 20 }, q.rect) / 100 * 10;
          if (inRect(q.dot, R2, -6)) k += 40;
          if (polyCross(L, q.lead)) k += 25;
          if (L.length && nearPoly(q.dot, L) < 16) k += 20;            // a leader grazing another pin's dot
          if (polyHits(L, q.rect)) k += 15;
          if (polyHits(q.lead, R2)) k += 15;
          if (k > 0) out.push({ q, k, hard: ov(R2, q.rect) > 0 || inRect(q.dot, R2, -2) || polyCross(L, q.lead) || polyHits(L, q.rect) || polyHits(q.lead, R2) });
        }
        return out;
      };
      let best = null;
      for (const c of C) {
        const r = rectFor(c), R2 = { x: r.x, y: r.y, w: pw, h: ph };
        let s = c.pref;
        for (const q of solids) s += ov(R2, q) / 900 * (q.subj ? 9 : q.own ? 2.5 : 1);
        for (const cl of clashes(r, R2, leadOf(r))) s += cl.k;
        const out = Math.max(0, 40 - R2.x) + Math.max(0, R2.x + R2.w - 1880) + Math.max(0, 70 - R2.y) + Math.max(0, R2.y + R2.h - 920);
        s += out * 3;
        // a leader that crosses the subject
        for (const q of solids) if (q.subj && q.it !== target) { const mx = (r.sx + r.ex) / 2, my = (r.sy + r.ey) / 2; if (mx > q.x && mx < q.x + q.w && my > q.y && my < q.y + q.h) s += 6; }
        if (!best || s < best.s) best = { s, c, r };
      }
      const subjHit = solids.filter((q) => q.subj).reduce((a, q) => a + ov({ x: best.r.x, y: best.r.y, w: pw, h: ph }, q), 0);
      // pins that still crowd one spot wherever this one goes are named (offset by hand: an until, another anchor, a side)
      const hard = clashes(best.r, { x: best.r.x, y: best.r.y, w: pw, h: ph }, leadOf(best.r)).filter((cl) => cl.hard)
        .concat(others.filter((q) => Math.hypot(q.dot[0] - A0[0], q.dot[1] - A0[1]) < 12).map((q) => ({ q })));
      if (hard.length) Loom.warn("iso_pin_crowd", `${beatId()}: pin "${String(text).slice(0, 30)}" crowds ${[...new Set(hard.map((cl) => `"${cl.q.pn.text.slice(0, 30)}"`))].join(", ")} at ${Math.max(at, ...hard.map((cl) => cl.q.ts)).toFixed(1)}s (plates, leaders or dots overlap at every place tried); give one an until, anchor it elsewhere, or let side "auto" place it`, { beat: beatId() });
      if (subjHit > 400) Loom.warn("iso_pin_covers_subject", `${beatId()}: pin "${String(text).slice(0, 30)}" covers part of a subject (${Math.round(subjHit)} px2) at every place tried; move the camera or shorten the words`, { beat: beatId() });
      const r = best.r;
      const Ep = B.ctx.el(pname, { parent: B.Lpins, x: Math.round(r.x), y: Math.round(r.y), w: pw, h: ph, kind: "label", exit: o.exit || "recede" });
      const ox = Ep.x, oy = Ep.y;                       // where the layout guard (if on) put the plate
      const vis = svg("g", { class: "lm-iso-pin" }, Ep.inner);
      const lp = [[A0[0] - ox, A0[1] - oy], [r.sx - ox, r.sy - oy], [r.ex - ox + (best.c.sd.endsWith("right") ? 0 : 0), r.ey - oy]];
      // the leader goes to the plate's near edge, wherever the plate ended up
      const nearX = (best.c.sd.endsWith("right") || o.leader === false) ? 0 : pw, nearY = ph / 2;
      if (o.leader !== false) lp[2] = [nearX, nearY];
      if (o.leader !== false && best.c.sd !== "right" && best.c.sd !== "left") lp[1] = [lp[0][0], nearY];
      const Ld = lp.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - lp[i - 1][0], p[1] - lp[i - 1][1]) : 0), 0);
      const lead = o.leader === false ? null : svg("path", { d: dPath(lp), fill: "none", stroke: S().c("line"), "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round",
        "stroke-dasharray": `${Ld.toFixed(1)} ${(Ld + 30).toFixed(1)}`, "stroke-dashoffset": (Ld + 1).toFixed(1) }, vis);
      const dot = o.leader === false ? null : svg("circle", { cx: f1(lp[0][0]), cy: f1(lp[0][1]), r: 5.5, fill: S().c("surface"), stroke: S().c("line"), "stroke-width": 2.5, opacity: 0 }, vis);
      const plate = svg("g", { class: "lm-iso-plate", opacity: 0 }, vis);
      K.rect(plate, 0, 0, pw, ph, { fill: "surface", r: 6, crisp: true, shadow: false });
      svg("rect", { x: 0.5, y: 0.5, width: pw - 1, height: ph - 1, rx: 6, fill: "none", stroke: S().c("line"), "stroke-width": 1, opacity: 0.18 }, plate);
      if (bar) svg("rect", { x: 7, y: 8, width: bar, height: ph - 16, rx: 3, fill: tones(o.tok || (target && target.tok) || "line").base }, plate);
      const tx = K.text(plate, String(text), { role, x: bar ? bar + 19 : padX, y: padY, w: tw, h: F.height, weight: 600, maxLines: o.maxLines || 2, color: "ink" });
      let sub = null;
      if (o.sub) sub = K.text(plate, String(o.sub), { role: "caption", x: bar ? bar + 19 : padX, y: padY + F.height + 4, w: tw, h: Fs.height, maxLines: 1, color: "muted" });
      // reveal: the dot, then the leader draws, then the plate (lines lead)
      const tL = at + (o.leader === false ? 0 : 0.28);
      Loom.tween(Ep.inner, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at, meta("reveal", pname));
      if (dot) Loom.tween(dot, { opacity: 0 }, { opacity: 1, duration: 0.12 }, at, meta("reveal", pname));
      if (lead) Loom.tween(lead, { strokeDashoffset: Ld + 1 }, { strokeDashoffset: 0, duration: 0.28, ease: "none" }, at + 0.04, meta("draw", pname));
      Loom.tween(plate, { opacity: 0, x: best.c.sd.endsWith("left") ? 8 : -8 }, { opacity: 1, x: 0, duration: 0.32, ease: E_().enter }, tL, meta("reveal", pname));
      Ep.revealT = at; Ep.revealKind = "reveal";
      B.mark(at);
      const pn = { name: pname, text: String(text), el: Ep, at, until: o.until, target, anchorAt, A0, ox, oy, pw, ph, tx, sub, vis, lead, dot, lp, tok: o.tok,
        leadAbs: lead ? lp.map((p) => [p[0] + ox, p[1] + oy]) : [],
        // whose focus the pin follows (an item or a list: it fades only when all of them are context); a pin on a point
        // with no `of` is context whenever anything is in focus
        of: o.of !== undefined ? o.of : (target && target.B === B ? target : null),
        dynamic: !!(target && target.moves && target.moves.length) || !!o.follow };
      pn.screenRect = (t) => { const d = pinDelta(pn, t); return { x: ox + d[0], y: oy + d[1], w: pw, h: ph }; };
      // where the plate is in board px at time t (at zoom 1: pins keep their screen size whatever the zoom)
      pn.boardRect = (t) => { const a = pn.anchorAt(t == null ? 1e9 : t), q = B.P(a[0], a[1], a[2] || 0); return { x: q[0] + (ox - A0[0]), y: q[1] + (oy - A0[1]), w: pw, h: ph }; };
      if (o.until != null) { Loom.tween(Ep.inner, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: E_().exit }, o.until, meta("exit", pname, false)); Ep.exitT = o.until; }
      /** live words: fn(t) gives the text at time t, between t0 and t1 (a count that runs as things arrive) */
      pn.live = function (t0, t1, fn, which) {
        const node = (which === "sub" ? sub : tx);
        const span = node && node.firstChild ? node.firstChild : node;
        Loom.drive((e, p) => { if (span) span.textContent = fn(t0 + p * (t1 - t0)); }, t0, Math.max(0.05, t1 - t0), "linear", { kind: "count", beat: beatId(), name: pname + ".live", content: true, key: "isolive:" + B.worldId + ":" + pname + ":" + (which || "t") });
        return t1;
      };
      B.pins.push(pn);
      B.live = true;
      return pn;
    };
    // screen geometry for pin placement: a point in a rect (grown by m px), proper crossings of two polylines, a polyline
    // through a rect's inside
    const inRect = (p, r, m) => p[0] > r.x - m && p[0] < r.x + r.w + m && p[1] > r.y - m && p[1] < r.y + r.h + m;
    const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const segX = (p1, p2, q1, q2) => orient(q1, q2, p1) * orient(q1, q2, p2) < -1e-6 && orient(p1, p2, q1) * orient(p1, p2, q2) < -1e-6;
    function polyCross(A, Q) { for (let i = 1; i < A.length; i++) for (let j = 1; j < Q.length; j++) if (segX(A[i - 1], A[i], Q[j - 1], Q[j])) return true; return false; }
    function nearPoly(p, A) {
      let m = Infinity;
      for (let i = 1; i < A.length; i++) {
        const a = A[i - 1], b = A[i], dx = b[0] - a[0], dy = b[1] - a[1], u = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) || 1), 0, 1);
        m = Math.min(m, Math.hypot(a[0] + u * dx - p[0], a[1] + u * dy - p[1]));
      }
      return m;
    }
    function polyHits(A, r) {
      const s = { x: r.x + 3, y: r.y + 3, w: r.w - 6, h: r.h - 6 }, E = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]];
      for (let i = 1; i < A.length; i++) {
        const a = A[i - 1], b = A[i];
        if (inRect([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s, 0)) return true;
        for (let k = 0; k < 4; k++) if (segX(a, b, E[k], E[(k + 1) % 4])) return true;
      }
      return false;
    }
    function pinDelta(pn, t) {
      const A = B.screen(pn.anchorAt(t), t);
      return [A[0] - pn.A0[0], A[1] - pn.A0[1]];
    }

    // ================================================================ the tracked subject: a "you are here" ring
    B.track = function (item, o) {
      o = o || {};
      const at = o.at == null ? B.t0 : o.at, tok = o.tok || "accent";
      item.subject = true;
      const g = svg("g", { class: "lm-iso-ring", opacity: 0 }, B.Ldecal);
      const V = item.cur.geo, R = Math.max(V.Lx, V.Ly) * 0.62 + 0.25;
      const ell = (rr) => { const P = []; for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; P.push(B.P(Math.cos(a) * rr, Math.sin(a) * rr, 0.02)); } return P; };
      const q0 = B.P(0, 0, 0), sh = (P) => P.map((p) => [p[0] - q0[0], p[1] - q0[1]]);
      const ring = svg("polygon", { points: ptsStr(sh(ell(R))), fill: S().c(tok), "fill-opacity": 0.12, stroke: S().c(tok), "stroke-width": 3 }, g);
      const pulse = svg("polygon", { points: ptsStr(sh(ell(R))), fill: "none", stroke: S().c(tok), "stroke-width": 2, opacity: 0 }, g);
      B.rings.push({ item, g, ring, pulse, at, until: o.until, R, ell, sh });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at, meta("reveal", item.id + ".ring"));
      if (o.until != null) Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.3 }, o.until, meta("exit", item.id + ".ring", false));
      B.live = true;
      let pn = null;
      if (o.label) pn = B.pin(item, o.label, { at: at + 0.2, tok, until: o.until, side: o.side, sub: o.sub, follow: true, name: o.name });
      // the ring and its pin follow the subject on every frame (one drive registers the window with the report)
      const t1 = o.until == null ? (B.ctx.end || at + 10) : o.until;
      Loom.drive(SEEN, at, Math.max(0.1, t1 - at), "linear", { kind: "track", beat: beatId(), name: item.id + ".track", content: false, key: "isotrack:" + B.worldId + ":" + item.id });
      return { ring: g, pin: pn };
    };

    // ================================================================ the frame within the frame: a circular inset
    // a leader grows from the anchor, then the circle opens on a magnified LIVE view of the same board (an SVG <use> of
    // the world: moving things move in it too); `content(g, r)` draws something else in it instead (a close-up)
    B.inset = function (iname, o) {
      o = o || {};
      const at = o.at == null ? B.t0 + 1 : o.at, r = o.r || 150, z = o.zoom || 2.6, c = o.centre || [1560, 300];
      const of = o.of, anchor = (t) => (Array.isArray(of) ? of : of && of.top ? of.top(t == null ? at : t) : [B.w / 2, B.d / 2, 0]);
      const Ei = B.ctx.el(iname, { parent: B.Linsets, x: c[0] - r, y: c[1] - r, w: 2 * r, h: 2 * r, kind: "panel", exit: o.exit || "recede" });
      const g = svg("g", {}, Ei.inner);
      const A = B.screen(anchor(), at), lx = A[0] - Ei.x, ly = A[1] - Ei.y, cx = r, cy = r;
      const dx = cx - lx, dy = cy - ly, dl = Math.hypot(dx, dy) || 1, ex = cx - dx / dl * r, ey = cy - dy / dl * r;
      const Ll = Math.hypot(ex - lx, ey - ly);
      const lead = svg("path", { d: `M${f1(lx)},${f1(ly)} L${f1(ex)},${f1(ey)}`, stroke: S().c("line"), "stroke-width": 2.2, fill: "none", "stroke-dasharray": `${Ll.toFixed(1)} ${(Ll + 20).toFixed(1)}`, "stroke-dashoffset": (Ll + 1).toFixed(1) }, g);
      const dotA = svg("circle", { cx: f1(lx), cy: f1(ly), r: 6, fill: "none", stroke: S().c("line"), "stroke-width": 2.5, opacity: 0 }, g);
      const id = "lmisoclip" + (++UID);
      const defs = svg("defs", {}, g), cp = svg("clipPath", { id }, defs), cc = svg("circle", { cx, cy, r: 0.1 }, cp);
      const back = svg("circle", { cx, cy, r: 0.1, fill: S().c("field") }, g);
      const view = svg("g", { "clip-path": `url(#${id})` }, g);
      if (o.content) o.content(view, r, { cx, cy });
      else {
        const q = B.P(...anchor());
        const u = svg("use", { href: "#" + B.worldId, "xlink:href": "#" + B.worldId, transform: `translate(${f1(cx)} ${f1(cy)}) scale(${z}) translate(${f1(-q[0])} ${f1(-q[1] - (o.lift || 0))})` }, view);
        // a moving subject stays in the middle of its inset, and the leader keeps pointing at it
        if (of && of.moves) B.insets.push({ follow: true, at, until: o.until, u, lead, dotA, anchor, z, cx, cy, r, Ei, lift: o.lift || 0 });
      }
      const ring = svg("circle", { cx, cy, r: 0.1, fill: "none", stroke: S().c(o.tok || "line"), "stroke-width": 3 }, g);
      Loom.tween(Ei.inner, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at, meta("reveal", iname));
      Loom.tween(dotA, { opacity: 0 }, { opacity: 1, duration: 0.1 }, at, meta("reveal", iname));
      Loom.tween(lead, { strokeDashoffset: Ll + 1 }, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, at, meta("draw", iname));
      Loom.drive((e, p) => { const rr = Math.max(0.1, r * (p > 0 ? e : 0)); cc.setAttribute("r", f1(rr)); back.setAttribute("r", f1(rr)); ring.setAttribute("r", f1(rr)); }, at + 0.35, 0.5, E_().enter, { kind: "reveal", beat: beatId(), name: iname, content: true, key: "isoinset:" + id });
      Ei.revealT = at; Ei.revealKind = "reveal";
      B.mark(at);
      let tl = at + 0.85;
      if (o.label) {
        const K = Loom.kit, F = K.fit(o.label, { role: "label", w: 2 * r + 60, maxLines: 1, weight: 600 }), lw = F.width + 36, lh = F.height + 18;
        const lg = svg("g", { opacity: 0 }, Ei.inner);
        K.rect(lg, cx - lw / 2, 2 * r + 12, lw, lh, { fill: "surface", r: lh / 2, crisp: true, shadow: false });
        K.text(lg, o.label, { role: "label", x: cx - lw / 2 + 18, y: 2 * r + 21, w: F.width + 2, h: F.height, weight: 600, maxLines: 1, align: "center" });
        Loom.tween(lg, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tl, meta("reveal", iname));
        tl += 0.3;
      }
      if (o.until != null) { Loom.tween(Ei.inner, { opacity: 1 }, { opacity: 0, duration: 0.35 }, o.until, meta("exit", iname, false)); Ei.exitT = o.until; }
      if (!(of && of.moves)) B.insets.push({ Ei, at, until: o.until });
      else B.live = true;
      return Ei;
    };

    // ================================================================ Isotype: counts that add up, accumulation that accelerates
    // arrival times for n units over [t0, t1]: accelerating (each gap shorter than the last) unless {even: true}
    function schedule(n, t0, t1, even, accel) {
      const out = [], a = accel || 2.1;
      for (let i = 0; i < n; i++) out.push(t0 + (t1 - t0) * (even ? (n > 1 ? i / (n - 1) : 0) : Math.pow(n > 1 ? i / (n - 1) : 0, 1 / a)));
      return out;
    }
    B.schedule = schedule;
    const fmtN = (v, dec) => { const s = (+v).toFixed(dec || 0), [i, f] = s.split("."); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : ""); };
    /** a flat Isotype tally in a card element E: {n, per, unit, icon, label, total, tok, cols, at, by, even, accent: [i0, i1],
     *  partial (0..1, the last unit cut)}. The number under it counts as units arrive and always equals what is shown */
    B.tally = function (Et, o) {
      o = o || {};
      const n = Math.max(1, Math.floor(o.n || 10)), per = o.per || 1, partial = o.partial || 0, total = n * per - (partial ? (1 - partial) * per : 0);
      if (o.total != null && Math.abs(o.total - total) > Math.max(1e-6, per * 1e-3)) Loom.error("iso_count_mismatch", `${beatId()}: tally ${Et.name} shows ${n} x ${per}${partial ? ` (the last cut to ${partial})` : ""} = ${total}, but its total says ${o.total}: the picture must add up`, { beat: beatId() });
      const K = Loom.kit, w = Et.w, h = Et.h, pad = 24;
      const at = o.at == null ? B.t0 + 0.5 : o.at, by = o.by == null ? at + clamp(n * 0.09, 1.2, 3.6) : o.by;
      card(Et.inner, w, h);
      let y = pad;
      if (o.title) { const tt = K.text(Et.inner, o.title, { role: "label", x: pad, y, w: w - 2 * pad, h: 44, weight: 600, maxLines: 1, color: "muted" }); y += (tt.__fit ? tt.__fit.height : 34) + 10; }
      const cols = o.cols || Math.min(10, n), rows = Math.ceil(n / cols), groupGap = cols > 5 ? 10 : 0;
      const numH = 96, cell = Math.min((w - 2 * pad - groupGap * Math.floor((cols - 1) / 5)) / cols, (h - y - numH - pad) / rows);
      const noun = iconForNoun(o.label) || iconForNoun(o.title), pick = o.icon || o.unit || noun || "person";
      if (o.icon && noun && o.icon !== noun) Loom.warn("iso_tally_icon", `${beatId()}: tally ${Et.name} counts "${o.label || o.title}" with the ${o.icon} icon; the icon should be the noun counted (${noun})`, { beat: beatId() });
      const icon = PICTO[pick] || PICTO.person, col = tones(o.tok || "accent2").base, hole = S().c("surface");
      const times = schedule(n, at, by, o.even);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols), c = i % cols, gx = pad + c * cell + Math.floor(c / 5) * groupGap + cell / 2, gy = y + r * cell + cell / 2;
        const g0 = svg("g", { transform: `translate(${f1(gx)} ${f1(gy)})` }, Et.inner), g = svg("g", {}, g0);
        const inner = svg("g", { transform: `scale(${(cell * 0.86 / 100).toFixed(4)})` }, g);
        const hot = o.accent && i >= o.accent[0] && i <= o.accent[1];
        icon(inner, hot ? tones("accent").base : col, hole);
        if (partial && i === n - 1) {                      // the cut unit: a part of a pictogram for a part of a value (Isotype)
          const id = "lmisopart" + (++UID), cp = svg("clipPath", { id }, svg("defs", {}, g));
          svg("rect", { x: -50, y: -50, width: 100 * partial, height: 100 }, cp);
          inner.setAttribute("clip-path", `url(#${id})`);
        }
        Loom.tween(g, { opacity: 0, scale: 0.55, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.22, ease: E_().enter }, times[i], meta("pop", Et.name + "." + i));
      }
      const ny = y + rows * cell + 12;
      const finalS = (o.prefix || "") + fmtN(total, o.decimals) + (o.suffix || "");
      const num = K.text(Et.inner, finalS, { role: "title", x: pad, y: ny, w: w * 0.55, h: numH - 10, weight: 700, maxLines: 1, color: "ink" });
      num.setAttribute("style", "font-variant-numeric: tabular-nums");
      if (o.label) K.text(Et.inner, o.label, { role: "label", x: pad + (num.__fit ? num.__fit.width : w * 0.4) + 14, y: ny + 14, w: Math.max(80, w - 2 * pad - (num.__fit ? num.__fit.width : w * 0.4) - 14), h: numH - 22, maxLines: 2, color: "muted", valign: "middle" });
      const span = num.firstChild || num;
      Loom.drive((e, p) => {
        const t = at + p * (by + 0.3 - at);
        let k = 0; for (let i = 0; i < n; i++) if (times[i] <= t + 1e-6) k = i + 1;
        const v = k === n ? total : k * per;
        span.textContent = (o.prefix || "") + fmtN(v, o.decimals) + (o.suffix || "");
      }, at, by + 0.3 - at, "linear", { kind: "count", beat: beatId(), name: Et.name + ".count", content: true, key: "isotally:" + Et.name });
      Loom.tween(Et.inner, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: E_().enter }, at - 0.35, meta("reveal", Et.name));
      Et.revealT = at - 0.35; Et.revealKind = "reveal";
      (Loom.report.data = Loom.report.data || []).push({ beat: beatId(), builder: "iso_tally", name: Et.name, values: { n, per, partial, total, unit: o.unit || pick, label: o.label || null } });
      return { t: by + 0.3, total, times };
    };
    /** iso units piling up ON the board (crates on a dock, servers filling a row): {kind, n, cols, rows, x, y, z, at, by,
     *  per, label (a pin whose number counts with the units), tok, gap}. Units arrive by dropping in, faster and faster */
    B.stack = function (sname, o) {
      o = o || {};
      const n = o.n || 12, kname = o.kind || "crate", cols = o.cols || 4, rows = o.rows || 3, per = o.per || 1;
      const at = o.at == null ? B.t0 + 0.5 : o.at, by = o.by == null ? at + clamp(n * 0.12, 1, 4) : o.by;
      const times = schedule(n, at, by, o.even);
      const probe = buildKind(kname, o, 0), sx = probe.Lx + (o.gap == null ? 0.08 : o.gap), sy = probe.Ly + (o.gap == null ? 0.08 : o.gap), sz = probe.H;
      const units = [];
      for (let i = 0; i < n; i++) {
        const layer = Math.floor(i / (cols * rows)), j = i % (cols * rows), r = Math.floor(j / cols), c = j % cols;
        units.push(B.put(kname, Object.assign({}, o, { name: `${sname}_${i}`, x: (o.x || 0) + c * sx, y: (o.y || 0) + r * sy, z: (o.z || 0) + layer * sz, at: times[i], enter: "drop", dur: 0.38, label: null })));
      }
      const total = n * per;
      let pn = null;
      // the unit the count pin stands on: the one nearest the middle of the top layer (an item, so the pin keeps its
      // colour while the stack is in focus; it follows the focus of all the units, `of`)
      const per1 = cols * rows, top0 = Math.floor((n - 1) / per1) * per1, rowsTop = Math.min(rows, Math.ceil((n - top0) / cols));
      const offMid = (i) => { const j = i % per1; return Math.hypot(j % cols - (cols - 1) / 2, Math.floor(j / cols) - (rowsTop - 1) / 2); };
      let ai = top0;
      for (let i = top0; i < n; i++) if (offMid(i) < offMid(ai) - 1e-9) ai = i;
      const anchor = units[ai];
      if (o.label) {
        pn = B.pin(anchor, (o.prefix || "") + fmtN(0, o.decimals) + (o.suffix || ""), { at: at - 0.3, widest: (o.prefix || "") + fmtN(total, o.decimals) + (o.suffix || ""), sub: o.label, tok: o.pinTok || o.tok || KINDS[kname].tok, side: o.side, name: o.pinName || sname + "_count", of: units });
        pn.live(at, by + 0.4, (t) => { let k = 0; for (let i = 0; i < n; i++) if (times[i] + 0.3 <= t + 1e-6) k = i + 1; return (o.prefix || "") + fmtN(k * per, o.decimals) + (o.suffix || ""); });
      }
      (Loom.report.data = Loom.report.data || []).push({ beat: beatId(), builder: "iso_stack", name: sname, values: { n, per, total, unit: kname, label: o.label || null } });
      return { units, anchor, pin: pn, t: by + 0.4, total, times };
    };

    // ================================================================ the teaching register
    /** a station: a plate with one object on it and a pin. {x, y, w, d, tok, kind, obj: {...}, label, sub, at, side} */
    B.station = function (sname, o) {
      o = o || {};
      const at = o.at == null ? B.t0 + 0.4 : o.at, w = o.w || 2.4, d = o.d || 2.4;
      const plate = B.put("plate", { name: sname + "_plate", x: o.x, y: o.y, w, d, tok: o.tok || "accent2", at, enter: "rise", role: o.role, subject: o.subject, context: true });
      let obj = null;
      if (o.kind) {
        const probe = buildKind(o.kind, Object.assign({}, o.obj || {}), DIRS[(o.obj && o.obj.dir) || "+x"]);
        obj = B.put(o.kind, Object.assign({ name: sname + "_obj", context: true }, o.obj || {}, { x: o.x + (w - probe.Lx) / 2, y: o.y + (d - probe.Ly) / 2, z: 0.16, at: at + 0.3, subject: o.subject }));
      }
      let pn = null;
      if (o.label) pn = B.pin(obj || plate, o.label, { at: at + 0.75, tok: o.tok || "accent2", sub: o.sub, side: o.side, name: o.pinName || sname + "_pin", until: o.until });
      return { plate, obj, pin: pn, t: at + 1.1 };
    };
    /** a three-step (or n-step) flow: stations along an axis joined by ground arrows, revealed in order over [at, by] */
    B.flow = function (fname, o) {
      o = o || {};
      const steps = o.steps || [], n = steps.length, axis = o.axis || "x", w = o.w || 2.4, d = o.d || 2.4, gap = o.gap == null ? 1.6 : o.gap;
      const at = o.at == null ? B.t0 + 0.4 : o.at, by = o.by == null ? at + n * 1.6 : o.by, slot = (by - at) / Math.max(1, n);
      const out = { stations: [], routes: [] };
      // axis "row": the stations step along (+x, -y), so on screen they stand in one horizontal row; the arrows between
      // them run along the grid and turn one corner (one axis at a time)
      const st = axis === "row" ? (o.step || Math.max(w, d) + gap) : 0;
      // widen: open close on the first station and pull back as each one arrives (the cameras come first: pins place by them)
      if (o.widen) {
        const wb = steps.map((s, i) => { const x = (o.x || 0) + (axis === "x" ? i * (w + gap) : axis === "row" ? i * st : 0), y = (o.y || 0) + (axis === "y" ? i * (d + gap) : axis === "row" ? -i * st : 0); return [x, y, 0, x + w, y + d, 1.6]; });
        B.widen(wb.map((b, i) => [at + i * slot - (i ? 0.1 : 0.4), B.worldRect(b)]), typeof o.widen === "object" ? o.widen : {});
      }
      steps.forEach((s, i) => {
        const x = (o.x || 0) + (axis === "x" ? i * (w + gap) : axis === "row" ? i * st : 0), y = (o.y || 0) + (axis === "y" ? i * (d + gap) : axis === "row" ? -i * st : 0);
        const ti = at + i * slot;
        const label = o.numbered === false ? s.label : `${i + 1}  ${s.label}`;
        out.stations.push(B.station(`${fname}_${i + 1}`, { x, y, w, d, tok: s.tok || o.tok || "accent2", kind: s.kind, obj: s.obj, label, sub: s.sub, at: ti, side: s.side || o.side, role: s.role, subject: s.subject, until: o.until }));
        if (i < n - 1) {
          let pts;
          if (axis === "row") pts = [[x + w + 0.15, y + d / 2], [x + st + w / 2, y + d / 2], [x + st + w / 2, y - st + d + 0.2]];
          else if (axis === "x") pts = [[x + w + 0.15, y + d / 2], [x + w + gap - 0.2, y + d / 2]];
          else pts = [[x + w / 2, y + d + 0.15], [x + w / 2, y + d + gap - 0.2]];
          out.routes.push(B.route(`${fname}_r${i + 1}`, pts, { tok: o.routeTok || "line", width: 5, at: ti + slot * 0.62, dur: Math.min(0.6, slot * 0.35) }));
        }
      });
      out.t = by;
      return out;
    };
    /** iso bars: columns that grow (an exact extrusion) to their values, each with a pin whose number counts with the
     *  growth. {x, y, values: [{label, value, tok}], max, height (world units at max), w, d, gap, at, by, unit, decimals} */
    B.bars = function (bname, o) {
      o = o || {};
      const vals = o.values || [], n = vals.length, max = o.max || Math.max(...vals.map((v) => v.value), 1), H = o.height || 3.2;
      const w = o.w || 0.9, d = o.d || 0.9, gap = o.gap == null ? 0.9 : o.gap;
      const at = o.at == null ? B.t0 + 0.4 : o.at, by = o.by == null ? at + n * 0.7 : o.by, slot = (by - at) / Math.max(1, n);
      const out = { bars: [], pins: [] };
      vals.forEach((v, i) => {
        const st = w + gap, row = o.axis === "row";
        const h = Math.max(0.06, H * v.value / max), x = (o.x || 0) + i * st, y = (o.y || 0) - (row ? i * st : 0), ti = at + i * slot;
        // each column stands on its own thin tile, so the row reads as one chart with a common baseline
        if (o.base !== false) B.put("plate", { name: `${bname}_${i}_base`, x: x - 0.2, y: y - 0.2, w: w + 0.4, d: d + 0.4, h: 0.08, tok: "surface2", top: "surface", dashed: false, at: at - 0.3 + i * 0.06, enter: "rise", dur: 0.4, context: true });
        const it = B.put("box", { name: `${bname}_${i}`, x, y, w, d, h, z: o.base !== false ? 0.08 : 0, tok: v.tok || o.tok || "accent2", at: ti, enter: "rise", dur: 0.9, role: o.role, subject: v.subject, context: !v.subject });
        const txt = (val) => (o.prefix || "") + fmtN(val, o.decimals) + (o.unit ? " " + o.unit : "");
        const pn = B.pin(it, txt(v.value), { at: ti + 0.15, leader: false, sub: v.label, tok: v.tok || o.tok || "accent2", widest: txt(v.value), name: `${bname}_${i}_pin`, bar: false, until: o.until });
        pn.live(ti + 0.15, ti + 1.05, (t) => txt(v.value * Loom.ease.enter(clamp((t - ti) / 0.9, 0, 1))));
        out.bars.push(it); out.pins.push(pn);
      });
      out.t = by + 0.9;
      return out;
    };
    /** a flat note card beside the board (teaching words): {title, body, tok (its legend chip), index, at}. E is the
     *  scene's element for the card; its height hugs the words */
    B.note = function (En, o) {
      o = o || {};
      const K = Loom.kit, w = En.w, pad = 26, at = o.at == null ? B.t0 + 0.6 : o.at;
      const chip = 30, tx = pad + chip + 16;
      const Ft = K.fit(o.title || "", { role: "lead", w: w - tx - pad, maxLines: 2, weight: 600 });
      const Fb = o.body ? K.fit(o.body, { role: "body", w: w - 2 * pad, maxLines: o.bodyLines || 3 }) : null;
      const h = Math.max(En.h || 0, pad + Math.max(Ft.height, chip) + (Fb ? 14 + Fb.height : 0) + pad);
      En.h = h; En.outer.setAttribute("data-h", h);
      if (o.place === "auto") placeCard(En, at);
      card(En.inner, w, h);
      cube(En.inner, pad + chip / 2, pad + chip / 2 + 2, chip * 0.52, o.tok || "accent2");
      if (o.index != null) K.text(En.inner, String(o.index).padStart(2, "0"), { role: "caption", x: w - pad - 50, y: pad - 4, w: 50, h: 34, align: "right", color: "muted", maxLines: 1 });
      K.text(En.inner, o.title || "", { role: "lead", x: tx, y: pad, w: w - tx - pad - (o.index != null ? 50 : 0), h: Ft.height, weight: 600, maxLines: 2, color: "ink" });
      if (Fb) K.text(En.inner, o.body, { role: "body", x: pad, y: pad + Math.max(Ft.height, chip) + 14, w: w - 2 * pad, h: Fb.height, maxLines: o.bodyLines || 3, color: "muted" });
      Loom.tween(En.inner, { opacity: 0, x: o.from === "left" ? -16 : 16 }, { opacity: 1, x: 0, duration: 0.45, ease: E_().enter }, at, meta("reveal", En.name));
      En.revealT = at; En.revealKind = "reveal";
      return at + 0.45;
    };
    // a card beside the board goes to the free corner: where it covers the fewest solids and no pin at its time
    function placeCard(En, at) {
      const cam = B.camAt(at), w = En.w, h = En.h, top = Math.max(96, (B.topSafe || 0) + 10);
      const C = [[En.x, En.y], [1824 - w, top], [96, top], [96, 930 - h], [1824 - w, 930 - h]];
      const solids = B.items.filter((it) => it.t0 == null || it.t0 <= at + 0.5).map((it) => { const r = itemRect(it, at), a = B.toScreen(r.x, r.y, cam), b = B.toScreen(r.x + r.w, r.y + r.h, cam); return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1], s: it.subject ? 6 : 1 }; });
      const pins = B.pins.filter((pn) => pn.at <= at + 0.5 && (pn.until == null || pn.until > at)).map((pn) => pn.screenRect(at));
      const ov = (r, q) => Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) * Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y));
      let best = null;
      C.forEach(([x, y], i) => {
        const R = { x: x - 12, y: y - 12, w: w + 24, h: h + 24 };
        let sc = i === 0 ? -1 : 0;
        for (const q of solids) sc += ov(R, q) * q.s / 1000;
        for (const q of pins) sc += ov(R, q) / 50;
        if (!best || sc < best.sc) best = { sc, x, y };
      });
      Loom.kit.place(En, Math.round(best.x), Math.round(best.y));
    }
    /** a legend: one row per hue (a small iso cube and its meaning). Records the hues so a second meaning is caught */
    B.legend = function (El, entries, o) {
      o = o || {};
      const K = Loom.kit, pad = 22, rowH = 46, at = o.at == null ? B.t0 + 0.6 : o.at;
      const h = pad * 2 + (o.title ? 40 : 0) + entries.length * rowH;
      El.h = Math.max(El.h || 0, h); El.outer.setAttribute("data-h", El.h);
      card(El.inner, El.w, h);
      let y = pad;
      if (o.title) { K.text(El.inner, o.title, { role: "caption", x: pad, y, w: El.w - 2 * pad, h: 32, color: "muted", maxLines: 1 }); y += 40; }
      entries.forEach(([tok, label], i) => {
        const g = svg("g", { opacity: 0 }, El.inner);
        cube(g, pad + 14, y + rowH / 2, 13, tok);
        K.text(g, label, { role: "label", x: pad + 40, y: y + 4, w: El.w - pad * 2 - 40, h: rowH - 8, valign: "middle", maxLines: 1, color: "ink" });
        Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at + 0.1 + i * 0.12, meta("reveal", El.name));
        const prev = B.legendMap[tok];
        if (prev && prev !== label && !NEUTRAL.has(tok)) Loom.warn("iso_hue_two_meanings", `${beatId()}: the legend says ${tok} is "${label}", the board already uses it for "${prev}"`, { beat: beatId() });
        B.legendMap[tok] = label;
        y += rowH;
      });
      Loom.tween(El.inner, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at, meta("reveal", El.name));
      El.revealT = at; El.revealKind = "reveal";
      return at + 0.3 + entries.length * 0.12;
    };
    /** words laid ON the board's plane (isometric type, along x or y): a title on the ground, a zone name */
    B.floorText = function (fname, text, o) {
      o = o || {};
      const K = Loom.kit, role = o.role || "title", axis = o.axis || "x";
      const F = K.fit(text, { role, w: o.w || 900, maxLines: 1, weight: 700 });
      const Ef = B.ctx.el(fname, { parent: B.Ldecal, x: 0, y: 0, w: Math.ceil(F.width) + 4, h: Math.ceil(F.height) + 4, kind: "text", layout: "fixed", exit: "recede" });
      const [X, Y] = B.P(o.x || 0, o.y || 0, (o.z || 0) + 0.01);
      const m = axis === "x" ? `matrix(${C30.toFixed(4)} 0.5 ${(-C30).toFixed(4)} 0.5 ${f1(X)} ${f1(Y)})` : `matrix(${(-C30).toFixed(4)} 0.5 ${C30.toFixed(4)} 0.5 ${f1(X)} ${f1(Y)})`;
      const g = svg("g", { transform: m }, Ef.inner);
      const t = K.text(g, text, { role, x: 0, y: 0, w: Math.ceil(F.width) + 4, h: Math.ceil(F.height) + 4, weight: 700, maxLines: 1, color: o.tok || "ink", tracking: o.tracking });
      const at = o.at == null ? B.t0 + 0.3 : o.at;
      Loom.tween(Ef.inner, { opacity: 0 }, { opacity: o.opacity || 1, duration: 0.5, ease: E_().enter }, at, meta("reveal", fname));
      Ef.revealT = at; Ef.revealKind = "reveal";
      return { el: Ef, text: t };
    };
    /** a pin on one stratum of the board's edge (the cross-section tells a story: network, power, foundations) */
    B.stratumPin = function (i, text, o) {
      const st = B.strata[i];
      if (!st) { Loom.warn("iso_no_stratum", `${beatId()}: board ${name} has no stratum ${i}`, { beat: beatId() }); return null; }
      return B.pin([B.w * (o && o.along != null ? o.along : 0.5), B.d, (st.z0 + st.z1) / 2], text, Object.assign({ tok: st.tok, side: "down-left" }, o || {}));
    };

    // ================================================================ every frame: the camera, movers, pins, rings, flows
    B.render = function (t) {
      const c = camAt(t);
      for (const ins of B.insets) {
        if (!ins.follow) continue;
        const a = ins.anchor(t), q = B.P(a[0], a[1], a[2] || 0), A = toScreen(q[0], q[1], c);
        ins.u.setAttribute("transform", `translate(${f1(ins.cx)} ${f1(ins.cy)}) scale(${ins.z}) translate(${f1(-q[0])} ${f1(-q[1] - ins.lift)})`);
        const lx = A[0] - ins.Ei.x, ly = A[1] - ins.Ei.y, dx = ins.cx - lx, dy = ins.cy - ly, dl = Math.hypot(dx, dy) || 1;
        const ex = ins.cx - dx / dl * ins.r, ey = ins.cy - dy / dl * ins.r;
        ins.lead.setAttribute("d", `M${f1(lx)},${f1(ly)} L${f1(ex)},${f1(ey)}`);
        if (t >= ins.at + 0.36) ins.lead.setAttribute("stroke-dasharray", `${(Math.hypot(ex - lx, ey - ly) + 2).toFixed(1)} 4000`);
        ins.dotA.setAttribute("cx", f1(lx)); ins.dotA.setAttribute("cy", f1(ly));
      }
      B.camG.setAttribute("transform", `translate(960 540) scale(${c.k.toFixed(4)}) translate(${f1(-c.cx)} ${f1(-c.cy)})`);
      if (B.dirty) B.sort();
      // moving items: their place, their facing, and their place in the painter's order at this time
      const movers = B.items.filter((it) => it.dynamic);
      if (movers.length) {
        for (const m of movers) {
          const pos = posAt(m, t), k = dirAt(m, t), V = m.variants[k] || variant(m, k);
          if (m.cur !== V) { m.cur.g.setAttribute("display", "none"); if (m.cur.sh) m.cur.sh.setAttribute("display", "none"); V.g.setAttribute("display", "inline"); if (V.sh) V.sh.setAttribute("display", "inline"); m.cur = V; }
          fitSupport(m, t, pos);
          place(m, pos);
        }
        // the whole painter's order again at this time, by the same pairwise rule as the standing sort (only pairs that
        // overlap on screen are ordered, so standing pairs keep their order); an item inside a host draws after it, and a
        // mover after the route it rides
        const list = B.items.filter((it) => it.layer === B.Lsolid).concat(B.segs);
        const seq = topo(list, (it) => sortBox(it, t), mustBefore);
        for (const it of seq.slice()) {
          const host = it.o.inside; if (!host) continue;
          const i = seq.indexOf(it), h = seq.indexOf(host);
          if (h > i) { seq.splice(i, 1); seq.splice(seq.indexOf(host) + 1, 0, it); }
        }
        // the document order follows the sequence (from the back: each group just before the one after it)
        let nxG = null;
        for (let j = seq.length - 1; j >= 0; j--) {
          const g = seq[j].g;
          if (nxG) { if (g.nextSibling !== nxG) B.Lsolid.insertBefore(g, nxG); } else if (B.Lsolid.lastChild !== g) B.Lsolid.appendChild(g);
          nxG = g;
        }
      }
      // pins follow their anchors; a pin whose plate would leave the frame fades instead of being cut
      for (const pn of B.pins) {
        const dl = pinDelta(pn, t);
        pn.el.mover.setAttribute("transform", Math.abs(dl[0]) + Math.abs(dl[1]) > 0.05 ? `translate(${f1(dl[0])} ${f1(dl[1])})` : "");
        const x = pn.ox + dl[0], y = pn.oy + dl[1];
        const inside = Math.min(x - 12, 1908 - (x + pn.pw), y - (B.topSafe == null ? 20 : B.topSafe), 935 - (y + pn.ph));
        let a = clamp((inside + 30) / 30, 0, 1);
        if (B.focusEv.length) { const of = pn.of; a *= 1 - 0.6 * (Array.isArray(of) ? Math.min(...of.map((x) => focusAt(x, t))) : focusAt(of || NOBODY, t)); }
        pn.vis.setAttribute("opacity", a.toFixed(3));
      }
      // rings round tracked subjects, with a calm pulse (period 1.8 s)
      for (const r of B.rings) {
        const p = posAt(r.item, t), q = B.P(p[0], p[1], p[2]);
        r.g.setAttribute("transform", `translate(${f1(q[0])} ${f1(q[1])})`);
        const ph = ((t - r.at) % 1.8 + 1.8) % 1.8 / 1.8;
        r.pulse.setAttribute("points", ptsStr(r.sh(r.ell(r.R * (1 + 0.45 * ph)))));
        r.pulse.setAttribute("opacity", (t >= r.at ? 0.6 * (1 - ph) : 0).toFixed(3));
      }
      // flows: diamonds evenly spaced, running along their route
      // (on a sorted air route each pulse moves into the group of the segment it is on, so it shares that segment's depth)
      for (const fl of B.flows) {
        const on = t >= fl.t0 && t <= fl.t1 + 0.3, op = on ? clamp(Math.min(t - fl.t0, fl.t1 + 0.3 - t) / 0.3, 0, 1).toFixed(3) : 0;
        if (fl.R.segs) { fl.g.setAttribute("opacity", 1); for (const d of fl.dots) d.setAttribute("opacity", op); }
        else fl.g.setAttribute("opacity", op);
        if (!on) continue;
        for (let i = 0; i < fl.n; i++) {
          const s = ((t - fl.t0) * fl.speed / fl.R.len + i / fl.n) % 1, pt = fl.R.pointAt(s), P = pt.p, z = fl.sz;
          const D = [[P[0], P[1] - z, P[2] + 0.06], [P[0] + z, P[1], P[2] + 0.06], [P[0], P[1] + z, P[2] + 0.06], [P[0] - z, P[1], P[2] + 0.06]].map((p) => B.P(p[0], p[1], p[2]));
          fl.dots[i].setAttribute("points", ptsStr(D));
          if (fl.R.segs) { const sg = fl.R.segs[pt.seg].g; if (fl.dots[i].parentNode !== sg) sg.appendChild(fl.dots[i]); }
        }
      }
    };
    /** the painter's order of everything standing on the board (done for you; call it after building if you like) */
    B.sort = function () {
      // first what each standing item rests on (its height cue), and the stems of air routes
      for (const it of B.items) if (!it.dynamic) { fitSupport(it, null, it.pos); place(it, it.pos); }
      for (const R of B.routes) if (R.fitStems) R.fitStems();
      const list = B.items.filter((it) => it.layer === B.Lsolid).concat(B.segs);
      B.order = topo(list, (it) => sortBox(it, it.t0 == null ? 0 : it.t0), mustBefore);
      // an item put INSIDE another (a forklift in a cut-away hall, a person in a room) draws just after its host
      for (const it of B.order.slice()) {
        const host = it.o.inside;
        if (!host) continue;
        const i = B.order.indexOf(it), h = B.order.indexOf(host);
        if (h > i) { B.order.splice(i, 1); B.order.splice(B.order.indexOf(host) + 1, 0, it); }
      }
      for (const it of B.order) B.Lsolid.appendChild(it.g);
      B.dirty = false;
      const bad = clashesInTime();
      if (bad.length) Loom.warn("iso_order", `board ${name}: ${bad.length} pair(s) of objects share space at the same time and cannot be drawn in a true order (${bad.slice(0, 3).map((q) => `${q[0]} over ${q[1]} at ${q[2].toFixed(1)}s`).join("; ")}); move them apart, time them apart, or put one inside the other ({inside: host})`, {});
      return B;
    };
    /** pairs of objects that cannot be drawn in a true order, AT THE SAME TIME: an item lives from its entrance to the
     *  middle of its exit, a mover is looked at along its moves (every 0.08 s), so a stream of crates that pass one point
     *  one after another is fine and only two things in one space at one moment are named. Standing pairs are also named
     *  when the sort had to break a cycle between them. Returns [[a, b, t], ...] */
    function clashesInTime() {
      const solo = B.items.filter((it) => it.layer === B.Lsolid && !it.o.inside && !B.items.some((q) => q.o.inside === it));
      const life = solo.map(lifeOf);
      const samp = solo.map((it) => {
        if (!it.dynamic) return null;
        const T = [];
        for (const m of it.moves) { const n = clamp(Math.ceil((m.t1 - m.t0) / 0.08), 2, 120); for (let i = 0; i <= n; i++) T.push(m.t0 + (m.t1 - m.t0) * i / n); }
        return T;
      });
      const grow = (b, q) => { for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], q[k]); b[k + 3] = Math.max(b[k + 3], q[k + 3]); } return b; };
      const sweep = solo.map((it, i) => (samp[i] || []).reduce((b, t) => grow(b, itemBox(it, t)), itemBox(it, -1e9).slice()));
      const inter = (p, q) => Math.min(p[3], q[3]) - Math.max(p[0], q[0]) > 0.02 && Math.min(p[4], q[4]) - Math.max(p[1], q[1]) > 0.02 && Math.min(p[5], q[5]) - Math.max(p[2], q[2]) > 0.02;
      const bad = [], seen = new Set();
      for (let i = 0; i < solo.length; i++) for (let j = i + 1; j < solo.length; j++) {
        const lo = Math.max(life[i][0], life[j][0]), hi = Math.min(life[i][1], life[j][1]);
        if (!(lo < hi) || !inter(sweep[i], sweep[j])) continue;
        const T = [isFinite(lo) ? lo : -1e9].concat(samp[i] || [], samp[j] || []).filter((t) => t >= lo && t < hi);
        for (const t of T) if (inter(itemBox(solo[i], t), itemBox(solo[j], t))) { bad.push([solo[j].id, solo[i].id, Math.max(0, t)]); seen.add(solo[i].id + "|" + solo[j].id); break; }
      }
      // standing items the sort put against their separating axis (a cycle it had to break), while both are there
      const st = new Set(solo.filter((it) => !it.dynamic)), ord = B.order.filter((x) => st.has(x));
      const Bx = ord.map((it) => sortBox(it, 0)), SB = Bx.map(sbox), L = ord.map(lifeOf);
      for (let i = 0; i < ord.length; i++) for (let j = i + 1; j < ord.length; j++) {
        if (Math.max(L[i][0], L[j][0]) >= Math.min(L[i][1], L[j][1])) continue;
        if (!(sover(SB[i], SB[j]) && behind(Bx[j], Bx[i]) && !behind(Bx[i], Bx[j]))) continue;
        if (seen.has(ord[i].id + "|" + ord[j].id) || seen.has(ord[j].id + "|" + ord[i].id)) continue;
        bad.push([ord[j].id, ord[i].id, Math.max(0, L[i][0], L[j][0])]);
      }
      return bad;
    }
    B.clashes = clashesInTime;
    B.done = B.sort;
    for (const k of Object.keys(ItemProto)) B["_" + k] = ItemProto[k];
    B.ItemProto = ItemProto;
    // one clock for the board: everything that moves is a pure function of t
    if (Loom.clock) Loom.clock((t) => { if (B.live) B.render(t); });
    return B;
  }

  // A move's drive is on the timeline only so the report sees the motion: the board's ONE clock draws every frame from t.
  // The drives used to draw too, each at its own time, and a seek that jumped over several moves left the last one's
  // picture up after the clock had drawn the right one: st-iso-order b05 showed the whole board for a frame at 31.8 s in
  // a close-up, and a jump to 31.7 s showed a framing from earlier in the film (D-190). They draw nothing now.
  const SEEN = () => {};
  // items get their methods from the board's prototype object (one per board, so `B` is in scope)
  const _put0 = board;
  function boardWithItems(ctx, opts) {
    const B = _put0(ctx, opts);
    if (B.__wrapped) return B;
    const put0 = B.put;
    B.put = function (k, o) {
      const it = put0(k, Object.assign({}, o || {}, { at: undefined }));
      if (!it) return it;
      Object.setPrototypeOf(it, B.ItemProto);
      const at = o && o.at;
      if (at != null) {
        const def = KINDS[k];
        it.enter(at, (o && o.enter) || (def.ground ? "draw" : (/^(building|factory|store|box|slab|cylinder|shelf|rack|database|stairs|ramp|plate|screen)$/.test(k) ? "rise" : "drop")), o);
      }
      return it;
    };
    B.__wrapped = true;
    return B;
  }

  // a flat card beside the board: white, a hairline in the ink at low strength, no shadow (the board's are the only ones)
  function card(g, w, h) {
    Loom.kit.rect(g, 0, 0, w, h, { fill: "surface", r: 10, crisp: true, shadow: false });
    svg("rect", { x: 0.5, y: 0.5, width: w - 1, height: h - 1, rx: 10, fill: "none", stroke: S().c("line"), "stroke-width": 1.2, opacity: 0.16 }, g);
  }
  // a small iso cube (a legend chip) in screen px: three tones of the token
  function cube(g, cx, cy, s, tok) {
    const T = tones(tok), h = s;
    const top = [[cx, cy - h], [cx + s * C30, cy - h + s * 0.5], [cx, cy - h + s], [cx - s * C30, cy - h + s * 0.5]];
    const left = [[cx - s * C30, cy - h + s * 0.5], [cx, cy - h + s], [cx, cy + s], [cx - s * C30, cy + s * 0.5]];
    const right = [[cx, cy - h + s], [cx + s * C30, cy - h + s * 0.5], [cx + s * C30, cy + s * 0.5], [cx, cy + s]];
    svg("polygon", { points: ptsStr(left), fill: T.left }, g);
    svg("polygon", { points: ptsStr(right), fill: T.right }, g);
    svg("polygon", { points: ptsStr(top), fill: T.top }, g);
    return g;
  }

  // ---------------------------------------------------------------- audit (boot and the lab call it after every scene)
  // the painter's order of every board, then what a frame must not do: too many legend hues, too many pins at once
  function audit() {
    for (const B of BOARDS) {
      B.sort();
      const hues = new Set(B.items.map((it) => it.tok).filter((t) => t && !NEUTRAL.has(t) && !/^(concrete|steel|road|glass|leaf|water|soil|wood)$/.test(t)));
      if (hues.size > 6) Loom.warn("iso_hues", `board ${B.name}: ${hues.size} legend hues (${[...hues].join(", ")}); seven categories is the most a reader separates, five reads calmly`, {});
      const ev = [];
      for (const p of B.pins) { ev.push([p.at, 1]); if (p.until != null) ev.push([p.until, -1]); }
      ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let n = 0, worst = 0, when = 0;
      for (const [t, dlt] of ev) { n += dlt; if (n > worst) { worst = n; when = t; } }
      if (worst > 7) Loom.warn("iso_dense", `board ${B.name}: ${worst} pins on screen at ${when.toFixed(1)}s; at most 7 a frame (5 in the teaching register): give pins an until, or cut to a closer view`, {});
      if (B.live) B.render(0);
    }
  }

  const api = {
    board: boardWithItems,
    audit,
    /** the three tones of a token: {base, top, left, right, cut} */
    tones(tok) { return Object.assign({}, tones(tok)); },
    /** the object kinds the library builds */
    kinds() { return Object.keys(KINDS); },
    /** a kind's parts and size for given options (no drawing): {Lx, Ly, H, parts: [...]} */
    describe(k, o) { const g = buildKind(k, o || {}, DIRS[(o && o.dir) || "+x"]); return { Lx: g.Lx, Ly: g.Ly, H: g.H, parts: [...new Set(g.prims.map((p) => p.part))] }; },
    /** a flat Isotype pictogram into a group: W.icon(g, "person", cx, cy, size, tok) */
    /** the pictogram for a noun ("requests" -> request), or null */
    iconFor(words) { return iconForNoun(words); },
    icon(g, k, cx, cy, size, tok) { const gg = svg("g", { transform: `translate(${f1(cx)} ${f1(cy)}) scale(${(size / 100).toFixed(4)})` }, g); (PICTO[k] || PICTO.person)(gg, tones(tok || "accent2").base, S().c("surface")); return gg; },
    /** a legend chip: a small iso cube in a token's three tones */
    cube(g, cx, cy, s, tok) { return cube(g, cx, cy, s, tok); },
    /** arrival times that accelerate (Isotype accumulation): W.schedule(n, t0, t1) */
    schedule(n, t0, t1, even) { const out = [], a = 2.1; for (let i = 0; i < n; i++) out.push(t0 + (t1 - t0) * (even ? (n > 1 ? i / (n - 1) : 0) : Math.pow(n > 1 ? i / (n - 1) : 0, 1 / a))); return out; },
  };
  Loom.engines.define("isometric", { version: "1", summary: "an isometric infographic of a working system on one floating diorama board: true 30 degree projection, three tones per face from one token, no outlines on solids, a parametric object library (27 kinds with named parts, a screen that shows charts), topological painter's sort re-run per frame while things move, a time-aware order check, height cues for floating things, air routes sorted among the solids, routes with moving things and flows, map pins that never cover the subject, cutaways, focus and context, a live circular inset, a tracked subject ring, Isotype tallies and stacks that add up, iso bars and three-step flows for teaching, and a log-zoom camera within the board", api });
})();
