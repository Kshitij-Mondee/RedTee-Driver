// @design timer_stops_on_arrival: a running clock and a travelling pulse share one clock, and both stop at the same instant
// Treatments considered: (1) static readout showing 0.07 beside the finished path (rejected: the count and the trip are one event);
// (2) readout opens, timer counts while the held pulse closes the last stretch, both stop together, stamp docks (chosen);
// (3) a ruler of time ticks under the path (rejected: a second scale competes with the one number).
Loom.scene("b11", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var ground = ctx.held("ground"), pt = ctx.held("phone_pt"), sats = ctx.held("sats");
  var pulse = ctx.held("pulse"), stamp = ctx.held("stamp");

  // the route b09 drew and b10 carried to 0.67 of its length: from just under satellite A to the phone point
  var A = { x: 430, y: 310 }, P = { x: 960, y: 812 };
  var dx = P.x - A.x, dy = P.y - A.y, L = Math.hypot(dx, dy);
  var u = { x: dx / L, y: dy / L }, n = { x: u.y, y: -u.x };
  var p0 = 0.34, p1 = 0.67;                               // the wavefront as b09 drew it; where b10 left it
  var full = { x: dx * (1 - p0), y: dy * (1 - p0) };      // the whole way home from where it was drawn

  var tOpen = ctx.cue("From straight overhead");
  var tGo = ctx.cue("the trip takes");
  var tNum = ctx.cue("about 0.07 seconds");
  var tArr = Math.max(tNum + 0.45, tGo + 1.9);            // pulse arrival = timer stop

  // ---- the held pulse and its stamp finish the trip together with the count ----
  var rest = { x: dx * (1 - p1), y: dy * (1 - p1) };      // what is left of the trip when b10 hands over
  Loom.drive(function (e) {
    var tr = "translate(" + (rest.x * e).toFixed(2) + " " + (rest.y * e).toFixed(2) + ")";
    pulse.life.setAttribute("transform", tr); stamp.life.setAttribute("transform", tr);
  }, tGo, tArr - tGo, "linear");
  m.exit(pulse, tArr, "recede");
  m.exit(stamp, tArr + 0.05, "recede");

  // ---- the arrival: a ring spreads where the pulse is absorbed ----
  // @form absorbed: the pulse spent at the phone point
  var AR = ctx.el("arrival", { x: P.x - 120, y: P.y - 120, w: 240, h: 240, kind: "scenery", exit: "recede" });
  var rg = Loom.svg("circle", { cx: 120, cy: 120, r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 5, opacity: 0 }, AR.inner);
  Loom.drive(function (e) { rg.setAttribute("r", (20 + 90 * e).toFixed(1)); rg.setAttribute("opacity", (3.6 * e * (1 - e)).toFixed(3)); }, tArr, 0.7, "move");

  // ---- the readout, linked to the phone point ----
  var RX = 1300, RY = 560;
  // @form readout_timer: the phone's running timer, about 0.07 s
  var RO = ctx.el("timer", { x: RX, y: RY, w: 500, h: 130, kind: "card", exit: "displace" });
  var ro = Loom.lesson.phone(ctx, RO.inner, { form: "readout", rows: [], timer: true, timerTo: 0.07, unit: "s", decimals: 2,
    fmt: function (v) { return "about " + v.toFixed(2); } });
  var LK = ctx.el("readout_link", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
  var ln = kit.line(LK.inner, P.x + 22, P.y - 16, RX, RY + 64, { stroke: "muted", sw: 4, dash: "10 12" });
  m.reveal(RO, tOpen, { dur: 0.6 });
  m.draw(ln, tOpen + 0.25, { dur: 0.7 });
  ro.setState("readout_timer", tGo, { dur: tArr - tGo, to: 0.07 });

  // ---- a stamp chip leaves the spent pulse and drops into the readout as the timer stops ----
  // @form stamp_chip: the sending time, docked in the readout
  var cc = { x: P.x - n.x * 70, y: P.y - n.y * 70 };
  var SC = ctx.el("stamp_chip", { x: cc.x - 38, y: cc.y - 28, w: 76, h: 56, kind: "token", exit: "displace" });
  kit.pill(SC.inner, 0, 0, 76, 56, { fill: "surface2", r: 28, shadow: true });
  var ck = Loom.lesson.clock_face(ctx, Loom.svg("g", { transform: "translate(14 4)" }, SC.inner), { size: 48, finish: "atomic" });
  ck.run(tArr, ctx.end);
  m.reveal(SC, tArr + 0.05, { dur: 0.25 });
  m.travel(SC, tArr + 0.35, { x: RX + 408 - (cc.x - 38), y: RY + 24 - (cc.y - 28) });
} });
