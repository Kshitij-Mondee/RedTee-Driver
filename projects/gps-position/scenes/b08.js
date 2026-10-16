// @design listening_only_cross_section: signals converge on a still point from above; an arrow that tries to leave it stalls, is struck out and fades
// Treatments considered: (1) static composition with a crossed-out up arrow printed at once (rejected: the failure must be seen happening);
// (2) pulses in, arrow pops and shakes off (rejected: reads as a UI icon alert); (3) pulses land, a shaft climbs from the point, stalls short of its head's full run, is struck in neg and fades (chosen).
Loom.scene("b08", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var S = Loom.svg;
  var tListen = ctx.cue("Your phone only listens");
  var tUp = ctx.cue("Nothing goes up");
  var tQuiet = ctx.cue("never learn where you are");

  var PT = { x: 960, y: 812 };
  var SATS = { A: [430, 230], B: [1490, 200], C: [980, 110] };
  var SS = 170 / 360;                       // satellites about 150 px wide

  // @form earth_arc: Earth's curved surface seen from the side, crest under the phone
  var G = ctx.el("ground", { x: 0, y: 800, w: 1920, h: 280, kind: "scenery", exit: "recede" });
  var gw = S("g", { transform: "translate(0 -800)" }, G.inner);
  var earth = Loom.lesson.earth(ctx, gw, { form: "arc", showPoint: 1 });

  // @form phone_point: the phone as one glowing teal point
  var P = ctx.el("phone_pt", { x: PT.x - 60, y: PT.y - 60, w: 120, h: 120, kind: "token", exit: "recede" });
  var pw = S("g", { transform: "translate(" + (-(PT.x - 60)) + " " + (-(PT.y - 60)) + ")" }, P.inner);
  pw.appendChild(earth.point);

  // @form gps_satellite: satellites idle above the ground
  var Sx = ctx.el("sats", { x: 340, y: 50, w: 1240, h: 240, kind: "scenery", exit: "recede" });
  var sw = S("g", { transform: "translate(-340 -50)" }, Sx.inner);
  var sat = {};
  ["A", "B", "C"].forEach(function (id) {
    var c = SATS[id];
    var gg = S("g", { transform: "translate(" + (c[0] - 180 * SS) + " " + (c[1] - 110 * SS) + ") scale(" + SS + ")" }, sw);
    sat[id] = Loom.lesson.gps_satellite(ctx, gg, {});
    sat[id].setState("idle", ctx.start, { dur: 0.01 });
  });
  m.drift(Sx, ctx.start, ctx.end, { amp: 4, period: 3.4 });

  // @form signal_pulse: one pulse travelling from a satellite to the phone point
  var I = ctx.el("incoming", { x: 380, y: 240, w: 1160, h: 590, kind: "connector", exit: "recede" });
  var iw = S("g", { transform: "translate(-380 -240)" }, I.inner);
  var order = ["A", "C", "B"];
  order.forEach(function (id, i) {
    var c = SATS[id];
    var sg = Loom.lesson.signal(ctx, iw, { from: [c[0], c[1] + 100 * SS], to: [PT.x, PT.y - 22] });
    sg.travel(tListen + i * 0.25, 0.85, 1);
    sg.absorb(tListen + 0.85 + i * 0.25, 0.25);
    var sg2 = Loom.lesson.signal(ctx, iw, { from: [c[0], c[1] + 100 * SS], to: [PT.x, PT.y - 22] });
    sg2.travel(tListen + 0.95 + i * 0.2, 0.85, 1);
    sg2.absorb(tListen + 1.8 + i * 0.2, 0.25);
  });
  earth.pulse(tListen + 0.95, 0.6);
  earth.pulse(tListen + 1.8, 0.6);

  // @form refused_arrow: the upward arrow that never completes
  var AX = ctx.el("up_arrow", { x: 900, y: 460, w: 120, h: 340, kind: "icon", exit: "recede" });
  var aw = S("g", { transform: "translate(-900 -460)", opacity: 0 }, AX.inner);
  var y0 = PT.y - 40, yFull = 480, stallK = 0.6;
  var shaft = S("line", { x1: PT.x, y1: y0, x2: PT.x, y2: y0, stroke: ctx.c("accent"), "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": "26 16" }, aw);
  var head = S("path", { d: "M-28 28 L0 0 L28 28", fill: "none", stroke: ctx.c("accent"), "stroke-width": 12, "stroke-linecap": "round", "stroke-linejoin": "round" }, aw);
  var strike = S("line", { x1: PT.x - 62, y1: 0, x2: PT.x + 62, y2: 0, stroke: ctx.c("neg"), "stroke-width": 12, "stroke-linecap": "round", opacity: 0 }, aw);
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : 1 - (1 - v) * (1 - v); };
  var tClimb = tUp, tStall = tUp + 0.65, tStrike = tUp + 0.95, tFade = tUp + 1.3;
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var k = stallK * ramp(t, tClimb, 0.65);
    var shake = t > tStall && t < tStrike ? 5 * Math.sin((t - tStall) * 38) * (1 - (t - tStall) / (tStrike - tStall)) : 0;
    var ty = y0 + (yFull - y0) * k;
    var vis = t < tClimb ? 0 : 1 - ramp(t, tFade, 0.4);
    aw.setAttribute("opacity", vis.toFixed(3));
    shaft.setAttribute("y2", (ty + 20).toFixed(1));
    shaft.setAttribute("x1", (PT.x + shake).toFixed(1)); shaft.setAttribute("x2", (PT.x + shake).toFixed(1));
    head.setAttribute("transform", "translate(" + (PT.x + shake).toFixed(1) + " " + (ty).toFixed(1) + ")");
    head.setAttribute("opacity", (k > 0.02 ? 1 : 0));
    var sk = ramp(t, tStrike, 0.18);
    var sy = ty + (y0 - ty) * 0.45;
    strike.setAttribute("y1", (sy + 40).toFixed(1)); strike.setAttribute("y2", (sy - 40).toFixed(1));
    strike.setAttribute("x1", (PT.x - 62 * sk).toFixed(1)); strike.setAttribute("x2", (PT.x + 62 * sk).toFixed(1));
    strike.setAttribute("opacity", sk > 0.01 ? 1 : 0);
  }, ctx.start, span, "linear");
} });
