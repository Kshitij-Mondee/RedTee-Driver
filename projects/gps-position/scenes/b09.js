// @design one_pulse_leaves_a: one stamped pulse leaves a named source and heads off down a long straight route
// Treatments: (1) static composition, source ringed, pulse already a third of the way with its chip (rejected: the leaving is the point);
// (2) pulse pops at the dish, chip clips on, both set off together and are still moving at the cut (chosen);
// (3) a trail of several pulses (rejected: one trip only is what b10 measures).
Loom.scene("b09", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m, S = Loom.svg;
  var ground = ctx.held("ground"), pt = ctx.held("phone_pt"), sats = ctx.held("sats");
  var A = { x: 430, y: 230 }, B = { x: 1490, y: 200 }, C = { x: 980, y: 110 };
  var SS = 170 / 360;
  var P0 = { x: A.x, y: A.y + 100 * SS };            // dish of A
  var PT = { x: 960, y: 812 - 22 };                  // phone point (just above it)
  var dx = PT.x - P0.x, dy = PT.y - P0.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  var F = 0.34;                                       // about a third of the way

  var tLeave = ctx.cue("A signal leaves");
  var tStamp = ctx.cue("stamped with its sending time");
  var tHead = ctx.cue("heads for your phone");

  // ---- A named, B and C dim (overlays; the held sats stay as b08 drew them) ----
  // @form named_ring: accent edge round satellite A, the other two dimmed
  var N = ctx.el("sat_named", { x: 300, y: 80, w: 1300, h: 240, kind: "scenery", exit: "recede" });
  var nw = S("g", { transform: "translate(-300 -80)" }, N.inner);
  var ring = S("rect", { x: A.x - 100, y: A.y - 66, width: 200, height: 128, rx: 30, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, nw);
  var dims = [B, C].map(function (s) { return S("rect", { x: s.x - 100, y: s.y - 66, width: 200, height: 128, rx: 30, fill: ctx.c("field"), opacity: 0 }, nw); });
  Loom.drive(function (e) {
    ring.setAttribute("opacity", e.toFixed(3));
    dims.forEach(function (d) { d.setAttribute("opacity", (0.5 * e).toFixed(3)); });
  }, ctx.start + 0.1, 0.55, "move");

  // ---- the pulse: its own element, travelled with m.travel so b10 can carry on from where it is ----
  var PU = ctx.el("pulse", { x: P0.x - 60, y: P0.y - 60, w: 120, h: 120, kind: "connector", exit: "recede" });
  var sig = Loom.lesson.signal(ctx, PU.inner, { from: [60, 60], to: [60 + dx, 60 + dy] });
  sig.setState("pulse", tLeave, { dur: 0.9 });
  m.pop(PU, tLeave, {});

  // ---- the stamp: a tiny clock chip clipped beside the pulse ----
  var CW = 96, CH = 72, ox = -60 - CW / 2, oy = 62 - CH / 2;
  var ST = ctx.el("stamp", { x: P0.x + ox, y: P0.y + oy, w: CW, h: CH, kind: "token", exit: "recede" });
  // @form time_stamp_chip: a tiny clock on a chip, no words
  kit.pill(ST.inner, 0, 0, CW, CH, { fill: "surface", r: 24, shadow: true });
  var clk = Loom.lesson.clock_face(ctx, S("g", { transform: "translate(" + (CW / 2 - 28) + " " + (CH / 2 - 28) + ")" }, ST.inner), { size: 56, finish: "atomic" });
  clk.run(tStamp, ctx.end);
  m.stamp(ST, tStamp, {});

  // ---- both set off together at "heads for your phone", still moving at the join ----
  var tGo = tHead - 0.05, dGo = ctx.end - tGo;
  m.travel(PU, tGo, { x: dx * F, y: dy * F, dur: dGo, ease: "enter" });
  m.travel(ST, tGo, { x: dx * F, y: dy * F, dur: dGo, ease: "enter" });
} });
