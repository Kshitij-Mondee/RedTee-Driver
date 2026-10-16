// @design two_empty_slots_one_watcher: the same secret is needed at both ends, two empty dashed slots wait while the open eye sits between them
/* Treatments considered:
 * 1. static composition: slots already drawn, an arrow between them (rejected: the problem arriving is the point).
 * 2. chosen: the held rig stays; step tile 2 is named, an empty dashed slot unmasks at each end, the eye pulses once.
 * 3. a zoomed close-up on the slots (rejected: the rig is held, the shot does not move).
 */
Loom.scene("b08", {
  build: function (ctx, props) {
    var m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    var tMove = ctx.cue("Move two, a shared key");
    var tBoth = ctx.cue("Both ends need the same secret");
    var tWatch = ctx.cue("with the network watching");

    /* ---- the held rig: taken, or redrawn settled from frame 0 ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "http" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      Loom.lesson.network_path(ctx, PA.inner, {});
    }

    /* ---- the watcher: back to full strength, one pulse on the words ---- */
    var W = take("watcher");
    var hw;
    if (W) {
      Loom.tween(W.inner, { opacity: 0.35 }, { opacity: 1, duration: 0.4, ease: "none" }, ctx.start, meta("watcher.full"));
      // the held watcher is not redrawn (a second copy doubled its text); a ring pulses over its disc instead
      var WR = ctx.el("watcher_pulse", { x: 759 + 180 - 60, y: 28 + 402 - 60, w: 120, h: 120, kind: "icon", exit: "none" });
      // @form watcher_pulse: one ring swells off the eye disc on the words
      var ring = Loom.svg("circle", { cx: 60, cy: 60, r: 50, fill: "none", stroke: ctx.c("ink"), "stroke-width": 4, opacity: 0 }, WR.inner);
      Loom.tween(ring, { opacity: 0 }, { opacity: 0.8, duration: 0.2, ease: "none" }, tWatch, meta("watcher.pulse_on"));
      Loom.tween(ring, { opacity: 0.8 }, { opacity: 0, duration: 0.5, ease: "none" }, tWatch + 0.3, meta("watcher.pulse_off"));
    } else {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      hw = Loom.lesson.watcher(ctx, W.inner, {});
      hw.setState("eye_open", 0);
    }
    if (hw) hw.pulse(tWatch);

    /* ---- the step bar: tile 1 done, tile 2 named then settles to shown ---- */
    var SB = take("step_bar");
    var sbParent;
    if (SB) { sbParent = SB.inner; }
    else {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "list", exit: "none" });
      sbParent = SB.inner;
    }
    var sbHeld = !!take("step_bar");
    if (sbHeld) {
      // the held bar is not redrawn (a second copy doubled its tile text); an outline names tile 2 instead
      var nm = Loom.svg("rect", { x: 410, y: 0, width: 380, height: 90, rx: 14, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, sbParent);
      Loom.tween(nm, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tMove, meta("step2.named_on"));
      Loom.tween(nm, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "none" }, tMove + 1.0, meta("step2.named_off"));
    } else {
      var hs = Loom.lesson.step_bar(ctx, sbParent, {});
      hs.setTile(1, "done", 0);
      hs.setTile(3, "shown", 0);
      hs.setTile(2, "shown", 0);
      hs.setTile(2, "named", tMove);
      hs.setTile(2, "shown", tMove + 1.0);
    }

    /* ---- the empty dashed key slots, one at each end ---- */
    var ba = { x: 110 + 496, y: 150 + 526 };
    var KB = ctx.el("key_slots", { x: 640, y: 590, w: 240, h: 100, kind: "token", exit: "none" });
    // @form key_slot_browser: an empty dashed slot at the browser
    var kb = Loom.lesson.key_exchange(ctx, KB.inner, { part: "end", side: "browser" });
    kb.setState("slots_empty", 0);
    m.unmask(KB, tBoth, { dir: "ltr", dur: 0.6 });

    var KS = ctx.el("key_slot_server", { x: 1200, y: 590, w: 240, h: 100, kind: "token", exit: "none" });
    // @form key_slot_server: an empty dashed slot at the server
    var ks = Loom.lesson.key_exchange(ctx, KS.inner, { part: "end", side: "server" });
    ks.setState("slots_empty", 0);
    m.unmask(KS, tBoth + 0.15, { dir: "rtl", dur: 0.6 });
  }
});
