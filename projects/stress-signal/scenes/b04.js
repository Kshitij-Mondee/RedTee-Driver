// @design body_lit_from_inside_continued: a second named part pinned beside the first
Loom.scene("b04", {
  build(ctx) {
    // @form label_pinned_to_part: a saturated pill label with a pointer to the part it names
    const G = Loom.glow, m = ctx.m;
    ["bg", "light", "worker", "adrenaline"].forEach((n) => ctx.held(n));
    const core = ctx.held("core");
    G.idle(core, ctx.start, ctx.end, { bob: 0, breathe: 0.1, period: 0.6, cy: 0, cx: 0 });
    const cor = ctx.el("cortisol", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(cor.inner, 1180, 400, "Cortisol", { tone: "accent4", role: "lead", point: [614, 730] });
    m.pop(cor, ctx.cue("Then cortisol"));
    const sparks = ctx.el("crackle2", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.crackle(sparks.inner, 560, 680, { rx: 200, ry: 320, n: 5, t0: ctx.start, t1: ctx.end });
  },
});
