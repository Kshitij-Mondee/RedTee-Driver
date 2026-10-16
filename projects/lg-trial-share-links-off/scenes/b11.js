// @design source_stays_copy_leaves: a separate sheet appears without altering the source
// Treatments: static source and copy; copying travel; drawn arrow and separate sheet. Choose drawn separation with signalling.
Loom.scene("b11",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true});
 ctx.held("page");ctx.held("eye");ctx.held("view_words");ctx.held("read_only");ctx.held("pencil");ctx.held("edit_words");
 // The previous accent overlay exits. A fresh edit-only kit instance draws ink without mutating held children.
 ctx.m.exit(ctx.held("edit_mark"),ctx.start);
 const ink=ctx.el("edit_ink",{x:220,y:270,w:320,h:430,kind:"mark",exit:"recede"});
 const correction=Loom.lesson.budget_page(ctx,ink.inner,{w:320,h:430,name:"access_ink_correction",marker:false});
 correction.edit.draw("ink",ctx.start,{parent:ink.inner});
 // @form copy_path: the viewed source can yield another sheet
 const arrow=ctx.el("copy_arrow",{x:525,y:675,w:240,h:120,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(10,12,225,95),{at:ctx.cue("where people slip"),by:ctx.cue("View protects")});
 const sheet=ctx.el("second_sheet",{x:785,y:680,w:150,h:185,kind:"object",exit:"recede"});
 const marks=W.rect(8,5,130,172).concat(W.path([[25,50],[55,47],[85,52],[120,48]]),W.path([[25,86],[58,82],[90,88],[120,83]]),W.path([[25,122],[55,120],[90,125],[120,120]]));
 B.draw(sheet,marks,{at:ctx.cue("View protects"),by:ctx.cue("Depending on the tool")});
 // @form copy_caution: protection of the source is not prevention of copies
 const words=ctx.el("copy_words",{x:1000,y:680,w:760,h:80,kind:"text",exit:"wipe"});
 const tw=ctx.cue("may not stop copying");
 const note=ctx.el("tool_note",{x:1000,y:803,w:560,h:50,kind:"text",exit:"wipe"});
 B.write(note,"depends on the tool",{size:30,pen:"muted",at:ctx.cue("Depending on the tool"),by:tw});
 const end=B.write(words,"View is not copy-proof",{size:44,at:tw,by:ctx.speechEnd-ctx.style.dur("draw")});
 const u=ctx.el("copy_underline",{x:1000,y:760,w:650,h:25,kind:"mark",exit:"recede"});
 const ue=B.draw(u,W.line(5,8,610,9),{pen:"accent",at:end,by:ctx.speechEnd-ctx.style.dur("draw")*.65});
}});
