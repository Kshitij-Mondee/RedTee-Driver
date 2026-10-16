// @design snake_id: phone_clock_assumption_breaks
Loom.scene("b18", {
  build(ctx) {
    const { m } = ctx;
    // Treatments considered: a static badge with a pulsing point; a clock face that dissolves into the point; a slow, point-centered push with a ticking quartz badge whose hands jump. Choose the third: the shared diagram stays legible while the hidden assumption is made visible, then breaks on the spoken contradiction.
    const ground = ctx.held("ground");
    const phonePt = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const circleA = ctx.held("circle_a");
    const circleB = ctx.held("circle_b");
    const circleC = ctx.held("circle_c");

    const assumed = ctx.cue("Because all of this assumed");
    const known = ctx.cue("your phone knows the exact time");
    const doesnt = ctx.cue("It doesn't.");

    // @form diagram_push: enlarge all held diagram layers around the phone point, a continuous camera-like push.
    const pushScale = 1.1;
    const pushX = 960 * (1 - pushScale);
    const pushY = 812 * (1 - pushScale);
    [ground, sats, circleA, circleB, circleC].forEach(E => m.travel(E, assumed, { x: pushX, y: pushY, scale: pushScale, dur: 2.45 }));
    m.travel(phonePt, assumed, { x: 960 + (944 - 960) * pushScale, y: 812 + (796 - 812) * pushScale, scale: pushScale, dur: 2.45 });

    // @form quartz_badge: a small plain quartz clock face, separated from the teal phone point.
    const badge = ctx.el("phone_clock", { x: 1007, y: 720, w: 84, h: 84, kind: "instrument", exit: "recede" });
    const clock = Loom.lesson.clock_face(ctx, badge.inner, { size: 84, finish: "quartz", speed: 36 });
    m.pop(badge, assumed);
    clock.setState("steady", known);
    clock.run(known, ctx.end);
    clock.setState("off", doesnt, { deg: 55, dur: 0.12 });

    // The held phone point flickers briefly with the exact spoken break, then settles again.
    Loom.drive(function (p) {
      const on = p < 0.15 || (p >= 0.31 && p < 0.43) || (p >= 0.59 && p < 0.72);
      phonePt.outer.setAttribute("opacity", on ? "1" : "0.24");
    }, doesnt, 0.72, "linear");
    Loom.tl.set(phonePt.outer, { opacity: 1 }, doesnt + 0.72);

    // The diagram and badge retire together at the end of this station's final explanation.
    const retire = ctx.speechEnd + 0.08;
    [ground, phonePt, sats, circleA, circleB, circleC, badge].forEach(E => m.exit(E, retire, "recede"));
  }
});
