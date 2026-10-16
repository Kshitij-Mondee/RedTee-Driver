// @design payoff_same_journey: the opening board returns, the same packet now crosses scrambled and the lock shuts
Loom.scene("b18", { build(ctx, props) {
  const m = ctx.m;
  const tBack = ctx.cue("Back to the form");
  const tData = ctx.cue("same data");
  const tWatch = ctx.cue("same watcher");
  const tNoise = ctx.cue("scrambled noise");
  const tLock = ctx.cue("padlock closes");

  const B = ctx.el("board", { x: 120, y: 160, w: 1680, h: 640, kind: "scenery", exit: "none" });
  const board = Loom.lesson.path_board(ctx, B.inner, { state: "idle" });
  board.setState(["tray_empty", "watcher_closed"], 0.01, 0.02);
  m.reveal(B, ctx.start + 0.05, { dy: 12, dur: 0.6 });
  board.setState("watcher_open", tWatch, 0.5);
  board.setState("submit_pressed", tData, 0.2);
  board.setState("submit_released", tData + 0.3, 0.25);
  board.setState("tray_noise", tNoise + 1.2, 0.5);

  const mkSlot = (name, x) => {
    const S = ctx.el(name, { x, y: 440, w: 80, h: 80, kind: "token", exit: "none" });
    const k = Loom.lesson.key_slots(ctx, S.inner, { state: "browser_server_filled" });
    m.reveal(S, ctx.start + 0.3, { dy: 0, dur: 0.5 });
    return k;
  };
  const kb = mkSlot("key_browser", 600);
  const ks = mkSlot("key_server", 1250);
  kb.setState("lens_active", tData + 1.0);
  kb.setState("lens_off", tNoise + 0.6);

  const L = ctx.el("padlock", { x: 910, y: 200, w: 100, h: 130, kind: "token", exit: "none" });
  const lock = Loom.lesson.padlock(ctx, L.inner, { state: "open" });
  m.reveal(L, ctx.start + 0.4, { dy: 0, dur: 0.5 });
  lock.setState("closed", tLock);
  lock.pulse(tLock + 0.5, 0.6);

  const P = ctx.el("packet", { x: 380, y: 310, w: 200, h: 120, kind: "token", exit: "none" });
  const pk = Loom.lesson.packet(ctx, P.inner, { state: "readable" });
  m.reveal(P, tData + 0.3, { dy: 0, dur: 0.3 });
  pk.morph(tData + 1.2, 0.9);
  m.travel(P, tData + 0.6, { x: 640, y: 0, dur: 3.6 });

  const F = ctx.el("label_scrambled", { x: 1010, y: 540, w: 220, h: 48, kind: "label", exit: "none" });
  ctx.kit.rect(F.inner, 0, 0, 220, 48, { fill: "accent2", r: 10, shadow: false });
  ctx.kit.text(F.inner, "Scrambled", { role: "label", x: 0, y: 0, w: 220, h: 48, align: "center", valign: "middle", weight: 700, color: "onAccent" });
  m.reveal(F, tNoise + 0.6, { dy: 8, dur: 0.5 });
} });
