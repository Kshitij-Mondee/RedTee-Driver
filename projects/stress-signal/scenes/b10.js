// @design alarm_fires_at_desk_resolved: the opening desk again, calm; three steps light in turn
Loom.scene("b10", {
  build(ctx) {
    const G = Loom.glow, k = ctx.kit, m = ctx.m;
    G.ground(ctx, "bg10", { bloom: "accent4", by: 0.4, bloomOpacity: 0.3, dust: 90, t0: ctx.start, t1: ctx.end });
    const worker = ctx.character("worker10", "tess", { x: 760, y: 1230, scale: 1.2, skin: 2, top: "accent4" });
    worker.pose("idle", ctx.start); worker.emotion("focused", ctx.cue("Notice the alarm")); worker.emotion("happy", ctx.cue("reply on purpose"));
    worker.pose("present", ctx.cue("reply on purpose"), { dur: 0.4 });
    const desk = ctx.el("desk10", { x: 270, y: 820, w: 980, h: 300, kind: "scenery" });
    k.rect(desk.inner, 40, 32, 900, 268, { fill: "surface2", r: 18 });
    k.rect(desk.inner, 0, 0, 980, 46, { fill: "surface", r: 14 });
    const laptop = ctx.el("laptop10", { x: 400, y: 690, w: 300, h: 140, kind: "prop" });
    k.rect(laptop.inner, 0, 0, 280, 136, { fill: "muted", r: 12 }); k.rect(laptop.inner, 16, 14, 248, 108, { fill: "accent4", r: 8, flat: true });
    const env = ctx.el("envelope10", { x: 840, y: 640, w: 300, h: 200, kind: "prop" });
    k.rect(env.inner, 20, 30, 260, 160, { fill: "ink", r: 14 });
    k.polygon(env.inner, [[24, 38], [150, 120], [276, 38]], { fill: "surface2" });
    m.drop(env, ctx.cue("Same message"));
    // the reply leaves: the envelope flies up and out on "reply on purpose"
    const tr = ctx.cue("reply on purpose");
    Loom.tween(env.mover, { x: 0, y: 0, rotation: 0 }, { x: 1300, y: -900, rotation: -18, duration: ctx.style.dur("move") * 2.4, ease: Loom.ease.move }, tr + 0.3, { kind: "travel", beat: ctx.beat.id, name: "envelope10", content: true });
    // @form step_pills_in_turn: short step labels that light one per spoken word
    // three steps, one per word
    const steps = [["Notice", ctx.cue("Notice the alarm"), "accent2"], ["Pause", ctx.cue("Pause"), "accent4"], ["Reply", ctx.cue("reply on purpose"), "pos"]];
    steps.forEach(([label, t, tone], i) => {
      const S = ctx.el(`step_${i}`, { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
      G.pill(S.inner, 1500, 330 + i * 130, label, { tone, role: "title", weight: 800 });
      m.pop(S, t);
    });
    const spk = ctx.el("sparkles10", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.sparkles(spk.inner, { x: 1250, y: 150, w: 550, h: 600, n: 8, t0: ctx.cue("reply on purpose"), t1: ctx.end, seed: "b10" });
  },
});
