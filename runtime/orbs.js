/* Loom orb: a dotted "thinking" orb for the moments an AI assistant works (2026-10-08).
 *
 * thinking-orbs (MIT, Jakub Antalik) ships its geometry as pure functions of (size, t): MODE_DRAWS[mode](ctx2d, size,
 * t, dark, opts) paints one instant with Math only (no clock, no randomness). Loom bundles that engine
 * (assets/vendor/js/thinking_orbs_engine.js, built by tools/vendor_js.mjs) and repaints a canvas from the timeline's
 * t on every seek, so the orb is frame-exact, forwards or backwards.
 *
 *   Loom.orb(ctx, "assistant", {x, y, size: 360, state: "searching", t, until, tint: "accent", speed: 1})
 *
 * States: working (orbits), searching (a scan sweeps a globe), solving (bands click like a cube), listening (a
 * waveform), connecting (a constellation wires itself), weaving (three strands), composing (a sash), breathing (a
 * ring), shaping (an outline morphs). Change state over time with `states: [{at, state}]` (each switch is a cut,
 * as in the source). Use it ONLY where the lesson shows an AI tool at work (AI literacy, assistant workflows); it
 * is a motif, not a decoration.
 *
 * Loom's own states (D-139, topic asset needs section 12), each a deterministic transform of an engine frame (the
 * dots of the state before it, or `base` on the state entry, default working) plus Loom's own canvas drawing:
 *   unsure    the dots loosen and drift on a smooth flow field and the colour cools toward `cool` (default the
 *             muted token): an answer the model is not grounded for
 *   checking  the orb dims and a slow scan ring passes over it top to bottom (period `scan`, default 2.6 s); the dots
 *             it crosses light up: verifying against a source
 *   paused    the orb contracts (to 74 %) and holds still on the instant it paused: waiting for a person
 * Each is a pure function of t like the engine's states (no state is carried from one paint to the next).
 */
