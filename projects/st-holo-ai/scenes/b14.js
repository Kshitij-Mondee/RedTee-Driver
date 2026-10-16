// @design weighted_fork: one shared path separates into equally lit outcomes
// Three treatments: static fork with signalling; a moving die; weighted scan then fork.
// Choose the scan then fork, because the path separation is the explanation, not decoration.
Loom.scene("b14", {
  build(ctx) {
    const k = ctx.kit, m = ctx.m;
    const H = ctx.engine.hud(ctx, {name:"sampling_hud", balance:false});
    // Keep the downstream geometry contract, but give this beat its own visible set.
    const inheritedReply=ctx.held("reply_line");
    const inheritedSlot=ctx.held("number_slot");
    const inheritedBars=ctx.held("bars");
    const geom={reply:{x:160,y:410,w:700,h:220},bars:{x:980,y:300,w:760,h:490},slot:{x:40,y:148,w:84,h:46},baseline:{x1:40,y1:146,x2:660,y2:146}};
    const R=H.frame("sampling_reply_line",{...geom.reply,tone:"line",plate:true,at:ctx.start-ctx.style.dur("draw")});
    const reply=R.E;
    reply.geometry=geom;
    const fresh=[];
    const base=geom.baseline;
    fresh.push(k.line(reply.inner,base.x1,base.y1,base.x2,base.y2,{stroke:ctx.c("line"),sw:2}));
    let x=40,y=85;
    ["Expense","claims","are","due","within"].forEach(function(word,i){
      const fit=k.fit(word,{role:"body",w:620,h:46,maxLines:1});
      const width=fit.width+12;
      if(x+width>660){x=40;y=148;}
      fresh.push(k.text(reply.inner,word,{x:x+6,y:y,w:width-12,h:46,role:"body",color:ctx.c("ink"),size:fit.size,maxLines:1}));
      x+=width+10;
    });
    if(x+84>660){x=40;y=148;}
    geom.slot={x:x,y:y,w:84,h:46};
    inheritedReply.geometry=geom;
    const S=H.frame("sampling_number_slot",{x:geom.reply.x+x,y:geom.reply.y+y,w:84,h:46,tone:"line",plate:true,at:ctx.start-ctx.style.dur("draw")});
    const slot=S.E;
    const B=H.bars("sampling_bars",{...geom.bars,rows:[["30",0.86,"info"],["60",0.82,"info"],["the",0.15,"idle"]],max:1,labelW:190,valueW:0,rowH:116,barH:32,fill:0.45,at:ctx.start-ctx.style.dur("draw"),by:ctx.start});
    const bars=B.E;
    bars.inner.querySelectorAll("text").forEach(function(t){
      const text=t.textContent.trim();
      if(/^[0-9.]+$/.test(text)&&text!=="30"&&text!=="60")t.setAttribute("display","none");
    });
    const origin = {x:geom.reply.x+geom.slot.x+geom.slot.w,y:geom.reply.y+geom.slot.y+geom.slot.h/2};
    const scan = ctx.cue("drawn from the odds");
    const still = ctx.cue("weighted dice roll");
    const first = ctx.cue("lands on thirty");
    const second = ctx.cue("on sixty");
    H.mode("analysis", ctx.start);
    // Clear the destination before the first card arrives.
    const compact=H.bars("second_draw_bars",{x:160,y:130,w:760,h:350,rows:[["30",0.86,"info"],["60",0.82,"info"],["the",0.15,"idle"]],max:1,labelW:190,valueW:0,rowH:90,barH:32,fill:0.45,at:first,by:first+ctx.style.dur("draw")});
    compact.E.inner.querySelectorAll("text").forEach(function(t){
      const text=t.textContent.trim();
      if(/^[0-9.]+$/.test(text)&&text!=="30"&&text!=="60")t.setAttribute("display","none");
    });
    // @form draw_marker: selection scans the ranking then rests before branching
    const marker = ctx.el("draw_marker", {x:1000,y:360,w:700,h:58,kind:"instrument",exit:"recede"});
    k.path(marker.inner,"M12,1 H1 V57 H12 M688,1 H699 V57 H688",{stroke:"ink",sw:2,fill:"none"});
    m.reveal(marker,scan,{dur:ctx.style.dur("enter")});
    m.exit(marker,first,"recede");
    Loom.drive(function(e) {
      const dy = 116 * Math.sin(e * Math.PI * 2) * (1-e);
      marker.inner.setAttribute("transform", "translate(0," + dy + ")");
    },scan,Math.max(ctx.style.dur("move"),still-scan),"move");
    const marker2=ctx.el("second_draw_marker",{x:180,y:190,w:700,h:58,kind:"instrument",exit:"recede"});
    k.path(marker2.inner,"M12,1 H1 V57 H12 M688,1 H699 V57 H688",{stroke:"ink",sw:2,fill:"none"});
    m.reveal(marker2,ctx.cue("Another"),{dur:ctx.style.dur("enter")});
    Loom.drive(function(e) {
      marker2.inner.setAttribute("transform", "translate(0," + (90*e) + ")");
    },ctx.cue("Another"),Math.max(ctx.style.dur("move"),second-ctx.cue("Another")),"move");
    // @form fork: one origin feeds both alternatives
    const fork = ctx.el("fork",{x:origin.x-12,y:origin.y-12,w:24,h:24,kind:"node",exit:"recede"});
    k.path(fork.inner,"M12,1 L23,7 L23,17 L12,23 L1,17 L1,7 Z",{stroke:"accent",sw:2,fill:"surface"});
    m.reveal(fork,first,{dur:ctx.style.dur("enter")});
    m.emphasis(fork,first);
    // @form branch_a: the first draw travels from the shared slot into the upper answer
    const a = ctx.el("branch_a",{x:origin.x,y:375,w:1378-origin.x,h:origin.y-375,kind:"connector",exit:"recede"});
    const ap = k.path(a.inner,"M0,"+(origin.y-375)+" C"+(1020-origin.x)+","+(origin.y-375)+" "+(1070-origin.x)+",0 "+(1360-origin.x)+",0 H"+(1378-origin.x),{stroke:"accent",sw:3,fill:"none"});
    m.draw(ap,first,{dur:ctx.style.dur("draw")});
    // @form branch_b: the second draw has equal weight and light
    const b = ctx.el("branch_b",{x:origin.x,y:origin.y,w:1378-origin.x,h:685-origin.y,kind:"connector",exit:"recede"});
    const bp = k.path(b.inner,"M0,0 C"+(1020-origin.x)+",0 "+(1070-origin.x)+","+(685-origin.y)+" "+(1360-origin.x)+","+(685-origin.y)+" H"+(1378-origin.x),{stroke:"accent",sw:3,fill:"none"});
    m.draw(bp,second,{dur:ctx.style.dur("draw")});
    // @form reply_30: first answer card at the destination socket
    const r30 = ctx.el("reply_30",{x:1360,y:300,w:360,h:150,kind:"card",exit:"recede"});
    k.fit("30 days",{role:"title",w:278,h:70,maxLines:1});
    r30.handle = Loom.lesson.reply_card(ctx,r30.inner,{text:"30 days",state:"linked"});
    m.assemble(r30,first+ctx.style.dur("draw"),{dur:ctx.style.dur("enter")});
    // @form reply_60: alternate answer with exactly the same brightness
    const r60 = ctx.el("reply_60",{x:1360,y:610,w:360,h:150,kind:"card",exit:"recede"});
    k.fit("60 days",{role:"title",w:278,h:70,maxLines:1});
    r60.handle = Loom.lesson.reply_card(ctx,r60.inner,{text:"60 days",state:"linked"});
    m.assemble(r60,second+ctx.style.dur("draw"),{dur:ctx.style.dur("enter")});
    m.exit(bars,first,"recede");
    m.exit(compact.E,second,"recede");
    m.exit(marker2,second,"recede");
    m.exit(reply,first,"recede");
    m.exit(slot,first,"recede");
    // The number slot remains the shared origin until the join.
    a.geometry={origin:origin,end:{x:1378,y:375}};
    b.geometry={origin:origin,end:{x:1378,y:685}};
    fork.geometry={origin:origin};
    r30.geometry={x:1360,y:300,w:360,h:150};
    r60.geometry={x:1360,y:610,w:360,h:150};
    // Both draw instruments have left before the unchanged fork holds.
  }
});
