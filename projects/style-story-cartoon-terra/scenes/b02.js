// @design uneasy_look_turns_resolved: a close desk reaction moves from the circled receipt to a steady look at the viewer
/*
 * Treatments considered: (A) a floating question card, rejected because it separates the reaction from its cause;
 * (B) a wide desk view, rejected because Maya's face would be too small for the turn;
 * (C) chosen, a close desk shot where the circled receipt sits at the lower edge and Maya lifts her gaze.
 */
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const pullAt = ctx.cue("Felt that pull?");
    const doAt = ctx.cue("Here's what to do with it.");

    // @form office_close: the office wall frames a close reaction without competing with the receipt.
    const room = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const back = Loom.lesson.desk_set(ctx, room.inner, {
      framing: "close", layer: "back", prefix: "close_back_"
    });

    // @form maya_reaction: Maya fills the right side of the close shot, while the desk hides the crop below her waist.
    const maya = ctx.character("maya", "maya", {
      x: back.anchors.maya.x - 120, y: back.anchors.maya.y, scale: back.anchors.maya.scale,
      pose: "idle", skin: 0, cloth: "cloth"
    });

    // @form desk_foreground: the near desk edge creates depth and covers Maya below the waist.
    const desk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    Loom.lesson.desk_set(ctx, desk.inner, { framing: "close", only: ["desk"], prefix: "close_desk_" });

    // @form matching_receipts: the two dinner receipts remain at the lower frame edge as the reason for her unease.
    const receipts = ctx.el("receipts", { x: 120, y: 0, w: 1920, h: 1080, kind: "card", exit: "recede" });
    Loom.lesson.desk_set(ctx, receipts.inner, {
      framing: "close", only: ["receipts"], prefix: "close_receipts_", ring: true
    });

    // @form receipt_ring: the circle is carried by the receipt kit drawing, the frame's only teaching accent.
    const receiptCircle = ctx.el("receipt_circle", { x: 120, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });

    // Narration describes Maya, so her mouth stays shut while her face and posture make the turn.
    maya.emotion("focus", pullAt);
    maya.gesture("tilt", pullAt, doAt - 0.14);
    maya.emotion("resolve", doAt);
    maya.gesture("nod", doAt + 0.38, ctx.speechEnd - 0.04);
  },
});
