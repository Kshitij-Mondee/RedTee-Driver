// @design question_list_written_live: a paper list on the desk fills line by line as each question is asked, while the old mark dims so the list carries the accent
// Treatments: (A) static pad with all lines, (B) CHOSEN: pad drops on the desk, lines unmask on their words, head tilts, (C) questions float over Maya.
Loom.scene("b05", {
  build(ctx) {
    const { m } = ctx;
    const tPad = ctx.cue("three questions");
    const t1 = ctx.cue("break a rule");
    const t2 = ctx.cue("harm someone");
    const t3 = ctx.cue("fine in public");

    // held from b04: room, desk, receipts, receipt_circle, phone, laptop, maya, magnifier
    const mh = ctx.held("maya");
    const maya = mh && (mh.handle || mh);

    // @form question_pad: a paper notepad of three questions lying on the desk beside the receipts
    const pad = Loom.lesson.question_pad(ctx, ctx.station.svg, { x: 1075, y: 540 });
    m.drop(pad.pad, tPad);
    m.unmask(pad.lines[0], t1);
    m.unmask(pad.lines[1], t2);
    m.unmask(pad.lines[2], t3);

    // the glass stays on the desk (held, not redrawn); the ring dim is dropped: the receipts are drawn by the kit's desk_set in b04 under glass_carry, not a held name
    ctx.held("magnifier");
    ctx.held("glass_carry");

    // Maya weighs it on the last question
    if (maya && typeof maya.pose === "function") {
      maya.pose("think", t3 - 0.2, { dur: 0.5 });
      if (typeof maya.look === "function") maya.look(-0.9, 0.3, t3 - 0.2);
      if (typeof maya.emotion === "function") maya.emotion("focused", t3 - 0.2);
      if (typeof maya.gesture === "function") maya.gesture("nod", t3 + 0.2, t3 + 1.2);
      maya.pose("idle", ctx.end - 0.3, { dur: 0.5 });
    }
  },
});
