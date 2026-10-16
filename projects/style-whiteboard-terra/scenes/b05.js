// @design invite_correction: a crossed-out subject becomes a question with the answer window underlined
// Treatments considered: 1) static corrected card, 2) erase and replace, 3) strike then rewrite. Chosen: 3, because the correction itself is the teaching move.
Loom.scene("b05", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const S = ctx.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "accent" }, o || {}));

    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const subjectCircle = ctx.held("subject_circle");
    const subjectNote = ctx.held("subject_note");
    if (!steps || !invite) return;

    // The previous diagnosis clears without altering the card that carries forward.
    if (subjectCircle) m.exit(subjectCircle, ctx.start + 0.05, "recede");
    if (subjectNote) m.exit(subjectNote, ctx.start + 0.1, "recede");

    const tStrike = ctx.cue("Write the decision as a question instead.");
    invite.handle.strike(tStrike);

    const tRewrite = ctx.cue("Do we ship the pilot in May or June?");
    invite.handle.rewrite("May or June?", tRewrite);
    const rb = invite.handle.rewriteBox;

    // @form question_underline: one accent mark beneath the rewritten answer window
    const underline = ctx.el("question_underline", {
      x: rb.x - 8, y: rb.y + rb.h - 22, w: rb.w + 16, h: 30,
      kind: "mark", exit: "recede", parent: invite.inner
    });
    hand(underline.inner, `M4 18 C ${(rb.w * 0.30).toFixed(0)} 7, ${(rb.w * 0.70).toFixed(0)} 22, ${(rb.w + 4).toFixed(0)} 12`, { sw: 6 });
    m.draw(underline, tRewrite + 0.82, { dur: drawDur(rb.w) });

    const tGuests = ctx.cue("Now people come ready to answer.");
    invite.handle.guests(tGuests);
  }
});
