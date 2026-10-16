// @design value_settles_over_time: a gauge marker slides from alarm to calm while a glow softens
Loom.scene("b09", {
  build(ctx) {
    // @form gauge_alarm_to_calm: a vertical track whose marker slides from an alarm icon to a calm icon
    const G = Loom.glow, k = ctx.kit, m = ctx.m;
    // b09 shares its station with b08's title card (a continue join): everything here arrives at the start of
    // this beat, or it would cover the card from frame 0 (seen on the first contact sheet, R-23)
    const bg = G.ground(ctx, "bg9", { bloom: "accent4", bx: 0.35, by: 0.5, bloomOpacity: 0.35, dust: 70, t0: ctx.start, t1: ctx.end });
    m.reveal(bg.E, ctx.start, { dy: 0 });
    const worker = ctx.character("worker9", "tess", { x: 640, y: 1470, scale: 1.5, skin: 2, top: "accent4" });
    m.reveal(worker.E, ctx.start, { dy: 0 });
    worker.pose("idle", ctx.start); worker.emotion("concerned", ctx.start); worker.emotion("happy", ctx.cue("give it some"));
    // the core, still bright, softens as the gauge falls
    const core = ctx.el("core9", { x: 640, y: 720, w: 0, h: 0, kind: "shape" });
    G.glowDisc(core.inner, 0, 0, 40, "accent3", { opacity: 0.3, spread: 3.2 });
    k.polygon(core.inner, [[0, -46], [40, 0], [0, 46], [-40, 0]], { fill: G.token("core") });
    m.reveal(core, ctx.start, { dy: 0 });
    const t0 = ctx.cue("settles on its own"), t1 = ctx.cue("give it some");
    Loom.tween(core.inner, { opacity: 1 }, { opacity: 0.25, duration: Math.max(1, t1 - t0), ease: Loom.ease.editorial }, t0, { kind: "state", beat: ctx.beat.id, name: "core9", content: true });
    const gg = G.gauge(ctx, "gauge", { x: 1360, y: 190, h: 600, n: 9 });
    k.icon(gg.E.inner, "zap", { x: 60, y: -70, size: 52, color: G.token("accent3") });
    k.icon(gg.E.inner, "heart", { x: 60, y: 630, size: 52, color: G.token("pos") });
    m.settle(gg.E, ctx.start + 0.2);
    // the two ends named: the alarm at the top (spoken), calm shown by the heart at the bottom
    const A = ctx.el("alarm_label", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(A.inner, 1620, 120, "Alarm", { tone: "accent3", role: "lead" });
    m.pop(A, ctx.cue("The alarm"));
    gg.move(1, t0, Math.max(1.2, t1 - t0));
    const L = ctx.el("time_label", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(L.inner, 1690, 760, "Give it time", { tone: "pos", role: "lead" });
    m.pop(L, t1);
  },
});
