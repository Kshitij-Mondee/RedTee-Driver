// @design outside_survives: a card crosses a bounded field and remains whole when the field fills
Loom.scene("b08", {
  build(ctx, props) {
    // Three treatments: static split with signalling; a card crossing a boundary; a camera-led journey.
    // Choose the boundary crossing, because leaving the common failure zone is the mechanism.
    const m = ctx.m;
    const tMove = ctx.cue("keep a copy offsite");
    const tCloud = ctx.cue("The cloud");
    const tReplay = ctx.cue("common way to do it");
    const laptop = ctx.held("laptop");
    const report = ctx.held("report_main");
    const drive = ctx.held("ext_drive");
    const copyA = ctx.held("copy_a");
    const copyB = ctx.held("copy_b");
    const desk = ctx.held("desk_line");
    const labelLaptop = ctx.held("label_laptop");
    const labelDrive = ctx.held("label_drive");
    const boundary = ctx.held("boundary");
    const rail = ctx.held("rail");
    const resetDur = ctx.style.dur("enter");
    // Preserve the held device name's contrast while the replay wash fills its ground.
    const laptopText = labelLaptop.inner.querySelector("text");
    if (laptopText) Loom.drive(() => {
      laptopText.setAttribute("fill", ctx.c("ink"));
      laptopText.style.fill = ctx.c("ink");
    }, ctx.start, resetDur, "linear", {key:"b08_laptop_label_contrast"});
    boundary.handle.setState("cleared", ctx.start, {dur: resetDur});
    laptop.handle.setState("on", ctx.start, {dur: resetDur});
    [report, copyA, copyB].forEach(E => E.handle.setState("whole", ctx.start, {dur: resetDur}));
    boundary.handle.setState("faint", ctx.start + resetDur);
    rail.handle.setState(1, "lit", ctx.start);
    // @form readable_rule: enlarge the retained rail and its labels together, above captions.
    m.travel(rail, tMove, {x:618-rail.x, y:750-rail.y, scale:0.75, dur:ctx.style.dur("enter")*2});
    rail.handle.tiles.forEach((tile,i) => {
      const text = tile.labelG.querySelector("text");
      if (text) Loom.drive((e,raw) => text.setAttribute("font-size", 28+9*raw), tMove, ctx.style.dur("enter"), "linear", {key:"b08_label_size_"+i});
    });
    // @form remote_store: a new storage location outside the common event
    // Open room for the remote location while retaining every original drawing at readable scale.
    [laptop, report, drive, desk, labelLaptop, labelDrive, boundary].forEach(E => {
      m.travel(E, tMove, {x:-240, y:0, dur:ctx.style.dur("enter")*2});
    });
    m.travel(copyA, tMove, {x:drive.x-240+drive.handle.slots[0].x-copyA.x, y:drive.y+drive.handle.slots[0].y-copyA.y, scale:drive.handle.slots[0].h/copyA.handle.h, dur:ctx.style.dur("enter")*2});
    const cloudOpts = {w:382};
    const cs = Loom.lesson.cloud.size(cloudOpts);
    const cloud = ctx.el("cloud", {x:1420, y:346, w:cs.w, h:cs.h, kind:"instrument", exit:"recede"});
    const ch = Loom.lesson.cloud(ctx, cloud.inner, cloudOpts);
    cloud.handle = ch;
    // Lift only the copy's drawing above the cloud, retaining its registered outer lifecycle.
    copyB.outer.parentNode.insertBefore(cloud.outer, copyB.outer);
    m.reveal(cloud, tMove, {dy:0, dur:ctx.style.dur("enter")});
    m.reveal({inner:ch.labelG}, tCloud, {dy:0, dur:ctx.style.dur("move")});
    // Keep the label on the remote copy above the reading floor as the card scales down.
    const remoteText = copyB.handle.layers.label.querySelector("text");
    if (remoteText) Loom.drive((e,raw) => remoteText.setAttribute("font-size", 28+10*raw), tMove, ctx.style.dur("enter"), "linear", {key:"b08_remote_label_size"});
    // Only the held copy moves. Nothing new remains in its former slot.
    m.travel(copyB, tMove, {x:1420+ch.slot.x-copyB.x, y:346+ch.slot.y-copyB.y, scale:ch.slot.h/copyB.handle.h, dur:ctx.style.dur("enter")*2});
    // Replay the wash in the same bounded region, without affecting the remote copy.
    boundary.handle.setState("filled", tReplay, {dur:ctx.style.dur("enter")*1.6});
    rail.handle.setState(2, "named", tReplay);
    rail.handle.showLabel(2, tReplay);
    // Settle back to the recoverable system that the later board rebuild uses.
    boundary.handle.setState("faint", ctx.speechEnd-ctx.style.dur("move"), {dur:ctx.style.dur("move")});
  }
});
