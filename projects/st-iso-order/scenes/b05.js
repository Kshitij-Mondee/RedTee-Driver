// @design arrival_checked: a tracked token lands at a station beside a two-stage verification note
// Treatments: static plate with signalling; a separate payment UI; chosen token drop with one compact note, because arrival and reservation share a place.
Loom.scene('b05', {
  build(ctx) {
    const k=ctx.kit;
    const first=ctx.cue('First'), order=ctx.cue('order station'), payment=ctx.cue('checks payment'), reserve=ctx.cue('reserving it');
    const board=ctx.held('board'), world=board.handle, B=world.B;
    // Establish the office immediately, without a zero-duration camera seek.
    world.frame('office',ctx.start,{zoom:5,dur:0.001});
    world.frame('office',payment,{zoom:5,dur:0.001});
    world.frame('office',reserve,{zoom:5,dur:0.001});
    // @form tracked_order: one retained subject lands on the order plate
    const lamp=ctx.el('lamp',{x:96,y:84,w:1728,h:846,kind:'token',exit:'none'});
    const subject=Loom.lesson.lamp(ctx,lamp.inner,{w:100,h:74,state:'card',board:world,point:[3.65,12.4,0.15],at:order});
    lamp.handle=subject;
    subject.setState('card',order);
    Loom.tl.set(subject.item.g,{opacity:0},ctx.start);
    Loom.tl.set(subject.item.g,{opacity:1},order);
    // The carrier owns its world position. Drop only the attached artwork locally.
    Loom.tween(subject.groups.card,{y:-70},{y:0},order,{dur:ctx.style.dur('enter'),ease:'enter'});
    // @form authorisation_note: the payment check remains beside the order
    k.fit('Payment authorised',{role:'body',w:390,h:50,maxLines:1});
    const check=Loom.treat.panel(ctx,'check_card',{x:300,y:330,w:540,h:205,fill:'surface',tone:'surface2',as:'card',t:payment});
    check.exit='none';
    k.text(check.inner,'Payment authorised',{x:90,y:26,w:420,h:52,role:'body',color:'ink',maxLines:1});
    const tick=Loom.treat.mark(ctx,'payment_tick',{x:324,y:358,size:42,kind:'yes',on:check,t:payment});
    // @form reserved_amount: reservation is paused money rather than money taken
    const chip=Loom.svg('g',{},check.inner);
    k.rect(chip,24,105,492,72,{fill:'field2',r:6});
    k.rect(chip,45,128,6,26,{fill:'muted',r:1});
    k.rect(chip,59,128,6,26,{fill:'muted',r:1});
    k.fit('Held, not taken',{role:'label',w:400,h:44,maxLines:1});
    k.text(chip,'Held, not taken',{x:90,y:118,w:400,h:45,role:'label',color:'ink',maxLines:1});
    Loom.tl.set(chip,{opacity:0},ctx.start);
    Loom.tl.set(chip,{opacity:1},reserve);
    check.handle={chip:chip,tick:tick};
  }
});
