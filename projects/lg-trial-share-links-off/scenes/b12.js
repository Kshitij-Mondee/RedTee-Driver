// @design default_then_exception: mark the starting choice and leave the other available
// Treatments: static tick with signalling; moving choice token; written default beside two rows. Choose written default, a calm rest after the caution.
Loom.scene("b12",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true});
 ctx.held("page");ctx.held("eye");ctx.held("view_words");ctx.held("pencil");ctx.held("edit_words");ctx.held("edit_ink");
 // @form default_choice: the read-only option is the starting point
 const first=ctx.el("view_first",{x:1080,y:305,w:650,h:75,kind:"text",exit:"wipe"});
 const tv=ctx.cue("start with view");
 const tickEnd=B.draw(first,W.tick(30,35,42),{at:tv,by:tv+ctx.style.dur("draw")*.3});
 const end=B.write(first,"View first",{size:44,x:80,y:0,w:550,h:75,at:tickEnd,by:ctx.cue("Edit only when")-ctx.style.dur("draw")*.4});
 const underline=ctx.el("view_first_underline",{x:1160,y:385,w:340,h:25,kind:"mark",exit:"recede"});
 B.draw(underline,W.line(4,8,290,9),{pen:"accent",at:end,by:ctx.cue("Edit only when")});
 // @form necessary_exception: editing remains a deliberate alternative
 const edit=ctx.el("edit_if",{x:1080,y:475,w:700,h:90,kind:"text",exit:"wipe"});
 B.write(edit,"Edit only if they must?",{size:40,at:ctx.cue("Edit only when"),by:ctx.cue("Keep those")});
 // @form scope_recall: the earlier three boundaries return without labels
 const rings=ctx.el("recall_rings",{x:1450,y:675,w:200,h:200,kind:"object",exit:"recede"});
 rings.handle=Loom.lesson.access_rings(ctx,rings.inner,{w:200,h:200,radius:90,cx:100,cy:100,pen:"muted",labels:false,name:"access_recall",marker:true});
 const tr=ctx.cue("three doors"),step=(ctx.speechEnd-tr)/3;
 rings.handle.showRing("anyone",tr,{by:tr+step});
 rings.handle.showRing("company",tr+step,{by:tr+step*2});
 rings.handle.showRing("named",tr+step*2,{by:ctx.speechEnd});
}});
