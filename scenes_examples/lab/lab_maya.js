// @lab {"title": "Maya, imported (D-93): the Claude Design delivery as a Loom rig. Poses from the delivery's own pose data, faces by emotion, hands held, a nod", "styles": ["corporate-clean", "story-cartoon"], "dur": 8.0, "times": [0.6, 2.2, 3.8, 5.4, 7.4]}
// Maya stands in a quiet office, moves through four of her delivered poses (idle, explain, think, present), changes
// expression, holds a pointing hand, and nods. Imported with py tools/rig_import.py assets/incoming/maya-v5 --id maya.
Loom.scene("lab_maya", {
  build(ctx) {
    const { kit } = ctx;
    kit.rect(ctx.el("wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "ground" }).inner, 0, 860, 1920, 220, { fill: "field2", flat: true });
    const maya = ctx.character("maya", "maya", { x: 700, y: 1000, scale: 0.48, pose: "idle" });
    maya.pose("explain", 1.6, { dur: 0.6 });
    maya.emotion("smile", 1.6);
    maya.pose("think", 3.2, { dur: 0.6 });
    maya.emotion("focus", 3.2);
    maya.pose("present", 4.8, { dur: 0.6 });
    maya.emotion("listening", 4.8);
    maya.hold("hand_l", "palm_up_offer", 4.8, 8);
    maya.gesture("nod", 6.6, 7.6);
    maya.emotion("happy", 6.6);
    const sit = ctx.character("maya_sit", "maya", { x: 1450, y: 1000, scale: 0.48, pose: "sit" });
    sit.emotion("concern", 0);
  },
});
