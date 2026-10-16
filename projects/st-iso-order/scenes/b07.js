// @design work_handover: one coloured token moves from a cleared check to a short neutral waiting row
// Treatments: static handover with signalling; a shelf detail inset; chosen retained travel into a compact row, because the handoff is the argument. Shelf detail uses a stock-allocation note pending kit support.
Loom.scene('b07', {
  build(ctx) {
    const board=ctx.held('board'), world=board.handle, B=world.B;
    const lamp=ctx.held('lamp');
    const stock=ctx.cue('stock is set aside'), drop=ctx.cue('drops into'), queue=ctx.cue('warehouse queue');
    const travelDur=queue-drop;
    ctx.m.exit(ctx.held('check_card'),ctx.start,{kind:'recede',dur:ctx.style.dur('exit')});
    // @form stock_allocation: a compact temporary note replaces the completed check
    ctx.kit.fit('stock is set aside',{role:'body',w:450,h:52,maxLines:1});
    const tag=Loom.treat.panel(ctx,'stock_tag',{x:1250,y:300,w:510,h:116,fill:'surface',tone:'surface2',t:stock});
    tag.exit='recede';
    ctx.kit.text(tag.inner,'stock is set aside',{x:30,y:30,w:450,h:52,role:'body',color:'ink',maxLines:1});
    ctx.m.exit(tag,drop,{kind:'recede',dur:ctx.style.dur('exit')});
    lamp.handle.setState('card',stock);
    lamp.handle.travel(world.routes.orderToWarehouse,drop,{dur:travelDur});
    world.frame('warehouseDoor',drop,{zoom:2.6,dur:travelDur,fly:true});
    // @form work_queue: small grey order cards wait beside the arriving subject
    ctx.kit.fit('warehouse queue',{role:'body',w:450,h:52,maxLines:1});
    const row=Loom.treat.panel(ctx,'pick_queue',{x:1250,y:180,w:510,h:116,fill:'surface',tone:'surface2',t:queue});
    row.exit='none';
    ctx.kit.text(row.inner,'warehouse queue',{x:30,y:30,w:450,h:52,role:'body',color:'ink',maxLines:1});
    const cards=[];
    for(let i=0;i<3;i++){
      cards.push(B.put('slab',{name:'queue_order_'+i,x:7.35+i*0.8,y:11.3,z:0.15,w:0.55,d:0.38,h:0.035,tok:'surface2',at:queue,enter:'drop'}));
    }
    row.handle={items:cards,anchor:[7.35,11.3,0.15]};
  }
});
