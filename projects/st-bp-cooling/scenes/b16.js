// @design heat_extraction_detail: a closed inner circuit carries warmth away from a returning stream
// Treatments: static cutaway with signalling; exploded machine; drafted cutaway with moving streams. Choose the drafted cutaway because transfer is the argument.
Loom.scene("b16", {
  build(ctx) {
    const W=ctx.engine, D=ctx._coolingSheet=W.sheet(ctx);
    const a=ctx.cue("the chiller pulls the heat out"), f=ctx.cue("like your fridge"), o=ctx.cue("sends the water back cold");
    const dr=ctx.style.dur("draw"), mv=ctx.style.dur("move");
    // @form cutaway_shell: the enlarged machine contains the heat exchange
    const shell=ctx.el("chiller_cutaway",{x:400,y:280,w:1080,h:540,kind:"instrument",exit:"recede"});
    D.part(shell,{centre:W.centre(540,0,540,540),outline:W.rect(0,0,1080,540),detail:[].concat(W.line(20,20,1060,20),W.line(20,520,1060,520)),hatch:W.hatch([[0,0],[20,0],[20,540],[0,540]],{spacing:16}),paper:false},{at:ctx.start,by:a+dr*0.6,pen:"accent"});
    // @form closed_refrigerant: connected pipes and a compressor establish a closed circuit
    const circuit=ctx.el("refrigerant_circuit",{x:840,y:380,w:520,h:360,kind:"instrument",exit:"recede"});
    D.draw(circuit,[].concat(W.path([[0,0],[360,0],[360,80]]),W.circle(360,120,40),W.path([[360,160],[360,360],[0,360],[0,0]]),W.path([[0,150],[40,170],[0,190],[40,210],[0,230],[40,250],[0,270]]),W.centreMark(360,120,50)),{at:a+dr*0.4,by:a+dr,parallel:true});
    // @form water_heat_exchanger: water gives up heat without joining the inner circuit
    const tube=ctx.el("water_exchange",{x:160,y:580,w:620,h:180,kind:"instrument",exit:"recede"});
    D.draw(tube,[].concat(W.path([[0,0],[540,0],[540,140],[0,140]]),W.path([[0,40],[500,40],[500,100],[0,100]])),{at:a+dr*0.4,by:a+dr,parallel:true});
    // @form detail_register: a quiet drawing note marks this as an enlarged view
    const note=ctx.el("detail_note",{x:240,y:120,w:360,h:60,kind:"text",exit:"wipe"});
    D.letter(note,"DETAIL C",{size:28,role:"label",at:ctx.start,by:ctx.start+mv,quick:true});
    const label=ctx.el("label_chiller",{x:800,y:850,w:360,h:60,kind:"text",exit:"wipe"});
    D.letter(label,"chiller",{size:28,role:"label",at:a+dr*0.6,by:a+dr,quick:true});
    // @form roof_route: the extracted heat has an onward destination
    const roof=ctx.el("heat_roof_route",{x:1080,y:180,w:320,h:200,kind:"connector",exit:"recede"});
    D.draw(roof,W.arrow(20,200,20,0),{at:a+dr,by:a+dr+mv,pen:"accent2",parallel:true});
    const roofLabel=ctx.el("label_to_roof",{x:1150,y:180,w:260,h:60,kind:"text",exit:"wipe"});
    D.letter(roofLabel,"to roof",{size:24,role:"label",at:a+dr,by:a+dr+mv,quick:true});
    // @form fridge_reminder: a small muted back coil recalls the earlier household mechanism
    const fridge=ctx.el("fridge_echo",{x:1560,y:440,w:180,h:320,kind:"instrument",exit:"recede"});
    D.draw(fridge,[].concat(W.rect(0,0,180,300),W.path([[30,30],[150,30],[150,70],[30,70],[30,110],[150,110],[150,150],[30,150],[30,190],[150,190],[150,230],[30,230]]),W.circle(90,270,20)),{at:f,by:f+dr,pen:"muted",parallel:true});
    // @form shared_flow_vocabulary: warm water enters, heat crosses and cold water returns
    const full=ctx.el("water_in",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const flows=Loom.lesson.flows(ctx,full.inner,{name:"chiller_flows",demo:false,at:a});
    ctx.m.reveal(full,a,{dy:0,dur:mv});
    const inlet=flows.waterMarks([[160,600],[680,600]],{warm:true,running:false,speed:180});
    const crossing=flows.warmAir([[720,620],[960,620]],{running:false,speed:110});
    const lift=flows.warmAir([[1100,380],[1100,190]],{running:false,speed:100});
    const outlet=flows.waterMarks([[680,700],[160,700]],{running:false,speed:180});
    const show=(route,t)=>{route.start(t);ctx.m.reveal(route.path,t,{dy:0,dur:mv});route.tokens.forEach(token=>{Loom.tl.set(token.life,{opacity:0},ctx.start);Loom.tl.set(token.life,{opacity:1},t);});};
    show(inlet,a+dr*0.6);show(crossing,a+dr);show(lift,a+dr+mv);show(outlet,o);
    // @form cold_return_direction: the outlet travels back toward the hall
    const out=ctx.el("water_out",{x:160,y:680,w:500,h:60,kind:"connector",exit:"recede"});
    D.draw(out,W.arrow(480,20,0,20),{at:o,by:o+mv,parallel:true});
  }
});
