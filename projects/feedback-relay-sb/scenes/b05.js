// @design room_through_window: a side window opens on the board and the audience drops to phones beside the tile that names it
// Treatments: (1) static board with highlighted line + signalling, (2) window opens, heads drop, tile pops (chosen: effect seen then named), (3) full-frame room cutaway.
Loom.scene("b05", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    const s = 0.85, bx = 495, by = 130;
    const tOpen = ctx.cue("what did it do to the room");
    const tPhones = ctx.cue("The room looked at their phones");
    const tEffect = ctx.cue("That is the effect");
    const tSaw = ctx.cue("Only what you saw");
    const tGuess = ctx.cue("never a guess");

    const BE = ctx.el("comment_board", { x: bx - 500 * s, y: by, w: 2100 * s, h: 760 * s, kind: "card", exit: "recede" });
    const board = Loom.lesson.comment_board(ctx, BE.inner, { name: "b05_board", scale: s, x: 500 * s, y: 0, state: "empty_slots" });
    const room = Loom.lesson.meeting_room(ctx, board.windowInner, { name: "b05_room", w: 452, y: 39, audience: "heads_up", calendar: false, lectern: false });
    m.reveal(BE, ctx.start + 0.05);
    board.setState("side_window_open", tOpen);

    const mk = (i, nm) => {
      const E = ctx.el(nm, { x: bx + (80 + 500 * i) * s, y: by + 250 * s, w: 440 * s, h: 210 * s, kind: "card", exit: "recede" });
      const g = Loom.svg("g", { transform: "scale(" + s + ")" }, E.inner);
      return { E, g };
    };
    const a = mk(0, "tile_1_read_slides"), b = mk(1, "tile_2_room_phones");
    const ct = Loom.lesson.comment_tiles(ctx, BE.inner, { name: "b05_tiles", parents: [a.g, b.g, Loom.svg("g", {}, BE.inner)], states: ["muted", "accent", "empty"] });
    ct.tiles[2].g.setAttribute("opacity", 0);
    ct.tiles[1].set("accent", 0);
    Loom.set(ct.tiles[1].muted, { opacity: 0 }, 0);
    ct.tiles[1].muted.setAttribute("opacity", 0);
    Loom.set(ct.tiles[1].stampInk, { opacity: 0 }, 0);
    Loom.set(ct.tiles[1].stampInk, { opacity: 1 }, tEffect);
    m.reveal(a.E, ctx.start + 0.3);
    m.pop(b.E, tPhones + 0.5);
    room.setState("phones_down", tPhones);

    const CE = ctx.el("room_to_tile2", { x: 0, y: 0, w: 1920, h: 900, kind: "connector", exit: "recede" });
    const y0 = by + 215 * s, x1 = bx + (580 + 220) * s, yT = by + 250 * s - 6;
    const x0 = bx - 20 * s;
    const p = kit.path(CE.inner, "M" + x0 + "," + (by + 300 * s) + " L" + (bx + 40 * s) + "," + y0 + " L" + x1 + "," + y0 + " L" + x1 + "," + yT + " M" + (x1 - 14) + "," + (yT - 16) + " L" + x1 + "," + yT + " L" + (x1 + 14) + "," + (yT - 16), { stroke: "ink", sw: 5, fill: "ink", fillOpacity: 0 });
    m.draw(p, tSaw + 0.1, { dur: 0.9 });
  },
});
