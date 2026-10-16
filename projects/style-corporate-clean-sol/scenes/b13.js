// @design loss_reversed: an emptied card is replenished by a surviving copy
Loom.scene("b13", {
  build(ctx, props) {
    // Three treatments: static board with outcome signalling; a close camera replay; a matched failure followed by a travelling copy.
    // Choose matched failure and copy travel: the surviving source explains the reversal without a new setting.
    const m = ctx.m, kit = ctx.kit;
    const tFail = ctx.cue("same failure");
    const tRestore = ctx.cue("opens from a backup");
    const travelDur = ctx.style.dur("move") * 2;
    const tLand = tRestore + travelDur;
    // @form desk_rule: shared baseline for the local storage
    const desk = ctx.el("desk_line", {x:380,y:672,w:1160,h:6,kind:"scenery",exit:"recede"});
    kit.line(desk.inner,3,3,1157,3,{stroke:"line",sw:3});
    // @form failure_device: exact opening device position and scale
    const lo = {w:620,state:"on"};
    const ls = Loom.lesson.laptop.size(lo);
    const laptop = ctx.el("laptop",{x:420,y:300,w:ls.w,h:ls.h,kind:"instrument",exit:"recede"});
    const lh = Loom.lesson.laptop(ctx,laptop.inner,lo);
    laptop.handle = lh;
    // @form vulnerable_file: the opening Report in the same screen slot
    const ro = {size:lh.slot.h,state:"whole"};
    const rs = Loom.lesson.report_file.size(ro);
    const rx = 420 + lh.slot.x, ry = 300 + lh.slot.y;
    const report = ctx.el("report_main",{x:rx,y:ry,w:rs.w,h:rs.h,kind:"token",exit:"recede"});
    const rh = Loom.lesson.report_file(ctx,report.inner,ro);
    report.handle = rh;
    // @form external_copy: intact backup remains at its established position
    const eo = {w:380,state:"idle"};
    const es = Loom.lesson.ext_drive.size(eo);
    const drive = ctx.el("ext_drive",{x:1120,y:417,w:es.w,h:es.h,kind:"instrument",exit:"recede"});
    const dh = Loom.lesson.ext_drive(ctx,drive.inner,eo);
    drive.handle = dh;
    const ao = {size:dh.slots[0].h,state:"whole"};
    const az = Loom.lesson.report_file.size(ao);
    const ax = 1120 + dh.slots[0].x, ay = 417 + dh.slots[0].y;
    const copy = ctx.el("copy_a",{x:ax,y:ay,w:az.w,h:az.h,kind:"card",exit:"recede"});
    copy.handle = Loom.lesson.report_file(ctx,copy.inner,ao);
    // @form desk_boundary: neutral reminder of the two local devices
    const bo = {w:1216,h:532,text:"Same place",faint:true};
    const bs = Loom.lesson.place_boundary.size(bo);
    const boundary = ctx.el("boundary",{x:352,y:156,w:bs.w,h:bs.h,kind:"scenery",exit:"recede"});
    boundary.handle = Loom.lesson.place_boundary(ctx,boundary.inner,bo);
    // @form offsite_copy: remote backup stays whole throughout the replay
    const co = {w:382};
    const cs = Loom.lesson.cloud.size(co);
    const cloud = ctx.el("cloud",{x:1440,y:346,w:cs.w,h:cs.h,kind:"instrument",exit:"recede"});
    const ch = Loom.lesson.cloud(ctx,cloud.inner,co);
    cloud.handle = ch;
    const fo = {size:ch.slot.h,state:"whole"};
    const fs = Loom.lesson.report_file.size(fo);
    const remote = ctx.el("copy_b",{x:1440+ch.slot.x,y:346+ch.slot.y,w:fs.w,h:fs.h,kind:"card",exit:"recede"});
    remote.handle = Loom.lesson.report_file(ctx,remote.inner,fo);
    // @form rule_family: completed system stays neutral beneath the outcome
    const railOpts = {size:"normal",labels:true};
    const rz = Loom.lesson.rule_rail.size(railOpts);
    const rail = ctx.el("rail",{x:444,y:754,w:rz.w,h:rz.h,kind:"value",exit:"recede"});
    rail.handle = Loom.lesson.rule_rail(ctx,rail.inner,railOpts);
    rail.handle.setAll("lit");
    // Same fault and tag geometry, colours and duration as the opening replay.
    lh.setState("failed",tFail,{dur:ctx.style.dur("move")*0.6});
    const fault = [420+lh.fault.x,300+lh.fault.y];
    // @form failure_tag: matching opening fault verdict
    const failed = Loom.treat.label(ctx,"tag_failed",{x:fault[0]+36,y:fault[1]+32,text:"Drive failed",to:fault,tone:"neg",role:"label",as:"tag",t:tFail});
    failed.exit = "wipe";
    m.exit(failed,tRestore-ctx.style.dur("exit"),"wipe");
    rh.setState("empty",tFail+ctx.style.dur("move")*0.6,{dur:ctx.style.dur("move")});
    // @form recovery_transfer: a travelling copy leaves the surviving source intact
    const carrier = ctx.el("copy_restore",{x:ax,y:ay,w:az.w,h:az.h,kind:"token",exit:"recede"});
    carrier.handle = Loom.lesson.report_file(ctx,carrier.inner,ao);
    m.reveal(carrier,tRestore,{dy:0,dur:ctx.style.dur("move")*0.3});
    m.travel(carrier,tRestore,{x:rx-ax,y:ry-ay,scale:rs.h/az.h,dur:travelDur});
    m.exit(carrier,tLand,"recede");
    rh.setState("restored",tLand,{dur:ctx.style.dur("enter")*1.4});
    // Clear only the fault verdict as recovery completes, before the positive tag arrives.
    Loom.drive((e, raw) => lh.cross.setAttribute("opacity", 1 - raw), tLand, ctx.style.dur("move"), "linear");
    // @form restored_verdict: positive outcome belongs to the refilled Report
    const restored = Loom.treat.label(ctx,"tag_restored",{x:rx+rs.w+120,y:ry+84,text:"Restored",to:[rx+rs.w,ry+rs.h*0.48],tone:"pos",role:"label",as:"tag",t:tLand+ctx.style.dur("move")});
    restored.exit = "wipe";
  }
});
