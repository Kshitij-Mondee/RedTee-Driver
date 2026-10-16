// @design shared_key_bridge: one token connects two independent containers
Loom.scene("b01", {
  build(ctx, props) {
    /* Treatments: static twin forms with a signal; token travels across the two forms; camera follows a field.
       Choose token travel: its unchanged identity is the argument, with no camera motion while typing. */
    const W = ctx.engine;
    const arrive = ctx.cue("Say your colleague Sam");
    const shopCue = ctx.cue("old shopping site");
    const workCue = ctx.cue("the same one at work");
    // @form paired_signin: the same neutral form in two separate browser windows
    const shop = W.app(ctx, "shop", {
      chrome: "browser", url: "shop.example",
      frame: {x:96, y:268, w:800, h:584},
      content: [{id:"login", kind:"form", cols:1, fields:[
        {id:"email", label:"Email", value:"Sam"},
        {id:"password", label:"Password", kind:"password", value:""}
      ], actions:[{id:"signin",label:"Sign in",kind:"primary"}]}]
    }, {at:arrive, exit:"none"});
    const work = W.app(ctx, "work", {
      chrome: "browser", url: "signin.company.example",
      frame: {x:1024, y:268, w:800, h:584},
      content: [{id:"login", kind:"form", cols:1, fields:[
        {id:"email", label:"Email", value:"Sam"},
        {id:"password", label:"Password", kind:"password", value:""}
      ], actions:[{id:"signin",label:"Sign in",kind:"primary"}]}]
    }, {at:arrive, exit:"none"});
    // @form password_identity: one unchanged masked token shared by both sign-ins
    const chip = ctx.el("chip", {x:366,y:176,w:260,h:56,kind:"token",exit:"none"});
    chip.kit = Loom.lesson.password_chip(ctx, chip.inner, {state:"empty"});
    ctx.m.reveal(chip, shopCue);
    chip.kit.pill.setAttribute("stroke", ctx.c("accent2"));
    chip.kit.type(shopCue);
    shop.type("login.password", "********", {at:shopCue});
    shop.pointerOut(workCue);
    work.type("login.password", "********", {at:workCue});
    ctx.m.travel(chip, workCue, {x:464,y:0,scale:1});
    ctx.m.emphasis(chip, workCue);
  }
});
