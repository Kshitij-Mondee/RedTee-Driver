// @design same_bag_check: two copies of one file shown inside one container, to be judged against three unlit marks
Loom.scene("b11", {
  build(ctx, props) {
    const { m, kit } = ctx;
    const L = Loom.lesson;
    // Treatments: (1) static composition, bag centre with unlit rail below (chosen: continuity with b12 moves the bag);
    // (2) contents fly into the bag; (3) bag opens on a split. Only the question moves late.

    // ---- bag (one element, contents are children so it travels as one)
    const BW = 600;
    const bagSize = L.bag.size({ w: BW });
    const bagX = 540, bagY = 160;
    const bag = ctx.el("bag", { x: bagX, y: bagY, w: bagSize.w, h: bagSize.h, kind: "scenery", exit: "none" });
    const bh = L.bag(ctx, bag.inner, { w: BW });

    // laptop inside the bag
    const lp = bh.spots.laptop;
    const lsz = L.laptop.size({ w: lp.w });
    const laptopB = ctx.el("laptop_b", { parent: bag, x: lp.x, y: lp.y, w: lsz.w, h: lsz.h, kind: "instrument", exit: "none" });
    const lh = L.laptop(ctx, laptopB.inner, { w: lp.w });

    const rh0 = lh.slot.h;
    const rsz = L.report_file.size({ size: rh0 });
    const reportB = ctx.el("report_b", { parent: bag, x: lp.x + lh.slot.x, y: lp.y + lh.slot.y, w: rsz.w, h: rsz.h, kind: "card", exit: "none" });
    L.report_file(ctx, reportB.inner, { size: rh0 });

    // usb inside the bag
    const us = bh.spots.usb;
    const usz = L.usb_drive.size({ w: us.w });
    const usb = ctx.el("usb", { parent: bag, x: us.x, y: us.y, w: usz.w, h: usz.h, kind: "instrument", exit: "none" });
    const uh = L.usb_drive(ctx, usb.inner, { w: us.w });
    const csz = L.report_file.size({ size: uh.slot.h });
    const copyUsb = ctx.el("copy_usb", { parent: bag, x: us.x + uh.slot.x, y: us.y + uh.slot.y, w: csz.w, h: csz.h, kind: "card", exit: "none" });
    L.report_file(ctx, copyUsb.inner, { size: uh.slot.h });

    // boundary round the bag (created after the contents)
    const around = L.place_boundary.around({ x: bagX, y: bagY, w: bagSize.w, h: bagSize.h }, { pad: 22 });
    const bnd = ctx.el("boundary_bag", { x: around.x, y: around.y, w: around.w, h: around.h, kind: "scenery", exit: "none" });
    const bdh = L.place_boundary(ctx, bnd.inner, { w: around.dashW, h: around.dashH, text: "Same bag" });

    // rail, unlit, labels on
    const rsize = L.rule_rail.size({ size: "normal", labels: true });
    const railX = Math.round((1920 - rsize.w) / 2), railY = 750;
    const rail = ctx.el("rail", { x: railX, y: railY, w: rsize.w, h: rsize.h, kind: "node", exit: "none" });
    L.rule_rail(ctx, rail.inner, { size: "normal", labels: true });

    // question (lead text, accent), above the rail
    const qW = 900, qH = 60;
    const question = ctx.el("question", { x: Math.round((1920 - qW) / 2), y: 664, w: qW, h: qH, kind: "text", exit: "wipe" });
    kit.text(question.inner, "Which part breaks?", { role: "lead", x: 0, y: 0, w: qW, h: qH, align: "center", valign: "middle", weight: 700, color: "accent", maxLines: 1 });

    // ---- timing
    m.reveal(rail, ctx.cue("Quick check"));
    m.settle(bag, ctx.cue("A laptop"));
    m.settle(laptopB, ctx.cue("A laptop") + 0.25);
    m.reveal(reportB, ctx.cue("A laptop") + 0.7);
    m.settle(usb, ctx.cue("a USB backup"));
    m.reveal(copyUsb, ctx.cue("a USB backup") + 0.5);
    m.unmask(bnd, ctx.cue("in the same bag"), { dir: "ltr" });
    m.reveal(question, ctx.cue("Which part breaks?"));
  },
});
