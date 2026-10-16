// @design whole_chain_return: a familiar outline expands into one connected route to the open air
Loom.scene("b06", {
  build(ctx) {
    // Treatments considered: static whole section with signalling; sequential part zooms;
    // chosen: whole sheet drafted around a returning scaffold, then a single moving route.
    const m = ctx.m;
    const tSame = ctx.cue("does the same");
    const tScale = ctx.cue("at building scale");
    const tOutside = ctx.cue("carried outside");
    const sheetBox = {x:0,y:0,w:1920,h:960,kind:"scenery",exit:"none"};
    // @form returning_scaffold: the hall is the reference for the added services
    const hall = ctx.el("hall_section", sheetBox);
    hall.handle = Loom.lesson.hall_section(ctx,hall.inner,{name:"hall_drawing",drafted:true,state:"running",at:ctx.start});
    // @form chain_foot: four quiet links remain as the route's index
    const chain = ctx.el("heat_chain", sheetBox);
    chain.handle = Loom.lesson.heat_chain(ctx,chain.inner,{name:"chain_drawing",drafted:true,seven:false,at:ctx.start});
    chain.handle.setState("outlined",ctx.start);
    // @form service_row: new cabinets draft into the same coordinates as the hall
    const crah = ctx.el("crah_row",sheetBox);
    crah.handle = Loom.lesson.crah_row(ctx,crah.inner,{name:"crah_drawing",drafted:false,at:tSame});
    m.reveal(crah,tSame,{dy:0,dur:ctx.style.dur("enter")});
    // @form plant_connections: pipes link the cabinet coils to the plant
    const water = ctx.el("water_loop",sheetBox);
    water.handle = Loom.lesson.water_loop(ctx,water.inner,{name:"water_drawing",drafted:false,at:tSame+ctx.style.dur("stagger")});
    m.reveal(water,tSame+ctx.style.dur("stagger"),{dy:0,dur:ctx.style.dur("enter")});
    // @form roof_destination: the outdoor unit completes the building
    const roof = ctx.el("roof_cooler",sheetBox);
    roof.handle = Loom.lesson.roof_cooler(ctx,roof.inner,{name:"roof_drawing",drafted:false,state:"idle",at:tSame+ctx.style.dur("stagger")*2});
    m.reveal(roof,tSame+ctx.style.dur("stagger")*2,{dy:0,dur:ctx.style.dur("enter")});
    // @form moving_route: amber follows the heat from the room through coils and pipes
    const route = ctx.el("heat_path_long",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"recede"});
    const flow = Loom.lesson.flows(ctx,route.inner,{name:"long_heat_drawing",demo:false,drafted:false,at:tScale});
    route.handle = flow;
    const A = hall.handle.anchors;
    const points = [[1140,550],...A.ceilingReturn,[190,520],[240,560],...A.returnPipe,[1740,500],...A.riser.slice(1),[1580,240],A.roofTop];
    const heat = flow.warmAir(points,{running:false,speed:250});
    heat.start(tScale);
    m.reveal(route,tScale,{dy:0,dur:ctx.style.dur("enter")});
    heat.stop(ctx.speechEnd-ctx.style.dur("exit"));
    Loom.tween(route.inner,{opacity:1},{opacity:0,duration:ctx.style.dur("exit")},ctx.speechEnd-ctx.style.dur("exit"),{kind:"exit",beat:ctx.beat.id,name:"heat_path_long"});
    Loom.tl.set(route.inner,{visibility:"hidden"},ctx.speechEnd);
    // @form outside_leader: the note ends on the actual roof cooler
    const outside = ctx.el("label_outside",{x:1040,y:110,w:550,h:130,kind:"label",exit:"wipe"});
    const W = ctx.engine, D = ctx._coolingSheet;
    D.leader(outside,[[285,60],[350,60],[500,100]],{at:tOutside,by:tOutside+ctx.style.dur("move"),quick:true});
    const note = ctx.el("outside_words",{x:0,y:30,w:280,h:46,parent:outside.inner,kind:"text",exit:"none"});
    ctx.kit.fit("carried outside",{role:"label",w:280,h:46,maxLines:1});
    D.letter(note,"carried outside",{role:"label",size:24,at:tOutside,by:tOutside+ctx.style.dur("enter"),quick:true});
    m.reveal(outside,tOutside,{dy:0,dur:ctx.style.dur("enter")});
  }
});
