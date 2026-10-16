// @design draft_waiting: an empty card on the viewer's own desk, a cursor waiting in the first slot
Loom.scene("b11", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m || ctx.motion;
  const tCard = ctx.cue("pick one comment you owe this week");
  const tSlots = ctx.cue("Rewrite it with the same three parts");
  const tChecks = ctx.cue("Then run the three checks");

  const BG = ctx.el("paper_ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
  kit.rect(BG.inner, 0, 0, 1920, 1080, { fill: "field", r: 0, crisp: true });

  const D = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
  Loom.scenery.desk(D.inner, 960, 900, 1700, { monitor: false });

  const C = ctx.el("comment_board", { x: 160, y: 150, w: 1280, h: 600, kind: "card" });
  const board = Loom.lesson.comment_board(ctx, C.inner, { state: "draft", cursorTone: "accent", w: 1600 * 0.8 });
  board.cursor.setAttribute("opacity", 0);
  m.drop(C, tCard, { dy: -300 });
  board.blink(tSlots + 0.3, tSlots + 8);

  const S = ctx.el("part_stamps", { x: 360, y: 510, w: 1000, h: 70, kind: "labels" });
  ["Observed action", "Effect", "Next step"].forEach((s, i) => {
    kit.rect(S.inner, 16 + i * 320, 0, 240, 64, { fill: "surface", r: 8, flat: true, stroke: "muted" });
    kit.text(S.inner, s, { role: "label", x: 32 + i * 320, y: 8, w: 208, h: 48, maxLines: 1, align: "center", valign: "middle", color: "muted" });
  });
  m.reveal(S, tSlots);

  const lab = ctx.el("three_parts_label", { x: 360, y: 790, w: 400, h: 60, kind: "text" });
  kit.text(lab.inner, "Three parts", { role: "label", x: 0, y: 0, w: 400, h: 60, color: "ink" });
  m.reveal(lab, tSlots + 0.2);

  const K = ctx.el("faint_checklist", { x: 1480, y: 300, w: 340, h: 300, kind: "card" });
  kit.rect(K.inner, 0, 0, 340, 300, { fill: "surface", r: 10 });
  kit.text(K.inner, "Three checks", { role: "label", x: 20, y: 10, w: 300, h: 60, color: "muted" });
  for (let i = 0; i < 3; i++) kit.rect(K.inner, 30, 100 + i * 64, 40, 40, { fill: "field2", r: 6, stroke: "muted" });
  m.reveal(K, tChecks);
  Loom.set(K.outer || K.inner, { opacity: 0.6 }, tChecks + 0.6);
} });
