/* Loom morph (D-114): one drawn shape BECOMES another (a cell becomes a coin, a circle becomes a map outline, an
 * icon becomes the next scene's field). The most-cited missing primitive in the 96-film TED-Ed study.
 *
 * API
 *   Loom.morph.to(path, toD, t, {dur, ease, fill: [fromTok, toTok] | toTok, stroke: [..] | tok, samples, hz})  -> end time
 *       path: an SVG <path> (or an element E / group holding one). toD: a d string, or {kind, box, ...} for shape().
 *       The FROM shape is the path's last scheduled shape (so calls chain), or o.from.
 *   Loom.morph.chain(path, [d1, d2, d3], times | t0, {fills: [tok1, tok2, tok3], strokes, hold, dur, ...}) -> end time
 *   Loom.morph.fill(ctx, name, {from: d | pathEl, t, dur, token, fromToken, bleed}) -> element E (E.path, E.endT)
 *       a FILL JOIN: the shape grows (morphs) into the whole 1920x1080 frame in `token`, so the next scene can start
 *       on that field colour. Given a path element as `from`, it takes over from it seamlessly (same place, same
 *       colour) and hides it.
 *   Loom.morph.shape(kind, box, o) -> d     kind: rect (o.r) | circle | ellipse | polygon (o.n, o.rot) | star (o.n, o.inner, o.rot)
 *   Loom.morph.reverse(d) -> d              the same shape wound the other way: shape(..) + reverse(shape(..)) is a ring
 *   Loom.morph.path(parent, d, {fill, stroke, sw, rule}) -> <path> drawn in the pack's outline habit, ready to morph
 *   Loom.morph.fromElement(el) -> d         rect, circle, ellipse, polygon, polyline, line or path as a path d
 *   Loom.morph.interpolator(dA, dB, samples | {samples, collapse}) -> (p) => d    the pure maths (tests use it)
 *   Loom.motion.morph(...) is sugar for Loom.morph.to(...).
 *
 * How (no library): both paths are parsed (M L H V C S Q T A Z, absolute and relative) into absolute cubic Bezier
 * segments per subpath. Each subpath pair is brought to the same segment count by splitting the longest segment at
 * its arc-length midpoint (exact de Casteljau splits, so corners stay corners and the end shapes are exact). Winding
 * is matched for the whole shape (every B subpath is reversed when B's largest subpath turns the other way from A's,
 * so B's holes stay holes); for open or zero-area pairs the reversed list is tried and the cheaper one kept. The
 * start is aligned by the cyclic offset of B that minimises the total squared distance between corresponding nodes
 * (the first minimum wins). Subpaths are matched by area
 * order; an unmatched subpath shrinks to (or grows from) a point at the centroid of the nearest subpath on the
 * other side (o.collapse "self": its own centroid). Every control point is then interpolated from ONE eased
 * progress value through Loom.drive.
 *
 * Determinism: the parse, the subdivision, the alignment and the formatting are pure arithmetic done once at build
 * time, with fixed tie-breaks (the first minimum wins). The frame writes d = f(progress) with progress from the
 * seeked timeline, so any time seeked in any order gives the same string. No randomness, no clock.
 */
