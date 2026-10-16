// @design return_over_edge: a rising route closes back into its source
Loom.scene("b10", {
  build(ctx) {
    /* Treatments: static loop with a named terminal; moving return along the roof;
       close-up on a single cabinet. Choose moving return: travel closes the loop. */
    const W = ctx.engine;
    const D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const returns = ctx.cue("warm air returns");
    const named = ctx.cue("called computer room air handlers");
    const hall = ctx.held("hall_section");
    const crah = ctx.held("crah_row");
    const water = ctx.held("water_loop");
    const roof = ctx.held("roof_cooler");
    const chain = ctx.held("heat_chain");
    const supply = ctx.held("air_supply");
    const through = ctx.held("air_through");
    const cold = ctx.held("label_cold_aisle");
    const hot = ctx.held("label_hot_aisle");
    // Ease back to the left edge without cropping held cabinet and plant labels.
    [hall,crah,water,roof,chain,supply,through,cold,hot].forEach(E => {
      if (E) Loom.cam.frame(E, {x:0,y:0,w:1920,h:1080}, ctx.start, ctx.style.dur("move"), {margin:0});
    });
    if (hot) Loom.tween(hot.inner,{opacity:1},{opacity:0.65,duration:ctx.style.dur("move")},ctx.start);

    // @form closed_air_loop: the return runs across the ceiling into the cabinet top
    const air = ctx.el("air_return", {x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const flow = Loom.lesson.flows(ctx, air.inner, {name:"b10_return",at:ctx.start,demo:false});
    air.handle = flow;
    flow.warmAir([[1140,550],[1140,400],[1140,300],[190,300],[190,420]], {running:false,speed:150}).start(returns);
    flow.warmAir([[560,550],[560,300]], {running:false,speed:100}).start(returns);

    // Refresh the running vocabulary on this beat's clock, the held geometry stays in place.
    if (supply && supply.handle && supply.handle.setState) supply.handle.setState("stopped", ctx.start);
    if (through && through.handle && through.handle.setState) through.handle.setState("stopped", ctx.start);
    flow.airArrow(flow.anchors.floorPlenum, {running:true,speed:90});
    flow.colourChange([[850,550],[760,550],[620,550],[560,550]], {running:true,speed:90}).setWarm(ctx.start);
    flow.colourChange([[850,550],[940,550],[1080,550],[1140,550]], {running:true,speed:90}).setWarm(ctx.start);
    if (crah && crah.handle) crah.handle.highlight(1, named, ctx.end - ctx.style.dur("exit"));

    // @form cabinet_name: an annotation clear of the cabinet's own identifier
    ctx.kit.fit("computer room air handler", {role:"label",w:480,h:44,maxLines:1});
    const label = ctx.el("label_crah", {x:280,y:120,w:520,h:120,kind:"text",exit:"wipe"});
    D.letter(label, "CRAH", {size:28,role:"label",at:named,by:named+ctx.style.dur("enter"),quick:true,pen:"accent"});
    const expansion = ctx.el("label_crah_expansion", {x:280,y:172,w:520,h:44,kind:"text",exit:"wipe"});
    D.letter(expansion, "computer room air handler", {size:24,role:"label",at:named,by:named+ctx.style.dur("enter"),quick:true,pen:"ink"});
    const leader = ctx.el("label_crah_leader", {x:190,y:220,w:100,h:210,kind:"connector",exit:"recede"});
    D.draw(leader, W.path([[90,0],[0,0],[0,200]]), {at:named,by:named+ctx.style.dur("enter"),parallel:true,pen:"accent"});
  }
});
