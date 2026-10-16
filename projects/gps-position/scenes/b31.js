// @design chain_replayed_fast: the cross-section replays its own images one step at a time, a tag riding the object being named
// Treatments: (1) static diagram with four labels at once (rejected: a slide); (2) four tiles of the steps (rejected: not the lesson's pictures); (3) the diagram replays, a single tag rides each object in turn (chosen).
Loom.scene("b31", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tBroad = ctx.cue("Satellites broadcast where and when");
  var tTravel = ctx.cue("Travel time gives distance");
  var tSph = ctx.cue("Spheres meet");
  var tFourth = ctx.cue("A fourth satellite fixes your phone's clock");
  var pt = [960, 812];
  var pos = { A: [430, 230], B: [1490, 200], C: [980, 110] }, posD = [1720, 430], sk = 0.5;

  // @form earth_arc: the curved ground
  var G = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var earth = Loom.lesson.earth(ctx, G.inner, { form: "arc", showPoint: false });
  earth.setState("arc", ctx.start, { dur: 0.01 });

  // the phone's teal point
  var PP = ctx.el("phone_pt", { x: pt[0] - 30, y: pt[1] - 30, w: 60, h: 60, kind: "scenery", exit: "recede" });
  Loom.svg("circle", { cx: 30, cy: 30, r: 16, fill: ctx.c("accent4") }, PP.inner);
  Loom.svg("circle", { cx: 30, cy: 30, r: 26, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 3, opacity: 0.6 }, PP.inner);

  // @form gps_satellite: A, B, C
  var S = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var sat = {};
  Object.keys(pos).forEach(function (id) {
    var gg = Loom.svg("g", { transform: "translate(" + (pos[id][0] - 180 * sk) + " " + (pos[id][1] - 106 * sk) + ") scale(" + sk + ")" }, S.inner);
    sat[id] = Loom.lesson.gps_satellite(ctx, gg, {});
  });
  Object.keys(sat).forEach(function (id) { sat[id].setState("broadcasting", tBroad, { dur: 1.2 }); });

  // @form signal_pulse: a stamped pulse falls from A to the phone point
  var PU = ctx.el("pulse", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var sig = Loom.lesson.signal(ctx, PU.inner, { from: pos.A, to: pt, ringR: 40 });
  sig.setState("pulse", tTravel, { dur: 1.2 });
  if (sig.travel) sig.travel(tTravel, 1.2, 1);

  // @form readout_timer: the phone readout, timer counting then stopping
  var TM = ctx.el("timer", { x: 1300, y: 520, w: 500, h: 260, kind: "instrument", exit: "recede" });
  var rd = Loom.lesson.phone(ctx, TM.inner, { form: "readout", rows: [], timer: 0, unit: "s", decimals: 2 });
  rd.setState("readout_timer", tTravel, { dur: 0.3 });
  rd.count(tTravel, 1.2, 0.07);
  Loom.tween(TM.inner, { opacity: 1 }, { opacity: 0 }, tSph - 0.2, { dur: 0.3 });
  Loom.tween(PU.inner, { opacity: 1 }, { opacity: 0 }, tTravel + 1.25, { dur: 0.25 });

  // @form range_circles: A, B, C grow and meet
  var C = ctx.el("circles", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, C.inner, { show: [] });
  ["A", "B", "C"].forEach(function (id, i) { rc.setState("grow", tSph + i * 0.28, { id: id, dur: 0.7 }); });

  // @form gps_satellite: D arrives, its circle grows
  var SD = ctx.el("sat_d", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var gd = Loom.svg("g", { transform: "translate(" + (posD[0] - 180 * sk) + " " + (posD[1] - 106 * sk) + ") scale(" + sk + ")" }, SD.inner);
  Loom.lesson.gps_satellite(ctx, gd, {});
  var CD = ctx.el("circle_d", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rd2 = Loom.lesson.range_circles(ctx, CD.inner, { show: [] });
  rd2.setState("grow", tFourth + 0.2, { id: "D", dur: 0.8 });

  // snap: the four meet at one point
  var SN = ctx.el("snap_pt", { x: pt[0] - 80, y: pt[1] - 80, w: 160, h: 160, kind: "scenery", exit: "recede" });
  var ring = Loom.svg("circle", { cx: 80, cy: 80, r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 6, opacity: 0 }, SN.inner);
  var tSnap = tFourth + 1.3;
  rc.setState("snap", tSnap, { dur: 0.5 });
  rd2.setState("snap", tSnap, { dur: 0.5 });
  Loom.drive(function (e) { ring.setAttribute("r", (20 + 50 * e).toFixed(1)); ring.setAttribute("opacity", (e > 0 ? 1 - e : 0).toFixed(3)); }, tSnap + 0.3, 0.7, "move");

  // tags: one at a time, riding its object
  var TG = ctx.el("recap_tags", { x: 0, y: 0, w: 1920, h: 930, kind: "label", exit: "recede" });
  function tag(txt, cx, cy, t, tOut) {
    var W = 280, H = 68;
    var g = Loom.svg("g", { opacity: 0 }, TG.inner);
    kit.pill(g, cx - W / 2, cy - H / 2, W, H, { fill: "accent", r: 34 });
    kit.text(g, txt, { role: "label", x: cx - W / 2, y: cy - H / 2, w: W, h: H, align: "center", valign: "middle", color: "onAccent", weight: 700 });
    Loom.tween(g, { opacity: 0 }, { opacity: 1 }, t, { dur: 0.25 });
    m.settle(g, t, { dur: 0.35 });
    Loom.tween(g, { opacity: 1 }, { opacity: 0 }, tOut, { dur: 0.3 });
  }
  tag("broadcast", pos.A[0], 330, tBroad + 0.1, tTravel - 0.1);
  tag("travel time", 1550, 460, tTravel + 0.1, tSph - 0.1);
  tag("spheres meet", 1180, 700, tSph + 0.1, tFourth - 0.1);
  tag("fourth satellite", 1600, 340, tFourth + 0.1, ctx.end - 0.4);

  m.reveal(G, ctx.start, { dur: 0.3 });
  m.reveal(PP, ctx.start, { dur: 0.3 });
  m.reveal(S, ctx.start + 0.05, { dur: 0.3 });
  m.reveal(C, ctx.start + 0.1, { dur: 0.2 });
  m.reveal(PU, tTravel - 0.05, { dur: 0.15 });
  m.reveal(TM, tTravel - 0.05, { dur: 0.25 });
  m.reveal(SD, tFourth - 0.05, { dur: 0.3 });
  m.reveal(CD, tFourth + 0.1, { dur: 0.2 });
  m.reveal(SN, tFourth + 1.0, { dur: 0.1 });
} });
