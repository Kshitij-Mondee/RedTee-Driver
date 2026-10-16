// @design exposed_journey_resolved: the opening journey returns, but what the watcher copies is noise and the lock closes
// Treatments considered : (1) static board with a closed padlock; (2) same journey replayed, blocks cross, tray fills grey, lock closes (chosen: same journey, different result); (3) zoom on tray only.
Loom.scene("b18", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tForm = ctx.cue("Same form");
    const tWatch = ctx.cue("same watcher");
    const tNoise = ctx.cue("copies only noise");
    const tClose = ctx.cue("padlock closes");

    // @form path_board: the opening board, there from the first frame
    const B = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "recede" });
    const board = Loom.lesson.path_board(ctx, B.inner, { w: 1680, h: 640 });

    // @form key_slots: blue shared keys in both end slots
    const KB = ctx.el("key_browser", { x: 600, y: 440, w: 80, h: 80, kind: "token", exit: "recede" });
    const kb = Loom.lesson.key_slots(ctx, KB.inner, { which: "browser", w: 80, h: 80 });
    kb.setState("ends_filled", ctx.start);
    const KS = ctx.el("key_server", { x: 1240, y: 440, w: 80, h: 80, kind: "token", exit: "recede" });
    const ks = Loom.lesson.key_slots(ctx, KS.inner, { which: "server", w: 80, h: 80 });
    ks.setState("ends_filled", ctx.start);

    // @form padlock: open above the watcher
    const PL = ctx.el("padlock", { x: 910, y: 200, w: 100, h: 130, kind: "token", exit: "recede" });
    const pad = Loom.lesson.padlock(ctx, PL.inner, { open: true });

    T.label(ctx, "label_watcher", { x: 960, y: 352, text: "Watcher", to: [960, 408], t: ctx.start - 0.8 });

    // Submit presses, readable packet lifts out
    board.setState("submit_pressed", tForm);
    // @form packet_morph: same packet object as b01, now scrambled in transit
    const PW = 290, PH = 174;
    const startC = [700, 340];
    const PE = ctx.el("packet", { x: startC[0] - PW / 2, y: startC[1] - PH / 2, w: PW, h: PH, kind: "token", exit: "recede" });
    const pk = Loom.lesson.packet(ctx, PE.inner, { scale: 1.5 });
    PE.setBox && PE.setBox({ w: pk.w, h: pk.h });
    m.reveal(PE, tForm + 0.3);

    // watcher aperture opens
    board.setState("router_highlight", tWatch);

    // packet passes the browser key side, morphs to blocks, crosses the tube
    const tMorph = tNoise + 0.1;
    m.travel(PE, tNoise - 0.5, { x: 0, y: 140, scale: 1 }, { dur: 0.5 });
    kb.setState("lens_browser", tNoise - 0.1);
    kb.setState("ends_filled", tMorph + 1.0);
    pk.setState("morphing", tMorph, 0.9);
    pk.setState("scrambled", tMorph + 0.95, 0.05);
    board.setState("tube", tMorph + 0.9);
    const endC = [1500, 480];
    m.travel(PE, tMorph + 0.9, { x: endC[0] - startC[0], y: endC[1] - startC[1], scale: 1 }, { dur: 1.2 });

    // the watcher's copy: grey noise drops into the tray
    const CE = ctx.el("copy", { x: 860, y: 420, w: 200, h: 120, kind: "token", exit: "recede" });
    const cp = Loom.lesson.packet(ctx, CE.inner, { w: 200, h: 120 });
    cp.setState("copy_noise", ctx.start, 0.1);
    m.reveal(CE, tMorph + 1.5);
    m.travel(CE, tMorph + 1.6, { x: 0, y: 190, scale: 1 }, { dur: 0.6 });

    T.label(ctx, "label_scrambled", { x: 1640, y: 215, text: "Scrambled", to: [1640, 420], t: tMorph + 2.2 });

    // padlock closes in blue
    pad.setState("closed_blue", tClose);
  },
});
