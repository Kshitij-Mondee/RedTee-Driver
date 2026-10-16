// @design occupied_then_unanswered: an occupied line drawing empties, leaving two unresolved questions over the absent participants
/* Treatments: static empty chairs with written questions; a split before/after board;
   chosen: one table drawn and emptied, so absence itself carries the problem.
   The table shell is held into b02; all transient words and marks exit at the join. */
Loom.scene("b01", {
  build(ctx) {
    const {kit, m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const writeDur = s => DRAW * clamp(s.length / 14, .45, 1.8);
    const tDiscussion = ctx.cue("An hour of good discussion");
    const tLeave = ctx.cue("everyone leaves");
    const tDecided = ctx.cue("What was decided");
    const tWho = ctx.cue("Who does what");
    const tNobody = ctx.cue("Nobody can say");

    // @form shared_table: the same physical meeting remains after its people leave
    const table = ctx.el("table", {x:90,y:240,w:1400,h:690,kind:"scenery",exit:"none"});
    const team = Loom.lesson.team_table(ctx, table.inner, {name:"team",ox:90,oy:240});
    table.handle = team;
    team.draw(tDiscussion);
    team.arrive(tDiscussion + ctx.style.dur("enter"));
    team.bubble(0,null,tDiscussion + ctx.style.dur("draw"));
    team.bubble(2,null,tDiscussion + ctx.style.dur("draw") + ctx.style.dur("stagger"));
    team.leave(tLeave);
    team.clearBubbles(tLeave);

    // @form unanswered_heading: an unanswered decision written above the vacant table
    const decided = ctx.el("decided_word", {x:275,y:285,w:470,h:130,kind:"text",exit:"wipe"});
    kit.fit("Decided?", {role:"title",w:422,h:106,maxLines:1});
    kit.text(decided.inner,"Decided?", {role:"title",x:24,y:12,w:422,h:106,maxLines:1,align:"center",valign:"middle",color:"ink"});
    m.unmask(decided,tDecided,{dir:"ltr",dur:writeDur("Decided?")});
    // @form unanswered_owner: responsibility is unresolved too
    const who = ctx.el("who_word", {x:920,y:285,w:320,h:130,kind:"text",exit:"wipe"});
    kit.fit("Who?", {role:"title",w:272,h:106,maxLines:1});
    kit.text(who.inner,"Who?", {role:"title",x:24,y:12,w:272,h:106,maxLines:1,align:"center",valign:"middle",color:"ink"});
    m.unmask(who,tWho,{dir:"ltr",dur:writeDur("Who?")});

    // @form paired_question_marks: the single accent is uncertainty above the empty chairs
    const marks = ctx.el("question_marks", {x:510,y:420,w:590,h:148,kind:"mark",exit:"recede"});
    const hand = d => kit.sketch(marks.inner,"path",[d],{fill:"none",stroke:"accent",sw:6});
    hand("M12 42 C12 2 96 2 96 42 C96 70 54 78 54 104");
    hand("M53 134 L55 136");
    hand("M432 42 C432 2 516 2 516 42 C516 70 474 78 474 104");
    hand("M473 134 L475 136");
    m.draw(marks,tNobody,{dur:ctx.style.dur("enter")});
  }
});
