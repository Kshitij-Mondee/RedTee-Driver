// @design stamped_trip: one stamped pulse leaves the first of three overhead points and starts down the one line to the ground point; held scenery is only restated, never re-entered
Loom.scene("b09", {
  build(ctx, props) {
    var m = ctx.m;
    // Treatments considered: (1) static diagram with a highlighted line, (2) the pulse as a travelling arc with a chip clipped on (chosen: the one trip the next beats measure), (3) rings spreading from A (rejected: says "everyone", not "one trip").
    var PULSE_END = 0.33;      // progress along A -> phone point where this beat ends; b10 continues from here
    var PULSE_LEAVE = 0.05;    // slow creep while the stamp is spoken
    var A = { x: 430, y: 230 }, B = { x: 1490, y: 200 }, C = { x: 980, y: 110 };
    var SAT_S = 300 / 360;     // satellite scale used by the diagram
    var START = [430, 230 + 75]; // A's dish
    var END = [960, 812];       // the phone point

    var tLeave = ctx.cue("A signal leaves");
    var tStamp = ctx.cue("stamped with its sending time");
    var tHeads = ctx.cue("heads for your phone");

    // ---- held scenery (built by b08; fallback only when run without it)
    var gH = ctx.held("ground"), pH = ctx.held("phone_pt"), sH = ctx.held("sats");
    if (!gH) {
      var G = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
      Loom.lesson.earth(ctx, G.inner, { form: "arc" });
    }
    if (!pH) {
      var PP = ctx.el("phone_pt", { x: 900, y: 752, w: 120, h: 120, kind: "token", exit: "none" });
      Loom.svg("circle", { cx: 60, cy: 60, r: 34, fill: ctx.c("accent4"), opacity: 0.25 }, PP.inner);
      Loom.svg("circle", { cx: 60, cy: 60, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, PP.inner);
    }
    var fb = null;
    if (!sH) {
      var S = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
      fb = {};
      [["A", A], ["B", B], ["C", C]].forEach(function (p) {
        var g = Loom.svg("g", { transform: "translate(" + (p[1].x - 180 * SAT_S) + " " + (p[1].y - 110 * SAT_S) + ") scale(" + SAT_S + ")" }, S.inner);
        fb[p[0]] = Loom.lesson.gps_satellite(ctx, g, {});
      });
    }
    var satH = function (k, i) {
      var hh = fb || (sH && sH.handle);
      if (!hh) return null;
      var c = hh[k] || hh[k.toLowerCase()] || (hh.sats && hh.sats[k]) || (hh.parts && hh.parts[k]) || hh[i];
      return c && c.setState ? c : null;
    };
    var sa = satH("A", 0), sb = satH("B", 1), sc = satH("C", 2);
    if (sa) sa.setState("named", tLeave);
    if (sb) sb.setState("dim", tLeave);
    if (sc) sc.setState("dim", tLeave);

    // ---- the pulse (arc only), leaves A at "A signal leaves"
    var P = ctx.el("pulse", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "none" });
    var ph = Loom.lesson.signal(ctx, P.inner, { form: "pulse", from: START, to: END, scale: 1.6, size: 1.6 });
    // ---- the stamp: a second instance on the same path carrying only the clock chip
    var Q = ctx.el("stamp", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "none" });
    var qh = Loom.lesson.signal(ctx, Q.inner, { form: "pulse", from: START, to: END, scale: 1.6, size: 1.6 });

    m.pop(P, tLeave);
    [ph, qh].forEach(function (h) {
      h.seek(0, 0);
      h.travel(tLeave, tHeads - tLeave, PULSE_LEAVE);
      h.travel(tHeads, ctx.speechEnd - tHeads, PULSE_END);
    });
    m.stamp(Q, tStamp);
    qh.setState("pulse_tagged", tStamp, { pin: false });
  }
});
