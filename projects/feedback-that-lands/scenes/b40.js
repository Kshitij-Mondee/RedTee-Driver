// @design card_on_desk_filled_in_steps_continued: the pen moves to the next ruled line and writes its prompt
/* b40 - line three: what did it cause. Holds the desk, the card and lines 1 and 2; the pen drops to line 3 and
 * writes "What did it cause?", its tip following the words. The three lines read as a column on the card.
 */
Loom.scene("b40", {
  build(ctx) {
    const { kit, m } = ctx;
    const meta = (name) => ({ kind: "travel", beat: ctx.beat.id, name, content: false });

    const HELD = ["desk", "window_light", "laptop", "mug", "notebook", "pcard", "pcard_frame", "pcard_rules", "num_1", "num_2", "num_3", "num_4", "header", "pen", "line_1", "line_2"];
    const H = {};
    HELD.forEach((n) => { H[n] = ctx.held(n); });
    const desk = H.desk, pen = H.pen;
    m.drift(H.window_light, ctx.start, ctx.end, { amp: 7, period: 6 });

    const CX = 620, CY = 96, rowY = [150, 280, 410, 540];
    const penTo = (tx, ty, t, dur, ease) => {
      const cur = pen.__pos || { x: 0, y: 0, s: 1 };
      const to = { x: tx - (pen.x + 8), y: ty - (pen.y + 128), s: 1 };
      Loom.tween(pen.mover, { x: cur.x, y: cur.y, scale: 1, transformOrigin: "0 0" }, { x: to.x, y: to.y, scale: 1, duration: dur, ease: ease || Loom.ease.editorial }, t, meta("pen"));
      pen.__pos = to;
      return t + dur;
    };

    // ---- line 3
    const x0 = CX + 134, y0 = CY + rowY[2];
    const tWrite = ctx.cue("what did it cause");
    const tMove = ctx.start + 0.02;
    // the camera follows the writing down the card (Loom.cam.frame, chained from b38)
    Loom.cam.frame(desk, { x: CX, y: CY + rowY[1] - 8, w: 900, h: 617 }, ctx.start + 0.05, 1.0, { margin: 0 });
    penTo(x0, y0 + 84, tMove, Math.max(0.6, tWrite - tMove - 0.1));

    // @form written_line_on_rule: a prompt typed on a ruled line while a pen tip follows it
    const line = ctx.el("line_3", { x: x0 - 4, y: y0 + 16, w: 720, h: 70, kind: "text", exit: "wipe", parent: desk.inner });
    desk.inner.insertBefore(line.outer, pen.outer);
    const tx = kit.text(line.inner, "What did it cause?", { role: "body", x: 0, y: 0, w: 720, h: 70, maxLines: 1, size: 36, color: "ink", valign: "middle" });
    m.reveal(line, tWrite, { dy: 0, dur: 0.1 });
    const tEnd = m.typewriter(tx, tWrite, { cps: 12 });
    penTo(x0 + tx.__fit.width + 14, y0 + 84, tWrite, tEnd - tWrite, "none");
  },
});
