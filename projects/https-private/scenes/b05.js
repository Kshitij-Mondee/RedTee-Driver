// @design proof_handed_across: a small credential leaves one end, rides a clear lane to the other end and opens into a large panel where it can be read
/* Treatments considered:
 * 1. static composition: the large card already in the centre, signalled with an arrow from the rack (rejected: the hand-over direction is the meaning, it needs motion).
 * 2. the small card slides out of the rack along a clear lane above the path, then grows into the check panel space (chosen).
 * 3. split screen of sender and receiver views (rejected: the held stage must not change).
 * Layout shared with b01/b02/b04: browser (110,150), path (650,370), server (1430,170), watcher (759,28), step_bar (360,780).
 */
Loom.scene("b05", {
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
    var tStep = ctx.cue("Move one");
    var tPres = ctx.cue("The server presents");
    var tProof = ctx.cue("its proof of who it is");
    var tOff = tStep + 1.5;

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
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      Loom.lesson.watcher(ctx, W.inner, {}).setState("eye_closed", ctx.start);
    }
    // the 'Shared wifi' label would be clipped by the panel's left edge: it steps aside as the panel space opens
    var pq = PA.inner.querySelectorAll("text");
    for (var pi = 0; pi < pq.length; pi++) {
      if ((pq[pi].textContent || "").replace(/\s+/g, " ").trim() === "Shared wifi") fadeTo(pq[pi], 1, 0, tPres - 0.1, 0.3, "path.label_out" + pi);
    }
    // the watcher goes quiet behind the card
    fadeTo(W.inner, 1, 0.35, tPres, 0.5, "watcher.dim");

    /* ---- the b04 packet and its label step aside; a text-free wait glyph takes the packet's place ---- */
    var PK = take("packet");
    if (PK) fadeTo(PK.inner, 1, 0, ctx.start, 0.25, "packet.out");
    var TW = take("tls_wrap");
    if (TW) fadeTo(TW.inner, 1, 0, ctx.start, 0.25, "tls_wrap.out");

    // @form wait_packet: a text-free packet glyph with a dashed TLS outline
    var PW = ctx.el("packet_wait", { x: 634, y: 339, w: 147, h: 82, kind: "token", exit: "none" });
    Loom.svg("rect", { x: 6, y: 6, width: 135, height: 70, rx: 8, fill: ctx.c("surface"), stroke: ctx.c("accent3"), "stroke-width": 2 }, PW.inner);
    [23, 41, 59].forEach(function (by) {
      Loom.svg("rect", { x: 21, y: by, width: 105, height: 6, rx: 3, fill: ctx.c("ink"), opacity: 0.45 }, PW.inner);
    });
    Loom.svg("rect", { x: 1.25, y: 1.25, width: 144.5, height: 79.5, rx: 11, fill: "none", stroke: ctx.c("ink"), "stroke-width": 2.5, "stroke-dasharray": "6 5" }, PW.inner);
    m.reveal(PW, ctx.start);

    /* ---- the step bar: tile 1 named for 1.5 s, then plain again (an overlay of tile 1 over the held bar) ---- */
    var SB = take("step_bar");
    var sbh;
    var SO = ctx.el("step_tile_blue", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    // @form step_tile: tile 1 of the bar, named in blue
    sbh = Loom.lesson.step_bar(ctx, SO.inner, {});
    if (SB) {
      sbh.setTile(1, "shown", ctx.start);
      var hq = SB.inner.querySelectorAll("text");
      for (var hi = 0; hi < hq.length; hi++) {
        var hs = (hq[hi].textContent || "").replace(/\s+/g, " ").trim();
        if (hs === "1" || hs === "Prove who") {
          Loom.tween(hq[hi], { opacity: 1 }, { opacity: 0, duration: 0.02, ease: "none" }, tStep, meta("held.tile1_hide" + hi));
          Loom.tween(hq[hi], { opacity: 0 }, { opacity: 1, duration: 0.02, ease: "none" }, tOff + 0.3, meta("held.tile1_back" + hi));
        }
      }
      sbh.setTile(1, "named", tStep);
      sbh.setTile(1, "shown", tOff);
      fadeTo(SO.inner, 1, 0, tOff + 0.32, 0.2, "step_tile.out");
    } else {
      sbh.setState("shown", ctx.start);
      sbh.setTile(1, "named", tStep);
      sbh.setTile(1, "shown", tOff);
    }

    /* ---- the check panel space: a quiet slot behind the card, exactly the panel's box ---- */
    var CP = ctx.el("check_panel", { x: 790, y: 170, w: 600, h: 406, kind: "card", exit: "none" });
    // @form check_panel_slot: the browser's check panel, a quiet dashed slot the card lands in
    kit.rect(CP.inner, 3, 3, 594, 400, { fill: "surface2", r: 24, stroke: "muted", sw: 2, shadow: false });
    m.reveal(CP, tPres - 0.1);

    /* ---- the certificate: small form leaves the rack, rides a lane above the path, grows into the panel ---- */
    var C = ctx.el("cert", { x: 790, y: 170, w: 600, h: 406, kind: "card", exit: "none" });
    // @form certificate_card: small, then in_panel with three blank rows
    var ch = Loom.lesson.certificate_card(ctx, C.inner, { form: "small", w: 600 });
    // @form cert_outline: the accent ring on the travelling small card
    var ring = Loom.svg("g", {}, C.inner);
    Loom.svg("rect", { x: -2, y: -2, width: 290 + 4, height: 194 + 4, rx: 22, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, ring);
    m.travel(C, ctx.start, { x: 390, y: 23, dur: 0.01 });
    m.reveal(C, tPres);
    m.travel(C, tPres + 0.15, { x: 0, y: 0, dur: Math.max(1.2, tProof - 0.25 - (tPres + 0.15)) });

    var D = 0.9;
    fadeTo(ring, 1, 0, tProof, 0.25, "cert.ring_out");
    Loom.tween(ch.small, { scale: 1, transformOrigin: "0px 0px" }, { scale: 1.5, duration: 0.45, ease: "power2.out" }, tProof, meta("cert.small_grow"));
    Loom.tween(ch.big, { scale: 0.62, transformOrigin: "0px 0px" }, { scale: 1, duration: D, ease: "power2.out" }, tProof + 0.2, meta("cert.big_grow"));
    ch.setState("in_panel", tProof + 0.2);
  }
});
