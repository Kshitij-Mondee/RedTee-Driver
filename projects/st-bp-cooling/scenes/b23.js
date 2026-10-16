// @design silent_failure_question: a failed member is held beside an unanswered prompt
Loom.scene("b23", {
  build(ctx) {
    // Treatments: static full sheet with signalling; a close crop on pumps;
    // a separate question sheet. Choose the static full sheet for a quiet pause.
    const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx));
    const turn=ctx.cue("Your turn");
    const stop=ctx.cue("one pump stops");
    const ask=ctx.cue("What happens next");
    const hall=ctx.held("hall_section");
    const crah=ctx.held("crah_row");
    const water=ctx.held("water_loop");
    const roof=ctx.held("roof_cooler");
    ctx.held("heat_chain");
    ctx.held("containment");
    hall.handle.setState("contained",ctx.start);
    crah.handle.setUnit(1,"running",ctx.start);
    crah.handle.setUnit(2,"running",ctx.start);
    crah.handle.setUnit(3,"standby",ctx.start);
    // Freeze the rotors without changing the running cabinet outlines.
    crah.handle.units.forEach(u=>u.fan.setState("still",turn));
    water.handle.setPump("b","standby",ctx.start);
    water.handle.pumps[0].fan.setState("still",turn);
    water.handle.setPump("a","stopped",stop);
    roof.handle.setState("idle",ctx.start);
    // @form stopped_condition: the stopped member and its condition remain for the answer
    const condition=ctx.el("pump_stop",{x:600,y:110,w:680,h:54,kind:"text",exit:"none"});
    ctx.kit.fit("one pump stops.",{role:"lead",w:648,h:46,maxLines:1});
    D.letter(condition,"one pump stops.",{role:"lead",size:32,at:stop,by:stop+ctx.style.dur("enter"),quick:true,pen:"ink"});
    ctx.m.reveal(condition,stop,{dy:0,dur:ctx.style.dur("enter")});
    // @form unanswered_prompt: a still question occupies clear paper above the system
    const question=ctx.el("question",{x:600,y:182,w:680,h:54,kind:"text",exit:"none"});
    ctx.kit.fit("what happens next?",{role:"lead",w:648,h:46,maxLines:1});
    D.letter(question,"what happens next?",{role:"lead",size:32,at:ask,by:ask+ctx.style.dur("enter"),quick:true,pen:"ink"});
    ctx.m.reveal(question,ask,{dy:0,dur:ctx.style.dur("enter")});
  }
});
