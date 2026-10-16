// @design steady_hands_at_many_locks: a row of locks and an even stream of identical tokens tried one after another, refused without pause, until one marked token arrives like the rest
/* Three treatments considered:
 * 1. static row of doors with a list beside it (no motion: the automation is not visible);
 * 2. one big card hopping door to door (reads as a person choosing);
 * 3. CHOSEN: an evenly timed stream, one copy card per lock, equal travel, equal pause, each refused; the term
 *    unmasks on its words above the row; the lit card arrives on the same beat of the metronome.
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ---- geometry: seven doors in one row (Shop, five others, Work), identical size, even gaps
    const DW = 200, GAP = 50, X0 = 110, DY = 360, S = DW / 400, DH = 620 * S;
    const doorX = (i) => X0 + i * (DW + GAP);
    const CW = 96, CH = CW * 140 / 220;
    const slot = { x: 302 * S, y: 338 * S };   // the lock slot centre inside a door at this scale

    // ---- the wall (held by b06)
    const W = ctx.el("door_wall", { x: 0, y: 300, w: 1920, h: 440, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 440, fill: c("field2") }, W.inner);
    svg("rect", { x: 0, y: 0, width: 1920, height: 3, fill: c("ink"), opacity: 0.12 }, W.inner);
    svg("rect", { x: 0, y: 372, width: 1920, height: 68, fill: c("shadow"), opacity: 0.7 }, W.inner);
    svg("rect", { x: 0, y: 372, width: 1920, height: 2, fill: c("ink"), opacity: 0.18 }, W.inner);
    m.reveal(W, ctx.start + 0.1);

    // ---- doors
    const shopE = ctx.el("door_shop", { x: doorX(0), y: DY, w: DW, h: DH + 66, kind: "scenery", exit: "recede" });
    Loom.lesson.door(ctx, shopE.inner, { x: 0, y: 0, w: DW, state: "forced" });
    kit.text(shopE.inner, "Shop", { role: "lead", x: 0, y: DH + 12, w: DW, h: 50, align: "center", color: "ink", maxLines: 1 });
    m.reveal(shopE, ctx.start + 0.2);

    const rowE = ctx.el("door_row", { x: doorX(1), y: DY, w: 5 * DW + 4 * GAP, h: DH, kind: "scenery", exit: "recede" });
    const rowDoors = [];
    for (let k = 0; k < 5; k++) rowDoors.push(Loom.lesson.door(ctx, rowE.inner, { x: k * (DW + GAP), y: 0, w: DW, shade: 0.28 }));
    m.reveal(rowE, ctx.start + 0.3);

    const workE = ctx.el("door_work", { x: doorX(6), y: DY, w: DW, h: DH + 66, kind: "scenery", exit: "recede" });
    Loom.lesson.door(ctx, workE.inner, { x: 0, y: 0, w: DW });
    kit.text(workE.inner, "Work", { role: "lead", x: 0, y: DH + 12, w: DW, h: 50, align: "center", color: "ink", maxLines: 1 });
    m.reveal(workE, ctx.start + 0.4);

    // ---- the stream: even tempo, equal travel, equal pause; Dana's card lands on the same beat
    const tTries = ctx.cue("tries every leaked pair");
    const tDana = ctx.cue("Nobody chose Dana");
    const TRAVEL = 0.5;
    const A0 = tTries + 0.5;
    const arrD = tDana + TRAVEL;
    const D = Math.max(0.6, (arrD - A0) / 5);
    const stream = ctx.el("card_stream", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
    for (let k = 0; k < 5; k++) {
      const x = doorX(k + 1);
      const arr = A0 + k * D, st = arr - TRAVEL;
      const cy = slot.y - CH / 2;
      const cardE = ctx.el("card_" + (k + 1), { parent: stream, x: x - 70, y: DY + cy, w: CW, h: CH, kind: "token", exit: "none" });
      const card = Loom.lesson.keycard(ctx, cardE.inner, { x: 0, y: 0, w: CW, state: "copy" });
      m.reveal(cardE, st, { dur: 0.15 });
      m.travel(cardE, st, { x: slot.x - CW / 2 + 70, y: 0, dur: TRAVEL });
      card.setState("dim", arr);
      rowDoors[k].setState("refused", arr + 0.05);
      m.exit(cardE, arr + 0.3, "sink");
    }

    // ---- the term: ink, title role, one accent underline, on the dark field above the row
    const T = ctx.el("term", { x: 460, y: 130, w: 1000, h: 140, kind: "text", exit: "wipe" });
    const tt = kit.text(T.inner, "credential stuffing", { role: "title", x: 0, y: 0, w: 1000, h: 104, align: "center", color: "ink", maxLines: 1, weight: 700 });
    const uw = Math.min(1000, tt.__fit.width);
    svg("rect", { x: (1000 - uw) / 2, y: 118, width: uw, height: 8, rx: 2, fill: c("accent") }, T.inner);
    m.unmask(T, ctx.cue("credential stuffing"));

    // ---- Dana's lit card: arrives like the others and rests at the Work lock
    const cy = slot.y - CH / 2;
    const K = ctx.el("keycard", { x: doorX(6) - 70, y: DY + cy, w: CW, h: CH, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, K.inner, { x: 0, y: 0, w: CW, state: "lit" });
    m.reveal(K, tDana, { dur: 0.15 });
    m.travel(K, tDana, { x: slot.x - CW / 2 + 70, y: 0, dur: TRAVEL });
  },
});
