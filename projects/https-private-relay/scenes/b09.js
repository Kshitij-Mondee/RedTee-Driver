// @design recall_tie: a badge re-lights its three ticks while a line ties it to the key
Loom.scene("b09", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tKey = ctx.cue("The key counts");
  const tChecks = ctx.cue("all three checks");
  const tPass = ctx.cue("pass");
  ctx.held("board");
  const cert = ctx.held("cert");
  ctx.held("key_slots");
  cert.handle.setState("badge_relit", tChecks, 1.8);
  const F = ctx.el("label_checks", { x: 134, y: 38, w: 190, h: 44, kind: "label", parent: cert.inner });
  kit.rect(F.inner, 0, 0, 190, 44, { fill: "accent2", r: 10, shadow: false });
  kit.text(F.inner, "Three checks", { role: "label", size: 24, weight: 700, color: "onAccent", x: 0, y: 0, w: 190, h: 44, align: "center", valign: "middle" });
  m.pop(F, tChecks + 0.2);
}});
