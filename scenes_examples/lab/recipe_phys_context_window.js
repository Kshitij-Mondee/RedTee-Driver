// @lab {"title": "Loom.physics.contextWindow (context_window_tray): a fixed window; top, the oldest tile is pushed out; bottom, a full window refuses. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 11.6, "times": [0.8, 2.6, 4.2, 5.0, 6.4, 11.5]}
// A lab scene for the contextWindow recipe (runtime/recipes_physics.js): both policies, one above the other. The
// token words are SAMPLE inputs.
Loom.scene("recipe_phys_context_window", {
  build(ctx) {
    const tiles = ["The", "meeting", "moved", "to", "Friday", "at", "noon"];
    Loom.physics.contextWindow(ctx, "window_oldest", { capacity: 5, tiles, policy: "oldest_out", windowLabel: "Oldest out", t: 0.3, gap: 0.8, x: 96, y: 40, w: 1728, h: 440 });
    Loom.physics.contextWindow(ctx, "window_refuse", { capacity: 5, tiles, policy: "refuse", windowLabel: "Refuse when full", t: 0.3, gap: 0.8, x: 96, y: 560, w: 1728, h: 380 });
  },
});
