// @design shared_table_rewinds_to_conflicting_memories: a held meeting table fills again, then four ink bubbles contradict one another
// Treatments considered: (A) new table, rejected because continuity needs the prior table; (B) a single summary bubble, rejected because it hides disagreement; (C) chosen, the held table with four arriving people and distinct bubbles.
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);

    const table = ctx.held("table");
    const decidedWord = ctx.held("decided_word");
    const whoWord = ctx.held("who_word");
    const questionMarks = ctx.held("question_marks");
    m.exit(decidedWord, ctx.start, "wipe");
    m.exit(whoWord, ctx.start + 0.06, "wipe");
    m.exit(questionMarks, ctx.start + 0.12, "recede");

    const tMeeting = ctx.cue("Sam's weekly project meeting");
    table.handle.arrive(tMeeting);
    // The held people left in b01, so their shared life groups are explicitly restored before their staggered return.
    table.handle.el.people.forEach((person, i) => {
      Loom.tween(person.life, { opacity: 0 }, { opacity: 1 }, tMeeting + i * 0.15, { dur: S.dur("enter") });
    });
    table.handle.emotion(0, "explaining", tMeeting + 0.28);
    table.handle.nameTag(0, "Sam", tMeeting + 0.42, { tone: "ink" });

    const tag = table.handle.tagBox(0);
    // @form sam_tag_underline: the one accent mark, below Sam's written name
    const samUnderline = ctx.el("sam_tag", { x: tag.x, y: tag.y + tag.h - 2, w: tag.w, h: 24, kind: "mark", exit: "recede", parent: table });
    ctx.kit.sketch(samUnderline.inner, "path", [`M2 14 C ${(tag.w * 0.32).toFixed(0)} 7, ${(tag.w * 0.7).toFixed(0)} 18, ${Math.max(4, tag.w - 2)} 11`], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(samUnderline, tMeeting + 0.72, { dur: drawDur(tag.w) });

    const tAsk = ctx.cue("Ask around after");
    table.handle.bubble(0, "May", tAsk);
    table.handle.bubble(1, "June", tAsk + 0.62);
    table.handle.bubble(2, "? ", tAsk + 1.24);
    table.handle.bubble(3, null, tAsk + 1.86);
  },
});
