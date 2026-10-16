// @design added_line_on_held_board: one board gains a second line while the first dims
Loom.scene("b05", { build(ctx, props) {
  const kit = ctx.kit;
  const wall = ctx.el("wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  kit.rect(wall.inner, 0, 0, 1920, 840, { fill: "surface2", crisp: true });
  kit.rect(wall.inner, 0, 840, 1920, 240, { fill: "field2", crisp: true });
  kit.rect(wall.inner, -10, 832, 1940, 18, { fill: "surface", flat: true, sw: 4 });
  const be = ctx.el("board_frame", { x: 190, y: 64, w: 1540, h: 756, kind: "card", exit: "none" });
  kit.rect(be.inner, 0, 0, 1540, 756, { fill: "field2", r: 18, flat: true });
  const bb = ctx.el("board", { x: 210, y: 84, w: 1500, h: 716, kind: "card", exit: "none" });
  const B = Loom.lesson.build_board(ctx, bb.inner, {});
  B.setState("line1", ctx.start, { dur: 0.01 });
  const t0 = Math.max(ctx.start + 0.1, ctx.cue("what it cost the team"));
  B.dim(0, t0, 0.5);
  B.show(1, "text", ctx.cue("We lost your view"), 0.9);
  B.show(1, "icon", ctx.cue("before we decided"), 0.5);
  B.show(1, "label", ctx.cue("the effect"), 0.7);
} });
