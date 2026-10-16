// @design many_inputs_one_caller: several inputs converge on a single clearly marked decision caller
// Treatments: static signalling around the caller; sequential voting boxes; chosen arrows from group inputs to one person.
Loom.scene("b08", {build(ctx) {
 const {kit,m}=ctx,D=ctx.style.dur("draw");
 const hand=(g,d,o)=>kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
 // @form continued_board: preserve the exact preceding drawing
 const steps=ctx.held("steps");
 ctx.held("sam"); ctx.held("desk"); ctx.held("question"); ctx.held("parking_lot");
 ctx.held("side_bubble"); ctx.held("parked_name"); ctx.held("parked_item"); ctx.held("parked_heading");
 // @form group_inputs: pictograms represent contributions, not new cast members
 const group=ctx.el("group",{x:570,y:350,w:390,h:120,kind:"icon",exit:"recede"});
 for(let i=0;i<3;i++) {
  const icon=ctx.el("group_input_"+i,{x:10+i*130,y:10,w:110,h:100,kind:"icon",parent:group.inner,exit:"recede"});
  kit.icon(icon.inner,"user",{x:55,y:50,size:80,stroke:24*3.6/80,color:"ink"});
  m.draw(icon,ctx.cue("say how it's decided")+i*ctx.style.dur("stagger"),{dur:D*0.4});
 }
 // @form decision_caller: same Priya as at the opening table
 const priya=Loom.lesson.team_table.person(ctx,"Priya","neutral",{name:"priya",x:1020,y:380,size:340,flip:true});
 m.reveal(priya,ctx.cue("who calls it"),{dy:0});
 // @form caller_emphasis: one marker circle separates authority from input
 const circle=ctx.el("priya_circle",{x:995,y:350,w:415,h:405,kind:"mark",exit:"recede"});
 hand(circle.inner,"M208 18 C330 10 401 105 397 203 C398 303 325 384 208 385 C86 387 18 312 18 207 C12 105 87 17 208 18 C241 17 267 13 285 10",{stroke:"accent",sw:5});
 m.draw(circle,ctx.cue("Priya decides"),{dur:D});
 // @form caller_words: the rule remains readable beneath the person
 kit.fit("Priya decides",{role:"lead",w:340,h:72,maxLines:1});
 const words=ctx.el("priya_words",{x:1040,y:772,w:340,h:80,kind:"text",exit:"wipe"});
 kit.text(words.inner,"Priya decides",{x:10,y:8,w:320,h:64,role:"lead",maxLines:1,color:"ink",align:"center"});
 m.unmask(words,ctx.cue("Priya decides"),{dur:D});
 // @form convergent_arrows: hearing the group supplies input to the caller
 function arrow(name,x1,y1,x2,y2,bend) {
  const cx=(x1+x2)/2,cy=(y1+y2)/2+bend;
  const a=Math.atan2(y2-cy,x2-cx),hs=22;
  const hx1=x2-hs*Math.cos(a-0.5),hy1=y2-hs*Math.sin(a-0.5),hx2=x2-hs*Math.cos(a+0.5),hy2=y2-hs*Math.sin(a+0.5);
  const bx=Math.min(x1,cx,x2,hx1,hx2)-12,by=Math.min(y1,cy,y2,hy1,hy2)-12;
  const E=ctx.el(name,{x:bx,y:by,w:Math.max(x1,cx,x2,hx1,hx2)-bx+12,h:Math.max(y1,cy,y2,hy1,hy2)-by+12,kind:"connector",exit:"recede"});
  hand(E.inner,`M${x1-bx} ${y1-by} Q${cx-bx} ${cy-by} ${x2-bx} ${y2-by}`);
  hand(E.inner,`M${hx1-bx} ${hy1-by} L${x2-bx} ${y2-by} L${hx2-bx} ${hy2-by}`);
  return E;
 }
 for(let i=0;i<3;i++) {
  const A=arrow("group_arrow_"+i,635+i*130,476,986,535+(2-i)*44,0);
  m.draw(A,ctx.cue("after hearing the group")+i*ctx.style.dur("stagger"),{dur:D*0.5});
 }
 steps.handle.tick(1,ctx.cue("the group"),{tone:"ink"});
}});
