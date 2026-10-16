// @design review_old_entries: a retained disabled token anchors a review of earlier entries
Loom.scene("b23",{build(ctx){
// Treatments: static list with a colour cue; row removal; drawn strike and tick. Choose drawn marks to show review without erasing history.
const W=ctx.engine,B=W.board(ctx,{marker:true});
const head=ctx.held("until_head"),key=ctx.held("key"),cross=ctx.held("key_cross"),sender=ctx.held("sender"),arrow=ctx.held("return_arrow");
ctx.m.exit(ctx.held("list"),ctx.start);ctx.m.exit(ctx.held("off_words"),ctx.start);
// @form retained_disabled_key: the previous emphasis becomes ink
const ink=ctx.el("key_cross_ink",{x:570,y:395,w:320,h:140,kind:"mark",exit:"recede"});
key.handle.cross.draw("ink",ctx.start,{parent:ink.inner});
const t0=ctx.cue("list what you have shared"),t1=ctx.cue("find old links"),t2=ctx.cue("expiry date");
// @form review_heading: shared items are reviewed
const words=ctx.el("review_words",{x:1050,y:245,w:650,h:75,kind:"text",exit:"wipe"});
B.write(words,"Review what you shared",{role:"lead",at:ctx.speechStart,by:t0});
// @form shared_items: page marks distinguish shared files from people
const list=ctx.el("shared_list",{x:1160,y:350,w:300,h:280,kind:"card",exit:"recede"});
B.draw(list,W.rect(6,6,288,268),{at:t0,by:t0+0.3,pen:"ink"});
const rows=[];
for(let i=0;i<3;i++){
const row=ctx.el("shared_row_"+i,{x:1180,y:377+i*77,w:250,h:48,kind:"mark",exit:"recede"});
const marks=W.rect(4,2,28,38).concat(W.line(51,19,206,19));
rows.push(row);B.draw(row,marks,{at:t0+0.3+i*0.26,by:t0+0.56+i*0.26,pen:"ink"});
}
// @form old_link_review: one old link is marked off
const mark=ctx.el("old_link_mark",{x:1175,y:448,w:275,h:55,kind:"mark",exit:"recede"});
B.draw(mark,W.line(10,25,218,25).concat(W.tick(243,25,22)),{at:t1,by:t1+0.6,pen:"accent"});
// @form optional_expiry: calendar is an option, not a promise
const cal=ctx.el("calendar",{x:1120,y:705,w:500,h:120,kind:"icon",exit:"recede"});
ctx.kit.icon(cal.inner,"calendar",{x:52,y:52,size:88,stroke:24*3.6/88,color:"ink"});ctx.m.unmask(cal,t2-0.2,{dur:ctx.style.dur("draw")*.35});ctx.m.draw(cal,t2-0.2,{dur:ctx.style.dur("draw")*.35});
B.write(cal,"Expiry date",{x:120,y:20,w:370,h:70,role:"lead",at:t2+0.15,by:ctx.speechEnd-0.2});
}});
