// @design same_room_different_memories: the same four seated people, each answering the same question with a different bubble
// Treatments: (A) four bubbles one by one over the held table (chosen), (B) a static row of four answers, (C) the people re-seated one at a time.
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    // b01 draws the table (wrapper element "table", kit part name "team"); taken held. If b01 is not built yet
    // (preview only), a stand-in draws the same table so this beat can still be looked at.
    let wrap = ctx.held("table");
    const standIn = !wrap;
    if (standIn) wrap = ctx.el("table", { x: 280, y: 240, w: 1400, h: 700, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, wrap.inner, { name: "team", held: !standIn });
    if (standIn) team.draw(ctx.start + 0.1);

    // "Sam's weekly project meeting": the four people fade in again, Sam's name is written, one accent underline
    const tMeet = ctx.cue("weekly project meeting");
    team.arrive(tMeet - 0.5);
    // b01's leave() faded each person's life group to 0; arrive() only reveals, so bring the life groups back up
    // in the same stagger (a fresh team has them at 1 already, so only a held table needs it)
    if (!standIn) team.el.people.forEach((E, k) => Loom.tween(E.life, { opacity: 0 }, { opacity: 1 }, tMeet - 0.5 + k * 0.15, { dur: 0.5 }));
    const tTag = tMeet + 0.6;
    team.nameTag(0, "Sam", tTag);
    const tb = team.tagBox(0);
    const ul = ctx.el("sam_tag", { parent: wrap.inner, x: tb.x - 8, y: tb.y + tb.h - 6, w: tb.w + 16, h: 26, kind: "mark", exit: "recede" });
    const w = tb.w + 16;
    kit.sketch(ul.inner, "path", ["M2 12 C " + (w * 0.3).toFixed(0) + " 6, " + (w * 0.65).toFixed(0) + " 17, " + (w - 2) + " 9"], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(ul, tTag + 0.6, { dur: 0.45 });

    // "Ask around after": a bubble above each person, one after another
    const t0 = ctx.cue("Ask around after");
    team.bubble(0, "May", t0);
    team.bubble(1, "June", t0 + 0.8);
    // the kit's '?' words box is 64 px high (below the title floor), so the bubble is drawn empty and the '?' is written in its own box
    team.bubble(2, " ", t0 + 1.6);
    const q = ctx.el("bubble_q", { parent: wrap.inner, x: 160 + 340 * 2 - 130, y: 66, w: 260, h: 96, kind: "text", exit: "wipe" });
    kit.text(q.inner, "?", { role: "title", x: 0, y: 0, w: 260, h: 96, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(q, t0 + 1.6 + 0.45, { dur: 0.4 });
    team.bubble(3, null, t0 + 2.4);
  },
});
