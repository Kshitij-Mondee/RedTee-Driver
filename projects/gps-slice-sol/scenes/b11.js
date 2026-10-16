// @design counted_arrival: a moving front and a rising value stop together at one receiving point
// Treatments: static signalled time label; independent stopwatch; linked readout with a shared stop. Choose the shared stop, the count and arrival are one event.
Loom.scene("b11", {
  build(ctx) {
    const open = ctx.cue("From straight overhead");
    const trip = ctx.cue("the trip takes");
    const arrive = ctx.cue("about 0.07 seconds");
    const move = ctx.style.dur("move"), enter = ctx.style.dur("enter"), exit = ctx.style.dur("exit");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const pulse = ctx.held("pulse");
    const stamp = ctx.held("stamp");
    // b10's stable endpoint is 784,618, about two thirds from 430,230 to 960,812.
    // @form last_stretch: continue the existing front, never draw another travelling pulse
    Loom.drive(function(e){
      const displacement = "translate("+(176*e)+" "+(194*e)+")";
      pulse.inner.setAttribute("transform",displacement);
      stamp.inner.setAttribute("transform",displacement);
    },trip,arrive-trip,"linear");
    pulse.handle.setState("absorbed",arrive,{dur:exit});
    ctx.m.exit(pulse,arrive,"recede");
    ctx.m.exit(stamp,arrive,"recede");
    // @form linked_readout: a quiet thin line ends at the panel, anchored at the receiver
    const link = ctx.el("readout_link",{x:960,y:644,w:342,h:170,kind:"connector",exit:"none"});
    const linkPath = ctx.kit.path(link.inner,"M0 168 L96 168 L242 0 L340 0",{stroke:"line",sw:3,fill:"none"});
    ctx.m.draw(linkPath,open,{dur:ctx.style.dur("draw")});
    // @form readout_shell: the phone kit's readout body opens beside the receiver
    const readout = ctx.el("readout",{x:1300,y:520,w:500,h:274,kind:"instrument",exit:"none"});
    ctx.kit.fit("about 0.07 s",{role:"lead",w:464,h:100,maxLines:1});
    const phone = Loom.lesson.phone(ctx,readout.inner,{form:"readout",rows:["arrival time","sending time","speed of light"],timerTo:0.07,fmt:function(v){return "about "+v.toFixed(2);},unit:"s"});
    readout.handle = phone;
    // These next-beat script rows remain hidden until b12 activates them.
    phone.rows.forEach(function(row){ row.g.setAttribute("opacity","0"); });
    // @form stopped_count: the kit's own running text has a separate continuity owner
    const timer = ctx.el("timer",{x:1318,y:536,w:464,h:64,kind:"value",exit:"none"});
    Array.from(phone.g.querySelectorAll("text")).filter(function(txt){return txt.parentNode === phone.g.firstChild;}).forEach(function(txt){
      timer.inner.appendChild(txt);
      txt.setAttribute("transform","translate(-18 -16)");
      txt.setAttribute("font-family","sans-serif");
    });
    timer.handle = phone;
    ctx.m.reveal(readout,open,{dur:enter});
    ctx.m.reveal(timer,open,{dur:enter});
    phone.setState("readout_timer",trip,{to:0.07,dur:arrive-trip,stop:true});
    // @form received_stamp: replace the retired riding chip with the same kit chip after its exit
    const chip = ctx.el("stamp_chip",{x:1470,y:690,w:170,h:80,kind:"token",exit:"none"});
    const received = Loom.lesson.signal(ctx,chip.inner,{from:[85,-110],to:[85,-110],state:"pulse"});
    const clockChip = received.chips[1];
    chip.inner.appendChild(clockChip.g);
    received.g.style.display = "none";
    if(clockChip.tx) clockChip.tx.style.display = "none";
    if(clockChip.ta) clockChip.ta.style.display = "none";
    chip.handle = received;
    received.setState("pulse_tagged",arrive+exit,{dur:move});
    ctx.m.drop(chip,arrive+exit,{dur:enter});
  }
});
