// @design ascending_release: a closed route climbs to an open endpoint and disperses.
Loom.scene("b17", {
  build(ctx) {
    // Treatments: static sheet with one highlight; tracked riser; full sheet with travelling marks.
    // Choose the full sheet: the climb and release carry the explanation without cropping labels.
    const tOutside = ctx.cue("Third link: outside");
    const tRoof = ctx.cue("A cooling tower or dry cooler");
    const tRelease = ctx.cue("releases the heat into the air");
    const W = ctx.engine;
    const D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const make = (name, kind) => ctx.el(name, {x:0,y:0,w:1920,h:960,kind:kind || "scenery",exit:"none"});
    // @form established_section: the whole system remains the spatial reference.
    const hallE = make("hall_section");
    const hall = Loom.lesson.hall_section(ctx, hallE.inner, {name:"b17_hall",drafted:true,state:"contained",at:ctx.start});
    hallE.handle = hall;
    // @form containment_outline: the aisle enclosure persists as a distinct held layer.
    const containment = make("containment");
    containment.inner.appendChild(hall.containment.outer);
    containment.handle = {root:containment};
    // @form air_handler_row: already running cabinets retain their shared geometry.
    const crahE = make("crah_row");
    crahE.handle = Loom.lesson.crah_row(ctx, crahE.inner, {name:"b17_crah",drafted:true,at:ctx.start});
    // @form closed_loop: cool supply and warm return keep travelling through the plant.
    const waterE = make("water_loop");
    const water = Loom.lesson.water_loop(ctx, waterE.inner, {name:"b17_water",drafted:true,at:ctx.start});
    waterE.handle = water;
    const waterFlow = Loom.lesson.flows(ctx, waterE.inner, {name:"b17_water_marks",demo:false,at:ctx.start});
    waterFlow.waterMarks(water.anchors.supply,{speed:90});
    waterFlow.waterMarks(water.anchors.returnPipe,{warm:true,speed:90});
    // @form outdoor_endpoint: the roof unit is the sole named cyan part.
    const roofE = make("roof_cooler");
    const roof = Loom.lesson.roof_cooler(ctx, roofE.inner, {name:"b17_roof",drafted:true,state:"idle",at:ctx.start});
    roofE.handle = roof;
    roof.highlight(tRoof,ctx.end);
    roof.setState("running",tRelease);
    // @form linked_route: the fourth existing link signals the destination first.
    const chainE = make("heat_chain");
    const chain = Loom.lesson.heat_chain(ctx, chainE.inner, {name:"b17_chain",drafted:true,at:ctx.start});
    chainE.handle = chain;
    chain.setState("lit",ctx.start);
    chain.highlight(3,tOutside,tRoof-ctx.style.dur("exit"));
    // @form ascending_heat: amber marks climb the existing riser, not a new pipe.
    const riserE = make("riser_flow","connector");
    const riser = Loom.lesson.flows(ctx, riserE.inner, {name:"b17_riser",demo:false,at:ctx.start});
    riserE.handle = riser;
    const rise = riser.warmAir(water.anchors.riser,{running:false,speed:180});
    rise.start(tRelease);
    // @form open_release: the kit's heat drawing is retained under its contractual name.
    const sky = make("heat_to_sky","mark");
    sky.inner.appendChild(roof.heat.outer);
    sky.handle = {root:sky,setState:(s,t)=>roof.setState(s,t)};
    // @form leader_note: use the kit's measured label, with a leader landing on the roof body.
    const label = make("label_roof","label");
    label.inner.appendChild(roof.nodes.roofLabel.outer);
    D.draw(label,W.path([[1480,305],[1480,290],[1440,240]],{weight:"thin"}),{at:tRoof,by:tRoof+ctx.style.dur("move"),parallel:true,pen:"accent"});
    ctx.m.reveal(label,tRoof,{dy:0,dur:ctx.style.dur("enter")});
    label.handle = {root:label};
  }
});
