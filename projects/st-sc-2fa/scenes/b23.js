// @design preserve_and_transfer: reject the destructive switch and carry the working value to its replacement
Loom.scene("b23", {
  build(ctx) {
    /* Treatments: static two-device comparison with signalling; toggle mistake then code transfer; full camera chase.
       Choose toggle mistake then code transfer: the rejected motion and replacement are the argument. */
    const k=ctx.kit;
    const tempted=ctx.cue("Tempted to turn two-step sign-in off");
    const drops=ctx.cue("That drops your protection");
    const move=ctx.cue("Move it to the new phone instead");
    const A=ctx.engine.resume(ctx,"app");
    ctx.held("chapters");
    const newphone=ctx.held("newphone");
    const next=newphone.handle || newphone.kit;
    const devices=ctx.held("devices");
    const path=ctx.held("path");
    if(devices) ctx.m.exit(devices,ctx.start,"recede");
    if(path) ctx.m.exit(path,ctx.start,"recede");
    A.pointerOut(ctx.start);
    next.setCode("482619",tempted);
    // @form protection_switch: the generic security row remains on after a rejected off action
    const toggle=ctx.el("toggle",{x:630,y:410,w:700,h:240,kind:"instrument",exit:"recede",overlaps:["app"]});
    k.rect(toggle.inner,0,0,700,240,{fill:"surface",stroke:"line",r:20});
    k.text(toggle.inner,"Security",{x:36,y:28,w:500,h:48,role:"lead",size:32,weight:700,color:"ink"});
    k.text(toggle.inner,"Two-step sign-in",{x:36,y:110,w:470,h:48,role:"body",size:28,color:"ink"});
    const switchTrack=k.pill(toggle.inner,572,116,88,44,{fill:"accent"});
    const switchThumb=k.disc(toggle.inner,638,138,16,{fill:"surface"});
    ctx.m.reveal(toggle,tempted);
    A.pointer(tempted+ctx.style.dur("enter"),{x:1268,y:548});
    Loom.tl.set(switchTrack,{attr:{fill:ctx.c("muted")}},tempted+1.4);
    Loom.tl.set(switchThumb,{attr:{transform:"translate(-44 0)"}},tempted+1.4);
    Loom.tl.set(switchTrack,{attr:{fill:ctx.c("accent")}},drops);
    Loom.tl.set(switchThumb,{attr:{transform:"translate(0 0)"}},drops);
    // @form rejected_action: a cross distinguishes the tempting move from the protected state
    function badge(name,x,y,yes,t) {
      const E=ctx.el(name,{x,y,w:70,h:70,kind:"shape",exit:"recede"});
      k.disc(E.inner,35,35,34,{fill:"surface"});
      if(yes) {
        k.path(E.inner,"M18 35 L30 47 L53 22",{fill:"none",stroke:"pos",sw:7});
      } else {
        k.line(E.inner,21,21,49,49,{stroke:"neg",sw:7});
        k.line(E.inner,49,21,21,49,{stroke:"neg",sw:7});
      }
      ctx.m.reveal(E,t);
      return E;
    }
    const marks=badge("marks",1260,610,false,drops);
    ctx.m.exit(marks,move,"recede");
    A.pointerOut(drops+ctx.style.dur("enter"));
    ctx.m.exit(toggle,move,"recede");
    // @form retired_phone: independent source instance is visibly crossed, never a copy of the held destination
    const oldphone=ctx.el("oldphone",{x:150,y:260,w:272,h:544,kind:"instrument",exit:"recede"});
    oldphone.kit=Loom.lesson.phone(ctx,oldphone.inner,{w:272,state:"code",code:"482619"});
    oldphone.handle=oldphone.kit;
    ctx.m.reveal(oldphone,move);
    badge("oldphone_cross",394,266,false,move);
    next.setState("home",move);
    oldphone.kit.setCode("482619",move);
    // These six digits are illustrative, not a real sign-in credential. The laptop and both phones agree.
    A.setValue("code.current","482619",move);
    // @form migrating_code: the value takes a high arc, clear of the resting form's words
    const code=ctx.el("moving_code",{x:185,y:175,w:208,h:64,kind:"value",exit:"recede"});
    k.fit("482619",{role:"lead",w:184,h:48,maxLines:1});
    k.pill(code.inner,0,0,208,64,{fill:"surface",stroke:"accent2"});
    k.text(code.inner,"482619",{x:12,y:8,w:184,h:48,role:"lead",size:36,weight:700,align:"center",color:"ink",maxLines:1});
    ctx.m.reveal(code,move+ctx.style.dur("enter"));
    const route=k.path(code.inner,"M0 0 C300 0 1050 0 1350 0",{fill:"none",stroke:"none"});
    ctx.m.along(code,route,move+ctx.style.dur("enter"),{dur:ctx.style.dur("move")*3});
    const landed=move+ctx.style.dur("enter")+ctx.style.dur("move")*3;
    next.setCode("482619",landed);
    next.setState("new",landed);
    ctx.m.exit(code,landed,"recede");
    // @form replacement_confirmed: success attaches to the destination, not to disabling protection
    badge("transfer_tick",1700,730,true,landed);
    ctx.m.emphasis(newphone,landed);
  }
});
