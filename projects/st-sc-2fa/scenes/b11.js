// @design matched_entry: a value on one surface is entered unchanged on another
// Treatments considered: static paired fields with signalling; travelling digits; native typing followed by a still-frame press. Choose native typing so the action is reproducible.
Loom.scene("b11", {
  build(ctx) {
    const app = ctx.held("app");
    const chapters = ctx.held("chapters");
    const phone = ctx.held("phone");
    const A = ctx.engine.resume(ctx,"app");
    const begin = ctx.cue("Type the current code");
    const type = ctx.cue("into the laptop");
    const verify = ctx.cue("click Verify");
    // The phone renewed to this illustrative value in b10. Do not reset its countdown.
    // @form current_code_dialog: plain product elements avoid a bundled close icon.
    const k = ctx.kit;
    const codebox = ctx.el("codebox",{x:96,y:150,w:1300,h:720,kind:"instrument",exit:"recede",overlaps:["app"]});
    codebox.handle = A;
    const veil = k.rect(codebox.inner,0,0,1300,720,{fill:"surface"});
    veil.setAttribute("opacity","1");
    k.rect(codebox.inner,340,130,600,440,{fill:"surface",stroke:"field2",r:18});
    k.text(codebox.inner,"Two-step sign-in",{x:380,y:166,w:520,h:58,role:"lead",size:36,color:"ink",weight:600,maxLines:1});
    k.text(codebox.inner,"Code",{x:380,y:244,w:520,h:42,role:"body",size:28,color:"ink",maxLines:1});
    k.rect(codebox.inner,380,296,520,84,{fill:"surface2",stroke:"field2",r:8});
    // Illustrative digits match the held authenticator, entered one at a time.
    const digits = "731604";
    for (let i=0;i<digits.length;i++) {
      const digit = k.text(codebox.inner,digits[i],{x:406+i*48,y:310,w:44,h:56,role:"lead",size:40,color:"ink",weight:600,maxLines:1});
      Loom.tl.set(digit,{opacity:0},ctx.start);
      Loom.tl.set(digit,{opacity:1},type+i*0.12);
    }
    k.rect(codebox.inner,720,458,180,68,{fill:"accent",r:8});
    k.text(codebox.inner,"Verify",{x:738,y:470,w:144,h:44,role:"body",size:28,color:Loom.style.pickTokenOn("accent"),weight:600,align:"center",maxLines:1});
    // @form verify_press: a finite teaching ring marks the product button press.
    const click_ring = ctx.el("click_ring",{x:808,y:600,w:196,h:84,kind:"instrument",exit:"recede"});
    click_ring.handle = A;
    k.rect(click_ring.inner,2,2,192,80,{fill:"none",stroke:"accent2",r:12});
    ctx.m.reveal(click_ring,verify);
    ctx.m.press(click_ring,verify);
    // @form verification_result: a product success tick appears only after the press.
    Loom.treat.mark(ctx,"verified",{x:1080,y:630,size:64,kind:"yes",t:verify+ctx.style.dur("enter")});
  }
});
