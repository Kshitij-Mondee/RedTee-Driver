// @lab {"title": "Formula (KaTeX)", "dur": 4, "libs": ["katex"], "times": [0.3, 1.0, 1.8, 2.6, 3.4, 3.9]}
// A capability proof: a typeset formula wiped in left to right, then its key term marked.
export async function build(ctx, P) {
  const el = P.tex(String.raw`d = c \cdot \Delta t \quad\Rightarrow\quad \Delta t = \frac{20\,200\ \text{km}}{c}`, { size: 72, color: "ink" });
  await document.fonts.ready;
  const r = el.getBoundingClientRect();
  el.style.left = (P.w - r.width) / 2 + "px"; el.style.top = (P.h - r.height) / 2 + "px";
  return { render(t) { const k = P.ease.out(P.seg(t, 0.2, 2.6)); el.style.clipPath = `inset(-20px ${(1 - k) * 100}% -20px -20px)`; } };
}
