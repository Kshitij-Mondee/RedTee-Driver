// @design sequential_checks_continued: keep the confirmed prompts and inspect the object beside them
Loom.scene("b21", {
  build(ctx) {
    /* Treatments: static inspection board with signalling; moving lens; cards replacing checks.
       Choose the held board plus a drawn inspection symbol, keeping the decision visible. */
    const W=ctx.engine, B=W.board(ctx,{marker:true});
    ctx.held("check_head");
    ctx.held("checks");
    ctx.held("ticks");
    // The previous accent overlay is not held. Its element life ends at this join.
    const tLook=ctx.cue("look inside the file");
    const tPages=ctx.cue("Other pages");
    const tComments=ctx.cue("comments");
    const tVersion=ctx.cue("version history");
    const tCheck=ctx.cue("Check");
    const span=tPages-tLook;
    // @form inspection_page: the same budget page beside the held checklist
    const page=ctx.el("page",{x:1020,y:388,w:260,h:350,kind:"object",exit:"recede"});
    const handle=Loom.lesson.budget_page(ctx,page.inner,{w:260,h:350,name:"inspection_budget",marker:true});
    page.handle=handle;
    handle.draw(tLook,{by:tLook+span*.56});
    // @form inspection_heading: a zone heading above the inspected page
    const inside=ctx.el("inside_words",{x:1000,y:274,w:690,h:92,kind:"text",exit:"wipe"});
    B.heading(inside,"Inside the file",{role:"title",at:tLook+span*.56,by:tLook+span*.85,pen:"ink"});
    // @form inspection_symbol: Lucide search marks looking inside without changing the file
    const lens=ctx.el("magnifier",{x:1168,y:612,w:112,h:112,kind:"icon",exit:"recede"});
    ctx.kit.icon(lens.inner,"search",{x:56,y:56,size:100,stroke:24*3.6/100,color:"accent"});
    ctx.m.draw(lens,tLook+span*.85,{dur:Math.min(ctx.style.dur("draw"),span*.15)});
    // @form hidden_places: three short tabs written beside the page on their words
    const tabs=ctx.el("tabs",{x:1320,y:405,w:440,h:316,kind:"group",exit:"recede"});
    const places=[
      {key:"pages",words:"Pages",y:0,w:194,at:tPages,end:tComments},
      {key:"comments",words:"Comments",y:110,w:280,at:tComments,end:tVersion},
      {key:"history",words:"Version history",y:220,w:420,at:tVersion,end:tCheck}
    ];
    places.forEach(function(p){
      const stop=p.at+(p.end-p.at)*.24;
      const tab=ctx.el("tab_"+p.key,{x:0,y:p.y,w:p.w,h:82,kind:"mark",exit:"recede",parent:tabs.inner});
      B.draw(tab,W.rect(6,6,p.w-12,70),{at:p.at,by:stop,pen:"ink"});
      const words=ctx.el("tab_words_"+p.key,{x:18,y:p.y+12,w:p.w-36,h:58,kind:"text",exit:"wipe",parent:tabs.inner});
      ctx.kit.fit(p.words,{role:"lead",w:p.w-48,h:50,maxLines:1});
      B.write(words,p.words,{role:"lead",size:42,x:6,y:4,w:p.w-48,h:50,maxLines:1,at:stop,by:p.end-ctx.style.dur("stagger"),pen:"ink"});
    });
  }
});
