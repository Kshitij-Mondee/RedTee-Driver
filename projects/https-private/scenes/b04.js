// @design wrap_then_hello : a plain message is sealed in an outline, then two short greetings cross the line before anything is sent
/* Treatments considered:
 * 1. static composition: the sealed packet and a Handshake first label, signalled with an arrow (rejected: the order wrap then greet is the point).
 * 2. the held stage stays; tile 1 lights, a new plain packet appears at the browser, the address turns https, the TLS outline closes
 *    around it, then two Hello chips cross a side lane and return while the packet waits (chosen: sequence = argument).
 * 3. a split screen of HTTP and HTTPS (rejected: the held stage must not change).
 * Layout shared with b01/b02: browser (110,150), path (650,370), server (1430,170), watcher origin (759,28), step_bar (360,780).
 */
Loom.scene("b04", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    function fadeTo(node, a, b, t, d, n) {
      Loom.tween(node, { opacity: a }, { opacity: b, duration: d, ease: "none" }, t, meta(n));
    }

    /* ---- the clock, from the words ---- */
    var tHttps = ctx.cue("HTTPS is web traffic");
    var tWrap = ctx.cue("wrapped in TLS");
    var tHand = ctx.cue("opens with a handshake");
    var tTile = ctx.start + 0.02;                   // tile 1 named
    var tPack = tHttps + 0.3;             // the new packet and the https address
    var tTileOff = tHttps + 1.0;          // tile 1 settles back to shown, the wrap takes over as the one blue
    var tWrapAt = Math.max(tWrap, tTileOff + 0.15);

    /* ---- the held stage: taken from b03, drawn only if it is not there ---- */
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
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var hw = Loom.lesson.watcher(ctx, W.inner, {});
      hw.setState("eye_open", ctx.start);
    }

    /* ---- the step bar: tile 1 named, then shown (an overlay of tile 1 only, over the held bar) ---- */
    var SB = take("step_bar");
    var sbh;
    if (SB) {
      // @form step_tile: tile 1 of the held step bar, lit on its own overlay
      var SO = ctx.el("step_tile_one", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "recede" });
      sbh = Loom.lesson.step_bar(ctx, SO.inner, {});
      sbh.setTile(1, "shown", ctx.start);
      // the overlay carries tile 1 only: its tile 2 and 3 words would sit exactly on the held bar's copies, so they are not drawn
      var oq = SO.inner.querySelectorAll("text"), orm = [];
      for (var oi = 0; oi < oq.length; oi++) {
        var os = (oq[oi].textContent || "").replace(/\s+/g, " ").trim();
        if (os !== "1" && os !== "Prove who") orm.push(oq[oi]);
      }
      for (var oj = 0; oj < orm.length; oj++) { if (orm[oj].parentNode) orm[oj].parentNode.removeChild(orm[oj]); }
      // the held bar's own tile 1 words step aside while the overlay carries them (no two copies of one word)
      var hq = SB.inner.querySelectorAll("text");
      for (var hi = 0; hi < hq.length; hi++) {
        var hs = (hq[hi].textContent || "").replace(/\s+/g, " ").trim();
        if (hs === "1" || hs === "Prove who") {
          Loom.tween(hq[hi], { opacity: 1 }, { opacity: 0, duration: 0.02, ease: "none" }, ctx.start, meta("held.tile1_hide" + hi));
          Loom.tween(hq[hi], { opacity: 0 }, { opacity: 1, duration: 0.02, ease: "none" }, ctx.end - 0.05, meta("held.tile1_back" + hi));
        }
      }
    } else {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      sbh = Loom.lesson.step_bar(ctx, SB.inner, {});
      sbh.setState("shown", ctx.start);
    }
    sbh.setTile(1, "named", tTile);
    sbh.setTile(1, "shown", tTileOff);

    /* ---- the address turns https: a patch over the address text only (the padlock and frame stay as held) ---- */
    // @form address_https: the address reads https:// (the browser's own https address swaps in for the http one, no second copy)
    var aRoot = B.inner.children[0], aHttp = null, aHttps = null;
    for (var ai = 0; aRoot && ai < aRoot.children.length; ai++) {
      var at0 = aRoot.children[ai].querySelectorAll("text");
      if (at0.length < 2) continue;
      var s0 = at0[0].textContent || "", s1 = at0[1].textContent || "";
      if (s0.indexOf("http://") === 0 && !aHttp) aHttp = aRoot.children[ai];
      else if (s0.indexOf("https://") === 0 && s1.indexOf("login.example") === 0 && !aHttps) aHttps = aRoot.children[ai];
    }
    // a hard swap: the http copy is gone before the https copy begins, so the two never show at once
    if (aHttp) fadeTo(aHttp, 1, 0, tPack - 0.012, 0.01, "address.http_out");
    if (aHttps) fadeTo(aHttps, 0, 1, tPack, 0.01, "address.https");

    /* ---- the new plain packet waits at the browser (the PACKET WAIT box) ---- */
    var K = ctx.el("packet", { x: 604, y: 284, w: 232, h: 129, kind: "token", exit: "none" });
    // @form login_packet: plain at the browser, then wrapped in TLS
    var kh = Loom.lesson.login_packet(ctx, K.inner, { w: 232 });
    m.reveal(K, tPack);
    kh.setState("wrapped", tWrapAt);

    /* ---- the TLS label, clear of the lane ---- */
    // @form tls_label: HTTPS = HTTP inside TLS
    Loom.treat.label(ctx, "tls_wrap", { x: 640, y: 214, text: "HTTPS = HTTP inside TLS", to: [700, 286], tone: "ink", t: tWrapAt + 0.15 });

    /* ---- the handshake: two Hello chips along a lane below the path ---- */
    var LY = 519, CW = 124, CH = 52, X0 = 650, X1 = 1290;
    var HL = ctx.el("hello", { x: 640, y: LY - 14, w: 800, h: CH + 28, kind: "connector", exit: "recede" });
    // @form handshake_lane: a thin dashed lane for the chips
    Loom.svg("line", { x1: 10, y1: CH / 2 + 14, x2: 790, y2: CH / 2 + 14, stroke: ctx.c("line"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, HL.inner);
    m.unmask(HL, tHand - 0.05, { dir: "ltr", dur: 0.45 });

    function chip(name, x, fill, txtColor) {
      var E = ctx.el(name, { x: x, y: LY, w: CW, h: CH, kind: "token", exit: "recede" });
      // @form hello_chip: a small Hello chip
      kit.rect(E.inner, 0, 0, CW, CH, { fill: fill, r: 14, shadow: false });
      kit.text(E.inner, "Hello", { role: "label", size: 28, x: 0, y: 0, w: CW, h: CH, align: "center", valign: "middle", maxLines: 1, weight: 700, color: txtColor });
      return E;
    }
    var c1 = chip("hello_out", X0, "accent3", "onAccent");
    var c2 = chip("hello_back", X1, "accent2", "ink");
    var tOut = tHand + 0.05, dOut = 0.65;
    var tBack = tOut + dOut + 0.05;
    m.reveal(c1, tOut);
    m.travel(c1, tOut, { x: X1 - X0, y: 0, dur: dOut });
    fadeTo(c1.inner, 1, 0, tBack, 0.15, "hello_out.out");
    m.reveal(c2, tBack);
    m.travel(c2, tBack, { x: X0 - X1, y: 0, dur: dOut });
    var tEnd = Math.min(tBack + dOut + 0.15, ctx.end - 0.35);
    fadeTo(c2.inner, 1, 0, tEnd, 0.2, "hello_back.out");

    // @form handshake_label: Handshake first
    Loom.treat.label(ctx, "handshake_label", { x: 960, y: 618, text: "Handshake first", to: [1040, 578], tone: "ink", t: tHand + 0.1 });
  }
});
