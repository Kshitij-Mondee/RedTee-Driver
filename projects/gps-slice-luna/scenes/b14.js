// @design range_sweep: one measured radius leaves every point on a sphere possible
Loom.scene("b14", {
  build(ctx) {
    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const rangeLine = ctx.held("range_line");
    // Three treatments: (1) a static circle with a highlighted radius, (2) the range ray sweeping into a circle, (3) three sequential circles. Choose the single sweeping circle: motion itself shows that every point at the measured range fits.
    const E = ctx.el("circle_a", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    const circle = Loom.lesson.range_circles(ctx, E.inner, {
      form: "sweep",
      from: { x: 430, y: 230 },
      to: { x: 960, y: 812 },
      color: "accent"
    });
    circle.setState("sweep", ctx.cue("So the phone sits somewhere on a sphere"), { dur: 2.1 });
    circle.setState("circle", ctx.cue("at exactly that range"), { dur: 0.45, color: "line" });
    if (rangeLine) ctx.m.exit(rangeLine, ctx.cue("at exactly that range"), "recede");
  }
});
