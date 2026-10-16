// @design three_into_one: separate pieces slide edge to edge and lock into one speech bubble, flooded in order
// Treatments: (1) static board with stamps; (2) tiles slide and lock into bubble (chosen); (3) tiles merge by fade.
Loom.scene("b07", {
  build(ctx, props) {
    const m = ctx.m;
    const BX = 160, BY = 90;
    const Eb = ctx.el("board", { x: BX, y: BY, w: 1600, h: 760, kind: "card", exit: "recede" });
    Loom.lesson.comment_board(ctx, Eb.inner, { state: "filled" });
    m.reveal(Eb, ctx.start + 0.05);

    const ox = BX + 80, oy = BY + 250;
    const tileEls = [0, 1, 2].map((i) => ctx.el("tile" + (i + 1), { x: ox + i * 500, y: oy, w: 440, h: 170, kind: "card", exit: "recede" }));
    const Ej = ctx.el("joined_comment", { x: ox, y: oy, w: 1500, h: 220, kind: "bubble", exit: "recede" });
    const ct = Loom.lesson.comment_tiles(ctx, Ej.inner, { name: "b07tiles", state: "joined", stamps: ["Action", "Effect", "Next step"], parents: tileEls.map((e) => e.inner) });
    tileEls.forEach((e, i) => { ct.tiles[i].set("muted", 0); });

    const tA = ctx.cue("Three pieces");
    tileEls.forEach((e, i) => m.pop(e, tA + i * 0.07));

    const tB = ctx.cue("one comment");
    const dur = 0.34;
    tileEls.forEach((e, i) => m.travel(e, tB, { x: ox + i * 500 + 60 - 60 * i, y: oy, scale: 1 }));
    Loom.set(Ej.inner, { opacity: 0 }, 0);
    Loom.set(Ej.inner, { opacity: 1 }, tB + dur);
    tileEls.forEach((e) => Loom.set(e.inner, { opacity: 0 }, tB + dur + 0.01));

    const tC = ctx.cue("one board");
    const En = ctx.el("natural_small", { x: BX + 938, y: BY + 10, w: 624, h: 240, kind: "bubble", exit: "recede" });
    const nb = Loom.lesson.natural_bubble(ctx, En.inner, { state: "small_grey", scale: 1.2 });
    m.pop(En, tC);

    const fl = [ctx.cue("Action"), ctx.cue("effect"), ctx.cue("next step")];
    fl.forEach((t, i) => {
      ct.floodJoined(i, t);
      const mt = ct.joinedTiles[i].accent.previousElementSibling;
      if (mt) Loom.set(mt, { opacity: 0 }, t + 0.35);
    });
  },
});
