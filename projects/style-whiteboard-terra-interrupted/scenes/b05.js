// @design correction_preserves_the_old_subject_while_a_decision_question_is_written_below
// Treatments considered: (A) erase and replace, rejected because the old subject must remain visible. (B) a new invite card, rejected because this beat continues the same card. (C) chosen, strike the existing subject, write the question below it, then underline the choice point.
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);

    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const subjectCircle = ctx.held("subject_circle");
    const subjectNote = ctx.held("subject_note");

    // The b04 annotation clears first. The card, checklist and original title remain.
    m.exit(subjectCircle, ctx.start + 0.12, "recede");
    m.exit(subjectNote, ctx.start + 0.12, "recede");

    const tQuestion = ctx.cue("Write the decision as a question instead.");
    const tRewrite = ctx.cue("May or June");
    const tGuests = ctx.cue("people come ready to answer");

    invite.handle.strike(tQuestion);
    invite.handle.rewrite("May or June?", tRewrite);

    // @form question_underline: the one accent mark under the rewritten decision choice
    const box = invite.handle.rewriteBox;
    const questionUnderline = ctx.el("question_underline", {
      x: box.x - 4, y: box.y + box.h - 2, w: box.w + 16, h: 30,
      kind: "mark", exit: "recede", parent: invite
    });
    kit.sketch(questionUnderline.inner, "path", ["M4 18 C " + Math.round(box.w * 0.3) + " 8, " + Math.round(box.w * 0.7) + " 9, " + (box.w + 8) + " 14"], { fill: "none", stroke: "accent", sw: 5.5 });
    m.draw(questionUnderline, tRewrite + 0.22, { dur: drawDur(box.w + 8) });

    invite.handle.guests(tGuests);
  },
});
