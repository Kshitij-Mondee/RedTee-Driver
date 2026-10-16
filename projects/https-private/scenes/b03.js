// @design three_named_steps: a row of three empty slots along the bottom fills one tile at a time, each lit while it is named
/* Treatments considered:
 * A. static composition: the finished step bar fades in whole with an arrow (rejected: the order of the moves is the point).
 * B. the three tiles drop in together (rejected: loses the one-by-one naming).
 * C. chosen: dashed slots appear on "three moves", each tile rises into its slot on its own word, blue while named, then neutral.
 * The held system stays above; the watcher's blue ring fades so the tile is the only blue.
 */
Loom.scene("b03", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }

    /* ---- the held stage, drawn identically and settled if it is not there ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "http" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      var sh0 = Loom.lesson.server_box(ctx, S.inner, {});
      sh0.setState("receiving", ctx.start);
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var W = take("watcher");
    var fresh = false;
    if (!W) {
      fresh = true;
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var hw = Loom.lesson.watcher(ctx, W.inner, { content: "copied" });
      hw.setState("eye_open", ctx.start);
    }
    var accentCol = ctx.c("accent");

    /* ---- the watcher's blue ring fades out in the first 0.5 s: the tile is the only blue ---- */
    if (!fresh) {
      var cs = W.inner.querySelectorAll("circle");
      for (var i = 0; i < cs.length; i++) {
        var cc = cs[i];
        var st = cc.getAttribute("stroke");
        if (st && st === accentCol) {
          var big = parseFloat(cc.getAttribute("stroke-width") || "0") >= 6;
          Loom.tween(cc, { opacity: big ? 1 : 0 }, { opacity: 0, duration: 0.45, ease: "power2.out" }, ctx.start + 0.05, meta("watcher.ring_off"));
        }
      }
    }

    /* ---- the clock, from the words (cues) ---- */
    var tThree = ctx.cue("three moves");
    var tProve = ctx.cue("prove who");
    var tAgree = ctx.cue("agree a key");
    var tScr = ctx.cue("scramble");
    var tEnd = ctx.end;

    /* ---- quiet traffic on the lane: three muted dots, once across (no second accent) ---- */
    var T = ctx.el("traffic", { x: 640, y: 420, w: 160, h: 20, kind: "token", exit: "recede" });
    // @form idle_traffic: three small muted dots drifting along the lane
    [20, 80, 140].forEach(function (cx, i) {
      Loom.svg("circle", { cx: cx, cy: 10, r: 7 - i, fill: ctx.c("muted"), opacity: 1 - 0.25 * i }, T.inner);
    });
    T.inner.setAttribute("opacity", 0);
    Loom.tween(T.inner, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, ctx.start + 0.3, meta("traffic.in"));
    var tTr = Math.max(tEnd - ctx.start - 1.3, 2.5);
    m.travel(T, ctx.start + 0.3, { x: 610, y: 0, dur: tTr });
    Loom.tween(T.inner, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "none" }, ctx.start + 0.3 + tTr - 0.25, meta("traffic.out"));

    /* ---- the step bar: slots first (scaffold), then the tiles ---- */
    var SL = ctx.el("step_slots", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    var TW = 380, GAP = 30;
    var slots = [];
    // @form step_slots: three dashed empty slots where the tiles will land
    for (var k = 0; k < 3; k++) {
      var r = Loom.svg("rect", { x: k * (TW + GAP) + 2, y: 2, width: TW - 4, height: 86, rx: 20, fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "12 10", "stroke-linecap": "round", opacity: 0 }, SL.inner);
      slots.push(r);
      Loom.tween(r, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out", delay: 0 }, tThree + k * 0.12, meta("slot.in" + k));
    }

    var SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "list", exit: "none" });
    // @form step_bar: three tiles, one named at a time
    var sb = Loom.lesson.step_bar(ctx, SB.inner, {});
    var times = [tProve, tAgree, tScr];
    var wraps = [];
    sb.tiles.forEach(function (tg, idx) {
      var wrap = Loom.svg("g", {}, sb.el);
      wrap.appendChild(tg);
      wraps.push(wrap);
      var t0 = times[idx];
      Loom.tween(wrap, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, t0, meta("tile.rise" + idx));
      Loom.tween(slots[idx], { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "none" }, t0 + 0.25, meta("slot.out" + idx));
      sb.setTile(idx + 1, "named", t0);
      var tNext = idx < 2 ? times[idx + 1] : Math.min(t0 + 0.9, tEnd - 0.1);
      sb.setTile(idx + 1, "shown", Math.max(tNext, t0 + 0.7));
    });
  }
});
