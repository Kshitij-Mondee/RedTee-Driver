// @design same_place_event: one slate boundary makes shared exposure visible
// Treatment 1: static desk outline with a risk tag.
// Treatment 2: a boundary fills once and changes every contained Report together.
// Treatment 3: separate failure icons on every device.
// Chosen: treatment 2, because one moving field is the causal argument.
Loom.scene("b07", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const tDesk = ctx.cue("both sit on your desk");
    const tEvent = ctx.cue("One fire, flood or theft");
    const tTogether = ctx.cue("takes them together");

    const laptop = ctx.held("laptop");
    const reportMain = ctx.held("report_main");
    const extDrive = ctx.held("ext_drive");
    const copyA = ctx.held("copy_a");
    const copyB = ctx.held("copy_b");
    const deskLine = ctx.held("desk_line");
    const labelLaptop = ctx.held("label_laptop");
    const labelDrive = ctx.held("label_drive");
    const rail = ctx.held("rail");

    if (rail && rail.handle) rail.handle.setState(1, "lit", ctx.start + 0.12, { dur: ctx.style.dur("move") });
    m.travel(rail, ctx.start + 0.12, { x: -460, y: 320, scale: 0.65, dur: ctx.style.dur("move") });

    const around = Loom.lesson.place_boundary.around({ x: 260, y: 236, w: 1210, h: 454 }, { pad: 28 });
    // @form boundary: shared-place event boundary
    const boundary = ctx.el("boundary", { x: around.x, y: around.y, w: around.w, h: around.h, kind: "card", exit: "none" });
    const boundaryPart = Loom.lesson.place_boundary(ctx, boundary.inner, {
      w: around.dashW,
      h: around.dashH,
      text: "Same place",
      state: "drawn"
    });
    m.unmask(boundary, tDesk, { dir: "ttb", dur: ctx.style.dur("draw") });

    // Keep the rail and device names above the slate event wash so their muted type remains readable.
    boundary.outer.parentNode.appendChild(rail.outer);
    boundary.outer.parentNode.appendChild(labelLaptop.outer);
    boundary.outer.parentNode.appendChild(labelDrive.outer);

    boundaryPart.setState("filled", tEvent, { dur: ctx.style.dur("enter") * 1.6 });
    if (reportMain && reportMain.handle) reportMain.handle.setState("empty", tEvent + 0.10, { dur: ctx.style.dur("move") });
    if (copyA && copyA.handle) copyA.handle.setState("empty", tEvent + 0.10, { dur: ctx.style.dur("move") });
    if (copyB && copyB.handle) copyB.handle.setState("empty", tEvent + 0.10, { dur: ctx.style.dur("move") });

    // @form mark_together: shared-loss cross
    const markTogether = ctx.el("mark_together", { x: 1378, y: 628, w: 72, h: 72, kind: "mark", exit: "recede" });
    kit.mark(markTogether.inner, "no", 36, 36, 64);
    m.pop(markTogether, tTogether, { dur: ctx.style.dur("enter") });
  }
});
