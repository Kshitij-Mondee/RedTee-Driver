// @design second_boundary_holds: a first latch accepts a token while a second latch remains closed
Loom.scene("b11",{build(ctx){
  /* Treatments: static twin latch signalling; push to the held boundary as one latch turns; token into an isolated lock diagram. Choose held boundary push to preserve the proof's place. */
  const {kit,m}=ctx, c=(t)=>ctx.c(t);
  const second=ctx.cue("multi-factor authentication"), acronym=ctx.cue("or MFA"), more=ctx.cue("something more"), alone=ctx.cue("A stolen password alone");
  m.exit(ctx.held("label_manager"),ctx.start-ctx.style.dur("exit"),"recede");
  m.exit(ctx.held("label_manager.lead"),ctx.start-ctx.style.dur("exit"),"recede");
  m.exit(ctx.held("door_holds"),ctx.start-ctx.style.dur("exit"),"recede");
  // @form continued_wall: retained scenery is never copied
  const wall=ctx.held("door_wall"); wall.exit="recede";
  // @form held_boundary: the existing Work door receives another lock without opening
  const work=ctx.held("door_work"); work.exit="recede";
  work.handle.setState("second_lock",second);
  m.travel(work,ctx.start,{x:-80,y:-30,scale:1.08,dur:ctx.speechEnd-ctx.start});
  // @form second_lock_light: the accent outlines the waiting second plate, not a second drawing of the lock
  const lock=ctx.el("second_lock",{x:278,y:418,w:54,h:108,kind:"icon",exit:"recede",parent:work.inner});
  Loom.svg("rect",{x:1,y:1,width:52,height:106,rx:10,fill:"none",stroke:c("accent"),"stroke-width":4},lock.inner);
  m.reveal(lock,second); m.emphasis(lock,ctx.cue("not enough"));
  // @form expanded_term: serif abbreviation and its plain spoken expansion on quiet dark field
  const term=ctx.el("term",{x:265,y:300,w:710,h:255,kind:"text",exit:"wipe"});
  kit.fit("MFA",{role:"title",w:700,h:110,maxLines:1});
  kit.text(term.inner,"MFA",{x:6,y:6,w:698,h:110,role:"title",color:"ink",weight:800,maxLines:1});
  m.unmask(term,acronym);
  const expansion=ctx.el("term_expansion",{x:270,y:425,w:710,h:130,kind:"text",exit:"wipe"});
  kit.fit("multi-factor authentication",{role:"lead",w:698,h:116,maxLines:2});
  kit.text(expansion.inner,"multi-factor authentication",{x:6,y:6,w:698,h:116,role:"lead",color:"ink",weight:700,maxLines:2});
  m.unmask(expansion,second);
  // @form stolen_token: a copied credential reaches the first latch only
  const card=ctx.el("keycard",{x:785,y:650,w:132,h:84,kind:"token",exit:"recede"});
  card.handle=Loom.lesson.keycard(ctx,card.inner,{w:132,seed:"work-unique-fresh",state:"copy"});
  m.reveal(card,more);
  m.travel(card,more+ctx.style.dur("enter"),{x:488,y:-110,scale:0.6,dur:ctx.style.dur("move")});
  const landed=more+ctx.style.dur("enter")+ctx.style.dur("move");
  work.handle.setState("second_turning",landed);
  m.exit(card,landed,"recede");
  // @form held_verdict: the second boundary holding is visibly the safe result
  Loom.treat.mark(ctx,"second_holds",{x:1405,y:710,size:64,kind:"yes",t:alone});
}});
