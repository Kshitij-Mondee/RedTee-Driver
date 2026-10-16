// @design holder_chain: two short hops explain how an outsider receives access
// Three treatments: static chain with signalling; key passed along; two marker arrow hops.
// Chosen: two marker hops, because the movement itself explains the cause.
Loom.scene("b02", {
  build(ctx, props) {
    const W = ctx.engine, B = W.board(ctx);
    const D = ctx.style.dur("draw");
    const tFigure = ctx.cue("How did it get there");
    const tFirst = ctx.cue("Nobody hacked anything");
    const tSecond = ctx.cue("simply travelled");
    const page = ctx.held("page");
    const team = ctx.held("team");
    const teamLabel = ctx.held("team_label");
    const stranger = ctx.held("stranger_box");
    const strangerLabel = ctx.held("stranger_label");
    // Keep the painted question untouched. Exit its old overlay before adding ink.
    const oldQuestion = ctx.held("stranger_q");
    ctx.m.exit(oldQuestion, ctx.start, "recede");

    // @form question_in_ink: the question remains while the travelling line becomes the emphasis
    const question = ctx.el("stranger_q_ink", {x:1660,y:390,w:100,h:130,kind:"mark",exit:"recede"});
    B.write(question,"?",{size:100,at:ctx.start+ctx.style.dur("exit"),by:tFigure+D*0.3,pen:"ink",maxLines:1});

    // @form onward_holder: one intermediate holder makes the causal chain visible
    const second = ctx.el("second_figure", {x:1180,y:600,w:112,h:112,kind:"icon",exit:"recede"});
    ctx.kit.icon(second.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
    ctx.m.draw(second,tFigure+D*0.35,{dur:D*0.4});

    // @form two_hop_forward: one bent marker line continues from holder to holder
    const arrow = ctx.el("forward_arrow",{x:1050,y:460,w:350,h:270,kind:"connector",exit:"recede"});
    B.draw(arrow,W.arrow(8,26,128,186,{bend:-24}),{at:tFirst,by:tFirst+D*0.65,pen:"accent",sound:true});
    B.draw(arrow,W.arrow(246,186,342,22,{bend:22}),{at:tSecond,by:tSecond+D*0.5,pen:"accent"});

    // @form travelled_caption: the causal reading is written beneath the route
    const words = ctx.el("travelled_words",{x:1040,y:750,w:590,h:76,kind:"text",exit:"wipe"});
    ctx.kit.fit("The link travelled",{role:"lead",w:570,h:64,maxLines:1});
    B.write(words,"The link travelled",{role:"lead",at:tSecond+D*0.5,by:ctx.speechEnd,pen:"ink",maxLines:1});
  }
});
