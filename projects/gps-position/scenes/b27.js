// @design height_flattens_well: a curved grid dipping deep near the surface and flattening with height, a marker sliding up it
// Treatments: (1) static well diagram + chip (rejected: the clock must race); (2) well draws, marker climbs, orbit hand spins ahead, chip settles (chosen); (3) numeric counter only (rejected).
Loom.scene("b27", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tWeak = ctx.cue("gravity is weaker");
  var tFast = ctx.cue("makes a clock run fast");
  var tNum = ctx.cue("about 45 microseconds a day");
  var ES = ctx.held("earth");
  var SA = ctx.held("sat");
  var OC = ctx.held("orbit_clock");
  var GC = ctx.held("ground_clock");
  var CS = ctx.held("chip_speed");

  // @form earth_well: side view of Earth's gravity well, deep at the surface, flat high up
  var W = ctx.el("well", { x: 20, y: 150, w: 800, h: 800, kind: "scenery", exit: "recede" });
  var w = Loom.lesson.earth(ctx, W.inner, { form: "well" });
  m.reveal(W, tWeak - 0.4, { dur: 0.8 });
  w.setState("well", tWeak - 0.4, { dur: 1.2 });
  w.marker(tWeak + 0.2, 1, 1.8);

  // @form clock_face: the orbit clock, now racing ahead (a child over the held face, shown at its time)
  var OV = ctx.el("orbit_clock_fast", { x: 0, y: 0, w: 280, h: 280, kind: "instrument", exit: "none", parent: OC.inner });
  var oc = Loom.lesson.clock_face(ctx, OV.inner, { size: 280, finish: "atomic", start: 0 });
  m.reveal(OV, tFast - 0.1, { dur: 0.3 });
  oc.run(tFast, ctx.end);
  oc.setState("ahead", tFast + 0.2, { dur: 1.6 });

  // @form chip_gravity: the gravity effect, the one accent
  var txt = "gravity: about 45 microseconds a day faster";
  var CW = 370, IN = 20;
  var f = kit.fit(txt, { role: "label", w: CW - 2 * IN, h: 150, maxLines: 3, weight: 700 });
  var CH = f.height + 2 * IN;
  var C = ctx.el("chip_gravity", { x: 1510, y: 380, w: CW, h: CH, kind: "token", exit: "recede" });
  kit.pill(C.inner, 0, 0, CW, CH, { fill: "accent", r: 26, shadow: true });
  kit.text(C.inner, txt, { role: "label", x: IN, y: IN, w: CW - 2 * IN, h: CH - 2 * IN, align: "left", valign: "middle", color: "onAccent", weight: 700 });
  m.settle(C, tNum - 0.2, { dy: 24 });

  // the speed chip dims once the gravity chip lands
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var v = (t - tNum) / 0.5; v = v < 0 ? 0 : v > 1 ? 1 : v;
    CS.life.setAttribute("opacity", (1 - 0.55 * v).toFixed(3));
  }, ctx.start, span, "linear");
} });
