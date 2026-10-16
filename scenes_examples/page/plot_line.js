// @lab {"title": "Chart from data (Observable Plot)", "dur": 5, "libs": ["plot"], "times": [0.4, 1.4, 2.4, 3.4, 4.4, 4.9]}
// A capability proof: a line drawn point by point and an axis, re-planned by Plot each frame from the data up to t.
// The values are an example series made here (a lesson's numbers come from its knowledge sheet).
export async function build(ctx, P) {
  const data = Array.from({ length: 24 }, (_, i) => ({ month: i + 1, value: 40 + 18 * Math.sin(i / 3.5) + i * 1.6 }));
  return {
    render(t) {
      const n = Math.max(2, Math.round(P.lerp(2, data.length, P.ease.inOut(P.seg(t, 0.3, 4.2)))));
      P.plot({
        marginLeft: 70, marginBottom: 56, x: { domain: [1, 24], label: "month" }, y: { domain: [0, 100], grid: true, label: "value" },
        color: { range: [ctx.c("accent")] },
        marks: [Plot.ruleY([0]), Plot.lineY(data.slice(0, n), { x: "month", y: "value", stroke: ctx.c("accent"), strokeWidth: 4 }),
          Plot.dot(data.slice(n - 1, n), { x: "month", y: "value", r: 8, fill: ctx.c("accent") })],
      });
    },
  };
}
