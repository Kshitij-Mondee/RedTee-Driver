// @design converging_inputs_one_owner: multiple inputs converge on one circled figure
// Treatments: A static fan with signalling; B sequential cards; C chosen accumulating hand arrows to a single owner. Motion exposes direction, not a list.
Loom.scene("b08", {
  build(ctx) {
    const {kit,m}=ctx;
    const DRAW=ctx.style.dur("draw");
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const dd=len=>DRAW*clamp(len/900,0.3,1.4);
    const hand=(g,d,o)=>kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
    const steps=ctx.held("steps");
    ctx.held("sam");
    ctx.held("desk");
    ctx.held("question");
    ctx.held("parking_lot");
    // @form input_group: three neutral pictograms represent the group, not new cast members
    const group=ctx.el("group",{x:620,y:425,w:330,h:96,kind:"icon",exit:"recede"});
    const tGroup=ctx.cue("say how it's decided");
    [45,165,285].forEach((cx,i)=>{
      const E=ctx.el("group_user_"+i,{x:cx-45,y:0,w:90,h:96,parent:group.inner,kind:"icon",exit:"recede"});
      kit.icon(E.inner,"user",{x:45,y:48,size:76,stroke:24*3.6/76,color:"ink"});
      m.draw(E,tGroup+i*ctx.style.dur("stagger"),{dur:dd(250)});
    });
    // @form single_owner: the approved cast bust sits on the existing desk line
    const priya=Loom.lesson.team_table.person(ctx,"Priya","neutral",{x:1000,y:390,size:300,name:"priya"});
    m.reveal(priya,ctx.cue("who calls it"),{dy:0,dur:ctx.style.dur("enter")});
    // @form converging_inputs: open marker arrows point from group to the owner, staying below the question
    const arrow=(name,x1,y1,x2,y2,cx,cy)=>{
      const a=Math.atan2(y2-cy,x2-cx),hs=22;
      const h1=[x2-hs*Math.cos(a-.5),y2-hs*Math.sin(a-.5)];
      const h2=[x2-hs*Math.cos(a+.5),y2-hs*Math.sin(a+.5)];
      const xs=[x1,x2,cx,h1[0],h2[0]],ys=[y1,y2,cy,h1[1],h2[1]];
      const bx=Math.floor(Math.min(...xs)-12),by=Math.floor(Math.min(...ys)-12);
      const E=ctx.el(name,{x:bx,y:by,w:Math.ceil(Math.max(...xs)+12)-bx,h:Math.ceil(Math.max(...ys)+12)-by,kind:"connector",exit:"recede"});
      const X=x=>+(x-bx).toFixed(1),Y=y=>+(y-by).toFixed(1);
      hand(E.inner,`M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner,`M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return E;
    };
    const tInput=ctx.cue("after hearing the group");
    [[665,527,994,590,780,670],[785,527,994,554,870,605],[905,527,994,518,955,540]].forEach((p,i)=>{
      const E=arrow("group_input_"+i,...p);
      m.draw(E,tInput+i*ctx.style.dur("stagger"),{dur:dd(420)});
    });
    // @form owner_circle: only the decision owner receives the accent
    const circle=ctx.el("priya_circle",{x:974,y:356,w:374,h:362,kind:"mark",exit:"recede"});
    hand(circle.inner,"M187 18 C284 18 356 92 356 179 C356 276 288 344 187 344 C85 344 18 276 18 179 C18 87 86 14 187 14 C211 14 240 10 263 12",{stroke:"accent",sw:5});
    const tDecides=ctx.cue("Priya decides");
    m.draw(circle,tDecides,{dur:dd(1060)});
    // @form owner_statement: the decision rule is written directly below the owner
    const f=kit.fit("Priya decides",{role:"lead",w:360,h:70,maxLines:1});
    const words=ctx.el("priya_words",{x:980,y:742,w:360,h:70,kind:"text",exit:"wipe"});
    kit.text(words.inner,"Priya decides",{role:"lead",x:10,y:6,w:340,h:58,maxLines:1,align:"center",valign:"middle",color:"ink"});
    m.unmask(words,tDecides,{dir:"ltr",dur:DRAW*clamp(13/14,.45,1.8)});
    steps.handle.tick(1,ctx.cue("the group")-ctx.style.dur("move"),{tone:"ink"});
  }
});
