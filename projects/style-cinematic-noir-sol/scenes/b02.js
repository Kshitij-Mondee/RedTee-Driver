// @design lit_token_departure: one small light leaves an intact object and points toward distant closed thresholds
Loom.scene("b02", {
  build(ctx) {
    // Treatments: static screen with a signalled card; card lifting into a depth room; full corridor tracking.
    // Choose the lift: the moving object establishes the device without an unnecessary scene change.
    const tOn = ctx.cue("Nobody broke in");
    const tLift = ctx.cue("Follow that one password");
    const tDoors = ctx.cue("two habits");
    const {m} = ctx;
    // @form night_office: a quiet depth room surrounds the evidence
    const room = ctx.el("night_office", {x:0,y:0,w:1920,h:930,kind:"scenery",exit:"recede"});
    const st = ctx.depth("office_depth", {parent:room.inner,dolly:[ctx.start,ctx.end],push:0.06,drift:-26,focus:0.55,dof:5,atmosphere:0.45});
    const wall = st.layer(0.1);
    Loom.svg("rect",{x:-200,y:-200,width:2320,height:1480,fill:st.tone("surface2",0.1)},wall);
    const floor = st.layer(0.35);
    Loom.svg("path",{d:"M-200 720 L2120 650 L2120 1280 L-200 1280 Z",fill:st.tone("field2",0.35)},floor);
    Loom.svg("path",{d:"M1100 719 L1860 690 L2120 970 L1100 850 Z",fill:ctx.c("accent3"),opacity:0.025},floor);
    st.haze(0.4,670,"accent3");
    // @form login_screen: intact sign-in under its own lamp
    const screen = ctx.el("login_screen",{x:100,y:190,w:1000,h:640,kind:"instrument",exit:"recede"});
    screen.handle = Loom.lesson.login_screen(ctx,screen.inner,{w:1000,state:"success"});
    screen.handle.setState("success",tOn);
    // Semantic anchors share the screen's existing state, not duplicate drawings.
    // @form login_status: the successful verdict region of the monitor
    const status = ctx.el("login_status",{x:screen.handle.at.status.x-8,y:screen.handle.at.status.y-32,w:420,h:52,parent:screen.inner,kind:"anchor",exit:"recede"});
    status.handle = screen.handle;
    // @form clock: the top bar time region of the monitor
    const clock = ctx.el("clock",{x:screen.handle.at.clock.x-110,y:screen.handle.at.clock.y-28,w:122,h:44,parent:screen.inner,kind:"anchor",exit:"recede"});
    clock.handle = screen.handle;
    // @form far_doors: closed systems at a distant wall, deliberately unlabelled
    const doors = ctx.el("far_doors",{x:1250,y:285,w:510,h:270,kind:"scenery",parent:st.layer(0.2),exit:"recede"});
    [0,170,340].forEach((x,i)=>Loom.lesson.door(ctx,doors.inner,{x,y:i*9,w:150,shade:0.62+i*0.05,state:"shut"}));
    m.reveal(doors,tDoors,{dur:ctx.style.dur("enter")});
    const p = screen.handle.at.password;
    // @form keycard: the password becomes the sole amber travelling object
    const card = ctx.el("keycard",{x:100+p.x-28,y:190+p.y-18,w:224,h:144,kind:"token",exit:"recede"});
    card.handle = Loom.lesson.keycard(ctx,card.inner,{x:2,y:2,w:220,state:"lit",seed:"dana"});
    m.reveal(card,tLift,{dur:ctx.style.dur("enter")});
    m.travel(card,tLift,{x:1140-card.x,y:360-card.y,scale:0.88,dur:ctx.style.dur("draw")*3});
  }
});
