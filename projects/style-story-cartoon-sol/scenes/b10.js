// @design blocked_door_question_continued: the route carries on beyond a closed option as successive alternatives fill with warm light
/* Treatments: A static day corridor with sequential light signals; B a cut onto each door;
   C chosen, retain the corridor and colleague, then draw the route past the blocked option as doors open. */
Loom.scene("b10", {
  build(ctx) {
    const {m}=ctx;
    // @form retained_corridor: all teaching props are the single originals from the question beat
    const set=ctx.held("path_set");
    const route=ctx.held("path_line");
    const manager=ctx.held("door_manager");
    const other=ctx.held("door_other");
    const hr=ctx.held("door_hr");
    const compliance=ctx.held("door_compliance");
    const line=ctx.held("door_line");
    const person=ctx.held("maya");
    const sign=ctx.held("question_sign");
    // Followers need their own held lifetime as well as the leader's exit choreography.
    const followers=[
      ctx.held("manager_sign"),ctx.held("other_sign"),ctx.held("hr_sign"),
      ctx.held("compliance_sign"),ctx.held("line_sign"),ctx.held("line_tag"),
      ctx.held("path_fork"),ctx.held("path_past"),ctx.held("path_kerb")
    ];
    const path=set.handle;
    const maya=person.handle;
    const another=ctx.cue("Another door.");
    set.handle.setState("day",another);
    m.exit(sign,ctx.start,"recede");
    other.handle.setState("other:lit",another);
    route.handle.setState("lines_past",another);
    m.draw(path.past,another,{dur:ctx.style.dur("draw")});
    hr.handle.setState("hr:lit",ctx.cue("HR"));
    compliance.handle.setState("compliance:lit",ctx.cue("compliance"));
    line.handle.setState("line:lit",ctx.cue("speak-up line"));
    // @form offered_alternatives: front-view pose and open palm point toward the available doors
    maya.pose("present",another,{dur:ctx.style.dur("move")});
    maya.emotion("relief",another);
    maya.hold("hand_r","palm_up_offer",another,ctx.end);
    maya.emotion("smile",ctx.cue("speak-up line"));
    maya.gesture("nod",ctx.cue("speak-up line"),ctx.speechEnd);
    [set,route,manager,other,hr,compliance,line,person,...followers].forEach(E=>{E.exit="recede";});
  }
});
