// @lab {"title": "Data as objects (D-114): a share stamped as a count of people on a neutral grid, a pile that grows while its counter rides on top, a seeded flood that fills a region to a share from its bottom edge. Sample values only", "styles": ["story-cartoon", "engineering"], "dur": 6.0, "times": [0.6, 1.4, 2.1, 2.8, 3.6, 5.6]}
// A lab scene for the D-114 data builders. Every value here is a SAMPLE (it says so on screen): a lesson passes
// values its script grounds, and Loom.report.data records them (stamp, pile, flood) for the number checks.
Loom.scene("lab_data_objects", {
  build(ctx) {
    const D = Loom.data, { kit } = ctx;
    D.stamp(ctx, "share", { x: 110, y: 130, w: 600, h: 600, n: 100, cols: 10, share: 0.37, unit: "person", token: "accent", t: 1.2, gridT: 0.2 });
    D.tag(ctx, "share_tag", { x: 110, y: 770, text: "37 OF 100 (SAMPLE)", color: "accent", t: 3.4 });
    D.pile(ctx, "total", { x: 820, y: 150, w: 320, h: 680, unit: "coin", count: 36, to: 1200, prefix: "$", t: 1.0, dur: 3.0, label: "SAMPLE TOTAL", token: "accent4" });
    D.flood(ctx, "crowd", { region: { x: 1250, y: 150, w: 560, h: 560 }, glyph: "person", size: 56, share: 0.6, seed: 7, t: 1.4, dur: 2.4, token: "accent2" });
    kit.text(ctx.g, "60 PERCENT FILLED (SAMPLE)", { x: 1250, y: 740, w: 560, h: 50, role: "label", color: "muted", align: "center", tracking: 1 });
  },
});
