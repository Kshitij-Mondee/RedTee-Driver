// @design status_jobs_switch_off: a status panel of named jobs; each switches off on its word
Loom.scene("b05", {
  build(ctx) {
    // @form status_slot_label: a short label under a status slot, arriving with its switch-off
    const G = Loom.glow, k = ctx.kit, m = ctx.m;
    ["bg", "light", "worker", "adrenaline", "cortisol"].forEach((n) => ctx.held(n));
    const core = ctx.held("core");
    G.idle(core, ctx.start, ctx.end, { bob: 0, breathe: 0.08, period: 0.7, cy: 0, cx: 0 });
    const hud = G.hud(ctx, "status", { x: 1060, y: 545, slot: 190, gap: 40, title: "Slower jobs", icons: ["utensils", "shield", "brain"], tone: "accent4" });
    m.settle(hud.E, ctx.cue("Slower jobs"));
    // one label under each slot, arriving with its switch-off
    const words = [["Digestion", "Digestion"], ["Immune", "Some immune work"], ["Careful thinking", "careful thinking"]];
    const cues = [ctx.cue("Digestion"), ctx.cue("Some immune work"), ctx.cue("careful thinking")];
    words.forEach(([label], i) => {
      const L = ctx.el(`job_${i}`, { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
      G.pill(L.inner, 1060 + 40 + i * 230 + 95, 860, label, { tone: "surface", role: "label", color: "ink" });
      m.pop(L, cues[i]);
      hud.dim(i, cues[i]);
    });
  },
});
