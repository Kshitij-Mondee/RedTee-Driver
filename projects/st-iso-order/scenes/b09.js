// @design record_reality_split: a positive record faces a visibly vacant physical location
// Treatments: static paired evidence with signalling; a travelling item that disappears; a live shelf inset opposite its record. Choose the live inset so the discrepancy is spatial, not just verbal.
Loom.scene('b09', {
  build(ctx) {
    const k=ctx.kit;
    const tCard=ctx.cue("Here is a slip"), tShelf=ctx.cue("not always on the shelf");
    const board=ctx.held('board'), world=board.handle, B=world.B;
    const lamp=ctx.held('lamp');
    world.setState('cutaway',tCard);
    world.frame('warehouseAisle',tCard,{dur:1.2,zoom:2.5});
    // @form digital_record: a compact product record on the left
    k.fit('In stock',{role:'lead',w:350,h:60,maxLines:1});
    const card=Loom.treat.panel(ctx,'web_card',{x:205,y:300,w:430,h:300,fill:'surface',tone:'line',as:'card',t:tCard});
    k.icon(card.inner,'lamp-desk',{x:155,y:32,size:110,color:'accent'});
    k.text(card.inner,'In stock',{x:32,y:195,w:366,h:60,role:'lead',align:'center',color:'ink',maxLines:1});
    Loom.tween(card.inner,{x:-60},{x:0},tCard,{dur:ctx.style.dur('enter'),ease:'enter'});
    // @form shelf_evidence: a live magnification of the physical shelf
    const inset=ctx.el('shelf_inset',{x:1120,y:260,w:520,h:520,kind:'instrument',exit:'iris'});
    inset.handle=B.inset('shelf_inset',{of:world.anchors.emptyShelfSlot||world.points.shelf,centre:[1284,436],r:240,zoom:4,at:tShelf,until:ctx.end,label:'Shelf: empty'});
    // @form held_location: the delay belongs to a location, never a person
    const held=ctx.el('held_mark',{x:1210,y:445,w:390,h:200,kind:'icon',exit:'recede'});
    held.handle=Loom.lesson.held_mark(ctx,held.inner,{label:false,state:'ring'});
    ctx.m.reveal(held,tShelf,{dur:ctx.style.dur('enter')});
    // @form evidence_leader: connect the record to the magnified shelf
    const leader=ctx.el('stock_leader',{x:650,y:395,w:460,h:30,kind:'connector',exit:'recede'});
    const line=k.line(leader.inner,0,15,460,15,{stroke:'line',sw:2});
    ctx.m.reveal(leader,tShelf,{dur:ctx.style.dur('draw')});
    // @form disagreement: the record does not establish physical availability
    const neg=Loom.treat.mark(ctx,'stock_disagreement',{x:820,y:450,size:70,kind:'no',t:tShelf});
  }
});
