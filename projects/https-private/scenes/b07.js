// @design one_failed_check_stops_the_trip: one row of a checked list turns to a cross, a warning covers the page and the waiting message is stopped
/* Treatments considered:
 * A. static composition: cross, warning and stopped glyph all shown at once with an arrow (rejected: the failure is a change and must land in order).
 * B. chosen: the Name mark swaps to a cross on "Fail any one", the browser's warning covers its page, the waiting glyph gets a small red cross; everything leaves in the last 0.6 s.
 * C. whole certificate flashes red (rejected: one row fails, the rest stays calm).
 * Held things are taken with ctx.held; a missing one is redrawn settled; changes are new children or new elements.
 */
Loom.scene("b07", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }

    var tCross = ctx.cue("Fail any one");
    var tWarnCue = ctx.cue("the browser warns you");
    var tWarn = Math.max(tCross + 0.5, Math.min(tWarnCue, ctx.start + 1.1));
    var tEnd = ctx.end - 0.6;
    var tWarnOut = ctx.end - 1.25;

    /* ---- the held stage ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "https" });
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
    var WA = take("watcher");
    if (!WA) {
      WA = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var dimw = Loom.svg("g", { opacity: 0.35 }, WA.inner);
      Loom.lesson.watcher(ctx, dimw, { content: "signals" }).setState("eye_closed", 0);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      Loom.lesson.step_bar(ctx, SB.inner, {}).setState("shown", 0);
    }

    /* ---- the certificate panel, three rows ---- */
    var CE = take("cert");
    if (!CE) {
      CE = ctx.el("cert", { x: 790, y: 170, w: 600, h: 406, kind: "card", exit: "none" });
      var ch = Loom.lesson.certificate_card(ctx, CE.inner, { w: 600 });
      ch.setState("tick_issuer", 0); ch.setState("tick_date", 0); ch.setState("tick_name", 0);
    }
    /* the wait glyph (held as the packet): white box, three ink bars, dashed outline */
    var PK = take("packet");
    if (!PK) {
      PK = ctx.el("packet", { x: 630, y: 335, w: 160, h: 95, kind: "token", exit: "none" });
      // @form wait_glyph: the waiting message as a plain box of three bars
      kit.rect(PK.inner, 4, 4, 147, 82, { fill: "none", r: 12, stroke: "ink", sw: 3, shadow: false });
      kit.rect(PK.inner, 10, 10, 135, 70, { fill: "surface", r: 8, shadow: false });
      [0, 1, 2].forEach(function (i) { kit.rect(PK.inner, 24, 24 + i * 18, i === 2 ? 70 : 106, 8, { fill: "ink", r: 4, shadow: false }); });
    }
    var leavers = [CE, take("tick_issuer"), take("tick_name"), take("tick_date")];
    /* held leftovers (the TLS packet, its wrap tag, the check panel) are already off screen: keep them hidden so no exit tween can flash them */
    ["tls_wrap", "check_panel"].forEach(function (n) { var H = take(n); if (H) { H.exit = "none"; Loom.tl.set(H.outer, { visibility: "hidden" }, ctx.start + 0.001); } });
    if (PK) { PK.exit = "none"; Loom.tl.set(PK.outer, { visibility: "hidden" }, ctx.start + 0.001); }

    /* ---- 1. the Name mark turns to a cross (cert part scale 600/620; mark at natural 568, 252) ---- */
    var KC = 600 / 620, mx = 790 + 568 * KC, my = 170 + 252 * KC;
    var NC = ctx.el("name_cross", { x: mx - 34, y: my - 34, w: 68, h: 68, kind: "icon", exit: "recede" });
    // @form name_cross: the Name row mark turns to a cross
    kit.rect(NC.inner, 2, 2, 64, 64, { fill: "surface", r: 12, shadow: false });
    kit.mark(NC.inner, "no", 34, 34, 50);
    m.pop(NC, tCross);

    /* ---- 2. the browser warns: the warning panel covers the page content ---- */
    var clipId = "b07-page-clip";
    var defs = Loom.svg("clipPath", { id: clipId }, B.inner);
    Loom.svg("rect", { x: 6, y: 128, width: 508, height: 410 }, defs);
    var warnG = Loom.svg("g", {}, B.inner);
    var ov = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, warnG);
    Loom.lesson.browser_window(ctx, ov, { content: "warning", scheme: "http" });
    warnG.setAttribute("opacity", 0);
    Loom.tween(warnG, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, tWarn, meta("browser.warning_in"));
    Loom.tween(warnG, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "none" }, tWarnOut, meta("browser.warning_out"));

    // the flag, above the browser title bar
    var LB = Loom.treat.label(ctx, "warning", { x: 110, y: 78, text: "One fails: warning", to: [260, 150], tone: "accent", t: tWarn });

    /* ---- 3. the waiting glyph is stopped: a small red cross on its corner ---- */
    var GN = ctx.el("glyph_no", { x: 730, y: 372, w: 44, h: 44, kind: "icon", exit: "recede" });
    // @form glyph_rejected: a small cross on the waiting glyph
    kit.mark(GN.inner, "no", 22, 22, 36);
    m.pop(GN, tWarn + 0.15);

    /* ---- everything of this beat leaves in the last 0.6 s ---- */
    leavers.push(NC, GN, LB, LB && LB.lead);
    leavers.forEach(function (E) { if (E) m.exit(E, tEnd, "recede"); });
  }
});
