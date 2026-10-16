// @design single_use_signal: a stored set resolves into one bounded item with one-use signalling
// Treatments considered: static grid with signalling; one row travelling away; persistent grid and one highlighted row.
// Chosen: persistent grid with a single timed highlight, preserving the set for the following storage choice.
Loom.scene("b12", {
  build(ctx) {
    const k = ctx.kit;
    const show = ctx.cue("Next come backup codes");
    const once = ctx.cue("Each works one time");
    const A = ctx.engine.resume(ctx,"app");
    ctx.held("chapters");
    ctx.held("phone");
    A.pointerOut(ctx.start);
    A.closeDialog(show);
    A.zoomOut({at:ctx.start,dur:ctx.style.dur("move")});
    // @form backup_code_panel: a stable product surface held for the storage decision
    const codes = Loom.treat.panel(ctx,"codes",{x:320,y:230,w:1040,h:650,fill:"surface",tone:"ink",as:"card",t:show});
    codes.exit = "none";
    k.fit("Backup codes",{role:"lead",w:920,h:60,maxLines:1});
    k.text(codes.inner,"Backup codes",{x:40,y:28,w:920,h:60,role:"lead",size:36,color:"ink",weight:600,maxLines:1});
    // Illustrative, non-working backup codes, not account data or a numerical claim.
    const values = ["A7K2 R9M4","C3N8 T6P2","H9D4 W2F7","J5L8 B3Q6","M2V7 X4S9","P8R3 N6K5","T4C9 G7D2","W6F2 L8H3"];
    const top = Math.max(142,codes.content.y+24);
    values.forEach((value,i) => {
      const col = i%2;
      const row = Math.floor(i/2);
      const x = 160+col*404;
      const y = top+row*102;
      k.rect(codes.inner,x,y,372,78,{fill:"surface2",stroke:"field2",r:10});
      k.fit(value,{role:"body",w:336,h:46,maxLines:1});
      const text = k.text(codes.inner,value,{x:x+18,y:y+16,w:336,h:46,role:"body",size:32,color:"ink",maxLines:1,weight:600});
      text.setAttribute("font-family",String.fromCharCode(74,101,116,66,114,97,105,110,115,32,77,111,110,111));
    });
    // @form single_code_outline: the teaching signal selects one code, never a product state
    const selected = ctx.el("selected_code",{x:480,y:230+top,w:372,h:78,kind:"icon",exit:"recede"});
    k.rect(selected.inner,0,0,372,78,{fill:"none",stroke:"accent2",r:10});
    ctx.m.reveal(selected,once);
    // @form single_use_callout: the once-only limit is explicit at the spoken hedge
    const callout = Loom.treat.label(ctx,"once_callout",{x:930,y:315,text:"one time",to:[844,230+top+39],tone:"accent2",role:"label",as:"pill",t:once});
    ctx.m.emphasis(callout,once);
  }
});
