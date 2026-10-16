// @design copy_on_path: a box beside the path duplicates a readable packet into its tray
Loom.scene("b02", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tRead = ctx.cue("readable text");
  const tAny = ctx.cue("Any device on the path");
  const tCopy = ctx.cue("copy it");
  const bd = ctx.held("board");
  const pk = ctx.held("packet");
  bd.handle.setState("router_highlight", tAny, 0.35);
  const C = ctx.el("copy", { x: 880, y: 552, w: 160, h: 96, kind: "token", exit: "none" });
  Loom.lesson.packet(ctx, C.inner, { state: "readable", w: 160 });
  m.reveal(C, tCopy - 0.3, { dy: 0, dur: 0.5 });
  m.travel(pk, tCopy, { x: 480, y: 0, dur: 1.0 });
  const flag = (name, x, y, w, txt, t) => {
    const F = ctx.el(name, { x, y, w, h: 56, kind: "label" });
    kit.rect(F.inner, 0, 0, w, 56, { fill: "accent2", r: 10, shadow: false });
    kit.text(F.inner, txt, { role: "label", x: 14, y: 6, w: w - 28, h: 44, align: "center", valign: "middle", weight: 700, color: "onAccent" });
    m.reveal(F, t, { dy: 0, dur: 0.5 });
  };
  flag("label_readable", 1100, 365, 280, "Readable text", tRead);
  flag("label_copy", 1075, 572, 130, "Copy", tCopy - 0.3);
} });
