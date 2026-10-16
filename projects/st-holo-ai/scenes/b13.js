// @design close_candidates: two almost equal lengths invite a choice before the branching result
// Treatments considered: static ranking with signalling; two lengths rise beside a rewound line; a rotating chooser. Chosen: rising lengths, because the near tie is the question.
Loom.scene("b13", {
  build(ctx) {
    const H=ctx.engine.hud(ctx,{name:"practice_hud"});
    const k=ctx.kit, m=ctx.m;
    const turn=ctx.cue("Now you");
    const number=ctx.cue("at the number");
    const rank=ctx.cue("thirty and sixty both rank high");
    const question=ctx.cue("How did she get both");
    const geom={reply:{x:160,y:410,w:700,h:220},bars:{x:980,y:300,w:760,h:490},slot:{x:40,y:148,w:84,h:46},baseline:{x1:40,y1:146,x2:660,y2:146}};
    // @form rewound_reply: the same set returns already written up to the number
    const R=H.frame("reply_line",{...geom.reply,tone:"line",plate:true,at:ctx.start-ctx.style.dur("draw")});
    R.E.handle=R; R.E.geometry=geom;
    const b=geom.baseline;
    k.line(R.E.inner,b.x1,b.y1,b.x2,b.y2,{stroke:ctx.c("line"),sw:2});
    let x=40,y=85;
    ["Expense","claims","are","due","within"].forEach(function(word,i){
      const fit=k.fit(word,{role:"body",w:620,h:46,maxLines:1});
      const width=fit.width+12;
      if(x+width>660){x=40;y=148;}
      const E=ctx.el("practice_piece_"+i,{x:x,y:y,w:width,h:46,parent:R.E,kind:"token",exit:"recede"});
      k.text(E.inner,word,{x:6,y:0,w:width-12,h:46,role:"body",color:ctx.c("ink"),size:fit.size,maxLines:1});
      x+=width+10;
    });
    if(x+84>660){x=40;y=148;}
    geom.slot={x:x,y:y,w:84,h:46};
    // @form empty_number: an outlined gap, not an answer
    const S=H.frame("number_slot",{x:geom.reply.x+x,y:geom.reply.y+y,w:84,h:46,tone:"muted",plate:true,at:ctx.start-ctx.style.dur("draw")});
    S.E.handle=S; S.E.geometry=geom;
    S.status("line",number);
    m.emphasis(S.E,number);
    // @form near_tie: illustrative ranks have no numerical scale or score labels
    const B=H.bars("bars",{...geom.bars,rows:[["30",0.24,"info"],["60",0.22,"info"],["the",0.15,"idle"]],max:1,labelW:190,valueW:0,rowH:116,barH:32,fill:0.45,at:ctx.start-ctx.style.dur("draw"),by:ctx.start});
    B.E.handle=B; B.E.geometry=geom; B.E.candidates=["30","60","the"];
    B.E.inner.querySelectorAll("text").forEach(function(t){
      const text=t.textContent.trim();
      if(/^[0-9.]+$/.test(text)&&text!=="30"&&text!=="60")t.setAttribute("display","none");
    });
    B.set(0,0.86,rank,ctx.style.dur("move"));
    B.set(1,0.82,rank,ctx.style.dur("move"));
    // @form practice_invitation: a quiet plate identifies the viewer's turn
    const T=H.frame("turn_plate",{x:160,y:250,w:300,h:88,tone:"line",plate:true,at:ctx.start-ctx.style.dur("draw")});
    k.fit("Your turn",{role:"lead",w:252,h:48,maxLines:1});
    k.text(T.E.inner,"Your turn",{x:24,y:20,w:252,h:48,role:"lead",color:ctx.c("ink"),maxLines:1});
    m.reveal(T.E,turn);
    // @form held_question: typing finishes before the silence and then nothing moves
    const Q=H.frame("question_plate",{x:160,y:766,w:740,h:110,tone:"line",plate:true,at:question});
    k.fit("How did she get both?",{role:"lead",w:684,h:54,maxLines:1});
    const text=k.text(Q.E.inner,"How did she get both?",{x:28,y:28,w:684,h:54,role:"lead",color:ctx.c("ink"),maxLines:1});
    m.reveal(Q.E,question);
    m.typewriter(text,question,{dur:ctx.style.dur("draw")});
  }
});
