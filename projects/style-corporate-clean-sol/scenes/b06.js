// @design separated_storage_survival: two cards change location, then one device fails without touching the other
Loom.scene("b06", {
  build(ctx) {
    // Treatments considered: static two-device composition with signalling; a cutaway with a cable; held copies travelling to an idle second device.
    // Choose held travel and a local state test: location and survival are the content, not a decorative transition.
    const K = ctx.kit, M = ctx.m;
    const tTwo = ctx.cue("Two: two kinds of storage");
    const tDesk = ctx.cue("Say, the laptop");
    const tDrive = ctx.cue("an external drive");
    const tFault = ctx.cue("One fault");
    const tSurvive = ctx.cue("unlikely to take both");
    const laptop = ctx.held("laptop");
    const report = ctx.held("report_main");
    const a = ctx.held("copy_a");
    const b = ctx.held("copy_b");
    const rail = ctx.held("rail");
    rail.handle.setState(0, "lit", tTwo);
    // @form shared_desk: one quiet baseline establishes the desk without making a room
    const desk = ctx.el("desk_line", {x:380,y:672,w:1160,h:6,kind:"connector",exit:"none"});
    const deskPath = K.line(desk.inner, 3, 3, 1157, 3, {stroke:"line",sw:3});
    M.draw(deskPath, tDesk, {dur:ctx.style.dur("draw")});
    // @form device_name: labels stay attached to their devices and clear of the tile rail
    K.fit("Laptop", {role:"label",w:220,h:56,maxLines:1,weight:700});
    const labelLaptop = Loom.treat.label(ctx,"label_laptop",{x:620,y:697,text:"Laptop",to:[730,675],tone:"muted",role:"label",t:tDesk});
    labelLaptop.exit = "none";
    // @form independent_storage: the second storage kind rests on the same baseline
    const opts = {w:522.5,state:"idle"};
    const size = Loom.lesson.ext_drive.size(opts);
    const drive = ctx.el("ext_drive", {x:1120,y:675-size.h,w:size.w,h:size.h,kind:"instrument",exit:"none"});
    drive.handle = Loom.lesson.ext_drive(ctx, drive.inner, opts);
    M.settle(drive, tDrive, {dur:ctx.style.dur("enter")});
    K.fit("External drive", {role:"label",w:320,h:56,maxLines:1,weight:700});
    const labelDrive = Loom.treat.label(ctx,"label_drive",{x:1230,y:697,text:"External drive",to:[1380,675],tone:"muted",role:"label",t:tDrive});
    labelDrive.exit = "none";
    // @form relocated_copies: retain both real backup cards, move each into its measured slot
    const sa = drive.handle.slots[0], sb = drive.handle.slots[1];
    const launchX = 420+laptop.handle.slot.x+laptop.handle.slot.w+42;
    const launchY = 300+laptop.handle.slot.y;
    M.travel(a,tDrive,{x:1120+sa.x-launchX,y:675-size.h+sa.y-launchY,scale:sa.h/a.handle.h,dur:ctx.style.dur("move")*2});
    M.travel(b,tDrive+ctx.style.dur("stagger"),{x:1120+sb.x-launchX,y:675-size.h+sb.y-launchY,scale:sb.h/b.handle.h,dur:ctx.style.dur("move")*2});
    laptop.handle.setState("failed",tFault);
    report.handle.setState("empty",tFault);
    rail.handle.setState(1,"named",tSurvive);
    rail.handle.showLabel(1,tSurvive); // Keep both named rule labels visible for the shared-place test.
    const storageText = rail.handle.tiles[1].labelG.querySelector("text");
    if (storageText) Loom.drive((e,raw) => storageText.setAttribute("font-size", 45), tSurvive, ctx.style.dur("move"), "linear", {key:"b06_label_size_1"});
    // Restore only after the survival demonstration has had a reading hold, ready for the common-place test.
    const tReset = ctx.speechEnd - ctx.style.dur("enter");
    laptop.handle.setState("on",tReset);
    report.handle.setState("whole",tReset,{dur:ctx.style.dur("enter")*0.8});
  }
});
