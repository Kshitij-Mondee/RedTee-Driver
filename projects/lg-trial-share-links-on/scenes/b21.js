// @design spoken_checks_continued: looking within the object completes an external checklist
Loom.scene("b21", {
  build(ctx) {
    // Treatments: static annotated page; page with a magnifier signal; travelling zoom.
    // Choose the magnifier signal: the checklist stays as the page is inspected.
    const W=ctx.engine, B=W.board(ctx), d=ctx.style.dur("draw");
    ctx.held("check_head"); ctx.held("checks"); ctx.held("ticks");
    // The prior accent is not kept. Its life ends at this beat boundary.
    // @form file_inspection: the same budget page is examined, not replaced
    const page=ctx.el("page",{x:1010,y:390,w:260,h:350,kind:"instrument",exit:"recede"});
    const tp=ctx.cue("look inside the file");
    page.handle=Loom.lesson.budget_page(ctx,page.inner,{w:260,h:350,name:"inspection_page"});
    page.handle.setState("plain",tp,{by:tp+d*0.7});
    // @form inspection_heading: label the area of attention
    const words=ctx.el("inside_words",{x:1010,y:257,w:780,h:110,kind:"text",exit:"wipe"});
    B.heading(words,"Inside the file",{role:"title",size:72,at:tp+d*0.7,by:tp+d*1.35,pen:"ink"});
    // @form looking_glass: one accent shows looking inside
    const glass=ctx.el("magnifier",{x:1130,y:466,w:128,h:128,kind:"icon",exit:"recede"});
    ctx.kit.icon(glass.inner,"search",{x:64,y:64,size:112,stroke:24*3.6/112,color:"accent"});
    ctx.m.draw(glass,tp+d*1.35,{dur:d*0.4});
    // @form internal_checks: three things inside the file to inspect
    const tabs=ctx.el("tabs",{x:1320,y:395,w:470,h:340,kind:"mark",exit:"wipe"});
    const times=[ctx.cue("Other pages"),ctx.cue("comments"),ctx.cue("version history")];
    ["Pages","Comments","Version history"].forEach((label,i)=>{
      const tab=ctx.el("inside_tab_"+i,{x:0,y:i*112,w:466,h:90,kind:"mark",exit:"recede",parent:tabs.inner});
      B.draw(tab,W.rect(6,6,454,78),{at:times[i]-ctx.style.dur("exit"),by:times[i],pen:"ink"});
      const text=ctx.el("inside_label_"+i,{x:26,y:i*112+20,w:412,h:54,kind:"text",exit:"wipe",parent:tabs.inner});
      ctx.kit.fit(label,{role:"lead",w:412,h:54,maxLines:1});
      B.write(text,label,{size:38,at:times[i],by:times[i]+d*0.65,pen:"ink",maxLines:1});
    });
  }
});
