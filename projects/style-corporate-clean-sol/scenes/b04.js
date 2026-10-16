// @design repeated_single_loss: four causes converge on the same vulnerable card
Loom.scene("b04", {
  build(ctx, props) {
    // Treatments: static four-chip surround with signalling; sequential chips and card state cuts; moving causes through the screen.
    // Choose sequential chips: repeating the loss makes the common consequence visible.
    const K = ctx.kit, M = ctx.m;
    const tDrive = ctx.cue("A dead drive");
    const tStolen = ctx.cue("A stolen laptop");
    const tDeleted = ctx.cue("A wrong delete");
    const tRansom = ctx.cue("Ransomware");
    // @form retained_system: one unchanged device and card carry every failure
    const laptop = ctx.held("laptop");
    const report = ctx.held("report_main");
    const rail = ctx.held("rail");
    laptop.handle.setState("on",ctx.start);
    report.handle.setState("whole",ctx.start,{dur:ctx.style.dur("move")*0.6});
    rail.handle.setAll("unlit",ctx.start);
    // Proportional shrink keeps the exact original artwork, including its hidden label groups.
    M.travel(rail,ctx.start,{x:960-rail.handle.w*(112/190)/2-880,y:774-730,scale:112/190,dur:ctx.style.dur("move")});
    const rows = [
      {name:"chip_drive",text:"Drive failure",icon:"hard-drive",x:1130,y:300,t:tDrive,next:tStolen},
      {name:"chip_stolen",text:"Lost or stolen",icon:"map-pin-off",x:1130,y:412,t:tStolen,next:tDeleted},
      {name:"chip_deleted",text:"Deleted by mistake",icon:"trash-2",x:1130,y:524,t:tDeleted,next:tRansom},
      {name:"chip_ransom",text:"Ransomware",icon:"lock",x:1130,y:636,t:tRansom,next:null}
    ];
    rows.forEach((item) => {
      // @form failure_chip: a quiet status pill, its icon names the active cause
      K.fit(item.text,{role:"label",w:330,h:64,maxLines:1,weight:700});
      const E = ctx.el(item.name,{x:item.x,y:item.y,w:460,h:88,kind:"card",exit:"wipe"});
      K.pill(E.inner,0,0,460,88,{fill:"surface",stroke:"surface2",sw:2});
      K.text(E.inner,item.text,{role:"label",size:28,x:96,y:12,w:332,h:64,maxLines:1,weight:700,color:"ink",valign:"middle"});
      const icon = Loom.treat.badge(ctx,item.name+"_icon",{x:item.x+20,y:item.y+12,size:64,icon:item.icon,tone:"accent",as:"disc",t:item.t});
      M.settle(E,item.t,{dur:ctx.style.dur("enter")});
      if(item.next !== null) Loom.hold.heat(icon,item.next,{from:"accent",to:"accent3",dur:ctx.style.dur("move")});
      M.exit(E,ctx.speechEnd-ctx.style.dur("exit"),"wipe");
      M.exit(icon,ctx.speechEnd-ctx.style.dur("exit"),"recede");
    });
    report.handle.setState("empty",tDrive+ctx.style.dur("enter"));
    report.handle.setState("whole",tStolen-ctx.style.dur("enter"));
    report.handle.setState("empty",tStolen+ctx.style.dur("enter"));
    report.handle.setState("whole",tDeleted-ctx.style.dur("enter"));
    report.handle.setState("empty",tDeleted+ctx.style.dur("enter"));
    report.handle.setState("whole",tRansom-ctx.style.dur("enter"));
    report.handle.setState("locked",tRansom+ctx.style.dur("enter"));
  }
});
