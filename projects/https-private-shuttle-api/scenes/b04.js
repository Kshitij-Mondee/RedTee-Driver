// @design identity_arrives: a question runs out to the far end and the answer, an official object, travels back and settles mid-path
// Treatments considered: (1) static board with a cert icon and labels; (2) request arrow out, cert slides back and is stamped (chosen: the exchange is the point); (3) zoom on the server only.
Loom.scene("b04", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tAsks = ctx.cue("asks the server");
    const tIdent = ctx.cue("identify itself");
    const tSends = ctx.cue("sends a certificate");
    const tSigned = ctx.cue("signed by an authority");

    // held: the board and the watcher label carry on
    const board = ctx.held("board");
    ctx.held("label_watcher");
    (board.outer || board.el || board).setAttribute("data-bleed", ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2));

    // the b03 leavers go out together at the join
    const tOut = ctx.start + 0.05;
    ["packet", "copy", "route", "padlock", "label_padlock"].forEach((n) => {
      let e = null;
      try { e = ctx.held(n); } catch (err) { e = null; }
      if (e) {
        m.exit(e, tOut, "recede");
        if (e.lead) m.exit(e.lead, tOut, "recede");
      }
    });

    // the backing deepens to the mid band
    board.ui && board.ui.setState("band_mid", ctx.start + 0.2);

    // @form request_arrow: the question runs from the browser to the server
    const RA = ctx.el("request_arrow", { x: 600, y: 410, w: 740, h: 60, kind: "connector", exit: "recede" });
    kit.arrow(RA.inner, 0, 30, 730, 30, { stroke: ctx.c("ink") });
    m.draw(RA, tAsks, { dur: 1.2 });

    // the server card is addressed
    board.ui && board.ui.highlight("server", 1, tIdent);

    // @form cert_card: the server's certificate, emerges from the server and slides back mid-path
    const SC = 1.25, CW = 380 * SC, CH = 280 * SC;
    const CE = ctx.el("cert", { x: 640, y: 290, w: CW, h: CH, kind: "token", exit: "recede" });
    const cert = Loom.lesson.cert_card(ctx, CE.inner, { scale: SC });
    CE.ui = cert;
    cert.setState("arriving", ctx.start);
    // start small at the server, then slide left to the landing
    m.travel(CE, ctx.start, { x: 830, y: 40, scale: 0.6 }, { dur: 0.01 });
    m.reveal(CE, tSends);
    m.travel(CE, tSends + 0.1, { x: 0, y: 0, scale: 1 }, { dur: 1.1 });
    T.label(ctx, "label_cert", { x: 877, y: 240, text: "Certificate", to: [877, 290], t: tSends + 1.2 });
    m.exit(RA, tSends + 0.3, "recede");
    // the cert now covers the watcher: its tag would peek out from behind the card, so it leaves with the cert's arrival
    const LW = ctx.held("label_watcher");
    m.exit(LW, tSends + 0.2, "recede");
    if (LW.lead) m.exit(LW.lead, tSends + 0.2, "recede");

    // the seal stamps on the signature words
    cert.setState("full", tSigned);
    T.label(ctx, "label_ca", { x: 905, y: 715, text: "Certificate authority", to: [1026, 640], t: tSigned + 0.5 });
  },
});
