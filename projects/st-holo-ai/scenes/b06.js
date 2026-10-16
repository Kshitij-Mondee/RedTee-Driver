// @design bounded_field: a lit enclosure makes an absent sheet consequential
// Treatments: static boundary and dim sheet; travelling enclosure; closing brackets around existing pieces.
// Choose closing brackets: movement establishes the limit without adding a metaphor.
Loom.scene("b06", {
  build(ctx) {
    const stage = ctx.held("stage");
    const heldTokens = ctx.held("tokens");
    const priorRow = ctx.held("tokens_b05");
    if(priorRow) ctx.m.exit(priorRow,ctx.start,"recede");
    const H = ctx.engine.hud(ctx, {name:"b06_hud",balance:false});
    // A local row remains visible even when the continued source scene is hidden.
    const row = H.tokens("tokens_b06", {x:310,y:450,w:1300,tokens:["When","are","exp","ense","claims","due","?"],gap:28,focus:-1,at:ctx.start,by:0});
    const tokens = row.E;
    tokens.handle = row;
    tokens.tokenRow = row;
    const originalBox = row.box.bind(row);
    row.box = i => {const r=originalBox(i).rect; return {x:960+(r.x-960)*1.6,y:r.y,w:r.w*1.6,h:r.h*1.6};};
    const body = tokens.inner.querySelector('.lm-holo-body');
    const scaleGroup = Loom.svg('g',{transform:'translate(-390 0) scale(1.6)'},body);
    Array.from(body.children).filter(g=>g!==scaleGroup).forEach(g=>scaleGroup.appendChild(g));
    const frameAt = ctx.cue("in front of it");
    const questionAt = ctx.cue("Her question");
    const chatAt = ctx.cue("the chat");
    const replyAt = ctx.cue("its own reply");
    const nameAt = ctx.cue("context window");
    const outsideAt = ctx.cue("not in it");
    // @form bounded_window: one bracketed space, three readable bands
    const window = ctx.el("window", {x:140,y:200,w:1210,h:616,kind:"instrument",exit:"none"});
    window.handle = Loom.lesson.context_window(ctx,window.inner,{w:1210,h:616,state:"holding"});
    const K = window.handle;
    ctx.m.reveal(window,frameAt,{dur:ctx.style.dur("enter")});
    ctx.m.draw(K.frame.brackets,frameAt,{dur:ctx.style.dur("draw")});
    ctx.m.reveal(K.bands,questionAt,{dur:ctx.style.dur("enter")});
    ctx.m.reveal(K.labels.question,questionAt,{dur:ctx.style.dur("enter")});
    ctx.m.reveal(K.labels.chat,chatAt,{dur:ctx.style.dur("enter")});
    ctx.m.reveal(K.labels.reply,replyAt,{dur:ctx.style.dur("enter")});
    ctx.m.reveal(K.label,nameAt,{dur:ctx.style.dur("enter")});
    ctx.m.typewriter(K.label.querySelector("text"),nameAt,{dur:ctx.style.dur("draw")});
    // Keep the held row as the real content, above its new supporting plate.
    if(tokens) {
      const outer = window.outer.node || window.outer;
      const tokenOuter = tokens.outer.node || tokens.outer;
      K.frame.g.querySelector("rect").setAttribute("fill-opacity",0.15);
      const inner = tokens.inner.node || tokens.inner;
      const b = inner.getBBox();
      const scale = Math.min(1,865 / Math.max(1,b.width),90 / Math.max(1,b.height));
      const transform = tokenOuter.transform.baseVal.consolidate();
      const baseX = transform ? transform.matrix.e : 0;
      const baseY = transform ? transform.matrix.f : 0;
      ctx.m.travel(tokens,frameAt,{x:433-baseX-scale*b.x,y:289-baseY-scale*b.y,scale:scale,dur:ctx.style.dur("move")});
    }
    // @form excluded_sheet: the missing source remains separated by clear field
    const policy = ctx.el("policy", {x:1460,y:318,w:300,h:400,kind:"card",exit:"none"});
    policy.handle = Loom.lesson.policy_doc(ctx,policy.inner,{state:"outside_dim"});
    policy.handle.title.setAttribute("letter-spacing","0.08em");
    ctx.m.reveal(policy,outsideAt,{dur:ctx.style.dur("enter")});
    ctx.m.travel(policy,outsideAt,{x:-40,y:0,scale:1,dur:ctx.style.dur("draw")});
  }
});
