// @design exposed_in_transit: a copy peels off a moving packet into an onlooker's panel, readable
// Treatments considered: (1) static watcher panel with an arrow from the path (signalled but inert),
// (2) packet replays its trip and a copy peels up from node 2 (chosen: the copying happens in transit),
// (3) the whole path flashes with eyes along it (too loud, many foci).
Loom.scene("b02", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const N2 = { x: 1000, y: 430 };

    // held system, drawn in b01: browser, server, path stay exactly as they were
    const browser = ctx.held("browser");
    const server = ctx.held("server");
    const path = ctx.held("path");

    // the packet makes the trip again: a new carrier takes over at the server end where b01 left it
    // @form login_packet: the same plain login card, replayed by moving the held element
    const PK = ctx.held("packet");

    const tHttp = ctx.cue("Over plain HTTP");
    const tAny = ctx.cue("anyone who can see");
    const tSee = ctx.cue("see the path");
    const tRead = ctx.cue("can read it");

    const BR = { x: 806, y: 430 }, SV = { x: 1430, y: 430 };
    // m.travel on a held element is a displacement from where it rests; the card centre rests at the server end (1430,430)
    const at = (pt) => ({ x: pt.x - SV.x, y: pt.y - SV.y });
    m.travel(PK, tHttp, Object.assign({ dur: 1.0 }, at(BR)));
    m.travel(PK, tSee - 1.45, Object.assign({ dur: 3.0 }, at(SV)));

    // the watcher: eye disc on node 2 and its panel above the path
    const WE = ctx.el("watcher", { x: 800, y: 150, w: 400, h: 420, kind: "instrument", exit: "recede" });
    // @form watcher: ink eye disc on node 2 with a panel that shows what it copied
    const w = Loom.lesson.watcher(ctx, WE.inner, { origin: [800, 150] });
    w.setState("eye_open", tSee + 0.1);
    w.pulse(tSee + 0.1);
    // the one loud thing: an accent ring round the disc as it opens
    const RG = ctx.el("watcher_ring", { x: 940, y: 370, w: 120, h: 120, kind: "icon", exit: "recede" });
    // @form accent_ring: the watcher is named, so it takes the one accent
    Loom.svg("circle", { cx: 60, cy: 60, r: 48, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5 }, RG.inner);
    m.pop(RG, tSee + 0.1);

    // the copy peels up off node 2 into the panel
    const GO = [700, 140];
    const GE = ctx.el("packet_copy", { x: 700, y: 140, w: 600, h: 420, kind: "token", exit: "none" });
    // @form login_packet: the copy rising off the path
    const ghost = Loom.lesson.login_packet(ctx, GE.inner, { origin: GO, x: N2.x - GO[0] - 200, y: N2.y - GO[1] - 119 });
    m.reveal(GE, tRead - 0.35);
    ghost.travel(N2, { x: 1000, y: 330 }, tRead - 0.25, tRead + 0.4);
    m.exit(GE, tRead + 0.2, "recede");
    w.setState("copied", tRead + 0.2);
    // the panel retires with the beat
    w.setState("eye_open", ctx.end + 0.05);
  },
});
