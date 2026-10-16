// @lab {"title": "Highlighted code typed in (Shiki tokens)", "dur": 5, "libs": [], "times": [0.3, 1.2, 2.1, 3.0, 3.9, 4.9], "params": {"code": {"lang": "python", "theme": "github-light", "code": "def distance(delay_s):\n    c = 299_792_458  # m/s\n    return delay_s * c\n\nprint(distance(0.067))"}}}
// A capability proof: the code is highlighted by Shiki before the render (the bridge), then typed in by t.
export async function build(ctx, P) {
  const blk = P.code(ctx.params.code[0], { size: 40 });
  blk.show(1);   // measure the whole block once, so it is placed where it ends, not where its first letter is
  const r = blk.el.getBoundingClientRect();
  blk.el.style.left = (P.w - r.width) / 2 + "px"; blk.el.style.top = (P.h - r.height) / 2 + "px";
  return { render(t) { blk.show(P.seg(t, 0.2, 4.4)); } };
}
