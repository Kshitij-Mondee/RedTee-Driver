// @design exposure_journey: a readable packet leaves a form and travels toward a watcher on an open path
Loom.scene("b01", { build(ctx, props) {
  const m = ctx.m;
  const tSub = ctx.cue("press Submit");
  const tW = ctx.cue("A watcher sits");
  const tPath = ctx.cue("on the path");
  const tSee = ctx.cue("What does it see");

  const B = ctx.el("board", { x: 120, y: 160, w: 1680, h: 640, kind: "scenery" });
  const board = Loom.lesson.path_board(ctx, B.inner, { state: "idle", name: "pb" });
  board.setState(["watcher_closed", "tray_empty"], 0.01, 0.02);

  [board.path, board.browser, board.server, board.router, board.tray].forEach((e, i) => m.reveal(e, ctx.start + 0.05 + i * 0.12, { dy: 0, dur: 0.4 }));
  m.reveal(B, ctx.start + 0.02, { dy: 0, dur: 0.4 });
  const P = ctx.el("packet", { x: 380, y: 420, w: 200, h: 120, kind: "token", exit: "none" });
  const pk = Loom.lesson.packet(ctx, P.inner, { state: "readable" });
  pk.setState("outlined", tSub + 0.3);
  m.reveal(P, tSub + 0.3, { dy: 0, dur: 0.3 });
  board.setState("submit_pressed", tSub, 0.2);
  board.setState("submit_released", tSub + 0.3, 0.25);
  m.travel(P, tPath, { x: 260, y: 0, dur: 1.4 });

  const F = ctx.el("label_watcher", { x: 850, y: 350, w: 220, h: 48, kind: "label", exit: "none" });
  ctx.kit.rect(F.inner, 0, 0, 220, 48, { fill: "accent2", r: 10, shadow: false });
  ctx.kit.text(F.inner, "Watcher", { role: "label", x: 0, y: 0, w: 220, h: 48, align: "center", valign: "middle", weight: 700, color: "onAccent" });
  m.reveal(F, tW + 0.3, { dy: 8, dur: 0.5 });
  board.setState("watcher_open", tW, 0.5);
  board.setState("watcher_look", tSee, 0.5);
} });
