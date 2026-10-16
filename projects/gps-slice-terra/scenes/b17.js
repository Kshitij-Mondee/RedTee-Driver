// @design b17_resolve_candidate_points: one candidate fades into distance while the ground candidate resolves into the phone glow
// Treatments considered: static candidate contrast; point-to-phone merge; camera push into the ground point. Chosen: point-to-phone merge because location, rather than a cut, resolves the ambiguity.
Loom.scene("b17", {
  build(ctx, props) {
    var tSpace = ctx.cue("One is usually far out in space");
    var tGround = ctx.cue("The other, on the ground, is you");
    var tPrinciple = ctx.cue("In principle");

    var ground = ctx.held("ground");
    var phonePt = ctx.held("phone_pt");
    var sats = ctx.held("sats");
    var circleA = ctx.held("circle_a");
    var circleB = ctx.held("circle_b");
    var circleC = ctx.held("circle_c");
    var pts = ctx.held("pts");

    // @form space_pt: distant candidate point fading into the night field
    var spacePt = ctx.el("space_pt", { x: 632, y: 314, w: 72, h: 72, kind: "node", exit: "recede" });
    var sg = Loom.svg("g", {}, spacePt.inner);
    Loom.svg("circle", { cx: 36, cy: 36, r: 29, fill: ctx.c("accent2"), opacity: 0.16 }, sg);
    Loom.svg("circle", { cx: 36, cy: 36, r: 12, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, sg);
    ctx.m.drift(spacePt, ctx.start, tSpace + 0.5, { amp: 10, period: 2.4 });
    ctx.m.exit(spacePt, tSpace + 0.15, "recede");
    ctx.m.exit(pts, tSpace + 0.15, "recede");

    // @form phone_glow: teal confirmation halo around the held phone point
    var phoneGlow = ctx.el("phone_glow", { x: 900, y: 752, w: 120, h: 120, kind: "node", exit: "recede" });
    var pg = Loom.svg("g", { opacity: 0 }, phoneGlow.inner);
    Loom.svg("circle", { cx: 60, cy: 60, r: 47, fill: ctx.c("accent4"), opacity: 0.14 }, pg);
    Loom.svg("circle", { cx: 60, cy: 60, r: 30, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0.92 }, pg);
    Loom.svg("circle", { cx: 60, cy: 60, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, pg);
    Loom.drive(function(e) { pg.setAttribute("opacity", e); }, tGround, ctx.style.dur("move"), "move");
    ctx.m.emphasis(phoneGlow, tGround + 0.3);

    // @form phone_flicker: one restrained hesitation in the confirmation glow
    var flicker = Loom.svg("circle", { cx: 60, cy: 60, r: 39, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 3, opacity: 0 }, pg);
    Loom.drive(function(e) { flicker.setAttribute("opacity", 0.9 * e); }, tPrinciple, 0.09, "linear");
    Loom.drive(function(e) { flicker.setAttribute("opacity", 0.9 * (1 - e)); }, tPrinciple + 0.1, 0.12, "linear");

    // Held station machinery continues unchanged into the clock reveal.
    void ground; void phonePt; void sats; void circleA; void circleB; void circleC;
  }
});
