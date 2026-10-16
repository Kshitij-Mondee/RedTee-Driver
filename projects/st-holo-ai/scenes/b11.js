// @design accumulating_loop: a selected piece travels into a growing line, then the same steps run faster
// Treatments considered: static three-step signal; word flight with repeated ranking updates; a revolving wheel. Chosen: word flight and a persistent three-step signal, because repetition is the content.
Loom.scene("b11", {
  build(ctx) {
    const H = ctx.engine.hud(ctx,{name:"loop_continued"});
    const k = ctx.kit, m = ctx.m;
    const pick = ctx.cue("picked and added");
    const again = ctx.cue("runs again");
    const cycle = ctx.cue("Pick, add, repeat");
    const end = ctx.cue("end token");
    // Retire the incoming set, then draw this beat's own visible instrument.
    m.exit(ctx.held("reply_line"),ctx.start-ctx.style.dur("exit"),"recede");
    m.exit(ctx.held("bars"),ctx.start-ctx.style.dur("exit"),"recede");
    const geom = {
      reply:{x:160,y:410,w:700,h:220},
      bars:{x:980,y:300,w:760,h:490},
      baseline:{x1:40,y1:146,x2:660,y2:146}
    };
    const ready = ctx.start-ctx.style.dur("draw")-ctx.style.dur("enter");
    const replyFrame = H.frame("loop_reply_line",{...geom.reply,tone:"line",plate:true,at:ready});
    const R = replyFrame.E;
    R.handle = replyFrame;
    R.geometry = geom;
    R.exit = "recede";
    const base = geom.baseline;
    k.line(R.inner,base.x1,base.y1,base.x2,base.y2,{stroke:ctx.c("line"),sw:2});
    R.cursor = k.rect(R.inner,40,85,24,46,{fill:ctx.c("muted")});
    const ranking = H.bars("loop_bars",{
      ...geom.bars,rows:[["Expense",0.86,"info"],["Claims",0.56,"info"],["You",0.28,"info"]],
      max:1,labelW:190,valueW:0,rowH:116,barH:32,fill:0.45,
      at:ready,by:ctx.start
    });
    const B = ranking.E;
    B.handle = ranking;
    B.geometry = geom;
    B.candidates = ["Expense","Claims","You"];
    B.exit = "recede";
    B.inner.querySelectorAll("text").forEach(function(t){
      if(/^[0-9.]+$/.test(t.textContent.trim()))t.setAttribute("display","none");
    });
    const N = H.frame("loop_illustrative_note",{x:1450,y:814,w:290,h:58,tone:"line",plate:true,at:ready});
    k.text(N.E.inner,"illustrative",{x:18,y:12,w:254,h:34,role:"caption",color:ctx.c("muted"),maxLines:1});
    Loom.tl.set(R.cursor,{opacity:0},pick);
    // @form accumulating_reply: one measured word at a time, wrapping within the held band
    const words = ["Expense","claims","are","due","within","30","days."];
    const arrivals = [pick,again,cycle,cycle+0.45,cycle+0.82,cycle+1.14,cycle+1.42];
    let x = 40, y = 85;
    const placements = [];
    words.forEach(function(word,i){
      const fit = k.fit(word,{role:"body",w:620,h:54,maxLines:1});
      const width = fit.width + 28;
      if(x+width>660){x=40;y=148;}
      placements.push({x:x,y:y,w:width});
      const W = ctx.el("reply_piece_"+i,{x:x,y:y,w:width,h:54,parent:R,kind:"token",exit:"recede"});
      k.text(W.inner,word,{x:8,y:0,w:width-16,h:54,role:"body",color:ctx.c("ink"),size:fit.size,maxLines:1});
      m.reveal(W,arrivals[i]);
      x += width+10;
    });
    // @form renewed_ranking: the same held instrument changes, not a second set of bars
    const labels = Array.from(B.inner.querySelectorAll("text")).filter(function(t){return B.candidates.indexOf(t.textContent.trim())>=0;});
    const rounds = [
      {t:again,labels:["claims","are","due"],values:[0.82,0.55,0.24]},
      {t:cycle,labels:["are","due","within"],values:[0.9,0.48,0.22]},
      {t:cycle+0.65,labels:["within","30","days."],values:[0.78,0.58,0.32]},
      {t:cycle+1.24,labels:["days.","30","within"],values:[0.92,0.38,0.18]}
    ];
    rounds.forEach(function(round){
      round.values.forEach(function(v,i){B.handle.set(i,v,round.t,ctx.style.dur("move"));});
      labels.forEach(function(label,i){Loom.tl.set(label,{textContent:round.labels[i]},round.t);});
    });
    // @form readable_loop: all three words stay readable while a signal cycles faster
    const L = H.frame("loop_label",{x:160,y:734,w:700,h:110,plate:true,tone:"line",at:cycle});
    ["Pick","add","repeat"].forEach(function(word,i){
      k.fit(word,{role:"lead",w:180,h:52,maxLines:1});
      k.text(L.E.inner,word,{x:36+i*220,y:18,w:180,h:52,role:"lead",color:ctx.c("ink"),maxLines:1});
    });
    m.reveal(L.E,cycle);
    const signal = ctx.el("loop_signal",{x:196,y:814,w:180,h:4,kind:"mark",exit:"recede"});
    k.rect(signal.inner,0,0,180,4,{fill:ctx.c("line")});
    m.reveal(signal,cycle);
    [0,0.52,0.98,1.38,1.72,2.0,2.24].forEach(function(dt,i){
      m.travel(signal,cycle+dt,{x:196+(i%3)*220,y:814,dur:ctx.style.dur("enter")*0.55});
    });
    // @form end_marker: a small terminal closes the written line
    const last=placements[placements.length-1];
    const E=ctx.el("end_marker",{x:geom.reply.x+last.x+last.w+18,y:geom.reply.y+last.y+10,w:18,h:28,kind:"mark",exit:"recede"});
    k.rect(E.inner,0,0,18,28,{fill:ctx.c("accent")});
    m.reveal(E,end);
    m.emphasis(R,end);
  }
});
