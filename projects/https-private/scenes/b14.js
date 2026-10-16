// @design trip_not_verdict: the same system, one band lit blue for the private trip while a look-alike address and a dashed data store sit outside its promise
/* Treatments considered:
 * A. static composition with three callouts at once (rejected: the order of the claims is the argument).
 * B. chosen: the held system stays; a tag by the padlock, the address swaps to the look-alike while the padlock stays shut,
 *    the band unmasks blue with its label, the data store unmasks dashed (each limit arrives on its own words).
 * C. split screen of a real and a fake site (rejected: the held system must not change).
 * Overlays: the held parts' kit handles are not carried, so each change is a thin overlay element drawn at identical
 * coordinates: the address strip, the blue band (clipped round the node discs), the dashed outline.
 */
Loom.scene("b14", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, T = Loom.treat;
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    var tNot = ctx.cue("It is not a verdict on the site");
    var tPhish = ctx.cue("phishing sites can have one");
    var tCov = ctx.cue("It covers the trip");
    var tData = ctx.cue("not what the site does with your data");

    /* ---- the held system: taken, or drawn settled from frame 0 (b13's end state) ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      var bb = Loom.lesson.browser_window(ctx, B.inner, { scheme: "https" });
      bb.setState("https", ctx.start);
      bb.padlock.setState("closed_held", ctx.start);
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      var pp = Loom.lesson.network_path(ctx, PA.inner, {});
      pp.setState("trip_band", ctx.start);
    }
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var ww = Loom.lesson.watcher(ctx, W.inner, { content: "noise" });
      ww.setState("noise", ctx.start);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      var sbh = Loom.lesson.step_bar(ctx, SB.inner, {});
      sbh.setState("all_done", ctx.start);
    }
    // carried on, untouched: keys, the padlock and the band b13 drew
    ["key_slots", "key_browser", "key_server"].forEach(take);

    /* ---- 1. the address strip: the same bar, drawn again, swaps to the look-alike; the padlock stays shut ---- */
    // @form browser_window_lookalike: the address bar over the held window, host login-example.co
    var A = ctx.el("lookalike", { x: 110, y: 206, w: 520, h: 72, kind: "card", exit: "recede" });
    var cp = Loom.svg("clipPath", { id: "b14-addr-clip" }, A.inner);
    Loom.svg("rect", { x: 0, y: 0, width: 520, height: 72 }, cp);
    var aw = Loom.svg("g", { "clip-path": "url(#b14-addr-clip)" }, A.inner);
    var ag = Loom.svg("g", { transform: "translate(0 -56)" }, aw);
    var ah = Loom.lesson.browser_window(ctx, ag, { scheme: "https" });
    ah.setState("https", ctx.start);
    ah.padlock.setState("closed_held", ctx.start);
    ah.setState("lookalike_address", tPhish);
    if (ah.form && ah.form.parentNode) ah.form.parentNode.removeChild(ah.form);
    if (ah.warning && ah.warning.parentNode) ah.warning.parentNode.removeChild(ah.warning);

    /* ---- 2. the blue band between browser and server, passing behind the node discs ---- */
    // @form trip_band_blue: the private trip lit in the one blue
    var TB = ctx.el("trip_blue", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "recede" });
    var cb = Loom.svg("clipPath", { id: "b14-band-clip" }, TB.inner);
    [[0, 85], [127, 252], [325, 450], [492, 633], [675, 760]].forEach(function (s) {
      Loom.svg("rect", { x: s[0], y: 0, width: s[1] - s[0], height: 120 }, cb);
    });
    var bw = Loom.svg("g", { "clip-path": "url(#b14-band-clip)" }, TB.inner);
    var bg = Loom.svg("g", {}, bw);
    var bh = Loom.lesson.network_path(ctx, bg, {});
    Array.prototype.slice.call(bh.el.childNodes).forEach(function (n) { if (n !== bh.bandBlue) bh.el.removeChild(n); });
    bh.setState("trip_band", ctx.start, "accent");
    m.unmask(TB, tCov, { dir: "ltr", dur: 0.8 });

    /* ---- 3. the dashed outline round the data store, outside the band ---- */
    // @form data_store_outline: dashed muted outline, not covered
    var D = ctx.el("data_store", { x: 1530, y: 570, w: 180, h: 130, kind: "card", exit: "recede" });
    var dg = Loom.svg("g", { transform: "translate(-100 -400)" }, D.inner);
    var dh = Loom.lesson.server_box(ctx, dg, {});
    Array.prototype.slice.call(dh.el.childNodes).forEach(function (n) { if (n !== dh.outline) dh.el.removeChild(n); });
    dh.setState("data_store_outlined", ctx.start);
    m.unmask(D, tData, { dir: "ltr", dur: 0.7 });

    /* ---- the words ---- */
    var vt = T.label(ctx, "verdict_tag", { x: 120, y: 84, text: "Not a verdict on the site", to: [160, 224], tone: "ink", t: tNot });
    var ct = T.label(ctx, "covers_tag", { x: 1000, y: 500, text: "Covers the trip only", to: [1000, 440], tone: "ink", t: tCov + 0.3 });
    var dt = T.label(ctx, "data_tag", { x: 1555, y: 726, text: "Your data", to: [1620, 710], tone: "muted", as: "pill", t: tData + 0.4 });
  }
});
