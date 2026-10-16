// @design matrix_questions: two written prompts reserve the board's future axes
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const writeDur = (str) => S.dur("draw") * Math.max(0.45, Math.min(1.8, String(str).length / 14));

    // Treatments considered: a sparse axis preview, a centred question pair, or labels in their final axis homes. Chosen: final homes, so the next board grows from these marks.
    const tImpact = ctx.cue("How much difference");
    const tEffort = ctx.cue("How much work");

    // @form q_impact: future vertical-axis question
    const qImpact = { E: ctx.el("q_impact", { x: 120, y: 82, w: 300, h: 100, kind: "text", exit: "wipe" }) };
    kit.text(qImpact.E.inner, "Impact?", { role: "title", x: 0, y: 0, w: 300, h: 100, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(qImpact.E, tImpact - 0.08, { dir: "ltr", dur: writeDur("Impact?") });

    // @form impact_underline: single accent emphasis under the impact question
    const impactUnderline = ctx.el("impact_underline", { x: 18, y: 62, w: 188, h: 16, kind: "mark", exit: "recede", parent: qImpact.E });
    kit.sketch(impactUnderline.inner, "path", ["M0 9 Q92 2 184 8"], { fill: "none", stroke: "accent", sw: 6 });
    m.draw(impactUnderline, tImpact + 0.42, { dur: S.dur("draw") * 0.3 });

    // @form gloss_impact: muted clarification beneath the first question
    const glossImpact = ctx.el("gloss_impact", { x: 210, y: 174, w: 210, h: 40, kind: "text", exit: "wipe" });
    kit.text(glossImpact.inner, "difference it makes", { role: "label", x: 0, y: 0, w: 210, h: 40, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(glossImpact, tImpact + 0.48, { dir: "ltr", dur: writeDur("difference it makes") });

    // @form q_effort: future horizontal-axis question
    const qEffort = { E: ctx.el("q_effort", { x: 1000, y: 836, w: 200, h: 92, kind: "text", exit: "wipe" }) };
    kit.text(qEffort.E.inner, "Effort?", { role: "title", x: 0, y: 0, w: 200, h: 92, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(qEffort.E, tEffort - 0.08, { dir: "ltr", dur: writeDur("Effort?") });

    // @form gloss_effort: muted clarification beneath the second question
    const glossEffort = ctx.el("gloss_effort", { x: 1210, y: 884, w: 200, h: 40, kind: "text", exit: "wipe" });
    kit.text(glossEffort.inner, "work it takes", { role: "label", x: 0, y: 0, w: 200, h: 40, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(glossEffort, tEffort + 0.17, { dir: "ltr", dur: writeDur("work it takes") });
  },
});
