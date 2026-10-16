// @design two_values_one_empty_slot: two values cross and are copied, the watcher's slot stays empty
Loom.scene("b07", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tEach = ctx.cue("Each side");
  const tSend = ctx.cue("sends a value across");
  const tCopy = ctx.cue("copies both");
  const tKey = ctx.cue("cannot find the key");
  const board = ctx.held("board");
  ctx.held("cert");
  if (board.outer && board.outer.setAttribute) board.outer.setAttribute("data-bleed", "0-9999");
  board.handle.setState("dark_band", tEach, 0.8);
  const KS = ctx.el("key_slots", { x: 600, y: 440, w: 720, h: 270, kind: "slot" });
  Loom.svg("rect", { x: 0, y: 0, width: 720, height: 270, fill: "none" }, KS.inner);
  const hw = ctx.held("slot_watcher").handle;
  const tok = (name, x, y) => {
    const E = ctx.el(name, { x, y, w: 112, h: 48, kind: "token" });
    Loom.lesson.path_board.valueToken(ctx, E.inner);
    return E;
  };
  const a = tok("token_a", 600 - 16, 392);
  const b = tok("token_b", 1320 - 16, 392);
  m.pop(a, tSend); m.pop(b, tSend);
  m.travel(a, tSend + 0.2, { x: 640, y: 0, dur: 1.2 });
  m.travel(b, tSend + 0.2, { x: -640, y: 0, dur: 1.2 });
  board.handle.setState("tray_values", tCopy);
  hw.setState("watcher_shake", tKey, 0.7);
  const F = ctx.el("label_watcher", { x: 1090, y: 574, w: 160, h: 44, kind: "label" });
  kit.rect(F.inner, 0, 0, 160, 44, { fill: "accent2", r: 10, shadow: false });
  kit.text(F.inner, "Watcher", { role: "label", size: 26, weight: 700, color: "onAccent", x: 0, y: 0, w: 160, h: 44, align: "center", valign: "middle" });
  m.pop(F, tKey - 0.4);
}});
