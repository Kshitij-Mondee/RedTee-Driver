// @design permission_default: two alternatives remain while one receives the default mark
// Treatments: static rows with signalling; travelling tick; handwritten decisions. Chosen static rows with handwritten signalling for a rest beat.
Loom.scene("b12",{build(ctx){
 const W=ctx.engine, B=W.board(ctx,{marker:true});
 ctx.held("page"); ctx.held("eye"); ctx.held("view_words"); ctx.held("pencil"); ctx.held("edit_words");
 // @form default_decision: mark the default without deleting the alternative
 const view=ctx.el("view_first",{x:1080,y:270,w:630,h:78,kind:"text",exit:"wipe"});
 const tv=ctx.cue("start with view");
 B.draw(view,W.tick(24,36,30),{at:tv,by:tv+ctx.style.dur("draw")*0.25,pen:"ink"});
 B.write(view,"View first",{x:72,y:0,w:540,h:74,at:tv+ctx.style.dur("draw")*0.25,by:ctx.cue("Edit only when")-ctx.style.dur("draw")*0.6,size:44,pen:"ink",maxLines:1});
 const underline=ctx.el("view_first_underline",{x:1152,y:346,w:350,h:24,kind:"mark",exit:"recede"});
 B.draw(underline,W.line(0,9,315,7),{at:ctx.cue("Edit only when")-ctx.style.dur("draw")*0.6,by:ctx.cue("Edit only when")-ctx.style.dur("draw")*0.15,pen:"accent"});
 // @form conditional_edit: edit remains available for a deliberate need
 const edit=ctx.el("edit_if",{x:1080,y:470,w:700,h:92,kind:"text",exit:"wipe"});
 B.write(edit,"Edit only if they must ?",{at:ctx.cue("Edit only when"),by:ctx.cue("Keep those"),size:38,pen:"ink",maxLines:1});
 // @form quiet_scope_recall: a small familiar diagram recalls the three choices
 const recall=ctx.el("recall_rings",{x:1500,y:670,w:200,h:200,kind:"mark",exit:"recede"});
 const rings=Loom.lesson.access_rings(ctx,recall.inner,{w:200,h:200,radius:90,cx:100,cy:100,pen:"muted",labels:false,marker:true,name:"b12_recall"});
 recall.handle=rings;
 const tr=ctx.cue("Keep those"); const d=ctx.style.dur("draw")*0.38;
 rings.showRing("anyone",tr,{by:tr+d});
 rings.showRing("company",tr+d,{by:tr+2*d});
 rings.showRing("named",tr+2*d,{by:tr+3*d});
}});
