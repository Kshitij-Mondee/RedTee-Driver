// @design repeat_over_ghost: the same tense meeting replays exactly over a faded grey copy of the first
/* Treatments: (A) static composition with a grey ghost label, (B) split screen compare, (C) CHOSEN: ghost of the
 * first meeting dissolves in grey, the replay lands exactly on top, chair push repeats. Motion is content. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const tGhost = ctx.cue("Next meeting");
    const tSame = ctx.cue("it goes exactly the same way");
    const tMoment = ctx.cue("Same moment");
    let room = null;
    try { room = ctx.held("room_set"); } catch (e) { room = null; }
    if (!room) room = ctx.scenery("room", "room_set", {});
    const floorY = 800;
    const PX = 700, DX = 1220;

    // table (same seating)
    const table = ctx.el("same_seating", { x: 780, y: 690, w: 360, h: 40, kind: "scenery", exit: "recede" });
    // @form table_top: the meeting table
    kit.rect(table.inner, 0, 0, 360, 40, { fill: "surface", r: 10 });

    // ghost of the first meeting
    const ghost = ctx.el("ghost_of_first_meeting", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", exit: "sink" });
    ctx.character("ghost_priya", "pip", { x: PX, y: floorY, scale: 1.5, parent: ghost.inner, pose: "idle", emotion: "concerned" });
    ctx.character("ghost_dev", "tess", { x: DX, y: floorY, scale: 1.5, flip: true, parent: ghost.inner, pose: "idle", emotion: "concerned" });
    // @form ghost_chair: pushed-back chair of the first meeting
    kit.rect(ghost.inner, DX + 150, floorY - 120, 90, 14, { fill: "muted", r: 6 });
    kit.rect(ghost.inner, DX + 190, floorY - 106, 14, 106, { fill: "muted", r: 4 });
    ghost.outer.setAttribute("opacity", 0);
    Loom.tween(ghost.outer, { opacity: 0 }, { opacity: 0.45, duration: ctx.style.dur("standard") || 0.8, ease: Loom.ease.exit }, tGhost, { kind: "fade_in", beat: ctx.beat.id, content: true });

    // replay on top, lined up exactly
    const rep = ctx.el("replayed_meeting", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", exit: "recede" });
    const pr = ctx.character("priya", "pip", { x: PX, y: floorY, scale: 1.5, parent: rep.inner, pose: "idle", emotion: "concerned" });
    const dv = ctx.character("dev", "tess", { x: DX, y: floorY, scale: 1.5, flip: true, parent: rep.inner, pose: "idle", emotion: "concerned" });
    rep.outer.setAttribute("opacity", 0);
    Loom.tween(rep.outer, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: Loom.ease.exit }, tSame, { kind: "fade_in", beat: ctx.beat.id, content: true });
    // @form chair_push: replayed pushed-back chair
    const chair = ctx.el("pushed_chair", { x: DX + 150, y: floorY - 120, w: 100, h: 120, kind: "scenery", exit: "recede" });
    kit.rect(chair.inner, 0, 0, 90, 14, { fill: "accent", r: 6 });
    kit.rect(chair.inner, 40, 14, 14, 106, { fill: "accent", r: 4 });
    m.pop(chair, tMoment, { overshoot: false });
    dv.gesture("shake", tMoment, tMoment + 1.2);
    pr.emotion("concerned", tSame);
  },
});
