// @design same_trip_now_private: the opening route replayed, the carried card now unreadable to the onlooker, three moves ticked, one lock settling
/* Treatments considered:
 * 1. static composition: the stage with all three ticks and the lock already blue, signalled by an arrow (rejected: the lift is the same trip changed).
 * 2. the opening stage returns settled; the card rides as noise past the watcher whose panel copies only noise; the three tiles tick in
 *    spoken order; the bar padlock closes in blue with one ring (chosen: callback by repetition, the change is the content).
 * 3. split screen of then and now (rejected: the cut back to the held system is the callback).
 * Layout identical to b01 and b02: browser (110,150), path (650,370), server (1430,170), watcher (759,28), step bar (360,780).
 */
Loom.scene("b17", {
  build: function (ctx, props) {
    var m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    var T0 = ctx.start - 0.5; // state changes land before the first frame so frame 0 is settled

    var tBack = ctx.cue("Back at the login");
    var tNoise = ctx.cue("the watcher now sees only noise");
    var tProve = ctx.cue("Prove who");
    var tKey = ctx.cue("agree a key");
    var tScr = ctx.cue("scramble");
    var tLock = ctx.cue("the padlock stands for");

    // @form browser_window: the login form, https address, padlock already closed (ink)
    var B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
    var bh = Loom.lesson.browser_window(ctx, B.inner, { address: "login.example.com", scheme: "https" });
    bh.padlock.setState("closed_held", T0);
    // @form padlock_ring: one ring that rings the padlock as it settles blue
    var ring = Loom.svg("circle", { cx: 50, cy: 92, r: 28, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, B.inner);

    // @form server_box: idle rack with its name pill
    var S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
    var sh = Loom.lesson.server_box(ctx, S.inner, {});

    // @form network_path: four nodes, first labelled Shared wifi
    var P = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
    var ph = Loom.lesson.network_path(ctx, P.inner, {});

    // @form watcher: the eye disc on node 2
    var W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
    var hw = Loom.lesson.watcher(ctx, W.inner, { content: "noise" });
    hw.setState("eye_open", T0);

    // @form watcher_panel: the panel that will show only noise
    var WP = ctx.el("watcher_panel", { x: 759, y: 28, w: 360, h: 440, kind: "card", exit: "none" });
    var hp = Loom.lesson.watcher(ctx, WP.inner, { content: "noise" });
    hp.setState("eye_open", T0);

    // @form step_bar: three tiles, shown from the start, ticked as spoken
    var SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    var sbh = Loom.lesson.step_bar(ctx, SB.inner, {});
    sbh.setState("shown", T0);

    // @form login_packet: the card as noise, riding above the line
    var K = ctx.el("packet", { x: 650, y: 230, w: 324, h: 180, kind: "token", exit: "none" });
    var kh = Loom.lesson.login_packet(ctx, K.inner, {});
    kh.setState("noise", T0);
    var KS = 0.72, PY = 113;
    m.travel(K, T0, { x: -20, y: PY, scale: KS, dur: 0.01 });

    // the trip: sets off on "the watcher now sees only noise", passes node 2, lands at the rack
    var dur = Math.max(1.6, tProve - tNoise + 0.2);
    m.travel(K, tNoise, { x: 560, y: PY, scale: KS, dur: dur });
    var tPass = tNoise + dur * 0.33;
    hp.setState("noise", tPass);
    hw.pulse(tPass);
    sh.setState("receiving", tNoise + dur);

    // the three moves tick done in spoken order
    sbh.setTile(1, "done", tProve);
    sbh.setTile(2, "done", tKey);
    sbh.setTile(3, "done", tScr);

    // the padlock closes and settles in blue
    bh.padlock.setState("closed_named", tLock);
    Loom.drive(function (e, raw) {
      ring.setAttribute("opacity", raw > 0 && raw < 1 ? 0.9 * (1 - e) : 0);
      ring.setAttribute("transform", "translate(50 92) scale(" + (0.9 + 0.8 * e).toFixed(3) + ") translate(-50 -92)");
    }, tLock + 0.1, 0.8, "enter");
  }
});
