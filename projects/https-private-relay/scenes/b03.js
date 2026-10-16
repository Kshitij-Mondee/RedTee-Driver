// @design promise_lock: an open lock appears over the junction where it will later close
Loom.scene("b03", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tReq = ctx.cue("Follow one request");
  const tLock = ctx.cue("the padlock");
  const bd = ctx.held("board");
  m.reveal(bd, ctx.start, { dy: 0, dur: 0.3 });
  bd.handle.setState("idle", ctx.start, 0.1);
  bd.handle.setState("router_highlight", tReq, 0.35);
  bd.handle.setState("router_normal", tLock - 0.3, 0.35);
  bd.handle.setState("tray_readable_soft", tLock, 0.5);
  const L = ctx.el("padlock", { x: 910, y: 200, w: 100, h: 130, kind: "token" });
  Loom.lesson.padlock(ctx, L.inner, { state: "open" });
  m.reveal(L, tLock, { dy: 10, dur: 0.6 });
  const F = ctx.el("label_padlock", { x: 1040, y: 236, w: 190, h: 56, kind: "label" });
  kit.rect(F.inner, 0, 0, 190, 56, { fill: "accent2", r: 10, shadow: false });
  kit.text(F.inner, "Padlock", { role: "label", x: 14, y: 6, w: 162, h: 44, align: "center", valign: "middle", weight: 700, color: "onAccent" });
  m.reveal(F, tLock + 0.4, { dy: 0, dur: 0.5 });
} });
