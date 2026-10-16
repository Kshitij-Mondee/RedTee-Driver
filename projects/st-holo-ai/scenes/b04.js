// @design sentence_fracture: one continuous line separates into indexed pieces, with one internal seam opening last
// Treatments considered: static signalling over a line; a radial burst; a calm lateral fracture. Chosen: lateral fracture, because the separation is the content.
Loom.scene("b04", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"b04_hud", balance:false});
    const k = ctx.kit, m = ctx.m;
    const fracture = ctx.cue("breaks into small pieces");
    const whole = ctx.cue("Short words stay whole");
    const split = ctx.cue("split in two");
    const move = ctx.style.dur("move");
    // @form dark_stage: one unchanging model space
    let stage = ctx.held("stage");
    if (!stage) stage = H.stage("stage", {focus:[960,480], at:ctx.start}).E;
    let question = ctx.held("question_float");
    if (!question) {
      question = ctx.el("question_float", {x:280,y:436,w:1360,h:144,kind:"text",exit:"wipe"});
      k.fit("When are expense claims due?", {role:"title",w:1080,h:100,maxLines:1});
      k.rect(question.inner,0,0,1120,150,{fill:"surface2"});
      k.text(question.inner,"When are expense claims due?",{x:20,y:25,w:1080,h:100,role:"title",align:"center",maxLines:1});
    }
    m.exit(question, fracture, "wipe");
    // @form indexed_fragments: pieces retain their order on a shared baseline
    const T = H.tokens("tokens", {x:310,y:450,w:1300,tokens:["When","are","exp","ense","claims","due","?"],gap:28,focus:-1,at:fracture,by:0});
    const tokenElement = T.E;
    tokenElement.handle = T;
    tokenElement.tokenRow = T;
    const originalBox = T.box.bind(T);
    T.box = i => {const r=originalBox(i).rect; return {x:960+(r.x-960)*1.6,y:r.y,w:r.w*1.6,h:r.h*1.6};};
    const body = tokenElement.inner.querySelector('.lm-holo-body');
    const scaleGroup = Loom.svg('g',{transform:'translate(-390 0) scale(1.6)'},body);
    const fragments = Array.from(body.children).filter(g=>g!==scaleGroup);
    fragments.forEach(g=>scaleGroup.appendChild(g));
    const pieceWords = ['When','are','exp','ense','claims','due','?'];
    const pieces = pieceWords.map(word=>{
      const text=Array.from(scaleGroup.querySelectorAll('text')).find(t=>t.textContent===word);
      if(!text) return null;
      return text.parentNode;
    });
    pieces.forEach((g,i)=>{
      if(!g) return;
      const close = i===2 ? 18 : i===3 ? -18 : 0;
      const drift = i<3 ? (3-i)*16 : -(i-3)*16;
      Loom.tween(g,{x:drift+close,y:-12},{x:close,y:0},fracture,{dur:move,ease:'move'});
      if(i===2 || i===3) Loom.tween(g,{x:close},{x:0},split,{dur:move,ease:'move'});
      if([0,1,4,5].includes(i)) {
        const text=g.querySelector('text');
        if(text) Loom.tween(text,{opacity:0.65},{opacity:1},whole+[0,1,4,5].indexOf(i)*ctx.style.dur('stagger'),{dur:move,ease:'move'});
      }
    });
    // @form split_seam: only the internal seam receives the saturated accent
    const B = T.box(3);
    const seam = ctx.el("split_ense", {x:B.x-10,y:B.y-8,w:B.w+20,h:B.h+64,kind:"instrument",exit:"recede"});
    const seamPlate = k.rect(seam.inner,0,0,B.w+20,B.h+64,{fill:"surface2"});
    seamPlate.setAttribute('opacity',0.22);
    k.line(seam.inner,0,0,0,B.h+64,{stroke:"accent",sw:2});
    k.line(seam.inner,0,B.h+64,B.w+20,B.h+64,{stroke:"accent",sw:2});
    m.reveal(seam,split+move);
    m.emphasis(seam,split+move);
    // @form illustrative_annotation: a quiet caveat beneath the seam
    const note = H.title("illustrative_note", {x:790,y:650,w:380,h:72,text:"illustrative split",role:"caption",caps:false,at:split});
  }
});
