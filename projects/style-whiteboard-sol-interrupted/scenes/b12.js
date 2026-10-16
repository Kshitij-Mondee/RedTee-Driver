// @design shared_record_converges: a single written record folds into a message and branches toward four identical responses
// Treatments: static shared line with signalling; travelling copies to four seats; chosen a folding record and branching hand arrows, because one version becomes shared.
Loom.scene("b12", {
  build(ctx) {
    const {kit,m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const drawDur = len => DRAW * clamp(len/900,0.3,1.4);
    const writeDur = str => DRAW * clamp(str.length/14,0.45,1.8);
    const hand = (g,d,o) => kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o||{}));
    const tTeam = ctx.cue("Then send it");
    const tWrite = ctx.cue("in writing");
    const tDay = ctx.cue("the same day");
    const tEveryone = ctx.cue("everyone there and anyone affected");
    const tOne = ctx.cue("One version of the meeting");

    // @form completed_scaffold: the two completed moves and the current closing move
    const steps = ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"none"});
    steps.handle = Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:2,ticked:[true,true,false]});
    steps.handle.appear();

    // @form shared_surface: callback to the original four seated cast members
    const table = ctx.el("table",{x:90,y:240,w:1420,h:690,kind:"scenery",exit:"none"});
    const team = Loom.lesson.team_table(ctx,table.inner,{name:"team",ox:90,oy:240});
    table.handle = team;
    team.draw(tTeam);
    team.arrive(tTeam + ctx.style.dur("stagger"));

    // @form folded_record: the written record is read before it folds into the envelope
    const email = ctx.el("email",{x:380,y:104,w:740,h:178,kind:"icon",exit:"recede"});
    const decision = Loom.lesson.decision_line(ctx,email.inner,{name:"email_decision",w:700});
    email.handle = decision;
    decision.write(tWrite);
    decision.fold(tDay,{x:277,y:62,scale:0.22});
    Loom.tween(decision.el.line.life,{opacity:1},{opacity:0},tDay + ctx.style.dur("move"),{dur:ctx.style.dur("exit")});
    const envelope = ctx.el("envelope_outline",{x:280,y:30,w:230,h:142,kind:"icon",exit:"recede",parent:email.inner});
    hand(envelope.inner,"M10 10 L220 8 L218 130 L12 132 Z");
    m.draw(envelope,tDay,{dur:drawDur(680)});
    const flap = ctx.el("envelope_flap",{x:280,y:30,w:230,h:142,kind:"icon",exit:"recede",parent:email.inner});
    hand(flap.inner,"M10 10 L116 84 L220 8 M12 132 L88 72 M218 130 L144 72");
    m.draw(flap,tDay + ctx.style.dur("move"),{dur:drawDur(380)});

    // @form dispatch_mark: the only accent underlines the dispatch timing
    const sent = ctx.el("sent_today",{x:930,y:146,w:310,h:110,kind:"text",exit:"wipe"});
    kit.fit("Sent today",{role:"lead",w:286,h:64,maxLines:1});
    kit.text(sent.inner,"Sent today",{role:"lead",x:12,y:6,w:286,h:64,maxLines:1,color:"ink",valign:"middle"});
    m.unmask(sent,tDay,{dur:writeDur("Sent today")});
    const underline = ctx.el("sent_today_underline",{x:12,y:74,w:230,h:24,kind:"mark",exit:"recede",parent:sent.inner});
    hand(underline.inner,"M6 12 Q112 4 224 10",{stroke:"accent",sw:5.5});
    m.draw(underline,tDay + writeDur("Sent today"),{dur:drawDur(220)});

    // @form branching_delivery: four open hand arrows land above each recipient's response without crossing heads
    const arrow = (name,x1,y1,x2,y2,bend) => {
      const L = Math.hypot(x2-x1,y2-y1)||1;
      const cx = (x1+x2)/2 - (y2-y1)/L*bend;
      const cy = (y1+y2)/2 + (x2-x1)/L*bend;
      const a = Math.atan2(y2-cy,x2-cx);
      const h1 = [x2-22*Math.cos(a-0.5),y2-22*Math.sin(a-0.5)];
      const h2 = [x2-22*Math.cos(a+0.5),y2-22*Math.sin(a+0.5)];
      const xs = [x1,cx,x2,h1[0],h2[0]], ys = [y1,cy,y2,h1[1],h2[1]];
      const bx = Math.floor(Math.min(...xs)-12), by = Math.floor(Math.min(...ys)-12);
      const E = ctx.el(name,{x:bx,y:by,w:Math.ceil(Math.max(...xs)+12)-bx,h:Math.ceil(Math.max(...ys)+12)-by,kind:"connector",exit:"recede"});
      const X = v => (v-bx).toFixed(1), Y = v => (v-by).toFixed(1);
      hand(E.inner,`M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner,`M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return E;
    };
    [250,590,930,1270].forEach((x,i) => {
      const A = arrow("delivery_"+i,700+i*48,278,x,278,i<2?38:-38);
      m.draw(A,tEveryone+i*ctx.style.dur("stagger"),{dur:ctx.style.dur("draw")});
    });

    // @form shared_responses: each short response uses the kit's own bubble, grouped for the next beat
    const bubbles = ctx.el("bubbles",{x:90,y:240,w:1420,h:212,kind:"bubble",exit:"recede"});
    bubbles.handle = team;
    kit.fit("June. Priya. Friday.",{role:"label",w:260,h:64,maxLines:2});
    [0,1,2,3].forEach(i => {
      const b = team.bubble(i,"June. Priya. Friday.",tOne - ctx.style.dur("stagger"));
      bubbles.inner.appendChild(b.E.outer);
      bubbles.inner.appendChild(b.words.outer);
    });
    // Continuity: steps.handle and table.handle are original kit instances. b13 takes steps, table, email, sent_today and bubbles by their exact names.
  }
});
