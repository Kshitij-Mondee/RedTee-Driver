// @lab {"title": "blueprint ENGINE, the detail register: a gate valve drafted in order, a moving part measured live, FIG 1 rewritten to FIG 2 (exploded), the title block's verdict", "styles": ["blueprint"], "dur": 26.0, "times": [2.2, 5.6, 9.4, 13.2, 17.4, 21.2, 25.4]}
/* The blueprint engine's DETAIL register (2026-10-16): the dense sheet, for the moments that show how a thing is built or
 * how a part moves. Drafting order (centre lines, paper and outline, detail, hidden edges, hatching), then the
 * annotations (dimensions, balloons), then the moving part with a live dimension, a figure rewrite into an exploded view,
 * and the verdict stamped in the title block. A lesson uses this register for a few beats, not all of them: the teaching
 * register (bp_engine_teach) carries the explaining. Compare within the style only (D-122). */
Loom.scene("bp_engine_detail", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);

    // ---- the sheet's border and its figure label
    const border = ctx.el("sheet_border", { x: 40, y: 28, w: 1840, h: 904, kind: "mark", exit: "recede" });
    let t = D.border(border, { at: 0.2, dur: 1.2, cols: 8, rows: 4 });
    const fig = ctx.el("fig", { x: 120, y: 78, w: 640, h: 120, kind: "text", exit: "wipe" });
    const F = D.fig(fig, "Fig. 1", { sub: "Gate valve, elevation", at: 1.2 });

    // ---- the valve body, drafted in order (element-local px; the bore runs left to right)
    const body = ctx.el("valve_body", { x: 420, y: 470, w: 560, h: 360, kind: "card", exit: "recede" });
    t = D.part(body, {
      centre: [].concat(W.centre(-50, 180, 610, 180), W.centre(280, -40, 280, 360)),
      outline: [].concat(W.rect(0, 40, 70, 280), W.rect(490, 40, 70, 280), W.rect(70, 80, 420, 200)),
      detail: [].concat(W.circle(35, 70, 9), W.circle(35, 290, 9), W.circle(525, 70, 9), W.circle(525, 290, 9)),
      hidden: [].concat(W.hidden([[0, 130], [560, 130]]), W.hidden([[0, 230], [560, 230]])),
    }, { at: 3.2, by: 7.6 });

    // ---- the bonnet (a separate part: it will leave in the exploded view)
    const bonnet = ctx.el("bonnet", { x: 420, y: 470, w: 560, h: 360, kind: "card", exit: "recede" });
    t = D.part(bonnet, {
      outline: [].concat(W.rect(200, 0, 160, 80), W.rect(232, -150, 96, 150)),
      detail: [].concat(W.line(280, -240, 280, -150, { weight: "detail" }), W.rect(170, -262, 220, 22)),
    }, { at: t + 0.1, by: 9.2 });

    // ---- the gate: the moving part, hatched (it is cut by the section line)
    const gate = ctx.el("gate", { x: 420, y: 470, w: 560, h: 360, kind: "card", exit: "recede" });
    t = D.part(gate, { outline: W.rect(250, 88, 60, 184), hatch: W.hatch([[250, 88], [310, 88], [310, 272], [250, 272]], { spacing: 11 }) }, { at: t + 0.1, by: 10.4 });
    const sec = ctx.el("section_aa", { x: 420, y: 470, w: 560, h: 360, kind: "mark", exit: "recede" });
    D.section(sec, 280, -300, 280, 340, { label: "A", look: "left", at: 10.5, by: 11.4 });

    // ---- annotations: overall length, then balloons on leaders that end on their parts
    const dims = ctx.el("dims", { x: 420, y: 470, w: 560, h: 360, kind: "label", exit: "wipe" });
    D.dim(dims, 0, 320, 560, 320, { off: 60, value: 400, unit: "mm", at: 11.6 });
    const lift = D.dim(dims, 310, 272, 310, 180, { off: -150, side: "left", value: 0, unit: "mm", at: 12.4 });
    const tags = ctx.el("balloons", { x: 0, y: 0, w: 1920, h: 1080, kind: "label", exit: "wipe" });
    let tb = D.balloon(tags, 1, 1120, 520, { to: [910, 570], at: 13.4 });
    tb = D.balloon(tags, 2, 1120, 380, { to: [748, 430], at: tb });
    tb = D.balloon(tags, 3, 300, 670, { to: [690, 650], at: tb });

    // ---- the moving part: the gate lifts 90 px while its dimension counts to the same opening
    ctx.m.travel(gate, 15.4, { x: 0, y: -90, dur: 1.4 });
    lift.set(90, 15.4, 1.4);

    // ---- FIG. 1 becomes FIG. 2: the bonnet and gate leave upward in turn, then return
    F.next("Fig. 2", "Exploded view", 17.2);
    D.explode([{ el: bonnet, dy: -150 }, { el: gate, dy: -120 }], { at: 18.2, gap: 0.25, dur: 0.8, back: 21.0, backGap: 0.2 });

    // ---- the title block, and the verdict stamped once
    const tblock = ctx.el("title_block", { x: 1420, y: 700, w: 420, h: 200, kind: "card", exit: "recede" });
    const TB = D.titleBlock(tblock, [["Title", "Gate valve DN100"], ["Drawn", "Loom"], ["Scale", "1 : 4"], ["Status", ""]], { at: 22.2, dur: 0.6 });
    TB.fill(3, "Released", 23.5, "accent4");
    TB.stamp("Approved", { tone: "accent4", at: 24.6, x: 250, y: -70 });
  },
});
