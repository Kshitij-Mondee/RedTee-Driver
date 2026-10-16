// @design calendar_fill: the empty request slot fills with an action pinned to the next meeting on a wall calendar
/* Treatments: (A) static board with text (rejected), (B) text typed only (rejected: no time tie),
 * (C) CHOSEN: calendar slides in, marker drops on a date, action printed in the gap box. */
Loom.scene("b29", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const tCal = ctx.cue("So fill the gap");
    const tFill = ctx.cue("what to do instead");
    const tMark = ctx.cue("Next meeting");
    const tText = ctx.cue("let her finish before you respond");

    // wall calendar, right side
    const cx = 1220, cy = 170, cw = 560, ch = 560;
    const cal = ctx.el("wall_calendar", { x: cx, y: cy, w: cw, h: ch, kind: "scenery", exit: "recede" });
    kit.rect(cal.inner, 0, 0, cw, ch, { fill: "surface", r: 24 });
    kit.rect(cal.inner, 0, 0, cw, 90, { fill: "accent2", r: 24, shadow: false });
    kit.text(cal.inner, "Calendar", { role: "label", x: 24, y: 0, w: cw - 48, h: 90, maxLines: 1, valign: "middle", color: S.pickTokenOn("accent2"), weight: 800 });
    const gx = 30, gy = 120, cell = 100;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      kit.rect(cal.inner, gx + c * cell, gy + r * (cell + 10), cell - 10, cell, { fill: "surface2", r: 12, shadow: false });
    }
    m.settle(cal, tCal, { dx: 160 });

    // marker lands on a date cell (row 2, col 3)
    const mk = ctx.el("next_meeting_marker", { x: cx + gx + 3 * cell - 10, y: cy + gy + 2 * (cell + 10) - 10, w: 120, h: 120, kind: "token", exit: "recede" });
    kit.disc(mk.inner, 60, 60, 46, { fill: "accent" });
    kit.icon(mk.inner, "calendar-check", { x: 60, y: 60, size: 52, color: S.pickTokenOn("accent") });
    m.drop(mk, tMark);

    const lab = ctx.el("marker_label", { x: cx, y: cy + ch + 24, w: cw, h: 70, kind: "text", exit: "recede" });
    kit.text(lab.inner, "Next meeting", { role: "label", x: 0, y: 0, w: cw, h: 70, maxLines: 1, align: "center", valign: "middle", weight: 800 });
    m.reveal(lab, tMark + 0.3, { dy: 10 });

    // gap box fills with the action
    const bx = 160, by = 760 - 120, bw = 900, bh = 150;
    const box = ctx.el("gap_fill", { x: bx, y: by, w: bw, h: bh, kind: "card", exit: "recede" });
    kit.rect(box.inner, 0, 0, bw, bh, { fill: "surface", r: 24 });
    m.unmask(box, tFill, { dir: "ltr" });
    const at = ctx.el("action_text", { x: bx + 30, y: by, w: bw - 60, h: bh, kind: "text", exit: "wipe" });
    const t = kit.text(at.inner, "Let her finish", { role: "title", x: 0, y: 0, w: bw - 60, h: bh, maxLines: 1, valign: "middle", weight: 800, color: "accent" });
    m.unmask(at, tText, { dir: "ltr" });
  },
});
