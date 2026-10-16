// @design breached_shop_becomes_shared_list: a forced Shop door and copied password list show a breach elsewhere travelling onward
/* Treatments: 1) static breach label. 2) list drops then leaves. 3) many flying cards. Chosen: one long moving list, so sharing reads as a sequence. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const tBreach = ctx.cue("Then the shopping site is breached.");
    const tControl = ctx.cue("Her company never controlled it.");
    const tList = ctx.cue("The password lands in a list.");
    const tShared = ctx.cue("Lists get shared.");
    const wall = ctx.held("door_wall");
    const shop = ctx.held("door_shop");
    const work = ctx.held("door_work");
    const card = ctx.held("keycard");
    const shopDoor = shop.handle;
    const workDoor = work.handle;
    const cardPart = card.handle;
    // @form breach_tag: danger label connected to the compromised shopping door
    const breach = ctx.el("breach_tag", { x: 90, y: 280, w: 460, h: 80, kind: "text", exit: "wipe" });
    kit.rect(breach.inner, 0, 0, 410, 76, { fill: "neg", r: 6 });
    kit.text(breach.inner, "Shop: breached", { role: "body", x: 18, y: 16, w: 370, h: 52, maxLines: 1, color: "onAccent" });
    kit.line(breach.inner, 410, 38, 500, 150, { stroke: "neg", sw: 3 });
    // @form list_sheet: dark evidence sheet carrying copies of the card
    const list = ctx.el("list_sheet", { x: 600, y: 710, w: 850, h: 150, kind: "card", exit: "displace" });
    kit.rect(list.inner, 0, 0, 850, 150, { fill: "surface", r: 8, stroke: "line" });
    kit.line(list.inner, 35, 74, 810, 74, { stroke: "line", sw: 2, opacity: 0.55 });
    const copyA = Loom.lesson.keycard(ctx, list.inner, { x: 55, y: 17, w: 130, seed: "dana-password", state: "copy" });
    const copyB = Loom.lesson.keycard(ctx, list.inner, { x: 250, y: 17, w: 130, seed: "dana-password", state: "copy" });
    const copyC = Loom.lesson.keycard(ctx, list.inner, { x: 445, y: 17, w: 130, seed: "dana-password", state: "copy" });
    const copyD = Loom.lesson.keycard(ctx, list.inner, { x: 640, y: 17, w: 130, seed: "dana-password", state: "copy" });
    shopDoor.setState("forced", tBreach);
    m.unmask(breach, tBreach + 0.35);
    workDoor.setState("shut", tControl);
    cardPart.setState("copy", tList);
    m.drop(list, tList);
    m.travel(list, tShared + 0.2, { x: 2020, y: 710, scale: 1 });
  },
});
