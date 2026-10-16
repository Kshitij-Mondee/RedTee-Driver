// @design weighted_convergence: a quiet field of links gains unequal weight toward one empty destination
// Treatments: static signalling; a travelling scan; links drawing then gaining weight.
// Choose links gaining weight, because the changing emphasis is the idea itself.
Loom.scene("b07", {
  build(ctx) {
    const stage=ctx.held("stage");
    const tokens=ctx.held("tokens");
    const window=ctx.held("window");
    const policy=ctx.held("policy");
    const H=ctx.engine.hud(ctx,{name:"attention_hud",balance:false});
    const slotAt=ctx.cue("the tricky part");
    const linksAt=ctx.cue("weighs every earlier token");
    const weightAt=ctx.cue("expense and due weigh the most");
    const noteAt=ctx.cue("weigh the most");
    // @form empty_target: the next piece has not yet been written
    const next=ctx.el("next_slot",{x:1230,y:558,w:64,h:48,kind:"token",exit:"recede"});
    ctx.kit.rect(next.inner,1,1,62,46,{fill:"surface2",stroke:"line",r:0});
    ctx.kit.line(next.inner,12,36,52,36,{stroke:"muted",sw:2});
    ctx.m.reveal(next,slotAt,{dur:ctx.style.dur("enter")});
    // Named geometry helpers match the recalled console in b09.
    function attentionPoints(row) {
      const inner=row.inner.node||row.inner;
      const bbox=inner.getBBox();
      const scale=Math.min(1,865/Math.max(1,bbox.width),90/Math.max(1,bbox.height));
      const handle=row.tokenRow||row.handle;
      const points={next:[1262,582]};
      for(let i=0;i<7;i++) {
        const b=handle.box(i),q=b.rect||b;
        points['t'+i]=[433+scale*(q.x-310+q.w/2-bbox.x),350];
      }
      return points;
    }
    function attentionLinks() {
      return [{from:'t0',to:'next',w:0.14},{from:'t1',to:'next',w:0.18},
        {from:'t2',to:'next',w:0.95},{from:'t3',to:'next',w:0.88},
        {from:'t4',to:'next',w:0.21},{from:'t5',to:'next',w:0.98},
        {from:'t6',to:'next',w:0.1}];
    }
    // Keep readable question pieces in this beat's live layer, aligned to the link origins.
    const points=attentionPoints(tokens);
    const questionWords=['When','are','exp','ense','claims','due','?'];
    const questionText=ctx.el("attention_question_text",{x:420,y:302,w:890,h:70,kind:"text",exit:"recede"});
    questionWords.forEach((word,i)=>{
      ctx.kit.text(questionText.inner,word,{x:points['t'+i][0]-420-54,y:8,w:108,h:48,role:'body',size:28,color:'ink',align:'center',maxLines:1});
    });
    // @form weighted_connections: every earlier piece contributes, three links gain prominence
    const arcs=H.arcs("arcs",{points:points,links:attentionLinks(),lift:-0.15,strong:0.6,label:2,tone:'accent',at:linksAt,by:ctx.style.dur('stagger')});
    // Keep new links in this beat's live HUD layer, not the held row's ancestor.
    const unique=[];
    Array.from(arcs.E.inner.querySelectorAll('path')).forEach(path=>{
      const d=path.getAttribute('d');
      if(!unique.includes(d)) unique.push(d);
      const i=unique.indexOf(d);
      const strong=[2,3,5].includes(i);
      const width=Number(path.getAttribute('stroke-width'))||2;
      const halo=!!path.getAttribute('filter')||width>7;
      Loom.drive(p=>{
        const startWidth=halo?width:1.4;
        const startAlpha=halo?0:0.55;
        const endAlpha=strong?1:0.24;
        path.setAttribute('stroke-width',String(startWidth+(width-startWidth)*p));
        path.setAttribute('stroke-opacity',String(startAlpha+(endAlpha-startAlpha)*p));
      },weightAt,ctx.style.dur('move'),'move');
    });
    // @form illustrative_note: this is an example of weights rather than a numerical measurement
    const note=ctx.el("weights_note",{x:900,y:720,w:420,h:48,kind:"text",exit:"wipe"});
    ctx.kit.rect(note.inner,0,0,420,48,{fill:'surface2',r:0});
    ctx.kit.fit('weights illustrative',{role:'caption',w:388,h:36,maxLines:1});
    ctx.kit.text(note.inner,'weights illustrative',{x:16,y:6,w:388,h:36,role:'caption',color:'muted',size:26,align:'center',maxLines:1});
    ctx.m.reveal(note,noteAt,{dur:ctx.style.dur('enter')});
    [stage,tokens,window,policy].forEach(E=>{if(E) E.exit='recede';});
  }
});
