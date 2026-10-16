// @design nested_boundary_rule: the ordering of three boundaries becomes a practical choice
// Treatments considered: static diagram with an underline; shrinking rings; a down-arrow alongside held labels. Chosen: held diagram with one directional signal, then the written rule.
Loom.scene("b08", {
  build(ctx) {
    const W=ctx.engine, B=W.board(ctx);
    ["page","key","rings","crowd","anyone_label","company_ring","company_people","company_label","named_ring","door","list","named_label"].forEach(name=>ctx.held(name));
    const to=ctx.cue("Widest to narrowest");
    const tr=ctx.cue("Pick the narrowest");
    const tc=ctx.cue("Your company may set rules");
    // @form ink_door: a fresh ink-only overlay replaces the previous unkept accent
    const ink=ctx.el("door_ink_overlay",{x:370,y:110,w:1280,h:780,kind:"mark",exit:"recede"});
    const recall=Loom.lesson.access_rings(ctx,ink.inner,{w:1280,h:780,radius:380,cx:390,cy:390,labels:false,name:"b08_door",marker:false});
    recall.door.draw("ink",ctx.start,{by:ctx.start,state:"shut"});
    // @form ordered_labels: one downward arrow reads the three existing labels in order
    const arrow=ctx.el("narrow_arrow",{x:1720,y:210,w:70,h:260,kind:"connector",exit:"recede"});
    B.draw(arrow,W.arrow(30,10,30,240),{at:to,by:to+ctx.style.dur("draw"),pen:"ink"});
    const order=ctx.el("order_words",{x:1380,y:500,w:420,h:140,kind:"text",exit:"wipe"});
    ctx.kit.fit("Widest to narrowest",{role:"body",w:400,h:120,maxLines:2});
    B.write(order,"Widest to narrowest",{role:"body",x:10,y:10,w:400,h:120,maxLines:2,at:to+ctx.style.dur("draw"),by:tr,pen:"ink"});
    // @form pocket_rule: the rule is written once, lower in the right column
    const words=ctx.el("rule_words",{x:1180,y:694,w:620,h:72,kind:"text",exit:"wipe"});
    ctx.kit.fit("Pick the narrowest that works",{role:"lead",w:600,h:60,maxLines:1});
    B.write(words,"Pick the narrowest that works",{role:"lead",x:10,y:6,w:600,h:60,maxLines:1,at:tr,by:tc-ctx.style.dur("draw")*.4,pen:"ink"});
    // @form rule_emphasis: the sole accent is an underline, not a second category
    const underline=ctx.el("rule_underline",{x:1190,y:769,w:595,h:24,kind:"mark",exit:"recede"});
    B.draw(underline,W.line(4,10,580,7),{at:tc-ctx.style.dur("draw")*.4,by:tc,pen:"accent"});
    // @form company_reminder: company rules remain a separate muted note
    const note=ctx.el("company_note",{x:1180,y:815,w:620,h:70,kind:"text",exit:"wipe"});
    ctx.kit.fit("Check your company's rules",{role:"label",w:600,h:55,maxLines:1});
    B.write(note,"Check your company's rules",{role:"label",x:10,y:6,w:600,h:55,maxLines:1,at:tc,by:tc+ctx.style.dur("draw")*1.4,pen:"muted"});
  }
});
