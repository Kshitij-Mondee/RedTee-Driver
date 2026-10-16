// @design counted_survival: duplicate a whole card, strike one, then recover it from a survivor
Loom.scene("b05", {
  build(ctx) {
    // Treatments considered: static trio with one crossed out; a three-way fan; a horizontal copy route and return.
    // Choose copy travel: count grows visibly and a survivor provides the recovery.
    const M = ctx.m;
    const tA = ctx.cue("Start with three");
    const tB = ctx.cue("plus two backups");
    const tFailure = ctx.cue("One failure");
    const tReturn = ctx.cue("leaves you with zero");
    // @form persistent_device: the same device and slot, never redrawn
    const laptop = ctx.held("laptop");
    // @form original_copy: the original is restored, lost, and recovered in place
    const report = ctx.held("report_main");
    // @form counted_rule: the active count belongs to the persistent rail
    const rail = ctx.held("rail");
    laptop.handle.setState("on", ctx.start);
    report.handle.setState("whole", ctx.start);
    const slot = laptop.handle.slot;
    const sx = 420 + slot.x;
    const sy = 300 + slot.y;
    const opts = { size: 220, state: "whole" };
    const size = Loom.lesson.report_file.size(opts);
    const ax = 1100, bx = 1330, rowY = sy;
    const launchX = sx + slot.w + 42;
    // @form first_backup: a distinct whole copy travels from the original
    const copyA = ctx.el("copy_a", { x: launchX, y: sy, w: size.w, h: size.h, kind: "token", exit: "none" });
    copyA.handle = Loom.lesson.report_file(ctx, copyA.inner, opts);
    M.reveal(copyA, tA, { dy: 0, dur: ctx.style.dur("move") });
    M.travel(copyA, tA, { x: ax - launchX, y: rowY - sy, dur: ctx.style.dur("move") * 2 });
    // @form second_backup: the second backup completes the three-copy row
    const copyB = ctx.el("copy_b", { x: launchX, y: sy, w: size.w, h: size.h, kind: "token", exit: "none" });
    copyB.handle = Loom.lesson.report_file(ctx, copyB.inner, opts);
    M.reveal(copyB, tB, { dy: 0, dur: ctx.style.dur("move") });
    M.travel(copyB, tB, { x: bx - launchX, y: rowY - sy, dur: ctx.style.dur("move") * 2 });
    report.handle.setState("empty", tFailure, { dur: ctx.style.dur("move") });
    // @form struck_original: one small outcome mark, not a failed whole system
    const cross = Loom.treat.mark(ctx, "mark_struck", { x: sx + slot.w - 22, y: sy + slot.h - 22, size: 48, kind: "no", t: tFailure });
    cross.exit = "recede";
    rail.handle.setState(0, "named", tReturn, { dur: ctx.style.dur("move") });
    rail.handle.showLabel(0, tReturn); // Keep the copy count visible into the storage test.
    const countText = rail.handle.tiles[0].labelG.querySelector("text");
    if (countText) Loom.drive((e,raw) => countText.setAttribute("font-size", 45), tReturn, ctx.style.dur("move"), "linear", {key:"b05_label_size_0"});
    // @form recovery_carrier: a ghost leaves a surviving copy while the survivor stays whole
    const ghost = ctx.el("recovery_ghost", { x: ax, y: rowY, w: size.w, h: size.h, kind: "token", exit: "recede" });
    ghost.handle = Loom.lesson.report_file(ctx, ghost.inner, { size: 220, state: "whole", label: false });
    M.reveal(ghost, tReturn, { dy: 0, dur: ctx.style.dur("move") * 0.5 });
    M.travel(ghost, tReturn, { x: sx - ax, y: sy - rowY, dur: ctx.style.dur("move") * 2 });
    const tRefill = tReturn + ctx.style.dur("move") * 2;
    report.handle.setState("whole", tRefill, { dur: ctx.style.dur("enter") * 0.8 });
    M.exit(ghost, tRefill, "recede");
    M.exit(cross, tRefill, "recede");
  }
});
