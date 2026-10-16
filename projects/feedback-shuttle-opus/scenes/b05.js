// @design word_becomes_label: the verdict's key word leaves the bubble and sticks on Leo as a name tag
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const setEl = ctx.held("set");
    const leoEl = ctx.held("leo");
    if (!setEl) { Loom.error("held_missing", "b05: ctx.held(\"set\") returned nothing"); }
    if (!leoEl) { Loom.error("held_missing", "b05: ctx.held(\"leo\") returned nothing"); }
    // @form verdict_bubble_return: You's verdict, tail toward You off screen left
    const bubbleEl = ctx.el("verdict_bubble", { x: 120, y: 260, w: 520, h: 160, kind: "bubble", exit: "recede" });
    const bubble = Loom.lesson.speech_bubble(ctx, bubbleEl.inner, { w: 520, h: 160, text: "Be more proactive.", tone: "you", tailSide: "left" });
    bubbleEl.ui = bubble;
    bubble.setState("in", ctx.start + 0.3);
    // @form proactive_tag: starts as the word inside the bubble, kept by b06
    const tagEl = ctx.el("name_tag", { x: 330, y: 110, w: 260, h: 150, kind: "token", exit: "none" });
    const tag = Loom.lesson.name_tag(ctx, tagEl.inner, { w: 260, h: 150 });
    tagEl.ui = tag;
    const tP = ctx.cue("Proactive");
    m.pop(tagEl, tP);
    tag.setState("in_bubble", tP);
    // land smaller (60%) and lower, on Leo's chest/collar, clear of chin and mouth,
    // just above the table edge (y 760 in leo_close). m.travel's {x,y} is relative
    // to the element's own placement (330,110), so final = 330+1150, 110+560.
    const tL = ctx.cue("a label about Leo");
    m.travel(tagEl, tL, { x: 1150, y: 560, scale: 0.6 });
    tag.setState("stuck", tL + 0.6);
    // @form label_sign: names what the tag is, beside the tag, clear of the face
    const signEl = ctx.el("label_sign", { x: 1125, y: 670, w: 340, h: 90, kind: "card", exit: "recede" });
    kit.rect(signEl.inner, 0, 0, 340, 90, { fill: "surface", stroke: "ink", sw: 4, r: 10 });
    kit.text(signEl.inner, "Label: who he is", { role: "label", x: 14, y: 8, w: 312, h: 74, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    const tS = ctx.cue("not something he did");
    m.pop(signEl, tS);
    bubble.setState("out", tS + 0.2);
    const tD = ctx.cue("defensive");
    if (leoEl) {
      m.travel(leoEl, tD, { x: 30, y: 0 });
      leoEl.ui.face("neutral", tD);
    }
  },
});
