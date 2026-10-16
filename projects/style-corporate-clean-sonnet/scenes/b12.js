// @design missing_part_then_theft: a rule with one mark missing, then the single container holding every copy is carried away
Loom.scene("b12", {
  build(ctx, props) {
    const { m, kit } = ctx;
    const L = Loom.lesson;
    // Treatments: (1) static verdict on the rail, then the bag leaves (chosen: verdict first, theft proves it);
    // (2) bag shatters; (3) copies fade one by one. Only the tag and the exit move.

    // ---- held from b11: bag (with its contents as children), boundary, rail
    const bag = ctx.held("bag");
    const bnd = ctx.held("boundary_bag");
    const rail = ctx.held("rail");
    const rh = rail.handle;
    const bdh = bnd.handle;

    // same geometry as b11 drew
    const BW = 600;
    const bagSize = L.bag.size({ w: BW });
    const bagX = 540, bagY = 160;
    const around = L.place_boundary.around({ x: bagX, y: bagY, w: bagSize.w, h: bagSize.h }, { pad: 22 });
    const rsize = L.rule_rail.size({ size: "normal", labels: true });
    const railX = Math.round((1920 - rsize.w) / 2), railY = 750;

    // ---- tag hanging above tile 1 (clear of the labels under the tiles)
    const t1 = rh.tiles[2];
    const tagW = 340, tagH = 56, stem = 16;
    const tagCx = railX + t1.cx;
    const tagY = railY + t1.y - stem - tagH;
    const tag = ctx.el("tag_missing", { x: Math.round(tagCx - tagW / 2), y: tagY, w: tagW, h: tagH + stem, kind: "bubble", exit: "wipe" });
    kit.line(tag.inner, tagW / 2, tagH, tagW / 2, tagH + stem, { stroke: "neg", sw: 3 }); // @form tag_stem: tag hangs from the tile
    kit.pill(tag.inner, 0, 0, tagW, tagH, { fill: "neg", r: 14 }); // @form missing_tag: negative verdict hung from the mark
    kit.text(tag.inner, "Missing: 1 offsite", { role: "label", x: 12, y: 0, w: tagW - 24, h: tagH, align: "center", valign: "middle", weight: 700, color: "onAccent", maxLines: 1 });

    // ---- timing
    const tOne = ctx.cue("The one");
    rh.setState(0, "ticked", tOne);
    rh.setState(1, "ticked", tOne + 0.2);
    rh.setState(2, "missing", tOne + 0.45);
    m.unmask(tag, tOne + 0.6, { dir: "ltr" });

    const tStolen = ctx.cue("one stolen bag");
    bdh.setState("filled", tStolen);
    const tGo = ctx.cue("takes both");
    const dx = 2100 - bagX;
    m.travel(bag, tGo, { x: 2100, y: bagY });
    m.travel(bnd, tGo, { x: around.x + dx, y: around.y });
  },
});
