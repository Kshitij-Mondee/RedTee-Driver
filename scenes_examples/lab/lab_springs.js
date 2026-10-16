// @lab {"title": "Springs vs the standard entrance, with their motion curves (bounce is clamped where the style has no overshoot)", "styles": ["whiteboard", "engineering"], "dur": 2.4, "times": [0.22, 0.34, 0.46, 0.6, 0.8, 1.2]}
// A lab scene: absolute times, no narration. Four identical cards and four entrances, all starting at 0.1 s,
// above the curve each one follows (position against time, sampled from the real easing functions).
Loom.scene("lab_springs", {
  build(ctx) {
    const { kit, m } = ctx;
    const names = ["standard ease", "spring: gentle", "spring: snappy", "spring: lively"];
    const curves = [Loom.ease.enter, ...["gentle", "snappy", "lively"].map((k) => Loom.spring(Loom.springs[k]).ease)];
    const toks = ["muted", "accent", "accent2", "accent3"];
    names.forEach((lab, i) => {
      const E = ctx.el(`card_${i + 1}`, { x: 150 + i * 420, y: 150, w: 360, h: 220, kind: "card" });
      kit.rect(E.inner, 0, 0, 360, 220, { fill: i ? toks[i] : "surface2" });
      kit.text(E.inner, lab, { role: "label", x: 20, y: 0, w: 320, h: 220, align: "center", valign: "middle", weight: 700,
        color: i ? (ctx.style.pickTokenOn ? ctx.style.pickTokenOn(toks[i]) : "field") : "ink" });
      if (i === 0) m.settle(E, 0.1, { dy: 80 });
      else m.spring(E, 0.1, { preset: ["gentle", "snappy", "lively"][i - 1], dy: 80, scale: 0.92 });
    });
    kit.line(ctx.g, 120, 150, 1800, 150, { stroke: "line", sw: 2, dash: "6 8" });
    // the graph: x = progress 0..1, y = position (1 = at rest); overshoot shows as the curve crossing the rest line
    const G = { x: 260, y: 470, w: 1400, h: 440 };
    kit.rect(ctx.g, G.x - 30, G.y - 30, G.w + 60, G.h + 60, { fill: "surface", crisp: true });
    const Y = (v) => G.y + G.h - v * (G.h * 0.78);
    kit.line(ctx.g, G.x, Y(1), G.x + G.w, Y(1), { stroke: "line", sw: 2, dash: "4 6" });
    kit.line(ctx.g, G.x, Y(0), G.x + G.w, Y(0), { stroke: "line", sw: 2 });
    kit.text(ctx.g, "at rest", { role: "caption", x: G.x + G.w - 160, y: Y(1) - 44, w: 160, h: 36, align: "right", color: "muted" });
    curves.forEach((f, i) => {
      let d = "";
      for (let k = 0; k <= 120; k++) { const p = k / 120; d += `${k ? "L" : "M"}${(G.x + p * G.w).toFixed(1)} ${Y(f(p)).toFixed(1)} `; }
      const path = kit.path(ctx.g, d, { stroke: toks[i], sw: i ? 6 : 4 });
      m.draw(path, 0.1, { dur: 1.0 });
    });
  },
});
