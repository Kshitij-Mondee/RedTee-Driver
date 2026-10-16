// @lab {"title": "Loom.physics.puePour (pue_pour): energy from one pipe splits into IT and overhead bins in the given shares. Sample words and illustrative shares only", "styles": ["corporate-clean", "dark-technical"], "dur": 7.6, "times": [0.6, 1.4, 2.4, 3.6, 5.0, 7.5]}
// A lab scene for the puePour recipe (runtime/recipes_physics.js). Labels and shares are SAMPLE inputs.
Loom.scene("recipe_phys_pue_pour", {
  build(ctx) {
    Loom.physics.puePour(ctx, "pue", {
      itShare: 0.6, itLabel: "IT equipment", overheads: [["Cooling", 0.3], ["Power conversion", 0.07], ["Lighting", 0.03]],
      beads: 20, showShares: true, ratioText: "Sample: 1.0 / 0.6 is about 1.7", t: 0.3,
    });
  },
});
