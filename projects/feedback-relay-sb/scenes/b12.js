// @design return_room_changed: the opening room comes back brighter, a rebuilt comment, a calendar flip, a different audience
Loom.scene("b12", {
  build(ctx) {
    const { kit } = ctx;
    const M = Loom.motion;
    const B = ctx.beat.id;
    const meta = { kind: "camera", beat: B, content: true };

    const roomE = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const wrap = Loom.svg("g", {}, roomE.inner);
    const room = Loom.lesson.meeting_room(ctx, wrap, { name: "room", bright: true, slide: "text_wall", audience: "phones_down", calendarState: "this_week" });
    M.reveal(roomE, ctx.start + 0.1, { dy: 0 });

    const A = room.anchors;
    const S = 560;
    const dy = -130;
    const theoE = ctx.el("Theo", { x: A.theo.x - S / 2, y: A.theo.y + dy - S / 2, w: S, h: S, kind: "character", parent: room.theoSlot, exit: "none" });
    kit.peep(theoE.inner, "man", "neutral", { x: S / 2, y: S / 2, size: S, flip: false, skin: 2, cloth: "cloth2" });

    const maya = ctx.character("Maya", "maya", { x: A.maya.x, y: A.maya.y, scale: A.maya.scale, skin: 0, top: "cloth", parent: room.mayaSlot, pose: "idle" });

    const bub = ctx.el("comment_bubble", { x: 40, y: 70, w: 780, h: 120, kind: "bubble", exit: "none" });
    const tiles = Loom.lesson.comment_tiles(ctx, bub.inner, { name: "tiles", scale: 0.52, state: "joined" });
    tiles.setJoinedAccent(true, 0);
    const tBub = ctx.cue("rebuilt version");
    M.pop(bub, tBub, { overshoot: true });

    const tFlip = ctx.cue("Next week");
    room.calendar.flip(tFlip);
    M.exit(bub, tFlip + 0.1, "recede");

    const tDec = ctx.cue("opens with the decision");
    room.setState("slide_decision", tDec);
    room.setState("heads_up", tDec + 0.2);
    maya.pose("present", tDec, { dur: 0.4 });

    const insE = ctx.el("before_inset", { x: 48, y: 44, w: 400, h: 232, kind: "card", exit: "none" });
    kit.rect(insE.inner, 0, 0, 400, 232, { fill: "surface", r: 10, stroke: "ink" });
    const ig = Loom.svg("g", {}, insE.inner);
    Loom.lesson.meeting_room(ctx, ig, { name: "before", x: 8, y: 8, scale: 384 / 1920, slide: "text_wall", audience: "phones_down", calendar: false, lectern: false });
    M.pop(insE, tDec + 0.5, { overshoot: true });

    const tNod = ctx.cue("The nod now has something behind it");
    maya.emotion("happy", tNod);
    maya.gesture("nod", tNod, tNod + 1.4);
    Loom.drive((e) => {
      const s = 1 + 0.08 * e;
      wrap.setAttribute("transform", "translate(1300 500) scale(" + s.toFixed(4) + ") translate(-1300 -500)");
    }, tNod, ctx.end - tNod - 0.2, "editorial", meta);
  },
});
