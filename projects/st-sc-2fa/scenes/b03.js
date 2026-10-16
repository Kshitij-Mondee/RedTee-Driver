// @design paired_switches: two small changes make a stronger boundary
/* Treatments: static settings with a signal; two toggles flipping; a pointer-led walkthrough. Choose toggle motion for this short promise, not a setup demonstration. */
Loom.scene("b03", {
  build(ctx) {
    const pageAt = ctx.cue("Two settings");
    const onAt = ctx.cue("a few minutes");
    const freeze = ctx.cue("stops being enough");
    const work = ctx.held("work");
    const shop = ctx.held("shop");
    const chip = ctx.held("chip");
    const crack = ctx.held("crack");
    const inbox = ctx.held("inbox");
    const opened = ctx.held("opened_page");
    ctx.m.exit(shop,pageAt,"recede");
    ctx.m.exit(chip,pageAt,"recede");
    ctx.m.exit(crack,pageAt,"recede");
    ctx.m.exit(inbox,pageAt,"recede");
    ctx.m.exit(opened,pageAt,"recede");
    work.exit = "recede"; // The chapter handoff clears the held shell after the promise.
    // @form settings_preview: two real settings rows inside the held browser
    const T = ctx.engine.app(ctx,"toggles",{
      chrome:"none",frame:{x:1040,y:346,w:768,h:490},
      content:[{id:"settings",kind:"settings",rows:[
        {id:"second",label:"Two-step sign-in",kind:"toggle",value:false},
        {id:"manager",label:"Password manager",kind:"toggle",value:false}
      ]}]
    },{at:pageAt,exit:"recede"});
    const A = ctx.engine.resume(ctx,"work");
    const frame = {x:1040,y:346,w:768,h:490};
    A.zoom(frame,{at:pageAt,dur:ctx.style.dur("move"),scale:1.6});
    T.zoom(frame,{at:pageAt,dur:ctx.style.dur("move"),scale:1.6,read:"settings"});
    // Reserve the chapter band outside both app cameras, including the held chrome.
    ctx.m.travel(work,pageAt,{x:0,y:100,scale:1});
    ctx.m.travel(T.E,pageAt,{x:0,y:100,scale:1});
    T.toggle("settings.second",true,onAt);
    T.toggle("settings.manager",true,onAt + ctx.style.dur("move"));
    T.spotlight("settings",{at:freeze,dur:ctx.end-freeze,pad:12});
  }
});
