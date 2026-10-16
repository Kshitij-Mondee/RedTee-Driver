// @design emptied_room_two_stay: a crowd leaves a room and two people stay, stiff, facing each other
/* Treatments: (A) static room with two figures and a caption (rejected: loses 'it just ended'),
 * (B) title card (rejected: no people), (C) CHOSEN: room settles, Priya and Dev pop in, grey extras slide out,
 * chair pushed back and shoulders stiffen. Emotion by posture, no accent colour except the chair. */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const room = ctx.scenery("room", "room_set", { window: true, door: true, doorX: 1560 });
    const fy = room.floorY;

    const board = ctx.el("wall_board", { x: 640, y: 150, w: 640, h: 300, kind: "scenery", exit: "none" });
    kit.rect(board.inner, 0, 0, 640, 300, { fill: "surface", r: 12 });
    m.settle(board, ctx.start + 0.1, { dy: 20 });

    const table = ctx.el("table", { x: 560, y: fy - 40, w: 800, h: 70, kind: "scenery", exit: "none" });
    kit.rect(table.inner, 0, 0, 800, 70, { fill: "field", r: 14 });
    for (let i = 0; i < 3; i++) kit.rect(table.inner, 150 + i * 220, -10, 130, 16, { fill: "surface", r: 3 });
    m.settle(table, ctx.start + 0.2, { dy: 20 });

    // grey extras fill the room first
    const crowd = ctx.crowd("extras", { x: 300, y: fy + 20, w: 1300, count: 7, rows: 1, scale: 0.9 });

    const priya = ctx.character("priya", "pip", { x: 440, y: fy + 120, scale: 1.5, emotion: "neutral" });
    const dev = ctx.character("dev", "tess", { x: 1480, y: fy + 120, scale: 1.5, flip: true, emotion: "neutral" });
    m.pop(priya.E, ctx.cue("this is Priya"));
    m.pop(dev.E, ctx.cue("and this is Dev"));

    // extras slide out
    m.travel(crowd.E || crowd, ctx.cue("Their meeting just ended"), { x: -1300, y: fy + 20 });

    // the chair pushed back, the only accent
    const tt = ctx.cue("it was tense");
    const chair = ctx.el("pushed_back_chair", { x: 1180, y: fy - 130, w: 120, h: 200, kind: "scenery", exit: "recede" });
    kit.rect(chair.inner, 10, 0, 40, 120, { fill: "accent", r: 8 });
    kit.rect(chair.inner, 10, 110, 100, 24, { fill: "accent", r: 8 });
    kit.rect(chair.inner, 20, 134, 14, 60, { fill: "accent", r: 4 });
    kit.rect(chair.inner, 86, 134, 14, 60, { fill: "accent", r: 4 });
    m.settle(chair, tt, { dx: -50 });
    priya.emotion("concerned", tt);
    dev.emotion("concerned", tt);
    priya.look(1, 0, tt);
    dev.look(-1, 0, tt);
  },
});
