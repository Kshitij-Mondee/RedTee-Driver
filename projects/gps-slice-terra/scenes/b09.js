// @design signal_to_receiver: a single luminous pulse carries a time mark down from one satellite toward the listening point
Loom.scene("b09", {
  build(ctx, props) {
    // Treatments considered: static marked route, travelling pulse with a clipped-on clock, or full broadcast rings. Chosen: one travelling pulse and one clock, because the trip is the claim.
    const leave = ctx.cue("A signal leaves, stamped with its sending time,");
    const stampAt = ctx.cue("stamped with its sending time");
    const travelAt = ctx.cue("and heads for your phone.");

    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");

    // @form pulse: bright radio pulse travelling from satellite A toward the phone point
    const pulse = ctx.el("pulse", { x: 430, y: 230, w: 530, h: 582, kind: "token", exit: "none" });
    const signal = Loom.lesson.signal(ctx, pulse.inner, { from: [0, 0], to: [530, 582] });
    signal.setState("pulse", leave);
    signal.setState("pulse", stampAt);
    signal.setState("pulse", travelAt);
    signal.setState("pulse", travelAt + 0.8);
    ctx.m.pop(pulse, leave);
    ctx.m.travel(pulse, travelAt, { x: 175, y: 192, scale: 1 });

    // @form stamp: a wordless clock chip riding beside the travelling pulse
    const stamp = ctx.el("stamp", { x: 430, y: 230, w: 64, h: 64, kind: "icon", exit: "none" });
    const clock = Loom.lesson.clock_face(ctx, stamp.inner, { size: 58, finish: "atomic" });
    clock.setState("steady", stampAt);
    ctx.m.stamp(stamp, stampAt);
    ctx.m.travel(stamp, travelAt, { x: 175, y: 192, scale: 1 });
  }
});
