// @design receding_thresholds: a small opening propagates through a dark row, then meets resistance
// Treatments considered: static row with a labelled lead; perspective hall with spreading light; overhead map with travelling token. Chosen: perspective hall, because successive light changes carry the argument.
Loom.scene("b08", {
  build(ctx) {
    const {kit,m}=ctx;
    const other=ctx.cue("other systems"), termAt=ctx.cue("lateral movement"), hunt=ctx.cue("hunt for more access");
    // @form hall_planes: converging wall and floor establish distance
    const S=ctx.el("hall_set",{x:96,y:322,w:1728,h:570,kind:"scenery",exit:"recede"});
    kit.path(S.inner,"M0 0 L1640 198 L1728 252 L1728 570 L0 570 Z",{fill:"surface2"});
    kit.path(S.inner,"M0 490 L1640 250 L1728 300 L1728 570 L0 570 Z",{fill:"field2"});
    kit.path(S.inner,"M0 490 L1640 250 M0 0 L1640 198",{fill:"none",stroke:"line",sw:2});
    // @form receding_door_row: the same threshold at progressively smaller scales
    const D=ctx.el("hall_doors",{x:180,y:350,w:1360,h:480,kind:"group",exit:"recede"});
    const row=[{x:0,y:0,w:300},{x:322,y:60,w:240},{x:585,y:110,w:200},{x:808,y:148,w:165},{x:992,y:185,w:130},{x:1145,y:210,w:100}];
    const parts=row.map((p,i)=>Loom.lesson.door(ctx,D.inner,{x:p.x,y:p.y,w:p.w,shade:i*0.085,state:i===0?"cracked":"shut"}));
    D.handle={parts,setState:(s,t)=>parts.forEach((h)=>h.setState(s,t))};
    parts[1].setState("cracked",other);
    parts[2].setState("cracked",other+ctx.style.dur("stagger")*2);
    parts[3].setState("cracked",other+ctx.style.dur("stagger")*4);
    // @form joined_floor_light: hard-edged spill links the opened thresholds
    const L=ctx.el("spread_light",{x:350,y:707,w:730,h:135,kind:"scenery",exit:"recede"});
    const spill=kit.path(L.inner,"M0 101 L213 7 L365 42 L620 0 L730 18 L82 135 Z",{fill:"ink"});
    spill.setAttribute("opacity",0.12);
    m.unmask(L,other,{dur:ctx.style.dur("draw")});
    // @form privileged_threshold: a heavier last opening resists the attempt
    const H=ctx.el("heavy_door",{x:1550,y:550,w:228,h:276,kind:"instrument",exit:"recede"});
    H.handle=Loom.lesson.door(ctx,H.inner,{w:220,heavy:true,state:"shut",shade:0.12});
    H.handle.setState("turning",hunt);
    H.handle.setState("refused",hunt+ctx.style.dur("stagger"));
    H.handle.setState("turning",hunt+ctx.style.dur("stagger")*2);
    H.handle.setState("refused",hunt+ctx.style.dur("stagger")*3);
    m.travel(H,hunt,{x:-6,y:-4,scale:1.025,dur:ctx.style.dur("move")});
    // @form quiet_term: a definition above the physical evidence
    const T=ctx.el("term",{x:180,y:148,w:1120,h:138,kind:"text",exit:"wipe"});
    kit.fit("lateral movement",{role:"title",w:1080,h:110,maxLines:1});
    kit.text(T.inner,"lateral movement",{x:12,y:6,w:1080,h:110,role:"title",maxLines:1,color:"ink",weight:800});
    kit.rect(T.inner,12,124,470,5,{fill:"accent",r:0});
    m.unmask(T,termAt,{dur:ctx.style.dur("enter")});
  }
});
