// @design return_trip: a scrambled row turns readable at the far end, then a reply makes the same trip back
Loom.scene("b12", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit, c = ctx.c;
  const tDec = ctx.cue("decrypts it");
  const tRep = ctx.cue("Replies");
  const tBoth = ctx.cue("both ways");
  const BD = ctx.held("board");
  if (BD.handle && BD.handle.setState) BD.handle.setState("tray_noise", ctx.start, 0.05);
  const KS = ctx.held("key_slots");
  ctx.held("copy");
  const pk = ctx.held("packet");
  m.travel(pk, ctx.start + 0.2, { x: 250, y: 0, dur: 1.6 });
  const lens = (cx, t, dur) => {
    const g = Loom.svg("g", { opacity: 0 }, KS.inner);
    Loom.svg("ellipse", { cx, cy: 40, rx: 30, ry: 68, fill: c("accent"), "fill-opacity": 0.16, stroke: c("accent"), "stroke-width": 4 }, g);
    Loom.drive((e) => g.setAttribute("opacity", Math.sin(Math.PI * e)), t, dur, "linear", { key: "lens_" + cx });
  };
  lens(680, ctx.start + 0.3, 1.4);
  lens(40, tBoth - 0.6, 1.4);
  const flag = (name, x, y, w, text, t) => {
    const F = ctx.el(name, { x, y, w, h: 44, kind: "label" });
    kit.rect(F.inner, 0, 0, w, 44, { fill: "accent2", r: 10, shadow: false });
    kit.text(F.inner, text, { role: "label", size: 26, weight: 700, color: "onAccent", x: 8, y: 0, w: w - 16, h: 44, align: "center", valign: "middle" });
    m.pop(F, t);
  };
  flag("label_decrypt", 1140, 372, 200, "Decrypt", tDec);
  const P2 = pk.handle;
  if (P2 && P2.unmorph) P2.unmorph(tDec + 0.2, 0.8);
  m.exit(pk, tRep - 0.1);
  const R = ctx.el("reply", { x: 1320, y: 420, w: 200, h: 120, kind: "card" });
  const rh = Loom.lesson.packet(ctx, R.inner, { state: "reply_readable" });
  m.reveal(R, tRep - 0.1);
  m.travel(R, tRep + 0.2, { x: -860, y: 0, dur: 2.4 });
  rh.setState("reply_scrambled", tRep + 0.3, 0.7);
  rh.setState("reply_readable", tBoth + 0.3, 0.7);
  const A = ctx.el("arrow_both", { x: 660, y: 384, w: 460, h: 24, kind: "connector" });
  Loom.svg("line", { x1: 22, y1: 12, x2: 438, y2: 12, stroke: c("line"), "stroke-width": 5, "stroke-linecap": "round" }, A.inner);
  Loom.svg("polygon", { points: "0,12 24,0 24,24", fill: c("line") }, A.inner);
  Loom.svg("polygon", { points: "460,12 436,0 436,24", fill: c("line") }, A.inner);
  m.reveal(A, tBoth);
  flag("label_both", 780, 326, 220, "Both ways", tBoth + 0.2);
}});
