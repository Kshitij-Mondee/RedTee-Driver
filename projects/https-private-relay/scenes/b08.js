// @design matching_keys_at_ends: identical blue keys drop into both end slots, the watcher's slot stays empty
Loom.scene("b08", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tSame = ctx.cue("same key");
  const tNot = ctx.cue("The watcher does not");
  const board = ctx.held("board"); ctx.held("cert");
  const KS = ctx.held("key_slots");
  const a = ctx.held("token_a"), b = ctx.held("token_b");
  m.exit(a, tSame - 0.3); m.exit(b, tSame - 0.3);
  const mk = (x, y, st) => {
    const g = Loom.svg("g", { transform: "translate(" + x + " " + y + ")" }, KS.inner);
    return Loom.lesson.key_slots(ctx, g, { state: "empty" });
  };
  const sb = mk(0, 0), ss = mk(640, 0), sw = mk(510, 190);
  sb.setState("browser_server_filled", tSame);
  ss.setState("browser_server_filled", tSame);
  board.handle.setState("tray_values_dim", tNot);
  sw.setState("pulse", tNot, 0.8);
  const F = ctx.el("label_same", { x: 800, y: 366, w: 320, h: 56, kind: "label" });
  kit.rect(F.inner, 0, 0, 320, 56, { fill: "accent2", r: 10, shadow: false });
  kit.text(F.inner, "Same key", { role: "label", size: 28, weight: 700, color: "onAccent", x: 0, y: 0, w: 320, h: 56, align: "center", valign: "middle" });
  m.pop(F, tSame + 0.2);
}});
