// @design resolve_two_points: of two candidate points one drifts out of the field and is gone, the other merges into the glowing marker, which hesitates once
// Treatments: (1) static: one point struck, one ringed; (2) space point dims and drifts, ground point sinks into the teal marker, glow flickers (chosen: where each is decides it); (3) split panels.
Loom.scene("b17", {
  build(ctx) {
    const { m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    const PHONE = { x: 960, y: 812 };
    const SPACE = { x: 960, y: 430 };
    const t1 = ctx.cue("One is usually far out in space");
    const t2 = ctx.cue("on the ground, is you");
    const t3 = ctx.cue("In principle");

    // the two-point marker pair from b16 retires; its two points are redrawn in place and resolved
    // @form space_point: the far point fading out of the field

    // space_pt: the point far out, dims and drifts into the field until gone
    const sp = ctx.el("space_pt", { x: SPACE.x - 200, y: SPACE.y - 200, w: 400, h: 400, kind: "node", exit: "none" });
    const sg = S("g", { transform: "translate(200 200)" }, sp.inner);
    const sHalo = S("circle", { cx: 0, cy: 0, r: 30, fill: ctx.c("accent2"), opacity: 0.25 }, sg);
    S("circle", { cx: 0, cy: 0, r: 14, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, sg);
    m.reveal(sp, ctx.start + 0.05);
    Loom.drive((e) => {
      const x = -150 * e, y = -90 * e, s = 1 - 0.55 * e;
      sg.setAttribute("transform", "translate(" + (200 + x) + " " + (200 + y) + ") scale(" + s + ")");
      sg.setAttribute("opacity", 1 - e);
    }, t1, 1.9, "move");
    m.exit(sp, t1 + 1.95, "recede");

    // @form ground_point: the gold ground point sinking into the teal one
    // ground_mark: the other point, gold, at the phone; it sinks into the teal point
    const gm = ctx.el("ground_mark", { x: PHONE.x - 100, y: PHONE.y - 100, w: 200, h: 200, kind: "node", exit: "none" });
    const gg = S("g", { transform: "translate(100 100)" }, gm.inner);
    const gHalo = S("circle", { cx: 0, cy: 0, r: 30, fill: ctx.c("accent2"), opacity: 0.25 }, gg);
    const gDot = S("circle", { cx: 0, cy: -34, r: 14, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, gg);
    m.reveal(gm, ctx.start + 0.05);
    Loom.drive((e) => {
      gDot.setAttribute("cy", -34 * (1 - e));
      gDot.setAttribute("r", 14 * (1 - 0.3 * e));
      gDot.setAttribute("opacity", 1 - e * e);
      gHalo.setAttribute("opacity", 0.25 * (1 - e));
    }, t2, 0.8, "move");
    // the lasting aura round the merged point (stays through the end of the beat)
    const aura = S("circle", { cx: 0, cy: 0, r: 46, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, gg);
    Loom.drive((e) => { aura.setAttribute("opacity", 0.55 * e); }, t2 + 0.5, 0.9, "move");

    // phone_pt: the teal point takes it in and glows (accent4 stays); one hesitation on "In principle"
    const pp = ctx.held("phone_pt");
    const glow = S("circle", { cx: 60, cy: 60, r: 40, fill: ctx.c("accent4"), opacity: 0 }, pp.inner);
    const ring = S("circle", { cx: 60, cy: 60, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, pp.inner);
    Loom.drive((e) => {
      glow.setAttribute("opacity", 0.4 * e);
      glow.setAttribute("r", 28 + 20 * e);
      ring.setAttribute("r", 20 + 36 * e);
      ring.setAttribute("opacity", e < 1 ? 0.9 * (1 - e) : 0);
    }, t2 + 0.5, 0.9, "move");
    // the hesitation: the glow dips and returns once
    Loom.drive((e) => {
      const d = Math.sin(e * Math.PI);
      glow.setAttribute("opacity", 0.4 - 0.3 * d);
      glow.setAttribute("r", 48 - 12 * d);
      aura.setAttribute("opacity", 0.55 - 0.4 * d);
      aura.setAttribute("r", 46 - 8 * d);
    }, t3, 0.7, "linear");
  },
});
