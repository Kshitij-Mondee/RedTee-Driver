// @design exchange_not_the_key: each end keeps a mark at home, two signals cross a watched lane in separate lanes, and the shared secret forms only at the ends
/* Treatments considered:
 * 1. static composition: both keys already in the slots, an arrow signalling "same key" (rejected: the key forming is the idea).
 * 2. one big key travelling and being hidden from the watcher (rejected: the key must never be drawn on the path).
 * 3. chosen: marks pop home, a slate and an amber signal cross in separate lanes clear of the watcher disc, each lands above
 *    the far end's mark, drops on it and the identical key forms blue in the slot.
 * Layout: shared with b01 to b08 (browser 110,150; path 650,370; server 1430,170; watcher 759,28; step bar 360,780).
 */
Loom.scene("b09", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }

    /* ---- the held stage (taken from b08; redrawn settled only if it is not there) ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      // @form browser_window: the held browser, https with its padlock shut
      var bh = Loom.lesson.browser_window(ctx, B.inner, { scheme: "https" });
      bh.padlock.setState("closed_held", 0);
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      // @form server_box: the held server
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      // @form network_path: the held path
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      // @form watcher: the eye disc on node 2
      Loom.lesson.watcher(ctx, W.inner, {}).setState("eye_open", ctx.start);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      // @form step_bar: tile 1 done, tile 2 shown, tile 3 shown
      var sbh = Loom.lesson.step_bar(ctx, SB.inner, {});
      sbh.setTile(1, "done", ctx.start);
      sbh.setTile(2, "shown", ctx.start);
      sbh.setTile(3, "shown", ctx.start);
    }
    take("key_slots"); // b08's slots: the two ends below draw the same dashed slots at their own places

    /* ---- the two ends: the dashed slot is there from the start (b08), the rest comes with the words ---- */
    var END_Y = 564;      // top of the end part; its received-chip lane is 60 px above
    var LANE_SLATE = 340; // centre line of the browser's signal: above the line, clear of the watcher disc (392 to 468)
    var LANE_AMBER = 530; // centre line of the server's signal: below the line, clear of the disc
    var KB = ctx.el("key_browser", { x: 650, y: END_Y - 60, w: 240, h: 160, kind: "token", exit: "none" });
    var kbg = Loom.svg("g", { transform: "translate(0 60)" }, KB.inner);
    // @form key_end_browser: the browser's slot, own mark and key
    var kb = Loom.lesson.key_exchange(ctx, kbg, { side: "browser" });
    var KS = ctx.el("key_server", { x: 1230, y: END_Y - 60, w: 240, h: 160, kind: "token", exit: "none" });
    var ksg = Loom.svg("g", { transform: "translate(0 60)" }, KS.inner);
    // @form key_end_server: the server's slot, own mark and the identical key
    var ks = Loom.lesson.key_exchange(ctx, ksg, { side: "server" });

    /* ---- the two signals: each in its own element, home just above its own mark ---- */
    var SIG_B = ctx.el("signal_browser", { x: 818, y: 534, w: 80, h: 52, kind: "token", exit: "recede" });
    // @form signal_slate: the browser's signal chip
    var sgB = Loom.svg("g", { opacity: 0 }, SIG_B.inner);
    Loom.lesson.key_exchange(ctx, sgB, { part: "signal", side: "browser" });
    var SIG_S = ctx.el("signal_server", { x: 1222, y: 534, w: 80, h: 52, kind: "token", exit: "recede" });
    // @form signal_amber: the server's signal chip
    var sgS = Loom.svg("g", { opacity: 0 }, SIG_S.inner);
    Loom.lesson.key_exchange(ctx, sgS, { part: "signal", side: "server" });

    /* ---- the clock, from the words ---- */
    var tMarks = ctx.cue("They run a key exchange");
    var tSend = ctx.cue("The key itself never travels");
    var tForm = ctx.cue("in a form a watcher can use");
    var tArrive = tSend + 2.5; // seconds absolute
    var tCombine = Math.max(tArrive + 0.05, tForm);

    // each end shows its own mark
    kb.setState("own_marks", tMarks);
    ks.setState("own_marks", tMarks + 0.15);

    // the signals leave and cross, slate above the line, amber below
    Loom.tween(sgB, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tSend, meta("signal_slate.in"));
    m.travel(SIG_B, tSend + 0.1, { x: 24, y: LANE_SLATE - 560, dur: 0.45 });
    m.travel(SIG_B, tSend + 0.55, { x: 412, y: LANE_SLATE - 560, dur: 1.5 });
    m.travel(SIG_B, tSend + 2.05, { x: 412, y: LANE_AMBER - 560, dur: 0.45 });

    Loom.tween(sgS, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tSend + 0.1, meta("signal_amber.in"));
    m.travel(SIG_S, tSend + 0.2, { x: 0, y: LANE_AMBER - 560, dur: 0.3 });
    m.travel(SIG_S, tSend + 0.5, { x: -396, y: LANE_AMBER - 560, dur: 1.6 });

    // they land above the far marks, swap for the end's own received chip, which drops on the mark
    Loom.tween(sgB, { opacity: 1 }, { opacity: 0, duration: 0.05, ease: "none" }, tCombine, meta("signal_slate.out"));
    Loom.tween(sgS, { opacity: 1 }, { opacity: 0, duration: 0.05, ease: "none" }, tCombine, meta("signal_amber.out"));
    kb.setState("combine", tCombine);
    ks.setState("combine", tCombine);
    // the own marks have done their job: they retire, the keys stay
    var tRetire = Math.max(tCombine + 1.2, ctx.end - 1.0);
    Loom.tween(kb.own, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "none" }, tRetire, meta("own_mark_browser.out"));
    Loom.tween(ks.own, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "none" }, tRetire, meta("own_mark_server.out"));
    kb.setState("key_named", tCombine + 0.7);
    ks.setState("key_named", tCombine + 0.7);
  }
});
