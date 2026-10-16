// @design third_cut_two_points: a third circle sweeps round, the thin overlap ring dissolves, and only its two cut points remain, both bright
// Treatments considered: (1) static composition of C's circle with two marked points (rejected: the narrowing must be seen);
// (2) the ring shrinks onto the points (rejected: no shrink primitive, a fake morph); (3) C sweeps round on "A third sphere", the ring fades on "cuts that circle", two points pop on "two points" (chosen).
Loom.scene("b16", { build(ctx, props) {
  var m = ctx.m;
  var held = {};
  ["ground", "circle_b"].forEach(function (n) { held[n] = ctx.held(n); });

  var tThird = ctx.cue("A third sphere");
  // circles A and B redrawn without the ring, under circle_b, so the ring can leave while the circles stay
  var AB = ctx.el("circles_ab", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  var rab = Loom.lesson.range_circles(ctx, AB.inner, { show: ["A", "B"] });
  var tCut = ctx.cue("cuts that circle");
  var tTwo = ctx.cue("at just two points");

  // @form range_circles: satellite C's circle sweeps round, through the phone point
  var CE = ctx.el("circle_c", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  var rc = Loom.lesson.range_circles(ctx, CE.inner, { show: [] });
  rc.setState("sweep", tThird, { id: "C", dur: 1.6 });

  // the ring was cut: circle_b (which carried it) leaves as the points arrive
  if (held.circle_b && held.circle_b.life) m.exit(held.circle_b, tCut + 0.2, "fade");

  // @form range_circles: the two candidate points, the phone point and one far out on the ring's line
  var PE = ctx.el("pts", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  var rp = Loom.lesson.range_circles(ctx, PE.inner, { show: [], space: [943, 250] });
  rp.setState("two_points", tTwo, { dur: 0.6 });

} });
