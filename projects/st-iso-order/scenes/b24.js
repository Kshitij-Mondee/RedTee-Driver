// @design relay_resumes: a still subject rejoins the route as the whole system returns to view
// Treatments: static board with signalling; reply then cut to a route; retained board with scale reveal.
// Choose retained board: movement restarts while the pocket rule settles beside the system.
Loom.scene("b24", {
  build(ctx) {
    const k=ctx.kit;
    const tell=ctx.cue("You tell her"), truck=ctx.cue("next truck");
    const scan=ctx.cue("the last scan"), station=ctx.cue("the station"), reason=ctx.cue("the reason"), promise=ctx.cue("make the promise");
    const board=ctx.held("board");
    const world=board.handle, B=world.B;
    world.setState("day",ctx.start);
    world.frame("wide",truck,{dur:1.8,fly:true,zoom:1});
    // @form reply_in_hand: a concrete answer replaces an unexplained tracking gap
    const phone=ctx.el("phone_card",{x:150,y:245,w:430,h:560,kind:"card",exit:"none"});
    phone.handle=Loom.lesson.phone_card(ctx,phone.inner,{state:"reply"});
    ctx.m.reveal(phone,tell,{dur:ctx.style.dur("enter")});
    Loom.tween(phone.inner,{x:-48},{x:0},tell,{dur:ctx.style.dur("enter"),ease:"enter"});
    // @form resumed_subject: the parcel is loaded and travels above the delivery vehicle
    const lamp=ctx.el("lamp",{x:96,y:84,w:1728,h:846,kind:"token",exit:"none"});
    lamp.handle=Loom.lesson.lamp(ctx,lamp.inner,{board:world,state:"box",point:world.points.dock,at:ctx.start});
    const load=B.route("lamp_loading",[[15.4,7.6,0.3],[15.4,8.1,0.3],[15.4,8.1,1.15],[14.3,8.1,1.15]],{tok:"line",width:2,at:truck});
    lamp.handle.travel(load,truck,{dur:ctx.style.dur("move")*2});
    const depart=truck+ctx.style.dur("move")*2;
    const road=B.route("closing_departure",[[14.3,8.1],[14.3,10],[18.3,10],[18.3,5.7],[20.2,5.7]],{tok:"line",width:2,dash:true,at:truck});
    const cargo=B.route("closing_cargo",[[14.3,8.1,1.15],[14.3,10,1.15],[18.3,10,1.15],[18.3,5.7,1.15],[20.2,5.7,1.15]],{tok:"line",width:2,at:truck});
    world.trucks[1].travel(road,depart,{dur:ctx.style.dur("move")*8});
    lamp.handle.travel(cargo,depart,{dur:ctx.style.dur("move")*8});
    // @form pocket_rule: the order of evidence stays visible before a promise
    const rule=Loom.treat.panel(ctx,"rule_card",{x:1370,y:145,w:390,h:352,fill:"surface",tone:"surface2",as:"card",t:scan});
    rule.exit="none";
    const texts=["Last scan","Station","Reason","Then the promise"], times=[scan,station,reason,promise];
    texts.forEach(function(s,i){
      k.fit(s,{role:"label",w:326,h:54,maxLines:1});
      const row=k.text(rule.inner,s,{x:32,y:25+i*78,w:326,h:54,role:"label",color:"ink",maxLines:1});
      Loom.tl.set(row,{opacity:0},ctx.start);
      Loom.tl.set(row,{opacity:1},times[i]);
    });
  }
});
