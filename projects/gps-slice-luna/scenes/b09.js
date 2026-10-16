// @design one_signal_heads_for_phone: a single timed pulse carries a stamp into the phone's direction
/* Treatments: (A) a caption explaining the stamp, rejected because the signal itself should carry it;
   (B) a full-screen broadcast fan, rejected because the beat is one trip, not coverage;
   (C) chosen: one small stamped pulse travels from satellite A toward the teal point, while the stations hold. */
Loom.scene("b09", {
  build(ctx) {
    const { m } = ctx;
    const tLeave = ctx.cue("A signal leaves");
    const tStamp = ctx.cue("stamped with its sending time");
    const tHeads = ctx.cue("heads for your phone");

    // Continue the exact cross-section from b08. Change only satellite states, not their boxes.
    const sats = ctx.held("sats");
    const satHandles = sats.handle;
    [
      ["A", "named"],
      ["B", "dim"],
      ["C", "dim"]
    ].forEach(([key, state]) => {
      const h = satHandles && (satHandles[key] || satHandles[key.toLowerCase()]);
      if (h && typeof h.setState === "function") h.setState(state, tLeave);
    });

    // Match b08's 400 px pulse framing. The signal's local center is at A; the
    // held parent travels so that the pulse reaches one third of the phoneward path.
    const pulse = ctx.el("pulse", { x: 230, y: 30, w: 400, h: 400, kind: "value", exit: "none" });
    const pulsePart = Loom.lesson.signal(ctx, pulse.inner, { form: "pulse" });
    if (pulsePart && typeof pulsePart.setState === "function") pulsePart.setState("pulse", tLeave);
    m.pop(pulse, tLeave, { overshoot: false });
    m.travel(pulse, tHeads, { x: 183, y: 281, scale: 1, dur: 1.54 });

    // @form time_stamp_chip: a tiny silent clock clipped beside the wavefront
    const stamp = ctx.el("stamp", { x: 170, y: 100, w: 60, h: 60, kind: "token", exit: "none", parent: pulse });
    const stampPart = Loom.lesson.clock_face(ctx, stamp.inner, { size: 60, finish: "atomic" });
    if (stampPart && typeof stampPart.setState === "function") stampPart.setState("small", tStamp, { dur: 0.2, scale: 0.7 });
    m.stamp(stamp, tStamp);
  }
});
