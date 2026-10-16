// @design absence_after_exchange: a lively shared surface empties, unanswered marks occupy the vacant space
// Treatments: static empty seats with signalling; separate before/after boards; chosen held surface with people fading away, because absence is the argument.
Loom.scene("b01", {
  build(ctx) {
    const {kit, m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const writeDur = str => DRAW * clamp(str.length / 14,0.45,1.8);
    const tTalk = ctx.cue("An hour of good discussion");
    const tLeave = ctx.cue("everyone leaves");
    const tDecided = ctx.cue("What was decided");
    const tWho = ctx.cue("Who does what");
    const tUnknown = ctx.cue("Nobody can say");

    // @form shared_surface: four cast members discuss behind a persistent line and chairs
    const table = ctx.el("table", {x:90,y:240,w:1420,h:690,kind:"scenery",exit:"none"});
    const team = Loom.lesson.team_table(ctx, table.inner, {name:"team",ox:90,oy:240});
    table.handle = team;
    team.draw(tTalk);
    team.arrive(tTalk + ctx.style.dur("stagger"));
    team.bubble(0, null, tTalk + ctx.style.dur("move"));
    team.bubble(2, null, tTalk + ctx.style.dur("enter"));
    team.leave(tLeave);
    team.clearBubbles(tLeave);

    // @form unanswered_labels: the questions are written above the empty surface in spoken order
    const label = (name,word,x,t) => {
      const f = kit.fit(word,{role:"title",w:510,h:130,maxLines:1});
      const w = Math.ceil(f.width) + 48;
      const E = ctx.el(name,{x,y:170,w,h:130,kind:"text",exit:"wipe"});
      kit.text(E.inner,word,{role:"title",x:24,y:12,w:w-48,h:106,maxLines:1,color:"ink",valign:"middle"});
      m.unmask(E,t,{dir:"ltr",dur:writeDur(word)});
      return E;
    };
    label("decided_word","Decided?",235,tDecided);
    label("who_word","Who?",945,tWho);

    // @form unanswered_marks: the single accent group replaces the absent answers, above chair backs
    const marks = ctx.el("question_marks",{x:370,y:340,w:740,h:210,kind:"mark",exit:"wipe"});
    [0,600].forEach(dx => {
      kit.sketch(marks.inner,"path",[`M${dx+22} 48 C${dx+18} 3 ${dx+106} 2 ${dx+110} 48 C${dx+114} 82 ${dx+63} 85 ${dx+62} 128 L${dx+61} 145`],{fill:"none",stroke:"accent",sw:5.5});
      kit.sketch(marks.inner,"path",[`M${dx+58} 178 L${dx+64} 180`],{fill:"none",stroke:"accent",sw:5.5});
    });
    m.draw(marks,tUnknown,{dur:ctx.style.dur("draw")});
    // Continuity contract: table is held by b02; decided_word, who_word and question_marks are leavers with wipe exits. The table.handle is the existing team_table instance.
  }
});
