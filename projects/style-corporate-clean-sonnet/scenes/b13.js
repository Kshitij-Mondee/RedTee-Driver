// @design failure_survived: the same loss replayed on a board that holds other whole copies, so the emptied thing refills from one of them
// Treatments considered: (1) static board with a Restored tag only; (2) replay the failure then a copy travels in and refills (chosen: the payoff is the change); (3) all copies pulse. Chosen: 2.
Loom.scene("b13", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.m, L = Loom.lesson;
    const tFail = ctx.cue("same failure");
    const tBackup = ctx.cue("opens from a backup");
    const tThis = ctx.cue("This time");

    const sub = (name, x, y, w, h, kind) => ctx.el(name, { x: x, y: y, w: w, h: h, kind: kind || "node", exit: "recede" });

    // laptop on the desk line
    const lz = L.laptop.size({ w: 620 });
    const eL = sub("laptop", 240, 250, lz.w, lz.h, "instrument"); // @form laptop_holder: the laptop holding the Report
    const hL = L.laptop(ctx, eL.inner, { w: 620 });
    const rz = Math.round(hL.slot.h);
    const rs = L.report_file.size({ size: rz });
    const RX = 240 + hL.slot.x, RY = 250 + hL.slot.y;
    const eR = sub("report_main", RX, RY, rs.w, rs.h, "card"); // @form report_whole: the one Report, whole
    const rep = L.report_file(ctx, eR.inner, { size: rz });

    // external drive with copy_a
    const dz = L.ext_drive.size({ w: 380 });
    const eD = sub("ext_drive", 960, 366, dz.w, dz.h, "instrument"); // @form drive_holder: the drive holding a copy
    const hD = L.ext_drive(ctx, eD.inner, { w: 380, state: "idle" });
    const sl = hD.slots[0];
    const csz = Math.round(sl.h);
    const cs = L.report_file.size({ size: csz });
    const eA = sub("copy_a", 960 + sl.x, 366 + sl.y, cs.w, cs.h, "card"); // @form copy_whole: a copy on the drive
    L.report_file(ctx, eA.inner, { size: csz });

    // desk line and labels
    const eDesk = sub("desk_line", 240, 626, 1100, 8, "scenery"); // @form desk_line: the shared desk surface
    Loom.svg("rect", { x: 0, y: 0, width: 1100, height: 8, rx: 4, fill: ctx.c("line") }, eDesk.inner);
    const eLl = sub("label_laptop", 240, 646, 620, 40, "text");
    kit.text(eLl.inner, "Laptop", { role: "label", size: 28, x: 0, y: 0, w: 620, h: 40, align: "center", valign: "middle", weight: 700, color: "muted" });
    const eLd = sub("label_drive", 960, 646, 380, 40, "text");
    kit.text(eLd.inner, "External drive", { role: "label", size: 28, x: 0, y: 0, w: 380, h: 40, align: "center", valign: "middle", weight: 700, color: "muted" });

    // cloud with copy_b
    const cz = L.cloud.size({ w: 382 });
    const eC = sub("cloud", 1460, 330, cz.w, cz.h, "instrument"); // @form cloud_holder: offsite storage holding a copy
    const hC = L.cloud(ctx, eC.inner, { w: 382 });
    const cbs = L.report_file.size({ size: Math.round(hC.slot.h) });
    const eB = sub("copy_b", 1460 + hC.slot.x, 330 + hC.slot.y, cbs.w, cbs.h, "card"); // @form copy_whole: the offsite copy
    L.report_file(ctx, eB.inner, { size: Math.round(hC.slot.h) });

    // faint boundary
    const bb = L.place_boundary.around({ x: 240, y: 250, w: 1100, h: 430 }, { pad: 24 });
    const eBd = sub("boundary", bb.x, bb.y, bb.w, bb.h, "scenery"); // @form same_place_boundary: dashed round everything in one place
    L.place_boundary(ctx, eBd.inner, { w: bb.dashW, h: bb.dashH, text: "Same place", faint: true });

    // rail lit ink
    const rr = L.rule_rail.size({ size: "normal", labels: true });
    const eRail = sub("rail", Math.round((1920 - rr.w) / 2), 745, rr.w, rr.h, "node"); // @form rule_tiles: the 3-2-1 rail
    const rail = L.rule_rail(ctx, eRail.inner, { size: "normal", labels: true });
    rail.setAll("lit", null);

    // the replay of b02: laptop fails, tag, Report empties
    hL.setState("failed", tFail);
    const fx = 240 + hL.fault.x;
    const tagF = Loom.data.tag(ctx, "tag_failed", { x: fx - 80, y: 250 + hL.fault.y - 80, text: "Drive failed", color: "neg", t: tFail + 0.35 });
    rep.setState("empty", tFail + 0.55);
    if (tagF && tagF.E) m.exit(tagF.E, tThis - 0.1, "fade");
    else if (tagF) m.exit(tagF, tThis - 0.1, "fade");

    // the restore: a copy leaves the drive, crosses above the labels, refills the Report
    const eCp = ctx.el("copy_restore", { x: 960 + sl.x, y: 366 + sl.y, w: cs.w, h: cs.h, kind: "card", exit: "fade" }); // @form copy_travelling: a backup copy carried to the laptop
    L.report_file(ctx, eCp.inner, { size: csz });
    m.reveal(eCp, tBackup, { dy: 0 });
    const k = rz / csz;
    const tArr = tBackup + 0.8;
    m.travel(eCp, tBackup + 0.2, { x: RX - (960 + sl.x), y: RY - (366 + sl.y), scale: k, dur: 0.6 });
    rep.setState("restored", tArr);
    m.exit(eCp, tArr + 0.15, "fade");
    Loom.data.tag(ctx, "tag_restored", { x: RX + rs.w + 20, y: RY + 24, text: "Restored", color: "pos", t: tArr + 0.3 });
  },
});
