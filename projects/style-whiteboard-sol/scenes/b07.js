// @design steer_and_assign: a question stays central while a distraction is contained with a named owner
// Treatments: static board plus signalling; drifting bubble into a corner; chosen accumulated marker board with a contained aside.
Loom.scene("b07", { build(ctx) {
  const {kit,m}=ctx, D=ctx.style.dur("draw");
  const hand=(g,d,o)=>kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
  const write=s=>D*Math.max(0.45,Math.min(1.8,s.length/14));
  // @form board_checklist: persistent three moves
  const steps=ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
  steps.handle=Loom.lesson.step_list(ctx,steps.inner,{name:"meeting_steps",current:0,ticked:[true,false,false]});
  steps.handle.appear(); steps.handle.setCurrent(1,ctx.cue("During"));
  // @form desk_reference: one shared baseline for the conversation
  const desk=ctx.el("desk",{x:120,y:710,w:1270,h:24,kind:"scenery",exit:"recede"});
  hand(desk.inner,"M8 10 L1260 10"); m.draw(desk,ctx.cue("Open by saying")-ctx.style.dur("enter"),{dur:D});
  // @form cast_presenter: same Sam as the opening table
  const sam=Loom.lesson.team_table.person(ctx,"Sam","explaining",{name:"sam",x:160,y:380,size:340});
  m.reveal(sam,ctx.cue("Open by saying"),{dy:0});
  // @form decision_question: the reference remains above the talk
  kit.fit("May or June?",{role:"title",w:720,h:140,maxLines:1});
  const question=ctx.el("question",{x:590,y:160,w:740,h:140,kind:"text",exit:"wipe"});
  kit.text(question.inner,"May or June?",{x:12,y:8,w:716,h:124,role:"title",maxLines:1,color:"ink"});
  m.unmask(question,ctx.cue("the question again"),{dur:write("May or June?")});
  // @form aside_bubble: a temporary interruption near the main question
  const side=Loom.treat.bubble(ctx,"side_bubble",{x:710,y:350,w:310,text:"side topic",tail:[670,520],fill:"surface",as:"wobble",t:ctx.cue("A side topic comes up")});
  m.exit(side,ctx.cue("in a corner of the board"),"recede");
  // @form parking_corner: the aside is retained without displacing the question
  const park=Loom.treat.panel(ctx,"parking_lot",{x:1450,y:600,w:350,h:270,fill:"surface",tone:"ink",as:"frame",t:ctx.cue("in a corner of the board")-ctx.style.dur("exit")});
  const heading=ctx.el("parked_heading",{x:24,y:12,w:302,h:80,kind:"text",parent:park.inner,exit:"wipe"});
  kit.fit("Parking lot",{role:"lead",w:280,h:60,maxLines:1});
  kit.text(heading.inner,"Parking lot",{x:10,y:10,w:280,h:60,role:"lead",maxLines:1,color:"ink"});
  m.unmask(heading,ctx.cue("in a corner of the board"),{dur:write("Parking lot")});
  const item=ctx.el("parked_item",{x:24,y:100,w:302,h:70,kind:"text",parent:park.inner,exit:"wipe"});
  kit.fit("side topic",{role:"body",w:280,h:54,maxLines:1});
  kit.text(item.inner,"side topic",{x:10,y:8,w:280,h:54,role:"body",maxLines:1,color:"ink"});
  m.unmask(item,ctx.cue("in a corner of the board"),{dur:write("side topic")});
  // @form named_owner: only the assigned name spends the marker colour
  Loom.treat.label(ctx,"parked_name",{x:1560,y:786,text:"Lena",tone:"accent",role:"lead",t:ctx.cue("with a name")});
}});
