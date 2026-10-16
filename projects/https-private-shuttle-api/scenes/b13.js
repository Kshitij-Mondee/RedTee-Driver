// @design wrong_name_check: a certificate arrives at a familiar board carrying another site's name, and the choices wait unmarked
// Treatments considered: (1) static board with three cards; (2) board builds, cert slides in from the server, options rise (chosen: the arriving wrong name is the scenario); (3) zoom on the cert only.
Loom.scene("b13", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tSite = ctx.cue("A new site's");
    const tNames = ctx.cue("names another domain");
    const tWhat = ctx.cue("What should the browser do");

    // @form path_board: the familiar board redrawn on the light band, strips read shop.example
    const B = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "recede" });
    const board = Loom.lesson.path_board(ctx, B.inner, { w: 1680, h: 640, startHidden: true, name: "shop.example" });
    B.ui = board;
    board.setState("band_light", ctx.start);
    const t0 = Math.max(ctx.start + 0.1, tSite - 0.1);
    board.show("browser", t0, 0.45);
    board.show("path", t0 + 0.2, 0.4);
    board.show("watcher", t0 + 0.35, 0.4);
    board.show("tray", t0 + 0.5, 0.4);
    board.show("server", t0 + 0.65, 0.45);

    // @form cert_card: the certificate slides from the server to the landing spot
    const CE = ctx.el("cert", { x: 1480, y: 290, w: 475, h: 350, kind: "token", exit: "recede" });
    const cert = Loom.lesson.cert_card(ctx, CE.inner, { scale: 1.25, full: true, domain: "other.example" });
    CE.setBox && CE.setBox({ w: cert.w || 475, h: cert.h || 350 });
    CE.ui = cert;
    cert.setState("full", tNames);
    cert.setDomain("other.example", ctx.start);
    m.reveal(CE, tNames);
    m.travel(CE, tNames + 0.1, { x: 640 - 1480, y: 0, scale: 1 }, { dur: 1.0 });

    // underline the domain row in blue once the card has landed
    const UL = ctx.el("cert_underline", { x: 0, y: 0, w: 475, h: 350, kind: "scenery", exit: "recede", parent: CE });
    CE.followers = [UL];
    const ul = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    ul.setAttribute("x", 30); ul.setAttribute("y", 137); ul.setAttribute("width", 232); ul.setAttribute("height", 6); ul.setAttribute("rx", 3);
    ul.setAttribute("fill", ctx.c("accent"));
    UL.inner.appendChild(ul);
    m.unmask ? m.unmask(UL, tNames + 1.3, { dir: "ltr" }) : m.reveal(UL, tNames + 1.3);

    // three neutral option cards
    const opts = [
      ["option_load", "Load it quietly", 300],
      ["option_warn", "Warn and stop", 760],
      ["option_plain", "Fall back to plain", 1220],
    ];
    opts.forEach(([name, text, x], i) => {
      const P = T.panel(ctx, name, { x, y: 770, w: 400, h: 130, t: tWhat + 0.25 * i });
      const cb = P.content || { x: 0, y: 0, w: 400, h: 130 };
      ctx.kit.text(P.inner, text, { role: "label", x: cb.x + 12, y: cb.y, w: cb.w - 24, h: cb.h, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
    });

    // slate pause bar fills through the pause
    const PB = ctx.el("pause_bar", { x: 300, y: 912, w: 1320, h: 12, kind: "scenery", exit: "recede" });
    const tr = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tr.setAttribute("x", 0); tr.setAttribute("y", 0); tr.setAttribute("width", 1320); tr.setAttribute("height", 12); tr.setAttribute("rx", 6);
    tr.setAttribute("fill", ctx.c("ink")); tr.setAttribute("opacity", 0.15);
    const fl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    fl.setAttribute("x", 0); fl.setAttribute("y", 0); fl.setAttribute("width", 0); fl.setAttribute("height", 12); fl.setAttribute("rx", 6);
    fl.setAttribute("fill", ctx.c("ink")); fl.setAttribute("opacity", 0.55);
    PB.inner.appendChild(tr); PB.inner.appendChild(fl);
    const tBar = Math.max(ctx.speechEnd, tWhat + 1.2);
    m.reveal(PB, tBar - 0.3);
    Loom.drive((e, raw) => { fl.setAttribute("width", 1320 * raw); }, tBar, ctx.end - tBar, "linear");
  },
});
