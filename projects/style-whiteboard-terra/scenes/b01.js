// @design empty_chairs_make_the_missing_decision_visible: a table fills with conversation, empties, then unanswered questions occupy the chairs
// Treatments considered: (A) a written summary card, rejected because the missing close would be abstract. (B) four separate portraits, rejected because it loses the shared meeting. (C) chosen, one table empties and unanswered questions take the empty seats.
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const table = ctx.el("table", { x: 260, y: 150, w: 1400, h: 700, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", ox: 260, oy: 150 });
    const tDiscussion = ctx.cue("An hour of good discussion.");
    team.draw(tDiscussion - 0.08);
    team.arrive(tDiscussion + 0.82);
    team.bubble(0, null, tDiscussion + 1.14);
    team.bubble(2, null, tDiscussion + 1.36);

    const tLeaves = ctx.cue("Then everyone leaves.");
    team.clearBubbles(tLeaves);
    team.leave(tLeaves + 0.08);

    // @form decided_word: the first missing answer, written above the left empty chairs
    const decided = ctx.el("decided_word", { x: 400, y: 240, w: 470, h: 100, kind: "text", exit: "wipe" });
    kit.text(decided.inner, "Decided?", { role: "lead", x: 0, y: 0, w: 470, h: 100, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const tDecided = ctx.cue("What was decided?");
    m.unmask(decided, tDecided, { dur: ctx.style.dur("draw") * 0.58 });

    // @form who_word: the second missing answer, written above the right empty chairs
    const who = ctx.el("who_word", { x: 1050, y: 240, w: 470, h: 100, kind: "text", exit: "wipe" });
    kit.text(who.inner, "Who?", { role: "lead", x: 0, y: 0, w: 470, h: 100, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const tWho = ctx.cue("Who does what?");
    m.unmask(who, tWho, { dur: ctx.style.dur("draw") * 0.45 });

    // @form question_marks: the only marker-colour emphasis, occupying two of the empty chairs
    const marks = ctx.el("question_marks", { x: 540, y: 350, w: 840, h: 150, kind: "mark", exit: "iris" });
    kit.text(marks.inner, "?", { role: "title", x: 0, y: 0, w: 300, h: 150, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    kit.text(marks.inner, "?", { role: "title", x: 540, y: 0, w: 300, h: 150, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    const tNobody = ctx.cue("Nobody can say.");
    m.unmask(marks, tNobody - 0.08, { dur: ctx.style.dur("draw") * 0.8 });
  },
});
