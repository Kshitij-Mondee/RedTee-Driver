// @design shared_failure_family: an unchanged system resolves into one highlighted rule family
Loom.scene("b10", {
  build(ctx, props) {
    // Three treatments: static board with colour signalling; a copy orbit; a slow board push.
    // Choose the slow push plus static signalling, no extra copies or invented connections.
    const kit = ctx.kit;
    const board = ctx.el("system_rest", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"recede"});
    const parent = board.inner;
    const hold = ctx.cue("Not more copies");
    const family = ctx.cue("cannot all fail together");
    // @form desk_rule: the two local devices share one baseline
    const desk = ctx.el("desk_line", {x:380,y:672,w:1160,h:6,kind:"scenery",parent,exit:"recede"});
    kit.line(desk.inner,3,3,1157,3,{stroke:"line",sw:3});
    // @form laptop_source: whole source at rest
    const lo = {w:640,state:"on"};
    const ls = Loom.lesson.laptop.size(lo);
    const laptop = ctx.el("laptop",{x:420,y:300,w:ls.w,h:ls.h,kind:"instrument",parent,exit:"recede"});
    const lh = Loom.lesson.laptop(ctx,laptop.inner,lo);
    const rs = Loom.lesson.report_file.size({size:lh.slot.h});
    const report = ctx.el("report_main",{x:lh.slot.x,y:lh.slot.y,w:rs.w,h:rs.h,kind:"card",parent:laptop,exit:"recede"});
    Loom.lesson.report_file(ctx,report.inner,{size:lh.slot.h,state:"whole"});
    // @form external_copy: one intact local backup, not a new copy
    const eo = {w:380,state:"idle"};
    const es = Loom.lesson.ext_drive.size(eo);
    const drive = ctx.el("ext_drive",{x:1120,y:417,w:es.w,h:es.h,kind:"instrument",parent,exit:"recede"});
    const dh = Loom.lesson.ext_drive(ctx,drive.inner,eo);
    const ds = Loom.lesson.report_file.size({size:dh.slots[0].h});
    const copy = ctx.el("copy_a",{x:dh.slots[0].x,y:dh.slots[0].y,w:ds.w,h:ds.h,kind:"card",parent:drive,exit:"recede"});
    Loom.lesson.report_file(ctx,copy.inner,{size:dh.slots[0].h,state:"whole"});
    // @form object_names: labels stay close to their devices
    const labelLaptop = Loom.treat.label(ctx,"label_laptop",{x:620,y:224,text:"Laptop",to:[730,300],tone:"muted",role:"label"});
    parent.appendChild(labelLaptop.outer);
    const labelDrive = Loom.treat.label(ctx,"label_drive",{x:1170,y:332,text:"External drive",to:[1310,417],tone:"muted",role:"label"});
    parent.appendChild(labelDrive.outer);
    // @form desk_boundary: a quiet reminder of shared location
    const bo = {w:1216,h:532,text:"Same place",faint:true};
    const bs = Loom.lesson.place_boundary.size(bo);
    const boundary = ctx.el("boundary",{x:352,y:156,w:bs.w,h:bs.h,kind:"scenery",parent,exit:"recede"});
    Loom.lesson.place_boundary(ctx,boundary.inner,bo);
    // @form offsite_copy: intact copy beyond the local boundary
    const co = {w:382};
    const cs = Loom.lesson.cloud.size(co);
    const cloud = ctx.el("cloud",{x:1440,y:346,w:cs.w,h:cs.h,kind:"instrument",parent,exit:"recede"});
    const ch = Loom.lesson.cloud(ctx,cloud.inner,co);
    const fs = Loom.lesson.report_file.size({size:ch.slot.h});
    const remote = ctx.el("copy_b",{x:ch.slot.x,y:ch.slot.y,w:fs.w,h:fs.h,kind:"card",parent:cloud,exit:"recede"});
    Loom.lesson.report_file(ctx,remote.inner,{size:ch.slot.h,state:"whole"});
    // @form rule_family: simultaneous colour change makes one consolidated principle
    const ro = {size:"normal",labels:true};
    const rz = Loom.lesson.rule_rail.size(ro);
    const rail = ctx.el("rail",{x:444,y:754,w:rz.w,h:rz.h,kind:"value",parent,exit:"recede"});
    const rh = Loom.lesson.rule_rail(ctx,rail.inner,ro);
    rh.setAll("lit");
    rh.setAll("named",family,{stagger:0,dur:ctx.style.dur("move")});
    Loom.cam.frame(board,{x:20,y:12,w:1880,h:1056},hold,ctx.style.dur("draw")*5,{margin:0,maxScale:1.025,cx:960,cy:540});
  }
});
