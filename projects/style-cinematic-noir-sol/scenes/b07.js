// @design identical_entries: a quiet lit register gives every entry the same visual weight, then a passing trace disappears
// Three treatments: static register with a brief signal; scrolling document; rows assembled on a desk. Choose the static register with reading-order row reveals, because sameness is the argument.
Loom.scene("b07", {
  build(ctx) {
    const kit = ctx.kit, m = ctx.m, c = t => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    const rowsAt = ctx.cue("looks like Dana");
    const markAt = ctx.cue("harder to notice");
    const st = ctx.depth("inside_room", {dolly:[ctx.start,ctx.end],push:0.035,drift:-18,focus:0.55,dof:4,atmosphere:0.45});
    // @form night_wall: the inside room stays unlit around the evidence
    const wall = ctx.el("inside_wall", {x:-200,y:-200,w:2320,h:1480,kind:"scenery",exit:"recede",parent:st.layer(0.1)});
    kit.rect(wall.inner,0,0,2320,1480,{fill:"field"});
    // @form desk_plane: a security desk grounds the register in a real place
    const desk = ctx.el("security_desk", {x:200,y:650,w:1500,h:275,kind:"scenery",exit:"recede",parent:st.layer(0.55)});
    svg("polygon",{points:"85,0 1420,0 1500,110 0,110",fill:c("surface")},desk.inner);
    kit.rect(desk.inner,0,110,1500,165,{fill:"surface2"});
    kit.line(desk.inner,12,110,1490,110,{stroke:"line",sw:2});
    // @form hard_light_plane: lamp light lands behind the pane rather than becoming an amber wash
    const plane = ctx.el("lit_plane", {x:375,y:195,w:1270,h:555,kind:"scenery",exit:"recede",parent:st.layer(0.54)});
    svg("polygon",{points:"0,20 1190,0 1270,555 12,555",fill:Loom.style.mix(c("surface"),c("ink"),0.18)},plane.inner);
    // @form desk_lamp: a visible warm-white source with its bulb attached to its shade
    const lamp = ctx.el("desk_lamp", {x:230,y:360,w:170,h:340,kind:"scenery",exit:"recede",parent:st.layer(0.55)});
    kit.rect(lamp.inner,20,319,130,17,{fill:"surface"});
    kit.line(lamp.inner,84,320,84,150,{stroke:"line",sw:7});
    kit.line(lamp.inner,84,150,124,65,{stroke:"line",sw:7});
    svg("polygon",{points:"66,20 138,20 163,75 40,75",fill:c("surface")},lamp.inner);
    svg("ellipse",{cx:102,cy:75,rx:58,ry:7,fill:c("ink"),opacity:0.65},lamp.inner);
    // @form neutral_log_pane: the software register has no alarm or verdict treatment
    const pane = Loom.treat.panel(ctx,"log_pane",{x:420,y:225,w:1160,h:460,title:"",fill:"surface",tone:"ink",t:ctx.start});
    // @form log_title: evidence uses sans serif rather than a story headline
    const heading = ctx.el("log_heading",{x:40,y:20,w:1080,h:78,kind:"text",exit:"wipe",parent:pane.inner});
    kit.fit("sign-ins",{role:"lead",w:1056,h:58,maxLines:1,weight:700});
    kit.text(heading.inner,"sign-ins",{x:12,y:7,w:1056,h:58,role:"lead",size:40,color:"ink",weight:700,maxLines:1});
    m.reveal(heading,ctx.start);
    kit.line(pane.inner,40,100,1120,100,{stroke:"line",sw:2});
    const times = ["08:57","12:14","17:40","02:00"];
    times.forEach((time,i) => {
      // @form identical_log_row: all times, users and outcomes share identical ink and spacing
      const row = ctx.el(i === 3 ? "row_0200" : "log_row_"+i,{x:40,y:118+i*78,w:1080,h:64,kind:"text",exit:"wipe",parent:pane.inner});
      [[time,12,260],["dana",382,260],["success",752,300]].forEach(([text,x,w]) => {
        kit.fit(text,{role:"body",w:w-24,h:44,maxLines:1,weight:500});
        kit.text(row.inner,text,{x:x+12,y:10,w:w-24,h:44,role:"body",size:36,color:"ink",weight:500,maxLines:1});
      });
      m.reveal(row,rowsAt+i*ctx.style.dur("stagger"));
    });
    // @form passing_trace: a faint underline sweeps once and vanishes, never a warning
    const trace = ctx.el("row_0200_trace",{x:484,y:638,w:112,h:5,kind:"instrument",exit:"wipe"});
    const stroke = svg("rect",{x:0,y:0,width:0,height:3,fill:c("accent"),opacity:0},trace.inner);
    Loom.drive((e) => {
      stroke.setAttribute("width",112*Math.min(1,e*1.6));
      stroke.setAttribute("opacity",0.22*Math.sin(Math.PI*e));
    },markAt,ctx.style.dur("draw"),"linear",{key:"b07_passing_trace"});
  }
});
