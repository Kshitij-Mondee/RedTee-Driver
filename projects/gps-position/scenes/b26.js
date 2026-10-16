// @design speed_lag: a fast mover whose own clock slips behind a steady reference by a growing angle
// Treatments: (1) static two clocks with a chip (rejected: lag must be seen); (2) both hands race (rejected: ambiguous);
// (3) streaks along the arc, orbit hand trails the ground hand by a growing angle, chip settles (chosen).
Loom.scene("b26", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tFast = ctx.cue("Satellites move fast");
  var tSlow = ctx.cue("a moving clock runs slow");
  var tSeven = ctx.cue("about 7 microseconds a day");

  var ES = ctx.held("earth");
  var SA = ctx.held("sat");
  var OC = ctx.held("orbit_clock");
  var GC = ctx.held("ground_clock");

  // ---- speed streaks along the orbit arc, behind the satellite ------------------------------
  // @form speed_streaks: dashes flowing along the orbit arc, behind the satellite
  var ST = ctx.el("streaks", { x: 40, y: 150, w: 560, h: 200, kind: "scenery", exit: "recede" });
  var streakG = Loom.svg("g", { opacity: 0 }, ST.inner);
  var ys = [78, 98, 118];
  var lines = ys.map(function (y, i) {
    return Loom.svg("line", { x1: 0, y1: y, x2: 330 - i * 50, y2: y, stroke: ctx.c("accent2"), "stroke-width": 6 - i, "stroke-linecap": "round", "stroke-dasharray": "90 50", opacity: 0.9 - i * 0.2 }, streakG);
  });
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var v = Math.max(0, Math.min(1, (t - tFast) / 0.4)) * (1 - Math.max(0, Math.min(1, (t - (tSlow + 0.8)) / 0.8)));
    streakG.setAttribute("opacity", v.toFixed(3));
    lines.forEach(function (l, i) { l.setAttribute("stroke-dashoffset", (-(t - tFast) * (420 + i * 60)).toFixed(1)); });
  }, ctx.start, span, "linear");

  // ---- clocks: ground steady, orbit trails ------------------------------------------------------------------
  // @form clock_face: orbit clock, behind
  var oc = Loom.lesson.clock_face(ctx, OC.inner, { size: 280, finish: "atomic", start: 0 });
  oc.run(ctx.start, ctx.end);
  oc.setState("behind", tSlow, { dur: 3.2 });
  // @form clock_face: ground clock, steady reference
  var gc = Loom.lesson.clock_face(ctx, GC.inner, { size: 280, finish: "atomic", start: 0 });
  gc.run(ctx.start, ctx.end);
  gc.setState("steady", ctx.start, { dur: 0.1 });

  // ---- chip beside orbit clock --------------------------------------------------------------------------------
  // @form chip_speed: the speed cost in microseconds
  var CW = 360, CH = 150;
  var CP = ctx.el("chip_speed", { x: 1510, y: 190, w: CW, h: CH, kind: "token", exit: "recede" });
  kit.pill(CP.inner, 0, 0, CW, CH, { fill: "surface", r: 40, shadow: true });
  Loom.svg("rect", { x: 0, y: 0, width: CW, height: CH, rx: 40, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, CP.inner);
  kit.text(CP.inner, "speed: about 7 microseconds a day slower", { role: "label", x: 20, y: 6, w: CW - 40, h: CH - 12, align: "left", valign: "middle", color: "ink", weight: 700 });
  m.settle(CP, tSeven, { dy: 24 });
} });
