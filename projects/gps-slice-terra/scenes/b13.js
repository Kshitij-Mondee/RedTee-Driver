// @design measured_range_not_direction: a luminous satellite-to-phone span persists while a proposed pointing arrow is crossed away
Loom.scene("b13", {
  build(ctx, props) {
    // Treatments considered: a static measured span, a span with a rejected pointing arrow, or a full circle. Chosen: the span and rejected arrow, because the distinction is the claim.
    const distanceAt = ctx.cue("That gives a distance.");
    const notDirectionAt = ctx.cue("Not a direction");
    const onlyDistanceAt = ctx.cue("only a distance.");
    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");

    // @form range_line: measured line from satellite A to the phone point
    const rangeLine = ctx.el("range_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    const range = Loom.lesson.range_circles(ctx, rangeLine.inner, {
      from: [430, 230], to: [960, 812], tag: "distance"
    });
    range.setState("range_line", distanceAt);
    ctx.m.reveal(rangeLine, distanceAt);
    Loom.treat.label(ctx, "range_tag", {
      x: 540, y: 438, text: "distance", to: [695, 521], tone: "accent", role: "label", t: distanceAt
    });

    // @form dir_arrow: proposed direction from the phone toward satellite A
    const direction = ctx.el("dir_arrow", { x: 640, y: 520, w: 360, h: 320, kind: "connector", exit: "recede" });
    const arrow = ctx.kit.arrow(direction.inner, 320, 292, 34, 22, { stroke: "muted" });
    const strike = ctx.kit.line(direction.inner, 72, 268, 300, 44, { stroke: "neg", sw: 16 });
    ctx.m.draw(arrow, notDirectionAt, { dur: ctx.style.dur("move"), headAt: 0.82 });
    ctx.m.draw(strike, notDirectionAt + 0.32, { dur: ctx.style.dur("move") });
    ctx.m.exit(direction, onlyDistanceAt, "recede");
  }
});
