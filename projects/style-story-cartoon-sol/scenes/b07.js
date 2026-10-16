// @design doors_along_paper_path: a route opens from a familiar corner and successive labelled thresholds make the choices visible
/* Treatments: A static signed row with signalling; B camera visits one threshold per phrase;
   C chosen, a paper route draws first, then thresholds stand and signs letter in spoken order.
   Kit geometry stays fixed for the later return to this station. */
Loom.scene("b07", {
  build(ctx) {
    const {m} = ctx;
    // @form path_station: literal kit names preserve the return layout and three depth layers
    const pathCtx = Object.create(ctx);
    pathCtx.el = (name, opts) => {
      switch (name) {
        case "path_set": return ctx.el("path_set", opts);
        case "path_line": return ctx.el("path_line", opts);
        case "path_fork": return ctx.el("path_fork", opts);
        case "path_past": return ctx.el("path_past", opts);
        case "door_manager": return ctx.el("door_manager", opts);
        case "door_other": return ctx.el("door_other", opts);
        case "door_hr": return ctx.el("door_hr", opts);
        case "door_compliance": return ctx.el("door_compliance", opts);
        case "door_line": return ctx.el("door_line", opts);
        case "manager_sign": return ctx.el("manager_sign", opts);
        case "other_sign": return ctx.el("other_sign", opts);
        case "hr_sign": return ctx.el("hr_sign", opts);
        case "compliance_sign": return ctx.el("compliance_sign", opts);
        case "line_sign": return ctx.el("line_sign", opts);
        case "line_tag": return ctx.el("line_tag", opts);
        case "path_kerb": return ctx.el("path_kerb", opts);
        default: return ctx.el(name, opts);
      }
    };
    const path = Loom.lesson.door_path(pathCtx, ctx.g, {layer:"back",doors:"signed",lines:"fork"});
    const maya = ctx.character("maya", "maya", {x:330,y:940,scale:0.46,skin:0,top:"cloth",pose:"idle",emotion:"neutral"});
    const front = Loom.lesson.door_path(pathCtx, ctx.g, {layer:"front"});
    [path.set,path.path,path.fork,path.past,path.doors.manager,path.doors.other,path.doors.hr,path.doors.compliance,path.doors.line,path.signs.manager,path.signs.other,path.signs.hr,path.signs.compliance,path.signs.line,path.tag,front.kerb,maya.E].forEach(E => {E.exit="none";});
    // @form route_before_thresholds: the route supplies a spatial reference before the options
    m.draw(path.path,ctx.cue("the channel"),{dur:ctx.style.dur("draw")});
    m.draw(path.fork,ctx.cue("the channel"),{dur:ctx.style.dur("draw")});
    // @form signed_thresholds: separate door landings and lettering keep the shape ahead of its label
    m.drop(path.doors.manager,ctx.cue("manager"));
    m.unmask(path.signs.manager,ctx.cue("manager") + ctx.style.dur("move"),{dir:"ltr"});
    path.setState("manager:accent",ctx.cue("manager"));
    path.setState("manager:ink",ctx.cue("another manager"));
    m.drop(path.doors.other,ctx.cue("another manager"));
    m.unmask(path.signs.other,ctx.cue("another manager") + ctx.style.dur("move"),{dir:"ltr"});
    m.drop(path.doors.hr,ctx.cue("HR"));
    m.unmask(path.signs.hr,ctx.cue("HR") + ctx.style.dur("move"),{dir:"ltr"});
    m.drop(path.doors.compliance,ctx.cue("compliance"));
    m.unmask(path.signs.compliance,ctx.cue("compliance") + ctx.style.dur("move"),{dir:"ltr"});
    m.drop(path.doors.line,ctx.cue("speak-up line"));
    m.unmask(path.signs.line,ctx.cue("speak-up line") + ctx.style.dur("move"),{dir:"ltr"});
    m.reveal(path.tag,ctx.cue("anonymous where offered"),{dy:10});
    maya.pose("present",ctx.cue("anonymous"),{dur:ctx.style.dur("move")});
    maya.hold("hand_r","palm_up_offer",ctx.cue("anonymous"),ctx.end);
  }
});
