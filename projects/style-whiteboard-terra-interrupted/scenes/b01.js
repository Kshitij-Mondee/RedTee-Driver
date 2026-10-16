// @design empty_chairs_after_good_talk: a meeting table fills with discussion, then the empty chairs carry the unanswered questions
// Treatments considered: (A) static empty table with questions, rejected because the lost discussion is unseen. (B) a list of missing outputs, rejected because it explains before the hook. (C) chosen, the meeting is drawn, emptied, then questioned.
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tTalk = ctx.cue("An hour of good discussion");
    const tLeave = ctx.cue("everyone leaves");
    const tDecided = ctx.cue("What was decided");
    const tWho = ctx.cue("Who does what");
    const tNobody = ctx.cue("Nobody can say");

    // @form table: the held meeting table, chairs, people and their temporary discussion bubbles
    const table = ctx.el("table", { x: 90, y: 240, w: 1400, h: 690, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", ox: 90, oy: 240 });
    team.draw(tTalk - 0.08);
    team.arrive(tTalk + 0.65);
    team.bubble(0, null, tTalk + 1.18);
    team.bubble(2, null, tTalk + 1.38);
    team.leave(tLeave);
    team.clearBubbles(tLeave);

    // @form decided_word: the first question is written above the empty left chairs
    const decided = ctx.el("decided_word", { x: 220, y: 330, w: 470, h: 110, kind: "text", exit: "wipe" });
    kit.text(decided.inner, "Decided?", { role: "title", x: 0, y: 0, w: 470, h: 110, maxLines: 1, valign: "middle" });
    m.unmask(decided, tDecided, { dur: 0.55 });

    // @form who_word: the second question is written above the empty right chairs
    const who = ctx.el("who_word", { x: 1130, y: 330, w: 420, h: 110, kind: "text", exit: "wipe" });
    kit.text(who.inner, "Who?", { role: "title", x: 0, y: 0, w: 420, h: 110, maxLines: 1, valign: "middle" });
    m.unmask(who, tWho, { dur: 0.45 });

    // @form question_marks: one accent mark, two large questions over empty chair backs
    const marks = ctx.el("question_marks", { x: 385, y: 405, w: 810, h: 190, kind: "mark", exit: "recede" });
    hand(marks.inner, "M120 8 C 42 8, 22 62, 57 102 C 88 137, 123 128, 123 166 M123 184 L123 188", { stroke: "accent", sw: 5.5 });
    hand(marks.inner, "M695 8 C 617 8, 597 62, 632 102 C 663 137, 698 128, 698 166 M698 184 L698 188", { stroke: "accent", sw: 5.5 });
    m.draw(marks, tNobody, { dur: drawDur(420) });
  },
});
