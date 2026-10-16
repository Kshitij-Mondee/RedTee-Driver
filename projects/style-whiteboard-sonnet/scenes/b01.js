// @design absence_after_talk: people drawn in at a table, then gone; the empty chairs get the questions nobody can answer
/* Treatments: (A) static board with three labels (rejected: no absence), (B) text list "no decision, no owner"
 * (rejected: a slide), (C) CHOSEN: the table drawn, filled, emptied; the questions written over it, two accent marks. */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const writeDur = (s) => DRAW * clamp(String(s).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // ---- 1. "An hour of good discussion": table and chairs drawn, people in, two scribble bubbles
    const tHour = ctx.cue("An hour of good discussion");
    const table = ctx.el("table", { x: 90, y: 240, w: 1400, h: 690, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team" });   // @form team_at_table: the meeting
    team.draw(tHour);
    team.arrive(tHour + 1.0);
    team.bubble(0, null, tHour + 1.7);
    team.bubble(2, null, tHour + 2.1);

    // ---- 2. "everyone leaves": people and bubbles fade, chairs stay
    const tLeave = ctx.cue("everyone leaves");
    team.clearBubbles(tLeave - 0.1);
    team.leave(tLeave);

    // ---- 3. the two questions written over the table (station coords: local + 90, 240)
    const tDec = ctx.cue("What was decided");
    const dec = ctx.el("decided_word", { x: 220, y: 205, w: 400, h: 120, kind: "text", exit: "wipe" });
    kit.text(dec.inner, "Decided?", { role: "title", x: 0, y: 0, w: 400, h: 120, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(dec, tDec, { dur: writeDur("Decided?") });

    const tWho = ctx.cue("Who does what");
    const who = ctx.el("who_word", { x: 940, y: 205, w: 320, h: 120, kind: "text", exit: "wipe" });
    kit.text(who.inner, "Who?", { role: "title", x: 0, y: 0, w: 320, h: 120, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(who, tWho, { dur: writeDur("Who?") });

    // ---- 4. "Nobody can say": two large accent question marks above the empty chairs (the only accent)
    const tNo = ctx.cue("Nobody can say");
    const qm = ctx.el("question_marks", { x: 310, y: 330, w: 900, h: 235, kind: "mark", exit: "recede" });
    [22, 702].forEach((lx, i) => {
      const q = ctx.el("question_mark_" + i, { x: lx, y: 0, w: 176, h: 235, kind: "mark", exit: "recede", parent: qm.inner });
      hand(q.inner, `M25 75 C25 10 150 10 150 72 C150 125 88 130 88 178`, { stroke: "accent", sw: 12 });
      hand(q.inner, `M88 212 L90 217`, { stroke: "accent", sw: 17 });
      m.draw(q, tNo + i * 0.55, { dur: 0.7 });
    });
  },
});
