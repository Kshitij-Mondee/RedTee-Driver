// @design strike_and_rewrite_the_line: the weak topic is struck in ink, never erased, and the question is written under it with one marker underline
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    // treatments: (A) erase and retype (rejected: corrections are struck), (B) swap the card (rejected), (C) CHOSEN: strike, rewrite, underline
    const OX = 200, OY = 250;
    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const ic = invite.handle;

    // the circle and the note of b04 leave: the one accent moves to the question
    const circle = ctx.held("subject_circle");
    const note = ctx.held("subject_note");
    m.exit(circle, ctx.start + 0.15, "recede");
    m.exit(note, ctx.start + 0.15, "wipe");

    // "Write the decision as a question": the topic is struck through
    const tStrike = ctx.cue("Write the decision");
    ic.strike(tStrike + 0.2);

    // the question, written in Caveat under the struck line, as it is spoken
    const tAsk = ctx.cue("Do we ship the pilot");
    ic.rewrite("May or June?", tAsk + 0.5);
    const rb = ic.rewriteBox;

    // "May or June": the accent underline under the new line
    const tUl = ctx.cue("May or June");
    const uw = rb.w + 12;
    const ul = ctx.el("question_underline", { x: OX + rb.x - 6, y: OY + 208 + 94, w: uw, h: 30, kind: "mark", exit: "recede" });
    hand(ul.inner, `M2 14 C ${uw * 0.3} 7, ${uw * 0.65} 20, ${uw - 2} 11`, { stroke: "accent", sw: 5 });
    m.draw(ul, tUl + 0.5, { dur: drawDur(uw * 1.05) });

    // "people come ready to answer": the guest row of six
    const tGuests = ctx.cue("people come ready");
    ic.guests(tGuests);
  },
});
