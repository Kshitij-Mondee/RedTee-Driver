// @design decision_ticks: three settled ticks turn Maya's desk questions into a clear reason to speak up
/*
 * Treatments considered: (A) floating ticks over the receipts, rejected because the judgment belongs on the notepad. (B) a large approval stamp, rejected because it would overpower the evidence. (C) chosen: three ticks land in the existing questions while Maya settles on a decision.
 */
Loom.scene("b06", {
  build(ctx) {
    const { m } = ctx;
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const receiptCircle = ctx.held("receipt_circle");
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    const magnifier = ctx.held("magnifier");
    const claimAt = ctx.cue("A dinner claimed twice?");
    const enoughAt = ctx.cue("That's enough to raise it.");

    // @form evidence_ring: the held evidence ring draws again around the duplicate
    m.draw(receiptCircle, claimAt);

    // @form pad_ticks: three positive marks land beside the completed questions
    const questionTicks = Loom.lesson.question_pad(ctx, ctx.station.svg, {
      x: 1075, y: 540, ticks: true, line1: "written", line2: "written", line3: "written"
    });
    questionTicks.setState("line1_ticked", enoughAt);
    questionTicks.setState("line2_ticked", enoughAt + 0.22);
    questionTicks.setState("line3_ticked", enoughAt + 0.44);
    m.pop(questionTicks.ticks[0], enoughAt);
    m.pop(questionTicks.ticks[1], enoughAt + 0.22);
    m.pop(questionTicks.ticks[2], enoughAt + 0.44);

    // @form maya_decision: Maya gives one firm, decided emphasis
    m.emphasis(maya, enoughAt + 0.55);
    Loom.drive((e) => { receiptCircle.inner.style.opacity = 0.5 + 0.5 * e; }, claimAt, 0.3, "editorial");
  },
});
