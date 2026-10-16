// @design written_decision_finishes_the_shared_table
// Treatments considered: (A) replace the table with a closing card, rejected because the payoff needs the same team; (B) show only the green checklist, rejected because the written record is the proof; (C) chosen, retain the table and write the two final lines across its front.
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);

    const tSame = ctx.cue("Same team, same hour.");
    const tWritten = ctx.cue("decisions, owners and dates");
    const tClose = ctx.cue("read back and sent.");

    const steps = ctx.held("steps");
    const table = ctx.held("table");
    // b12 owns the transient mail and bubble elements, so their own beat life ends them as this continuation starts.
    if (table.handle && table.handle.clearBubbles) table.handle.clearBubbles(tSame);
    if (table.handle && table.handle.emotion) {
      [0, 1, 2, 3].forEach((i) => table.handle.emotion(i, "happy", tSame));
    }

    // @form decision_list: two concrete lines written into the free front of the retained meeting table
    const decisionList = ctx.el("decision_list", { x: 230, y: 800, w: 1120, h: 120, kind: "text", exit: "wipe" });
    const first = ctx.el("decision_list_first", { x: 0, y: 0, w: 1120, h: 56, kind: "text", exit: "wipe", parent: decisionList.inner });
    kit.text(first.inner, "Pilot ships in June, Priya, by Friday", { role: "body", x: 0, y: 0, w: 1120, h: 56, maxLines: 1, valign: "middle", color: "ink", align: "center" });
    const second = ctx.el("decision_list_second", { x: 0, y: 60, w: 1120, h: 56, kind: "text", exit: "wipe", parent: decisionList.inner });
    kit.text(second.inner, "Parked: side topic, Lena", { role: "body", x: 0, y: 0, w: 1120, h: 56, maxLines: 1, valign: "middle", color: "ink", align: "center" });
    m.unmask(first, tWritten - 0.2, { dur: writeDur("Pilot ships in June, Priya, by Friday") });
    m.unmask(second, tWritten + 1.45, { dur: writeDur("Parked: side topic, Lena") });

    // @form close_tick: the one green marker in the film, drawn only after the written record is complete
    if (steps.handle && steps.handle.tick) steps.handle.tick(2, tClose, { tone: "pos" });
  },
});
