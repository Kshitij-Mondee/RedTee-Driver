// @design server_key_reverse_morph: slate blocks pass the far blue key and resolve into the two readable request rows
Loom.scene("b12", {
  build(ctx) {
    // Treatments: A, a static before-and-after card. B, a server close-up with a key lens. C, both keys pulsing without a transformation. Chosen B because the reverse transformation makes the shared key visible.
    const { m } = ctx;
    const T = Loom.treat;
    const tServer = ctx.cue("The server unscrambles");
    const tSame = ctx.cue("same key.");

    // @form board_camera: the held board remains the stable world while the camera moves to the server end
    const board = ctx.held("board");
    void board;

    // @form certificate_continuity: the compact certificate remains as the already-established trust evidence
    const cert = ctx.held("cert");
    // @form key_slots_server_lens: the existing server key becomes the lens for the reverse transformation
    const keySlots = ctx.held("key_slots");
    keySlots.handle.setState("lens_server", tServer + 0.05, 0.42);

    // @form https_label_continuity: the held protected-channel label remains on its route
    const labelHttps = ctx.held("label_https");

    // @form watcher_noise_copy: the held noise remains in the watcher tray while its label retires
    const copy = ctx.held("copy");
    const labelNoise = ctx.held("label_noise");
    m.exit(labelNoise, tServer + 0.04, "recede");

    // @form server_packet_reverse_morph: the same slate packet passes the server key, moves into the inbox and returns to readable rows
    const packet = ctx.held("packet");
    packet.handle.setState("scrambled", ctx.start, 0.1);
    m.travel(packet, tServer + 0.08, { x: 340, y: 110, dur: 1.05, scale: 1 });
    packet.handle.morph(1, tServer + 0.42, 0.82);

    // @form label_unscrambled: an outcome pill attaches to the readable packet only after its rows return
    const labelUnscrambled = T.label(ctx, "label_unscrambled", { x: 1300, y: 720, text: "Unscrambled", to: [1570, 650], tone: "accent", role: "label", t: tSame + 0.04 });

    // @form matching_key_pulse: both already-filled end slots pulse together to show the one shared key
    keySlots.handle.pulse("both", tSame + 0.02);
    m.emphasis(packet, tSame + 0.08);
    void cert;
    void labelHttps;
    void copy;
    void labelUnscrambled;
  }
});
