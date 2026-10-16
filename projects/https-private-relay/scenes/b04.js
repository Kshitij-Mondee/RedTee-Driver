// @design identity_arrives: a card travels from one end back to the other and gets vouched for by a seal
Loom.scene("b04", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tFirst = ctx.cue("First, the browser asks");
  const tAsk = ctx.cue("asks the server");
  const tSend = ctx.cue("It sends a certificate");
  const tAuth = ctx.cue("A certificate authority");
  const board = ctx.held("board");
  ["packet", "copy", "padlock", "label_padlock"].forEach((n) => {
    const H = ctx.held(n);
    try { m.exit(H, tFirst); } catch (e) {}
    try { Loom.tween(H.outer, { opacity: 1 }, { opacity: 0, duration: 0.3 }, tFirst, { kind: "exit", name: n }); } catch (e) {}
  });
  board.handle.setState("tray_empty", tFirst);
  const A = ctx.el("request_arrow", { x: 600, y: 350, w: 740, h: 30, kind: "connector" });
  kit.line(A.inner, 0, 15, 736, 15, { stroke: "ink", sw: 4 });
  kit.line(A.inner, 736, 15, 712, 3, { stroke: "ink", sw: 4 });
  kit.line(A.inner, 736, 15, 712, 27, { stroke: "ink", sw: 4 });
  m.unmask(A, tFirst + 0.3, { dur: 1.2 });
  const C = ctx.el("cert", { x: 1250, y: 300, w: 380, h: 280, kind: "card" });
  const h = Loom.lesson.cert_card(ctx, C.inner, { state: "arriving" });
  m.reveal(C, tAsk + 0.4, { dy: 0, dur: 0.3 });
  m.travel(C, tAsk + 0.6, { x: -890, y: 0, dur: 2.6 });
  h.setState("full", tAuth);
  m.exit(A, tAuth + 0.5);
  const flag = (name, txt, x, y, w, t) => {
    const F = ctx.el(name, { x, y, w, h: 56, kind: "label" });
    kit.rect(F.inner, 0, 0, w, 56, { fill: "accent2", r: 10, shadow: false });
    kit.text(F.inner, txt, { role: "label", size: 28, weight: 700, color: "onAccent", x: 0, y: 0, w, h: 56, align: "center", valign: "middle" });
    m.pop(F, t);
  };
  flag("label_cert", "Certificate", 390, 230, 220, tSend + 0.9);
  flag("label_ca", "Certificate authority", 524, 596, 292, tAuth + 0.5);
}});
