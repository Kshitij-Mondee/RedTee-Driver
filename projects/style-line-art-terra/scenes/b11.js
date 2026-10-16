// @design travel_class_outline: one magenta outline keeps its identity while changing from page to folder to screen
Loom.scene("b11", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;
    const Mo = Loom.morph;
    // Treatments considered: static triptych with arrows, sequential object swaps, one travelling morph with faint evidence. Chosen: the travelling morph proves the class stays with the item.
    const travel = ctx.cue("The class travels with the information");
    const paper = ctx.cue("on paper");
    const folder = ctx.cue("in a folder");
    const screen = ctx.cue("on a screen");

    // @form paper_ghost: faint retained paper form
    const paperGhostE = ctx.el("paper_ghost", { x: 270, y: 270, w: 280, h: 360, kind: "instrument", exit: "recede" });
    const paperGhost = Loom.lesson.item(ctx, paperGhostE.inner, { x: 0, y: 0, variant: "customer_list", cls: "confidential", label: false, tick: false });
    paperGhost.g.setAttribute("opacity", "0");
    Loom.drive(function (e) { paperGhost.g.setAttribute("opacity", String(0.18 * e)); }, paper, 0.35, "enter");

    // @form folder_ghost: faint retained folder form
    const folderGhostE = ctx.el("folder_ghost", { x: 820, y: 270, w: 280, h: 360, kind: "instrument", exit: "recede" });
    const folderGhost = Loom.lesson.item(ctx, folderGhostE.inner, { x: 0, y: 0, variant: "customer_list", cls: "confidential", label: false, tick: false });
    Mo.to(folderGhost.outline, folderGhost.folderOutline, ctx.start, { dur: 0.01 });
    folderGhost.g.setAttribute("opacity", "0");
    Loom.drive(function (e) { folderGhost.g.setAttribute("opacity", String(0.18 * e)); }, folder + 0.6, 0.25, "enter");

    // @form screen_ghost: faint retained screen form
    const screenGhostE = ctx.el("screen_ghost", { x: 1230, y: 270, w: 280, h: 360, kind: "instrument", exit: "recede" });
    const screenGhost = Loom.lesson.item(ctx, screenGhostE.inner, { x: 0, y: 0, variant: "customer_list", cls: "confidential", label: false, tick: false });
    Mo.to(screenGhost.outline, screenGhost.screenOutline, ctx.start, { dur: 0.01 });
    screenGhost.g.setAttribute("opacity", "0");
    Loom.drive(function (e) { screenGhost.g.setAttribute("opacity", String(0.18 * e)); }, screen + 0.6, 0.25, "enter");

    // @form morph_item: the confidential document that travels and changes container
    const itemE = ctx.el("morph_item", { x: 270, y: 270, w: 280, h: 360, kind: "instrument", exit: "recede" });
    const item = Loom.lesson.item(ctx, itemE.inner, { x: 0, y: 0, variant: "customer_list", cls: "confidential", label: false, tick: false });
    item.g.setAttribute("opacity", "0");
    Loom.drive(function (e) { item.g.setAttribute("opacity", String(e)); }, travel, 0.55, "enter");
    m.draw(item.outline, travel, { dur: 0.75 });
    item.printRows(travel + 0.3, 0.07, 0.28);
    Mo.to(item.outline, item.folderOutline, folder, { dur: 0.6 });
    m.travel(itemE, folder, { x: 820, y: 270, scale: 1 });
    Mo.to(item.outline, item.screenOutline, screen, { dur: 0.6 });
    m.travel(itemE, screen, { x: 1230, y: 270, scale: 1 });

    // @form paper_label: caption below the retained paper form
    T.label(ctx, "paper_label", { x: 315, y: 700, text: "Paper", to: [410, 630], tone: "muted", role: "label", t: paper + 0.35 });
    // @form folder_label: caption below the retained folder form
    T.label(ctx, "folder_label", { x: 855, y: 700, text: "Folder", to: [960, 630], tone: "muted", role: "label", t: folder + 0.7 });
    // @form screen_label: caption below the retained screen form
    T.label(ctx, "screen_label", { x: 1265, y: 700, text: "Screen", to: [1370, 630], tone: "muted", role: "label", t: screen + 0.45 });
  },
});
