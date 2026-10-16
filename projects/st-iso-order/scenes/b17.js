// @design load_matches_path: sequential units enter a vehicle and their chips recur along the destination path
// Treatments: static route with signalled load; a split load and street diagram; chosen retained-board glide with sequential loading, because order is spatial and temporal.
Loom.scene("b17", {
  build(ctx) {
    const board=ctx.held("board"), world=board.handle, B=world.B;
    const depot=ctx.cue("local depot"), load=ctx.cue("vans load"), order=ctx.cue("route order");
    world.setState("day",depot);
    world.frame("depot",depot,{zoom:3,dur:ctx.style.dur("move")*3,fly:true});
    // @form load_sequence: the existing teal van receives amber parcels one by one
    const boxes=ctx.el("van_boxes",{x:96,y:84,w:1728,h:846,kind:"token",exit:"recede"});
    const parcels=[];
    for(let i=0;i<3;i++){
      const t=load+i*ctx.style.dur("move");
      const p=B.put("crate",{name:"route_parcel_"+i,x:18.9,y:5.55,z:0.15,s:0.52,h:0.52,tok:"accent4",role:"parcels",at:t,enter:"drop"});
      // Stop chips are dot patterns, not an invented delivery count or timing.
      B.pin(p,["•","••","•••"][i],{at:t,until:t+ctx.style.dur("enter")/2+ctx.style.dur("move"),tok:"accent4",side:"up-left"});
      p.move(t+ctx.style.dur("enter")/2,{by:[0,-0.55,0],dur:ctx.style.dur("move")});
      p.exit(t+ctx.style.dur("enter")/2+ctx.style.dur("move"),{kind:"sink"});
      parcels.push(p);
    }
    boxes.handle={parcels:parcels,van:world.vans[0]};
    // @form matching_stops: the same chip patterns recur at the three house approaches
    ctx.kit.fit("route order",{role:"lead",w:342,h:48,maxLines:1});
    const route=ctx.el("route",{x:1380,y:150,w:390,h:96,kind:"connector",exit:"none"});
    const routeNote=Loom.treat.panel(ctx,"route_order",{x:1380,y:150,w:390,h:96,fill:"surface",tone:"line",t:order});
    routeNote.exit="recede";
    ctx.kit.text(routeNote.inner,"route order",{x:24,y:24,w:342,h:48,role:"lead",color:"ink",maxLines:1});
    ctx.m.exit(routeNote,ctx.speechEnd,"recede");
    const path=B.route("local_delivery_order",[[19.7,5.7],[22.8,5.7],[22.8,3.3],[25.65,3.3]],{tok:"accent3",width:5,dash:true,at:order,dur:ctx.style.dur("draw")});
    const stops=[];
    for(let i=0;i<3;i++){
      const x=23.45+i*1.1;
      const stop=B.put("cylinder",{name:"stop_chip_"+i,x:x,y:3.3,z:0.03,r:0.17,h:0.04,tok:"surface",at:order+i*ctx.style.dur("stagger"),enter:"rise"});
      B.pin(stop,["•","••","•••"][i],{at:order+i*ctx.style.dur("stagger"),tok:"accent3",side:"up-right"});
      stops.push(stop);
    }
    route.handle={path:path,stops:stops,van:world.vans[0],world:world};
  }
});
