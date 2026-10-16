// @design nested_boundary_check: a smaller boundary asks for identity rather than possession
// Treatments considered: static nested boundaries with signalling; a moving key checked at a gate; drawn inner boundary with checked list. Chosen: drawn boundary and list, because identity is the turn.
Loom.scene("b07", {
  build(ctx) {
    const W = ctx.engine, B = W.board(ctx);
    const keep = ["page","key","rings","crowd","anyone_label","company_ring","company_people","company_label"];
    keep.forEach(name => ctx.held(name));
    const tn = ctx.cue("named people");
    const td = ctx.cue("the door checks you");
    const tc = ctx.cue("Only accounts you added");
    // @form inner_boundary: the narrowest opening
    const inner = ctx.el("named_ring", {x:370,y:110,w:1280,h:780,kind:"mark",exit:"recede"});
    const ring = Loom.lesson.access_rings(ctx, inner.inner, {w:1280,h:780,radius:380,cx:390,cy:390,labels:false,name:"b07_inner",marker:true});
    inner.handle = ring;
    ring.showRing("named",tn,{by:tn+ctx.style.dur("draw")});
    // @form named_leader: connects the new inner boundary to its label without crossing any words
    const label = ctx.el("named_label", {x:1185,y:420,w:575,h:64,kind:"text",exit:"wipe"});
    const leader=ctx.el("named_leader",{x:1110,y:446,w:65,h:40,kind:"connector",exit:"recede"});
    B.draw(leader,W.line(4,34,60,7),{at:tn+ctx.style.dur("draw"),by:tn+ctx.style.dur("draw")*1.2,pen:"ink"});
    ctx.kit.fit("Named people",{role:"lead",w:470,h:64,maxLines:1});
    B.write(label,"Named people",{x:0,y:0,w:555,h:58,role:"lead",at:tn+ctx.style.dur("draw")*1.2,by:td,pen:"ink",maxLines:1});
    // @form checked_door: the coloured stroke is scene-owned and will not be held
    const door = ctx.el("door", {x:370,y:110,w:1280,h:780,kind:"instrument",exit:"recede"});
    door.handle = ring;
    const overlay = ctx.el("door_accent", {x:370,y:110,w:1280,h:780,kind:"mark",exit:"none"});
    ring.door.draw("accent",td,{by:td+ctx.style.dur("draw"),state:"shut",parent:overlay.inner});
    // @form identity_list: only the listed accounts are checked
    const list = ctx.el("list", {x:1180,y:510,w:140,h:140,kind:"card",exit:"recede"});
    const names = Loom.lesson.name_list(ctx,list.inner,{w:140,h:140,name:"b07_accounts",marker:true});
    list.handle = names;
    names.draw(td+ctx.style.dur("draw"),{by:td+ctx.style.dur("draw")*1.5});
    names.check(0,tc,{by:tc+ctx.style.dur("draw")*.32,pen:"ink"});
    names.check(1,tc+ctx.style.dur("draw")*.32,{by:tc+ctx.style.dur("draw")*.64,pen:"ink"});
    names.check(2,tc+ctx.style.dur("draw")*.64,{by:tc+ctx.style.dur("draw"),pen:"ink"});
  }
});
