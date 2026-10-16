// @design numbered_recovery: two ordered actions accumulate beside the surface where each is completed
Loom.scene("b21", {
  build(ctx) {
    /* Treatments: static numbered list with signalling; moving cards between stations; native dialog actions.
       Choose native dialog actions plus a stable numbered list, since completion is the visual argument. */
    const k=ctx.kit;
    const one=ctx.cue("One, sign in with a backup code");
    const two=ctx.cue("Two, tell IT straight away");
    const app=ctx.held("app");
    const empty=ctx.held("empty_spot");
    const chapters=ctx.held("chapters");
    const A=ctx.engine.resume(ctx,"app");
    // @form recovery_path: fixed geometry leaves two equal slots for the following beat
    const path=ctx.el("path",{x:96,y:270,w:384,h:620,kind:"label",exit:"none"});
    function step(name,n,label,y,h,t) {
      const E=ctx.el(name,{x:0,y:y,w:384,h:h,parent:path,kind:"label",exit:"none"});
      k.rect(E.inner,0,0,384,h,{fill:"field",stroke:"none",r:0,shadow:false});
      k.disc(E.inner,28,30,26,{fill:"accent2"});
      k.fit(String(n),{role:"label",w:36,h:40,maxLines:1});
      k.text(E.inner,String(n),{x:10,y:10,w:36,h:40,role:"label",size:28,align:"center",color:"onAccent",weight:700});
      k.fit(label,{role:"lead",w:296,h:h-16,maxLines:3});
      k.text(E.inner,label,{x:76,y:8,w:296,h:h-16,role:"lead",size:32,maxLines:3,color:"ink",weight:600});
      ctx.m.reveal(E,t);
      return E;
    }
    step("recovery_one",1,"Sign in with a backup code",0,142,one);
    step("recovery_two",2,"Tell IT",158,112,two);
    // @form backup_code_entry: a masked illustrative backup value is entered in the recovery form
    // Keep the sparse recovery form at home so the fixed path never covers the entered value.
    A.callout("code.current","Backup code",{at:one,until:two-0.35,side:"above"});
    // Imagine this illustrative recovery code. It is never a real credential.
    A.type("code.current","000000",{at:one+ctx.style.dur("enter")+0.45,click:false});
    A.click("code.action.verify",{at:two-0.7});
    // @form it_message: the native message dialog belongs to the held app, with a handoff handle
    const msg=ctx.el("it_msg",{x:680,y:330,w:600,h:340,kind:"instrument",exit:"none"});
    msg.handle=A;
    // Native anchored message menu is the documented fallback while the dialog close icon is unavailable.
    A.menu("code.current",[{id:"lost",label:"Lost phone"},{id:"send",label:"Tell IT"}],{at:two,w:380});
    A.click("menu.send",{at:two+1.35});
    A.closeMenu(two+1.6);
    A.toast("Tell IT",{at:two+1.65,tone:"success",icon:"check",id:"it_sent",until:ctx.end+ctx.style.dur("exit"),place:"bottom-center"});
    A.pointerOut(two+1.9);
    // Home framing remains unchanged for the next beat.
    void app; void empty; void chapters;
  }
});
