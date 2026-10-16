// @design key_from_crossing: two different marks cross a watched path, and an identical thing forms at each end
// Treatments considered: (1) static composition: both slots filled, label only (no cause shown); (2) one signal
// shown carrying a locked key (breaks the misconception rule); (3) CHOSEN: own marks stay home, two different
// signals cross on lanes, each end merges received + own into the identical key (motion carries the meaning).
Loom.scene("b09", {
  build(ctx, props) {
    const { kit, m } = ctx;
    ["browser", "server", "path", "watcher", "step_bar", "key_slots"].forEach((n) => ctx.held(n));

    const tOwn = ctx.cue("They run a key exchange");
    const tSig = ctx.cue("The key itself never travels");
    const tComb = ctx.cue("in a form a watcher can use");

    // the exchange part: own marks and the two signals (its own key and slot drawings are switched off below)
    const X = ctx.el("key_signals", { x: 440, y: 380, w: 1170, h: 330, kind: "instrument", exit: "recede" });
    const kx = Loom.lesson.key_exchange(ctx, X.inner, { origin: [440, 380] });
    ["browser", "server"].forEach((s) => {
      ["kA", "kI"].forEach((k) => kx.ends[s][k].setAttribute("display", "none"));
    });
    kx.setState("slots_empty", ctx.start);
    kx.setState("own_marks", tOwn);
    kx.signals(tSig, tComb - 0.1);
    kx.setState("combine", tComb);

    // the identical key at each end, blue as it lands (held by the next beat)
    const KEY_D = "M24 2 a22 22 0 1 0 0.01 0 Z M24 16 a8 8 0 1 1 -0.01 0 Z M44 19 H124 V40 H114 V30 H106 V44 H96 V30 H44 Z";
    const keyAt = (name, x) => {
      // @form shared_key: the identical notched key, formed at the end
      const E = ctx.el(name, { x, y: 647, w: 130, h: 52, kind: "token", exit: "none" });
      Loom.svg("path", { d: KEY_D, fill: ctx.c("accent"), "fill-rule": "evenodd" }, E.inner);
      m.pop(E, tComb + 0.45);
      void 0;
      return E;
    };
    keyAt("key_browser", 468);
    keyAt("key_server", 1458);

    // the label for the idea
    const fit = kit.fit("Key exchange", { role: "lead", w: 600, h: 60, maxLines: 1, weight: 700 });
    const lw = Math.round(fit.width + 64), lh = 68;
    const L = ctx.el("key_exchange_label", { x: Math.round(1000 - lw / 2), y: 536, w: lw, h: lh, kind: "card", exit: "recede" });
    kit.pill(L.inner, 0, 0, lw, lh, { fill: "surface", stroke: "line", sw: 2 });
    kit.text(L.inner, "Key exchange", { role: "lead", x: 16, y: 4, w: lw - 32, h: lh - 8, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.reveal(L, tOwn);
  },
});
