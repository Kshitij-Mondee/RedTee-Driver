// @design framed_control_path: one persistent surface is entered through a menu and narrowed to one action
Loom.scene("b07", {
  build(ctx) {
    /* Treatments: static settings page with one signal; pointer-led menu and page; detached action cards.
       Choose pointer-led menu and page: the viewer sees where each action happens in the same shell. */
    const A = ctx.engine.resume(ctx,"app");
    // The prior proof card is plain scene content, not a native dialog.
    ctx.m.exit(ctx.held("codestep"),ctx.start);
    ctx.m.exit(ctx.held("codeveil"),ctx.start);
    ctx.m.exit(ctx.held("chip"),ctx.start);
    const k = ctx.kit;
    const open = ctx.cue("open Security settings");
    const find = ctx.cue("Find two-step sign-in");
    const turn = ctx.cue("Turn on");
    // @form fixed_chapter_strip: screen-space chapter navigation remains unchanged across the walkthrough
    const chapters = ctx.el("chapters",{x:0,y:0,w:1920,h:150,kind:"label",exit:"none"});
    k.rect(chapters.inner,0,0,1920,150,{fill:"field",stroke:"none",r:0});
    const labels = ["Why","Two-step sign-in","Password manager","Lost phone"];
    const widths = [88,250,290,184];
    let x = 96;
    const fills = [];
    const words = [];
    labels.forEach((label,i) => {
      k.fit(label,{role:"caption",w:widths[i]-24,h:40,maxLines:1});
      fills.push(k.pill(chapters.inner,x,82,widths[i],52,{fill:i===1?"accent2":"surface",stroke:i===1?"accent2":"field2"}));
      words.push(k.text(chapters.inner,label,{x:x+12,y:88,w:widths[i]-24,h:40,role:"caption",size:24,maxLines:1,color:i===1?"onAccent":"muted",weight:600}));
      x += widths[i]+12;
    });
    ctx.m.reveal(chapters,ctx.start);
    // @form step_instruction: one stable instruction above the application
    const step = ctx.el("step",{x:1108,y:20,w:708,h:52,kind:"label",exit:"recede"});
    k.fit("1  Turn on two-step sign-in",{role:"label",w:676,h:40,maxLines:1});
    k.pill(step.inner,0,0,708,52,{fill:"shadow"});
    k.text(step.inner,"1  Turn on two-step sign-in",{x:16,y:6,w:676,h:40,role:"label",size:24,color:"onAccent",maxLines:1,weight:600});
    ctx.m.reveal(step,ctx.start);
    // @form native_click_controller: the app owns the finite press rings so there is no duplicate teaching mark
    A.pointer(ctx.start,{x:1240,y:400});
    const selected = A.click("nav.security",{at:open,dx:20});
    A.pointerOut(open + ctx.style.dur("move"));
    // Retire the sign-in page before the settings surface arrives.
    A.go("walkthrough",ctx.start);
    // Plain settings page within the held browser, no close-icon dependency.
    const settings = ctx.el("security_panel",{x:320,y:232,w:1060,h:620,kind:"instrument",exit:"recede",overlaps:["app"]});
    k.rect(settings.inner,0,0,1060,620,{fill:"surface2",r:0});
    k.text(settings.inner,"Security settings",{x:32,y:30,w:960,h:52,role:"lead",size:36,color:"ink",weight:600});
    k.rect(settings.inner,32,128,992,160,{fill:"surface",stroke:"field2",r:12});
    k.text(settings.inner,"Two-step sign-in",{x:60,y:180,w:628,h:56,role:"lead",size:36,color:"ink",weight:600});
    k.rect(settings.inner,758,176,234,64,{fill:"accent",r:10});
    k.text(settings.inner,"Turn on",{x:780,y:186,w:190,h:44,role:"lead",size:32,color:"onAccent",weight:600,maxLines:1});
    ctx.m.reveal(settings,selected);
    // A screen-space pointer stays above the plain page, unlike the shell's pointer layer.
    A.pointerOut(find);
    const pointer = ctx.el("settings_pointer",{x:201,y:334,w:44,h:48,kind:"icon",exit:"recede",overlaps:["app","security_panel"]});
    Loom.svg("path",{d:"M 2 2 L 2 36 L 11 28 L 19 44 L 26 40 L 18 25 L 31 24 Z",fill:ctx.c("ink"),stroke:ctx.c("onAccent"),"stroke-width":2},pointer.inner);
    ctx.m.reveal(pointer,find);
    ctx.m.travel(pointer,find,{x:549,y:110});
    ctx.m.travel(pointer,turn-1.0,{x:994,y:106});
    ctx.m.press(pointer,turn);
    const ring = ctx.el("click_ring",{x:1168,y:412,w:64,h:64,kind:"icon",exit:"iris",overlaps:["security_panel","app"]});
    ring.handle = A;
    const mark = k.disc(ring.inner,32,32,27,{fill:"none"});
    mark.setAttribute("stroke",ctx.c("accent2"));
    mark.setAttribute("stroke-width",3);
    ctx.m.reveal(ring,turn);
    ctx.m.exit(ring,turn+ctx.style.dur("move"),"iris");
    Loom.sfx("click",turn);
    // b08 replaces this plain page with its method picker. The shell's content stays clear.
  }
});
