// @design empty_destination: a promise advances through days while the receiving place stays empty
// Treatments: static house with a signalled empty doorstep; calendar swaps beside a promise; travelling parcel withheld. Choose calendar swaps, since elapsed days against a still doorstep is the argument.
Loom.scene("b01", {
  build(ctx) {
    const k=ctx.kit, m=ctx.m;
    const order=ctx.cue("desk lamp"), promise=ctx.cue("arrives tomorrow"), days=ctx.cue("It is Thursday"), empty=ctx.cue("No lamp");
    // @form retained_diorama: the destination exists before the order
    const board=ctx.el("board",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"none"});
    const world=Loom.lesson.world_board(ctx,board.inner,{state:"day"});
    board.handle=world;
    world.frame("herStreet",ctx.start,{dur:0.001,zoom:5});
    // @form promise_card: a concrete purchase and its promised arrival
    const phone=ctx.el("phone_card",{x:220,y:240,w:430,h:410,kind:"card",exit:"displace"});
    const page=Loom.lesson.phone_card(ctx,phone.inner,{state:"page"});
    // Remove the unused lower page area while retaining full-size promise text.
    page.group.querySelector('rect').setAttribute('height',410);
    phone.handle=page;
    Loom.tl.set(page.promise,{opacity:0},ctx.start);
    Loom.tl.set(page.promise,{opacity:1},promise);
    Loom.tween(phone.inner,{x:-80},{x:0},order,{dur:ctx.style.dur("enter"),ease:"enter"});
    Loom.tl.set(phone.outer,{opacity:0},ctx.start);
    Loom.tl.set(phone.outer,{opacity:1},order);
    Loom.tween(page.button,{opacity:1},{opacity:0.55},order+ctx.style.dur("enter"),{dur:ctx.style.dur("move")/2});
    Loom.tween(page.button,{opacity:0.55},{opacity:1},order+ctx.style.dur("enter")+ctx.style.dur("move")/2,{dur:ctx.style.dur("move")/2});
    // @form date_swaps: elapsed days beside an unchanged destination
    k.fit("Wednesday",{role:"lead",w:270,h:56,maxLines:1});
    const calendar=Loom.treat.panel(ctx,"calendar",{x:220,y:665,w:430,h:100,fill:"surface",tone:"line",t:days});
    calendar.exit="displace";
    const dates=["Tuesday","Wednesday","Thursday"];
    dates.forEach(function(day,i){
      const text=k.text(calendar.inner,day,{x:24,y:22,w:382,h:56,role:"lead",align:"center",color:"ink",maxLines:1});
      Loom.tl.set(text,{opacity:0},ctx.start);
      Loom.tl.set(text,{opacity:1},days+i*ctx.style.dur("move"));
      if(i<2)Loom.tl.set(text,{opacity:0},days+(i+1)*ctx.style.dur("move"));
    });
    world.doorstep(empty);
  }
});
