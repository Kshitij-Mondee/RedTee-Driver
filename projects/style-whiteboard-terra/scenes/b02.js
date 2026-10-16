// @design shared_table_memory_split: a held meeting table fills again as four incompatible recollections appear overhead
// Treatments considered: (A) redraw the table as a new meeting, rejected because the continue join must preserve the same meeting. (B) four cards, rejected because they separate people from their recollections. (C) chosen: hold the table, return the people, then draw one distinct bubble over each seat.
Loom.scene("b02", {
  build(ctx) {
    const { m, kit } = ctx;
    const S = Loom.style;
    const drawDur = (len) => S.dur("draw") * Math.max(0.3, Math.min(1.4, len / 900));
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tMeeting = ctx.cue("Say it's Sam's weekly project meeting.");
    const tAsk = ctx.cue("Ask around after, and everyone remembers it differently.");
    const heldTable = ctx.held("table");

    // The hook's question words are not part of this rewind, so they leave before the people return.
    m.exit(ctx.held("decided_word"), ctx.start, "recede");
    m.exit(ctx.held("who_word"), ctx.start, "recede");
    m.exit(ctx.held("question_marks"), ctx.start, "recede");

    // The kit re-adopts the table, chairs and four cast peeps. No held line is redrawn.
    const team = Loom.lesson.team_table(ctx, heldTable.inner, { name: "team", held: true, ox: 260, oy: 150 });
    team.arrive(tMeeting - 0.12);
    // b01 faded the shared peeps out, so their held life groups must be brought back explicitly for this rewind.
    team.el.people.forEach((person, i) => {
      Loom.tween(person.life, { opacity: 0 }, { opacity: 1 }, tMeeting - 0.12 + i * 0.15, { dur: S.dur("enter") });
    });
    team.emotion(0, "explaining", tMeeting + 0.28);

    // @form sam_tag: Sam's name on the existing table front
    team.nameTag(0, "Sam", tMeeting + 0.42, { tone: "ink" });
    const tag = team.tagBox(0);
    // @form sam_underline: the one marker-colour emphasis, directly under Sam's written tag
    const underline = ctx.el("sam_underline", { x: tag.x - 8, y: tag.y + 43, w: tag.w + 16, h: 18, kind: "mark", exit: "recede", parent: heldTable.inner });
    hand(underline.inner, `M4 11 C ${(tag.w * 0.32 + 8).toFixed(0)} 4, ${(tag.w * 0.7 + 8).toFixed(0)} 15, ${(tag.w + 12).toFixed(0)} 8`, { stroke: "accent", sw: 5.5 });
    m.draw(underline, tMeeting + 0.92, { dur: drawDur(tag.w) });

    // @form bubbles: four different recollections, each aligned to its owner's existing seat
    team.bubble(0, "May", tAsk - 0.12);
    team.bubble(1, "June", tAsk + 0.58);
    team.bubble(2, "", tAsk + 1.28);
    // @form question_recollection: a title-size question mark placed in the kit bubble after its outline
    const question = ctx.el("question_recollection", { x: 710, y: 76, w: 260, h: 110, kind: "text", exit: "wipe", parent: heldTable.inner });
    kit.text(question.inner, "?", { role: "title", x: 0, y: 0, w: 260, h: 110, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.unmask(question, tAsk + 1.73, { dur: S.dur("draw") * 0.45 });
    team.bubble(3, null, tAsk + 1.98);
  },
});
