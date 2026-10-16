// @design ring_then_beam: one satellite runs a ring that draws bright behind it, then a gold beam streaks across the field above the planet
// Treatments: (1) static ring lit + beam drawn still (rejected: both ideas are motion); (2) ring brightens whole, beam fades in (rejected: no travel);
// (3) satellite leads a growing trace, then a beam travels once and fades (chosen).
Loom.scene("b04", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var held = ctx.held("earth"); ctx.held("earth_point"); ctx.held("orbits"); ctx.held("sats");
  var pos = held.__pos || null, sc = pos ? pos.s : 1;
  var ecx = held.x + (pos ? pos.x : 0) + sc * held.w / 2, ecy = held.y + (pos ? pos.y : 0) + sc * held.h / 2;
  var eR = sc * held.w / 2;
  var k = 0.92 * eR / 220;
  var bx = ecx - 800 * k, by = ecy - 500 * k;

  var tOrbit = ctx.cue("satellites in orbit");
  var tLight = ctx.cue("the speed of light");

  // ---- trace: the same ring placement as b03, one ring drawn bright in accent -------------------------------
  // @form orbit_rings: one ring traced bright
  var Tr = ctx.el("trace", { x: bx, y: by, w: 1600 * k, h: 1000 * k, kind: "scenery", exit: "recede" });
  var tg = Loom.svg("g", { transform: "scale(" + k + ")" }, Tr.inner);
  var rr = Loom.lesson.orbit_rings(ctx, tg, { layer: "all", satSize: 34 });
  var mk = Loom.svg("mask", { id: "b04cut", maskUnits: "userSpaceOnUse", x: -400, y: -400, width: 2400, height: 1800 }, Loom.svg("defs", {}, tg));
  Loom.svg("rect", { x: -400, y: -400, width: 2400, height: 1800, fill: ctx.c("ink") }, mk);
  Loom.svg("circle", { cx: 800, cy: 500, r: 224, fill: ctx.c("shadow") }, mk);
  if (rr.back) rr.back.setAttribute("mask", "url(#b04cut)");
  rr.setState("one_ring", ctx.start, { dur: 0.01 });
  rr.setState("trace", tOrbit, { dur: 3.0 });
  rr.run(ctx.start, ctx.end);
  m.reveal(Tr, tOrbit - 0.05, { dur: 0.3 });
  console.log && 0;

  // ---- beam: gold streak across the field above Earth --------------------------------------------------------
  // @form signal_beam: a long gold beam of light
  var B = ctx.el("beam", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var y0 = Math.max(120, ecy - eR - 150);
  var bw = Loom.svg("g", {}, B.inner);
  var sg = Loom.lesson.signal(ctx, bw, { from: [100, y0], to: [1820, y0], tail: 520 });
  sg.setState("beam", tLight, { dur: 0.01 });
  sg.travel(tLight, 0.75, 1);
  m.reveal(B, tLight - 0.02, { dur: 0.15 });
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span, v = (t - (tLight + 0.7)) / 0.35;
    bw.setAttribute("opacity", (v < 0 ? 1 : v > 1 ? 0 : 1 - v * v * (3 - 2 * v)).toFixed(3));
  }, ctx.start, span, "linear");
} });
