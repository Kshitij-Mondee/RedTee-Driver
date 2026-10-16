// @design ring_collapses_to_two: a third circle sweeps out and cuts the ring; the ring fades and only its two cut points stay
// Treatments: (1) static: ring + three circles, two dots marked; (2) circle C grows, ring fades into its two cuts (chosen: the narrowing is the motion); (3) split panels before/after.
// Geometry note: in this flat cross-section A, B, C circles all pass through the phone point. The ring (kit) is the thin
// ellipse through A and B's crossings (phone point and a far point above the frame). The kit places the space point at
// (1180, 500), the in-frame place for the second cut; the two gold points are the kit's ground (960,812) and space points.
Loom.scene("b16", {
  build(ctx) {
    const { m } = ctx;
    // held from earlier beats, never redrawn
    ["ground", "phone_pt", "sats", "circle_a", "circle_b"].forEach((n) => ctx.held(n));

    // circles_ab: the ring of A and B, rebuilt (b15's own ring does not carry over)
    const ab = ctx.el("circles_ab", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const hab = Loom.lesson.range_circles(ctx, ab.inner, {});
    hab.setState("ring", ctx.start, { dur: 0.05 });

    // circle_c: C named, its circle grows through the phone point
    const tC = ctx.cue("A third sphere");
    const cc = ctx.el("circle_c", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const hc = Loom.lesson.range_circles(ctx, cc.inner, {});
    m.reveal(cc, tC);
    hc.setState("grow", tC, { id: "C", dur: 1.9 });

    // the ring is cut: it fades, the cuts stay as two gold points
    const tCut = ctx.cue("cuts that circle");
    const pe = ctx.el("pts", { x: 0, y: 0, w: 1920, h: 1080, kind: "node" });
    const hp = Loom.lesson.range_circles(ctx, pe.inner, {});
    m.reveal(pe, tCut);
    hp.setState("two_points", tCut, { dur: 1.0 });
    hab.setState("two_points", tCut, { dur: 1.0 });

    // emphasis: the two points glow together
    const tTwo = ctx.cue("at just two points");
    hp.glowGround(tTwo, true);
    m.pop(pe, tTwo);
  },
});
