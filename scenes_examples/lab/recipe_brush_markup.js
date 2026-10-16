// @lab {"title": "Loom.brush.markup: a reviewer's marker marks on a real email draft (Loom.ui.mail) - a circle, a strike, an underline, a margin bracket and a tick for the good line, each on its time. Sample words only", "styles": ["editorial-paper", "dark-technical"], "dur": 6.0, "times": [0.9, 1.7, 2.5, 3.3, 4.3, 5.8]}
// A lab scene for the markup recipe. The scene lays out the draft first and passes the rects of the words a reviewer
// marks: Loom.ui.phrase for words inside a line, Loom.ui.at for a whole paragraph. Marks only; the words stay the
// draft's own SVG text. The draft's words are SAMPLE words.
Loom.scene("recipe_brush_markup", {
  build(ctx) {
    const A = Loom.ui.mail(ctx, "draft", { x: 330, y: 110, w: 1260, display: 0.85,
      subject: "Expense forms for the March trip",
      from: { name: "Sam Lee", address: "sam.lee@example.com" }, to: "the travel team", time: "Draft",
      paragraphs: ["Hi all, please send me your forms ASAP.", "I need the signed form and every receipt by Friday.", "Thanks for the quick turnaround last month."] });
    Loom.ui.build(ctx, A, 0.0, { whole: true });
    Loom.brush.markup(ctx, "review", { seed: 5, marks: [
      { rect: Loom.ui.phrase(A, "body_0", "ASAP"), kind: "strike", at: 0.6 },
      { rect: Loom.ui.phrase(A, "body_1", "by Friday"), kind: "circle", at: 1.4 },
      { rect: Loom.ui.phrase(A, "body_1", "the signed form"), kind: "underline", at: 2.2 },
      { rect: Loom.ui.at(A, "body_1"), kind: "bracket", at: 3.0 },
      { rect: Loom.ui.at(A, "body_2"), kind: "tick", at: 3.9 },
    ] });
  },
});
