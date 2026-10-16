// @design copied_token_stalled: the returning token reaches a second barrier instead of opening the waiting surface
Loom.scene("b24", {
  build(ctx) {
    /* Treatments: static comparison with a stop mark; replay the pointer and stop the token; follow the token with a camera.
       Choose the replay, since the changed ending is the argument. */
    const back = ctx.cue("Back to Sam");
    const reused = ctx.cue("The same leaked password");
    const stop = ctx.cue("stops at the code screen");
    const A = ctx.engine.resume(ctx,"app");
    const app = ctx.held("app");
    A.zoomOut({at:ctx.start,dur:ctx.style.dur("move")});
    A.pointerOut(ctx.start);
    A.setValue("code.current","",ctx.start);
    // @form replay_login: a sign-in dialog reuses the existing account window for the callback
    const login = ctx.engine.app(ctx,"signin_replay",{
      chrome:"browser",url:"signin.company.example",sidebarW:0,
      frame:{x:520,y:190,w:920,h:650},page:{title:"Sign in"},
      content:[{id:"login",kind:"form",fields:[{id:"user",label:"Company account",value:"Sam"},{id:"password",label:"Password",value:"",kind:"password"}],actions:[{id:"signin",label:"Sign in",kind:"primary"}]}]
    },{at:back});
    login.type("login.password","********",{at:reused,click:true});
    login.click("login.action.signin",{at:ctx.cue("and this time")});
    login.pointerOut(stop);
    ctx.m.exit(login.E,stop,"recede");
    // @form returning_masked_token: the same kit token stays visible as it reaches the code barrier
    const chip = ctx.el("chip",{x:160,y:530,w:312,h:68,kind:"token",exit:"recede"});
    chip.kit = Loom.lesson.password_chip(ctx,chip.inner,{w:312,state:"masked"});
    chip.handle = chip.kit;
    ctx.m.reveal(chip,back);
    chip.handle.setState("masked",back);
    ctx.m.travel(chip,reused,{x:32,y:0,scale:1});
    chip.handle.setState("stopped",stop);
    ctx.m.emphasis(chip,stop);
    // @form code_counterpart: the authenticator is the independent second step
    const phone = ctx.el("phone",{x:1500,y:220,w:306,h:612,kind:"instrument",exit:"none"});
    phone.kit = Loom.lesson.phone(ctx,phone.inner,{w:306,state:"code",code:"482159"});
    phone.handle = phone.kit;
    ctx.m.reveal(phone,stop);
    A.spotlight("code",{at:stop,dur:ctx.style.dur("draw")*3,pad:12});
    void app;
  }
});
