// @design sweep_to_sphere: a single measured length pivots about its anchor and traces every point at that distance, a full circle
// Treatments: (1) static composition: circle drawn complete with a tag (rejected: the sweep is the proof that every point fits);
// (2) circle fades in (rejected: no sense of the line being the radius); (3) range line pivots and draws the circle behind it (chosen).
Loom.scene("b14", { build(ctx, props) {
  var held = {};
  ["ground", "phone_pt", "sats", "range_line"].forEach(function (n) { try { held[n] = ctx.held(n); } catch (e) { held[n] = null; } });

  var tSweep = ctx.cue("So the phone sits");
  var tClose = ctx.cue("exactly that range");

  // @form range_circle: the sphere around A drawn flat, a circle in accent that passes through the phone point
  var C = ctx.el("circle_a", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, C.inner, {});
  if (held.range_line) Loom.tween(held.range_line.life, { opacity: 1 }, { opacity: 0 }, tSweep + 0.05, { dur: 0.15 });
  rc.setState("sweep", tSweep, { id: "A", dur: Math.max(2.5, tClose + 0.5 - tSweep) });
} });
