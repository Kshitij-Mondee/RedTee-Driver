// @design counted_reserve: a stopped member stays visible while a counted reserve explains the remaining capacity
Loom.scene("b19", {
  build(ctx) {
    // Treatments: static full sheet with signalling; a close crop on the cabinets;
    // chosen: full sheet with local failure and count, preserving all system labels.
    const W = ctx.engine, D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const m = ctx.m;
    const fail = ctx.cue("say one air handler fails");
    const count = ctx.cue("This hall is N plus one");
    const spare = ctx.cue("plus one spare");
    const hall = ctx.held("hall_section");
    const crah = ctx.held("crah_row");
    const water = ctx.held("water_loop");
    const roof = ctx.held("roof_cooler");
    const chain = ctx.held("heat_chain");
    ctx.held("containment");
    // @form dim_air: the quiet flow belongs to the darker failure chapter
    const air = ctx.el("air_dim", {x:0,y:0,w:1920,h:960,kind:"connector",exit:"none"});
    air.handle = Loom.lesson.flows(ctx,air.inner,{name:"failure_air",demo:false,drafted:true,at:ctx.start});
    const first = air.handle.airArrow([[190,710],[190,735],[740,735]],{speed:80});
    air.handle.airArrow([[310,710],[310,750],[730,750]],{speed:80});
    Loom.tl.set(air.inner,{opacity:0.18},ctx.start);
    first.stop(fail);
    crah.handle.setUnit(1,"failed",fail);
    crah.handle.bracket(count);
    // @form failure_note: a coral leader makes the stopped cabinet unambiguous
    const mark = ctx.el("fail_mark",{x:130,y:350,w:170,h:90,kind:"label",exit:"none"});
    D.draw(mark,W.path([[60,48],[60,70]]),{at:fail,by:fail+ctx.style.dur("move"),pen:"accent3",parallel:true});
    const failedWords = ctx.el("failure_words",{x:8,y:0,w:154,h:40,parent:mark.inner,kind:"text",exit:"none"});
    ctx.kit.fit("fails",{role:"label",w:154,h:40,maxLines:1});
    D.letter(failedWords,"fails",{role:"label",size:30,align:"center",valign:"middle",at:fail,by:fail+ctx.style.dur("enter"),quick:true,pen:"accent3"});
    m.reveal(mark,fail,{dy:0,dur:ctx.style.dur("enter")});
    // @form reserve_count: one cyan count is the sole focal accent
    const title = ctx.el("label_n1",{x:140,y:160,w:340,h:90,kind:"label",exit:"none"});
    D.draw(title,W.path([[0,72],[340,72]]),{at:count,by:count+ctx.style.dur("move"),pen:"accent",parallel:true});
    const countWords = ctx.el("n1_words",{x:18,y:8,w:304,h:52,parent:title.inner,kind:"text",exit:"none"});
    ctx.kit.fit("N + 1",{role:"lead",w:304,h:52,maxLines:1});
    D.letter(countWords,"N + 1",{role:"lead",size:40,align:"center",valign:"middle",at:count,by:count+ctx.style.dur("enter"),quick:true,pen:"accent"});
    m.reveal(title,count,{dy:0,dur:ctx.style.dur("enter")});
    // @form reserve_leader: the additional unit is identified without covering its name
    const bracket = ctx.el("spare_bracket",{x:330,y:350,w:200,h:90,kind:"label",exit:"none"});
    bracket.handle = crah.handle;
    D.draw(bracket,W.path([[100,48],[100,70]]),{at:spare,by:spare+ctx.style.dur("move"),pen:"accent",parallel:true});
    const spareWords = ctx.el("one_spare_words",{x:8,y:0,w:184,h:40,parent:bracket.inner,kind:"text",exit:"none"});
    ctx.kit.fit("one spare",{role:"label",w:184,h:40,maxLines:1});
    D.letter(spareWords,"one spare",{role:"label",size:24,align:"center",valign:"middle",at:spare,by:spare+ctx.style.dur("enter"),quick:true,pen:"ink"});
    m.reveal(bracket,spare,{dy:0,dur:ctx.style.dur("enter")});
  }
});
