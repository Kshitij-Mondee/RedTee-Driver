// @design origin_scene_danger_passes: long ago, a figure in tall grass as a large danger passes behind
Loom.scene("b06", {
  build(ctx) {
    // @form danger_shadow_passing: a large dark silhouette with lit eyes sliding behind foreground grass
    const G = Loom.glow, m = ctx.m;
    G.ground(ctx, "bg", { bloom: "plum", by: 0.3, dust: 60, t0: ctx.start, t1: ctx.end, fieldTones: ["field2", "plum", "surface2", "deep"] });
    // the danger: a large original shadow with two lit eyes, sliding behind the far grass
    const shadow = ctx.el("danger", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const body = G.blob(shadow.inner, 0, 560, 260, { fill: "deep", seed: "danger", lobes: 7, wobble: 0.14, sx: 1.6, sy: 0.8, gloss: false });
    G.glowDisc(shadow.inner, 150, 500, 12, "core", { opacity: 0.4, spread: 2.4 });
    G.glowDisc(shadow.inner, 200, 505, 12, "core", { opacity: 0.4, spread: 2.4 });
    void body;
    // ears and a back line, so the silhouette reads as an animal, not a cloud
    ctx.kit.polygon(shadow.inner, [[120, 430], [150, 360], [175, 440]], { fill: G.token("deep") });
    ctx.kit.polygon(shadow.inner, [[190, 435], [225, 370], [240, 450]], { fill: G.token("deep") });
    const t0 = ctx.cue("short, physical danger");
    Loom.tween(shadow.mover, { x: -500 }, { x: 1500, duration: Math.max(2, ctx.end - t0), ease: "none" }, t0, { kind: "travel", beat: ctx.beat.id, name: "danger", content: true });
    // two layers of tall grass that sway
    const grass = ctx.el("grass", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    for (let i = 0; i < 16; i++) G.kelp(grass.inner, 60 + i * 120, 1080, 380 + (i % 3) * 70, { fill: i % 2 ? "plum" : "field2", width: 22, t0: ctx.start, t1: ctx.end, phase: i });
    const person = ctx.character("ancestor", "extra", { x: 1240, y: 1000, scale: 0.62 });
    person.pose("idle", ctx.start);
    person.pose("point", ctx.cue("fight, or run from"), { dur: 0.3 });
    const near = ctx.el("grass_near", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    for (let i = 0; i < 10; i++) G.kelp(near.inner, 20 + i * 210, 1100, 220 + (i % 2) * 60, { fill: "deep", width: 30, t0: ctx.start, t1: ctx.end, phase: i * 2 });
    Loom.tween(near.inner, { scale: 1, transformOrigin: "50% 100%" }, { scale: 1.06, duration: ctx.end - ctx.start, ease: Loom.ease.editorial }, ctx.start, { kind: "camera", beat: ctx.beat.id, name: "grass_near" });
    const pill = ctx.el("danger_label", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(pill.inner, 960, 200, "Physical danger", { tone: "accent", role: "lead" });
    m.pop(pill, t0);
  },
});
