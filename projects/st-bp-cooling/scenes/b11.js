// @design heat_handoff_detail: a cutaway makes the transfer between two moving streams visible
// Treatments: static cutaway with signalling; exploded cabinet; drafted cutaway with moving heat. Choose drafted cutaway because the crossing is the explanation.
Loom.scene("b11", {
  build(ctx) {
    const W = ctx.engine, D = ctx._coolingSheet = W.sheet(ctx);
    const a = ctx.cue("A coil of chilled water");
    const h = ctx.cue("takes the heat");
    const o = ctx.cue("goes back out cool");
    const dr = ctx.style.dur("draw"), mv = ctx.style.dur("move");
    // @form cabinet_section: the enlarged open cabinet establishes the air path
    const body = ctx.el("crah_cutaway", {x:520,y:180,w:640,h:640,kind:"instrument",exit:"recede"});
    D.part(body, {
      centre: W.centre(320,0,320,620),
      outline: [].concat(W.path([[0,0],[0,620],[640,620],[640,0]]),W.rect(0,0,20,620),W.rect(620,0,20,620)),
      detail: [].concat(W.line(20,60,620,60),W.line(20,600,620,600)),
      hatch: [].concat(W.hatch([[0,0],[20,0],[20,620],[0,620]],{spacing:16}),W.hatch([[620,0],[640,0],[640,620],[620,620]],{spacing:16})),
      paper:false
    }, {at:a,by:a+dr*0.4});
    // @form water_coil: a folded pipe is the one named cyan part
    const coil = ctx.el("coil", {x:420,y:350,w:840,h:240,kind:"instrument",exit:"recede"});
    D.draw(coil,[].concat(W.path([[0,0],[0,70],[220,70],[620,100],[220,130],[620,160],[220,190],[620,220],[820,220],[820,0]]),W.circle(0,0,10),W.circle(820,0,10)),{at:a+dr*0.4,by:a+dr*0.8,pen:"accent",parallel:true});
    // @form rotating_fan: one mechanical rotor drives the cabinet air
    const fan = ctx.el("fan", {x:760,y:620,w:180,h:180,kind:"instrument",exit:"iris"});
    D.mechanism(fan,[{pulley:[90,80,64],icon:"fan"}],{at:a+dr*0.8,by:a+dr,from:o,to:ctx.end,rps:0.35});
    // @form floor_section: cool air returns beneath the floor
    const floor = ctx.el("air_out", {x:320,y:800,w:1280,h:100,kind:"scenery",exit:"recede"});
    D.draw(floor,[].concat(W.line(0,0,1280,0),W.line(0,100,1280,100),W.hidden([[0,50],[1280,50]])),{at:a,by:a+dr*0.4,parallel:true});
    // @form detail_annotation: the enlarged view has a quiet drafting note
    const note = ctx.el("detail_note", {x:240,y:110,w:320,h:60,kind:"text",exit:"wipe"});
    D.letter(note,"DETAIL A",{size:28,role:"label",at:a,by:a+mv,quick:true});
    // @form coil_leader: the coil name stays clear of all moving routes
    const leader = ctx.el("coil_leader", {x:1040,y:550,w:580,h:150,kind:"connector",exit:"recede"});
    D.draw(leader,W.path([[0,20],[260,20],[260,90],[300,90]]),{at:h,by:h+mv,parallel:true,pen:"accent"});
    const label = ctx.el("label_coil", {x:1340,y:608,w:390,h:64,kind:"text",exit:"wipe"});
    D.letter(label,"chilled water coil",{role:"label",size:28,at:h,by:h+mv,quick:true,pen:"accent"});
    // @form heat_crossing: shared vocabulary shows air giving its heat to water
    const air = ctx.el("air_in", {x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const flows = Loom.lesson.flows(ctx,air.inner,{name:"detail_flows",demo:false,at:h});
    ctx.m.reveal(air,h,{dy:0,dur:mv});
    const inlet1=flows.warmAir([[760,260],[760,420]],{running:false,speed:140});
    const inlet2=flows.warmAir([[960,260],[960,435]],{running:false,speed:140});
    const transfer=flows.waterMarks([[1040,570],[1240,570],[1240,390]],{warm:true,running:false,speed:180});
    inlet1.start(h); inlet2.start(h); transfer.start(h+mv);
    const cool1=flows.airArrow([[740,595],[740,850],[1440,850]],{running:false,speed:160});
    const cool2=flows.airArrow([[980,600],[980,815]],{running:false,speed:160});
    cool1.start(o);cool2.start(o);
    [cool1,cool2].forEach(route=>{
      ctx.m.reveal(route.path,o,{dy:0,dur:mv});
      route.tokens.forEach(token=>{Loom.tl.set(token.life,{opacity:0},ctx.start);Loom.tl.set(token.life,{opacity:1},o);});
    });
    [inlet1,inlet2].forEach(route=>{
      ctx.m.reveal(route.path,h,{dy:0,dur:mv});
      route.tokens.forEach(token=>{Loom.tl.set(token.life,{opacity:0},ctx.start);Loom.tl.set(token.life,{opacity:1},h);});
    });
    ctx.m.reveal(transfer.path,h+mv,{dy:0,dur:mv});
    transfer.tokens.forEach(token=>{Loom.tl.set(token.life,{opacity:0},ctx.start);Loom.tl.set(token.life,{opacity:1},h+mv);});
  }
});
