// @design carried_velocity: a moving front gains a speed label that shares its displacement
// Treatments: static route with a speed callout; travelling front with a riding label; expanding rings. Choose the riding label, displacement remains the argument.
Loom.scene("b10", {
  build(ctx) {
    const wave = ctx.cue("It's a radio wave");
    const speed = ctx.cue("300,000 kilometres a second");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const pulse = ctx.held("pulse");
    const stamp = ctx.held("stamp");
    const move = ctx.style.dur("move");
    const dur = ctx.speechEnd - wave - move;
    pulse.handle.setState("pulse_tagged",wave,{dur:move});
    // @form continued_front: the existing pulse translates from world 607,424 to 784,618
    ctx.m.travel(pulse,wave,{x:177,y:194,dur:dur,ease:"linear"});
    ctx.m.travel(stamp,wave,{x:177,y:194,dur:dur,ease:"linear"});
    // @form trailing_streaks: three short parallel gold traces sit behind the moving wavefront
    const streaks = ctx.el("speed_streaks",{x:477,y:284,w:142,h:150,kind:"connector",exit:"recede"});
    [[12,40,88,124],[40,16,115,98],[12,84,60,137]].forEach(function(p){
      ctx.kit.line(streaks.inner,p[0],p[1],p[2],p[3],{stroke:"accent2",sw:4,opacity:0.65});
    });
    ctx.m.reveal(streaks,wave,{dur:ctx.style.dur("enter")});
    ctx.m.travel(streaks,wave,{x:177,y:194,dur:dur,ease:"linear"});
    // @form riding_speed: the single speed emphasis belongs to the travelling front
    ctx.kit.fit("about 300,000 km/s",{role:"body",w:430,h:80,maxLines:1});
    const tag = Loom.treat.label(ctx,"tag_speed",{x:900,y:420,text:"about 300,000 km/s",role:"body",tone:"accent",t:speed});
    ctx.m.travel(tag,wave,{x:177,y:194,dur:dur,ease:"linear"});
    tag.exit = "recede";
    // Handoff: pulse and stamp retain their kit handle and local endpoint 257,244.
    // Their element origins are now 527,374, hence the stable front is world 784,618.
    // ground, phone_pt, sats, pulse, stamp and tag_speed are available to b11.
  }
});
