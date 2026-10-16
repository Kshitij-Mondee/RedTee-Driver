// @lab {"title": "Loom.physics.redundancyTopple (redundancy_topple): one support fails; alone the load falls, with a spare it holds. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 5.6, "times": [0.5, 1.2, 1.5, 1.9, 2.8, 5.5]}
// A lab scene for the redundancyTopple recipe (runtime/recipes_physics.js): the same fault, one support (top) and two
// (bottom). Labels are SAMPLE inputs.
Loom.scene("recipe_phys_redundancy_topple", {
  build(ctx) {
    Loom.physics.redundancyTopple(ctx, "one_feed", { supports: 1, labels: ["Feed A"], loadLabel: "Server rack", faultLabel: "Fault", t: 0.3, knockAt: 1.2, x: 96, y: 84, w: 1728, h: 400 });
    Loom.physics.redundancyTopple(ctx, "two_feeds", { supports: 2, labels: ["Feed A", "Feed B"], loadLabel: "Server rack", faultLabel: "Fault", t: 0.3, knockAt: 1.2, x: 96, y: 530, w: 1728, h: 400 });
  },
});
