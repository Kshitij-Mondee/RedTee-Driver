// @design far_point_fades_near_point_glows: the far candidate dims and drifts into the void while the one on the ground warms into a glow, dips once, and holds
// Treatments considered: (1) static pair of dots, one greyed (rejected: no change over time); (2) far dot cut, near dot pops (rejected: abrupt, nothing travels);
// (3) far dot drifts away and dims on a trail of echoes, the ground glow rises over the teal point, dips once on the hesitation, then settles (chosen).
Loom.scene("b17", { build(ctx, props) {
  var m = ctx.m;
  var H = {};
  ["ground", "phone_pt", "sats", "circle_a", "circle_c", "pts"].forEach(function (n) { H[n] = ctx.held(n); });

   var tFar = ctx.cue("One is usually far out in space");
  var tYou = ctx.cue("on the ground, is you");
  var tPrin = ctx.cue("In principle");

  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var easeOut = function (v) { return 1 - (1 - v) * (1 - v); };
  var SX = 943, SY = 250;             // the far candidate point, where the earlier beat left it
  var GX = 960, GY = 812;             // the phone point on the crest

  // the two candidate markers hand over: they leave while identical points (far one drifting, ground one glowing) take their place
  if (H.pts) m.exit(H.pts, ctx.start + 0.06, "recede");

  // ---- space_pt: the far point drifts into the void on a trail of echoes and dims -----------------------------
  // @form candidate_point: a gold disc with a soft halo, the far candidate
  var BX = SX - 80, BY = SY - 100, BW = 640, BH = 280;
  var Sp = ctx.el("space_pt", { x: BX, y: BY, w: BW, h: BH, kind: "token", exit: "recede" });
  var ghosts = [];
  var mkPt = function (parent, op) {
    var g = Loom.svg("g", { opacity: op }, parent);
    Loom.svg("circle", { cx: 0, cy: 0, r: 34, fill: ctx.c("accent2"), opacity: 0.25 }, g);
    Loom.svg("circle", { cx: 0, cy: 0, r: 13, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, g);
    return g;
  };
  [3, 2, 1].forEach(function (k) { ghosts.push({ k: k, g: mkPt(Loom.svg("g", {}, Sp.inner), 0) }); });
  var head = mkPt(Loom.svg("g", {}, Sp.inner), 1);
  var DX = 440, DY = 60;
  var span = ctx.end - ctx.start;
  var place = function (g, u, s, op) {
    g.parentNode.setAttribute("transform", "translate(" + (SX - BX + DX * u).toFixed(2) + " " + (SY - BY + DY * u).toFixed(2) + ") scale(" + s.toFixed(3) + ")");
    g.setAttribute("opacity", op.toFixed(3));
  };
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var u = easeOut(ramp(t, tFar, 3.6));
    var dim = 1 - ramp(t, tFar + 0.35, 3.0);
    var s = 1 - 0.45 * ramp(t, tFar, 3.4);
    place(head, u, s, dim);
    ghosts.forEach(function (gh) {
      var ug = easeOut(ramp(t, tFar + gh.k * 0.16, 3.6));
      var dg = (1 - ramp(t, tFar + 0.35 + gh.k * 0.16, 3.0)) * (ug > 0.02 ? 0.5 / gh.k : 0);
      place(gh.g, ug, 1 - 0.45 * ramp(t, tFar + gh.k * 0.16, 3.4), dg);
    });
  }, ctx.start, span, "linear");

  // ---- ground_glow: the point on the ground, over the phone point, warms to a gold glow ------------------------
  // @form ground_glow: a gold glow with a small teal core, the point that is you
  var GW = 420, GH = 420;
  var Gl = ctx.el("ground_glow", { x: GX - GW / 2, y: GY - GH / 2, w: GW, h: GH, kind: "token", exit: "recede" });
  var cx = GW / 2, cy = GH / 2;
  var defs = Loom.svg("defs", {}, Gl.inner);
  var grad = Loom.svg("radialGradient", { id: "b17glow" }, defs);
  Loom.svg("stop", { offset: 0, "stop-color": ctx.c("accent2"), "stop-opacity": 0.9 }, grad);
  Loom.svg("stop", { offset: 0.45, "stop-color": ctx.c("accent2"), "stop-opacity": 0.4 }, grad);
  Loom.svg("stop", { offset: 1, "stop-color": ctx.c("accent2"), "stop-opacity": 0 }, grad);
  var glowG = Loom.svg("g", { opacity: 0 }, Gl.inner);
  var halo = Loom.svg("circle", { cx: cx, cy: cy, r: 160, fill: "url(#b17glow)" }, glowG);
  var ripple = Loom.svg("circle", { cx: cx, cy: cy, r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 4, opacity: 0 }, Gl.inner);
  // the gold marker of the earlier beat, kept at the phone point until the teal core takes over
  var goldPt = Loom.svg("circle", { cx: cx, cy: cy, r: 13, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3, opacity: 1 }, Gl.inner);
  var coreG = Loom.svg("g", { opacity: 0, transform: "translate(" + cx + " " + cy + ")" }, Gl.inner);
  Loom.svg("circle", { cx: 0, cy: 0, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, coreG);
  var bump = function (t, t0) { return t < t0 ? 0 : t < t0 + 0.28 ? ramp(t, t0, 0.28) : 1 - ramp(t, t0 + 0.28, 0.6); };
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    var rise = ramp(t, tYou, 0.9);
    var breathe = 1 + 0.07 * Math.sin((t - tYou) * 2.6) * rise;
    var dip = bump(t, tPrin);
    var L = rise * breathe * (1 - 0.7 * dip);
    glowG.setAttribute("opacity", Math.min(1, L).toFixed(3));
    halo.setAttribute("r", (160 * (0.8 + 0.2 * rise) * (1 - 0.18 * dip)).toFixed(2));
    var rp = ramp(t, tYou + 0.1, 1.1);
    ripple.setAttribute("r", (20 + 130 * rp).toFixed(2));
    ripple.setAttribute("opacity", (rp > 0 && rp < 1 ? 0.8 * (1 - rp) : 0).toFixed(3));
    var core = ramp(t, tYou, 0.4);
    coreG.setAttribute("opacity", core.toFixed(3));
    goldPt.setAttribute("opacity", (1 - core).toFixed(3));
    coreG.setAttribute("transform", "translate(" + cx + " " + cy + ") scale(" + (1 + 0.18 * rise - 0.14 * dip).toFixed(3) + ")");
  }, ctx.start, span, "linear");
} });
