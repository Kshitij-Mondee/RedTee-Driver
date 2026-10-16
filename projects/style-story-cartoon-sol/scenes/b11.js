// @design calm_desk_bookend: a familiar work surface returns, a message is sent and a paper reminder settles beside a relaxed figure
/* Treatments: A static office with sequential word signalling; B a screen close-up then a return;
   C chosen, the unchanged medium office with a paper reminder landing, preserving the opening bookend.
   Kit mail remains the kit's drawing because its screen has no UI slot; reported for kit repair. */
Loom.scene("b11", {
  build(ctx) {
    const {kit,m} = ctx;
    // @form office_bookend: the original wall, cast and front desk retain their depth order
    const back = Loom.lesson.desk_set(ctx,ctx.g,{framing:"medium",layer:"back"});
    const maya = ctx.character("maya","maya",{x:1580,y:1710,scale:0.85,skin:0,top:"cloth",pose:"idle",emotion:"relief"});
    const front = Loom.lesson.desk_set(ctx,ctx.g,{framing:"medium",layer:"front",only:["desk","receipts","laptop","phone"],laptop:"mail",ring:false,magnifier:false});
    maya.emotion("relief",ctx.cue("Back at her desk"));
    maya.gesture("beat",ctx.cue("Maya sends"),ctx.cue("a calm note")+ctx.style.dur("move"));
    front.setState("sent_on",ctx.cue("a calm note"));
    maya.pose("idle",ctx.cue("Notice it"),{dur:ctx.style.dur("move")});
    // @form wall_reminder: one paper note in the free wall space holds all three accent words
    const wall = back.anchors.wall_left;
    const note = Loom.treat.panel(ctx,"pocket_rule",{x:wall.x,y:wall.y,w:wall.w,h:wall.h,fill:"surface",as:"paper"});
    kit.fit("Notice.",{role:"title",w:wall.w-64,h:110,maxLines:1,weight:400});
    kit.fit("Weigh.",{role:"title",w:wall.w-64,h:110,maxLines:1,weight:400});
    kit.fit("Speak up.",{role:"title",w:wall.w-64,h:110,maxLines:1,weight:400});
    const notice = ctx.el("pocket_notice",{x:32,y:20,w:wall.w-64,h:110,kind:"text",parent:note.inner,exit:"wipe"});
    kit.text(notice.inner,"Notice.",{role:"title",x:0,y:0,w:wall.w-64,h:110,maxLines:1,color:"accent",weight:400});
    const weigh = ctx.el("pocket_weigh",{x:32,y:125,w:wall.w-64,h:110,kind:"text",parent:note.inner,exit:"wipe"});
    kit.text(weigh.inner,"Weigh.",{role:"title",x:0,y:0,w:wall.w-64,h:110,maxLines:1,color:"accent",weight:400});
    const speak = ctx.el("pocket_speak",{x:32,y:230,w:wall.w-64,h:110,kind:"text",parent:note.inner,exit:"wipe"});
    kit.text(speak.inner,"Speak up.",{role:"title",x:0,y:0,w:wall.w-64,h:110,maxLines:1,color:"accent",weight:400});
    m.drop(note,ctx.cue("Notice it")-ctx.style.dur("enter"));
    m.unmask(notice,ctx.cue("Notice it"),{dir:"ltr",dur:ctx.style.dur("move")});
    m.unmask(weigh,ctx.cue("Weigh it"),{dir:"ltr",dur:ctx.style.dur("move")});
    m.unmask(speak,ctx.cue("Speak up"),{dir:"ltr",dur:ctx.style.dur("move")});
    front.setState("laptop_closed",ctx.cue("Honesty, not proof"));
    maya.emotion("smile",ctx.cue("Honesty, not proof"));
    maya.gesture("nod",ctx.cue("Honesty, not proof"),ctx.speechEnd);
  }
});
