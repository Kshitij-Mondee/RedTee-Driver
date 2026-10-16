// @lab {"title": "Loom.physics.trainTestSplit (train_test_split): the given shares rain into three bins, then the test bin is locked. Sample words and illustrative numbers only", "styles": ["corporate-clean", "dark-technical"], "dur": 7.0, "times": [0.6, 1.4, 2.4, 3.6, 4.8, 6.9]}
// A lab scene for the trainTestSplit recipe (runtime/recipes_physics.js). Counts, shares and labels are SAMPLE inputs.
Loom.scene("recipe_phys_train_test_split", {
  build(ctx) {
    Loom.physics.trainTestSplit(ctx, "split", {
      examples: 24, split: [0.7, 0.15, 0.15], labels: ["Train", "Validate", "Test"], showShares: true, t: 0.3,
    });
  },
});
