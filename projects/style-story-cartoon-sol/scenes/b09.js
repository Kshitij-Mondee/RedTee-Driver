// @design blocked_door_question: a dim corridor closes one route while a hanging question gives the viewer space to choose
/* Treatments: A static fork with sign signalling; B a close-up of the shut door;
   C chosen, the same inhabited path dims, one door greys, and a paper question drops over the fork. */
Loom.scene("b09", {
  build(ctx) {
    const {kit,m} = ctx;
    // @form dim_channel_path: the established kit corridor carries the twist without a new metaphor
    const pc = Object.create(ctx);
    pc.el = (name, opts) => {
      if (name === "path_set") return ctx.el("path_set", opts);
      if (name === "path_line") return ctx.el("path_line", opts);
      if (name === "door_manager") return ctx.el("door_manager", opts);
      if (name === "door_other") return ctx.el("door_other", opts);
      if (name === "door_hr") return ctx.el("door_hr", opts);
      if (name === "door_compliance") return ctx.el("door_compliance", opts);
      if (name === "door_line") return ctx.el("door_line", opts);
      if (name === "manager_sign") return ctx.el("manager_sign", opts);
      if (name === "other_sign") return ctx.el("other_sign", opts);
      if (name === "hr_sign") return ctx.el("hr_sign", opts);
      if (name === "compliance_sign") return ctx.el("compliance_sign", opts);
      if (name === "line_sign") return ctx.el("line_sign", opts);
      if (name === "line_tag") return ctx.el("line_tag", opts);
      if (name === "path_fork") return ctx.el("path_fork", opts);
      if (name === "path_past") return ctx.el("path_past", opts);
      if (name === "path_kerb") return ctx.el("path_kerb", opts);
      return ctx.el(name, opts);
    };
    const path = Loom.lesson.door_path(pc, ctx.g, {layer:"back",dim:true,doors:"signed",lines:"fork"});
    [path.set,path.path,path.doors.manager,path.doors.other,path.doors.hr,path.doors.compliance,path.doors.line].forEach(E => {E.handle=path; E.exit="none";});
    path.path.followers=[path.fork,path.past];
    Object.keys(path.doors).forEach(key => {path.doors[key].followers=[path.signs[key]];});
    path.doors.line.followers.push(path.tag);
    // @form worried_colleague: one fixed rig reacts with posture as well as expression
    const maya = ctx.character("maya", "maya", {x:330,y:940,scale:0.46,skin:0,top:"cloth",pose:"idle",emotion:"neutral"});
    maya.E.exit="none";
    maya.E.handle=maya;
    const kerb = Loom.lesson.door_path(pc,ctx.g,{layer:"front"});
    maya.E.followers=[kerb.kerb];
    const blocked=ctx.cue("her own manager");
    path.setState("manager:greyed",blocked);
    maya.pose("worried",blocked,{dur:ctx.style.dur("move")});
    maya.emotion("concern",blocked);
    // @form hanging_question: paper on the hook carries the only teaching accent
    kit.fit("Her manager is involved.",{role:"body",w:400,h:42,maxLines:1});
    kit.fit("Where now?",{role:"lead",w:400,h:50,maxLines:1});
    const qc=Object.create(ctx);
    qc.el=(name,opts)=>ctx.el("question_sign",opts);
    const question = Loom.treat.panel(qc,"question_sign",{x:430,y:140,w:440,h:132,fill:"surface",as:"paper"});
    kit.line(question.inner,190,0,190,12,{stroke:"ink",sw:4});
    kit.text(question.inner,"Her manager is involved.",{role:"body",x:20,y:18,w:400,h:42,maxLines:1,align:"center",valign:"middle",color:"ink"});
    kit.text(question.inner,"Where now?",{role:"lead",x:20,y:65,w:400,h:50,maxLines:1,align:"center",valign:"middle",color:"accent"});
    const ask=ctx.cue("Where does she go?");
    m.drop(question,ask);
    maya.pose("think",ask,{dur:ctx.style.dur("move")});
    maya.emotion("doubt",ask);
    maya.gesture("tilt",ctx.speechEnd,ctx.end-ctx.style.dur("exit"));
  }
});
