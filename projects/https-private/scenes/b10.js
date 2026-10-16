// @design recorded_but_keyless: a listener's panel fills with everything it recorded, and the one slot that matters stays an unanswered question while the two ends keep the real thing
/* Treatments considered:
 * 1. static composition: panel already open, a signalling arrow to the ends (rejected: the comparison needs the question to land).
 * 2. the watcher panel opens above node 2, the two recorded chips drop in, then the question mark lands in the dashed
 *    slot; the two end keys, blue until then, settle to ink (chosen: a visible development, one blue at a time).
 * 3. a split screen of "watcher has" vs "ends have" (rejected: the held stage must not change).
 * Layout shared with b01..b09: browser (110,150), path (650,370), server (1430,170), watcher origin (759,28).
 */
Loom.scene("b10", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }

    /* ---- the held stage: taken from b09, redrawn identically and settled if it is not there ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "http" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      Loom.lesson.server_box(ctx, S.inner, { });
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var hw = Loom.lesson.watcher(ctx, W.inner, { content: "copied" });
      hw.setState("eye_open", ctx.start);
      hw.disc.setAttribute("opacity", 1);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "list", exit: "none" });
      var sb = Loom.lesson.step_bar(ctx, SB.inner, {});
      sb.tiles.forEach(function (tg) { tg.setAttribute("opacity", 1); });
      sb.setTile(1, "done", ctx.start);
      sb.setTile(2, "shown", ctx.start);
      sb.setTile(3, "shown", ctx.start);
    }

    /* ---- the two end keys (blue, named in b09): taken, or drawn named at the two ends ---- */
    var keyFns = [];                              // each recolours one end's key blue to ink at t
    var accentCol = ctx.c("accent"), inkCol = ctx.c("ink");
    function inkOf(node) {
      var n = node.querySelectorAll ? node.querySelectorAll("*") : [];
      for (var i = 0; i < n.length; i++) if (n[i].getAttribute("fill") === inkCol) return true;
      return false;
    }
    /* b09's own marks have done their job: they retire as this beat opens (a held leftover) */
    function retireMark(E) {
      var rs = E.inner.querySelectorAll("rect"), j;
      for (j = 0; j < rs.length; j++) {
        if (rs[j].getAttribute("width") === "64" && rs[j].getAttribute("height") === "64" && rs[j].parentNode && rs[j].parentNode !== E.inner) {
          Loom.tween(rs[j].parentNode, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "none" }, ctx.start, meta("own_mark.out"));
          return;
        }
      }
    }
    function takeKey(name, side, x, y) {
      var E = take(name);
      if (E) retireMark(E);
      if (!E) {
        E = ctx.el(name, { x: x, y: y, w: 240, h: 100, kind: "token", exit: "none" });
        var kh = Loom.lesson.key_exchange(ctx, E.inner, { side: side, key: "named" });
        keyFns.push(function (t) {
          Loom.tween(kh.keyLayers.named, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, t, meta("key.blue_out"));
          Loom.tween(kh.keyLayers.held, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.inOut" }, t, meta("key.ink_in"));
        });
        return E;
      }
      keyFns.push(function (t) {
        var all = E.inner.querySelectorAll("*"), shapes = [], i;
        for (i = 0; i < all.length; i++) if (all[i].getAttribute("fill") === accentCol) shapes.push(all[i]);
        if (!shapes.length) return;
        var n = shapes[0], d = 0;
        while (n && n.parentNode && d < 8 && !(n.nextSibling && inkOf(n.nextSibling))) { n = n.parentNode; d++; }
        if (n && n.nextSibling && inkOf(n.nextSibling)) {
          Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, t, meta("key.blue_out"));
          Loom.tween(n.nextSibling, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.inOut" }, t, meta("key.ink_in"));
        } else {
          Loom.hold.heat(shapes, t, { from: "accent", to: "ink", dur: 0.5, attr: "fill" });
        }
      });
      return E;
    }
    takeKey("key_browser", "browser", 650, 564);
    takeKey("key_server", "server", 1230, 564);

    /* ---- the watcher's panel: its own element over the same frame, stem and disc stay with the held watcher ---- */
    var WP = ctx.el("watcher_panel", { x: 759, y: 28, w: 360, h: 440, kind: "card", exit: "displace" });
    var hp = Loom.lesson.watcher(ctx, WP.inner, { content: "signals" });
    var stem = hp.el.childNodes[1];
    // @form watcher_signals: the two recorded signal chips, a dashed key slot and an ink question mark
    var sg = null, i, pc = hp.panel.childNodes;
    for (i = 0; i < pc.length; i++) {
      if (pc[i].querySelector && pc[i].querySelector("text") && /\?/.test(pc[i].textContent || "") && /Watcher: no key/.test(pc[i].textContent || "")) sg = pc[i];
    }
    var chips = [], slotN = null, qm = null, footN = null;
    if (sg) {
      var kids = sg.childNodes, dashAt = -1;
      for (i = 0; i < kids.length; i++) {
        if (dashAt < 0 && kids[i].getAttribute && kids[i].getAttribute("stroke-dasharray")) dashAt = i;
      }
      for (i = 0; i < kids.length; i++) {
        if (dashAt >= 0 && i < dashAt) chips.push(kids[i]);
        else if (i === dashAt) slotN = kids[i];
        else if (kids[i].tagName === "text" && kids[i].textContent === "?") qm = kids[i];
        else if (i > dashAt) footN = kids[i];
      }
    }

    /* ---- the clock, from the words ---- */
    var tOpen = ctx.cue("Even someone");
    var tRec = ctx.cue("recorded all");
    var tCannot = ctx.cue("cannot practically");
    var tKey = ctx.cue("work the key out");

    // the panel opens above node 2 with its empty dashed slot (title, stem, frame)
    Loom.tween(hp.panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tOpen, meta("panel.in"));
    Loom.tween(stem, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, tOpen + 0.15, meta("panel.stem"));
    if (footN) footN.setAttribute("opacity", 0);
    if (qm) qm.setAttribute("opacity", 0);
    // the two recorded chips drop in one after the other on "recorded all of it"
    var half = Math.max(1, Math.floor(chips.length / 2));
    chips.forEach(function (c, idx) {
      var t0 = tRec + (idx < half ? 0 : 0.4);
      c.setAttribute("opacity", 0);
      Loom.tween(c, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t0, meta("chip.in" + idx));
    });
    // the question mark lands in the dashed slot and the foot label arrives with it
    if (qm) Loom.tween(qm, { opacity: 0, scale: 0.4, transformOrigin: "269px 106px" }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, tCannot, meta("question.land"));
    if (footN) Loom.tween(footN, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, tCannot + 0.15, meta("foot.in"));

    // the two ends keep their key: it settles from blue to ink (one blue at a time, the keys are the last)
    keyFns.forEach(function (f) { f(tKey); });
  }
});
