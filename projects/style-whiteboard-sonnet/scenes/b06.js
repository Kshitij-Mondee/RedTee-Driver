// @design trim_the_row_to_who_the_decision_needs: two guests are named, the rest are crossed and sent the notes, one marker circle on the owner
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    // treatments: (A) delete guests (rejected: corrections are struck), (B) new card (rejected), (C) CHOSEN: label two, cross four, arrow to the notes
    const OX = 200, OY = 250;
    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const sl = steps.handle, ic = invite.handle;

    // the one accent moves from the question to the owner
    const ul = ctx.held("question_underline");
    m.exit(ul, ctx.start + 0.15, "recede");

    // "whoever owns that decision": accent circle round the first pictogram, then 'Owner'
    const tOwn = ctx.cue("whoever owns that decision");
    const g0 = ic.guestCentre(0);
    const cx = OX + g0.x, cy = OY + g0.y - 2, rx = 54, ry = 52, k = 0.5523;
    const cbx = Math.floor(cx - rx - 12), cby = Math.floor(cy - ry * 1.16 - 12);
    const lx = cx - cbx, ly = cy - cby;
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.05} ${lx} ${ly - ry * 1.05}` +
      ` C${lx + rx * 0.2} ${ly - ry * 1.05} ${lx + rx * 0.4} ${ly - ry * 1.1} ${lx + rx * 0.5} ${ly - ry * 1.14}`;
    const circle = ctx.el("owner_circle", { x: cbx, y: cby, w: Math.ceil(2 * rx + 24), h: Math.ceil(2 * ry * 1.16 + 24), kind: "mark", exit: "recede" });
    hand(circle.inner, loop, { stroke: "accent", sw: 5 });
    m.draw(circle, tOwn, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });
    ic.markGuest(0, "Owner", tOwn + 0.5);

    // "can't be made without": the second one is named
    const tNeed = ctx.cue("can't be made without");
    ic.markGuest(1, "Needed input", tNeed);

    // "Everyone else gets the notes": the other four crossed, an arrow to the envelope
    const tElse = ctx.cue("Everyone else");
    for (let i = 2; i < 6; i++) ic.crossGuest(i, tElse + (i - 2) * 0.15);
    ic.envelope(tElse + 0.8);

    // "the notes": Before ticked in ink
    const tNotes = ctx.cue("gets the notes");
    sl.tick(0, tNotes + 0.4);
  },
});
