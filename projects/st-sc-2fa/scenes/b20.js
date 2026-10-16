// @design absent_counterpart: a waiting surface faces an empty outline and holds the unanswered question
Loom.scene("b20", {
  build(ctx) {
    /* Treatments: static waiting form and absence outline; phone fades away; camera searches the desk.
       Choose the static composition with signalling. Absence is already the result, and the question needs stillness. */
    const k = ctx.kit;
    const gone = ctx.cue("Now your phone is gone");
    const question = ctx.cue("What would you do first");
    // @form waiting_code_surface: the familiar sign-in shell waits at its second step
    const A = ctx.engine.app(ctx,"app",{
      chrome:"window",title:"",brand:"Company account",
      frame:{x:520,y:190,w:920,h:650},
      sidebarW:0,
      page:{title:"Two-step sign-in"},
      content:[{id:"code",kind:"form",title:"6-digit code",fields:[{id:"current",label:"",value:"",placeholder:""}],actions:[{id:"verify",label:"Verify",kind:"primary"}]}]
    },{at:ctx.start});
    A.pointerOut(ctx.start);
    // @form fixed_chapter_strip: the recovery chapter is active in the same screen-space navigation
    const chapters = ctx.el("chapters",{x:0,y:0,w:1920,h:150,kind:"label",exit:"none"});
    k.rect(chapters.inner,0,0,1920,150,{fill:"field",stroke:"none",r:0});
    const labels = ["Why","Two-step sign-in","Password manager","Lost phone"];
    const widths = [88,250,290,184];
    let x = 96;
    labels.forEach((label,i) => {
      k.fit(label,{role:"caption",w:widths[i]-24,h:40,maxLines:1});
      k.pill(chapters.inner,x,82,widths[i],52,{fill:i===3?"accent2":"surface",stroke:i===3?"accent2":"field2"});
      k.text(chapters.inner,label,{x:x+12,y:88,w:widths[i]-24,h:40,role:"caption",size:24,maxLines:1,color:i===3?"onAccent":"muted",weight:600});
      x += widths[i]+12;
    });
    ctx.m.reveal(chapters,ctx.start);
    // @form missing_phone_outline: the same phone kit exposes only its absence state
    const empty = ctx.el("empty_spot",{x:1500,y:260,w:272,h:544,kind:"instrument",exit:"none"});
    empty.kit = Loom.lesson.phone(ctx,empty.inner,{w:272,state:"missing"});
    empty.handle = empty.kit;
    empty.kit.absence.firstChild.setAttribute("stroke",ctx.c("accent2"));
    ctx.m.reveal(empty,gone);
    // No pointer, caret, countdown or camera animation follows the question cue.
    // The entire result remains still through the question and the complete pause.
    void question;
  }
});
