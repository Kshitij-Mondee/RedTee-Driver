// @design doors_along_a_path: five options arrive one at a time as doors standing along a path, in the order she would meet them
/* Treatments: (A) static row of five signs (rejected: no sequence); (B) a menu list (rejected: not her world);
   (C) CHOSEN: the path draws, doors drop one per name, the first sign in accent while named. */
Loom.scene("b07", {
  build(ctx) {
    const { m } = ctx;
    const stage = ctx.el("path_stage", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const P = stage.inner;
    const back = Loom.lesson.door_path(ctx, P, { layer: "back", lines: "none" });

    const a = back.anchors.maya;
    const maya = ctx.character("maya", "maya", { x: a.x, y: a.y, scale: a.scale, skin: 0, top: "cloth", flip: true, parent: P });
    Loom.lesson.door_path(ctx, P, { layer: "front" });

    const t0 = Math.max(ctx.start + 0.05, ctx.cue("the channel"));
    m.draw(back.path, t0);
    // path draws on 'the channel'

    const tMgr = ctx.cue("Her manager");
    const tOth = ctx.cue("another manager");
    const tHr = ctx.cue("HR");
    const tCo = ctx.cue("compliance");
    const tLn = ctx.cue("speak-up line");
    const tAn = ctx.cue("anonymous where offered");

    const order = [["manager", tMgr], ["other", tOth], ["hr", tHr], ["compliance", tCo], ["line", tLn]];
    order.forEach(([k, t]) => {
      m.drop(back.doors[k], t);
      m.reveal(back.signs[k], t + 0.3, { dy: 8 });
    });
    back.setState("manager:accent", tMgr + 0.3);
    back.setState("manager:ink", tOth);
    m.reveal(back.tag, tAn, { dy: 8 });

    // Maya turns to present the doors, palm up (guarded)
    try {
      maya.pose("present", tAn, { dur: 0.6 });
      maya.hold("hand_r", "palm_up_offer", tAn, ctx.end);
    } catch (e) {}
  },
});
