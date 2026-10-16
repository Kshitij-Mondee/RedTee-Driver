/* Loom motion vocabulary (lnd-motion-fit s2 + lnd-motion-craft curve library).
 * Every function schedules tweens at an ABSOLUTE time t (seconds) derived from a narration cue.
 * Durations come from the style pack's motion personality, never from literals in scenes.
 * Entrances ease OUT, exits ease IN, moves ease IN-OUT. Exits are ~0.6x entrances and never
 * the mirror of the entrance.
 */
// @capability motion_vocabulary | motion | m.reveal, settle, pop, stamp, drop, converge, grow, draw, unmask, iris, count, along, travel, highlight, emphasis, exit | motion | the motion vocabulary every reveal uses, timed on the spoken word
(function () {
  "use strict";
  const Loom = window.Loom;
  const M = (Loom.motion = {});
  const S = () => Loom.style;
  const E_ = () => Loom.ease;
  const node = (E) => (E && E.inner) || E;
  const meta = (E, kind, content) => ({ kind, beat: (E && E.beat) || (Loom.ctxBeat && Loom.ctxBeat.id), name: E && E.name, content: !!content });
  function mark(E, t, kind) { if (E && E.name) { if (E.revealT == null || t < E.revealT) E.revealT = t; E.revealKind = kind; } }
  const overshootOK = () => !!S().pack.motion.overshoot;

  function boxOf(E) {
    if (E && E.w && E.h) return { x: 0, y: 0, w: E.w, h: E.h, local: true };
    const b = node(E).getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }

  /* ----------- entrances ----------- */
  M.reveal = function (E, t, o) {
    o = o || {}; mark(E, t, "reveal");
    Loom.tween(node(E), { opacity: 0, y: o.dy == null ? 16 : o.dy }, { opacity: 1, y: 0, duration: o.dur || S().dur("enter"), ease: o.ease || E_().enter }, t, meta(E, "reveal", o.content));
  };
  M.settle = function (E, t, o) {
    o = o || {}; mark(E, t, "settle");
    Loom.tween(node(E), { opacity: 0, y: o.dy == null ? 28 : o.dy, scale: 0.985, transformOrigin: "50% 100%" }, { opacity: 1, y: 0, scale: 1, duration: o.dur || S().dur("enter") * 1.1, ease: o.ease || E_().enter }, t, meta(E, "settle", o.content));
  };
  M.pop = function (E, t, o) {
    o = o || {}; mark(E, t, "pop");
    Loom.tween(node(E), { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: o.dur || S().dur("enter") * 0.8, ease: o.ease || (overshootOK() && o.overshoot !== false ? E_().overshoot : E_().enter) }, t, meta(E, "pop", o.content));
  };
  M.stamp = function (E, t, o) {
    o = o || {}; mark(E, t, "stamp");
    Loom.tween(node(E), { opacity: 0, scale: 1.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: o.dur || S().dur("enter") * 0.7, ease: o.ease || E_().enter }, t, meta(E, "stamp", o.content));
  };
  M.drop = function (E, t, o) {
    o = o || {}; mark(E, t, "drop");
    Loom.tween(node(E), { opacity: 0, y: -36 }, { opacity: 1, y: 0, duration: o.dur || S().dur("enter"), ease: o.ease || (overshootOK() ? E_().overshoot : E_().enter) }, t, meta(E, "drop", o.content));
  };
  M.converge = function (E, t, o) {
    o = o || {}; mark(E, t, "converge");
    const dx = (o.from === "right" ? 1 : -1) * (o.dist || 140);
    Loom.tween(node(E), { opacity: 0, x: dx }, { opacity: 1, x: 0, duration: o.dur || S().dur("enter") * 1.1, ease: o.ease || E_().enter }, t, meta(E, "converge", o.content));
  };
  /** grow: magnitude out of a baseline (bars, stacks, fills). axis 'y' grows up from the bottom edge. */
  M.grow = function (E, t, o) {
    o = o || {}; mark(E, t, "grow");
    const axis = o.axis || "y";
    const from = axis === "y" ? { scaleY: 0, transformOrigin: o.origin || "50% 100%" } : { scaleX: 0, transformOrigin: o.origin || "0% 50%" };
    const to = axis === "y" ? { scaleY: 1 } : { scaleX: 1 };
    Loom.tween(node(E), Object.assign({ opacity: 1 }, from), Object.assign({ duration: o.dur || S().dur("enter") * 1.4, ease: E_().enter }, to), t, meta(E, "grow", o.content !== false));
  };
  /** draw: strokes draw along their path (connectors draw INTO what follows). Works on groups of paths. */
  M.draw = function (target, t, o) {
    o = o || {};
    // a kit.arrow() result {g, path, head}: draw the shaft, then LAND the head as the stroke arrives
    // (headAt = fraction of the draw, default 0.9; headDur default 0.12 s). This was copied by hand in four
    // places before (L-33); callers passing a.path keep the old behaviour exactly.
    if (target && target.path && target.head && target.g && !target.inner) {
      const dur = o.dur || S().dur("draw");
      const end = M.draw(target.path, t, Object.assign({}, o, { dur }));
      const to = { opacity: 1, duration: o.headDur == null ? 0.12 : o.headDur };
      if (o.headEase) to.ease = o.headEase;
      Loom.tween(target.head, { opacity: 0 }, to, t + dur * (o.headAt == null ? 0.9 : o.headAt), { kind: "draw" });
      return end;
    }
    const E = target && target.inner ? target : null; if (E) mark(E, t, "draw");
    const root = node(target);
    let paths = root.tagName === "path" || root.tagName === "line" || root.tagName === "polyline" || root.tagName === "circle" ? [root] : Array.from(root.querySelectorAll("path,line,polyline,circle"));
    // stroke-first (style guides s15, WS6 2026-10-08): a sketched shape is its fill hachure THEN its outline in DOM
    // order, so the hatching drew before the contour a hand draws first. Outlines first unless o.order === "dom".
    if (o.order !== "dom") {
      const isFill = (p) => !!(p.getAttribute && p.getAttribute("data-set") === "fill");
      paths = paths.filter((p) => !isFill(p)).concat(paths.filter(isFill));
    }
    const dur = o.dur || S().dur("draw");
    const lens = paths.map((p) => (p.getTotalLength ? p.getTotalLength() : 100) || 1);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    paths.forEach((p, i) => {
      const L = lens[i];
      // Undrawn must mean NO pixels. GSAP rounds the offset to whole px, so "L L" from offset L leaves a dash a
      // fraction of a pixel long at one end, and a round linecap paints it as a dot for the whole time before the
      // draw (L-225: the "random dots" on mfa-explained). Start the offset past L by more than the cap and give
      // the gap room so the pattern cannot wrap back onto the path.
      const sw = (p.getAttribute && parseFloat(p.getAttribute("stroke-width"))) || 4;
      const off0 = L + sw + 2;
      // a path's own dash pattern survives (a dashed reference line, a dashed route): the draw happens on a solid
      // copy in a MASK and the dashed path keeps its pattern; it was overwritten and drew solid (s15, 2026-10-08)
      const dash0 = p.getAttribute ? p.getAttribute("stroke-dasharray") : null;
      const ownDash = dash0 && dash0 !== "none" && !p.__lmDash;
      let drawn = p;
      if (ownDash && p.parentNode && p.cloneNode) {
        const mid = Loom.uid("lmdraw");
        const defs = Loom.svg("defs", {}, p.parentNode);
        const mk = Loom.svg("mask", { id: mid, maskUnits: "userSpaceOnUse", x: -20000, y: -20000, width: 40000, height: 40000 }, defs);
        const cp = p.cloneNode(false);
        for (const k of ["transform", "opacity", "class", "data-set", "mask", "filter", "style"]) cp.removeAttribute(k);
        cp.setAttribute("fill", "none"); cp.setAttribute("stroke", "#ffffff"); cp.setAttribute("stroke-width", sw + 6); cp.setAttribute("stroke-linecap", "round");
        mk.appendChild(cp);
        p.setAttribute("mask", `url(#${mid})`);
        drawn = cp;
      } else p.__lmDash = true;
      drawn.setAttribute("stroke-dasharray", `${L} ${L + 3 * sw + 6}`);
      // each path keeps its OWN opacity (a 0.35 rim, a 0.6 hachure fill set): the draw used to force it to 1
      const op = (() => { const a = p.getAttribute ? p.getAttribute("opacity") : null; const v = a == null ? 1 : parseFloat(a); return v >= 0 ? v : 1; })();
      const t0 = (o.together ? t : t + (acc / total) * dur) + ((o.delays && +o.delays[i]) || 0);
      const d = o.together ? dur : Math.max(0.05, (L / total) * dur);
      // The dash hides a STROKE only. A filled path inside the drawn target (a kit.arrow head drawn into an element,
      // a filled marker) painted from load, before its stroke was drawn (timeline spine heads, bench gemini b29/b30,
      // 2026-10-07). Its fill starts at 0 and lands at 0.9 of its own stroke, like an arrow head.
      let fo = 0;
      if (p.tagName !== "line") {
        // a real element in a page has a computed style; anything else (a DOM shim) is read from its attributes
        const attr = (k) => (p.getAttribute ? p.getAttribute(k) : null);
        let cs = null;
        try { cs = typeof window !== "undefined" && window.getComputedStyle && p.nodeType === 1 ? window.getComputedStyle(p) : null; } catch (e) { cs = null; }
        const fl = cs ? cs.fill : attr("fill");
        if (fl && fl !== "none" && fl !== "transparent" && !/^rgba\(.*,\s*0\)$/.test(fl)) {
          fo = parseFloat(cs ? cs.fillOpacity : attr("fill-opacity"));
          if (!(fo >= 0)) fo = 1;
        }
      }
      if (drawn !== p) Loom.tween(drawn, { strokeDashoffset: off0 }, { strokeDashoffset: 0, duration: d, ease: i === paths.length - 1 || o.together ? E_().move : "none" }, t0, meta(E, "draw", o.content !== false));
      else Loom.tween(p, { strokeDashoffset: off0, opacity: op }, { strokeDashoffset: 0, duration: d, ease: i === paths.length - 1 || o.together ? E_().move : "none" }, t0, meta(E, "draw", o.content !== false));
      // the fill has its own tween (one owner per property, so any seek order lands on the same frame); it renders
      // its hidden start state at load explicitly, as the first tween on a target does
      if (fo > 0) Loom.tween(p, { fillOpacity: 0 }, { fillOpacity: fo, duration: Math.min(0.12, d * 0.5), immediateRender: true }, t0 + d * 0.9, { kind: "draw", beat: E && E.beat, name: E && E.name });
      acc += L;
    });
    return t + dur;
  };
  /** A clip for an element. Entrance clips live on E.life, EXIT clips on E.mover, so an exit can
   *  never replace (and thereby cancel) the clip that hides the element before its entrance.
   *  The same holder+shape is reused, so its later tweens do not render their from-state at load. */
  function clipFor(E, shape, forExit) {
    const holder = forExit ? E.mover : E.life;
    E.__clips = E.__clips || {};
    const key = (forExit ? "x:" : "e:") + shape;
    if (E.__clips[key]) return E.__clips[key];
    const b = boxOf(E);
    const id = Loom.uid("clip");
    const defs = Loom.svg("defs", {}, E.outer);
    const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
    const pad = 8;
    let el;
    if (shape === "circle") {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.hypot(b.w, b.h) / 2 + pad;
      el = Loom.svg("circle", { cx, cy, r: R }, cp); el.__R = R;
    } else {
      el = Loom.svg("rect", { x: b.x - pad, y: b.y - pad, width: b.w + 2 * pad, height: b.h + 2 * pad }, cp);
      el.__b = { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad };
    }
    holder.setAttribute("clip-path", `url(#${id})`);
    E.__clips[key] = el;
    return el;
  }
  /** unmask: printed, revealed by hand (definitions, quotes, headlines). dir: ltr | ttb */
  M.unmask = function (E, t, o) {
    o = o || {}; mark(E, t, "unmask");
    const r = clipFor(E, "rect"); const b = r.__b; const dur = o.dur || S().dur("enter") * 1.5;
    Loom.set(node(E), { opacity: 1 }, 0);
    if ((o.dir || "ltr") === "ltr") Loom.tween(r, { attr: { width: 0 } }, { attr: { width: b.w }, duration: dur, ease: E_().move }, t, meta(E, "unmask", o.content));
    else Loom.tween(r, { attr: { height: 0 } }, { attr: { height: b.h }, duration: dur, ease: E_().move }, t, meta(E, "unmask", o.content));
  };
  M.iris = function (E, t, o) {
    o = o || {}; mark(E, t, "iris");
    const c = clipFor(E, "circle");
    Loom.tween(c, { attr: { r: 0 } }, { attr: { r: c.__R }, duration: o.dur || S().dur("enter") * 1.3, ease: E_().enter }, t, meta(E, "iris", o.content));
  };
  M.assemble = function (E, t, o) {
    o = o || {}; mark(E, t, "assemble");
    const r = clipFor(E, "rect"); const b = r.__b; const dur = o.dur || S().dur("enter") * 1.3;
    Loom.tween(r, { attr: { width: 0 } }, { attr: { width: b.w }, duration: dur, ease: E_().move }, t, meta(E, "assemble", o.content));
    Loom.tween(node(E), { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: dur * 1.1, ease: E_().enter }, t + dur * 0.15, meta(E, "assemble"));
  };
  /** count: a number that changed is seen changing. fmt(v) -> string */
  M.count = function (textEl, t, o) {
    o = o || {};
    const from = o.from || 0, to = o.to, dur = o.dur || S().dur("count");
    const fmt = o.fmt || ((v) => String(Math.round(v)));
    const tn = textEl.tagName === "text" ? textEl : textEl.querySelector("text");
    const target = tn.querySelector("tspan") || tn;
    Loom.drive((e) => { target.textContent = fmt(from + (to - from) * e); }, t, dur, "enter", { kind: "count", beat: Loom.ctxBeat && Loom.ctxBeat.id, content: true });
    return t + dur;
  };
  M.typewriter = function (textEl, t, o) {
    o = o || {};
    const tn = textEl.tagName === "text" ? textEl : textEl.querySelector("text");
    const spans = Array.from(tn.querySelectorAll("tspan"));
    const full = spans.map((s) => s.textContent);
    const total = full.reduce((a, s) => a + s.length, 0);
    const dur = o.dur || Math.max(0.4, total / (o.cps || 28));
    Loom.drive((e, raw) => {
      let n = Math.round(total * raw);
      spans.forEach((s, i) => { const k = Math.max(0, Math.min(full[i].length, n)); s.textContent = full[i].slice(0, k); n -= full[i].length; });
    }, t, dur, "linear", { kind: "typewriter", content: true });
    return t + dur;
  };
  /** highlight: a marker sweep behind a text element, fired ON the spoken word. */
  M.highlight = function (textEl, t, o) {
    o = o || {};
    const f = textEl.__fit; if (!f) { Loom.warn("highlight_needs_fit_text", "highlight target is not kit.text"); return; }
    const line = o.line || 0;
    const size = f.size; const lh = f.height / f.lines.length;
    const lw = o.w || f.width;
    const r = Loom.svg("rect", { x: (o.x != null ? o.x : f.x) - 8, y: f.y + line * lh + size * 0.12, width: lw + 16, height: size * 1.02, rx: 6, fill: S().c(o.color || "accent2"), opacity: o.opacity || 0.32 }, textEl.parentNode);
    textEl.parentNode.insertBefore(r, textEl);
    Loom.tween(r, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: o.dur || 0.32, ease: E_().move }, t - 0.06, { kind: "highlight", content: false });
    return r;
  };
  /** emphasis: ONE per scene. a brief scale pulse on the element that matters. */
  M.emphasis = function (E, t, o) {
    o = o || {};
    Loom.tween(node(E), { scale: 1, transformOrigin: "50% 50%" }, { scale: 1 + (o.amount || 0.06), duration: 0.22, ease: E_().enter, yoyo: true, repeat: 1 }, t, meta(E, "emphasis"));
  };

  /* ----------- moves ----------- */
  /** travel: an element moves from where it is to (x, y, scale) in its OWN parent coords. */
  M.travel = function (E, t, o) {
    // only an element travels. The array ctx.crowd returns threw later, inside a frame callback (tween_threw: the
    // callback switched off), and a missing held element threw the whole scene (claude fork b01, b46, 2026-10-07):
    // name the cause at build, skip this move, and let the rest of the scene build
    if (!E || !E.mover) {
      const b = Loom.ctxBeat ? Loom.ctxBeat.id : "?";
      const what = Array.isArray(E) ? `an array of ${E.length} (ctx.crowd returns one element per person: travel each)` : E == null ? "nothing (a held element that is not there?)" : "not an element";
      Loom.error("motion_target", `${b}: m.travel was given ${what}; this move is skipped`, { beat: b });
      return t;
    }
    const cur = E.__pos || { x: 0, y: 0, s: 1 };
    const to = { x: o.x != null ? o.x : cur.x, y: o.y != null ? o.y : cur.y, s: o.scale != null ? o.scale : cur.s };
    // The element's own (0, 0) is the point the x/y maths assumes: screen = x + s * local. GSAP's transformOrigin
    // "0 0" is the corner of the element's BBOX instead, and its svgOrigin adds a hidden "smooth" offset that
    // depends on where the element was when the origin was set, so both moved the travel by an amount no scene
    // can know (phishing-report b19 pushed onto empty board, b21 slid 1187 px, the motif chip lost 227 px; L-166).
    // So the matrix is written directly, from ONE progress value: exact, and the same whatever order frames are
    // seeked in.
    const dur = o.dur || S().dur("move") * 2, ease = E_().editorial;
    const fmt = (v) => (Math.round(v * 1000) / 1000);
    Loom.drive((e) => {
      const x = cur.x + (to.x - cur.x) * e, y = cur.y + (to.y - cur.y) * e, sc = cur.s + (to.s - cur.s) * e;
      E.mover.setAttribute("transform", `translate(${fmt(x)} ${fmt(y)}) scale(${fmt(sc)})`);
    }, t, dur, ease, Object.assign(meta(E, "travel", o.content), { key: "travel:" + (E.__travelKey = E.__travelKey || Loom.uid("tr")) }));
    // the drive key (style guides s15, "M.travel drive key", 2026-10-08): a SECOND travel of one element no longer
    // renders its start state at load (it showed the element at the second leg's start from frame 0)
    // every travel on record for the motion audit (Loom.world.auditMotion, D-190): who moved, when, from where to where
    if (Loom.world) (Loom.world.travels = Loom.world.travels || []).push({ E, t0: t, t1: t + dur, from: cur, to, beat: Loom.ctxBeat ? Loom.ctxBeat.id : E.beat });
    E.__pos = to;
    return t + dur;
  };
  /** value travel: a pointer/marker along a path (the motion IS the reading). */
  M.along = function (E, pathEl, t, o) {
    o = o || {};
    const L = pathEl.getTotalLength();
    const dur = o.dur || S().dur("count");
    const f0 = o.from || 0, f1 = o.to == null ? 1 : o.to;
    Loom.drive((e) => {
      const pt = pathEl.getPointAtLength(L * (f0 + (f1 - f0) * e));
      E.mover.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    }, t, dur, o.ease || "editorial", { kind: "along", beat: E.beat, name: E.name, content: true });
    return t + dur;
  };
  /** period-locked ambient drift (never rAF, never repeat:-1). amplitude in px. */
  M.drift = function (E, t0, t1, o) {
    o = o || {};
    const amp = o.amp || 4, period = o.period || 4;
    const n = Math.max(1, Math.round((t1 - t0) / period));
    const P = (t1 - t0) / n; // period divides the window exactly: seamless
    const ph = o.phase || 0;
    Loom.drive((e, raw) => {
      const a = 2 * Math.PI * (raw * n) + ph;
      E.life.setAttribute("transform", `translate(${(Math.cos(a) * amp * 0.6).toFixed(2)} ${(Math.sin(a) * amp).toFixed(2)})`);
    }, t0, t1 - t0, "linear", { kind: "ambient", beat: E.beat, name: E.name });
    void P;
  };

  /* ----------- exits (lnd-motion-fit s9.8) ----------- */
  M.exit = function (E, t, kind, o) {
    o = o || {};
    const d = o.dur || S().dur("exit");
    const k = kind || E.exit || "recede";
    // An element a beat HOLDS and then sends away is decided at the joins, not here (D-190): held only to be removed at
    // its first words, it was kept out of the join's own exit, so a cover opened on the old picture again and it left
    // 0.35 s later (st-sc-2fa b14: seven held surfaces flashed back after the handoff), or it receded while the same
    // drawing rebuilt from nothing (st-holo-ai b05, b06 tokens). Loom.world.planJoins resolves it (Wd.resolveHeldExits).
    const R = Loom.ctxScene;
    if (R && !o.planned && !E.motif && k !== "none" && k !== "held" && (R.claimedFrom || []).includes(E)) {
      (R.heldExits = R.heldExits || []).push({ E, t, k, o });
      E.exitT = t; E.exitKind = k;
      return;
    }
    E.exitT = t; E.exitKind = k;
    // parts drawn as their own elements (a label's lead line, declared followers) leave with their owner: an
    // explicit exit used to take the tag and leave its line pointing at nothing (D-100)
    for (const F of [E.lead].concat(E.followers || [])) if (F && F !== E && F.exitT == null) M.exit(F, t, k === "none" || k === "held" ? k : "recede", { dur: o.dur });
    const n = node(E);
    const m = { kind: "exit", beat: E.beat, name: E.name };
    if (k === "none" || k === "held") return;
    if (k === "recede") return Loom.tween(n, { opacity: 1, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0, scale: 0.92, duration: d, ease: E_().exit }, t, m);
    // fade: opacity only, in place (an element giving way to a new drawing of the same thing on the same spot, D-190)
    if (k === "fade") return Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: d, ease: E_().exit }, t, m);
    if (k === "displace") return Loom.tween(n, { opacity: 1, x: 0 }, { opacity: 0, x: -160, duration: d * 1.2, ease: E_().exit }, t, m);
    if (k === "advance") return Loom.tween(n, { opacity: 1, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0, scale: 1.25, duration: d * 1.4, ease: E_().exit }, t, m);
    if (k === "collapse") return Loom.tween(n, { scaleY: 1, transformOrigin: "50% 100%" }, { scaleY: 0, duration: d, ease: E_().exit }, t, m);
    if (k === "sink") return Loom.tween(n, { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: d, ease: E_().exit }, t, m);
    if (k === "wipe") {
      const r = clipFor(E, "rect", true); const b = r.__b;
      return Loom.tween(r, { attr: { height: b.h } }, { attr: { height: 0 }, duration: d * 1.2, ease: E_().exit }, t, m);
    }
    if (k === "iris") {
      const c = clipFor(E, "circle", true);
      return Loom.tween(c, { attr: { r: c.__R } }, { attr: { r: 0 }, duration: d * 1.2, ease: E_().exit }, t, m);
    }
    Loom.warn("unknown_exit", k);
    return Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: d, ease: E_().exit }, t, m);
  };
})();
