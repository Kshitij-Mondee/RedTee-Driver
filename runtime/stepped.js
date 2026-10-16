/* Loom stepped time (D-114): "drawing on twos, threes, fours". Hand-made animation updates its drawings every 2, 3
 * or 4 frames at 24 fps (12, 8 or 6 drawings a second: every 0.083, 0.125 or 0.167 s). Motion that HOLDS and then
 * JUMPS at that rate is the cheapest visible difference between hand-made and code motion, and a line that boils
 * (its outline redrawn slightly differently on each step) is the second.
 *
 * API
 *   Loom.stepped.ease(base, dur, hz) -> ease     pure: progress quantised to n = round(dur * hz) steps, then base(q).
 *                                                 base: an ease function or a Loom.ease name. Always steps (maths).
 *   Loom.stepped.on(E, {hz, force}) -> hz|0       every LATER tween or drive on E (or anything inside it) steps at hz:
 *                                                 m.reveal, m.pop, m.travel, m.draw, m.morph ... unchanged scene code.
 *   Loom.stepped.off(E)                           later tweens on E are smooth again.
 *   Loom.stepped.wrap(fn, {hz, force}) -> fn()    every tween or drive CREATED inside fn steps (a whole passage).
 *   Loom.stepped.boil(E, t0, t1, {hz, amp, freq, seed, cycle, force}) -> t1
 *                                                 line boil: E's drawing is displaced by seeded noise whose seed
 *                                                 changes on every step (feTurbulence + feDisplacementMap).
 *   Loom.stepped.hzFor(node) -> hz|0              the stepping rate in force for a node (0 = smooth).
 *   Loom.stepped.allowed(o) -> bool               the pack gate (below).
 *
 * Pack behaviour: hand-made time is an ILLUSTRATED register. on(), wrap() and boil() act only when the pack's
 * look_family is "illustrated", or when the call passes {force: true}; in an editorial or technical pack they warn
 * (stepped_off_for_pack) and leave the motion smooth, so a scene written for a cartoon pack restyles cleanly. The
 * rate and boil amplitude come from pack.motion.stepped = {hz, boil, boil_freq} when a pack declares it (no pack does
 * yet), else hz 6 (on fours), boil amp 1.2 px, noise frequency 0.035. Loom.stepped.ease() is plain maths and is
 * never gated.
 *
 * How the switch works without editing core.js or motion.js: this file wraps Loom.tween and Loom.drive once at load
 * (motion.js calls them by property, so every m.* goes through the wrapper). A tween whose target is, or sits
 * inside, a node registered by on() (or that is created inside wrap()) gets its ease replaced by the stepped ease of
 * the same base and duration. GSAP eases see PROGRESS, not time, so the quantisation is by round(dur * hz) progress
 * steps per tween: steps are hz-spaced from each tween's own start, not on a global frame grid. A drive passes
 * meta.stepped (already stepped) or meta.nostep to opt out; boil drives are already quantised.
 *
 * Determinism: the stepped ease is floor(p * n + 1e-4) / n (the 1e-4 puts a time that lands on a boundary, after GSAP rounds it, in the later step), a pure function of progress. The boil seed on each step
 * is an integer from Loom.rng(seed) drawn once at build time, chosen by step index (floor of elapsed time * hz)
 * inside a Loom.drive, so seeking any time in any order sets the same seed. No clock, no Math.random.
 */
