// @design returning_credential: a request travels one way and a signed card returns to its origin
// Treatments considered: static card with signalling; card travelling along the route; close-up exchange. Choose travelling card because its origin and destination explain the exchange.
Loom.scene("b04", {
  build(ctx) {
    const {kit, m} = ctx;
    const asks = ctx.cue("asks the server");
    const identify = ctx.cue("identify itself");
    const sends = ctx.cue("sends a certificate");
    const signed = ctx.cue("signed by an authority");
    const board = ctx.held("board");
    const watcherLabel = ctx.held("label_watcher");
    m.travel(watcherLabel, ctx.start, {x:200,y:130,dur:ctx.style.dur("move")});
    const packet = ctx.held("packet");
    const copy = ctx.held("copy");
    m.exit(packet, ctx.start, "recede");
    m.exit(copy, ctx.start, "recede");
    board.handle.setState("idle", ctx.start);
    board.handle.setState("band_mid", ctx.start, ctx.style.dur("draw"));
    board.handle.highlight("server", 1, identify);
    board.handle.highlight("server", 0, sends);
    // @form request_line: the browser requests an identity before a card is returned
    const request = ctx.el("request_arrow", {x:580,y:420,w:760,h:40,kind:"connector",exit:"recede"});
    const arrow = kit.arrow(request.inner, 0,20,760,20,{stroke:"line"});
    m.draw(arrow, asks, {dur:ctx.style.dur("draw")});
    m.exit(request, signed, "recede");
    // @form returning_card: the neutral credential emerges from the far end and returns to the requester
    const cert = ctx.el("cert", {x:1340,y:120,w:380,h:290,kind:"card",exit:"none"});
    cert.handle = Loom.lesson.cert_card(ctx, cert.inner, {scale:1});
    cert.handle.setState("arriving", sends);
    m.reveal(cert, sends, {dy:0,dur:ctx.style.dur("enter")});
    m.travel(cert, sends, {x:-740,y:0,dur:ctx.style.dur("draw")});
    cert.handle.setState("full", signed, ctx.style.dur("move"));
    // @form credential_label: name the arriving object only after it appears
    kit.fit("Certificate",{role:"label",w:300,h:60,maxLines:1,weight:700});
    Loom.treat.label(ctx,"label_cert",{x:1020,y:170,text:"Certificate",to:[980,150],as:"pill",tone:"accent",role:"label",t:sends+ctx.style.dur("draw")});
    // @form signer_label: a nearby term points to the stamped seal
    kit.fit("Certificate authority",{role:"label",w:360,h:60,maxLines:1,weight:700});
    Loom.treat.label(ctx,"label_ca",{x:1100,y:345,text:"Certificate authority",to:[912,369],as:"pill",tone:"muted",role:"label",t:signed});
  }
});
