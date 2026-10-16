// @design error_accumulates_as_drift: a steady clock sweeps round a day while a marker slides away from where it belongs, leaving a dashed trail and a tag
// Treatments: (1) static plan with the far dot and tag already placed (rejected: the build up with time is the cost);
// (2) a number counting km (rejected: no digits, the picture carries it); (3) day dial sweeps once while the dot drifts steadily away, trail behind, tag lands on trail (chosen).
Loom.scene("b29", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tSet = ctx.cue("At 300 metres a microsecond");
  var tTen = ctx.cue("that's roughly 10 kilometres of error");
  var tTag = ctx.cue("building up every day");

  var HX = 700, HY = 540, FX = 1780, FY = 160;
  var span = ctx.end - ctx.start;
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var lin = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v; };
  var tGo = tTen, dGo = (ctx.end - 0.15) - tGo;
  var prog = function (t) { return lin(t, tGo, dGo); };
  var posAt = function (t) { var u = prog(t); return [HX + (FX - HX) * u, HY + (FY - HY) * u]; };

  // ---- city -------------------------------------------------------------------------------------------------
  // @form night_city: the night city plan, lights low
  var C = ctx.el("city", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var city = Loom.lesson.night_city(ctx, Loom.svg("g", {}, C.inner), { form: "plan", lights: "up" });
  city.setState("lights_low", ctx.start, { dur: 0.01 });
  m.reveal(C, ctx.start + 0.02, { dur: 0.6 });

  // ---- trail: dashed, from home to the dot ---------------------------------------------------------------------
  // @form drift_trail: a thin dashed trail the dot leaves behind
  var Tr = ctx.el("trail", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: "recede" });
  var homeRing = Loom.svg("circle", { cx: HX, cy: HY, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 5, opacity: 0 }, Tr.inner);
  var trail = Loom.svg("line", { x1: HX, y1: HY, x2: HX, y2: HY, stroke: ctx.c("ink"), "stroke-width": 5, "stroke-dasharray": "16 14", "stroke-linecap": "round", opacity: 0 }, Tr.inner);
  m.reveal(Tr, ctx.start + 0.1, { dur: 0.5 });

  // ---- dot: teal at home, then neg red drifting ------------------------------------------------------------------
  // @form phone_dot: the phone's dot, drifting away in the error colour
  var D = ctx.el("dot", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
  var dg = Loom.svg("g", { transform: "translate(" + HX + " " + HY + ")" }, D.inner);
  Loom.svg("circle", { cx: 0, cy: 0, r: 32, fill: ctx.c("shadow"), opacity: 0.55 }, dg);
  var core = Loom.svg("circle", { cx: 0, cy: 0, r: 20, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 4 }, dg);
  var halo = Loom.svg("circle", { cx: 0, cy: 0, r: 20, fill: "none", stroke: ctx.c("neg"), "stroke-width": 4, opacity: 0 }, dg);
  m.settle(D, ctx.start + 0.1, { dur: 0.6 });

  // ---- day dial: 24 hours, a hand and a swept wedge, no digits -----------------------------------------------------
  // @form day_dial: a 24 hour dial sweeping once round
  var DX = 130, DY = 150, DS = 220, cx = DS / 2, cy = DS / 2, R = 92;
  var Dl = ctx.el("day_dial", { x: DX, y: DY, w: DS, h: DS, kind: "instrument", exit: "recede" });
  Loom.svg("circle", { cx: cx, cy: cy, r: R + 14, fill: ctx.c("shadow"), opacity: 0.85, stroke: ctx.c("accent2"), "stroke-width": 4 }, Dl.inner);
  var wedge = Loom.svg("path", { d: "", fill: ctx.c("accent2"), opacity: 0.35 }, Dl.inner);
  for (var i = 0; i < 24; i++) {
    var a = i / 24 * Math.PI * 2, bg = (i % 6 === 0), r1 = R + 6, r0 = R - (bg ? 18 : 9);
    Loom.svg("line", { x1: cx + Math.sin(a) * r0, y1: cy - Math.cos(a) * r0, x2: cx + Math.sin(a) * r1, y2: cy - Math.cos(a) * r1, stroke: ctx.c("ink"), "stroke-width": bg ? 5 : 3, "stroke-linecap": "round" }, Dl.inner);
  }
  var hand = Loom.svg("line", { x1: cx, y1: cy, x2: cx, y2: cy - R + 8, stroke: ctx.c("ink"), "stroke-width": 6, "stroke-linecap": "round" }, Dl.inner);
  Loom.svg("circle", { cx: cx, cy: cy, r: 9, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, Dl.inner);
  m.pop(Dl, tSet + 0.6, { dur: 0.5 });

  // ---- tag on the trail --------------------------------------------------------------------------------------------
  // @form drift_tag: the label that names the drift
  var label = "roughly 10 km a day";
  var f = kit.fit(label, { role: "label", w: 620, h: 56, maxLines: 1, weight: 700 });
  var TW = Math.ceil(f.width) + 56, TH = 68;
  var uTag = 0.45, PX = HX + (FX - HX) * uTag, PY = HY + (FY - HY) * uTag;
  var TX = PX - TW / 2 + 60, TY = 500, CL = TY - PY;
  var T = ctx.el("drift_tag", { x: TX, y: PY, w: TW, h: CL + TH, kind: "card", exit: "recede" });
  Loom.svg("path", { d: "M" + (PX - TX) + " 0 L" + (PX - TX) + " " + CL, stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, T.inner);
  kit.pill(T.inner, 0, CL, TW, TH, { fill: "shadow", r: 20, stroke: "accent", shadow: true });
  kit.text(T.inner, label, { role: "label", x: 0, y: CL, w: TW, h: TH, align: "center", valign: "middle", color: "ink", weight: 700 });
  m.pop(T, tTag, { dur: 0.5 });

  // ---- drive everything ----------------------------------------------------------------------------------------------
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var p = posAt(t), u = prog(t);
    dg.setAttribute("transform", "translate(" + p[0].toFixed(2) + " " + p[1].toFixed(2) + ")");
    var red = ramp(t, tGo, 0.4);
    core.setAttribute("fill", red > 0.5 ? ctx.c("neg") : ctx.c("accent4"));
    var ph = t < tGo ? 0 : ((t - tGo) / 1.4) % 1;
    halo.setAttribute("r", (20 + 30 * ph).toFixed(2));
    halo.setAttribute("opacity", (t < tGo ? 0 : 0.7 * (1 - ph)).toFixed(3));
    trail.setAttribute("x2", p[0].toFixed(2)); trail.setAttribute("y2", p[1].toFixed(2));
    trail.setAttribute("opacity", (u > 0.005 ? 0.75 : 0).toFixed(3));
    homeRing.setAttribute("opacity", (ramp(t, tTen - 0.1, 0.4) * 0.9).toFixed(3));
    var th = u * Math.PI * 2;
    hand.setAttribute("x2", (cx + Math.sin(th) * (R - 8)).toFixed(2));
    hand.setAttribute("y2", (cy - Math.cos(th) * (R - 8)).toFixed(2));
    var big = th > Math.PI ? 1 : 0, ex = cx + Math.sin(th) * (R - 4), ey = cy - Math.cos(th) * (R - 4);
    wedge.setAttribute("d", th < 0.01 ? "" : "M" + cx + " " + cy + " L" + cx + " " + (cy - R + 4) + " A" + (R - 4) + " " + (R - 4) + " 0 " + big + " 1 " + ex.toFixed(2) + " " + ey.toFixed(2) + " Z");
  }, ctx.start, span, "linear");
} });
