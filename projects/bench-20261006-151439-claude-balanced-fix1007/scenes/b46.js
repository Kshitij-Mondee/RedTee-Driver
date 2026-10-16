// @design commitment_lands: a tick and a date-free marker land beside a note on a quiet desk
// Treatments: (1) static desk with signals, (2) tick draw + slide + drop (chosen: gentle staging, matches the three phrases), (3) camera push. 
Loom.scene("b46", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const tTick = ctx.cue("Then say it this week");
    const tNudge = ctx.cue("Soon after the moment");
    const tMark = ctx.cue("agree when you will talk again");

    const desk = ctx.held("desk");
    const note = ctx.held("sticky_note");

    // tick on the note, drawn in its own element placed over the note
    const T = ctx.el("tick_on_note", { x: 900, y: 420, w: 160, h: 140, kind: "icon", exit: "recede" });
    // @form tick_stroke: hand-drawn commitment tick
    const tick = kit.path(T.inner, "M24 74 L62 112 L134 26", { stroke: ctx.c("accent"), sw: 16, fill: "none" });
    m.draw(tick, tTick, { dur: 0.7 });

    // note nudges forward
    m.travel(note, tNudge, { x: 0, y: 24 });

    // calendar marker, date-free: pin and a plain flag, no numbers
    const M = ctx.el("calendar_marker_plain", { x: 1180, y: 380, w: 200, h: 240, kind: "icon", exit: "recede" });
    // @form plain_marker: calendar flag with no date
    kit.rect(M.inner, 10, 40, 180, 170, { fill: ctx.c("surface"), r: 14, stroke: ctx.c("ink") });
    kit.rect(M.inner, 10, 40, 180, 44, { fill: ctx.c("accent2"), r: 14, stroke: ctx.c("ink") });
    kit.disc(M.inner, 100, 150, 30, { fill: ctx.c("accent2") });
    m.drop(M, tMark, {});
  }
});
