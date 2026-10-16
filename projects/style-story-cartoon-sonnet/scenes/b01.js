// @design reach_and_retreat: a person at a desk finds two identical papers, reaches for the phone and pulls her hand back
/* Treatments: (A) static desk with a note and ring (signalling only); (B) CHOSEN: the desk set, receipts drop, ring draws,
 * note pins on the free wall, Maya reaches toward the phone then retreats; (C) a close crop on the receipts (that is b02). */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = kit;

    // layer back: wall and window (element "room"), then Maya, then the desk front (hides her below the waist)
    const back = Loom.lesson.desk_set(ctx, ctx.g, { framing: "medium", layer: "back" });
    const A = back.anchors;
    const maya = ctx.character("maya", "maya", { x: A.maya.x, y: A.maya.y, scale: A.maya.scale, pose: "idle" });
    const set = Loom.lesson.desk_set(ctx, ctx.g, { framing: "medium", layer: "front", laptop: "sheet", magnifier: false });

    // 1. "Say this is Maya": she settles, focus
    const tMaya = ctx.cue("Say this is Maya");
    maya.pose("listen", tMaya, { dur: 0.6 });
    maya.emotion("focus", tMaya + 0.3);


    // 2. "One expense claim": the two receipts drop in side by side
    m.drop(set.receipts, Math.max(ctx.start + 0.05, ctx.cue("One expense claim")));

    // 3. "claimed twice": the accent ring draws, the note pins on the free wall (clear of window and receipts)
    const tTwice = ctx.cue("claimed twice");
    m.draw(set.ring, tTwice);
    const W = A.wall_left;
    const note = ctx.el("title_note", { x: W.x + 20, y: W.y + 90, w: 360, h: 190, kind: "card", exit: "recede" });
    const ng = Loom.svg("g", { transform: "rotate(-3 180 95)" }, note.inner);
    K.rect(ng, 0, 0, 360, 190, { fill: "surface", r: 8 });
    K.disc(ng, 180, 18, 11, { fill: "muted" });
    K.text(ng, "Something doesn't add up", { role: "lead", size: 40, weight: 400, x: 20, y: 36, w: 320, h: 140, maxLines: 2, align: "center", valign: "middle", color: "ink" });
    m.drop(note, tTwice + 0.5);
    maya.emotion("concern", tTwice + 0.8);

    // 4. "Her first thought": the hand reaches toward the phone; 5. "Leave it": it pulls back, uneasy
    const tThought = ctx.cue("Her first thought");
    const tLeave = ctx.cue("Leave it");
    maya.pose("lean", tThought, { dur: 0.5 });
    maya.pose("chin", tLeave, { dur: 0.5 });

    maya.emotion("doubt", tLeave);
  },
});
