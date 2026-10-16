// @design sentence_performed: the speaker's bubble prints the lesson sentence in the order spoken
/* Treatments: (A) static bubble with full sentence (rejected, no performance), (B) words fly in from the board (rejected, breaks the room),
 * (C) CHOSEN: bubble unfolds from Priya, clauses unmask-print on their words, effect in accent. */
Loom.scene("b48", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const W = 1000, H = 420;
    const bub = ctx.el("speech_bubble", { x: 300, y: 130, w: W, h: H + 60, kind: "bubble", exit: "recede" });
    kit.rect(bub.inner, 0, 0, W, H, { fill: "surface", r: 56 });
    kit.polygon(bub.inner, [[140, H - 4], [90, H + 56], [250, H - 4]], { fill: "surface" });
    m.reveal(bub, ctx.cue("In today's meeting") - 0.1, { dy: 20 });

    const beh = ctx.el("behaviour_clause", { x: 350, y: 170, w: 900, h: 170, kind: "text", exit: "recede" });
    kit.text(beh.inner, "In today's meeting, you interrupted Sam twice, while she was presenting.", { role: "lead", x: 0, y: 0, w: 900, h: 170, maxLines: 3, color: "ink", weight: 700 });
    m.unmask(beh, ctx.cue("you interrupted Sam twice") - 0.9, { dir: "ltr", dur: 3.2 });

    const eff = ctx.el("effect_clause", { x: 350, y: 360, w: 900, h: 80, kind: "text", exit: "recede" });
    kit.text(eff.inner, "I lost track of her point.", { role: "lead", x: 0, y: 0, w: 900, h: 80, maxLines: 1, color: "accent", weight: 800 });
    m.unmask(eff, ctx.cue("I lost track of her point"), { dir: "ltr", dur: 1.5 });
    void ctx.cue("while she was presenting");
  },
});
