// @design bounded_intake: a measured interval beside a receiving face
// Three treatments: static gauge with signalling; animated mercury; drafted dimension. Choose drafted dimension because the spoken bounds are the change.
Loom.scene("b13", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);
    const a = ctx.cue("ASHRAE recommends inlet air");
    const b = ctx.cue("between 18 and 27");
    const c = ctx.cue("degrees Celsius");
    // @form detail_frame: the enlarged drawing has its own quiet register
    const frame = ctx.el("detail_frame", {x:160,y:160,w:1600,h:720,kind:"scenery",exit:"recede"});
    D.draw(frame, W.rect(0,0,1600,720), {at:ctx.start,by:a+0.3,parallel:true});
    const note = ctx.el("detail_note", {x:200,y:190,w:500,h:50,kind:"text",exit:"wipe"});
    D.letter(note,"DETAIL B",{size:28,at:ctx.start,by:a+0.5,quick:true});
    // @form intake_face: slots and grille locate the measured air at the server front
    const server = ctx.el("server_front", {x:280,y:320,w:720,h:360,kind:"instrument",exit:"recede"});
    const slots = [];
    for(let i=0;i<3;i++) slots.push(...W.roundRect(32,32+i*94,256,68,4));
    const grille = [];
    for(let i=0;i<12;i++) grille.push(...W.line(340+i*26,38,340+i*26,316,{weight:"detail"}));
    D.part(server,{outline:W.roundRect(0,0,720,360,4),detail:[].concat(slots,grille,W.circle(36,338,5),W.circle(684,338,5))},{at:a,by:a+1.2});
    // @form thermometer_scale: an unnumbered scale until the bounds are named
    const therm = ctx.el("thermometer",{x:1100,y:280,w:120,h:440,kind:"instrument",exit:"recede"});
    const ticks=[];
    for(let i=0;i<13;i++) ticks.push(...W.line(68,40+i*26,92,40+i*26,{weight:"thin"}));
    D.part(therm,{outline:[].concat(W.roundRect(22,0,32,360,16),W.circle(38,390,32)),detail:ticks},{at:a+1.2,by:a+1.9});
    const inlet=ctx.el("label_inlet",{x:600,y:704,w:360,h:52,kind:"text",exit:"wipe"});
    D.letter(inlet,"inlet air",{size:28,at:a+1.9,by:b-0.12});
    // @form offset_interval: the dimension sits clear of the scale, not over its ticks
    const band=ctx.el("band_dim",{x:1192,y:300,w:420,h:380,kind:"value",exit:"wipe"});
    D.draw(band,[].concat(W.line(0,72,158,72,{weight:"thin"}),W.line(0,306,158,306,{weight:"thin"}),W.line(144,72,144,306,{weight:"thin"}),W.path([[138,88],[144,72],[150,88]],{weight:"thin"}),W.path([[138,290],[144,306],[150,290]],{weight:"thin"})),{at:b,by:b+0.85});
    const upper=ctx.el("band_upper",{x:1390,y:344,w:100,h:56,kind:"value",exit:"wipe"});
    D.letter(upper,"27",{size:28,pen:"accent2",at:b+0.85,by:b+1.1});
    const lower=ctx.el("band_lower",{x:1390,y:578,w:100,h:56,kind:"value",exit:"wipe"});
    D.letter(lower,"18",{size:28,pen:"accent2",at:b+1.1,by:b+1.35});
    const rec=ctx.el("recommended_note",{x:760,y:792,w:920,h:56,kind:"text",exit:"wipe"});
    D.letter(rec,"18 to 27 °C recommended",{size:28,pen:"accent2",at:c,by:ctx.speechEnd-0.65,quick:true});
  }
});
