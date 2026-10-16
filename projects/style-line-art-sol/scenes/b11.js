// @design persistent_outline: one coloured boundary changes its container while retaining its identity
// Treatments considered: static three-form comparison with signalling; sliding copies; one moving morph with faint historical ghosts. Choose the morph because unchanged colour is the argument.
Loom.scene("b11", {
  build(ctx) {
    const {kit, m} = ctx;
    const first = ctx.cue("The class travels with the information");
    const paperT = ctx.cue("on paper");
    const folderT = ctx.cue("in a folder");
    const screenT = ctx.cue("on a screen");
    const dur = ctx.style.dur("move") * 1.5;
    // @form travelling_boundary: the same outline moves between formats
    const E = ctx.el("morph_item", {x:220,y:320,w:1500,h:420,kind:"icon",exit:"recede"});
    const item = Loom.lesson.item(ctx,E.inner,{x:40,y:20,variant:"plain",cls:"confidential",label:false});
    E.handle = item;
    item.page.setAttribute("fill","none");
    m.reveal(E,first);
    Loom.drive(function(e){
      item.outline.setAttribute("pathLength","1");
      item.outline.setAttribute("opacity",e<=0 ? 0 : 1);
      if(e<1){item.outline.setAttribute("stroke-dasharray",e+" 2");item.outline.setAttribute("stroke-dashoffset","0");}
      else {item.outline.removeAttribute("stroke-dasharray");item.outline.removeAttribute("stroke-dashoffset");}
    },first,ctx.style.dur("draw"),"move");
    Loom.morph.chain(item.outline,[item.folderOutline,item.screenOutline],[folderT,screenT],{dur:dur});
    function p(t,a) {return Math.max(0,Math.min(1,(t-a)/dur));}
    function ease(v) {return v*v*(3-2*v);}
    Loom.drive(function(e,raw) {
      const t=ctx.start+raw*(ctx.end-ctx.start);
      const f=ease(p(t,folderT)), s=ease(p(t,screenT));
      const x=40+520*f+520*s, y=20+30*f-30*s;
      const sx=1+0.3*f+0.2*s, sy=1-0.2*f+0.1*s;
      item.g.setAttribute("transform","translate("+x+" "+y+") scale("+sx+" "+sy+")");
      const rowsIn=Math.max(0,Math.min(1,(t-first-ctx.style.dur("draw")*0.4)/(ctx.style.dur("draw")*0.6)));
      item.rows.forEach(function(row){row.setAttribute("opacity",rowsIn*(1-f));});
    },ctx.start,ctx.end-ctx.start,"linear");
    // @form previous_paper: a faint record of the first format
    const PG=ctx.el("paper_ghost",{x:260,y:340,w:284,h:364,kind:"icon",exit:"recede"});
    const pg=Loom.lesson.item(ctx,PG.inner,{variant:"plain",cls:"confidential",label:false});
    pg.page.setAttribute("fill","none"); pg.g.setAttribute("opacity",0.18);
    m.reveal(PG,folderT);
    // @form previous_folder: a faint record of the second format
    const FG=ctx.el("folder_ghost",{x:780,y:370,w:368,h:292,kind:"icon",exit:"recede"});
    const fg=Loom.lesson.item(ctx,FG.inner,{variant:"plain",cls:"confidential",label:false});
    fg.outline.setAttribute("d",fg.folderOutline); fg.page.setAttribute("fill","none");
    fg.rows.forEach(function(row){row.setAttribute("opacity",0);});
    fg.g.setAttribute("transform","scale(1.3 0.8)"); fg.g.setAttribute("opacity",0.18);
    m.reveal(FG,screenT);
    // @form page_on_screen: the information remains visible in its latest container
    const SP=ctx.el("screen_page",{x:1435,y:372,w:158,h:202,kind:"icon",exit:"recede"});
    const sp=Loom.lesson.item(ctx,SP.inner,{scale:0.55,variant:"plain",cls:"confidential",label:false});
    sp.page.setAttribute("fill","none");
    m.reveal(SP,screenT+dur);
    // @form format_labels: each label stays with its historical position
    kit.fit("Paper",{role:"label",w:220,h:48,maxLines:1});
    Loom.treat.label(ctx,"paper_label",{x:340,y:764,text:"Paper",role:"label",tone:"ink",t:paperT});
    kit.fit("Folder",{role:"label",w:220,h:48,maxLines:1});
    Loom.treat.label(ctx,"folder_label",{x:890,y:764,text:"Folder",role:"label",tone:"ink",t:folderT});
    kit.fit("Screen",{role:"label",w:220,h:48,maxLines:1});
    Loom.treat.label(ctx,"screen_label",{x:1435,y:764,text:"Screen",role:"label",tone:"ink",t:screenT});
  }
});
