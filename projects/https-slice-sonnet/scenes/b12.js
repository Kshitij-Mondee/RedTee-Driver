// @design reverse_transform_at_far_end: blocks pass a lit lens at the far end and turn back into the readable card inside the receiving box
// Treatments considered: (1) static before/after pair; (2) packet travels through the lit lens and morphs back (chosen: reversal is the point); (3) zoom into the key.
Loom.scene("b12", {
  build(ctx) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;
    const board = ctx.held("board");
    const keys = ctx.held("key_slots");
    const pk = ctx.held("packet");
    const hs = (h, s, t, d) => { if (h && h.handle) h.handle.setState(s, t, d); };

    // push crops the outer cards on purpose: declare the bleed
    const bi = (board.E || board).inner;
    if (bi && bi.querySelectorAll) bi.querySelectorAll("text").forEach((n) => n.setAttribute("data-bleed", "1"));

    const tUn = ctx.cue("The server unscrambles");
    const tSame = ctx.cue("same key");

    // the 'Noise' pill retires
    ["label_noise", "label_scrambled"].forEach((n) => { try { const e = ctx.held(n); if (e) M.exit(e, tUn, "recede"); } catch (err) {} });

    // server key becomes the lens
    hs(keys, "lens_server", tUn);

    // packet travels through the lens into the server's inbox and morphs back
    let PW = 200;
    try { PW = (pk.handle && pk.handle.w) ? pk.handle.w : 200; } catch (e) { PW = 200; }
    M.travel(pk, tUn + 0.1, { x: 1220, y: 164, scale: 1, dur: 1.5 });
    if (pk.handle) pk.handle.morph(0, tUn + 0.7, 0.9);

    // same key: both end keys pulse together once, pill names the result
    if (keys.handle) keys.handle.pulse("both", tSame);
    // @form label_unscrambled: pill naming the readable result
    T.label(ctx, "label_unscrambled", { x: 1570, y: 510, text: "Unscrambled", to: [1570, 500], tone: "pos", role: "caption", t: tSame + 0.15, as: "pill" });
  },
});
