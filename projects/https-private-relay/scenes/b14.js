// @design failed_check_feedback: a card's red row lights one option
Loom.scene("b14", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m, c = ctx.c;
  const tWarn = ctx.cue("It warns you");
  const tId = ctx.cue("identity check");
  ["kicker", "question", "pause_ring"].forEach((n) => { let h = null; try { h = ctx.held(n); } catch (e) { h = null; } if (h) Loom.tween(h.outer, { opacity: 1 }, { opacity: 0, duration: 0.02 }, ctx.start, { kind: "exit", name: n }); });
  const bd = ctx.el("board", { x: 120, y: 160, w: 1680, h: 640, kind: "scenery" });
  const B = Loom.lesson.path_board(ctx, bd.inner, { name: "board" });
  const ce = ctx.el("cert", { x: 360, y: 300, w: 380, h: 280, kind: "card" });
  const C = Loom.lesson.cert_card(ctx, ce.inner, { state: "tick3" });
  // @form option_flag: one answer option as a flat pill
  const fw = ctx.el("flag_warn", { x: 780, y: 200, w: 440, h: 56, kind: "card" });
  kit.rect(fw.inner, 0, 0, 440, 56, { fill: "surface2", r: 12, shadow: false });
  kit.text(fw.inner, "Warn you", { role: "label", size: 28, weight: 700, color: "ink", x: 0, y: 0, w: 440, h: 56, align: "center", valign: "middle" });
  const ring = ctx.el("warn_ring", { x: -4, y: -4, w: 448, h: 64, kind: "mark", parent: fw.inner });
  kit.rect(ring.inner, 0, 0, 448, 64, { fill: "none", r: 14, stroke: "accent", sw: 5, shadow: false });
  const id = ctx.el("label_identity", { x: 470, y: 232, w: 300, h: 56, kind: "card" });
  kit.rect(id.inner, 0, 0, 300, 56, { fill: "accent2", r: 12, shadow: false });
  kit.text(id.inner, "Identity check", { role: "label", size: 28, weight: 700, color: "onAccent", x: 0, y: 0, w: 300, h: 56, align: "center", valign: "middle" });
  const R = (e, t) => Loom.tween(e.outer, { opacity: 0 }, { opacity: 1, duration: 0.4 }, t, { kind: "reveal", name: e.name, content: true });
  R(bd, ctx.start + 0.1);
  R(fw, ctx.start + 0.3);
  R(ce, ctx.start + 0.2);
  C.setState("name_red", tWarn, 0.45);
  B.setState("warning_strip", tWarn + 0.2);
  R(ring, tWarn + 0.3);
  R(id, tId);
} });
