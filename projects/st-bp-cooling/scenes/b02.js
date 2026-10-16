// @design simultaneous_conversion: parallel inputs become rising output across a held structure
Loom.scene("b02", {
  build(ctx) {
    /* Treatments: static paired leaders; sequential rack pulses; simultaneous rising marks.
       Choose simultaneous marks because the claim applies everywhere at once. */
    const W = ctx.engine, D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const hall = ctx.held("hall_section");
    ctx.held("title_note");
    const powerAt = ctx.cue("turns its power");
    const heatAt = ctx.cue("into heat");
    const steadyAt = ctx.cue("all the time");
    // @form parallel_feeds: connectors terminate at both rack bases
    const power = ctx.el("power_lines", {x:660,y:720,w:380,h:140,kind:"connector",exit:"none"});
    D.draw(power, [].concat(
      W.path([[190,140],[30,140],[30,18]]), W.arrow(30,18,30,0),
      W.path([[190,140],[350,140],[350,18]]), W.arrow(350,18,350,0)
    ), {at:powerAt,by:heatAt,pen:"accent",parallel:true});
    // @form input_note: leader kept clear of the floor structure
    ctx.kit.fit("power in", {role:"label",w:180,h:48,maxLines:1});
    Loom.treat.label(ctx,"label_power",{as:"pill",x:360,y:846,text:"power in",to:[690,828],tone:"muted",role:"label",t:powerAt + ctx.style.dur("move")});
    // @form simultaneous_output: identical heat marks above each rack
    const heat = ctx.el("heat_marks",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"none"});
    const flow = Loom.lesson.flows(ctx,heat.inner,{name:"rack_heat",demo:false,drafted:true});
    heat.handle = flow;
    flow.heatMarks([632,330,116,75],{running:false,speed:60}).start(heatAt);
    flow.heatMarks([952,330,116,75],{running:false,speed:60}).start(heatAt);
    ctx.m.reveal(heat,heatAt,{dy:0,dur:ctx.style.dur("enter")});
    hall.handle.setState("running",heatAt);
    // @form output_note: neutral words identify the amber heat vocabulary
    ctx.kit.fit("heat out", {role:"label",w:180,h:48,maxLines:1});
    Loom.treat.label(ctx,"label_heat",{as:"pill",x:1440,y:350,text:"heat out",to:[1050,375],tone:"muted",role:"label",t:heatAt + ctx.style.dur("move")});
    // Motion is steady through the final cue, without a second emphasis.
    flow.setState("running",steadyAt);
  }
});
