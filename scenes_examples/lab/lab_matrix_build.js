// @lab {"title": "One diagram that fills the frame and builds: a 2x2 filled cell by cell, pointer labels, the open cell asked last", "styles": ["presenter-pop", "corporate-clean"], "dur": 6.4, "times": [0.5, 1.4, 2.4, 3.4, 4.5, 6.0]}
// A lab scene for the presenter-documentary register (docs/research/2026-10-01-visual-study.md): the diagram is
// the whole frame, the axes are named with pointer labels, each cell is filled as it is spoken about (the cell
// being discussed in the accent, the others calm), a marker moves into the cell in question, and the last cell
// is left as the question. The same board can come back later with one change (a revisit, not a new slide).
Loom.scene("lab_matrix_build", {
  build(ctx) {
    const { kit, m } = ctx;
    const X = 380, Y = 150, CW = 650, CH = 380, GAP = 10;
    const cells = [];
    const text = ["Routine", "Safe, slower", "Small risk", "?"];
    for (let i = 0; i < 4; i++) {
      const cx = X + (i % 2) * (CW + GAP), cy = Y + Math.floor(i / 2) * (CH + GAP);
      const c = ctx.el(`cell_${i + 1}`, { x: cx, y: cy, w: CW, h: CH, kind: "card" });
      kit.rect(c.inner, 0, 0, CW, CH, { fill: "field2", r: 4 });
      const hi = ctx.el(`cell_${i + 1}_on`, { x: 0, y: 0, w: CW, h: CH, kind: "shape", parent: c.inner });
      kit.rect(hi.inner, 0, 0, CW, CH, { fill: i === 3 ? "accent2" : "accent", r: 4 });
      const t = ctx.el(`cell_${i + 1}_text`, { x: 30, y: CH / 2 - 100, w: CW - 60, h: 200, kind: "text", parent: c.inner });
      kit.text(t.inner, text[i], { role: i === 3 ? "display" : "title", x: 0, y: 0, w: CW - 60, h: 200, align: "center", valign: "middle", weight: 700, color: "onAccent" });
      cells.push({ c, hi, t });
    }
    // the frame first (the empty grid), then the axis labels as pointer pills
    cells.forEach((k, i) => m.reveal(k.c, 0.15 + i * 0.06));
    const pill = (name, x, y, w, label, t, dir) => {
      const E = ctx.el(name, { x, y, w, h: 56, kind: "label" });
      kit.pill(E.inner, 0, 0, w, 56, { fill: "accent3" });
      kit.text(E.inner, label, { role: "label", x: 18, y: 8, w: w - 36, h: 40, align: "center", valign: "middle", weight: 700, color: "ink" });
      const pt = dir === "right" ? [[w, 18], [w + 22, 28], [w, 38]] : [[w / 2 - 14, 56], [w / 2, 76], [w / 2 + 14, 56]];   // the pointer says which edge it names
      kit.polygon(E.inner, pt, { fill: "accent3" });
      m.pop(E, t);
      return E;
    };
    pill("ax_checked", 80, Y + CH / 2 - 28, 270, "Checked", 0.6, "right");
    pill("ax_not", 80, Y + CH + GAP + CH / 2 - 28, 270, "Not checked", 0.8, "right");
    pill("ax_low", X + CW / 2 - 130, Y - 76, 260, "Low value", 1.0, "down");
    pill("ax_high", X + CW + GAP + CW / 2 - 130, Y - 76, 260, "High value", 1.2, "down");
    // the cell being discussed is the accent; the ones already said calm down, so one thing is loud at a time
    const T = [1.6, 2.3, 3.0, 4.2];
    T.forEach((t, i) => {
      m.reveal(cells[i].hi, t, { dy: 0 }); m.reveal(cells[i].t, t + 0.12);
      if (i > 0) Loom.tween(cells[i - 1].hi.outer, { opacity: 1 }, { opacity: 0.42, duration: 0.3 }, t, { kind: "dim", beat: null });
    });
    // a marker (the case we are following) travels into the cell in question
    const dot = ctx.el("case", { x: X - 300, y: Y + CH + GAP + CH / 2 - 34, w: 68, h: 68, kind: "shape" });
    kit.disc(dot.inner, 34, 34, 30, { fill: "accent3" });
    m.pop(dot, 3.6);
    m.travel(dot, 4.0, { x: 300 + CW + GAP + CW / 2, y: CH / 2 - 86, dur: 0.8 });   // travel is an offset from where it stands
  },
});
