// @design plain_trip: a readable message leaves its sender and crosses an open route to a receiver
/* Three treatments considered: (1) static composition with a caption-like label; (2) the packet only appears at the
 * server; (3) chosen: sender, route, receiver build in narration order, then the one readable packet travels the
 * route (motion is the content). Accent only on the packet's trip is carried by the kit's card; ink and neutrals else.
 * Cues: Say you log in -> browser; on shared wifi -> path then server; Your password -> packet shows;
 * crosses the network -> travel starts; to the server -> arrival. */
Loom.scene("b01", {
  build(ctx) {
    const { m } = ctx;
    const tBrowser = ctx.cue("Say you log in");
    const tPath = ctx.cue("on shared wifi");
    const tPkt = ctx.cue("Your password");
    const tGo = ctx.cue("crosses the network");
    const tEnd = ctx.cue("to the server");

    // @form browser_login: a browser window showing a login form at http
    const EB = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card" });
    const browser = Loom.lesson.browser_window(ctx, EB.inner);
    m.settle(EB, tBrowser);

    // @form route_nodes: four nodes on a line, the first named Shared wifi
    const EP = ctx.el("path", { x: 630, y: 370, w: 800, h: 180, kind: "connector" });
    const path = Loom.lesson.network_path(ctx, EP.inner);
    m.unmask(EP, tPath, { dir: "ltr", dur: 0.9 });

    // @form server_stack: a server box with a name label and a data store
    const ES = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card" });
    const server = Loom.lesson.server_box(ctx, ES.inner);
    m.settle(ES, tPath + 0.5);

    // @form plain_packet: the login packet, readable user and password, the one accent
    const EK = ctx.el("packet", { x: 96, y: 300, w: 1728, h: 270, kind: "token" });
    const packet = Loom.lesson.login_packet(ctx, EK.inner, { origin: [96, 300], x: 334, y: 11 });
    m.reveal(EK, tPkt, { dy: 0 });
    Loom.sfx("card", tGo);
    packet.travel(browser.anchors.packet_out, server.anchors.packet_in, tGo, tEnd + 0.35);
  },
});
