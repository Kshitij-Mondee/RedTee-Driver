// @lab {"title": "Loom.physics.priorityJar (priority_jar): small things first and the big ones stand above the rim; big first and everything fits. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 7.1, "times": [0.6, 1.4, 2.2, 3.2, 4.4, 7.0]}
// A lab scene for the priorityJar recipe (runtime/recipes_physics.js): two jars side by side, one per order. The rock
// words and captions are SAMPLE inputs.
Loom.scene("recipe_phys_priority_jar", {
  build(ctx) {
    const big = ["Client launch", "Hiring", "Budget"];
    Loom.physics.priorityJar(ctx, "jar_small_first", { big, small: 12, order: "small_first", caption: "Small things first", t: 0.3, x: 96, y: 120, w: 840, h: 800 });
    Loom.physics.priorityJar(ctx, "jar_big_first", { big, small: 12, order: "big_first", caption: "Big things first", t: 0.3, x: 984, y: 120, w: 840, h: 800 });
  },
});
