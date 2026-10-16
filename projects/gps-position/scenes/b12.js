// @design time_sum_bar: two time chips sit on a time axis, a bar between them is their difference, it shortens into the travel time and stretches into a long line towards the satellite as the speed of light multiplies it
// Treatments considered: (1) static slide with three lit rows (rejected: a list, nothing moves); (2) three rows lighting in turn (rejected: still a list);
// (3) objects that move: arrival chip flies from the phone point, the stamp slides out of the panel, a bar between them shortens, then stretches into a line (chosen).
Loom.scene("b12", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var lerp = function (a, b, v) { return a + (b - a) * v; };
  var hx = function (c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; };
  var mix = function (a, b, v) { return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * v); }).join(",") + ")"; };
  var cInk = hx(ctx.c("ink")), cAcc = hx(ctx.c("accent"));

  var tArr = ctx.cue("takes the arrival time");
  var tSub = ctx.cue("subtracts the sending time");
  var tMul = ctx.cue("multiplies by the speed of light");

  var gH = ctx.held("ground"), ptH = ctx.held("phone_pt"), satH = ctx.held("sats");
  var tmH = ctx.held("timer"), lkH = ctx.held("readout_link"), stE = ctx.held("stamp_chip");
  var SC = 1.5 , cw = 76 * SC, ch = 56 * SC;

  var AY = 372, ARR = { x: 1190, y: AY }, SND = { x: 1640, y: AY };
  var Wt = Math.max(cw, 130), LH = 34, EH = ch + 8 + LH;
  var T1 = tSub + 1.75, TC = T1;

  var Ax = ctx.el("time_axis", { x: 1100, y: AY - 8, w: 640, h: 16, kind: "scenery", exit: "recede" });
  var axL = Loom.svg("line", { x1: 8, y1: 8, x2: 632, y2: 8, stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "4 12", "stroke-linecap": "round", opacity: 0 }, Ax.inner);

  // @form time_chip: a pill with a tiny clock, the phone's arrival time
  var Ar = ctx.el("arrival_chip", { x: 960 - Wt / 2, y: 790 - ch / 2, w: Wt, h: EH, kind: "token", exit: "recede" });
  var arIn = Loom.svg("g", { opacity: 0 }, Ar.inner);
  var arChip = Loom.svg("g", {}, arIn);
  kit.pill(arChip, (Wt - cw) / 2, 0, cw, ch, { fill: "surface2", r: ch / 2, shadow: true });
  var arRing = Loom.svg("rect", { x: (Wt - cw) / 2, y: 0, width: cw, height: ch, rx: ch / 2, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, arChip);
  var arClk = Loom.lesson.clock_face(ctx, Loom.svg("g", { transform: "translate(" + ((Wt - cw) / 2 + 14 * SC) + " " + 4 * SC + ")" }, arChip), { size: 48 * SC, finish: "atomic", start: 40 });
  arClk.run(tArr, ctx.end);
  var arLab = kit.text(arIn, "arrival", { role: "label", x: 0, y: ch + 8, w: Wt, h: LH, align: "center", valign: "middle", color: "ink", weight: 700 });
  arLab.setAttribute("opacity", 0);
  var arLeft = ARR.x - Wt / 2, arTop = AY - ch / 2;
  m.travel(Ar, tArr + 0.12, { x: arLeft - (960 - Wt / 2), y: arTop - (790 - ch / 2), dur: 0.85 });

  m.travel(stE, tSub, { x: SND.x - SC * 38 - stE.x, y: SND.y - SC * 28 - stE.y, scale: SC, dur: 0.85 });
  m.exit(stE, TC + 0.05, "iris");
  m.exit(tmH, tMul + 0.9, "recede");
  m.exit(lkH, tMul + 0.6, "recede");
  var Sr = ctx.el("sending_ring", { x: SND.x - cw / 2 - 8, y: AY - ch / 2 - 8, w: cw + 16, h: ch + 16, kind: "token", exit: "recede" });
  var sRing = Loom.svg("rect", { x: 4, y: 4, width: cw + 8, height: ch + 8, rx: (ch + 8) / 2, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, Sr.inner);
  var Sl = ctx.el("sending_label", { x: SND.x - Wt / 2, y: AY + ch / 2 + 10, w: Wt, h: LH, kind: "text", exit: "recede" });
  var sLab = kit.text(Sl.inner, "sending", { role: "label", x: 0, y: 0, w: Wt, h: LH, align: "center", valign: "middle", color: "ink", weight: 700 });
  sLab.setAttribute("opacity", 0);

  // @form time_bar: the span between two times, the travel time
  var BX0 = ARR.x + Wt / 2 + 14, BX1 = SND.x - Wt / 2 - 14, BW = BX1 - BX0, BH = 48;
  var Br = ctx.el("travel_time_bar", { x: BX0, y: AY - BH / 2, w: BW, h: BH + 60, kind: "value", exit: "recede" });
  var brG = Loom.svg("g", { opacity: 0 }, Br.inner);
  var brR = Loom.svg("rect", { x: 0, y: BH / 2 - 7, width: 0, height: 14, rx: 7, fill: ctx.c("accent") }, brG);
  var brA = Loom.svg("line", { x1: 0, y1: BH / 2 - 14, x2: 0, y2: BH / 2 + 14, stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round" }, brG);
  var brB = Loom.svg("line", { x1: 0, y1: BH / 2 - 14, x2: 0, y2: BH / 2 + 14, stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round" }, brG);
  var brT = Loom.svg("g", { opacity: 0 }, brG);
  kit.text(brT, "0.07 s", { role: "body", x: -110, y: BH + 4, w: 220, h: 52, align: "center", valign: "middle", color: "ink", weight: 700 });
  var BXF = 1330, BYF = 500;
  m.travel(Br, tMul, { x: BXF - 0.5 * (BW - 140) - BX0, y: BYF - AY, dur: 0.5 });

  // @form light_tag: the speed of light as a tag with a beam
  var TGW = 310, TGH = 64;
  var Tg = ctx.el("speed_tag", { x: 1490, y: BYF - TGH / 2, w: TGW, h: TGH, kind: "token", exit: "recede" });
  var tgIn = Loom.svg("g", { opacity: 0 }, Tg.inner);
  kit.pill(tgIn, 0, 0, TGW, TGH, { fill: "surface", r: TGH / 2, shadow: true });
  Loom.svg("rect", { x: 2, y: 2, width: TGW - 4, height: TGH - 4, rx: TGH / 2 - 2, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, tgIn);
  Loom.svg("line", { x1: 22, y1: TGH / 2, x2: 62, y2: TGH / 2, stroke: ctx.c("accent2"), "stroke-width": 5, "stroke-linecap": "round" }, tgIn);
  Loom.svg("circle", { cx: 66, cy: TGH / 2, r: 7, fill: ctx.c("accent2") }, tgIn);
  kit.text(tgIn, "x speed of light", { role: "label", x: 84, y: 0, w: TGW - 84 - 20, h: TGH, align: "left", valign: "middle", color: "ink", weight: 700 });

  // @form distance_line: the long line the multiplication makes, aimed at satellite A
  var P0 = { x: BXF, y: BYF }, A = { x: 430, y: 230 }, dl = Math.hypot(A.x - P0.x, A.y - P0.y), LEN = 520;
  var P1 = { x: P0.x + (A.x - P0.x) / dl * LEN, y: P0.y + (A.y - P0.y) / dl * LEN };
  var LX = Math.min(P0.x, P1.x) - 20, LY = Math.min(P0.y, P1.y) - 20, LW = Math.abs(P0.x - P1.x) + 40, LHh = Math.abs(P0.y - P1.y) + 40;
  var Ln = ctx.el("distance_line", { x: LX, y: LY, w: LW, h: LHh, kind: "connector", exit: "recede" });
  var lp0 = { x: P0.x - LX, y: P0.y - LY }, lp1 = { x: P1.x - LX, y: P1.y - LY };
  var lnG = Loom.svg("g", { opacity: 0 }, Ln.inner);
  var lnSoft = Loom.svg("line", { x1: lp0.x, y1: lp0.y, x2: lp1.x, y2: lp1.y, stroke: ctx.c("accent"), "stroke-width": 14, "stroke-linecap": "round", opacity: 0.18, "stroke-dasharray": LEN, "stroke-dashoffset": LEN }, lnG);
  var lnMain = Loom.svg("line", { x1: lp0.x, y1: lp0.y, x2: lp1.x, y2: lp1.y, stroke: ctx.c("accent"), "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": LEN, "stroke-dashoffset": LEN }, lnG);
  var lnTip = Loom.svg("circle", { cx: lp0.x, cy: lp0.y, r: 8, fill: ctx.c("accent2") }, lnG);

  var span = ctx.end - ctx.start;
  var tAxis = ctx.speechStart + 0.1, tBar = tSub + 0.9, tLine = tMul + 0.7;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var collapse = ramp(t, TC, 0.55), gone = 1 - ramp(t, TC + 0.25, 0.3);
    axL.setAttribute("opacity", (0.6 * ramp(t, tAxis, 0.5) * (1 - ramp(t, TC + 0.2, 0.4))).toFixed(3));
    var pop = (0.4 + 0.6 * ramp(t, tArr, 0.4)) * (1 - 0.6 * collapse);
    arIn.setAttribute("opacity", (ramp(t, tArr, 0.25) * gone).toFixed(3));
    arChip.setAttribute("transform", "translate(" + Wt / 2 + " " + ch / 2 + ") scale(" + pop.toFixed(3) + ") translate(" + (-Wt / 2) + " " + (-ch / 2) + ")");
    arRing.setAttribute("opacity", (ramp(t, tArr, 0.25) * (1 - ramp(t, tSub, 0.3))).toFixed(3));
    arLab.setAttribute("opacity", (ramp(t, tArr + 0.8, 0.3) * (1 - ramp(t, TC, 0.25))).toFixed(3));
    sRing.setAttribute("opacity", (ramp(t, tSub + 0.75, 0.25) * (1 - ramp(t, TC, 0.25))).toFixed(3));
    sLab.setAttribute("opacity", (ramp(t, tSub + 0.8, 0.3) * (1 - ramp(t, TC, 0.25))).toFixed(3));
    var u = ramp(t, tBar, 0.6), L, R;
    if (t < TC) { R = BW; L = BW * (1 - u); } else { var w = BW * (1 - 0.5 * collapse); L = (BW - w) / 2; R = L + w; }
    brG.setAttribute("opacity", (clamp(u * 4, 0, 1)).toFixed(3));
    brR.setAttribute("x", L.toFixed(2)); brR.setAttribute("width", Math.max(0, R - L).toFixed(2));
    brA.setAttribute("x1", L.toFixed(2)); brA.setAttribute("x2", L.toFixed(2)); brB.setAttribute("x1", R.toFixed(2)); brB.setAttribute("x2", R.toFixed(2));
    brT.setAttribute("transform", "translate(" + ((L + R) / 2).toFixed(2) + " 0)");
    brT.setAttribute("opacity", (ramp(t, tBar + 0.5, 0.4)).toFixed(3));
    var settle = ramp(t, tMul + 0.55, 0.4), col = mix(cAcc, cInk, settle);
    brR.setAttribute("fill", col); brA.setAttribute("stroke", col); brB.setAttribute("stroke", col);
    var tp = ramp(t, tMul + 0.2, 0.4), ts = 0.85 + 0.15 * tp;
    tgIn.setAttribute("opacity", tp.toFixed(3));
    tgIn.setAttribute("transform", "translate(" + TGW / 2 + " " + TGH / 2 + ") scale(" + ts.toFixed(3) + ") translate(" + (-TGW / 2) + " " + (-TGH / 2) + ")");
    var lu = ramp(t, tLine, 1.3), off = (LEN * (1 - lu)).toFixed(2);
    lnG.setAttribute("opacity", clamp(lu * 6, 0, 1).toFixed(3));
    lnSoft.setAttribute("stroke-dashoffset", off); lnMain.setAttribute("stroke-dashoffset", off);
    lnTip.setAttribute("cx", lerp(lp0.x, lp1.x, lu).toFixed(2)); lnTip.setAttribute("cy", lerp(lp0.y, lp1.y, lu).toFixed(2));
    lnTip.setAttribute("opacity", (clamp(lu * 6, 0, 1)).toFixed(3));
  }, ctx.start, span, "linear");
} });
