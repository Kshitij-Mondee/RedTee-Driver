// @design safe_storage_transfer: a loose set leaves an excluded device and settles in one of two supported places
// Treatments considered: static storage choices with signalling; a lifted card travelling to storage; a split view of two destinations.
// Chosen: lifted card travel, because movement makes the separation from the phone explicit.
Loom.scene("b13", {
  build(ctx) {
    const k = ctx.kit;
    const lift = ctx.cue("Keep them off the phone");
    const store = ctx.cue("in your password manager");
    const policy = ctx.cue("where IT says");
    const A = ctx.engine.resume(ctx,"app");
    ctx.held("chapters");
    const phone = ctx.held("phone");
    const codes = ctx.held("codes");
    A.pointerOut(ctx.start);
    if (phone && phone.handle) {
      // Keep the exclusion mark in the blank lower screen, clear of the account and code.
      Loom.tl.set(phone.handle.cross,{attr:{transform:"translate(85 340) scale(0.5)"}},lift);
      phone.handle.setState("crossed",lift);
    }
    if (codes) ctx.m.exit(codes,lift,"recede");
    // @form storage_workspace: the held shell remains while a quiet workspace covers the completed form
    const workspace = ctx.el("storage_workspace",{x:330,y:230,w:1100,h:650,kind:"scenery",exit:"recede"});
    k.rect(workspace.inner,0,0,1100,650,{fill:"surface2",stroke:"field2",r:12});
    ctx.m.reveal(workspace,lift);
    // @form storage_destination: a product-neutral vault surface receives the code card
    const vault = Loom.treat.panel(ctx,"vault",{x:440,y:295,w:680,h:505,title:"password manager",fill:"surface2",tone:"accent",as:"card",t:store});
    Loom.obj.shape(vault.inner,"lock",340,198,130,{tone:"accent",detail:2,state:{open:false}});
    ctx.m.emphasis(vault,store);
    // @form portable_codes: the lifted set is represented as a compact labelled card, not tiny unreadable digits
    const card = Loom.treat.panel(ctx,"codes_card",{x:650,y:410,w:420,h:168,title:"Backup codes",fill:"surface",tone:"field2",as:"card",t:lift});
    Loom.obj.shape(card.inner,"document",72,114,58,{tone:"muted",detail:1});
    k.rect(card.inner,128,106,236,9,{fill:"field2",r:4});
    k.rect(card.inner,128,130,182,9,{fill:"field2",r:4});
    ctx.m.travel(card,lift,{x:0,y:-45,scale:1});
    ctx.m.travel(card,store,{x:-80,y:180,scale:1});
    // @form policy_alternative: the second valid storage route stays beside the manager rather than replacing it
    const note = Loom.treat.panel(ctx,"it_note",{x:1150,y:400,w:280,h:260,fill:"surface",tone:"field2",as:"card",t:policy});
    Loom.obj.shape(note.inner,"building",140,77,70,{tone:"muted",detail:1});
    k.fit("where IT says",{role:"body",w:232,h:104,maxLines:2});
    k.text(note.inner,"where IT says",{x:24,y:134,w:232,h:104,role:"body",size:32,color:"ink",maxLines:2,weight:600});
  }
});
