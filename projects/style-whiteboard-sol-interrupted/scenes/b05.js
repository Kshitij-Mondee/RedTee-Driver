// @design correction_by_accumulation: a crossed line remains above a newly written question, with one underline directing attention
// Treatments: static before/after with signalling; replace the whole card; chosen strike and write onto the held card, since the correction is the argument.
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    // @form held_checklist: the current phase stays in view
    const steps = ctx.held("steps");
    // @form held_invite: the existing subject becomes an answerable question
    const invite = ctx.held("invite");
    const h = invite.handle;
    if (!h || !h.strike || !h.rewrite || !h.guests) {
      throw new Error("b05 requires b04 invite.handle with strike, rewrite and guests");
    }
    const circle = ctx.held("subject_circle");
    const note = ctx.held("subject_note");
    if (circle) m.exit(circle, ctx.start, "recede");
    if (note) m.exit(note, ctx.start, "wipe");
    const tStrike = ctx.cue("Write the decision as a question");
    const tQuestion = ctx.cue("May or June");
    const tGuests = ctx.cue("people come ready to answer");
    h.strike(tStrike);
    h.rewrite("May or June?", tQuestion);
    const b = h.rewriteBox;
    const draw = ctx.style.dur("draw");
    const writeDur = draw * Math.max(0.45, Math.min(1.8, "May or June?".length / 14));
    // @form question_underline: the question is the one marked focal point
    const underline = ctx.el("question_underline", {
      x: b.x - 6, y: b.y + b.h - 8, w: b.w + 24, h: 30,
      kind: "mark", exit: "recede", parent: invite.inner
    });
    const w = b.w + 24;
    kit.sketch(underline.inner, "path", ["M8 14 C " + (w * 0.3) + " 8, " + (w * 0.65) + " 19, " + (w - 8) + " 12"], {
      fill: "none", stroke: "accent", sw: 5.5
    });
    m.draw(underline, tQuestion + writeDur, {
      dur: draw * Math.max(0.3, Math.min(1.4, b.w / 900))
    });
    h.guests(tGuests);
    // Held objects and exposed handles remain the same objects for b06.
    steps.exit = "recede";
    invite.exit = "recede";
  }
});
