// @design connection_spread: a linked branch inherits a fault while an isolated branch remains intact
Loom.scene("b09", {
  build(ctx, props) {
    const K = ctx.kit, M = ctx.m;
    // Treatments considered: static two-branch signalling; cable-borne lock; split-screen comparison.
    // Choose cable-borne lock because motion explains the spread, not just the verdict.
    const tLock = ctx.cue("Ransomware can encrypt");
    const tSpread = ctx.cue("backups that stay connected");
    const tSafe = ctx.cue("keep one offline or disconnected");
    const travelDur = ctx.style.dur("draw");

    // @form laptop_detail: origin of the connected fault
    const ls = Loom.lesson.laptop.size({w:700});
    const laptop = ctx.el("laptop_d", {x:200,y:330,w:ls.w,h:ls.h,kind:"instrument",exit:"recede"});
    laptop.handle = Loom.lesson.laptop(ctx,laptop.inner,{w:700,state:"on"});
    const slot = laptop.handle.slot;
    const rs = Loom.lesson.report_file.size({size:slot.h});
    const report = ctx.el("report_d", {x:slot.x,y:slot.y,w:rs.w,h:rs.h,parent:laptop,kind:"card",exit:"recede"});
    report.handle = Loom.lesson.report_file(ctx,report.inner,{size:slot.h,state:"whole"});
    report.handle.setState("locked",tLock);

    // @form connected_branch: a cable carries the same locked state to the upper copy
    const ds = Loom.lesson.ext_drive.size({w:456});
    const upper = ctx.el("drive_connected",{x:1160,y:150,w:ds.w,h:ds.h,kind:"instrument",exit:"recede"});
    upper.handle = Loom.lesson.ext_drive(ctx,upper.inner,{w:456,state:"connected",cableTo:{x:-293,y:357}});
    const upSlot = upper.handle.slots[0];
    const cs = Loom.lesson.report_file.size({size:upSlot.h});
    const connected = ctx.el("copy_connected",{x:upSlot.x,y:upSlot.y,w:cs.w,h:cs.h,parent:upper,kind:"card",exit:"recede"});
    connected.handle = Loom.lesson.report_file(ctx,connected.inner,{size:upSlot.h,state:"whole"});
    connected.handle.setState("locked",tSpread+travelDur);

    // @form cable_route: invisible guide offsets the carrier origin so its centre follows the kit cable
    const cable = ctx.el("cable",{x:833,y:375.2,w:361,h:166,kind:"connector",exit:"recede"});
    const route = K.path(cable.inner,"M 295 2 C 148.5 2 148.5 99.8 2 99.8",{stroke:"line",sw:0,fill:"none"});
    route.setAttribute("opacity",0);
    // @form lock_carrier: a neutral padlock travels only on the physical connection
    const token = ctx.el("lock_token",{x:0,y:0,w:64,h:64,parent:cable,kind:"token",exit:"recede"});
    K.disc(token.inner,32,32,30,{fill:"surface"});
    K.icon(token.inner,"lock",{x:32,y:32,size:48,color:"accent3"});
    M.reveal(token,tSpread,{dy:0,dur:ctx.style.dur("move")});
    M.along(token,route,tSpread,{from:1,to:0,dur:travelDur});
    M.exit(token,tSpread+travelDur,"recede");

    // @form isolated_branch: intact copy with no cable and an unlit drive port
    const lower = ctx.el("drive_offline",{x:1160,y:550,w:ds.w,h:ds.h,kind:"instrument",exit:"recede"});
    lower.handle = Loom.lesson.ext_drive(ctx,lower.inner,{w:456,state:"unplugged"});
    const lowSlot = lower.handle.slots[0];
    const offline = ctx.el("copy_offline",{x:lowSlot.x,y:lowSlot.y,w:cs.w,h:cs.h,parent:lower,kind:"card",exit:"recede"});
    offline.handle = Loom.lesson.report_file(ctx,offline.inner,{size:lowSlot.h,state:"whole"});
    // @form offline_label: the isolated branch alone takes the accent
    K.fit("Offline or disconnected",{role:"label",w:500,h:60,maxLines:1,weight:700});
    const label = Loom.treat.label(ctx,"label_offline",{x:1370,y:888,text:"Offline or disconnected",to:[1388,859.6],tone:"muted",role:"label",t:ctx.start});
    Loom.hold.heat(label,tSafe,{from:"muted",to:"accent",dur:ctx.style.dur("move"),name:"offline_named"});
  }
});
