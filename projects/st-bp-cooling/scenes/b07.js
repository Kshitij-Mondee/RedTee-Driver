// @design facing_rows: mirrored edges define a shared passage
// Treatments considered: static edge signals; camera lean with paired leaders; rotating plan. Choose static signals after camera proof showed clipped held labels, orientation is the argument.
Loom.scene("b07", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);
    const tAir = ctx.cue("First link: the air");
    const tFront = ctx.cue("fronts facing fronts");
    const tBack = ctx.cue("backs facing backs");
    const hall = ctx.held("hall_section");
    const crah = ctx.held("crah_row");
    const water = ctx.held("water_loop");
    const roof = ctx.held("roof_cooler");
    const chain = ctx.held("heat_chain");
    chain.handle.highlight(1, tAir, tFront);
    const view = {x:0, y:0, w:1920, h:1080};
    [hall,crah,water,roof].forEach(E => Loom.cam.frame(E,view,tAir,ctx.style.dur("draw"),{margin:0}));
    // @form paired_fronts: inward edges and arrows identify a common passage
    const fronts = ctx.el("rack_fronts",{x:0,y:0,w:1920,h:960,kind:"mark",exit:"none"});
    D.draw(fronts,[].concat(W.line(760,420,760,710),W.line(940,420,940,710),W.arrow(766,460,808,460),W.arrow(934,460,892,460),W.path([[752,407],[760,407],[760,420]]),W.path([[948,407],[940,407],[940,420]])),{at:tFront,by:tFront+ctx.style.dur("enter"),parallel:true,pen:"accent"});
    [[695,365],[885,365]].forEach((p,i)=>{
      ctx.kit.fit("fronts",{role:"label",w:120,h:40,maxLines:1});
      const lab=ctx.el("front_label_"+i,{x:p[0],y:p[1],w:120,h:40,kind:"text",exit:"none",parent:fronts.inner});
      D.letter(lab,"fronts",{role:"label",size:24,align:"center",valign:"middle",at:tFront,by:tFront+ctx.style.dur("enter"),quick:true,pen:"accent"});
    });
    // @form paired_backs: outer edges have quieter leaders outside the slots
    const backs=ctx.el("rack_backs",{x:0,y:0,w:1920,h:960,kind:"mark",exit:"none"});
    D.draw(backs,[].concat(W.line(620,420,620,710),W.line(1080,420,1080,710),W.path([[620,420],[620,407],[600,407]]),W.path([[1080,420],[1080,407],[1100,407]])),{at:tBack,by:tBack+ctx.style.dur("enter"),parallel:true,pen:"muted"});
    [[500,365],[1080,365]].forEach((p,i)=>{
      ctx.kit.fit("backs",{role:"label",w:120,h:40,maxLines:1});
      const lab=ctx.el("back_label_"+i,{x:p[0],y:p[1],w:120,h:40,kind:"text",exit:"none",parent:backs.inner});
      D.letter(lab,"backs",{role:"label",size:24,align:"center",valign:"middle",at:tBack,by:tBack+ctx.style.dur("enter"),quick:true,pen:"muted"});
    });
    // @form aisle_boundaries: three empty outlined spaces distinguish the passages
    const aisles=ctx.el("aisle_marks",{x:0,y:0,w:1920,h:960,kind:"mark",exit:"none"});
    D.draw(aisles,[].concat(W.hidden([[510,480],[610,480],[610,700],[510,700],[510,480]]),W.hidden([[775,480],[925,480],[925,700],[775,700],[775,480]]),W.hidden([[1090,480],[1190,480],[1190,700],[1090,700],[1090,480]])),{at:tBack,by:tBack+ctx.style.dur("enter"),parallel:true,pen:"muted"});
    // Keep annotation geometry in the same sheet coordinates as the held parts.
  }
});
