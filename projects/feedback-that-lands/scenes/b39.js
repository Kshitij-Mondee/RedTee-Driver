// @design card_on_desk_filled_in_steps_continued: the pen moves to the next ruled line and writes its prompt
/* b39 - line two: what did they do or say. Holds the desk, the card and line 1 from b38; the pen travels down to
 * line 2 and writes "What did they do or say?" with its tip following the words, then the card holds while the
 * narration adds "something you could have seen".
 */
Loom.scene("b39", {
  build(ctx) {
    const { kit, m } = ctx;
    const meta = (name) => ({ kind: "travel", beat: ctx.beat.id, name, content: false });

    const HELD = ["desk", "window_light", "laptop", "mug", "notebook", "pcard", "pcard_frame", "pcard_rules", "num_1", "num_2", "num_3", "num_4", "header", "pen", "line_1"];
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

    // ---- line 2: the pen drops to the second rule in the pause before the question, then writes
    const x0 = CX + 134, y0 = CY + rowY[1];
    const tWrite = ctx.cue("what did they actually do");
    const tMove = ctx.start + 0.1;
    // the camera follows the writing down the card (Loom.cam.frame, chained from b38)
    Loom.cam.frame(desk, { x: CX, y: CY + rowY[0] - 8, w: 900, h: 617 }, ctx.start + 0.05, 1.0, { margin: 0 });
    penTo(x0, y0 + 84, tMove, Math.max(0.7, tWrite - tMove - 0.12));

    // @form written_line_on_rule: a prompt typed on a ruled line while a pen tip follows it
    const line = ctx.el("line_2", { x: x0 - 4, y: y0 + 16, w: 720, h: 70, kind: "text", exit: "wipe", parent: desk.inner });
    desk.inner.insertBefore(line.outer, pen.outer);
    const tx = kit.text(line.inner, "What did they do or say?", { role: "body", x: 0, y: 0, w: 720, h: 70, maxLines: 1, size: 36, color: "ink", valign: "middle" });
    m.reveal(line, tWrite, { dy: 0, dur: 0.1 });
    const tEnd = m.typewriter(tx, tWrite, { cps: 13 });
    penTo(x0 + tx.__fit.width + 14, y0 + 84, tWrite, tEnd - tWrite, "none");
  },
});
