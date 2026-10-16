// @design tick_unrolls_to_distance: a tiny clock tick beside a dot unrolls into a long ruler laid across the street plan, then a tag lands on it
// Treatments: (1) static plan with the ruler and tag already drawn (rejected: the tick becoming distance is the idea);
// (2) tag first, ruler after (rejected: label never precedes its shape);
// (3) city settles with the dot, a tick chip appears and unrolls into the 360 px ruler, the tag pops on the last phrase (chosen).
Loom.scene("b20", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tHere = ctx.cue("time is distance");
  var tLight = ctx.cue("Light covers about 300 metres");
  var tOff = ctx.cue("So a microsecond off");

  var HX = 700, HY = 540, LEN = 360;   // kit scale: 360 px = 300 m
  var span = ctx.end - ctx.start;
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };

  // ---- city: the night plan, lights low (dim so the tag reads) -------------------------------------------------
  // @form night_city: the night city from above, lights low
  var C = ctx.el("city", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var city = Loom.lesson.night_city(ctx, Loom.svg("g", {}, C.inner), { form: "plan", lights: "up" });
  city.setState("lights_low", ctx.start, { dur: 0.01 });
  m.reveal(C, ctx.start + 0.02, { dur: 0.6 });

  // ---- dot: the home anchor -----------------------------------------------------------------------------------
  // @form phone_dot: the teal dot on a street
  var D = ctx.el("dot", { x: HX - 60, y: HY - 60, w: 120, h: 120, kind: "token", exit: "recede" });
  var halo = Loom.svg("circle", { cx: 60, cy: 60, r: 18, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, D.inner);
  Loom.svg("circle", { cx: 60, cy: 60, r: 30, fill: ctx.c("shadow"), opacity: 0.55 }, D.inner);
  Loom.svg("circle", { cx: 60, cy: 60, r: 18, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 4 }, D.inner);
  m.settle(D, ctx.start + 0.1, { dur: 0.6 });
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var ph = ((t - ctx.start) / 1.6) % 1;
    halo.setAttribute("r", (18 + 36 * ph).toFixed(2));
    halo.setAttribute("opacity", (0.7 * (1 - ph) * ramp(t, ctx.start + 0.5, 0.4)).toFixed(3));
  }, ctx.start, span, "linear");

  // ---- tick chip: a tiny clock tick by the dot ----------------------------------------------------------------
  // @form clock_tick: a small clock chip, the tick of one microsecond
  var K = ctx.el("tick", { x: HX - 60, y: HY - 170, w: 120, h: 100, kind: "token", exit: "recede" });
  var kg = Loom.svg("g", {}, K.inner);
  kit.pill(kg, 10, 0, 100, 100, { fill: "surface", r: 50, stroke: "accent2", shadow: true });
  var clk = Loom.lesson.clock_face(ctx, Loom.svg("g", { transform: "translate(22 12)" }, kg), { size: 76, finish: "atomic" });
  clk.run(tLight, tLight + 2.4);
  var tUnroll = tLight + 1.2;
  m.pop(K, tLight, { dur: 0.45 });
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var u = ramp(t, tUnroll, 0.5);
    // the chip drops onto the street line and shrinks away as the ruler takes over
    kg.setAttribute("transform", "translate(60 50) scale(" + (1 - 0.7 * u).toFixed(3) + ") translate(-60 -50) translate(0 " + (u * 112).toFixed(2) + ")");
    kg.setAttribute("opacity", (1 - ramp(t, tUnroll + 0.25, 0.3)).toFixed(3));
  }, ctx.start, span, "linear");

  // ---- ruler: 360 px = 300 m, unrolls from the dot -------------------------------------------------------------
  // @form ruler_300m: a ruler laid along the street, 360 px long
  var R = ctx.el("ruler", { x: HX - 20, y: HY - 40, w: LEN + 60, h: 80, kind: "instrument", exit: "recede" });
  var ry = 40, x0 = 20;
  var plate = Loom.svg("rect", { x: x0, y: ry - 14, width: 0, height: 28, rx: 6, fill: ctx.c("shadow"), opacity: 0.8 }, R.inner);
  var bar = Loom.svg("rect", { x: x0, y: ry - 7, width: 0, height: 16, rx: 4, fill: ctx.c("accent") }, R.inner);
  var ticks = [];
  for (var i = 0; i <= 6; i++) {
    var tx = x0 + i * LEN / 6, big = (i === 0 || i === 6);
    ticks.push({ x: tx, el: Loom.svg("rect", { x: tx - 2.5, y: ry - (big ? 24 : 16), width: 5, height: big ? 48 : 32, rx: 2, fill: ctx.c("accent"), opacity: 0 }, R.inner) });
  }
  var head = Loom.svg("circle", { cx: x0, cy: ry, r: 10, fill: ctx.c("accent2"), opacity: 0 }, R.inner);
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var u = ramp(t, tUnroll, 1.6);
    var w = LEN * u;
    plate.setAttribute("width", (w + (u > 0 ? 12 : 0)).toFixed(2));
    plate.setAttribute("x", (x0 - 6).toFixed(2));
    bar.setAttribute("width", w.toFixed(2));
    ticks.forEach(function (tk) { tk.el.setAttribute("opacity", (w >= tk.x - x0 - 1 && u > 0 ? 1 : 0).toFixed(0)); });
    head.setAttribute("cx", (x0 + w).toFixed(2));
    head.setAttribute("opacity", (u > 0 && u < 1 ? 1 : 0).toFixed(0));
  }, ctx.start, span, "linear");

  // ---- tag: lands above the ruler, clear of its end ------------------------------------------------------------
  // @form ruler_tag: the label that names the ruler
  var label = "1 microsecond = about 300 m";
  var f = kit.fit(label, { role: "label", w: 600, h: 50, maxLines: 1, weight: 700 });
  var TW = Math.ceil(f.width) + 56, TH = 68;
  var TX = HX + LEN / 2 - TW / 2, TY = HY - 40 - 100;
  var T = ctx.el("ruler_tag", { x: TX, y: TY, w: TW, h: TH + 30, kind: "card", exit: "recede" });
  Loom.svg("path", { d: "M" + (TW / 2) + " " + TH + " L" + (TW / 2) + " " + (TH + 26), stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, T.inner);
  kit.pill(T.inner, 0, 0, TW, TH, { fill: "shadow", r: 20, stroke: "accent", shadow: true });
  kit.text(T.inner, label, { role: "label", x: 0, y: 0, w: TW, h: TH, align: "center", valign: "middle", color: "ink", weight: 700 });
  m.pop(T, tOff, { dur: 0.5 });
} });
