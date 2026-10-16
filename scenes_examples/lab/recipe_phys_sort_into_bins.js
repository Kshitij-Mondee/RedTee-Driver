// @lab {"title": "Loom.physics.sortIntoBins (sort_into_bins): each item is tossed from the hopper into the bin the lesson gives it. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 9.0, "times": [0.8, 1.8, 3.0, 4.4, 6.0, 8.9]}
// A lab scene for the sortIntoBins recipe (runtime/recipes_physics.js). Words and bins are SAMPLE inputs.
Loom.scene("recipe_phys_sort_into_bins", {
  build(ctx) {
    Loom.physics.sortIntoBins(ctx, "paste_sort", {
      bins: ["Safe to paste", "Never paste"],
      items: [["Public blog post", 0], ["Customer list", 1], ["Meeting agenda", 0], ["API key", 1], ["Press release", 0], ["Salary sheet", 1], ["Draft slogan", 0], ["Patient notes", 1]],
      t: 0.3, gap: 0.5,
    });
  },
});
