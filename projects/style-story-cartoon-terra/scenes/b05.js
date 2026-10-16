// @design questions_on_desk: a paper pad lands beside the duplicated receipts and writes three weighing questions
/*
 * Treatments considered: (A) questions floating over the receipts, rejected because they would not belong in Maya's work. (B) a wall checklist, rejected because the desk evidence must remain the reference. (C) chosen: a paper notepad lands on the desk and writes one question at a time.
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const receiptCircle = ctx.el("receipt_circle", { x: 0, y: 0, w: 460, h: 290, kind: "connector", parent: receipts.inner });
    Loom.svg("path", { d: "M239 126 C254 88 418 88 435 126 C420 164 254 164 239 126", fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round" }, receiptCircle.inner);
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    const magnifier = ctx.held("magnifier");
    const padAt = ctx.cue("three questions");
    const ruleAt = ctx.cue("break a rule");
    const harmAt = ctx.cue("harm someone");
    const publicAt = ctx.cue("fine in public");
    Loom.drive((e) => { receiptCircle.inner.style.opacity = 1 - 0.5 * e; }, padAt, 0.25, "editorial");

    // @form desk_question_pad: a paper notepad sits on the open desk space beside the receipts
    const questionPad = Loom.lesson.question_pad(ctx, ctx.station.svg, {
      x: 1075, y: 540, line1: "hidden", line2: "hidden", line3: "hidden"
    });
    questionPad.setState("line1_written", ruleAt);
    questionPad.setState("line2_written", harmAt);
    questionPad.setState("line3_written", publicAt);
    m.drop(questionPad.pad, padAt);
    m.emphasis(maya, publicAt);

  },
});
