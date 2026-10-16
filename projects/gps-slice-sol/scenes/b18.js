// @design broken_assumption: a steady instrument beside a fixed point slips out of agreement
// Treatments: static badge with signalling; a local instrument changing state; a full-frame instrument cut. Choose the local state change to keep the working picture intact.
Loom.scene("b18", {
  build(ctx) {
    const arrival = ctx.cue("Because all of this assumed");
    const exact = ctx.cue("knows the exact time");
    const broken = ctx.cue("It doesn't");
    const move = ctx.style.dur("move");
    const enter = ctx.style.dur("enter");
    const fade = ctx.style.dur("exit");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const a = ctx.held("circle_a");
    const b = ctx.held("circle_b");
    const c = ctx.held("circle_c");
    [ground,point,sats,a,b,c].forEach(function(E) { if(E) E.exit = "recede"; });
    // @form local_timekeeper: a quartz instrument sits beside the established receiver
    const badge = ctx.el("phone_clock",{x:1040,y:650,w:144,h:160,kind:"instrument",exit:"recede"});
    const inset = Loom.svg("g",{transform:"translate(12 18)"},badge.inner);
    const clock = Loom.lesson.clock_face(ctx,inset,{size:120,finish:"quartz"});
    badge.handle = clock;
    // A shallow common push preserves the shared geometry around the receiver.
    const framing = [[ground,0,0],[point,912,764],[sats,300,35],[a,0,0],[b,0,0],[c,0,0],[badge,1040,650]];
    framing.forEach(function(row) {
      if(row[0]) ctx.m.travel(row[0],arrival,{x:(row[1]-960)*0.04,y:(row[2]-812)*0.04,scale:1.04,dur:ctx.speechEnd-arrival});
    });
    ctx.m.pop(badge,arrival,{dur:enter});
    clock.setState("steady",arrival,{dur:move});
    clock.run(arrival,ctx.speechEnd);
    clock.setState("steady",exact,{dur:move});
    clock.setState("off",broken,{dur:fade});
    // The receiver flickers through its own held kit handle, without drawing a replacement.
    if(point && point.handle) {
      point.handle.setState("disc",broken,{dur:fade/2});
      point.handle.setState("arc",broken+fade/2,{dur:fade/2});
      point.handle.setState("disc",broken+fade,{dur:fade/2});
      point.handle.setState("arc",broken+fade*1.5,{dur:fade/2});
    }
  }
});
