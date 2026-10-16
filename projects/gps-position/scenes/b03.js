// @design overhead_clock_tags: rings and satellites fade in around the planet, then three clock tags light one by one as the verbs land
// Treatments considered: (1) static composition with all three tags lit at once (rejected: the verbs must arrive in order);
// (2) one tag popping in per verb (rejected: the set of three is the scaffold, it should exist before it is filled);
// (3) three dim tags appear on "time", then each lights on its verb and settles to ink (chosen).
Loom.scene("b03", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var held = ctx.held("earth"), pointHeld = ctx.held("earth_point");

  // where the held Earth actually sits (box + its travel), so the rings wrap it
  var pos = held.__pos || null, sc = pos ? pos.s : 1;
  var ecx = held.x + (pos ? pos.x : 0) + sc * held.w / 2, ecy = held.y + (pos ? pos.y : 0) + sc * held.h / 2;
  var eR = sc * held.w / 2;
  var k = 0.92 * eR / 220;                       // the rings are drawn for an Earth of radius 220 centred (800, 500)
  var bx = ecx - 800 * k, by = ecy - 500 * k;

  var tA = ctx.cue("The answer is overhead");
  var tTime = ctx.cue("all about time");
  var tKeep = ctx.cue("keeping it");
  var tMeasure = ctx.cue("measuring it");
  var tCorrect = ctx.cue("correcting it");

  // ---- orbits: tilted rings (back halves cut out behind Earth) ------------------------------------------------
  // @form orbit_rings: tilted rings round the planet
  var O = ctx.el("orbits", { x: bx, y: by, w: 1600 * k, h: 1000 * k, kind: "scenery", exit: "recede" });
  var og = Loom.svg("g", { transform: "scale(" + k + ")", opacity: 0.75 }, O.inner);
  var rings = Loom.lesson.orbit_rings(ctx, og, { layer: "all", satSize: 34 });
  rings.setState("filled", ctx.start, { dur: 0.01 });
  var mk = Loom.svg("mask", { id: "b03cut", maskUnits: "userSpaceOnUse", x: -400, y: -400, width: 2400, height: 1800 }, Loom.svg("defs", {}, og));
  Loom.svg("rect", { x: -400, y: -400, width: 2400, height: 1800, fill: ctx.c("ink") }, mk);
  Loom.svg("circle", { cx: 800, cy: 500, r: 224, fill: ctx.c("shadow") }, mk);
  if (rings.back) rings.back.setAttribute("mask", "url(#b03cut)");
  rings.run(ctx.start, ctx.end, 0.1); // slow drift: keeps the satellites' phases apart on the shared rings

  // ---- sats: the satellites ride in their own element so later beats can hold them ----------------------------
  // @form gps_satellite: satellites idle on their rings
  var Sx = ctx.el("sats", { x: bx, y: by, w: 1600 * k, h: 1000 * k, kind: "scenery", exit: "recede" });
  var sg = Loom.svg("g", { transform: "scale(" + k + ")" }, Sx.inner);
  var satNode = rings.sats && rings.sats.nodeType ? rings.sats : null;
  
  if (satNode) sg.appendChild(satNode);

  m.reveal(O, tA, { dur: 0.9 });
  m.reveal(Sx, tA + 0.35, { dur: 0.7 });

  // ---- time_tags: three small clock tags, upper right ---------------------------------------------------------
  var words = ["keep", "measure", "correct"], cues = [tKeep, tMeasure, tCorrect];
  var TW = 270, TH = 84, GAP = 24, TX = 1824 - 3 * TW - 2 * GAP, TY = 90;
  var T = ctx.el("time_tags", { x: TX, y: TY, w: 3 * TW + 2 * GAP, h: TH + 12, kind: "token", exit: "recede" });
  var tags = words.map(function (w, i) {
    var x0 = i * (TW + GAP);
    // @form clock_tag: a small clock with its word
    var g = Loom.svg("g", { opacity: 0 }, T.inner);
    var inner = Loom.svg("g", {}, g);
    kit.pill(inner, x0, 0, TW, TH, { fill: "surface", r: 42, shadow: true });
    var ring = Loom.svg("rect", { x: x0, y: 0, width: TW, height: TH, rx: 42, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, inner);
    var clk = Loom.lesson.clock_face(ctx, Loom.svg("g", { transform: "translate(" + (x0 + 12) + " 10)" }, inner), { size: 64, finish: "atomic", start: i * 70 });
    var tx = x0 + 92, tw = TW - 92 - 20;
    var word = kit.text(inner, w, { role: "label", x: tx, y: 0, w: tw, h: TH, align: "left", valign: "middle", color: "ink", weight: 700 });
    return { g: g, inner: inner, ring: ring, word: word, clk: clk, cx: x0 + TW / 2 };
  });
  var tEnd = ctx.speechEnd - 0.15, relT = [tMeasure, tCorrect, tEnd];
  tags.forEach(function (tg, i) { tg.clk.run(cues[i], relT[i] + 0.3); });
  var hx = function (c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; };
  var cInk = hx(ctx.c("ink")), cAcc = hx(ctx.c("accent"));
  var mix = function (a, b, v) { return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * v); }).join(",") + ")"; };
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    tags.forEach(function (tg, i) {
      var vis = ramp(t, tTime + i * 0.12, 0.45);
      var lit = ramp(t, cues[i], 0.25);
      var acc = lit * (1 - ramp(t, relT[i], 0.3));
      var pop = 1 + 0.08 * Math.sin(Math.PI * ramp(t, cues[i], 0.45)) ;
      var s = (0.92 + 0.08 * vis) * pop;
      tg.g.setAttribute("opacity", (vis * (0.5 + 0.5 * lit)).toFixed(3));
      tg.inner.setAttribute("transform", "translate(" + tg.cx + " " + TH / 2 + ") scale(" + s.toFixed(3) + ") translate(" + (-tg.cx) + " " + (-TH / 2) + ")");
      tg.ring.setAttribute("opacity", acc.toFixed(3));
      tg.word.setAttribute("fill", mix(cInk, cAcc, acc));
    });
  }, ctx.start, span, "linear");
} });
