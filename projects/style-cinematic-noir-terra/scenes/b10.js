// @design fresh_cards_keep_each_door_separate: a vault issues distinct cards to two calm shut doors, then a copied Shop card fails at Work
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const tUnique = ctx.cue("unique password for every account");
    const tSite = ctx.cue("opens only that site");
    const tVault = ctx.cue("password manager");

    // Treatment A: two doors and a vault, with the failed copied card as proof. Treatment B: a static lock diagram. Treatment C: a card parade. Chosen A, because the failure needs motion.
    // @form door_wall: dark corridor wall with a restrained floor line
    const wall = ctx.el("door_wall", { x: 96, y: 120, w: 1728, h: 760, kind: "scenery", exit: "recede" });
    kit.rect(wall.inner, 0, 0, 1728, 760, { fill: "field2", r: 6 });
    kit.rect(wall.inner, 0, 590, 1728, 170, { fill: "surface2", r: 0 });
    kit.line(wall.inner, 0, 590, 1728, 590, { stroke: "line", sw: 2, opacity: 0.45 });
    kit.line(wall.inner, 80, 716, 1648, 716, { stroke: "accent3", sw: 3, opacity: 0.22 });
    m.reveal(wall, ctx.start + 0.05);

    // @form shop_door: the first calm shut system door
    const shop = ctx.el("door_shop", { x: 610, y: 265, w: 400, h: 620, kind: "instrument", exit: "recede" });
    const shopDoor = Loom.lesson.door(ctx, shop.inner, { x: 0, y: 0, w: 400, name: "Shop", state: "shut" });
    m.reveal(shop, ctx.start + 0.18);

    // @form work_door: the second calm shut system door
    const work = ctx.el("door_work", { x: 1250, y: 225, w: 400, h: 620, kind: "instrument", exit: "recede" });
    const workDoor = Loom.lesson.door(ctx, work.inner, { x: 0, y: 0, w: 400, name: "Work", state: "shut" });
    m.reveal(work, ctx.start + 0.22);

    // @form password_vault: a small safe that issues the distinct cards
    const vault = ctx.el("vault", { x: 220, y: 468, w: 330, h: 196, kind: "instrument", exit: "recede" });
    const vaultHandle = Loom.lesson.password_vault(ctx, vault.inner, { x: 0, y: 0, w: 330, seed: "b10-shop", state: "closed" });
    m.reveal(vault, tUnique);

    // @form shop_fresh_card: a fresh password card for Shop
    const shopCard = ctx.el("card_shop", { x: 680, y: 505, w: 176, h: 112, kind: "token", exit: "recede" });
    const shopHandle = Loom.lesson.keycard(ctx, shopCard.inner, { x: 0, y: 0, w: 176, seed: "b10-shop", state: "fresh" });
    // @form work_fresh_card: a different fresh password card for Work
    const workCard = ctx.el("card_work", { x: 1320, y: 465, w: 176, h: 112, kind: "token", exit: "recede" });
    const workHandle = Loom.lesson.keycard(ctx, workCard.inner, { x: 0, y: 0, w: 176, seed: "b10-work", state: "fresh" });

    // @form unique_password_label: label for the one-card-per-account rule
    const unique = ctx.el("label_unique", { x: 205, y: 340, w: 350, h: 90, kind: "text", exit: "wipe" });
    kit.text(unique.inner, "unique password", { role: "lead", x: 0, y: 0, w: 350, h: 56, maxLines: 1, color: "ink" });
    kit.line(unique.inner, 295, 58, 295, 116, { stroke: "accent", sw: 3 });

    // @form manager_label: label and lead for the vault
    const manager = ctx.el("label_manager", { x: 170, y: 700, w: 400, h: 70, kind: "text", exit: "wipe" });
    kit.text(manager.inner, "password manager", { role: "label", x: 0, y: 0, w: 340, h: 40, maxLines: 1, color: "muted" });
    kit.line(manager.inner, 300, 0, 300, -40, { stroke: "line", sw: 2, opacity: 0.8 });

    // @form copied_shop_card: the dull copied Shop card, visibly different from Work's fresh card
    const copied = ctx.el("copied_shop_card", { x: 750, y: 530, w: 150, h: 96, kind: "token", exit: "iris" });
    const copiedHandle = Loom.lesson.keycard(ctx, copied.inner, { x: 0, y: 0, w: 150, seed: "b10-shop", state: "copy" });

    vaultHandle.setState("issuing", tUnique);
    shopHandle.setState("fresh", tUnique + 0.28);
    workHandle.setState("fresh", tUnique + 0.58);
    m.settle(shopCard, tUnique + 0.28);
    m.settle(workCard, tUnique + 0.58);
    m.unmask(unique, tUnique + 0.4);
    vaultHandle.setState("done", tSite - 0.22);

    m.reveal(copied, tSite - 0.08);
    m.travel(copied, tSite + 0.18, { x: 1275, y: 515, scale: 1 });
    copiedHandle.setState("dim", tSite + 0.7);
    workDoor.setState("refused", tSite + 0.7);
    m.emphasis(work, tSite + 0.82);
    m.unmask(manager, tVault);
  },
});
