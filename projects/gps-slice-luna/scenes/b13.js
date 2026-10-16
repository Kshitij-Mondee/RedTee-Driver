// @design one_range_no_bearing: a measured length remains while its tempting direction disappears
// Treatments: (A) a still line with a tag and a struck arrow, strongest because the single geometry carries the distinction;
// (B) a traveling pulse along the range, rejected because the signal trip already happened;
// (C) a range circle immediately, rejected because that is the next beat's inference. Choose the line and negate the bearing.
Loom.scene("b13", {
  build(ctx) {
    const { m } = ctx;
    const arrival = ctx.cue("That gives a distance");
    const reject = ctx.cue("Not a direction");
    const hold = ctx.cue("only a distance");

    // Keep the exact shared ground, phone point and satellites. A is centred near (430,230);
    // the receiver is the held point centred at (960,812).
    const rangeLine = ctx.el("range_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    const rangePart = Loom.lesson.range_circles(ctx, rangeLine.inner, {
      form: "range_line",
      state: "range_line",
      mode: "range_line",
      from: { x: 430, y: 230 }, to: { x: 960, y: 812 },
      a: { x: 430, y: 230 }, b: { x: 960, y: 812 },
      A: { x: 430, y: 230 }, B: { x: 960, y: 812 },
      start: { x: 430, y: 230 }, end: { x: 960, y: 812 },
      source: { x: 430, y: 230 }, target: { x: 960, y: 812 },
      satellite: { x: 430, y: 230 }, sat: { x: 430, y: 230 },
      point: { x: 960, y: 812 }, phone: { x: 960, y: 812 },
      x1: 430, y1: 230, x2: 960, y2: 812,
      label: "distance", tag: "distance", color: "accent2"
    });
    if (rangePart && typeof rangePart.setState === "function") rangePart.setState("range_line", arrival);
    // The kit line is authored from its local origin to A; rotate and scale that stroke so its endpoints land exactly on A and the held receiver.
    if (rangePart && rangePart.g) rangePart.g.setAttribute("transform", "translate(430 230) rotate(19.6) scale(1.614)");
    const tag = ctx.el("range_tag", { x: 590, y: 486, w: 210, h: 64, kind: "label", parent: rangeLine });
    ctx.kit.pill(tag.inner, 0, 0, 210, 64, { fill: "field2" });
    ctx.kit.text(tag.inner, "distance", { role: "label", x: 12, y: 8, w: 186, h: 48, align: "center", valign: "middle", color: "accent2", weight: 700 });
    m.pop(tag, arrival + 0.55, { overshoot: false });

    // The short arrow begins exactly at the receiver and points back along the measured line.
    const dir = ctx.el("dir_arrow", { x: 858, y: 708, w: 106, h: 106, kind: "connector", exit: "none" });
    const arrow = ctx.kit.arrow(dir.inner, 100, 100, 8, 0, { stroke: "muted" });
    const slash = ctx.kit.line(dir.inner, 33, 38, 76, 72, { stroke: "neg", sw: 8 });
    slash.setAttribute("opacity", "0");
    m.pop(dir, reject, { overshoot: false });
    Loom.tl.set(slash, { opacity: 1 }, reject + 0.42);
    Loom.tween(dir.outer, { opacity: 1 }, { opacity: 0, duration: 0.28 }, hold + 0.15, { kind: "fade", beat: null });
  }
});
