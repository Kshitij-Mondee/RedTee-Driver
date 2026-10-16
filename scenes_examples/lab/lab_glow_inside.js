// @lab {"title": "Glow: inside the body, one change per word (status panel dims as each function is named)", "styles": ["glow-flat", "flat-cosmos"], "dur": 8.0, "times": [0.8, 2.0, 3.1, 4.0, 4.9, 5.8, 7.4], "words": [{"w": "When", "s": 0.6, "e": 0.8}, {"w": "the", "s": 0.82, "e": 0.9}, {"w": "alarm", "s": 0.92, "e": 1.3}, {"w": "goes", "s": 1.32, "e": 1.5}, {"w": "off", "s": 1.52, "e": 1.8}, {"w": "your", "s": 2.4, "e": 2.6}, {"w": "body", "s": 2.62, "e": 2.95}, {"w": "pauses", "s": 2.97, "e": 3.4}, {"w": "digestion", "s": 3.5, "e": 4.0}, {"w": "defence", "s": 4.3, "e": 4.7}, {"w": "sleep", "s": 5.1, "e": 5.4}, {"w": "and", "s": 5.5, "e": 5.6}, {"w": "focus", "s": 5.9, "e": 6.3}]}
// A lab scene for the glow-flat register (docs/styles/SATURATED_FLAT_PLAN.md, moment type 1): everything quietly
// alive (dust, a pulsing core, crackle), and ONE meaning-carrying change per spoken word: a status slot switches off
// as each paused function is named. Original content; absolute times.
Loom.scene("lab_glow_inside", {
  build(ctx) {
    const G = Loom.glow;
    G.ground(ctx, "bg", { bloom: "violet", bx: 0.36, by: 0.45, dust: 140, t0: 0, t1: 8 });
    G.shafts(ctx, "light", { n: 4, opacity: 0.12, t0: 0, t1: 8 });
    // the person: a big figure on the left, lit from inside
    const ava = ctx.character("ava", "ava", { x: 560, y: 1460, scale: 1.55, skin: 2, top: "accent4" });
    ava.pose("explain", 2.4, { dur: 0.5 }); ava.emotion("worried", 2.4); ava.look(0.6, 0, 3.0);
    const core = ctx.el("core", { x: 560, y: 700, w: 0, h: 0, kind: "shape" });
    G.glowDisc(core.inner, 0, 0, 40, "accent3", { opacity: 0.3, spread: 3.2 });
    Loom.kit.polygon(core.inner, [[0, -46], [40, 0], [0, 46], [-40, 0]], { fill: G.token("core") });
    Loom.motion.pop(core, 1.0);
    G.idle(core, 1.3, 8, { bob: 0, breathe: 0.08, period: 0.9, cy: 0 });
    G.crackle(ctx.g, 560, 640, { rx: 190, ry: 330, n: 6, t0: 1.0, t1: 8 });
    // the labels sit ON the thing, with a pointer, each arriving on its word
    const lab1 = ctx.el("adrenaline", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(lab1.inner, 1060, 360, "Adrenaline", { tone: "accent3", role: "lead", point: [610, 670] });
    Loom.motion.pop(lab1, 1.1);
    const lab2 = ctx.el("cortisol", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(lab2.inner, 1080, 500, "Cortisol", { tone: "accent4", role: "lead", point: [612, 730] });
    Loom.motion.pop(lab2, 1.6);
    // the status panel: four functions, one switched off per spoken word
    const hud = G.hud(ctx, "status", { x: 1040, y: 700, title: "Running now", icons: ["utensils", "shield", "moon", "brain"], tone: "accent4" });
    Loom.motion.settle(hud.E, 2.4);
    hud.dim(0, 3.5); hud.dim(1, 4.3); hud.dim(2, 5.1); hud.dim(3, 5.9);
    G.sparkles(ctx.g, { x: 1000, y: 180, w: 700, h: 220, n: 7, t0: 0, t1: 8, seed: "in" });
  },
});
