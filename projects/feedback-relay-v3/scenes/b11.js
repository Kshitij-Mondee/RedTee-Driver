// @design kind_and_specific_share_a_counter: a heart note lands on the three-line sheet between two relaxed people
// Treatments: (1) static sheet+note; (2) sheet slides, note drops, lean and nod (chosen); (3) card.
Loom.scene("b11", {
  build(ctx, props) {
    const kit = ctx.kit;
    const sv = (tag, a, p) => Loom.svg(tag, a || {}, p);
    const back = ctx.el("corner_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const cb = Loom.lesson.coffee_corner(ctx, back.inner, { layer: "back" });
    if (cb && cb.hook && cb.hook.g) cb.hook.g.style.opacity = 0;
    const SIZE = 600, Y = 620;
    const man = ctx.el("manager", { x: 520 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const dev = ctx.el("dev", { x: 1400 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const gm = sv("g", {}, man.inner), gd = sv("g", {}, dev.inner);
    kit.peep(gm, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
    kit.peep(gd, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
    const front = ctx.el("corner_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    Loom.lesson.coffee_corner(ctx, front.inner, { layer: "front" });

    const sh = ctx.el("sheet", { x: 690, y: 735, w: 560, h: 165, kind: "card", exit: "recede" });
    const gs = sv("g", {}, sh.inner);
    Loom.lesson.build_board(ctx, gs, { variant: "sheet", w: 560, words: false });
    const tS = Math.max(ctx.start + 0.05, ctx.cue("Specific is not harsh"));
    gs.style.opacity = 0;
    Loom.drive((e, raw) => {
      gs.setAttribute("transform", "translate(" + (-600 * (1 - e)) + " 0)");
      gs.style.opacity = raw > 0 ? 1 : 0;
    }, tS, 0.7, "overshoot");

    const note = ctx.el("sticky_note", { x: 960, y: 570, w: 300, h: 270, kind: "card", exit: "recede" });
    sv("path", { d: "M150 250 C0 150 20 30 150 100 C280 30 300 150 150 250 Z", fill: ctx.c("accent"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, note.inner);
    kit.text(note.inner, "specific,", { role: "label", x: 50, y: 100, w: 200, h: 44, align: "center", valign: "middle", color: "field", weight: 400, size: 30, maxLines: 1 });
    kit.text(note.inner, "not harsh", { role: "label", x: 50, y: 142, w: 200, h: 44, align: "center", valign: "middle", color: "field", weight: 400, size: 30, maxLines: 1 });
    Loom.motion.drop(note, Math.max(tS + 0.5, ctx.cue("not harsh") - 0.1));

    const tL = ctx.cue("Said with care");
    Loom.drive((e) => { gd.setAttribute("transform", "rotate(" + (-5 * e) + " 300 560)"); }, tL, 0.6, "move");
    const tN = ctx.cue("protects the relationship");
    Loom.drive((e, raw) => { gm.setAttribute("transform", "translate(0 " + (10 * Math.sin(raw * Math.PI)) + ")"); }, tN, 0.5, "linear");
  }
});
