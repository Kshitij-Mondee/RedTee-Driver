// @design same_place_event: one dashed place drawn round the objects, one event fills it and empties everything inside together
// Treatments considered: (1) static boundary with pill only; (2) boundary draws, wash rises, copies empty together, one cross (chosen: the event is the idea); (3) icons of fire and water (rejected: spec says none drawn).
Loom.scene("b07", { build(ctx, props) {
  const L = Loom.lesson, m = ctx.m;
  const S = ctx.start; // board as b06 leaves it
  const H = {}, B0 = {};
  ["laptop", "report_main", "ext_drive", "copy_a", "copy_b", "desk_line", "label_laptop", "label_drive", "rail"].forEach((n) => {
    const e = ctx.held(n);
    H[n] = e ? e.handle : null;
    B0[n] = e ? { x: e.x, y: e.y, w: e.w, h: e.h } : null;
  });

  // tile 2 settles from accent to ink
  if (H.rail) H.rail.setState(1, "lit", S + 0.3);

  // boundary round laptop, drive, desk line and their labels (their true boxes)
  const parts = ["laptop", "ext_drive", "desk_line", "label_laptop", "label_drive"].map((n) => B0[n]).filter(Boolean);
  const x0 = Math.min.apply(null, parts.map((b) => b.x)), y0 = Math.min.apply(null, parts.map((b) => b.y));
  const x1 = Math.max.apply(null, parts.map((b) => b.x + b.w)), y1 = Math.max.apply(null, parts.map((b) => b.y + b.h));
  const around = L.place_boundary.around({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, { pad: 24 });
  // @form same_place_boundary: dashed place drawn round the desk objects
  const B = ctx.el("boundary", { x: around.x, y: around.y, w: around.w, h: around.h, kind: "scenery", exit: "none" });
  const bh = L.place_boundary(ctx, B.inner, { w: around.dashW, h: around.dashH, text: "Same place" });
  const tDesk = ctx.cue("both sit on your desk");
  ctx.m.reveal(B, tDesk);

  // the event: the wash rises, every copy empties together
  const tEvent = ctx.cue("One fire, flood or theft");
  bh.setState("filled", tEvent);
  const tEmpty = tEvent + ctx.style.dur("enter") * 1.0;
  ["report_main", "copy_a", "copy_b"].forEach((n) => { if (H[n]) H[n].setState("empty", tEmpty); });

  // held labels darken to ink as the wash arrives, so they hold contrast
  ["label_laptop", "label_drive"].forEach((n, i) => {
    const e = ctx.held(n);
    if (!e || !e.inner) return;
    const nodes = e.inner.querySelectorAll ? e.inner.querySelectorAll("text") : [];
    const ink = ctx.c.ink;
    Loom.drive(function (ee, raw) {
      if (raw <= 0) return;
      for (let k = 0; k < nodes.length; k++) { nodes[k].setAttribute("fill", ink); nodes[k].style.fill = ink; }
    }, tEvent - 0.05, 0.1, "linear", { key: "b07_lbl_ink_" + i });
  });

  // one neg cross on the boundary
  const tTog = ctx.cue("takes them together");
  const M = ctx.el("mark_together", { x: around.x + around.w - 70, y: around.y + 26 - 44, w: 104, h: 104, kind: "token", exit: "recede" });
  // @form neg_cross: one failure mark on the shared place
  ctx.kit.mark(M.inner, "no", 52, 52, 88);
  m.pop(M, tTog);
} });
