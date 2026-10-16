// @design fourth_witness_rises: one more object climbs in and its ring grows to the same swollen size as the others
// Treatments: (1) static fourth sat with ring (rejected: nothing arrives); (2) sat pops in place (rejected: pop); (3) sat rises from the horizon, ring sweeps then swells by the same amount (chosen).
Loom.scene("b23", { build(ctx, props) {
  var m = ctx.m;
  var dusk = ctx.held("dusk"), ground = ctx.held("ground"), sats = ctx.held("sats");
  var circles = ctx.held("circles"), patch = ctx.held("patch");
  var tOne = ctx.cue("One more satellite");
  var tFourth = ctx.cue("A fourth sphere");
  var tNeeds = ctx.cue("than position alone needs");

  // @form gps_satellite: satellite D, accent, rises over the right horizon
  var SD = ctx.el("sat_d", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var sk = 0.5, dx = 1720, dy = 430;
  var rise = Loom.svg("g", {}, SD.inner);
  var gd = Loom.svg("g", { transform: "translate(" + (dx - 180 * sk) + " " + (dy - 106 * sk) + ") scale(" + sk + ")" }, rise);
  var sat = Loom.lesson.gps_satellite(ctx, gd, {});
  sat.setState("named", tFourth, { dur: 0.5 });
  Loom.drive(function (e) {
    var y = 470 * (1 - e);
    rise.setAttribute("transform", "translate(0 " + y.toFixed(2) + ")");
    rise.setAttribute("opacity", Math.min(1, e * 2.5).toFixed(3));
  }, tOne, 1.7, "move");
  rise.setAttribute("transform", "translate(0 470)");
  rise.setAttribute("opacity", 0);

  // @form range_circles: D's circle, the same 80 px swell as A, B, C
  var C = ctx.el("circle_d", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, C.inner, { show: [], amount: 80 });
  rc.setState("sweep", tFourth, { id: "D", dur: 1.6 });
  rc.setState("swell", tNeeds - 0.4, { id: "D", amount: 80, dur: 1.2 });

  m.reveal(SD, tOne - 0.05, { dur: 0.2 });
  m.reveal(C, tFourth - 0.05, { dur: 0.3 });
} });
