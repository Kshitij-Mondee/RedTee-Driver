// @design empty_places: empty dashed places drawn before the thing that will fill them
Loom.scene("b06", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tNext = ctx.cue("Next");
  const tKey = ctx.cue("shared key");
  const tOpen = ctx.cue("never sent in the open");
  const board = ctx.held("board");
  board.handle.setState("idle", ctx.start);
  const cert = ctx.held("cert");
  cert.handle.setState("badge", tNext + 0.1, 0.8);
  m.travel(cert, tNext + 0.1, { x: 130 - 1250, y: 130 - 300, dur: 0.9 });
  const slot = (name, x, y, t) => {
    const E = ctx.el(name, { x, y, w: 80, h: 80, kind: "slot" });
    Loom.lesson.key_slots(ctx, E.inner, { state: "empty" });
    m.pop(E, t);
    return E;
  };
  slot("slot_browser", 600, 440, tKey);
  slot("slot_server", 1240, 440, tKey + 0.15);
  const F = ctx.el("label_key", { x: 540, y: 366, w: 200, h: 56, kind: "label" });
  kit.rect(F.inner, 0, 0, 200, 56, { fill: "accent2", r: 10, shadow: false });
  kit.text(F.inner, "Shared key", { role: "label", size: 28, weight: 700, color: "onAccent", x: 4, y: 0, w: 192, h: 56, align: "center", valign: "middle" });
  m.pop(F, tKey + 0.3);
  board.handle.setState("path_dim", tOpen);
  slot("slot_watcher", 1110, 630, tOpen + 0.4);
}});
