// @design recorded_but_no_key: a held panel shows what an onlooker copied, against the keys the two ends hold
// Treatments considered: (1) static panel with an arrow from the path (signalled, inert),
// (2) panel opens with the two recorded copies, then the question mark lands in the dashed slot (chosen: a held comparison),
// (3) the signals replay and fade at the watcher (repeats b09, a second focus).
Loom.scene("b10", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (...a) => Loom.svg(...a);

    // held system from the beats before: nothing redrawn
    ["browser", "server", "path", "watcher", "step_bar", "key_slots"].forEach((n) => ctx.held(n));
    const KB = ctx.held("key_browser");
    const KSV = ctx.held("key_server");

    const tOpen = ctx.cue("Even someone who recorded all of it");
    const tNo = ctx.cue("cannot realistically work the key out");
    const tInk = ctx.cue("work the key out");

    // the watcher's panel opens above node 2 and holds copies of the two recorded signals
    const WP = ctx.el("watcher_panel", { x: 800, y: 150, w: 400, h: 206, kind: "card", exit: "recede" });
    // @form watcher_panel: a card above node 2 with the two recorded signal chips, a dashed key slot and a question mark
    kit.card(WP.inner, 0, 0, 400, 206, { fill: "surface" });

    const chip = (name, x, col) => {
      const E = ctx.el(name, { x, y: 44, w: 56, h: 56, kind: "token", exit: "recede", parent: WP });
      // @form signal_chip: a recorded copy of one signal, slate for the browser's and amber for the server's
      svg("rect", { x: 0, y: 0, width: 56, height: 56, rx: 6, fill: c(col) }, E.inner);
      return E;
    };
    const chipS = chip("recorded_slate", 28, "accent3");
    const chipA = chip("recorded_amber", 104, "accent2");

    const SL = ctx.el("dashed_key_slot", { x: 196, y: 28, w: 180, h: 88, kind: "node", exit: "recede", parent: WP });
    // @form dashed_slot: the watcher's empty key slot, dashed because nothing is there
    svg("rect", { x: 1.5, y: 1.5, width: 177, height: 85, rx: 10, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8" }, SL.inner);

    const Q = ctx.el("question_mark", { x: 196, y: 28, w: 180, h: 88, kind: "value", exit: "recede", parent: WP });
    // @form question_mark: a large ink question mark where the key would be
    kit.text(Q.inner, "?", { role: "title", size: 64, x: 0, y: 0, w: 180, h: 88, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });

    const LB = ctx.el("watcher_label", { x: 24, y: 142, w: 352, h: 44, kind: "text", exit: "recede", parent: WP });
    kit.text(LB.inner, "Watcher: no key", { role: "label", size: 28, x: 0, y: 0, w: 352, h: 44, align: "left", valign: "middle", maxLines: 1, weight: 700, color: "ink" });

    m.reveal(WP, tOpen);
    m.pop(chipS, tOpen + 0.35);
    m.pop(chipA, tOpen + 0.7);
    m.reveal(SL, tOpen + 1.2);
    m.pop(Q, tNo);
    m.reveal(LB, tNo + 0.35);

    // the two ends keep their matching keys: blue settles to ink (new children on the held keys, same shape, same place)
    const KEY_D = "M24 2 a22 22 0 1 0 0.01 0 Z M24 16 a8 8 0 1 1 -0.01 0 Z M44 19 H124 V40 H114 V30 H106 V44 H96 V30 H44 Z";
    const settle = (E, t) => {
      // @form key_ink: the same key and its frame, in ink, laid over the blue ones at one end
      const g = svg("g", { opacity: 0 }, E.inner);
      svg("rect", { x: -12, y: -10, width: 148, height: 62, rx: 14, fill: "none", stroke: c("ink"), "stroke-width": 4 }, g);
      svg("path", { d: KEY_D, fill: c("ink"), "fill-rule": "evenodd" }, g);
      Loom.drive((e) => g.setAttribute("opacity", Math.max(0, Math.min(1, e)).toFixed(3)), t, 0.6, "enter");
    };
    settle(KB, tInk);
    settle(KSV, tInk + 0.12);
  },
});
