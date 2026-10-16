// @design absence_after_talk: a full table drawn and emptied, the missing outcome written as two questions over the empty seats
/* Treatments: (A) static table with the two questions already written (rejected: no absence, nothing happens);
 * (B) text-only list "Decided? Who?" (rejected: no table to return to in the payoff);
 * (C) CHOSEN: the table drawn with four busts and two scribble bubbles, people leave on "everyone leaves", the two
 * questions are written on their words, two accent question marks are drawn over the empty chairs. */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);

    const tHour = ctx.cue("An hour of good discussion");
    const tLeave = ctx.cue("everyone leaves");
    const tDecided = ctx.cue("What was decided");
    const tWho = ctx.cue("Who does what");
    const tNobody = ctx.cue("Nobody can say");

    // @form meeting_table: the table line, four chairs, four people, two scribble bubbles
    const table = ctx.el("table", { x: 280, y: 240, w: 1400, h: 700, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team" });
    const t0 = Math.max(ctx.start + 0.1, tHour - 0.4);
    const tEnd = team.draw(t0);
    team.arrive(tEnd - 0.2);
    team.bubble(1, null, tEnd + 0.4);
    team.bubble(2, null, tEnd + 0.6);

    team.clearBubbles(tLeave - 0.1);
    team.leave(tLeave);

    // @form question_word: a written question above the empty seats
    const dW = ctx.el("decided_word", { x: 420, y: 96, w: 400, h: 116, kind: "text", exit: "wipe" });
    kit.text(dW.inner, "Decided?", { role: "title", x: 0, y: 0, w: 400, h: 116, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(dW, tDecided, { dur: writeDur("Decided?") });
    const wW = ctx.el("who_word", { x: 1090, y: 96, w: 400, h: 116, kind: "text", exit: "wipe" });
    kit.text(wW.inner, "Who?", { role: "title", x: 0, y: 0, w: 400, h: 116, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(wW, tWho, { dur: writeDur("Who?") });

    // @form question_mark: a hand-drawn accent ? over an empty chair
    const qm = ctx.el("question_marks", { x: 690, y: 270, w: 520, h: 300, kind: "mark", exit: "recede" });
    const Q = (cx) => {
      const lx = cx - 500;
      return [
        `M${lx - 52} 90 C${lx - 56} 10 ${lx + 56} 8 ${lx + 56} 82 C${lx + 56} 140 ${lx} 150 ${lx} 205`,
        `M${lx} 262 L${lx + 2} 268`,
      ];
    };
    Q(590).concat(Q(930)).forEach((d, i) => kit.sketch(qm.inner, "path", [d], { fill: "none", stroke: "accent", sw: i % 2 ? 11 : 9 }));
    m.draw(qm, tNobody, { dur: 1.2 });
  },
});
