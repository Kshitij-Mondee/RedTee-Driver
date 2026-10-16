// @design observer_assumption_withdrawal: an observer presumes an internal motive which is named and then withdrawn leaving the situation unchanged
/*
 * Treatments considered:
 * (A) Split checklist comparing external vs internal causes. Rejected: static and turns narrative scenario into a bullet list.
 * (B) Balance scale weighing workload against dedication. Rejected: introduces ungrounded mechanical metaphor.
 * (C) CHOSEN: Office tableau with returning desk. Observer generates a presumed-motive slip ("Internal motives") above them, gets underlined in rust, bias title unmasks, then the slip withdraws while Jordan and work papers stay unchanged.
 * Animation gate: withdrawing the slip visually demonstrates that the observable situation was neutral all along.
 */
Loom.scene("b06", {
  build(ctx, props) {
    const { kit, m } = ctx;

    // @form bias_label_banner: title banner identifying fundamental attribution bias
    const biasLabel = ctx.el("bias_label", { x: 390, y: 100, w: 1150, h: 100, kind: "card", exit: "wipe" });
    kit.card(biasLabel.inner, 0, 0, 1150, 100, { fill: "surface", r: 16, stroke: "line" });
    kit.kicker(biasLabel.inner, "COGNITIVE PATTERN", { x: 40, y: 16, w: 400, h: 24, color: "muted" });
    kit.text(biasLabel.inner, "Fundamental attribution bias", { role: "lead", x: 40, y: 42, w: 1060, h: 48, maxLines: 1, color: "ink", weight: 700 });
    m.unmask(biasLabel, ctx.cue("fundamental attribution bias"), { dir: "ltr" });

    // @form motive_assumption_slip: observer note with presumed internal motive
    const motiveSlip = ctx.el("motive_assumption", { x: 420, y: 210, w: 600, h: 170, kind: "card", exit: "recede" });
    kit.card(motiveSlip.inner, 0, 0, 600, 170, { fill: "surface", r: 16, stroke: "line" });
    kit.kicker(motiveSlip.inner, "PRESUMED REASON", { x: 36, y: 18, w: 340, h: 24, color: "muted" });
    kit.text(motiveSlip.inner, "Internal motives", { role: "lead", x: 36, y: 50, w: 420, h: 50, maxLines: 1, color: "ink", weight: 700 });
    kit.disc(motiveSlip.inner, 520, 85, 34, { fill: "surface2" });
    kit.text(motiveSlip.inner, "?", { role: "lead", x: 495, y: 60, w: 50, h: 50, align: "center", valign: "middle", color: "muted", weight: 800 });
    const rustUnderline = kit.line(motiveSlip.inner, 36, 108, 360, 108, { stroke: "accent", sw: 5 });

    // Reveals for the motive slip
    m.pop(motiveSlip, ctx.cue("Why assume Jordan lacks dedication"), { overshoot: true });
    m.draw(rustUnderline, ctx.cue("internal motives"), { dur: 0.35 });

    // Withdraw the motive assumption on final cue
    const tWithdraw = ctx.cue("Stop judging internal motives");
    Loom.drive((e) => {
      const sy = Math.max(0.001, 1 - e);
      motiveSlip.inner.setAttribute("transform", "scale(1 " + sy.toFixed(3) + ")");
      motiveSlip.inner.setAttribute("opacity", (1 - e * 0.95).toFixed(3));
    }, tWithdraw, 0.32, "exit", { kind: "withdraw", beat: ctx.beat.id, content: true });

    // @form returning_desk: office desk surface and legs
    const desk = ctx.el("desk", { x: 740, y: 690, w: 820, h: 210, kind: "scenery", exit: "recede" });
    kit.rect(desk.inner, 0, 20, 820, 36, { fill: "surface2", r: 8 });
    kit.line(desk.inner, 10, 22, 810, 22, { stroke: "line", sw: 3 });
    kit.rect(desk.inner, 60, 56, 28, 150, { fill: "muted", r: 4 });
    kit.rect(desk.inner, 730, 56, 28, 150, { fill: "muted", r: 4 });
    kit.rect(desk.inner, 40, 200, 740, 10, { fill: "shadow", r: 5 });

    // @form neutral_work_papers: stacked document and task list on the desk
    const papers = ctx.el("neutral_work_papers", { x: 830, y: 560, w: 320, h: 200, kind: "document", exit: "recede" });
    kit.rect(papers.inner, 10, 40, 170, 140, { fill: "field", r: 6, stroke: "line" });
    kit.line(papers.inner, 30, 70, 150, 70, { stroke: "muted", sw: 4 });
    kit.line(papers.inner, 30, 95, 130, 95, { stroke: "muted", sw: 4 });
    kit.line(papers.inner, 30, 120, 140, 120, { stroke: "muted", sw: 4 });
    kit.rect(papers.inner, 80, 20, 190, 150, { fill: "surface", r: 6, stroke: "line" });
    kit.kicker(papers.inner, "TASKS", { x: 100, y: 36, w: 120, h: 20, color: "muted" });
    kit.line(papers.inner, 100, 75, 240, 75, { stroke: "muted", sw: 4 });
    kit.line(papers.inner, 100, 100, 220, 100, { stroke: "muted", sw: 4 });
    kit.line(papers.inner, 100, 125, 230, 125, { stroke: "muted", sw: 4 });
    kit.line(papers.inner, 100, 150, 180, 150, { stroke: "muted", sw: 4 });

    // @form seated_observer: adult observer figure observing from desk side
    const observer = ctx.el("observer", { x: 480, y: 410, w: 300, h: 490, kind: "character", exit: "recede" });
    kit.rect(observer.inner, 40, 240, 220, 180, { fill: "surface2", r: 16 });
    kit.peep(observer.inner, "woman", "neutral", { x: 25, y: 40, size: 250, flip: true, cloth: "accent2" });
    kit.text(observer.inner, "OBSERVER", { role: "label", x: 0, y: 430, w: 300, h: 40, align: "center", color: "muted", weight: 700 });

    // @form seated_jordan: jordan sitting silently at desk
    const jordan = ctx.el("Jordan", { x: 1220, y: 430, w: 310, h: 470, kind: "character", exit: "recede" });
    kit.rect(jordan.inner, 45, 230, 220, 180, { fill: "surface2", r: 16 });
    kit.peep(jordan.inner, "man", "neutral", { x: 30, y: 40, size: 250, cloth: "accent3" });
    kit.text(jordan.inner, "JORDAN", { role: "label", x: 0, y: 410, w: 310, h: 40, align: "center", color: "muted", weight: 700 });
  },
});
