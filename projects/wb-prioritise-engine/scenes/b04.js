// @design two_questions_become_a_decision_matrix
Loom.scene("b04", {
  build(ctx) {
    // Treatments: A labels at the future axis ends. B centred question cards. C a split prompt. Choose A because the next beat grows directly from these labels.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const tImpact = ctx.cue("How much difference will it make?");
    const tEffort = ctx.cue("How much work will it take?");

    // @form q_impact: impact question at future vertical axis
    const impact = ctx.el("q_impact", { x: 120, y: 90, w: 360, h: 80, kind: "text", exit: "recede" });
    B.write(impact, "Impact?", { role: "title", at: tImpact, by: tImpact + 0.8 });
    // @form impact_underline: accent mark under impact question
    const impactUnderline = ctx.el("impact_underline", { x: 120, y: 166, w: 260, h: 18, kind: "mark", exit: "recede" });
    B.draw(impactUnderline, W.underline(0, 240, 6), { at: tImpact + 0.7, pen: "accent" });
    // @form gloss_impact: muted explanation of impact
    const glossImpact = ctx.el("gloss_impact", { x: 125, y: 184, w: 270, h: 44, kind: "text", exit: "recede" });
    ctx.kit.text(glossImpact.inner, "difference it makes", { role: "label", x: 0, y: 0, w: 270, h: 44, color: "muted", maxLines: 1 });
    m.unmask(glossImpact, tImpact + 0.72, { dir: "ltr", dur: 0.7 });

    // @form q_effort: effort question at future horizontal axis
    const effort = ctx.el("q_effort", { x: 1000, y: 862, w: 300, h: 66, kind: "text", exit: "recede" });
    B.write(effort, "Effort?", { role: "title", at: tEffort, by: tEffort + 0.7 });
    // @form gloss_effort: muted explanation of effort
    const glossEffort = ctx.el("gloss_effort", { x: 1005, y: 818, w: 190, h: 38, kind: "text", exit: "recede" });
    ctx.kit.text(glossEffort.inner, "work it takes", { role: "label", x: 0, y: 0, w: 190, h: 38, color: "muted", maxLines: 1 });
    m.unmask(glossEffort, tEffort + 0.62, { dir: "ltr", dur: 0.65 });
  },
});
