// @lab {"title": "Object recipe and ink shades (D-90, CINEMA_PLAN B5): the pack's own shading, then recipe (edge, rim, body, light pool, gloss), then ink (flat fill, ink outline)", "styles": ["glow-flat", "editorial-paper"], "dur": 2.0, "times": [1.5]}
// Three rows of the same discs and blocks: the pack's own shading, {shade: "recipe"} and {shade: "ink"}. Opt-in per
// call, so existing lessons draw exactly as before.
Loom.scene("lab_shades", {
  build(ctx) {
    const { kit } = ctx;
    const cols = ["accent", "accent2", "accent3", "accent4", "surface"];
    [["pack", null], ["recipe", "recipe"], ["ink", "ink"]].forEach(([label, shade], r) => {
      const E = ctx.el("row_" + label, { x: 80, y: 60 + r * 330, w: 1760, h: 300, kind: "group" });
      kit.text(E.inner, label, { x: 0, y: 110, w: 200, h: 60, role: "label", color: "muted" });
      cols.forEach((c, i) => {
        kit.disc(E.inner, 330 + i * 300, 130, 95, { fill: c, shade });
        kit.rect(E.inner, 430 + i * 300 - 60, 200, 120, 80, { fill: c, r: 16, shade });
      });
    });
  },
});
