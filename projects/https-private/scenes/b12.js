// @design noise_seen_change_refused: a scrambled card crosses a watched node and stays unreadable, then a second card changed on the way is stopped at the far edge
/* Treatments considered:
 * 1. static composition: watcher noise panel, both packets drawn, a cross, signalled with an arrow (rejected: the copy and the change happen in transit).
 * 2. split stage with a "good" lane and a "bad" lane (rejected: held stage must not change, two packets at once confuses).
 * 3. chosen: ONE packet at a time on the held lane. Packet 1 (noise, blue outline) crosses node 2, the watcher panel copies it and shows noise,
 *    it reaches the server key slot, a tie arrow lands on the slot and it unscrambles to plain, the server lights. Packet 1 leaves.
 *    Packet 2 (noise) rides in, one glyph block swaps at node 3 (altered), at the server edge it is refused: cross, dim, tag.
 */
Loom.scene("b12", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }

    /* ---- the held stage: taken, or drawn the same, settled ---- */
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
    var W0 = take("watcher");
    if (!W0) {
      W0 = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var hw0 = Loom.lesson.watcher(ctx, W0.inner, { content: "signals" });
      hw0.setState("signals", ctx.start);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      var hs = Loom.lesson.step_bar(ctx, SB.inner, {});
      hs.setState("done", ctx.start, 1); hs.setState("done", ctx.start, 2); hs.setState("shown", ctx.start, 3);
    }
    ["key_slots", "key_browser", "key_server"].forEach(function (n) { take(n); });

    /* ---- the clock, from the words ---- */
    var tWatch = ctx.cue("The watcher sees");
    var tNoise = ctx.cue("only noise");
    var tChange = ctx.cue("any change");
    var tTransit = ctx.cue("in transit");
    var tDetect = ctx.cue("is detected");
    var probe = [tWatch, tNoise, tChange, tTransit, tDetect, ctx.start, ctx.end];
    void probe; // timing checked

    var PY = 107, KS = 1;                  // packet rides just above the line
    var DX0 = -10, DX2 = 208, DX3 = 390, DXE = 629;

    /* ---- the watcher's noise panel: its own element over the held frame ---- */
    var WN = ctx.el("watcher_noise", { x: 759, y: 28, w: 360, h: 440, kind: "card", exit: "displace" });
    var hn = Loom.lesson.watcher(ctx, WN.inner, { content: "noise" });

    /* ---- the server's top unit lights (receiving): a copy of that unit, lit ---- */
    var SR = ctx.el("server_rx", { x: 1430, y: 170, w: 380, h: 88, kind: "card", exit: "recede" });
    // @form server_receiving: the top unit with its dots lit ink
    kit.rect(SR.inner, 40, 0, 300, 88, { fill: "surface", r: 14, stroke: "surface2", sw: 3, shadow: false });
    kit.rect(SR.inner, 68, 39, 130, 10, { fill: "ink", r: 5, shadow: false });
    [0, 1].forEach(function (d) { Loom.svg("circle", { cx: 304 - d * 28, cy: 44, r: 8, fill: ctx.c("ink") }, SR.inner); });

    /* ---- the tie from the packet to the server key slot ---- */
    var TI = ctx.el("unscramble_tie", { x: 1340, y: 428, w: 40, h: 140, kind: "connector", exit: "recede" });
    // @form key_tie: an ink arrow from the packet's end down into the server key slot
    var ar = kit.arrow(TI.inner, 20, 0, 20, 128, { stroke: "ink", bend: 0 });

    /* ---- the copy that peels off packet 1 into the watcher panel ---- */
    var CP = ctx.el("noise_copy", { x: 858, y: 331, w: 162, h: 90, kind: "token", exit: "recede" });
    // @form login_packet_copy: a small noise copy that rises into the panel
    var cph = Loom.lesson.login_packet(ctx, CP.inner, { w: 162 });
    cph.setState("noise", ctx.start);

    /* ---- packet 1: noise, named in blue while it travels ---- */
    var N = ctx.el("noise_packet", { x: 650, y: 230, w: 162, h: 90, kind: "token", exit: "recede" });
    var nh = Loom.lesson.login_packet(ctx, N.inner, { w: 162 });
    nh.setState("noise", ctx.start);
    // @form accent_outline: the single blue outline naming the noise packet
    var nring = Loom.svg("rect", { x: 1, y: 6, width: 160, height: 82, rx: 9, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, N.inner);
    m.travel(N, ctx.start + 0.01, { x: DX0, y: PY, scale: KS, dur: 0.01 });
    m.reveal(N, ctx.start + 0.05);

    /* ---- packet 2: noise, altered at node 3, refused at the server edge ---- */
    var T = ctx.el("tamper_packet", { x: 650, y: 230, w: 162, h: 90, kind: "token", exit: "recede" });
    var th = Loom.lesson.login_packet(ctx, T.inner, { w: 162 });
    th.setState("noise", ctx.start);
    m.travel(T, ctx.start + 0.01, { x: DX0, y: PY, scale: KS, dur: 0.01 });
    // @form changed_block_ring: an amber ring on the glyph block that was swapped
    var aring = Loom.svg("rect", { x: 11, y: 56, width: 46, height: 30, rx: 6, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 3, opacity: 0 }, T.inner);
    

    /* ---- the refusal: a cross at the server edge and the tag ---- */
    var RM = ctx.el("reject_mark", { x: 1404, y: 324, w: 56, h: 56, kind: "icon", exit: "recede" });
    // @form neg_cross: the cross at the server edge
    kit.mark(RM.inner, "no", 28, 28, 56);
    var TG = ctx.el("tamper_tag", { x: 1060, y: 484, w: 340, h: 60, kind: "bubble", exit: "recede" });
    // @form neg_tag: Tampering detected
    kit.pill(TG.inner, 0, 0, 340, 60, { fill: "neg", shadow: false });
    kit.text(TG.inner, "Tampering detected", { role: "label", size: 28, x: 16, y: 0, w: 308, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });

    /* ---- beat 1: noise crosses; the watcher copies it and sees only noise ---- */
    var tArrive = tNoise + 0.8;
    m.travel(N, tWatch, { x: DX2, y: PY, scale: KS, dur: Math.max(0.6, tNoise - tWatch) });
    m.travel(N, tNoise, { x: DXE, y: PY, scale: KS, dur: tArrive - tNoise });
    // the copy peels up at node 2 and the panel shows noise
    Loom.tween(CP.inner, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none" }, tNoise, meta("copy.show"));
    CP.inner.setAttribute("opacity", 0);
    m.travel(CP, ctx.start + 0.01, { x: 0, y: 0, scale: 1, dur: 0.01 });
    m.travel(CP, tNoise, { x: -32, y: -225, scale: 1.4, dur: 0.6 });
    hn.setState("noise", tNoise + 0.45);
    hn.pulse(tNoise + 0.45);
    Loom.tween(CP.inner, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none" }, tNoise + 0.75, meta("copy.out"));

    // at the server: the tie lands on the key slot, the card unscrambles, the unit lights
    Loom.tween(TI.inner, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tArrive, meta("tie.in"));
    TI.inner.setAttribute("opacity", 0);
    m.draw(ar, tArrive, { dur: 0.35 });
    nh.morph("plain", tArrive + 0.15, 0.4);
    Loom.tween(nring, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "none" }, tArrive + 0.15, meta("ring.out"));
    SR.inner.setAttribute("opacity", 0);
    Loom.tween(SR.inner, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tArrive + 0.3, meta("server.receiving"));
    // packet 1 and its tie leave before packet 2 arrives
    var tGone = Math.max(tArrive + 0.9, tChange + 0.2);
    var tRetire = tArrive + 0.9;   // plaintext packet retires as soon as it has been read
    Loom.tween(N.inner, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "none" }, tRetire, meta("noise.out"));
    Loom.tween(TI.inner, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "none" }, tRetire, meta("tie.out"));
    Loom.tween(SR.inner, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none" }, tGone + 0.1, meta("server.idle"));

    /* ---- beat 2: a changed packet is detected ---- */
    var tIn = tGone + 0.15;
    T.inner.setAttribute("opacity", 0);
    Loom.tween(T.inner, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, tIn, meta("tamper.in"));
    m.travel(T, tIn, { x: DX3, y: PY, scale: KS, dur: Math.max(0.7, tTransit - tIn) });
    th.morph("altered", Math.max(tTransit, tIn + 0.7), 0.3);
    var tAlt = Math.max(tTransit, tIn + 0.7);
    m.travel(T, tAlt, { x: DXE, y: PY, scale: KS, dur: Math.max(0.8, tDetect - tAlt) });
    Loom.tween(aring, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, tAlt + 0.1, meta("changed.ring"));
    var tStop = Math.max(tDetect, tAlt + 0.8);
    th.setState("rejected", tStop);
    m.pop(RM, tStop);
    RM.inner.setAttribute("opacity", 0);
    m.pop(TG, tStop + 0.15);
  }
});
