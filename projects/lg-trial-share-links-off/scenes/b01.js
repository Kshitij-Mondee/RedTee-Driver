// @design outsider_after_trio: a small familiar group gains an unexpected reader
// Three treatments: static signalling beside a trio; a travelling key; sequential marker figures.
// Chosen: sequential marker figures, because the later fourth arrival is the argument.
Loom.scene("b01", {
  build(ctx, props) {
    const W = ctx.engine, B = W.board(ctx);
    const D = ctx.style.dur("draw");
    const tp = ctx.cue("budget link") - D * 0.35;
    const tt = ctx.cue("three teammates");
    const ts = ctx.cue("a stranger") - D * 0.3;
    const tq = ctx.cue("reading it");

    // @form folded_page: the shared draft
    const page = ctx.el("page", {x:300,y:290,w:300,h:400,kind:"card",exit:"none"});
    page.handle = Loom.lesson.budget_page(ctx,page.inner,{w:300,h:400,name:"hook_budget",marker:true});
    page.handle.draw(tp,{by:tt});

    // @form recipient_trio: three equal intended readers
    const team = ctx.el("team", {x:730,y:405,w:340,h:120,kind:"icon",exit:"none"});
    for(let i=0;i<3;i++) {
      const u = ctx.el("teammate_"+i,{x:i*112,y:0,w:112,h:112,kind:"icon",exit:"none",parent:team.inner});
      ctx.kit.icon(u.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
      ctx.m.draw(u,tt+i*D*0.3,{dur:D*0.3});
    }
    const teamLabel = ctx.el("team_label",{x:730,y:550,w:350,h:64,kind:"text",exit:"none"});
    ctx.kit.fit("Three teammates",{role:"lead",w:330,h:60,maxLines:1});
    B.write(teamLabel,"Three teammates",{role:"lead",at:tt+D*0.9,by:ts,pen:"ink",maxLines:1});

    // @form outsider_frame: one further reader, separated from the intended group
    const stranger = ctx.el("stranger_box",{x:1400,y:350,w:240,h:240,kind:"card",exit:"none"});
    B.draw(stranger,W.rect(8,8,224,224),{at:ts,by:ts+D*0.48,pen:"ink"});
    const outsider = ctx.el("stranger_user",{x:64,y:64,w:112,h:112,kind:"icon",exit:"none",parent:stranger.inner});
    ctx.kit.icon(outsider.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
    ctx.m.draw(outsider,ts+D*0.48,{dur:D*0.3});

    // @form outsider_question: the only coloured mark raises the hook
    const question = ctx.el("stranger_q",{x:1660,y:390,w:100,h:130,kind:"mark",exit:"none"});
    B.write(question,"?",{size:100,at:tq,by:tq+D*0.28,pen:"accent",maxLines:1});
    const strangerLabel = ctx.el("stranger_label",{x:1400,y:610,w:270,h:64,kind:"text",exit:"none"});
    ctx.kit.fit("A stranger?",{role:"lead",w:250,h:60,maxLines:1});
    B.write(strangerLabel,"A stranger?",{role:"lead",at:tq+D*0.28,by:ctx.speechEnd,pen:"ink",maxLines:1});
  }
});
