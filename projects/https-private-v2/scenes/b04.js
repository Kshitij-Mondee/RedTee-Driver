// @design wrap_then_greet: a message is sealed in a protective outline, then two sides greet before it moves
/* Treatments considered: (1) static composition: packet with a TLS outline and a label, no motion (signalled but inert);
 * (2) outline closes, the packet moves at once (skips the handshake, wrong order);
 * (3) chosen: tile 1 lights, a new plain packet appears at the browser while the address turns https, the TLS outline
 * closes round it, then two Hello chips cross the held path while the packet waits.
 * Cues: HTTPS is web traffic -> tile + packet + https; wrapped in TLS -> wrap; opens with a handshake -> Hello chips. */
Loom.scene("b04", {
  build(ctx, props) {
    const { m } = ctx;
    const tWeb = ctx.cue("HTTPS is web traffic");
    const tTls = ctx.cue("wrapped in TLS");
    const tHs = ctx.cue("opens with a handshake");

    // held system from b03: the same stage, nothing redrawn
    const browser = ctx.held("browser");
    const server = ctx.held("server");
    const path = ctx.held("path");
    const watcher = ctx.held("watcher");
    const bar = ctx.held("step_bar");

    // @form step_tile_lit: tile 1 Prove who turns blue, laid over the held tile
    const sb = Loom.lesson.step_bar(ctx, bar.inner);
    sb.setState("named", tWeb, 0);

    // @form address_https: the address scheme turns from http:// to https://
    const bw = Loom.lesson.browser_window(ctx, browser.inner);
    bw.setState("https", tWeb + 0.5);

    // @form tls_halo: a soft accent field behind the packet, the protective outline's body
    const TW = ctx.el("tls_wrap", { x: 632, y: 110, w: 376, h: 194, kind: "scenery" });
    Loom.svg("rect", { x: 0, y: 0, width: 376, height: 194, rx: 26, fill: ctx.c("accent"), "fill-opacity": 0.12 }, TW.inner);
    m.reveal(TW, tTls + 0.3, { dy: 0 });

    // @form plain_packet: a new login packet waits at the browser, then is wrapped
    // placed in the free space right of the browser and above the path, so it covers neither the form nor the Hello chips
    const PK = ctx.el("packet", { x: 620, y: 88, w: 400, h: 270, kind: "token" });
    const pk = Loom.lesson.login_packet(ctx, PK.inner, { origin: [620, 88], x: 0, y: 0 });
    m.reveal(PK, tWeb + 0.4, { dy: 0 });
    pk.wrap(tTls, 0.8);

    // @form hello_chips: two Hello chips cross the path while the packet waits
    const np = Loom.lesson.network_path(ctx, path.inner);
    np.hello(tHs, ctx.end - 0.45);
    np.clearHello(ctx.end - 0.15);
  },
});
