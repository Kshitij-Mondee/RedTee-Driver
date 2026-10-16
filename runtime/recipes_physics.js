/* Physics recipes (D-139): ready teaching moments built on Loom.physics (runtime/physics.js), for the topic packs in
 * docs/research/2026-10-08-topic-asset-needs.md section 10. Every word, count and proportion is an INPUT; a recipe
 * never invents one. Outcomes the lesson states (which bin, which layer stops what) are placed by construction,
 * then checked by the recipe itself (it warns by name when the baked world disagrees with the inputs).
 *
 *   const h = Loom.physics.sieve(ctx, "layers", {layers: [...], stopped: [...], total, t: ctx.cue("...")});
 *   h.ok, h.expected, h.got        // the stated outcome and what the baked world shows
 *   h.check(otherExpected)         // the same comparison against other numbers: returns the problems (a control)
 *
 * How the outcome is made certain (never by luck):
 *   - columns: a body falls straight down its own column and meets only the statics placed for it (sieve,
 *     trainTestSplit, biasedFunnel's rain), so no two bodies share a path;
 *   - tosses: a body leaves a spout with the velocity that lands it at its target, solved with Matter's own
 *     integration rule for a free body (sortIntoBins, nextTokenDraw, puePour);
 *   - slots: bodies stack in fixed positions, flat on flat (contextWindow, inboxFlood, priorityJar's bricks);
 *   - geometry: a support that stays under the centre of mass, a knock that pushes outward (redundancyTopple).
 * Then the recipe reads the baked final poses back (the world's own replay table, through its drive) and compares.
 * Every recipe reports to Loom.report.physics_recipes and warns `physics_recipe_outcome` on a disagreement and
 * errors `physics_recipe_input` on inputs it cannot honour (counts that do not add up, more than 30 bodies).
 * Colours are tokens only; every word is SVG text (kit.text) drawn on the body or beside the set.
 */
