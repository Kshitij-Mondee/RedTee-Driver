// @design travelling_boundary: a handoff stays inside a drawn boundary
// Three treatments: static ring with signalling; moving token; drawn bent forward. Choose drawn forward because its reach is the argument.
Loom.scene("b13", { build(ctx) {
 const W=ctx.engine, B=W.board(ctx,{marker:false});
 const t=ctx.cue("set to the company"), f=ctx.cue("forwards it"), g=ctx.cue("a manager elsewhere");
 // @form company_boundary: the permitted area
 const rings=ctx.el("rings",{x:310,y:110,w:780,h:780,kind:"instrument",exit:"recede"});
 const R=Loom.lesson.access_rings(ctx,rings.inner,{name:"travel_rings",w:780,h:780,radius:380,cx:390,cy:390,labels:false,marker:false}); rings.handle=R;
 R.showRing("company",t,{by:t+ctx.style.dur("draw")});
 R.hatch("company",t+ctx.style.dur("draw"),{by:t+ctx.style.dur("draw")*1.6});
 // @form team_pictograms: three existing holders within the innermost future boundary
 const team=ctx.el("team",{x:610,y:466,w:180,h:68,kind:"icon",exit:"recede"});
 [30,90,150].forEach((x)=>ctx.kit.icon(team.inner,"user",{x:x,y:34,size:52,stroke:24*3.6/52,color:"ink"}));
 ctx.m.draw(team,t+ctx.style.dur("draw"),{dur:ctx.style.dur("draw")});
 // @form recipient_pictogram: another holder inside the boundary
 const manager=ctx.el("manager",{x:891,y:466,w:68,h:68,kind:"icon",exit:"recede"});
 ctx.kit.icon(manager.inner,"user",{x:34,y:34,size:60,stroke:24*3.6/60,color:"ink"});
 ctx.m.draw(manager,g,{dur:ctx.style.dur("draw")*.55});
 // @form forward_path: a bent marker handoff above the holders
 const a=ctx.el("forward_arrow",{x:748,y:396,w:189,h:72,kind:"connector",exit:"recede"});
 const accent=ctx.el("forward_accent",{x:748,y:396,w:189,h:72,kind:"connector",exit:"recede"});
 const marks=W.line(12,60,12,12).concat(W.line(12,12,177,12),W.arrow(177,12,177,54));

 // @form travel_note: concise notes outside the ring
 const note=ctx.el("note_words",{x:1150,y:340,w:620,h:200,kind:"text",exit:"wipe"});
 ctx.kit.fit("Company link",{role:"lead",w:600,h:80,maxLines:1});
 B.write(note,"Company link",{x:10,y:10,w:600,h:80,role:"lead",at:t+ctx.style.dur("draw")*1.6,by:f,pen:"ink"});
 B.draw(accent,marks,{at:f,by:g,pen:"accent"});
 B.write(note,"Forwarded once",{x:10,y:110,w:600,h:80,role:"lead",at:g,by:g+ctx.style.dur("draw"),pen:"ink"});
}});
