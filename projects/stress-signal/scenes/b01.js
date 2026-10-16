// @design alarm_fires_at_desk: a worker at a desk; an item arrives and an alarm bursts behind her
Loom.scene("b01", {
  build(ctx) {
    const G = Loom.glow, k = ctx.kit, m = ctx.m;
    G.ground(ctx, "bg", { bloom: "violet", by: 0.4, dust: 90, t0: ctx.start, t1: ctx.end });
    // the burst is drawn first so it sits behind her; it pops on "already racing"
    G.burst(ctx, "burst", { x: 960, y: 520, t: ctx.cue("already racing"), t1: ctx.end, layers: ["accent3", "accent", "accent2", "core"] });
    const worker = ctx.character("worker", "tess", { x: 960, y: 1230, scale: 1.2, skin: 2, top: "accent4" });
    worker.pose("idle", ctx.start);
    worker.pose("explain", ctx.cue("second line"), { dur: 0.4 }); worker.emotion("concerned", ctx.cue("second line")); worker.look(0.2, 0.4, ctx.cue("second line"));
    worker.emotion("surprised", ctx.cue("already racing"));
    // @form desk_front_panel: a desk seen from the front, a solid panel that hides the legs
    const desk = ctx.el("desk", { x: 470, y: 820, w: 980, h: 300, kind: "scenery" });
    k.rect(desk.inner, 40, 32, 900, 268, { fill: "surface2", r: 18 });
    k.rect(desk.inner, 0, 0, 980, 46, { fill: "surface", r: 14 });
    const laptop = ctx.el("laptop", { x: 600, y: 690, w: 300, h: 140, kind: "prop" });
    k.rect(laptop.inner, 0, 0, 280, 136, { fill: "muted", r: 12 }); k.rect(laptop.inner, 16, 14, 248, 108, { fill: "accent4", r: 8, flat: true });
    // @form glowing_envelope: an envelope prop with a soft glow, carrying a label pill
    const env = ctx.el("envelope", { x: 1040, y: 640, w: 300, h: 200, kind: "prop" });
    G.glowDisc(env.inner, 150, 100, 90, "accent3", { core: false, opacity: 0.18, spread: 2.2 });
    k.rect(env.inner, 20, 30, 260, 160, { fill: "ink", r: 14 });
    k.polygon(env.inner, [[24, 38], [150, 120], [276, 38]], { fill: "surface2" });
    m.drop(env, ctx.cue("Say a message lands"));
    const pill = ctx.el("urgent", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(pill.inner, 1290, 600, "Urgent", { tone: "accent3", role: "lead" });
    m.pop(pill, ctx.cue("Marked urgent"));
    const sparks = ctx.el("crackle", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.crackle(sparks.inner, 960, 540, { rx: 170, ry: 300, n: 6, t0: ctx.cue("already racing"), t1: ctx.end });
  },
});
