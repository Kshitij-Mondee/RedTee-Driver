// @design paper_thoughts_release: three rising doubts gather beside a figure, then fade as the figure regains composure
/* Treatments: A static cluster with sequential signalling; B thoughts orbiting the head;
   C chosen, paper thoughts rising one at a time and dimming, so hesitation visibly loses its hold.
   This cut re-establishes the medium station; b04 continues these fixed kit names. */
Loom.scene("b03", {
  build(ctx) {
    const {kit, m} = ctx;
    // @form office_layers: back, person, near desk provide a single inhabited place
    const backCtx = Object.create(ctx);
    backCtx.el = (name, opts) => ctx.el("room", opts);
    const back = Loom.lesson.desk_set(backCtx, ctx.g, {framing:"medium",layer:"back"});
    const maya = ctx.character("maya", "maya", {x:1580,y:1710,scale:0.85,skin:0,top:"cloth",pose:"idle",emotion:"neutral"});
    const front = Loom.lesson.desk_set(ctx, ctx.g, {framing:"medium",layer:"front",laptop:"sheet",ring:true,magnifier:false,only:["desk","receipts","laptop","phone"]});
    [back.room,front.desk,front.receipts,front.laptop,front.phone,maya.E].forEach(E => {E.exit="none";});
    const ordinary = ctx.cue("ordinary reasons");
    maya.pose("worried", ordinary, {dur:ctx.style.dur("move")});
    maya.emotion("doubt", ordinary);
    maya.gesture("tilt", ordinary, ctx.cue("What if I'm wrong?") );
    // @form paper_doubts: measured paper thoughts connect the words to the colleague
    kit.fit("What if I'm wrong?", {role:"body",w:390,h:120,maxLines:2});
    const wrong = Loom.treat.bubble(ctx,"bubble_wrong",{x:360,y:200,w:440,text:"What if I'm wrong?",tail:[1360,360],kind:"thought",fill:"surface",maxLines:2,as:"note"});
    kit.fit("What will it cost me?", {role:"body",w:450,h:120,maxLines:2});
    const cost = Loom.treat.bubble(ctx,"bubble_cost",{x:420,y:430,w:500,text:"What will it cost me?",tail:[1380,420],kind:"thought",fill:"surface",maxLines:2,as:"note"});
    kit.fit("Not my business", {role:"body",w:350,h:120,maxLines:2});
    const business = Loom.treat.bubble(ctx,"bubble_business",{x:1050,y:490,w:400,text:"Not my business",tail:[1390,490],kind:"thought",fill:"surface",maxLines:2,as:"note"});
    m.pop(wrong,ctx.cue("What if I'm wrong?"));
    m.pop(cost,ctx.cue("What will it cost me?"));
    m.pop(business,ctx.cue("Is it even my business?"));
    const release = ctx.cue("Is it even my business?") + ctx.style.dur("enter") + ctx.style.dur("move");
    maya.pose("idle",release,{dur:ctx.style.dur("move")});
    maya.emotion("focus",release);
    [wrong,cost,business].forEach(E => {
      Loom.tween(E.inner,{opacity:1},{opacity:0.35},release,{dur:ctx.style.dur("move"),ease:"move"});
      m.exit(E,ctx.speechEnd - ctx.style.dur("exit"),"recede");
    });
  }
});
