// @design identity_arrives: a request crosses to the far card, and a signed identity card travels back along the same path
// Treatments considered: (1) static cert card beside browser with labels only; (2) request arrow, then the cert slides back and the seal stamps (chosen: arrival makes "sends" literal); (3) zoom into the cert rows.
Loom.scene("b04", {
  build(ctx, props) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;

    // held from b03: the board (redrawn in the mid band, tray empty) and the Watcher label
    const board = ctx.held("board");
    const lw = ctx.held("label_watcher");
    board.handle.setState("band_mid", ctx.start, 0.8);

    const tAsks = ctx.cue("asks the server");
    const tIdent = ctx.cue("identify itself");
    const tSends = ctx.cue("sends a certificate");
    const tSigned = ctx.cue("signed by an authority");

    // 1. "asks the server": request arrow draws from browser to server, above the path
    const AE = ctx.el("request_arrow", { x: 590, y: 368, w: 740, h: 40, kind: "connector", exit: "recede" });
    // @form request_arrow: the request crossing to the server
    const arrow = ctx.kit.arrow(AE.inner, 0, 20, 740, 20, { stroke: "ink" });
    M.draw(arrow, tAsks, { dur: 1.3 });

    // 2. "identify itself": the server card outlines
    board.handle.highlight("server", 1, tIdent);

    // 3. "sends a certificate": the card emerges from the server and slides left to its landing spot
    const CX = 360, CY = 300, OFF = 1040;
    const CE = ctx.el("cert", { x: CX, y: CY, w: 380, h: 280, kind: "card", exit: "none" });
    // @form cert_card: the server's certificate, signed by an authority
    const cert = Loom.lesson.cert_card(ctx, CE.inner, {});
    cert.setState("arriving", ctx.start);
    M.travel(CE, ctx.start, { x: OFF, y: 0, scale: 1, dur: 0.01 });
    M.exit(lw, tSends - 0.15, "recede");
    M.reveal(CE, tSends);
    M.travel(CE, tSends + 0.15, { x: 0, y: 0, scale: 1, dur: 1.2 });
    board.handle.highlight("server", 0, tSends + 0.6);

    // @form label_cert: pill naming the card
    T.label(ctx, "label_cert", { x: CX + 190, y: 222, text: "Certificate", to: [CX + 190, CY], tone: "accent", role: "label", t: tSends + 1.2, as: "pill" });

    // 4. "signed by an authority": the seal stamps, its pill names the signer, the request arrow fades
    cert.setState("full", tSigned);
    // @form label_ca: pill naming the seal's owner
    T.label(ctx, "label_ca", { x: CX + 312, y: 772, text: "Certificate authority", to: [CX + 312, CY + 266], tone: "accent2", role: "label", t: tSigned + 0.25, as: "pill" });
    M.exit(AE, tSigned + 0.4, "recede");
  },
});
