// @design discrete_reports: a still route gains records only at separate checkpoints
// Treatments: static route with signals; moving location dot; discrete scan brackets and accumulating records. Choose discrete brackets because an absent continuous location is the argument.
Loom.scene("b20", {
  build(ctx) {
    const tBoard=ctx.cue("One more slip"), tPhone=ctx.cue("not a live map"), tPins=ctx.cue("Each status"), tScan=ctx.cue("a scan at a hand-off");
    // @form quiet_map: an unchanged dotted route is not a moving location
    const board=ctx.el("board",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"none"});
    const world=Loom.lesson.world_board(ctx,board.inner,{state:"grey"});
    board.handle=world;
    const B=world.B;
    world.frame("wide",ctx.start,{dur:0.001,zoom:0.78,dx:-240});
    world.setState("grey",tBoard);
    // @form discrete_trail: a compact status card without any live position
    const phone=ctx.el("phone_card",{x:1380,y:260,w:430,h:560,kind:"card",exit:"none"});
    const trail=Loom.lesson.phone_card(ctx,phone.inner,{state:"trail"});
    phone.handle=trail;
    trail.setTrail(0,ctx.start,false);
    ctx.m.reveal(phone,tScan,{dur:ctx.style.dur("enter")});
    Loom.tween(phone.inner,{x:80},{x:0},tScan,{dur:ctx.style.dur("enter"),ease:"enter"});
    // @form station_pins: the same five named stations reappear on the grey map
    const pins=ctx.el("station_pins",{x:96,y:84,w:1728,h:846,kind:"instrument",exit:"none"});
    pins.handle=world.pins(tPins);
    // @form scan_marks: each stationary scan creates exactly one status record
    const scans=ctx.el("scan_marks",{x:96,y:84,w:1728,h:846,kind:"instrument",exit:"recede"});
    const points=[world.points.office,world.points.warehouseDoor,world.points.hubRoad,world.points.depot,world.points.doorstep];
    const step=ctx.style.dur("move")*0.68;
    points.forEach(function(p,i){
      const at=tScan+i*step;
      const r=B.route("scan_"+i,[[p[0]-0.32,p[1]-0.32,p[2]],[p[0]+0.32,p[1]-0.32,p[2]],[p[0]+0.32,p[1]+0.32,p[2]],[p[0]-0.32,p[1]+0.32,p[2]],[p[0]-0.32,p[1]-0.32,p[2]]],{tok:"accent",width:5,at:at,dur:ctx.style.dur("enter")*0.35});
      if(r.g) Loom.tl.set(r.g,{opacity:0},at+step);
      trail.addStatus(i+1,at);
    });
    scans.handle={points:points};
  }
});
