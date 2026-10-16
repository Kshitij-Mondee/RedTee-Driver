// @design one_failure_survived: the laptop repeats its drive failure, then a backup document restores the empty report
Loom.scene("b13", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;
    // Treatments considered: a static healthy board, an abstract before-and-after, or the original failure replayed and repaired. Chosen: replay and repair, because the moving backup proves survival.
    const tFailure = ctx.cue("Same night, same failure.");
    const tBackup = ctx.cue("opens from a backup");

    // @form system_board: the full backup board returns, with the laptop closer but every independent copy still in view
    const board = ctx.el("system_board", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });

    // @form desk_line: a quiet surface grounds the two local devices
    const deskLine = ctx.el("desk_line", { x: 190, y: 646, w: 1040, h: 12, kind: "scenery", parent: board.inner });
    ctx.kit.rect(deskLine.inner, 0, 0, 1040, 12, { fill: "surface2", r: 6, shadow: false });

    // @form laptop: the original laptop is rebuilt at its b02 failure position
    const laptopE = ctx.el("laptop", { x: 300, y: 274, w: 640, h: 386, kind: "instrument", parent: board.inner });
    const laptop = Loom.lesson.laptop(ctx, laptopE.inner, { w: 640, state: "on" });
    laptop.setState("on", null);

    // @form report_main: the Report sits in the exact screen slot of the laptop
    const reportMainE = ctx.el("report_main", { x: laptop.slot.x, y: laptop.slot.y, w: laptop.slot.w, h: laptop.slot.h, kind: "card", parent: laptopE.inner });
    const reportMain = Loom.lesson.report_file(ctx, reportMainE.inner, { size: laptop.slot.h, state: "whole" });
    reportMain.setState("whole", null);

    // @form ext_drive: the local backup drive remains on the same desk after the laptop fails
    const driveE = ctx.el("ext_drive", { x: 960, y: 396, w: 300, h: 204, kind: "instrument", parent: board.inner });
    const drive = Loom.lesson.ext_drive(ctx, driveE.inner, { w: 300, state: "idle" });
    drive.setState("idle", null);

    // @form copy_a: a whole backup Report remains in the drive's first slot
    const copyAE = ctx.el("copy_a", { x: drive.slots[0].x, y: drive.slots[0].y, w: drive.slots[0].w, h: drive.slots[0].h, kind: "card", parent: driveE.inner });
    const copyA = Loom.lesson.report_file(ctx, copyAE.inner, { size: drive.slots[0].h, state: "whole" });
    copyA.setState("whole", null);

    // @form cloud: the independent offsite destination stays visible at the right edge
    const cloudE = ctx.el("cloud", { x: 1420, y: 294, w: 382, h: 266, kind: "instrument", parent: board.inner });
    const cloud = Loom.lesson.cloud(ctx, cloudE.inner, { w: 382, label: true });

    // @form copy_b: the cloud keeps its whole Report throughout the replay
    const copyBE = ctx.el("copy_b", { x: cloud.slot.x, y: cloud.slot.y, w: cloud.slot.w, h: cloud.slot.h, kind: "card", parent: cloudE.inner });
    const copyB = Loom.lesson.report_file(ctx, copyBE.inner, { size: cloud.slot.h, state: "whole" });
    copyB.setState("whole", null);

    // @form boundary: the faint desk boundary recalls that the local copies share a place
    const boundaryE = ctx.el("boundary", { x: 162, y: 194, w: 1110, h: 490, kind: "scenery", parent: board.inner });
    const boundary = Loom.lesson.place_boundary(ctx, boundaryE.inner, { w: 1110, h: 464, text: "Same place", faint: true });
    boundary.setState("faint", null);

    // @form rail: all three completed rule tiles remain visibly lit
    const railE = ctx.el("rail", { x: 444, y: 742, w: 1032, h: 166, kind: "card", parent: board.inner });
    const rail = Loom.lesson.rule_rail(ctx, railE.inner, { size: "normal", labels: true });
    rail.setAll("lit", null);

    laptop.setState("failed", tFailure, { dur: ctx.style.dur("move") * 0.6 });
    reportMain.setState("empty", tFailure + 0.22, { dur: ctx.style.dur("move") * 0.8 });

    // @form tag_failed: the repeated b02 status tag hangs from the laptop fault mark
    const tagFailed = T.label(ctx, "tag_failed", { x: 900, y: 510, text: "Drive failed", to: [laptopE.x + laptop.fault.x, laptopE.y + laptop.fault.y], tone: "ink", role: "label", t: tFailure });
    m.exit(tagFailed, tBackup - 0.08, "recede");

    // @form copy_restore: a fresh document visibly leaves the drive while its stored copy remains behind
    const restoreE = ctx.el("copy_restore", { x: driveE.x + drive.slots[1].x, y: driveE.y + drive.slots[1].y, w: drive.slots[1].w, h: drive.slots[1].h, kind: "card", parent: board.inner });
    const restore = Loom.lesson.report_file(ctx, restoreE.inner, { size: drive.slots[1].h, state: "whole" });
    m.reveal(restoreE, tBackup - 0.06, { dy: 0, dur: 0.01 });
    m.travel(restoreE, tBackup + 0.1, { x: laptopE.x + laptop.slot.x - (driveE.x + drive.slots[1].x), y: laptopE.y + laptop.slot.y - (driveE.y + drive.slots[1].y), scale: laptop.slot.h / drive.slots[1].h, dur: 0.9, ease: "editorial" });
    reportMain.setState("restored", tBackup + 0.92, { dur: ctx.style.dur("move") * 1.1 });
    m.exit(restoreE, tBackup + 1.08, "recede");

    // @form tag_restored: the positive result hangs from the refilled Report
    const tagRestored = T.label(ctx, "tag_restored", { x: 690, y: 400, text: "Restored", to: [laptopE.x + laptop.slot.x + laptop.slot.w, laptopE.y + laptop.slot.y + 42], tone: "pos", role: "label", t: tBackup + 1.05 });
    m.emphasis(reportMainE, tBackup + 1.08);

    // The closer payoff frame preserves the cloud and the completed rail.
    Loom.cam.frame(board, { x: 160, y: 190, w: 1660, h: 720 }, tFailure - 0.06, 1.2, { margin: 18, cy: 485, maxScale: 1.04 });
    void drive; void copyA; void cloud; void copyB; void boundary; void rail;
  },
});
