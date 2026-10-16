// @design holder_chain: a path drawn in two hops explains an unexpected arrival
Loom.scene("b02", {
  build(ctx) {
    // Treatments: static signalling on the finished chain; a moving token; a two-hop drawn path.
    // Choose the drawn path: the sequence of holders is the causal explanation.
    const W = ctx.engine, B = W.board(ctx, {marker:true});
    const kit = ctx.kit, m = ctx.m, D = ctx.style.dur("draw");
    const page = ctx.held("page");
    const team = ctx.held("team");
    const teamLabel = ctx.held("team_label");
    const stranger = ctx.held("stranger_box");
    const strangerLabel = ctx.held("stranger_label");
    const q = ctx.held("stranger_q");
    // Replace the independent emphasis overlay, never recolour held strokes.
    if(q) m.exit(q, ctx.start, "recede");
    // @form question_restatement: the unknown reader is now secondary to the route
    const qi = ctx.el("stranger_q_ink", {x:1696,y:402,w:100,h:120,kind:"text",exit:"wipe"});
    B.write(qi, "?", {size:96,pen:"ink",at:ctx.start+ctx.style.dur("exit"),by:ctx.start+ctx.style.dur("exit")+D*0.3});
    const tFigure = ctx.cue("How did it get there");
    const tFirst = ctx.cue("Nobody hacked anything");
    const tSecond = ctx.cue("The link"); // Lead the last clause so the written confirmation has a reading hold.
    // @form intermediate_holder: another ordinary holder between sender and reader
    const person = ctx.el("second_figure", {x:1252,y:640,w:112,h:112,kind:"icon",exit:"recede"});
    kit.icon(person.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
    m.draw(person,tFigure,{dur:D*0.6});
    // Hand-arrow recipe 11d, expressed as engine strokes with an open head.
    const arrow = (x1,y1,x2,y2,bend) => {
      const L = Math.hypot(x2-x1,y2-y1), cx=(x1+x2)/2-(y2-y1)/L*bend, cy=(y1+y2)/2+(x2-x1)/L*bend;
      const a = Math.atan2(y2-cy,x2-cx), h=22;
      const ps=[];
      for(let i=0;i<=20;i++) {const u=i/20,v=1-u;ps.push([v*v*x1+2*v*u*cx+u*u*x2,v*v*y1+2*v*u*cy+u*u*y2]);}
      return W.path(ps).concat(W.path([[x2-h*Math.cos(a-0.5),y2-h*Math.sin(a-0.5)],[x2,y2],[x2-h*Math.cos(a+0.5),y2-h*Math.sin(a+0.5)]]));
    };
    // @form travelling_path: one accent route, revealed holder to holder
    const forward = ctx.el("forward_arrow", {x:1190,y:460,w:260,h:250,kind:"connector",exit:"recede"});
    const hop1 = ctx.el("forward_hop_one", {x:0,y:0,w:160,h:190,kind:"connector",exit:"recede",parent:forward.inner});
    B.draw(hop1,arrow(14,20,105,168,-28),{at:tFirst,by:tFirst+D*0.7,pen:"accent"});
    const hop2 = ctx.el("forward_hop_two", {x:160,y:20,w:100,h:230,kind:"connector",exit:"recede",parent:forward.inner});
    const endHop = B.draw(hop2,arrow(26,204,88,20,16),{at:tSecond,by:tSecond+D*0.48,pen:"accent"});
    // @form causal_caption: the path carries the explanation, words confirm it
    const words = ctx.el("travelled_words", {x:1060,y:790,w:620,h:76,kind:"text",exit:"wipe"});
    kit.fit("The link travelled",{role:"lead",w:588,h:64,maxLines:1});
    B.write(words,"The link travelled",{role:"lead",size:42,x:16,y:6,w:588,h:64,pen:"ink",at:endHop,by:ctx.speechEnd,maxLines:1});
  }
});
