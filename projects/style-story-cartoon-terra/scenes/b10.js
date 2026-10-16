// @design open_doors_path: a greyed first door gives way to a bright route of alternatives
/* Treatments considered: (A) redraw the path, rejected because continuity must carry the same doors; (B) a close reaction, rejected because the available doors must remain legible; (C) chosen, hold the wide path, lift the question, and let warm doors and the accent route arrive in spoken order. */
Loom.scene("b10", {
  build(ctx) {
    const { m } = ctx;
    const anotherDoor = ctx.cue("Another door");
    const hr = ctx.cue("HR");
    const compliance = ctx.cue("compliance");
    const line = ctx.cue("speak-up line");

    const question = ctx.held("question_sign");
    const maya = ctx.held("maya");
    // These path elements are not kept by the trimmed storyboard, so rebuild the matching set for this reveal.
    const pathShell = ctx.el("path_shell_b10", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const path = Loom.lesson.door_path(ctx, pathShell.inner, {
      dim: true,
      doors: { manager: "greyed", other: "signed", hr: "signed", compliance: "signed", line: "signed" },
      lines: "fork"
    });
    // The rebuilt path sits over the carried rig, so a matching foreground Maya preserves the established layering.
    const mayaOverlay = ctx.el("maya_overlay", { x: 100, y: 60, w: 460, h: 890, kind: "character", exit: "recede" });
    const mayaRig = ctx.character("Maya", "maya", { x: 330, y: 940, scale: 0.46, skin: 0, top: "cloth", parent: mayaOverlay.inner, pose: "think" });

    // Dawn resets the held path, then the accent route and each alternative arrive in spoken order.
    path.setState("day", anotherDoor);
    path.setState("lines_past", anotherDoor);
    path.setState("other:lit", anotherDoor);
    m.draw(path.past, anotherDoor);
    path.setState("hr:lit", hr);
    path.setState("compliance:lit", compliance);
    path.setState("line:lit", line);

    // The question has done its work, so it lifts out on the first answer word.
    m.exit(question, anotherDoor, "recede");
    mayaRig.emotion("happy", line);
    mayaRig.look(1, 0, line);
    mayaRig.pose("present", line, { dur: 0.5 });
  },
});
