// @design certificate_checks: a focused certificate receives three sequential teal confirmation marks
// Treatments considered: (A) a static checklist, (B) three floating badges, (C) chosen, kit ticks on the certificate with nearby treated labels.
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    ctx.held("label_watcher");
    const tChecks = ctx.cue("The browser checks three things:");
    const tList = ctx.cue("signer trusted, name matches, in date.");

    // Continue the existing board with one close, readable camera move.
    Loom.cam.frame(board, { x: 120, y: 260, w: 1680, h: 640 }, ctx.start, 1.35, { margin: 0, cy: 470, maxScale: 1.08 });

    // The kit card stays the single source of its certificate rows and tick states.
    cert.handle.to("rowHL", 1, tChecks + 0.08, 0.48);
    cert.handle.setState("tick_signer", tList + 0.04);
    cert.handle.setState("tick_name", tList + 1.03);
    cert.handle.setState("tick_dates", tList + 2.02);

    // @form signer_trust_label: outcome label beside authority row
    const signer = T.label(ctx, "label_signer", { x: 770, y: 535, text: "Signer trusted", to: [720, 540], tone: "pos", role: "label", t: tList + 0.10 });
    // @form name_match_label: outcome label beside domain row
    const name = T.label(ctx, "label_name", { x: 770, y: 395, text: "Name matches", to: [720, 400], tone: "pos", role: "label", t: tList + 1.09 });
    // @form date_check_label: outcome label beside date row
    const dates = T.label(ctx, "label_date", { x: 770, y: 475, text: "In date", to: [720, 480], tone: "pos", role: "label", t: tList + 2.08 });

    // @form matching_domain_flash: paired outlines make the address and certificate domain visibly agree
    const browserMatch = ctx.el("browser_domain_match", { x: 150, y: 290, w: 400, h: 74, kind: "connector", exit: "recede" });
    kit.rect(browserMatch.inner, 0, 0, 400, 74, { fill: "none", r: 12, stroke: "pos", sw: 4, shadow: false });
    const certMatch = ctx.el("cert_domain_match", { x: 382, y: 382, w: 330, h: 48, kind: "connector", exit: "recede" });
    kit.rect(certMatch.inner, 0, 0, 330, 48, { fill: "none", r: 10, stroke: "pos", sw: 4, shadow: false });
    m.reveal(browserMatch, tList + 0.98, { dy: 0, dur: 0.22 });
    m.reveal(certMatch, tList + 1.03, { dy: 0, dur: 0.22 });
    m.exit(browserMatch, tList + 1.70, "recede");
    m.exit(certMatch, tList + 1.70, "recede");

    // Labels are intentionally unkept, so b06 retires them while cert remains ticked.
    m.exit(signer, ctx.end - 0.04, "recede");
    m.exit(name, ctx.end - 0.04, "recede");
    m.exit(dates, ctx.end - 0.04, "recede");
  },
});
