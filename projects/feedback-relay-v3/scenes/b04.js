// @design replace_label_with_observation: a vague label shrinks into a ruled line, then the thing a camera would catch is written on it
// Treatments: (1) morph cloud to line then write on (chosen); (2) static board with signalling; (3) marker hand writes.
Loom.scene("b04", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.motion || Loom.motion;
  const wall = ctx.el("wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  kit.rect(wall.inner, 0, 0, 1920, 840, { fill: "surface2", crisp: true });
  const frame = ctx.el("board_frame", { x: 180, y: 60, w: 1560, h: 764, kind: "card", exit: "none" });
  kit.rect(frame.inner, 0, 0, 1560, 764, { fill: "field2", r: 18, sw: 5 });
  const be = ctx.el("board", { x: 210, y: 84, w: 1500, h: 716, kind: "card", exit: "none" });
  const board = Loom.lesson.build_board(ctx, be.inner, { variant: "board" });
  board.slots[0].clip.setAttribute("width", 0.01);
  board.slots[0].label.style.opacity = 0;
  board.slots[0].underline.setAttribute("transform", "translate(" + board.slots[0].ux + " 0) scale(0.001 1) translate(" + (-board.slots[0].ux) + " 0)");
  const ce = ctx.el("cloud", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "recede" });
  const cg = Loom.svg("g", { transform: "translate(1450 200)" }, ce.inner);
  const cloud = Loom.lesson.fuzzy_cloud(ctx, cg, {});
  const tbl = ctx.el("table_edge", { x: 0, y: 840, w: 1920, h: 240, kind: "scene", exit: "none" });
  kit.rect(tbl.inner, -20, 0, 1960, 50, { fill: "surface", flat: true });
  kit.rect(tbl.inner, -20, 50, 1960, 200, { fill: "field2", flat: true });
  const t0 = ctx.start;
  cloud.setState("drop_in", t0 + 0.1);
  cloud.setState("hanging", t0 + 0.8, { dur: 4 });
  const r = board.slotRect(0);
  const tm = Math.max(t0 + 1.0, ctx.cue("drop the label") + 0.3);
  cloud.setState("morph_to_line", tm, { to: { x: r.x + 210 - 1450, y: r.y + r.h / 2 - 7 + 84 - 200, w: r.w, h: 14 }, dur: 0.9 });
  board.show(0, "icon", ctx.cue("what a camera would capture"), 0.5);
  board.show(0, "text", ctx.cue("one-word answers on vendors"), 1.0);
  board.show(0, "label", ctx.cue("observed behaviour"), 0.6);
} });
