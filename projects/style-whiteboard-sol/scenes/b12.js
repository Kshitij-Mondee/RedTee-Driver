// @design shared_record: a written record distributes to four seats and aligns their responses
/* Treatments: static shared record with signalling; four separate mail cards; chosen single record folding into one envelope with outgoing arrows and matching responses.
 * Cue map: Then send it -> team; in writing -> record; the same day -> sent mark;
 * everyone there and anyone affected -> distribution; One version of the meeting -> matching bubbles.
 */
Loom.scene("b12", {
  build(ctx, props) {
    const {kit,m} = ctx;
    const D = ctx.style.dur("draw");
    const hand = (g,d,o) => kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
    const tTeam = ctx.cue("Then send it");
    // @form seated_team: return to the same four colleagues and table
    const table = ctx.el("table",{x:90,y:240,w:1400,h:690,kind:"scenery",exit:"recede"});
    const team = Loom.lesson.team_table(ctx,table.inner,{name:"team",ox:90,oy:240});
    table.handle = team;
    team.draw(tTeam);
    team.arrive(tTeam);
    // @form closing_checklist: prior moves complete while the close remains active
    const steps = ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"scenery",exit:"recede"});
    const checklist = Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:2,ticked:[true,true,false]});
    steps.handle = checklist;
    checklist.draw(tTeam);
    // @form shared_email: one written decision becomes one distributed record
    const email = ctx.el("email",{x:210,y:100,w:1170,h:380,kind:"icon",exit:"recede"});
    const record = Loom.lesson.decision_line(ctx,email.inner,{name:"mail_decision",w:1100});
    const tWrite = ctx.cue("in writing");
    const tWritten = record.write(tWrite);
    const envelope = ctx.el("mail_envelope",{x:450,y:0,w:190,h:130,kind:"icon",exit:"recede",parent:email.inner});
    hand(envelope.inner,"M8 10 L182 10 L182 118 L8 118 Z M8 10 L95 76 L182 10");
    record.fold(tWritten,{x:455,y:25,scale:0.15});
    m.draw(envelope,tWritten,{dur:D*0.5});
    m.exit(record.el.line,tWritten+ctx.style.dur("move"),"recede");
    // @form sent_today: the only emphasis marks the written follow-through
    const sent = ctx.el("sent_today",{x:900,y:185,w:290,h:88,kind:"text",exit:"wipe"});
    kit.fit("Sent today",{role:"lead",w:270,h:62,maxLines:1});
    kit.text(sent.inner,"Sent today",{role:"lead",x:10,y:0,w:270,h:62,maxLines:1,color:"ink"});
    const mark = ctx.el("sent_underline",{x:10,y:62,w:260,h:24,kind:"mark",exit:"recede",parent:sent.inner});
    hand(mark.inner,"M6 12 Q120 5 250 12",{stroke:"accent",sw:5});
    const tDay = ctx.cue("the same day");
    m.unmask(sent,tDay,{dur:D*0.7});
    m.draw(mark,tDay+D*0.55,{dur:D*0.3});
    // @form distribution_arrows: the record reaches every seated colleague
    const arrows=[];
    const tSend=ctx.cue("everyone there and anyone affected");
    for(let i=0;i<4;i++) {
      const x1=755, y1=235, x2=250+340*i, y2=455;
      const bx=Math.min(x1,x2)-26, by=y1-16, w=Math.abs(x2-x1)+52,h=y2-y1+32;
      const E=ctx.el("mail_arrow_"+i,{x:bx-210,y:by-100,w:w,h:h,kind:"connector",exit:"recede",parent:email.inner});
      const a=Math.atan2(y2-y1,x2-x1), hs=22;
      const X=v=>(v-bx).toFixed(1), Y=v=>(v-by).toFixed(1);
      hand(E.inner,"M"+X(x1)+" "+Y(y1)+" L"+X(x2)+" "+Y(y2));
      hand(E.inner,"M"+X(x2-hs*Math.cos(a-0.5))+" "+Y(y2-hs*Math.sin(a-0.5))+" L"+X(x2)+" "+Y(y2)+" L"+X(x2-hs*Math.cos(a+0.5))+" "+Y(y2-hs*Math.sin(a+0.5)));
      m.draw(E,tSend+i*ctx.style.dur("stagger"),{dur:D*0.5});
      arrows.push(E);
    }
    // @form matching_responses: four people now recall the same written result
    const bubbles=ctx.el("bubbles",{x:100,y:292,w:1320,h:160,kind:"bubble",exit:"recede"});
    bubbles.followers=[];
    const tOne=ctx.cue("One version of the meeting");
    arrows.forEach(E=>m.exit(E,tOne,"recede"));
    for(let i=0;i<4;i++) {
      const b=team.bubble(i,"June. Priya. Friday.",tOne);
      bubbles.followers.push(b.E,b.words);
    }
  }
});
