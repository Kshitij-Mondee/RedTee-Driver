// @design snake_id: two_candidates_resolve_on_the_surface
Loom.scene("b17", {
  build(ctx) {
    // Treatments considered: paired dots with labels; a static contrast with a ground glow; the selected spatial choice, where the upper candidate recedes and the surface candidate resolves into the held phone point.
    const ground = ctx.held("ground");
    const phonePt = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const circleA = ctx.held("circle_a");
    const circleB = ctx.held("circle_b");
    const circleC = ctx.held("circle_c");
    const pts = ctx.held("pts");

    // Retire the two-point kit element as the first candidate resolves; the held teal phone point remains as the ground location.
    ctx.m.exit(pts, ctx.cue("One is usually far out in space"), "recede");

    // @form space_candidate: a small gold candidate marker in the sky, fading and drifting away.
    const spacePt = ctx.el("space_pt", { x: 0, y: 0, w: 1920, h: 1080, kind: "node", exit: "none" });
    const spaceDot = Loom.svg("circle", { cx: 1180, cy: 495, r: 12, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 2 }, spacePt.inner);
    ctx.m.reveal(spacePt, ctx.cue("One is usually far out in space"));
    ctx.m.travel(spacePt, ctx.cue("One is usually far out in space"), { x: 125, y: -90, scale: 0.8 });
    ctx.m.exit(spacePt, ctx.cue("One is usually far out in space") + 0.42, "recede");

    // @form phone_point_glow: a soft teal halo centered on the held phone point, not a replacement for it.
    const glow = ctx.el("phone_point_glow", { x: 928, y: 780, w: 64, h: 64, kind: "node", exit: "none" });
    const halo = Loom.svg("circle", { cx: 32, cy: 32, r: 24, fill: ctx.c("accent4"), opacity: 0 }, glow.inner);
    const ring = Loom.svg("circle", { cx: 32, cy: 32, r: 17, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 3, opacity: 0 }, glow.inner);
    const groundCue = ctx.cue("The other, on the ground, is you");
    ctx.m.reveal(glow, groundCue);
    Loom.drive(function (p) {
      halo.setAttribute("opacity", String(0.28 + 0.16 * p));
      ring.setAttribute("r", String(17 + 9 * p));
      ring.setAttribute("opacity", String(0.34 * p));
    }, groundCue, 0.55, "linear");

    // A single brief dip in the glow marks the qualification, then it returns to a steady halo.
    const principleCue = ctx.cue("In principle");
    Loom.drive(function (p) {
      const dip = p < 0.5 ? p * 2 : (1 - p) * 2;
      halo.setAttribute("opacity", String(0.44 - 0.27 * dip));
      ring.setAttribute("opacity", String(0.34 - 0.28 * dip));
    }, principleCue, 0.38, "linear");

    // Keep explicit references used above visible to the authored scene's continuity contract.
    void ground; void phonePt; void sats; void circleA; void circleB; void circleC;
  }
});
