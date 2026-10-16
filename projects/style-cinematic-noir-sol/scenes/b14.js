// @design lit_token_departure_continued: the same small object returns but every distant threshold holds
Loom.scene("b14", {
  build(ctx) {
    // Treatments: static replay with a verdict; reverse card travel and a corner phone; full corridor return.
    // Choose the reverse travel: replay the opening composition, then hold the closed thresholds.
    const tOn = ctx.cue("Replay the night");
    const tTry = ctx.cue("The leaked password is tried");
    const tDim = ctx.cue("fits nothing");
    const tRequest = ctx.cue("A request arrives");
    const tDeny = ctx.cue("denied");
    const tReport = ctx.cue("reported");
    const tShut = ctx.cue("Every door stays shut");
    const {m} = ctx;
    // @form replay_framing: preserve the original composition before a restrained closing pull back
    const shot = ctx.el("replay_framing",{x:0,y:0,w:1920,h:930,kind:"scenery",exit:"recede"});
    // @form night_office: a quiet depth room surrounds the evidence
    const room = ctx.el("night_office", {x:0,y:0,w:1920,h:930,parent:shot.inner,kind:"scenery",exit:"recede"});
    const st = ctx.depth("office_depth", {parent:room.inner,dolly:[ctx.start,ctx.end],push:0.06,drift:-26,focus:0.55,dof:5,atmosphere:0.45});
    const wall = st.layer(0.1);
    Loom.svg("rect",{x:-200,y:-200,width:2320,height:1480,fill:st.tone("surface2",0.1)},wall);
    const floor = st.layer(0.35);
    Loom.svg("path",{d:"M-200 720 L2120 650 L2120 1280 L-200 1280 Z",fill:st.tone("field2",0.35)},floor);
    Loom.svg("path",{d:"M1100 719 L1860 690 L2120 970 L1100 850 Z",fill:ctx.c("accent3"),opacity:0.025},floor);
    st.haze(0.4,670,"accent3");
    // @form login_screen: the identical intact sign-in under its own lamp
    const screen = ctx.el("login_screen",{x:100,y:190,w:1000,h:640,parent:shot.inner,kind:"instrument",exit:"recede"});
    screen.handle = Loom.lesson.login_screen(ctx,screen.inner,{w:1000,state:"empty"});
    screen.handle.setState("typing",tTry);
    screen.handle.setState("denied",tShut);
    // Semantic anchors share the screen's existing state, not duplicate drawings.
    // @form login_status: the safe refusal region of the monitor
    const status = ctx.el("login_status",{x:screen.handle.at.status.x-8,y:screen.handle.at.status.y-32,w:420,h:52,parent:screen.inner,kind:"anchor",exit:"recede"});
    status.handle = screen.handle;
    // @form clock: the same top bar time region of the monitor
    const clock = ctx.el("clock",{x:screen.handle.at.clock.x-110,y:screen.handle.at.clock.y-28,w:122,h:44,parent:screen.inner,kind:"anchor",exit:"recede"});
    clock.handle = screen.handle;
    const clockInk = Array.from(screen.handle.g.querySelectorAll("text")).filter(n=>n.textContent === "02:00");
    Loom.hold.heat(clockInk,tOn,{from:ctx.c("muted"),to:ctx.c("accent4"),dur:ctx.style.dur("enter"),attr:"fill"});
    // @form far_doors: the original closed systems, never turning or opening
    const doors = ctx.el("far_doors",{x:1250,y:285,w:510,h:270,kind:"scenery",parent:st.layer(0.2),exit:"recede"});
    [0,170,340].forEach((x,i)=>Loom.lesson.door(ctx,doors.inner,{x,y:i*9,w:150,shade:0.62+i*0.05,state:"shut"}));
    const p = screen.handle.at.password;
    // @form keycard: the identical copied notch pattern is tried at the password field
    const card = ctx.el("keycard",{x:1140,y:360,w:224,h:144,parent:shot.inner,kind:"token",exit:"recede"});
    card.handle = Loom.lesson.keycard(ctx,card.inner,{x:2,y:2,w:220,state:"copy",seed:"dana"});
    m.reveal(card,tTry,{dur:ctx.style.dur("enter")});
    m.travel(card,tTry,{x:100+p.x-28-card.x,y:190+p.y-18-card.y,scale:0.88,dur:ctx.style.dur("draw")*2});
    card.handle.setState("dim",tDim);
    m.exit(card,tReport,"recede");
    // @form bedroom_inset: a temporary corner view of the second factor, with readable kit text
    const inset = ctx.el("bedroom_inset",{x:1210,y:100,w:600,h:810,parent:shot.inner,kind:"instrument",exit:"recede"});
    Loom.svg("rect",{x:0,y:0,width:600,height:810,rx:6,fill:ctx.c("field"),stroke:ctx.c("line"),"stroke-width":2},inset.inner);
    // @form bedside_phone: one request is denied and reported on the dark nightstand
    const phone = ctx.el("bedside_phone",{x:30,y:16,w:540,h:791,parent:inset.inner,kind:"instrument",exit:"recede"});
    phone.handle = Loom.lesson.bedside_phone(ctx,phone.inner,{w:540,state:"dark",tilt:0});
    phone.handle.setState("prompt",tRequest);
    phone.handle.setState("pressed",tDeny);
    phone.handle.setState("denied",tReport);
    m.reveal(inset,tRequest,{dur:ctx.style.dur("enter")});
    phone.handle.setState("dark",tShut);
    m.exit(inset,tShut,"recede");
    // The final dolly eases away without shrinking the screen text below 30 px.
    m.travel(shot,tShut,{x:38,y:18,scale:0.96,dur:ctx.style.dur("draw")*3});
  }
});
