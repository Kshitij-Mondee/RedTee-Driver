// @design sphere_range: one radius sweeping around a fixed centre
// Treatments: a static ring, a growing disc, or a pivoting range line that traces its own circle. Chosen: the pivot makes every equal-distance point visible.
Loom.scene("b14", {
  build(ctx) {
    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const rangeLine = ctx.held("range_line");
    const sweepAt = ctx.cue("So the phone sits somewhere on a sphere");
    const settleAt = ctx.cue("around that satellite, at exactly that range.");

    // @form circle_a: satellite-centred range sphere in cross-section
    const circle = ctx.el("circle_a", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    const ranges = Loom.lesson.range_circles(ctx, circle.inner, { satellite: [430, 230], point: [960, 812] });
    ranges.setState("sweep", sweepAt, { dur: 2.3 });
    ranges.setState("circle", settleAt, { dur: 0.55 });
    ctx.m.exit(rangeLine, settleAt, "recede");
  },
});
