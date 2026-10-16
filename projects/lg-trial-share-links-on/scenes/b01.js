// @design reaching_beyond_group: an expected cluster gains an unexpected outsider
// Treatments: static cluster with accent signalling; travelling page; sequential hand-drawn recipients.
// Choose sequential drawing: the extra recipient arriving is the argument, without moving resting labels.
Loom.scene("b01", {
  build(ctx) {
    const W = ctx.engine, B = W.board(ctx, {marker:true}), kit = ctx.kit, m = ctx.m;
    const tPage = ctx.cue("budget link");
    const tTeam = ctx.cue("three teammates");
    const tStranger = ctx.cue("a stranger");
    const tRead = ctx.cue("reading it");
    // @form budget_document: the shared document persists on the board
    const page = ctx.el("page", {x:330,y:290,w:300,h:400,kind:"instrument",exit:"none"});
    page.handle = Loom.lesson.budget_page(ctx,page.inner,{w:300,h:400,name:"budget_doc",marker:true});
    page.handle.draw(tPage - ctx.style.dur("move"),{by:tTeam});
    // @form expected_recipients: three equal pictograms, drawn in sequence
    const team = ctx.el("team", {x:800,y:420,w:400,h:112,kind:"icon",exit:"none"});
    const iconDur = ctx.style.dur("draw") * 0.30;
    for(let i=0;i<3;i++) {
      const person = ctx.el("teammate_"+i,{x:i*144,y:0,w:112,h:112,kind:"icon",exit:"none",parent:team.inner});
      kit.icon(person.inner,"user",{x:56,y:56,size:112,stroke:24*3.6/112,color:"ink"});
      m.draw(person,tTeam+i*iconDur,{dur:iconDur});
    }
    // @form recipient_label: words follow the expected recipient group
    kit.fit("Three teammates",{role:"lead",w:400,h:64,maxLines:1});
    const teamLabel = ctx.el("team_label",{x:800,y:554,w:400,h:64,kind:"text",exit:"none"});
    const teamEnd = tTeam+3*iconDur;
    B.write(teamLabel,"Three teammates",{role:"lead",at:teamEnd,by:tStranger-ctx.style.dur("move"),pen:"ink",maxLines:1});
    // @form unexpected_recipient: a separate fourth holder outside the team
    const stranger = ctx.el("stranger_box",{x:1450,y:380,w:230,h:220,kind:"card",exit:"none"});
    const boxEnd = tStranger+ctx.style.dur("draw")*0.35;
    B.draw(stranger,W.rect(8,8,214,204),{at:tStranger,by:boxEnd,pen:"ink"});
    const outsider = ctx.el("outsider_user",{x:36,y:52,w:112,h:112,kind:"icon",exit:"none",parent:stranger.inner});
    kit.icon(outsider.inner,"user",{x:56,y:56,size:112,stroke:24*3.6/112,color:"ink"});
    m.draw(outsider,boxEnd,{dur:iconDur});
    // @form stranger_question: the only accent identifies the unexpected reader
    kit.fit("?",{role:"title",w:100,h:120,maxLines:1});
    const question = ctx.el("stranger_q",{x:1696,y:402,w:100,h:120,kind:"text",exit:"none"});
    const qEnd = tRead+ctx.style.dur("draw")*0.30;
    B.write(question,"?",{size:96,at:tRead,by:qEnd,pen:"accent",maxLines:1});
    // @form outsider_label: the question resolves into a named unknown
    kit.fit("A stranger?",{role:"lead",w:260,h:64,maxLines:1});
    const strangerLabel = ctx.el("stranger_label",{x:1435,y:622,w:260,h:64,kind:"text",exit:"none"});
    B.write(strangerLabel,"A stranger?",{role:"lead",at:qEnd,by:ctx.speechEnd,pen:"ink",maxLines:1});
  }
});
