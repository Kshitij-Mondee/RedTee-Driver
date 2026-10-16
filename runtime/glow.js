/* Loom glow kit (D-78): the procedural pieces of a saturated flat register, so a beat is ALIVE and FULL without
 * hand-drawn assets. Built from the 10-second motion study of the newer Kurzgesagt videos
 * (docs/research/kurz/2026-10-01-kurzgesagt-study.md, "The animation itself"); techniques only, every shape original.
 *
 * Builders that take ctx accept o.parent (a group to build into, e.g. one shot of a multi-shot scene).
 * Every builder draws in palette TOKENS (never literals), is deterministic (seeded Loom.rng, time only through
 * Loom.drive / Loom.tween) and works in any pack, though it reads best in `glow-flat`.
 *
 *   Loom.glow.ground(ctx, "bg", { bloom: "violet", dust: 140 })          // graded field + bloom + seeded dust
 *   Loom.glow.burst(ctx, "boom", { x: 960, y: 560, t: 2.0 })              // jagged radial burst behind a figure
 *   Loom.glow.vortex(ctx, "pull", { x: 960, y: 540, t0: 0, t1: 6 })        // turning jagged rings
 *   Loom.glow.orbit(ctx, "temptations", { icons: ["smartphone", "mail"], t0, t1 })   // props spiralling in
 *   Loom.glow.crackle(E.inner, 0, 0, { rx: 160, ry: 260, t0, t1 })        // electric crackle loop
 *   Loom.glow.sparkles(g, { x, y, w, h, n: 8, t0, t1 })                   // four-point twinkles
 *   Loom.glow.idle(E, t0, t1, { bob: 6, sway: 1.5 })                       // background life on an element
 *   Loom.glow.swarm(ctx, "fish", { kind: "fish", n: 24, area, t0, t1 })    // many small agents on their own paths
 *   Loom.glow.shafts(ctx, "light", { n: 5, t0, t1 })                       // light from above, swaying
 *   const p = Loom.glow.pill(g, x, y, "Cortisol", { tone: "accent4", point: [x2, y2] })  // a label ON the thing
 *   Loom.glow.stat(ctx, "wis", "FOCUS -30", { from: [x, y], x, y, t })      // a game-style stat pop on a leader line
 *   const hud = Loom.glow.hud(ctx, "body", { x, y, title, icons: [...] }); hud.dim(2, t)   // one change per word
 *   const cmp = Loom.glow.compare(ctx, "pair", { left: "Before", right: "After" }); cmp.value("right", "-40%", t)
 *   const gg = Loom.glow.gauge(ctx, "depth", { x, y, h, n: 9 }); gg.move(0.6, t, 1.2)  // "you are here"
 *   Loom.glow.blob(g, cx, cy, r, { fill: "accent3", lobes: 7, seed: "c1", gloss: true })  // organic gloss shape
 *   Loom.glow.glowDisc(g, cx, cy, r, "glow")                               // a soft glow without filters
 *   Loom.glow.coral(g, x, y, h, { fill }), .fan(g, x, y, r), .kelp(g, x, y, h, { t0, t1 }), .rock(g, x, y, w)
 *   Loom.glow.ticket(g, x, y, { tone, state: "open" | "done", rot })        // a work item as a card
 *
 * The meaning-carrying change stays single and timed to the word (the study's main finding); background life is
 * constant and quiet. Builders that loop (vortex, crackle, sparkles, swarm, shafts, idle) take [t0, t1].
 */
