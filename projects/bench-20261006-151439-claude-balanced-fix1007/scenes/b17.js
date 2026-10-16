// @design camera_fills_sentence: a viewfinder inset replays the meeting while the first slot of the board sentence fills word by word
// Treatments: (1) static board with slot fill, (2) full-screen replay, (3) split: inset + board fill. Chosen: 3, words land as the events happen.
Loom.scene("b17", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const c = ctx.c;
    const tIn = ctx.cue("In today's meeting");
    const tInt = ctx.cue("you interrupted Sam twice");
    const tPres = ctx.cue("while she was presenting");

    // board slot one (left)
    const B = ctx.el("board_slot_one", { x: 96, y: 230, w: 940, h: 520, kind: "card", exit: "none" });
    kit.card(B.inner, 0, 0, 940, 520, { fill: c("surface"), r: 24, stroke: c("ink") });
    kit.kicker(B.inner, "Slot one", { x: 32, y: 28, w: 400, h: 40 });
    const lines = ["In today's meeting,", "you interrupted Sam twice,", "while she was presenting."];
    const times = [tIn, tInt, tPres];
    const texts = lines.map((s, i) => kit.text(B.inner, s, { role: "lead", x: 40, y: 110 + i * 120, w: 860, h: 90, color: c("accent"), weight: 700, maxLines: 1 }));
    texts.forEach((t, i) => { t.setAttribute("opacity", 0); m.reveal(t, times[i], {}); });

    // viewfinder inset (right)
    const V = ctx.el("viewfinder_inset", { x: 1120, y: 230, w: 700, h: 520, kind: "instrument", exit: "recede" });
    kit.rect(V.inner, 0, 0, 700, 520, { fill: c("field2"), r: 16, stroke: c("ink") });
    kit.line(V.inner, 0, 440, 700, 440, { stroke: c("line"), sw: 3 });
    kit.icon(V.inner, "camera", { x: 632, y: 20, size: 48, color: c("ink") });

    // @form presenter_slide: the slide Sam presents
    kit.rect(V.inner, 60, 70, 200, 140, { fill: c("surface"), r: 8, stroke: c("ink") });
    kit.line(V.inner, 90, 110, 230, 110, { stroke: c("muted"), sw: 6 });
    kit.line(V.inner, 90, 145, 200, 145, { stroke: c("muted"), sw: 6 });

    const sam = ctx.el("Sam_presenting", { x: 270, y: 150, w: 180, h: 280, kind: "character", parent: V });
    kit.peep(sam.inner, "woman", "explaining", { x: 0, y: 0, size: 260 });
    const dev = ctx.el("Dev_cutting_in", { x: 480, y: 170, w: 180, h: 260, kind: "character", parent: V });
    kit.peep(dev.inner, "man", "surprised", { x: 0, y: 0, size: 240, flip: true });

    m.reveal(V.outer, ctx.start + 0.2, {});
    m.pop(sam.outer, tPres - 0.0 < tIn ? tIn : tIn, {});
    m.pop(dev.outer, tInt, {});
    // two quick cut-ins
    const hop = (t) => Loom.tween(dev.life, { y: 0 }, { y: -26 }, t, { dur: 0.18, ease: "overshoot" });
    hop(tInt + 0.15);
    hop(tInt + 1.1);
    m.emphasis(texts[1], tInt + 0.1);
  }
});
