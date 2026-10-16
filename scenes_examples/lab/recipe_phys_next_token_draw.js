// @lab {"title": "Loom.physics.nextTokenDraw (next_token_draw): bin widths are the probabilities, the ball lands in the token the lesson chose. Sample words and illustrative numbers only", "styles": ["corporate-clean", "dark-technical"], "dur": 5.6, "times": [0.5, 1.0, 1.5, 2.2, 3.4, 5.4]}
// A lab scene for the nextTokenDraw recipe (runtime/recipes_physics.js). Candidates and probabilities are SAMPLE,
// illustrative inputs; a lesson passes a real model run's numbers or marks them illustrative.
Loom.scene("recipe_phys_next_token_draw", {
  build(ctx) {
    Loom.physics.nextTokenDraw(ctx, "next_word", {
      candidates: ["mat", "sofa", "floor", "roof", "moon"], probs: [0.52, 0.21, 0.15, 0.08, 0.04],
      chosen: ["mat", "sofa"], showProbs: true, t: 0.3, gap: 1.2,
    });
  },
});
