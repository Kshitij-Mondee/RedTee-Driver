// @design copy_noise: the same copy action as before, now the tray gets unreadable blocks and a server name
Loom.scene("b11", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const tPass = ctx.cue("pass the watcher");
  const tNoise = ctx.cue("noise");
  const tServer = ctx.cue("which server");
  const board = ctx.held("board");
  ctx.held("key_slots");
  const pk = ctx.el("packet", { x: 720, y: 420, w: 200, h: 120, kind: "card", exit: "none" });
  Loom.lesson.packet(ctx, pk.inner, { state: "scrambled" });
  board.handle.setState("tray_empty", tPass + 0.3, 0.2);
  
  const C = ctx.el("copy", { x: 860, y: 610, w: 200, h: 120, kind: "token", exit: "none" });
  const ch = Loom.lesson.packet(ctx, C.inner, { state: "scrambled" });
  m.travel(pk, ctx.start, { x: 350, y: 0, dur: 3.2 });
  m.reveal(C, tPass + 0.5, { dy: 0, dur: 0.6 });
  ch.setState("greyed", tNoise, 0.4);
  const tag = (name, x, y, w, fill, txt, t, h = 48) => {
    const F = ctx.el(name, { x, y, w, h, kind: "label" });
    kit.rect(F.inner, 0, 0, w, h, { fill, r: 10, shadow: false });
    kit.text(F.inner, txt, { role: "label", size: 24, weight: 700, color: "onAccent", x: 4, y: 0, w: w - 8, h, align: "center", valign: "middle" });
    m.reveal(F, t, { dy: 0, dur: 0.4 });
  };
  tag("label_noise", 600, 534, 130, "accent2", "Noise", tNoise + 0.1);
  tag("server_tag", 584, 592, 232, "accent3", "Server:\naccounts.example", Math.min(tServer - 1.0, tNoise + 0.4), 76);
} });
