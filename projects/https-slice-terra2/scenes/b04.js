// @design certificate_return: a server proves its identity by sending a signed credential back along the open path
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: static certificate beside the browser, an authority close-up, and the chosen return journey along the path.
    const tAsk = ctx.cue("asks the server");
    const tIdentify = ctx.cue("identify itself");
    const tSend = ctx.cue("sends a certificate");
    const tSigned = ctx.cue("signed by an authority");

    const board = ctx.held("board");
    const packet = ctx.held("packet");
    const copy = ctx.held("copy");
    const watcherLabel = ctx.held("label_watcher");
    board.handle.setState("band_mid", tAsk);
    board.handle.highlight("server", 1, tIdentify);

    // @form request_arrow: the browser request crossing into the server
    const request = ctx.el("request_arrow", { x: 580, y: 420, w: 760, h: 40, kind: "connector", exit: "recede" });
    const requestArrow = kit.arrow(request.inner, 0, 20, 760, 20, { stroke: "line", sw: 5 });
    m.draw(requestArrow, tAsk, { dur: 0.72, headAt: 0.9, headDur: 0.18 });
    m.exit(request, tSigned + 0.16, "recede");

    m.exit(packet, tSend + 0.12, "recede");
    m.exit(copy, tSend + 0.12, "recede");

    // @form cert: the signed credential travelling from the server to the browser
    const cert = ctx.el("cert", { x: 1370, y: 370, w: 380, h: 280, kind: "card", exit: "recede" });
    const certHandle = Loom.lesson.cert_card(ctx, cert.inner, { domain: "accounts.example" });
    certHandle.setState("arriving", tSend);
    m.travel(cert, tSend + 0.04, { x: -1010, y: -70, dur: 1.05 });
    certHandle.setState("full", tSigned, 0.42);

    // @form label_cert: a pill naming the credential at its landing point
    Loom.treat.label(ctx, "label_cert", {
      x: 390, y: 252, text: "Certificate", to: [460, 300], tone: "accent2", role: "label", t: tSend + 0.65,
    });
    // @form label_ca: a pill pointing to the authority seal on the credential
    Loom.treat.label(ctx, "label_ca", {
      x: 330, y: 520, text: "Certificate authority", to: [700, 525], tone: "accent2", role: "label", t: tSigned + 0.08,
    });
  },
});
