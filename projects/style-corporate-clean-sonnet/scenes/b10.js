// @design system_at_rest: a finished board of whole copies held still while the rule beneath it changes colour as one family
// Treatments considered: (1) static board + rail recolour (chosen); (2) copies pulse in turn; (3) a bracket drawn over the rail. Chosen: the only change is the rule lighting.
Loom.scene("b10", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.m, L = Loom.lesson;
    const tPush = ctx.cue("Not more copies");
    const tFamily = ctx.cue("cannot all fail together");

    // one wrapper for the whole board so a slow push moves everything together
    const board = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const sub = (name, x, y, w, h, kind) => ctx.el(name, { x: x, y: y, w: w, h: h, kind: kind || "node", exit: "none", parent: board });

    // laptop on the desk line (w 620 -> h 374, base at y 624)
    const lz = L.laptop.size({ w: 620 });
    const eL = sub("laptop", 240, 250, lz.w, lz.h, "instrument"); // @form laptop_holder: the laptop holding the Report
    const hL = L.laptop(ctx, eL.inner, { w: 620 });
    const rz = Math.round(hL.slot.h);
    const rs = L.report_file.size({ size: rz });
    const eR = sub("report_main", 240 + hL.slot.x, 250 + hL.slot.y, rs.w, rs.h, "card"); // @form report_whole: the one Report, whole
    L.report_file(ctx, eR.inner, { size: rz });

    // external drive with copy_a
    const dz = L.ext_drive.size({ w: 380 });
    const eD = sub("ext_drive", 960, 366, dz.w, dz.h, "instrument"); // @form drive_holder: the drive holding a copy
    const hD = L.ext_drive(ctx, eD.inner, { w: 380, state: "idle" });
    const sl = hD.slots[0];
    const cs = L.report_file.size({ size: Math.round(sl.h) });
    const eA = sub("copy_a", 960 + sl.x, 366 + sl.y, cs.w, cs.h, "card"); // @form copy_whole: a copy on the drive
    L.report_file(ctx, eA.inner, { size: Math.round(sl.h) });

    // desk line and its labels
    const eDesk = sub("desk_line", 240, 626, 1100, 8, "scenery"); // @form desk_line: the shared desk surface
    kit.rect ? null : null;
    Loom.svg("rect", { x: 0, y: 0, width: 1100, height: 8, rx: 4, fill: ctx.c("line") }, eDesk.inner);
    const eLl = sub("label_laptop", 240, 646, 620, 40, "text");
    kit.text(eLl.inner, "Laptop", { role: "label", size: 28, x: 0, y: 0, w: 620, h: 40, align: "center", valign: "middle", weight: 700, color: "muted" });
    const eLd = sub("label_drive", 960, 646, 380, 40, "text");
    kit.text(eLd.inner, "Drive", { role: "label", size: 28, x: 0, y: 0, w: 380, h: 40, align: "center", valign: "middle", weight: 700, color: "muted" });

    // cloud far right with copy_b and its label
    const cz = L.cloud.size({ w: 382 });
    const eC = sub("cloud", 1460, 330, cz.w, cz.h, "instrument"); // @form cloud_holder: offsite storage holding a copy
    const hC = L.cloud(ctx, eC.inner, { w: 382 });
    const cbs = L.report_file.size({ size: Math.round(hC.slot.h) });
    const eB = sub("copy_b", 1460 + hC.slot.x, 330 + hC.slot.y, cbs.w, cbs.h, "card"); // @form copy_whole: the offsite copy
    L.report_file(ctx, eB.inner, { size: Math.round(hC.slot.h) });

    // faint boundary round laptop + drive + desk line (created after what it surrounds)
    const bb = L.place_boundary.around({ x: 240, y: 250, w: 1100, h: 430 }, { pad: 24 });
    const eBd = sub("boundary", bb.x, bb.y, bb.w, bb.h, "scenery"); // @form same_place_boundary: dashed round everything in one place
    L.place_boundary(ctx, eBd.inner, { w: bb.dashW, h: bb.dashH, text: "Same place", faint: true });

    // the rule rail at rest: three tiles lit ink with their labels
    const rr = L.rule_rail.size({ size: "normal", labels: true });
    const eRail = sub("rail", Math.round((1920 - rr.w) / 2), 745, rr.w, rr.h, "node"); // @form rule_tiles: the 3-2-1 rail
    const rail = L.rule_rail(ctx, eRail.inner, { size: "normal", labels: true });
    rail.setAll("lit", null);

    // slow push across the hold, about the board centre
    const S = 1.03, cx = 960, cy = 470;
    m.travel(board, tPush, { x: cx - S * cx, y: cy - S * cy, scale: S, dur: ctx.end - tPush });

    // the one change: the three tiles turn accent together
    rail.setAll("named", tFamily, { dur: ctx.style.dur("move") * 0.8 });
  },
});
