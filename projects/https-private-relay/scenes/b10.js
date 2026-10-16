// @design tube_morph: a readable card passes a lens and becomes scrambled blocks inside a doubled path
Loom.scene("b10", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tH = ctx.cue("HTTPS");
  const tE = ctx.cue("Encryption");
  const tS = ctx.cue("scrambles the form");
  const board = ctx.held("board");
  const cert = ctx.held("cert");
  m.exit(cert, ctx.start);
  const ks = ctx.held("key_slots");
  board.handle.setState("tube", tH, 0.6);
  const flag = (name, x, y, w, text, t) => {
    const F = ctx.el(name, { x, y, w, h: 44, kind: "label" });
    kit.rect(F.inner, 0, 0, w, 44, { fill: "accent2", r: 10, shadow: false });
    kit.text(F.inner, text, { role: "label", size: 26, weight: 700, color: "onAccent", x: 0, y: 0, w, h: 44, align: "center", valign: "middle" });
    m.pop(F, t);
  };
  flag("label_https", 830, 400, 140, "HTTPS", tH + 0.3);
  try { if (ks.handle && ks.handle.setState) ks.handle.setState("lens_active", tE, 0.4); } catch (e) {}
  flag("label_enc", 560, 390, 190, "Encryption", tE + 0.2);
  const P = ctx.el("packet", { x: 250, y: 420, w: 200, h: 120, kind: "card" });
  const ph = Loom.lesson.packet(ctx, P.inner, { state: "readable" });
  m.reveal(P, tS - 0.3);
  m.travel(P, tS, { x: 470, y: 0, dur: 1.4 });
  ph.morph(tS + 0.6, 0.9);
}});
