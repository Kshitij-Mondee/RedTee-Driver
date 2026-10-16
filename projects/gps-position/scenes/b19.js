// @design two_clocks_one_line: a steady clock high above and a wobbling clock low on the ground, tied by one line each to its owner
// Treatments considered: (1) static side by side with two tags (rejected: the point is steady against drifting, it must move);
// (2) both clocks pop in with equal weight (rejected: the order of the words is satellite first, phone second);
// (3) planet and satellite settle on the camera join, atomic clock ticks evenly on "atomic", quartz arrives below and wobbles off the atomic hand (chosen).
Loom.scene("b19", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tAtom = ctx.cue("Satellites have atomic clocks");
  var tQuartz = ctx.cue("a cheap quartz clock");
  var tOff = ctx.cue("off by an amount it can't know");

  // ---- earth disc, bottom-left (r 400, centre 420,1000) ---------------------------------------------------
  // @form earth_disc: the planet, night side
  var ES = ctx.el("earth", { x: 20, y: 600, w: 800, h: 800, kind: "scenery", exit: "recede" });
  Loom.lesson.earth(ctx, ES.inner, { form: "disc", showPoint: false });
  m.settle(ES, ctx.start + 0.05, { dy: 40 });

  // ---- satellite, top-left --------------------------------------------------------------------------------
  // @form gps_satellite: the satellite that carries the atomic clock
  var SA = ctx.el("sat", { x: 380, y: 120, w: 360, h: 220, kind: "scenery", exit: "recede" });
  Loom.lesson.gps_satellite(ctx, SA.inner, {});
  m.settle(SA, ctx.start + 0.2, { dy: -30 });

  // ---- lines: satellite to its clock, earth to the phone's clock ---------------------------------------------
  var L1 = ctx.el("sat_link", { x: 730, y: 220, w: 480, h: 60, kind: "connector", exit: "recede" });
  var l1 = kit.line(L1.inner, 0, 12, 470, 33, { stroke: "muted", sw: 3 });
  m.draw(l1, tAtom - 0.1, { dur: 0.6 });

  var L2 = ctx.el("ground_link", { x: 790, y: 735, w: 430, h: 150, kind: "connector", exit: "recede" });
  var l2 = kit.line(L2.inner, 10, 141, 417, 8, { stroke: "muted", sw: 3 });
  m.draw(l2, tQuartz - 0.1, { dur: 0.6 });
  // @form earth_point: where the phone stands on the surface
  var PT = ctx.el("ground_point", { x: 780, y: 856, w: 40, h: 40, kind: "icon", exit: "recede" });
  Loom.svg("circle", { cx: 20, cy: 20, r: 17, fill: ctx.c("accent4"), opacity: 0.3 }, PT.inner);
  Loom.svg("circle", { cx: 20, cy: 20, r: 9, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, PT.inner);
  m.pop(PT, tQuartz - 0.2);

  // ---- orbit clock (atomic), top-right: ticks evenly -----------------------------------------------------------
  // @form clock_face: the atomic clock, steady
  var OC = ctx.el("orbit_clock", { x: 1200, y: 120, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var oc = Loom.lesson.clock_face(ctx, OC.inner, { size: 280, finish: "atomic", start: 0 });
  oc.run(tAtom, ctx.end);
  m.settle(OC, tAtom, { dy: 24 });

  // ---- ground clock (quartz), bottom-right: ticks, then shows off -------------------------------------------------
  // @form clock_face: the phone's quartz clock, off
  var GC = ctx.el("ground_clock", { x: 1200, y: 560, w: 280, h: 280, kind: "instrument", exit: "recede" });
  var gc = Loom.lesson.clock_face(ctx, GC.inner, { size: 280, finish: "quartz", start: 0 });
  gc.run(tQuartz, ctx.end);
  gc.setState("off", tOff, { dur: 0.7 });
  m.settle(GC, tQuartz, { dy: 24 });

  // ---- tags ------------------------------------------------------------------------------------------------
  var hx = function (c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; };
  var cInk = hx(ctx.c("ink")), cAcc = hx(ctx.c("accent"));
  var mix = function (a, b, v) { return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * v); }).join(",") + ")"; };
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var TW = 280, TH = 84;
  function tag(name, y, word, icon, tOn, tOffAcc) {
    // @form clock_tag: the word on its clock
    var T = ctx.el(name, { x: 1520, y: y, w: TW, h: TH, kind: "token", exit: "recede" });
    var g = Loom.svg("g", { opacity: 0 }, T.inner);
    kit.pill(g, 0, 0, TW, TH, { fill: "surface", r: 42, shadow: true });
    var ring = Loom.svg("rect", { x: 0, y: 0, width: TW, height: TH, rx: 42, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, g);
    kit.icon(g, icon, { x: 22, y: 22, size: 40, color: "ink" });
    var wd = kit.text(g, word, { role: "label", x: 76, y: 0, w: TW - 76 - 20, h: TH, align: "left", valign: "middle", color: "ink", weight: 700 });
    return { g: g, ring: ring, wd: wd, tOn: tOn, tOff: tOffAcc };
  }
  var tA = tag("tag_atomic", 218, "atomic", "atom", tAtom, tQuartz - 0.1);
  var tQ = tag("tag_quartz", 658, "quartz", "smartphone", tQuartz, ctx.speechEnd + 5);
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    [tA, tQ].forEach(function (tg) {
      var vis = ramp(t, tg.tOn + 0.1, 0.45);
      var lit = ramp(t, tg.tOn, 0.25) * (1 - ramp(t, tg.tOff, 0.3));
      tg.g.setAttribute("opacity", vis.toFixed(3));
      tg.g.setAttribute("transform", "translate(0 " + (14 * (1 - vis)).toFixed(2) + ")");
      tg.ring.setAttribute("opacity", lit.toFixed(3));
      tg.wd.setAttribute("fill", mix(cInk, cAcc, lit));
    });
  }, ctx.start, span, "linear");

  // ---- the empty microsecond chip slot: dashed, no number ------------------------------------------------------
  // @form chip_slot: an empty slot for the error, filled in later beats
  var CH = ctx.el("chip_slot", { x: 1520, y: 774, w: TW, h: 56, kind: "token", exit: "recede" });
  var cr = Loom.svg("rect", { x: 2, y: 2, width: TW - 4, height: 52, rx: 26, fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8" }, CH.inner);
  m.reveal(CH, tOff + 0.2, { dur: 0.5 });
} });
