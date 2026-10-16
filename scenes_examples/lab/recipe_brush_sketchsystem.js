// @lab {"title": "Loom.brush.sketchSystem: a system sketched in pencil box by box as it is named, then marker arrows between them; the labels are the scene's own SVG text. Sample words only", "styles": ["whiteboard", "dark-technical"], "dur": 6.0, "times": [0.7, 1.5, 2.3, 3.2, 4.1, 5.8]}
// A lab scene for the sketchSystem recipe: the scene decides the layout (the rects), names each box with kit.text on
// the box's time, and hands the rects and times to the recipe, which draws only the marks. Sample words only.
Loom.scene("recipe_brush_sketchsystem", {
  build(ctx) {
    const { kit } = ctx;
    const boxes = [
      { rect: { x: 150, y: 400, w: 420, h: 200 }, at: 0.3, label: "The question" },
      { rect: { x: 750, y: 400, w: 420, h: 200 }, at: 1.1, label: "Search the documents" },
      { rect: { x: 1350, y: 400, w: 420, h: 200 }, at: 1.9, label: "Answer with a source" },
      { rect: { x: 750, y: 720, w: 420, h: 150 }, at: 2.7, label: "Policy library" },
    ];
    Loom.brush.sketchSystem(ctx, "rag_sketch", { seed: 7, boxes, arrows: [
      { from: 0, to: 1, at: 3.4 }, { from: 3, to: 1, at: 3.9 }, { from: 1, to: 2, at: 4.4 },
    ] });
    boxes.forEach((b, i) => {
      const E = ctx.el("label_" + i, { x: b.rect.x + 30, y: b.rect.y + 20, w: b.rect.w - 60, h: b.rect.h - 40, kind: "label", exit: "recede" });
      kit.text(E.inner, b.label, { x: 0, y: 0, w: b.rect.w - 60, h: b.rect.h - 40, role: "lead", align: "center", valign: "middle", color: "ink" });
      Loom.motion.reveal(E, b.at + 0.5, { dy: 6 });
    });
    const T = ctx.el("title", { x: 150, y: 170, w: 1620, h: 90, kind: "text", exit: "recede" });
    kit.text(T.inner, "How the assistant answers from your documents", { x: 0, y: 0, w: 1620, h: 90, role: "lead", color: "ink" });
    Loom.motion.reveal(T, 0.1, { dy: 8 });
  },
});
