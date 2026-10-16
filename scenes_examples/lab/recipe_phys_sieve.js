// @lab {"title": "Loom.physics.sieve (defence_layers_sieve): each layer stops exactly the count given, the rest reach a person. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 6.6, "times": [0.6, 1.4, 2.2, 3.0, 4.2, 6.4]}
// A lab scene for the sieve recipe (runtime/recipes_physics.js). The words and counts are SAMPLE inputs; a lesson
// passes its own, and its narration's cue as t.
Loom.scene("recipe_phys_sieve", {
  build(ctx) {
    Loom.physics.sieve(ctx, "phish_layers", {
      layers: ["Email filter", "Link scanner", "Browser warning"], stopped: [10, 5, 3], total: 21,
      bottomLabel: "You report it", t: 0.3, seed: 4,
    });
  },
});
