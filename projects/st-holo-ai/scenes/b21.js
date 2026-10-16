// @design source_crosses_boundary: a sheet enters the working field and gains connections
// Treatments: static console and signal; sliding sheet with a window inset; camera tracking the sheet.
// Choose sliding sheet: crossing the boundary is the change, with a static inset confirming it.
Loom.scene("b21", {
  build(ctx) {
    const H = ctx.engine.hud(ctx,{name:"source_hud"});
    const boot = ctx.cue("So Priya");
    const paste = ctx.cue("pastes in the policy");
    const ask = ctx.cue("asks again");
    const real = ctx.cue("something real to work from");
    const x=510, y=H.vcenter(560);
    // @form returning_console: the opening chat returns unchanged in scale
    const E=ctx.el("chat_panel",{x:x,y:y,w:900,h:560,kind:"panel",exit:"none"});
    const C=Loom.lesson.chat_panel(ctx,E.inner,{state:"asked",question:"When are expense claims due?"});
    E.chatKit=C; E.handle=C;
    // @form named_sender: held semantic anchor for the kit anatomy
    const N=ctx.el("name_tag",{x:x+32,y:y+106,w:108,h:48,kind:"text",exit:"none"});
    N.handle=C; N.chatKit=C; N.part=C.nameTag;
    // @form returning_question: held semantic anchor for the kit question
    const Q=ctx.el("question_line",{x:x+32,y:y+163,w:822,h:55,kind:"text",exit:"none"});
    Q.handle=C; Q.chatKit=C; Q.part=C.question;
    H.power({E:E},"up",boot);
    C.question.attr({opacity:0});
    C.nameTag.attr({opacity:0});
    Loom.tween(C.nameTag.node,{attr:{opacity:0}},{attr:{opacity:1}},boot,{dur:ctx.style.dur("enter"),ease:"enter"});
    C.setState("typing",ask);
    C.setState("policy_attached",ask+ctx.style.dur("move"));
    Loom.tl.set(C.question.node,{attr:{opacity:1}},ask+ctx.style.dur("move"));
    // @form entering_source: readable source sheet crosses the input boundary
    const P=ctx.el("policy_doc",{x:160,y:337,w:300,h:400,kind:"panel",exit:"none"});
    P.handle=Loom.lesson.policy_doc(ctx,P.inner,{state:"pasting"});
    P.policyKit=P.handle;
    ctx.m.reveal(P,paste);
    ctx.m.travel(P,paste,{x:890,y:111,scale:1});
    P.handle.setState("inside",paste+ctx.style.dur("move"));
    // Attachment appears only after the sheet has landed and the request is complete.
    // @form working_window: a small diagram confirms the source is now in reach
    const I=ctx.el("window_inset",{x:1450,y:380,w:374,h:191,kind:"panel",exit:"recede"});
    const W=Loom.lesson.context_window(ctx,I.inner,{w:374,h:190.4,state:"empty"});
    I.handle=W;
    W.label.attr({opacity:0});
    Object.keys(W.labels).forEach(function(k){W.labels[k].attr({opacity:0});});
    W.setState("policy_inside",real);
    Loom.tl.set(W.label.node,{attr:{opacity:0}},real);
    ctx.m.reveal(I,real);
    // Scaled kit labels are replaced at the reading floor, on plates above the kit rules.
    W.bands.node.querySelectorAll('line').forEach(function(line){line.setAttribute('opacity',0);});
    const labels=[['context window',14,6,270],['question',14,40,190],['chat so far',14,78,190],['reply',14,116,190],['document',14,153,190]];
    labels.forEach(function(row){
      ctx.kit.fit(row[0],{role:"caption",w:row[3]-12,h:32,maxLines:1});
      ctx.kit.text(I.inner,row[0],{x:row[1],y:row[2],w:row[3]-12,h:32,role:"caption",size:22,maxLines:1,color:"muted"});
    });
    // @form reachable_source: weight arcs terminate inside the document band, not on a label
    const A=ctx.el("policy_weight_arcs",{x:1630,y:414,w:178,h:145,kind:"connector",exit:"recede"});
    const a=ctx.kit.path(A.inner,'M10,7 Q132,8 130,136 M35,48 Q155,50 130,136 M60,91 Q153,92 130,136',{fill:"none",stroke:ctx.c("accent"),sw:2});
    ctx.m.draw(a,real,{dur:ctx.style.dur("draw")});
  }
});
