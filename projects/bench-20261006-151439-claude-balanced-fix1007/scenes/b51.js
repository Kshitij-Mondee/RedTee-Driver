// @design waiting_then_answering: the same room, calmer, one person holds back and then speaks
/* Treatments: (A) static room with caption (rejected), (B) split before/after (rejected: opening is another beat),
 * (C) CHOSEN: same room, warm lift, Sam presents, Dev waits then speaks with a pop. */
Loom.scene("b51", {
  build(ctx) {
    const { m } = ctx;
    const room = ctx.scenery("room", "room_set", {});
    const fy = room.floorY || 800;
    const tNext = ctx.cue("Next meeting");
    const tPres = ctx.cue("Sam presents");
    const tWait = ctx.cue("Dev waits");
    const tFin = ctx.cue("and lets her finish");
    const tResp = ctx.cue("Then Dev responds");

    // warm lift: a soft warm wash over the room
    const warm = ctx.el("warm_lift", { x: 0, y: 0, w: 1920, h: 930, kind: "light", exit: "recede" });
    Loom.svg("rect", { x: 0, y: 0, width: 1920, height: 930, fill: Loom.style.c("accent3"), opacity: 0.16 }, warm.inner);
    Loom.tween(warm.inner, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur(1.2), ease: Loom.ease.enter }, tNext, { kind: "fade_in", beat: ctx.beat.id, content: true });

    const sam = ctx.character("Sam_presenting", "sam", { x: 560, y: fy, scale: 1.5, pose: "idle" });
    sam.pose("present", tPres, { dur: 0.5 });
    sam.talk(tPres, tFin + 1.0);
    sam.gesture("beat", tPres + 0.8, tPres + 1.6);
    sam.gesture("beat", tWait + 0.4, tWait + 1.2);
    sam.pose("idle", tResp, { dur: 0.5 });

    const dev = ctx.character("Dev_holding_back", "pip", { x: 1300, y: fy, scale: 1.5, flip: true, pose: "idle" });
    dev.emotion("concerned", tWait);
    dev.look(-0.6, 0, tPres);
    dev.gesture("nod", tWait + 0.5, tWait + 0.9);
    dev.emotion("happy", tResp);
    dev.pose("explain", tResp, { dur: 0.3 });
    dev.talk(tResp, tResp + 1.6);

    // slides sign behind Sam
    const sl = ctx.el("slide_screen", { x: 300, y: 180, w: 520, h: 300, kind: "panel", exit: "recede" });
    Loom.svg("rect", { x: 0, y: 0, width: 520, height: 300, rx: 16, fill: Loom.style.c("surface"), stroke: Loom.style.c("ink"), "stroke-width": 5 }, sl.inner);
    m.settle(sl, tPres, { dy: 20 });
  },
});