// @capability stepped_time | primitive | Loom.stepped.on, wrap, ease, boil | Primitives from the TED-Ed study | hand-made timing (drawings on twos or threes) and a boiling outline; illustrated packs only
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const St = (Loom.stepped = {});
  const reg = new WeakMap();    // DOM node -> hz
  const names = new Map();      // element name -> hz (drives carry a name, not a node)
  const scope = [];             // wrap() stack of hz
  Loom.report.stepped = Loom.report.stepped || [];

  const packCfg = () => { const m = (S() && S().pack && S().pack.motion) || {}; return m.stepped && typeof m.stepped === "object" ? m.stepped : {}; };
  St.defaultHz = function () { return +packCfg().hz || 6; };
  St.allowed = function (o) { return !!(o && o.force) || (S() && S().pack && S().pack.look_family === "illustrated"); };

  function baseEase(b) {
    if (typeof b === "function") return b;
    if (typeof b === "string") {
      if (Loom.ease[b]) return Loom.ease[b];
      if (b === "none") return Loom.ease.linear;
      if (window.gsap && window.gsap.parseEase) { const f = window.gsap.parseEase(b); if (f) return f; }
    }
    if (b == null && window.gsap && window.gsap.parseEase) return window.gsap.parseEase("power1.out");   // GSAP's own default
    return b == null ? Loom.ease.linear : Loom.ease.enter;
  }
  St.ease = function (base, dur, hz) {
    const f = baseEase(base);
    const n = Math.max(1, Math.round((dur > 0 ? dur : 0.5) * (hz > 0 ? hz : St.defaultHz())));
    const g = function (p) { if (p >= 1) return f(1); if (p <= 0) return f(0); return f(Math.floor(p * n + 1e-4) / n); };
    g.steps = n; g.hz = hz;
    return g;
  };

  function nodesOf(E) { if (!E) return []; return E.outer ? [E.outer] : [E.inner || E]; }
  St.on = function (E, o) {
    o = o || {};
    if (!St.allowed(o)) { Loom.warn("stepped_off_for_pack", `stepped.on(${E && E.name}): the pack is ${S().pack.look_family || "unset"}, not illustrated; pass {force: true} to step anyway`); return 0; }
    const hz = o.hz || St.defaultHz();
    for (const n of nodesOf(E)) reg.set(n, hz);
    if (E && E.name) names.set(E.name, hz);
    Loom.report.stepped.push({ kind: "on", name: (E && E.name) || null, hz });
    return hz;
  };
  St.off = function (E) {
    for (const n of nodesOf(E)) reg.set(n, 0);
    if (E && E.name) names.set(E.name, 0);
  };
  St.wrap = function (fn, o) {
    o = o || {};
    if (!St.allowed(o)) { Loom.warn("stepped_off_for_pack", "stepped.wrap: the pack is not illustrated; pass {force: true} to step anyway"); return fn(); }
    const hz = o.hz || St.defaultHz();
    scope.push(hz);
    Loom.report.stepped.push({ kind: "wrap", hz });
    try { return fn(); } finally { scope.pop(); }
  };
  St.hzFor = function (node) {
    if (scope.length) return scope[scope.length - 1];
    let n = node && node.length != null && !node.tagName ? node[0] : node;
    for (let k = 0; n && k < 64; k++) {
      if (reg.has(n)) return reg.get(n);
      n = n.parentNode;
    }
    return 0;
  };

  /* ---------------- the hook: stepped tweens and drives without editing core.js ---------------- */
  const tween0 = Loom.tween, drive0 = Loom.drive;
  const markLast = (hz) => { const T = Loom.report.tweens; if (T.length) T[T.length - 1].stepped = hz; };
  Loom.tween = function (target, from, to, t, meta) {
    const hz = to && !(meta && meta.nostep) ? St.hzFor(target) : 0;
    if (!hz) return tween0.apply(this, arguments);
    const dur = to.duration == null ? 0.5 : to.duration;
    const vars = Object.assign({}, to, { ease: St.ease(to.ease, dur, hz) });
    const r = tween0.call(this, target, from, vars, t, meta);
    markLast(hz);
    return r;
  };
  Loom.drive = function (fn, t, dur, ease, meta) {
    let hz = 0;
    if (!(meta && (meta.stepped || meta.nostep))) {
      hz = scope.length ? scope[scope.length - 1] : 0;
      if (!hz && meta && meta.node) hz = St.hzFor(meta.node);
      if (!hz && meta && meta.name && names.has(meta.name)) hz = names.get(meta.name);
    }
    if (!hz) return drive0.apply(this, arguments);
    const r = drive0.call(this, fn, t, dur, St.ease(ease || "linear", dur, hz), meta);
    markLast(hz);
    return r;
  };

  /* ---------------- line boil ---------------- */
  St.boil = function (E, t0, t1, o) {
    o = o || {};
    if (!St.allowed(o)) { Loom.warn("stepped_off_for_pack", `stepped.boil(${E && E.name}): the pack is not illustrated; pass {force: true} to boil anyway`); return t1; }
    if (!(t1 > t0)) { Loom.error("stepped_bad_window", `stepped.boil: t1 (${t1}) must be after t0 (${t0})`); return t0; }
    const cfg = packCfg();
    const hz = o.hz || cfg.boil_hz || 8;
    const amp = o.amp != null ? o.amp : (cfg.boil != null ? cfg.boil : 1.2);
    const freq = o.freq || cfg.boil_freq || 0.035;
    const host = E && E.life ? E.life : (E && E.inner) || E;
    if (!host || !host.setAttribute) { Loom.error("stepped_bad_target", "stepped.boil: target is not an element or node"); return t1; }
    // one filter per host, in user space with a margin, so thin lines (zero-height boxes) are never cut away
    let F = host.__boil;
    if (!F) {
      let b = null;
      if (E && E.w && E.h) b = { x: 0, y: 0, width: E.w, height: E.h };
      else { try { b = host.getBBox(); } catch (e) { b = null; } }
      if (!b || !(b.width + b.height > 0)) b = { x: -200, y: -200, width: Loom.W + 400, height: Loom.H + 400 };
      const m = 4 * amp + 12 + 0.08 * Math.max(b.width, b.height);
      const id = Loom.uid("boil");
      const defs = Loom.svg("defs", {}, E && E.outer ? E.outer : host.parentNode || host);
      const f = Loom.svg("filter", { id, filterUnits: "userSpaceOnUse", x: b.x - m, y: b.y - m, width: b.width + 2 * m, height: b.height + 2 * m, "color-interpolation-filters": "sRGB" }, defs);
      const turb = Loom.svg("feTurbulence", { type: "fractalNoise", baseFrequency: freq, numOctaves: 2, seed: 1, result: "lmBoilNoise" }, f);
      Loom.svg("feDisplacementMap", { in: "SourceGraphic", in2: "lmBoilNoise", scale: (4 * amp).toFixed(2), xChannelSelector: "R", yChannelSelector: "G" }, f);
      F = host.__boil = { id, turb, n: 0 };
    }
    F.n += 1;
    const steps = Math.max(1, Math.round((t1 - t0) * hz));
    const cycle = o.cycle == null ? 3 : o.cycle;   // classic boil loops 3 drawings; 0 = a new drawing every step
    const r = Loom.rng(o.seed != null ? o.seed : "boil:" + ((E && E.name) || F.id));
    const pool = Array.from({ length: cycle > 0 ? cycle : steps }, () => 1 + Math.floor(r() * 99991));
    const url = `url(#${F.id})`;
    Loom.drive((e, raw) => {
      if (raw <= 0 || raw >= 1) { host.removeAttribute("filter"); return; }
      const k = Math.min(steps - 1, Math.floor(raw * steps + 1e-4));
      host.setAttribute("filter", url);
      F.turb.setAttribute("seed", pool[k % pool.length]);
    }, t0, t1 - t0, "linear", { kind: "ambient", key: "boil:" + F.id, beat: Loom.ctxBeat && Loom.ctxBeat.id, name: ((E && E.name) || "boil") + ".boil", stepped: hz });
    Loom.report.stepped.push({ kind: "boil", name: (E && E.name) || null, hz, amp, t0, t1, steps });
    return t1;
  };
})();
