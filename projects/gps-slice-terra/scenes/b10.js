// @design wave_speed: a luminous radio pulse advances with warm streaks and carries its speed beside it
Loom.scene("b10", {
  build(ctx, props) {
    // Treatments considered: a static speed card, a travelling pulse with a riding tag, or broadcast rings. Chosen: the riding tag, because speed belongs to the wave.
    const radio = ctx.cue("It's a radio wave, moving at light speed:");
    const speed = ctx.cue("about 300,000 kilometres a second.");

    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const pulse = ctx.held("pulse");
    const stamp = ctx.held("stamp");

    pulse.handle.setState("pulse", radio);
    ctx.m.travel(pulse, radio, { x: 290, y: 315, scale: 1 });
    stamp.handle.setState("steady", radio);
    ctx.m.travel(stamp, radio, { x: 290, y: 315, scale: 1 });

    // @form tag_speed: speed label and radiant streaks travelling beside the pulse
    const tag = ctx.el("tag_speed", { x: 210, y: 300, w: 420, h: 170, kind: "token", exit: "recede" });
    const streakA = ctx.kit.line(tag.inner, 0, 60, 108, 60, { stroke: "accent2", sw: 7 });
    const streakB = ctx.kit.line(tag.inner, 28, 88, 138, 88, { stroke: "accent2", sw: 4 });
    const head = ctx.kit.disc(tag.inner, 132, 60, 16, { fill: "accent2" });
    const chip = ctx.kit.pill(tag.inner, 148, 12, 260, 108, { fill: "surface", r: 41, stroke: "accent2", shadow: true });
    const words = ctx.kit.text(tag.inner, "about 300,000 kilometres a second", { role: "label", x: 166, y: 24, w: 224, h: 84, align: "center", valign: "middle", maxLines: 2, color: "ink", weight: 700 });
    ctx.m.draw(streakA, radio, { dur: ctx.style.dur("draw") });
    ctx.m.draw(streakB, radio + 0.12, { dur: ctx.style.dur("draw") });
    ctx.m.pop(tag, speed);
    ctx.m.travel(tag, speed + 0.45, { x: 220, y: 250, scale: 1 });
    ctx.m.emphasis(tag, speed);
  }
});
