// @design sequential_checks: four prompts accumulate with a confirming stroke
Loom.scene("b20", {
  build(ctx) {
    /* Treatments: static four-row list with signalling; sequential written checks; four cards.
       Choose sequential writing because each confirmation follows its spoken prompt. */
    const W = ctx.engine, B = W.board(ctx, {marker:true});
    const tHead = ctx.cue("four quick checks");
    const t1 = ctx.cue("Right file");
    const t2 = ctx.cue("Narrowest setting");
    const t3 = ctx.cue("View");
    const t4 = ctx.cue("who is on the list");
    // @form checklist_heading: heading anchors the shared board
    const head = ctx.el("check_head", {x:120,y:144,w:760,h:110,kind:"text",exit:"wipe"});
    B.heading(head,"Before you share",{role:"title",at:tHead,by:t1-ctx.style.dur("stagger"),pen:"ink"});
    // @form prompt_rows: four rough boxes beside their written questions
    const checks = ctx.el("checks", {x:160,y:330,w:700,h:430,kind:"group",exit:"recede"});
    // @form confirming_ticks: one ink tick per question
    const ticks = ctx.el("ticks", {x:160,y:330,w:700,h:430,kind:"mark",exit:"recede"});
    const rows = [
      {key:"file",words:"Right file?",at:t1,end:t2,y:0},
      {key:"setting",words:"Narrowest setting?",at:t2,end:t3,y:105},
      {key:"permission",words:"View unless edit?",at:t3,end:t4,y:210},
      {key:"people",words:"Who is on the list?",at:t4,end:ctx.speechEnd-ctx.style.dur("stagger"),y:315}
    ];
    rows.forEach(function(r,i){
      const span=r.end-r.at, boxEnd=r.at+span*.17, wordsEnd=r.at+span*.77;
      const box=ctx.el("check_box_"+r.key,{x:0,y:r.y+12,w:56,h:56,kind:"mark",exit:"recede",parent:checks.inner});
      B.draw(box,W.rect(7,7,42,42),{at:r.at,by:boxEnd,pen:"ink"});
      const words=ctx.el("check_words_"+r.key,{x:84,y:r.y,w:590,h:74,kind:"text",exit:"wipe",parent:checks.inner});
      ctx.kit.fit(r.words,{role:"lead",w:566,h:62,maxLines:1});
      B.write(words,r.words,{role:"lead",size:46,x:12,y:6,w:566,h:62,maxLines:1,at:boxEnd,by:wordsEnd,pen:"ink"});
      const tick=ctx.el("check_tick_"+r.key,{x:0,y:r.y+12,w:56,h:56,kind:"mark",exit:"recede",parent:ticks.inner});
      B.draw(tick,W.tick(28,28,35),{at:wordsEnd,by:r.end-(i===3?span*.12:ctx.style.dur("stagger")),pen:"ink"});
    });
    // @form final_underline: the list question receives the single accent
    const underline=ctx.el("list_underline",{x:250,y:727,w:560,h:24,kind:"mark",exit:"recede"});
    B.draw(underline,W.line(6,10,490,12),{at:t4+(ctx.speechEnd-ctx.style.dur("stagger")-t4)*.88,by:ctx.speechEnd,pen:"accent"});
  }
});
