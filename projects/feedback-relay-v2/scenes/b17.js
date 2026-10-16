// @design split_and_step: the same room twice, the old vague comment greyed beside the complete one, then one page flips and the room arrives in colour
Loom.scene("b17", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    const R = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
    const room = Loom.lesson.meeting_room(ctx, R.inner, {});
    room.setState("replay", null);
    const Cal = ctx.el("wall_calendar", { x: 96, y: 124, w: 220, h: 240, kind: "prop", exit: "none" });
    const cal = Loom.lesson.wall_calendar(ctx, Cal.inner, {});
    // @form person_bust: Sam, listening, left
    const S = ctx.el("Sam", { x: 520, y: 380, w: 600, h: 410, kind: "character", exit: "none" });
    kit.peep(S.inner, "man", "neutral", { x: 820 - 520, y: 640 - 380, size: 560, cloth: "cloth", skin: 2 });
    // @form person_bust: Priya, right, flipped
    const P = ctx.el("Priya", { x: 1120, y: 390, w: 560, h: 400, kind: "character", exit: "none" });
    kit.peep(P.inner, "woman", "neutral", { x: 1380 - 1120, y: 650 - 390, size: 520, flip: true, cloth: "cloth2", skin: 3 });
    // @form split_line: before and after
    const SL = ctx.el("split_line", { x: 1075, y: 90, w: 20, h: 700, kind: "mark", exit: "none" });
    const sl = kit.line(SL.inner, 10, 0, 10, 700, { stroke: "ink", sw: 6, dash: "18 12" });
    const OB = ctx.el("old_comment", { x: 340, y: 230, w: 520, h: 175, kind: "bubble", exit: "none" });
    const ob = Loom.lesson.comment_bubble(ctx, OB.inner, { w: 520 });
    ob.setState("vague", null);
    const NB = ctx.el("new_comment", { x: 1110, y: 100, w: 680, h: 227, kind: "bubble", exit: "none" });
    const nb = Loom.lesson.comment_bubble(ctx, NB.inner, { w: 680 });
    nb.setState("complete", null);
    // @form accent_edge: Priya's completed bubble
    const PB = ctx.el("priya_bubble", { x: 1100, y: 90, w: 700, h: 250, kind: "mark", exit: "none" });
    const edge = kit.path(PB.inner, "M 20 4 H 680 Q 696 4 696 20 V 224 Q 696 240 680 240 H 20 Q 4 240 4 224 V 20 Q 4 4 20 4 Z", { fill: "none", stroke: "accent", sw: 8 });
    // @form tag: Sam lets Priya finish
    const T = ctx.el("tag", { x: 1180, y: 362, w: 540, h: 80, kind: "label", exit: "none" });
    kit.pill(T.inner, 0, 0, 540, 80, { fill: "accent", r: 40 });
    kit.text(T.inner, "Sam lets Priya finish", { role: "label", x: 20, y: 8, w: 500, h: 64, align: "center", valign: "middle", maxLines: 1, color: Loom.style.pickTokenOn("accent") });
    const t0 = ctx.cue("Back to Sam");
    const tSame = ctx.cue("same meeting");
    const tNew = ctx.cue("new comment");
    const tNext = ctx.cue("Next week");
    const tFin = ctx.cue("he lets Priya finish");
    [OB, NB, PB, T, SL].forEach(e => e.inner.setAttribute("opacity", 0));
    m.draw(sl, t0, { dur: 0.8 });
    Loom.tl.set(SL.inner, { opacity: 1 }, t0);
    Loom.tl.set(OB.inner, { opacity: 1 }, tSame);
    ob.setState("grey", tSame + 0.4);
    Loom.tl.set(NB.inner, { opacity: 1 }, tNew);
    m.drop(NB, tNew, {});
    cal.setState("next_week", tNext);
    room.setState("next_week_full", tNext);
    Loom.tl.set(SL.inner, { opacity: 0 }, tNext);
    Loom.tl.set(OB.inner, { opacity: 0 }, tNext + 0.2);
    Loom.tl.set(PB.inner, { opacity: 1 }, tFin);
    m.draw(edge, tFin, { dur: 1.2 });
    Loom.tl.set(T.inner, { opacity: 1 }, tFin + 1.0);
    m.drop(T, tFin + 1.0, {});
    ctx.cue("not certain");
  },
});
