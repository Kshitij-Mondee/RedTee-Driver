/* Hold and transform (D-90, CINEMA_PLAN B8): keep the composition and CHANGE it, instead of popping new things in.
 *
 * The reference films hold one shot 8 to 15 s while it transforms: a roof lifts off a box and the hall inside
 * lights up, a rack heats from one colour to another, layers peel past the camera one by one. These helpers act on
 * elements and shapes a scene has already drawn, each a pure function of time:
 *
 *   Loom.hold.lift(ctx, roofE, t, {dy: -220, dur: 1.4, fade: true})         // a cutaway: the lid rises and goes
 *   Loom.hold.heat(shapes, t, {from: "accent4", to: "neg", dur: 3})        // a slow recolour (fill or stroke)
 *   Loom.hold.peel(ctx, [outerE, middleE, innerE], t, {gap: 2.2, scale: 2.6}) // layers grow past the camera in turn
 *   Loom.hold.breathe(E, t0, t1, {amp: 0.018, period: 5})                  // secondary motion while it holds
 */
// @capability hold_and_transform | motion | Loom.hold.lift, heat, peel, breathe | Hold and transform | keep the shot and change it (a lid lifts off, a colour heats, layers peel past the camera) instead of cutting
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const H = (Loom.hold = {});
  // holds act on the element's "life" group, not its mover: the mover belongs to travel, which writes its matrix
  // directly (L-166), and a hold on the same group would overwrite the travel (or be overwritten by it)
  const node = (E) => (E && (E.life || E.mover)) || E;
  const meta = (kind, name) => ({ kind, beat: Loom.ctxBeat && Loom.ctxBeat.id, name, content: true });

  /** the lid of a box rises (and fades): the inside is revealed without a cut */
  H.lift = function (ctx, E, t, o) {
    o = o || {};
    const dur = o.dur || 1.4;
    Loom.tween(node(E), { y: 0, opacity: 1 }, { y: o.dy == null ? -220 : o.dy, opacity: o.fade === false ? 1 : 0, duration: dur, ease: Loom.ease.editorial, immediateRender: false }, t, meta("lift", E.name));
    return t + dur;
  };

  /** recolour shapes from one token to another over `dur` (heat, decay, ripening, a light coming on) */
  H.heat = function (shapes, t, o) {
    o = o || {};
    const list = Array.isArray(shapes) ? shapes : [shapes];
    const a = S().c(o.from || "accent4"), b = S().c(o.to || "neg"), attr = o.attr || "fill", dur = o.dur || 3;
    const targets = [];
    list.forEach((s) => {
      const n = s && s.inner ? s.inner : s;
      if (!n) return;
      if (n.querySelectorAll) n.querySelectorAll(`[${attr}]`).forEach((x) => { if ((x.getAttribute(attr) || "").toLowerCase() === a.toLowerCase()) targets.push(x); });
      if (n.getAttribute && (n.getAttribute(attr) || "").toLowerCase() === a.toLowerCase()) targets.push(n);
    });
    if (!targets.length) Loom.warn("hold_nothing", `hold.heat: no ${attr} = ${o.from || "accent4"} in the shapes given (draw them in that token first)`);
    Loom.drive((e) => { const c = S().mix(a, b, e); for (const x of targets) x.setAttribute(attr, c); }, t, dur, o.ease || "editorial", meta("heat", o.name || "heat"));
    return t + dur;
  };

  /** nested layers peel away past the camera one at a time (outer first), each revealing the next */
  H.peel = function (ctx, layers, t, o) {
    o = o || {};
    const gap = o.gap || 2.2, dur = o.dur || 1.2, sc = o.scale || 2.6;
    layers.forEach((E, i) => {
      const at = t + i * gap;
      Loom.tween(node(E), { scale: 1, opacity: 1, transformOrigin: "50% 50%" }, { scale: sc, opacity: 0, duration: dur, ease: Loom.ease.exit, immediateRender: false }, at, meta("peel", E.name));
    });
    return t + (layers.length - 1) * gap + dur;
  };

  /** a slow breath while the shot holds (scale about the centre), so a held frame is never frozen */
  H.breathe = function (E, t0, t1, o) {
    o = o || {};
    const amp = o.amp || 0.018, per = o.period || 5;
    const n = node(E);
    Loom.drive((e, p) => { const s = 1 + amp * Math.sin(2 * Math.PI * (p * (t1 - t0)) / per); n.setAttribute("transform", `translate(${(E.w || 0) / 2} ${(E.h || 0) / 2}) scale(${s.toFixed(4)}) translate(${-(E.w || 0) / 2} ${-(E.h || 0) / 2})`); }, t0, Math.max(0.1, t1 - t0), "linear", { kind: "ambient", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: (E.name || "") + ".breathe" });
  };
})();
