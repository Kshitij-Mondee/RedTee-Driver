// @design one_token_two_locks: one unchanged token fits two separate receivers in sequence
Loom.scene("b03", {
  build(ctx) {
    const {kit,m}=ctx;
    // Treatments considered: static two receivers with signalling; moving token; split screen replay. Moving token proves identity without added words.
    // @form corridor_planes: hard-edged dusk light gives the receivers a shared physical wall
    const wall=ctx.el("door_wall",{x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"recede"});
    kit.rect(wall.inner,0,0,1920,1080,{fill:"field"});
    kit.rect(wall.inner,240,220,1440,670,{fill:"field2"});
    kit.path(wall.inner,"M240 890 H1680 L1840 1080 H80 Z",{fill:"surface2"});
    wall.dusk=Loom.svg("g",{},wall.inner);
    Loom.svg("polygon",{points:"460,220 1530,220 1670,890 290,890",fill:ctx.c("ink"),opacity:0.14},wall.dusk);
    for(let i=0;i<4;i++) kit.line(wall.inner,240+i*480,890,120+i*560,1080,{stroke:"line",sw:2});
    // @form paired_receivers: equal sized doors make the same token's fit directly comparable
    const shop=ctx.el("door_shop",{x:500,y:260,w:400,h:620,kind:"instrument",exit:"recede",parent:wall});
    shop.handle=Loom.lesson.door(ctx,shop.inner,{w:400,name:"Shop",state:"shut"});
    const work=ctx.el("door_work",{x:1060,y:260,w:400,h:620,kind:"instrument",exit:"recede",parent:wall});
    work.handle=Loom.lesson.door(ctx,work.inner,{w:400,name:"Work",state:"shut"});
    // @form persistent_token: identical notches remain visible throughout the two attempts
    const card=ctx.el("keycard",{x:918,y:515,w:180,h:115,kind:"token",exit:"recede",parent:wall});
    card.handle=Loom.lesson.keycard(ctx,card.inner,{w:180,state:"lit",seed:"dana"});
    m.settle(card,ctx.cue("used one password twice"));
    const move=ctx.style.dur("move")*0.55;
    const ts=ctx.cue("Once on a shopping site");
    m.travel(card,ts,{x:-191,y:58,scale:0.46,dur:move});
    shop.handle.setState("turning",ts+move);
    m.travel(card,ts+move*2,{x:0,y:0,scale:1,dur:move});
    shop.handle.setState("shut",ts+move*2);
    const tw=ctx.cue("Once at work");
    m.travel(card,tw,{x:369,y:58,scale:0.46,dur:move});
    work.handle.setState("turning",tw+move);
    m.travel(card,tw+move*2,{x:0,y:0,scale:1,dur:move});
    work.handle.setState("shut",tw+move*2);
    // @form quiet_time_marker: a warm paper kicker locates the earlier moment without blaming anyone
    kit.fit("Months ago",{role:"body",w:350,h:60,maxLines:1});
    const tag=Loom.treat.label(ctx,"rewind_tag",{x:240,y:124,text:"Months ago",tone:"accent4",role:"body",as:"underline",t:ctx.cue("Months ago")});
  }
});
