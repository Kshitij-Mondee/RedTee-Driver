// @design stalled_ascent: three arrivals meet a point while an attempted return is cancelled
// Treatments considered: static crossed return with signalling; paired receive/send panels; shared sky with stalled ascent. Chosen: shared sky, the incomplete travel is the refutation.
Loom.scene("b08", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const listen = ctx.cue("Your phone only listens");
    const nothing = ctx.cue("Nothing goes up");
    const quiet = ctx.cue("never learn where you are");
    const move = ctx.style.dur("move"), draw = ctx.style.dur("draw"), fade = ctx.style.dur("exit");
    // @form curved_ground: shared curved surface establishes the receiver station
    const ground = ctx.el("ground", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"none"});
    const earth = Loom.lesson.earth(ctx, ground.inner, {form:"arc",showPoint:true});
    ground.handle = earth;
    // @form receiving_point: the kit's existing teal point is owned separately for continuity
    const point = ctx.el("phone_pt", {x:912,y:764,w:96,h:96,kind:"node",exit:"none"});
    point.inner.appendChild(earth.point);
    earth.point.setAttribute("transform", "translate(-912 -764)");
    point.handle = earth;
    // @form quiet_array: three fixed overhead broadcasters remain unchanged
    const sats = ctx.el("sats", {x:300,y:35,w:1320,h:335,kind:"instrument",exit:"none"});
    const satelliteHandles = [];
    const positions = [[430,230],[1490,200],[980,110]];
    positions.forEach(function(p,i) {
      const g = Loom.svg("g", {transform:"translate("+(p[0]-300-108)+" "+(p[1]-35-66)+") scale(0.6)"}, sats.inner);
      satelliteHandles.push(Loom.lesson.gps_satellite(ctx,g,{state:"idle"}));
    });
    sats.handle = {setState:function(s,t,o){satelliteHandles.forEach(function(h){h.setState(s,t,o);});},members:satelliteHandles};
    // @form converging_pulses: real kit wavefronts travel only toward the receiver
    const incoming = ctx.el("incoming", {x:0,y:0,w:1920,h:900,kind:"connector",exit:"recede"});
    const signalHandles = [];
    positions.forEach(function(p,i) {
      const g = Loom.svg("g", {}, incoming.inner);
      const sig = Loom.lesson.signal(ctx,g,{from:p,to:[960,812],state:"pulse"});
      sig.travel(listen,ctx.beat.phrases[0].e-listen);
      signalHandles.push(sig);
    });
    incoming.handle = {setState:function(s,t,o){signalHandles.forEach(function(h){h.setState(s,t,o);});}};
    m.reveal(incoming,listen,{dur:move});
    m.exit(incoming,nothing,"recede");
    // @form stalled_return: an intentionally short upward arrow is cancelled before it reaches any satellite
    const up = ctx.el("up_arrow", {x:898,y:485,w:124,h:315,kind:"connector",exit:"recede"});
    const arrow = kit.arrow(up.inner,62,302,62,22,{stroke:"accent"});
    m.draw(arrow,nothing,{dur:draw});
    // @form cancellation: error colour crosses the incomplete return, not the receiving point
    const strike = Loom.treat.mark(ctx,"return_cancel",{x:960,y:642,size:76,kind:"no",t:nothing+draw+move});
    m.exit(up,quiet,"recede");
    m.exit(strike,quiet,"recede");
  }
});
