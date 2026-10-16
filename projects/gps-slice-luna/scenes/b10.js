// @design speed_rides_the_wave: a travelling wave carries the measure of its speed
/* Treatments: (A) a static speed card, rejected because speed belongs to motion;
   (B) a full-screen beam, rejected because it would replace the held pulse;
   (C) chosen: the same pulse continues down, gold streaks trail it, and a speed tag rides beside it. */
Loom.scene("b10", {
  build(ctx) {
    const { m } = ctx;
    const tWave = ctx.cue("It's a radio wave");
    const tSpeed = ctx.cue("300,000 kilometres a second");

    // Preserve every held part and continue the b09 trajectory without rebuilding it.
    ctx.held("ground");
    ctx.held("phone_pt");
    ctx.held("sats");
    const pulse = ctx.held("pulse");
    ctx.held("stamp");

    // @form signal_streaks: warm trailing marks make the pulse's speed visible
    const streaks = ctx.el("speed_streaks", {
      x: 0, y: 0, w: 400, h: 400, kind: "value", exit: "none", parent: pulse
    });
    ctx.kit.line(streaks.inner, 28, 96, 144, 190, { stroke: "accent2", sw: 5 });
    ctx.kit.line(streaks.inner, 54, 142, 164, 198, { stroke: "accent2", sw: 5 });
    ctx.kit.line(streaks.inner, 82, 54, 158, 150, { stroke: "accent2", sw: 5 });
    m.reveal(streaks, tWave);

    const pulseEndX = 600;
    const pulseEndY = 520;
    const runDur = ctx.end - tWave;
    m.travel(pulse, tWave, { x: pulseEndX, y: pulseEndY, scale: 1, dur: runDur });

    // The tag starts offset from the wavefront and shares its travel curve, staying clear of the stamp chip.
    const tag = Loom.treat.label(ctx, "tag_speed", {
      x: 533, y: 351,
      text: "300,000 km/s",
      tone: "accent2",
      role: "label",
      t: tSpeed
    });
    // Loom.treat labels draw in station coordinates inside their full-frame element,
    // so travel by the same delta as the held pulse rather than to its station position.
    m.travel(tag, tWave, {
      x: pulseEndX - 183,
      y: pulseEndY - 281,
      scale: 1,
      dur: runDur
    });
  }
});
