// @design spread_control: one control tightens and opens two shared paths
// Treatments: static fork with signalling; a gauge with numerical readings; a dial that changes path spacing.
// Choose the changing spread because motion is the explanation, with no invented numerical scale.
Loom.scene("b15", {
  build(ctx) {
    const k=ctx.kit, m=ctx.m;
    const H=ctx.engine.hud(ctx,{name:"spread_hud",balance:false});
    const reply=ctx.held("reply_line"), fork=ctx.held("fork");
    const a=ctx.held("branch_a"), b=ctx.held("branch_b");
    const r30=ctx.held("reply_30"), r60=ctx.held("reply_60");
    const termAt=ctx.cue("called sampling");
    const dialAt=ctx.cue("temperature setting");
    const low=ctx.cue("steadier"), high=ctx.cue("more varied");
    const move=ctx.style.dur("move");
    const origin=a.geometry.origin;
    const initialA=origin.y-a.geometry.end.y;
    const initialB=b.geometry.end.y-origin.y;
    H.mode("briefing",ctx.start);
    // @form sampling_term: name the already visible branching choice
    const term=H.frame("sampling_term",{x:830,y:180,w:400,h:120,tone:"line",plate:true,at:termAt});
    k.fit("sampling",{role:"title",w:352,h:80,maxLines:1});
    k.text(term.E.inner,"sampling",{x:24,y:20,w:352,h:80,role:"title",color:ctx.c("ink"),maxLines:1});
    m.reveal(term.E,termAt);
    // @form dial: a qualitative setting with no invented numerical scale
    const D=H.frame("dial",{x:570,y:690,w:300,h:220,tone:"accent",plate:true,at:dialAt});
    k.path(D.E.inner,"M104,131 A65,65 0 1 1 196,131",{stroke:"accent",sw:3,fill:"none"});
    for(let i=0;i<10;i++){
      const angle=(-225+i*30)*Math.PI/180;
      k.line(D.E.inner,150+71*Math.cos(angle),85+71*Math.sin(angle),150+79*Math.cos(angle),85+79*Math.sin(angle),{stroke:"line",sw:2});
    }
    const needle=k.line(D.E.inner,150,85,150,36,{stroke:"accent",sw:4});
    k.disc(D.E.inner,150,85,6,{fill:"accent"});
    k.fit("temperature",{role:"label",w:252,h:40,maxLines:1});
    k.text(D.E.inner,"temperature",{x:24,y:166,w:252,h:40,role:"label",color:ctx.c("ink"),align:"center",maxLines:1});
    m.reveal(D.E,dialAt);
    m.emphasis(D.E,low);
    // One clock changes both branch geometries and the pointer. Cards remain the original kit instances.
    Loom.drive(function(e,raw){
      const elapsed=raw*(high+move-low);
      const p=Math.min(1,Math.max(0,elapsed/move));
      const q=Math.min(1,Math.max(0,(elapsed-(high-low))/move));
      const da=initialA+(100-initialA)*p+(220-100)*q;
      const db=initialB+(100-initialB)*p+(220-100)*q;
      a.inner.setAttribute("transform","translate(0,"+(initialA-da)+") scale(1,"+(da/initialA)+")");
      b.inner.setAttribute("transform","scale(1,"+(db/initialB)+")");
      needle.setAttribute("transform","rotate("+(-75*p+150*q)+" 150 85)");

    },low,high+move-low,"linear");
    m.travel(r30,low,{x:0,y:initialA-100,scale:1,dur:move});
    m.travel(r60,low,{x:0,y:100-initialB,scale:1,dur:move});
    m.travel(r30,high,{x:0,y:initialA-220,scale:1,dur:move});
    m.travel(r60,high,{x:0,y:220-initialB,scale:1,dur:move});
    const down=ctx.end-ctx.style.dur("exit");
    [reply,fork,a,b,r30,r60,term.E,D.E].forEach(function(E){ E.exit="recede"; H.power(E,"down",down); m.exit(E,down,"recede"); });
  }
});
