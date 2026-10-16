// @design two_spheres_meet: independent distance circles resolve into their shared ring
Loom.scene("b15", {
  build(ctx) {
    const { m } = ctx;
    // Treatments: a static pair with one crossing signalled; two circles expanding into overlap; a sweeping line around B. Choose the expanding circles, because the motion makes the second range and its shared locus legible.
    // Keep the cross-section and satellite constellation from the prior beat intact.
    ctx.held("ground");
    ctx.held("phone_pt");
    const sats = ctx.held("sats");
    ctx.held("circle_a");
    const addT = ctx.cue("Add a second satellite");
    const meetT = ctx.cue("Where the two spheres meet");
    const traceT = ctx.cue("they trace a circle");
    sats.handle.B.setState("named", addT);

    const circleB = ctx.el("circle_b", { x: 680, y: 0, w: 1240, h: 1010, kind: "connector", exit: "none" });
    // @form second_range_circle: circle B grows from its satellite to the phone point
    const cb = Loom.lesson.range_circles(ctx, circleB.inner, { form: "sweep", from: { x: 810, y: 200 }, to: { x: 280, y: 812 }, color: "line" });
    cb.setState("sweep", addT, { dur: 1.7 });
    cb.setState("circle", addT + 1.7, { dur: 0.25, color: "line" });

    const ringE = ctx.el("ring", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    // @form sphere_intersection_ring: the shared locus is an ellipse through the circle crossings
    const ring = Loom.lesson.range_circles(ctx, ringE.inner, { form: "ring", a: { from: { x: 430, y: 230 }, to: { x: 960, y: 812 } }, b: { from: { x: 1490, y: 200 }, to: { x: 960, y: 812 } }, color: "accent" });
    ring.setState("two_points", meetT);
    ring.setState("ring", traceT, { dur: 1.2, color: "accent" });
  },
});
