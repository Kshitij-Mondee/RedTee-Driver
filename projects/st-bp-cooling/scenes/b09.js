// @design split_warming_routes: paired paths change temperature while crossing a shared boundary
Loom.scene("b09", {
  build(ctx) {
    /* Treatments considered: static split arrows with signalling; moving cross-boundary marks; camera following one mark. Choose moving marks because the boundary crossing is the mechanism. */
    const front = ctx.cue("pull it in at the front");
    const warm = ctx.cue("blow it out warm");
    const hot = ctx.cue("the hot aisle");
    const m = ctx.m;
    const W = ctx.engine;
    const D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const hall = ctx.held("hall_section");
    ctx.held("crah_row");
    ctx.held("water_loop");
    ctx.held("roof_cooler");
    ctx.held("heat_chain");
    ctx.held("aisle_marks");
    const supply = ctx.held("air_supply");
    const cold = ctx.held("label_cold_aisle");
    // @form cross_boundary_flow: cool intake meets amber exhaust in each rack
    const through = ctx.el("air_through", {x:0,y:0,w:1920,h:960,kind:"connector",exit:"none"});
    const F = Loom.lesson.flows(ctx, through.inner, {name:"server_air",demo:false,at:ctx.start});
    through.handle = F;
    m.reveal(through, front, {dy:0,dur:ctx.style.dur("enter")});
    F.airArrow([[850,550],[760,550]], {speed:90});
    F.airArrow([[850,550],[940,550]], {speed:90});
    const exhaust = [
      F.colourChange([[760,550],[690,550],[620,550],[560,550]], {speed:90}),
      F.colourChange([[940,550],[1010,550],[1080,550],[1140,550]], {speed:90})
    ];
    exhaust.forEach(route => {
      m.reveal(route.path, warm, {dy:0,dur:ctx.style.dur("enter")});
      route.tokens.forEach(E => m.reveal(E, warm, {dy:0,dur:ctx.style.dur("enter")}));
      route.setWarm(warm);
    });
    // @form outer_aisle_note: the named outer region carries the single cyan accent
    const label = ctx.el("label_hot_aisle", {x:0,y:0,w:1920,h:960,kind:"text",exit:"none"});
    const words = ctx.el("hot_aisle_words", {x:1030,y:345,w:230,h:54,kind:"text",exit:"none",parent:label.inner});
    ctx.kit.fit("hot aisle", {role:"label",w:206,h:42,maxLines:1});
    D.letter(words,"hot aisle",{role:"label",size:24,align:"center",valign:"middle",at:hot,by:hot+ctx.style.dur("enter"),quick:true,pen:"accent"});
    const lead = ctx.el("hot_aisle_leader",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"none",parent:label.inner});
    D.draw(lead,W.path([[1140,399],[1140,520]]),{at:hot,by:hot+ctx.style.dur("move"),parallel:true,pen:"accent"});
    // The predecessor now uses full-sheet coordinates for the hall; keep the new routes aligned to it.
    if (cold) {
      cold.inner.querySelectorAll("path,line,polyline,rect,text").forEach(n => Loom.tl.set(n,{stroke:ctx.c("muted")},hot));
      Loom.tween(cold.inner,{opacity:1},{opacity:0.65,duration:ctx.style.dur("move")},hot);
    }
  }
});
