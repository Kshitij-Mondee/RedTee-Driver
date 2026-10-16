// @design written_action_stays: a faint mood scribble fades while the written action stays
/* Treatments: (A) static notebook with text (rejected, no contrast in time), (B) split cards mood vs action
 * (rejected, lesson nouns), (C) CHOSEN: close on the notebook; a scribble fades, the action is written solid.
 */
Loom.scene("b50", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const NX = 360, NY = 130, NW = 1200, NH = 700;

    const book = ctx.el("notebook", { x: NX, y: NY, w: NW, h: NH, kind: "document", exit: "recede" });
    kit.rect(book.inner, 0, 0, NW, NH, { fill: "surface", r: 28 });
    for (let i = 0; i < 6; i++) kit.disc(book.inner, 0, 90 + i * 100, 13, { fill: "field", flat: true, shadow: false });
    m.settle(book, ctx.cue("Dev has something to do now"), { dy: 40 });

    // faint mood scribble (no words)
    const sc = ctx.el("mood_scribble", { x: NX + 120, y: NY + 110, w: 520, h: 140, kind: "icon", exit: "recede" });
    const p = Loom.svg("path", { d: "M10 80 C50 10 90 140 130 70 S210 10 250 80 S330 140 370 60 S450 20 500 80", fill: "none", stroke: S.c("muted"), "stroke-width": 8, "stroke-linecap": "round" }, sc.inner);
    const tM = ctx.cue("Not a mood");
    m.draw(p, tM, { dur: 0.7 });
    Loom.tween(sc.life, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: Loom.ease.exit }, ctx.cue("An action") - 0.1, { kind: "fade_out", beat: ctx.beat.id, content: true });

    // written action
    const act = ctx.el("written_action", { x: NX + 120, y: NY + 330, w: 960, h: 140, kind: "text", exit: "recede" });
    kit.text(act.inner, "Let her finish", { role: "title", x: 0, y: 0, w: 960, h: 140, maxLines: 1, color: "accent" });
    const tA = ctx.cue("An action");
    m.unmask(act, tA, { dir: "ltr", dur: 1.1 });

    // pen and hand that write
    const pen = ctx.el("dev_hand_pen", { x: NX + 120, y: NY + 400, w: 260, h: 200, kind: "character", exit: "recede" });
    kit.rect(pen.inner, 60, 60, 200, 26, { fill: "ink", r: 13 });
    kit.disc(pen.inner, 40, 80, 40, { fill: "accent4", shadow: false });
    m.settle(pen, ctx.cue("Dev has something to do now") + 0.5, { dy: 30 });
    Loom.drive((e) => pen.life.setAttribute("transform", `translate(${(e * 560).toFixed(1)} ${(Math.sin(e * 18) * 8).toFixed(1)})`), tA, 1.1, "linear", { kind: "value_travel", beat: ctx.beat.id, content: true });
  },
});
