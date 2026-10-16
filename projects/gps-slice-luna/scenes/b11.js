// @design one_trip_is_a_count: pair the pulse's last flight with the phone's stopped timer
/* Treatments: (A) a static route and fixed number, rejected because it hides elapsed travel time;
   (B) an expanding overhead ray, rejected because the point-to-point trip is the useful quantity;
   (C) chosen: a readout opens beside the receiver as the held pulse finishes its route and its timer stops. */
Loom.scene("b11", {
  build(ctx) {
    const { m } = ctx;
    const tOpen = ctx.cue("From straight overhead");
    const tCount = ctx.cue("the trip takes");
    const tLand = ctx.cue("about 0.07 seconds");

    // Keep the station's world. These are the exact things already on screen.
    const ground = ctx.held("ground");
    const phonePt = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const pulse = ctx.held("pulse");
    const stamp = ctx.held("stamp");

    // Container first: the readout kit owns the panel and its running number.
    const readout = ctx.el("readout", { x: 1300, y: 520, w: 500, h: 124, kind: "card", exit: "none", parent: ground });
    const timer = ctx.el("timer", { x: 0, y: 0, w: 500, h: 124, kind: "value", exit: "none", parent: readout });
    const readoutPart = Loom.lesson.phone(ctx, timer.inner, {
      form: "readout", timer: true, rows: [], unit: "s", decimals: 2
    });
    m.pop(readout, tOpen, { overshoot: false });
    // Draw the link from the already-present phone point into the readout's edge.
    const link = ctx.el("readout_link", { x: 960, y: 582, w: 340, h: 230, kind: "connector", exit: "none" });
    const wire = ctx.kit.path(link.inner, "M0 230 L340 0", { fill: "none", stroke: "line", sw: 3 });
    m.draw(wire, tOpen + 0.22, { dur: 0.62 });

    // The count and the last leg end on one shared instant.
    const flight = tLand - tCount;
    pulse.handle.setState("absorbed", tLand);
    m.travel(pulse, tCount, { x: 760, y: 612, scale: 1, dur: flight });
    readoutPart.setState("readout_timer", tCount, { to: 0.07, dur: flight });

    // The existing stamp rides with the pulse, then drops into the panel.
    m.travel(stamp, tLand, { x: 265, y: -186, scale: 0.72, dur: 0.48 });

    // Keep the chip's continuity name as a semantic handle in the readout.
    const stampChip = ctx.el("stamp_chip", { x: 40, y: 15, w: 60, h: 60, kind: "token", exit: "none", parent: readout });
    stampChip.handle = stamp.handle;

    // Preserve the held station elements while this beat concludes.
    void ground; void phonePt; void sats;
  }
});
