// @design review_tokens: a returned token stays while an old entry is marked in a review list
// Treatments: static signalled list; sliding file stack; drawn review list. Choose drawn list for a continuing board.
Loom.scene("b23",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true});
 const a=ctx.cue("list what you have shared"), b=ctx.cue("find old links"), c=ctx.cue("expiry date");
 ctx.held("until_head");ctx.held("key");ctx.held("key_cross");ctx.held("sender");ctx.held("return_arrow");
 // @form neutral_cross: the taken-back key is now context
 const cross=ctx.el("key_cross_ink",{x:540,y:365,w:320,h:140,kind:"mark",exit:"recede"});
 const kh=Loom.lesson.link_key(ctx,cross.inner,{w:320,h:140,name:"review_cross",marker:false});
 kh.cross.draw("ink",ctx.start,{parent:cross.inner});
 // @form review_heading: the action above the artefact
 const words=ctx.el("review_words",{x:1080,y:245,w:620,h:75,kind:"text",exit:"wipe"});
 B.write(words,"Review what you shared",{role:"lead",at:a,by:a+ctx.style.dur("draw")});
 // @form shared_page_list: a generic shared-file inventory
 const list=ctx.el("shared_list",{x:1110,y:350,w:470,h:320,kind:"card",exit:"recede"});
 let marks=W.rect(5,5,450,300);
 for(let i=0;i<3;i++){const y=40+i*88;marks=marks.concat(W.rect(30,y,40,52)).concat(W.line(95,y+22,350,y+24));}
 B.draw(list,marks,{at:a+ctx.style.dur("draw"),by:ctx.cue("Review it"),pen:"ink"});
 // @form old_link_review: strike and tick identify the old entry
 const mark=ctx.el("old_link_mark",{x:1110,y:350,w:470,h:320,kind:"mark",exit:"recede"});
 B.draw(mark,W.line(90,153,350,150).concat(W.tick(400,151,38)),{at:b,by:b+ctx.style.dur("move"),pen:"accent"});
 // @form expiry_calendar: an optional time boundary
 const calendar=ctx.el("calendar",{x:1120,y:725,w:560,h:112,kind:"icon",exit:"recede"});
 ctx.kit.icon(calendar.inner,"calendar",{x:48,y:48,size:80,stroke:24*3.6/80,color:"ink"});
 ctx.m.reveal(calendar,c,{dy:0,dur:ctx.style.dur("stagger")});
 ctx.m.draw(calendar,c,{dur:ctx.style.dur("move")});
 const label=ctx.el("expiry_words",{x:1240,y:738,w:400,h:80,kind:"text",exit:"wipe"});
 B.write(label,"Expiry date",{role:"lead",at:c+ctx.style.dur("move"),by:ctx.speechEnd});
}});
