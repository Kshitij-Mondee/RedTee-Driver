// @lab {"title": "Path morph (D-114): a morph chain with colour handoff, subpaths that merge and a hole that grows, then a fill join into the next field", "styles": ["story-cartoon", "corporate-clean"], "dur": 6.0, "times": [0.75, 1.1, 2.05, 2.6, 3.55, 3.95, 5.6]}
// A lab scene: absolute times, no narration. Left: ONE path becomes circle > star > rounded rect, its fill handing
// from token to token on the same progress. Right: two discs merge into one bar (the smaller subpath shrinks into its
// partner), then the bar becomes a hexagon ring (the hole grows from the centre). Then the rounded rect itself grows
// into the whole frame in ink: the fill join a next scene would start on.
Loom.scene("lab_morph", {
  build(ctx) {
    const { kit, m } = ctx;
    const Mo = Loom.morph;
    kit.text(ctx.g, "One path, three shapes", { role: "label", x: 120, y: 120, w: 720, h: 50, align: "center" });
    kit.text(ctx.g, "Two become one, a hole grows", { role: "label", x: 1060, y: 120, w: 720, h: 50, align: "center" });

    // the chain: circle > star > rounded rect, fill accent > accent2 > accent3
    const box = { x: 280, y: 260, w: 400, h: 400 };
    const p = Mo.path(ctx.g, Mo.shape("circle", box), { fill: "accent" });
    Mo.chain(p, [{ kind: "star", box, n: 5, inner: 0.5 }, { kind: "rect", box: { x: 290, y: 320, w: 380, h: 280 }, r: 48 }], [0.4, 1.7],
      { fills: ["accent2", "accent3"], dur: 0.9 });

    // subpaths: two discs > one bar > a hexagon ring (outer + hole)
    const two = Mo.shape("circle", { x: 1150, y: 370, w: 180, h: 180 }) + Mo.shape("circle", { x: 1510, y: 370, w: 180, h: 180 });
    const q = Mo.path(ctx.g, two, { fill: "accent4" });
    const bar = Mo.shape("rect", { x: 1150, y: 390, w: 540, h: 140 }, { r: 70 });
    const ring = Mo.shape("polygon", { x: 1250, y: 290, w: 340, h: 340 }, { n: 6, rot: 0 }) + Mo.reverse(Mo.shape("circle", { x: 1345, y: 385, w: 150, h: 150 }));   // reversed = a hole
    Mo.chain(q, [bar, ring], [0.4, 1.7], { fills: ["accent", "accent2"], dur: 0.9 });

    // the fill join: the rounded rect grows into the whole frame and becomes the next field (ink)
    const F = Mo.fill(ctx, "next_field", { from: p, t: 3.2, token: "ink" });
    const T = ctx.el("next_title", { x: 360, y: 470, w: 1200, h: 140, kind: "text" });
    kit.text(T.inner, "The next scene starts on this field", { role: "title", x: 0, y: 0, w: 1200, h: 140, align: "center", valign: "middle", color: "field" });
    m.reveal(T, F.endT + 0.2);
  },
});
