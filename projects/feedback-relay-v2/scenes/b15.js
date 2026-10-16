// @design card_missing_step: a card of three parts, two ticked, the vague one circled and the third disc left empty
Loom.scene("b15", {
  build(ctx) {
    const { kit, m } = ctx;
    const CX = 360, CY = 150, CW = 1200, CH = 640;
    const card = ctx.el("card_c", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    kit.card(card.inner, 0, 0, CW, CH, { fill: "surface", r: 28, stroke: "ink", shadow: true });
    kit.text(card.inner, "C", { x: 40, y: 14, w: 160, h: 100, role: "lead", color: "ink", weight: 800 });
    const rows = [
      ["Skipped agenda", "accent3"],
      ["decision slipped", "field2"],
      ["be more prepared", "accent4"],
    ];
    const rh = 148, ry0 = 130;
    rows.forEach((r, i) => {
      const y = ry0 + i * (rh + 20);
      kit.rect(card.inner, 40, y, CW - 80, rh, { fill: r[1], r: 20 });
      kit.text(card.inner, r[0], { x: 230, y: y + 10, w: 560, h: rh - 20, role: "lead", valign: "middle", color: "ink" });
    });
    m.reveal(card, ctx.cue("C is tempting"), { dy: 40 });

    const disc = (name, i, kind) => {
      const cy = ry0 + i * (rh + 20) + rh / 2;
      const E = ctx.el(name, { x: CX + 70, y: CY + cy - 45, w: 90, h: 90, kind: "icon", exit: "recede" });
      if (kind === "tick") {
        kit.disc(E.inner, 45, 45, 42, { fill: "pos" });
        kit.path(E.inner, "M26 46 L40 60 L66 32", { stroke: "surface", sw: 9, fill: "none" });
      } else {
        kit.disc(E.inner, 45, 45, 42, { fill: "field" });
        kit.path(E.inner, "M45 3 A42 42 0 1 1 44.9 3", { stroke: "muted", sw: 4, dash: "8 8", fill: "none" });
      }
      return E;
    };
    const t1 = disc("tick_behaviour", 0, "tick");
    const t2 = disc("tick_effect", 1, "tick");
    const t3 = disc("empty_disc", 2, "empty");
    const tt = ctx.cue("tempting");
    m.drop(t1, tt + 0.1);
    m.drop(t2, tt + 0.17);
    m.reveal(t3, ctx.cue("but has no step"));

    const sy = CY + ry0 + 2 * (rh + 20);
    const pts = [];
    for (let k = 0; k <= 34; k++) { const a = -2.3 + k * 0.2; pts.push([430 + 290 * Math.cos(a) * (1 + k * 0.004), 90 + 72 * Math.sin(a)]); }
    Loom.brush.paint(ctx, "circle_step", { x: CX + 100, y: sy - 20, w: 800, h: rh + 40, seed: 5, layers: [
      { at: ctx.cue("but has no step"), dur: 0.8, dir: "right", draw: (b) => {
        b.set("marker", ctx.c("accent"), 2.5); b.noFill();
        for (let k = 0; k < pts.length - 1; k++) b.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]);
      } },
    ] });

    const tag = ctx.el("no_step_tag", { x: CX + CW - 330, y: sy + 24, w: 260, h: 100, kind: "label", exit: "recede" });
    kit.pill(tag.inner, 0, 0, 260, 100, { fill: "accent", r: 20 });
    kit.text(tag.inner, "No step", { x: 10, y: 10, w: 240, h: 80, role: "lead", align: "center", valign: "middle", color: Loom.style.pickTokenOn("accent") });
    m.drop(tag, ctx.cue("no step"));
  },
});
