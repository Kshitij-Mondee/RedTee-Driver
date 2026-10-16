// @lab {"title": "Glow: pressure, a burst behind the figure, a stat pop, then the pull of a vortex with orbiting props", "styles": ["glow-flat", "flat-cosmos"], "dur": 9.0, "times": [0.6, 1.6, 2.6, 3.6, 5.0, 6.4, 8.4], "words": [{"w": "The", "s": 0.5, "e": 0.6}, {"w": "deadline", "s": 0.62, "e": 1.1}, {"w": "moved", "s": 1.12, "e": 1.5}, {"w": "up", "s": 1.52, "e": 1.8}, {"w": "focus", "s": 2.6, "e": 3.0}, {"w": "drops", "s": 3.02, "e": 3.5}, {"w": "and", "s": 4.6, "e": 4.7}, {"w": "everything", "s": 4.72, "e": 5.3}, {"w": "starts", "s": 5.32, "e": 5.7}, {"w": "pulling", "s": 5.72, "e": 6.2}, {"w": "at", "s": 6.22, "e": 6.3}, {"w": "you", "s": 6.32, "e": 6.6}]}
// A lab scene for the glow-flat register (docs/styles/SATURATED_FLAT_PLAN.md, moment type 2). Shot 1: a jagged burst
// lands behind a worker at a desk on "moved up", crackle loops round her, and a stat pill pops on "drops". Shot 2
// (a hard cut at an idea boundary): a top-down vortex turns while the things that pull at her orbit and close in.
// Original content; absolute times; the numbers are illustrative.
Loom.scene("lab_glow_pressure", {
  build(ctx) {
    const G = Loom.glow, m = Loom.motion;
    // shot 1: the desk, then the burst
    const s1 = ctx.el("shot1", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.ground(ctx, "bg1", { parent: s1.inner, bloom: "accent3", bx: 0.5, by: 0.5, dust: 80, floor: false, t0: 0, t1: 4.6 });
    G.burst(ctx, "burst", { parent: s1.inner, x: 960, y: 560, t: 1.3, t1: 4.6, layers: ["accent3", "accent", "accent2", "core"] });
    const tess = Loom.rig.place(ctx, "worker", "sam", { parent: s1.inner, x: 960, y: 1180, scale: 1.25, skin: 1, top: "accent4" });
    // in front of her, a desk with a solid front panel: it hides the legs, so she sits behind her work
    Loom.kit.rect(s1.inner, 520, 860, 880, 260, { fill: "surface2", r: 18 });
    Loom.kit.rect(s1.inner, 480, 828, 960, 44, { fill: "surface", r: 14 });
    const lap = Loom.kit.element(s1.inner, "laptop", { x: 700, y: 700, w: 300, h: 130 });
    Loom.kit.rect(lap.inner, 0, 0, 260, 130, { fill: "muted", r: 10 }); Loom.kit.rect(lap.inner, 14, 12, 232, 106, { fill: "accent4", r: 6, flat: true });
    tess.pose("explain", 1.4, { dur: 0.3 }); tess.emotion("worried", 1.4);
    G.crackle(s1.inner, 960, 640, { rx: 180, ry: 300, n: 6, t0: 1.4, t1: 4.6, len: 130 });
    G.stat(ctx, "focus", "FOCUS -30", { parent: s1.inner, from: [990, 390], x: 1400, y: 250, t: 2.7, tone: "accent4" });
    Loom.set(s1.outer, { opacity: 0 }, 4.6);
    // shot 2: the pull
    const s2 = ctx.el("shot2", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    Loom.set(s2.outer, { opacity: 0 }, 0); Loom.set(s2.outer, { opacity: 1 }, 4.6);
    G.vortex(ctx, "pull", { parent: s2.inner, x: 960, y: 540, t0: 4.6, t1: 9, core: "accent2" });
    const me = Loom.kit.element(s2.inner, "me", { x: 960, y: 540, w: 0, h: 0 });
    Loom.kit.disc(me.inner, 0, 0, 70, { fill: "accent4" });
    Loom.kit.icon(me.inner, "user", { x: 0, y: 0, size: 80, color: G.token("onAccent"), stroke: 2.6 });
    G.idle(me, 4.6, 9, { bob: 0, breathe: 0.06, period: 0.8, cy: 0, cx: 0 });
    G.orbit(ctx, "pulls", { parent: s2.inner, x: 960, y: 540, icons: ["smartphone", "mail", "calendar", "message-square", "bell"], t0: 4.6, t1: 9, r0: 430, pull: 0.45 });
  },
});
