// @design protected_channel_morph: a readable request enters a blue key lens and becomes slate noise inside a double-line route
/* Treatments: (A) a static before-and-after card, (B) a tube with a travelling request, (C) a key-lens transformation. Chosen C, because the transformation is the explanation. */
Loom.scene("b10", {
  build(ctx) {
    const { m } = ctx;
    const pill = (E, w, h, text, fill) => {
      const r = Loom.svg("rect", { x: 0, y: 0, width: w, height: h, rx: h / 2, fill: ctx.c(fill) }, E.inner);
      const tx = Loom.svg("text", { x: w / 2, y: h / 2 + 9, "font-size": 24, "font-weight": 700, fill: ctx.c("onAccent"), "text-anchor": "middle" }, E.inner);
      tx.textContent = text;
      return r;
    };
    const tHttps = ctx.cue("HTTPS");
    const tChannel = ctx.cue("protected channel");
    const tKey = ctx.cue("The key scrambles");
    const tForm = ctx.cue("the form");

    // @form board_continuity: the existing path board remains the fixed world while the camera pushes toward its browser end
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const trayValues = ctx.held("tray_values");

    // The previous recall badge returns to its compact resting size as the channel takes focus.
    cert.handle.setState("badge", tHttps, 0.35);
    m.exit(trayValues, tHttps + 0.15, "recede");
    board.handle.setState("tube", tHttps, 0.9);
    slots.handle.setState("ends_filled", tHttps, 0.2);

    // @form protected_channel_label: a pill names the double line only after it begins to draw
    const labelHttps = ctx.el("label_https", { x: 690, y: 370, w: 120, h: 46, kind: "label", exit: "recede" });
    pill(labelHttps, 120, 46, "HTTPS", "accent");
    m.reveal(labelHttps, tHttps + 0.45, { dy: 8, dur: 0.25 });
    board.handle.setState("tube", tChannel, 0.25);

    // @form browser_key_lens: the held browser key gains its lens exactly as it becomes the transformation point
    slots.handle.setState("lens_browser", tKey, 0.45);

    // @form form_packet: readable fields lift from the browser and travel through the key before becoming slate blocks
    const packet = ctx.el("packet", { x: 250, y: 366, w: 250, h: 120, kind: "token", exit: "recede" });
    const packetHandle = Loom.lesson.packet(ctx, packet.inner, { scale: 1.1 });
    packetHandle.setState("readable", tKey - 0.1);
    m.reveal(packet, tKey, { dy: 20, dur: 0.35 });
    m.travel(packet, tKey + 0.12, { x: 450, y: 54, dur: 1.35, scale: 1 });
    packetHandle.morph(1, ctx.at(0.72), 0.6);
    m.emphasis(packet, tForm + 0.1);

    // @form scrambled_packet_label: the outcome label lands under the six blocks after the readable rows have gone
    const labelScrambled = ctx.el("label_scrambled", { x: 690, y: 530, w: 300, h: 46, kind: "label", exit: "recede" });
    pill(labelScrambled, 300, 46, "Scrambled with the key", "accent3");
    m.reveal(labelScrambled, tForm + 0.3, { dy: 8, dur: 0.25 });
    void labelHttps;
    void labelScrambled;
  },
});
