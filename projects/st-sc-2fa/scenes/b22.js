// @design complete_recovery_path: two remaining actions fill an absence and retire the obsolete entry
Loom.scene("b22", {
  build(ctx) {
    /* Three treatments: static path with signals; replacement slides into the vacancy; camera follows each control.
       Choose the replacement and local product reactions, keeping the held path fixed. */
    const k = ctx.kit;
    const three = ctx.cue("Three, set up your new phone");
    const four = ctx.cue("Four, remove the old device");
    const sessions = ctx.cue("sign out other sessions");
    const A = ctx.engine.resume(ctx,"app");
    A.zoomOut({at:ctx.start,dur:ctx.style.dur("exit")});
    const path = ctx.held("path");
    ctx.held("chapters");
    const absence = ctx.held("empty_spot");
    const message = ctx.held("it_msg");
    A.pointerOut(ctx.start);
    if (message) ctx.m.exit(message,three,"recede");
    ctx.m.exit(absence,three,"recede");
    // @form continued_numbered_path: only the two new rows join the existing recovery path
    function row(name,n,text,y,t) {
      const E = ctx.el(name,{x:96,y:y,w:384,h:112,kind:"label",exit:"recede"});
      k.fit(text,{role:"lead",w:296,h:100,maxLines:3});
      k.disc(E.inner,27,34,27,{fill:"accent2"});
      k.text(E.inner,String(n),{x:8,y:8,w:38,h:52,role:"label",size:28,align:"center",color:"onAccent",weight:700});
      k.text(E.inner,text,{x:76,y:4,w:296,h:100,role:"lead",size:32,maxLines:3,color:"ink",weight:600});
      ctx.m.reveal(E,t);
      return E;
    }
    const step3 = row("path3",3,"Set up your new phone",574,three);
    const step4 = row("path4",4,"Remove the old device",712,four);
    path.exit = "recede";
    path.followers = (path.followers || []).concat([step3,step4]);
    // @form replacement_scan: an independent phone fills the vacancy using the shared kit
    const phone = ctx.el("newphone",{x:1500,y:260,w:272,h:544,kind:"instrument",exit:"none"});
    phone.kit = Loom.lesson.phone(ctx,phone.inner,{w:272,state:"camera",code:"000000"});
    phone.handle = phone.kit;
    ctx.m.reveal(phone,three);
    phone.kit.slideIn(three);
    phone.kit.setState("new",four);
    phone.kit.setCode("482731",four);
    phone.kit.countdown(four,0);
    // @form setup_region: a QR region sits inside the held application rather than replacing its shell
    const setup = ctx.engine.app(ctx,"setup",{
      chrome:"none",frame:{x:552,y:330,w:856,h:470},sidebarW:0,
      page:{title:"Set up your new phone"},content:[]
    },{at:three});
    setup.pointerOut(three);
    const qr = ctx.el("replacement_qr",{x:884,y:456,w:240,h:240,kind:"instrument",exit:"recede"});
    qr.kit = Loom.lesson.qr_code(ctx,qr.inner,{w:240,state:"hidden"});
    ctx.m.reveal(qr,three);
    qr.kit.fadeIn(three);
    ctx.m.exit(setup.E,four-ctx.style.dur("exit"),"recede");
    ctx.m.exit(qr,four-ctx.style.dur("exit"),"recede");
    // @form obsolete_device_table: the old entry and other sessions have separate explicit controls
    const D = ctx.engine.app(ctx,"devices",{
      chrome:"none",frame:{x:552,y:330,w:856,h:470},sidebarW:0,
      page:{title:"Devices"},
      content:[{id:"device_list",kind:"table",columns:[{label:"Devices",w:2,kind:"strong"},{label:"",w:1}],rows:[["Old phone","Remove"]]}, {id:"sessions",kind:"form",fields:[],actions:[{id:"out",label:"Sign out other sessions",kind:"secondary"}]}]
    },{at:four});
    D.pointer(four,{x:1290,y:600});
    D.click("device_list.cell.0.1",{at:four + ctx.style.dur("move") + ctx.style.dur("enter")});
    D.cell("device_list",0,0,"",four + ctx.style.dur("move") + ctx.style.dur("enter") + ctx.style.dur("exit"));
    D.cell("device_list",0,1,"",four + ctx.style.dur("move") + ctx.style.dur("enter") + ctx.style.dur("exit"));
    D.click("sessions.action.out",{at:sessions,dx:108,dy:10});
    D.toast("Sign out other sessions",{at:sessions+ctx.style.dur("enter"),tone:"success",icon:"check",until:ctx.end,place:"top-center"});
    D.pointerOut(sessions + ctx.style.dur("enter"));
  }
});
