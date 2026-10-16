// @design third_sphere_narrows_the_ring: three treatments: a static ring with two highlighted intersections; a ring dissolving into points; a third circle sweeping across the held ring. Choose the growing third circle and narrowing ring, because motion makes the intersection legible.
Loom.scene("b16", {
  build(ctx) {
    // A named composition element carries the already-held A/B circle drawings without redrawing their kit part.
    const ab = ctx.el("circles_ab", {x:0,y:0,w:1920,h:1080,kind:"diagram",exit:"none"});

    const c = ctx.el("circle_c", {x:0,y:0,w:1920,h:1080,kind:"diagram",exit:"none"});
    const cPart = Loom.lesson.range_circles(ctx, c.inner, {form:"circle", cx:980, cy:110, radius:702});

    const pts = ctx.el("pts", {x:0,y:0,w:1920,h:1080,kind:"diagram",exit:"none"});
    const ptsPart = Loom.lesson.range_circles(ctx, pts.inner, {form:"two_points"});

    const aThird = ctx.cue("A third sphere");
    const heldSats = ctx.held("sats");
    if (heldSats && heldSats.handle && heldSats.handle.C) heldSats.handle.C.setState("named", aThird);
    cPart.setState("sweep", aThird);

    const cuts = ctx.cue("cuts that circle");
    const circleB = ctx.held("circle_b");
    if (circleB) ctx.m.exit(circleB, cuts, "collapse");

    const atPoints = ctx.cue("at just two points");
    ptsPart.setState("two_points", atPoints);
    ctx.m.pop(pts, atPoints);
  }
});
