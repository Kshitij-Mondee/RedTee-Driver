// @design borrowed_key: one copied token opens a second door
/* Treatments: static side-by-side with a warning mark; travelling token; pointer-led break-in. Choose pointer-led action because sequence is the argument. */
Loom.scene("b02", {
  build(ctx) {
    const leak = ctx.cue("leaks");
    const tries = ctx.cue("Someone tries that password at work");
    const opens = ctx.cue("Sam's account opens");
    const shop = ctx.held("shop");
    const work = ctx.held("work");
    const chip = ctx.held("chip");
    const A = ctx.engine.resume(ctx, "work");
    // @form window_fracture: source failure above the original screen
    const crack = ctx.el("crack", {x:96,y:268,w:800,h:584,kind:"mark",exit:"recede"});
    ctx.kit.rect(crack.inner,0,0,800,584,{fill:"shadow",r:12}).setAttribute("opacity",0.13);
    const fracture = ctx.kit.path(crack.inner, "M50 70 L225 175 L190 240 L370 315 L340 390 L580 500", {fill:"none",stroke:ctx.c("neg"),sw:5});
    ctx.m.reveal(crack, leak);
    ctx.m.draw(fracture, leak, {dur:ctx.style.dur("draw")});
    const H = chip.kit || chip.handle;
    H.setState("cracked", leak);
    H.drop(leak, 100);
    ctx.m.emphasis(chip, leak);
    A.pointer(tries - ctx.style.dur("move"), {x:1740,y:760});
    A.setValue("login.password", "", ctx.start);
    A.type("login.password", "********", {at:tries, click:true});
    A.click("login.action.signin", {at:opens});
    A.pointerOut(opens + ctx.style.dur("move"));
    // @form opened_page: generic inbox replaces only the held browser content
    const page = ctx.el("opened_page", {x:1040,y:346,w:768,h:490,kind:"card",exit:"recede",parent:work.inner});
    ctx.kit.rect(page.inner,0,0,768,490,{fill:"surface",stroke:"field2",r:10});
    ctx.m.reveal(page, opens + ctx.style.dur("enter"));
    const inbox = Loom.ui.inbox(ctx, "inbox", {x:1058,y:362,w:732,parent:work.inner,rows:[
      {from:"Sam",subject:"Two-step sign-in",preview:"",time:"",unread:true},
      {from:"Sam",subject:"Password manager",preview:"",time:""}
    ]});
    Loom.ui.build(ctx,inbox,opens + ctx.style.dur("enter"),{whole:true});
    work.followers = [page,inbox.E];
  }
});
