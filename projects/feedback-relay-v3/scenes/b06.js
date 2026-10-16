// @design agreed_step_completes_board: two marker ticks sign off the step, then the last line completes a three-line board
Loom.scene("b06", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.motion || Loom.motion;
    const bgE = ctx.el("board_frame", { x: 0, y: 0, w: 1920, h: 1080, kind: "card", exit: "none" });
    kit.rect(bgE.inner, 0, 0, 1920, 1080, { fill: "surface2", crisp: true });
    kit.rect(bgE.inner, 186, 60, 1548, 764, { fill: "field2", r: 16, flat: true });
    const bE = ctx.el("board", { x: 210, y: 84, w: 1500, h: 716, kind: "card", exit: "none" });
    const B = Loom.lesson.build_board(ctx, bE.inner, { variant: "board" });
    B.setState("line2", ctx.start);
    const tE = ctx.el("table_edge", { x: 0, y: 840, w: 1920, h: 240, kind: "card", exit: "none" });
    kit.rect(tE.inner, -20, 0, 1960, 44, { fill: "surface", flat: true });
    kit.rect(tE.inner, -20, 44, 1960, 200, { fill: "field2", flat: true });

    const keepBox = (name, x, y, w, h) => ctx.el(name, { x: 210 + x, y: 84 + y, w: w, h: h, kind: "card", exit: "none" });
    keepBox("camera_icon", 60, 90, 120, 90); keepBox("line1", 215, 72, 870, 96); keepBox("label_behaviour", 1115, 102, 360, 44);
    keepBox("chair_icon", 60, 290, 120, 90); keepBox("line2", 215, 272, 870, 96); keepBox("label_effect", 1115, 302, 360, 44);
    const tStep = ctx.cue("a small step");
    const tAgree = ctx.cue("agreed together");
    const tShare = ctx.cue("share a view first");
    const tNext = ctx.cue("the next step");
    const tModel = ctx.cue("One common model");

    B.dim(1, tStep, 0.5);

    const tag = ctx.el("tag_agreed", { x: 440, y: 730, w: 400, h: 60, kind: "label", exit: "none" });
    kit.text(tag.inner, "agreed together", { role: "label", x: 0, y: 0, w: 400, h: 60, align: "right", valign: "middle", color: "ink", weight: 400, size: 36, maxLines: 1 });
    m.drop(tag, tAgree + 0.3);

    const tick = (name, x, tok, t) => {
      const E = ctx.el(name, { x: x, y: 730, w: 70, h: 60, kind: "mark", exit: "recede" });
      const p = Loom.svg("path", { d: "M8 32 L28 52 L62 10", fill: "none", stroke: ctx.c(tok), "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1 }, E.inner);
      Loom.drive((e) => { p.setAttribute("stroke-dashoffset", String(1 - e)); }, t, 0.3, "move");
    };
    tick("tick_manager", 870, "cloth", tAgree + 0.7);
    tick("tick_dev", 960, "cloth2", tAgree + 1.1);

    B.show(2, "icon", tShare + 0.1, 0.4);
    B.show(2, "text", tShare, 0.9);
    B.show(2, "label", tNext, 0.7);

    const note = ctx.el("note_model", { x: 1240, y: 760, w: 400, h: 50, kind: "label", exit: "recede" });
    kit.text(note.inner, "one common model", { role: "label", x: 20, y: 0, w: 360, h: 50, align: "center", valign: "middle", color: "muted", weight: 400, size: 30, maxLines: 1 });
    m.drop(note, tModel);
  }
});
