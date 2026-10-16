// @lab {"title": "Outline glyphs in the style's face, morphing (opentype.js + paper.js)", "dur": 4, "libs": ["opentype", "paper"], "times": [0.3, 1.0, 1.7, 2.4, 3.1, 3.9]}
// A capability proof: two words as outline paths in the lesson's display face, one becoming the other.
export async function build(ctx, P) {
  const a = await P.glyphs("RISK", "display", 260), b = await P.glyphs("SAFE", "display", 260);
  const svg = P.svg();
  const g = P.el("g", { transform: `translate(${P.w / 2 - 330},${P.h / 2 + 90})` }, svg);
  const p = P.el("path", { fill: ctx.c("accent"), "fill-rule": "evenodd" }, g);
  return { render(t) { p.setAttribute("d", P.morph(a, b, P.ease.inOut(P.seg(t, 0.8, 3.0)))); } };
}
