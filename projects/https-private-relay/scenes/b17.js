// @design read_then_verify: highlight a name letter by letter, then an empty warning slot, then a look-alike struck out
Loom.scene("b17", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m;
  const tBefore = ctx.cue("Before typing");
  const tName = ctx.cue("read the site name exactly");
  const tWarn = ctx.cue("no certificate warning");
  const tLook = ctx.cue("Look-alike names");
  ["flags_shows", "server_inset", "server_packet"].forEach((n) => { try { m.exit(ctx.held(n), ctx.start); } catch (e) {} });
  const bar = ctx.held("bar");
  bar.handle.setState("name_highlight", tName);
  bar.handle.setState("warning_slot_empty", tWarn);

  // @form tick_name: teal tick after the name
  const t1 = ctx.el("tick_name", { x: 880, y: 330, w: 60, h: 60, kind: "mark" });
  kit.mark(t1.inner, "yes", 30, 30, 56);
  m.pop(t1, tName + 2.0);
  // @form flag_name: label above the bar
  const f = ctx.el("flag_name", { x: 300, y: 225, w: 330, h: 56, kind: "label" });
  kit.rect(f.inner, 0, 0, 330, 56, { fill: "accent2", r: 10, shadow: false });
  kit.text(f.inner, "Exact site name", { role: "label", size: 28, weight: 700, color: "onAccent", x: 0, y: 0, w: 330, h: 56, align: "center", valign: "middle" });
  m.reveal(f, tName + 0.3, { dy: 8 });
  // @form tick_warning: teal tick by the empty slot
  const t2 = ctx.el("tick_warning", { x: 1230, y: 460, w: 60, h: 60, kind: "mark" });
  kit.mark(t2.inner, "yes", 30, 30, 56);
  m.pop(t2, tWarn + 0.9);
  // @form lookalike: ghost name struck through
  const L = ctx.el("lookalike", { x: 300, y: 570, w: 560, h: 70, kind: "label" });
  kit.text(L.inner, "acc0unts.example", { role: "lead", size: 48, weight: 700, color: "muted", x: 0, y: 0, w: 560, h: 70, valign: "middle" });
  const hot = ctx.el("lookalike_mark", { x: 300 + 3 * 28.8 - 2, y: 646, w: 30, h: 8, kind: "mark" });
  kit.rect(hot.inner, 0, 0, 30, 8, { fill: "neg", r: 6, shadow: false });
  const S = ctx.el("lookalike_strike", { x: 300, y: 603, w: 460, h: 8, kind: "connector" });
  kit.line(S.inner, 0, 4, 460, 4, { stroke: "neg", sw: 5 });
  m.reveal(L, tLook + 0.1, { dy: 8 });
  m.reveal(hot, tLook + 0.9, { dy: 0 });
  m.unmask(S, tLook + 1.8, { dur: 0.6 });
} });
