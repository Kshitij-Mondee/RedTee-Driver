// @design reaction_close_look_up: a close on a face that looks down at the evidence, then lifts to meet the viewer
// Treatments: (A) static close with the ring, signalled by gaze only; (B) CHOSEN: close + eyes down then up with a small head lift and nod; (C) cut-in to a bust disc (rejected: loses the desk).
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const stage = ctx.el("close_stage", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const set = Loom.lesson.desk_set(ctx, stage.inner, { framing: "close", layer: "back", only: ["wall"] });
    const A = set.anchors.maya;
    // scale 1.75 (feet 3157) puts brow to chin at 250 px or more with the bun inside the frame
    const maya = ctx.character("maya", "maya", { x: A.x, y: 3157, scale: 1.75, pose: "idle", parent: stage.inner });
    const front = Loom.lesson.desk_set(ctx, stage.inner, { framing: "close", layer: "front", laptop: "closed" });   // closed: the sheet's words would be cut by the close frame's left edge
    if (front.laptop && front.laptop.inner) {
      front.laptop.inner.setAttribute("data-bleed", "1");
      front.laptop.inner.querySelectorAll("*").forEach((n) => n.setAttribute("data-bleed", "1"));   // the laptop runs off the left edge on purpose (close framing)
    }

    const t1 = ctx.cue("Felt that pull");
    const t2 = ctx.cue("Here's what to do");
    // eyes down, uneasy
    maya.pose("worried", ctx.start + 0.05, { dur: 0.3 });
    maya.emotion("concern", ctx.start + 0.05);
    if (maya.look) maya.look(0, 0.9, t1 - 0.1);
    maya.emotion("doubt", t1);
    maya.gesture("tilt", t1, t1 + 1.0);
    // look up to the viewer, resolved breath, small nod
    maya.pose("idle", t2 - 0.15, { dur: 0.5 });
    if (maya.look) maya.look(0, -0.1, t2 - 0.1);
    maya.emotion("focus", t2 - 0.05);
    maya.gesture("nod", t2 + 0.35, t2 + 1.2);
  },
});