// @capability glow_kit | world | Loom.glow.ground, shafts, blob, burst, vortex, orbit, swarm, hud, compare, gauge | Glow kit | a procedural saturated world that is alive and full without drawn assets (the glow-flat register; works in any pack)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (...a) => Loom.svg(...a);
  const G = (Loom.glow = {});
  const f = (v) => Math.round(v * 10) / 10;
  let uid = 0;
  const id = (p) => `lmgl_${p}_${uid++}`;
  // glow-flat adds tokens (glow, deep, violet, plum, core); in any other pack they fall back to standard ones
  const FB = { onAccent: "field", glow: "accent4", deep: "shadow", violet: "accent3", plum: "surface2", core: "accent2" };
  const tk = (t) => { const p = S().pack.palette; if (t && t in p) return t; return (t && FB[t] && FB[t] in p) ? FB[t] : "accent"; };
  const tok = (t, fb) => S().c(tk(t || fb));
  G.token = tk;

  /* ---------------- geometry ---------------- */
  /** a smooth closed path through points (Catmull-Rom as cubic Beziers) */
  G.smooth = function (pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + " Z";
  };
  /** the radii of an organic blob (seeded); phase moves each lobe a little (for living shapes) */
  G.blobPath = function (cx, cy, r, o, phase) {
    o = o || {};
    const n = o.lobes || 7, w = o.wobble == null ? 0.16 : o.wobble, rng = Loom.rng(String(o.seed || "blob"));
    const sx = o.sx || 1, sy = o.sy || 1, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (o.rot || 0), j = rng() * 2 - 1, ph = rng() * 6.283;
      const k = 1 + w * j + (phase == null ? 0 : (o.live || 0.05) * Math.sin(phase + ph));
      pts.push([cx + Math.cos(a) * r * k * sx, cy + Math.sin(a) * r * k * sy]);
    }
    return G.smooth(pts);
  };
  /** jagged star points: alternate outer/inner radius with seeded jitter */
  function jag(cx, cy, rOut, rIn, n, rng, jit) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + (rng() - 0.5) * (jit || 0.12);
      const r = (i % 2 ? rIn : rOut) * (1 + (rng() - 0.5) * (jit || 0.12) * 2);
      pts.push(`${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`);
    }
    return pts.join(" ");
  }

  /* ---------------- glow without filters (concentric translucent rings) ---------------- */
  G.glowDisc = function (p, cx, cy, r, token, o) {
    o = o || {};
    const g = svg("g", { class: "lm-glow" }, p), c = tok(token, "glow");
    const rings = o.rings || 6, spread = o.spread || 2.2, peak = o.opacity == null ? 0.22 : o.opacity;
    if (o.stepped) {
      for (let i = rings; i >= 1; i--) svg("circle", { cx, cy, r: f(r * (1 + (spread - 1) * (i / rings))), fill: c, opacity: f2(peak * (1 - i / (rings + 1)) * 0.9) }, g);
    } else {
      // ONE radialGradient circle (glow-flat guide s15, 2026-10-08): the stepped rings showed as bands, worse after
      // H.264. The stops follow the rings' own profile (the opacity they add up to at each ring's radius), so the
      // glow keeps its size and strength; still filter-free and deterministic
      const R = r * spread, gid = id("disc"), rad = svg("radialGradient", { id: gid, cx, cy, r: f(R), gradientUnits: "userSpaceOnUse" }, svg("defs", {}, g));
      const at = (rho) => { let keep = 1; for (let i = 1; i <= rings; i++) { const Ri = r * (1 + (spread - 1) * (i / rings)); if (Ri > rho) keep *= 1 - peak * (1 - i / (rings + 1)) * 0.9; } return 1 - keep; };
      svg("stop", { offset: f2(r / R), "stop-color": c, "stop-opacity": f2(at(r)) }, rad);
      for (let i = 1; i <= rings; i++) { const Ri = r * (1 + (spread - 1) * (i / rings)); svg("stop", { offset: f2(Ri / R), "stop-color": c, "stop-opacity": f2(at(Ri + 0.001)) }, rad); }
      svg("circle", { cx, cy, r: f(R), fill: `url(#${gid})` }, g);
    }
    if (o.core !== false) svg("circle", { cx, cy, r, fill: c, opacity: o.coreOpacity == null ? 0.9 : o.coreOpacity }, g);
    return g;
  };
  const f2 = (v) => Math.round(v * 1000) / 1000;

  /* ---------------- ground: a graded field, a bloom, dust ---------------- */
  G.ground = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1920, H = o.h || 1080;
    const E = ctx.el(name, { x: 0, y: 0, w: W, h: H, kind: "scenery", parent: o.parent });
    const g = E.inner, gid = id("grad"), defs = svg("defs", {}, g);
    const lg = svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svg("stop", { offset: "0", "stop-color": tok(o.top, "field2") }, lg);
    svg("stop", { offset: "1", "stop-color": tok(o.bottom, "deep") }, lg);
    svg("rect", { x: 0, y: 0, width: W, height: H, fill: `url(#${gid})` }, g);
    if (o.bloom !== false) {
      const bid = id("bloom"), rg = svg("radialGradient", { id: bid, cx: o.bx || 0.5, cy: o.by || 0.42, r: o.br || 0.6 }, defs);
      svg("stop", { offset: "0", "stop-color": tok(o.bloom || "violet"), "stop-opacity": o.bloomOpacity == null ? 0.55 : o.bloomOpacity }, rg);
      svg("stop", { offset: "1", "stop-color": tok(o.bloom || "violet"), "stop-opacity": 0 }, rg);
      svg("rect", { x: 0, y: 0, width: W, height: H, fill: `url(#${bid})` }, g);
    }
    // colour fields: a few large soft blobs, the way the reference fills its grounds with tone, not lines
    const fr = Loom.rng(`ground:${name}`);
    for (let i = 0; i < (o.fields == null ? 4 : o.fields); i++) {
      const cx = fr() * W, cy = H * (0.2 + fr() * 0.8), r = 300 + fr() * 420;
      svg("path", { d: G.blobPath(cx, cy, r, { seed: `${name}f${i}`, lobes: 6, wobble: 0.22 }), fill: tok((o.fieldTones || ["surface2", "plum", "field2", "surface"])[i % 4]), opacity: o.fieldOpacity == null ? 0.55 : o.fieldOpacity }, g);
    }
    // a near ground: two layers of big rounded hills across the bottom, so the frame has a floor and depth
    if (o.floor !== false) {
      const hr = Loom.rng(`hills:${name}`);
      [["plum", 0.8, 0.86], ["deep", 1, 0.93]].forEach(([t, op, yy], li) => {
        const pts = [[-200, H + 300]];
        for (let x = -200; x <= W + 200; x += 260) pts.push([x + hr() * 80, H * yy - hr() * 90 - li * 10]);
        pts.push([W + 200, H + 300]);
        svg("path", { d: G.smooth(pts), fill: tok(t), opacity: op }, g);
      });
    }
    const dust = svg("g", { class: "lm-dust" }, g), rng = Loom.rng(`dust:${name}`), tw = [];
    for (let i = 0; i < (o.dust == null ? 120 : o.dust); i++) {
      const r = rng() < 0.85 ? 1.2 + rng() * 1.6 : 2.8 + rng() * 2.2;
      const c = svg("circle", { cx: f(rng() * W), cy: f(rng() * H), r: f(r), fill: tok(rng() < 0.2 ? "glow" : "ink"), opacity: f2(0.25 + rng() * 0.5) }, dust);
      if (i % 7 === 0) tw.push([c, rng() * 6.283, 0.6 + rng() * 1.4]);
    }
    if (tw.length && o.t1) Loom.drive((e, raw) => {
      const t = (o.t0 || 0) + raw * (o.t1 - (o.t0 || 0));
      for (const [c, ph, sp] of tw) c.setAttribute("opacity", f2(0.25 + 0.55 * (0.5 + 0.5 * Math.sin(ph + t * sp * 2))));
    }, o.t0 || 0, o.t1 - (o.t0 || 0), "linear", { kind: "ambient", beat: E.beat, name: E.name });
    return { E, g };
  };

  /* ---------------- organic gloss blob ---------------- */
  G.blob = function (p, cx, cy, r, o) {
    o = o || {};
    const g = svg("g", { class: "lm-blob" }, p), fill = tok(o.fill, "accent3");
    const d = G.blobPath(cx, cy, r, o);
    if (o.glow) G.glowDisc(g, cx, cy, r * 0.9, o.glow, { core: false, opacity: 0.18, spread: 1.7 });
    const body = svg("path", { d, fill, opacity: o.opacity }, g);
    if (o.gloss !== false) {
      const cid = id("bc"), cp = svg("clipPath", { id: cid }, g); svg("path", { d }, cp);
      svg("path", { d: G.blobPath(cx + r * 0.16, cy + r * 0.2, r * 1.02, o), fill: S().darken(fill, 0.22), "clip-path": `url(#${cid})`, opacity: o.opacity }, g);
      svg("path", { d: G.blobPath(cx - r * 0.06, cy - r * 0.08, r * 0.9, o), fill, "clip-path": `url(#${cid})`, opacity: o.opacity }, g);
      svg("ellipse", { cx: f(cx - r * 0.36), cy: f(cy - r * 0.4), rx: f(r * 0.24), ry: f(r * 0.13), fill: "#FFFFFF", opacity: 0.38, transform: `rotate(-35 ${f(cx - r * 0.36)} ${f(cy - r * 0.4)})` }, g);
    }
    g.__body = body;
    return g;
  };

  /* ---------------- burst: a jagged radial burst behind a figure ---------------- */
  G.burst = function (ctx, name, o) {
    o = o || {};
    const x = o.x == null ? 960 : o.x, y = o.y == null ? 540 : o.y, R = o.r || 1150;
    const E = ctx.el(name, { x, y, w: 0, h: 0, kind: "scenery", parent: o.parent });
    const rng = Loom.rng(`burst:${name}`), spin = svg("g", {}, E.inner);
    // defaults: the field family plus ONE accent (glow-flat guide s15: the old pink-to-yellow default put three hue
    // families in one frame, stress-signal b01 and b07)
    const layers = o.layers || ["plum", "violet", "surface", "accent"];
    layers.forEach((t, i) => {
      const k = 1 - i / (layers.length + 0.4);
      svg("polygon", { points: jag(0, 0, R * k, R * k * (o.depth || 0.62), o.spikes || 16, rng, 0.22), fill: tok(t) }, spin);
    });
    if (o.t != null) {
      Loom.tween(E.inner, { opacity: 0, scale: 0.15, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: o.dur || 0.32, ease: Loom.ease.overshoot }, o.t, { kind: "pop", beat: E.beat, name, content: false });
      if (o.t1) Loom.drive((e, raw) => spin.setAttribute("transform", `rotate(${f(raw * (o.t1 - o.t) * (o.spin == null ? 5 : o.spin))})`), o.t, o.t1 - o.t, "linear", { kind: "ambient", beat: E.beat, name });
    }
    return E;
  };

  /* ---------------- vortex: concentric jagged rings turning in alternate directions ---------------- */
  G.vortex = function (ctx, name, o) {
    o = o || {};
    const x = o.x == null ? 960 : o.x, y = o.y == null ? 540 : o.y, R = o.r || 1250, n = o.rings || 8;
    const E = ctx.el(name, { x, y, w: 0, h: 0, kind: "scenery", parent: o.parent });
    const cols = o.colors || ["plum", "violet", "plum", "surface"], rng = Loom.rng(`vortex:${name}`), rings = [];
    // outer rings sink toward the deep field and the strongest colour sits near the centre, so whatever orbits
    // over the vortex stays readable (o.calm 0 keeps every ring at full strength; R-23 review)
    const calm = o.calm == null ? 0.62 : o.calm, deep = tok("deep");
    for (let i = 0; i < n; i++) {
      const r = R * (1 - i / (n + 0.6));
      const g = svg("g", {}, E.inner);
      const fill = S().mix(tok(cols[i % cols.length]), deep, calm * (1 - i / n));
      svg("polygon", { points: jag(0, 0, r, r * 0.9, 26 + i * 2, rng, 0.08), fill }, g);
      rings.push(g);
    }
    svg("circle", { cx: 0, cy: 0, r: R / (n + 1), fill: tok(o.core || "accent") }, E.inner);
    const t0 = o.t0 || 0, t1 = o.t1 || t0 + 6;
    Loom.drive((e, raw) => {
      const t = raw * (t1 - t0);
      rings.forEach((g, i) => g.setAttribute("transform", `rotate(${f((i % 2 ? -1 : 1) * t * (o.speed || 9) * (1 + i * 0.15))})`));
    }, t0, t1 - t0, "linear", { kind: "ambient", beat: E.beat, name });
    return E;
  };

  /* ---------------- orbit: props on gloss discs spiralling in toward a centre ---------------- */
  G.orbit = function (ctx, name, o) {
    o = o || {};
    const cx = o.x == null ? 960 : o.x, cy = o.y == null ? 540 : o.y, t0 = o.t0 || 0, t1 = o.t1 || t0 + 6;
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "group", parent: o.parent });
    const icons = o.icons || ["smartphone", "mail", "calendar", "coffee"], tones = o.tones || ["violet", "plum", "surface", "accent"];
    const items = icons.map((ic, i) => {
      const g = svg("g", {}, E.inner), r = o.size || 62;
      G.glowDisc(g, 0, 0, r, tones[i % tones.length], { core: false, opacity: 0.16, spread: 1.6 });
      K().disc(g, 0, 0, r, { fill: tk(tones[i % tones.length]) });
      K().icon(g, ic, { x: 0, y: 0, size: r * 1.05, color: tk("onAccent"), stroke: 2.4 });
      return { g, a0: (i / icons.length) * Math.PI * 2, r0: (o.r0 || 470) * (0.9 + 0.2 * ((i * 37) % 10) / 10) };
    });
    Loom.drive((e, raw) => {
      const t = raw * (t1 - t0);
      for (const it of items) {
        const a = it.a0 + t * (o.speed || 0.55), r = it.r0 * (1 - (o.pull == null ? 0.42 : o.pull) * raw);
        it.g.setAttribute("transform", `translate(${f(cx + Math.cos(a) * r * 1.25)} ${f(cy + Math.sin(a) * r * 0.82)}) rotate(${f(Math.sin(a * 2) * 12)})`);
      }
    }, t0, t1 - t0, "linear", { kind: "orbit", beat: E.beat, name, content: true });
    return E;
  };

  /* ---------------- crackle: electric bolts that re-strike every few frames ---------------- */
  G.crackle = function (p, cx, cy, o) {
    o = o || {};
    const g = svg("g", { class: "lm-crackle" }, p), n = o.n || 5, rx = o.rx || 150, ry = o.ry || 240;
    const bolts = [];
    const bw = o.width || 10;
    for (let i = 0; i < n; i++) bolts.push([svg("path", { fill: "none", stroke: tok(o.color, "glow"), "stroke-width": bw * 2.6, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.18 }, g),
      svg("path", { fill: "none", stroke: tok(o.color, "glow"), "stroke-width": bw, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.8 }, g),
      svg("path", { fill: "none", stroke: tok("ink"), "stroke-width": bw * 0.34, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.95 }, g)]);
    const t0 = o.t0 || 0, t1 = o.t1 || t0 + 3, rate = o.rate || 10;
    if (t0 > 0) { Loom.set(g, { opacity: 0 }, 0); Loom.set(g, { opacity: 1 }, t0); }   // a drive draws its p=0 state at load (L-136)
    Loom.drive((e, raw) => {
      const t = t0 + raw * (t1 - t0), k = Math.floor(t * rate);
      bolts.forEach(([h, a, b], i) => {
        const rng = Loom.rng(`crk:${i}:${k}`), ang = (i / n) * 6.283 + rng() * 0.9;
        // bolts HUG the silhouette: they run along an arc of the outline (an ellipse, or o.outline points) with a
        // small zig-zag across it, so the electricity sits on the figure, not in the air around it (Kshitij, R-23)
        // few long segments with an irregular small kink read as a spark; many tight alternating ones read as a spring
        const segs = o.segs || 5, sweep = ((o.len || 220) / Math.max(rx, ry)) * (0.7 + rng() * 0.5), jit = o.jitter == null ? 0.035 : o.jitter;
        let d = "";
        for (let sI = 0; sI <= segs; sI++) {
          const a = ang + sweep * (sI / segs) * (0.85 + rng() * 0.3), zz = (rng() * 2 - 1) * jit + 0.02;
          const x = cx + Math.cos(a) * rx * (1 + zz), y = cy + Math.sin(a) * ry * (1 + zz);
          d += `${sI ? " L" : "M"}${f(x)} ${f(y)}`;
        }
        const on = rng() < (o.density || 0.75) ? 1 : 0;
        h.setAttribute("d", d); a.setAttribute("d", d); b.setAttribute("d", d);
        h.setAttribute("opacity", on * 0.18); a.setAttribute("opacity", on * 0.8); b.setAttribute("opacity", on * 0.95);
      });
    }, t0, t1 - t0, "linear", { kind: "ambient" });
    return g;
  };

  /* ---------------- sparkles: four-point stars that twinkle in turn ---------------- */
  G.sparkles = function (p, o) {
    o = o || {};
    const g = svg("g", { class: "lm-sparkles" }, p), rng = Loom.rng(`spk:${o.seed || "s"}`), list = [];
    for (let i = 0; i < (o.n || 8); i++) {
      const x = (o.x || 0) + rng() * (o.w || 400), y = (o.y || 0) + rng() * (o.h || 300), s = (o.size || 22) * (0.6 + rng() * 0.8);
      const st = svg("g", { transform: `translate(${f(x)} ${f(y)})` }, g);
      const star = svg("path", { d: `M0 ${-s} Q${s * 0.16} ${-s * 0.16} ${s} 0 Q${s * 0.16} ${s * 0.16} 0 ${s} Q${-s * 0.16} ${s * 0.16} ${-s} 0 Q${-s * 0.16} ${-s * 0.16} 0 ${-s} Z`, fill: tok(o.color, "core") }, st);
      list.push([star, rng() * 6.283, 1.2 + rng() * 1.6]);
    }
    const t0 = o.t0 || 0, t1 = o.t1 || t0 + 3;
    if (t0 > 0) { Loom.set(g, { opacity: 0 }, 0); Loom.set(g, { opacity: 1 }, t0); }
    Loom.drive((e, raw) => {
      const t = t0 + raw * (t1 - t0);
      for (const [st, ph, sp] of list) { const k = Math.max(0, Math.sin(ph + t * sp * 3)); st.setAttribute("transform", `scale(${f2(0.15 + 0.85 * k)})`); st.setAttribute("opacity", f2(0.2 + 0.8 * k)); }
    }, t0, t1 - t0, "linear", { kind: "ambient" });
    return g;
  };

  /* ---------------- idle: background life on an element (bob, sway, breathe), period-locked ---------------- */
  G.idle = function (E, t0, t1, o) {
    o = o || {};
    const bob = o.bob == null ? 6 : o.bob, sway = o.sway || 0, breathe = o.breathe || 0, per = o.period || 2.6, ph = o.phase || 0;
    const n = Math.max(1, Math.round((t1 - t0) / per));
    const cx = o.cx == null ? (E.w || 0) / 2 : o.cx, cy = o.cy == null ? (E.h || 0) : o.cy;
    Loom.drive((e, raw) => {
      const a = 2 * Math.PI * raw * n + ph;
      E.life.setAttribute("transform", `translate(0 ${f(Math.sin(a) * bob)}) rotate(${f(Math.sin(a * 0.5) * sway)} ${f(cx)} ${f(cy)}) translate(${f(cx)} ${f(cy)}) scale(1 ${f2(1 + Math.sin(a) * breathe)}) translate(${f(-cx)} ${f(-cy)})`);
    }, t0, t1 - t0, "linear", { kind: "ambient", beat: E.beat, name: E.name });
    return E;
  };

  /* ---------------- swarm: many small agents, each on its own seeded path ---------------- */
  G.swarm = function (ctx, name, o) {
    o = o || {};
    const A = o.area || { x: 0, y: 0, w: 1920, h: 1080 }, n = o.n || 20, kind = o.kind || "mote";
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "group", parent: o.parent });
    const rng = Loom.rng(`swarm:${name}`), cols = o.colors || ["violet", "plum", "surface", "accent"], agents = [];
    for (let i = 0; i < n; i++) {
      const s = (o.size ? o.size[0] + rng() * (o.size[1] - o.size[0]) : 12 + rng() * 18), c = cols[i % cols.length];
      const g = svg("g", {}, E.inner);
      if (kind === "fish") {
        svg("path", { d: `M${-s * 1.6} 0 L${-s * 2.5} ${-s * 0.75} L${-s * 2.5} ${s * 0.75} Z`, fill: S().darken(tok(c), 0.15) }, g);
        svg("ellipse", { cx: 0, cy: 0, rx: s * 1.7, ry: s, fill: tok(c) }, g);
        svg("ellipse", { cx: -s * 0.2, cy: s * 0.3, rx: s * 1.2, ry: s * 0.5, fill: S().darken(tok(c), 0.18), opacity: 0.6 }, g);
        svg("circle", { cx: s * 0.9, cy: -s * 0.2, r: s * 0.32, fill: tok("ink") }, g);
        svg("circle", { cx: s * 1.0, cy: -s * 0.25, r: s * 0.14, fill: tok("deep") }, g);
      } else if (kind === "cell") {
        G.blob(g, 0, 0, s, { fill: c, seed: `${name}${i}`, lobes: 6, wobble: 0.1 });
        svg("circle", { cx: s * 0.1, cy: s * 0.05, r: s * 0.32, fill: S().darken(tok(c), 0.3), opacity: 0.8 }, g);
      } else {
        G.glowDisc(g, 0, 0, s * 0.35, c, { opacity: 0.3, spread: 3 });
      }
      agents.push({ g, x: A.x + rng() * A.w, y: A.y + rng() * A.h, ax: 40 + rng() * 120, ay: 20 + rng() * 60, fx: 0.15 + rng() * 0.35, fy: 0.2 + rng() * 0.4, ph: rng() * 6.283, drift: (o.drift || 0) * (0.6 + rng() * 0.8), z: 0.6 + rng() * 0.6 });
    }
    const t0 = o.t0 || 0, t1 = o.t1 || t0 + 6;
    Loom.drive((e, raw) => {
      const t = raw * (t1 - t0);
      for (const a of agents) {
        const x = a.x + Math.sin(a.ph + t * a.fx * 6.283) * a.ax + a.drift * t, y = a.y + Math.sin(a.ph * 1.3 + t * a.fy * 6.283) * a.ay;
        const vx = Math.cos(a.ph + t * a.fx * 6.283) * a.ax * a.fx + a.drift, vy = Math.cos(a.ph * 1.3 + t * a.fy * 6.283) * a.ay * a.fy;
        const ang = kind === "fish" ? Math.atan2(vy, vx) * 57.3 : 0, flip = kind === "fish" && Math.abs(ang) > 90;
        const wob = 1 + Math.sin(a.ph + t * 5) * 0.04;
        a.g.setAttribute("transform", `translate(${f(x)} ${f(y)}) rotate(${f(flip ? ang - 180 : ang)}) scale(${f2((flip ? -1 : 1) * a.z * wob)} ${f2(a.z / wob)})`);
      }
    }, t0, t1 - t0, "linear", { kind: "ambient", beat: E.beat, name });
    return E;
  };

  /* ---------------- shafts: soft light from above, swaying ---------------- */
  G.shafts = function (ctx, name, o) {
    o = o || {};
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: o.parent });
    const gid = id("shaft"), defs = svg("defs", {}, E.inner), lg = svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svg("stop", { offset: "0", "stop-color": tok(o.color, "glow"), "stop-opacity": o.opacity == null ? 0.22 : o.opacity }, lg);
    svg("stop", { offset: "1", "stop-color": tok(o.color, "glow"), "stop-opacity": 0 }, lg);
    const rng = Loom.rng(`shafts:${name}`), list = [];
    for (let i = 0; i < (o.n || 5); i++) {
      const x = 120 + rng() * 1680, w = 70 + rng() * 140, lean = (o.lean == null ? 260 : o.lean) * (0.7 + rng() * 0.6);
      const sh = svg("polygon", { points: `${f(x)},-20 ${f(x + w)},-20 ${f(x + w + lean + w * 1.2)},1100 ${f(x + lean - w * 0.4)},1100`, fill: `url(#${gid})` }, E.inner);
      list.push([sh, rng() * 6.283]);
    }
    if (o.t1) Loom.drive((e, raw) => {
      const t = (o.t0 || 0) + raw * (o.t1 - (o.t0 || 0));
      for (const [sh, ph] of list) sh.setAttribute("opacity", f2(0.65 + 0.35 * Math.sin(ph + t * 0.9)));
    }, o.t0 || 0, o.t1 - (o.t0 || 0), "linear", { kind: "ambient", beat: E.beat, name });
    return E;
  };


  /* ---------------- coral: a branching coral (tapering round branches, lit tips) ---------------- */
  G.coral = function (p, x, y, h, o) {
    o = o || {};
    const g = svg("g", { class: "lm-coral" }, p), rng = Loom.rng(`coral:${o.seed || x}`), fill = tok(o.fill, "accent3");
    const shade = S().darken(fill, 0.25), lite = S().lighten(fill, 0.3), segs = [];
    const grow = (x0, y0, ang, len, w, depth) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      const bend = (rng() - 0.5) * len * 0.35, mx = (x0 + x1) / 2 + Math.cos(ang + 1.57) * bend, my = (y0 + y1) / 2 + Math.sin(ang + 1.57) * bend;
      segs.push({ d: `M${f(x0)} ${f(y0)} Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}`, w, x1, y1, tip: depth === 0 });
      if (depth > 0) {
        const k = 2 + (rng() < 0.35 ? 1 : 0);
        for (let i = 0; i < k; i++) grow(x1, y1, ang + (i - (k - 1) / 2) * (0.5 + rng() * 0.35), len * (0.62 + rng() * 0.18), w * 0.72, depth - 1);
      }
    };
    grow(x, y, -Math.PI / 2 + (rng() - 0.5) * 0.3, h * 0.36, o.width || h * 0.11, o.depth == null ? 3 : o.depth);
    for (const s2 of segs) svg("path", { d: s2.d, fill: "none", stroke: shade, "stroke-width": f(s2.w * 1.18), "stroke-linecap": "round" }, g);
    for (const s2 of segs) svg("path", { d: s2.d, fill: "none", stroke: fill, "stroke-width": f(s2.w), "stroke-linecap": "round" }, g);
    for (const s2 of segs) if (s2.tip) { svg("circle", { cx: f(s2.x1), cy: f(s2.y1), r: f(s2.w * 0.62), fill: lite }, g); svg("circle", { cx: f(s2.x1 - s2.w * 0.18), cy: f(s2.y1 - s2.w * 0.2), r: f(s2.w * 0.2), fill: "#FFFFFF", opacity: 0.45 }, g); }
    return g;
  };
  /** a fan coral: a lattice fan on a short stem */
  G.fan = function (p, x, y, r, o) {
    o = o || {};
    const g = svg("g", { class: "lm-fan" }, p), fill = tok(o.fill, "violet"), rng = Loom.rng(`fan:${o.seed || x}`);
    svg("path", { d: `M${f(x - r)} ${f(y - r * 0.15)} A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y - r * 0.15)} L${f(x + r * 0.12)} ${f(y)} L${f(x - r * 0.12)} ${f(y)} Z`, fill, opacity: 0.92 }, g);
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) * (Math.PI / 9) + (rng() - 0.5) * 0.08; svg("line", { x1: x, y1: y, x2: f(x + Math.cos(a) * r * 0.96), y2: f(y - r * 0.15 + Math.sin(a) * r * 0.96), stroke: S().darken(fill, 0.28), "stroke-width": 5, "stroke-linecap": "round" }, g); }
    for (let k = 1; k < 4; k++) svg("path", { d: `M${f(x - r * k / 4)} ${f(y - r * 0.15)} A${f(r * k / 4)} ${f(r * k / 4)} 0 0 1 ${f(x + r * k / 4)} ${f(y - r * 0.15)}`, fill: "none", stroke: S().lighten(fill, 0.25), "stroke-width": 3, opacity: 0.6 }, g);
    return g;
  };
  /** kelp: a tall wavy strand that sways from its root (period-locked) */
  G.kelp = function (p, x, y, h, o) {
    o = o || {};
    const g = svg("g", { class: "lm-kelp" }, p), fill = tok(o.fill, "pos"), path = svg("path", { fill: "none", stroke: fill, "stroke-width": o.width || 26, "stroke-linecap": "round" }, g);
    const leaves = [0.3, 0.5, 0.7, 0.88].map(() => svg("ellipse", { rx: 26, ry: 11, fill: S().darken(fill, 0.12) }, g));
    const at = (u, t) => [x + Math.sin(u * 4 + t * 1.6 + (o.phase || 0)) * 26 * u + Math.sin(t * 0.9) * 30 * u * u, y - h * u];
    const draw = (t) => {
      let d = ""; for (let i = 0; i <= 12; i++) { const [px, py] = at(i / 12, t); d += `${i ? " L" : "M"}${f(px)} ${f(py)}`; }
      path.setAttribute("d", d);
      [0.3, 0.5, 0.7, 0.88].forEach((u, i) => { const [px, py] = at(u, t); leaves[i].setAttribute("transform", `translate(${f(px + (i % 2 ? 22 : -22))} ${f(py)}) rotate(${i % 2 ? -30 : 30})`); });
    };
    draw(o.t0 || 0);
    if (o.t1) Loom.drive((e, raw) => draw((o.t0 || 0) + raw * (o.t1 - (o.t0 || 0))), o.t0 || 0, o.t1 - (o.t0 || 0), "linear", { kind: "ambient" });
    return g;
  };
  /** a rounded rock with a lit top */
  G.rock = function (p, x, y, w, o) {
    o = o || {};
    return G.blob(p, x, y - w * 0.28, w * 0.5, { fill: o.fill || "surface", seed: o.seed || `rock${x}`, lobes: 5, wobble: 0.1, sy: 0.6 });
  };

  /* ---------------- ticket: a work item as a card (header bar, text lines, a status) ---------------- */
  G.ticket = function (p, x, y, o) {
    o = o || {};
    const w = o.w || 150, h = o.h || 96, g = svg("g", { class: "lm-ticket", transform: `translate(${f(x)} ${f(y)}) rotate(${f(o.rot || 0)})` }, p), k = K();
    const done = o.state === "done";
    k.rect(g, -w / 2, -h / 2, w, h, { fill: done ? "surface" : "surface2", r: 12, stroke: done ? undefined : tk(o.tone || "accent3"), sw: 3 });
    k.rect(g, -w / 2, -h / 2, w, 20, { fill: tk(done ? "muted" : (o.tone || "accent3")), r: 10, flat: true, crisp: true });
    for (let i = 0; i < 2; i++) k.rect(g, -w / 2 + 16, -h / 2 + 34 + i * 18, (w - 32) * (i ? 0.6 : 0.9), 8, { fill: "muted", r: 4, flat: true, crisp: true, opacity: done ? 0.4 : 0.8 });
    if (done) k.mark(g, "yes", w / 2 - 22, h / 2 - 22, 30, {});
    else svg("circle", { cx: w / 2 - 22, cy: h / 2 - 22, r: 11, fill: tok(o.tone || "accent3") }, g);
    return g;
  };

  /* ---------------- pill: a saturated label ON the thing, optional pointer to it ---------------- */
  G.pill = function (p, x, y, text, o) {
    o = o || {};
    // a lesson with a design seed draws its labels in its own treatment (D-81); with no seed nothing changes (D-70)
    const seedLabel = Loom.treat && Loom.treat.seed() && Loom.treat.pick("label", o.as ? { as: o.as } : null);
    if (seedLabel && seedLabel !== "pill") {
      const lo = { as: seedLabel, tone: tk(o.tone || "accent4"), role: o.role, weight: o.weight, maxW: o.maxW, to: o.point };
      const gw = o.align === "left" || o.align === "right" ? Loom.treat.labelGeom(x, y, text, lo).w : 0;
      const L = Loom.treat.labelShape(p, o.align === "left" ? x + gw / 2 : o.align === "right" ? x - gw / 2 : x, y, text, lo);
      if (o.point) {
        const lg = svg("g", {}, null), [tx, ty] = o.point, [ax, ay] = L.anchor;
        p.insertBefore(lg, L.g);
        K().line(lg, ax, ay, tx, ty, { stroke: seedLabel === "flag" ? "ink" : tk(o.tone || "accent4"), sw: seedLabel === "flag" ? 5 : 3, crisp: true });
        svg("circle", { cx: tx, cy: ty, r: seedLabel === "tag" ? 6 : 5, fill: tok(seedLabel === "flag" ? "ink" : o.tone || "accent4") }, lg);
      }
      (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis: "label", as: seedLabel, name: "glow.pill", seeded: true });
      L.g.__box = L.box;
      return L.g;
    }
    const k = K(), tone = o.tone || "accent4", role = o.role || "label";
    const F = k.fit(text, { role, w: o.maxW || 520, maxLines: 1, weight: o.weight || 700 });
    const padX = Math.max(18, F.size * 0.6), h = Math.round(F.size * 1.55 + 10), w = Math.round(F.width + padX * 2);
    const g = svg("g", { class: "lm-pill" }, p);
    const bx = o.align === "left" ? x : o.align === "right" ? x - w : x - w / 2, by = y - h / 2;
    if (o.point) {
      const [tx, ty] = o.point;
      k.line(g, x, y, tx, ty, { stroke: tk(tone), sw: 4, crisp: true });
      svg("circle", { cx: tx, cy: ty, r: 7, fill: tok(tone) }, g);
    }
    k.rect(g, bx, by, w, h, { fill: tk(tone), r: h / 2 });
    k.text(g, text, { role, x: bx + padX * 0.5, y: by + 4, w: w - padX, h: h - 8, align: "center", valign: "middle", weight: o.weight || 700, color: o.color || tk("onAccent"), maxLines: 1 });
    g.__box = { x: bx, y: by, w, h };
    return g;
  };

  /* ---------------- stat: a game-style stat pill that pops out on a leader line ---------------- */
  G.stat = function (ctx, name, text, o) {
    o = o || {};
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "label", parent: o.parent });
    const [fx, fy] = o.from || [960, 400];
    const lead = K().path(E.inner, `M${fx} ${fy} L${(fx + o.x) / 2} ${fy - 30} L${o.x} ${o.y}`, { stroke: tk(o.tone || "accent4"), sw: 5 });
    const pill = G.pill(E.inner, o.x, o.y, text, { tone: o.tone || "accent4", role: o.role || "lead", weight: 800 });
    const t = o.t || 0;
    Loom.motion.draw(lead, t, { dur: 0.3 });
    Loom.tween(pill, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.34, ease: Loom.ease.overshoot }, t + 0.22, { kind: "pop", beat: E.beat, name, content: true });
    return E;
  };

  /* ---------------- hud: a status panel whose slots change one per spoken word ---------------- */
  G.hud = function (ctx, name, o) {
    o = o || {};
    const icons = o.icons || ["utensils", "shield", "moon", "brain"], n = icons.length, slot = o.slot || 112, gap = o.gap || 26;
    const w = n * slot + (n + 1) * gap, h = slot + gap * 2;
    const x = o.x == null ? 960 - w / 2 : o.x, y = o.y == null ? 860 : o.y;
    const E = ctx.el(name, { x, y, w, h, kind: "card", parent: o.parent });
    const k = K();
    G.glowDisc(E.inner, w / 2, h / 2, Math.min(w, h) * 0.3, o.tone || "accent4", { core: false, opacity: 0.1, spread: 2.6 });
    k.rect(E.inner, 0, 0, w, h, { fill: "surface2", r: 26, stroke: tk(o.tone || "accent4"), sw: 4 });
    if (o.title) G.pill(E.inner, w / 2, -6, o.title, { tone: o.tone || "accent4" });
    const slots = icons.map((ic, i) => {
      const sx = gap + i * (slot + gap), g = svg("g", {}, E.inner);
      k.rect(g, sx, gap, slot, slot, { fill: tk(o.slotTone || "accent4"), r: 22 });
      k.icon(g, ic, { x: sx + slot / 2, y: gap + slot / 2, size: slot * 0.56, color: tk("onAccent"), stroke: 2.4 });
      const off = svg("g", { opacity: 0 }, g);
      k.rect(off, sx, gap, slot, slot, { fill: "shadow", r: 22, flat: true, opacity: 0.72 });
      k.line(off, sx + 20, gap + slot - 20, sx + slot - 20, gap + 20, { stroke: "neg", sw: 8, crisp: true });
      return off;
    });
    return {
      E, w, h,
      /** switch slot i off at t (the one change that carries the point) */
      dim(i, t) { Loom.tween(slots[i], { opacity: 0 }, { opacity: 1, duration: 0.22, ease: Loom.ease.enter }, t, { kind: "state", beat: E.beat, name, content: true }); return t; },
      light(i, t) { Loom.tween(slots[i], { opacity: 1 }, { opacity: 0, duration: 0.22, ease: Loom.ease.enter }, t, { kind: "state", beat: E.beat, name, content: true }); return t; },
    };
  };

  /* ---------------- compare: a pair of framed panels that returns with one new value ---------------- */
  G.compare = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 700, H = o.h || 560, gap = o.gap || 120, y = o.y == null ? 150 : o.y;
    const x0 = 960 - W - gap / 2, x1 = 960 + gap / 2;
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "group", parent: o.parent });
    const k = K(), panes = {};
    [["left", x0, o.left || "Before", o.leftTone || "accent4"], ["right", x1, o.right || "After", o.rightTone || "accent3"]].forEach(([side, x, label, tone]) => {
      const g = svg("g", {}, E.inner);
      G.glowDisc(g, x + W / 2, y + H / 2, W * 0.3, tone, { core: false, opacity: 0.08, spread: 2.2 });
      k.rect(g, x, y, W, H, { fill: "surface2", r: 34, stroke: tk(tone), sw: 5 });
      const inner = svg("g", {}, g);
      G.pill(g, x + W / 2, y + H + 6, label, { tone, role: "lead", weight: 800 });
      panes[side] = { g: inner, x, y, w: W, h: H, cx: x + W / 2, cy: y + H / 2, tone };
    });
    return {
      E, L: panes.left, R: panes.right,
      /** a value pill pops at the top of a panel at t (the new number on the returning pair) */
      value(side, text, t, o2) {
        const P = panes[side], g = svg("g", {}, E.inner);
        G.pill(g, P.cx, P.y - 2, text, { tone: (o2 && o2.tone) || "accent2", role: "lead", weight: 800 });
        Loom.tween(g, { opacity: 0, scale: 0.5, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.32, ease: Loom.ease.overshoot }, t, { kind: "pop", beat: E.beat, name, content: true });
        return g;
      },
    };
  };

  /* ---------------- gauge: a "you are here" track beside a continuous move ---------------- */
  G.gauge = function (ctx, name, o) {
    o = o || {};
    const x = o.x == null ? 120 : o.x, y = o.y == null ? 150 : o.y, h = o.h || 780, n = o.n || 9;
    const E = ctx.el(name, { x, y, w: 120, h, kind: "card", parent: o.parent });
    const k = K();
    k.rect(E.inner, 0, -30, 120, h + 60, { fill: "surface2", r: 40 });
    for (let i = 0; i < n; i++) svg("circle", { cx: 60, cy: f((h / (n - 1)) * i), r: 9, fill: tok(o.dots || "muted"), opacity: 0.7 }, E.inner);
    const mk = svg("g", {}, E.inner);
    svg("polygon", { points: "-8,-20 26,0 -8,20", fill: tok(o.tone || "accent2") }, mk);
    svg("circle", { cx: 60, cy: 0, r: 15, fill: tok(o.tone || "accent2") }, mk);
    let at = o.start || 0;
    mk.setAttribute("transform", `translate(0 ${f(at * h)})`);
    return {
      E,
      /** slide the marker to fraction frac of the track, from t over dur seconds */
      move(frac, t, dur) {
        const a = at; at = frac;
        Loom.drive((e) => mk.setAttribute("transform", `translate(0 ${f((a + (frac - a) * e) * h)})`), t, dur || 1, "move", { kind: "move", beat: E.beat, name, content: true });
        return t + (dur || 1);
      },
    };
  };
})();
