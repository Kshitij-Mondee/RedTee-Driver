// @design stalled_threshold: a copied token reaches a gate and cannot complete the next empty proof
// Treatments considered: static code field with signalling; moving token halted at a gate; split before and after. Choose halted token because the failed attempt is the argument.
Loom.scene("b06", {
  build(ctx) {
    const A = ctx.engine.resume(ctx, "app");
    const begin = ctx.cue("It's not unhackable");
    const stop = ctx.cue("no longer gets in");
    A.setValue("proof:signin.password", "", ctx.start);
    A.pointer(begin, {x:900,y:480});
    A.click("proof:signin.password", {at:begin + 0.9});
    A.type("proof:signin.password", "password", {at:begin + 1.1, click:false});
    A.click("signin.action.sign_in", {at:ctx.cue("a stolen password alone"),dx:42});
    A.pointerOut(ctx.cue("a stolen password alone") + ctx.style.dur("move"));
    // Plain modal: no engine dialog or close icon is created.
    const veil = ctx.el("codeveil",{x:96,y:150,w:1300,h:720,kind:"instrument",exit:"recede"});
    const wash = ctx.kit.rect(veil.inner,0,0,1300,720,{fill:"shadow",r:0});
    wash.setAttribute("opacity",0.28);
    ctx.m.reveal(veil,stop);
    A.pointerOut(stop);
    // @form stolen_token: the same copied credential attempts entry
    const chip = ctx.el("chip", {x:1460,y:440,w:260,h:56,kind:"token",exit:"recede"});
    chip.kit = Loom.lesson.password_chip(ctx, chip.inner, {state:"masked"});
    chip.handle = chip.kit;
    ctx.m.reveal(chip, begin);
    chip.kit.setState("masked", begin);
    chip.kit.setState("stopped", stop);
    // @form waiting_proof: semantic anchor for the app's uncompleted second step
    const codestep = ctx.el("codestep", {x:465,y:420,w:560,h:310,kind:"instrument",exit:"recede",overlaps:["app","codeveil"]});
    codestep.app = A;
    const k = ctx.kit;
    k.rect(codestep.inner,0,0,560,310,{fill:"surface",stroke:"field2",r:16});
    k.text(codestep.inner,"Two-step sign-in",{x:32,y:24,w:496,h:48,role:"lead",size:32,color:"ink",weight:600});
    k.text(codestep.inner,"Code",{x:32,y:92,w:496,h:40,role:"label",size:24,color:"ink"});
    k.rect(codestep.inner,32,140,496,56,{fill:"surface",stroke:"line",r:10});
    k.rect(codestep.inner,352,226,176,56,{fill:"field2",r:10});
    k.text(codestep.inner,"Verify",{x:370,y:234,w:140,h:40,role:"label",size:24,color:"muted",weight:600,maxLines:1});
    ctx.m.reveal(codestep,stop);
    // End state: proof page behind a plain Code/disabled Verify card; no native dialog.
  }
});
