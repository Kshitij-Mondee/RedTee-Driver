/* Loom expressive motion (D-43..D-45): springs, orchestrated groups, gestures, and sound events.
 *
 * Adopted from motion/framer (springs with a designer-facing bounce + visual duration, variant
 * orchestration with stagger order and parent-before-children, reverse-order exits, keyframe gestures)
 * and from BRAG (sound written with the motion, not laid on afterwards), translated into Loom's laws:
 *   - every value is a pure function of the timeline clock (the spring is closed-form, not simulated);
 *   - the style pack's motion personality decides: a spring may only BOUNCE when the pack allows
 *     overshoot; otherwise it is critically damped (a natural arrival with no overshoot);
 *   - a group's whole reveal stays under ~1.2 s (lnd-motion-craft), so the stagger compresses to fit.
 */
// @capability springs_and_gestures | motion | Loom.spring, m.spring, m.group, m.groupExit, m.shake, m.nudge, m.press, m.glow, Loom.sfx | Expressive motion | arrivals with life (springs, orchestrated groups) and gestures that say wrong, look here, tapped, done; sound events
(function () {
  "use strict";
  const Loom = window.Loom;
  const M = Loom.motion;
  const S = () => Loom.style;
  const node = (E) => (E && E.inner) || E;
  const beatId = () => (Loom.ctxBeat && Loom.ctxBeat.id) || null;

  /* ---------------- springs ---------------- */
  // x(p) for a unit step response of a damped spring, normalised so x(0)=0 and x(1)=1 exactly.
  function springCurve(bounce) {
    const zeta = Math.max(0.05, 1 - bounce);          // bounce 0 -> critically damped
    const decay = Math.log(1000);                      // envelope reaches 0.1% at p = 1 (settled)
    const w = decay / zeta;                            // natural frequency in "per settle duration" units
    let raw;
    if (zeta >= 1) raw = (p) => 1 - Math.exp(-w * p) * (1 + w * p);
    else {
      const wd = w * Math.sqrt(1 - zeta * zeta);
      raw = (p) => 1 - Math.exp(-zeta * w * p) * (Math.cos(wd * p) + (zeta * w / wd) * Math.sin(wd * p));
    }
    const end = raw(1);
    return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : raw(p) + (1 - end) * p);
  }
  // p at which the curve first reaches 98% (what a viewer perceives as "arrived")
  function arrival(curve) {
    for (let i = 1; i <= 400; i++) { const p = i / 400; if (curve(p) >= 0.98) return p; }
    return 1;
  }
  /** Loom.spring({bounce, visual}) -> {ease, dur}. `visual` is the perceived arrival time in seconds
   *  (default: the style's enter duration); `dur` is the full settle time to give the tween. */
  Loom.spring = function (o) {
    o = o || {};
    let bounce = Math.max(0, Math.min(0.6, o.bounce || 0));
    if (bounce > 0 && !(S().pack.motion || {}).overshoot) {
      Loom.warn("spring_bounce_clamped", `${beatId() || ""}: this style's motion personality has no overshoot; the spring arrives without bouncing`);
      bounce = 0;
    }
    const curve = springCurve(bounce);
    const visual = o.visual || S().dur("enter");
    return { ease: curve, dur: +(visual / arrival(curve)).toFixed(3), bounce };
  };
  Loom.ease.spring = (bounce) => springCurve(bounce || 0);
  /** Named springs a scene can ask for; the pack's personality still clamps the bounce. */
  Loom.springs = { gentle: { bounce: 0 }, snappy: { bounce: 0.15 }, lively: { bounce: 0.3 } };

  /** spring entrance: from an offset state to rest, one progress for all properties. */
  M.spring = function (E, t, o) {
    o = o || {};
    const sp = Loom.spring(Object.assign({}, Loom.springs[o.preset || "gentle"] || {}, o));
    const from = Object.assign({ opacity: 0, y: o.dy == null ? 22 : o.dy, scale: o.scale == null ? 0.94 : o.scale, transformOrigin: "50% 50%" }, o.from || {});
    const to = { opacity: 1, y: 0, x: 0, scale: 1, duration: sp.dur, ease: sp.ease };
    if (E && E.name) { if (E.revealT == null || t < E.revealT) E.revealT = t; E.revealKind = "spring"; }
    Loom.tween(node(E), from, to, t, { kind: "spring", beat: E && E.beat, name: E && E.name, content: !!o.content });
    if (o.sfx) Loom.sfx(o.sfx === true ? "land" : o.sfx, t + sp.dur * 0.35, { g: o.g });
    return t + sp.dur;
  };

  /* ---------------- orchestration (variants, stagger order, parent before children) ---------------- */
  function orderIdx(n, order, seed) {
    const idx = Array.from({ length: n }, (_, i) => i);
    if (order === "reverse") return idx.reverse();
    if (order === "center") { const c = (n - 1) / 2; return idx.sort((a, b) => Math.abs(a - c) - Math.abs(b - c) || a - b); }
    if (order === "edges") { const c = (n - 1) / 2; return idx.sort((a, b) => Math.abs(b - c) - Math.abs(a - c) || a - b); }
    if (order === "shuffle") { const r = Loom.rng(seed || "group"); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx; }
    return idx;
  }
  /** M.group(Es, t, {enter, stagger, order, maxTotal, each, parent, sfx}) -> the time the last member lands.
   *  enter: any entrance name ("reveal", "pop", "settle", "spring", "drop", "converge", "stamp").
   *  order: forward | reverse | center | edges | shuffle (seeded). parent: {E, enter} arrives FIRST and the
   *  members start halfway through it (framer's when: "beforeChildren"). sfx: "card" | "pop" | ... on the
   *  first and last arrival only (BRAG: accent the first and last of a sequence, not every item). */
  M.group = function (Es, t, o) {
    o = o || {};
    const n = Es.length;
    if (!n) return t;
    let t0 = t;
    if (o.parent && o.parent.E) {
      (M[o.parent.enter || "settle"] || M.settle)(o.parent.E, t, o.parent.opts || {});
      t0 = t + S().dur("enter") * 0.5;
    }
    let st = o.stagger != null ? o.stagger : S().dur("stagger");
    const maxTotal = o.maxTotal || 1.2;
    if (n > 1 && st * (n - 1) > maxTotal) st = maxTotal / (n - 1);
    const kind = o.enter || "reveal";
    const fn = M[kind];
    if (!fn) { Loom.error("group_unknown_entrance", kind); return t; }
    const ord = orderIdx(n, o.order, o.seed || `${beatId()}:${(Es[0] && Es[0].name) || "g"}`);
    let last = t0;
    ord.forEach((i, k) => {
      const ti = t0 + k * st;
      fn(Es[i], ti, Object.assign({}, o.each || {}, (o.per && o.per[i]) || {}));
      if (o.sfx && (k === 0 || k === n - 1 || o.sfxEvery)) Loom.sfx(o.sfx, ti, { i: k, g: o.g });
      last = ti;
    });
    return last + S().dur("enter");
  };
  /** M.groupExit(Es, t, {order, stagger, kind}): members leave in REVERSE order by default (framer's
   *  staggerDirection -1, when: "afterChildren"), faster than they came. Returns when the last has gone. */
  M.groupExit = function (Es, t, o) {
    o = o || {};
    const n = Es.length;
    if (!n) return t;
    const st = (o.stagger != null ? o.stagger : S().dur("stagger")) * 0.6;
    const ord = orderIdx(n, o.order || "reverse", o.seed);
    let last = t;
    ord.forEach((i, k) => { M.exit(Es[i], t + k * st, o.kind || Es[i].exit, o.each || {}); last = t + k * st; });
    if (o.parent) M.exit(o.parent, last + st, o.parentKind || o.parent.exit);
    return last + S().dur("exit");
  };

  /* ---------------- gestures (keyframe arrays, applied on E.life so they never fight an entrance) ------ */
  // Gestures run on the element's "life" group: entrances animate E.inner and moves animate E.mover, so a
  // gesture can play on top of either. (Do not combine a gesture with m.drift on the same element.)
  function keyframes(target, frames, t, dur, meta) {
    // frames: [{x, y, scale, rotation, opacity}...] evenly spaced over dur; one progress drives all.
    const keys = Object.keys(frames[0]);
    Loom.drive((e, raw) => {
      const f = raw * (frames.length - 1);
      const i = Math.min(frames.length - 2, Math.floor(f));
      const u = f - i;
      const eu = u * u * (3 - 2 * u); // smoothstep between keys
      const v = {};
      for (const k of keys) v[k] = frames[i][k] + (frames[i + 1][k] - frames[i][k]) * eu;
      target.setAttribute("transform", `translate(${(v.x || 0).toFixed(2)} ${(v.y || 0).toFixed(2)}) rotate(${(v.rotation || 0).toFixed(2)} ${target.__cx || 0} ${target.__cy || 0}) scale(${(v.scale == null ? 1 : v.scale).toFixed(4)})`);
    }, t, dur, "linear", meta);
  }
  function centre(E) { const l = E.life; l.__cx = (E.w || 0) / 2; l.__cy = (E.h || 0) / 2; return l; }
  /** shake: "no / wrong / blocked". A decaying horizontal shake (framer's x: [0,-10,10,-10,10,0]). */
  M.shake = function (E, t, o) {
    o = o || {}; const a = o.amp || 12;
    keyframes(centre(E), [{ x: 0 }, { x: -a }, { x: a * 0.8 }, { x: -a * 0.55 }, { x: a * 0.3 }, { x: 0 }], t, o.dur || 0.42, { kind: "gesture", beat: E.beat, name: E.name });
    if (o.sfx !== false) Loom.sfx("error", t, { g: o.g });
    return t + (o.dur || 0.42);
  };
  /** nudge: "look here" without a pulse. A small move toward (dx, dy) and back. */
  M.nudge = function (E, t, o) {
    o = o || {}; const dx = o.dx == null ? 0 : o.dx, dy = o.dy == null ? -8 : o.dy;
    keyframes(centre(E), [{ x: 0, y: 0 }, { x: dx, y: dy }, { x: 0, y: 0 }], t, o.dur || 0.36, { kind: "gesture", beat: E.beat, name: E.name });
    return t + (o.dur || 0.36);
  };
  /** press: the physical response of something tapped: in fast, out with a spring. */
  M.press = function (E, t, o) {
    o = o || {}; const d = o.depth || 0.955;
    const l = centre(E);
    keyframes(l, [{ scale: 1 }, { scale: d }, { scale: 1.012 }, { scale: 1 }], t, o.dur || 0.34, { kind: "gesture", beat: E.beat, name: E.name });
    return t + (o.dur || 0.34);
  };
  /** glow: a soft halo that swells once behind an element (a payoff), drawn from a token, no filters. */
  M.glow = function (E, t, o) {
    o = o || {};
    const w = E.w || 200, h = E.h || 120, pad = o.pad || 18;
    const r = Loom.svg("rect", { x: -pad, y: -pad, width: w + pad * 2, height: h + pad * 2, rx: (S().pack.shape.radius || 12) + pad, fill: "none", stroke: S().c(o.color || "accent"), "stroke-width": o.sw || 6, opacity: 0 }, E.life);
    E.life.insertBefore(r, E.life.firstChild);
    Loom.drive((e, raw) => {
      const s = Math.sin(Math.PI * raw);
      r.setAttribute("opacity", (0.55 * s).toFixed(3));
      r.setAttribute("stroke-width", ((o.sw || 6) * (0.6 + 0.8 * s)).toFixed(2));
    }, t, o.dur || 0.9, "linear", { kind: "gesture", beat: E.beat, name: E.name });
    if (o.sfx) Loom.sfx(o.sfx === true ? "success" : o.sfx, t, { g: o.g });
    return t + (o.dur || 0.9);
  };

  /* ---------------- sound events: the motion says where the sound goes ---------------- */
  /** Loom.sfx(kind, t, {g, i}) records a sound event at an absolute time. The check stage collects them
   *  (qa/sfx_events.json) and the mix synthesises them in the music's key. Kinds: click, key, card, land,
   *  reveal, success, error, whoosh, pop, tick, chime. */
  const SFX = ["click", "key", "card", "land", "reveal", "success", "error", "whoosh", "pop", "tick", "chime", "marker"];
  Loom.sfx = function (kind, t, o) {
    o = o || {};
    if (!SFX.includes(kind)) { Loom.error("sfx_unknown", `${kind} (use one of ${SFX.join(", ")})`); return; }
    if (!(t >= 0)) return;
    (Loom.report.sfx = Loom.report.sfx || []).push({ kind, t: +t.toFixed(3), g: o.g == null ? null : o.g, i: o.i == null ? null : o.i, beat: beatId() });
  };
})();
