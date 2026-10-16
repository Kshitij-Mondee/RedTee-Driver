// @design two_storage_kinds: one failed device leaves a separate storage device intact
// Treatments: A, static paired devices with state changes. B, copies travel into a second device. C, split comparison. Chosen B because the transfer makes the separate storage visible.
Loom.scene("b06", {
  build(ctx, props) {
    const kit = ctx.kit;
    const tTwo = ctx.cue("Two: two kinds of storage.");
    const tLaptop = ctx.cue("Say, the laptop and an external drive.");
    const tDrive = ctx.cue("an external drive");
    const tFault = ctx.cue("One fault");
    const tBoth = ctx.cue("unlikely to take both");

    const laptop = ctx.held("laptop");
    const reportMain = ctx.held("report_main");
    const copyA = ctx.held("copy_a");
    const copyB = ctx.held("copy_b");
    const rail = ctx.held("rail");

    rail.handle.setState(0, "lit", tTwo, { dur: ctx.style.dur("move") });

    // @form desk_line: shared desk baseline
    const deskLine = ctx.el("desk_line", { x: 250, y: 656, w: 1240, h: 10, kind: "connector", exit: "recede" });
    kit.line(deskLine.inner, 0, 4, 1240, 4, { stroke: "line", sw: 4 });
    ctx.m.draw(deskLine, tLaptop, { dur: ctx.style.dur("draw") });

    // @form label_laptop: device name adjacent to laptop
    const labelLaptop = ctx.el("label_laptop", { x: 510, y: 170, w: 220, h: 42, kind: "text", exit: "wipe" });
    kit.text(labelLaptop.inner, "Laptop", { role: "label", size: 28, x: 0, y: 0, w: 220, h: 42, align: "center", valign: "middle", weight: 700, color: "muted" });
    ctx.m.reveal(labelLaptop, tLaptop + 0.12, { dy: 8, dur: ctx.style.dur("enter") });

    // @form ext_drive: second physical storage device
    const extDrive = ctx.el("ext_drive", { x: 1050, y: 380, w: 380, h: 258, kind: "instrument", exit: "recede" });
    const driveHandle = Loom.lesson.ext_drive(ctx, extDrive.inner, { w: 380, state: "idle" });
    ctx.m.settle(extDrive, tDrive, { dur: ctx.style.dur("enter") });

    // @form label_drive: name of the external drive
    const labelDrive = ctx.el("label_drive", { x: 1030, y: 170, w: 420, h: 42, kind: "text", exit: "wipe" });
    kit.text(labelDrive.inner, "External drive", { role: "label", size: 28, x: 0, y: 0, w: 420, h: 42, align: "center", valign: "middle", weight: 700, color: "muted" });
    ctx.m.reveal(labelDrive, tDrive + 0.14, { dy: 8, dur: ctx.style.dur("enter") });

    ctx.m.travel(copyA, tDrive + 0.2, { x: 480, y: -60, scale: 1.05, dur: 0.8 });
    ctx.m.travel(copyB, tDrive + 0.34, { x: 660, y: -60, scale: 1.05, dur: 0.8 });

    laptop.handle.setState("failed", tFault, { dur: ctx.style.dur("move") });
    reportMain.handle.setState("empty", tFault + 0.08, { dur: ctx.style.dur("move") });
    rail.handle.setState(1, "named", tBoth, { dur: ctx.style.dur("move") });
    rail.handle.showLabel(1, tBoth + 0.12);

    laptop.handle.setState("on", ctx.speechEnd - 0.62, { dur: ctx.style.dur("move") });
    reportMain.handle.setState("restored", ctx.speechEnd - 0.56, { dur: ctx.style.dur("enter") });
  }
});
