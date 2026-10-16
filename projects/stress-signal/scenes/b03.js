// @design body_lit_from_inside: a figure lit from inside, named parts pinned to it as they are said
Loom.scene("b03", {
  build(ctx) {
    const G = Loom.glow, m = ctx.m;
    G.ground(ctx, "bg", { bloom: "violet", bx: 0.32, by: 0.5, dust: 120, t0: ctx.start, t1: ctx.end + 14 });
    G.shafts(ctx, "light", { n: 4, opacity: 0.12, t0: ctx.start, t1: ctx.end + 14 });
    const worker = ctx.character("worker", "tess", { x: 560, y: 1470, scale: 1.55, skin: 2, top: "accent4" });
    worker.pose("idle", ctx.start); worker.emotion("concerned", ctx.start);
    worker.pose("explain", ctx.cue("breathing quickens"), { dur: 0.4 });
    // @form glowing_core: a bright diamond core with a soft glow that pulses
    const core = ctx.el("core", { x: 560, y: 700, w: 0, h: 0, kind: "shape" });
    G.glowDisc(core.inner, 0, 0, 40, "accent3", { opacity: 0.3, spread: 3.2 });
    ctx.kit.polygon(core.inner, [[0, -46], [40, 0], [0, 46], [-40, 0]], { fill: G.token("core") });
    m.pop(core, ctx.speechStart);
    G.idle(core, ctx.cue("heart speeds up"), ctx.end, { bob: 0, breathe: 0.1, period: 0.6, cy: 0, cx: 0 });
    // @form label_pinned_to_part: a saturated pill label with a pointer to the part it names
    const adr = ctx.el("adrenaline", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(adr.inner, 1100, 290, "Adrenaline", { tone: "accent3", role: "lead", point: [612, 680] });
    m.pop(adr, ctx.cue("First, adrenaline"));
    const sparks = ctx.el("crackle", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.crackle(sparks.inner, 560, 680, { rx: 200, ry: 320, n: 6, t0: ctx.cue("energy floods"), t1: ctx.end });
    const spk = ctx.el("sparkles", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.sparkles(spk.inner, { x: 1050, y: 160, w: 700, h: 200, n: 7, t0: ctx.start, t1: ctx.end, seed: "b03" });
  },
});
