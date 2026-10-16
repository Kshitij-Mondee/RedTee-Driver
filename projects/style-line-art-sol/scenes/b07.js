// @design outline_decides: a dashed page becomes a classified outline, then makes room for its route
// Treatments considered: static page with signalling; page and harm glyph; full vault metaphor. Chosen page and glyph because the outline change is the decision.
Loom.scene("b07", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const arrival = ctx.cue("Now the customer list");
    const details = ctx.cue("personal details");
    const harm = ctx.cue("real people could be harmed");
    const classified = ctx.cue("Confidential");
    // @form warm_sheet: the confidential station has a quiet mid-value ground
    const field = ctx.el("vault_field_b07", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"none"});
    kit.rect(field.inner,0,0,1920,1080,{fill:"field2",r:0});
    // @form page_outline: the same attachment is enlarged without changing its look
    const list = ctx.el("customer_list", {x:730,y:280,w:404,h:516,kind:"card",exit:"none"});
    list.handle = Loom.lesson.item(ctx,list.inner,{x:6,y:6,scale:1.4,variant:"customer_list",cls:"none"});
    list.handle.drawIn(arrival,ctx.style.dur("draw"));
    list.handle.printRows(details,0.09,ctx.style.dur("move"));
    list.handle.setState("confidential",classified);
    // @form harm_glyph: a question above the people connects disclosure to harm
    const question = ctx.el("qmark",{x:1250,y:240,w:172,h:312,kind:"instrument",exit:"recede"});
    const q = Loom.lesson.harm_mark(ctx,question.inner,{x:6,y:6,scale:1});
    q.drawOn(harm,ctx.style.dur("draw"));
    q.showLabel(harm,ctx.style.dur("enter"));
    q.hoverFor(harm,classified,6);
    // @form affected_people: personal details belong to actual people
    const people = ctx.el("people_row",{x:1200,y:610,w:286,h:108,kind:"group",exit:"recede"});
    const row = Loom.lesson.people_row(ctx,people.inner,{x:6,y:6,n:3,scale:1.2,color:"ink"});
    row.drawIn(harm,0.15,ctx.style.dur("enter"));
    q.fadeOut(classified + ctx.style.dur("draw"),ctx.style.dur("exit"));
    m.exit(people,classified + ctx.style.dur("draw"),"recede");
    // Handoff: customer_list settles at x160 y330, scale0.8, unchanged for b08.
    m.travel(list,classified + ctx.style.dur("draw"),{x:-570,y:50,scale:0.8,dur:ctx.style.dur("move")});
  }
});
