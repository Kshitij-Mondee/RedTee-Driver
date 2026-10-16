// @lab {"title": "Loom.brush.wash: a watercolour wash blooms left to right behind the one phrase that carries the lesson; the words stay the email's own SVG text. Sample words only", "styles": ["editorial-paper", "glow-flat"], "dur": 4.0, "times": [0.8, 1.5, 1.8, 2.1, 2.6, 3.8]}
// A lab scene for the wash recipe: the scene lays out the real text (a Loom.ui.mail), asks Loom.ui.phrase for the rect
// of the words that matter and hands it to the recipe. The colour is a token (default: the pack's ui_mark role).
Loom.scene("recipe_brush_wash", {
  build(ctx) {
    const A = Loom.ui.mail(ctx, "note", { x: 330, y: 200, w: 1260, display: 0.8,
      subject: "Your request for the new laptop",
      from: { name: "Priya Shah", address: "priya.shah@example.com" }, time: "10:40",
      paragraphs: ["Thanks for the details. Please send the cost centre code by Friday, so I can place the order this week."] });
    Loom.ui.build(ctx, A, 0.0, { whole: true });
    Loom.brush.wash(ctx, "stress", { seed: 3, rect: Loom.ui.phrase(A, "body_0", "the cost centre code"), at: 1.4 });
  },
});
