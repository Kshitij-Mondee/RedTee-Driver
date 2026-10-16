// @design distance_not_direction: a measured line gets a length tag; a direction arrow is offered and struck out, only the length stays
// Treatments: (1) static line + tag + crossed arrow; (2) line draws, tag lands, arrow pops and is struck then fades (chosen: the refusal is the point); (3) split panel length vs direction.
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    const PT = { x: 960, y: 812 }, A = { x: 430, y: 230 };

    // range_line: the kit's range machinery, A to the point; kept alive to the end (b14 pivots on it)
    const tLine = ctx.cue("That gives a distance");
    const rl = ctx.el("range_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const rc = Loom.lesson.range_circles(ctx, rl.inner, {});
    rc.setState("range_line", tLine, { id: "A" });

    // distance tag beside the middle of the line (off the line, on the sky side)
    const mid = { x: (A.x + PT.x) / 2, y: (A.y + PT.y) / 2 };
    const len = Math.hypot(PT.x - A.x, PT.y - A.y);
    const nrm = { x: (PT.y - A.y) / len, y: -(PT.x - A.x) / len }; // up-right of the line
    const tg = { x: mid.x + nrm.x * 120, y: mid.y + nrm.y * 120 };
    const tag = ctx.el("distance_tag", { x: tg.x - 110, y: tg.y - 36, w: 220, h: 72, kind: "label" });
    kit.pill(tag.inner, 0, 0, 220, 72, { fill: "surface", stroke: "accent", r: 36 });
    kit.text(tag.inner, "distance", { role: "label", x: 12, y: 8, w: 196, h: 56, align: "center", valign: "middle", color: "ink", weight: 700 });
    m.pop(tag, tLine + 0.7);

    // dir_arrow: a direction offered at the point, along the line toward the satellite, then struck out
    const tDir = ctx.cue("Not a direction");
    const u = { x: (A.x - PT.x) / len, y: (A.y - PT.y) / len };
    const ox = 700, oy = 560;
    const a0 = { x: PT.x + u.x * 46 - ox, y: PT.y + u.y * 46 - oy };
    const a1 = { x: PT.x + u.x * 250 - ox, y: PT.y + u.y * 250 - oy };
    const da = ctx.el("dir_arrow", { x: ox, y: oy, w: 300, h: 280, kind: "connector" });
    const ink = S("line", { x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y, stroke: ctx.c("ink"), "stroke-width": 16, "stroke-linecap": "round" }, da.inner);
    const hd = S("polygon", { points: "-30,0 30,0 0,-50", fill: ctx.c("ink"), transform: "translate(" + a1.x + " " + a1.y + ") rotate(" + (Math.atan2(u.y, u.x) * 180 / Math.PI + 90) + ")" }, da.inner);
    m.pop(da, tDir);
    // strike across the middle of the arrow, perpendicular, in neg
    const c = { x: (a0.x + a1.x) / 2, y: (a0.y + a1.y) / 2 };
    const pv = { x: -u.y, y: u.x };
    const strike = S("path", { d: "M" + (c.x - pv.x * 70 - u.x * 30) + " " + (c.y - pv.y * 70 - u.y * 30) + " L" + (c.x + pv.x * 70 + u.x * 30) + " " + (c.y + pv.y * 70 + u.y * 30), fill: "none", stroke: ctx.c("neg"), "stroke-width": 14, "stroke-linecap": "round" }, da.inner);
    m.draw(strike, tDir + 0.55, { dur: 0.3 });
    const tOnly = ctx.cue("only a distance");
    da.exit = "recede";
    m.exit(da, tOnly, "recede");
  },
});
