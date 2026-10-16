// @lab {"title": "isometric ENGINE, the detail register: a distribution site on one diorama board (strata, roads, buildings rising, Isotype parcels piling up faster and faster with a count that adds up, a cutaway of the warehouse, a live circular inset, focus and context on one truck, a tracked subject with a you-are-here ring on a route, the scale reveal and the legend)", "styles": ["isometric"], "dur": 27.0, "times": [2.4, 6.4, 9.6, 12.2, 15.2, 18.4, 21.6, 26.0]}
/* The isometric engine's DETAIL register (2026-10-16): the moments of a lesson where a system must be SEEN working. One
 * floating board holds the whole site; the camera leans in and pulls back inside it. Every number is drawn (parcels pile
 * up and the pin counts them); the subject keeps the reserved hue while everything else turns to context; the line is
 * drawn before the truck moves on it. A lesson uses this register for a few beats; the teaching register (iso_teach)
 * carries the explaining. Compare within the style only (D-122). */
Loom.scene("iso_diorama", {
  build(ctx) {
    const W = ctx.engine;
    const B = W.board(ctx, {
      name: "site", size: [17, 12], depth: 0.62, at: 0.2, centre: [960, 500], unit: 58, headroom: 2.4,
      strata: [{ tok: "surface2", h: 0.14 }, { tok: "soil", h: 0.3, label: "ground" }, { tok: "steel", h: 0.18 }],
    });

    // ---- the site, there from the start (roads, trees): the stage the story plays on
    B.road({ x: 0, y: 8.4, len: 17, w: 1.3 });
    B.road({ x: 13.2, y: 0, len: 8.4, w: 1.3, dir: "+y" });
    for (const [x, y] of [[0.6, 10.3], [2.6, 10.6], [4.9, 10.3], [7.2, 10.6], [9.6, 10.3], [15.0, 6.2], [15.6, 4.6], [11.0, 10.5]]) B.put("tree", { x, y, s: 0.95 });
    for (const [x, y] of [[15.2, 0.4], [16.0, 1.6]]) B.put("tree", { x, y, s: 0.8, shape: "pine" });

    // ---- the buildings rise in the order the narration names them
    const hall = B.put("building", {
      name: "warehouse", x: 0.8, y: 0.8, w: 6.4, d: 4.2, floors: 1, fh: 2.2, at: 0.9, role: "warehouse", tok: "concrete", plant: false,
      rooms: (f, add) => {
        add("shelf", { x: 0.5, y: 0.45, l: 4.5, d: 0.9, h: 1.7, levels: 3 });
        add("shelf", { x: 0.5, y: 2.0, l: 4.5, d: 0.9, h: 1.7, levels: 3 });
      },
    });
    const office = B.put("building", { name: "office", x: 9.0, y: 4.6, w: 2.6, d: 2.4, floors: 3, fh: 0.95, at: 1.4, tok: "accent2", role: "offices" });
    const store = B.put("store", { name: "shop", x: 10.6, y: 1.0, w: 2.4, d: 1.8, at: 1.8, awning: "accent3", role: "shops", dir: "-y" });
    const dock = B.put("slab", { name: "dock", x: 0.8, y: 5.2, w: 6.4, d: 1.6, h: 0.22, tok: "concrete", at: 1.2 });
    for (const [x, y, t] of [[6.4, 6.0, 2.3], [7.6, 7.6, 2.5]]) B.put("person", { x, y, z: x < 7 ? 0.22 : 0, tok: "line", at: t });
    B.pin(hall, "Distribution centre", { at: 2.6, tok: "concrete", side: "up-left" });

    // ---- Isotype on the board: parcels pile up on the dock, faster and faster; the pin counts exactly what is there
    const pile = B.stack("parcels", { kind: "crate", s: 0.5, n: 24, cols: 6, rows: 2, x: 1.3, y: 5.5, z: 0.22, per: 50, at: 4.0, by: 7.6,
      label: "parcels ready today", tok: "accent4", side: "up-right" });

    // ---- the cutaway: the cut line, the walls slide out, the hatched rims show; a forklift works the aisle inside
    hall.cut(8.4, { dist: 1.1 });
    const lift = B.put("forklift", { name: "forklift", x: 1.6, y: 3.7, z: 0.12, at: 9.0, load: "accent4", inside: hall });
    lift.move(9.6, { by: [3.2, 0, 0], dur: 2.4 });
    B.pin(lift, "Picking", { at: 9.4, tok: "accent4", side: "up-right", until: 12.4 });

    // ---- the frame within the frame: a live, magnified view of the aisle (the forklift moves in it too)
    B.inset("aisle_inset", { of: lift, centre: [1600, 250], r: 150, zoom: 2.2, at: 10.2, until: 13.0, label: "Inside: picking" });

    // ---- one truck: it lands at the dock, everything else turns to context, and we follow it to the shop
    const route = B.route("delivery", [[2.4, 9.05], [13.85, 9.05], [13.85, 2.4]], { tok: "accent", width: 5, dash: true });
    const truck = B.put("truck", { name: "truck", route, tok: "accent", subject: true, at: 13.2, l: 2.6, w: 1.0, role: "your parcel" });
    B.focus([truck], 13.6, { dur: 0.6 });
    B.track(truck, { at: 14.0, until: 23.4, label: "Your parcel", side: "up-right" });
    B.camera(13.3, { x: B.P(1.5, 10, 0)[0], y: B.P(1, 6, 2)[1], w: B.P(9, 7, 0)[0] - B.P(1.5, 10, 0)[0], h: 330 }, { zoom: 1.45, dur: 1.4 });
    truck.travel(route, 14.8, { dur: 6.4 });
    B.camera(16.2, { x: B.P(13.6, 8, 0)[0] - 260, y: B.P(13.6, 3, 2)[1], w: 520, h: 360 }, { zoom: 1.45, dur: 3.6 });
    B.pin(store, "Shop", { at: 20.4, tok: "accent3", side: "up-right" });

    // ---- the scale reveal: back to the whole site, the subject still the only colour, then colour returns; the legend
    B.reveal(21.6, { dur: 1.8 });
    B.unfocus(23.6);
    const lg = ctx.el("legend", { x: 96, y: 700, w: 400, h: 180, kind: "card", exit: "recede" });
    B.legend(lg, [["accent", "your parcel"], ["accent4", "parcels"], ["accent2", "offices"], ["accent3", "shops"]], { at: 24.0, title: "Legend" });
    void office; void dock; void pile;
  },
});