// @capability orb | motion | Loom.orb(ctx, name, {x, y, size, state, t, until, tint, states}) | AI thinking orb | a dotted orb that shows an AI assistant working, searching, solving, listening or composing (thinking-orbs), and Loom's unsure, checking and paused states, frame-exact; only where the lesson shows an AI tool at work
(function () {
  "use strict";
  const Loom = window.Loom;
  const ENGINE = ["working", "searching", "solving", "listening", "connecting", "weaving", "composing", "breathing", "shaping"];
  const OWN = ["unsure", "checking", "paused"];
  const STATES = ENGINE.concat(OWN);

  function rgb(hex) {
    const h = String(hex || "").replace("#", "");
    if (h.length < 6) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function lum(hex) {
    const c = rgb(hex);
    return c ? (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 : 1;
  }
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  function mixRgb(a, b, k) {
    if (!a) return b; if (!b) return a;
    return { r: Math.round(a.r + (b.r - a.r) * k), g: Math.round(a.g + (b.g - a.g) * k), b: Math.round(a.b + (b.b - a.b) * k) };
  }
  function fracPart(x) { return x - Math.floor(x); }

  /* ---------------- Loom's own states: transforms of an engine frame (design-size pixels) ---------------- */
  // a frame is {dots: [{x, y, z, r, white, a}], lines: [{x1, y1, x2, y2, w, white, a}]}; copies only, the engine's
  // frame is never mutated
  function unsureFrame(F, size, local) {
    const k = smooth(local / 1.4), c = size / 2, R = size * 0.4;
    const dots = F.dots.map((d) => {
      const dx = d.x - c, dy = d.y - c, rr = Math.hypot(dx, dy) || 1;
      // a smooth flow field (position and time only), so a dot's drift never jumps when the engine's dot list shifts
      // plus a finer one, so neighbours part company: the cloud loosens rather than bending as one sheet
      const fx = Math.sin(d.y * 0.11 + local * 0.9) + 0.6 * Math.sin((d.x + d.y) * 0.07 - local * 0.6) + 0.9 * Math.sin(d.y * 0.53 + d.x * 0.31 + local * 1.3);
      const fy = Math.cos(d.x * 0.1 - local * 0.8) + 0.6 * Math.cos((d.x - d.y) * 0.08 + local * 0.5) + 0.9 * Math.cos(d.x * 0.49 - d.y * 0.27 - local * 1.1);
      const loose = 1 + k * (0.1 + 0.06 * Math.sin(Math.atan2(dy, dx) * 3 + local * 0.7));
      return Object.assign({}, d, {
        x: c + dx * loose + fx * k * R * 0.055, y: c + dy * loose + fy * k * R * 0.055 + k * rr * 0.04,
        r: d.r * (1 - 0.1 * k), white: Math.min(1, d.white + 0.08 * k), a: (d.a == null ? 1 : d.a) * (1 - 0.18 * k),
      });
    });
    const lines = F.lines.map((l) => Object.assign({}, l, { a: (l.a == null ? 1 : l.a) * (1 - 0.6 * k) }));
    return { frame: { dots, lines }, k };
  }
  function checkingFrame(F, size, local, period) {
    const c = size / 2, R = size * 0.42;
    const u = fracPart(local / period), env = Math.sin(Math.PI * u);   // the ring fades in at the top, out at the bottom
    const sy = c - R + 2 * R * smooth(u);                              // the ring's height on the orb
    const band = R * 0.16;
    const dots = F.dots.map((d) => {
      const near = env * Math.exp(-Math.pow((d.y - sy) / band, 2));
      return Object.assign({}, d, { white: Math.max(0, Math.min(1, d.white + 0.28) - 0.6 * near),
        a: Math.min(1, (d.a == null ? 1 : d.a) * (0.42 + 0.9 * near)), r: d.r * (1 + 0.35 * near) });
    });
    // the scan ring: dots on a flat ellipse at that height (front brighter than back)
    const half = Math.sqrt(Math.max(0, R * R - (sy - c) * (sy - c))) * 1.08, ry = half * 0.22, n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, front = Math.sin(a) > 0;
      dots.push({ x: c + Math.cos(a) * half, y: sy + Math.sin(a) * ry, z: front ? 9 : -9,
        r: size * (front ? 0.011 : 0.007), white: front ? 0 : 0.35, a: env * (front ? 1 : 0.45) });
    }
    dots.sort((p, q) => p.z - q.z);
    return { frame: { dots: dots.filter((d) => (d.a == null ? 1 : d.a) >= 0.02), lines: F.lines.map((l) => Object.assign({}, l, { a: (l.a == null ? 1 : l.a) * 0.4 })) } };
  }
  function pausedFrame(F, size, local) {
    const k = smooth(local / 0.55), s = 1 - 0.26 * k, c = size / 2;
    const P = (x) => c + (x - c) * s;
    const dots = F.dots.map((d) => Object.assign({}, d, { x: P(d.x), y: P(d.y), r: d.r * (1 - 0.1 * k), a: (d.a == null ? 1 : d.a) * (1 - 0.15 * k) }));
    const lines = F.lines.map((l) => Object.assign({}, l, { x1: P(l.x1), y1: P(l.y1), x2: P(l.x2), y2: P(l.y2) }));
    return { frame: { dots, lines } };
  }

  Loom.orb = function (ctx, name, o) {
    o = o || {};
    const OE = window.ThinkingOrbsEngine;
    if (!OE) { Loom.error("orb_missing", `${name}: the thinking-orbs engine is not loaded (compose loads it when a scene calls Loom.orb)`); return null; }
    const size = Math.round(o.size || 320);
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: size, h: size, kind: o.kind || "object", exit: o.exit || "recede", parent: o.parent });
    const fo = Loom.svg("foreignObject", { x: 0, y: 0, width: size, height: size }, E.inner);
    const cv = document.createElement("canvas");
    const dpr = 2;   // painted at twice the size, so the dots stay crisp in a 1080p frame
    cv.width = size * dpr; cv.height = size * dpr;
    cv.style.width = size + "px"; cv.style.height = size + "px";
    fo.appendChild(cv);
    const c2 = cv.getContext("2d");
    const pal = (Loom.style.pack && Loom.style.pack.palette) || {};
    const dark = o.dark == null ? lum(pal.field) < 0.45 : !!o.dark;
    const tint = o.tint ? rgb(Loom.style.c(o.tint)) : undefined;
    const cool = rgb(Loom.style.c(o.cool || "muted"));
    const t0 = o.t == null ? ctx.start + 0.2 : o.t;
    const t1 = o.until == null ? ctx.end : o.until;
    const speedMul = o.speed || 1;
    const scanPeriod = o.scan || 2.6;
    const design = Math.max(48, Math.min(size, o.design || 140));
    const plan = (o.states && o.states.length ? o.states : [{ at: t0, state: o.state || "working" }])
      .map((s) => ({ at: s.at == null ? t0 : s.at, base: s.base, state: STATES.includes(s.state) ? s.state : (Loom.warn("orb_state", `${name}: unknown state ${s.state}`), "working") }))
      .sort((a, b) => a.at - b.at);
    // each of Loom's states draws on the dots of the engine state before it (or its own `base`, default working)
    plan.forEach((s, i) => {
      if (!OWN.includes(s.state)) return;
      let b = null;
      for (let j = i - 1; j >= 0 && !b; j--) if (!OWN.includes(plan[j].state)) b = plan[j];
      if (s.base && ENGINE.includes(s.base)) s.src = { state: s.base, at: s.at, carry: 0 };
      else if (b) s.src = { state: b.state, at: b.at, carry: 0 };
      else s.src = { state: "working", at: s.at, carry: 0 };
    });
    const resolved = {};
    for (const s of plan) {
      const st = OWN.includes(s.state) ? s.src.state : s.state;
      resolved[st] = resolved[st] || OE.resolvePreset(st, 64);
    }
    const engineFrame = (state, local) => {
      const R = resolved[state];
      return OE.MODE_FRAMES[R.mode](design, local * (R.speed || 1) * speedMul, R.opts);
    };
    E.orbState = (now) => { let cur = plan[0]; for (const s of plan) if (now >= s.at - 1e-6) cur = s; return cur.state; };
    const paint = (now) => {
      let cur = plan[0];
      for (const s of plan) if (now >= s.at - 1e-6) cur = s;
      const local = Math.max(0, now - cur.at);
      c2.setTransform(1, 0, 0, 1, 0, 0);
      c2.clearRect(0, 0, cv.width, cv.height);
      // the presets are tuned for small orbs (64 px): draw the geometry at a design size and scale it up, so the dots
      // keep their proportion at hero size (painted at `size` directly they were specks, first lab strip)
      const k = size / design;
      c2.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
      try {
        if (!OWN.includes(cur.state)) { OE.paintFrame(c2, engineFrame(cur.state, local), dark, tint); return; }
        // the source state's time at the switch, then (unsure, checking) slowed, (paused) frozen
        const atSwitch = Math.max(0, cur.at - cur.src.at);
        if (cur.state === "unsure") {
          const r = unsureFrame(engineFrame(cur.src.state, atSwitch + local * 0.4), design, local);
          OE.paintFrame(c2, r.frame, dark, mixRgb(tint || (dark ? { r: 235, g: 235, b: 235 } : { r: 30, g: 30, b: 30 }), cool, 0.75 * r.k));
        } else if (cur.state === "checking") {
          OE.paintFrame(c2, checkingFrame(engineFrame(cur.src.state, atSwitch + local * 0.25), design, local, scanPeriod).frame, dark, tint);
        } else {
          OE.paintFrame(c2, pausedFrame(engineFrame(cur.src.state, atSwitch), design, local).frame, dark, tint);
        }
      } catch (e) { Loom.error("orb_paint", `${name}: ${e && e.message}`); }
    };
    paint(t0);
    Loom.drive((_e, p) => paint(t0 + p * (t1 - t0)), t0, Math.max(0.05, t1 - t0), "linear",
      { kind: "ambient", beat: ctx.beat && ctx.beat.id, name, key: `orb.${name}`, content: false });
    Loom.tween(E.life, { opacity: 0, scale: 0.92, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.4, ease: Loom.ease.enter }, t0,
      { kind: "enter", beat: ctx.beat && ctx.beat.id, name, content: true });
    E.orbPaint = paint;   // tests and recipes: paint the orb at any time (the timeline does the same on every seek)
    return E;
  };
  Loom.orb.states = STATES;
  Loom.orb.ownStates = OWN;
})();
