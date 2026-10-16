// @design quiet_surface_repeated_interruptions: repeated layers accumulate on a single lit object, then one deliberate refusal clears them
/* Treatments considered: static object with signalling; close-up with stacked interruptions; room-wide travelling notices. Chosen: close-up stacks, because repetition is the mechanism. */
Loom.scene("b12", {
  build(ctx) {
    const c = (token) => ctx.c(token);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    const first = ctx.cue("approval requests");
    const repeat = ctx.cue("again and again");
    const notice = ctx.cue("did not start");
    const refuse = ctx.cue("Deny it");
    const report = ctx.cue("report it");
    const st = ctx.depth("bedroom_set", {dolly:[ctx.start,ctx.end],push:0.035,drift:-20,focus:0.55,dof:4,atmosphere:0.45,cx:1100,cy:520});
    // @form recessed_wall: unlit surroundings establish the small screen as the only source
    const wall = ctx.el("bedroom_set", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"recede",parent:st.layer(0.1)});
    svg("rect", {x:0,y:0,width:1920,height:1080,fill:c("field")}, wall.inner);
    svg("rect", {x:140,y:210,width:720,height:520,rx:18,fill:st.tone("surface2",0.1)}, wall.inner);
    svg("rect", {x:160,y:230,width:680,height:480,rx:12,fill:st.tone("surface",0.1)}, wall.inner);
    // @form resting_planes: pillow and mattress recede into darkness with no occupant
    const bed = ctx.el("bedroom_edge", {x:150,y:460,w:750,h:420,kind:"scenery",exit:"recede",parent:st.layer(0.4)});
    svg("path", {d:"M0 130 L650 110 L750 370 L0 420 Z",fill:st.tone("surface2",0.4)},bed.inner);
    svg("path", {d:"M50 45 Q140 0 295 34 L340 128 Q180 150 25 112 Z",fill:st.tone("surface",0.4)},bed.inner);
    svg("path", {d:"M0 144 L645 122",fill:"none",stroke:c("line"),"stroke-width":2,opacity:0.16},bed.inner);
    // @form screen_spill: hard cool light lands on the adjoining surface, not across the room
    const spill = ctx.el("screen_spill", {x:900,y:500,w:780,h:365,kind:"scenery",exit:"recede"});
    const light = svg("g", {opacity:0}, spill.inner);
    svg("path", {d:"M320 0 L520 20 L780 365 L0 365 Z",fill:c("accent3"),opacity:0.07},light);
    Loom.tween(light,{opacity:0},{opacity:1,duration:ctx.style.dur("enter")},first,{kind:"reveal",name:"cool_light",beat:ctx.beat.id});
    // @form bedside_device: the kit owns every screen layer and all its words
    const phone = ctx.el("phone", {x:1000,y:85,w:560,h:820,kind:"instrument",exit:"recede"});
    phone.handle = Loom.lesson.bedside_phone(ctx,phone.inner,{w:560,tilt:0,state:"dark"});
    phone.handle.setState("prompt",first);
    phone.handle.setState("prompt2",repeat);
    phone.handle.setState("prompt3",repeat + ctx.style.dur("move"));
    // Each extra interruption briefly strengthens the same source, never a second emphasis.
    [repeat,repeat + ctx.style.dur("move")].forEach((t,i) => {
      Loom.tween(light,{opacity:1},{opacity:1.5,duration:ctx.style.dur("stagger")},t,{kind:"ambient",name:"screen_pulse_"+i,beat:ctx.beat.id});
      Loom.tween(light,{opacity:1.5},{opacity:1,duration:ctx.style.dur("stagger")},t+ctx.style.dur("stagger"),{kind:"ambient",name:"screen_return_"+i,beat:ctx.beat.id});
    });
    // @form action_rim: one amber emphasis frames the refusal already drawn by the kit
    const deny = ctx.el("deny_button",{x:1154,y:519,w:252,h:96,kind:"scenery",exit:"recede"});
    svg("rect",{x:4,y:4,width:244,height:88,rx:16,fill:"none",stroke:c("accent"),"stroke-width":4,opacity:0.75},deny.inner);
    ctx.m.reveal(deny,notice,{dur:ctx.style.dur("stagger")});
    ctx.m.exit(deny,refuse,"recede");
    phone.handle.setState("pressed",refuse);
    phone.handle.setState("denied",report);
    // The Reported verdict stays readable through the narration's final pause. The next station is a cut.
  }
});
