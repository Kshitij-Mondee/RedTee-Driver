// @design unfolding_identifiers: the same pieces acquire identifiers and deeper numeric representations
Loom.scene("b05", {
  build(ctx) {
    // Treatments considered: static signalled stack; flipping identifiers into unfolding columns; camera dive into one piece.
    // Choose the second: the held pieces remain the reference while their representations assemble below.
    const stage = ctx.held("stage");
    const tokens = ctx.held("tokens");
    const H = ctx.engine.hud(ctx, {name:"numeric_hud"});
    const k = ctx.kit;
    const termAt = ctx.cue("called a token");
    const idsAt = ctx.cue("becomes a number");
    const vecAt = ctx.cue("long row of numbers");
    const rowAt = ctx.cue("learned in training");
    const D = ctx.style.dur("move");
    const S = ctx.style.dur("stagger");
    // Replace the held drawing locally: its source scene is hidden by the composed join.
    ctx.m.exit(tokens,ctx.start,"recede");
    const row = H.tokens("tokens_b05", {x:310,y:450,w:1300,tokens:["When","are","exp","ense","claims","due","?"],gap:28,focus:-1,at:ctx.start,by:0});
    const localTokens = row.E;
    localTokens.handle = row;
    localTokens.tokenRow = row;
    const originalBox = row.box.bind(row);
    row.box = i => {const r=originalBox(i).rect; return {x:960+(r.x-960)*1.6,y:r.y,w:r.w*1.6,h:r.h*1.6};};
    const body = localTokens.inner.querySelector('.lm-holo-body');
    const scaleGroup = Loom.svg('g',{transform:'translate(-390 0) scale(1.6)'},body);
    Array.from(body.children).filter(g=>g!==scaleGroup).forEach(g=>scaleGroup.appendChild(g));
    const handle = row;
    const boxes = [];
    for (let i=0;i<7;i++) { const q=handle.box(i); boxes.push(q.rect || q); }
    const b = boxes[2];
    // @form token_label: one piece receives its plain-language name
    const tokenLabel = Loom.treat.label(ctx,"token_label", {x:b.x,y:b.y-124,text:"token",to:[b.x+b.w/2,b.y],tone:"ink",role:"body",t:termAt});
    // The digits below are illustrative placeholders, not actual model token IDs or embedding values.
    const ids = [107,42,618,203,81,526,19];
    const digits = [[0.2,0.7,0.1,0.4],[0.8,0.1,0.5,0.2],[0.3,0.6,0.2,0.9],[0.4,0.1,0.8,0.3],[0.7,0.2,0.4,0.1],[0.1,0.8,0.3,0.6],[0.5,0.3,0.7,0.2]];
    const left=boxes[0].x;
    const right=boxes[6].x+boxes[6].w;
    const top=Math.max.apply(null,boxes.map(q=>q.y+q.h))+88;
    // @form id_tags: each held piece has an illustrative numeric identifier
    const tags=ctx.el("id_tags",{x:left,y:top,w:right-left,h:68,kind:"value",exit:"recede"});
    // @form vectors: numeric columns unfold from the same identifiers
    const vectors=ctx.el("vectors",{x:left,y:top+84,w:right-left,h:220,kind:"value",exit:"collapse"});
    boxes.forEach((q,i)=>{
      const x=q.x+q.w/2-left-36;
      // @form numeric_tag: an identifier flips into view under its reference piece
      const tag=ctx.el("id_tag_"+i,{x:x,y:0,w:72,h:64,parent:tags,kind:"value",exit:"recede"});
      k.rect(tag.inner,0,0,72,64,{fill:"surface",stroke:"line",r:0});
      k.fit(String(ids[i]),{role:"label",w:60,h:40,maxLines:1});
      k.text(tag.inner,String(ids[i]),{x:6,y:12,w:60,h:40,role:"label",size:26,color:"muted",align:"center",maxLines:1});
      ctx.m.grow(tag,idsAt+i*S,{axis:"y",dur:D});
      // @form numeric_column: faint illustrative digits unfold downward
      const col=ctx.el("vector_"+i,{x:x,y:0,w:72,h:216,parent:vectors,kind:"value",exit:"collapse"});
      k.rect(col.inner,0,0,72,216,{fill:"surface2",r:0});
      const rail=k.line(col.inner,0,0,0,216,{stroke:"accent",sw:2});
      rail.setAttribute("opacity",0.55);
      digits[i].forEach((v,j)=>{
        k.fit(v.toFixed(1),{role:"caption",w:60,h:38,maxLines:1});
        const text=k.text(col.inner,v.toFixed(1),{x:6,y:12+j*48,w:60,h:38,role:"caption",size:24,color:"muted",align:"center",maxLines:1});
        text.setAttribute("opacity",0.52);
      });
      ctx.m.unmask(col,vecAt+i*S,{dir:"ttb",dur:D});
    });
    // @form row_label: the expanded representation is named after appearing
    const rowLabel=Loom.treat.label(ctx,"row_label",{x:right+40,y:top+154,text:"row of numbers",tone:"ink",role:"caption",as:"flag",to:[right+80,top+184],t:rowAt});
    ctx.m.emphasis(vectors,vecAt);
    // Clear numeric representations before the context-window scene, leaving the reference pieces untouched.
    const clearAt=ctx.speechEnd-ctx.style.dur("exit");
    ctx.m.exit(tags,clearAt,"recede");
    ctx.m.exit(vectors,clearAt,"collapse");
    ctx.m.exit(rowLabel,clearAt,"recede");
    ctx.m.exit(tokenLabel,clearAt,"recede");
  }
});
