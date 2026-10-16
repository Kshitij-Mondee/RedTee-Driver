// @design fix_sent_up_slow: a clock is turned back on the ground, rides a rocket up, and in orbit falls into step with the ground clock
// Treatments: (1) static before/after with arrows (rejected: the fix is an event in time); (2) everything lit at once (rejected: crowded);
// (3) one thing lit at a time: rocket, then the crown turn with its tag, then the launch, then the step and the dot home (chosen).
Loom.scene("b30", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tFix = ctx.cue("So the fix goes up with them");
  var tSlow = ctx.cue("each clock is set slightly slow");
  var tOrbit = ctx.cue("so in orbit");
  var tSet = ctx.cue("set slightly slow");
  var tKeep = ctx.cue("it keeps ground time");
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var span = ctx.end - ctx.start;
  // dim wrapper: opacity from a list of [time, value] stops
  function dimmer(parent, stops) {
    var g = Loom.svg("g", { opacity: stops[0][1] }, parent);
    Loom.drive(function (e) {
      var t = ctx.start + e * span, v = stops[0][1];
      for (var i = 1; i < stops.length; i++) { v = v + (stops[i][1] - v) * ramp(t, stops[i][0], 0.4); }
      g.setAttribute("opacity", v.toFixed(3));
    }, ctx.start, span, "linear");
    return g;
  }

  // ---- earth, bottom-left -------------------------------------------------------------------------------
  // @form earth_disc: the planet, launch site on top
  var ES = ctx.el("earth", { x: 20, y: 600, w: 800, h: 800, kind: "scenery", exit: "recede" });
  var eg = dimmer(ES.inner, [[ctx.start, 0.8]]);
  Loom.lesson.earth(ctx, eg, { form: "disc", showPoint: false });
  m.settle(ES, ctx.start + 0.05, { dy: 40 });

  // ---- orbit path (dashed arc) -----------------------------------------------------------------------------
  // @form launch_arc: the climb to orbit
  var AR = ctx.el("launch_arc", { x: 360, y: 80, w: 360, h: 460, kind: "connector", exit: "recede" });
  var arc = Loom.svg("path", { d: "M 200 440 C 160 330, 160 200, 200 60", fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 10" }, AR.inner);
  m.reveal(AR, tOrbit - 0.2, { dur: 0.5 });

  // ---- satellite on its rocket ------------------------------------------------------------------------------
  // @form gps_satellite: the satellite on a small rocket, then in orbit
  var SA = ctx.el("sat", { x: 380, y: 0, w: 360, h: 600, kind: "scenery", exit: "recede" });
  var sg = Loom.svg("g", { transform: "translate(0 0)" }, SA.inner);
  var sat = Loom.lesson.gps_satellite(ctx, sg, { form: "on_rocket" });
  sat.setState("on_rocket", ctx.start);
  sat.fire(tOrbit - 0.2, tOrbit + 1.2);
  sat.release(tOrbit + 1.0, 0.5);
  m.settle(SA, ctx.start + 0.2, { dy: 30 });

  // ---- ground clock, bottom-right: reference, dim until the end ---------------------------------------------
  // @form clock_face: the ground clock, the reference
  var GC = ctx.el("bottom_clock", { x: 1200, y: 560, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var gg = dimmer(GC.inner, [[ctx.start, 0.6], [tKeep - 0.2, 1]]);
  var gc = Loom.lesson.clock_face(ctx, gg, { size: 280, finish: "atomic", start: 0 });
  gc.run(ctx.start, ctx.end);
  m.settle(GC, ctx.start + 0.4, { dy: 24 });

  // ---- orbit clock: crown turned back, then in step ---------------------------------------------------------
  // @form clock_face: the satellite's clock, set slow before launch
  var OC = ctx.el("top_clock", { x: 1200, y: 120, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var og = dimmer(OC.inner, [[ctx.start, 1], [tOrbit - 0.1, 0.55], [tKeep - 0.2, 1]]);
  var oc = Loom.lesson.clock_face(ctx, og, { size: 280, finish: "atomic", start: 0 });
  oc.run(tSlow - 0.3, ctx.end);
  oc.setState("set_slow", tSet, { dur: 0.9 });
  oc.setState("in_step", tKeep + 0.1, { dur: 0.8 });
  m.settle(OC, tSlow - 0.3, { dy: 24 });

  // ---- tag on the crown turn ----------------------------------------------------------------------------------
  // @form slow_tag: set slow before launch
  var TW = 470, TH = 84;
  var T = ctx.el("tag_set_slow", { x: 1105, y: 22, w: TW, h: TH, kind: "token", exit: "recede" });
  var tg = Loom.svg("g", { opacity: 0 }, T.inner);
  kit.pill(tg, 0, 0, TW, TH, { fill: "surface", r: 42, shadow: true });
  var ring = Loom.svg("rect", { x: 0, y: 0, width: TW, height: TH, rx: 42, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, tg);
  kit.text(tg, "set slow before launch", { role: "label", x: 24, y: 0, w: TW - 48, h: TH, align: "center", valign: "middle", color: "ink", weight: 700 });
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var vis = ramp(t, tSet + 0.1, 0.4);
    tg.setAttribute("opacity", vis.toFixed(3));
    tg.setAttribute("transform", "translate(0 " + (14 * (1 - vis)).toFixed(2) + ")");
    ring.setAttribute("opacity", (ramp(t, tSet + 0.1, 0.25) * (1 - ramp(t, tOrbit - 0.2, 0.3))).toFixed(3));
  }, ctx.start, span, "linear");

  // ---- phone inset: dot slides home -----------------------------------------------------------------------------
  // @form phone_mini: the phone's map, the dot drifted, then home
  var PH = ctx.el("phone_inset", { x: 800, y: 380, w: 280, h: 480, kind: "instrument", exit: "recede" });
  var pg = dimmer(PH.inner, [[ctx.start, 1]]);
  var ph = Loom.lesson.phone(ctx, pg, { form: "mini" });
  ph.setState("dot_drift", ctx.start, { dur: 0.01 });
  ph.setState("dot", tKeep + 0.3, { dur: 1.0 });
  m.reveal(PH, tOrbit + 0.6, { dur: 0.5 });
} });
