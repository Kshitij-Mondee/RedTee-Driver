// @design same_copy_new_result: the same copy action as before, but the packet is scrambled, so the copy is unreadable noise
// Treatments considered: (1) static packet and noise caption; (2) packet slides past the box and a copy drops to the tray, then greys (chosen); (3) zoom on the tray only.
Loom.scene("b11", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tCopies = ctx.cue("The watcher copies");
    const tCannot = ctx.cue("cannot read them");

    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const mark = (e) => {
      if (!e) return;
      const t = e.outer || e.el || e;
      if (t && t.setAttribute) t.setAttribute("data-bleed", bleed);
      [e.mover, e.inner, e.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
      // the words sit in nested part groups: mark every descendant and every ancestor of the held node
      [t, e.mover, e.inner, e.life].forEach((g) => {
        if (!g || !g.querySelectorAll) return;
        g.querySelectorAll("g").forEach((n) => n.setAttribute("data-bleed", bleed));
        let p = g.parentNode;
        while (p && p.setAttribute && p.nodeName && p.nodeName.toLowerCase() !== "svg") { p.setAttribute("data-bleed", bleed); p = p.parentNode; }
      });
    };

    const B = ctx.held("board");
    const KS = ctx.held("key_slots");
    const KB = ctx.held("key_browser");
    const KV = ctx.held("key_server");
    const PE = ctx.held("packet");
    const LS = ctx.held("label_scrambled");
    const LW = ctx.held("label_watcher_b");
    const LH = ctx.held("label_https");
    const CE0 = ctx.held("cert");
    [B, KS, KB, KV, PE, LW, LH, CE0, LS].forEach(mark);

    // the words keep an earlier beat's own window on the text node: add this beat's window beside it
    { const sv0 = ctx.station.svg;
      if (sv0 && sv0.querySelectorAll) Array.from(sv0.querySelectorAll("text")).filter((x) => /accounts|Sunrise/.test(x.textContent)).forEach((x) => {
        const old = x.getAttribute("data-bleed");
        if (old && old.indexOf(bleed) < 0) { const mm = /^\s*([\d.]+)\s*-\s*([\d.]+)\s*$/.exec(old); x.setAttribute("data-bleed", mm ? Math.min(+mm[1], ctx.start).toFixed(2) + "-" + Math.max(+mm[2], ctx.end).toFixed(2) : bleed); }
        else if (!old) x.setAttribute("data-bleed", bleed);
      }); }
    // the old caption retires
    if (LS) {
      m.exit(LS, tCopies - 0.1, "recede");
      if (LS.lead) m.exit(LS.lead, tCopies - 0.1, "recede");
    }

    // the scrambled packet slides past the watcher box along y480 and stops short of the server key
    const pw = (PE && PE.ui && PE.ui.w) ? PE.ui.w : 300;
    const baseX = 350, baseY = 426;
    const endX = 775 - baseX + 0.45 * pw / 2 + 325;
    const endY = 480 - baseY + 0.45 * ((PE && PE.ui && PE.ui.h) ? PE.ui.h : 180) / 2;
    m.travel(PE, tCopies - 0.05, { x: endX, y: endY, scale: 0.55 }, { dur: 1.3 });

    // @form watcher_tray: the copy, made at the watcher box, drops into the tray as scrambled blocks
    const CS = 0.825, CW = 200 * CS, CH = 120 * CS;
    const CE = ctx.el("copy", { x: 960 - CW / 2, y: 480 - CH / 2, w: CW, h: CH, kind: "token", exit: "recede" });
    const cp = Loom.lesson.packet(ctx, CE.inner, { scale: CS });
    cp.setState("morphing", ctx.start, 0.01);
    cp.setState("scrambled", ctx.start + 0.05, 0.01);
    m.reveal(CE, tCopies + 0.6);
    m.travel(CE, tCopies + 0.7, { x: 0, y: 190, scale: 1 }, { dur: 0.6 });
    cp.setState("copy_noise", tCannot, 0.5);

    T.label(ctx, "label_noise", { x: 1160, y: 640, text: "Noise", to: [1130, 665], t: tCannot + 0.2 });
  },
});
