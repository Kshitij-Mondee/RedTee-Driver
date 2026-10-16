/* Loom runtime core.
 * Every frame is a pure function of (manifest, time): no wall clock, no unseeded randomness,
 * no rAF/timers. Everything is built once at load into ONE paused GSAP timeline that
 * HyperFrames seeks. Scenes, templates and blueprints only ever add tweens at absolute times
 * derived from narration cues.
 */
(function () {
  "use strict";
  const Loom = (window.Loom = window.Loom || {});
  Loom.version = "0.1.0";
  Loom.W = 1920; Loom.H = 1080;
  Loom.NS = "http://www.w3.org/2000/svg";

  /* ---------------- deterministic RNG (mulberry32) ---------------- */
  Loom.rng = function (seed) {
    let s = (typeof seed === "string" ? Loom.hash(seed) : seed) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  Loom.hash = function (str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  /* ---------------- report: what the check stage reads back ---------------- */
  const report = (Loom.report = { errors: [], warnings: [], elements: [], tweens: [], cues: [], texts: [], scenes: [] });
  window.__loom_report = report;
  // the beat being built is attached when the caller did not name one, so the agents' defect router can send the
  // problem to the agent that owns that beat (an "icon not bundled" with no beat could go nowhere, 2026-10-06)
  // ...and the lesson kit part drawing at the time (scenes/_kit.js hangs its parts on Loom.lesson): a problem raised
  // inside a part is the kit's, so the router sends it to the kit's author, not to every beat that uses the part
  // (R-35: 36 kit errors went to four scene workers for two rounds and stayed, L-326)
  const partStack = [];
  const withBeat = (e) => {
    if (e.beat == null && Loom.ctxBeat && Loom.ctxBeat.id) e.beat = Loom.ctxBeat.id;
    if (e.part == null && partStack.length) e.part = partStack[partStack.length - 1];
    return e;
  };
  // the element a part is drawn into (an element, or a group inside one), so the part's handle rides on that element: a
  // later beat that holds it gets the handle and drives the same drawing. ctx.held gave the element without it, and in
  // https-private-relay 7 of 12 beats drew a second board over the one they held (2026-10-12)
  const ownerOf = (p) => {
    if (p && p.inner && p.outer) return p;
    const o = p && p.closest ? p.closest(".lm-el") : null;
    return o ? o.__E || null : null;
  };
  const wrapPart = (name, fn) => {
    if (typeof fn !== "function" || fn.__loomPart) return fn;
    const w = function () {
      // only a part the scene calls is recorded: a part drawn inside another part belongs to the outer one's handle
      const top = !partStack.length, owner = top ? ownerOf(arguments[1]) : null;
      // the nodes this call adds to its parent: what the part drew, measured by Wd.auditParts (an element's declared box
      // is not where the part drew: a full-frame layer per instance read as 100 % overlap, gps-position b15, 2026-10-12)
      const par = arguments[1] && arguments[1].appendChild ? arguments[1] : (arguments[1] && arguments[1].inner) || null;
      const before = top && par ? par.childNodes.length : 0;
      partStack.push(name);
      try {
        const h = fn.apply(this, arguments);
        const nodes = top && par ? Array.from(par.childNodes).slice(before) : [];
        if (owner && owner.handle == null) { owner.handle = h; owner.partId = name; owner.partNodes = nodes; }
        if (top && Loom.ctxScene) (Loom.ctxScene.parts = Loom.ctxScene.parts || []).push({ id: name, owner, handle: h, nodes });
        return h;
      } finally { partStack.pop(); }
    };
    // what a kit hung on its part (states, a size, an API note) stays reachable through the wrapper
    Object.keys(fn).forEach((k) => { try { w[k] = fn[k]; } catch (e) { /* a read-only property: leave it */ } });
    w.__loomPart = name;
    w.__loomInner = fn;
    return w;
  };
  const lessonParts = new Proxy({}, { set(t, k, v) { t[k] = wrapPart(String(k), v); return true; } });
  // `Loom.lesson = Loom.lesson || {}` keeps this object; a kit that assigns a fresh object has its parts copied in
  Object.defineProperty(Loom, "lesson", {
    configurable: true, enumerable: true,
    get() { return lessonParts; },
    set(v) { if (v && v !== lessonParts && typeof v === "object") Object.keys(v).forEach((k) => { lessonParts[k] = v[k]; }); },
  });
  Loom.error = function (code, msg, extra) { report.errors.push(withBeat(Object.assign({ code, msg }, extra || {}))); };
  Loom.warn = function (code, msg, extra) { report.warnings.push(withBeat(Object.assign({ code, msg }, extra || {}))); };

  /* ---------------- easing: the curve library (lnd-motion-craft) ---------------- */
  function bezier(p1x, p1y, p2x, p2y) {
    // standard cubic-bezier solver (same maths as CSS), deterministic
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) break; const d = dsx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1;
      for (let i = 0; i < 20 && Math.abs(sx(t) - x) > 1e-6; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return sy(t);
    };
  }
  Loom.bezier = bezier;
  Loom.ease = {
    enter: bezier(0.16, 1, 0.3, 1),      // crisp entrance, no overshoot
    move: bezier(0.22, 1, 0.36, 1),      // standard A->B
    editorial: bezier(0.45, 0, 0.55, 1), // slow in-out (camera, canvas)
    overshoot: bezier(0.34, 1.56, 0.64, 1), // emphasis, sparingly
    exit: bezier(0.55, 0, 1, 0.45),      // gravity
    linear: (x) => x,
  };

  /* ---------------- the master timeline ---------------- */
  Loom.tl = null;
  const seen = new WeakMap();
  // A frame callback that throws must not take the whole render down: one broken scene stopped a 14,230-frame render at
  // frame 5,400 after nine minutes (bench claude-balanced b01, 2026-10-07). The error is reported ONCE (the check
  // already blocks on it) and that callback is switched off; every other beat still renders.
  function guard(fn, meta) {
    let dead = false;
    return function () {
      if (dead) return;
      try { return fn.apply(this, arguments); }
      catch (err) {
        dead = true;
        Loom.error("tween_threw", `${(meta && meta.beat) || "?"}: ${err && err.message}`, { beat: meta && meta.beat, name: meta && meta.name, stack: String(err && err.stack).slice(0, 400) });
      }
    };
  }
  Loom.guard = guard;
  // A scale or rotation takes its origin (transformOrigin "50% 50%") from getBBox when GSAP first initialises the
  // tween, which is the first time the playhead ENTERS it. Left alone, that was whatever time was seeked first: the
  // same pop frame came out 50 px apart reached frame by frame, by a jump (a render worker starting its segment
  // there) or after a later time (L-289). Each such tween's start is recorded here; Loom.settleOrigins enters each
  // one at its own start, in time order, before anything renders, so every origin is the drawing at that start.
  const ORIGIN_PROPS = ["transformOrigin", "svgOrigin", "scale", "scaleX", "scaleY", "rotation", "rotate", "skewX", "skewY"];
  const originStarts = [];
  Loom.tween = function (target, from, to, t, meta) {
    // Every tween in Loom goes through here so the report can see motion (static-hold detection).
    if (!(t >= 0)) { Loom.error("bad_time", "tween at non-finite time", { t, meta }); t = 0; }
    // An element's outer group belongs to the engine (its place, and the life clock that shows and hides it); motion
    // goes on its inner group, as ctx.m does. b01 of https-private-relay faded the board's outer group and HyperFrames'
    // capture drew no board at all while the live DOM said it was shown (2026-10-12): the tween is moved to the inner
    // group and the author told.
    if (target && target.__E && target.__E.outer === target && target.__E.inner) {
      const E = target.__E;
      Loom.warn("outer_tweened", `${(meta && meta.beat) || E.beat || "?"}: a tween on "${E.name}".outer was moved to its .inner: the outer group is the ` +
        "engine's (place and life); animate E.inner, or use ctx.m.reveal / ctx.m.exit", { beat: (meta && meta.beat) || E.beat });
      target = E.inner;
    }
    const dur = to.duration == null ? 0.5 : to.duration;
    // Only the FIRST tween on a target renders its from-state immediately (that is what hides an
    // element before its entrance). Later tweens (exits, travels) must not, or their from-state
    // would overwrite the hidden state at load and elements would show before they arrive.
    const n = seen.get(target) || 0;
    seen.set(target, n + 1);
    const vars = Object.assign({}, to);
    if (typeof vars.onUpdate === "function") vars.onUpdate = guard(vars.onUpdate, meta);
    if (n > 0 && vars.immediateRender == null) vars.immediateRender = false;
    Loom.tl.fromTo(target, from, vars, t);
    if (ORIGIN_PROPS.some((k) => k in from || k in vars)) originStarts.push({ tl: Loom.tl, t });
    report.tweens.push({ t0: +t.toFixed(3), t1: +(t + dur).toFixed(3), kind: (meta && meta.kind) || "tween", beat: meta && meta.beat, name: meta && meta.name, content: !!(meta && meta.content) });
  };
  /** Enter every scale and rotation tween of a timeline just after its own start, in time order, then return to 0:
   * GSAP measures each origin once, here, from the drawing at that tween's start, and every later seek reuses it.
   * Called by boot after the clocks (element lives, camera) are installed and before the shader layers. */
  Loom.settleOrigins = function (tl) {
    tl = tl || Loom.tl;
    // 4 decimals plus 0.1 ms is always just past the start it rounds from
    const ts = Array.from(new Set(originStarts.filter((o) => o.tl === tl).map((o) => +o.t.toFixed(4)))).sort((a, b) => a - b);
    for (const t of ts) tl.seek(t + 1e-4, false);
    // back to 0 the way a fresh page meets it, from BEFORE the start: arriving at 0 from a later time applies two sets
    // made for the same instant in reverse order (the earlier wins, and a forward seek never re-applies them), so a
    // place hidden and shown at 0 (lab_places) stayed hidden for its whole life (L-289)
    if (ts.length) { tl.seek(-1, false); tl.seek(0, false); }
    report.origins = (report.origins || 0) + ts.length;
    return ts.length;
  };
  /** Every seek of this timeline arrives MOVING FORWARD. GSAP renders a backward seek in reverse order, so where two
   * tweens of one element and property touch a frame (two sets at one instant, an exit that starts before the entrance
   * ends, two scales about different origins) the earlier one was written last, and a set crossed backward stayed
   * applied: a trailer cut back, a scrub, or a renderer arriving at 0 from later drew another frame (L-290, L-302).
   * A backward seek now returns to before the start and renders forward to its time, the path a fresh page takes.
   * Wraps totalTime, which seek, time, progress and pause all go through (HyperFrames calls seek, totalTime and
   * progress). Installed by boot after settleOrigins (whose own return to 0 already comes from before the start). */
  Loom.forwardOnly = function (tl) {
    if (!tl || tl.__forwardOnly) return tl;
    const tt = tl.totalTime;
    tl.totalTime = function (time, suppressEvents) {
      if (!arguments.length) return tt.call(this);
      if (time >= 0 && time < this._tTime) tt.call(this, -1, suppressEvents);
      return tt.call(this, time, suppressEvents);
    };
    tl.__forwardOnly = true;
    return tl;
  };
  Loom.set = function (target, vars, t) { Loom.tl.set(target, vars, t); };
  Loom.call = function (fn, t) {
    // Deterministic discrete update (counters, glyph swaps): expressed as a proxy tween so that
    // seeking to any time recomputes the value from progress, never from accumulated state.
    const proxy = { p: 0 };
    Loom.tl.fromTo(proxy, { p: 0 }, { p: 1, duration: 0.0001, ease: "none", onUpdate: () => fn(proxy.p) }, t);
  };
  const driveKeys = new Map();
  Loom.drive = function (fn, t, dur, ease, meta) {
    // Drive arbitrary per-frame properties from ONE progress value (one progress drives all properties).
    const proxy = { p: 0 };
    const e = typeof ease === "function" ? ease : Loom.ease[ease || "linear"];
    // meta.key names the property a drive writes (e.g. "board.camera"). Like Loom.tween, only the FIRST drive on a key
    // renders its start state at load; a later one (a pull back after a push) must not, or its start state (the
    // pushed-in view) shows from frame 0 until the first drive begins (phishing b17, 2026-10-03).
    const vars = { p: 1, duration: dur, ease: "none", onUpdate: guard(() => fn(e(proxy.p), proxy.p), Object.assign({ beat: Loom.ctxBeat && Loom.ctxBeat.id }, meta || {})) };
    if (meta && meta.key) { const n = driveKeys.get(meta.key) || 0; driveKeys.set(meta.key, n + 1); if (n > 0) vars.immediateRender = false; }
    Loom.tl.fromTo(proxy, { p: 0 }, vars, t);
    report.tweens.push({ t0: +t.toFixed(3), t1: +(t + dur).toFixed(3), kind: (meta && meta.kind) || "drive", beat: meta && meta.beat, name: meta && meta.name, content: !!(meta && meta.content) });
  };

  /* ---------------- DOM helpers ---------------- */
  Loom.svg = function (tag, attrs, parent, text) {
    const e = document.createElementNS(Loom.NS, tag);
    if (attrs) for (const k in attrs) { const v = attrs[k]; if (v !== undefined && v !== null) e.setAttribute(k, v); }
    if (text !== undefined && text !== null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  Loom.html = function (tag, attrs, parent, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  let uid = 0;
  Loom.uid = function (p) { uid += 1; return (p || "u") + uid; };

  /* ---------------- registries ---------------- */
  Loom.templates = {};
  Loom.blueprints = {};
  Loom.scenes = {};
  Loom.template = function (id, def) { def.id = id; Loom.templates[id] = def; };
  Loom.blueprint = function (id, def) { def.id = id; Loom.blueprints[id] = def; };
  Loom.scene = function (id, def) { def.id = id; Loom.scenes[id] = def; };
})();
