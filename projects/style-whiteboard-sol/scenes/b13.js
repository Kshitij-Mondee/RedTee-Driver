// @design resolved_return: the same setting ends with a shared record and a completed checklist
/* Treatments: static table with completed record; replace table with a summary card;
 * chosen retained table, responses fade as the record is written on its front and final tick lands.
 * Cue map: Same team, same hour -> clear responses, happy people;
 * decisions, owners and dates -> written record; read back and sent -> final green tick.
 */
Loom.scene("b13", {
  build(ctx, props) {
    const {kit,m}=ctx;
    const D=ctx.style.dur("draw");
    const table=ctx.held("table");
    const steps=ctx.held("steps");
    table.exit="recede";
    steps.exit="recede";
    const team=Loom.lesson.team_table(ctx,table.inner,{name:"team",held:true,ox:90,oy:240});
    table.handle=team;
    const tSame=ctx.cue("Same team, same hour");
    // @form cleared_responses: the spoken agreement gives way to the permanent record
    team.arrive(tSame);
    team.clearBubbles(tSame);
    m.exit(ctx.held("email"),tSame,"recede");
    m.exit(ctx.held("sent_today"),tSame,"recede");
    m.exit(ctx.held("bubbles"),tSame,"recede");
    for(let i=0;i<4;i++) team.emotion(i,"happy",tSame);
    // @form written_payoff: decisions and parked work remain visible on the table front
    const b=team.frontBox;
    const list=ctx.el("decision_list",{x:b.x,y:b.y,w:b.w,h:150,kind:"text",exit:"wipe",parent:table.inner});
    const line=Loom.lesson.decision_line(ctx,list.inner,{name:"payoff_decision",w:1100,parts:["Pilot ships in June,","Priya,","by Friday"]});
    const tRecord=ctx.cue("decisions, owners and dates");
    line.write(tRecord);
    const parked=ctx.el("parked_line",{x:8,y:70,w:1100,h:58,kind:"text",exit:"wipe",parent:list.inner});
    kit.fit("Parked: side topic, Lena",{role:"body",w:1080,h:58,maxLines:1});
    kit.text(parked.inner,"Parked: side topic, Lena",{role:"body",x:10,y:0,w:1080,h:58,maxLines:1,color:"ink",align:"center"});
    m.unmask(parked,tRecord+D*0.8,{dur:D});
    // @form close_complete: the sole green mark completes the held checklist
    const close=ctx.el("close_tick",{x:0,y:200,w:76,h:100,kind:"mark",exit:"recede",parent:steps.inner});
    const tick=steps.handle.tick(2,ctx.cue("read back and sent"),{tone:"pos"});
    close.followers=[tick];
  }
});
