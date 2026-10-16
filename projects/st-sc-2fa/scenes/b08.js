// @design selection_reveals_key: a chosen control resolves into a square to scan
// Treatments considered: static panel with signalling; method menu expanding; modal with a selected method and revealed square. Chosen: modal, because the visible response is the instruction.
Loom.scene("b08", {
  build(ctx) {
    const choose = ctx.cue("Choose Authenticator app");
    const show = ctx.cue("a QR code appears");
    const A = ctx.engine.resume(ctx, "app");
    const chapters = ctx.held("chapters");
    // A stable screen-space modal preserves the shell beneath it and leaves room for the phone at right.
    A.pointerOut(ctx.start);
    // Keep only the browser chrome beneath the new method panel.
    A.go("walkthrough",ctx.start);
    A.closeDialog(ctx.start);
    A.zoomOut({at:ctx.start, dur:ctx.style.dur("move")});
    // @form method_dialog: the selected method and its response share one bounded surface
    const picker = ctx.el("picker", {x:440,y:230,w:880,h:650,kind:"card",exit:"recede"});
    const lift = ctx.kit.rect(picker.inner,0,10,880,640,{fill:"shadow",r:16});
    lift.setAttribute("opacity",0.1);
    ctx.kit.rect(picker.inner,0,0,880,638,{fill:"surface",stroke:"field2",r:16});
    ctx.kit.fit("Two-step sign-in",{role:"lead",w:784,h:60,maxLines:1});
    ctx.kit.text(picker.inner,"Two-step sign-in",{x:48,y:32,w:784,h:60,role:"lead",size:36,weight:600,color:"ink"});
    ctx.kit.rect(picker.inner,48,116,784,88,{fill:"surface2",stroke:"accent",r:10});
    ctx.kit.fit("Authenticator app",{role:"lead",w:650,h:56,maxLines:1});
    ctx.kit.text(picker.inner,"Authenticator app",{x:76,y:132,w:650,h:56,role:"lead",size:34,weight:600,color:"ink"});
    ctx.kit.icon(picker.inner,"chevron-right",{x:772,y:146,size:28,color:"accent"});
    ctx.m.reveal(picker,choose);
    // @form generic_scan_square: the illustrative kit square appears only after selection
    const qr = ctx.el("qr",{x:724,y:488,w:312,h:312,kind:"instrument",exit:"recede"});
    qr.kit = Loom.lesson.qr_code(ctx,qr.inner,{w:312,state:"hidden"});
    qr.handle = qr.kit;
    qr.kit.fadeIn(show);
    // @form selection_press: a finite teaching ring marks the method, never a product state
    const click = ctx.el("click_ring",{x:1192,y:352,w:64,h:64,kind:"icon",exit:"iris"});
    click.handle = A;
    if (A.ids().includes("settings.twostep")) {
      A.menu("settings.twostep",[{id:"auth",label:"Authenticator app",icon:"smartphone"}],{at:choose,w:440});
      A.click("menu.auth",{at:show-ctx.style.dur("move")});
      A.closeMenu(show);
    } else {
      const ring = ctx.kit.disc(click.inner,32,32,25,{fill:"none"});
      ring.setAttribute("stroke",ctx.c("accent2"));
      ring.setAttribute("stroke-width",3);
      ctx.m.reveal(click,show-ctx.style.dur("move"));
      ctx.m.exit(click,show,"iris");
      A.pointer(show-ctx.style.dur("move"),{x:1224,y:384});
    }
    // Missing upstream settings page is reported, not reconstructed inside this scene.
    A.pointerOut(show);
  }
});
