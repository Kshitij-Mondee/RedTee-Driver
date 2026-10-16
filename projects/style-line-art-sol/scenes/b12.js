// @design higher_then_handoff: a tentative outline climbs one step before a clear route reaches a person
Loom.scene("b12", {
  build(ctx) {
    // Treatments considered: static stepped diagram with signalling; moving page on outline steps; full ladder climb.
    // Chosen: one measured step and one drawn handoff, since both movements state the rule without decoration.
    const K = ctx.kit, M = ctx.m, T = Loom.treat;
    const unsure = ctx.cue("Not sure?");
    const higher = ctx.cue("Treat it as the higher class");
    const ask = ctx.cue("ask its owner");
    const policy = ctx.cue("Our own policy decides each case");
    const drawDur = ctx.style.dur("draw");
    const moveDur = ctx.style.dur("move");
    // @form outline_steps: two class-coloured resting ledges give the climb its reference
    const steps = ctx.el("steps", {x:392,y:618,w:632,h:192,kind:"instrument",exit:"recede"});
    const lower = K.path(steps.inner,"M0 152H332V188H0Z",{fill:"none",stroke:"accent2",sw:3});
    const upper = K.path(steps.inner,"M300 0H632V36H300Z",{fill:"none",stroke:"accent3",sw:3});
    const riser = K.line(steps.inner,300,36,300,152,{stroke:"muted",sw:3});
    M.draw(lower,unsure,{dur:drawDur});
    M.draw(upper,unsure,{dur:drawDur});
    M.draw(riser,unsure,{dur:drawDur});
    // @form unsure_page: the same dashed item moves onto the more protective ledge
    const page = ctx.el("unsure_item", {x:424,y:398,w:280,h:360,kind:"card",exit:"recede"});
    const item = Loom.lesson.item(ctx,page.inner,{x:0,y:0,variant:"plain",cls:"none",label:false});
    page.handle = item;
    item.drawIn(unsure,drawDur);
    M.travel(page,higher,{x:300,y:-152,dur:moveDur});
    item.setClass("confidential",higher,drawDur);
    // @form harm_question: a decision mark belongs to the tentative page, not the owner
    const qmark = ctx.el("qmark", {x:484,y:84,w:160,h:300,kind:"instrument",exit:"recede"});
    const question = Loom.lesson.harm_mark(ctx,qmark.inner,{x:0,y:0});
    qmark.handle = question;
    question.drawOn(unsure,drawDur);
    question.showLabel(unsure,moveDur);
    question.fadeOut(higher,moveDur);
    K.fit("Go higher",{role:"lead",w:300,h:64,maxLines:1});
    // @form higher_label: the first action is named above its landing point
    T.label(ctx,"go_higher",{x:704,y:155,text:"Go higher",tone:"ink",role:"lead",t:higher});
    // @form owner_cast: the named owner is the fixed tess rig, never an improvised figure
    const owner = ctx.character("Owner","tess",{x:1460,y:650,scale:0.6,top:"ink",pose:"idle"});
    owner.E.exit = "recede";
    M.reveal(owner.E,ask);
    K.fit("Owner",{role:"label",w:260,h:48,maxLines:1});
    T.label(ctx,"owner_name",{x:1570,y:575,text:"Owner",tone:"ink",role:"label",t:ask});
    // @form direct_handoff: the accent belongs only to the route from the higher item to the owner
    const route = ctx.el("owner_arrow", {x:1032,y:394,w:300,h:42,kind:"connector",exit:"recede"});
    const arrow = K.arrow(route.inner,6,21,286,21,{stroke:"accent",sw:3});
    M.draw(arrow,ask,{dur:drawDur});
    K.fit("Ask the owner",{role:"body",w:350,h:64,maxLines:1});
    T.label(ctx,"ask_owner_label",{x:1190,y:316,text:"Ask the owner",tone:"ink",role:"body",t:ask});
    M.emphasis(route,ask);
    // @form policy_page: a small outline document grounds the decision beneath its owner
    const note = Loom.obj.draw(ctx,"policy_note","document",{x:1390,y:740,size:120,tone:"ink",detail:2,t:policy});
    note.exit = "recede";
    K.fit("Our policy",{role:"label",w:270,h:48,maxLines:1});
    T.label(ctx,"policy_label",{x:1550,y:790,text:"Our policy",tone:"ink",role:"label",t:policy});
    // The world camera owns the join back to the desk. No local pan duplicates it.
  }
});