// @capability physics_recipes | motion | Loom.physics.sieve, sortIntoBins, contextWindow, inboxFlood, trainTestSplit, nextTokenDraw, biasedFunnel, priorityJar, redundancyTopple, puePour (ctx, name, opts) | Real physics, baked | ready physics teaching moments: layered defences that each stop some, items sorted into named bins, a fixed context window overflowing, a reply-all flood, a locked test split, a weighted next-token draw, a biased funnel, priorities in a jar, a spare support, energy split into IT and overhead
(function () {
  "use strict";
  const Loom = window.Loom;
  if (!Loom || !Loom.physics) return;
  const P = Loom.physics;
  const K = () => Loom.kit;
  const S = () => Loom.style;
  const REG = (P.recipes = P.recipes || {});
  const FPS = 30;
  const G_STEP = 0.001 * (1000 / 60) * (1000 / 60);   // Matter: gravity 1 adds 0.2778 px per step to the velocity
  const MAX_BODIES = 30;

  /* ------------------------------------------------------------------ helpers */
  const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (v) => String(Math.round(v * 10) / 10);
  function boxOf(ctx, o) {
    const b = ctx.box || K().SAFE;
    return { x: num(o.x, b.x), y: num(o.y, b.y), w: num(o.w, b.w), h: num(o.h, b.h) };
  }
  function startOf(ctx, o) { return num(o.t, (ctx.start || 0) + 0.2); }
  function bad(recipe, name, msg) { Loom.error("physics_recipe_input", `${recipe} "${name}": ${msg}`); }
  /** the text token with the best contrast on a fill token */
  function onTok(fill) {
    const st = S();
    if (st.outlined && st.outlined()) return "ink";
    const f = st.c(fill);
    let best = "ink", bc = 0;
    for (const t of ["ink", "field", "onAccent"]) {
      if (!(t in st.pack.palette)) continue;
      const c = st.contrast(f, st.pack.palette[t]);
      if (c > bc) { bc = c; best = t; }
    }
    return best;
  }
  /** largest-remainder split of n into the given shares (the counts always add up to n) */
  function split(shares, n) {
    const tot = shares.reduce((a, b) => a + b, 0) || 1;
    const raw = shares.map((s) => (s / tot) * n), out = raw.map(Math.floor);
    let left = n - out.reduce((a, b) => a + b, 0);
    const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]] += 1;
    return out;
  }
  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /** a set piece or label: an element at station coords with its own local box */
  function setEl(ctx, name, x, y, w, h, kind, parent) {
    return ctx.el(name, { x, y, w, h, kind: kind || "set", exit: "recede", parent });
  }
  /** a word on the slide, fitted with real metrics; the box is the element's own (so the checks see it) */
  function label(ctx, name, str, x, y, w, h, o) {
    o = o || {};
    const E = setEl(ctx, name, x, y, w, h, "text", o.parent);
    K().text(E.inner, String(str), { x: 0, y: 0, w, h, role: o.role || "label", align: o.align || "center", valign: o.valign || "middle",
      maxLines: o.maxLines || 2, color: o.color || "ink", weight: o.weight });
    if (o.at != null) Loom.motion.reveal(E, o.at, { dy: 8 });
    return E;
  }
  /** Matter's step rule for a free body (fixed 1/60 s steps): v = v (1 - frictionAir) + g; x += v. The launch
   *  velocity (px per step) that carries a body from (x0, y0) to x1 when it comes down through y1. */
  function toss(x0, y0, x1, y1, vy0, fa, gravity) {
    const g = G_STEP * (gravity == null ? 1 : gravity), k1 = 1 - fa;
    let y = y0, vy = vy0, sum = 0, k = 1, n = 0;
    while (n < 900) { vy = vy * k1 + g; y += vy; n++; k *= k1; sum += k; if (vy > 0 && y >= y1) break; }
    return { vx: (x1 - x0) / sum, vy: vy0, steps: n, seconds: n / 60 };
  }
  function parsePose(g) {
    const tr = (g && g.getAttribute("transform")) || "";
    const m = tr.match(/translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)\s*rotate\(([-\d.e]+)/);
    return m ? { dx: +m[1], dy: +m[2], a: (+m[3] * Math.PI) / 180 } : { dx: 0, dy: 0, a: 0 };
  }

  /** A world whose final poses can be read back. body() keeps each body's spec and drawing group; run() bakes
   *  through Loom.physics.world, catches the world's own replay drive, and samples it: final poses (world-local
   *  centres) and, on demand, the whole trail (one pose per output frame). The page is left at frame 0. */
  function baked(ctx, name, wo) {
    const w = P.world(ctx, name, wo);
    const specs = {}, gs = {}, order = [];
    const seconds = Math.max(0.2, Math.min(wo.seconds || 4, 20));
    const frames = Math.ceil(seconds * FPS) + 1;
    const t0 = w.t0;
    const api = {
      w, specs, gs, order, t0, seconds, frames,
      static(s) { w.static(s); return api; },
      body(bname, spec, draw) {
        specs[bname] = spec; order.push(bname);
        return w.body(bname, Object.assign({}, spec, { draw: (g, W, H) => { gs[bname] = g; if (draw) draw(g, W, H); } }));
      },
      run() {
        let fn = null;
        const orig = Loom.drive;
        Loom.drive = function (f, t, d, e, meta) { if (meta && meta.kind === "physics" && meta.name === name) fn = f; return orig.apply(this, arguments); };
        try { w.run(); } finally { Loom.drive = orig; }
        const rep = (Loom.report.physics || []).filter((r) => r.name === name).pop() || {};
        const sample = (p) => {
          if (w.posesAt) {         // the official read of the baked table (physics.js); the drive hook below is the fallback
            const P = w.posesAt(p), out = {};
            for (const n of order) out[n] = { x: P[n].x, y: P[n].y, a: P[n].a - (specs[n].angle || 0) };
            return out;
          }
          if (fn) fn(p, p);
          const out = {};
          for (const n of order) { const q = parsePose(gs[n]), s = specs[n]; out[n] = { x: (s.x || 0) + q.dx, y: (s.y || 0) + q.dy, a: q.a }; }
          return out;
        };
        api.final = sample(1);
        let trail = null;
        api.trail = () => {
          if (!trail) { trail = []; for (let f = 0; f < frames; f++) trail.push(sample(f / (frames - 1))); sample(0); }
          return trail;
        };
        /** the time a body comes to rest at its final place (within tol px), from the trail */
        /** the time a body first comes down through the line y (world-local), from the trail */
        api.crossT = (bname, y) => {
          const tr = api.trail();
          for (let f = 1; f < tr.length; f++) if (tr[f][bname].y >= y && tr[f - 1][bname].y < y) return t0 + f / FPS;
          return api.restT(bname, 3);
        };
        api.restT = (bname, tol) => {
          const tr = api.trail(), fin = api.final[bname];
          let f = tr.length - 1;
          while (f > 0 && Math.hypot(tr[f][bname].x - fin.x, tr[f][bname].y - fin.y) <= (tol || 2)) f--;
          return t0 + (f + 1) / FPS;
        };
        sample(0);
        api.report = rep;
        return api;
      },
    };
    return api;
  }

  /** record the verdict: compare(expected, got) returns a list of problems; warn by name when there are any */
  function verdict(ctx, recipe, name, expected, got, compare, extra) {
    const problems = compare(expected, got);
    const ok = problems.length === 0;
    if (!ok) Loom.warn("physics_recipe_outcome", `${recipe} "${name}": the baked world disagrees with the inputs: ${problems.join("; ")}`);
    const rec = Object.assign({ beat: ctx.beat && ctx.beat.id, name, recipe, ok, expected, got, problems }, extra || {});
    (Loom.report.physics_recipes = Loom.report.physics_recipes || []).push(rec);
    const h = {
      name, recipe, ok, expected, got, problems,
      /** the same comparison against other expectations (tests use it to prove the check can fail) */
      check(exp) {
        const pr = compare(exp, got);
        if (pr.length) Loom.warn("physics_recipe_outcome", `${recipe} "${name}" (check): ${pr.join("; ")}`);
        return pr;
      },
    };
    REG[name] = Object.assign(REG[name] || {}, h);
    return REG[name];
  }
  const sameCounts = (label) => (exp, got) => {
    const pr = [];
    const keys = Object.keys(Object.assign({}, exp, got));
    for (const k of keys) if ((exp[k] || 0) !== (got[k] || 0)) pr.push(`${label} ${k}: expected ${exp[k] || 0}, the world shows ${got[k] || 0}`);
    return pr;
  };
  /** a number that counts up as things land: the final value is the input, each step is a baked landing time */
  function counter(ctx, name, times, x, y, w, h, o) {
    o = o || {};
    const fill = o.fill || "surface";
    const E = setEl(ctx, name, x, y, w, h, "value");
    K().rect(E.inner, 0, 0, w, h, { fill, stroke: o.stroke || "line", r: h / 2, crisp: true });
    const t = K().text(E.inner, String(times.length), { x: 8, y: 0, w: w - 16, h, role: "label", align: "center", valign: "middle", maxLines: 1, color: onTok(fill), weight: 700 });
    const ts = times.slice().sort((a, b) => a - b);
    const T0 = o.t0, D = o.dur;
    const set = (tt) => { let n = 0; while (n < ts.length && ts[n] <= tt + 1e-6) n++; const s = String(n); t.querySelectorAll("tspan").forEach((sp, i) => { sp.textContent = i === 0 ? s : ""; }); };
    set(T0 - 1);
    Loom.drive((_e, p) => set(T0 + p * D), T0, D, "linear", { kind: "count", beat: ctx.beat && ctx.beat.id, name, content: true });
    return E;
  }
  /** tint a body when it lands: an overlay drawn in the body that fades in at the landing time */
  function tintAt(ctx, node, t, name) {
    Loom.tween(node, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, t, { kind: "emphasis", beat: ctx.beat && ctx.beat.id, name, content: true });
  }
  function checkBodies(recipe, name, n) {
    if (n > MAX_BODIES) { bad(recipe, name, `${n} bodies; a world stays under about ${MAX_BODIES} (fewer items, or two beats)`); return false; }
    return true;
  }
  function needSeconds(recipe, name, o, need) {
    if (need > 20) bad(recipe, name, `needs ${need.toFixed(1)} s of physics; a world runs at most 20 s (fewer items or a shorter gap)`);
    if (o.seconds != null && o.seconds < need) Loom.warn("physics_recipe_seconds", `${recipe} "${name}": seconds ${o.seconds} is shorter than the ${need.toFixed(1)} s the outcome needs; using ${need.toFixed(1)}`);
    return Math.min(20, Math.max(num(o.seconds, 0), need));
  }

  /* ------------------------------------------------------------------ sieve (defence_layers_sieve) */
  /** Layered defence: balls pour from the top through horizontal sieves; each layer stops exactly the count the lesson
   *  gives (a ball stopped there lands in a cell with a floor; one that passes finds an open cell); the ones that reach
   *  the bottom are the ones a person must catch.
   *  opts: layers [label], stopped [count per layer], total, t, seconds, pour (s), seed, bottomLabel, showCounts,
   *        colors {ball, stopped, passed, layer}, x, y, w, h */
  P.sieve = function (ctx, name, o) {
    o = o || {};
    const R = "sieve";
    const layers = (o.layers || []).map(String), stopped = (o.stopped || []).map((v) => Math.max(0, Math.round(v)));
    const total = Math.round(num(o.total, 0)), L = layers.length;
    if (!L || stopped.length !== L) { bad(R, name, "layers and stopped must be lists of the same length"); return null; }
    const caught = stopped.reduce((a, b) => a + b, 0);
    if (caught > total) { bad(R, name, `the layers stop ${caught} but only ${total} arrive`); return null; }
    if (!checkBodies(R, name, total) || total < 1) return null;
    const col = Object.assign({ ball: "muted", stopped: "pos", passed: "neg", layer: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), rnd = Loom.rng(num(o.seed, Loom.hash(name)));
    const labelW = clamp(B.w * 0.26, 260, 440), cntW = o.showCounts === false ? 0 : 84;
    const SX = B.x + labelW + 28, SW = B.w - labelW - 28;
    const s = Math.min(SW / total, 84), r = clamp((s - 8 - 12) / 2, 7, 24);
    if ((s - 8 - 12) / 2 < 7) bad(R, name, `${total} balls do not fit across ${Math.round(SW)} px; give the recipe more width or fewer balls`);
    const off = (SW - total * s) / 2, postW = 8, postH = Math.round(r * 0.9 + 6), FL = 12;
    const top = 2 * r + 34, gap = (B.h - top) / (L + 1);
    const yL = layers.map((_, k) => top + (k + 1) * gap);
    const pour = num(o.pour, Math.min(2.4, 0.5 + total * 0.07));
    const fall = Math.sqrt((2 * B.h) / 1000) + 0.5;
    const seconds = needSeconds(R, name, o, (pour + fall + 0.6) / 0.75);
    // fates: k = the layer that stops the ball, L = it passes every layer; columns and release order shuffled
    const fates = [];
    stopped.forEach((n, k) => { for (let i = 0; i < n; i++) fates.push(k); });
    while (fates.length < total) fates.push(L);
    const cols = shuffle(fates.map((_, i) => i), rnd);           // ball i falls down column cols[i]
    const rel = shuffle(fates.map((_, i) => i), rnd);            // the order they are released in
    const cx = (c) => off + (c + 0.5) * s;
    const w = baked(ctx, name, { x: SX, y: B.y, w: SW, h: B.h, t: t0, seconds, seed: num(o.seed, undefined), walls: { floor: true, left: true, right: true } });
    // the layers: posts at every cell edge, a floor under the cells of the balls this layer stops (and of those
    // stopped above it: no ball reaches those cells, so they are mesh); open cells are the holes
    const layerEls = [];
    yL.forEach((y, k) => {
      const solid = new Array(total).fill(false);
      fates.forEach((f, i) => { if (f <= k) solid[cols[i]] = true; });
      for (let c = 0; c <= total; c++) w.static({ shape: "rect", x: off + c * s, y: y - postH / 2, w: postW, h: postH, friction: 0.6 });
      const runs = [];
      for (let c = 0; c < total; c++) { if (!solid[c]) continue; const last = runs[runs.length - 1]; if (last && last[1] === c) last[1] = c + 1; else runs.push([c, c + 1]); }
      // the physics floor is thicker than the drawn one (40 px down from the line), so a fast ball cannot pass through it
      for (const [a, b] of runs) w.static({ shape: "rect", x: off + ((a + b) / 2) * s, y: y + 20, w: (b - a) * s + postW, h: 40, friction: 0.6 });
      // drawn: a faint band that names the layer's extent, then the same posts and floors
      const bandH = postH + FL + 2 * r + 16;
      const E = setEl(ctx, `${name}_layer_${k}`, SX, B.y + y - bandH + FL + 8, SW, bandH);
      const yb = bandH - FL - 8;   // the layer line inside the band
      K().rect(E.inner, off - postW - 6, 0, total * s + 2 * postW + 12, bandH, { fill: col.band || "field2", r: 12, crisp: true, shadow: false });
      for (const [a, b] of runs) K().rect(E.inner, off + a * s - postW / 2, yb, (b - a) * s + postW, FL, { fill: col.layer, r: 4, crisp: true, shadow: false });
      for (let c = 0; c <= total; c++) K().rect(E.inner, off + c * s - postW / 2, yb - postH, postW, postH + 4, { fill: col.layer, r: 3, crisp: true, shadow: false });
      layerEls.push(E);
    });
    const floorE = setEl(ctx, `${name}_floor`, SX, B.y + B.h, SW, FL);
    K().rect(floorE.inner, off - postW / 2, 0, total * s + postW, FL, { fill: col.layer, r: 4, crisp: true, shadow: false });
    const overlays = {};
    fates.forEach((f, i) => {
      const at = t0 + (rel.indexOf(i) / Math.max(1, total - 1)) * pour;
      w.body(`${name}_ball_${i}`, { shape: "circle", r, x: cx(cols[i]), y: r + 6, at, restitution: 0.05, friction: 0.3, frictionAir: 0.01, kind: "token" }, (g, W, H) => {
        K().disc(g, W / 2, H / 2, r, { fill: col.ball });
        overlays[i] = K().disc(g, W / 2, H / 2, r, { fill: f < L ? col.stopped : col.passed });
      });
    });
    w.run();
    // where each ball came to rest: the layer whose line it sits on, or the bottom
    const got = {}, landT = layers.map(() => []), bottomT = [];
    const exp = {};
    layers.forEach((lb, k) => { exp[`layer ${k + 1}`] = stopped[k]; got[`layer ${k + 1}`] = 0; });
    exp.bottom = total - caught; got.bottom = 0;
    fates.forEach((f, i) => {
      const bn = `${name}_ball_${i}`, p = w.final[bn];
      let at = -1;
      yL.forEach((y, k) => { if (Math.abs(p.y - (y - r)) < r * 0.8) at = k; });
      const key = at >= 0 ? `layer ${at + 1}` : (p.y > B.h - 2 * r - 4 ? "bottom" : "nowhere");
      got[key] = (got[key] || 0) + 1;
      const tr = w.restT(bn, 3);
      tintAt(ctx, overlays[i], tr - 0.05, bn);
      if (at >= 0) landT[at].push(tr); else bottomT.push(tr);
    });
    // labels: each layer's name, and the count it has stopped so far (the final number is the input)
    const lx = B.x, lw = labelW - cntW - (cntW ? 14 : 0);
    layers.forEach((lb, k) => {
      const y = B.y + yL[k];
      label(ctx, `${name}_label_${k}`, lb, lx, y - 70, lw, 80, { align: "right", role: "body" });
      if (cntW) counter(ctx, `${name}_count_${k}`, landT[k], lx + lw + 14, y - 52, cntW, 44, { fill: col.stopped, t0, dur: seconds });
    });
    if (o.bottomLabel) label(ctx, `${name}_label_bottom`, o.bottomLabel, lx, B.y + B.h - 76, lw, 80, { align: "right", role: "body" });
    if (cntW && (o.bottomLabel || caught < total)) counter(ctx, `${name}_count_bottom`, bottomT, lx + lw + 14, B.y + B.h - 58, cntW, 44, { fill: col.passed, t0, dur: seconds });
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts("stopped at"), { settled: w.report.settled, lost: w.report.lost }), { world: w });
  };
  /* ------------------------------------------------------------------ shared: a row of bins and a spout */
  /** bins side by side on the world floor: spans [{a, b}] (inner edges, world-local x), walls between and at the ends */
  function binWalls(w, spans, H, binH, wallW) {
    const edges = [];
    spans.forEach((sp) => { edges.push(sp.a - wallW / 2, sp.b + wallW / 2); });
    const uniq = edges.sort((a, b) => a - b).filter((e, i, arr) => i === 0 || e - arr[i - 1] > wallW * 0.9);
    for (const x of uniq) w.static({ shape: "rect", x, y: H - binH / 2, w: wallW, h: binH, friction: 0.4 });
    return uniq;
  }
  function drawBins(ctx, name, X, Y, spans, H, binH, wallW, walls, o) {
    o = o || {};
    const x0 = Math.min(...walls) - wallW / 2, x1 = Math.max(...walls) + wallW / 2;
    const E = setEl(ctx, `${name}_bins`, X + x0, Y + H - binH, x1 - x0, binH + 10);
    spans.forEach((sp, i) => K().rect(E.inner, sp.a - x0, 0, sp.b - sp.a, binH, { fill: (o.fills && o.fills[i]) || "field2", r: 6, crisp: true, shadow: false }));
    for (const x of walls) K().rect(E.inner, x - wallW / 2 - x0, -4, wallW, binH + 4, { fill: o.wall || "line", r: wallW / 2, crisp: true, shadow: false });
    K().rect(E.inner, 0, binH, x1 - x0, 10, { fill: o.wall || "line", r: 4, crisp: true, shadow: false });
    return E;
  }
  /** a hopper (or a pipe) at the top that things leave from; the mouth is at (sx, sy), world-local */
  function drawSpout(ctx, name, X, Y, sx, sy, kind, fill) {
    const E = setEl(ctx, `${name}_spout`, X + sx - 90, Y + Math.max(0, sy - 110), 180, Math.min(110, sy) + 6);
    const h = Math.min(110, sy);
    if (kind === "pipe") {
      K().rect(E.inner, 66, 0, 48, h - 10, { fill: fill || "surface2", stroke: "line", r: 6, crisp: true, shadow: false });
      K().rect(E.inner, 54, h - 26, 72, 26, { fill: fill || "surface2", stroke: "line", r: 6, crisp: true, shadow: false });
    } else {
      K().polygon(E.inner, [[10, 0], [170, 0], [118, h - 18], [62, h - 18]], { fill: fill || "surface2", stroke: "line", sw: 3 });
      K().rect(E.inner, 62, h - 22, 56, 22, { fill: fill || "surface2", stroke: "line", r: 4, crisp: true, shadow: false });
    }
    return E;
  }
  function binOf(spans, x, pad) { for (let i = 0; i < spans.length; i++) if (x >= spans[i].a - (pad || 0) && x <= spans[i].b + (pad || 0)) return i; return -1; }

  /* ------------------------------------------------------------------ sortIntoBins (sort_into_bins) */
  /** Items leave a hopper one by one and land in the bin the lesson gives each (the bin is an input; the toss that
   *  lands it there is solved, then checked).
   *  opts: bins [label], items [[text, bin index or bin label]], t, seconds, gap (s between items), colors {item, bin,
   *        wall, hopper}, x, y, w, h */
  P.sortIntoBins = function (ctx, name, o) {
    o = o || {};
    const R = "sortIntoBins";
    const bins = (o.bins || []).map(String), nb = bins.length;
    const items = (o.items || []).map((it) => [String(it[0]), typeof it[1] === "number" ? it[1] : bins.indexOf(String(it[1]))]);
    if (nb < 1 || nb > 6) { bad(R, name, "1 to 6 bins"); return null; }
    const wrong = items.filter((it) => !(it[1] >= 0 && it[1] < nb));
    if (wrong.length) { bad(R, name, `items with no such bin: ${wrong.map((it) => it[0]).join(", ")}`); return null; }
    if (!items.length || !checkBodies(R, name, items.length)) return null;
    const col = Object.assign({ item: "surface", bin: "field2", wall: "line", hopper: "surface2" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), gapT = num(o.gap, 0.5);
    const labH = 76, W = B.w, H = B.h - labH, wallW = 12, m = 30;
    const binW = (W - 2 * m - (nb + 1) * wallW) / nb;
    const spans = bins.map((_, i) => { const a = m + wallW + i * (binW + wallW); return { a, b: a + binW }; });
    const perBin = bins.map((_, i) => items.filter((it) => it[1] === i).length);
    const lanes = perBin.map((n) => (n > 1 && binW > 360 ? 2 : 1));
    // tiles sized to the longest word, two lanes to a wide bin
    const fitW = Math.max(...items.map((it) => K().fit(it[0], { role: "body", w: 2000, h: 80, maxLines: 1 }).width));
    const laneW = Math.min(...lanes.map((l) => binW / l));
    let tileW = clamp(fitW + 48, 140, laneW - 16), tileH = 70, lines = 1;
    if (fitW + 48 > tileW) { tileH = 112; lines = 2; }
    const binH = clamp(Math.max(...perBin.map((n, i) => Math.ceil(n / lanes[i]))) * tileH * 1.15 + 40, H * 0.32, H * 0.58);
    const sx = W / 2, sy = 118, binTop = H - binH;
    const flights = [], count = bins.map(() => 0);
    items.forEach((it, j) => {
      const b = it[1], k = count[b]++, lane = k % lanes[b];
      const tx = lanes[b] === 1 ? (spans[b].a + spans[b].b) / 2 : spans[b].a + (lane + 0.5) * (binW / lanes[b]);
      flights.push(Object.assign({ tx }, toss(sx, sy, tx, binTop - tileH / 2 - 10, 1, 0.01)));
    });
    const seconds = needSeconds(R, name, o, ((items.length - 1) * gapT + Math.max(...flights.map((f) => f.seconds)) + 2.0) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const walls = binWalls(w, spans, H, binH, wallW);
    drawBins(ctx, name, B.x, B.y, spans, H, binH, wallW, walls, { wall: col.wall, fills: spans.map(() => col.bin) });
    drawSpout(ctx, name, B.x, B.y, sx, sy, "hopper", col.hopper);
    const on = onTok(col.item);
    items.forEach((it, j) => {
      const f = flights[j];
      w.body(`${name}_item_${j}`, { shape: "rect", w: tileW, h: tileH, x: sx, y: sy, vx: f.vx, vy: f.vy, at: t0 + j * gapT, chamfer: 10,
        restitution: 0.05, friction: 0.5, frictionAir: 0.01, kind: "token" }, (g, Wd, Hd) => {
        K().rect(g, 0, 0, Wd, Hd, { fill: col.item, stroke: "line", r: 12 });
        K().text(g, it[0], { x: 18, y: 6, w: Wd - 36, h: Hd - 12, role: "body", align: "center", valign: "middle", maxLines: lines, color: on });
      });
    });
    w.run();
    bins.forEach((bl, i) => label(ctx, `${name}_bin_label_${i}`, bl, B.x + spans[i].a, B.y + H + 14, binW, labH - 14, { role: "body", weight: 700 }));
    const exp = {}, got = {};
    items.forEach((it, j) => {
      const p = w.final[`${name}_item_${j}`];
      exp[it[0] + " #" + j] = bins[it[1]];
      const b = binOf(spans, p.x, 2);
      got[it[0] + " #" + j] = b >= 0 && p.y > binTop - tileH * 0.5 ? bins[b] : "outside every bin";
    });
    const cmp = (e, g) => Object.keys(e).filter((k) => e[k] !== g[k]).map((k) => `${k.replace(/ #\d+$/, "")} should be in ${e[k]}, the world has it in ${g[k]}`);
    return Object.assign(verdict(ctx, R, name, exp, got, cmp, { settled: w.report.settled, lost: w.report.lost }), { world: w });
  };

  /* ------------------------------------------------------------------ nextTokenDraw (next_token_draw) */
  /** A ball drops into a row of bins whose widths are the candidates' probabilities; its path is solved so it lands
   *  in `chosen` (the lesson's outcome, never a hidden roll). temperature reshapes the widths: p^(1/T), normalised.
   *  opts: candidates [token], probs [p], temperature (null | "low" | "high" | number), chosen (token, index or a
   *        list of them for several draws), showProbs, t, seconds, gap, colors {ball, bin, chosen, wall}, x, y, w, h */
  P.nextTokenDraw = function (ctx, name, o) {
    o = o || {};
    const R = "nextTokenDraw";
    const cand = (o.candidates || []).map(String), probs = (o.probs || []).map(Number), n = cand.length;
    if (!n || probs.length !== n || probs.some((p) => !(p >= 0))) { bad(R, name, "candidates and probs must be lists of the same length, probs >= 0"); return null; }
    const T = o.temperature == null ? null : o.temperature === "low" ? 0.5 : o.temperature === "high" ? 2 : Number(o.temperature);
    if (T != null && !(T > 0)) { bad(R, name, `temperature ${o.temperature}: use "low", "high" or a number above 0`); return null; }
    const pw = probs.map((p) => Math.pow(p, 1 / (T || 1))), tot = pw.reduce((a, b) => a + b, 0) || 1, eff = pw.map((p) => p / tot);
    const draws = (Array.isArray(o.chosen) ? o.chosen : [o.chosen]).map((c) => (typeof c === "number" ? c : cand.indexOf(String(c))));
    if (draws.some((c) => !(c >= 0 && c < n))) { bad(R, name, `chosen ${JSON.stringify(o.chosen)} is not a candidate`); return null; }
    if (!checkBodies(R, name, draws.length)) return null;
    const col = Object.assign({ ball: "accent", bin: "field2", chosen: "accent", wall: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), gapT = num(o.gap, 1.1);
    const wallW = 8, m = 60, W = B.w;
    const BW = W - 2 * m - wallW;
    const spans = [];
    let xa = m + wallW;
    eff.forEach((e) => { const span = e * BW; spans.push({ a: xa, b: xa + Math.max(2, span - wallW) }); xa += span; });
    // labels: one row, or two staggered rows when a narrow bin's word is wider than the bin
    const lw = cand.map((c) => K().fit(c, { role: "body", w: 2000, h: 80, maxLines: 1 }).width + 20);
    // each word goes in the first row where it overlaps no word already placed (a wide bin's word sits in row 0)
    const rows = [], placed = [];
    cand.forEach((c, i) => {
      const cx = (spans[i].a + spans[i].b) / 2, wl = Math.max(lw[i], Math.min(spans[i].b - spans[i].a + wallW - 6, lw[i] + 40));
      let row = 0;
      while (placed.some((q) => q.row === row && !(cx + wl / 2 + 8 < q.a || cx - wl / 2 - 8 > q.b))) row++;
      placed.push({ row, a: cx - wl / 2, b: cx + wl / 2 }); rows.push(row);
    });
    const stagger = Math.max(...rows) > 0, nRows = Math.max(...rows) + 1;
    const showP = o.showProbs && (T == null || typeof o.temperature === "number");
    if (o.showProbs && !showP) Loom.warn("physics_recipe_probs_hidden", `${R} "${name}": temperature "${o.temperature}" reshapes the widths with an assumed T, so no percentage is printed; pass a number to print them`);
    const rowH = showP ? 84 : 52, labH = nRows * rowH + 16;
    const H = B.h - labH, binH = clamp(H * 0.34, 150, 280), binTop = H - binH, sx = W / 2, sy = 120;
    const minIn = Math.min(...draws.map((c) => spans[c].b - spans[c].a));
    const r = clamp((minIn - 12) / 2, 8, 26);
    if ((minIn - 12) / 2 < 8) bad(R, name, `the chosen bin is ${Math.round(minIn)} px wide; a ball cannot be seen landing in it`);
    const flights = draws.map((c, i) => Object.assign({ c }, toss(sx, sy, (spans[c].a + spans[c].b) / 2, binTop - r - 8, -2, 0.01)));
    const seconds = needSeconds(R, name, o, ((draws.length - 1) * gapT + Math.max(...flights.map((f) => f.seconds)) + 1.2) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const walls = binWalls(w, spans, H, binH, wallW);
    const binsE = drawBins(ctx, name, B.x, B.y, spans, H, binH, wallW, walls, { wall: col.wall, fills: spans.map(() => col.bin) });
    const x0 = Math.min(...walls) - wallW / 2;
    const glow = {};
    [...new Set(draws)].forEach((c) => { glow[c] = K().rect(binsE.inner, spans[c].a - x0, 0, spans[c].b - spans[c].a, binH, { fill: col.chosen, r: 6, crisp: true, shadow: false, opacity: 0.28 }); });
    drawSpout(ctx, name, B.x, B.y, sx, sy, "hopper");
    flights.forEach((f, i) => {
      w.body(`${name}_ball_${i}`, { shape: "circle", r, x: sx, y: sy, vx: f.vx, vy: f.vy, at: t0 + i * gapT, restitution: 0.1, friction: 0.3, frictionAir: 0.01, kind: "token" },
        (g, Wd, Hd) => K().disc(g, Wd / 2, Hd / 2, r, { fill: col.ball }));
    });
    w.run();
    const firstLand = {};
    flights.forEach((f, i) => { const tt = w.crossT(`${name}_ball_${i}`, binTop); if (firstLand[f.c] == null || tt < firstLand[f.c]) firstLand[f.c] = tt; });
    Object.keys(glow).forEach((c) => tintAt(ctx, glow[c], firstLand[c], `${name}_bin_${c}`));
    cand.forEach((c, i) => {
      const cx = (spans[i].a + spans[i].b) / 2, wl = placed[i].b - placed[i].a;
      const row = rows[i];
      const E = setEl(ctx, `${name}_cand_${i}`, B.x + cx - wl / 2, B.y + H + 12 + row * rowH, wl, rowH - 6, "text");
      K().text(E.inner, c, { x: 0, y: 0, w: wl, h: showP ? 44 : rowH - 6, role: "body", align: "center", valign: "middle", maxLines: 1, weight: draws.includes(i) ? 700 : 400 });
      if (showP) K().text(E.inner, `${fmt((T == null ? probs[i] / (probs.reduce((a, b) => a + b, 0) || 1) : eff[i]) * 100)}%`, { x: 0, y: 42, w: wl, h: 36, role: "label", align: "center", valign: "middle", maxLines: 1, color: "muted" });
    });
    const exp = {}, got = {};
    flights.forEach((f, i) => {
      const p = w.final[`${name}_ball_${i}`];
      exp[`draw ${i + 1}`] = cand[f.c];
      const b = binOf(spans, p.x, 1);
      got[`draw ${i + 1}`] = b >= 0 && p.y > binTop ? cand[b] : "no bin";
    });
    const cmp = (e, g) => Object.keys(e).filter((k) => e[k] !== g[k]).map((k) => `${k} should land in "${e[k]}", the world lands it in "${g[k]}"`);
    return Object.assign(verdict(ctx, R, name, exp, got, cmp, { settled: w.report.settled, lost: w.report.lost, widths: eff }), { world: w });
  };

  /* ------------------------------------------------------------------ puePour (pue_pour) */
  /** Energy beads pour from one pipe and split into an IT bin and overhead bins in the given shares; the total over the
   *  IT bin is the ratio the narration states (pass it as ratioText to print it; the recipe prints no number of its own).
   *  opts: itShare, itLabel, overheads [[label, share]], beads (resolution, default 20; never printed), showShares,
   *        ratioText, t, seconds, gap, colors {it, overhead, bead, wall}, x, y, w, h */
  P.puePour = function (ctx, name, o) {
    o = o || {};
    const R = "puePour";
    const ov = (o.overheads || []).map((p) => [String(p[0]), Number(p[1])]);
    const shares = [Number(o.itShare), ...ov.map((p) => p[1])], labels = [String(o.itLabel || ""), ...ov.map((p) => p[0])];
    if (!(shares[0] > 0) || !ov.length || ov.length > 4 || shares.some((s) => !(s >= 0))) { bad(R, name, "itShare above 0 and 1 to 4 overheads [[label, share]]"); return null; }
    const sum = shares.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.02) Loom.warn("physics_recipe_shares", `${R} "${name}": the shares add up to ${fmt(sum)}, not 1; the beads split them as proportions`);
    const beads = Math.round(num(o.beads, 20));
    if (!checkBodies(R, name, beads)) return null;
    const counts = split(shares, beads), nb = shares.length;
    const col = Object.assign({ it: "accent", overhead: "accent2", bead: "muted", wall: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), gapT = num(o.gap, 0.16);
    const labH = o.showShares ? 124 : 88, W = B.w, H = B.h - labH, wallW = 12;
    // narrow, deep bins: three lanes of beads, so each pile's height is its share
    const lanes = 4, r = 18, binW = lanes * (2 * r + 2) + 8;
    const gapB = clamp((W - nb * (binW + 2 * wallW)) / (nb + 1), 60, 240), m = (W - nb * (binW + 2 * wallW) - (nb - 1) * gapB) / 2;
    const spans = shares.map((_, i) => { const a = m + wallW + i * (binW + 2 * wallW + gapB); return { a, b: a + binW }; });
    const binH = clamp(Math.ceil(Math.max(...counts) / lanes) * 2 * r * 1.05 + 150, H * 0.45, H * 0.7), binTop = H - binH;
    const sx = W / 2, sy = 116;
    // the stream: beads to every bin interleaved, so the split is seen leaving the pipe
    const seq = [];
    counts.forEach((c, i) => { for (let k = 0; k < c; k++) seq.push([(k + 0.5) / c, i]); });
    seq.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (let k = 0; k < seq.length; k++) seq[k] = seq[k][1];
    const laneOf = counts.map(() => 0);
    const flights = seq.map((b) => { const k = laneOf[b]++ % 3, tx = (spans[b].a + spans[b].b) / 2 + (k - 1) * r * 0.5; return Object.assign({ b }, toss(sx, sy, tx, binTop - r - 24, 1, 0.01)); });
    const seconds = needSeconds(R, name, o, ((beads - 1) * gapT + Math.max(...flights.map((f) => f.seconds)) + 1.4) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const walls = binWalls(w, spans, H, binH, wallW);
    drawBins(ctx, name, B.x, B.y, spans, H, binH, wallW, walls, { wall: col.wall });
    drawSpout(ctx, name, B.x, B.y, sx, sy, "pipe");
    const tints = [];
    flights.forEach((f, i) => {
      w.body(`${name}_bead_${i}`, { shape: "circle", r, x: sx, y: sy, vx: f.vx, vy: f.vy, at: t0 + i * gapT, restitution: 0, friction: 0.2, frictionAir: 0.01, kind: "token" },
        (g, Wd, Hd) => { K().disc(g, Wd / 2, Hd / 2, r, { fill: col.bead }); tints[i] = K().disc(g, Wd / 2, Hd / 2, r, { fill: f.b === 0 ? col.it : col.overhead }); });
    });
    w.run();
    flights.forEach((f, i) => tintAt(ctx, tints[i], w.crossT(`${name}_bead_${i}`, binTop), `${name}_bead_${i}`));
    labels.forEach((lb, i) => {
      const lw = binW + 2 * wallW + gapB - 12;
      const E = setEl(ctx, `${name}_bin_label_${i}`, B.x + (spans[i].a + spans[i].b) / 2 - lw / 2, B.y + H + 14, lw, labH - 14, "text");
      if (lb) K().text(E.inner, lb, { x: 0, y: 0, w: lw, h: 74, role: "body", align: "center", valign: "middle", maxLines: 2, weight: i === 0 ? 700 : 400, color: "ink" });
      if (o.showShares) K().text(E.inner, `${fmt(shares[i] * 100)}%`, { x: 0, y: 74, w: lw, h: 36, role: "label", align: "center", valign: "middle", maxLines: 1, color: "muted" });
    });
    if (o.ratioText) label(ctx, `${name}_ratio`, o.ratioText, B.x, B.y, Math.min(560, W / 2 - 120), 90, { role: "lead", align: "left", valign: "top", weight: 700 });
    const exp = {}, got = {};
    labels.forEach((lb, i) => { exp[lb || `bin ${i + 1}`] = counts[i]; got[lb || `bin ${i + 1}`] = 0; });
    flights.forEach((f, i) => {
      const p = w.final[`${name}_bead_${i}`], b = binOf(spans, p.x, 1);
      const k = b >= 0 && p.y > binTop ? (labels[b] || `bin ${b + 1}`) : "outside";
      got[k] = (got[k] || 0) + 1;
    });
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts("beads in"), { settled: w.report.settled, lost: w.report.lost }), { world: w });
  };
  /* ------------------------------------------------------------------ trainTestSplit (train_test_split) */
  /** Example cards rain onto three bins whose widths are the split's shares; each card falls down a lane inside its
   *  bin, so the counts are the shares by construction. Then a lid drops on the test bin and a padlock shows on it.
   *  opts: examples (count, illustrative), split [train, val, test] shares, labels [3], t, seconds, pour, lockAt,
   *        showShares, showCounts, colors {card, bin, lid, wall}, x, y, w, h */
  P.trainTestSplit = function (ctx, name, o) {
    o = o || {};
    const R = "trainTestSplit";
    const shares = (o.split || []).map(Number), labels = (o.labels || []).map(String), N = Math.round(num(o.examples, 0));
    if (shares.length !== 3 || shares.some((v) => !(v >= 0)) || labels.length !== 3) { bad(R, name, "split must be three shares [train, val, test] and labels three words"); return null; }
    if (N < 3 || !checkBodies(R, name, N + 1)) { if (N < 3) bad(R, name, "examples must be at least 3"); return null; }
    const counts = split(shares, N);
    const col = Object.assign({ card: "surface", bin: "field2", lid: "neg", wall: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), rnd = Loom.rng(num(o.seed, Loom.hash(name)));
    const labH = 70 + (o.showShares ? 38 : 0) + (o.showCounts ? 38 : 0), W = B.w, H = B.h - labH, wallW = 12, m = 40;
    const cw = 66, chh = 86, minIn = 2 * cw + 36;
    const TW = W - 2 * m - 4 * wallW, tot = shares.reduce((a, b) => a + b, 0) || 1;
    let widths = shares.map((v) => Math.max(minIn, (v / tot) * TW));
    const over = widths.reduce((a, b) => a + b, 0) - TW;
    if (over > 0) { const big = widths.map((v) => v - minIn), bs = big.reduce((a, b) => a + b, 0) || 1; widths = widths.map((v, i) => v - (over * big[i]) / bs); }
    const spans = [];
    let xa = m + wallW;
    widths.forEach((bw) => { spans.push({ a: xa, b: xa + bw }); xa += bw + wallW; });
    const lanesN = spans.map((sp) => Math.max(1, Math.floor((sp.b - sp.a - 8) / (cw + 10))));
    const rowsMax = Math.max(...counts.map((c, i) => Math.ceil(c / lanesN[i])));
    const binH = clamp(rowsMax * chh + 110, H * 0.32, H * 0.62), binTop = H - binH;
    const pour = num(o.pour, Math.min(2.6, 0.6 + N * 0.06));
    const lockAt = num(o.lockAt, t0 + pour + 1.3);
    const seconds = needSeconds(R, name, o, (Math.max(pour + 1.6, lockAt - t0 + 1.0) + 0.6) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const walls = binWalls(w, spans, H, binH, wallW);
    drawBins(ctx, name, B.x, B.y, spans, H, binH, wallW, walls, { wall: col.wall, fills: spans.map(() => col.bin) });
    const cards = [];
    counts.forEach((c, b) => { for (let k = 0; k < c; k++) { const lane = k % lanesN[b]; const lw = (spans[b].b - spans[b].a) / lanesN[b]; cards.push({ b, x: spans[b].a + (lane + 0.5) * lw }); } });
    const order = shuffle(cards.map((_, i) => i), rnd);
    cards.forEach((cd, i) => {
      const at = t0 + (order.indexOf(i) / Math.max(1, N - 1)) * pour;
      w.body(`${name}_card_${i}`, { shape: "rect", w: cw, h: chh, x: cd.x, y: chh / 2 + 8, at, chamfer: 6, restitution: 0.02, friction: 0.6, kind: "token" }, (g, Wd, Hd) => {
        K().rect(g, 0, 0, Wd, Hd, { fill: col.card, stroke: "line", r: 6 });
        for (let l = 0; l < 3; l++) K().rect(g, 12, 20 + l * 18, l === 2 ? Wd - 36 : Wd - 24, 6, { fill: "line", r: 3, crisp: true, shadow: false });
      });
    });
    const tb = spans[2], lidW = tb.b - tb.a + 2 * wallW + 36, lidH = 60;
    const lidName = `${name}_lid`;
    w.body(lidName, { shape: "rect", w: lidW, h: lidH, x: (tb.a + tb.b) / 2, y: binTop - 150, at: lockAt, restitution: 0, friction: 0.9, density: 0.003, kind: "object" }, (g, Wd, Hd) => {
      K().rect(g, 0, 0, Wd, Hd, { fill: col.lid, r: 10 });
      K().icon(g, "lock", { x: Wd / 2, y: Hd / 2, size: 46, color: onTok(col.lid) });
    });
    w.run();
    labels.forEach((lb, i) => {
      const bw = Math.max(spans[i].b - spans[i].a, 160), cx = (spans[i].a + spans[i].b) / 2;
      const E = setEl(ctx, `${name}_bin_label_${i}`, B.x + cx - bw / 2, B.y + H + 12, bw, labH - 12, "text");
      let y = 0;
      K().text(E.inner, lb, { x: 0, y, w: bw, h: 56, role: "body", align: "center", valign: "middle", maxLines: 1, weight: 700 }); y += 56;
      if (o.showShares) { K().text(E.inner, `${fmt((shares[i] / tot) * 100)}%`, { x: 0, y, w: bw, h: 36, role: "label", align: "center", valign: "middle", maxLines: 1, color: "muted" }); y += 38; }
      if (o.showCounts) K().text(E.inner, String(counts[i]), { x: 0, y, w: bw, h: 36, role: "label", align: "center", valign: "middle", maxLines: 1, color: "muted" });
    });
    const exp = {}, got = {};
    labels.forEach((lb, i) => { exp[lb] = counts[i]; got[lb] = 0; });
    cards.forEach((cd, i) => {
      const p = w.final[`${name}_card_${i}`], b = binOf(spans, p.x, 1);
      const k = b >= 0 && p.y > binTop - chh / 2 ? labels[b] : "outside";
      got[k] = (got[k] || 0) + 1;
    });
    const lid = w.final[lidName];
    exp["lid on " + labels[2]] = 1;
    got["lid on " + labels[2]] = Math.abs(lid.x - (tb.a + tb.b) / 2) < (tb.b - tb.a) / 2 && Math.abs(lid.y - (binTop - lidH / 2)) < 14 && Math.abs(lid.a) < 0.14 ? 1 : 0;
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts("in"), { settled: w.report.settled, lost: w.report.lost }), { world: w });
  };

  /* ------------------------------------------------------------------ biasedFunnel (biased_funnel) */
  /** A mixed stream pours into a funnel; leaning pegs over part of its mouth turn some balls away, so the pile that
   *  comes out has the lesson's out shares while the stream had its in shares. Which balls are turned away is placed
   *  by construction (where each one falls), then counted in the output tray.
   *  opts: groups [label] (2 or 3), inShares, outShares, total (balls, default 24), t, seconds, pour, showShares,
   *        outLabel, skippedLabel, colors {groups: [token], funnel, tray}, x, y, w, h */
  P.biasedFunnel = function (ctx, name, o) {
    o = o || {};
    const R = "biasedFunnel";
    const groups = (o.groups || []).map(String), G = groups.length;
    const ins = (o.inShares || []).map(Number), outs = (o.outShares || []).map(Number);
    if (G < 2 || G > 3 || ins.length !== G || outs.length !== G) { bad(R, name, "2 or 3 groups, with inShares and outShares for each"); return null; }
    const total = Math.round(num(o.total, 24));
    if (!checkBodies(R, name, total)) return null;
    const nIn = split(ins, total);
    let M = total, nOut = split(outs, M);
    while (M > 0 && nOut.some((v, k) => v > nIn[k])) { M--; nOut = split(outs, M); }
    if (M < 2) { bad(R, name, "the out shares cannot be drawn from these in shares"); return null; }
    const nSkip = nIn.map((v, k) => v - nOut[k]), skipped = total - M;
    const col = Object.assign({ groups: ["accent", "accent2", "accent4"], funnel: "line", tray: "field2" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), rnd = Loom.rng(num(o.seed, Loom.hash(name)));
    const W = B.w, H = B.h, r = 15;
    const legendW = Math.min(420, W * 0.26);
    const xL = Math.max(legendW + 160, W * 0.36), xR = Math.min(W - 60, xL + 640), ym = 130, yt = H * 0.6;
    const cxT = (xL + xR) / 2 + 40, tw = 5 * 2 * r;
    const fSkip = skipped / total;
    const xd = xL + clamp(fSkip, 0.12, 0.7) * (xR - xL);
    const trayW = 9 * 2 * r, trayH = clamp(Math.ceil(M / 8) * 2 * r + 70, 110, H - yt - 40), trayL = cxT - trayW / 2;
    const pour = num(o.pour, Math.min(2.8, 0.6 + total * 0.08));
    const seconds = needSeconds(R, name, o, (pour + 3.4 + 0.6) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const seg = (x1, y1, x2, y2, th) => { const L = Math.hypot(x2 - x1, y2 - y1); w.static({ shape: "rect", x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: L, h: th, angle: Math.atan2(y2 - y1, x2 - x1), friction: 0.05 }); };
    const bx0 = xd, by0 = ym + 6, bx1 = xL - 130, by1 = ym + 6 + 0.6 * (xd - xL + 130);
    seg(bx0, by0, bx1, by1, 12);                                   // the leaning baffle
    const yl = Math.max(ym + 150, by1 - 0.6 * 130 + 40);
    seg(xL, yl, cxT - tw / 2, yt, 12);                              // funnel, left (starts below the baffle's exit)
    const sL = 12, sW = clamp(trayL - 120, 220, 340), sH = 90;   // the tray the turned-away balls fall into: they leave the
    // baffle fast, meet the world's left wall and drop; the tray's outer wall is that wall
    w.static({ shape: "rect", x: sL + sW + 6, y: H - sH / 2, w: 12, h: sH });
    seg(xR, ym - 20, cxT + tw / 2, yt, 12);                         // funnel, right
    w.static({ shape: "rect", x: trayL - 6, y: H - trayH / 2, w: 12, h: trayH });
    w.static({ shape: "rect", x: trayL + trayW + 6, y: H - trayH / 2, w: 12, h: trayH });
    // drawn: funnel walls, the baffle as a row of leaning pegs on a bar, the output tray
    const FE = setEl(ctx, `${name}_funnel`, B.x, B.y, W, H);
    const line = (x1, y1, x2, y2, sw, tok) => K().line(FE.inner, x1, y1, x2, y2, { stroke: tok || col.funnel, sw, crisp: true });
    line(xL, yl, cxT - tw / 2, yt, 12); line(xR, ym - 20, cxT + tw / 2, yt, 12);
    K().rect(FE.inner, sL, H - sH, sW, sH, { fill: col.tray, r: 6, crisp: true, shadow: false });
    line(sL - 6, H - sH, sL - 6, H, 12); line(sL + sW + 6, H - sH, sL + sW + 6, H, 12); line(sL - 12, H, sL + sW + 12, H, 10);
    line(bx0, by0, bx1, by1, 10, col.funnel);
    for (let k = 1; k < 7; k++) { const u = k / 7, px = bx0 + (bx1 - bx0) * u, py = by0 + (by1 - by0) * u; line(px, py, px - 22, py - 30, 6); }
    K().rect(FE.inner, trayL, H - trayH, trayW, trayH, { fill: col.tray, r: 6, crisp: true, shadow: false });
    line(trayL - 6, H - trayH, trayL - 6, H, 12); line(trayL + trayW + 6, H - trayH, trayL + trayW + 6, H, 12); line(trayL - 12, H, trayL + trayW + 12, H, 10);
    // the balls: in their groups' shares, interleaved; the turned-away ones fall over the baffle, the kept ones past it
    const balls = [];
    nIn.forEach((n, k) => { for (let i = 0; i < n; i++) balls.push({ g: k, skip: i < nSkip[k] }); });
    const order = shuffle(balls.map((_, i) => i), rnd);
    const zoneS = [xL + r + 4, xd - r - 30], zoneK = [xd + r + 30, xR - r - 30];
    let ks = 0, kk = 0;
    order.forEach((i, j) => {
      const bl = balls[i], z = bl.skip ? zoneS : zoneK, q = bl.skip ? ks++ : kk++, n = bl.skip ? skipped : M;
      const x = z[0] + ((q * 7) % Math.max(1, n) + 0.5) / Math.max(1, n) * Math.max(0, z[1] - z[0]);
      w.body(`${name}_ball_${i}`, { shape: "circle", r, x, y: 40, at: t0 + (j / Math.max(1, total - 1)) * pour, restitution: 0.05, friction: bl.skip ? 0.001 : 0.05, frictionAir: 0.01, kind: "token" },
        (g, Wd, Hd) => K().disc(g, Wd / 2, Hd / 2, r, { fill: col.groups[bl.g] || "accent" }));
    });
    w.run();
    // legend: each group's colour and word (and its in share when asked)
    groups.forEach((gl, k) => {
      const E = setEl(ctx, `${name}_legend_${k}`, B.x, B.y + 20 + k * 64, legendW, 56, "text");
      K().disc(E.inner, 22, 28, 16, { fill: col.groups[k] || "accent" });
      const sw = o.showShares ? 110 : 0;
      K().text(E.inner, gl, { x: 50, y: 0, w: legendW - 50 - sw, h: 56, role: "body", align: "left", valign: "middle", maxLines: 1 });
      if (sw) K().text(E.inner, `${fmt(ins[k] * 100)}%`, { x: legendW - sw, y: 0, w: sw, h: 56, role: "body", align: "left", valign: "middle", maxLines: 1, color: "muted" });
    });
    if (o.outLabel) label(ctx, `${name}_out_label`, o.outLabel, B.x + trayL + trayW + 30, B.y + H - 90, Math.min(420, W - trayL - trayW - 40), 80, { align: "left", role: "body", weight: 700 });
    if (o.skippedLabel) label(ctx, `${name}_skip_label`, o.skippedLabel, B.x + sL, B.y + H - sH - 70, sW, 60, { align: "center", role: "body" });
    const exp = {}, got = {};
    groups.forEach((gl, k) => { exp[gl] = nOut[k]; got[gl] = 0; });
    balls.forEach((bl, i) => {
      const p = w.final[`${name}_ball_${i}`];
      if (p.x > trayL && p.x < trayL + trayW && p.y > H - trayH) got[groups[bl.g]] += 1;
    });
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts("out of the funnel,"), { settled: w.report.settled, lost: w.report.lost, inCounts: nIn, outCounts: nOut }), { world: w });
  };
  /* ------------------------------------------------------------------ priorityJar (priority_jar) */
  /** Big priorities first or they do not fit. The small things are bricks that stack in fixed slots, so the outcome
   *  never rests on granular luck: big first, the rocks sit on the jar floor with room between them and the bricks
   *  stack in those gaps, below the rim; small first, the bricks lie as a floor across the jar and the rocks, placed
   *  on it, stand above the rim. One call is one jar; a scene sets two side by side for the two orders.
   *  opts: big [label] (1 to 4), small (count, or [label] whose length is the count), order "big_first" | "small_first",
   *        caption, t, seconds, gap, colors {big, small, jar}, x, y, w, h */
  P.priorityJar = function (ctx, name, o) {
    o = o || {};
    const R = "priorityJar";
    const big = (o.big || []).map(String), nb = big.length;
    const ns = typeof o.small === "number" ? Math.round(o.small) : (o.small || []).length;
    const order = o.order === "small_first" ? "small_first" : o.order === "big_first" ? "big_first" : null;
    if (!order) { bad(R, name, `order must be "big_first" or "small_first"`); return null; }
    if (nb < 1 || nb > 4 || ns < 1) { bad(R, name, "1 to 4 big labels and at least 1 small item"); return null; }
    if (!checkBodies(R, name, nb + ns)) return null;
    const col = Object.assign({ big: "accent", small: "accent2", jar: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), gapS = num(o.gap, 0.14);
    const labH = o.caption ? 76 : 0, W = B.w;
    const word = Math.max(...big.map((l) => Math.max(...l.split(/\s+/).map((wd) => K().fit(wd, { role: "label", w: 2000, h: 80, maxLines: 1 }).width))));
    const rMax = (W - 60) / (3 * nb + 1);
    const r = clamp(Math.min(Math.max((word + 16) / 1.56, 76), rMax), 46, 100);
    if (r > rMax + 0.5 || (word + 16) / 1.56 > rMax + 0.5) bad(R, name, `the rocks' words need a radius of ${Math.round((word + 16) / 1.56)} px; the box allows ${Math.round(rMax)} px (shorter words, fewer rocks or a wider box)`);
    const g = r, c = nb + 1, Wj = nb * 2 * r + c * g, jarL = (W - Wj) / 2;
    const k = Math.ceil(ns / c), hb = clamp((0.8 * 2 * r) / k, 16, 56), bw = g - 14;
    const rim = 2 * r + 5, H = Math.min(B.h - labH, rim + 2.4 * r + 150), yOff = Math.max(0, (B.h - labH - H) * 0.6), wallTop = H - rim;
    // small first: full rows of bricks side by side make a floor the rocks cannot push apart; the remainder sits in
    // the gaps between where the rocks will stand, so no rock lands on a lone brick
    const perRow = Math.max(1, Math.floor((Wj - 4) / (bw + 4))), rows = Math.max(1, Math.floor(ns / perRow)), rest = ns - rows * Math.min(perRow, ns);
    if (rows * hb < 22) Loom.warn("physics_recipe_weak", `${R} "${name}": with ${ns} small items the floor they make is only ${Math.round(rows * hb)} px; small first will barely show`);
    const rockX = (i) => jarL + g + r + i * (2 * r + g);
    const events = [];   // [kind, index, at, x, y0]
    let tt = t0;
    const rocks = (y0) => { for (let i = 0; i < nb; i++) { events.push(["rock", i, tt, rockX(i), y0]); tt += 0.42; } tt += 0.2; };
    const bricksIn = () => { for (let m = 0; m < ns; m++) { events.push(["brick", m, tt, jarL + g / 2 + (m % c) * (2 * r + g), wallTop - hb - 30]); tt += gapS; } tt += 0.3; };
    const bricksFloor = () => {
      const full = rows * Math.min(perRow, ns), inRow = Math.min(perRow, ns), x0 = jarL + (Wj - inRow * (bw + 4)) / 2 + (bw + 4) / 2;
      for (let m = 0; m < ns; m++) {
        const x = m < full ? x0 + (m % inRow) * (bw + 4) : jarL + g / 2 + ((m - full) % c) * (2 * r + g);
        events.push(["brick", m, tt, x, wallTop - hb - 30]); tt += gapS;
      }
      tt += 0.3;
    };
    if (order === "big_first") { rocks(wallTop - r - 40); bricksIn(); } else { bricksFloor(); rocks(H - rows * hb - r - 30); }
    const seconds = needSeconds(R, name, o, (tt - t0 + 1.6) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y + yOff, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    w.static({ shape: "rect", x: jarL - 7, y: H - rim / 2, w: 14, h: rim, friction: 0.6 });
    w.static({ shape: "rect", x: jarL + Wj + 7, y: H - rim / 2, w: 14, h: rim, friction: 0.6 });
    const JE = setEl(ctx, `${name}_jar`, B.x + jarL - 14, B.y + yOff + wallTop - 4, Wj + 28, rim + 14);
    K().rect(JE.inner, 14, 4, Wj, rim, { fill: "field2", r: 4, crisp: true, shadow: false, opacity: 0.7 });
    K().path(JE.inner, `M7 0 L7 ${rim + 7} L${Wj + 21} ${rim + 7} L${Wj + 21} 0`, { stroke: col.jar, sw: 14 });
    const onBig = onTok(col.big);
    events.forEach(([kind, i, at, x, y0]) => {
      if (kind === "rock") w.body(`${name}_rock_${i}`, { shape: "circle", r, x, y: y0, at, restitution: 0, friction: 0.6, density: 0.001, kind: "object" }, (gg, Wd, Hd) => {
        K().disc(gg, Wd / 2, Hd / 2, r, { fill: col.big });
        K().text(gg, big[i], { x: Wd / 2 - 0.78 * r, y: Hd / 2 - 0.55 * r, w: 1.56 * r, h: 1.1 * r, role: "label", align: "center", valign: "middle", maxLines: 2, color: onBig, weight: 700 });
      });
      else w.body(`${name}_small_${i}`, { shape: "rect", w: bw, h: hb, x, y: y0, at, chamfer: Math.min(6, hb / 3), restitution: 0, friction: 0.9, density: 0.003, kind: "token" },
        (gg, Wd, Hd) => K().rect(gg, 0, 0, Wd, Hd, { fill: col.small, r: Math.min(8, Hd / 3) }));
    });
    w.run();
    if (o.caption) label(ctx, `${name}_caption`, o.caption, B.x + jarL - 40, B.y + yOff + H + 16, Wj + 80, labH - 16, { role: "body", weight: 700 });
    const inJar = (p, half) => p.x > jarL && p.x < jarL + Wj && p.y - half >= wallTop - 3;
    let bigIn = 0, smallIn = 0;
    for (let i = 0; i < nb; i++) if (inJar(w.final[`${name}_rock_${i}`], r)) bigIn++;
    for (let m = 0; m < ns; m++) if (inJar(w.final[`${name}_small_${m}`], hb / 2)) smallIn++;
    const exp = { "big inside the rim": order === "big_first" ? nb : 0, "small inside the rim": ns };
    const got = { "big inside the rim": bigIn, "small inside the rim": smallIn };
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts(""), { settled: w.report.settled, lost: w.report.lost, order }), { world: w, fits: bigIn === nb && smallIn === ns });
  };

  /* ------------------------------------------------------------------ redundancyTopple (redundancy_topple) */
  /** A beam (the load) rests on one or two pillars; a fault knocks pillar A out. With one pillar the beam falls; with
   *  two, pillar B stands under the beam's centre of mass and it holds. The knock pushes A outward, away from B.
   *  opts: supports 1 | 2, labels [A, B] (A is the one that fails), loadLabel, faultLabel, t, knockAt, seconds,
   *        colors {pillar, spare, beam, fault}, x, y, w, h */
  P.redundancyTopple = function (ctx, name, o) {
    o = o || {};
    const R = "redundancyTopple";
    const sup = o.supports === 2 ? 2 : o.supports === 1 ? 1 : 0;
    if (!sup) { bad(R, name, "supports must be 1 or 2"); return null; }
    const labels = (o.labels || []).map(String);
    const col = Object.assign({ pillar: "surface2", spare: "pos", beam: "accent", fault: "neg" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), knockAt = num(o.knockAt, t0 + 1.0);
    const W = B.w, H = B.h, Wb = Math.min(0.5 * W, 760), beamH = 76, pH = Math.min(0.42 * H, 300), pW = 124, bW = 144;
    const cx = W * 0.6, aX = sup === 2 ? cx - Wb / 2 + pW / 2 + 20 : cx, beamY = H - pH - beamH / 2, kr = 46;
    const seconds = needSeconds(R, name, o, (knockAt - t0 + 3.0) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.seed, undefined) });
    const FE = setEl(ctx, `${name}_ground`, B.x, B.y + H, W, 10);
    K().rect(FE.inner, 0, 0, W, 10, { fill: "line", r: 4, crisp: true, shadow: false });
    // A is slippery (it slides out without dragging the beam along); B grips the beam
    const pillar = (bn, x, wd, fill, lb) => w.body(bn, { shape: "rect", w: wd, h: pH, x, y: H - pH / 2, at: t0, restitution: 0, friction: bn.endsWith("_A") ? 0.03 : 0.9, density: 0.001, kind: "object" }, (g, Wd, Hd) => {
      K().rect(g, 0, 0, Wd, Hd, { fill, stroke: "line", r: 8 });
      if (lb) K().text(g, lb, { x: 12, y: 18, w: Wd - 24, h: Math.min(Hd - 36, 120), role: "label", align: "center", valign: "top", maxLines: K().fit(lb, { role: "label", w: Wd - 24, h: 60, maxLines: 1 }).fitted ? 1 : 3, color: onTok(fill), weight: 700 });
    });
    pillar(`${name}_A`, aX, pW, col.pillar, labels[0]);
    if (sup === 2) pillar(`${name}_B`, cx, bW, col.spare, labels[1]);
    w.body(`${name}_beam`, { shape: "rect", w: Wb, h: beamH, x: cx, y: beamY, at: t0, restitution: 0, friction: 0.9, density: 0.001, kind: "object" }, (g, Wd, Hd) => {
      K().rect(g, 0, 0, Wd, Hd, { fill: col.beam, r: 10 });
      if (o.loadLabel) K().text(g, o.loadLabel, { x: 20, y: 6, w: Wd - 40, h: Hd - 12, role: "body", align: "center", valign: "middle", maxLines: 1, color: onTok(col.beam), weight: 700 });
    });
    w.body(`${name}_fault`, { shape: "circle", r: kr, x: aX + pW / 2 + kr + 4, y: H - kr, vx: -16, at: knockAt, restitution: 0, friction: 0.05, density: 0.03, kind: "object" }, (g, Wd, Hd) => {
      K().disc(g, Wd / 2, Hd / 2, kr, { fill: col.fault });
      if (o.faultLabel) K().text(g, o.faultLabel, { x: Wd / 2 - kr * 0.72, y: Hd / 2 - kr * 0.5, w: kr * 1.44, h: kr, role: "label", align: "center", valign: "middle", maxLines: 1, color: onTok(col.fault), weight: 700 });
      else K().icon(g, "zap", { x: Wd / 2, y: Hd / 2, size: kr * 1.1, color: onTok(col.fault) });
    });
    w.run();
    const bm = w.final[`${name}_beam`], A = w.final[`${name}_A`];
    const stands = Math.abs(bm.a) < 0.07 && Math.abs(bm.y - beamY) < 12 ? 1 : 0;
    const aOut = Math.abs(A.x - aX) > pW || Math.abs(A.a) > 0.5 ? 1 : 0;
    const exp = { "pillar A knocked out": 1, "the beam still stands": sup === 2 ? 1 : 0 };
    const got = { "pillar A knocked out": aOut, "the beam still stands": stands };
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts(""), { settled: w.report.settled, lost: w.report.lost, supports: sup }), { world: w });
  };

  /* ------------------------------------------------------------------ inboxFlood (inbox_flood) */
  /** Reply-all multiplies messages: one envelope drops into the inbox tray, then each generation doubles (1, 2, 4, 8 ...)
   *  until the count is reached. The first `capacity` envelopes stack in the tray's slots; every one after that lands on
   *  the rim and tips over the edge. Words on the envelopes come from the lesson (seed, then the replies in turn).
   *  opts: seed (text), replies [text], capacity, count (default 1 + replies), genGap (s), trayLabel, showCount,
   *        t, seconds, worldSeed, colors {envelope, tray, flap}, x, y, w, h */
  P.inboxFlood = function (ctx, name, o) {
    o = o || {};
    const R = "inboxFlood";
    const replies = (o.replies || []).map(String), cap = Math.round(num(o.capacity, 0));
    const n = Math.round(num(o.count, 1 + replies.length));
    if (o.seed == null || !replies.length || cap < 1 || n < 2) { bad(R, name, "seed text, replies, a capacity of at least 1 and a count of at least 2"); return null; }
    if (!checkBodies(R, name, n)) return null;
    const col = Object.assign({ envelope: "surface", tray: "line", flap: "line" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), genGap = num(o.genGap, 0.9);
    const texts = Array.from({ length: n }, (_, i) => (i === 0 ? String(o.seed) : replies[(i - 1) % replies.length]));
    const labH = o.trayLabel ? 70 : 0, W = B.w, H = B.h - labH;
    const envW = 210, envH = 108;
    const cols = cap <= 2 ? cap : cap <= 6 ? Math.ceil(cap / 3) : Math.ceil(cap / 3), rows = Math.ceil(cap / cols);
    const inW = cols * (envW + 10) + 10, inH = rows * envH + 8, trayL = (W - inW) / 2, trayTop = H - inH;
    const colsSide = Math.max(1, Math.floor(((W - inW) / 2 - 40) / (envW + 12)));
    if (Math.ceil(Math.max(0, n - cap) / 2 / colsSide) * envH > H - 260) bad(R, name, `${n - cap} spilled envelopes stack higher than the box; a smaller count or a wider box`);
    if (inH > H - 220) bad(R, name, `a tray for ${cap} envelopes is ${Math.round(inH)} px tall; the box is ${Math.round(H)} px (a smaller capacity, or a taller box)`);
    // the doubling: generation g holds 2^g envelopes
    const at = [];
    for (let g = 0, i = 0; i < n; g++) { const m = Math.pow(2, g), st = Math.max(0.12, Math.min(0.2, (genGap * 0.8) / m)); for (let j = 0; j < m && i < n; j++, i++) at.push(t0 + g * genGap + j * st); }
    const seconds = needSeconds(R, name, o, (at[n - 1] - t0 + 3.2) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: W, h: H, t: t0, seconds, seed: num(o.worldSeed, undefined) });
    w.static({ shape: "rect", x: trayL - 6, y: H - inH / 2, w: 12, h: inH, friction: 0.5 });
    w.static({ shape: "rect", x: trayL + inW + 6, y: H - inH / 2, w: 12, h: inH, friction: 0.5 });
    const TE = setEl(ctx, `${name}_tray`, B.x + trayL - 12, B.y + trayTop - 4, inW + 24, inH + 14);
    K().rect(TE.inner, 12, 4, inW, inH, { fill: "field2", r: 6, crisp: true, shadow: false });
    K().path(TE.inner, `M6 0 L6 ${inH + 8} L${inW + 18} ${inH + 8} L${inW + 18} 0`, { stroke: col.tray, sw: 12 });
    const GE = setEl(ctx, `${name}_ground`, B.x, B.y + H, W, 8);
    K().rect(GE.inner, 0, 0, W, 8, { fill: "line", r: 4, crisp: true, shadow: false });
    const on = onTok(col.envelope);
    for (let i = 0; i < n; i++) {
      // the first `capacity` drop into their slots and stack; every later one is thrown back off the full tray and
      // lands in a spill slot on the floor beside it, alternately left and right (a solved toss, then checked)
      let x, y = 70, vx = 0, vy = 0;
      if (i < cap) { const cc = i % cols; x = trayL + 10 + cc * (envW + 10) + envW / 2; }
      else {
        const k = i - cap, side = k % 2 ? 1 : -1, slot = Math.floor(k / 2), layer = Math.floor(slot / colsSide), cc = slot % colsSide;
        const tx = side < 0 ? trayL - 30 - (cc + 0.5) * (envW + 12) : trayL + inW + 30 + (cc + 0.5) * (envW + 12);
        x = side < 0 ? trayL - envW / 2 - 18 : trayL + inW + envW / 2 + 18; y = 70;   // just past the rim, drifting out
        const f = toss(x, y, tx, H - layer * envH - envH / 2 - 6, 0, 0.01); vx = f.vx; vy = f.vy;
      }
      w.body(`${name}_env_${i}`, { shape: "rect", w: envW, h: envH, x, y, vx, vy, at: at[i], chamfer: 6, restitution: 0, friction: 0.5, density: 0.001, kind: "token" }, (g, Wd, Hd) => {
        K().rect(g, 0, 0, Wd, Hd, { fill: col.envelope, stroke: "line", r: 8 });
        K().path(g, `M6 8 L${Wd / 2} ${Hd * 0.3} L${Wd - 6} 8`, { stroke: col.flap, sw: 3 });
        K().text(g, texts[i], { x: 12, y: Hd * 0.32, w: Wd - 24, h: Hd * 0.64, role: "label", align: "center", valign: "middle", maxLines: 2, color: on, weight: i === 0 ? 700 : 400 });
      });
    }
    w.run();
    if (o.trayLabel) label(ctx, `${name}_tray_label`, o.trayLabel, B.x + trayL, B.y + H + 14, inW, labH - 14, { role: "body", weight: 700 });
    if (o.showCount) counter(ctx, `${name}_count`, at, B.x + W - 140, B.y + 10, 120, 56, { t0, dur: seconds });
    let inT = 0, out = 0;
    for (let i = 0; i < n; i++) {
      const p = w.final[`${name}_env_${i}`];
      if (p.x > trayL && p.x < trayL + inW && p.y > trayTop - envH * 0.5) inT++; else out++;
    }
    const exp = { "in the tray": Math.min(n, cap), "spilled over the edge": Math.max(0, n - cap) };
    const got = { "in the tray": inT, "spilled over the edge": out };
    return Object.assign(verdict(ctx, R, name, exp, got, sameCounts(""), { settled: w.report.settled, lost: w.report.lost }), { world: w });
  };

  /* ------------------------------------------------------------------ contextWindow (context_window_tray) */
  /** A fixed-size window: token tiles drop into a tray of `capacity` slots in order. policy "oldest_out": when it is
   *  full the app slides the row along one slot (a conveyor step, the app's choice) and the oldest tile tips off the far
   *  end and falls; the new tile drops into the freed slot. policy "refuse": a lid drops on the full tray and new tiles
   *  land on the lid, kept out. The drops and the falls are physics; the slide is the app's deterministic step.
   *  opts: capacity, tiles [token text], policy "oldest_out" | "refuse", windowLabel, outLabel, t, seconds, gap,
   *        colors {tile, window, out, lid}, x, y, w, h */
  P.contextWindow = function (ctx, name, o) {
    o = o || {};
    const R = "contextWindow";
    const tiles = (o.tiles || []).map(String), n = tiles.length, cap = Math.round(num(o.capacity, 0));
    const policy = o.policy === "refuse" ? "refuse" : o.policy === "oldest_out" ? "oldest_out" : null;
    if (!policy) { bad(R, name, `policy must be "oldest_out" or "refuse"`); return null; }
    if (cap < 1 || n < 1) { bad(R, name, "a capacity of at least 1 and some tiles"); return null; }
    const extra = Math.max(0, n - cap);
    if (!checkBodies(R, name, policy === "oldest_out" ? n + extra : n + 1)) return null;
    const col = Object.assign({ tile: "surface", window: "accent", out: "muted", lid: "neg" }, o.colors || {});
    const B = boxOf(ctx, o), t0 = startOf(ctx, o), gapT = num(o.gap, 0.9), ds = Math.min(0.5, gapT * 0.55);
    const slotW = Math.min(230, (B.w * 0.62) / cap), tileW = slotW - 16, tileH = 72;
    const winW = cap * slotW, winX = B.x + B.w - winW - 40, trayY = B.h - 130;   // trayY: world-local y of the tray floor
    const dropY = Math.max(tileH / 2 + 10, trayY - tileH - 240);   // tiles start this far above the tray (world-local)
    const fallT = Math.sqrt((2 * (trayY - tileH / 2 - dropY)) / 1000) * 1.15 + 0.15;
    const role = tiles.every((tx) => K().fit(tx, { role: "body", w: tileW - 24, h: tileH - 12, maxLines: 1 }).fitted) ? "body" : "label";
    const on = onTok(col.tile);
    const drawTile = (i) => (g, Wd, Hd) => {
      K().rect(g, 0, 0, Wd, Hd, { fill: col.tile, stroke: "line", r: 10 });
      K().text(g, tiles[i], { x: 12, y: 6, w: Wd - 24, h: Hd - 12, role, align: "center", valign: "middle", maxLines: 1, color: on });
    };
    // the window: a frame around the slots and its floor (drawn first, under the tiles)
    const FE = setEl(ctx, `${name}_window`, winX - 14, B.y + trayY - tileH - 34, winW + 28, tileH + 54);
    K().rect(FE.inner, 0, 0, winW + 28, tileH + 54, { fill: "none", stroke: col.window, sw: 4, r: 14, crisp: true, shadow: false });
    for (let k = 1; k < cap; k++) K().line(FE.inner, 14 + k * slotW, tileH + 34 - 10, 14 + k * slotW, tileH + 34, { stroke: col.window, sw: 3, crisp: true });
    K().rect(FE.inner, 6, tileH + 34, winW + 16, 12, { fill: "line", r: 4, crisp: true, shadow: false });
    if (o.windowLabel) label(ctx, `${name}_window_label`, o.windowLabel, winX, B.y + trayY + 40, winW, 56, { role: "body", weight: 700 });
    if (o.outLabel) label(ctx, `${name}_out_label`, o.outLabel, B.x, B.y + B.h - 70, Math.max(200, winX - B.x - 40), 60, { role: "body", align: "left" });
    const GE = setEl(ctx, `${name}_ground`, B.x, B.y + B.h, Math.max(40, winX - B.x - 20), 8);
    K().rect(GE.inner, 0, 0, Math.max(40, winX - B.x - 20), 8, { fill: "line", r: 4, crisp: true, shadow: false });
    const arrive = [], shiftT = [];
    for (let i = 0; i < n; i++) {
      if (i < cap || policy === "refuse") arrive.push(t0 + i * gapT);
      else { const ts = t0 + i * gapT; shiftT.push(ts); arrive.push(ts + ds + 0.05); }
    }
    const exp = {}, got = {};
    if (policy === "oldest_out") {
      const lastEv = Math.max(arrive[n - 1], shiftT.length ? shiftT[shiftT.length - 1] + ds : 0);
      const seconds = needSeconds(R, name, o, (lastEv - t0 + 1.8) / 0.75);
      // the strip: every tile has its own place along a long floor; the group slides left one slot per eviction
      const G = ctx.group ? ctx.group() : Loom.svg("g", {}, ctx.g);
      const sctx = Object.assign({}, ctx, { el: (nm, op) => ctx.el(nm, Object.assign({}, op, { parent: G })) });
      const sw = baked(sctx, name, { x: winX, y: B.y, w: n * slotW + 40, h: trayY + 40, t: t0, seconds, seed: num(o.seed, undefined), walls: { floor: false, left: false, right: false } });
      sw.static({ shape: "rect", x: (n * slotW) / 2, y: trayY + 10, w: n * slotW + 40, h: 20, friction: 0.8 });
      const Es = tiles.map((_, i) => sw.body(`${name}_tile_${i}`, { shape: "rect", w: tileW, h: tileH, x: (i + 0.5) * slotW, y: dropY, at: arrive[i], chamfer: 8, restitution: 0, friction: 0.8, kind: "token" }, drawTile(i)));
      sw.run();
      const D = seconds;
      const setShift = (tt) => { let off = 0; for (const ts of shiftT) off += clamp((tt - ts) / ds, 0, 1); G.setAttribute("transform", `translate(${(-off * slotW).toFixed(2)} 0)`); };
      setShift(t0 - 1);
      Loom.drive((_e, p) => setShift(t0 + p * D), t0, D, "linear", { kind: "travel", beat: ctx.beat && ctx.beat.id, name: `${name}_conveyor`, key: `${name}.conveyor`, content: true });
      // the evicted: tile k-1 leaves at shift k; a falling copy takes over at the window's edge, the strip copy fades
      const ow = baked(ctx, `${name}_out`, { x: B.x, y: B.y, w: winX - B.x + winW, h: B.h, t: t0, seconds, seed: num(o.seed, undefined), walls: { floor: true, left: true, right: false } });
      ow.static({ shape: "rect", x: winX - B.x + winW / 2, y: trayY + 10, w: winW, h: 20, friction: 0.3 });
      shiftT.forEach((ts, k) => {
        const tsw = ts + ds / 2;
        ow.body(`${name}_out_${k}`, { shape: "rect", w: tileW, h: tileH, x: winX - B.x, y: trayY - tileH / 2 - 1, vx: -(1.8 * slotW / ds) / 60, spin: 0.02, at: tsw, chamfer: 8, restitution: 0.05, friction: 0.3, kind: "token" }, drawTile(k));
        Loom.tween(Es[k].life, { opacity: 1 }, { opacity: 0, duration: 0.1, ease: "none" }, tsw + 0.08, { kind: "exit", beat: ctx.beat && ctx.beat.id, name: `${name}_tile_${k}`, content: true });
      });
      ow.run();
      tiles.forEach((tx, i) => {
        exp[`${tx} #${i}`] = i >= n - cap ? "in the window" : "fell out";
        if (i >= n - cap) {
          const p = sw.final[`${name}_tile_${i}`], vx = p.x - extra * slotW;   // where the conveyor leaves it, window-local
          got[`${tx} #${i}`] = vx > 0 && vx < winW && Math.abs(p.y - (trayY - tileH / 2)) < 10 ? "in the window" : "out of place";
        } else {
          const p = ow.final[`${name}_out_${i}`];
          got[`${tx} #${i}`] = p && p.x < winX - B.x - tileH * 0.4 ? "fell out" : "did not fall";   // past the edge: nothing holds it at the tray
        }
      });
      const cmp = (e, g) => Object.keys(e).filter((k) => e[k] !== g[k]).map((k) => `${k.replace(/ #\d+$/, "")}: expected ${e[k]}, the world shows ${g[k]}`);
      return Object.assign(verdict(ctx, R, name, exp, got, cmp, { settled: sw.report.settled && ow.report.settled, lost: (sw.report.lost || []).concat(ow.report.lost || []), policy }), { world: sw, outWorld: ow });
    }
    // refuse: a lid drops flat onto the full tray's walls; each new tile lands on the lid and stays out, side by side
    // from the far end (a tile that slid off it would fall where no one could read it)
    const wallH = tileH + 22, lx = winX - B.x;
    const lidAt = arrive[Math.min(cap, n) - 1] + fallT + 0.3, lidW = winW + 60, lidH = 30, lidY = trayY - wallH - lidH / 2;
    for (let i = cap; i < n; i++) arrive[i] = Math.max(arrive[i], lidAt + 0.9 + (i - cap) * gapT);
    const seconds = needSeconds(R, name, o, (Math.max(arrive[n - 1], lidAt) - t0 + 2.4) / 0.75);
    const w = baked(ctx, name, { x: B.x, y: B.y, w: B.w, h: B.h, t: t0, seconds, seed: num(o.seed, undefined), walls: { floor: true, left: true, right: true } });
    w.static({ shape: "rect", x: lx + winW / 2, y: trayY + 10, w: winW + 20, h: 20, friction: 0.8 });
    w.static({ shape: "rect", x: lx - 8, y: trayY - wallH / 2, w: 10, h: wallH, friction: 0.9 });
    w.static({ shape: "rect", x: lx + winW + 8, y: trayY - wallH / 2, w: 10, h: wallH, friction: 0.9 });
    const WE = setEl(ctx, `${name}_walls`, winX - 14, B.y + trayY - wallH, winW + 28, wallH);
    K().rect(WE.inner, 1, 0, 10, wallH, { fill: "line", r: 4, crisp: true, shadow: false });
    K().rect(WE.inner, winW + 17, 0, 10, wallH, { fill: "line", r: 4, crisp: true, shadow: false });
    const yTop = Math.max(tileH / 2 + 10, Math.min(dropY, lidY - lidH / 2 - tileH / 2 - 60));
    tiles.forEach((tx, i) => {
      const refused = i >= cap, x = refused ? lx + winW - (((i - cap) % cap) + 0.5) * slotW : lx + (i + 0.5) * slotW;
      w.body(`${name}_tile_${i}`, { shape: "rect", w: tileW, h: tileH, x, y: refused ? yTop : dropY, at: arrive[i], chamfer: 8,
        restitution: 0, friction: 0.8, kind: "token" }, drawTile(i));
    });
    if (cap < n) {
      w.body(`${name}_lid`, { shape: "rect", w: lidW, h: lidH, x: lx + winW / 2, y: lidY - 60, at: lidAt, restitution: 0, friction: 0.3, density: 0.004, kind: "object" }, (g, Wd, Hd) => {
        K().rect(g, 0, 0, Wd, Hd, { fill: col.lid, r: 8 });
      });
    }
    w.run();
    tiles.forEach((tx, i) => {
      const p = w.final[`${name}_tile_${i}`];
      exp[`${tx} #${i}`] = i < cap ? "in the window" : "refused";
      const inside = p.x > lx && p.x < lx + winW && Math.abs(p.y - (trayY - tileH / 2)) < 10;
      const onLid = p.x > lx - 30 && p.x < lx + winW + 30 && p.y < lidY - lidH / 2 - tileH / 2 + 12;
      got[`${tx} #${i}`] = inside ? "in the window" : onLid ? "refused" : "elsewhere";
    });
    const cmp = (e, g) => Object.keys(e).filter((k) => e[k] !== g[k]).map((k) => `${k.replace(/ #\d+$/, "")}: expected ${e[k]}, the world shows ${g[k]}`);
    return Object.assign(verdict(ctx, R, name, exp, got, cmp, { settled: w.report.settled, lost: w.report.lost, policy }), { world: w });
  };
})();
