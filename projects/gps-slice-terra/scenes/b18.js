// @design b18_clock_assumption_break: a steady quartz clock beside the resolved phone point jumps out of step
// Treatments considered: static clock badge; a zoom into the phone; a ticking clock that breaks beside the point. Chosen: the clock breaks beside the resolved point, keeping the ranging diagram visible while exposing its hidden assumption.
Loom.scene("b18", {
  build(ctx, props) {
    var tAssumed = ctx.cue("Because all of this assumed");
    var tExact = ctx.cue("your phone knows the exact time.");
    var tBreak = ctx.cue("It doesn't.");

    var ground = ctx.held("ground");
    var phonePt = ctx.held("phone_pt");
    var sats = ctx.held("sats");
    var circleA = ctx.held("circle_a");
    var circleB = ctx.held("circle_b");
    var circleC = ctx.held("circle_c");

    // @form phone_clock: quartz clock badge, positioned above-right of the phone point
    var phoneClock = ctx.el("phone_clock", { x: 1018, y: 662, w: 112, h: 112, kind: "instrument", exit: "iris" });
    var clock = Loom.lesson.clock_face(ctx, phoneClock.inner, { size: 112, finish: "quartz", speed: 45 });
    clock.setState("steady", tAssumed, { dur: 0.01 });
    clock.run(tAssumed, tBreak, 1);
    ctx.m.pop(phoneClock, tAssumed);
    ctx.m.emphasis(phoneClock, tExact + 0.25);

    // @form phone_time_flicker: a teal halo over the held phone point, flickering when its time assumption breaks
    var phoneFlicker = ctx.el("phone_time_flicker", { x: 912, y: 764, w: 96, h: 96, kind: "node", exit: "iris" });
    var fg = Loom.svg("g", { opacity: 0 }, phoneFlicker.inner);
    Loom.svg("circle", { cx: 48, cy: 48, r: 34, fill: ctx.c("accent4"), opacity: 0.14 }, fg);
    Loom.svg("circle", { cx: 48, cy: 48, r: 17, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, fg);
    Loom.drive(function (e) { fg.setAttribute("opacity", e); }, tBreak, 0.08, "linear");
    Loom.drive(function (e) { fg.setAttribute("opacity", 1 - e); }, tBreak + 0.11, 0.08, "linear");
    Loom.drive(function (e) { fg.setAttribute("opacity", e); }, tBreak + 0.22, 0.08, "linear");
    Loom.drive(function (e) { fg.setAttribute("opacity", 1 - e); }, tBreak + 0.34, 0.16, "linear");
    clock.setState("off", tBreak, { dur: 0.2, deg: 62 });
    ctx.m.drift(phoneClock, tBreak + 0.18, ctx.speechEnd, { amp: 5, period: 0.32 });

    // The final diagram station clears for the following clocks station.
    ctx.m.exit(ground, ctx.speechEnd, "recede");
    ctx.m.exit(phonePt, ctx.speechEnd, "recede");
    ctx.m.exit(sats, ctx.speechEnd, "recede");
    ctx.m.exit(circleA, ctx.speechEnd, "recede");
    ctx.m.exit(circleB, ctx.speechEnd, "recede");
    ctx.m.exit(circleC, ctx.speechEnd, "recede");
  }
});
