// @design reasoning_drawn_in_speech_order: a question stays central while a distraction is moved into a named corner
/* Treatments considered: static board with a highlighted corner; a two-card comparison; chosen: a question accumulates a side bubble, then a named parking box. Motion makes the steering visible. Sam's bust ends at the desk line y652. */
Loom.scene("b07", {
  build(ctx) {
    const {kit,m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const drawDur = len => DRAW * clamp(len/900,0.3,1.4);
    const writeDur = str => DRAW * clamp(str.length/14,0.45,1.8);
    const hand = (g,d,o) => kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
    const tDuring = ctx.cue("During");
    const tOpen = ctx.cue("Open by saying");
    const tQuestion = ctx.cue("the question again");
    const tSide = ctx.cue("A side topic comes up");
    const tPark = ctx.cue("in a corner of the board");
    const tName = ctx.cue("with a name");

    // @form corner_checklist: an accumulating three-point reference
    const steps = ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
    steps.handle = Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:0,ticked:[true,false,false]});
    steps.handle.appear();
    steps.handle.setCurrent(1,tDuring);

    // @form grounded_presenter: a designed cast bust on one hand line
    const desk = ctx.el("desk",{x:140,y:640,w:440,h:24,kind:"scenery",exit:"recede"});
    hand(desk.inner,"M8 12 L432 12");
    m.draw(desk,tOpen-drawDur(424),{dur:drawDur(424)});
    const sam = Loom.lesson.team_table.person(ctx,"Sam","explaining",{x:190,y:312,size:340,name:"sam"});
    m.reveal(sam,tOpen,{dy:0});

    // @form handwritten_question: the reference kept above the discussion
    kit.fit("May or June?",{role:"title",w:700,h:128,maxLines:1});
    const question = ctx.el("question",{x:620,y:174,w:700,h:128,kind:"text",exit:"wipe"});
    kit.text(question.inner,"May or June?",{role:"title",x:20,y:0,w:660,h:128,maxLines:1,color:"ink"});
    m.unmask(question,tQuestion,{dur:writeDur("May or June?")});

    // @form temporary_side_topic: a spoken distraction that leaves as it is parked
    const side = Loom.treat.bubble(ctx,"side_bubble",{x:780,y:370,w:390,text:"side topic",tail:[720,490],kind:"speech",fill:"surface",maxLines:1,t:tSide});
    m.exit(side,tPark,"recede");

    // @form named_corner_box: the distraction has a place and a responsible name
    const parking = Loom.treat.panel(ctx,"parking_lot",{x:1170,y:650,w:560,h:220,fill:"surface",tone:"ink",t:tPark});
    const pc = parking.content;
    kit.fit("Parking lot",{role:"lead",w:460,h:64,maxLines:1});
    const heading = ctx.el("parking_heading",{x:pc.x,y:pc.y,w:460,h:64,kind:"text",exit:"wipe",parent:parking.inner});
    kit.text(heading.inner,"Parking lot",{role:"lead",x:0,y:0,w:460,h:64,maxLines:1,color:"ink"});
    m.unmask(heading,tPark+ctx.style.dur("move"),{dur:writeDur("Parking lot")});
    const item = ctx.el("parked_topic",{x:pc.x,y:pc.y+92,w:230,h:60,kind:"text",exit:"wipe",parent:parking.inner});
    kit.text(item.inner,"side topic",{role:"lead",x:0,y:0,w:230,h:60,maxLines:1,color:"ink"});
    m.unmask(item,tPark+ctx.style.dur("enter"),{dur:writeDur("side topic")});
    const name = ctx.el("parked_name",{x:pc.x+270,y:pc.y+92,w:160,h:60,kind:"text",exit:"wipe",parent:parking.inner});
    kit.fit("Lena",{role:"lead",w:160,h:60,maxLines:1});
    kit.text(name.inner,"Lena",{role:"lead",x:0,y:0,w:160,h:60,maxLines:1,color:"accent"});
    m.unmask(name,tName,{dur:writeDur("Lena")});
  }
});
