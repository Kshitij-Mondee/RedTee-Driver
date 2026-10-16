// @design padlock_defined_by_labels: an object that carries its own meaning flags
Loom.scene("b15", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m || ctx.motion || Loom.motion;
  const tA = ctx.cue("The padlock means");
  const tB = ctx.cue("encrypted");
  const tC = ctx.cue("certificate matched");
  const bar = ctx.el("bar", { x: 160, y: 300, w: 1600, h: 120, kind: "card" });
  const AB = Loom.lesson.address_bar(ctx, bar.inner, {});
  m.reveal(bar, ctx.start + 0.1, { dy: 12 });
  AB.padlock.pulse(tA, 0.8);
  const pl = ctx.el("padlock", { x: 190, y: 305, w: 80, h: 110, kind: "mark" });
  kit.rect(pl.inner, 0, 0, 80, 110, { fill: "none", r: 16, shadow: false, stroke: "accent", sw: 4 });
  pl.inner.setAttribute("opacity", 0);
  m.reveal(pl, tA, { dy: 0 });
  const flags = ctx.el("flags_shows", { x: 160, y: 440, w: 600, h: 220, kind: "group" });
  const mkFlag = (name, y, text, t) => {
    const f = ctx.el(name, { x: 0, y, w: 600, h: 80, kind: "label", parent: flags.inner });
    kit.line(f.inner, 70, -40, 70, 0, { stroke: "accent4", sw: 4 });
    kit.rect(f.inner, 0, 0, 600, 80, { fill: "accent4", r: 14, shadow: false });
    kit.text(f.inner, text, { role: "lead", size: 38, weight: 700, color: "onAccent", x: 0, y: 0, w: 600, h: 80, align: "center", valign: "middle" });
    m.reveal(f, t, { dx: -40 });
  };
  mkFlag("flag_encrypted", 40, "Encrypted", tB);
  mkFlag("flag_matched", 140, "Certificate matched", tC);
  AB.setState("name_underline", tC + 0.3);
}});
