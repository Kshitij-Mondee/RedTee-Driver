// @design callback_limit_pair: the earlier picture returns changed, with the earlier idea beside it, and one rule links the two
/* b24, callback: the b04 server, now liquid cooled, still has an air stream; the blanking-panel rack returns beside it.
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. a before and after slider of the b04 server (rejected: the limit is not a change of the server, it is a
 *      leftover; a slider reads as a comparison of two states);
 *   B. a text card "other parts still use air" over the server (rejected: words standing in for the picture);
 *   C. WINNER: the b04 server in its liquid form (plate and hoses already lit), the thin air stream runs through the
 *      other parts, then the small blanking-panel card settles beside it and ONE thin rule draws through both pictures
 *      between their cool side and their warm side: the same idea, keep warm and cool apart.
 * The air stream is the only moving thing that teaches (accent_on: air_stream, so the "Still needs air" label takes
 * the accent). Parts come from the lesson kit (server_side, rack); nothing is redrawn.
 */
Loom.scene("b24", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const S = Loom.style;
    const tLimit = ctx.cue("One limit");
    const tAir = ctx.cue("Other parts still use air");
    const tPanel = ctx.cue("Same idea as the blanking panel");
    const tApart = ctx.cue("keep warm and cool apart");

    // ---- the server (kit server_side, liquid form), natural 900 x 360 drawn at 1056 wide
    const SW = 1056, SH = Math.round(SW * 360 / 900), SX = 96, SY = 296;
    const srvE = ctx.el("server_side", { x: SX, y: SY, w: SW, h: SH, kind: "instrument", exit: "recede" });
    const srv = Loom.lesson.server_side(ctx, srvE.inner, { w: SW, state: "liquid", labels: { front: false, back: false }, hide: ["intake", "exhaust"] });
    const sc = srv.scale;

    // ---- the card: a small panel holding the rack side view in its blanked state
    const CW = 580, CH = 740, CX = 1244, CY = 150;
    const cardE = ctx.el("panel_card", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    kit.card(cardE.inner, 0, 0, CW, CH, { fill: "surface", r: 18 });
    // "Blanking panel" is the narration's own word for it; one label, measured, centred at the top of the card
    // @form earlier_picture_card: a small card that returns an earlier picture beside the current one
    const lab = kit.text(cardE.inner, "Blanking panel", { role: "label", weight: 700, x: 24, y: 22, w: CW - 48, h: 56, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    const RK = 0.72;
    const rk = Loom.lesson.rack(ctx, cardE.inner, { view: "side", state: "blanked", w: 700 * RK, h: 860 * RK, x: (CW - 700 * RK) / 2 - 14, y: 92 });

    // ---- the one rule: a thin vertical line through the middle of each picture, between its cool and warm halves
    // @form shared_rule: one thin rule drawn through two pictures at once to mark the same boundary in both
    const ruleS = ctx.el("apart_rule_server", { x: SX, y: SY, w: SW, h: SH, kind: "connector", exit: "recede" });
    const rsx = 450 * sc;
    const ruleSPath = kit.path(ruleS.inner, `M ${rsx} ${40 * sc} V ${302 * sc}`, { stroke: "muted", sw: 3 });
    const ruleC = ctx.el("apart_rule_card", { x: CX, y: CY, w: CW, h: CH, kind: "connector", exit: "recede" });
    const rcx = rk.anchors.top.x;
    const ruleCPath = kit.path(ruleC.inner, `M ${rcx} ${rk.anchors.top.y - 12} V ${rk.anchors.bottom.y + 12}`, { stroke: "muted", sw: 3 });

    // ================================================================ the timeline
    // "One limit": the server settles, plate and hoses lit (beads in the hoses run from the start)
    m.settle(srvE, tLimit);
    srv.flow(ctx.start, ctx.end, { speed: 110 });
    // "Other parts still use air": the thin air stream runs through the other parts; label Still needs air (accent)
    srv.reveal("intake", tAir, { dur: 0.5, dy: 0 });
    srv.reveal("exhaust", tAir + 0.15, { dur: 0.5, dy: 0 });
    srv.reveal("label_air", tAir + 0.3);
    srv.namePill("air", 1, tAir + 0.3, 0.4);
    // "Same idea as the blanking panel": the card settles beside the server
    m.settle(cardE, tPanel);
    rk.flow(ctx.start, ctx.end, { speed: 110 });
    // "keep warm and cool apart": the rule draws on both pictures at once
    m.reveal(ruleS, tApart, { dy: 0, dur: 0.01 });
    m.reveal(ruleC, tApart, { dy: 0, dur: 0.01 });
    m.draw(ruleSPath, tApart, { dur: 0.6 });
    m.draw(ruleCPath, tApart, { dur: 0.6 });
  },
});
