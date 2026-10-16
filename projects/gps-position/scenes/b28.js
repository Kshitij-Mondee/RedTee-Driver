// @design opposing_pushes_net_gain: two pushes of unequal size on one clock face, the larger wins and the margin is written beside it
// Treatments considered: (1) static comparison of two bars (rejected: a tug must be felt as a push on the clock);
// (2) two chips merging into one (rejected: chips of other beats are not mine to move); (3) two arrows of unequal length push on the orbit clock, the long one wins, a gold lead arc shows it ahead and a net chip settles under it (chosen).
Loom.scene("b28", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tWin = ctx.cue("Gravity wins");
  var tNet = ctx.cue("gains about 38 microseconds a day");

  // ---- held from the clocks station ---------------------------------------------------------------------------
  ctx.held("earth");
  ctx.held("sat");
  var OC = ctx.held("orbit_clock");
  ctx.held("ground_clock");
  ctx.held("well");
  var cs = ctx.held("chip_speed"), cg = ctx.held("chip_gravity");
  // the two chips fold toward the gap in the chip column, then give way to the net chip
  m.travel(cs, tNet - 0.3, { x: 1600, y: 380, scale: 0.4 });
  m.travel(cg, tNet - 0.3, { x: 1600, y: 390, scale: 0.4 });
  m.exit(cs, tNet + 0.1, "recede");
  m.exit(cg, tNet + 0.1, "recede");

  // ---- the orbit clock now reads ahead: a fresh face over the held one, hand clearly ahead of the ground clock
  // @form clock_face: the orbit clock, ahead (a child over the held face, shown at its time)
  var OV = ctx.el("orbit_clock_ahead", { x: 0, y: 0, w: 280, h: 280, kind: "instrument", exit: "none", parent: OC.inner });
  var oc = Loom.lesson.clock_face(ctx, OV.inner, { size: 280, finish: "atomic", start: 0 });
  m.reveal(OV, tWin + 0.3, { dur: 0.3 });
  oc.setState("ahead", tWin + 0.4, { dur: 1.2 });

  // ---- the two pushes on the orbit clock (centre 1340,260 r140) -----------------------------------------------
  // @form push_back: the short push pulling the clock back (speed effect)
  var PB = ctx.el("push_back", { x: 1470, y: 322, w: 130, h: 60, kind: "connector", exit: "recede" });
  var ab = kit.arrow(PB.inner, 120, 30, 10, 30, { stroke: "muted", sw: 10 });
  m.draw(ab, tWin - 0.15, { dur: 0.45 });

  // @form push_ahead: the long push driving the clock ahead (gravity effect)
  var PA = ctx.el("push_ahead", { x: 990, y: 320, w: 240, h: 60, kind: "connector", exit: "recede" });
  var aa = kit.arrow(PA.inner, 10, 30, 230, 30, { stroke: "ink", sw: 18 });
  m.draw(aa, tWin + 0.25, { dur: 0.6 });

  // ---- a gold arc swept forward of 12 o'clock on a ring around the held face ---------------------------------
  // @form lead_arc: how far ahead the orbit clock now reads
  var LA = ctx.el("lead_arc", { x: 1180, y: 100, w: 320, h: 320, kind: "instrument", exit: "recede" });
  var cx = 160, cy = 160, rr = 158;
  var a0 = -Math.PI / 2, a1 = a0 + Math.PI * 0.5;
  var d = "M " + (cx + rr * Math.cos(a0)).toFixed(1) + " " + (cy + rr * Math.sin(a0)).toFixed(1) +
          " A " + rr + " " + rr + " 0 0 1 " + (cx + rr * Math.cos(a1)).toFixed(1) + " " + (cy + rr * Math.sin(a1)).toFixed(1);
  var arc = Loom.svg("path", { d: d, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 10, "stroke-linecap": "round" }, LA.inner);
  m.draw(arc, tNet + 0.5, { dur: 0.8 });

  // ---- the net chip, settling between the two clocks -------------------------------------------------------------
  var word = "net: about 38 microseconds a day faster";
  var W = 370, f = kit.fit(word, { role: "label", w: W - 56, h: 120, maxLines: 2, weight: 700 });
  var H = Math.max(84, f.height + 40);
  // @form chip_net: the net gain, the one accent
  var CN = ctx.el("chip_net", { x: 1510, y: 400, w: W, h: H, kind: "token", exit: "recede" });
  kit.pill(CN.inner, 0, 0, W, H, { fill: "accent", r: H / 2, shadow: true });
  kit.text(CN.inner, word, { role: "label", x: 28, y: 0, w: W - 56, h: H, align: "center", valign: "middle", color: "onAccent", weight: 700, maxLines: 2 });
  m.pop(CN, tNet + 0.1);
} });
