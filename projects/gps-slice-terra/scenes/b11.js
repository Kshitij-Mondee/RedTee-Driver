// @design overhead_trip_timer: a descending signal resolves into one stopped travel-time readout at the receiver
Loom.scene("b11", {
  build(ctx, props) {
    // Treatments considered: static timer beside the receiver, a travelling pulse with a counting panel, or expanding rings. Chosen: the count and the final stretch together, so one event proves the travel time.
    const openAt = ctx.cue("From straight overhead,");
    const countAt = ctx.cue("the trip takes");
    const arriveAt = ctx.cue("about 0.07 seconds.");

    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const pulse = ctx.held("pulse");
    const stamp = ctx.held("stamp");

    // @form readout_link: fine receiver link leading from the phone point into its timing display
    const readoutLink = ctx.el("readout_link", { x: 944, y: 564, w: 356, h: 252, kind: "connector", exit: "none" });
    const link = ctx.kit.line(readoutLink.inner, 16, 244, 356, 20, { stroke: "line", sw: 3 });
    ctx.m.draw(link, openAt, { dur: ctx.style.dur("draw") });

    // @form readout: compact phone timing panel beside the receiver
    const readout = ctx.el("readout", { x: 1300, y: 520, w: 500, h: 124, kind: "card", exit: "none" });
    // @form timer: the running travel-time value inside the phone timing panel
    const timer = ctx.el("timer", { x: 0, y: 0, w: 500, h: 124, kind: "value", exit: "none", parent: readout });
    const display = Loom.lesson.phone(ctx, timer.inner, { form: "readout", timerTo: 0.07, decimals: 2, unit: "s" });
    ctx.m.reveal(readout, openAt);
    display.setState("readout_timer", countAt, { dur: Math.max(0.7, arriveAt - countAt), to: 0.07, stop: true });

    // @form stamp_chip: wordless sending-time clock chip parked in the completed readout
    const stampChip = ctx.el("stamp_chip", { x: 1748, y: 596, w: 38, h: 38, kind: "token", exit: "none" });
    const chip = Loom.lesson.clock_face(ctx, stampChip.inner, { size: 36, finish: "atomic" });
    chip.setState("steady", arriveAt);
    ctx.m.drop(stampChip, arriveAt);

    pulse.handle.setState("absorbed", arriveAt);
    stamp.handle.setState("small", arriveAt);
    ctx.m.exit(stamp, arriveAt, "iris");
  }
});
