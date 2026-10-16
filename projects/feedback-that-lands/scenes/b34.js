// @design table_note_built_line_by_line: the camera drops onto the table and a blank note is written one line per phrase as the agreement is spoken
// Holds b32 and b33's room. The place camera pushes onto the table (the near layer swings past, the far layer barely moves),
// a blank note slides in between the update and the table's edge, and its three lines are written on their phrases.
Loom.scene("b34", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = ctx.style, svg = Loom.svg;

    const room = ctx.held("room");
    ["report", "update", "card", "tick_ask", "question", "note_confirm"].forEach((n) => ctx.held(n));
    const maya = ctx.held("maya").__api;
    const R = room.__R, mid = R.layers.mid.g;

    const tAgree = ctx.cue("agree a next step");
    const tL1 = ctx.cue("If a date isn't confirmed");
    const tL2 = ctx.cue("the update says so");
    const tL3 = ctx.cue("says when it will be");

    // the camera pushes down onto the table and stays there into b35, which pulls back. The pinned point sits below the
    // frame so that the table (not that point) lands in the lower middle with the bubble still in frame above it.
    Loom.cam.push(R, { to: [960, 1340], scale: 1.4, t0: ctx.start + 0.1, t1: ctx.start + 1.9 });

    // the next-step note: blank paper, three lines to be written (measured, then drawn)
    // @form tilted_note: a small tilted paper note laid on a surface, carrying lines written one by one
    const lines = ["If a date isn't confirmed,", "the update says so", "and says when it will be"];
    const NW = 450, PADX = 22, TOP = 30, BOT = 16;
    const fits = lines.map((s) => kit.fit(s, { role: "label", w: NW - 2 * PADX, maxLines: 1 }));
    const size = Math.min(...fits.map((f) => f.size));
    const LH = Math.ceil(kit.fit("Ag", { role: "label", size, w: 400, maxLines: 1 }).height);
    const NH = TOP + LH * 3 + BOT, cx = 1235, cy = 893;
    const note = ctx.el("nextstep", { x: cx - NW / 2, y: cy - NH / 2, w: NW, h: NH, kind: "card", parent: mid });
    const paper = S.mix(ctx.c("accent"), ctx.c("surface"), 0.9);
    svg("rect", { x: 6, y: 9, width: NW, height: NH, rx: 6, fill: ctx.c("shadow"), opacity: 0.12 }, note.inner);
    svg("rect", { x: 0, y: 0, width: NW, height: NH, rx: 6, fill: paper, stroke: ctx.c("accent"), "stroke-width": 1.5 }, note.inner);
    svg("rect", { x: 28, y: -10, width: 70, height: 20, rx: 3, fill: S.lighten(ctx.c("line"), 0.45), opacity: 0.55 }, note.inner);   // a strip of tape
    note.outer.setAttribute("transform", `translate(${note.x} ${note.y}) rotate(-2 ${NW / 2} ${NH / 2})`);
    m.converge(note, tAgree, { from: "right", dist: 170, content: true });

    // written on their phrases, left to right
    [[tL1, 0], [tL2, 1], [tL3, 2]].forEach(([t, i]) => {
      const row = ctx.el("nextstep.line" + (i + 1), { x: PADX, y: TOP + i * LH, w: NW - 2 * PADX, h: LH, kind: "text", parent: note.inner });
      kit.text(row.inner, lines[i], { role: "label", size, x: 0, y: 0, w: NW - 2 * PADX, h: LH, valign: "middle", maxLines: 1, color: "ink" });
      m.unmask(row, t, { dur: 1.4, content: true });
    });

    // Maya nods once as the step is agreed
    maya.gesture("nod", tAgree, tAgree + 1.0);
  },
});
