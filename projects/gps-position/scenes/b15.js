// @design two_spheres_meet: a second range circle grows from its satellite until it crosses the first, and a thin tilted ring lights through the two crossings
// Treatments considered: (1) static composition with both circles and the ring present (rejected: the overlap exists only when the second circle arrives);
// (2) second circle pops in whole (rejected: the crossing must be seen to form); (3) circle B grows, crossings brighten, ring draws through them (chosen).
Loom.scene("b15", { build(ctx, props) {
  var m = ctx.m;
  ["ground", "phone_pt", "sats", "circle_a"].forEach(function (n) { try { ctx.held(n); } catch (e) {} });
  var tB = ctx.cue("Add a second satellite");
  var tMeet = ctx.cue("Where the two spheres meet");
  var tTrace = ctx.cue("they trace a circle");

  // @form range_circles: satellite B's sphere grows out from B to pass through the phone point
  var CB = ctx.el("circle_b", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rb = Loom.lesson.range_circles(ctx, CB.inner, { show: [] });
  rb.setState("grow", tB, { id: "B", dur: Math.max(1.6, tMeet - tB) });

  // @form range_circles: the overlap ring through the two crossings of A and B
  var RE = ctx.el("ring", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rr = Loom.lesson.range_circles(ctx, RE.inner, { show: [] });
  rr.setState("ring", tTrace, { dur: Math.max(1.2, ctx.speechEnd - tTrace - 0.4) });
} });
