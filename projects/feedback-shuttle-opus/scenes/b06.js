// @design no_action_named: the label names no action, so four possible actions float in a thought cloud and none is picked
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const meta = (n) => ({ kind: "gesture", beat: "b06", name: n });
    const setEl = ctx.held("set");
    const leoEl = ctx.held("leo");
    const tagEl = ctx.held("name_tag");

    // @form thought_cloud: a paper cloud above and left of Leo with two small puffs trailing toward him
    const cloudEl = ctx.el("action_cloud", { x: 160, y: 110, w: 920, h: 540, kind: "card", exit: "recede" });
    kit.rect(cloudEl.inner, 0, 0, 920, 470, { fill: "surface", stroke: "ink", sw: 5, r: 60 });
    kit.disc(cloudEl.inner, 860, 500, 22, { fill: "surface", stroke: "ink", sw: 4 });
    kit.disc(cloudEl.inner, 900, 528, 12, { fill: "surface", stroke: "ink", sw: 4 });
    const tC = ctx.cue("doesn't say what to change");
    m.pop(cloudEl, tC);

    // @form option_cards: four possible actions, none picked
    const cards = ["Start sooner?", "Reply faster?", "Plan more?", "Ask for help?"];
    const pos = [[60, 150], [480, 150], [60, 300], [480, 300]];
    cards.forEach((txt, i) => {
      const g = Loom.svg("g", { style: "opacity:0" }, cloudEl.inner);
      kit.rect(g, pos[i][0], pos[i][1], 380, 110, { fill: "field", stroke: "ink", sw: 4, r: 10 });
      kit.text(g, txt, { role: "label", x: pos[i][0] + 12, y: pos[i][1] + 10, w: 356, h: 90, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      Loom.tween(g, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.42, ease: "overshoot" }, tC + 0.25 + i * 0.18, meta("card_" + i));
    });
    m.drift(cloudEl, tC + 1.2, ctx.end, { amp: 4, period: 3 });

    // @form which_action_title: the one accent, stamped on the cloud
    const titleEl = ctx.el("which_action", { x: 360, y: 140, w: 520, h: 100, kind: "text", exit: "recede" });
    kit.text(titleEl.inner, "Which action?", { role: "lead", x: 0, y: 0, w: 520, h: 100, align: "center", valign: "middle", maxLines: 1, color: "accent" });
    const tW = ctx.cue("Which action");
    m.stamp(titleEl, tW);

    const tF = ctx.cue("should he fix");
    if (leoEl && leoEl.ui) leoEl.ui.face("surprised", tF);

    // b07 cuts to the desk station: everything held here leaves with this beat
    [setEl, leoEl, tagEl].forEach((E) => { if (E) E.exit = "recede"; });
  },
});
