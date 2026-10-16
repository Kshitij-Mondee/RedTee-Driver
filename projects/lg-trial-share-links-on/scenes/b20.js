// @design spoken_checks: an accumulating checklist makes a deliberate pause visible
Loom.scene("b20", {
  build(ctx) {
    // Treatments: static list with a single signal; staged checklist; moving cards.
    // Choose staged checklist: each tick is the spoken check, without moving the words.
    const W = ctx.engine, B = W.board(ctx);
    const d = ctx.style.dur("draw");
    // @form board_heading: a new board for a practical pause
    const head = ctx.el("check_head", {x:120,y:112,w:800,h:120,kind:"text",exit:"wipe"});
    B.heading(head,"Before you share",{role:"title",size:88,at:ctx.cue("four quick checks"),by:ctx.cue("Right file")-ctx.style.dur("exit")});
    // @form spoken_checklist: four compact rows build in speech order
    const checks = ctx.el("checks", {x:150,y:330,w:790,h:450,kind:"mark",exit:"wipe"});
    const ticks = ctx.el("ticks", {x:150,y:330,w:68,h:450,kind:"mark",exit:"recede"});
    const times = [ctx.cue("Right file"),ctx.cue("Narrowest setting"),ctx.cue("View"),ctx.cue("who is on the list")];
    const words = ["Right file?","Narrowest setting?","View, unless edit?","Who is on the list?"];
    words.forEach((text,i) => {
      const y = i*112;
      const box=ctx.el("check_box_"+i,{x:0,y:y,w:64,h:64,kind:"mark",exit:"recede",parent:checks.inner});
      B.draw(box,W.rect(8,8,46,46),{at:times[i]-ctx.style.dur("exit"),by:times[i],pen:"ink"});
      const row=ctx.el("check_words_"+i,{x:94,y:y,w:680,h:72,kind:"text",exit:"wipe",parent:checks.inner});
      ctx.kit.fit(text,{role:"lead",w:680,h:72,maxLines:1});
      B.write(row,text,{size:44,at:times[i],by:times[i]+d*0.7,pen:"ink",maxLines:1});
      const tick=ctx.el("check_tick_"+i,{x:4,y:y+4,w:60,h:56,kind:"mark",exit:"recede",parent:ticks.inner});
      B.draw(tick,W.tick(29,28,38),{at:times[i]+d*0.7,by:times[i]+d,pen:"ink"});
    });
    // @form list_emphasis: the named list is the final check
    const u=ctx.el("list_underline",{x:244,y:746,w:650,h:24,kind:"mark",exit:"wipe"});
    B.draw(u,W.line(4,10,580,9),{at:ctx.cue("who is on the list")+d,by:ctx.cue("who is on the list")+d*1.5,pen:"accent"});
  }
});
