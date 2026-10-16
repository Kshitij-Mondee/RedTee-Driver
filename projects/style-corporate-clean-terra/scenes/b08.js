// @design b08_offsite_copy: a report travels beyond the same-place boundary and remains intact
Loom.scene("b08", {
  build(ctx) {
    const { m } = ctx;
    const tOffsite = ctx.cue("keep a copy offsite");
    const tCloud = ctx.cue("The cloud");
    const tProof = ctx.cue("common way to do it");

    const laptop = ctx.held("laptop");
    const reportMain = ctx.held("report_main");
    const drive = ctx.held("ext_drive");
    const copyA = ctx.held("copy_a");
    const copyB = ctx.held("copy_b");
    const deskLine = ctx.held("desk_line");
    const labelLaptop = ctx.held("label_laptop");
    const labelDrive = ctx.held("label_drive");
    const boundary = ctx.held("boundary");
    const rail = ctx.held("rail");

    reportMain.handle.setState("restored", ctx.start + 0.04, { dur: 0.5 });
    copyA.handle.setState("restored", ctx.start + 0.04, { dur: 0.5 });
    copyB.handle.setState("restored", ctx.start + 0.04, { dur: 0.5 });
    boundary.handle.setState("cleared", ctx.start + 0.04, { dur: 0.5 });

    // @form board_widen: camera frame that makes room beyond the desk boundary
    const boardWiden = ctx.el("board_widen", { x: 120, y: 180, w: 1680, h: 600, kind: "scenery", exit: "recede" });
    Loom.cam.frame(boardWiden, { x: 0, y: 0, w: 1680, h: 600 }, tOffsite - 0.1, 1.2, { margin: 48, cy: 470, maxScale: 1 });

    // @form cloud_destination: offsite storage outside the bounded desk
    const cloud = ctx.el("cloud", { x: 1320, y: 286, w: 382, h: 266, kind: "node", exit: "recede" });
    const cloudH = Loom.lesson.cloud(ctx, cloud.inner, { w: 382, label: true });
    cloudH.labelG.setAttribute("opacity", "0");
    cloud.outer.parentNode.appendChild(copyB.outer);
    m.settle(cloud, tOffsite - 0.08, { dy: 18 });

    m.travel(copyB, tOffsite + 0.08, { x: 900, y: -65, dur: 1.0, ease: "editorial" });
    Loom.tween(cloudH.labelG, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, tCloud, { kind: "reveal", beat: ctx.beat.id, content: true });

    boundary.handle.setState("filled", tProof - 0.05, { dur: 0.8 });
    rail.handle.setState(2, "named", tProof + 0.18, { dur: 0.45 });
    rail.handle.showLabel(2, tProof + 0.24);

    void laptop; void drive; void deskLine; void labelLaptop; void labelDrive;
  },
});
