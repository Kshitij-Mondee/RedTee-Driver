// @design proof_handed_over: a small card leaves the sender, crosses the route and is lifted by the receiver into a checking panel
/* Three treatments considered: (1) static panel with the certificate already large and an arrow from the server
 * (signalled but inert); (2) card fades in at the panel (loses the direction of the handover);
 * (3) chosen: a small card slides out of the server, travels the path to the browser side, then lifts into the
 * check panel and grows (the direction IS the meaning).
 * Cues: Move one -> tile 1 named; presents a certificate -> card appears and travels; proof of who -> panel opens,
 * card lifts and grows. */
Loom.scene("b05", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const tMove = ctx.cue("Move one");
    const tPres = ctx.cue("presents a certificate");
    const tProof = ctx.cue("proof of who");

    // held system from b01 to b04: nothing redrawn
    ctx.held("browser");
    ctx.held("server");
    ctx.held("path");
    ctx.held("watcher");
    const hPk = ctx.held("packet");
    const hTw = ctx.held("tls_wrap");

    // tile 1 is already named by b04 and stays so: held
    ctx.held("step_bar");

    // the wrapped packet steps aside as the certificate arrives: the check panel opens over its place, so it must not be clipped
    m.exit(hPk, tPres + 0.1, "recede");
    m.exit(hTw, tPres + 0.1, "recede");

    // the checking panel space in the centre, under the card
    const PN = ctx.el("check_panel", { x: 660, y: 150, w: 640, h: 490, kind: "card", exit: "none" });
    // @form check_panel: the browser's checking panel, an empty tray the card is lifted into
    Loom.svg("rect", { x: 1, y: 1, width: 638, height: 488, rx: 20, fill: ctx.c("field"), stroke: ctx.c("line"), "stroke-width": 2 }, PN.inner);
    m.reveal(PN, tProof - 0.25, { dy: 0 });

    // the certificate card, small at the server, then large in the panel
    const EC = ctx.el("cert", { x: 96, y: 150, w: 1728, h: 500, kind: "card", exit: "none" });
    // @form certificate_card: the certificate with login.example.com and three unmarked rows
    const cert = Loom.lesson.certificate_card(ctx, EC.inner, { origin: [96, 150] });
    // an opaque backing inside the card group, so the card does not show the path through it
    const bk = Loom.svg("rect", { x: 0, y: 0, width: 620, height: 420, rx: 20, fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 2 }, cert.card);
    cert.card.insertBefore(bk, cert.card.firstChild);
    const START = { x: 1500, y: 430 }, MID = { x: 930, y: 430 };
    cert.setState("small", ctx.start);
    cert.place(START, ctx.start);
    m.reveal(EC, tPres - 0.1, { dy: 0 });
    cert.travel(START, MID, tPres + 0.15, tProof - 0.35);
    cert.setState("in_panel", tProof);
    Loom.sfx("card", tPres + 0.15);

    // the word for the panel, the one accent
    const LB = ctx.el("cert_label", { x: 660, y: 100, w: 400, h: 44, kind: "text", exit: "recede" });
    // @form panel_label: the name of what is in the panel
    kit.text(LB.inner, "Certificate", { role: "label", size: 32, x: 0, y: 0, w: 400, h: 44, valign: "middle", maxLines: 1, weight: 700, color: "accent" });
    m.reveal(LB, tProof + 0.3, { dy: 0 });
  },
});
