// @design same_trip_changed: the opening journey replayed on the same stage, now unreadable to the onlooker, with the three moves ticked off and one closed lock
/* Three treatments: (1) static composition with all steps lit and a big padlock (signalled, inert);
 * (2) chosen: the opening stage settles, the noise packet crosses once past the watcher, tiles tick in spoken order,
 *     the padlock closes last and holds (motion = the same trip changed);
 * (3) split before/after comparison (two systems on screen, too busy).
 * Cues: Back at the login -> stage; the watcher now sees only noise -> packet travels, panel noise;
 * Prove who / agree a key / scramble -> tiles 1..3 done; what the padlock stands for -> padlock closes. */
Loom.scene("b17", {
  build(ctx, props) {
    const { m } = ctx;
    const tBack = ctx.cue("Back at the login");
    const tNoise = ctx.cue("the watcher now sees only noise");
    const t1 = ctx.cue("Prove who");
    const t2 = ctx.cue("agree a key");
    const t3 = ctx.cue("scramble");
    const tLock = ctx.cue("what the padlock stands for");

    // @form browser_https: the browser window at the https address with the login form
    const EB = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card" });
    const browser = Loom.lesson.browser_window(ctx, EB.inner);
    browser.setState("https", ctx.start);
    m.settle(EB, tBack);

    // @form route_nodes: the same four-node route
    const EP = ctx.el("path", { x: 630, y: 370, w: 800, h: 180, kind: "connector" });
    const path = Loom.lesson.network_path(ctx, EP.inner);
    m.unmask(EP, tBack + 0.2, { dir: "ltr", dur: 0.7 });

    // @form server_stack: the same server
    const ES = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card" });
    const server = Loom.lesson.server_box(ctx, ES.inner);
    m.settle(ES, tBack + 0.3);

    // @form watcher: eye on node 2, its panel shows noise as the packet passes
    const WE = ctx.el("watcher", { x: 800, y: 150, w: 400, h: 420, kind: "instrument", exit: "none" });
    const w = Loom.lesson.watcher(ctx, WE.inner, { origin: [800, 150] });
    w.setState("eye_open", tBack + 0.6);
    m.reveal(WE, tBack + 0.6);
    w.setState("noise", tNoise + 0.95);

    // @form step_bar: three tiles along the bottom, ticked off in spoken order
    const SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    const s = Loom.lesson.step_bar(ctx, SB.inner, { origin: [360, 780] });
    s.setState("shown", tBack + 0.4);
    m.reveal(SB, tBack + 0.4);
    s.setState("done", t1, 0);
    s.setState("done", t2, 1);
    s.setState("done", t3, 2);

    // @form noise_packet: the login packet, already scrambled, crossing the path
    const EK = ctx.el("packet", { x: 96, y: 300, w: 1728, h: 270, kind: "token", exit: "none" });
    const packet = Loom.lesson.login_packet(ctx, EK.inner, { origin: [96, 300], x: 334, y: 11 });
    packet.setState("noise", ctx.start);
    m.reveal(EK, tNoise - 0.1, { dy: 0 });
    packet.travel(browser.anchors.packet_out, server.anchors.packet_in, tNoise, tNoise + 2.4);
    m.exit(EK, tNoise + 2.55, "recede");

    // @form padlock: the closing lock, the one accent
    const pa = browser.anchors.padlock;
    const EL = ctx.el("padlock", { x: pa.x - 22, y: pa.y - 22, w: 44, h: 44, kind: "icon", exit: "none" });
    const lock = Loom.lesson.padlock(ctx, EL.inner, { size: 44 });
    lock.setState("open", ctx.start);
    lock.setState("closed_held", tLock);

    // @form padlock_large: the same lock at 96 px settling below the form, the one accent
    const EG = ctx.el("padlock_large", { x: 322, y: 580, w: 96, h: 96, kind: "icon", exit: "none" });
    const big = Loom.lesson.padlock(ctx, EG.inner, { size: 96 });
    big.setState("open", ctx.start);
    m.reveal(EG, tLock - 0.3);
    big.setState("closed_named", tLock);
  },
});
