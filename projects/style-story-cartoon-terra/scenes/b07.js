// @design channel_path_doors_arrive_in_sequence: a colleague presents the work channels as doors opening along a paper path
/*
Treatments considered:
A. Static wall of five signs, rejected because it hides the order of channels.
B. Floating labels over an abstract route, rejected because channels belong as doors in Maya's workplace.
C. Chosen, a camera-arrival path where doors stand in spoken order and Maya offers the final choices.
*/
Loom.scene("b07", {
  build(ctx) {
    const { m } = ctx;
    const channel = ctx.cue("the channel");
    const manager = ctx.cue("manager");
    const other = ctx.cue("another manager");
    const hr = ctx.cue("HR");
    const compliance = ctx.cue("compliance");
    const line = ctx.cue("speak-up line");
    const anonymous = ctx.cue("anonymous where offered");

    // @form path_set: the office wall and floor that make the path a real place
    const pathBack = Loom.lesson.door_path(ctx, ctx.g, {
      layer: "back",
      doors: "hidden",
      lines: "none",
    });

    // @form path_line: the paper route starts at the desk corner and draws toward the doors
    m.draw(pathBack.path, channel, { dur: ctx.style.dur("draw") });
    pathBack.setState("lines_fork", channel + 0.25);

    // @form door_manager: first doorway offers the easiest start
    pathBack.setState("manager:standing", manager);
    pathBack.setState("manager:signed", manager + 0.3);
    // @form manager_sign: the first sign is the one named now
    pathBack.setState("manager:accent", manager);

    // @form door_other: the alternative manager follows without competing for emphasis
    pathBack.setState("manager:ink", other);
    pathBack.setState("other:standing", other);
    pathBack.setState("other:signed", other + 0.26);

    // @form door_hr: a third door completes the spoken pair
    pathBack.setState("hr:standing", hr);
    pathBack.setState("hr:signed", hr + 0.24);

    // @form door_compliance: the next channel stands in the established path
    pathBack.setState("compliance:standing", compliance);
    pathBack.setState("compliance:signed", compliance + 0.24);

    // @form door_line: the final doorway arrives with its clear label
    pathBack.setState("line:standing", line);
    pathBack.setState("line:signed", line + 0.24);
    // @form line_tag: the hanging tag appears only when anonymity is named
    pathBack.setState("line:hidden", ctx.start);
    pathBack.setState("line:signed", anonymous);

    // @form maya: Maya stands at the path start, then opens her palm toward the choices
    const maya = ctx.character("maya", "maya", {
      x: pathBack.anchors.maya.x,
      y: pathBack.anchors.maya.y,
      scale: pathBack.anchors.maya.scale,
      skin: 0,
      top: "cloth",
      pose: "idle",
    });
    maya.pose("present", anonymous, { dur: ctx.style.dur("enter") });
    maya.hold("hand_r", "palm_up_offer", anonymous, ctx.end);
    maya.emotion("relief", anonymous);

    // @form path_kerb: foreground kerb keeps Maya's feet behind the path edge
    Loom.lesson.door_path(ctx, ctx.g, { layer: "front" });
  },
});
