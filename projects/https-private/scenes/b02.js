// @design watched_route: a silent observer on the route peels a copy off a message passing by and reads it plainly
/* Treatments considered:
 * 1. static composition (rejected: the copying is the point, it needs motion).
 * 2. the held system stays; the packet replays its trip, the watcher eye pops on node 2 and a copy peels up into the panel (chosen).
 * 3. split the stage into sender and watcher views (rejected: the held stage must not change).
 * Layout is shared with b01: browser (110,150), path (650,370), server (1430,170), watcher origin (759,28).
 */
Loom.scene("b02", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    var PATH_Y = 430 , NODE2_X = 650 + 0.38 * 760;

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
    var P = take("packet");
    if (!P) {
      P = ctx.el("packet", { x: 650, y: 230, w: 324, h: 180, kind: "token", exit: "none" });
      Loom.lesson.login_packet(ctx, P.inner, {});
      m.travel(P, ctx.start, { x: 471, y: 0, dur: 0.01 });
    }
    var KS = 0.72;
    var PY = 108;

    var W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
    // @form watcher_ring: the one loud blue ring that names the watcher
    var ringHome = Loom.svg("g", { transform: "translate(180 402)" }, W.inner);
    var ring = Loom.svg("circle", { cx: 0, cy: 0, r: 52, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, opacity: 0 }, ringHome);
    var ping = Loom.svg("circle", { cx: 0, cy: 0, r: 52, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, ringHome);
    var hw = Loom.lesson.watcher(ctx, W.inner, { content: "copied" });
    W.inner.appendChild(ringHome);

    var WP = ctx.el("watcher_panel", { x: 721, y: 14, w: 436, h: 533, kind: "card", exit: "displace" });
    var hp = Loom.lesson.watcher(ctx, WP.inner, { content: "copied", w: 436 });
    var stem = hp.el.childNodes[1];

    var K = ctx.el("packet_copy", { x: 963.5, y: 338, w: 233, h: 129, kind: "token", exit: "recede" });
    var kg = Loom.svg("g", {}, K.inner);
    // @form login_packet_copy: the copy, a second plain packet
    Loom.lesson.login_packet(ctx, kg, { w: 233 });
    K.inner.setAttribute("opacity", 0);

    var tHttp = ctx.cue("Over plain HTTP");
    var tWatch = ctx.cue("any watcher");
    var tRead = ctx.cue("can read it");
    var tSet = tHttp + 0.65;
    var tLand = tRead + 0.9;

    m.travel(P, ctx.start + 0.05, { x: -20, y: PY, scale: KS, dur: 0.75 });
    m.travel(P, tSet, { x: 323, y: PY, scale: KS, dur: tRead - tSet + 0.1 });

    hw.setState("eye_open", tWatch);
    hw.pulse(tWatch + 0.05);
    Loom.tween(ring, { opacity: 0, scale: 0.6, transformOrigin: "0px 0px" }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }, tWatch, meta("watcher.ring"));
    Loom.drive(function (e, raw) {
      ping.setAttribute("opacity", raw > 0 ? 0.7 * (1 - e) : 0);
      ping.setAttribute("transform", "scale(" + (1 + 0.7 * e).toFixed(3) + ")");
    }, tWatch + 0.1, 0.7, "enter");

    Loom.tween(K.inner, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none" }, tRead, meta("copy.show"));
    m.travel(K, tRead, { x: -186, y: -283, scale: 1.2 / KS, dur: 0.9 });
    Loom.tween(hp.panel, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "none" }, tLand - 0.1, meta("panel.in"));
    Loom.tween(stem, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "none" }, tLand - 0.1, meta("panel.stem"));
    Loom.tween(kg, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none" }, tLand - 0.4, meta("copy.out"));

    m.travel(P, tRead + 0.4, { x: 600, y: PY, scale: KS, dur: Math.max(1.0, ctx.end - tRead - 0.5) });
  }
});
