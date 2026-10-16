// @lab {"title": "Loom.orb's own states, each entered from composing at 1.0 s: unsure (dots loosen and drift, colour cools), checking (a slow scan ring passes over), paused (contracts and holds still). Sample words only", "styles": ["corporate-clean", "glow-flat"], "dur": 6.0, "times": [0.8, 1.6, 2.4, 3.2, 4.4, 5.8]}
// A lab scene for the three states Loom adds to the thinking-orbs engine. Each orb composes, then switches at 1.0 s;
// the captions are the state names (sample words).
Loom.scene("recipe_orb_states", {
  build(ctx) {
    const { kit } = ctx;
    ["unsure", "checking", "paused"].forEach((st, i) => {
      const x = 180 + i * 560;
      Loom.orb(ctx, "orb_" + st, { x, y: 260, size: 440, t: 0.1, until: 6.0, tint: "accent",
        states: [{ at: 0.1, state: "composing" }, { at: 1.0, state: st }] });
      const E = ctx.el("cap_" + st, { x, y: 740, w: 440, h: 60, kind: "label", exit: "recede" });
      kit.text(E.inner, st, { x: 0, y: 0, w: 440, h: 60, role: "label", align: "center", color: "muted" });
      Loom.motion.reveal(E, 1.0, { dy: 6 });
    });
  },
});
