// @design certificate_return: a neutral request line gives way to one blue certificate travelling from the server to the browser
/* Treatments considered: (1) static certificate beside the browser with an arrow, (2) certificate travelling back across the board, (3) a close-up certificate. Chosen: (2), because its return journey makes the server response literal while preserving the shared board. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const tAsk = ctx.cue("asks the server");
    const tIdentify = ctx.cue("identify itself");
    const tSend = ctx.cue("sends a certificate");
    const tSigned = ctx.cue("signed by an authority");

    // The board and watcher label are shared with b03, never redrawn.
    const board = ctx.held("board");
    ctx.held("label_watcher");
    board.handle.setState("band_mid", ctx.start);
    board.handle.highlight("server", 1, tIdentify);
    // The arriving opaque certificate becomes the browser-side focal object, avoiding half-covered form words.
    board.handle.hide("browser", tSend + 0.15);

    // The readable request and its watcher copy leave before the identity exchange.
    m.exit(ctx.held("packet"), tAsk - 0.18, "recede");
    m.exit(ctx.held("copy"), tAsk - 0.18, "recede");

    // @form request_arrow: the browser request draws into the server before the certificate returns
    const request = ctx.el("request_arrow", { x: 570, y: 420, w: 850, h: 40, kind: "connector", exit: "recede" });
    const requestArrow = kit.arrow(request.inner, 0, 20, 850, 20, { stroke: "line", sw: 5 });
    m.draw(requestArrow, tAsk, { dur: 0.72, headAt: 0.9, headDur: 0.16 });
    Loom.tween(request.outer, { opacity: 1 }, { opacity: 0, duration: Loom.style.dur("exit") }, tSigned, { kind: "exit", name: "request_arrow" });

    // @form cert: the certificate card travels from the named server to the browser-side landing position
    const cert = ctx.el("cert", { x: 1430, y: 390, w: 380, h: 280, kind: "card", exit: "recede" });
    const certHandle = Loom.lesson.cert_card(ctx, cert.inner, { domain: "accounts.example" });
    cert.handle = certHandle;
    certHandle.setState("arriving", ctx.start);
    m.reveal(cert, tSend, { dy: 0, dur: 0.18 });
    m.travel(cert, tSend + 0.04, { x: -1070, y: -90, dur: 0.9 });
    certHandle.setState("full", tSigned);
    m.emphasis(cert, tSigned + 0.12);

    // @form label_cert: a direct label names the card after it has arrived
    const certLabel = ctx.el("label_cert", { x: 360, y: 246, w: 178, h: 44, kind: "bubble", exit: "recede" });
    kit.pill(certLabel.inner, 0, 0, 178, 44, { fill: "accent2" });
    kit.text(certLabel.inner, "Certificate", { role: "label", x: 20, y: 0, w: 138, h: 44, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 28 });
    m.reveal(certLabel, tSend + 0.72, { dy: 8 });

    // @form label_ca: an amber pill identifies the seal without covering certificate rows
    const authorityLabel = ctx.el("label_ca", { x: 746, y: 520, w: 270, h: 44, kind: "bubble", exit: "recede" });
    kit.pill(authorityLabel.inner, 0, 0, 270, 44, { fill: "accent2" });
    kit.text(authorityLabel.inner, "Certificate authority", { role: "label", x: 14, y: 0, w: 242, h: 44, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 28 });
    m.reveal(authorityLabel, tSigned + 0.2, { dy: 8 });
  },
});
