// @design limits_beside_proof: slate limits set opposite the teal proofs, plus the form still readable at the server
Loom.scene("b16", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m || ctx.motion || Loom.motion;
  const tA = ctx.cue("owner is honest");
  const tB = ctx.cue("after it arrives");
  const bar = ctx.held("bar"), pl = ctx.held("padlock"), fl = ctx.held("flags_shows");
  const mk = (name, y, text, t) => {
    const f = ctx.el(name, { x: 1000, y, w: 760, h: 80, kind: "label" });
    kit.rect(f.inner, 0, 0, 760, 80, { fill: "accent3", r: 14, shadow: false });
    kit.text(f.inner, text, { role: "lead", size: 38, weight: 700, color: "onAccent", x: 0, y: 0, w: 760, h: 80, align: "center", valign: "middle" });
    m.reveal(f, t, { dx: 40 });
  };
  mk("flag_not_owner", 480, "Owner honest?", tA - 0.2);
  mk("flag_not_after", 580, "After it arrives", tB - 0.2);
  const inset = ctx.el("server_inset", { x: 1340, y: 700, w: 420, h: 200, kind: "card" });
  const S = Loom.lesson.path_board(ctx, inset.inner, { only: "server" });
  const P = ctx.el("server_packet", { x: 120, y: 58, w: 240, h: 132, kind: "token", parent: inset.inner });
  Loom.lesson.packet(ctx, P.inner, {scale: 1.5});
  m.reveal(inset, tB, { dy: 20 });
}});
