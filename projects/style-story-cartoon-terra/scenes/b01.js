// @design duplicate_receipt_hesitation: matching receipts expose a duplicate while a colleague reaches then retreats
/*
 * Treatments considered: (A) a floating warning card, rejected because the fact belongs on receipts;
 * (B) a close-up of totals, rejected because Maya's hesitation would be lost;
 * (C) chosen, a medium desk shot where matching receipts land, the duplicate is circled, and Maya retreats from her phone.
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const mayaAt = ctx.cue("Say this is Maya, in finance.");
    const claimAt = ctx.cue("One expense claim doesn't add up.");
    const duplicateAt = ctx.cue("The same dinner, claimed twice.");
    const thoughtAt = ctx.cue("Her first thought? Leave it.");
    const leaveAt = ctx.cue("Leave it.");

    // @form office_wall: Maya's warm paper office wall and window
    const back = Loom.lesson.desk_set(ctx, ctx.g, { framing: "medium", layer: "back" });
    const room = back.room;

    // @form maya_reaction: Maya considers what she sees from behind the desk edge
    const maya = ctx.character("maya", "maya", {
      x: back.anchors.maya.x, y: back.anchors.maya.y, scale: back.anchors.maya.scale,
      pose: "idle", skin: 0, cloth: "cloth"
    });
    maya.emotion("focus", mayaAt + 0.16);
    maya.pose("think", claimAt + 0.28, { dur: 0.42 });
    maya.emotion("concern", duplicateAt + 0.18);
    maya.pose("phone", thoughtAt + 0.06, { dur: 0.36 });
    maya.pose("think", leaveAt + 0.05, { dur: 0.32 });

    // @form desk_and_evidence: desk edge, laptop, phone and matching receipts
    const front = Loom.lesson.desk_set(ctx, ctx.g, {
      framing: "medium", layer: "front", laptop: "sheet", ring: true, magnifier: false
    });
    const desk = front.desk;
    const receipts = front.receipts;
    const receiptCircle = front.ring;
    const laptop = front.laptop;
    const phone = front.phone;
    m.drop(receipts, claimAt);
    m.draw(receiptCircle, duplicateAt);

    // @form pinned_wall_note: a hand-lettered paper note names Maya's observation
    const titleNote = Loom.treat.panel(ctx, "title_note", {
      x: 65, y: back.anchors.wall_left.y, w: 500, h: 150,
      title: "", fill: "surface", tone: "ink", t: duplicateAt
    });
    kit.text(titleNote.inner, "Something doesn't add up", {
      role: "label", weight: 400, x: 28, y: 28, w: 444, h: 88, align: "left", valign: "middle", maxLines: 1, color: "ink"
    });
  },
});
