// @lab {"title": "Data as a picture (D-90, CINEMA_PLAN B3): a counter that runs, as many things as the quantity, bars over the scene, a line with its event marked. Sample values only", "styles": ["glow-flat", "editorial-paper"], "dur": 5.0, "times": [0.9, 2.2, 4.6]}
// A lab scene for Loom.data. Every value here is a SAMPLE (it says so on screen): a lesson passes values its
// script grounds, and Loom.report.data records them for the checks.
Loom.scene("lab_data", {
  build(ctx) {
    const D = Loom.data;
    D.counter(ctx, "count", { x: 80, y: 70, w: 820, to: 125000, caption: "SAMPLE COUNTER", t: 0.2, dur: 2.0 });
    D.unitGrid(ctx, "homes", { x: 1060, y: 60, w: 760, h: 300, n: 40, cols: 10, lit: 28, unit: "house", color: "accent4", t: 0.4 });
    D.tag(ctx, "homes_tag", { x: 1060, y: 380, text: "28 OF 40 SAMPLE", color: "accent4", textColor: "ink", t: 1.6 });
    D.barsOn(ctx, "bars", { x: 80, y: 560, w: 860, title: "SAMPLE BARS", unit: "units", bars: [{ label: "before", value: 415 }, { label: "after", value: 945, color: "neg" }], t: 1.0 });
    D.dipLine(ctx, "line", { x: 1040, y: 520, w: 820, h: 380, title: "sample series, simplified", base: 0, values: [0, -0.1, 0.05, -0.2, -0.15, -0.3, -0.9, -0.4, -0.2, -0.1],
      labels: ["1", "", "3", "", "5", "", "7", "", "9", ""], mark: { i: 6, label: "event" }, t: 1.2, dur: 2.2 });
  },
});
