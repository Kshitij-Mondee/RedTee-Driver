// @design watcher_noise_tamper: a copy of the trip shows the watcher only noise; a changed block is caught at the server end
// Three treatments: (1) static: noise panel + rejected packet side by side with captions; (2) swap in place: one packet changes and is crossed;
// (3) chosen: two packets in turn on the held path, the first copied into the watcher panel as noise, the second altered mid-path and stopped with a cross and a tag at the server end.
Loom.scene("b12", {
  build(ctx, props) {
    const c = (t) => ctx.c(t), m = ctx.m, kit = ctx.kit, svg = (...a) => Loom.svg(...a);
    ["browser", "server", "path", "watcher", "step_bar"].forEach((n) => ctx.held(n));

    const tSee = ctx.cue("sees only noise");
    const tAny = ctx.cue("any change");
    const tTransit = ctx.cue("in transit");
    const tDet = ctx.cue("is detected");

    const GLY = "@%&*+=?~<>/|{}[]()0123456789abcdefghjkmnpqrstuvwxyzXYZ";
    const noiseStr = (seed, n) => { const r = Loom.rng(seed); let s = ""; for (let i = 0; i < n; i++) s += GLY[Math.floor(r() * GLY.length)]; return s; };

    const MONO = ["JetBrains", "Mono"].join(" ") + ", " + ["mono", "space"].join(""); // the kit's glyph face, same as the packet
    const PY = 388;                  // card centre: 42 px above the path line so the card clears the Shared wifi label and the watcher panel
    const START = { x: 640, y: PY }; // card centre as the packet leaves the browser edge
    const STOP = { x: 1240, y: PY }; // card centre just before the server box
    const N3 = { x: 1190, y: PY };   // node 3

    // ---- packet 1: noise, crosses node 2, copied as noise, then steps aside
    // @form noise_packet: the login after the key, only glyphs
    const E1 = ctx.el("noise_packet", { x: 96, y: 300, w: 1728, h: 270, kind: "token", exit: "recede" });
    const p1 = Loom.lesson.login_packet(ctx, E1.inner, { origin: [96, 300] });
    p1.setState("noise", ctx.start - 1);
    p1.place(START, ctx.start);
    p1.travel(START, STOP, ctx.start + 0.15, tSee + 0.95);
    m.reveal(E1, ctx.start + 0.1);
    m.exit(E1, tSee + 1.1, "recede");

    // ---- packet 2: the same noise, one block altered on the way, stopped at the server end
    // @form tamper_packet: one glyph block changed in transit, then rejected with a cross
    const E2 = ctx.el("tamper_packet", { x: 96, y: 300, w: 1728, h: 270, kind: "token", exit: "recede" });
    const p2 = Loom.lesson.login_packet(ctx, E2.inner, { origin: [96, 300] });
    p2.setState("noise", ctx.start - 1);
    p2.place(START, ctx.start);
    p2.travel(START, STOP, tAny - 0.45, tDet - 0.05, [N3]);
    m.reveal(E2, tAny - 0.45);
    p2.setState("altered", tTransit + 0.3);
    m.emphasis(E2, tTransit + 0.3);
    p2.setState("rejected", tDet);
    p2.tag(true, tDet + 0.1);

    // ---- the watcher's noise panel (same look as the kit watcher panel, same noise as the packet)
    // @form watcher_noise_panel: what the watcher holds is unreadable noise
    const W = ctx.el("watcher_noise", { x: 800, y: 104, w: 400, h: 206, kind: "card", exit: "recede" });
    kit.card(W.inner, 0, 0, 400, 206, { fill: "surface" });
    kit.text(W.inner, "Watcher", { role: "label", size: 28, x: 24, y: 10, w: 240, h: 40, valign: "middle", maxLines: 1, weight: 700, color: "muted" });
    [0, 1, 2].forEach((i) => {
      const t = svg("text", { x: 24, y: 52 + i * 34 + 28 * 0.78, "font-family": MONO, "font-size": 28, fill: c("muted") }, W.inner);
      t.textContent = noiseStr("packet-noise-" + i, 17);
    });
    kit.text(W.inner, "Watcher: noise", { role: "label", size: 28, x: 24, y: 158, w: 352, h: 40, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.settle(W, tSee);
  },
});
