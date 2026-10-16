// @design bag_check: one shared container makes two backup copies vulnerable
// Treatments: 1) static bag cutaway and rail, selected for a practical pause. 2) split comparison, rejected because the failure is not yet shown. 3) quiz card, rejected because it breaks object continuity.
Loom.scene("b11", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const tQuick = ctx.cue("Quick check.");
    const tLaptop = ctx.cue("A laptop");
    const tUsb = ctx.cue("a USB backup");
    const tSame = ctx.cue("in the same bag");
    const tQuestion = ctx.cue("Which part breaks?");

    // @form bag_ground: pale station field behind the check
    const ground = ctx.el("bag_ground", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });
    kit.rect(ground.inner, 0, 0, 1920, 930, { fill: "field2", shadow: false });

    // @form rule_rail: three inactive rule tiles for the check
    const rail = ctx.el("rail", { x: 444, y: 740, w: 1032, h: 166, kind: "instrument", exit: "none" });
    const railH = Loom.lesson.rule_rail(ctx, rail.inner, { size: "normal", labels: true });
    railH.setAll("unlit", null);
    m.reveal(rail, tQuick, { dy: 12, dur: ctx.style.dur("enter") });

    // @form laptop_bag: cutaway container holding every vulnerable copy
    const bag = ctx.el("bag", { x: 640, y: 150, w: 640, h: 440, kind: "container", exit: "none" });
    const bagH = Loom.lesson.bag(ctx, bag.inner, { w: 640 });
    const laptopSpot = bagH.spots.laptop;
    const usbSpot = bagH.spots.usb;
    m.settle(bag, tLaptop, { dy: 16, dur: ctx.style.dur("move") });

    // @form laptop_in_bag: laptop positioned in the bag's laptop spot
    const laptop_b = ctx.el("laptop_b", { parent: bag, x: laptopSpot.x, y: laptopSpot.y, w: laptopSpot.w, h: 181, kind: "instrument", exit: "none" });
    const laptopH = Loom.lesson.laptop(ctx, laptop_b.inner, { w: 300, state: "on" });
    m.settle(laptop_b, tLaptop + 0.1, { dy: 10, dur: ctx.style.dur("move") });

    // @form report_on_laptop: report copy seated in the laptop screen slot
    const report_b = ctx.el("report_b", { parent: bag, x: 258, y: 191, w: 95, h: 127, kind: "card", exit: "none" });
    const reportLaptopH = Loom.lesson.report_file(ctx, report_b.inner, { size: 127, state: "whole" });
    m.reveal(report_b, tLaptop + 0.34, { dy: 8, dur: ctx.style.dur("enter") });

    // @form usb_in_bag: slate USB backup in the bag's USB spot
    const usb = ctx.el("usb", { parent: bag, x: usbSpot.x, y: usbSpot.y, w: usbSpot.w, h: 94, kind: "instrument", exit: "none" });
    const usbH = Loom.lesson.usb_drive(ctx, usb.inner, { w: 216 });
    m.settle(usb, tUsb, { dy: 10, dur: ctx.style.dur("move") });

    // @form report_by_usb: second report copy beside the USB stick
    const copy_usb = ctx.el("copy_usb", { parent: bag, x: 522, y: 256, w: 71, h: 94, kind: "card", exit: "none" });
    const reportUsbH = Loom.lesson.report_file(ctx, copy_usb.inner, { size: 94, state: "whole" });
    m.reveal(copy_usb, tUsb + 0.28, { dy: 8, dur: ctx.style.dur("enter") });

    // @form same_bag_boundary: dashed shared-place boundary drawn after its contents
    const boundary_bag = ctx.el("boundary_bag", { x: 612, y: 96, w: 696, h: 522, kind: "connector", exit: "none" });
    const boundaryH = Loom.lesson.place_boundary(ctx, boundary_bag.inner, { w: 696, h: 496, text: "Same bag", state: "drawn" });
    m.unmask(boundary_bag, tSame, { dir: "ttb", dur: ctx.style.dur("draw") });

    // @form break_question: accented lead question held for the reflective pause
    const question = ctx.el("question", { x: 560, y: 650, w: 800, h: 56, kind: "text", exit: "wipe" });
    kit.text(question.inner, "Which part breaks?", { role: "lead", size: 42, x: 0, y: 0, w: 800, h: 56, align: "center", valign: "middle", weight: 700, color: "accent" });
    m.reveal(question, tQuestion, { dy: 12, dur: ctx.style.dur("enter") });
    m.emphasis(question, tQuestion + 0.25);
  }
});
