// @design copy_branch: a protected source can still branch into a second sheet
// Treatments: static source plus caveat; moving sheet; drawn branch. Chosen drawn branch makes the distinction without moving held content.
Loom.scene("b11", {build(ctx) {
 const W=ctx.engine, B=W.board(ctx,{marker:true});
 const page=ctx.held("page");
 ctx.held("eye"); ctx.held("view_words"); ctx.held("read_only"); ctx.held("pencil"); ctx.held("edit_words"); ctx.held("edit_mark");
 // @form ink_correction: retain the correction without retaining its emphasis colour
 const ink=ctx.el("edit_ink",{x:150,y:250,w:320,h:430,kind:"mark",exit:"recede"});
 const correction=Loom.lesson.budget_page(ctx,ink.inner,{w:320,h:430,name:"b11_correction",marker:false});
 correction.edit.draw("ink",ctx.start,{parent:ink.inner});
 // @form copy_branch: the source remains as a second sheet is possible
 const arrow=ctx.el("copy_arrow",{x:485,y:620,w:210,h:130,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(8,8,195,105),{at:ctx.cue("where people slip"),by:ctx.cue("View protects")-0.1,pen:"ink"});
 const sheet=ctx.el("second_sheet",{x:710,y:670,w:150,h:200,kind:"mark",exit:"recede"});
 let strokes=W.rect(8,8,132,184);
 [55,90,125].forEach(y=>{strokes=strokes.concat(W.path([[28,y],[45,y-2],[62,y+1],[83,y-1],[120,y]]));});
 B.draw(sheet,strokes,{at:ctx.cue("View protects"),by:ctx.cue("Depending on the tool"),pen:"ink"});
 // @form qualified_copy_warning: the caveat is a single underlined conclusion
 const words=ctx.el("copy_words",{x:910,y:696,w:790,h:62,kind:"text",exit:"wipe"});
 const tw=ctx.cue("Depending on the tool");
 B.write(words,"View is not copy-proof",{at:tw,by:ctx.at(0.77),size:44,pen:"ink",maxLines:1});
 const under=ctx.el("copy_underline",{x:915,y:760,w:650,h:24,kind:"mark",exit:"recede"});
 B.draw(under,W.line(0,10,630,8),{at:ctx.at(0.77),by:ctx.at(0.82),pen:"accent"});
 const note=ctx.el("tool_note",{x:920,y:804,w:680,h:50,kind:"text",exit:"wipe"});
 B.write(note,"depends on the tool",{at:ctx.at(0.82),by:ctx.at(0.85),size:30,pen:"muted",maxLines:1});
}});
