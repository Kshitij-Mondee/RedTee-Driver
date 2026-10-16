// @lab {"title": "Loom.physics.biasedFunnel (biased_funnel): a mixed stream in, leaning pegs turn some away, a skewed pile out. Sample words and illustrative shares only", "styles": ["corporate-clean", "dark-technical"], "dur": 9.1, "times": [0.6, 1.4, 2.4, 3.4, 5.0, 9.0]}
// A lab scene for the biasedFunnel recipe (runtime/recipes_physics.js). Groups and shares are SAMPLE inputs.
Loom.scene("recipe_phys_biased_funnel", {
  build(ctx) {
    Loom.physics.biasedFunnel(ctx, "sample_bias", {
      groups: ["Group A", "Group B"], inShares: [0.5, 0.5], outShares: [0.8, 0.2], total: 24, showShares: true,
      outLabel: "Training sample", skippedLabel: "Left out", t: 0.3,
    });
  },
});
