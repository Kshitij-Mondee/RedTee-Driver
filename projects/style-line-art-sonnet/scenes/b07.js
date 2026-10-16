// @design same_question_decides_the_file: the one harm question hovers over the hook's list, people appear, outline redraws in its class colour
// Treatments: (1) static page with a caption; (2) list + qmark + people drawn as said (chosen); (3) split before/after pages.
Loom.scene("b07", {
  build(ctx) {
    const { m, kit } = ctx;
    const tint = ctx.el("vault_tint", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    kit.rect(tint.inner, 0, 0, 1920, 1080, { fill: "field2", r: 0, flat: true });

    // @form customer_list: the hook's attachment page, large, dashed grey until the harm question decides it
    const S = 1.9;
    const L = ctx.el("customer_list", { x: 470, y: 130, w: 280 * S, h: 360 * S, kind: "card", exit: "none" });
    const item = Loom.lesson.item(ctx, L.inner, { variant: "customer_list", scale: S, x: 0, y: 0 });
    const tList = ctx.cue("Now the customer list");
    item.drawIn(tList, 1.1);

    const tDetails = ctx.cue("personal details");
    item.printRows(tDetails, 0.09, 0.35);

    // @form qmark: the harm question as one line question mark
    const Q = ctx.el("qmark", { x: 1130, y: 120, w: 208, h: 390, kind: "icon", exit: "recede" });
    const hm = Loom.lesson.harm_mark(ctx, Q.inner, { scale: 1.3, x: 0, y: 0 });
    const tHarm = ctx.cue("If it got out");
    hm.drawOn(tHarm, 0.9);
    hm.showLabel(tHarm + 0.9, 0.4);
    const tConf = ctx.cue("Confidential");
    hm.hoverFor(tHarm + 0.9, tConf, 6);

    // @form people_row: real people who could be harmed
    const P = ctx.el("people_row", { x: 1070, y: 620, w: 4 * 76 * 1.5, h: 80 * 1.5, kind: "icon", exit: "recede" });
    const pr = Loom.lesson.people_row(ctx, P.inner, { n: 4, scale: 1.5, x: 0, y: 0 });
    const tPeople = ctx.cue("real people could be harmed");
    pr.drawIn(tPeople, 0.18, 0.5);

    item.setClass("confidential", tConf, 0.6);
    hm.fadeOut(tConf + 0.3, 0.5);
  },
});
