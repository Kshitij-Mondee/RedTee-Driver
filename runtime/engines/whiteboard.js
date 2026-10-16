/* Whiteboard engine (D-179, the pilot of D-175): dry-erase marker drawn live on the board.
 *
 * Learned from lemo-opuscar's whiteboard engine (docs/research/2026-10-15-style-engines-from-opuscar.md), rebuilt for
 * Loom: every mark is an SVG path inside an element a scene made with ctx.el (so holds, exits, the camera, the layout
 * guard, the probe and restyles keep working), every reveal is a tween on the lesson's timeline, colours are pack
 * tokens, and a frame is a pure function of time.
 *
 *   const W = ctx.engine;              // this engine's api (whiteboard lessons only)
 *   const B = W.board(ctx);            // once per scene: the pens and their schedule
 *   const card = ctx.el("ticket", { x: 140, y: 650, w: 380, h: 150, kind: "card", exit: "recede" });
 *   const t = B.draw(card, W.rect(0, 0, 380, 150), { at: ctx.cue("open ticket") - 0.3 });
 *   const words = ctx.el("ticket_words", { x: 250, y: 666, w: 250, h: 120, kind: "text", exit: "wipe" });
 *   B.write(words, "Open at 6 pm", { role: "lead", at: t, by: ctx.cue("six") + 0.4 });
 *   B.draw(card, W.circle(190, 75, 120), { at: ctx.cue("circle it"), pen: "accent" });
 *
 * Loom's own look (Kshitij, 2026-10-15: "fresh and clean ... only take inspiration"): clean marker lines with a gentle
 * hand, no grit, no ink pools, no glossy props, and no sound on every stroke.
 * Layers: (1) the mark: resampled, a gentle hand wobble, a slight bow, a small overshoot, round caps; (2) the vocabulary: line, path, circle (never closes), rect (four strokes, corners overshoot),
 * roundRect, arrow (shaft, then an open head), underline, dashed, hatch, tick, cross, and text written stroke by stroke
 * in a single-line marker hand (EMS Tech, OFL); (3) the scheduler: one pen writes in order, hops between strokes, and
 * with `by` finishes exactly on time (a spoken word); (4) the performer: a flat, minimal marker in the pack's colours at
 * the drawing tip, lifting between strokes and leaving the frame between phrases (`{marker: false}` on a board hides it);
 * (5) sound: none by default; `{sound: true}` on one draw gives one quiet, short marker sound for that whole group.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
  // hand speed along a stroke: slow in, fast middle, slow out (the reveal and the marker tip use the same curve)
  const hand = (u) => { u = clamp(u, 0, 1); return u - Math.sin(TAU * u) / TAU * 0.8; };
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  // a type role's family as the style names it (Loom.style.font gives {family, weights})
  const family = (role) => { const f = S().font ? S().font(role) : null; return (f && f.family) || (typeof f === "string" ? f : "sans-serif"); };

  // ---------------------------------------------------------------- geometry
  function resample(p, step) {
    const o = [p[0], p[1]]; let carry = 0;
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], bx = p[i], by = p[i + 1], d = Math.hypot(bx - ax, by - ay);
      let s = step - carry;
      while (s <= d) { o.push(ax + (bx - ax) * s / d, ay + (by - ay) * s / d); s += step; }
      carry = d - (s - step);
    }
    const n = p.length;
    if (Math.hypot(o[o.length - 2] - p[n - 2], o[o.length - 1] - p[n - 1]) > step * 0.25) o.push(p[n - 2], p[n - 1]);
    return o;
  }
  function chaikin(p, it) {
    for (let k = 0; k < it; k++) {
      const o = [p[0], p[1]];
      for (let i = 0; i < p.length - 2; i += 2) {
        const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3];
        o.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25, ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75);
      }
      o.push(p[p.length - 2], p[p.length - 1]); p = o;
    }
    return p;
  }
  let SEED = 1;
  // a mark: {pts (flat, element-local px), len, cum, kind, w, alpha, seed}
  function mark(pts, o) {
    o = o || {};
    const w = o.w == null ? markerW() : o.w, seed = o.seed == null ? SEED++ : o.seed;
    let p = resample(o.smooth ? chaikin(pts, o.smooth) : pts, Math.max(2, w * 0.7));
    const J = o.jitter == null ? 1 : o.jitter, wav = o.wav || 160;
    if (J > 0 && p.length > 4) {                    // the hand wobbles along the line's normal, slowly
      const q = p.slice(); let s = 0;
      for (let i = 0; i < p.length; i += 2) {
        const j = Math.min(i, p.length - 4), tx = p[j + 2] - p[j], ty = p[j + 3] - p[j + 1], tl = Math.hypot(tx, ty) || 1;
        if (i) s += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
        const off = J * 0.9 * ((vnoise(s / wav + seed * 7.31) - 0.5) * 2 + 0.45 * (vnoise(s / (wav * 0.23) + seed * 3.1) - 0.5));
        q[i] = p[i] - ty / tl * off; q[i + 1] = p[i + 1] + tx / tl * off;
      }
      p = q;
    }
    if (o.over && p.length > 4) {                   // a stroke runs on a little past its end, with a small hook
      const n = p.length, tx = p[n - 2] - p[n - 4], ty = p[n - 1] - p[n - 3], tl = Math.hypot(tx, ty) || 1, hk = (hash(seed) - 0.5) * 0.5;
      for (let k = 1; k <= 3; k++) {
        const f = o.over * k / 3, a = hk * k / 3;
        p.push(p[n - 2] + (tx / tl * Math.cos(a) - ty / tl * Math.sin(a)) * f, p[n - 1] + (ty / tl * Math.cos(a) + tx / tl * Math.sin(a)) * f);
      }
    }
    const n = p.length / 2, cum = new Array(n).fill(0);
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
    return { pts: p, cum, len: cum[n - 1] || 0.001, kind: o.kind || "line", w, alpha: o.alpha == null ? 0.94 : o.alpha, seed, pen: o.pen || null };
  }
  function at(m, L) {
    const c = m.cum, p = m.pts; L = clamp(L, 0, m.len);
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (c[md] < L) lo = md; else hi = md; }
    const u = (L - c[lo]) / ((c[hi] - c[lo]) || 1);
    return [lerp(p[2 * lo], p[2 * hi], u), lerp(p[2 * lo + 1], p[2 * hi + 1], u)];
  }
  const start = (m) => [m.pts[0], m.pts[1]];
  const end = (m) => [m.pts[m.pts.length - 2], m.pts[m.pts.length - 1]];
  // the marker's line width: the pack's stroke (whiteboard 3.6 px at 1080p)
  const markerW = () => ((S().pack && S().pack.shape && S().pack.shape.stroke) || 3.6) * 1.15;

  // ---------------------------------------------------------------- vocabulary (pure data, element-local px)
  const V = {};
  V.line = (x0, y0, x1, y1, o) => {
    o = o || {};
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, bow = (o.bow == null ? 0.012 : o.bow) * L * (hash(SEED * 1.7) - 0.5) * 2;
    const mx = (x0 + x1) / 2 - (y1 - y0) / L * bow, my = (y0 + y1) / 2 + (x1 - x0) / L * bow;
    return [mark([x0, y0, mx, my, x1, y1], Object.assign({ smooth: 2, over: o.over == null ? Math.min(8, L * 0.02) : o.over }, o))];
  };
  V.path = (points, o) => [mark(points.flat ? points.flat() : points, Object.assign({ smooth: 3 }, o || {}))];
  // ---- a Lucide icon drawn by the hand (2026-10-16, Kshitij: "Are lucide icons not good for this?"; they are: 1,993
  // centre-line stroke icons, assets/icons/lucide.json, ISC). Each of its shapes (paths with arcs, circles, rects, lines,
  // polylines) is traced by the browser and split where a path jumps between its subpaths; the strokes keep the icon's
  // own order (its designer's: outline first, mostly), each starts at the end nearer the pen, and dots (Lucide's tiny
  // lines, the server's lights) come last, as a person adds them. Box: x, y (top left), size px. Pass the name as a
  // string literal: compose embeds the icons a scene names.
  let ICON_HOST = null;
  V.icon = (name, x, y, size, o) => {
    o = o || {};
    const src = ((Loom.assets || {}).icons || {})[name];
    if (!src) { Loom.error("wb_icon_unknown", `no Lucide icon "${name}" (assets/icons/lucide.json; the name must be a string literal in the scene so compose embeds it)`); return []; }
    if (!ICON_HOST) ICON_HOST = Loom.svg("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute;left:-9999px;top:0;visibility:hidden" }, document.body);
    ICON_HOST.innerHTML = src;               // our own generated icon file, never a viewer's input
    const k = (size || 160) / 24, step = 3, strokes = [], dots = [];
    for (const el of Array.from(ICON_HOST.children)) {
      let L = 0; try { L = el.getTotalLength(); } catch (e) { continue; }
      if (!(L >= 0)) continue;
      if (L * k < 2.5) {                    // a dot: Lucide draws one as a 0.01 line with a round cap
        const p = el.getPointAtLength(0); dots.push([x + p.x * k, y + p.y * k]); continue;
      }
      const n = Math.max(2, Math.ceil(L * k / step));
      let cur = [], prev = null;
      for (let i = 0; i <= n; i++) {
        const p = el.getPointAtLength(L * i / n), px = x + p.x * k, py = y + p.y * k;
        if (prev && Math.hypot(px - prev[0], py - prev[1]) > step * 2.5) { if (cur.length >= 4) strokes.push(cur); cur = []; }
        cur.push(px, py); prev = [px, py];
      }
      if (cur.length >= 4) strokes.push(cur);
    }
    ICON_HOST.innerHTML = "";
    // each stroke from its end nearer the pen (fewer, shorter hops)
    let pen = null;
    for (let i = 0; i < strokes.length; i++) {
      const s = strokes[i], a = [s[0], s[1]], b = [s[s.length - 2], s[s.length - 1]];
      if (pen && Math.hypot(b[0] - pen[0], b[1] - pen[1]) < Math.hypot(a[0] - pen[0], a[1] - pen[1])) {
        const r = []; for (let j = s.length - 2; j >= 0; j -= 2) r.push(s[j], s[j + 1]); strokes[i] = r;
      }
      pen = [strokes[i][strokes[i].length - 2], strokes[i][strokes[i].length - 1]];
    }
    const J = o.jitter == null ? 0.6 : o.jitter, w = o.w;
    const marks = strokes.map((pts) => mark(pts, { smooth: 0, jitter: J, w }));
    for (const [dx, dy] of dots) marks.push(mark([dx, dy, dx + 0.1, dy], { smooth: 0, jitter: 0, w: (w || markerW()) * 1.6 }));
    for (const m of marks) m.kind = m.len < 2 ? m.kind : "icon";
    return marks;
  };
  V.arc = (cx, cy, r, a0, a1, o) => {
    o = o || {};
    const ry = o.ry == null ? r : o.ry, n = Math.max(10, Math.ceil(Math.abs(a1 - a0) * Math.max(r, ry) / 8)), p = [];
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * ry); }
    return [mark(p, Object.assign({ wav: 240 }, o))];
  };
  // a hand circle never closes exactly: it starts at an angle and overlaps itself by `lap`
  V.circle = (cx, cy, r, o) => { o = o || {}; const a0 = o.a0 == null ? -2.2 : o.a0; return V.arc(cx, cy, r, a0, a0 + (o.dir || 1) * (TAU + (o.lap == null ? 0.22 : o.lap)), o); };
  V.ellipse = (cx, cy, rx, ry, o) => V.circle(cx, cy, rx, Object.assign({}, o || {}, { ry }));
  V.rect = (x, y, w, h, o) => {                    // four strokes; the corners overshoot a little
    o = o || {}; const e = o.corner == null ? 5 : o.corner, q = Object.assign({}, o, { over: 0 });
    return [].concat(V.line(x - e, y, x + w + e, y, q), V.line(x + w, y - e, x + w, y + h + e, q), V.line(x + w + e, y + h, x - e, y + h, q), V.line(x, y + h + e, x, y - e, q));
  };
  V.roundRect = (x, y, w, h, r, o) => {            // one continuous stroke that overlaps where it began
    const p = [], seg = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + i / 8 * Math.PI / 2; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    r = Math.min(r == null ? 14 : r, w / 2, h / 2);
    seg(x + w - r, y + r, -Math.PI / 2); seg(x + w - r, y + h - r, 0); seg(x + r, y + h - r, Math.PI / 2); seg(x + r, y + r, Math.PI);
    p.push(x + r + 16, y);
    return [mark(p, Object.assign({ wav: 300 }, o || {}))];
  };
  V.arrow = (x0, y0, x1, y1, o) => {               // the shaft, then an open head of two strokes
    o = o || {};
    const shaft = o.bend ? (() => {
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, cx = (x0 + x1) / 2 - (y1 - y0) / L * o.bend, cy = (y0 + y1) / 2 + (x1 - x0) / L * o.bend, q = [];
      for (let i = 0; i <= 16; i++) { const u = i / 16; q.push((1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1); }
      return mark(q, Object.assign({ smooth: 1 }, o, { over: 0 }));
    })() : V.line(x0, y0, x1, y1, Object.assign({}, o, { over: 0 }))[0];
    const [ex, ey] = end(shaft), [px, py] = at(shaft, Math.max(0, shaft.len - 24)), a = Math.atan2(ey - py, ex - px), hl = o.head == null ? 22 : o.head;
    const h1 = V.line(ex + Math.cos(a + 2.6) * hl, ey + Math.sin(a + 2.6) * hl, ex, ey, Object.assign({}, o, { bow: 0, over: 0 }))[0];
    const h2 = V.line(ex, ey, ex + Math.cos(a - 2.6) * hl, ey + Math.sin(a - 2.6) * hl, Object.assign({}, o, { bow: 0, over: 0 }))[0];
    return [shaft, h1, h2];
  };
  V.underline = (x0, x1, y, o) => V.line(x0, y, x1, y + ((o && o.tilt) || 2), Object.assign({ bow: 0.02 }, o || {}));
  V.dashed = (points, o) => {                      // one stroke per dash
    o = o || {};
    const base = mark(points.flat ? points.flat() : points, { jitter: 0, smooth: o.smooth == null ? 2 : o.smooth, w: 1 });
    const dash = o.dash || 22, gap = o.gap || 16, out = [];
    for (let s = 0; s < base.len - 3; s += dash + gap) {
      const e = Math.min(base.len, s + dash), q = [];
      for (let u = s; u <= e; u += 4) q.push(...at(base, u));
      q.push(...at(base, e));
      out.push(mark(q, Object.assign({ jitter: 0.4 }, o, { kind: "dash" })));
    }
    return out;
  };
  V.hatch = (poly, o) => {                          // a zig-zag scribble inside a convex shape: one stroke, lighter
    o = o || {};
    const ang = o.angle == null ? -0.8 : o.angle, sp = o.spacing || 14, ca = Math.cos(ang), sa = Math.sin(ang);
    const P = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const v0 = Math.min(...P.map((p) => p[1])), v1 = Math.max(...P.map((p) => p[1])), pts = [];
    let flip = 0;
    for (let v = v0 + sp * 0.5; v < v1; v += sp) {
      const xs = [];
      for (let i = 0; i < P.length; i++) {
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
        if ((ay - v) * (by - v) < 0) xs.push(ax + (v - ay) / (by - ay) * (bx - ax));
      }
      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      const a = xs[0] + sp * 0.2, b = xs[xs.length - 1] - sp * 0.2, sg = flip ? [b, a] : [a, b]; flip ^= 1;
      for (const u of sg) pts.push(u * ca - v * sa, u * sa + v * ca);
    }
    return pts.length >= 4 ? [mark(pts, Object.assign({ w: markerW() * 0.8, alpha: 0.5, jitter: 0.5 }, o, { smooth: 0, kind: "hatch" }))] : [];
  };
  V.tick = (x, y, s, o) => [mark([x, y, x + s * 0.35, y + s * 0.4, x + s, y - s * 0.55], Object.assign({ smooth: 1 }, o || {}))];
  V.cross = (x, y, s, o) => [].concat(V.line(x, y, x + s, y + s, o), V.line(x + s, y, x, y + s, o));

  // ---- text in a single-line marker hand (manifest.assets.strokeFonts, embedded by compose from loom/stroke_fonts.py)
  // cap height as a share of the pack's smallest font size for the role: a one-line hand reads lighter than a font,
// so it is drawn a little larger (title 72 -> 58 px caps, lead 38 -> 30, label 28 -> 22)
const ROLE_CAP = { title: 0.8, hero: 0.8, display: 0.8, lead: 0.8, body: 0.8, label: 0.8, caption: 0.8 };
  function roleCap(role) {
    const T = (S().pack && S().pack.type) || {}, r = T[role] || T.body || [34, 40];
    return r[0] * (ROLE_CAP[role] || 0.8);
  }
  function font(name) {
    const F = ((Loom.assets || {}).strokeFonts || {})[name || "EMSTech"];
    if (!F) throw new Error(`whiteboard engine: stroke font ${name || "EMSTech"} is not in this build (compose embeds it for whiteboard lessons)`);
    return F;
  }
  const advOf = (F, ch) => { const g = F.glyphs[ch] || F.glyphs["?"]; return g ? g.a : F.adv; };
  const width = (F, s, k) => { let a = 0; for (const ch of s) a += advOf(F, ch) * k; return a; };
  // lay out `str` in a box: {x, y (top), w, h, size (cap height px) | role, align, maxLines, lineGap}; it wraps on spaces
  // and shrinks to fit, never below the role's floor (then it says so)
  V.text = (str, o) => {
    o = o || {};
    const F = font(o.font), want = o.size || roleCap(o.role || "body"), floor = o.minSize || Math.max(13, roleCap("caption") * 0.95);
    const W0 = o.w == null ? 1e9 : o.w, H0 = o.h == null ? 1e9 : o.h, gap = o.lineGap == null ? 0.62 : o.lineGap, maxL = o.maxLines || 99;
    let size = want, lines;
    const wrap = (k) => {
      const out = []; let cur = "";
      for (const w of String(str).split(/\s+/).filter(Boolean)) {
        const t = cur ? cur + " " + w : w;
        if (cur && width(F, t, k) > W0) { out.push(cur); cur = w; } else cur = t;
      }
      if (cur) out.push(cur);
      return out;
    };
    for (;;) {
      const k = size / F.cap;
      lines = wrap(k);
      const tall = lines.length * size * (1 + gap) - size * gap, wide = Math.max(...lines.map((l) => width(F, l, k)));
      if ((lines.length <= maxL && tall <= H0 && wide <= W0) || size <= floor) break;
      size = Math.max(floor, size * 0.94);
    }
    const k = size / F.cap;
    const tooBig = lines.length > maxL || Math.max(...lines.map((l) => width(F, l, k))) > W0 + 0.5;
    const R = Loom.rng(o.seed == null ? (SEED += 13) : o.seed);
    const marks = [], boxes = [];
    lines.forEach((line, li) => {
      const lw = width(F, line, k), x0 = (o.x || 0) + (o.align === "center" ? (W0 - lw) / 2 : o.align === "right" ? W0 - lw : 0);
      const base = (o.y || 0) + size + li * size * (1 + gap);
      let adv = 0;
      boxes.push({ text: line, x: x0, y: base - size * 1.25, w: lw, h: size * 1.6, base, size, first: marks.length });
      for (const ch of line) {
        const g = F.glyphs[ch] || F.glyphs["?"], ga = advOf(F, ch) * k;
        if (g && g.s) {
          const rot = (R() - 0.5) * 0.07, dy = (R() - 0.5) * size * 0.07, sc = 1 + (R() - 0.5) * 0.06, cx = x0 + adv + ga / 2;
          for (const st of g.s) {
            const p = [];
            for (let i = 0; i < st.length; i += 2) {
              const px = (st[i] - g.a / 2) * k * sc, py = -st[i + 1] * k * sc;
              p.push(cx + px * Math.cos(rot) - py * Math.sin(rot), base + dy + px * Math.sin(rot) + py * Math.cos(rot));
            }
            if (p.length === 2) p.push(p[0] + 0.8, p[1] + 0.8);
            marks.push(mark(p, { w: o.w_line || clamp(size * 0.11, 2.4, 6), jitter: 0.3, wav: 70, kind: "text", smooth: 1, pen: o.pen }));
          }
        }
        adv += ga;
      }
      boxes[li].last = marks.length;
    });
    marks.text = String(str); marks.lines = boxes; marks.size = size; marks.fits = !tooBig;
    marks.width = Math.max(0, ...boxes.map((b) => b.w)); marks.height = lines.length * size * (1 + gap) - size * gap;
    return marks;
  };

  // ---------------------------------------------------------------- the board: pens, schedule, performer, sound
  // ONE hand for the whole film (2026-10-15, Kshitij: two hands showed at a join, one parking while the next arrived):
  // every board's strokes go on one schedule, the hand is posed by the film clock, and it moves to the station of the
  // stroke it is on, always as that station's last child, so it is above everything on the board (text never shows
  // through it). Captions and the brand layer stay above it (they are outside the stations).
  let HAND = null, HEAD = 0, BOARDS = 0;
  // the frame's right and bottom edges in a station's own units at time t (the camera is a pure function of time), and
  // k, screen px per station unit
  function frameIn(st, t) {
    const Wd = Loom.world, ws = (st && st.ws) || 1;
    if (!st || !Wd || !Wd.cameraAt) return { r: 1920, b: 1080, k: 1 };
    const c = Wd.cameraAt(t);
    return { r: (960 / c.s + c.cx - (st.wx || 0)) / ws, b: (540 / c.s + c.cy - (st.wy || 0)) / ws, k: c.s * ws };
  }
  // parked: straight down along the arm from where the hand left off, below the frame (it withdraws, it never flies to a
  // corner)
  const parkFrom = (x, y, F) => { const yp = F.b + 140 / F.k; return [x + Math.max(0, yp - y) * 0.45, yp]; };
  // where the arm's right edge leaves the frame's bottom line, for the hand at (x, y) turned th degrees
  function armExit(A, x, y, th, F) {
    const r = th * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const px = x + A.x * c - A.y * s, py = y + A.x * s + A.y * c, dx = A.dx * c - A.dy * s, dy = A.dx * s + A.dy * c;
    if (py >= F.b) return -Infinity;               // the sleeve starts below the frame: only the hand is in view
    if (dy < 0.05) return Infinity;
    return px + dx * (F.b - py) / dy + A.w * 0.5 / dy;
  }
  // the arm always comes up from the BOTTOM edge (2026-10-15, Kshitij: "sometimes touching the bottom of the screen but
  // sometimes not"): near the right edge the hand turns upright just enough that its arm leaves through the bottom, never
  // the side. The smallest such turn, found by bisection, so it changes smoothly as the hand moves
  function armAngle(A, x, y, th, F) {
    const lim = F.r - 24 / F.k;
    if (armExit(A, x, y, th, F) <= lim) return th;
    let lo = th, hi = th + 70;
    if (armExit(A, x, y, hi, F) > lim) return hi;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (armExit(A, x, y, m, F) > lim) lo = m; else hi = m; }
    return hi;
  }
  function board(ctx, opts) {
    BOARDS++;
    const beat = ctx.beat, pens = {}, B = { marker: !(opts && opts.marker === false) };
    const worldOf = (E) => {                        // an element's offset in the scene's station (nested elements add up)
      let x = 0, y = 0;
      for (let n = E.outer; n && n !== ctx.g && n.parentNode; n = n.parentNode) {
        const tr = n.getAttribute && n.getAttribute("transform"), m = tr && /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\s*\)/.exec(tr);
        if (m && n.classList && n.classList.contains("lm-el")) { x += +m[1]; y += +m[2]; }
      }
      return [x, y];
    };
    const host = (ctx.station && ctx.station.svg) || ctx.g;
    function pen(id) {
      const key = id || "ink";
      if (pens[key]) return pens[key];
      // ONE hand for the whole board: the pens are colours it picks up, so two things are never drawn at once
      if (!B._h) {
        if (B.marker === false) B._h = { segs: [], free: -1, node: null, col: null };   // no hand: its own schedule
        else { if (!HAND) { HAND = { segs: [], free: -1, node: null, col: null }; performer(HAND); } B._h = HAND; }
      }
      const P = { id: key, color: S().c(key), h: B._h };
      pens[key] = P;
      return P;
    }
    // ---- the floating marker: drawn once, posed every frame from the pen's schedule (a pure function of t)
    function performer(P) {
      const g = svg("g", { class: "lm-wb-marker", opacity: 0, "pointer-events": "none" }, host);
      // flat and minimal, in the pack's own colours: a soft shadow, a body in the surface colour with a thin line, the
      // nib and the cap in the pen's colour
      const sh = svg("g", { opacity: 0.12 }, g);
      svg("rect", { x: 6, y: -7, width: 200, height: 14, rx: 7, fill: S().c("ink") }, sh);
      const body = svg("g", {}, g);
      const nib = svg("path", { d: "M0,0 L12,-6 L12,6 Z", fill: S().c("ink") }, body);
      svg("rect", { x: 11, y: -11, width: 150, height: 22, rx: 6, fill: S().c("surface"), stroke: S().c("line"), "stroke-width": 1.6 }, body);
      const cap = svg("rect", { x: 152, y: -13, width: 46, height: 26, rx: 7, fill: S().c("ink") }, body);
      P.node = g; P.sh = sh; P.body = body; P.nib = nib; P.cap = cap;
      // the designed writing hand (docs/assets/HAND_PROMPT_WHITEBOARD.md), when the build carries it: it replaces the bare
      // marker. Code never draws a hand (D-102); without the art the marker alone performs
      const art = (Loom.assets || {}).wbHand;
      if (art && art.write) {
        body.setAttribute("display", "none"); sh.setAttribute("display", "none");
        P.hand = {};
        P.handRot = art.write.rotate == null ? -8 : art.write.rotate;   // the art's own angle (data-rotate)
        for (const name of ["write", "write_lifted", "rest"]) {
          const A = art[name] || art.write, SC = A.scale || 0.62;
          // the sleeve's axis in the hand's own units (data-arm: its centre where the picture ends, its direction, its width)
          if (name === "write" && A.arm && A.arm.length >= 5)
            P.arm = { x: (A.arm[0] - A.anchor[0]) * SC, y: (A.arm[1] - A.anchor[1]) * SC, dx: A.arm[2], dy: A.arm[3], w: A.arm[4] * SC };
          const hg = svg("g", { display: name === "write" ? "inline" : "none" }, g);
          const inner = svg("g", { transform: `scale(${SC}) translate(${-A.anchor[0]} ${-A.anchor[1]})` }, hg);
          inner.innerHTML = A.body;
          P.hand[name] = { g: hg, pens: Array.from(inner.querySelectorAll(".pen")) };
        }
      }
      // posed by the film clock (one call a frame, whatever the beat), so no two beats ever pose it at once
      if (Loom.clock) { Loom.clock((t) => pose(P, t)); return; }
      const t0 = Math.max(0, ctx.start - 0.5), D = Math.max(0.5, ctx.end + 1.0 - t0), proxy = { v: 0 };
      Loom.tween(proxy, { v: 0 }, { v: 1, duration: D, ease: "none", onUpdate() { pose(P, t0 + proxy.v * D); } }, t0,
        { kind: "performer", beat: beat.id, name: "marker", content: false });
    }
    function pose(P, t) {
      const S_ = P.segs; let q = null;
      if (S_.length) {
        let i = S_.findIndex((s) => s.t1 >= t);
        if (i >= 0 && t >= S_[i].t0) {
          const s = S_[i], p = at(s.m, hand((t - s.t0) / Math.max(1e-6, s.t1 - s.t0)) * s.m.len);
          q = { x: p[0] + s.ox, y: p[1] + s.oy, lift: 0, col: s.color, host: s.host, st: s.st };
        } else {
          const a = i < 0 ? S_[S_.length - 1] : i > 0 ? S_[i - 1] : null, b = i < 0 ? null : S_[i], IN = 0.42, OUT = 0.38;
          const gap = a && b && a.host === b.host ? b.t0 - a.t1 : 1e9;
          if (a && b && gap < 0.8) {               // a hop between strokes: the nib lifts and travels
            const u = clamp((t - a.t1) / gap, 0, 1), e = u * u * (3 - 2 * u), [ax, ay] = end(a.m), [bx, by] = start(b.m);
            const hop = Math.min(1, Math.hypot(bx + b.ox - ax - a.ox, by + b.oy - ay - a.oy) / 220 + 0.25);
            q = { x: lerp(ax + a.ox, bx + b.ox, e), y: lerp(ay + a.oy, by + b.oy, e), lift: Math.sin(Math.PI * u) * hop, col: u < 0.5 ? a.color : b.color, host: a.host, st: a.st };
          } else if (a && t - a.t1 < OUT) {          // away to park
            const u = (t - a.t1) / OUT, e = u * u, [ax, ay] = end(a.m), K = parkFrom(ax + a.ox, ay + a.oy, frameIn(a.st, t));
            q = { x: lerp(ax + a.ox, K[0], e), y: lerp(ay + a.oy, K[1], e), lift: Math.min(1, u * 3), col: a.color, host: a.host, st: a.st };
          } else if (b && b.t0 - t < IN) {           // in from park
            const u = 1 - (b.t0 - t) / IN, e = 1 - (1 - u) * (1 - u) * (1 - u), [bx, by] = start(b.m), K = parkFrom(bx + b.ox, by + b.oy, frameIn(b.st, t));
            q = { x: lerp(K[0], bx + b.ox, e), y: lerp(K[1], by + b.oy, e), lift: Math.min(1, (1 - u) * 2.2), col: b.color, host: b.host, st: b.st };
          }
        }
      }
      if (!q) { P.node.setAttribute("opacity", 0); return; }
      const up = q.lift * 16, ang = -52 - q.lift * 4;
      P.node.setAttribute("opacity", 1);
      const host = q.host || P.node.parentNode;      // on top of its station: the last thing drawn there
      if (host && host.lastChild !== P.node) host.appendChild(P.node);
      if (q.col && q.col !== P.col) {
        P.col = q.col; P.nib.setAttribute("fill", q.col); P.cap.setAttribute("fill", q.col);
        if (P.hand) for (const k in P.hand) for (const el of P.hand[k].pens) el.setAttribute("fill", q.col);
      }
      if (P.hand) {                                    // the pose follows the nib: on the board, lifted, or resting
        const want = q.lift < 0.15 ? "write" : q.lift < 0.85 ? "write_lifted" : "rest";
        if (want !== P.pose) { for (const k in P.hand) P.hand[k].g.setAttribute("display", k === want ? "inline" : "none"); P.pose = want; }
        // the whole hand turns a little with where it is on the board (left: more upright, right: more tilted)
        const hx = q.x, hy = q.y - q.lift * 10;
        let th = P.handRot + clamp((q.x - 960) / 960, -1, 1) * 5 - q.lift * 3;
        if (P.arm) th = armAngle(P.arm, hx, hy, th, frameIn(q.st, t));
        P.node.setAttribute("transform", `translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${th.toFixed(2)})`);
        return;
      }
      P.node.setAttribute("transform", `translate(${(q.x - up * 0.15).toFixed(2)} ${(q.y - up).toFixed(2)})`);
      P.body.setAttribute("transform", `rotate(${ang.toFixed(2)})`);
      P.sh.setAttribute("transform", `translate(${(8 + up * 0.9).toFixed(2)} ${(10 + up * 1.3).toFixed(2)}) rotate(${(ang + 12).toFixed(2)})`);
      P.sh.setAttribute("opacity", (0.12 - q.lift * 0.05).toFixed(3));
    }

    // ---- draw marks into an element, in order, on one pen; returns the time the last stroke ends
    B.draw = function (E, marks, o) {
      o = o || {};
      if (!E || !E.inner) throw new Error(`${beat.id}: board.draw needs an element made with ctx.el`);
      const list = [].concat(marks || []).filter(Boolean);
      if (!list.length) return o.at || ctx.start;
      const P = pen(o.pen || (list[0] && list[0].pen) || "ink");
      const want = o.at == null ? ctx.speechStart : o.at;
      const H = P.h;
      let t = Math.max(want, H.free + 0.05);
      const late = t - want;
      // words written well behind their spoken cue are out of sync (film A: up to 6 s at b10): an error the scene fixes by
      // giving parts a `by`, fewer words, or an earlier start; a little late is a warning
      if (late > 1.5) Loom.error("wb_pen_late", `${beat.id}: the hand starts "${E.name}" ${late.toFixed(2)}s after it was asked (it was still drawing): give earlier parts a \`by\`, write fewer words, or start this part later in the speech`, { beat: beat.id });
      else if (late > 0.25) Loom.warn("wb_pen_late", `${beat.id}: the hand starts "${E.name}" ${late.toFixed(2)}s after it was asked (it was still drawing)`, { beat: beat.id });
      const [ox, oy] = worldOf(E);
      // the hops between strokes; within lettering they are short (a pen lifting between letters, not crossing a board)
      const gaps = list.map((m, i) => !i ? 0 : m.kind === "text" && list[i - 1].kind === "text"
        ? clamp(Math.hypot(m.pts[0] - end(list[i - 1])[0], m.pts[1] - end(list[i - 1])[1]) / 2400, 0.012, 0.12)
        : clamp(Math.hypot(m.pts[0] - end(list[i - 1])[0], m.pts[1] - end(list[i - 1])[1]) / 1400, 0.03, 0.25));
      // px a second along the line. Lettering keeps pace with speech (about 3.5 words a second, a little faster than a
      // voice): it was written at 1.8 words a second and fell behind the narration (film A, 2026-10-15)
      const speed = o.speed || 950;
      let durs = list.map((m) => Math.max(m.kind === "dash" ? 0.03 : m.kind === "text" ? 0.03 : m.len < 10 ? 0.05 : 0.08, m.len / (m.kind === "text" ? speed * 1.05 : speed)) * (o.slow || 1));
      if (late > 0.1 && o.by == null && o.dur == null) {   // catching up: a part that starts late is drawn faster (at most 1.8 x)
        const nat = durs.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0), k = Math.min(1.8, 1 + late / Math.max(0.4, nat));
        for (let i = 0; i < durs.length; i++) { durs[i] /= k; gaps[i] /= k; }
      }
      if (o.by != null || o.dur != null) {          // fit: finish exactly at `by` (a spoken word); hops take at most 35 %
        const win = (o.by != null ? o.by : t + o.dur) - t;
        if (win < 0.08 * Math.sqrt(list.length)) Loom.warn("wb_window_tight", `${beat.id}: ${list.length} strokes of "${E.name}" in ${win.toFixed(2)}s`, { beat: beat.id });
        const G = gaps.reduce((a, b) => a + b, 0), gs = G > Math.max(0, win) * 0.35 ? Math.max(0, win) * 0.35 / G : 1;
        for (let i = 0; i < gaps.length; i++) gaps[i] *= gs;
        const avail = Math.max(0.05 * list.length, win - G * gs), L = list.reduce((a, m) => a + m.len, 0);
        durs = list.map((m) => avail * m.len / L);
      }
      const col = P.color;
      list.forEach((m, i) => {
        t += gaps[i];
        const d = durs[i], t0 = t, t1 = t + d;
        const dpath = "M" + m.pts.reduce((a, v, j) => a + (j % 2 ? "," : j ? " L" : "") + v.toFixed(1), "");
        const w = m.w, Lp = m.len, off0 = Lp + w + 2;
        if (m.ghost) {                               // the hand's path over a heading: nothing drawn, the reveal follows it
        } else if (m.len < w * 1.4 && m.kind !== "dash") {  // a dot
          const c = svg("circle", { cx: m.pts[0].toFixed(1), cy: m.pts[1].toFixed(1), r: (w * 0.62).toFixed(2), fill: col, opacity: 0 }, E.inner);
          Loom.tween(c, { opacity: 0 }, { opacity: m.alpha, duration: 0.04 }, t0, { kind: "draw", beat: beat.id, name: E.name, content: true });
        } else {
          const p = svg("path", { d: dpath, fill: "none", stroke: col, "stroke-width": w.toFixed(2), "stroke-linecap": "round", "stroke-linejoin": "round",
            opacity: m.alpha, "stroke-dasharray": `${Lp.toFixed(2)} ${(Lp + 3 * w + 6).toFixed(2)}`, "stroke-dashoffset": off0.toFixed(2) }, E.inner);
          Loom.tween(p, { strokeDashoffset: off0 }, { strokeDashoffset: 0, duration: d, ease: (u) => hand(u) }, t0, { kind: "draw", beat: beat.id, name: E.name, content: true });
        }
        H.segs.push({ m, t0, t1, ox, oy, color: col, host, st: ctx.station || null });
        t = t1;
      });
      H.segs.sort((a, b) => a.t0 - b.t0);
      // sound only when asked, once for the whole group, quiet and short (never a sound on every stroke)
      if (o.sound) Loom.sfx("marker", t - durs.reduce((a, b) => a + b, 0) - gaps.reduce((a, b) => a + b, 0), { g: 0.5 });
      H.free = t;
      if (E.revealT == null || want < E.revealT) { E.revealT = Math.min(want, list.length ? t - durs.reduce((a, b) => a + b, 0) : want); E.revealKind = "draw"; }
      return t;
    };
    // ---- write words into a text element: laid out in its box (wrapped, shrunk to fit), written stroke by stroke. The
    // words are also on the page as text the checks read (same place and width, painted by the strokes, not the font)
    B.write = function (E, str, o) {
      o = o || {};
      const marks = V.text(str, Object.assign({ x: 0, y: 0, w: E.w || undefined, h: E.h || undefined }, o));
      if (!marks.fits) Loom.warn("wb_text_floor", `${beat.id}: "${String(str).slice(0, 40)}" does not fit "${E.name}" (${E.w}x${E.h}) at the smallest size`, { beat: beat.id });
      const t0 = Math.max(o.at == null ? ctx.speechStart : o.at, (B._h ? B._h.free : -1) + 0.05);
      for (const b of marks.lines) {
        const tx = svg("text", { x: b.x.toFixed(1), y: b.base.toFixed(1), "font-size": (b.size / 0.7).toFixed(1), "font-family": family("body"),
          textLength: Math.max(1, b.w).toFixed(1), lengthAdjust: "spacingAndGlyphs", "fill-opacity": 0, opacity: 0, "data-engine-text": "whiteboard" }, E.inner);
        tx.textContent = b.text;
        // its box hugs the drawn letters (the checks read it): the font size set so the face's ascent is the cap height,
        // measured once on this text (the face is embedded: the same on every build)
        try { const bb = tx.getBBox(), fs = +tx.getAttribute("font-size"), asc = (b.base - bb.y) / fs;
          if (asc > 0.2) tx.setAttribute("font-size", (b.size * 1.06 / asc).toFixed(1)); } catch (e) { /* not laid out: keep */ }
        Loom.tween(tx, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0, { kind: "draw", beat: beat.id, name: E.name, content: true });
      }
      return B.draw(E, marks, o);
    };
    // ---- a heading in the pack's bold display face (Kshitij, 2026-10-15, "Two faces": every word on the board in the
    // engine's marker lettering, headings in the pack's display face). The face is revealed left to right under the hand,
    // which writes along it: one hand, one order, the same scheduler (`at`, `by`, `dur`, `pen` as B.draw). Box: the
    // element's (or {x, y, w, h}); one line, shrunk to fit, never below the label size; `align` left, center or right.
    B.heading = function (E, str, o) {
      o = o || {};
      if (!E || !E.inner) throw new Error(`${beat.id}: board.heading needs an element made with ctx.el`);
      const T = (S().pack && S().pack.type) || {}, role = o.role || "title";
      const fam = family("display");
      let size = o.size || (T[role] || T.title || [72])[0];
      const W0 = o.w != null ? o.w : (E.w || 1e9), H0 = o.h != null ? o.h : (E.h || 1e9), floor = (T.label || [28])[0];
      const tx = svg("text", { x: 0, y: 0, "font-family": fam, "font-weight": 700, "font-size": size.toFixed(1), fill: S().c(o.pen || "ink"),
        "data-engine-heading": "whiteboard" }, E.inner);
      tx.textContent = String(str);
      let w = tx.getComputedTextLength();
      while ((w > W0 || size * 1.1 > H0) && size > floor) { size = Math.max(floor, size * 0.94); tx.setAttribute("font-size", size.toFixed(1)); w = tx.getComputedTextLength(); }
      if (w > W0 + 1) Loom.warn("wb_text_floor", `${beat.id}: heading "${String(str).slice(0, 40)}" does not fit "${E.name}" (${E.w}x${E.h}) at the smallest size`, { beat: beat.id });
      const align = W0 < 1e8 ? (o.align || "left") : "left";
      const x0 = (o.x || 0) + (align === "center" ? (W0 - w) / 2 : align === "right" ? W0 - w : 0);
      const base = (o.y || 0) + (H0 < 1e8 ? Math.min(H0, size * 1.1) / 2 + size * 0.32 : size * 0.85);
      tx.setAttribute("x", x0.toFixed(1)); tx.setAttribute("y", base.toFixed(1));
      // revealed by a clip that opens under the hand (ids from the beat and an order: the same on every build)
      const id = `wbh-${beat.id}-${HEAD++}`;
      const cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, E.inner));
      const pad = size * 0.15, cr = svg("rect", { x: (x0 - pad).toFixed(1), y: (base - size * 1.05).toFixed(1), width: 0, height: (size * 1.5).toFixed(1) }, cp);
      tx.setAttribute("clip-path", `url(#${id})`);
      // the hand's path: a low zigzag through the letters' middle, left to right
      const step = size * 0.3, pts = []; let up = true;
      for (let xx = x0; xx < x0 + w; xx += step) { pts.push(xx, base - size * (up ? 0.5 : 0.14)); up = !up; }
      pts.push(x0 + w, base - size * 0.3);
      const m = mark(pts, { jitter: 0, w: 2 }); m.kind = "text"; m.ghost = true;
      B.draw(E, [m], Object.assign({}, o, { sound: false }));
      const sg = B._h.segs.find((q) => q.m === m);
      Loom.tween(cr, { attr: { width: 0 } }, { attr: { width: w + pad * 2 }, duration: Math.max(0.05, sg.t1 - sg.t0), ease: (u) => hand(u) }, sg.t0,
        { kind: "draw", beat: beat.id, name: E.name, content: true });
      return sg.t1;
    };
    B.pen = (id) => pen(id).id;
    B.free = () => (B._h ? B._h.free : -1);
    return B;
  }

  // ---------------------------------------------------------------- the board's lettering, audited once built
  // Kshitij, 2026-10-15 ("Two faces", after film A showed three typefaces at once): every word on the board is written by
  // the engine in its marker lettering (B.write), or is a heading in the pack's display face (B.heading, or a kit part set
  // in that face). Run by boot (and the lab) after every scene is built. Not the board: captions and the chrome (outside
  // the stations), characters, speech bubbles, devices and screens, ambience.
  const NOT_BOARD = ["character", "bubble", "device", "screen", "media", "ambient"];
  function audit() {
    if (!BOARDS) return;             // no scene drew on a board: a lab or a lesson that does not use the engine
    const fam = (e) => String(getComputedStyle(e).fontFamily || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    const disp = family("display").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    const seen = new Set();
    for (const t of document.querySelectorAll(".lm-el text")) {
      if (t.closest(".lm-wb-marker") || t.getAttribute("data-engine-text") || t.getAttribute("data-engine-heading")) continue;
      if (!(t.textContent || "").trim()) continue;
      let el = t.closest(".lm-el"), skip = false, top = el;
      for (let n = el; n; n = n.parentElement && n.parentElement.closest(".lm-el")) { top = n; if (NOT_BOARD.includes(n.getAttribute("data-kind"))) skip = true; }
      if (skip) continue;
      const f = fam(t);
      if (!f || f === disp) continue;
      const name = el.getAttribute("data-name"), key = name + "|" + f;
      if (seen.has(key)) continue;
      seen.add(key);
      let beatId = null;
      for (let n = t; n && n.nodeType === 1 && !beatId; n = n.parentNode) beatId = (n.getAttribute && n.getAttribute("data-beat")) || (n.__E && n.__E.beat) || null;
      Loom.error("wb_face", `${beatId || "?"}: "${t.textContent.trim().slice(0, 40)}" in ${name} (${top.getAttribute("data-name")}) is set in ${f}: on a whiteboard engine board every word is written by the engine (board.write) or is a heading in the display face (board.heading)`,
        beatId ? { beat: beatId } : {});
    }
  }

  const api = Object.assign({ board, audit }, V);
  Loom.engines.define("whiteboard", { version: "1", summary: "dry-erase marker drawn live: marks, a writing hand of one stroke, pens on the spoken words, a floating marker, stroke sounds; one hand for the film, on top, its arm always from the bottom edge", api });
})();
