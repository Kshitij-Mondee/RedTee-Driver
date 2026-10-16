// @design duplicate_and_retreat: two matching papers arrive, one is marked, and an offered hand retreats
/* Treatments: A static paired papers with signalling; B a magnified total with a camera push;
   C chosen, papers land in the inhabited desk set and the hand reaches then withdraws.
   The hand is the argument, not a decorative prop movement. */
Loom.scene("b01", {
  build(ctx) {
    const {kit,m} = ctx;
    // @form office_layers: wall, colleague, and near desk establish the workplace
    const backCtx = Object.create(ctx);
    backCtx.el = (name, opts) => ctx.el("room", opts);
    const back = Loom.lesson.desk_set(backCtx,ctx.g,{framing:"medium",layer:"back"});
    const maya = ctx.character("maya","maya",{x:1580,y:1710,scale:0.85,skin:0,top:"cloth",pose:"idle",emotion:"neutral"});
    const front = Loom.lesson.desk_set(ctx,ctx.g,{framing:"medium",layer:"front",laptop:"sheet",ring:true,magnifier:false,only:["desk","receipts","laptop","phone"]});
    maya.emotion("focus",ctx.cue("Say this is Maya"));
    maya.gesture("tilt",ctx.cue("One expense claim"),ctx.cue("The same dinner"));
    // @form paired_papers: matching receipts land before the second total is circled
    m.drop(front.receipts,ctx.cue("One expense claim"));
    m.draw(front.ring,ctx.cue("claimed twice"));
    // @form pinned_notice: a paper title is attached to the free wall
    const text = "Something doesn't add up";
    kit.fit(text,{role:"title",w:370,h:230,maxLines:3,weight:400});
    const note = Loom.treat.panel(ctx,"title_note",{x:90,y:150,w:430,h:300,fill:"surface",tone:"ink",as:"paper"});
    kit.disc(note.inner,215,18,8,{fill:"muted",flat:true});
    kit.text(note.inner,text,{role:"title",weight:400,x:30,y:38,w:370,h:230,maxLines:3,align:"center",valign:"middle",color:"ink"});
    m.drop(note,ctx.cue("claimed twice"));
    // @form hesitation: a reaching pose becomes a guarded hand and uneasy face
    maya.pose("hand_over",ctx.cue("Her first thought"),{dur:ctx.style.dur("move")});
    maya.hold("hand_r","palm_up_offer",ctx.cue("Her first thought"),ctx.cue("Leave it"));
    maya.emotion("doubt",ctx.cue("Her first thought"));
    maya.pose("worried",ctx.cue("Leave it"),{dur:ctx.style.dur("move")});
    maya.emotion("concern",ctx.cue("Leave it"));
  }
});
