// @design blocked_manager_fork: a greyed door turns a familiar path into an open question
/* Treatments considered: (A) a floating question card, rejected because it leaves the path; (B) a close reaction, rejected because the five alternatives must stay visible; (C) chosen, a dim wide path where the grey manager door and hanging question make the fork readable. */
Loom.scene("b09", {
  build(ctx) {
    const { m, kit } = ctx;
    const ownManager = ctx.cue("her own manager");
    const questionAt = ctx.cue("Where does she go");

    // The named shell gives the kit's named subparts a held owner for the continuous join.
    const pathShell = ctx.el("path_shell", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "hold" });
    const path = Loom.lesson.door_path(ctx, pathShell.inner, {
      dim: true,
      doors: { manager: "signed", other: "signed", hr: "signed", compliance: "signed", line: "signed" },
      lines: "fork"
    });
    // The held path_set carries the kit handle so b10 can change the same doors and path.
    path.set.handle = path;
    path.setState("manager:greyed", ownManager);

    // @form question_sign: a paper notice hangs from the path hook and gives the fork its spoken question
    const question_sign = ctx.el("question_sign", { x: 620, y: 150, w: 500, h: 234, kind: "card", exit: "recede" });
    kit.line(question_sign.inner, 250, 0, 250, 34, { stroke: "ink", sw: 5 });
    kit.rect(question_sign.inner, 0, 34, 500, 200, { fill: "surface", r: 10 });
    kit.text(question_sign.inner, "Her manager is", { role: "label", x: 30, y: 44, w: 440, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    kit.text(question_sign.inner, "involved.", { role: "label", x: 30, y: 94, w: 440, h: 48, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    kit.text(question_sign.inner, "Where now?", { role: "lead", x: 30, y: 138, w: 440, h: 64, align: "center", valign: "middle", maxLines: 1, color: "accent" });
    m.drop(question_sign, questionAt);

    // @form maya: Maya pauses at the left of the fork, with her face and tilt carrying the turn.
    const maya = ctx.el("maya", { x: 100, y: 60, w: 460, h: 890, kind: "character", exit: "hold" });
    const mayaRig = ctx.character("Maya", "maya", { x: 330, y: 940, scale: 0.46, skin: 0, top: "cloth", parent: maya.inner, pose: "idle" });
    maya.handle = mayaRig;
    mayaRig.emotion("worried", ownManager);
    mayaRig.pose("think", questionAt, { dur: 0.5 });
    mayaRig.gesture("tilt", questionAt + 0.3, ctx.speechEnd + 1.8);
  },
});
