// @lab {"title": "isometric ENGINE, one board, two registers: a lesson-like scene that teaches on three stations, pulls back to the whole data-centre site (strata that tell the story), leans in for the detail (a cutaway hall of racks, a request tracked along an air route with data flowing, focus and context, an Isotype tally that adds up), then leans back to teach", "styles": ["isometric"], "dur": 26.0, "times": [2.2, 6.6, 10.8, 13.4, 16.4, 19.0, 22.0, 25.2]}
/* One board, two registers, one camera (2026-10-16). How a lesson in this style moves: it explains on a few stations
 * (teaching), the camera pulls back to show where they live (the scale reveal), leans in where the system must be seen
 * working (detail), and leans back out to say what it means (teaching again). The board is never rebuilt: everything is
 * on it from the start and the camera chooses. Compare within the style only (D-122). */
Loom.scene("iso_lesson", {
  build(ctx) {
    const W = ctx.engine;
    const B = W.board(ctx, {
      name: "dc", size: [18, 12], depth: 0.66, at: 0.2, centre: [960, 500], unit: 56, headroom: 2.6,
      strata: [{ tok: "surface2", h: 0.14 }, { tok: "accent2", h: 0.16, label: "network" }, { tok: "accent4", h: 0.16, label: "power" }, { tok: "steel", h: 0.2 }],
    });

    // ---- the site: the stations teach first; the hall, its cooling and its power rise when the camera pulls back
    const hall = B.put("building", { facade: "hall",
      name: "hall", x: 10.4, y: 5.2, w: 6.4, d: 4.6, floors: 1, fh: 2.3, tok: "concrete", windows: false, plant: false, role: "data centre", at: 10.2,
      rooms: (f, add) => { for (let i = 0; i < 6; i++) { add("rack", { x: 0.55 + i * 0.95, y: 0.5, lit: 6 - (i % 3) }); add("rack", { x: 0.55 + i * 0.95, y: 2.5, lit: 4 + (i % 4) }); } },
    });
    for (let i = 0; i < 3; i++) B.put("cylinder", { x: 10.8 + i * 1.3, y: 10.3, r: 0.5, h: 1.3, tok: "water", role: "cooling", at: 10.8 + i * 0.15 });
    B.put("box", { name: "power", x: 15.2, y: 10.4, w: 1.6, d: 1.2, h: 1.0, tok: "accent4", role: "power", at: 11.3 });
    for (const [x, y] of [[0.8, 10.4], [2.6, 10.9], [4.4, 10.5], [13.4, 1.0], [15.2, 1.6], [16.8, 2.6]]) B.put("tree", { x, y, s: 0.9 });

    const F = B.flow("hops", {
      axis: "row", x: 0.6, y: 6.6, w: 2.2, d: 2.2, step: 3.2, at: 1.0, by: 6.2, until: 9.6,
      steps: [
        { label: "You tap Pay", kind: "phone", tok: "accent2", role: "network" },
        { label: "The network", kind: "cloud", tok: "accent2", obj: { z: 0.9, s: 0.9 } },
        { label: "A server answers", kind: "database", tok: "accent2" },
      ],
    });
    B.camera(0, F.stations.map((s) => s.plate), { dur: 0.05, margin: 210, dy: -10 });
    const note = ctx.el("note", { x: 1240, y: 760, w: 580, h: 160, kind: "card", exit: "recede" });
    B.note(note, { title: "Every tap makes three hops", body: "Phone, network, data centre.", tok: "accent2", index: 1, at: 6.8, place: "auto" });
    ctx.m.exit(note, 9.4);

    // ---- pull back: the whole site; the board's edge tells the rest (the network and power run underneath)
    B.reveal(9.6, { dur: 2.0 });
    B.stratumPin(1, "Network", { at: 11.8, along: 0.2, until: 15.2 });
    B.stratumPin(2, "Power", { at: 12.2, along: 0.42, until: 15.2 });

    // ---- lean in: the hall opens, the request rides the air route into a rack while data keeps flowing
    hall.cut(12.6, { dist: 1.2 });
    const air = B.route("uplink", [[8.1, 1.3, 1.3], [8.1, 1.3, 3.2], [8.1, 6.35, 3.2], [12.35, 6.35, 3.2], [12.35, 6.35, 2.25]], { air: true, tok: "accent2", width: 4, at: 13.6, dur: 1.0 });
    air.flow(14.2, 25.0, { n: 7, speed: 1.6, tok: "accent2" });
    const req = B.put("box", { name: "request", route: air, w: 0.42, d: 0.42, h: 0.42, tok: "accent", subject: true, at: 14.6, enter: "drop", role: "your request", shadowZ: 0, inside: hall });
    B.focus([req, hall], 15.0);
    B.track(req, { at: 15.0, until: 19.6, label: "Your request", side: "up-left" });
    B.camera(15.2, [hall, F.stations[2].plate], { zoom: 1.4, dur: 1.6, dy: 150, dx: -60 });
    req.travel(air, 15.6, { dur: 3.0, face: false });

    // ---- the number, drawn: requests a second at peak (40 units of 250 add up to 10,000)
    const tally = ctx.el("tally", { x: 1230, y: 100, w: 600, h: 420, kind: "card", exit: "recede" });
    B.tally(tally, { n: 40, per: 250, total: 10000, icon: "request", tok: "accent2", cols: 10, title: "Requests a second, at peak", label: "requests", at: 17.4, by: 20.0 });
    ctx.m.exit(tally, 21.4);

    // ---- lean back: colour returns, the camera comes back to the stations, the idea in one line
    B.unfocus(20.4);
    B.camera(21.6, F.stations.map((s) => s.plate), { dur: 1.8, margin: 210, dy: 150 });
    const note2 = ctx.el("note2", { x: 1240, y: 120, w: 580, h: 160, kind: "card", exit: "recede" });
    B.note(note2, { title: "One tap, three places", body: "Each one has to be there, every time.", tok: "accent", index: 2, at: 23.6 });
  },
});
