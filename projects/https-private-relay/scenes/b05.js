// @design three_checks: a card gets stamped with one outcome mark per row, each named as it lands
Loom.scene("b05", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const t1 = ctx.cue("The name matches");
  const t2 = ctx.cue("It has not expired");
  const t3 = ctx.cue("The issuer is trusted");
  const cert = ctx.held("cert");
  const board = ctx.held("board");
  cert.handle.setState("tick1", t1);
  cert.handle.setState("tick2", t2);
  cert.handle.setState("tick3", t3);
  const tag = (name, txt, y, t) => {
    const F = ctx.el(name, { x: 742, y, w: 178, h: 52, kind: "label" });
    kit.rect(F.inner, 0, 0, 178, 52, { fill: "pos", r: 10, shadow: false });
    kit.text(F.inner, txt, { role: "label", size: 24, weight: 700, color: "onAccent", x: 8, y: 0, w: 162, h: 52, align: "center", valign: "middle" });
    m.pop(F, t + 0.15);
  };
  tag("tick_name", "Name", 383, t1);
  tag("tick_date", "Not expired", 445, t2);
  tag("tick_issuer", "Trusted", 507, t3);
}});
