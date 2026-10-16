// @design b10_system_at_rest: finished copies occupy independent places while the rule resolves as one family
Loom.scene("b10", {
  build(ctx) {
    // Treatment A: a static board with a single rule recolour. Treatment B: copies fly apart. Treatment C: a large slogan over the board. Chosen A, because consolidation needs a calm, credible rest frame.
    const kit = ctx.kit;
    const tHold = ctx.cue("Not more copies.");
    const tRule = ctx.cue("Copies that cannot all fail together.");

    // @form system_board: one bounded workstation holds the local copies and the offsite copy sits apart
    const board = ctx.el("system_board", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });

    // @form desk_line: a neutral desk edge grounds the laptop and drive
    const desk = ctx.el("desk_line", { x: 190, y: 646, w: 970, h: 12, kind: "scenery", parent: board.inner });
    kit.rect(desk.inner, 0, 0, 970, 12, { fill: "surface2", r: 6, shadow: false });

    // @form laptop: the working computer still carries the main Report
    const laptopE = ctx.el("laptop", { x: 250, y: 274, w: 540, h: 326, kind: "instrument", parent: board.inner });
    const laptop = Loom.lesson.laptop(ctx, laptopE.inner, { w: 540, state: "on" });
    laptop.setState("on", null);

    // @form report_main: the main Report sits inside the laptop screen
    const reportMainE = ctx.el("report_main", { x: 435, y: 314, w: 154, h: 205, kind: "card", parent: board.inner });
    const reportMain = Loom.lesson.report_file(ctx, reportMainE.inner, { size: 205, state: "whole" });
    reportMain.setState("whole", null);

    // @form ext_drive: the external drive holds an independent Report copy
    const driveE = ctx.el("ext_drive", { x: 820, y: 396, w: 300, h: 204, kind: "instrument", parent: board.inner });
    const drive = Loom.lesson.ext_drive(ctx, driveE.inner, { w: 300, state: "idle" });
    drive.setState("idle", null);

    // @form copy_a: the drive contains a whole Report copy
    const copyAE = ctx.el("copy_a", { x: 860, y: 399, w: 94, h: 126, kind: "card", parent: board.inner });
    const copyA = Loom.lesson.report_file(ctx, copyAE.inner, { size: 126, state: "whole" });
    copyA.setState("whole", null);

    // @form cloud: the remote destination keeps the offsite Report copy
    const cloudE = ctx.el("cloud", { x: 1350, y: 294, w: 382, h: 266, kind: "instrument", parent: board.inner });
    const cloud = Loom.lesson.cloud(ctx, cloudE.inner, { w: 382, label: true });

    // @form copy_b: the cloud contains a whole Report copy
    const copyBE = ctx.el("copy_b", { x: 1487, y: 352, w: 105, h: 140, kind: "card", parent: board.inner });
    const copyB = Loom.lesson.report_file(ctx, copyBE.inner, { size: 140, state: "whole" });
    copyB.setState("whole", null);

    // @form place_boundary: a faint boundary marks the copies sharing the desk
    const boundaryE = ctx.el("boundary", { x: 162, y: 194, w: 1010, h: 490, kind: "scenery", parent: board.inner });
    const boundary = Loom.lesson.place_boundary(ctx, boundaryE.inner, { w: 1010, h: 464, text: "Same place", faint: true });
    boundary.setState("faint", null);

    // @form rule_rail: the completed 3-2-1 rule is readable as three equal tiles
    const railE = ctx.el("rail", { x: 444, y: 742, w: 1032, h: 166, kind: "card", parent: board.inner });
    const rail = Loom.lesson.rule_rail(ctx, railE.inner, { size: "normal", labels: true });
    rail.setAll("lit", null);
    rail.setAll("named", tRule, { stagger: 0 });
    ctx.m.emphasis(railE, tRule + 0.25);

    Loom.cam.frame(board, { x: 120, y: 174, w: 1680, h: 742 }, tHold + 0.1, 1.5, { margin: 18, cy: 490, maxScale: 1.08 });
  },
});
