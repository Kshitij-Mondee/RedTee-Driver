// @design three_checks_stamped: one object, three rows, a tick stamped beside each row as its check is named
// Treatments: (1) static card with three pills and ticks already on (no sequence); (2) a spotlight scrim that dims the board while rows outline, then ticks stamp one per phrase with pills at the right (chosen: the checks are sequential); (3) a checklist panel beside the cert (duplicates the object).
Loom.scene("b05", {
  build(ctx, props) {
    const c = ctx.c, m = ctx.m, kit = ctx.kit;
    const SV = (tag, a, p) => Loom.svg(tag, a, p);
    const board = ctx.held("board");
    let cert = ctx.held("cert");
    const lw = ctx.held("label_watcher");
    let ch;
    if (cert) ch = cert.handle;
    else {
      // TEMP test stand-in while b04 is unbuilt
      const TE = ctx.el("cert", { x: 360, y: 300, w: 380, h: 280, kind: "card", exit: "none" });
      ch = Loom.lesson.cert_card(ctx, TE.inner, { full: true });
      ch.setState("full", ctx.start - 1, 0.01);
    }

    const tRows = ctx.cue("checks three things");
    const tSigner = ctx.cue("signer trusted");
    const tName = ctx.cue("name matches");
    const tDate = ctx.cue("in date");

    // cert sits at x360 y300 (380x280); rows (local) domain 62, dates 166, signer 218
    const CX = 360, CY = 300;
    const rowY = (local) => CY + local + 23;

    // veil: dims the board around the cert so the pills read; hole over the cert
    const veil = ctx.el("veil", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const hole = "M356 296 H744 V596 H356 Z";
    SV("path", { d: "M0 0 H1920 V1080 H0 Z " + hole, "fill-rule": "evenodd", fill: c("field2"), opacity: 0.82 }, veil.inner);
    // the push crops the board's left edge on purpose: the veil dims it, and it is declared a bleed
    [board.inner, board.outer, board.life].forEach((n) => { if (n && n.setAttribute) n.setAttribute("data-bleed", "1"); });
    if (board.inner && board.inner.querySelectorAll) board.inner.querySelectorAll("text").forEach((n) => n.setAttribute("data-bleed", "1"));
    m.reveal(veil, tRows, { dur: 0.5 });

    // cert row outlines
    ch.to("rowHL", 1, tRows, 0.5);

    // ticks
    ch.setState("tick_signer", tSigner, 0.35);
    ch.setState("tick_name", tName, 0.35);
    ch.setState("tick_dates", tDate, 0.35);

    // labels, right of each row
    const PX = 800;
    const defs = [
      ["label_signer", "Signer trusted", rowY(218), tSigner, 878],
      ["label_name", "Name matches", rowY(62), tName, 878],
      ["label_date", "In date", rowY(166), tDate, 840],
    ];
    defs.forEach((d) => {
      Loom.treat.label(ctx, d[0], { x: d[4], y: d[2], text: d[1], to: [CX + 382, d[2]], tone: "pos", role: "caption", as: "pill", t: d[3] + 0.1 });
    });

    // name flash: amber wash over the cert domain text and the address strip
    const fl = ctx.el("name_flash", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const r1 = SV("rect", { x: CX + 16, y: CY + 62 + 20, width: 232, height: 34, rx: 8, fill: c("accent2"), opacity: 0 }, fl.inner);
    const r2 = SV("rect", { x: 150, y: 280, width: 210, height: 36, rx: 8, fill: c("accent2"), opacity: 0 }, fl.inner);
    Loom.drive((e, p) => {
      const o = 0.38 * Math.sin(Math.PI * Math.min(1, p));
      r1.setAttribute("opacity", o.toFixed(3)); r2.setAttribute("opacity", o.toFixed(3));
    }, tName, 0.9, "linear", { key: "flash" });
  },
});
