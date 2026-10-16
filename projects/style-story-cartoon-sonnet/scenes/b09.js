// @design greyed_door_at_fork: the one door she would try first goes dim, and she is left at a fork under a hanging question
// Treatments: (A) static: dim path, greyed door, sign hung at once; (B) CHOSEN: door greys on "her own manager", Maya worries, the sign drops on the question, slow tilt and sway hold the pause; (C) camera push on the grey door (rejected: layout must match b07 and b10).
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const sv = (t, a, p) => Loom.svg(t, a, p);
    const C = ctx.c;

    // back layer: wall, floor, path, fork line, doors and signs (dim; all signed, manager greys on the cue)
    const P = Loom.lesson.door_path(ctx, ctx.g, { layer: "back", dim: true, lines: "fork", doors: { manager: "signed", other: "signed", hr: "signed", compliance: "signed", line: "signed" } });

    // Maya between the layers: her feet sit behind the near kerb
    const A = P.anchors;
    const maya = ctx.character("maya", "maya", { x: A.maya.x, y: A.maya.y, scale: A.maya.scale, pose: "idle", skin: 0, top: "cloth" });

    // front layer: the near kerb
    Loom.lesson.door_path(ctx, ctx.g, { layer: "front" });

    // the twist: the manager's door greys out, small cross on the sign
    const tManager = ctx.cue("her own manager");
    P.setState("manager:greyed", tManager);
    maya.pose("worried", tManager, { dur: 0.5 });
    maya.emotion("worried", tManager);

    // hanging sign over the fork: the question in accent
    // @form hanging_question_sign: a sign on a hook that asks where she goes
    const qs = ctx.el("question_sign", { x: A.hook.x - 190, y: A.hook.y - 10, w: 440, h: 160, kind: "card" });
    const sg = sv("g", {}, qs.inner);
    sv("line", { x1: 190, y1: 9, x2: 50, y2: 38, stroke: C("ink"), "stroke-width": 4, "stroke-linecap": "round" }, sg);
    sv("line", { x1: 190, y1: 9, x2: 390, y2: 38, stroke: C("ink"), "stroke-width": 4, "stroke-linecap": "round" }, sg);
    kit.rect(sg, 0, 36, 440, 118, { fill: "surface", r: 10 });
    kit.text(sg, "Her manager is involved.", { role: "label", x: 6, y: 42, w: 428, h: 42, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    kit.text(sg, "Where now?", { role: "lead", x: 6, y: 82, w: 428, h: 54, align: "center", valign: "middle", maxLines: 1, color: "accent", weight: 400 });
    const tAsk = ctx.cue("Where does she go");
    m.drop(qs, tAsk);

    // the pause: a slow sway of the sign from its hook, Maya looks along the path with a slow tilt
    Loom.drive((e) => {
      const a = 1.6 * Math.sin(e * 6.2832 * 1.5) * (1 - 0.5 * e);
      sg.setAttribute("transform", "rotate(" + a.toFixed(2) + " 190 9)");
    }, tAsk + 0.8, 3.4, "linear");
    maya.pose("think", tAsk, { dur: 0.7 });
    maya.gesture("tilt", tAsk + 0.3, tAsk + 3.6);
  },
});
