// @design indifferent_repeated_trials: an evenly spaced series of matching tokens fails before an ordinary token approaches the final receiver
Loom.scene("b05",{
 build(ctx){
  const {kit,m}=ctx;
  // Treatments considered: static array of crosses; finite clocked token stream; conveyor belt. A finite clocked stream makes automation visible without decorative machinery.
  const wall=ctx.held("door_wall"),shop=ctx.held("door_shop"),work=ctx.held("door_work"),card=ctx.held("keycard");
  card.handle.setState("copy",ctx.start);
  const t=ctx.cue("tries every leaked pair"), step=ctx.style.dur("move")*1.5;
  m.travel(card,ctx.start,{x:-760,y:290,scale:0.65,dur:ctx.style.dur("move")});
  // @form receding_receivers: secondary nameless login doors extend the wall without changing the two established doors
  const row=ctx.el("door_row",{x:0,y:0,w:1920,h:930,kind:"scenery",exit:"recede",parent:wall});
  const specs=[{x:145,y:420,w:220,shade:0.08},{x:365,y:500,w:115,shade:0.3},{x:1505,y:420,w:220,shade:0.08},{x:1738,y:500,w:115,shade:0.3}];
  const doors=specs.map((s,i)=>{
   const E=ctx.el("trial_door_"+i,{x:s.x,y:s.y,w:s.w,h:s.w*620/400,kind:"instrument",exit:"recede",parent:row});
   E.handle=Loom.lesson.door(ctx,E.inner,{w:s.w,state:"shut",shade:s.shade});
   return E;
  });
  m.reveal(row,ctx.start,{dur:ctx.style.dur("enter")});
  // @form metronomic_trials: copy cards arrive at locks with equal intervals and finish in a resting queue
  const stream=ctx.el("card_stream",{x:0,y:0,w:1920,h:930,kind:"token",exit:"recede",parent:wall});
  for(let i=0;i<6;i++){
   const idx=i%4,s=specs[idx],dh=doors[idx].handle;
   const E=ctx.el("stream_copy_"+i,{x:150,y:790,w:90,h:58,kind:"token",exit:"recede",parent:stream});
   E.handle=Loom.lesson.keycard(ctx,E.inner,{w:90,state:"copy",seed:"dana"});
   const ti=t+i*step;
   m.reveal(E,ti,{dur:ctx.style.dur("move")*0.2});
   m.travel(E,ti,{x:s.x+dh.lockAt.x-84-150,y:s.y+dh.lockAt.y-28-790,scale:1,dur:ctx.style.dur("move")});
   doors[idx].handle.setState("refused",ti+ctx.style.dur("move"));
   E.handle.setState("dim",ti+ctx.style.dur("move"));
   m.travel(E,ti+ctx.style.dur("move"),{x:130+i*125,y:60,scale:1,dur:ctx.style.dur("move")*0.45});
  }
  // @form named_mechanism: the only title appears while the automated trials continue
  const fit=kit.fit("credential stuffing",{role:"title",w:1000,h:130,maxLines:1});
  const term=ctx.el("term",{x:520,y:124,w:1100,h:150,kind:"text",exit:"wipe"});
  kit.text(term.inner,"credential stuffing",{role:"title",x:12,y:12,w:1076,h:110,maxLines:1,color:"ink",size:fit.size});
  kit.rect(term.inner,12,130,350,5,{fill:"accent"});
  m.unmask(term,ctx.cue("credential stuffing"));
  m.exit(term,ctx.speechEnd-ctx.style.dur("exit"),"wipe");
  const dana=ctx.cue("Nobody chose Dana");
  card.handle.setState("lit",dana);
  m.travel(card,dana,{x:297,y:48,scale:0.65,dur:ctx.style.dur("move")*2});
 }
});
