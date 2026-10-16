// @design shared_key_reveal: matching marks appear at both ends of a path and nowhere else
// Treatments considered: (1) static pill with leaders, (2) keys flying in from the tokens, (3) chosen: tokens dissolve, keys drop together, label arrives after.
Loom.scene("b08", {
  build(ctx, props) {
    const m = ctx.m, c = ctx.c, sv = Loom.svg;
    const tBoth = ctx.cue("Both ends");
    const tSame = ctx.cue("same key");
    const held = (n) => { try { return ctx.held(n) || null; } catch (e) { return null; } };
    const board = held("board");
    const keys = held("key_slots");
    const cert = held("cert");
    const wl = held("label_watcher");
    const ta = held("token_a");
    const tb = held("token_b");
    const tv = held("tray_values");

    // camera: pull back to the wide board shot (each held element, same station frame)
    [board, keys, cert, wl, ta, tb, tv].forEach((E) => {
      if (!E) return;
      void E;
    });

    // tokens dissolve into the end slots
    [ta, tb].forEach((E) => { if (E) m.exit(E, tBoth, "iris"); });

    // blue keys drop in together, ends only
    if (keys && keys.handle) keys.handle.setState("ends_filled", tSame, 0.6);

    // tray values go grey
    if (tv && tv.inner) {
      const veil = sv("rect", { x: 0, y: 0, width: tv.w, height: tv.h, rx: 12, fill: c("surface2"), opacity: 0 }, tv.inner);
      const st = { v: 0 };
      Loom.tween(st, { v: 0 }, { v: 1, duration: 0.5, ease: "none", onUpdate: () => veil.setAttribute("opacity", (0.7 * st.v).toFixed(2)) }, tSame + 0.2, { kind: "reveal", name: "tray_grey" });
    }

    // label: pill above the path centre, thin leaders to both keys (clear of the watcher box)
    const X0 = 600, Y0 = 290;
    const E = ctx.el("label_same", { x: X0, y: Y0, w: 720, h: 156, kind: "label", exit: "recede" });
    const g = E.inner;
    const lead = (d) => sv("path", { d: d, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const l1 = lead("M 260 30 L 40 30 L 40 144");
    const l2 = lead("M 460 30 L 680 30 L 680 144");
    // @form same_key_pill: one label tied to both matching keys
    const pill = sv("g", {}, g);
    sv("rect", { x: 260, y: 8 + 6, width: 200, height: 52, rx: 26, fill: c("shadow"), opacity: 0.1 }, pill);
    sv("rect", { x: 260, y: 4, width: 200, height: 52, rx: 26, fill: c("surface") }, pill);
    ctx.kit.text(pill, "Same key", { role: "label", x: 260, y: 4, w: 200, h: 52, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
    m.reveal(pill, tSame + 0.25);
    m.draw(l1, tSame + 0.45, { dur: 0.45 });
    m.draw(l2, tSame + 0.45, { dur: 0.45 });
  }
});
