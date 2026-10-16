// @design shared_enclosure_loss: one wash takes all cards within one enclosure
Loom.scene("b07", {
  build(ctx, props) {
    // Three treatments: static enclosure with a common risk mark; separate strikes on each card; one rising wash across the shared enclosure.
    // Choose the wash: its shared reach explains simultaneous loss, without literal disaster imagery.
    const laptop = ctx.held("laptop");
    const main = ctx.held("report_main");
    const drive = ctx.held("ext_drive");
    const a = ctx.held("copy_a");
    const b = ctx.held("copy_b");
    const desk = ctx.held("desk_line");
    ctx.held("label_laptop");
    const labelDrive = ctx.held("label_drive");
    const driveText = labelDrive.inner.querySelector("text");
    // Darken only the held label so the shared wash preserves its contrast.
    if (driveText) Loom.drive(() => {
      driveText.setAttribute("fill", ctx.c("ink"));
      driveText.style.fill = ctx.c("ink");
    }, ctx.start, ctx.style.dur("move"), "linear", {key:"b07_drive_label_contrast"});
    const rail = ctx.held("rail");
    const tPlace = ctx.cue("both sit on your desk");
    const tEvent = ctx.cue("One fire, flood or theft");
    const tTogether = ctx.cue("takes them together");
    rail.handle.setState(1, "lit", ctx.start);
    // @form common_place: the enclosure is created after every object it covers
    const left = Math.min(laptop.x, drive.x, desk.x);
    const top = Math.min(laptop.y, drive.y) - 90;
    const right = Math.max(laptop.x + laptop.w, drive.x + drive.w, desk.x + desk.w);
    const bottom = Math.max(laptop.y + laptop.h, drive.y + drive.h, desk.y + desk.h);
    const box = Loom.lesson.place_boundary.around({x:left, y:top, w:right-left, h:bottom-top}, {pad:28});
    const boundary = ctx.el("boundary", {x:box.x, y:box.y, w:box.w, h:box.h, kind:"scenery", exit:"none"});
    boundary.handle = Loom.lesson.place_boundary(ctx, boundary.inner, {w:box.dashW, h:box.dashH, text:"Same place", state:"drawn"});
    ctx.m.unmask(boundary, tPlace, {dir:"ltr", dur:ctx.style.dur("draw")});
    boundary.handle.setState("filled", tEvent);
    main.handle.setState("empty", tEvent);
    a.handle.setState("empty", tEvent);
    b.handle.setState("empty", tEvent);
    // Keep the device on: only the single shared outcome mark is required, not a second drive-fault mark.
    // @form common_loss: one outcome on the shared perimeter
    const mark = Loom.treat.mark(ctx, "mark_together", {x:box.x+box.w-36, y:box.y+26+box.dashH/2, size:64, kind:"no", t:tTogether});
    mark.exit = "recede";
  }
});
