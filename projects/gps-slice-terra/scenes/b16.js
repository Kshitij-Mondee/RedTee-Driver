// @design third_sphere_narrows_ring: a warm third range circle cuts a cool overlap ring into two points
// Treatments: static circles with two marks; an expanding third circle that narrows the ring; a label-led diagram. Chosen: the expanding circle makes the narrowing visible.
Loom.scene("b16", {
  build(ctx, props) {
    var tThird = ctx.cue("A third sphere cuts that circle");
    var tPoints = ctx.cue("at just two points.");
    var ground = ctx.held("ground");
    var phone = ctx.held("phone_pt");
    var sats = ctx.held("sats");
    var circleA = ctx.held("circle_a");
    var circleB = ctx.held("circle_b");
    // @form satellite_c_named: the third satellite becomes the active reference
    // @form prior_ranges_hold: prior range geometry remains as the reference
    var circlesAB = ctx.el("circles_ab", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });
    // @form circle_c_growth: a third satellite-centred sphere reaches the phone point
    var circleC = ctx.el("circle_c", { x: 0, y: 0, w: 1920, h: 930, kind: "instrument", "data-bleed": true, exit: "recede" });
    circleC.outer.setAttribute("data-bleed", "true");
    var cStroke = Loom.svg("circle", { cx: 980, cy: 110, r: 702, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, circlesAB.inner);
    Loom.drive(function (e) { cStroke.setAttribute("opacity", e); }, tThird, ctx.style.dur("move"), "enter");
    // @form overlap_ring_fades: the old circle of intersections yields to its cuts
    // @form two_candidate_points: only the two intersections remain bright
    var pts = ctx.el("pts", { x: 0, y: 0, w: 1920, h: 930, kind: "node", exit: "recede" });
    var low = Loom.svg("circle", { cx: 960, cy: 812, r: 15, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, pts.inner);
    var high = Loom.svg("circle", { cx: 278, cy: 110, r: 15, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, pts.inner);
    ctx.m.pop(pts, tPoints);
    ctx.m.emphasis(pts, tPoints + 0.18);
  }
});
