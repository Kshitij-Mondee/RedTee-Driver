// @design unsure_step_up: a doubtful thing climbs one step of colour, then a line leads to the person who decides
// Treatments: (1) static: item, ladder and owner all drawn at once with captions; (2) the chosen one: scaffold ladder, item steps up on the spoken words, arrow then page draw in narration order; (3) a split screen of two panels. Chosen: 2, the step and the arrow are the two actions of the rule.
Loom.scene("b12", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.m;
    const NS = "http://www.w3.org/2000/svg";
    const tCls = ctx.cue("Treat it as the higher class");
    const tNot = ctx.cue("Not sure");
    const tOwn = ctx.cue("ask its owner");
    const tPol = ctx.cue("Our own policy decides each case");
    const t0 = ctx.start + 0.1;

    // @form step_ladder: two steps of colour, internal low and confidential high
    const S = ctx.el("steps", { x: 196, y: 626, w: 532, h: 208, kind: "scenery", exit: "recede" });
    const s1 = kit.path(S.inner, "M20 104H248Q264 104 264 120V188Q264 204 248 204H20Q4 204 4 188V120Q4 104 20 104Z", { stroke: "accent2", sw: 3, fill: "none" });
    const s2 = kit.path(S.inner, "M264 104V20Q264 4 280 4H508Q524 4 524 20V188Q524 204 508 204H264", { stroke: "accent3", sw: 3, fill: "none" });
    const l1 = kit.text(S.inner, "Internal", { role: "label", x: 14, y: 134, w: 240, h: 56, align: "center", valign: "middle", color: "ink" });
    const l2 = kit.text(S.inner, "Confidential", { role: "label", x: 274, y: 134, w: 240, h: 56, align: "center", valign: "middle", color: "ink" });
    m.draw(s1, t0, { dur: 0.6 });
    m.draw(s2, t0 + 0.3, { dur: 0.6 });
    m.reveal(l1, t0 + 0.6, { dur: 0.3 });
    m.reveal(l2, t0 + 0.8, { dur: 0.3 });

    // @form unsure_item: a dashed grey page that has no class yet
    const I = ctx.el("unsure_item", { x: 196, y: 300, w: 540, h: 440, kind: "card", exit: "recede" });
    const wrap = document.createElementNS(NS, "g");
    I.inner.appendChild(wrap);
    const item = Loom.lesson.item(ctx, wrap, { variant: "plain", scale: 0.9, x: 0, y: 0, label: false });
    const X0 = 8, Y0 = 106, X1 = 268, Y1 = 6;
    wrap.setAttribute("transform", "translate(" + X0 + " " + Y0 + ")");
    item.drawIn(tNot, 0.9);
    item.printRows(tNot + 0.6);
    const tMove = tCls + 0.8;
    item.setClass("internal", tCls, 0.5);
    item.setClass("confidential", tMove + 0.1, 0.6);
    Loom.drive(function (e) {
      wrap.setAttribute("transform", "translate(" + (X0 + (X1 - X0) * e).toFixed(2) + " " + (Y0 + (Y1 - Y0) * e).toFixed(2) + ")");
    }, tMove, 0.5, "move");

    // @form harm_question: one-line question mark hovering over the item
    const Q = ctx.el("qmark", { x: 258, y: 126, w: 144, h: 270, kind: "icon", exit: "recede" });
    const hm = Loom.lesson.harm_mark(ctx, Q.inner, { scale: 0.9, x: 0, y: 0 });
    hm.drawOn(tNot, 0.9);
    hm.showLabel(tNot + 0.9);
    hm.hoverFor(tNot + 1.0, tCls, 5);
    hm.fadeOut(tCls + 0.3, 0.4);

    // @form go_higher: the rule printed in the class colour
    const G = ctx.el("go_higher", { x: 220, y: 560, w: 230, h: 56, kind: "text", exit: "recede" });
    const gh = kit.text(G.inner, "Go higher", { role: "lead", x: 0, y: 0, w: 230, h: 56, align: "center", valign: "middle", color: "accent3", weight: 600 });
    m.reveal(G, tMove + 0.7, { dur: 0.4 });

    // @form owner_person: the list's owner, the cast rig tess
    const own = ctx.character("Owner", "tess", { x: 1450, y: 700, scale: 0.55, pose: "idle" });
    m.reveal(own.E, tOwn, { dur: 0.4 });
    own.pose("explain", tOwn + 0.3);

    // @form owner_arrow: the one action, an arrow from the item to the owner
    const A = ctx.el("owner_arrow", { x: 716, y: 390, w: 600, h: 140, kind: "connector", exit: "recede" });
    const arr = kit.arrow(A.inner, 8, 78, 580, 78, { stroke: "accent" });
    const al = kit.text(A.inner, "Ask the owner", { role: "lead", x: 124, y: 6, w: 340, h: 56, align: "center", valign: "middle", color: "ink" });
    m.draw(arr, tOwn + 0.3, { dur: 0.8 });
    m.reveal(al, tOwn + 0.9, { dur: 0.3 });

    // @form policy_page: a small page outline labelled Our policy
    const P = ctx.el("policy_note", { x: 1350, y: 735, w: 200, h: 170, kind: "card", exit: "recede" });
    const pg = kit.path(P.inner, "M0 16Q0 0 16 0H156L200 44V154Q200 170 184 170H16Q0 170 0 154Z", { stroke: "ink", sw: 3, fill: "none" });
    const fold = kit.path(P.inner, "M156 0V44H200", { stroke: "ink", sw: 3, fill: "none" });
    const r1 = kit.path(P.inner, "M24 64H150", { stroke: "muted", sw: 3, fill: "none" });
    const r2 = kit.path(P.inner, "M24 90H120", { stroke: "muted", sw: 3, fill: "none" });
    const pl = kit.text(P.inner, "Our policy", { role: "label", x: 10, y: 110, w: 180, h: 44, align: "center", valign: "middle", color: "ink" });
    m.draw(pg, tPol, { dur: 0.8 });
    m.draw(fold, tPol + 0.5, { dur: 0.3 });
    m.draw(r1, tPol + 0.7, { dur: 0.3 });
    m.draw(r2, tPol + 0.85, { dur: 0.3 });
    m.reveal(pl, tPol + 0.9, { dur: 0.3 });
  },
});