// @capability morph | primitive | Loom.morph.to, chain, shape, fill; m.morph | Primitives from the TED-Ed study | one drawn shape becomes another (a cell becomes a coin), or grows to become the next field
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const M = (Loom.morph = {});
  Loom.report.morphs = Loom.report.morphs || [];

  /* ---------------- parsing: d -> [{segs: [[x0,y0,x1,y1,x2,y2,x3,y3]...], closed}] ---------------- */
  function bad(msg) { const e = new Error(msg); e.morph = true; return e; }

  function tokenize(d) {
    const out = []; let i = 0; const n = d.length;
    const isCmd = (c) => /[MmLlHhVvCcSsQqTtAaZz]/.test(c);
    while (i < n) {
      const c = d[i];
      if (isCmd(c)) { out.push(c); i++; continue; }
      if (/[\s,]/.test(c)) { i++; continue; }
      const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i, i + 64));
      if (!m) throw bad(`unreadable path data near "${d.slice(i, i + 12)}"`);
      out.push(m[0]); i += m[0].length;
    }
    return out;
  }
  const line = (x0, y0, x1, y1) => [x0, y0, x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3, x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3, x1, y1];

  function arcToCubics(x1, y1, rx, ry, phiDeg, fa, fs, x2, y2) {
    if (Math.abs(x1 - x2) < 1e-9 && Math.abs(y1 - y2) < 1e-9) return [];
    rx = Math.abs(rx); ry = Math.abs(ry);
    if (!rx || !ry) return [line(x1, y1, x2, y2)];
    const phi = phiDeg * Math.PI / 180, cs = Math.cos(phi), sn = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = cs * dx + sn * dy, yp = -sn * dx + cs * dy;
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
    const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, den = rx * rx * yp * yp + ry * ry * xp * xp;
    const coef = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
    const cxp = coef * rx * yp / ry, cyp = -coef * ry * xp / rx;
    const cx = cs * cxp - sn * cyp + (x1 + x2) / 2, cy = sn * cxp + cs * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const ux = (xp - cxp) / rx, uy = (yp - cyp) / ry, vx = (-xp - cxp) / rx, vy = (-yp - cyp) / ry;
    const th1 = ang(1, 0, ux, uy);
    let dth = ang(ux, uy, vx, vy);
    if (!fs && dth > 0) dth -= 2 * Math.PI;
    if (fs && dth < 0) dth += 2 * Math.PI;
    const nseg = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2) - 1e-9));
    const delta = dth / nseg, k = (4 / 3) * Math.tan(delta / 4);
    const map = (u, v) => [cx + rx * u * cs - ry * v * sn, cy + rx * u * sn + ry * v * cs];
    const out = [];
    for (let i = 0; i < nseg; i++) {
      const a1 = th1 + i * delta, a2 = a1 + delta;
      const e1 = [Math.cos(a1), Math.sin(a1)], e2 = [Math.cos(a2), Math.sin(a2)];
      const p0 = map(e1[0], e1[1]), c1 = map(e1[0] - k * e1[1], e1[1] + k * e1[0]);
      const c2 = map(e2[0] + k * e2[1], e2[1] - k * e2[0]), p3 = map(e2[0], e2[1]);
      out.push([p0[0], p0[1], c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]]);
    }
    out[0][0] = x1; out[0][1] = y1; out[out.length - 1][6] = x2; out[out.length - 1][7] = y2;
    return out;
  }

  M.parse = function (d) {
    if (typeof d !== "string" || !d.trim()) throw bad("empty path data");
    const tk = tokenize(d);
    if (!/^[Mm]$/.test(tk[0] || "")) throw bad("path data must start with M");
    const subs = []; let cur = null;
    let x = 0, y = 0, sx = 0, sy = 0, cmd = null, lastC = null, lastQ = null;
    let i = 0;
    const num = () => { if (i >= tk.length || /[A-Za-z]/.test(tk[i])) throw bad(`missing number after ${cmd}`); return parseFloat(tk[i++]); };
    const flag = () => {
      // arc flags may be written without separators ("a5 5 0 01 10 10")
      const s = tk[i];
      if (s == null || /[A-Za-z]/.test(s)) throw bad("missing arc flag");
      if (s.length > 1 && (s[0] === "0" || s[0] === "1")) { tk[i] = s.slice(1); return +s[0]; }
      i++; const v = parseFloat(s); if (v !== 0 && v !== 1) throw bad("arc flag must be 0 or 1"); return v;
    };
    const seg = (s) => { if (!cur) { cur = { segs: [], closed: false }; subs.push(cur); } cur.segs.push(s); };
    while (i < tk.length) {
      if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
      else if (cmd == null) throw bad("number before any command");
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === "Z") {
        if (cur) { if (Math.hypot(x - sx, y - sy) > 1e-9) cur.segs.push(line(x, y, sx, sy)); cur.closed = true; }
        x = sx; y = sy; cur = null; lastC = lastQ = null;
        continue;
      }
      if (C === "M") {
        x = ox + num(); y = oy + num(); sx = x; sy = y; cur = null; lastC = lastQ = null;
        cmd = rel ? "l" : "L";   // further pairs are implicit linetos
        continue;
      }
      let nl = null;
      if (C === "L") { const nx = ox + num(), ny = oy + num(); nl = line(x, y, nx, ny); }
      else if (C === "H") { const nx = ox + num(); nl = line(x, y, nx, y); }
      else if (C === "V") { const ny = oy + num(); nl = line(x, y, x, ny); }
      else if (C === "C") { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; nl = [x, y, ...a]; lastC = [a[2], a[3]]; }
      else if (C === "S") {
        const c1 = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const a = [ox + num(), oy + num(), ox + num(), oy + num()]; nl = [x, y, c1[0], c1[1], ...a]; lastC = [a[0], a[1]];
      } else if (C === "Q" || C === "T") {
        let q;
        if (C === "Q") q = [ox + num(), oy + num()]; else q = lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y];
        const ex = ox + num(), ey = oy + num();
        nl = [x, y, x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y), ex + 2 / 3 * (q[0] - ex), ey + 2 / 3 * (q[1] - ey), ex, ey]; lastQ = q;
      } else if (C === "A") {
        const rx = num(), ry = num(), rot = num(), fa = flag(), fs = flag(), ex = ox + num(), ey = oy + num();
        for (const s of arcToCubics(x, y, rx, ry, rot, fa, fs, ex, ey)) seg(s);
        x = ex; y = ey; lastC = lastQ = null; continue;
      } else throw bad("unknown command " + cmd);
      if (C !== "C" && C !== "S") lastC = null;
      if (C !== "Q" && C !== "T") lastQ = null;
      seg(nl); x = nl[6]; y = nl[7];
    }
    // tidy: drop zero-length segments, mark subpaths that end where they start as closed
    const out = [];
    for (const sp of subs) {
      const segs = sp.segs.filter((s) => !(Math.hypot(s[6] - s[0], s[7] - s[1]) < 1e-9 && Math.hypot(s[2] - s[0], s[3] - s[1]) < 1e-9 && Math.hypot(s[4] - s[0], s[5] - s[1]) < 1e-9));
      if (!segs.length) continue;
      const f = segs[0], l = segs[segs.length - 1];
      out.push({ segs, closed: sp.closed || Math.hypot(l[6] - f[0], l[7] - f[1]) < 0.01 });
    }
    if (!out.length) throw bad("path has no drawable segments");
    return out;
  };

  /* ---------------- geometry helpers ---------------- */
  function pointAt(s, t) {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * s[0] + b * s[2] + c * s[4] + d * s[6], a * s[1] + b * s[3] + c * s[5] + d * s[7]];
  }
  function segLen(s) {
    let L = 0, p = [s[0], s[1]];
    for (let k = 1; k <= 16; k++) { const q = pointAt(s, k / 16); L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; }
    return L;
  }
  function split(s, t) {
    const lerp = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const p0 = [s[0], s[1]], p1 = [s[2], s[3]], p2 = [s[4], s[5]], p3 = [s[6], s[7]];
    const a = lerp(p0, p1), b = lerp(p1, p2), c = lerp(p2, p3), d = lerp(a, b), e = lerp(b, c), f = lerp(d, e);
    return [[...p0, ...a, ...d, ...f], [...f, ...e, ...c, ...p3]];
  }
  function halfT(s) {
    // the parameter at half the arc length (32 chords): splits a curve into two equal-length halves
    const n = 32, pts = []; let L = 0, p = [s[0], s[1]]; const acc = [0];
    for (let k = 1; k <= n; k++) { const q = pointAt(s, k / n); L += Math.hypot(q[0] - p[0], q[1] - p[1]); acc.push(L); p = q; pts.push(q); }
    const h = L / 2;
    for (let k = 1; k <= n; k++) if (acc[k] >= h) { const f = (h - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1); return (k - 1 + f) / n; }
    return 0.5;
  }
  function subdivide(segs, N) {
    const out = segs.map((s) => s.slice()), len = out.map(segLen);
    while (out.length < N) {
      let bi = 0;
      for (let i = 1; i < len.length; i++) if (len[i] > len[bi] + 1e-9) bi = i;
      const [a, b] = split(out[bi], len[bi] > 1e-9 ? halfT(out[bi]) : 0.5);
      out.splice(bi, 1, a, b); len.splice(bi, 1, segLen(a), segLen(b));
    }
    return out;
  }
  function polyOf(segs) { const pts = []; for (const s of segs) for (let k = 0; k < 8; k++) pts.push(pointAt(s, k / 8)); return pts; }
  function signedArea(segs) {
    const p = polyOf(segs); let A = 0;
    for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; A += p[i][0] * q[1] - q[0] * p[i][1]; }
    return A / 2;
  }
  function centroid(segs) {
    const p = polyOf(segs); let A = 0, cx = 0, cy = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length], c = p[i][0] * q[1] - q[0] * p[i][1];
      A += c; cx += (p[i][0] + q[0]) * c; cy += (p[i][1] + q[1]) * c;
    }
    if (Math.abs(A) < 1e-6) { let sx = 0, sy = 0; for (const q of p) { sx += q[0]; sy += q[1]; } return [sx / p.length, sy / p.length]; }
    return [cx / (3 * A), cy / (3 * A)];
  }
  const revSeg = (s) => [s[6], s[7], s[4], s[5], s[2], s[3], s[0], s[1]];
  const reversed = (segs) => segs.slice().reverse().map(revSeg);
  function cost(a, b, k) {
    let c = 0; const N = a.length;
    for (let i = 0; i < N; i++) { const q = b[(i + k) % N]; const dx = a[i][0] - q[0], dy = a[i][1] - q[1]; c += dx * dx + dy * dy; }
    return c;
  }
  function bestOffset(a, b) { let bk = 0, bc = Infinity; for (let k = 0; k < a.length; k++) { const c = cost(a, b, k); if (c < bc - 1e-9) { bc = c; bk = k; } } return { k: bk, c: bc }; }
  const rotate = (b, k) => b.slice(k).concat(b.slice(0, k));
  const pointSub = (pt, N) => Array.from({ length: N }, () => [pt[0], pt[1], pt[0], pt[1], pt[0], pt[1], pt[0], pt[1]]);

  /** align one subpath pair: same count, best start (winding was matched for the whole shape in prepare) */
  function alignPair(A, B, N) {
    let a = subdivide(A.segs, N), b = subdivide(B.segs, N);
    const closed = A.closed && B.closed;
    const sa = signedArea(a), sb = signedArea(b);
    if (closed && Math.abs(sa) > 1 && Math.abs(sb) > 1 && Math.sign(sa) === Math.sign(sb)) {
      b = rotate(b, bestOffset(a, b).k);
    } else if (closed) {
      const f = bestOffset(a, b), rb = reversed(b), r = bestOffset(a, rb);
      b = r.c < f.c - 1e-9 ? rotate(rb, r.k) : rotate(b, f.k);
    } else if (cost(a, reversed(b), 0) < cost(a, b, 0) - 1e-9) b = reversed(b);
    return { a, b, closedA: A.closed, closedB: B.closed };
  }

  /** prepare two paths for morphing: [{a, b, closedA, closedB}] with a[i] and b[i] corresponding segment by segment */
  M.prepare = function (dA, dB, o) {
    o = typeof o === "number" ? { samples: o } : (o || {});
    const samples = Math.max(4, Math.round(o.samples || 48));
    const order = (subs) => subs.map((s, i) => ({ s, i, area: Math.abs(signedArea(s.segs)), c: centroid(s.segs) })).sort((p, q) => (q.area - p.area) || (p.i - q.i));
    const PA = order(M.parse(dA)), PB = order(M.parse(dB));
    // winding: when the largest subpaths turn opposite ways, reverse EVERY subpath of B. B's subpaths keep their winding
    // relative to each other, so its holes stay holes under the nonzero fill rule, and pairs morph without twisting.
    const wa = signedArea(PA[0].s.segs), wb = signedArea(PB[0].s.segs);
    if (Math.abs(wa) > 1 && Math.abs(wb) > 1 && Math.sign(wa) !== Math.sign(wb)) for (const x of PB) x.s = { segs: reversed(x.s.segs), closed: x.s.closed };
    const pairs = [];
    const n = Math.max(PA.length, PB.length);
    const nearest = (pt, list) => { let best = list[0]; for (const x of list) if (Math.hypot(x.c[0] - pt[0], x.c[1] - pt[1]) < Math.hypot(best.c[0] - pt[0], best.c[1] - pt[1]) - 1e-9) best = x; return best; };
    for (let i = 0; i < n; i++) {
      const A = PA[i], B = PB[i];
      if (A && B) { const N = Math.max(samples, A.s.segs.length, B.s.segs.length); pairs.push(alignPair(A.s, B.s, N)); continue; }
      const real = A || B, other = A ? PB : PA;
      const N = Math.max(samples, real.s.segs.length);
      const pt = o.collapse === "self" ? real.c : nearest(real.c, other).c;
      const segs = subdivide(real.s.segs, N), dot = pointSub(pt, N);
      pairs.push(A ? { a: segs, b: dot, closedA: real.s.closed, closedB: real.s.closed, dotB: true } : { a: dot, b: segs, closedA: real.s.closed, closedB: real.s.closed, dotA: true });
    }
    return pairs;
  };

  const fmt = (v) => { const r = Math.round(v * 100) / 100; return String(r === 0 ? 0 : r); };
  /** the pure interpolation: (p in [0, 1]) -> d. p = 0 is A's geometry, p = 1 is B's (to 0.01 px). */
  M.interpolator = function (dA, dB, o) { return interpOf(M.prepare(dA, dB, o)); };
  function interpOf(pairs) {
    return function (p) {
      const out = [];
      for (const P of pairs) {
        // a subpath that grows from or shrinks to a point is left out at the end where it IS the point, so the
        // end strings are exactly A and B (a toon outline would otherwise draw a speck there)
        if ((P.dotA && p <= 0) || (P.dotB && p >= 1)) continue;
        const N = P.a.length, v = new Array(8);
        for (let i = 0; i < N; i++) {
          const a = P.a[i], b = P.b[i];
          for (let k = 0; k < 8; k++) v[k] = a[k] + (b[k] - a[k]) * p;
          if (i === 0) out.push(`M${fmt(v[0])} ${fmt(v[1])}`);
          out.push(`C${fmt(v[2])} ${fmt(v[3])} ${fmt(v[4])} ${fmt(v[5])} ${fmt(v[6])} ${fmt(v[7])}`);
        }
        if (p < 0.5 ? P.closedA : P.closedB) out.push("Z");
      }
      return out.join("");
    };
  }

  /** apply an affine matrix {a,b,c,d,e,f} to a path (as cubics: exact under affine maps) */
  M.transform = function (d, m) {
    const subs = M.parse(d), out = [];
    const tp = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
    for (const sp of subs) {
      sp.segs.forEach((s, i) => {
        const q = [tp(s[0], s[1]), tp(s[2], s[3]), tp(s[4], s[5]), tp(s[6], s[7])];
        if (i === 0) out.push(`M${fmt(q[0][0])} ${fmt(q[0][1])}`);
        out.push(`C${fmt(q[1][0])} ${fmt(q[1][1])} ${fmt(q[2][0])} ${fmt(q[2][1])} ${fmt(q[3][0])} ${fmt(q[3][1])}`);
      });
      if (sp.closed) out.push("Z");
    }
    return out.join("");
  };

  /** the same shape drawn the other way round: append a reversed shape to cut a HOLE under the nonzero fill rule
   *  (every shape() turns clockwise, so shape(...) + reverse(shape(...)) is a ring) */
  M.reverse = function (d) {
    const out = [];
    for (const sp of M.parse(d)) {
      const segs = reversed(sp.segs);
      segs.forEach((s, i) => {
        if (i === 0) out.push(`M${fmt(s[0])} ${fmt(s[1])}`);
        out.push(`C${fmt(s[2])} ${fmt(s[3])} ${fmt(s[4])} ${fmt(s[5])} ${fmt(s[6])} ${fmt(s[7])}`);
      });
      if (sp.closed) out.push("Z");
    }
    return out.join("");
  };

  /* ---------------- shapes as d strings ---------------- */
  M.shape = function (kind, box, o) {
    o = o || {};
    const b = box || {}, x = +b.x || 0, y = +b.y || 0, w = +b.w || 0, h = +b.h || 0;
    const cx = x + w / 2, cy = y + h / 2, f = fmt;
    if (kind === "rect") {
      const r = Math.max(0, Math.min(o.r == null ? 0 : o.r, w / 2, h / 2));
      if (!r) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
      return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
        `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
    }
    if (kind === "circle" || kind === "ellipse") {
      const rx = kind === "circle" ? Math.min(w, h) / 2 : w / 2, ry = kind === "circle" ? rx : h / 2;
      return `M${f(cx)} ${f(cy - ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx)} ${f(cy + ry)}` +
        `A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx)} ${f(cy - ry)}Z`;
    }
    if (kind === "polygon" || kind === "star") {
      const n = Math.max(3, Math.round(o.n || (kind === "star" ? 5 : 6)));
      const rot = (o.rot == null ? -90 : o.rot) * Math.PI / 180, inner = o.inner == null ? 0.48 : o.inner;
      const pts = [];
      const k = kind === "star" ? 2 * n : n;
      for (let i = 0; i < k; i++) {
        const a = rot + (2 * Math.PI * i) / k, s = kind === "star" && i % 2 ? inner : 1;
        pts.push([cx + Math.cos(a) * (w / 2) * s, cy + Math.sin(a) * (h / 2) * s]);
      }
      return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
    }
    Loom.error("morph_bad_path", `morph.shape: unknown kind ${kind} (rect, circle, ellipse, polygon, star)`);
    return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  };

  /** a basic SVG shape element as a path d */
  M.fromElement = function (el) {
    if (!el || !el.tagName) return null;
    const g = (k) => parseFloat(el.getAttribute(k)) || 0, tag = el.tagName.toLowerCase();
    if (tag === "path") return el.getAttribute("d");
    if (tag === "rect") return M.shape("rect", { x: g("x"), y: g("y"), w: g("width"), h: g("height") }, { r: g("rx") || g("ry") });
    if (tag === "circle") return M.shape("circle", { x: g("cx") - g("r"), y: g("cy") - g("r"), w: 2 * g("r"), h: 2 * g("r") });
    if (tag === "ellipse") return M.shape("ellipse", { x: g("cx") - g("rx"), y: g("cy") - g("ry"), w: 2 * g("rx"), h: 2 * g("ry") });
    if (tag === "line") return `M${g("x1")} ${g("y1")}L${g("x2")} ${g("y2")}`;
    if (tag === "polygon" || tag === "polyline") {
      const n = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      if (n.length < 4) return null;
      let d = `M${n[0]} ${n[1]}`; for (let i = 2; i + 1 < n.length; i += 2) d += `L${n[i]} ${n[i + 1]}`;
      return tag === "polygon" ? d + "Z" : d;
    }
    return null;
  };

  /* ---------------- scheduling ---------------- */
  function pathOf(target) {
    if (!target) return null;
    const n = target.inner || target;
    if (n.tagName && n.tagName.toLowerCase() === "path") return n;
    return n.querySelector ? n.querySelector("path") : null;
  }
  const isPathLike = (x) => typeof x === "string" || (x && typeof x === "object" && x.kind);
  const resolveD = (x) => (typeof x === "string" ? x : M.shape(x.kind, x.box || x, x));
  function defaultDur() {
    const m = S().pack.motion, v = m.morph;
    return v != null ? v * (S().intensity || 1) : S().dur("move") * 2.6;
  }
  function easeOf(e) {
    if (typeof e === "function") return e;
    const name = e || S().pack.motion.morph_ease || "editorial";
    return Loom.ease[name] || Loom.ease.editorial;
  }
  const col = (x) => (x == null ? null : (String(x).startsWith("#") ? x : S().c(x)));
  /** the colour pair for a channel: [from, to] tokens, or one token (to) continuing from what the path has now */
  function pairOf(spec, el, attr) {
    if (spec == null) return null;
    const cur = el["__morph_" + attr] || el.getAttribute(attr);
    const [a, b] = Array.isArray(spec) ? spec : [null, spec];
    const A = a != null ? col(a) : cur, B = col(b);
    if (!A || A === "none" || !B || B === "none") { Loom.warn("morph_colour_skipped", `morph: ${attr} cannot interpolate from ${A} to ${B}`); return null; }
    return [A, B];
  }

  M.to = function (target, toD, t, o) {
    o = o || {};
    const el = pathOf(target);
    if (!el) { Loom.error("morph_bad_path", "morph.to: target is not a path and holds no path"); return t; }
    if (!isPathLike(toD)) { Loom.error("morph_bad_path", "morph.to: the target shape must be a d string or {kind, box}"); return t; }
    const fromD = o.from ? resolveD(o.from) : (el.__morphD || el.getAttribute("d"));
    const dB = resolveD(toD);
    let interp, pairs;
    try { pairs = M.prepare(fromD, dB, o); interp = interpOf(pairs); } catch (e) {
      Loom.error("morph_bad_path", "morph.to: " + (e && e.message), { from: String(fromD).slice(0, 80), to: String(dB).slice(0, 80) });
      return t;
    }
    const dur = o.dur || defaultDur();
    let ease = easeOf(o.ease);
    const meta = { kind: "morph", key: "morph:" + (el.__morphKey || (el.__morphKey = Loom.uid("mph"))), beat: Loom.ctxBeat && Loom.ctxBeat.id, name: o.name || (target && target.name), content: o.content !== false, node: el };
    if (o.hz && Loom.stepped) { ease = Loom.stepped.ease(ease, dur, o.hz); meta.stepped = o.hz; }
    const fill = pairOf(o.fill, el, "fill"), stroke = pairOf(o.stroke, el, "stroke");
    const mix = (pr, e) => (e <= 0 ? pr[0] : e >= 1 ? pr[1] : S().mix(pr[0], pr[1], e));
    Loom.drive((e) => {
      el.setAttribute("d", interp(e));
      if (fill) el.setAttribute("fill", mix(fill, e));
      if (stroke) el.setAttribute("stroke", mix(stroke, e));
    }, t, dur, ease, meta);
    el.__morphD = dB;
    if (fill) el.__morph_fill = fill[1];
    if (stroke) el.__morph_stroke = stroke[1];
    Loom.report.morphs.push({ t0: +t.toFixed(3), t1: +(t + dur).toFixed(3), name: meta.name || null, subpaths: pairs.length, segments: pairs.map((p) => p.a.length) });
    return t + dur;
  };

  M.chain = function (target, ds, times, o) {
    o = o || {};
    if (!Array.isArray(ds) || !ds.length) { Loom.error("morph_bad_path", "morph.chain needs a list of shapes"); return typeof times === "number" ? times : 0; }
    let t = Array.isArray(times) ? times[0] : times, end = t;
    ds.forEach((d, i) => {
      const at = Array.isArray(times) ? (times[i] != null ? times[i] : end + (o.hold == null ? 0.4 : o.hold)) : (i ? end + (o.hold == null ? 0.4 : o.hold) : t);
      const step = Object.assign({}, o, { fill: o.fills ? o.fills[i] : o.fill, stroke: o.strokes ? o.strokes[i] : o.stroke });
      delete step.fills; delete step.strokes; delete step.hold;
      end = M.to(target, d, at, step);
    });
    return end;
  };

  /** a path drawn in the pack's outline habit (toon and ink packs outline it), ready to morph */
  M.path = function (parent, d, o) {
    o = o || {};
    const sh = S().pack.shape;
    const outlined = sh.shading === "toon" || sh.shading === "ink" || sh.shading === "line" || sh.shading === "sketch";
    const stroke = o.stroke === "none" ? "none" : o.stroke ? S().c(o.stroke) : (outlined ? S().c(sh.outline || "ink") : "none");
    const fill = o.fill === "none" ? "none" : S().c(o.fill || "accent");
    const p = Loom.svg("path", { d: resolveD(d), fill, stroke, "stroke-width": stroke === "none" ? null : (o.sw || sh.stroke || 3), "stroke-linejoin": "round", "fill-rule": o.rule || null }, parent);
    p.__morphD = p.getAttribute("d");
    return p;
  };

  /** FILL JOIN: a shape grows into the whole frame in `token`; the next scene starts on that field colour */
  M.fill = function (ctx, name, o) {
    o = o || {};
    const t = o.t || 0, W = Loom.W, H = Loom.H, bl = o.bleed == null ? 8 : o.bleed;
    const E = ctx && ctx.el ? ctx.el(name, { x: 0, y: 0, w: W, h: H, kind: "shape" }) : Loom.kit.element((ctx && ctx.g) || ctx, name, { x: 0, y: 0, w: W, h: H, kind: "shape" });
    let fromD = null, src = null, fromCol = null;
    if (o.from && o.from.tagName) {
      src = o.from;
      fromD = src.__morphD || M.fromElement(src);
      fromCol = src.__morph_fill || src.getAttribute("fill");
      // the source may sit inside translated groups: bring its shape into this element's coordinates
      try {
        const a = src.getCTM && src.getCTM(), b = E.inner.getCTM && E.inner.getCTM();
        if (a && b && fromD) fromD = M.transform(fromD, b.inverse().multiply(a));
      } catch (e) { Loom.warn("morph_fill_ctm", "morph.fill: could not read the source position; using its local coordinates"); }
    } else if (o.from) fromD = resolveD(o.from);
    if (!fromD) { Loom.error("morph_bad_path", "morph.fill needs from: a d string, a {kind, box} or a path element"); return E; }
    const token = o.token || "field2";
    const fromTok = o.fromToken ? S().c(o.fromToken) : (fromCol && fromCol !== "none" ? fromCol : S().c(token));
    const path = Loom.svg("path", { d: fromD, fill: fromTok, "stroke-linejoin": "round" }, E.inner);
    if (src && src.getAttribute("stroke") && src.getAttribute("stroke") !== "none") {   // keep the source's outline through the handoff
      path.setAttribute("stroke", src.getAttribute("stroke")); path.setAttribute("stroke-width", src.getAttribute("stroke-width") || 3);
    }
    path.__morphD = fromD; path.__morph_fill = fromTok;
    E.path = path;
    // hidden until the join starts, and it takes over from the source shape at that moment
    const vis = (raw) => {
      path.setAttribute("visibility", raw > 0 ? "visible" : "hidden");
      if (src) src.setAttribute("visibility", raw > 0 ? "hidden" : "visible");
    };
    Loom.drive((e, raw) => vis(raw), t, 0.0001, "linear", { kind: "morph", key: "morphfill:" + name, name, content: false, nostep: true });
    const frame = `M${-bl} ${-bl}H${W + bl}V${H + bl}H${-bl}Z`;
    E.endT = M.to(path, frame, t, { dur: o.dur || defaultDur() * 1.25, ease: o.ease || "editorial", fill: [fromTok, token], name, samples: o.samples, hz: o.hz });
    E.field = token;
    return E;
  };

  // sugar: m.morph(...) where the motion vocabulary is loaded
  if (Loom.motion) Loom.motion.morph = (...a) => M.to(...a);
})();
