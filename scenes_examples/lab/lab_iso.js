// @lab {"title": "SVG isometric kit: a system on a planning board; boxes extrude, flows draw, labels arrive (painter's order holds)", "styles": ["corporate-clean", "whiteboard", "cinematic-noir"], "dur": 4.2, "times": [0.3, 0.9, 1.6, 2.4, 4.0]}
// A lab scene: absolute times. Three services and a store on an iso board. Every face is shaded from one token.
Loom.scene("lab_iso", {
  build(ctx) {
    const { m } = ctx;
    const iso = ctx.iso({ x0: 960, y0: 250, unit: 78 });
    const board = iso.tile("board", -1, -1, 10, 8, { fill: "surface2" });
    const grid = iso.grid("grid", -1, -1, 10, 8, 1);
    const nodes = [
      ["app", 0, 0, 2, 2, 1.0, "accent", "monitor-smartphone", "Web app"],
      ["api", 4, 0, 2, 2, 1.6, "accent2", "server", "API"],
      ["queue", 4, 4, 2, 2, 0.7, "accent3", "layers", "Queue"],
      ["db", 0, 4, 2, 2, 2.2, "accent4", "database", "Orders DB"],
    ];
    const E = {};
    nodes.forEach(([id, x, y, w, d, h, fill, icon], i) => { E[id] = iso.box(id, x, y, 0, w, d, h, { fill, icon }); });
    const flows = [["f1", [2, 1, 0.5], [4, 1, 0.5]], ["f2", [5, 2, 0.4], [5, 4, 0.4]], ["f3", [4, 5, 0.3], [2, 5, 0.3]]];
    const F = flows.map(([id, a, b]) => iso.arrow(id, a, b, { stroke: "ink" }));
    const L = nodes.map(([id, x, y, w, d, h, , , label]) => iso.label(`${id}_label`, x + w / 2, y + d / 2, h, label, { lift: 90 + h * 20 }));
    iso.done();
    m.reveal(board, 0.05, { dy: 0 }); m.reveal(grid, 0.15, { dy: 0 });
    nodes.forEach(([id], i) => m.grow(E[id], 0.3 + i * 0.22));
    F.forEach((f, i) => { m.reveal(f, 1.3 + i * 0.35, { dy: 0, dur: 0.01 }); m.draw(f.path, 1.3 + i * 0.35, { dur: 0.5 }); m.reveal({ inner: f.head }, 1.75 + i * 0.35, { dy: 0 }); });
    L.forEach((l, i) => m.reveal(l, 2.4 + i * 0.12));
  },
});
