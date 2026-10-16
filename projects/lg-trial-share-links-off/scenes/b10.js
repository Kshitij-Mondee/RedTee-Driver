// @design shared_change: one correction becomes the same correction on every sheet
// Treatments: static source and copies with signalling; travelling correction; sequential repeated marks. Choose repeated marks to show a shared change.
Loom.scene("b10",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true});
 const page=ctx.held("page");ctx.held("eye");ctx.held("view_words");ctx.held("read_only");
 // @form edit_row: a pencil names the second permission
 const pencil=ctx.el("pencil",{x:720,y:470,w:100,h:90,kind:"icon",exit:"recede"});
 ctx.kit.icon(pencil.inner,"pencil",{x:50,y:45,size:80,stroke:24*3.6/80,color:"ink"});
 const te=ctx.cue("Edit is different");ctx.m.draw(pencil,te,{dur:ctx.style.dur("draw")*.4});
 const words=ctx.el("edit_words",{x:850,y:450,w:180,h:110,kind:"text",exit:"wipe"});
 B.heading(words,"Edit",{role:"title",at:te+ctx.style.dur("draw")*.4,by:ctx.cue("Holders")});
 const change=ctx.el("change_words",{x:1080,y:480,w:650,h:75,kind:"text",exit:"wipe"});
 const tc=ctx.cue("change the original");
 B.write(change,"Changes the original",{size:42,at:ctx.cue("Holders"),by:tc});
 // @form source_correction: the sole accent belongs to the original
 const edit=ctx.el("edit_mark",{x:220,y:270,w:320,h:430,kind:"mark",exit:"recede"});
 page.handle.edit.draw("accent",tc,{by:ctx.cue("Everyone sees"),parent:edit.inner});
 // @form repeated_copies: spaced sheets share the correction
 const copies=ctx.el("copies",{x:1000,y:665,w:620,h:190,kind:"object",exit:"recede"});
 let marks=[],edits=[];
 [10,220,430].forEach(x=>{
 marks=marks.concat(W.rect(x,5,125,165),W.path([[x+17,48],[x+45,45],[x+77,48],[x+105,45]]),W.path([[x+17,82],[x+47,79],[x+78,83],[x+105,80]]),W.path([[x+17,117],[x+50,113],[x+78,118],[x+103,115]]));
 edits=edits.concat(W.path([[x+77,85],[x+95,72],[x+112,78]]));
 });
 const ta=ctx.cue("Everyone sees");
 B.draw(copies,marks,{at:ta,by:ctx.speechEnd-ctx.style.dur("draw")*.7});
 B.draw(copies,edits,{at:ctx.speechEnd-ctx.style.dur("draw")*.7,by:ctx.speechEnd-ctx.style.dur("draw")*.1});
}});
