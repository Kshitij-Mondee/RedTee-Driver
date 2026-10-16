// @design same_screen_two_people: two different people, two identical screens, one sign between them
/* b03 - A password is something you know. Anyone who knows it looks like Maya.
 * Treatments considered: (A) a definition card (rejected: words over the picture, the old lesson's deck feel);
 * (B) CHOSEN: the two welcomes stay side by side; an equals badge settles on the divider with the words something you
 * know; on "looks like Maya" a ring draws round the other screen's welcome. A static composition with signalling.
 */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    M.hold(ctx, M.splitNames("_1").concat(["lap_1", "screen_maya", "mon_1", "screen_other", "thief_1", "phone_1"]));
    const tKnow = ctx.cue("something you know");
    const tLooks = ctx.cue("looks like Maya");
    // @form equals_badge: a round badge on a divider saying two things are the same, with its reason under it
    const bd = ctx.el("equals_badge", { x: 860, y: 330, w: 200, h: 140, kind: "mark", exit: "recede" });
    svg("circle", { cx: 100, cy: 70, r: 64, fill: S.c("surface"), stroke: S.c("accent2"), "stroke-width": 5 }, bd.inner);
    kit.path(bd.inner, "M70 56 H130 M70 84 H130", { stroke: "accent2", sw: 9 });
    m.pop(bd, tKnow + 0.05);
    Loom.sfx("tick", tKnow + 0.1);
    const lab = ctx.el("know_label", { x: 700, y: 770, w: 520, h: 100, kind: "label", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 520, height: 96, rx: 14, fill: S.c("surface"), stroke: S.c("accent2"), "stroke-width": 3 }, lab.inner);
    kit.text(lab.inner, "something you know", { role: "lead", size: 40, x: 16, y: 0, w: 488, h: 96, align: "center", valign: "middle", maxLines: 2, weight: 700, color: "ink" });
    m.reveal(lab, tKnow + 0.25, { dy: 10 });
    M.ring(ctx, "ring_other", { x: 1030 + 64, y: 130 + 66 + 92 + 100, w: 820 - 128, h: 110 }, tLooks + 0.1, { tone: "accent2" });
  },
});
