// @design shared_offset_swell: every ring grows by the same amount and the one crossing smears into a soft red patch
// Treatments considered: (1) static composition with the patch lit and a pointer (rejected: nothing moves, the shared error is the motion);
// (2) one circle swelling first then the others (rejected: reads as different errors); (3) the diagram settles as it was, a dusk veil
// deepens, all three rings swell by one amount together, the crossing blurs into a patch (chosen).
Loom.scene("b21", { build(ctx, props) {
  var m = ctx.m;
  var tSame = ctx.cue("same for every satellite");
  var tSwell = ctx.cue("Every sphere swells together");
  var tPatch = ctx.cue("they stop meeting at one point");

  // value break: a deep veil behind the diagram, it darkens as the rings swell
  var V = ctx.el("dusk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var veil = Loom.svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("shadow"), opacity: 0 }, V.inner);
  Loom.drive(function (e) { veil.setAttribute("opacity", (0.25 + 0.5 * e).toFixed(3)); }, tSwell, 1.6, "move");
  veil.setAttribute("opacity", 0.3);

  // @form earth_arc: the curved ground with the phone's teal point
  var G = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var earth = Loom.lesson.earth(ctx, G.inner, { form: "arc", showPoint: true });
  earth.setState("arc", ctx.start, { dur: 0.01 });

  // @form gps_satellite: satellites A, B, C
  var S = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var pos = { A: [430, 230], B: [1490, 200], C: [980, 110] }, sk = 0.5;
  Object.keys(pos).forEach(function (id) {
    var gg = Loom.svg("g", { transform: "translate(" + (pos[id][0] - 180 * sk) + " " + (pos[id][1] - 106 * sk) + ") scale(" + sk + ")" }, S.inner);
    Loom.lesson.gps_satellite(ctx, gg, {});
  });

  // @form range_circles: three rings through the phone point, all swelling by one amount
  var C = ctx.el("circles", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, C.inner, { show: ["A", "B", "C"], amount: 80 });
  rc.setState("swell", tSwell, { amount: 80, dur: 1.4 });
  rc.setState("patch", tPatch, { dur: 1.0 });
  var P = ctx.el("patch", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var pn = rc.patch && (rc.patch.nodeType ? rc.patch : rc.patch.g);
  var pw = Loom.svg("g", { transform: "translate(957 902) scale(2.2) translate(-957 -902)" }, P.inner);
  if (pn && pn.nodeType === 1) pw.appendChild(pn);

  m.reveal(V, ctx.start, { dur: 0.3 });
  m.reveal(G, ctx.start, { dur: 0.4 });
  m.reveal(S, ctx.start + 0.1, { dur: 0.4 });
  m.reveal(C, ctx.start + 0.2, { dur: 0.5 });
  m.reveal(P, tPatch - 0.05, { dur: 0.3 });
} });
