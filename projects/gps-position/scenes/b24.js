// @design one_shared_correction: four unknowns light in turn, then one equal shrink snaps every sphere to one point and the clock hand steps into place
// Treatments: (1) static four tiles + snapped diagram (rejected: the snap is the lesson); (2) circles cut to the final point (rejected: no convergence);
// (3) tiles light as named, all rings shrink by the same amount, flash, veil lifts, clock badge jumps (chosen).
Loom.scene("b24", { build(ctx, props) {
  var m = ctx.m;
  var tEast = ctx.cue("east");
  var tNorth = ctx.cue("north");
  var tHeight = ctx.cue("height");
  var tClock = ctx.cue("and the clock error");
  var tFinds = ctx.cue("The phone finds the one clock error");
  var tShrink = ctx.cue("that makes all four spheres meet");
  var tPos = ctx.cue("and its position comes with it");
  var tSnap = Math.max(tShrink + 2.1, tPos - 0.55);

  // held diagram from the neighbours
  var V = ctx.held("dusk");
  var G = ctx.held("ground");
  var S = ctx.held("sats");
  var SD = ctx.held("sat_d");
  var C0 = ctx.held("circles");
  var CD0 = ctx.held("circle_d");
  var P0 = ctx.held("patch");
  // the old swollen circles and patch hand over to the shrinking set (same look, same place)
  m.exit(C0, ctx.start + 0.05, "recede");
  m.exit(CD0, ctx.start + 0.05, "recede");
  m.exit(P0, ctx.start + 0.05, "recede");
  // the dusk veil lifts as the circles snap
  m.exit(V, tSnap, "recede");

  // @form range_circles: all four rings still swollen by the same error, then they shrink together and snap
  var C = ctx.el("snap_pt", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, C.inner, { show: ["A", "B", "C", "D"], amount: 80 });
  rc.setState("swell", ctx.start, { amount: 80, dur: 0.01 });
  rc.setState("patch", ctx.start, { dur: 0.01 });
  rc.setState("shrink", tShrink, { amount: 80, dur: tSnap - tShrink });
  rc.setState("snap", tSnap, { dur: 0.7 });
  m.reveal(C, ctx.start + 0.02, { dur: 0.05 });

  // gold ping at the phone point after the snap
  var GL = ctx.el("snap_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var ring = Loom.svg("circle", { cx: 960, cy: 812, r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 6, opacity: 0 }, GL.inner);
  var halo = Loom.svg("circle", { cx: 960, cy: 812, r: 30, fill: ctx.c("accent"), opacity: 0 }, GL.inner);
  Loom.drive(function (e) {
    ring.setAttribute("r", (20 + 90 * e).toFixed(1));
    ring.setAttribute("opacity", (1 - e).toFixed(3));
    halo.setAttribute("r", (30 + 26 * Math.sin(Math.PI * e)).toFixed(1));
    halo.setAttribute("opacity", (0.55 * (1 - e) + 0.2).toFixed(3));
  }, tSnap + 0.35, 1.2, "move");
  m.reveal(GL, tSnap + 0.3, { dur: 0.1 });

  // readout panel with four unknown tiles
  var U = ctx.el("unknowns", { x: 1300, y: 520, w: 500, h: 260, kind: "card", exit: "recede" });
  Loom.svg("rect", { x: 0, y: 0, width: 500, height: 260, rx: 26, fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.95 }, U.inner);
  var defs = [
    { id: "east", text: "east", t: tEast, x: 20, y: 20, icon: "east", acc: false },
    { id: "north", text: "north", t: tNorth, x: 255, y: 20, icon: "north", acc: false },
    { id: "height", text: "height", t: tHeight, x: 20, y: 140, icon: "height", acc: false },
    { id: "clock", text: "clock error", t: tClock, x: 255, y: 140, icon: "clock", acc: true }
  ];
  function icon(g, kind, col) {
    var a = { fill: "none", stroke: col, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (kind === "east") { Loom.svg("path", Object.assign({ d: "M-16 0 H16 M6 -10 L16 0 L6 10" }, a), g); }
    else if (kind === "north") { Loom.svg("path", Object.assign({ d: "M0 16 V-16 M-10 -6 L0 -16 L10 -6" }, a), g); }
    else if (kind === "height") { Loom.svg("path", Object.assign({ d: "M0 -18 V18 M-10 -8 L0 -18 L10 -8 M-10 8 L0 18 L10 8" }, a), g); }
    else { Loom.svg("circle", Object.assign({ cx: 0, cy: 0, r: 17 }, a), g); Loom.svg("path", Object.assign({ d: "M0 0 V-10 M0 0 L8 5" }, a), g); }
  }
  defs.forEach(function (d) {
    var tg = Loom.svg("g", { transform: "translate(" + d.x + " " + d.y + ")" }, U.inner);
    // @form unknown_tile: one unknown, icon and word
    Loom.svg("rect", { x: 0, y: 0, width: 225, height: 100, rx: 20, fill: ctx.c("field2"), stroke: ctx.c("muted"), "stroke-width": 2, opacity: 0.9 }, tg);
    var lit = Loom.svg("rect", { x: 0, y: 0, width: 225, height: 100, rx: 20, fill: ctx.c(d.acc ? "accent" : "surface"), stroke: ctx.c(d.acc ? "accent2" : "ink"), "stroke-width": 4, opacity: 0 }, tg);
    var ig = Loom.svg("g", { transform: "translate(36 50) scale(0.8)" }, tg);
    var offCol = ctx.c("muted"), onCol = ctx.c(d.acc ? "onAccent" : "ink");
    icon(ig, d.icon, offCol);
    var kt = { role: "label", x: 62, y: 0, w: 156, h: 100, align: "left", valign: "middle", weight: 700 };
    var txOff = Loom.svg("g", {}, tg), txOn = Loom.svg("g", { opacity: 0 }, tg);
    ctx.kit.text(txOff, d.text, Object.assign({ color: "muted" }, kt));
    ctx.kit.text(txOn, d.text, Object.assign({ color: d.acc ? "onAccent" : "ink" }, kt));
    Loom.drive(function (e) {
      lit.setAttribute("opacity", Math.min(1, e * 1.6).toFixed(3));
      var cc = e > 0.3 ? onCol : offCol;
      txOff.setAttribute("opacity", e > 0.3 ? 0 : 1); txOn.setAttribute("opacity", e > 0.3 ? 1 : 0);
      Array.prototype.forEach.call(ig.childNodes, function (n) { n.setAttribute("stroke", cc); });
      var s = 1 + 0.08 * Math.sin(Math.PI * e);
      tg.setAttribute("transform", "translate(" + (d.x + 112 - 112 * s) + " " + (d.y + 50 - 50 * s) + ") scale(" + s + ")");
    }, d.t, 0.5, "move");
  });
  m.reveal(U, ctx.start + 0.15, { dur: 0.5 });

  // the phone's clock badge: wrong, then it steps into the right time
  var K = ctx.el("phone_clock", { x: 1020, y: 740, w: 160, h: 160, kind: "instrument", exit: "recede" });
  Loom.svg("circle", { cx: 80, cy: 80, r: 78, fill: ctx.c("surface2"), stroke: ctx.c("accent4"), "stroke-width": 4 }, K.inner);
  var kg = Loom.svg("g", { transform: "translate(15 15)" }, K.inner);
  var cf = Loom.lesson.clock_face(ctx, kg, { size: 130, finish: "quartz" });
  cf.setState("off", ctx.start, { deg: 55, dur: 0.01 });
  cf.setState("in_step", tPos, { dur: 0.6 });
  m.reveal(K, tFinds, { dur: 0.5 });
} });
