// @design whole_console_empty_band: a complete weighted field leaves its output visibly empty
// Three treatments: static whole console with signalling; a second token assembly; a travelling scan.
// Choose static recall with one outline lift. Assembly would repeat the explanation, scan adds no meaning.
Loom.scene("b09", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"recall_hud"});
    const settled = ctx.start - 3 * ctx.style.dur('draw');
    const answer = ctx.cue("Still no answer");
    const weights = ctx.cue("how much each one matters");
    // @form dark_stage: the same model space recalled as a whole
    const stage = H.stage("stage", {focus:[960,480],at:settled});
    // @form context_shell: the empty reply belongs to the same context as the question
    const window = ctx.el("window", {x:140,y:200,w:1210,h:616,kind:"panel",exit:"recede"});
    window.handle = Loom.lesson.context_window(ctx,window.inner,{w:1210,h:616,state:"holding"});
    // @form policy_outside: a source beyond the model's current reach
    const policy = ctx.el("policy", {x:1420,y:318,w:300,h:400,kind:"document",exit:"recede"});
    policy.handle = Loom.lesson.policy_doc(ctx,policy.inner,{state:"outside_dim"});
    // @form token_baseline: the question remains in indexed pieces
    const tokens = H.tokens("tokens", {x:310,y:450,w:1300,tokens:["When","are","exp","ense","claims","due","?"],gap:28,focus:3,at:settled,by:0});
    const originalBox=tokens.box.bind(tokens);
    const body=tokens.E.inner.querySelector('.lm-holo-body');
    const scaleGroup=Loom.svg('g',{transform:'translate(-390 0) scale(1.6)'},body);
    Array.from(body.children).filter(g=>g!==scaleGroup).forEach(g=>scaleGroup.appendChild(g));
    const bbox=(tokens.E.inner.node||tokens.E.inner).getBBox();
    const scale=Math.min(1,865/Math.max(1,bbox.width),90/Math.max(1,bbox.height));
    const transform=(tokens.E.outer.node||tokens.E.outer).transform.baseVal.consolidate();
    const baseX=transform?transform.matrix.e:0,baseY=transform?transform.matrix.f:0;
    ctx.m.travel(tokens.E,settled,{x:433-baseX-scale*bbox.x,y:289-baseY-scale*bbox.y,scale:scale,dur:ctx.style.dur('move')});
    // @form empty_target: weighted links point at a still unwritten place
    const next = ctx.el("next_slot", {x:1230,y:558,w:64,h:48,kind:"token",exit:"recede"});
    ctx.kit.rect(next.inner,1,1,62,46,{fill:'surface2',stroke:'line',r:0});
    ctx.kit.line(next.inner,12,36,52,36,{stroke:'muted',sw:2});
    const points = {next:[1262,582]};
    for(let i=0;i<7;i++) { const r=originalBox(i).rect;
      const q={x:960+(r.x-960)*1.6,y:r.y,w:r.w*1.6,h:r.h*1.6};
      points['t'+i]=[433+scale*(q.x-310+q.w/2-bbox.x),400]; }
    // The recalled shell sits behind the engine's token and link layer.
    const tokenNode = tokens.E.outer.node || tokens.E.outer;
    const windowNode = window.outer.node || window.outer;
    tokenNode.parentNode.insertBefore(windowNode, tokenNode);
    // @form weighted_connections: the illustrative weights are recalled rather than rebuilt
    const arcs = H.arcs("arcs", {points:points,links:[
      {from:'t0',to:'next',w:0.14},{from:'t1',to:'next',w:0.18},
      {from:'t2',to:'next',w:0.95},{from:'t3',to:'next',w:0.88},
      {from:'t4',to:'next',w:0.21},{from:'t5',to:'next',w:0.98},
      {from:'t6',to:'next',w:0.1}],lift:-0.15,strong:0.6,label:2,tone:'accent',at:settled,by:0});
    const arcNode = arcs.E.outer.node || arcs.E.outer;
    tokenNode.parentNode.appendChild(arcNode);
    Loom.tween(arcs.E.inner,{opacity:0.58},{opacity:1},weights,{dur:ctx.style.dur('move'),ease:'move'});
    // @form illustrative_note: the weights are an example, not measured values
    const note = ctx.el("weights_note", {x:900,y:720,w:420,h:48,kind:"text",exit:"wipe"});
    ctx.kit.fit('weights illustrative',{role:'caption',w:388,h:36,maxLines:1});
    ctx.kit.text(note.inner,'weights illustrative',{x:16,y:6,w:388,h:36,role:'caption',color:'muted',size:26,align:'center',maxLines:1});
    // @form reply_outline: a single outline lift holds attention on absence
    const reply = ctx.el("reply_band", {x:417.2,y:549.8,w:893.2,h:105.6,kind:"shape",exit:"recede"});
    const outline=ctx.kit.rect(reply.inner,1,1,891.2,103.6,{fill:'none',stroke:'accent',r:0});
    Loom.tween(outline,{opacity:0.12},{opacity:0.9},answer,{dur:ctx.style.dur('enter'),ease:'enter'});
    const down=ctx.speechEnd;
    Loom.tl.set(arcs.E.outer,{opacity:0},down);
    [stage,{E:window},{E:policy},tokens,arcs,{E:next},{E:note},{E:reply}].forEach(function(h){H.power(h,'down',down);});
  }
});
