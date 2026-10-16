// @lab {"title": "Shader layer: each style's living background, grain and vignette, a light sweep and a spotlight (runtime/fx.js)", "styles": ["flat-cosmos", "engineering", "corporate-clean", "editorial-paper", "whiteboard", "dark-technical"], "dur": 4.4, "times": [0.3, 1.25, 2.0, 2.9, 3.6, 4.3], "fx": {}}
// A lab scene: absolute times, no narration. The words are demo content for the lab only.
Loom.scene("lab_fx", {
  build(ctx) {
    const { kit, m } = ctx;
    const title = ctx.el("title", { x: 160, y: 120, w: 1600, h: 150, kind: "text" });
    kit.text(title.inner, "Three conditions, one outage", { role: "title", x: 0, y: 0, w: 1600, h: 150, align: "center", valign: "middle" });
    m.reveal(title, 0.1);
    const words = ["No test", "Old setting", "Quiet alert"];
    const cards = words.map((w, i) => {
      const E = ctx.el(`cond_${i + 1}`, { x: 250 + i * 500, y: 420, w: 420, h: 300, kind: "card" });
      kit.rect(E.inner, 0, 0, 420, 300, { fill: "surface" });
      kit.text(E.inner, w, { role: "lead", x: 30, y: 0, w: 360, h: 300, align: "center", valign: "middle" });
      return E;
    });
    m.group(cards, 0.25, { enter: "spring", order: "forward", each: { preset: "gentle", dy: 40 } });
    // a light sweep crosses the title as it is read, then the middle card is singled out
    ctx.fxMoment("light", 0.7, 1.8, [160, 120, 1600, 150]);
    ctx.fxMoment("spotlight", 2.1, 3.9, [750 - 20, 420 - 20, 460, 340]);
  },
});
