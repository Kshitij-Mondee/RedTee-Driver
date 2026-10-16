// @design fade_and_stay: the vague label greys out and leaves while the specific sentence stays sharp
// Treatments: (1) static with underlines, (2) old line fades while sentence holds, underlines draw (chosen: change over time is the point), (3) swap.
Loom.scene("b18", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const S = ctx.held("specific_sentence");
  const O = ctx.held("old_line");
  const t1 = ctx.cue("Watch the old label fade");
  const t2 = ctx.cue("while the specific moment stays");
  const t3 = ctx.cue("Sam is named");
  const t4 = ctx.cue("The moment is named");
  const t5 = ctx.cue("There is no verdict on Dev");
  if (O) {
    Loom.tween(O.life || O.inner, { opacity: 1 }, { opacity: 0.0 }, t1, { dur: 1.6 });
  }
  if (S) { m.highlight && S.inner && Loom.tween(S.life || S.inner, { opacity: 1 }, { opacity: 1 }, t2, { dur: 0.5 }); }
  const U1 = ctx.el("sam_name_mark", { x: 560, y: 560, w: 200, h: 14, kind: "connector" });
  // @form underline: marks Sam
  const l1 = kit.line(U1.inner, 0, 7, 200, 7, { stroke: ctx.c("accent"), sw: 6 });
  m.draw(l1, t3, { dur: 0.6 });
  const U2 = ctx.el("moment_mark", { x: 560, y: 640, w: 380, h: 14, kind: "connector" });
  // @form underline: marks the moment
  const l2 = kit.line(U2.inner, 0, 7, 380, 7, { stroke: ctx.c("accent"), sw: 6 });
  m.draw(l2, t4, { dur: 0.6 });
  ctx.at(0.9);
} });
