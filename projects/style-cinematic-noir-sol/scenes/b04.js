// @design breached_receiver_shared_inventory: an unrelated broken receiver releases matching tokens into a travelling inventory
Loom.scene("b04",{
 build(ctx){
  const {kit,m}=ctx;
  // Treatments considered: static inventory with lead; falling copy onto a travelling sheet; torn page transition. The travelling inventory shows the leak becoming shareable.
  const wall=ctx.held("door_wall"), shop=ctx.held("door_shop"), work=ctx.held("door_work"), card=ctx.held("keycard");
  Loom.tween(wall.dusk,{opacity:1},{opacity:0,duration:ctx.style.dur("enter")},ctx.start,{kind:"light",beat:ctx.beat.id,name:"dusk_to_night"});
  const breach=ctx.cue("shopping site is breached");
  shop.handle.setState("forced",breach);
  work.handle.setState("shut",ctx.cue("never controlled it"));
  // @form breach_annotation: danger names the broken receiver, not the person
  kit.fit("Shop: breached",{role:"body",w:370,h:60,maxLines:1});
  const tag=Loom.treat.label(ctx,"breach_tag",{x:400,y:154,text:"Shop: breached",to:[803,598],tone:"neg",role:"body",as:"tag",t:breach});
  m.exit(tag,ctx.speechEnd-ctx.style.dur("exit"),"wipe");
  // @form leaked_inventory: muted matching cards on a long sheet make a list without invented account data
  const lands=ctx.cue("lands in a list"), shared=ctx.cue("Lists get shared");
  const sheets=[];
  for(let j=0;j<3;j++){
   const name=j===0?"list_sheet":"shared_sheet_"+j;
   const sheet=Loom.treat.panel(ctx,name,{x:180+j*20,y:350+j*14,w:250,h:500,fill:"surface",as:"paper",t:j===0?lands:shared+j*ctx.style.dur("stagger")});
   for(let i=0;i<4;i++){
    const token=ctx.el("list_copy_"+j+"_"+i,{x:35,y:30+i*112,w:180,h:115,kind:"token",exit:"displace",parent:sheet});
    token.handle=Loom.lesson.keycard(ctx,token.inner,{w:180,seed:i===0?"dana":"list-"+i,state:"copy"});
    if(i===0&&j===0) m.drop(token,lands,{dur:ctx.style.dur("enter")});
   }
   m.travel(sheet,shared+j*ctx.style.dur("stagger"),{x:1900,y:0,scale:1,dur:ctx.style.dur("move")*2});
   sheets.push(sheet);
  }
  // @form leak_copy: a matching copy leaves the original rather than replacing it
  const copy=ctx.el("leak_copy",{x:918,y:515,w:180,h:115,kind:"token",exit:"displace",parent:wall});
  copy.handle=Loom.lesson.keycard(ctx,copy.inner,{w:180,seed:"dana",state:"copy"});
  m.reveal(copy,lands,{dur:ctx.style.dur("move")*0.3});
  m.travel(copy,lands,{x:-703,y:-135,scale:1,dur:ctx.style.dur("move")});
  m.exit(copy,lands+ctx.style.dur("move"),"recede");
 }
});
