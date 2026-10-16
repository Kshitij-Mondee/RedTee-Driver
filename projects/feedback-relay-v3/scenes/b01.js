// @design warm_remark_fades: a good feeling arrives and drains while the vague cloud over him just hangs
Loom.scene("b01", { build(ctx, props) {
  const kit = ctx.kit;
  const SIZE = 640, Y = 620;
  // treatments: (1) static two-shot with signalling, (2) close on Dev then wide reveal, (3) chosen: two-shot, glow drains while cloud hangs
  const backEl = ctx.el("meeting_room_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const room = Loom.lesson.meeting_room(ctx, backEl.inner, { layer: "back" });
  const glowEl = ctx.el("dev_glow", { x: 1440 - 380, y: Y - 380, w: 760, h: 760, kind: "mark", exit: "recede" });
  const gg = Loom.svg("g", { opacity: 0 }, glowEl.inner);
  [[330, 0.18], [270, 0.22], [210, 0.3]].forEach(function (r) {
    Loom.svg("circle", { cx: 380, cy: 400, r: r[0], fill: ctx.c("accent3"), opacity: r[1] }, gg);
  });
  const mgr = ctx.el("manager", { x: 480 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const dev = ctx.el("dev", { x: 1440 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const mg = Loom.svg("g", {}, mgr.inner);
  const mE = kit.peep(mg, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  const mH = kit.peep(mg, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  kit.peep(dev.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  const frontEl = ctx.el("meeting_room_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const fr = Loom.lesson.meeting_room(ctx, frontEl.inner, { layer: "front" });
  const cloudEl = ctx.el("fuzzy_cloud", { x: 1500 - 260, y: 90, w: 520, h: 240, kind: "card", exit: "none" });
  const cloud = Loom.lesson.fuzzy_cloud(ctx, cloudEl.inner, {});

  const tGreat = ctx.cue("Great job");
  const tEng = ctx.cue("be a bit more engaged");
  const tGlow = ctx.cue("Dev glows");
  const tNone = ctx.cue("Nothing changes");
  fr.dropNameplate(Math.max(ctx.start + 0.15, ctx.cue("Say a manager")), 0.5);
  mH.style.visibility = "hidden";
  Loom.drive(function (e) {
    mg.setAttribute("transform", "rotate(" + (6 * e).toFixed(2) + " " + SIZE / 2 + " " + SIZE + ")");
  }, tGreat, 0.5, "move");
  Loom.tl.set(mE, { visibility: "hidden" }, tNone);
  Loom.tl.set(mH, { visibility: "visible" }, tNone);
  Loom.drive(function (e) {
    mg.setAttribute("transform", "rotate(" + (6 * (1 - e)).toFixed(2) + " " + SIZE / 2 + " " + SIZE + ")");
  }, tNone, 0.6, "move");
  cloud.setState("drop_in", tEng - 0.2, { dur: 0.7 });
  cloud.setState("hanging", tEng + 0.5, { dur: 8, amp: 2 });
  Loom.drive(function (e) {
    gg.style.opacity = (0.8 * e).toFixed(2);
    gg.setAttribute("transform", "translate(380 400) scale(" + (0.6 + 0.4 * e).toFixed(3) + ") translate(-380 -400)");
  }, tGlow, 0.8, "overshoot");
  Loom.drive(function (e) { if (e > 0) { gg.style.opacity = (0.8 * (1 - e)).toFixed(2); } }, tNone, 1.6, "move");
} });
