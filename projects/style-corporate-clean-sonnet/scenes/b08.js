// @design copy_leaves_the_place: one copy leaves the dashed place for a far home, and the event fills the place but stops at its edge
// Treatments: (1) static: cloud beside the boundary with a label; (2) copy travels out, cloud holds it, event replays and stops at the edge (chosen: leaving is the idea); (3) tile-led counter only.
Loom.scene("b08", { build(ctx, props) {
  const L = Loom.lesson, m = ctx.m, kit = ctx.kit;
  const S = ctx.start;
  const H = {};
  ["laptop", "report_main", "ext_drive", "copy_a", "copy_b", "boundary", "rail"].forEach((n) => {
    const e = ctx.held(n);
    H[n] = e || null;
  });
  const hh = (n) => (H[n] && H[n].handle) ? H[n].handle : null;

  const tOff = ctx.cue("keep a copy offsite");
  const tCloud = ctx.cue("The cloud");
  const tEv = ctx.cue("common way to do it");

  // rewind: the wash clears and the copies refill
  const bh = hh("boundary");
  if (bh) bh.setState("cleared", S + 0.05, { dur: 0.4 });
  ["report_main", "copy_a", "copy_b"].forEach((n) => { const h = hh(n); if (h) h.setState("restored", S + 0.1, { dur: 0.5 }); });

  // the cloud arrives far right, outside the boundary
  const cs = L.cloud.size({});
  const CX = 1460, CY = 330;
  // @form cloud_storage: the offsite home
  const CE = ctx.el("cloud", { x: CX, y: CY, w: cs.w, h: cs.h, kind: "instrument", exit: "recede" });
  const ch = L.cloud(ctx, CE.inner, {});
  m.settle(CE, tOff);
  if (ch.labelG) {
    ch.labelG.setAttribute("opacity", "0");
    Loom.drive((e, raw) => { ch.labelG.setAttribute("opacity", String(Math.max(0, Math.min(1, raw)))); }, tCloud, 0.4, "linear", { key: "b08_cloud_label" });
  }

  // copy_b leaves the drive and crosses the field into the cloud slot (drawn above the cloud)
  const cb = H.copy_b;
  if (cb) {
    if (cb.outer && cb.outer.parentNode && CE.outer) cb.outer.parentNode.insertBefore(CE.outer, cb.outer);
    const sl = ch.slot;
    const sc = sl.h / cb.h;
    const tx = CX + sl.x + (sl.w - cb.w * sc) / 2, ty = CY + sl.y;
    m.travel(cb, tOff + 0.4, { x: tx - cb.x, y: ty - cb.y, scale: sc, dur: 1.0 });
  }

  // the event replays: fills the place, stops at its edge; laptop and drive copies empty, cloud copy stays
  if (bh) bh.setState("filled", tEv);
  const tEmpty = tEv + ctx.style.dur("enter");
  ["report_main", "copy_a"].forEach((n) => { const h = hh(n); if (h) h.setState("empty", tEmpty); });

  // tile 1 named, with its label
  const rail = hh("rail");
  if (rail) {
    rail.setState(2, "named", tEv, { dur: 0.35 });
    const RS = 0.62, RX = Math.round((1920 - 912 * RS) / 2), RY = 745;
    const t2 = rail.tiles && rail.tiles[2];
    if (t2) {
      const tcx = RX + RS * t2.cx;
      const LE = ctx.el("label_offsite", { x: Math.round(tcx - 160), y: RY + Math.round(RS * 190) + 12, w: 320, h: 44, kind: "text", exit: "none" });
      kit.text(LE.inner, "1 offsite", { role: "label", size: 28, x: 0, y: 0, w: 320, h: 44, align: "center", valign: "middle", weight: 700, color: "accent2" });
      m.pop(LE, tEv + 0.2, { dur: 0.3 });
    }
  }
} });
