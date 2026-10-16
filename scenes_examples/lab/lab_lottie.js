// @lab {"title": "Lottie: a designer-made animation, seeked by the timeline and re-coloured to the style (runtime/lottie.js)", "styles": ["flat-cosmos", "engineering", "whiteboard"], "dur": 2.2, "times": [0.15, 0.4, 0.6, 0.85, 1.05, 1.8]}
// A lab scene: absolute times, no narration. The badge colours come from the style ("auto" map).
Loom.scene("lab_lottie", {
  build(ctx) {
    const { kit, m } = ctx;
    const E = ctx.lottie("badge", "check_success", { x: 810, y: 260, w: 300, h: 300, at: 0.1, colors: "auto" });
    const cap = ctx.el("caption", { x: 460, y: 620, w: 1000, h: 90, kind: "text" });
    kit.text(cap.inner, "Every fix has an owner", { role: "lead", x: 0, y: 0, w: 1000, h: 90, align: "center", valign: "middle" });
    m.reveal(cap, 0.85);
    void E;
  },
});
