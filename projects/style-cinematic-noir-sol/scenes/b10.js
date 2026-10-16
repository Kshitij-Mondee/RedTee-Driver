// @design distinct_tokens_hold_boundary: distinct issued shapes cross separate thresholds, a copied shape reaches the other boundary and stops
Loom.scene("b10", { build(ctx) {
  /* Treatments: static paired thresholds with signalling; issuing cards into a paired wall; travelling copy across a receding corridor. Choose paired issuing because refusal is the proof. */
  const {kit,m}=ctx, c=(t)=>ctx.c(t);
  const issue=ctx.cue("unique password for every account"), trial=ctx.cue("opens only that site"), manager=ctx.cue("password manager");
  // @form night_wall: the same quiet wall continues into the next shot
  const wall=ctx.el("door_wall",{x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"none"});
  Loom.svg("rect",{x:0,y:0,width:1920,height:1080,fill:c("field")},wall.inner);
  Loom.svg("rect",{x:120,y:180,width:1560,height:650,fill:c("surface2")},wall.inner);
  Loom.svg("path",{d:"M120 830 H1680 L1830 930 H40 Z",fill:c("field2")},wall.inner);
  Loom.svg("path",{d:"M520 828 L1480 828 L1550 900 L440 900 Z",fill:c("ink"),opacity:0.035},wall.inner);
  Loom.svg("rect",{x:900,y:182,width:90,height:8,fill:c("ink"),opacity:0.65},wall.inner);
  // @form paired_doors: two accounts keep distinct locks
  const shop=ctx.el("door_shop",{x:600,y:230,w:400,h:620,kind:"instrument",exit:"recede"});
  shop.handle=Loom.lesson.door(ctx,shop.inner,{w:400,name:"Shop",state:"shut"});
  const work=ctx.el("door_work",{x:1080,y:230,w:400,h:620,kind:"instrument",exit:"none"});
  work.handle=Loom.lesson.door(ctx,work.inner,{w:400,name:"Work",state:"shut"});
  // @form issuing_pair: one manager supplies a separately seeded card per account
  const vault=ctx.el("vault",{x:210,y:545,w:280,h:335,kind:"instrument",exit:"recede"});
  const vs=Loom.lesson.password_vault(ctx,vault.inner,{w:280,seed:"shop-unique",state:"closed"});
  const vw=Loom.lesson.password_vault(ctx,vault.inner,{y:170,w:280,seed:"work-unique",state:"closed"});
  Loom.svg("rect",{x:1,y:13,width:159,height:140,rx:9,fill:"none",stroke:c("accent"),"stroke-width":3},vault.inner);
  vs.setState("issuing",issue); vs.setState("closed",issue+ctx.style.dur("move"));
  vw.setState("issuing",issue+ctx.style.dur("move")); vw.setState("closed",issue+2*ctx.style.dur("move"));
  m.emphasis(vault,issue);
  // @form separate_cards: visibly different teeth remain at the two named doors
  const cs=ctx.el("card_shop",{x:394,y:614,w:160,h:102,kind:"token",exit:"recede"});
  cs.handle=Loom.lesson.keycard(ctx,cs.inner,{w:160,seed:"shop-unique",state:"fresh"});
  m.reveal(cs,issue); m.travel(cs,issue+ctx.style.dur("enter"),{x:261,y:66,scale:1,dur:ctx.style.dur("move")});
  const cw=ctx.el("card_work",{x:394,y:784,w:160,h:102,kind:"token",exit:"recede"});
  cw.handle=Loom.lesson.keycard(ctx,cw.inner,{w:160,seed:"work-unique",state:"fresh"});
  m.reveal(cw,issue+ctx.style.dur("move")); m.travel(cw,issue+ctx.style.dur("move")+ctx.style.dur("enter"),{x:741,y:-104,scale:1,dur:ctx.style.dur("move")});
  // @form unique_tag: the habit names the paired cards
  kit.fit("unique password",{role:"lead",w:430,h:60,maxLines:1});
  Loom.treat.label(ctx,"label_unique",{x:720,y:105,text:"unique password",to:[960,225],tone:"ink",role:"lead",as:"underline",t:issue});
  // @form rejected_copy: matching Shop teeth travel toward Work without opening it
  const copied=ctx.el("card_copy",{x:655,y:680,w:160,h:102,kind:"token",exit:"recede"});
  copied.handle=Loom.lesson.keycard(ctx,copied.inner,{w:160,seed:"shop-unique-fresh",state:"copy"});
  m.reveal(copied,trial); m.travel(copied,trial+ctx.style.dur("enter"),{x:635,y:-145,scale:0.6,dur:ctx.style.dur("move")});
  copied.handle.setState("dim",trial+ctx.style.dur("enter")+ctx.style.dur("move"));
  // @form safe_verdict: the intact boundary is the good outcome
  Loom.treat.mark(ctx,"door_holds",{x:1495,y:545,size:64,kind:"yes",t:trial+ctx.style.dur("enter")+ctx.style.dur("move")});
  // @form manager_lead: the term points to the source rather than to the rejected card
  kit.fit("password manager",{role:"lead",w:430,h:60,maxLines:1});
  Loom.treat.label(ctx,"label_manager",{x:390,y:455,text:"password manager",to:[287,558],tone:"ink",role:"lead",as:"underline",t:manager});
}});
