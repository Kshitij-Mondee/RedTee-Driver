// @design plain_trip_across_shared_link: one readable card leaves a window, rides a drawn line past a labelled node and lands at a rack
/* Treatments considered:
   A. static three-part composition with a signalling arrow (rejected: the trip is the idea, motion earns it)
   B. packet pops at server (rejected: loses the crossing)
   C. chosen: browser settles, path unmasks left to right, packet rides above the line to the server. */
Loom.scene("b01", {
  build(ctx, props) {
    const m = ctx.m;
    const tBrowser = ctx.cue("Say you log in");
    const tPath = ctx.cue("on shared wifi");
    const tPacket = ctx.cue("Your password");
    const tTravel = ctx.cue("crosses the network");
    const tArrive = ctx.cue("to the server");

    // @form browser_window: the login form with its http address
    const B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
    const bh = Loom.lesson.browser_window(ctx, B.inner, { address: "login.example.com", scheme: "http" });
    m.settle(B, tBrowser); // settles on the first words

    // @form server_box: idle rack with its name pill
    const S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
    const sh = Loom.lesson.server_box(ctx, S.inner, {});
    m.settle(S, tPath + 0.5);

    // @form network_path: four nodes, first labelled Shared wifi
    const P = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
    const ph = Loom.lesson.network_path(ctx, P.inner, {});
    m.unmask(P, tPath, { dir: "ltr", dur: 1.1 });

    // @form login_packet: plain card, readable, rides above the line
    const K = ctx.el("packet", { x: 650, y: 230, w: 324, h: 180, kind: "token", exit: "none" });
    const kh = Loom.lesson.login_packet(ctx, K.inner, {});
    m.reveal(K, tPacket);
    const dur = Math.max(1.2, tArrive - tTravel + 0.5);
    ph.travel(K, tTravel, { from: 0, to: 0.62, dur: dur });
    sh.setState("receiving", tTravel + dur);
  }
});
