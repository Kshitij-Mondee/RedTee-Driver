// @design written_decisions_complete_the_shared_table: the same meeting table gains a readable written outcome and its final close tick
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments: (A) a new closing board, rejected because the table callback is the payoff.
    // (B) a full email card, rejected because it would cover the team and repeat b12.
    // (C) chosen, keep the table and write the outcome on its clear front while the checklist completes.
    const writeDur = (str) => Loom.style.dur("draw") * Math.max(0.45, Math.min(1.8, String(str).length / 14));
    const tSame = ctx.cue("Same team, same hour.");
    const tDecision = ctx.cue("Now it ends with decisions, owners and dates,");
    const tClose = ctx.cue("read back and sent.");

    const stepsHeld = ctx.held("steps");
    const tableHeld = ctx.held("table");
    const steps = stepsHeld.handle;
    const team = tableHeld.handle;

    // The email and shared bubbles are b12's transient evidence. The table and checklist remain.
    m.exit(ctx.held("sent_today"), tSame, "recede");
    m.exit(ctx.held("bubbles"), tSame, "recede");
    team.clearBubbles(tSame);
    [0, 1, 2, 3].forEach((i) => team.emotion(i, "happy", tSame + i * 0.08));

    // @form decision_list: the specific outcome written on the table's clear front
    const decisionList = ctx.el("decision_list", { x: 180, y: 542, w: 1040, h: 156, kind: "text", exit: "recede", parent: tableHeld.inner });
    const decision = Loom.lesson.decision_line(ctx, decisionList.inner, {
      name: "payoff_decision",
      w: 1000,
      parts: ["Pilot ships in June,", "Priya,", "by Friday"]
    });
    decision.write(tDecision - 0.16);
    const parked = ctx.el("parked_line", { x: 24, y: 78, w: 700, h: 62, kind: "text", exit: "wipe", parent: decisionList.inner });
    kit.text(parked.inner, "Parked: side topic, Lena", { role: "body", x: 0, y: 0, w: 700, h: 62, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(parked, tDecision + 1.32, { dur: writeDur("Parked: side topic, Lena") });

    // @form close_tick: the single green mark in the film, arriving only as the close is named
    steps.setCurrent(2, tClose - 0.1);
    steps.tick(2, tClose, { tone: "pos" });
  },
});
