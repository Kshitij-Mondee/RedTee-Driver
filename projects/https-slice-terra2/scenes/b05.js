// @design certificate_check_sequence: three outcome marks progress across one verified record
Loom.scene("b05", {
  build(ctx) {
    // Treatment options: static certificate with all marks, sequential row stamps, or a camera-led close check. Chosen: camera-led close check, because each spoken test earns one mark.
    const T = Loom.treat;
    const m = ctx.m;
    const tChecks = ctx.cue("The browser checks three things:");
    const tList = ctx.cue("signer trusted, name matches, in date.");
    const tSigner = tList + 0.08;
    const tName = tList + 1.10;
    const tDate = tList + 2.12;

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const watcherLabel = ctx.held("label_watcher");
    void watcherLabel;

    // @form board_camera: close framing brings the record and its check labels into one reading group
    Loom.cam.frame(board, { x: 200, y: 180, w: 880, h: 495 }, tChecks - 0.18, 1.25, { margin: 28, cy: 470, maxScale: 1.2 });

    // @form row_outlines: neutral row attention precedes the three outcomes
    cert.handle.to("rowHL", 1, tChecks, 0.42);
    cert.handle.setState("full", tChecks);

    // @form signer_check: authority row receives its teal outcome mark first
    cert.handle.setState("tick_signer", tSigner, 0.32);
    T.label(ctx, "label_signer", { x: 758, y: 523, text: "Signer trusted", to: [726, 532], tone: "pos", role: "label", t: tSigner + 0.12 });

    // @form name_check: matching domain is checked second in both browser and certificate
    cert.handle.setState("tick_name", tName, 0.32);
    board.handle.highlight("browser", 1, tName);
    board.handle.highlight("browser", 0, tName + 0.55);
    T.label(ctx, "label_name", { x: 758, y: 358, text: "Name matches", to: [726, 380], tone: "pos", role: "label", t: tName + 0.12 });

    // @form date_check: validity row completes the sequence and fills its kit bar
    cert.handle.setState("tick_dates", tDate, 0.32);
    T.label(ctx, "label_date", { x: 758, y: 468, text: "In date", to: [726, 482], tone: "pos", role: "label", t: tDate + 0.12 });

    // The held board, certificate and watcher label remain for b06.
    void m;
  },
});
