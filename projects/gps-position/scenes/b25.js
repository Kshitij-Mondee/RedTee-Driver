// @design clocks_rest_on_top: the eye climbs from the settled ground clock to the satellite's clock, which is held in focus
// Treatments: (1) static both clocks equal (rejected: no question); (2) cut to the satellite (rejected: no climb);
// (3) ground settles, satellite and orbit clock arrive, ground dims, orbit clock held in accent ring (chosen).
Loom.scene("b25", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tHandled = ctx.cue("the phone's clock is handled");
  var tRests = ctx.cue("it all rests on the satellites' clocks");
  var tRight = ctx.cue("Are they right?");
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };

  // @form earth_disc: the planet, night side
  var ES = ctx.el("earth", { x: 20, y: 600, w: 800, h: 800, kind: "scenery", exit: "recede" });
  Loom.lesson.earth(ctx, ES.inner, { form: "disc", showPoint: false });
  m.settle(ES, ctx.start + 0.05, { dy: 40 });

  // @form clock_face: the ground clock, atomic finish, ticking
  var GC = ctx.el("ground_clock", { x: 1200, y: 560, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var gcg = Loom.svg("g", {}, GC.inner);
  var gc = Loom.lesson.clock_face(ctx, gcg, { size: 280, finish: "atomic", start: 0 });
  gc.run(ctx.start, ctx.end);
  m.settle(GC, tHandled, { dy: 24 });
  // dim veil over the ground clock once the question turns upward
  var veil = Loom.svg("circle", { cx: 140, cy: 140, r: 146, fill: ctx.c("shadow"), opacity: 0 }, GC.inner);

  // @form gps_satellite: the satellite that carries the clocks
  var SA = ctx.el("sat", { x: 380, y: 120, w: 360, h: 220, kind: "scenery", exit: "recede" });
  Loom.lesson.gps_satellite(ctx, SA.inner, {});
  m.settle(SA, tRests - 0.1, { dy: -60 });

  var L1 = ctx.el("sat_link", { x: 730, y: 220, w: 480, h: 60, kind: "connector", exit: "recede" });
  var l1 = kit.line(L1.inner, 0, 12, 470, 33, { stroke: "muted", sw: 3 });
  m.draw(l1, tRests + 0.2, { dur: 0.6 });

  // @form clock_face: the orbit clock, atomic, steady
  var OC = ctx.el("orbit_clock", { x: 1200, y: 120, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var oc = Loom.lesson.clock_face(ctx, OC.inner, { size: 280, finish: "atomic", start: 0 });
  oc.run(ctx.start, ctx.end);
  m.settle(OC, tRests + 0.3, { dy: 40 });
  // @form focus_ring: accent ring held on the orbit clock
  var ring = Loom.svg("circle", { cx: 140, cy: 140, r: 152, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, opacity: 0 }, OC.inner);

  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    veil.setAttribute("opacity", (0.6 * ramp(t, tRests + 0.4, 0.8)).toFixed(3));
    ring.setAttribute("opacity", ramp(t, tRight - 0.2, 0.5).toFixed(3));
  }, ctx.start, span, "linear");
} });
