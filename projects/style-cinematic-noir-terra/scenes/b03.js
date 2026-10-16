// @design one_lit_card_opens_two_system_doors: a warm dusk corridor proves password reuse as the same physical card fitting Shop and Work
/* Treatments: 1) static pair of doors with card between them. 2) card travels between doors. 3) a corridor row. Chosen: two doors and one travelling card, because the reuse is visible. */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const tMonths = ctx.cue("Months ago, Dana used one password twice.");
    const tShop = ctx.cue("Once on a shopping site.");
    const tWork = ctx.cue("Once at work.");
    // @form door_wall: the dusk corridor field behind both system doors
    const wall = ctx.el("door_wall", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "none" });
    kit.rect(wall.inner, 0, 0, 1920, 930, { fill: "field2", r: 0 });
    kit.rect(wall.inner, 0, 600, 1920, 330, { fill: "surface2", r: 0 });
    kit.line(wall.inner, 0, 602, 1920, 602, { stroke: "line", sw: 3, opacity: 0.35 });
    // @form door_shop: the shopping system door
    const shop = ctx.el("door_shop", { x: 440, y: 210, w: 400, h: 620, kind: "instrument", exit: "none" });
    const shopDoor = Loom.lesson.door(ctx, shop.inner, { x: 0, y: 0, w: 400, name: "Shop", state: "shut" });
    // @form door_work: the work system door
    const work = ctx.el("door_work", { x: 1080, y: 210, w: 400, h: 620, kind: "instrument", exit: "none" });
    const workDoor = Loom.lesson.door(ctx, work.inner, { x: 0, y: 0, w: 400, name: "Work", state: "shut" });
    // @form keycard: the same password card moves from one lock to the other
    const card = ctx.el("keycard", { x: 850, y: 470, w: 220, h: 140, kind: "token", exit: "none" });
    const cardPart = Loom.lesson.keycard(ctx, card.inner, { x: 0, y: 0, w: 220, seed: "dana-password", state: "lit" });
    // @form rewind_tag: quiet time marker on clear dark field
    const tag = ctx.el("rewind_tag", { x: 120, y: 120, w: 330, h: 58, kind: "text", exit: "wipe" });
    kit.text(tag.inner, "Months ago", { role: "lead", x: 0, y: 0, w: 330, h: 58, maxLines: 1, color: "accent4" });
    m.unmask(tag, tMonths);
    m.settle(card, tMonths);
    m.travel(card, tShop, { x: -240, y: 15, scale: 0.72 });
    shopDoor.setState("turning", tShop + 0.55);
    m.travel(card, tShop + 1.25, { x: 0, y: 0, scale: 1 });
    m.travel(card, tWork, { x: 400, y: 15, scale: 0.72 });
    workDoor.setState("turning", tWork + 0.42);
    m.travel(card, tWork + 0.95, { x: 0, y: 0, scale: 1 });
  },
});
