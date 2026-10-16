// @design receding_thresholds_continued: two intervention points name the opening and the identity behind it
// Treatments considered: static signalling on the held hall; new diagram of paired locks; dolly out with evidence flags. Chosen: held hall with restrained dolly and fixed tags, preserving the mechanism while the viewer chooses.
Loom.scene("b09",{
  build(ctx){
    const {kit,m}=ctx;
    const wide=ctx.cue("many doors"), loginAt=ctx.cue("which habit"), wrongAt=ctx.cue("which door");
    const S=ctx.held("hall_set"), D=ctx.held("hall_doors"), H=ctx.held("heavy_door");
    S.exit="recede"; D.exit="recede"; H.exit="recede";
    H.handle.setState("refused",ctx.start);
    m.travel(S,wide,{x:34.56,y:8.72,scale:0.96,dur:ctx.style.dur("count")});
    m.travel(D,wide,{x:31.2,y:7.6,scale:0.96,dur:ctx.style.dur("count")});
    m.travel(H,wide,{x:-29.36,y:-4.24,scale:0.984,dur:ctx.style.dur("count")});
    // @form login_flag: a numbered intervention point leads into the first lock
    kit.fit("1 Leaked password at the login",{role:"body",w:720,h:80,maxLines:1});
    Loom.treat.label(ctx,"mark_login",{x:180,y:132,text:"1 Leaked password at the login",to:[425,602],tone:"accent",role:"body",t:loginAt});
    // @form identity_flag: the second point is just beyond that opening
    kit.fit("2 Correct password, wrong person",{role:"body",w:760,h:80,maxLines:1});
    Loom.treat.label(ctx,"mark_wrong_person",{x:900,y:244,text:"2 Correct password, wrong person",to:[550,636],tone:"accent4",role:"body",t:wrongAt});
    // @form held_question: the viewer can consider a finished picture
    const Q=ctx.el("question",{x:180,y:808,w:1600,h:110,kind:"text",exit:"wipe"});
    kit.rect(Q.inner,0,0,1600,110,{fill:"field",r:0});
    kit.fit("Which habit shuts which door?",{role:"title",w:1564,h:78,maxLines:1});
    kit.text(Q.inner,"Which habit shuts which door?",{x:18,y:16,w:1564,h:78,role:"title",maxLines:1,color:"ink",weight:700});
    m.unmask(Q,wrongAt,{dur:ctx.style.dur("move")});
    // @form silence_progress: a quiet bar measures the reflection pause
    const P=ctx.el("pause_bar",{x:700,y:920,w:520,h:6,kind:"instrument",exit:"collapse"});
    kit.rect(P.inner,0,0,520,6,{fill:"line",r:0});
    const fill=Loom.svg("rect",{x:0,y:0,width:0,height:6,fill:ctx.c("accent4")},P.inner);
    m.reveal(P,ctx.speechEnd,{dur:ctx.style.dur("stagger")});
    Loom.drive((e)=>fill.setAttribute("width",520*e),ctx.speechEnd,Math.min(ctx.end-ctx.speechEnd,ctx.style.dur("count")*1.25),"linear");
  }
});
