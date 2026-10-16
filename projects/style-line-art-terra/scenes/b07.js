// @design harm_decides_outline: question mark turns a page outline magenta
// Treatment A: a static page with a single colour change.
// Treatment B: a large page, question mark and people arrive in narration order.
// Treatment C: a moving document crosses a row of people.
// Chosen B, because the harm question visibly causes the classification while preserving a calm reading floor.
Loom.scene("b07", {
  build(ctx, props) {
    const listAt = { x: 440, y: 204, w: 490, h: 630 };
    const listCue = ctx.cue("Now the customer list.");
    const detailCue = ctx.cue("personal details");
    const harmCue = ctx.cue("real people could be harmed");
    const classCue = ctx.cue("Confidential.");

    // @form vault_tint_band: warm station field
    const band = ctx.el("vault_tint_band", { x: 96, y: 150, w: 1728, h: 710, kind: "scenery", exit: "recede" });
    ctx.kit.rect(band.inner, 0, 0, 1728, 710, { fill: "field2", r: 16, stroke: "none" });

    // @form customer_list: document whose outline carries its class
    const customerList = ctx.el("customer_list", { x: listAt.x, y: listAt.y, w: listAt.w, h: listAt.h, kind: "instrument", exit: "none" });
    const item = Loom.lesson.item(ctx, customerList.inner, {
      x: 0, y: 0, w: listAt.w, h: listAt.h,
      variant: "customer_list", cls: "none", tick: false
    });
    item.drawIn(listCue, 1.0);
    item.printRows(detailCue, 0.09, 0.35);
    item.setClass("confidential", classCue, 0.6);

    // @form harm_mark: hovering question asks about consequences
    const qmark = ctx.el("harm_mark", { x: 1012, y: 236, w: 240, h: 450, kind: "icon", exit: "recede" });
    const harm = Loom.lesson.harm_mark(ctx, qmark.inner, { x: 0, y: 0, w: 240, h: 450 });
    harm.drawOn(harmCue, 0.7);
    harm.showLabel(harmCue + 0.35, 0.35);
    harm.hoverFor(harmCue + 0.65, classCue + 0.45, 6);

    // @form people_row: real people affected by the list
    const people = ctx.el("people_row", { x: 1020, y: 688, w: 304, h: 107, kind: "icon", exit: "recede" });
    const peopleRow = Loom.lesson.people_row(ctx, people.inner, { x: 0, y: 0, w: 304, h: 107, n: 3, color: "muted" });
    peopleRow.drawIn(harmCue + 0.2, 0.15, 0.45);
  }
});
